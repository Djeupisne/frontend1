import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import Pagination from '../components/Pagination';

const API_URL = 'http://localhost:8080';

// Normalisation robuste des types
const normalizeType = (type) => {
  if (!type) return '';
  return type.toString().toUpperCase().replace(/[\s-]/g, '_');
};

const getTypeLabel = (type) => {
  const t = normalizeType(type);
  if (t === 'DEBIT_MOBILE_MONEY' || t === 'MOBILE_MONEY') return 'Transfert Mobile Money';
  if (t === 'VIREMENT_INTERNE' || t === 'INTERNAL_TRANSFER') return 'Virement Interne';
  if (t === 'DEBIT' || t === 'DEBIT_MANUEL') return 'Débit Manuel';
  if (t === 'CREDIT' || t === 'CREDIT_MANUEL') return 'Crédit Manuel';
  if (t === 'CREDIT_FEES') return 'Frais (10%)';
  if (t === 'CREDIT_COMPENSATION') return 'Compensation';
  return type?.toString().toUpperCase() || 'N/A';
};

const getTypeColor = (type) => {
  const t = normalizeType(type);
  if (t === 'DEBIT_MOBILE_MONEY' || t === 'MOBILE_MONEY') return 'debit-mobile-money';
  if (t === 'VIREMENT_INTERNE' || t === 'INTERNAL_TRANSFER') return 'virement-interne';
  if (t === 'DEBIT' || t === 'DEBIT_MANUEL') return 'debit-manuel';
  if (t === 'CREDIT' || t === 'CREDIT_MANUEL') return 'credit-manuel';
  if (t === 'CREDIT_FEES') return 'credit-fees';
  return '';
};

const isFeesTransaction = (type) => {
  const t = normalizeType(type);
  return t === 'CREDIT_FEES';
};

const isMobileMoneyTransaction = (type) => {
  const t = normalizeType(type);
  return t === 'DEBIT_MOBILE_MONEY';
};

const isInternalTransfer = (type) => {
  const t = normalizeType(type);
  return t === 'VIREMENT_INTERNE';
};

const getNetAmount = (transaction, allTransactions = []) => {
  const type = normalizeType(transaction.type);

  if (isMobileMoneyTransaction(type)) {
    const feesTransaction = allTransactions.find(t =>
      isFeesTransaction(t.type) && t.reference === transaction.reference
    );
    if (feesTransaction && feesTransaction.amount) {
      return transaction.amount - feesTransaction.amount;
    }
    return transaction.amount;
  }

  if (isInternalTransfer(type)) {
    return transaction.amount;
  }

  if (isFeesTransaction(type)) {
    return 0;
  }

  return transaction.amount;
};

const getFeeAmount = (transaction, allTransactions = []) => {
  const type = normalizeType(transaction.type);

  if (isMobileMoneyTransaction(type)) {
    const feesTransaction = allTransactions.find(t =>
      isFeesTransaction(t.type) && t.reference === transaction.reference
    );
    return feesTransaction ? feesTransaction.amount : 0;
  }

  if (isInternalTransfer(type)) {
    const feesTransaction = allTransactions.find(t =>
      isFeesTransaction(t.type) && t.reference === transaction.reference
    );
    return feesTransaction ? feesTransaction.amount : 0;
  }

  if (isFeesTransaction(type)) {
    return transaction.amount;
  }

  return 0;
};

const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0 FCFA';
  const value = amount.toLocaleString('fr-FR');
  return `${value} FCFA`;
};

