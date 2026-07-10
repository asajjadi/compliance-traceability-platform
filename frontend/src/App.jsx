import { useEffect, useState } from "react";

export default function App() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <h1>Compliance Traceability Platform</h1>
      <p style={{ color: "#555" }}>
        Core engine scaffold. Sector-specific behavior comes from compliance
        packs attached per project — see <code>docs/ARCHITECTURE.md</code>.
      </p>

      {error && <p style={{ color: "crimson" }}>API error: {error} (is the backend running?)</p>}

      <h2>Projects</h2>
      {projects.length === 0 && !error && <p>No projects yet.</p>}
      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <strong>{p.name}</strong>
            {p.compliancePacks?.length > 0 && (
              <>
                {" — packs: "}
                {p.compliancePacks.map((cp) => cp.compliancePack.name).join(", ")}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
