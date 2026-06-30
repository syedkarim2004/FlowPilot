import axios from 'axios';
import { auth } from './firebase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add userId to every request automatically
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Still send userId for dev convenience, though the backend will rely on the token.
      if (['post', 'put', 'patch'].includes(config.method)) {
        config.data = { ...config.data, userId: user.uid };
      } else {
        config.params = { ...config.params, userId: user.uid };
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Unwrap response and handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Request failed';
    console.error('API Error:', error.response?.status, message);
    return Promise.reject(new Error(message));
  }
);

export const taskAPI = {
  analyze: (data) => api.post('/api/tasks/analyze', data),
  create: (data) => api.post('/api/tasks', data),
  getAll: () => api.get('/api/tasks'),
  update: (id, data) => api.put(`/api/tasks/${id}`, data),
  delete: (id) => api.delete(`/api/tasks/${id}`),
};

export const planAPI = {
  generateDaily: (tasks) => api.post('/api/plan/daily', { tasks }),
  generateSprint: (availableMinutes, tasks) => api.post('/api/sprint', { availableMinutes, tasks }),
};

export const rescueAPI = {
  activate: (task) => api.post('/api/rescue', { task }),
};

export const chatAPI = {
  send: (message, tasks, productivityScore, goals, history) => 
    api.post('/api/chat', { message, tasks, productivityScore, goals, history }),
};

export const goalAPI = {
  breakdown: (goalTitle, goalDescription) => api.post('/api/goal/breakdown', { goalTitle, goalDescription }),
};

export const coachAPI = {
  getProfile: (tasks, goals) => api.post('/api/coach/profile', { tasks, goals }),
};

export default api;
