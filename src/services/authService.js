const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

//  Gestionnaire de sessions multiples
class SessionManager {
  // Générer un ID de session unique
  static generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Récupérer l'ID de session courant (ou en créer un nouveau)
  static getCurrentSessionId() {
    let sessionId = sessionStorage.getItem('currentSessionId');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('currentSessionId', sessionId);
    }
    return sessionId;
  }

  // Créer une nouvelle session (nouvel onglet/onglet)
  static createNewSession() {
    const newSessionId = this.generateSessionId();
    sessionStorage.setItem('currentSessionId', newSessionId);
    return newSessionId;
  }

  // Nettoyer la session courante
  static clearCurrentSession() {
    const sessionId = this.getCurrentSessionId();
    sessionStorage.removeItem(`session_${sessionId}_credentials`);
    sessionStorage.removeItem(`session_${sessionId}_username`);
    sessionStorage.removeItem(`session_${sessionId}_userRole`);
    sessionStorage.removeItem('currentSessionId');
  }

  // Stocker une valeur pour la session courante
  static setItem(key, value) {
    const sessionId = this.getCurrentSessionId();
    sessionStorage.setItem(`session_${sessionId}_${key}`, value);
  }

  // Récupérer une valeur de la session courante
  static getItem(key) {
    const sessionId = this.getCurrentSessionId();
    return sessionStorage.getItem(`session_${sessionId}_${key}`);
  }

  // Supprimer une valeur de la session courante
  static removeItem(key) {
    const sessionId = this.getCurrentSessionId();
    sessionStorage.removeItem(`session_${sessionId}_${key}`);
  }

  // Lister toutes les sessions actives
  static listActiveSessions() {
    const sessions = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('session_')) {
        const sessionId = key.split('_')[1];
        if (!sessions.includes(sessionId)) {
          sessions.push(sessionId);
        }
      }
    }
    return sessions;
  }

  // Changer de session active
  static switchToSession(sessionId) {
    if (this.sessionExists(sessionId)) {
      sessionStorage.setItem('currentSessionId', sessionId);
      return true;
    }
    return false;
  }

  // Vérifier si une session existe
  static sessionExists(sessionId) {
    return sessionStorage.getItem(`session_${sessionId}_username`) !== null;
  }

  // Supprimer une session spécifique
  static deleteSession(sessionId) {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(`session_${sessionId}_`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  }
}

const authService = {
  // Connexion avec création de session
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
        
        //  Créer une nouvelle session pour cet utilisateur
        SessionManager.createNewSession();
        
        // Stocker les informations de l'utilisateur dans sa session
        SessionManager.setItem('authCredentials', credentials);
        SessionManager.setItem('username', username);

        const roles = data.roles || [];
        const isAdmin = roles.includes('ROLE_ADMIN');
        SessionManager.setItem('userRole', isAdmin ? 'ADMIN' : 'USER');
        
        // Stocker aussi l'heure de connexion
        SessionManager.setItem('loginTime', new Date().toISOString());

        console.log(` Utilisateur ${username} connecté (session: ${SessionManager.getCurrentSessionId()})`);
        return true;
        
      } else if (response.status === 401) {
        const errorMessage = await response.text();
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

  // Déconnexion (session courante uniquement)
  logout: () => {
    const username = SessionManager.getItem('username');
    console.log(`👋 Utilisateur ${username} déconnecté`);
    SessionManager.clearCurrentSession();
  },

  // Déconnexion de toutes les sessions (admin)
  logoutAllSessions: () => {
    const sessions = SessionManager.listActiveSessions();
    sessions.forEach(sessionId => {
      SessionManager.deleteSession(sessionId);
    });
    sessionStorage.clear();
    console.log(` Toutes les sessions ont été supprimées (${sessions.length} session(s))`);
  },

  // Vérifier si l'utilisateur est authentifié dans la session courante
  isAuthenticated: () => {
    return !!SessionManager.getItem('authCredentials');
  },

  // Récupérer les headers d'authentification
  getAuthHeaders: () => {
    const credentials = SessionManager.getItem('authCredentials');
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  },

  // Récupérer le nom d'utilisateur de la session courante
  getUsername: () => {
    return SessionManager.getItem('username') || 'Invité';
  },

  // Récupérer le rôle de la session courante
  getUserRole: () => {
    return SessionManager.getItem('userRole') || 'USER';
  },

  // Vérifier si l'utilisateur est admin
  isAdmin: () => {
    return authService.getUserRole() === 'ADMIN';
  },

  //  Gestion multi-sessions : fonctions supplémentaires
  
  // Lister les sessions actives (pour debug/admin)
  getActiveSessions: () => {
    const sessions = SessionManager.listActiveSessions();
    const sessionsInfo = [];
    
    sessions.forEach(sessionId => {
      // Récupérer les infos de chaque session sans changer la session courante
      const username = sessionStorage.getItem(`session_${sessionId}_username`);
      const loginTime = sessionStorage.getItem(`session_${sessionId}_loginTime`);
      const isCurrent = (sessionId === SessionManager.getCurrentSessionId());
      
      sessionsInfo.push({
        sessionId,
        username,
        loginTime,
        isCurrent
      });
    });
    
    return sessionsInfo;
  },

  // Changer de session utilisateur (onglet actif)
  switchToSession: (sessionId) => {
    if (SessionManager.switchToSession(sessionId)) {
      console.log(`🔄 Changé vers session: ${sessionId}`);
      return true;
    }
    return false;
  },

  // Nouvelle session dans l'onglet courant
  newSession: () => {
    SessionManager.createNewSession();
    console.log(`🆕 Nouvelle session créée: ${SessionManager.getCurrentSessionId()}`);
  },

  // Obtenir l'ID de la session courante
  getCurrentSessionId: () => {
    return SessionManager.getCurrentSessionId();
  },

  // Forgot password (inchangé)
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

  // Validate reset token (inchangé)
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

  // Reset password (inchangé)
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