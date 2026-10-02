export const TOKEN_STORAGE_KEY = "askdb_access_token";
export const REFRESH_TOKEN_STORAGE_KEY = "askdb_refresh_token";

const API_BASE_URL = "";

const authListeners = new Set();

export function subscribeAuthEvents(listener) {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

function emitAuthEvent(type) {
  authListeners.forEach((listener) => listener({ type }));
}

function getAccessToken() {
  return (
    (typeof localStorage !== "undefined" &&
      localStorage.getItem(TOKEN_STORAGE_KEY)) ||
    null
  );
}

function getRefreshToken() {
  return (
    (typeof localStorage !== "undefined" &&
      localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)) ||
    null
  );
}

function storeTokens(accessToken, refreshToken) {
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }
}

function clearTokens() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

// Single-flight refresh: the gateway rotates the refresh token on every use,
// so concurrent 401s must share ONE refresh call or they invalidate each other.
let refreshPromise = null;

async function refreshTokens() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        const error = new Error("Session expired");
        error.status = 401;
        throw error;
      }
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = new Error(data.message || "Session expired");
        error.status = res.status;
        throw error;
      }
      storeTokens(data.accessToken, data.refreshToken);
      emitAuthEvent("tokensRefreshed");
      return data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function doFetch(
  path,
  { method = "GET", body, token, retried = false } = {},
) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const authToken = token || getAccessToken();
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    let message = data.message || "Something went wrong";
    if (typeof data.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data.detail)) {
      message = data.detail.map((d) => d.msg || "Invalid value").join("; ");
    }
    const error = new Error(message);
    error.status = res.status;
    error.code = data.error;
    throw error;
  }

  return data;
}

async function apiFetch(path, options = {}) {
  try {
    return await doFetch(path, options);
  } catch (error) {
    const isAuthPath = path.startsWith("/auth/");
    if (
      error.status !== 401 ||
      isAuthPath ||
      options.retried ||
      !getRefreshToken()
    ) {
      throw error;
    }
    // Access token expired -> refresh once (single-flight) and retry.
    try {
      await refreshTokens();
    } catch (refreshError) {
      clearTokens();
      emitAuthEvent("sessionExpired");
      throw refreshError;
    }
    return doFetch(path, { ...options, retried: true, token: undefined });
  }
}

export default apiFetch;
