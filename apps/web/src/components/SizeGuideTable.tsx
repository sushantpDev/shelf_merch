/**
 * SizeGuideTable
 *
 * Parses a raw multiline sizeGuide string into a proper HTML table.
 * Supports any number of columns — apparel, electronics, drinkware, etc.
 *
 * Parsing rules:
 *   - Blank lines are ignored.
 *   - First non-empty line → header row (split on " : " or ":").
 *   - Remaining non-empty lines → data rows, split at most N-1 times on ":"
 *     so values that themselves contain colons land in the last column.
 *   - Falls back to plain pre-formatted text if parsing yields 0 rows.
 */

type ParsedTable = {
  headers: string[];
  rows: string[][];
};

function parseSizeGuide(raw: string): ParsedTable | null {
  try {
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return null;

    // ── Header ──────────────────────────────────────────────────────────────
    // Accept both " : " (with spaces) and plain ":" as separator.
    const headerLine = lines[0];
    const headers = headerLine.split(":").map((h) => h.trim()).filter(Boolean);

    if (headers.length === 0) return null;

    const colCount = headers.length;

    // ── Data rows ───────────────────────────────────────────────────────────
    const rows: string[][] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cells: string[] = [];

      if (colCount === 1) {
        cells.push(line);
      } else {
        // Split at most colCount-1 times so the final column absorbs colons.
        let remaining = line;
        for (let col = 0; col < colCount - 1; col++) {
          const idx = remaining.indexOf(":");
          if (idx === -1) {
            cells.push(remaining.trim());
            remaining = "";
            break;
          }
          cells.push(remaining.slice(0, idx).trim());
          remaining = remaining.slice(idx + 1);
        }
        // Whatever is left goes into the last column.
        if (remaining !== "" || cells.length < colCount) {
          cells.push(remaining.trim());
        }
      }

      // Pad short rows so every row has colCount cells.
      while (cells.length < colCount) cells.push("");
      rows.push(cells);
    }

    return { headers, rows };
  } catch {
    return null;
  }
}

/** Check if every value in a column looks numeric. */
function isNumericColumn(rows: string[][], colIndex: number): boolean {
  if (rows.length === 0) return false;
  return rows.every((row) => {
    const v = row[colIndex]?.trim() ?? "";
    return v === "" || /^[\d.,–\-–/]+$/.test(v);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

type SizeGuideTableProps = {
  sizeGuide?: string;
  /** Optional CSS class applied to the outer <div> wrapper. */
  className?: string;
};

export function SizeGuideTable({ sizeGuide, className }: SizeGuideTableProps) {
  if (!sizeGuide?.trim()) return null;

  const parsed = parseSizeGuide(sizeGuide);

  // ── Fallback: render raw text if parsing fails ───────────────────────────
  if (!parsed || parsed.rows.length === 0) {
    return (
      <div className={className}>
        <pre className="sg-table-fallback">{sizeGuide}</pre>
      </div>
    );
  }

  const { headers, rows } = parsed;
  const numericCols = headers.map((_, ci) => isNumericColumn(rows, ci));

  return (
    <div className={`sg-table-wrap${className ? ` ${className}` : ""}`}>
      <div className="sg-table-scroll">
        <table className="sg-table">
          <thead>
            <tr>
              {headers.map((h, ci) => (
                <th
                  key={ci}
                  className={numericCols[ci] ? "sg-th sg-th--num" : "sg-th"}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "sg-tr" : "sg-tr sg-tr--alt"}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={numericCols[ci] ? "sg-td sg-td--num" : "sg-td"}
                  >
                    {cell || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
