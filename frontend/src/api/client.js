const API_BASE = "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body, options = {}) =>
    request(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  put: (path, body, options = {}) =>
    request(path, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  patch: (path, body = {}, options = {}) =>
    request(path, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  delete: (path) => request(path, { method: "DELETE" }),
};
