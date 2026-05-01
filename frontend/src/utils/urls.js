const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, "");
export const apiBasePath = `${apiBaseUrl}/api`;

export function buildAssetUrl(path = "") {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${apiBaseUrl}${path}`;
}
