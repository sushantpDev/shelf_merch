import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import type { ContactImportStatus } from "@/services/api-bridge";
import { useImportContacts } from "./hooks";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT =
  ".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const TEMPLATE =
  "First Name,Last Name,Email,Phone,Role,Department,Employee Code,Address,City,State,PIN Code,Country\n";

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "shelf-merch-contacts-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STAGE_LABEL: Record<ContactImportStatus["status"], string> = {
  queued: "Queued for processing…",
  processing: "Validating and importing contacts…",
  done: "Import complete",
  failed: "Import failed",
};

export function ImportContactsPanel({ onDone }: { onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ContactImportStatus | null>(null);
  const importContacts = useImportContacts();
  const busy = importContacts.isPending;
  const finished = status?.status === "done" || status?.status === "failed";

  function pickFile(f: File | null) {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error("File must be 5 MB or smaller");
      return;
    }
    setFile(f);
    setStatus(null);
  }

  async function runImport() {
    if (!file) return;
    try {
      const result = await importContacts.mutateAsync({ file, onStatus: setStatus });
      setStatus(result);
      if (result.status === "done") {
        toast.success(`Imported ${result.validCount} contact${result.validCount === 1 ? "" : "s"}`);
      } else {
        toast.error("Import failed — check the errors below");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    }
  }

  return (
    <div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
        Download the template, fill in employee details, and upload a CSV or Excel file.{" "}
        <button type="button" className="lnk" onClick={downloadTemplate}>
          Download template
        </button>
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        style={{ display: "none" }}
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />

      {!file ? (
        <button
          type="button"
          className="ac-import-zone"
          onClick={() => inputRef.current?.click()}
          style={{
            width: "100%",
            border: "1.5px dashed var(--line)",
            borderRadius: "var(--r-sm)",
            padding: 22,
            textAlign: "center",
            color: "var(--ink-2)",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          <Upload size={20} aria-hidden="true" />
          <div style={{ fontWeight: 600, fontSize: 13 }}>Drag and drop file</div>
          <div className="mut3" style={{ fontSize: 11, margin: "6px 0" }}>
            CSV, XLSX, or XLS · max 5 MB
          </div>
          <span className="btn btn-soft btn-sm">Browse files</span>
        </button>
      ) : (
        <div className="ac-import-file-card">
          <div
            className="row"
            style={{ alignItems: "center", justifyContent: "space-between", gap: 10 }}
          >
            <div style={{ minWidth: 0, textAlign: "left" }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {file.name}
              </div>
              <div className="mut3" style={{ fontSize: 11 }}>
                {fmtSize(file.size)}
              </div>
            </div>
            {!busy && (
              <button
                type="button"
                className="xbtn"
                aria-label="Remove file"
                onClick={() => {
                  setFile(null);
                  setStatus(null);
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {status && (
        <div
          className="ac-import-status"
          style={{ marginTop: 12 }}
          role="status"
          aria-live="polite"
        >
          <div style={{ fontWeight: 600 }}>{STAGE_LABEL[status.status]}</div>
          {status.status === "done" && (
            <div className="mut3" style={{ fontSize: 12, marginTop: 4 }}>
              {status.validCount} of {status.totalRows} rows imported
              {status.errorCount > 0 ? ` · ${status.errorCount} skipped` : ""}
            </div>
          )}
          {status.errors.length > 0 && (
            <div
              style={{
                marginTop: 8,
                maxHeight: 120,
                overflow: "auto",
                fontSize: 12,
                color: "var(--ink-2)",
              }}
            >
              {status.errors.slice(0, 5).map((e, i) => (
                <div key={i}>
                  Row {e.row}: {e.message}
                </div>
              ))}
              {status.errors.length > 5 && <div>…and {status.errors.length - 5} more</div>}
            </div>
          )}
        </div>
      )}

      <div className="row" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-ghost btn-block" onClick={onDone} disabled={busy}>
          {finished ? "Close" : "Cancel"}
        </button>
        {!finished && (
          <button
            type="button"
            className="btn btn-brand btn-block"
            onClick={runImport}
            disabled={!file || busy}
          >
            {busy ? "Importing…" : "Import contacts"}
          </button>
        )}
      </div>
    </div>
  );
}
