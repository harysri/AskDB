import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getInitials, getDisplayName, getRoleLabel } from "../utils/user";

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const ProfileModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const memberSince = formatDate(user?.createdAt);
  const email = user?.email || "—";
  const role = getRoleLabel(user?.role) || "—";

  return (
    <div
      className="fixed inset-0 z-[70] bg-background/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="glass-card w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <h3 className="font-headline-md text-lg font-bold text-on-surface">
            Profile
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-outline hover:text-on-surface hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Avatar + identity */}
        <div className="px-6 pt-4 pb-5 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-primary-container/30 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-2xl mb-4">
            {getInitials(user)}
          </div>
          <p className="text-body-md font-bold text-on-surface truncate max-w-full">
            {getDisplayName(user)}
          </p>
          <p className="text-label-md text-on-surface-variant mt-1 truncate max-w-full">
            {user?.email}
          </p>
        </div>

        {/* Fields */}
        <div className="px-6 pb-6 space-y-3">
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface-container-high/40 border border-white/5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-primary text-base">
                mail
              </span>
              <span className="text-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant/60">
                Email
              </span>
            </div>
            <span
              className="text-body-sm text-on-surface truncate"
              title={email}
            >
              {email}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface-container-high/40 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-tertiary text-base">
                badge
              </span>
              <span className="text-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant/60">
                Role
              </span>
            </div>
            <span className="text-body-sm text-on-surface">{role}</span>
          </div>

          {memberSince && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface-container-high/40 border border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-outline text-base">
                  calendar_month
                </span>
                <span className="text-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant/60">
                  Member since
                </span>
              </div>
              <span className="text-body-sm text-on-surface">
                {memberSince}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
