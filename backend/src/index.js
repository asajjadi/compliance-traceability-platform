import "dotenv/config";
import express from "express";
import cors from "cors";
import { projectsRouter } from "./routes/projects.js";
import { traceabilityRouter } from "./routes/traceability.js";
import { startScheduler, computeAuditReadiness } from "./agent/scheduler.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/projects", projectsRouter);
app.use("/api/projects/:projectId/trace", (req, res, next) => {
  // merge :projectId into traceabilityRouter's expected params shape
  req.params.projectId = req.params.projectId;
  next();
}, traceabilityRouter);

// On-demand readiness score (in addition to the scheduled daily run).
app.get("/api/projects/:projectId/readiness", async (req, res) => {
  const result = await computeAuditReadiness(req.params.projectId);
  res.json(result);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
  startScheduler();
});
