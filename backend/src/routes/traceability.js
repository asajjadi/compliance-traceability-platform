import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { loadOrgProject } from "../lib/authz.js";

// mergeParams so this router can read :projectId from its mount prefix in
// index.js instead of requiring callers to repeat it in every sub-path.
export const traceabilityRouter = Router({ mergeParams: true });

// Generic node creation across the four core node tables.
const NODE_MODELS = {
  requirement: "requirementNode",
  design: "designElement",
  verification: "verificationRecord",
  risk: "riskControl",
};

traceabilityRouter.use(requireAuth);

// Every route below is nested under :projectId — verify it belongs to the
// caller's organization before doing anything else.
traceabilityRouter.use(async (req, res, next) => {
  const project = await loadOrgProject(req.params.projectId, req.user.organizationId);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  next();
});

traceabilityRouter.post(
  "/nodes/:nodeKind",
  requireRole("ADMIN", "ENGINEER", "QUALITY"),
  async (req, res) => {
    const { projectId, nodeKind } = req.params;
    const modelKey = NODE_MODELS[nodeKind];
    if (!modelKey) {
      return res.status(400).json({ error: `Unknown node kind "${nodeKind}"` });
    }
    const node = await prisma[modelKey].create({
      data: { ...req.body, projectId },
    });
    res.status(201).json(node);
  }
);

// Create a trace link between any two nodes (generic edge).
traceabilityRouter.post(
  "/links",
  requireRole("ADMIN", "ENGINEER", "QUALITY"),
  async (req, res) => {
    const { projectId } = req.params;
    const { fromType, fromId, toType, toId, linkType } = req.body;
    const link = await prisma.traceLink.create({
      data: { projectId, fromType, fromId, toType, toId, linkType },
    });
    res.status(201).json(link);
  }
);

// Fetch the full trace graph for a project (nodes + edges). Read-only, so
// any authenticated org member (including VIEWER) can access it.
traceabilityRouter.get("/graph", async (req, res) => {
  const { projectId } = req.params;
  const [requirements, designElements, verifications, riskControls, links] =
    await Promise.all([
      prisma.requirementNode.findMany({ where: { projectId } }),
      prisma.designElement.findMany({ where: { projectId } }),
      prisma.verificationRecord.findMany({ where: { projectId } }),
      prisma.riskControl.findMany({ where: { projectId } }),
      prisma.traceLink.findMany({ where: { projectId } }),
    ]);
  res.json({ requirements, designElements, verifications, riskControls, links });
});
