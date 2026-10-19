import React, { useState } from "react";
import { buildTsv, openResultInNewTab } from "../utils/tableUtils";

const PAGE_SIZE = 50;

const ResultTable = ({ headers, rows }) => {
  const [page, setPage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [popupHint, setPopupHint] = useState(false);

  if (!Array.isArray(headers) || headers.length === 0) return null;
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, totalRows);
  const visibleRows = rows.slice(start, end);

  const writeClipboard = async (text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleCopy = async () => {
    await writeClipboard(buildTsv(headers, rows));
  };

  const handleOpen = () => {
    const opened = openResultInNewTab(headers, rows);
    if (!opened) {
      setPopupHint(true);
      setTimeout(() => setPopupHint(false), 3000);
    }
  };

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-outline-variant/30">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-surface-container-lowest border-b border-outline-variant/30">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">
            dataset
          </span>
          <span className="text-label-mono text-on-surface-variant">
            Results
          </span>
          <span className="text-label-mono text-on-surface-variant/50">
            · {totalRows} row{totalRows === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            title={`Copy all ${totalRows} rows as TSV`}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-label-mono text-primary hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">
              {copied ? "check" : "content_copy"}
            </span>
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            type="button"
            onClick={handleOpen}
            title="Open full table in a new tab"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-label-mono text-on-surface-variant hover:text-primary hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">
              open_in_new
            </span>
            New tab
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-lowest border-b border-outline-variant/30">
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-label-mono text-primary uppercase text-[10px] tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {visibleRows.map((row, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="px-4 py-3 text-sm md:text-base text-on-surface-variant align-top"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-surface-container-lowest border-t border-outline-variant/30">
          {popupHint ? (
            <span className="text-label-mono text-error">
              Pop-up blocked — allow pop-ups to open the full table
            </span>
          ) : (
            <span className="text-label-mono text-on-surface-variant/60">
              Showing {start + 1}–{end} of {totalRows}
            </span>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              aria-label="Previous page"
              className="p-1 rounded-md text-outline hover:text-primary hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">
                chevron_left
              </span>
            </button>
            <span className="text-label-mono text-on-surface-variant">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((prev) => Math.min(totalPages - 1, prev + 1))
              }
              disabled={currentPage === totalPages - 1}
              aria-label="Next page"
              className="p-1 rounded-md text-outline hover:text-primary hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultTable;
