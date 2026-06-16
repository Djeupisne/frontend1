const API_URL = 'http://localhost:8080';

const authService = {
  login: async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        },
      });

      if (response.ok) {
        const data = await response.json();
        const credentials = btoa(`${username}:${password}`);
        localStorage.setItem('authCredentials', credentials);
        localStorage.setItem('username', username);

        const roles = data.roles || [];
        const isAdmin = roles.includes('ROLE_ADMIN');
        localStorage.setItem('userRole', isAdmin ? 'ADMIN' : 'USER');

        return true;
      } else if (response.status === 401) {
        // ✅ Lire le message texte du backend
        const errorMessage = await response.text();

        // ✅ Vérifier si le message indique un compte désactivé
        if (errorMessage && (errorMessage.includes('désactivé') || errorMessage.includes('disabled'))) {
          throw new Error('Votre compte a été désactivé. Veuillez contacter l\'administrateur.');
        } else {
          throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
        }
      }
      return false;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('authCredentials');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authCredentials');
  },

  getAuthHeaders: () => {
    const credentials = localStorage.getItem('authCredentials');
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  },

  getUsername: () => {
    return localStorage.getItem('username') || 'Admin';
  },

  getUserRole: () => {
    return localStorage.getItem('userRole') || 'USER';
  },

  isAdmin: () => {
    return authService.getUserRole() === 'ADMIN';
  },

  forgotPassword: async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      return { success: response.ok, message: data.message };
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  },

  validateResetToken: async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password/validate?token=${token}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      return { valid: response.ok, ...data };
    } catch (error) {
      console.error('Erreur lors de la validation du token:', error);
      return { valid: false, error: 'Erreur de connexion au serveur' };
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();
      return { success: response.ok, message: data.message, error: data.error };
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      return { success: false, error: 'Erreur de connexion au serveur' };
    }
  },
};

export default authService;