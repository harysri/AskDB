import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/user";

const ChatMessage = ({ message }) => {
  const { role, content, sql, timestamp, type = "text" } = message;
  const isUser = role === "user";
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

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
      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"} animate-fade-in-up`}
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
        className={`max-w-[90%] sm:max-w-[85%] lg:max-w-[75%] ${isUser ? "order-1" : "order-2"}`}
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

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-container/30 border border-primary/30 flex items-center justify-center order-2">
          <span className="text-primary text-xs font-bold">
            {getInitials(user)}
          </span>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
