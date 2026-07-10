import { useState } from "react";
import { api } from "../lib/api.js";

const KIND_OPTIONS = [
  { value: "requirement", label: "Requirement" },
  { value: "design", label: "Design Element" },
  { value: "verification", label: "Verification Record" },
  { value: "risk", label: "Risk Control" },
];

const EXTRA_FIELD = {
  verification: { key: "outcome", label: "Outcome (pass / fail / pending)" },
  risk: { key: "severity", label: "Severity" },
};

export function NodeCreateForm({ projectId, onCreated }) {
  const [kind, setKind] = useState("requirement");
  const [nodeSubtype, setNodeSubtype] = useState("");
  const [title, setTitle] = useState("");
  const [extraValue, setExtraValue] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const extra = EXTRA_FIELD[kind];

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body = { nodeSubtype, title };
      if (extra && extraValue) body[extra.key] = extraValue;
      await api.post(`/projects/${projectId}/trace/nodes/${kind}`, body);
      setNodeSubtype("");
      setTitle("");
      setExtraValue("");
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
      <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555" }}>
        Type
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ padding: "0.4rem" }}>
          {KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555" }}>
        Subtype
        <input
          required
          placeholder="e.g. design_input"
          value={nodeSubtype}
          onChange={(e) => setNodeSubtype(e.target.value)}
          style={{ padding: "0.4rem" }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555", flex: 1 }}>
        Title
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: "0.4rem" }}
        />
      </label>
      {extra && (
        <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555" }}>
          {extra.label}
          <input value={extraValue} onChange={(e) => setExtraValue(e.target.value)} style={{ padding: "0.4rem" }} />
        </label>
      )}
      <button type="submit" disabled={submitting} style={{ padding: "0.45rem 1rem", cursor: "pointer" }}>
        {submitting ? "Adding…" : "Add node"}
      </button>
      {error && <p style={{ color: "crimson", width: "100%", margin: 0 }}>{error}</p>}
    </form>
  );
}
