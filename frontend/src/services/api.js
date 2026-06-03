import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../utils/constants';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);

    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];

      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register'
      ) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Chatrooms API endpoints
export const chatroomsAPI = {
  getAll: (params) => api.get('/chatrooms', { params }),
  getById: (id) => api.get(`/chatrooms/${id}`),
  create: (data) => api.post('/chatrooms', data),
  join: (id) => api.post(`/chatrooms/${id}/join`),
  leave: (id) => api.post(`/chatrooms/${id}/leave`),
  getMessages: (id, params) => api.get(`/chatrooms/${id}/messages`, { params }),
};

// AI API endpoints
export const aiAPI = {
  summarize: (chatroomId, messageLimit) =>
    api.post(`/ai/summarize/${chatroomId}`, { messageLimit }),
  getStatus: () => api.get('/ai/status'),
  semanticSearch: (data) => api.post('/ai/search', data),
  askQuestion: (data) => api.post('/ai/qa', data),
};


export default api;
