import api from '../lib/axios';

export const transactionService = {
  create: async (data) => {
    const response = await api.post(
      `/wallets/${data.walletId}/transactions`, 
      {
        type: data.type,
        amount: data.amount,
        currency: data.currency
      }
    );
    return response.data;
  },
  
  process: async (data) => {
    const response = await api.post(
      `/transactions/${data.transactionId}/process`,
      {},
      { headers: { 'Idempotency-Key': data.idempotencyKey } }
    );
    return response.data;
  },
  
  transfer: async (data) => {
    const response = await api.post(
      `/wallets/${data.walletId}/transfer`,
      {
        destinationWalletId: data.destinationWalletId,
        amount: data.amount,
        currency: data.currency
      },
      { headers: { 'Idempotency-Key': data.idempotencyKey } }
    );
    return response.data;
  },
  
  cancel: async (data) => {
    const response = await api.post(
      `/wallets/${data.walletId}/transactions/${data.transactionId}/cancel`
    );
    return response.data;
  },
  
  getByWallet: async (walletId, params) => {
    const response = await api.get(`/wallets/${walletId}/transactions`, { params });
    return response.data;
  },
  
  getById: async (walletId, transactionId) => {
    const response = await api.get(
      `/wallets/${walletId}/transaction/${transactionId}`
    );
    return response.data.transaction || response.data;
  },
  
  getHistory: async (params) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },
};
