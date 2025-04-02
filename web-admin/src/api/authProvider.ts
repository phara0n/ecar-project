import { AuthProvider } from 'react-admin';
import { jwtDecode } from 'jwt-decode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface TokenPayload {
  exp: number;
  user_id: number;
  role: string;
}

// Helper function to refresh the token
const refreshToken = async () => {
  const refresh = localStorage.getItem('refresh_token');
  
  if (!refresh) {
    // If there's no refresh token, we can't refresh the access token
    return Promise.reject({ message: 'No refresh token available' });
  }

  try {
    const response = await fetch(`${API_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (response.ok) {
      const data = await response.json();
      
      // Store both tokens consistently
      localStorage.setItem('token', data.access);  
      localStorage.setItem('access_token', data.access); // Store with both names for compatibility
      
      return Promise.resolve(data);
    } else {
      // If refreshing failed, clear the tokens and log the error
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return Promise.reject({ message: 'Failed to refresh token' });
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return Promise.reject({ message: 'Network error during token refresh' });
  }
};

export const authProvider: AuthProvider = {
  login: ({ username, password }) => {
    // Make a POST request to the API to verify credentials
    return fetch(`${API_URL}/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then(response => {
        if (response.status < 200 || response.status >= 300) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then(auth => {
        // Store the tokens in localStorage
        localStorage.setItem('token', auth.access);  
        localStorage.setItem('access_token', auth.access); // Store with both names for compatibility
        localStorage.setItem('refresh_token', auth.refresh);
        localStorage.setItem('username', username); // Save username for future reference
        
        console.log('User logged in successfully:', username);
        
        // Extract role from the JWT payload and store it
        try {
          const decodedToken = jwtDecode<TokenPayload>(auth.access);
          localStorage.setItem('role', decodedToken.role || '');
          console.log('User role from token:', decodedToken.role);
        } catch (error) {
          console.error('Error decoding token:', error);
        }
        
        return Promise.resolve();
      })
      .catch(() => {
        return Promise.reject({ message: 'Invalid username or password' });
      });
  },

  logout: () => {
    // Remove tokens from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    return Promise.resolve();
  },

  checkAuth: () => {
    // Check if the user is authenticated by verifying the presence of a token
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    
    if (!token) {
      return Promise.reject({ message: 'No token found' });
    }

    // Check if the token is expired
    try {
      const decodedToken = jwtDecode<TokenPayload>(token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp < currentTime) {
        console.log('Token expired, attempting to refresh...');
        // Token is expired, try to refresh
        return refreshToken()
          .then(() => Promise.resolve())
          .catch(error => {
            console.error('Token refresh failed:', error);
            return Promise.reject({ message: 'Session expired' });
          });
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error decoding token:', error);
      return Promise.reject({ message: 'Invalid token' });
    }
  },

  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return Promise.reject({ message: 'Unauthorized or forbidden' });
    }
    return Promise.resolve();
  },

  getPermissions: () => {
    // Get user permissions based on their role
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    
    if (!token) {
      return Promise.reject('No token found');
    }

    try {
      const decodedToken = jwtDecode<TokenPayload>(token);
      const role = decodedToken.role || localStorage.getItem('role');
      
      // Special handling for admin users
      const username = localStorage.getItem('username');
      if (username === 'admin') {
        console.log('User is admin, granting admin permissions');
        return Promise.resolve('admin');
      }
      
      return Promise.resolve(role);
    } catch (error) {
      console.error('Error decoding token:', error);
      return Promise.reject('Invalid token');
    }
  },

  getIdentity: () => {
    const username = localStorage.getItem('username');
    if (!username) {
      return Promise.reject('No user identity found');
    }
    
    return Promise.resolve({
      id: localStorage.getItem('user_id') || '1',
      fullName: username,
      avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(username),
    });
  },
}; 