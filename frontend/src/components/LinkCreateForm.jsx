import { useState } from "react";
import { api } from "../lib/api.js";

const NODE_TYPES = [
  { value: "RequirementNode", label: "Requirement", key: "requirements" },
  { value: "DesignElement", label: "Design Element", key: "designElements" },
  { value: "VerificationRecord", label: "Verification Record", key: "verifications" },
  { value: "RiskControl", label: "Risk Control", key: "riskControls" },
];

function NodeSelect({ type, graph, value, onChange }) {
  const meta = NODE_TYPES.find((t) => t.value === type);
  const nodes = graph[meta.key] || [];
  return (
    <select required value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: "0.4rem" }}>
      <option value="">Select node…</option>
      {nodes.map((n) => (
        <option key={n.id} value={n.id}>
          {n.title}
        </option>
      ))}
    </select>
  );
}

export function LinkCreateForm({ projectId, graph, onCreated }) {
  const [fromType, setFromType] = useState("RequirementNode");
  const [fromId, setFromId] = useState("");
  const [toType, setToType] = useState("DesignElement");
  const [toId, setToId] = useState("");
  const [linkType, setLinkType] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post(`/projects/${projectId}/trace/links`, { fromType, fromId, toType, toId, linkType });
      setFromId("");
      setToId("");
      setLinkType("");
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
        From type
        <select
          value={fromType}
          onChange={(e) => {
            setFromType(e.target.value);
            setFromId("");
          }}
          style={{ padding: "0.4rem" }}
        >
          {NODE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555" }}>
        From node
        <NodeSelect type={fromType} graph={graph} value={fromId} onChange={setFromId} />
      </label>
      <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555" }}>
        Link type
        <input
          required
          placeholder="e.g. verifies"
          value={linkType}
          onChange={(e) => setLinkType(e.target.value)}
          style={{ padding: "0.4rem", width: 110 }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555" }}>
        To type
        <select
          value={toType}
          onChange={(e) => {
            setToType(e.target.value);
            setToId("");
          }}
          style={{ padding: "0.4rem" }}
        >
          {NODE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555" }}>
        To node
        <NodeSelect type={toType} graph={graph} value={toId} onChange={setToId} />
      </label>
      <button type="submit" disabled={submitting} style={{ padding: "0.45rem 1rem", cursor: "pointer" }}>
        {submitting ? "Linking…" : "Add link"}
      </button>
      {error && <p style={{ color: "crimson", width: "100%", margin: 0 }}>{error}</p>}
    </form>
  );
}
