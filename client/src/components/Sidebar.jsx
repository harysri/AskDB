import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getInitials, getDisplayName, getRoleLabel } from "../utils/user";

const Sidebar = ({
  onConnectClick,
  isConnected,
  connectionInfo,
  connections = [],
  activeConnectionId,
  onSelectConnection,
  onNewSession,
  sessions = [],
  activeSessionId,
  onSessionClick,
  onDeleteSession,
  onProfileClick,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isChatPage = location.pathname === "/chat";
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [connMenuOpen, setConnMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const currentConnection =
    connections.find((c) => c.connection_id === activeConnectionId) ||
    connectionInfo ||
    null;

  const getDbLabel = (connectionId) => {
    const conn = connections.find((c) => c.connection_id === connectionId);
    return conn ? conn.database : null;
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await onDeleteSession?.(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message || "Could not delete the session.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[360px] bg-surface-container-lowest flex flex-col z-40 hidden lg:flex border-r border-outline-variant/20 transition-all duration-200 ease-in-out">
      {/* Logo Section */}
      <div className="px-4 pt-8 pb-6">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-background text-xl font-bold">
              database
            </span>
          </div>
          <span className="font-headline-md text-xl font-bold tracking-tighter text-on-surface">
            AskDB
          </span>
        </div>
        <p className="mt-2 text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em]">
          Enterprise Intelligence
        </p>
      </div>

      {/* Connection Selector */}
      <div className="px-4 mb-4 relative">
        <button
          onClick={() => setConnMenuOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-surface-container-high/20 border border-white/5 hover:bg-surface-container-high/40 transition-colors group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${currentConnection ? "bg-emerald-500" : "bg-error"}`}
            ></div>
            <div className="text-left min-w-0">
              <p className="text-body-md font-bold text-on-surface leading-tight truncate">
                {currentConnection
                  ? currentConnection.database || "Connected DB"
                  : "Not Connected"}
              </p>
              <p className="text-label-md text-on-surface-variant/70 leading-none truncate">
                {currentConnection
                  ? currentConnection.db_type
                    ? currentConnection.db_type.charAt(0).toUpperCase() +
                      currentConnection.db_type.slice(1)
                    : "PostgreSQL"
                  : "Click to connect"}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors shrink-0">
            {connMenuOpen ? "expand_less" : "expand_more"}
          </span>
        </button>

        {connMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setConnMenuOpen(false)}
            />
            <div className="absolute left-4 right-4 top-full mt-2 z-40 py-2 rounded-xl bg-surface-container-high border border-white/10 shadow-2xl animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  setConnMenuOpen(false);
                  onConnectClick?.();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-label-md text-primary hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Connect new database…
              </button>
              <div className="mx-4 my-1 h-px bg-white/10"></div>
              {connections.length === 0 ? (
                <p className="px-4 py-3 text-label-md text-on-surface-variant/50">
                  No saved connections yet
                </p>
              ) : (
                connections.map((conn) => (
                  <button
                    key={conn.connection_id}
                    type="button"
                    onClick={() => {
                      setConnMenuOpen(false);
                      onSelectConnection?.(conn.connection_id);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors ${
                      conn.connection_id === activeConnectionId
                        ? "text-primary"
                        : "text-on-surface-variant"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {conn.connection_id === activeConnectionId
                        ? "check_circle"
                        : "database"}
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block text-label-md truncate">
                        {conn.database}
                      </span>
                      <span className="block text-[10px] text-on-surface-variant/60 truncate">
                        {conn.host}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* New Session Button */}
      <div className="px-4 mb-6">
        <button
          onClick={onNewSession}
          className="w-full py-3 bg-primary text-background rounded-full font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/10 hover:brightness-110 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">add</span>
          New Session
        </button>
      </div>

      {/* Navigation / Past Sessions */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto no-scrollbar">
        <p className="px-4 text-[10px] font-bold text-outline uppercase tracking-widest mb-2">
          Past Sessions
        </p>

        {sessions.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <span className="material-symbols-outlined text-outline-variant text-3xl mb-2">
              chat
            </span>
            <p className="text-label-md text-on-surface-variant/50">
              No past sessions yet
            </p>
            <p className="text-[10px] text-on-surface-variant/30 mt-1">
              Start a new conversation to see it here
            </p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="group relative">
              <a
                onClick={() => onSessionClick?.(session.id)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                  activeSessionId === session.id
                    ? "text-primary font-bold bg-primary-container/20 border-l-2 border-primary"
                    : "text-on-surface-variant hover:bg-white/5"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">
                    {session.title}
                  </span>
                  {getDbLabel(session.connection_id) && (
                    <span className="block truncate text-[10px] text-on-surface-variant/60">
                      {getDbLabel(session.connection_id)}
                    </span>
                  )}
                </span>
              </a>

              {/* Session actions (hover-revealed) */}
              <button
                type="button"
                aria-label="Session actions"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenFor((prev) =>
                    prev === session.id ? null : session.id,
                  );
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-outline opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-white/10 transition-all"
              >
                <span className="material-symbols-outlined text-base">
                  more_horiz
                </span>
              </button>

              {menuOpenFor === session.id && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setMenuOpenFor(null)}
                  />
                  <div className="absolute right-2 top-11 z-40 w-44 py-1.5 rounded-xl bg-surface-container-high border border-white/10 shadow-2xl animate-fade-in">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteTarget(session);
                        setMenuOpenFor(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-label-md text-error hover:bg-error/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">
                        delete
                      </span>
                      Delete Session
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </nav>

      {/* Footer / Profile */}
      <div className="p-4 bg-surface-container-lowest border-t border-white/5">
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-primary-container/30 border border-primary/30 flex items-center justify-center text-primary font-bold shrink-0">
              {getInitials(user)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-body-md font-bold text-on-surface truncate">
                {getDisplayName(user)}
              </p>
              <p className="text-label-md text-on-surface-variant truncate">
                {getRoleLabel(user?.role)} • {user?.email}
              </p>
            </div>
            <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors shrink-0">
              {profileMenuOpen ? "expand_less" : "expand_more"}
            </span>
          </button>

          {profileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileMenuOpen(false)}
              />
              <div className="absolute bottom-full left-4 right-4 mb-2 z-40 py-1.5 rounded-xl bg-surface-container-high border border-white/10 shadow-2xl animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onProfileClick?.();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-label-md text-on-surface-variant hover:text-primary hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    person
                  </span>
                  Profile
                </button>
                <div className="mx-4 my-1 h-px bg-white/10"></div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-label-md text-error hover:bg-error/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    logout
                  </span>
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Session Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[70] bg-background/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="px-6 pt-6 pb-5 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-error/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-error">
                  delete
                </span>
              </div>
              <h3 className="font-headline-md text-lg font-bold text-on-surface">
                Delete session?
              </h3>
              <p className="mt-2 text-body-sm text-on-surface-variant leading-6">
                This will permanently delete{" "}
                <span className="text-on-surface font-semibold">
                  "{deleteTarget.title}"
                </span>{" "}
                and its chat history. This action cannot be undone.
              </p>
              {deleteError && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-error/10 border border-error/30 text-left">
                  <span className="material-symbols-outlined text-error text-base mt-0.5">
                    error
                  </span>
                  <span className="text-body-sm text-error flex-1">
                    {deleteError}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                disabled={deleting}
                className="flex-1 h-11 rounded-xl font-bold bg-surface-container-high text-on-surface hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 h-11 rounded-xl font-bold bg-error text-on-error hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">
                      sync
                    </span>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
