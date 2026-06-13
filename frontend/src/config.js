const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
export const SOCKET_SERVER_URL = baseUrl;
export const BACKEND_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
