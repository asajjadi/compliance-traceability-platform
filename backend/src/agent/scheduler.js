// Scheduled AI analysis agent.
//
// IMPORTANT: this file must stay sector-agnostic. All standard-specific
// behavior (what counts as a "gap") lives in CompliancePack.GapRule rows,
// not in branches here. See docs/ARCHITECTURE.md.

import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { NODE_MODEL_BY_TYPE as NODE_MODEL_MAP } from "../lib/nodeModels.js";

/**
 * Evaluate a single declarative GapRule against a project's trace graph.
 * Rule shape (stored as JSON on GapRule.ruleDefinition), e.g.:
 *   { "requires": "RiskControl", "mustLinkTo": "VerificationRecord", "linkType": "mitigates" }
 * Meaning: every RiskControl node must have >=1 TraceLink of type "mitigates"
 * pointing to a VerificationRecord, or it's flagged as a gap.
 *
 * requiresSubtype / mustLinkToSubtype are optional nodeSubtype filters, e.g.
 * to require every "system_requirement" RequirementNode link to a
 * "software_requirement" RequirementNode specifically (both share the same
 * model but are distinct subtypes in the trace chain).
 */
async function evaluateGapRule(projectId, rule) {
  const { requires, requiresSubtype, mustLinkTo, mustLinkToSubtype, linkType } = rule.ruleDefinition;
  const modelKey = NODE_MODEL_MAP[requires];
  if (!modelKey) return [];

  const nodes = await prisma[modelKey].findMany({
    where: { projectId, ...(requiresSubtype ? { nodeSubtype: requiresSubtype } : {}) },
  });
  const links = await prisma.traceLink.findMany({
    where: { projectId, fromType: requires, toType: mustLinkTo, linkType },
  });

  let linkedFromIds;
  if (mustLinkToSubtype) {
    const targetModelKey = NODE_MODEL_MAP[mustLinkTo];
    const targetIds = links.map((l) => l.toId);
    const validTargets = targetModelKey
      ? await prisma[targetModelKey].findMany({
          where: { id: { in: targetIds }, nodeSubtype: mustLinkToSubtype },
          select: { id: true },
        })
      : [];
    const validTargetIds = new Set(validTargets.map((t) => t.id));
    linkedFromIds = new Set(links.filter((l) => validTargetIds.has(l.toId)).map((l) => l.fromId));
  } else {
    linkedFromIds = new Set(links.map((l) => l.fromId));
  }

  return nodes
    .filter((n) => !linkedFromIds.has(n.id))
    .map((n) => ({
      ruleName: rule.name,
      nodeType: requires,
      nodeId: n.id,
      nodeTitle: n.title,
      message: `${requires} "${n.title}" has no linked ${mustLinkToSubtype || mustLinkTo} (${linkType})`,
    }));
}

/**
 * Compute a simple audit-readiness score for a project: percentage of gap
 * checks (across all attached compliance packs) that currently pass.
 */
export async function computeAuditReadiness(projectId) {
  const attachedPacks = await prisma.projectCompliancePack.findMany({
    where: { projectId },
    include: { compliancePack: { include: { gapRules: true } } },
  });

  const allRules = attachedPacks.flatMap((p) => p.compliancePack.gapRules);
  if (allRules.length === 0) {
    return { score: null, gaps: [], message: "No compliance packs attached yet." };
  }

  const gapResults = await Promise.all(
    allRules.map((rule) => evaluateGapRule(projectId, rule))
  );
  const gaps = gapResults.flat();

  // Score = fraction of rule evaluations with zero flagged nodes.
  const rulesWithGaps = gapResults.filter((g) => g.length > 0).length;
  const score = Math.round(((allRules.length - rulesWithGaps) / allRules.length) * 100);

  return { score, gaps };
}

async function runScheduledAnalysis() {
  const projects = await prisma.project.findMany({ select: { id: true, name: true } });

  for (const project of projects) {
    const { score, gaps, message } = await computeAuditReadiness(project.id);

    await prisma.auditEvent.create({
      data: {
        projectId: project.id,
        actor: "ai-agent",
        action: "scheduled_gap_analysis",
        entity: "Project",
        entityId: project.id,
        detail: { score, gapCount: gaps.length, gaps, message },
      },
    });

    console.log(
      `[agent] ${project.name}: readiness=${score ?? "n/a"} gaps=${gaps.length}`
    );
  }
}

/**
 * Start the scheduler. Runs once daily by default; adjust cron string as needed.
 */
export function startScheduler() {
  cron.schedule("0 6 * * *", () => {
    runScheduledAnalysis().catch((err) =>
      console.error("[agent] scheduled analysis failed:", err)
    );
  });
  console.log("[agent] scheduler started (daily @ 06:00)");
}

// Allow running a one-off analysis manually, e.g. via `node src/agent/scheduler.js --once`
if (process.argv.includes("--once")) {
  runScheduledAnalysis().then(() => process.exit(0));
}
