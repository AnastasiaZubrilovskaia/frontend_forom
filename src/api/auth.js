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


api.interceptors.response.use(
  response => {
    console.log('API Response:', response); 
    return response.data;
  },
  async error => {
    console.error('API Error:', error.response?.data || error); 
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('refresh')) {
      originalRequest._retry = true;
      
      try {
        const { accessToken } = await refreshToken(localStorage.getItem('access_token'));
        localStorage.setItem('access_token', accessToken);
        
        
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
      
      const accessToken = response.access_token || response.accessToken;
      const refreshToken = response.refresh_token || response.refreshToken;
      
      if (!accessToken) {
        throw new Error('No access token received');
      }

      try {
        const payload = accessToken.split('.')[1];
        const decodedPayload = atob(payload);
        console.log('Decoded token payload:', decodedPayload);
      } catch (error) {
        console.error('Failed to decode token:', error);
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
      console.log('Calling isAdmin API with user_id:', user_id);
      const response = await api.get(`/is-admin/${user_id}`);
      console.log('IsAdmin API response:', response);
      
      // Проверяем оба варианта: snake_case и camelCase
      const isAdmin = response.is_admin || response.isAdmin;
      console.log('Parsed isAdmin value:', isAdmin);
      
      // Преобразуем в boolean, если значение не boolean
      return Boolean(isAdmin);
    } catch (error) {
      console.error('IsAdmin API error:', error);
      return false;
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
    console.log('getUserId - Raw token:', token);
    
    if (!token) return null;
    
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      console.log('getUserId - Decoded payload:', decodedPayload);
      const { user_id: userId } = JSON.parse(decodedPayload);
      console.log('getUserId - Parsed userId:', userId);
      return userId;
    } catch (error) {
      console.error('Failed to parse JWT token:', error);
      return null;
    }
  },

  getUserName: () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      const parsedPayload = JSON.parse(decodedPayload);
      return parsedPayload.user_name;
    } catch (error) {
      console.error('Failed to parse user name from token:', error);
      return null;
    }
  },

  isAdmin: async () => {
    const token = localStorage.getItem('access_token');
    console.log('isAdmin - Raw token:', token);
    
    if (!token) return false;
    
    try {
      const userId = authHelper.getUserId();
      if (!userId) return false;

      const response = await authAPI.isAdmin(userId);
      console.log('isAdmin API response:', response);
      
      // Сохраняем статус админа в localStorage
      localStorage.setItem('is_admin', response);
      
      return response;
    } catch (error) {
      console.error('Failed to check admin status:', error);
      return false;
    }
  },

  getIsAdmin: () => {
    return localStorage.getItem('is_admin') === 'true';
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