import api from '../lib/axios';

export const auditService = {
  getLogs: (params) => api.get('/audit-logs', { params }),  // {page, limit, action, entity_type}
};
