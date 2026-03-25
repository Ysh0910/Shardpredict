// In dev: Vite proxy forwards /markets and /users to localhost:5000
// In prod: VITE_API_URL is set to your Render backend URL
// Last updated: force redeploy
const BASE = import.meta.env.VITE_API_URL || '';

export function apiUrl(path) {
  return `${BASE}${path}`;
}
