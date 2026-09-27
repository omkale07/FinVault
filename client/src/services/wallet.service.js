import api from '../lib/axios';

export const walletService = {
  create: async (data) => {
    const response = await api.post('/wallets', data);
    return response.data.wallet;
  },
  getAll: async () => {
    const response = await api.get('/wallets');
    return response.data.wallets || [];
  },
  getById: async (walletId) => {
    const response = await api.get(`/wallets/${walletId}`);
    return response.data.wallet;
  },
  update: async (walletId, data) => {
    const response = await api.patch(`/wallets/${walletId}`, data);
    return response.data.wallet;
  },
  delete: async (walletId) => {
    const response = await api.delete(`/wallets/${walletId}`);
    return response.data;
  },
  getBalance: async (walletId) => {
    const response = await api.get(`/wallets/${walletId}/balance`);
    return response.data.wallet;
  },
};
