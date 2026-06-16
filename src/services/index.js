import api from './api';

/**
 * Service d'authentification
 */
export const authService = {
  /**
   * Connexion avec identifiants admin
   */
  login: async (username, password) => {
    // Pour Basic Auth Spring Security
    const credentials = btoa(`${username}:${password}`);
    
    // Tester les credentials en appelant un endpoint protégé
    try {
      const response = await api.get('/admin/clients', {
        headers: {
          Authorization: `Basic ${credentials}`
        }
      });
      
      // Stocker les credentials pour les requêtes futures
      localStorage.setItem('credentials', credentials);
      localStorage.setItem('username', username);
      localStorage.setItem('role', 'ADMIN');
      
      return { success: true, user: { username, role: 'ADMIN' } };
    } catch (error) {
      if (error.response?.status === 401) {
        return { success: false, message: 'Identifiants invalides' };
      }
      return { success: false, message: 'Erreur de connexion' };
    }
  },

  /**
   * Déconnexion
   */
  logout: () => {
    localStorage.removeItem('credentials');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
  },

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('credentials');
  },

  /**
   * Récupérer l'utilisateur connecté
   */
  getCurrentUser: () => {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    return username ? { username, role } : null;
  }
};

/**
 * Service des transactions
 */
export const transactionService = {
  /**
   * Récupérer toutes les transactions avec pagination et filtres
   */
  getAllTransactions: async (params = {}) => {
    const response = await api.get('/admin/transactions', { params });
    return response.data;
  },

  /**
   * Récupérer une transaction par ID
   */
  getTransactionById: async (id) => {
    const response = await api.get(`/admin/transactions/${id}`);
    return response.data;
  },

  /**
   * Récupérer les statistiques de transactions
   */
  getTransactionStats: async (startDate, endDate) => {
    const response = await api.get('/admin/transactions/stats', {
      params: { startDate, endDate }
    });
    return response.data;
  }
};

/**
 * Service des clients
 */
export const clientService = {
  /**
   * Récupérer tous les clients
   */
  getAllClients: async () => {
    const response = await api.get('/admin/clients');
    return response.data;
  },

  /**
   * Récupérer un client par ID
   */
  getClientById: async (id) => {
    const response = await api.get(`/admin/clients/${id}`);
    return response.data;
  },

  /**
   * Récupérer les comptes d'un client
   */
  getClientAccounts: async (clientId) => {
    const response = await api.get(`/admin/clients/${clientId}/accounts`);
    return response.data;
  }
};

/**
 * Service des comptes
 */
export const accountService = {
  /**
   * Récupérer tous les comptes
   */
  getAllAccounts: async () => {
    const response = await api.get('/admin/accounts');
    return response.data;
  },

  /**
   * Récupérer un compte par ID
   */
  getAccountById: async (id) => {
    const response = await api.get(`/admin/accounts/${id}`);
    return response.data;
  },

  /**
   * Récupérer les transactions d'un compte
   */
  getAccountTransactions: async (accountId, limit = 50) => {
    const response = await api.get(`/admin/accounts/${accountId}/transactions`, {
      params: { limit }
    });
    return response.data;
  }
};

/**
 * Service des logs SMS
 */
export const smsLogService = {
  /**
   * Récupérer tous les logs SMS
   */
  getAllSmsLogs: async (params = {}) => {
    const response = await api.get('/admin/sms-logs', { params });
    return response.data;
  },

  /**
   * Récupérer les statistiques SMS
   */
  getSmsStats: async (startDate, endDate) => {
    const response = await api.get('/admin/sms-logs/stats', {
      params: { startDate, endDate }
    });
    return response.data;
  }
};

/**
 * Service du tableau de bord
 */
export const dashboardService = {
  /**
   * Récupérer les statistiques globales du dashboard
   */
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  /**
   * Récupérer les dernières activités
   */
  getRecentActivities: async (limit = 10) => {
    const response = await api.get('/admin/dashboard/activities', {
      params: { limit }
    });
    return response.data;
  }
};
