import React, { useState, useEffect } from 'react';
import transactionLogService from '../../services/transactionLogService';
import Pagination from '../../components/Pagination';
import './TransactionLogs.css';

const TransactionLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  //  Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Charger les statistiques
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await transactionLogService.getUserStatistics();
        setStats(data);
      } catch (error) {
        console.error('Erreur stats:', error);
      }
    };
    fetchStats();
  }, []);

  // Reset à la page 1 quand l'utilisateur change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUser, filter]);

  // Charger les logs
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        let data;
        const page = currentPage - 1; // L'API utilise 0-based pagination
        if (selectedUser) {
          data = await transactionLogService.getUserLogs(selectedUser, page, itemsPerPage);
        } else {
          data = await transactionLogService.getAllLogs(page, itemsPerPage);
        }
        setLogs(data.logs || []);
        setTotalItems(data.totalElements || 0);
        setTotalPages(data.totalPages || 0);
      } catch (error) {
        console.error('Erreur chargement logs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [selectedUser, currentPage, itemsPerPage, filter]);

  const handleUserFilter = (username) => {
    setSelectedUser(username);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'SUCCESS': return <span className="badge-success">✓</span>;
      case 'FAILED': return <span className="badge-danger">✗</span>;
      default: return <span className="badge-warning">⏳</span>;
    }
  };

  const getTransactionTypeLabel = (type) => {
    switch(type) {
      case 'VIREMENT_INTERNE': return 'Virement Interne';
      case 'DEBIT_MOBILE_MONEY': return 'Transfert Mobile Money';
      case 'CREDIT_MANUEL': return 'Crédit Manuel';
      case 'DEBIT_MANUEL': return 'Débit Manuel';
      case 'CREDIT': return 'Crédit';
      case 'DEBIT': return 'Débit';
      default: return type || 'N/A';
    }
  };

  // Filtrer par statut
  const filteredLogs = logs.filter(log => {
    if (filter === 'success') return log.status === 'SUCCESS';
    if (filter === 'failed') return log.status === 'FAILED';
    return true;
  });

  const totalTransactions = stats.reduce((sum, s) => sum + (s.transactionCount || 0), 0);

  if (isLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Chargement des transactions...</p>
      </div>
    );
  }

  return (
    <div className="transaction-logs-container">
      {/* En-tête */}
      <div className="page-header">
        <h1>📋 Journal des Transactions</h1>
        <p>Historique complet de toutes les transactions par utilisateur</p>
      </div>

      {/* Statistiques compactes */}
      <div className="stats-bar">
        <div
          className={`stat-badge ${selectedUser === '' ? 'active' : ''}`}
          onClick={() => handleUserFilter('')}
        >
          <span className="stat-badge-icon">📊</span>
          <span className="stat-badge-label">Tous</span>
          <span className="stat-badge-count">{totalTransactions}</span>
        </div>
        {stats.map(stat => (
          <div
            key={stat.username}
            className={`stat-badge ${selectedUser === stat.username ? 'active' : ''}`}
            onClick={() => handleUserFilter(stat.username)}
          >
            <span className="stat-badge-icon">
              {stat.username === 'admin' ? '👑' : '👤'}
            </span>
            <span className="stat-badge-label">{stat.username}</span>
            <span className="stat-badge-count">{stat.transactionCount}</span>
          </div>
        ))}
      </div>

      {/* Barre d'actions */}
      <div className="actions-bar">
        <div className="filter-buttons">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            Tous
          </button>
          <button className={filter === 'success' ? 'active' : ''} onClick={() => setFilter('success')}>
            ✓ Succès
          </button>
          <button className={filter === 'failed' ? 'active' : ''} onClick={() => setFilter('failed')}>
            ✗ Échecs
          </button>
        </div>
        <button onClick={() => {
          setSelectedUser('');
          setCurrentPage(1);
        }} className="refresh-btn">
          🔄 Rafraîchir
        </button>
      </div>

      {/* Tableau des logs */}
      <div className="logs-table-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Date & Heure</th>
              <th>Utilisateur</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Frais</th>
              <th>Source</th>
              <th>Cible</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  Aucune transaction trouvée
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} className={log.status === 'FAILED' ? 'failed-row' : ''}>
                  <td className="date-cell">
                    {new Date(log.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="user-cell">
                    <strong>{log.username}</strong>
                    <span className="user-role-badge">
                      {log.userRole?.includes('ADMIN') ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td>
                    <span className="type-badge">
                      {getTransactionTypeLabel(log.transactionType)}
                    </span>
                  </td>
                  <td className="amount-cell">
                    {log.amount?.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="fees-cell">
                    {log.feesAmount > 0 ? `${log.feesAmount.toLocaleString('fr-FR')} FCFA` : '-'}
                  </td>
                  <td>{log.sourcePhone || log.sourceAccount || '-'}</td>
                  <td>{log.targetPhone || log.targetAccount || '-'}</td>
                  <td>{getStatusBadge(log.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/*  Pagination */}
      {totalItems > 0 && (
        <div className="pagination-wrapper">
          <div className="pagination-info">
            Affichage de {(currentPage - 1) * itemsPerPage + 1} à{' '}
            {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} éléments
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
            itemsPerPageOptions={[5, 10, 25, 50, 100]}
          />
        </div>
      )}

      <div className="table-footer">
        {selectedUser ? (
          <p>{filteredLogs.length} transaction(s) pour <strong>{selectedUser}</strong></p>
        ) : (
          <p>{filteredLogs.length} transaction(s) affichée(s)</p>
        )}
      </div>
    </div>
  );
};

export default TransactionLogs;