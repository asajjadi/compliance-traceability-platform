function scoreColor(score) {
  if (score === null) return "#888";
  if (score >= 90) return "#1a7f37";
  if (score >= 60) return "#9a6700";
  return "#cf222e";
}

export function GapReport({ readiness, onRefresh, loading }) {
  if (!readiness) return null;
  const { score, gaps, message } = readiness;

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 6, padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "0.85rem", color: "#666" }}>Audit readiness score</span>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: scoreColor(score) }}>
            {score === null ? "—" : `${score}%`}
          </div>
        </div>
        <button onClick={onRefresh} disabled={loading} style={{ padding: "0.4rem 0.9rem", cursor: "pointer" }}>
          {loading ? "Checking…" : "Recompute"}
        </button>
      </div>
      {message && <p style={{ color: "#888" }}>{message}</p>}
      {gaps?.length > 0 && (
        <ul style={{ marginTop: "1rem", paddingLeft: "1.2rem" }}>
          {gaps.map((g, i) => (
            <li key={i} style={{ marginBottom: "0.4rem", fontSize: "0.9rem" }}>
              <strong>{g.ruleName}</strong>: {g.message}
            </li>
          ))}
        </ul>
      )}
      {gaps?.length === 0 && score !== null && <p style={{ color: "#1a7f37" }}>No gaps found.</p>}
    </div>
  );
}
