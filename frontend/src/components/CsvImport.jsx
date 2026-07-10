import { useState } from "react";
import { api } from "../lib/api.js";

function ImportForm({ label, hint, endpoint, projectId, onImported }) {
  const [fileName, setFileName] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError(null);
    setImporting(true);
    try {
      const csv = await file.text();
      const data = await api.post(endpoint(projectId), { csv });
      setResult(data);
      onImported();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div style={{ marginBottom: "1.2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <label style={{ padding: "0.4rem 0.9rem", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }}>
          {importing ? "Importing…" : label}
          <input type="file" accept=".csv,text/csv" onChange={handleFile} disabled={importing} style={{ display: "none" }} />
        </label>
        {fileName && <span style={{ fontSize: "0.85rem", color: "#666" }}>{fileName}</span>}
      </div>
      <p style={{ fontSize: "0.8rem", color: "#888", margin: "0.3rem 0 0" }}>{hint}</p>
      {error && <p style={{ color: "crimson", fontSize: "0.85rem" }}>{error}</p>}
      {result && (
        <p style={{ fontSize: "0.85rem", color: result.errors.length ? "#9a6700" : "#1a7f37" }}>
          Imported {result.created} row{result.created === 1 ? "" : "s"}.
          {result.errors.length > 0 && ` ${result.errors.length} error(s): ${result.errors.map((e) => `row ${e.row}: ${e.error}`).join("; ")}`}
        </p>
      )}
    </div>
  );
}

export function CsvImport({ projectId, onImported }) {
  return (
    <div>
      <ImportForm
        label="Import nodes CSV"
        hint="Columns: type,nodeSubtype,title,description,externalId,extra — see docs/IMPORT.md"
        endpoint={(id) => `/projects/${id}/trace/import/nodes`}
        projectId={projectId}
        onImported={onImported}
      />
      <ImportForm
        label="Import links CSV"
        hint="Columns: fromType,fromExternalId,toType,toExternalId,linkType — import nodes first"
        endpoint={(id) => `/projects/${id}/trace/import/links`}
        projectId={projectId}
        onImported={onImported}
      />
    </div>
  );
}
