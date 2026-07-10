import "dotenv/config";
import express from "express";
import cors from "cors";
import { Prisma } from "@prisma/client";
import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { traceabilityRouter } from "./routes/traceability.js";
import { startScheduler, computeAuditReadiness } from "./agent/scheduler.js";
import { requireAuth } from "./middleware/auth.js";
import { loadOrgProject } from "./lib/authz.js";
import { asyncHandler } from "./lib/asyncHandler.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/projects/:projectId/trace", traceabilityRouter);

// On-demand readiness score (in addition to the scheduled daily run).
app.get(
  "/api/projects/:projectId/readiness",
  requireAuth,
  asyncHandler(async (req, res) => {
    const project = await loadOrgProject(req.params.projectId, req.user.organizationId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    const result = await computeAuditReadiness(req.params.projectId);
    res.json(result);
  })
);

// Central error handler. Every async route is wrapped in asyncHandler so
// rejected promises land here instead of crashing the process — a single
// bad request (e.g. a link pointing at a nonexistent node) must not take
// down the API for every tenant.
app.use((err, req, res, next) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "A record with that unique value already exists" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
  startScheduler();
});