const formatAccountNumber = (accountNumber) => {
  if (!accountNumber) return 'N/A';
  return accountNumber.replace(/_/g, ' ');
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalAccounts: 0,
    totalTransactions: 0,
    totalAmount: 0,
  });
  const [allTransactions, setAllTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [calculatedFees, setCalculatedFees] = useState(0);
  const [totalAmountWithFees, setTotalAmountWithFees] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [transactionForm, setTransactionForm] = useState({
    transferType: 'internal-from-phone',
    sourceAccount: '',
    sourcePhone: '',
    targetAccount: '',
    targetPhone: '',
    amount: '',
    description: '',
  });
  const [transactionMessage, setTransactionMessage] = useState({ type: '', text: '' });

  const isAdmin = authService.isAdmin();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  const handleApiError = (response, defaultMessage) => {
    if (response.status === 401 || response.status === 403) {
      setError({
        type: 'auth',
        message: 'Votre session a expiré ou vous n\'avez pas les autorisations nécessaires. Veuillez vous reconnecter.',
        action: 'logout'
      });
      return true;
    }
    if (response.status === 500) {
      setError({
        type: 'server',
        message: 'Erreur serveur. Veuillez réessayer plus tard ou contacter l\'administrateur.',
        action: 'retry'
      });
      return true;
    }
    setError({
      type: 'error',
      message: defaultMessage || 'Une erreur est survenue. Veuillez réessayer.',
      action: 'retry'
    });
    return false;
  };

  const calculateFees = (amount) => {
    const amountValue = parseFloat(amount) || 0;
    const fees = Math.ceil(amountValue * 0.1);
    const total = amountValue + fees;
    setCalculatedFees(fees);
    setTotalAmountWithFees(total);
    return { fees, total };
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = authService.getAuthHeaders();

      if (!headers || !headers.Authorization) {
        setError({
          type: 'auth',
          message: 'Session invalide. Veuillez vous reconnecter.',
          action: 'logout'
        });
        setIsLoading(false);
        return;
      }

      const accountsPromise = isAdmin
        ? fetch(`${API_URL}/api/dashboard/accounts`, { headers })
        : Promise.resolve({ ok: true, json: () => Promise.resolve([]) });

      const [clientsRes, accountsRes, transactionsRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/clients`, { headers }),
        accountsPromise,
        fetch(`${API_URL}/api/dashboard/transactions`, { headers }),
      ]);

      if (clientsRes.status === 401 || clientsRes.status === 403) {
        handleApiError(clientsRes);
        setIsLoading(false);
        return;
      }

      if (!clientsRes.ok) {
        throw new Error(`Erreur ${clientsRes.status}: ${clientsRes.statusText}`);
      }

      const clients = await clientsRes.json();
      const accounts = accountsRes.ok ? await accountsRes.json() : [];

      let transactions = [];
      if (transactionsRes.ok) {
        transactions = await transactionsRes.json();
      } else if (transactionsRes.status === 401 || transactionsRes.status === 403) {
        handleApiError(transactionsRes);
        setIsLoading(false);
        return;
      }

      const sortedTransactions = [...transactions].sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        return (b.id || 0) - (a.id || 0);
      });

      setAllTransactions(sortedTransactions);
      setCurrentPage(1);

      const totalAmount = transactions
        .filter(t => isAdmin || !isFeesTransaction(t.type))
        .reduce((sum, t) => {
          if (isFeesTransaction(t.type)) return sum;
          return sum + getNetAmount(t, transactions);
        }, 0);

      setStats({
        totalClients: Array.isArray(clients) ? clients.length : 0,
        totalAccounts: Array.isArray(accounts) ? accounts.length : 0,
        totalTransactions: Array.isArray(transactions) ? transactions.length : 0,
        totalAmount,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError({
        type: 'error',
        message: 'Impossible de charger les données. Vérifiez votre connexion ou réessayez plus tard.',
        action: 'retry'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setTransactionMessage({ type: '', text: '' });

    const amountValue = parseFloat(transactionForm.amount);
    if (amountValue < 1) {
      setTransactionMessage({ type: 'error', text: 'Le montant minimum est de 1 FCFA' });
      return;
    }
    if (amountValue > 500000) {
      setTransactionMessage({ type: 'error', text: 'Le montant maximum est de 500 000 FCFA' });
      return;
    }

    const fees = Math.ceil(amountValue * 0.1);
    const totalAmount = amountValue + fees;

    try {
      const headers = {
        ...authService.getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      let endpoint = '';
      let payload = {};

      if (transactionForm.transferType === 'internal-from-phone') {
        if (!transactionForm.sourcePhone) {
          setTransactionMessage({ type: 'error', text: 'Veuillez saisir votre numéro de téléphone Orabank' });
          return;
        }
        if (!transactionForm.targetAccount) {
          setTransactionMessage({ type: 'error', text: 'Veuillez saisir le compte bénéficiaire' });
          return;
        }
        endpoint = `${API_URL}/api/transfers/internal/from-phone`;
        payload = {
          sourcePhone: transactionForm.sourcePhone,
          targetAccountNumber: transactionForm.targetAccount,
          amount: amountValue,
          description: transactionForm.description || 'Virement interne depuis téléphone',
        };
      }
      else if (transactionForm.transferType === 'mobile-from-account') {
        if (!transactionForm.sourceAccount) {
          setTransactionMessage({ type: 'error', text: 'Veuillez saisir le numéro de compte source' });
          return;
        }
        if (!transactionForm.targetPhone) {
          setTransactionMessage({ type: 'error', text: 'Veuillez saisir le numéro de téléphone du destinataire' });
          return;
        }
        endpoint = `${API_URL}/api/transfers/mobile-money/from-account`;
        payload = {
          accountNumber: transactionForm.sourceAccount,
          amount: amountValue,
          recipientPhone: transactionForm.targetPhone,
          description: transactionForm.description || 'Transfert Mobile Money',
        };
      }
      else if (transactionForm.transferType === 'mobile-from-phone') {
        if (!transactionForm.sourcePhone) {
          setTransactionMessage({ type: 'error', text: 'Veuillez saisir votre numéro de téléphone Orabank' });
          return;
        }
        if (!transactionForm.targetPhone) {
          setTransactionMessage({ type: 'error', text: 'Veuillez saisir le numéro de téléphone du destinataire' });
          return;
        }
        endpoint = `${API_URL}/api/transfers/mobile-money/from-phone`;
        payload = {
          sourcePhone: transactionForm.sourcePhone,
          amount: amountValue,
          recipientPhone: transactionForm.targetPhone,
          description: transactionForm.description || 'Transfert Mobile Money',
        };
      }
      else if (transactionForm.transferType === 'credit' && isAdmin) {
        if (!transactionForm.targetAccount) {
          setTransactionMessage({ type: 'error', text: 'Veuillez saisir le compte bénéficiaire' });
          return;
        }
        endpoint = `${API_URL}/api/admin/accounts/credit`;
        payload = {
          accountNumber: transactionForm.targetAccount,
          amount: amountValue,
          description: transactionForm.description || 'Crédit manuel',
        };
      } else if (transactionForm.transferType === 'debit' && isAdmin) {
        if (!transactionForm.sourcePhone) {
          setTransactionMessage({ type: 'error', text: 'Veuillez saisir le numéro de téléphone du client' });
          return;
        }
        endpoint = `${API_URL}/api/admin/accounts/debit-from-phone`;
        payload = {
          phoneNumber: transactionForm.sourcePhone,
          amount: amountValue,
          description: transactionForm.description || 'Débit manuel',
        };
      } else {
        setTransactionMessage({ type: 'error', text: 'Type de transaction non supporté' });
        return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (response.status === 401 || response.status === 403) {
        setTransactionMessage({
          type: 'error',
          text: 'Session expirée ou autorisation insuffisante. Veuillez vous reconnecter.'
        });
        setTimeout(() => {
          authService.logout();
          window.location.href = '/login';
        }, 2000);
        return;
      }

      const data = await response.json();

      if (response.ok && (data.success !== false)) {
        let successMessage = '';

        if (transactionForm.transferType === 'internal-from-phone') {
          successMessage = `Virement Interne effectué avec succès !\n Montant envoyé: ${amountValue.toLocaleString('fr-FR')} FCFA\n Frais (10%): ${fees.toLocaleString('fr-FR')} FCFA\n Total débité: ${totalAmount.toLocaleString('fr-FR')} FCFA\n De: ${transactionForm.sourcePhone}\n Vers: ${transactionForm.targetAccount}`;
        }
        else if (transactionForm.transferType === 'mobile-from-account') {
          successMessage = `Transfert Mobile Money effectué avec succès !\n Montant envoyé: ${amountValue.toLocaleString('fr-FR')} FCFA\n Frais (10%): ${fees.toLocaleString('fr-FR')} FCFA\n Total débité: ${totalAmount.toLocaleString('fr-FR')} FCFA\n Depuis: ${transactionForm.sourceAccount}\n Vers: ${transactionForm.targetPhone}`;
        }
        else if (transactionForm.transferType === 'mobile-from-phone') {
          successMessage = `Transfert Mobile Money effectué avec succès !\n Montant envoyé: ${amountValue.toLocaleString('fr-FR')} FCFA\n Frais (10%): ${fees.toLocaleString('fr-FR')} FCFA\n Total débité: ${totalAmount.toLocaleString('fr-FR')} FCFA\n De: ${transactionForm.sourcePhone}\n Vers: ${transactionForm.targetPhone}`;
        }
        else if (transactionForm.transferType === 'credit') {
          successMessage = `Crédit Manuel effectué avec succès !\n➕ Montant crédité: ${amountValue.toLocaleString('fr-FR')} FCFA\n Compte: ${transactionForm.targetAccount}`;
        }
        else if (transactionForm.transferType === 'debit') {
          successMessage = `Débit Manuel effectué avec succès !\n➖ Montant débité: ${amountValue.toLocaleString('fr-FR')} FCFA\n Téléphone: ${transactionForm.sourcePhone}`;
        }

        setTransactionMessage({ type: 'success', text: successMessage });
        setTransactionForm({
          transferType: 'internal-from-phone',
          sourceAccount: '',
          sourcePhone: '',
          targetAccount: '',
          targetPhone: '',
          amount: '',
          description: '',
        });
        setCalculatedFees(0);
        setTotalAmountWithFees(0);
        setTimeout(() => {
          setShowTransactionModal(false);
          fetchDashboardData();
        }, 4000);
      } else {
        setTransactionMessage({
          type: 'error',
          text: data.message || data.error || 'Erreur lors de la transaction'
        });
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      setTransactionMessage({
        type: 'error',
        text: 'Erreur de connexion au serveur. Vérifiez votre connexion internet.'
      });
    }
  };

  // Calcul des transactions paginées directement
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = allTransactions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(allTransactions.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div className={`error-card error-${error.type}`}>
          <div className="error-icon">
            {error.type === 'auth' ? '🔒' : '⚠️'}
          </div>
          <h3>Erreur de chargement</h3>
          <p>{error.message}</p>
          <div className="error-actions">
            {error.action === 'logout' && (
              <button onClick={handleLogout} className="btn-logout">
                Se reconnecter
              </button>
            )}
            {error.action === 'retry' && (
              <button onClick={fetchDashboardData} className="btn-retry">
                Réessayer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble de l'activité bancaire</p>
      </div>

      <div className="action-bar">
        <button
          className="btn-new-transaction"
          onClick={() => setShowTransactionModal(true)}
          title="Effectuer une transaction"
        >
          <PlusIcon />
          Nouvelle Transaction
        </button>

        {isAdmin && (
          <Link to="/admin/users" className="btn-admin-users" title="Gérer les utilisateurs du système">
            <UsersIcon /> Gérer les utilisateurs
          </Link>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-clients">
          <div className="stat-header">
            <div className="stat-icon-wrapper icon-blue">
              <UsersIcon />
            </div>
            <span className="stat-label">Clients</span>
          </div>
          <div className="stat-value">{stats.totalClients}</div>
          <Link to="/clients" className="stat-link">Voir tout →</Link>
          <div className="stat-decoration"></div>
        </div>

        {isAdmin && (
          <div className="stat-card stat-accounts">
            <div className="stat-header">
              <div className="stat-icon-wrapper icon-green">
                <AccountIcon />
              </div>
              <span className="stat-label">Comptes</span>
            </div>
            <div className="stat-value">{stats.totalAccounts}</div>
            <Link to="/accounts" className="stat-link">Voir tout →</Link>
            <div className="stat-decoration"></div>
          </div>
        )}

        <div className="stat-card stat-transactions">
          <div className="stat-header">
            <div className="stat-icon-wrapper icon-purple">
              <TransactionIcon />
            </div>
            <span className="stat-label">Transactions</span>
          </div>
          <div className="stat-value">{stats.totalTransactions}</div>
          <Link to="/transactions" className="stat-link">Voir tout →</Link>
          <div className="stat-decoration"></div>
        </div>

        <div className="stat-card stat-amount">
          <div className="stat-header">
            <div className="stat-icon-wrapper icon-orange">
              <MoneyIcon />
            </div>
            <span className="stat-label">Volume total</span>
          </div>
          <div className="stat-value amount-value">
            {stats.totalAmount.toLocaleString('fr-FR')} <span className="currency">FCFA</span>
          </div>
          <Link to="/transactions" className="stat-link">Voir détails →</Link>
          <div className="stat-decoration"></div>
        </div>
      </div>

      <div className="recent-activity">
        <div className="section-header">
          <h2>Transactions récentes</h2>
          <Link to="/transactions" className="view-all">Voir toutes les transactions →</Link>
        </div>

        <div className="transactions-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Compte</th>
                <th>Type</th>
                <th>Montant envoyé</th>
                {isAdmin && <th>Frais (10%)</th>}
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((transaction) => {
                  const type = normalizeType(transaction.type);
                  const isFees = isFeesTransaction(transaction.type);
                  const netAmount = getNetAmount(transaction, allTransactions);
                  const feeAmount = getFeeAmount(transaction, allTransactions);

                  if (!isAdmin && isFees) return null;

                  return (
                    <tr key={transaction.id} className="transaction-row">
                      <td className="date-cell">
                        {new Date(transaction.timestamp).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="client-cell">
                        {transaction.clientName || (isFees ? 'Système Bancaire' : 'N/A')}
                        {transaction.clientPhoneNumber && !isFees && (
                          <div className="client-phone">
                            <small className="phone-number"> {transaction.clientPhoneNumber}</small>
                          </div>
                        )}
                      </td>
                      <td className="account-cell">
                        {formatAccountNumber(transaction.accountNumber)}
                      </td>
                      <td className="type-cell">
                        <span className={`type-badge ${getTypeColor(transaction.type)}`}>
                          {getTypeLabel(transaction.type)}
                        </span>
                      </td>
                      <td className="amount-cell">
                        {!isAdmin && isFees ? (
                          <span className="masked-amount">••••</span>
                        ) : isFees ? (
                          <span className="no-amount">-</span>
                        ) : (
                          formatAmount(netAmount)
                        )}
                      </td>
                      {isAdmin && (
                        <td className="fees-cell">
                          {feeAmount > 0 ? (
                            <span className="fees-amount">{formatAmount(feeAmount)}</span>
                          ) : (
                            <span className="no-fees">-</span>
                          )}
                        </td>
                      )}
                      <td className="status-cell">
                        <span className={`status-badge ${transaction.status?.toLowerCase() || ''}`}>
                          {transaction.status === 'COMPLETED' ? 'Complété' :
                           transaction.status === 'PENDING' ? 'En attente' :
                           transaction.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isAdmin ? "7" : "6"} className="no-data">
                    Aucune transaction récente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {allTransactions.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={allTransactions.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
            itemsPerPageOptions={[5, 10, 25, 50]}
          />
        )}
      </div>

      {/* Modal Nouvelle Transaction */}
      {showTransactionModal && (
        <div className="modal-overlay" onClick={() => {
          setShowTransactionModal(false);
          setTransactionMessage({ type: '', text: '' });
          setCalculatedFees(0);
          setTotalAmountWithFees(0);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nouvelle Transaction</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowTransactionModal(false);
                  setTransactionMessage({ type: '', text: '' });
                  setCalculatedFees(0);
                  setTotalAmountWithFees(0);
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleTransactionSubmit} className="transaction-form">
              {transactionMessage.text && (
                <div className={`message-box ${transactionMessage.type}`}>
                  <div className="message-content">
                    {transactionMessage.text.split('\n').map((line, idx) => (
                      <React.Fragment key={idx}>
                        {line}
                        {idx < transactionMessage.text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="transferType">Type de transaction *</label>
                <select
                  id="transferType"
                  value={transactionForm.transferType}
                  onChange={(e) => {
                    setTransactionForm({...transactionForm, transferType: e.target.value});
                    setTransactionMessage({ type: '', text: '' });
                    setCalculatedFees(0);
                    setTotalAmountWithFees(0);
                  }}
                  required
                >
                  <optgroup label="VIREMENT INTERNE (frais: 10%)">
                    <option value="internal-from-phone">Téléphone Orabank → Compte Orabank</option>
                  </optgroup>
                  <optgroup label="TRANSFERT MOBILE MONEY (frais: 10%)">
                    <option value="mobile-from-account">Compte Orabank → Téléphone (Moov/Togocel)</option>
                    <option value="mobile-from-phone">Téléphone Orabank → Téléphone (Moov/Togocel)</option>
                  </optgroup>
                  {isAdmin && (
                    <optgroup label="ADMIN - GESTION MANUELLE">
                      <option value="credit">➕ Crédit Manuel sur Compte</option>
                      <option value="debit">➖ Débit Manuel depuis Téléphone</option>
                    </optgroup>
                  )}
                </select>
                <small className="form-hint">
                  Toutes les transactions sont soumises à des frais de 10%
                </small>
              </div>

              {(transactionForm.transferType === 'internal-from-phone' || transactionForm.transferType === 'mobile-from-phone') && (
                <div className="form-group">
                  <label htmlFor="sourcePhone">Téléphone source (Orabank) *</label>
                  <input
                    type="tel"
                    id="sourcePhone"
                    value={transactionForm.sourcePhone}
                    onChange={(e) => setTransactionForm({...transactionForm, sourcePhone: e.target.value})}
                    placeholder="Ex: +22890000000"
                    required
                  />
                  <small className="form-hint">Votre numéro de téléphone lié à votre compte Orabank</small>
                </div>
              )}

              {transactionForm.transferType === 'mobile-from-account' && (
                <div className="form-group">
                  <label htmlFor="sourceAccount">Compte source *</label>
                  <input
                    type="text"
                    id="sourceAccount"
                    value={transactionForm.sourceAccount}
                    onChange={(e) => setTransactionForm({...transactionForm, sourceAccount: e.target.value})}
                    placeholder="Ex: COMPTE001"
                    required
                  />
                  <small className="form-hint">Numéro de compte Orabank à débiter</small>
                </div>
              )}

              {transactionForm.transferType === 'debit' && (
                <div className="form-group">
                  <label htmlFor="sourcePhone"> Téléphone du client *</label>
                  <input
                    type="tel"
                    id="sourcePhone"
                    value={transactionForm.sourcePhone}
                    onChange={(e) => setTransactionForm({...transactionForm, sourcePhone: e.target.value})}
                    placeholder="Ex: +22890000000"
                    required
                  />
                  <small className="form-hint">Numéro de téléphone du client lié à son compte Orabank</small>
                </div>
              )}

              {(transactionForm.transferType === 'internal-from-phone' || transactionForm.transferType === 'credit') && (
                <div className="form-group">
                  <label htmlFor="targetAccount">
                    {transactionForm.transferType === 'credit' ? 'Compte à créditer *' : 'Compte bénéficiaire *'}
                  </label>
                  <input
                    type="text"
                    id="targetAccount"
                    value={transactionForm.targetAccount}
                    onChange={(e) => setTransactionForm({...transactionForm, targetAccount: e.target.value})}
                    placeholder="Ex: COMPTE002"
                    required
                  />
                  <small className="form-hint">
                    Numéro du compte bancaire Orabank bénéficiaire
                  </small>
                </div>
              )}

              {(transactionForm.transferType === 'mobile-from-account' || transactionForm.transferType === 'mobile-from-phone') && (
                <div className="form-group">
                  <label htmlFor="targetPhone"> Téléphone destinataire *</label>
                  <input
                    type="tel"
                    id="targetPhone"
                    value={transactionForm.targetPhone}
                    onChange={(e) => setTransactionForm({...transactionForm, targetPhone: e.target.value})}
                    placeholder="Ex: +22890000001"
                    required
                  />
                  <small className="form-hint">
                    Numéro Mobile Money du destinataire (Moov Money ou Togocel) au format international
                  </small>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="description">Description (optionnel)</label>
                <input
                  type="text"
                  id="description"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                  placeholder="Ex: Virement salaire, Transfert famille, Paiement..."
                />
                <small className="form-hint">Description visible dans l'historique</small>
              </div>

              <div className="form-group">
                <label htmlFor="amount">Montant à envoyer (FCFA) *</label>
                <input
                  type="number"
                  id="amount"
                  value={transactionForm.amount}
                  onChange={(e) => {
                    setTransactionForm({...transactionForm, amount: e.target.value});
                    calculateFees(e.target.value);
                  }}
                  placeholder="Ex: 10000"
                  min="1"
                  max="500000"
                  step="1"
                  required
                />
                <small className="form-hint">
                  Montant entre 1 et 500 000 FCFA • Frais de 10% appliqués sur toutes les transactions
                </small>

                {transactionForm.amount && parseFloat(transactionForm.amount) > 0 && (
                  <div className="fees-preview">
                    <div className="fees-detail">
                      <span>Montant envoyé :</span>
                      <strong>{parseFloat(transactionForm.amount).toLocaleString('fr-FR')} FCFA</strong>
                    </div>
                    <div className="fees-detail">
                      <span>Frais (10%) :</span>
                      <strong className="fees-amount">{calculatedFees.toLocaleString('fr-FR')} FCFA</strong>
                    </div>
                    <div className="total-detail">
                      <span>Total à débiter :</span>
                      <strong>{totalAmountWithFees.toLocaleString('fr-FR')} FCFA</strong>
                    </div>
                    <small className="form-hint-info">
                      ✓ Le bénéficiaire recevra exactement {parseFloat(transactionForm.amount).toLocaleString('fr-FR')} FCFA
                    </small>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowTransactionModal(false);
                    setTransactionMessage({ type: '', text: '' });
                    setCalculatedFees(0);
                    setTotalAmountWithFees(0);
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-submit">
                  {transactionForm.transferType === 'internal-from-phone' && ' Effectuer le Virement (Téléphone → Compte)'}
                  {transactionForm.transferType === 'mobile-from-account' && ' Effectuer le Transfert (Compte → Téléphone)'}
                  {transactionForm.transferType === 'mobile-from-phone' && ' Effectuer le Transfert (Téléphone → Téléphone)'}
                  {transactionForm.transferType === 'credit' && '➕ Effectuer le Crédit'}
                  {transactionForm.transferType === 'debit' && '➖ Effectuer le Débit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Icônes SVG
const PlusIcon = () => (
  <svg className="btn-plus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const UsersIcon = () => (
  <svg className="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const AccountIcon = () => (
  <svg className="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);

const TransactionIcon = () => (
  <svg className="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

const MoneyIcon = () => (
  <svg className="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

export default Dashboard;