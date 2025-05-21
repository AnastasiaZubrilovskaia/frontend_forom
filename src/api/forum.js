import axios from 'axios';

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

// Response interceptor for handling errors
api.interceptors.response.use(
  response => response.data,
  error => {
    const errorData = error.response?.data || {};
    return Promise.reject({
      message: errorData.message || errorData.error || 'Network Error',
      status: error.response?.status,
      data: errorData
    });
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

  deletePost: async (id) => {
    return api.delete(`/posts/${id}`);
  },

  // Comments
  createComment: async (postId, content) => {
    return api.post('/comments', { post_id: postId, content });
  },

  getComments: async (postId) => {
    return api.get(`/comments?post_id=${postId}`);
  },

  updateComment: async (id, content) => {
    return api.put(`/comments/${id}`, { content });
  },

  deleteComment: async (id) => {
    return api.delete(`/comments/${id}`);
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