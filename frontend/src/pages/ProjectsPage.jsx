import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

export function ProjectsPage() {
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  function refresh() {
    api
      .get("/projects")
      .then(setProjects)
      .catch((err) => setError(err.message));
  }

  useEffect(refresh, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await api.post("/projects", { name, description: description || undefined });
      setName("");
      setDescription("");
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <h1>Projects</h1>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          placeholder="New project name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: "0.4rem 0.6rem", flex: 1 }}
        />
        <input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ padding: "0.4rem 0.6rem", flex: 2 }}
        />
        <button type="submit" disabled={creating} style={{ padding: "0.4rem 1rem", cursor: "pointer" }}>
          {creating ? "Creating…" : "Create project"}
        </button>
      </form>

      {projects === null && !error && <p>Loading…</p>}
      {projects?.length === 0 && <p>No projects yet — create one above.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {projects?.map((p) => (
          <li
            key={p.id}
            style={{ padding: "0.75rem 0", borderBottom: "1px solid #eee" }}
          >
            <Link to={`/projects/${p.id}`} style={{ fontWeight: 600, color: "#1a1a1a" }}>
              {p.name}
            </Link>
            {p.description && <span style={{ color: "#666" }}> — {p.description}</span>}
            <div style={{ fontSize: "0.85rem", color: "#888", marginTop: "0.2rem" }}>
              {p.compliancePacks?.length > 0
                ? `Packs: ${p.compliancePacks.map((cp) => cp.compliancePack.name).join(", ")}`
                : "No compliance packs attached"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
