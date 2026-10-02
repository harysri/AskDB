import apiFetch from "./client";

export const listConnections = () => apiFetch("/api/connection");

export const testConnection = (payload) =>
  apiFetch("/api/connection/test", { method: "POST", body: payload });

export const createConnection = (payload) =>
  apiFetch("/api/connection", { method: "POST", body: payload });

export const deleteConnection = (connectionId) =>
  apiFetch(`/api/connection/${connectionId}`, { method: "DELETE" });
