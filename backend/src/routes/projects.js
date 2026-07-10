import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const projectsRouter = Router();

// List projects for the caller's organization.
projectsRouter.get("/", async (req, res) => {
  const projects = await prisma.project.findMany({
    include: { compliancePacks: { include: { compliancePack: true } } },
  });
  res.json(projects);
});

// Create a new project.
projectsRouter.post("/", async (req, res) => {
  const { name, description, organizationId } = req.body;
  if (!name || !organizationId) {
    return res.status(400).json({ error: "name and organizationId are required" });
  }
  const project = await prisma.project.create({
    data: { name, description, organizationId },
  });
  res.status(201).json(project);
});

// Attach a compliance pack to a project (e.g. "iso13485", "do178c").
projectsRouter.post("/:projectId/compliance-packs", async (req, res) => {
  const { projectId } = req.params;
  const { standardId } = req.body;

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
});
