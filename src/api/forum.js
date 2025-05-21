import axios from 'axios';
import { authHelper, authAPI } from './auth';

const API_URL = process.env.API_URL_FORUM || 'http://localhost:8080/api';

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
    const token = authHelper.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  response => response.data,
  async error => {
    const originalRequest = error.config;

    // Не повторяем запросы на удаление и запросы на обновление токена
    if ((error.response?.status === 401 || error.response?.status === 403) && 
        !originalRequest._retry && 
        !originalRequest.url.includes('/auth/refresh') &&
        originalRequest.method !== 'DELETE') {
      originalRequest._retry = true;

      try {
        // Пробуем обновить токен
        const token = authHelper.getAccessToken();
        if (token) {
          const { accessToken } = await authAPI.refreshToken(token);
          authHelper.setTokens(accessToken);

          // Повторяем оригинальный запрос с новым токеном
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        // Если не удалось обновить токен, перенаправляем на страницу входа
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const forumAPI = {
  // Posts
  createPost: async (title, content) => {
    return api.post('/posts', { title, content });
  },

  getPosts: async () => {
    return api.get('/posts');
  },

  getPost: async (id) => {
    return api.get(`/posts/${id}`);
  },

  updatePost: async (id, title, content) => {
    return api.put(`/posts/${id}`, { title, content });
  },

  deletePost: async (id, signal) => {
    return api.delete(`/posts/${id}`, { signal });
  },

  // Comments
  createComment: async (postId, content) => {
    const currentUserId = authHelper.getUserId();
    const currentUserName = authHelper.getUserName();
    console.log('Creating comment with user ID:', currentUserId, 'and name:', currentUserName);
    return api.post('/comments', { 
      post_id: postId, 
      content,
      author_id: currentUserId,
      author_name: currentUserName
    });
  },

  getComments: async (postId) => {
    return api.get(`/comments?post_id=${postId}`);
  },

  updateComment: async (id, content) => {
    return api.put(`/comments/${id}`, { content });
  },

  deleteComment: async (id, signal) => {
    return api.delete(`/comments/${id}`, { signal });
  },

  // Messages
  getMessages: async () => {
    return api.get('/chat');
  },

  createMessage: async (content) => {
    return api.post('/chat', { content });
  },

  deleteMessage: async (id) => {
    return api.delete(`/chat/${id}`);
  }
};

export default forumAPI;