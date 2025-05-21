import axios from 'axios';

const API_URL = process.env.API_URL_POSTS || 'http://localhost:8080/api/posts';

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
  response => {
    console.log('Posts API Response:', response);
    return response.data;
  },
  error => {
    console.error('Posts API Error:', error.response?.data || error);
    const errorData = error.response?.data || {};
    return Promise.reject({
      message: errorData.message || errorData.error || 'Network Error',
      status: error.response?.status,
      data: errorData,
      validationErrors: errorData.errors || errorData.validation || null
    });
  }
);

export const postsAPI = {
  createPost: async (title, content) => {
    try {
      const response = await api.post('/', { title, content });
      console.log('Create post response:', response);
      return {
        id: response.id,
        title: response.title,
        content: response.content,
        author_id: response.author_id,
        author_name: response.author_name,
        created_at: response.created_at,
        updated_at: response.updated_at
      };
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  },

  getPosts: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/', { params: { page, limit } });
      console.log('Get posts response:', response);
      return response.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        author_id: post.author_id,
        author_name: post.author_name,
        created_at: post.created_at,
        updated_at: post.updated_at
      }));
    } catch (error) {
      console.error('Get posts error:', error);
      throw error;
    }
  },

  getPost: async (postId) => {
    try {
      const response = await api.get(`/${postId}`);
      console.log('Get post response:', response);
      return {
        id: response.id,
        title: response.title,
        content: response.content,
        author_id: response.author_id,
        author_name: response.author_name,
        created_at: response.created_at,
        updated_at: response.updated_at
      };
    } catch (error) {
      console.error('Get post error:', error);
      throw error;
    }
  },

  updatePost: async (postId, title, content) => {
    try {
      const response = await api.put(`/${postId}`, { title, content });
      console.log('Update post response:', response);
      return {
        id: response.id,
        title: response.title,
        content: response.content,
        author_id: response.author_id,
        author_name: response.author_name,
        created_at: response.created_at,
        updated_at: response.updated_at
      };
    } catch (error) {
      console.error('Update post error:', error);
      throw error;
    }
  },

  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/${postId}`);
      console.log('Delete post response:', response);
      return response;
    } catch (error) {
      console.error('Delete post error:', error);
      throw error;
    }
  },

  likePost: async (postId) => {
    try {
      const response = await api.post(`/${postId}/like`);
      console.log('Like post response:', response);
      return response;
    } catch (error) {
      console.error('Like post error:', error);
      throw error;
    }
  },

  unlikePost: async (postId) => {
    try {
      const response = await api.delete(`/${postId}/like`);
      console.log('Unlike post response:', response);
      return response;
    } catch (error) {
      console.error('Unlike post error:', error);
      throw error;
    }
  }
};

// Export individual functions
export const createPost = postsAPI.createPost;
export const getPosts = postsAPI.getPosts;
export const getPost = postsAPI.getPost;
export const updatePost = postsAPI.updatePost;
export const deletePost = postsAPI.deletePost;
export const likePost = postsAPI.likePost;
export const unlikePost = postsAPI.unlikePost; 