import apiFetch from "./client";

export const listSessions = () => apiFetch("/api/sessions");

export const createSession = (connectionId) => {
  const query = connectionId ? `?connection_id=${encodeURIComponent(connectionId)}` : "";
  return apiFetch(`/api/sessions${query}`, { method: "POST" });
};

export const getSessionMessages = (sessionId) =>
  apiFetch(`/api/sessions/${sessionId}/messages`);

export const deleteSession = (sessionId) =>
  apiFetch(`/api/sessions/${sessionId}`, { method: "DELETE" });

export const updateSession = (sessionId, { title, is_archived, connection_id } = {}) =>
  apiFetch(`/api/sessions/${sessionId}`, {
    method: "PATCH",
    body: { title, is_archived, connection_id },
  });
