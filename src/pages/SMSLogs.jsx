import React, { useState, useEffect } from 'react';
import authService from '../services/authService';


const API_URL = import.meta.env.VITE_API_URL || 'https://sms-orabank-backend.onrender.com';

const SMSLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSMSLogs();
  }, []);

  const fetchSMSLogs = async () => {
    setIsLoading(true);
    try {
      const headers = authService.getAuthHeaders();
      const response = await fetch(`${API_URL}/api/sms/logs`, { headers });
      const data = await response.json();

      // 🔥 Tri par date décroissante (les plus récentes en premier)
      const sortedData = Array.isArray(data) ? [...data].sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        // Décroissant : date la plus récente d'abord
        if (dateB !== dateA) return dateB - dateA;
        // Si mêmes dates, trier par ID décroissant
        return (b.id || 0) - (a.id || 0);
      }) : [];

      setLogs(sortedData);
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === 'all' || log.direction?.toLowerCase() === filter.toLowerCase() || log.type?.toLowerCase() === filter.toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      log.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.body?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Chargement des logs SMS...</p>
      </div>
    );
  }

  return (
    <div className="sms-logs-page">
      <div className="page-header">
        <h1>Historique des SMS</h1>
        <p>Tous les messages envoyés et reçus</p>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher par numéro ou message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Tous
          </button>
          <button
            className={filter === 'outgoing' || filter === 'sent' ? 'active' : ''}
            onClick={() => setFilter('outgoing')}
          >
            Envoyés
          </button>
          <button
            className={filter === 'incoming' || filter === 'received' ? 'active' : ''}
            onClick={() => setFilter('incoming')}
          >
            Reçus
          </button>
          <button
            className={filter === 'failed' ? 'active' : ''}
            onClick={() => setFilter('failed')}
          >
            Échoués
          </button>
        </div>
      </div>

      <div className="sms-logs-table">
        <table>
          <thead>
            <tr>
              <th>Date & Heure</th>
              <th>Type</th>
              <th>Numéro</th>
              <th>Message</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                  <td>
                    <span className={`type-badge ${log.direction?.toLowerCase() || ''}`}>
                      {log.direction === 'OUTGOING' ? 'Envoyé' : log.direction === 'INCOMING' ? 'Reçu' : log.direction || 'N/A'}
                    </span>
                  </td>
                  <td className="phone-number">{log.phoneNumber || log.to || log.sender || 'N/A'}</td>
                  <td className="message-cell">{log.message || log.body || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${log.status?.toLowerCase() || ''}`}>
                      {log.status === 'SENT' ? 'Envoyé' : log.status === 'RECEIVED' ? 'Reçu' : log.status === 'FAILED' ? 'Échec' : log.status || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">Aucun log SMS trouvé</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <p>{filteredLogs.length} log(s) affiché(s) sur {logs.length} au total</p>
      </div>
    </div>
  );
};

export default SMSLogs;