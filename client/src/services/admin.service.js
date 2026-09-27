import api from '../lib/axios';

export const adminService = {
  getUsers: (params) => api.get('/admin/users', { params }),  // {page, limit}
  getWallets: (params) => api.get('/admin/wallets', { params }),  // {page, limit}
  getTransactions: (params) => api.get('/admin/transactions', { params }),  // {page, limit}
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),  // {page, limit, action, entityType}
};
