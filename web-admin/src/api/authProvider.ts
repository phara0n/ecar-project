import { AuthProvider } from 'react-admin';
import { jwtDecode } from 'jwt-decode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface TokenPayload {
  exp: number;
  user_id: string;
  role: string;
}

export const authProvider: AuthProvider = {
  login: ({ username, password }) => {
    return fetch(`${API_URL}/auth/token/`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
      .then(response => {
        if (response.status < 200 || response.status >= 300) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then(({ access, refresh }) => {
        localStorage.setItem('token', access);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('login_time', Date.now().toString());
        return access;
      });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('login_time');
    return Promise.resolve();
  },

  checkAuth: () => {
    const token = localStorage.getItem('token');
    if (!token) return Promise.reject('No token found');

    // Check if token is expired
    try {
      const decodedToken = jwtDecode(token) as TokenPayload;
      const currentTime = Date.now() / 1000;
      
      if (decodedToken.exp < currentTime) {
        // Token is expired, try to refresh
        return refreshToken();
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      return Promise.reject('Invalid token');
    }

    return Promise.resolve();
  },

  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('login_time');
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getPermissions: () => {
    const token = localStorage.getItem('token');
    if (!token) return Promise.reject('No token found');

    try {
      const decodedToken = jwtDecode(token) as TokenPayload;
      return Promise.resolve(decodedToken.role || 'user');
    } catch {
      return Promise.reject('Invalid token');
    }
  },

  getIdentity: () => {
    const token = localStorage.getItem('token');
    if (!token) return Promise.reject('No token found');

    try {
      const decodedToken = jwtDecode(token) as TokenPayload;
      return Promise.resolve({
        id: decodedToken.user_id,
        fullName: `User ${decodedToken.user_id}`,
      });
    } catch {
      return Promise.reject('Invalid token');
    }
  },
};

// Helper function to refresh the token
const refreshToken = () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return Promise.reject('No refresh token found');

  return fetch(`${API_URL}/auth/token/refresh/`, {
    method: 'POST',
    body: JSON.stringify({ refresh: refreshToken }),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
    .then(response => {
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then(({ access }) => {
      localStorage.setItem('token', access);
      localStorage.setItem('login_time', Date.now().toString());
      return access;
    })
    .catch(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('login_time');
      return Promise.reject('Token refresh failed');
    });
}; 