import api from '../lib/axios';

export const authService = {
  register: (data) => api.post('/users/register', data),  // {name, email, password}
  login: (data) => api.post('/users/login', data),  // {email, password} → {token}
  refresh: () => api.post('/users/refresh'),  // cookie-based → {token}
  logout: () => api.post('/users/logout'),
  getProfile: () => api.get('/users/profile'),  // → {user: {id, name, email, role, is_verified, created_at}}
  updateProfile: (data) => api.patch('/users/profile', data),  // {name, email}
  changePassword: (data) => api.patch('/users/password', data),  // {currentPassword, newPassword}
};
