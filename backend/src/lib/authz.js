import { prisma } from "./prisma.js";

// Loads a project scoped to an organization. Returns null both when the
// project doesn't exist and when it belongs to a different org, so callers
// can 404 without leaking which case it was.
export async function loadOrgProject(projectId, organizationId) {
  return prisma.project.findFirst({ where: { id: projectId, organizationId } });
}
