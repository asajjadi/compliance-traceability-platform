const TYPE_ORDER = ["RequirementNode", "DesignElement", "RiskControl", "VerificationRecord"];
const TYPE_LABELS = {
  RequirementNode: "Requirements",
  DesignElement: "Design Elements",
  RiskControl: "Risk Controls",
  VerificationRecord: "Verification Records",
};
const TYPE_KEY = {
  RequirementNode: "requirements",
  DesignElement: "designElements",
  RiskControl: "riskControls",
  VerificationRecord: "verifications",
};

const COLUMN_WIDTH = 240;
const BOX_WIDTH = 200;
const BOX_HEIGHT = 44;
const ROW_GAP = 14;
const TOP_MARGIN = 50;
const LEFT_MARGIN = 20;

function truncate(str, n) {
  return str.length > n ? `${str.slice(0, n - 1)}…` : str;
}

export function TraceGraph({ graph }) {
  const columns = TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    nodes: graph[TYPE_KEY[type]] || [],
  }));

  const positions = new Map();
  columns.forEach((col, colIndex) => {
    col.nodes.forEach((node, rowIndex) => {
      positions.set(node.id, {
        colIndex,
        x: LEFT_MARGIN + colIndex * COLUMN_WIDTH,
        y: TOP_MARGIN + rowIndex * (BOX_HEIGHT + ROW_GAP),
      });
    });
  });

  const maxRows = Math.max(1, ...columns.map((c) => c.nodes.length));
  const width = LEFT_MARGIN * 2 + columns.length * COLUMN_WIDTH;
  const height = TOP_MARGIN + maxRows * (BOX_HEIGHT + ROW_GAP) + 30;

  const edges = (graph.links || [])
    .map((link) => {
      const from = positions.get(link.fromId);
      const to = positions.get(link.toId);
      return from && to ? { link, from, to } : null;
    })
    .filter(Boolean);

  if (columns.every((c) => c.nodes.length === 0)) {
    return <p style={{ color: "#888" }}>No trace nodes yet — add some below.</p>;
  }

  return (
    <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 6 }}>
      <svg width={width} height={height} style={{ display: "block" }}>
        <defs>
          <marker id="trace-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#999" />
          </marker>
        </defs>

        {columns.map((col, i) => (
          <text key={col.type} x={LEFT_MARGIN + i * COLUMN_WIDTH} y={24} fontSize="13" fontWeight="600" fill="#333">
            {col.label}
          </text>
        ))}

        {edges.map(({ link, from, to }) => {
          const sameColumn = from.colIndex === to.colIndex;
          const x1 = from.x + BOX_WIDTH;
          const y1 = from.y + BOX_HEIGHT / 2;
          const x2 = sameColumn ? to.x + BOX_WIDTH : to.x;
          const y2 = to.y + BOX_HEIGHT / 2;
          const loopOut = sameColumn ? 70 : 0;
          const d = `M ${x1},${y1} C ${x1 + 40 + loopOut},${y1} ${x2 + 40 + loopOut},${y2} ${x2},${y2}`;
          return (
            <path key={link.id} d={d} fill="none" stroke="#999" strokeWidth="1.5" markerEnd="url(#trace-arrow)">
              <title>{link.linkType}</title>
            </path>
          );
        })}

        {columns.flatMap((col) =>
          col.nodes.map((node) => {
            const pos = positions.get(node.id);
            return (
              <g key={node.id}>
                <rect x={pos.x} y={pos.y} width={BOX_WIDTH} height={BOX_HEIGHT} rx={6} fill="#fafafa" stroke="#ccc" />
                <text x={pos.x + 10} y={pos.y + 18} fontSize="12" fill="#333">
                  {truncate(node.title, 26)}
                </text>
                <text x={pos.x + 10} y={pos.y + 34} fontSize="10" fill="#999">
                  {node.nodeSubtype}
                </text>
                <title>{node.title}</title>
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}
