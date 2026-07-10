import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const traceabilityRouter = Router();

// Generic node creation across the four core node tables.
const NODE_MODELS = {
  requirement: "requirementNode",
  design: "designElement",
  verification: "verificationRecord",
  risk: "riskControl",
};

traceabilityRouter.post("/:projectId/nodes/:nodeKind", async (req, res) => {
  const { projectId, nodeKind } = req.params;
  const modelKey = NODE_MODELS[nodeKind];
  if (!modelKey) {
    return res.status(400).json({ error: `Unknown node kind "${nodeKind}"` });
  }
  const node = await prisma[modelKey].create({
    data: { ...req.body, projectId },
  });
  res.status(201).json(node);
});

// Create a trace link between any two nodes (generic edge).
traceabilityRouter.post("/:projectId/links", async (req, res) => {
  const { projectId } = req.params;
  const { fromType, fromId, toType, toId, linkType } = req.body;
  const link = await prisma.traceLink.create({
    data: { projectId, fromType, fromId, toType, toId, linkType },
  });
  res.status(201).json(link);
});

// Fetch the full trace graph for a project (nodes + edges).
traceabilityRouter.get("/:projectId/graph", async (req, res) => {
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
