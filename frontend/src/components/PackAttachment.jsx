import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export function PackAttachment({ project, onAttached }) {
  const [availablePacks, setAvailablePacks] = useState([]);
  const [standardId, setStandardId] = useState("");
  const [error, setError] = useState(null);
  const [attaching, setAttaching] = useState(false);

  useEffect(() => {
    api.get("/compliance-packs").then(setAvailablePacks).catch((err) => setError(err.message));
  }, []);

  const attachedIds = new Set(project.compliancePacks.map((cp) => cp.compliancePack.standardId));
  const options = availablePacks.filter((p) => !attachedIds.has(p.standardId));

  async function handleAttach(e) {
    e.preventDefault();
    if (!standardId) return;
    setAttaching(true);
    setError(null);
    try {
      await api.post(`/projects/${project.id}/compliance-packs`, { standardId });
      setStandardId("");
      onAttached();
    } catch (err) {
      setError(err.message);
    } finally {
      setAttaching(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "0.5rem" }}>
        {project.compliancePacks.length === 0 ? (
          <span style={{ color: "#888" }}>No compliance packs attached.</span>
        ) : (
          project.compliancePacks.map((cp) => (
            <span
              key={cp.id}
              style={{
                display: "inline-block",
                background: "#f0f0f0",
                borderRadius: 12,
                padding: "0.2rem 0.7rem",
                marginRight: "0.4rem",
                fontSize: "0.85rem",
              }}
            >
              {cp.compliancePack.name}
            </span>
          ))
        )}
      </div>
      {options.length > 0 && (
        <form onSubmit={handleAttach} style={{ display: "flex", gap: "0.5rem" }}>
          <select value={standardId} onChange={(e) => setStandardId(e.target.value)} style={{ padding: "0.4rem" }}>
            <option value="">Attach a pack…</option>
            {options.map((p) => (
              <option key={p.standardId} value={p.standardId}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={!standardId || attaching} style={{ padding: "0.4rem 1rem", cursor: "pointer" }}>
            {attaching ? "Attaching…" : "Attach"}
          </button>
        </form>
      )}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </div>
  );
}
