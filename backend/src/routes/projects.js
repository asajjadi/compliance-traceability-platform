import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { loadOrgProject } from "../lib/authz.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

// List projects for the caller's organization.
projectsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const projects = await prisma.project.findMany({
      where: { organizationId: req.user.organizationId },
      include: { compliancePacks: { include: { compliancePack: true } } },
    });
    res.json(projects);
  })
);

// Create a new project, scoped to the caller's organization.
projectsRouter.post(
  "/",
  requireRole("ADMIN", "ENGINEER"),
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    const project = await prisma.project.create({
      data: { name, description, organizationId: req.user.organizationId },
    });
    res.status(201).json(project);
  })
);

// Attach a compliance pack to a project (e.g. "iso13485", "do178c").
projectsRouter.post(
  "/:projectId/compliance-packs",
  requireRole("ADMIN", "ENGINEER"),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { standardId } = req.body;

    const project = await loadOrgProject(projectId, req.user.organizationId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const pack = await prisma.compliancePack.findUnique({ where: { standardId } });
    if (!pack) {
      return res.status(404).json({ error: `No compliance pack found for standardId "${standardId}"` });
    }

    const attachment = await prisma.projectCompliancePack.upsert({
      where: { projectId_compliancePackId: { projectId, compliancePackId: pack.id } },
      update: {},
      create: { projectId, compliancePackId: pack.id },
    });
    res.status(201).json(attachment);
  })
);
