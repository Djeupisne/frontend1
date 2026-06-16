import React, { useState, useEffect } from 'react';
import authService from '../services/authService';


const API_URL = import.meta.env.VITE_API_URL || 'https://sms-banking-pjcp.onrender.com';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const headers = authService.getAuthHeaders();
      const response = await fetch(`${API_URL}/api/clients`, { headers });
      const data = await response.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    if (searchTerm === '') return true;
    const search = searchTerm.toLowerCase();
    return (
      client.name?.toLowerCase().includes(search) ||
      client.firstName?.toLowerCase().includes(search) ||
      client.lastName?.toLowerCase().includes(search) ||
      client.email?.toLowerCase().includes(search) ||
      client.phoneNumber?.toLowerCase().includes(search)
    );
  });

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Chargement des clients...</p>
      </div>
    );
  }

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1>Gestion des clients</h1>
        <p>Liste de tous les clients enregistrés</p>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="clients-grid">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <div key={client.id} className="client-card">
              <div className="client-header">
                <div className="client-avatar">
                  {(client.firstName?.charAt(0) || client.name?.charAt(0) || 'C').toUpperCase()}
                </div>
                <div className="client-info">
                  <h3>{client.name || `${client.firstName} ${client.lastName}` || 'Client inconnu'}</h3>
                </div>
              </div>
              <div className="client-details">
                <div className="detail-row">
                  <span className="label">📧 Email:</span>
                  <span className="value">{client.email || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">📱 Téléphone:</span>
                  <span className="value">{client.phoneNumber || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">📅 Inscription:</span>
                  <span className="value">
                    {client.createdAt ? new Date(client.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-data-message">
            <p>Aucun client trouvé</p>
          </div>
        )}
      </div>

      <div className="table-footer">
        <p>{filteredClients.length} client(s) affiché(s) sur {clients.length} au total</p>
      </div>
    </div>
  );
};

export default Clients;