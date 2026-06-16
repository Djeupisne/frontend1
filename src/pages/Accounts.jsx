import React, { useState, useEffect } from 'react';
import authService from '../services/authService';

const API_URL = import.meta.env.VITE_API_URL || 'https://sms-orabank-backend.onrender.com';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const headers = authService.getAuthHeaders();
      const response = await fetch(`${API_URL}/api/accounts`, { headers });
      const data = await response.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Nettoyer le numéro de compte (enlever les underscores si nécessaire)
  const formatAccountNumber = (accountNumber) => {
    if (!accountNumber) return 'N/A';
    // Remplacer les underscores par des espaces ou les garder selon préférence
    return accountNumber.replace(/_/g, ' ');
  };

  const filteredAccounts = accounts.filter((account) => {
    if (searchTerm === '') return true;
    const search = searchTerm.toLowerCase();
    return (
      account.accountNumber?.toLowerCase().includes(search) ||
      account.clientName?.toLowerCase().includes(search) ||
      account.clientPhoneNumber?.toLowerCase().includes(search)
    );
  });

  const getAccountTypeBadge = (account) => {
    if (account.systemAccount) return 'system';
    switch (account.type?.toLowerCase()) {
      case 'checking': return 'checking';
      case 'savings': return 'savings';
      case 'current': return 'current';
      default: return '';
    }
  };

  const getTypeLabel = (account) => {
    if (account.systemAccount) return 'Frais';
    switch (account.type?.toUpperCase()) {
      case 'CHECKING': return 'Courant';
      case 'SAVINGS': return 'Épargne';
      case 'CURRENT': return 'Courant';
      default: return account.type || 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Chargement des comptes...</p>
      </div>
    );
  }

  return (
    <div className="accounts-page">
      <div className="page-header">
        <h1>Gestion des comptes</h1>
        <p>Tous les comptes bancaires enregistrés</p>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher par numéro de compte ou client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="accounts-table">
        <table>
          <thead>
            <tr>
              <th>Numéro de compte</th>
              <th>Client</th>
              <th>Type</th>
              <th>Solde</th>
              <th>Devise</th>
              <th>Date d'ouverture</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((account) => (
                <tr key={account.id} className={account.systemAccount ? 'system-account-row' : ''}>
                  <td className="account-number">
                    {account.systemAccount ? (
                      <span className="system-account-number">
                        {formatAccountNumber(account.accountNumber)}
                      </span>
                    ) : (
                      account.accountNumber || 'N/A'
                    )}
                   </td>
                  <td>
                    {account.systemAccount ? (
                      <div className="system-client">
                        <span className="system-label">Système</span>
                        <span className="system-sub">{account.description || 'Compte de frais'}</span>
                      </div>
                    ) : (
                      <div className="client-info">
                        <div>{account.clientName || 'N/A'}</div>
                        {account.clientPhoneNumber && account.clientPhoneNumber !== 'N/A' && (
                          <div className="client-phone">{account.clientPhoneNumber}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`type-badge ${getAccountTypeBadge(account)}`}>
                      {getTypeLabel(account)}
                    </span>
                  </td>
                  <td className="amount-cell">
                    <span className={account.systemAccount ? 'fees-amount' : ''}>
                      {account.balance?.toLocaleString('fr-FR') || 0}
                    </span>
                  </td>
                  <td>{account.currency || 'XOF'}</td>
                  <td>
                    {account.createdAt
                      ? new Date(account.createdAt).toLocaleDateString('fr-FR')
                      : 'N/A'
                    }
                  </td>
                  <td>
                    <span className={`status-badge ${account.status?.toLowerCase() || ''}`}>
                      {account.status === 'ACTIVE' ? 'Actif' :
                       account.status === 'INACTIVE' ? 'Inactif' :
                       account.status || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">Aucun compte trouvé</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <p>{filteredAccounts.length} compte(s) affiché(s) sur {accounts.length} au total</p>
      </div>
    </div>
  );
};

export default Accounts;