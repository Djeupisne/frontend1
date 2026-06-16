import React from 'react';
import authService from '../services/authService';

const Header = ({ onToggleSidebar, onLogout }) => {
  const username = authService.getUsername();

  return (
    <header className="main-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onToggleSidebar}>
          ☰
        </button>
        <h2 className="page-title">OraBank SMS Banking</h2>
      </div>

      <div className="header-right">
        <div className="user-info">
          <div className="user-avatar">
            {username.charAt(0).toUpperCase()}
          </div>
          <span className="user-name">{username}</span>
        </div>
        <button className="logout-button" onClick={onLogout}>
          Déconnexion
        </button>
      </div>
    </header>
  );
};

export default Header;
