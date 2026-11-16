// Single place that resolves the backend API origin for every web client.
//
// Production: set REACT_APP_API_URL to the deployed backend origin, e.g.
//   REACT_APP_API_URL=https://drive-transparency-api.onrender.com
// Development: falls back to the local FastAPI server when the variable is
// not defined, so `npm start` keeps working exactly as before.
//
// The trailing slash is stripped so callers can safely build paths like
// `${API_BASE_URL}/api/...` without producing double slashes.

const DEV_API_URL = "http://localhost:8000";
const PRODUCTION_FALLBACK_URL = "https://drive-transparency.onrender.com";

const rawBaseUrl =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production" ? PRODUCTION_FALLBACK_URL : DEV_API_URL);

export const API_BASE_URL = String(rawBaseUrl).replace(/\/+$/, "");

export default API_BASE_URL;
