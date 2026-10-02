import apiFetch from "./client";

export const login = ({ email, password }) =>
  apiFetch("/auth/login", { method: "POST", body: { email, password } });

export const register = ({ fullName, email, password }) =>
  apiFetch("/auth/register", { method: "POST", body: { fullName, email, password } });

export const logout = ({ refreshToken }) =>
  apiFetch("/auth/logout", { method: "POST", body: { refreshToken } });

export const refresh = ({ refreshToken }) =>
  apiFetch("/auth/refresh", { method: "POST", body: { refreshToken } });
