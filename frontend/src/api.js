// In dev: Vite proxy forwards /markets and /users to localhost:5000
// In prod: VITE_API_URL is set to your Render backend URL (e.g. https://shardpredict-api.onrender.com)
const BASE = import.meta.env.VITE_API_URL || '';

export function apiUrl(path) {
  return `${BASE}${path}`;
}
