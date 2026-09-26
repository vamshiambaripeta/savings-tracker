const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const API_BASE_URL = BASE_URL.endsWith('/api') 
  ? BASE_URL 
  : `${BASE_URL}/api`;