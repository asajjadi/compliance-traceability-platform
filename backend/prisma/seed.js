// Seeds two starter compliance packs to prove out the plug-in architecture:
// one medtech (ISO 13485 / QMSR-flavored), one aerospace (DO-178C-flavored).
//
// GapRule sets below encode the real traceability chains for each standard
// (see docs/STRATEGY.md "Regulatory context" and docs/ARCHITECTURE.md):
//   - ISO 13485 / ISO 14971: design input -> design output -> verification,
//     and hazard -> mitigation -> verification.
//   - DO-178C / ARP4754A: system requirement -> software requirement ->
//     code module -> verification, and failure condition -> derived
//     system requirement.
//
// Safe to re-run: each pack's gapRules/terminologyMaps are replaced on every
// run rather than left stale after the first insert.

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function seedPack({ standardId, name, description, terminologyMaps, gapRules }) {
  const pack = await prisma.compliancePack.upsert({
    where: { standardId },
    update: { name, description },
    create: { standardId, name, description },
  });

  await prisma.terminologyMap.deleteMany({ where: { compliancePackId: pack.id } });
  await prisma.terminologyMap.createMany({
    data: terminologyMaps.map((t) => ({ ...t, compliancePackId: pack.id })),
  });

  await prisma.gapRule.deleteMany({ where: { compliancePackId: pack.id } });
  await prisma.gapRule.createMany({
    data: gapRules.map((r) => ({ ...r, compliancePackId: pack.id })),
  });

  return pack;
}

async function main() {
  const medtech = await seedPack({
    standardId: "iso13485",
    name: "ISO 13485 / QMSR (Medtech)",
    description:
      "Design and development file (DDF) traceability aligned to FDA QMSR and ISO 13485:2016.",
    terminologyMaps: [
      { nodeSubtype: "design_input", label: "Design Input" },
      { nodeSubtype: "design_output", label: "Design Output" },
      { nodeSubtype: "hazard", label: "Hazard (ISO 14971)" },
      { nodeSubtype: "mitigation", label: "Risk Mitigation" },
    ],
    gapRules: [
      {
        name: "risk_control_needs_verification",
        description:
          "Every identified hazard must be directly linked to at least one verification record.",
        ruleDefinition: {
          requires: "RiskControl",
          requiresSubtype: "hazard",
          mustLinkTo: "VerificationRecord",
          linkType: "mitigates",
        },
      },
      {
        name: "design_input_needs_design_output",
        description:
          "Every design input must be linked to at least one design output that implements it.",
        ruleDefinition: {
          requires: "RequirementNode",
          requiresSubtype: "design_input",
          mustLinkTo: "DesignElement",
          mustLinkToSubtype: "design_output",
          linkType: "implements",
        },
      },
      {
        name: "design_output_needs_verification",
        description:
          "Every design output must be linked to at least one verification record.",
        ruleDefinition: {
          requires: "DesignElement",
          requiresSubtype: "design_output",
          mustLinkTo: "VerificationRecord",
          linkType: "verifies",
        },
      },
      {
        name: "hazard_needs_mitigation",
        description:
          "Every identified hazard must be linked to at least one risk mitigation (ISO 14971 risk control).",
        ruleDefinition: {
          requires: "RiskControl",
          requiresSubtype: "hazard",
          mustLinkTo: "RiskControl",
          mustLinkToSubtype: "mitigation",
          linkType: "mitigated_by",
        },
      },
      {
        name: "mitigation_needs_verification",
        description:
          "Every risk mitigation must be linked to at least one verification record confirming its effectiveness.",
        ruleDefinition: {
          requires: "RiskControl",
          requiresSubtype: "mitigation",
          mustLinkTo: "VerificationRecord",
          linkType: "verifies",
        },
      },
    ],
  });

  const aerospace = await seedPack({
    standardId: "do178c",
    name: "DO-178C (Airborne Software)",
    description:
      "Software requirements traceability aligned to DO-178C objectives, fed by ARP4754A system-level requirements.",
    terminologyMaps: [
      { nodeSubtype: "system_requirement", label: "System Requirement (ARP4754A)" },
      { nodeSubtype: "software_requirement", label: "Software Requirement (DO-178C)" },
      { nodeSubtype: "code_module", label: "Source Code Module (DO-178C)" },
      { nodeSubtype: "hazard", label: "Failure Condition" },
    ],
    gapRules: [
      {
        name: "requirement_needs_verification",
        description:
          "Every software requirement must be linked to at least one verification record.",
        ruleDefinition: {
          requires: "RequirementNode",
          requiresSubtype: "software_requirement",
          mustLinkTo: "VerificationRecord",
          linkType: "verifies",
        },
      },
      {
        name: "system_requirement_needs_software_requirement",
        description:
          "Every system requirement must be linked to at least one derived software requirement (ARP4754A to DO-178C handoff).",
        ruleDefinition: {
          requires: "RequirementNode",
          requiresSubtype: "system_requirement",
          mustLinkTo: "RequirementNode",
          mustLinkToSubtype: "software_requirement",
          linkType: "derives_to",
        },
      },
      {
        name: "software_requirement_needs_code_module",
        description:
          "Every software requirement must be linked to at least one implementing code module.",
        ruleDefinition: {
          requires: "RequirementNode",
          requiresSubtype: "software_requirement",
          mustLinkTo: "DesignElement",
          mustLinkToSubtype: "code_module",
          linkType: "implements",
        },
      },
      {
        name: "code_module_needs_verification",
        description:
          "Every code module must be linked to at least one verification record (unit/integration test).",
        ruleDefinition: {
          requires: "DesignElement",
          requiresSubtype: "code_module",
          mustLinkTo: "VerificationRecord",
          linkType: "verifies",
        },
      },
      {
        name: "failure_condition_needs_derived_requirement",
        description:
          "Every failure condition must be linked to at least one derived system requirement that mitigates it.",
        ruleDefinition: {
          requires: "RiskControl",
          requiresSubtype: "hazard",
          mustLinkTo: "RequirementNode",
          mustLinkToSubtype: "system_requirement",
          linkType: "mitigates",
        },
      },
    ],
  });

  console.log("Seeded compliance packs:", medtech.standardId, aerospace.standardId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
