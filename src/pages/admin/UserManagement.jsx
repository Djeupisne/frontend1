import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';

const API_URL = import.meta.env.VITE_API_URL || 'https://sms-banking-pjcp.onrender.com';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'USER'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: authService.getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setSuccessMessage('Utilisateur créé avec succès !');
        setShowCreateModal(false);
        setNewUser({ username: '', password: '', fullName: '', email: '', role: 'USER' });
        fetchUsers();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Erreur lors de la création de l\'utilisateur');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/status?active=${!currentStatus}`, {
        method: 'PUT',
        headers: authService.getAuthHeaders()
      });

      if (response.ok) {
        const newStatus = !currentStatus;
        setSuccessMessage(newStatus ? 'Utilisateur activé avec succès' : 'Utilisateur désactivé avec succès');
        fetchUsers();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut');
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders()
      });

      if (response.ok) {
        setSuccessMessage('Utilisateur supprimé avec succès');
        fetchUsers();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError('Erreur lors de la suppression');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="user-management-page">
      <div className="page-header action-bar">
        <div>
          <h1>Gestion des Utilisateurs</h1>
          <p>Créez, activez ou désactivez les accès au tableau de bord</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Créer un utilisateur
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="card data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nom d'utilisateur</th>
              <th>Nom complet</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Dernière connexion</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">Aucun utilisateur trouvé</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td className="font-medium">{user.username}</td>
                  <td>{user.fullName}</td>
                  <td>{user.email || '-'}</td>
                  <td>
                    <span className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
                      {user.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-indicator ${user.active ? 'status-active' : 'status-inactive'}`}>
                      {user.active ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td>
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Jamais connecté'}
                  </td>
                  <td className="text-right actions-cell">
                    <button
                      className={`btn btn-sm ${user.active ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => toggleUserStatus(user.id, user.active)}
                      title={user.active ? "Désactiver l'accès" : "Réactiver l'accès"}
                    >
                      {user.active ? '🔒 Désactiver' : '🔓 Activer'}
                    </button>
                    {user.role !== 'ADMIN' && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteUser(user.id)}
                        title="Supprimer définitivement"
                      >
                        🗑️ Supprimer
                      </button>
                    )}
                    {user.role === 'ADMIN' && (
                      <span className="badge badge-admin">Protégé</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Créer un nouvel utilisateur</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateUser} className="modal-form">
              <div className="form-group">
                <label htmlFor="username">Nom d'utilisateur *</label>
                <input
                  type="text"
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="ex: j.dupont"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Mot de passe *</label>
                <input
                  type="password"
                  id="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Minimum 6 caractères"
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="fullName">Nom complet *</label>
                <input
                  type="text"
                  id="fullName"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                  placeholder="ex: Jean Dupont"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="ex: jean.dupont@orabank.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Rôle *</label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="USER">Utilisateur (Lecture + Transactions)</option>
                  <option value="ADMIN">Administrateur (Accès complet)</option>
                </select>
                <small className="form-hint">Le rôle détermine les fonctionnalités accessibles.</small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Création en cours...' : 'Créer l\'utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;