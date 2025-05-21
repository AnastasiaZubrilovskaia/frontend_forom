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

// Response interceptor remains mostly the same
api.interceptors.response.use(
  response => response.data,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('refresh')) {
      originalRequest._retry = true;
      
      try {
        const { access_token } = await refreshToken(localStorage.getItem('access_token'));
        localStorage.setItem('access_token', access_token);
        
        // For requests that need token, we'll include it in the body
        if (originalRequest.data) {
          const data = JSON.parse(originalRequest.data);
          originalRequest.data = JSON.stringify({ ...data, access_token });
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
    const response = await api.post('/login', { email, password });
    // Получаем только access_token, игнорируем refreshToken
    return {
      access_token: response.data.access_token 
    };
  },

  register: async (name, email, password) => {
    try {
      const response = await api.post('/register', { name, email, password });
      return response.data; // Должен вернуть { user_id }
    } catch (error) {
      console.error('Register API error:', error);
      throw error;
    }
  },

  getUserInfo: async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.post('/user-info', { access_token: token });
      return response.data; // Должен вернуть { user_id, name }
    } catch (error) {
      console.error('GetUserInfo error:', error);
      throw error;
    }
  },

  isAdmin: async (user_id) => {
    try {
      const response = await api.get(`/is-admin/${user_id}`);
      return response.data; // Должен вернуть { is_admin: boolean }
    } catch (error) {
      console.error('IsAdmin error:', error);
      throw error;
    }
  },

  logout: async () => {
    const token = localStorage.getItem('access_token');
    return api.post('/logout', { access_token: token });
  },

  refreshToken: async (expiredToken) => {
    return api.post('/refresh', { expired_access_token: expiredToken });
  },

  validateToken: async () => {
    const token = localStorage.getItem('access_token');
    return api.post('/validate', { access_token: token });
  },

  grantAdmin: async (user_id) => {
    const token = localStorage.getItem('access_token');
    return api.post('/grant-admin', { 
      admin_access_token: token,
      user_id: user_id 
    });
  },
};

// Helper functions remain the same
export const authHelper = {
  setaccess_token: (token) => {
    localStorage.setItem('access_token', token);
  },
  getaccess_token: () => {
    return localStorage.getItem('access_token');
  },
  clearAuthData: () => {
    localStorage.removeItem('access_token');
  },
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