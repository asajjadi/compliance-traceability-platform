import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { traceabilityRouter } from "./routes/traceability.js";
import { startScheduler, computeAuditReadiness } from "./agent/scheduler.js";
import { requireAuth } from "./middleware/auth.js";
import { loadOrgProject } from "./lib/authz.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/projects/:projectId/trace", traceabilityRouter);

// On-demand readiness score (in addition to the scheduled daily run).
app.get("/api/projects/:projectId/readiness", requireAuth, async (req, res) => {
  const project = await loadOrgProject(req.params.projectId, req.user.organizationId);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  const result = await computeAuditReadiness(req.params.projectId);
  res.json(result);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
  startScheduler();
});
