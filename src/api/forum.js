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

// Интерцептор для добавления токена в тело запроса (вместо заголовка)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token && ['post', 'put', 'delete'].includes(config.method.toLowerCase())) {
    if (config.data) {
      config.data.access_token = token;
    } else if (config.params) {
      config.params.access_token = token;
    }
  }
  return config;
});

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      const apiError = {
        message: error.response.data?.error || 'Request failed',
        status: error.response.status,
        data: error.response.data,
      };
      return Promise.reject(apiError);
    }
    return Promise.reject({ 
      message: error.message || 'Network error',
      status: 0,
      data: null
    });
  }
);

export const forumAPI = {
  posts: {
    getAll: () => api.get('/posts'),
    getById: (id) => api.get(`/posts/${id}`),
    create: (postData) => api.post('/posts', postData),
    update: (id, postData) => api.put(`/posts/${id}`, postData),
    delete: (id) => api.delete(`/posts/${id}`),
  },
  comments: {
    getByPostId: (postId) => api.get('/comments', { params: { post_id: postId } }),
    getById: (id) => api.get(`/comments/${id}`),
    create: (commentData) => api.post('/comments', commentData),
    update: (id, commentData) => api.put(`/comments/${id}`, commentData),
    delete: (id) => api.delete(`/comments/${id}`),
  },
  messages: {
    getAll: () => api.get('/chat')
  }
};

// Для удобства экспортируем отдельные методы
export const {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getCommentsByPostId,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
  getAllMessages
} = {
  getAllPosts: forumAPI.posts.getAll,
  getPostById: forumAPI.posts.getById,
  createPost: forumAPI.posts.create,
  updatePost: forumAPI.posts.update,
  deletePost: forumAPI.posts.delete,
  getCommentsByPostId: forumAPI.comments.getByPostId,
  getCommentById: forumAPI.comments.getById,
  createComment: forumAPI.comments.create,
  updateComment: forumAPI.comments.update,
  deleteComment: forumAPI.comments.delete,
  getAllMessages: forumAPI.messages.getAll
};