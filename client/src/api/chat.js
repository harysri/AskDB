import apiFetch from "./client";

export const sendMessage = ({ session_id, connection_id, message }) =>
  apiFetch("/api/chat", {
    method: "POST",
    body: { session_id, connection_id, message },
  });
