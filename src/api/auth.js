import axios from 'axios';

const API_URL = process.env.API_URL_AUTH || 'http://localhost:8081/api/auth';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor to add token to all requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token refresh
api.interceptors.response.use(
  response => {
    console.log('API Response:', response); // Debug log for all responses
    return response.data;
  },
  async error => {
    console.error('API Error:', error.response?.data || error); // Debug log for all errors
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('refresh')) {
      originalRequest._retry = true;
      
      try {
        const { accessToken } = await refreshToken(localStorage.getItem('access_token'));
        localStorage.setItem('access_token', accessToken);
        
        // Update the original request with new token
        if (originalRequest.data) {
          const data = JSON.parse(originalRequest.data);
          originalRequest.data = JSON.stringify({ ...data, accessToken });
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    const errorData = error.response?.data || {};
    return Promise.reject({
      message: errorData.message || errorData.error || 'Network Error',
      status: error.response?.status,
      data: errorData,
      validationErrors: errorData.errors || errorData.validation || null
    });
  }
);

export const authAPI = {
  login: async (email, password) => {
    try {
    const response = await api.post('/login', { email, password });
      console.log('Login API Response:', response);
      
      // Проверяем оба варианта: snake_case и camelCase
      const accessToken = response.access_token || response.accessToken;
      const refreshToken = response.refresh_token || response.refreshToken;
      
      if (!accessToken) {
        throw new Error('No access token received');
      }
      
      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      
      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  register: async (name, email, password) => {
    try {
      const response = await api.post('/register', { name, email, password });
      console.log('Register API Response:', response);
      
      const userId = response.user_id || response.userId;
      if (!userId) {
        throw new Error('Registration failed - no user ID received');
      }
      
      return { user_id: userId };
    } catch (error) {
      console.error('Register API error:', error);
      throw error;
    }
  },

  getUserInfo: async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('Getting user info with token:', token);
      const response = await api.post('/user-info', { accessToken: token });
      console.log('Raw user info response:', response);
      
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid user info response format');
      }

      const userId = response.user_id || response.userId;
      const userName = response.name;

      if (!userId || !userName) {
        throw new Error('Invalid user info - missing required fields');
      }

      return {
        user_id: userId,
        name: userName
      };
    } catch (error) {
      console.error('GetUserInfo error:', error);
      throw error;
    }
  },

  isAdmin: async (user_id) => {
    try {
      const response = await api.get(`/is-admin/${user_id}`);
      console.log('IsAdmin response:', response);
      
      // Проверяем оба варианта: snake_case и camelCase
      const isAdmin = response.is_admin || response.isAdmin;
      if (typeof isAdmin !== 'boolean') {
        throw new Error('Invalid admin status response');
      }
      
      return { is_admin: isAdmin };
    } catch (error) {
      console.error('IsAdmin error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
    const token = localStorage.getItem('access_token');
      await api.post('/logout', { accessToken: token });
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  refreshToken: async (expiredToken) => {
    try {
      const response = await api.post('/refresh', { expiredAccessToken: expiredToken });
      
      const accessToken = response.access_token || response.accessToken;
      if (!accessToken) {
        throw new Error('No access token received in refresh response');
      }
      
      localStorage.setItem('access_token', accessToken);
      return { accessToken };
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  },

  validateToken: async () => {
    try {
    const token = localStorage.getItem('access_token');
      const response = await api.post('/validate', { accessToken: token });
      
      const isValid = response.valid;
      if (typeof isValid !== 'boolean') {
        throw new Error('Invalid token validation response');
      }
      
      return { valid: isValid };
    } catch (error) {
      console.error('Validate token error:', error);
      throw error;
    }
  },

  grantAdmin: async (user_id) => {
    try {
    const token = localStorage.getItem('access_token');
      const response = await api.post('/grant-admin', { 
        adminAccessToken: token,
      user_id: user_id 
    });
      
      const success = response.success;
      if (typeof success !== 'boolean') {
        throw new Error('Invalid grant admin response');
      }
      
      return { success };
    } catch (error) {
      console.error('Grant admin error:', error);
      throw error;
    }
  },
};

export const authHelper = {
  getAccessToken: () => {
    return localStorage.getItem('access_token');
  },

  getRefreshToken: () => {
    return localStorage.getItem('refresh_token');
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  },

  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  getUserId: () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    
    try {
      // JWT токен состоит из трех частей, разделенных точками
      const payload = token.split('.')[1];
      // Декодируем base64
      const decodedPayload = atob(payload);
      // Парсим JSON
      const { sub: userId } = JSON.parse(decodedPayload);
      return userId;
    } catch (error) {
      console.error('Failed to parse JWT token:', error);
      return null;
    }
  },

  isAdmin: () => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      const { role } = JSON.parse(decodedPayload);
      return role === 'admin';
    } catch (error) {
      console.error('Failed to parse JWT token:', error);
      return false;
    }
  }
};

// Export individual functions
export const register = authAPI.register;
export const login = authAPI.login;
export const logout = authAPI.logout;
export const refreshToken = authAPI.refreshToken;
export const validateToken = authAPI.validateToken;
export const getUserInfo = authAPI.getUserInfo;
export const isAdmin = authAPI.isAdmin;
export const grantAdmin = authAPI.grantAdmin;