import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { TraceGraph } from "../components/TraceGraph.jsx";
import { NodeCreateForm } from "../components/NodeCreateForm.jsx";
import { LinkCreateForm } from "../components/LinkCreateForm.jsx";
import { GapReport } from "../components/GapReport.jsx";
import { PackAttachment } from "../components/PackAttachment.jsx";
import { CsvImport } from "../components/CsvImport.jsx";

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [graph, setGraph] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshProject = useCallback(() => {
    api.get(`/projects/${projectId}`).then(setProject).catch((err) => setError(err.message));
  }, [projectId]);

  const refreshGraph = useCallback(() => {
    api.get(`/projects/${projectId}/trace/graph`).then(setGraph).catch((err) => setError(err.message));
  }, [projectId]);

  const refreshReadiness = useCallback(() => {
    setReadinessLoading(true);
    api
      .get(`/projects/${projectId}/readiness`)
      .then(setReadiness)
      .catch((err) => setError(err.message))
      .finally(() => setReadinessLoading(false));
  }, [projectId]);

  useEffect(() => {
    refreshProject();
    refreshGraph();
    refreshReadiness();
  }, [refreshProject, refreshGraph, refreshReadiness]);

  function refreshAll() {
    refreshProject();
    refreshGraph();
    refreshReadiness();
  }

  if (error) return <p style={{ color: "crimson" }}>{error}</p>;
  if (!project || !graph) return <p>Loading…</p>;

  return (
    <div>
      <p>
        <Link to="/">&larr; All projects</Link>
      </p>
      <h1 style={{ marginBottom: 0 }}>{project.name}</h1>
      {project.description && <p style={{ color: "#666" }}>{project.description}</p>}

      <section style={{ marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem" }}>Compliance packs</h2>
        <PackAttachment project={project} onAttached={refreshAll} />
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1rem" }}>Audit readiness</h2>
        <GapReport readiness={readiness} onRefresh={refreshReadiness} loading={readinessLoading} />
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1rem" }}>Trace graph</h2>
        <TraceGraph graph={graph} />
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1rem" }}>Add trace node</h2>
        <NodeCreateForm projectId={projectId} onCreated={() => { refreshGraph(); refreshReadiness(); }} />
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem" }}>Add trace link</h2>
        <LinkCreateForm projectId={projectId} graph={graph} onCreated={() => { refreshGraph(); refreshReadiness(); }} />
      </section>

      <section style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1rem" }}>Bulk import from CSV</h2>
        <CsvImport projectId={projectId} onImported={() => { refreshGraph(); refreshReadiness(); }} />
      </section>
    </div>
  );
}
