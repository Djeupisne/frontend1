import authService from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'https://sms-banking-pjcp.onrender.com';

const transactionLogService = {
  getAllLogs: async (page = 0, size = 20) => {
    const response = await fetch(`${API_URL}/api/admin/transaction-logs?page=${page}&size=${size}`, {
      headers: authService.getAuthHeaders()
    });
    return response.json();
  },

  getUserLogs: async (username, page = 0, size = 20) => {
    const response = await fetch(`${API_URL}/api/admin/transaction-logs/user/${username}?page=${page}&size=${size}`, {
      headers: authService.getAuthHeaders()
    });
    return response.json();
  },

  getUserStatistics: async () => {
    const response = await fetch(`${API_URL}/api/admin/transaction-logs/statistics/users`, {
      headers: authService.getAuthHeaders()
    });
    return response.json();
  }
};

export default transactionLogService;