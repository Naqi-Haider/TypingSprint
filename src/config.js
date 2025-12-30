/**
 * Centralized Configuration for API and Socket connections.
 * This makes it easier to manage URLs between local development and production.
 */

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Remove trailing slash and /api if present for the base socket URL
export const SOCKET_URL = rawUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

// Ensure /api suffix for REST requests
export const API_URL = `${SOCKET_URL}/api`;

console.log(`[Config] Socket URL: ${SOCKET_URL}`);
console.log(`[Config] API URL: ${API_URL}`);
