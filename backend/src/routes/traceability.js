import { Router } from "express";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { loadOrgProject } from "../lib/authz.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { NODE_MODEL_BY_TYPE } from "../lib/nodeModels.js";

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
traceabilityRouter.use(
  asyncHandler(async (req, res, next) => {
    const project = await loadOrgProject(req.params.projectId, req.user.organizationId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    next();
  })
);

traceabilityRouter.post(
  "/nodes/:nodeKind",
  requireRole("ADMIN", "ENGINEER", "QUALITY"),
  asyncHandler(async (req, res) => {
    const { projectId, nodeKind } = req.params;
    const modelKey = NODE_MODELS[nodeKind];
    if (!modelKey) {
      return res.status(400).json({ error: `Unknown node kind "${nodeKind}"` });
    }
    const node = await prisma[modelKey].create({
      data: { ...req.body, projectId },
    });
    res.status(201).json(node);
  })
);

// Create a trace link between any two nodes (generic edge). TraceLink has no
// DB-level foreign key on fromId/toId (a single column can't target more
// than one table), so we check both endpoints exist in this project here.
traceabilityRouter.post(
  "/links",
  requireRole("ADMIN", "ENGINEER", "QUALITY"),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { fromType, fromId, toType, toId, linkType } = req.body;

    if (!fromType || !fromId || !toType || !toId || !linkType) {
      return res.status(400).json({ error: "fromType, fromId, toType, toId, and linkType are required" });
    }

    const fromModelKey = NODE_MODEL_BY_TYPE[fromType];
    const toModelKey = NODE_MODEL_BY_TYPE[toType];
    if (!fromModelKey || !toModelKey) {
      return res.status(400).json({
        error: `fromType/toType must be one of: ${Object.keys(NODE_MODEL_BY_TYPE).join(", ")}`,
      });
    }

    const [fromNode, toNode] = await Promise.all([
      prisma[fromModelKey].findFirst({ where: { id: fromId, projectId } }),
      prisma[toModelKey].findFirst({ where: { id: toId, projectId } }),
    ]);
    if (!fromNode || !toNode) {
      return res.status(404).json({ error: "fromId or toId does not reference an existing node in this project" });
    }

    const link = await prisma.traceLink.create({
      data: { projectId, fromType, fromId, toType, toId, linkType },
    });
    res.status(201).json(link);
  })
);

// Bulk-import trace nodes from CSV. Expected columns:
//   type,nodeSubtype,title,description,externalId,extra
// - type: requirement | design | verification | risk
// - externalId (optional): an ID from the source system (DOORS export,
//   spreadsheet row key, etc.), used to resolve links in a subsequent
//   /import/links call without knowing our internal database IDs. Re-importing
//   the same externalId updates that row instead of duplicating it.
// - extra (optional): outcome for verification rows, severity for risk rows.
const EXTRA_FIELD_BY_KIND = { verification: "outcome", risk: "severity" };

traceabilityRouter.post(
  "/import/nodes",
  requireRole("ADMIN", "ENGINEER", "QUALITY"),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { csv } = req.body;
    if (!csv) {
      return res.status(400).json({ error: "csv is required" });
    }

    let rows;
    try {
      rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true });
    } catch (err) {
      return res.status(400).json({ error: `Could not parse CSV: ${err.message}` });
    }

    const results = { created: 0, errors: [] };
    for (const [i, row] of rows.entries()) {
      const rowNumber = i + 2; // header is row 1
      const modelKey = NODE_MODELS[row.type];
      if (!modelKey) {
        results.errors.push({
          row: rowNumber,
          error: `Unknown type "${row.type}" (expected requirement, design, verification, or risk)`,
        });
        continue;
      }
      if (!row.title || !row.nodeSubtype) {
        results.errors.push({ row: rowNumber, error: "title and nodeSubtype are required" });
        continue;
      }

      const data = {
        nodeSubtype: row.nodeSubtype,
        title: row.title,
        description: row.description || null,
        externalId: row.externalId || null,
      };
      const extraField = EXTRA_FIELD_BY_KIND[row.type];
      if (extraField && row.extra) data[extraField] = row.extra;

      try {
        if (row.externalId) {
          await prisma[modelKey].upsert({
            where: { projectId_externalId: { projectId, externalId: row.externalId } },
            update: data,
            create: { ...data, projectId },
          });
        } else {
          await prisma[modelKey].create({ data: { ...data, projectId } });
        }
        results.created += 1;
      } catch (err) {
        results.errors.push({ row: rowNumber, error: err.message });
      }
    }

    res.status(207).json(results);
  })
);

// Bulk-import trace links from CSV, resolving endpoints by externalId (set
// during /import/nodes) instead of internal database IDs. Expected columns:
//   fromType,fromExternalId,toType,toExternalId,linkType
traceabilityRouter.post(
  "/import/links",
  requireRole("ADMIN", "ENGINEER", "QUALITY"),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { csv } = req.body;
    if (!csv) {
      return res.status(400).json({ error: "csv is required" });
    }

    let rows;
    try {
      rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true });
    } catch (err) {
      return res.status(400).json({ error: `Could not parse CSV: ${err.message}` });
    }

    const results = { created: 0, errors: [] };
    for (const [i, row] of rows.entries()) {
      const rowNumber = i + 2;
      const { fromType, fromExternalId, toType, toExternalId, linkType } = row;
      const fromModelKey = NODE_MODEL_BY_TYPE[fromType];
      const toModelKey = NODE_MODEL_BY_TYPE[toType];
      if (!fromModelKey || !toModelKey) {
        results.errors.push({
          row: rowNumber,
          error: `fromType/toType must be one of: ${Object.keys(NODE_MODEL_BY_TYPE).join(", ")}`,
        });
        continue;
      }
      if (!fromExternalId || !toExternalId || !linkType) {
        results.errors.push({ row: rowNumber, error: "fromExternalId, toExternalId, and linkType are required" });
        continue;
      }

      const [fromNode, toNode] = await Promise.all([
        prisma[fromModelKey].findFirst({ where: { projectId, externalId: fromExternalId } }),
        prisma[toModelKey].findFirst({ where: { projectId, externalId: toExternalId } }),
      ]);
      if (!fromNode || !toNode) {
        results.errors.push({
          row: rowNumber,
          error: `Could not resolve fromExternalId "${fromExternalId}" or toExternalId "${toExternalId}" in this project (import nodes first)`,
        });
        continue;
      }

      try {
        await prisma.traceLink.create({
          data: { projectId, fromType, fromId: fromNode.id, toType, toId: toNode.id, linkType },
        });
        results.created += 1;
      } catch (err) {
        results.errors.push({ row: rowNumber, error: err.message });
      }
    }

    res.status(207).json(results);
  })
);

// Fetch the full trace graph for a project (nodes + edges). Read-only, so
// any authenticated org member (including VIEWER) can access it.
traceabilityRouter.get(
  "/graph",
  asyncHandler(async (req, res) => {
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
  })
);
