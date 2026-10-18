import React, { Suspense, lazy, useMemo, useState } from "react";
import { analyzeTable } from "../utils/chartData";

const ResultChart = lazy(() => import("./ResultChart"));

const ChatMessage = ({ message }) => {
  const { role, content, sql, timestamp, type = "text" } = message;
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);
  const [tableView, setTableView] = useState("table");

  const chartAnalysis = useMemo(
    () =>
      type === "table" ? analyzeTable(message.headers, message.rows) : null,
    [type, message.headers, message.rows],
  );

  const handleCopySql = async () => {
    if (!sql) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sql);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = sql;
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

  return (
    <div
      className={`flex w-full gap-4 ${isUser ? "justify-end" : "justify-start"} animate-fade-in-up`}
    >
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-container/30 border border-primary/30 flex items-center justify-center">
          <span
            className="material-symbols-outlined text-primary text-sm"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            smart_toy
          </span>
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`flex-1 min-w-0 ${isUser ? "order-1" : "order-2"}`}
      >
        <div
          className={`px-6 py-5 rounded-2xl ${
            isUser
              ? "bg-primary text-on-primary chat-bubble-user"
              : "bg-surface-container-high border border-white/5 text-on-surface chat-bubble-assistant"
          }`}
        >
          {/* Error */}
          {type === "error" && (
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-error text-lg mt-0.5">
                error
              </span>
              <div className="text-base md:text-lg leading-7 text-error">
                {content}
              </div>
            </div>
          )}

          {/* Text Content */}
          {type === "text" && (
            <div className="text-base md:text-lg leading-7 whitespace-pre-wrap">
              {content}
            </div>
          )}

          {/* SQL Code Block */}
          {type === "sql" && (
            <div className="space-y-3">
              <div className="text-base md:text-lg leading-7">{content}</div>
              {sql && (
                <div className="mt-3 rounded-xl overflow-hidden border border-outline-variant/30">
                  <div className="flex items-center justify-between px-4 py-2 bg-surface-container-lowest border-b border-outline-variant/30">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">
                        code
                      </span>
                      <span className="text-label-mono text-on-surface-variant">
                        Generated SQL
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="text-label-mono text-primary hover:text-on-primary-container transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copied ? "check" : "content_copy"}
                      </span>
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <pre className="p-4 bg-surface-container-lowest overflow-x-auto">
                    <code className="font-label-mono text-sm md:text-base text-tertiary">
                      {sql}
                    </code>
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Table/Results */}
          {type === "table" && (
            <div className="space-y-3">
              <div className="text-base md:text-lg leading-7">{content}</div>

              {chartAnalysis?.chartable && (
                <div className="inline-flex items-center rounded-lg bg-surface-container-lowest border border-outline-variant/30 p-1">
                  <button
                    type="button"
                    onClick={() => setTableView("table")}
                    aria-pressed={tableView === "table"}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-label-mono transition-colors ${
                      tableView === "table"
                        ? "bg-surface-container-high text-primary"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      table_chart
                    </span>
                    Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableView("chart")}
                    aria-pressed={tableView === "chart"}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-label-mono transition-colors ${
                      tableView === "chart"
                        ? "bg-surface-container-high text-primary"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      insert_chart
                    </span>
                    Chart
                  </button>
                </div>
              )}

              {tableView === "table" || !chartAnalysis?.chartable ? (
                <div className="mt-3 rounded-xl overflow-hidden border border-outline-variant/30">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-surface-container-lowest border-b border-outline-variant/30">
                        <tr>
                          {message.headers?.map((header, i) => (
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
                        {message.rows?.map((row, i) => (
                          <tr
                            key={i}
                            className="hover:bg-white/5 transition-colors"
                          >
                            {row.map((cell, j) => (
                              <td
                                key={j}
                                className="px-4 py-3 text-sm md:text-base text-on-surface-variant"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div className="mt-3 h-[360px] rounded-xl border border-outline-variant/30 flex items-center justify-center">
                      <span className="text-label-mono text-on-surface-variant/60">
                        Loading chart…
                      </span>
                    </div>
                  }
                >
                  <ResultChart
                    headers={message.headers}
                    rows={message.rows}
                    analysis={chartAnalysis}
                  />
                </Suspense>
              )}
            </div>
          )}

          {/* Insight/Report */}
          {type === "insight" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="material-symbols-outlined text-tertiary"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  auto_awesome
                </span>
                <span className="text-label-mono text-tertiary uppercase tracking-wider text-[10px]">
                  Business Insight
                </span>
              </div>
              <div className="text-base md:text-lg leading-7">{content}</div>
              {message.recommendations && (
                <div className="mt-4 p-4 bg-tertiary-container/20 rounded-xl border border-tertiary/20">
                  <h4 className="text-label-mono text-tertiary uppercase tracking-wider text-[10px] mb-2">
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {message.recommendations.map((rec, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm md:text-base text-on-surface-variant"
                      >
                        <span className="material-symbols-outlined text-tertiary text-sm mt-0.5">
                          arrow_right
                        </span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`mt-1 px-1 ${isUser ? "text-right" : "text-left"}`}>
          <span className="text-[11px] md:text-xs text-on-surface-variant/40">
            {timestamp ||
              new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
