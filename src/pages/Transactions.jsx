import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import Pagination from '../components/Pagination';


const API_URL = import.meta.env.VITE_API_URL || 'https://sms-banking-pjcp.onrender.com';

// Normalisation robuste des types
const normalizeType = (type) => {
  if (!type) return '';
  return type.toString().toUpperCase().replace(/[\s-]/g, '_');
};

const getTypeLabel = (type) => {
  const t = normalizeType(type);
  if (t === 'DEBIT_MOBILE_MONEY') return 'Transfert Mobile Money';
  if (t === 'VIREMENT_INTERNE' || t === 'INTERNAL_TRANSFER') return 'Virement Interne';
  if (t === 'DEBIT' || t === 'DEBIT_MANUEL') return 'Débit Manuel';
  if (t === 'CREDIT' || t === 'CREDIT_MANUEL') return 'Crédit Manuel';
  if (t === 'CREDIT_FEES') return 'Frais Mobile Money';
  if (t === 'CREDIT_COMPENSATION') return 'Compensation';
  return type?.toString().toUpperCase() || 'N/A';
};

const getTypeColor = (type) => {
  const t = normalizeType(type);
  if (t === 'DEBIT_MOBILE_MONEY') return 'debit-mobile-money';
  if (t === 'VIREMENT_INTERNE' || t === 'INTERNAL_TRANSFER') return 'virement-interne';
  if (t === 'DEBIT' || t === 'DEBIT_MANUEL') return 'debit-manuel';
  if (t === 'CREDIT' || t === 'CREDIT_MANUEL') return 'credit-manuel';
  if (t === 'CREDIT_FEES') return 'credit-fees';
  if (t === 'CREDIT_COMPENSATION') return 'credit-compensation';
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

const getFilterValue = (type) => {
  const t = normalizeType(type);
  if (t === 'DEBIT_MOBILE_MONEY') return 'transfert';
  if (t === 'VIREMENT_INTERNE' || t === 'INTERNAL_TRANSFER') return 'virement';
  if (t === 'CREDIT_FEES') return 'frais';
  if (t === 'CREDIT_COMPENSATION') return 'compensation';
  return 'other';
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isAdmin = authService.isAdmin();

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, dateFilter, itemsPerPage]);

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  const fetchTransactions = async () => {
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

      const response = await fetch(`${API_URL}/api/dashboard/transactions`, { headers });

      if (response.status === 401 || response.status === 403) {
        setError({
          type: 'auth',
          message: 'Votre session a expiré ou vous n\'avez pas les autorisations nécessaires. Veuillez vous reconnecter.',
          action: 'logout'
        });
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const sortedData = Array.isArray(data) ? [...data].sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        return (b.id || 0) - (a.id || 0);
      }) : [];

      setTransactions(sortedData);
      setAllTransactions(sortedData);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError({
        type: 'error',
        message: 'Impossible de charger les transactions. Vérifiez votre connexion ou réessayez plus tard.',
        action: 'retry'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const type = normalizeType(t.type);

    if (!isAdmin && isFeesTransaction(type)) {
      return false;
    }

    const filterValue = getFilterValue(t.type);
    let matchesTypeFilter = true;

    if (filter === 'all') {
      matchesTypeFilter = true;
    } else if (filter === 'transfert') {
      matchesTypeFilter = filterValue === 'transfert';
    } else if (filter === 'virement') {
      matchesTypeFilter = filterValue === 'virement';
    } else if (filter === 'frais') {
      matchesTypeFilter = filterValue === 'frais';
    } else if (filter === 'compensation') {
      matchesTypeFilter = filterValue === 'compensation';
    }

    let matchesDateFilter = true;
    if (dateFilter !== 'all') {
      const transactionDate = new Date(t.timestamp);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === 'today') {
        const startOfDay = new Date(today);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        matchesDateFilter = transactionDate >= startOfDay && transactionDate <= endOfDay;
      } else if (dateFilter === 'week') {
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        matchesDateFilter = transactionDate >= oneWeekAgo;
      } else if (dateFilter === 'month') {
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        matchesDateFilter = transactionDate >= oneMonthAgo;
      }
    }

    const matchesSearch =
      searchTerm === '' ||
      (t.clientName && t.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.clientPhoneNumber && t.clientPhoneNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.accountNumber && t.accountNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.id && t.id.toString().includes(searchTerm)) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesTypeFilter && matchesDateFilter && matchesSearch;
  });

  // Pagination - calcul direct
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const totalFrais = isAdmin
    ? transactions
        .filter(t => isFeesTransaction(t.type))
        .reduce((sum, t) => sum + (t.amount || 0), 0)
    : 0;

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Chargement des transactions...</p>
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
              <button onClick={fetchTransactions} className="btn-retry">
                Réessayer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1>Historique des transactions</h1>
        <p>Toutes les opérations effectuées</p>
      </div>

      {isAdmin && totalFrais > 0 && (
        <div className="stats-row">
          <div className="stat-fees-card">
            <div className="stat-fees-info">
              <span className="stat-fees-label">Total des frais collectés</span>
              <span className="stat-fees-value">{totalFrais.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        </div>
      )}

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher par client, compte ou description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Tous</button>
          <button className={filter === 'transfert' ? 'active' : ''} onClick={() => setFilter('transfert')}>
            Transferts
          </button>
          <button className={filter === 'virement' ? 'active' : ''} onClick={() => setFilter('virement')}>
            Virements
          </button>
          {isAdmin && (
            <button className={filter === 'frais' ? 'active' : ''} onClick={() => setFilter('frais')}>
              Frais
            </button>
          )}
          <button className={filter === 'compensation' ? 'active' : ''} onClick={() => setFilter('compensation')}>
            Compensations
          </button>
        </div>

        <div className="date-filter-buttons">
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="date-select">
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
        </div>
      </div>

      <div className="data-table">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date & Heure</th>
              <th>Client / Compte</th>
              <th>Type</th>
              <th>Montant envoyé</th>
              {isAdmin && <th>Frais</th>}
              <th>Statut</th>
              <th>Référence</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((transaction) => {
                const type = normalizeType(transaction.type);
                const isFees = isFeesTransaction(type);
                const isCompensation = type === 'CREDIT_COMPENSATION';
                const netAmount = getNetAmount(transaction, allTransactions);
                const feeAmount = getFeeAmount(transaction, allTransactions);

                return (
                  <tr
                    key={transaction.id}
                    className={isFees ? 'fees-transaction-row' : isCompensation ? 'compensation-transaction-row' : ''}
                  >
                    <td className="date-cell">
                      {new Date(transaction.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="client-cell">
                      {isFees ? (
                        <div>
                          <div className="client-name">Système Bancaire</div>
                          <div className="account-number">{formatAccountNumber(transaction.accountNumber)}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="client-name">{transaction.clientName || 'N/A'}</div>
                          {transaction.clientPhoneNumber && (
                            <div className="client-phone">
                              <small>📞 {transaction.clientPhoneNumber}</small>
                            </div>
                          )}
                          <div className="account-number">{formatAccountNumber(transaction.accountNumber)}</div>
                        </div>
                      )}
                    </td>
                    <td className="type-cell">
                      <span className={`type-badge ${getTypeColor(transaction.type)}`}>
                        {getTypeLabel(transaction.type)}
                      </span>
                    </td>
                    <td className="amount-cell">
                      {!isAdmin && isFees ? (
                        <span className="masked-amount">••••••</span>
                      ) : isFees ? (
                        <span className="no-amount">-</span>
                      ) : (
                        formatAmount(netAmount)
                      )}
                    </td>
                    {isAdmin && (
                      <td className="fees-cell">
                        {isFees ? (
                          <span className="fees-amount">{formatAmount(feeAmount)}</span>
                        ) : feeAmount > 0 ? (
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
                         transaction.status === 'FAILED' ? 'Échoué' :
                         transaction.status || 'N/A'}
                      </span>
                    </td>
                    <td className="reference-cell">
                      {transaction.reference || transaction.transactionId || '-'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={isAdmin ? "7" : "6"} className="no-data">
                  Aucune transaction trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - affichée seulement si plus d'éléments que itemsPerPage */}
      {filteredTransactions.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredTransactions.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newItemsPerPage) => {
            setItemsPerPage(newItemsPerPage);
            setCurrentPage(1);
          }}
          itemsPerPageOptions={[5, 10, 25, 50, 100]}
        />
      )}

      <div className="table-footer">
        <p>{filteredTransactions.length} transaction(s) affichée(s) sur {transactions.length} au total</p>
      </div>
    </div>
  );
};

export default Transactions;