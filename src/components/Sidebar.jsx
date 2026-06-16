import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const menuItems = [
    { path: '/', label: 'Tableau de bord', icon: '📊' },
    { path: '/transactions', label: 'Transactions', icon: '💳' },
    { path: '/clients', label: 'Clients', icon: '👥' },
    { path: '/accounts', label: 'Comptes', icon: '🏦' },
    { path: '/sms-logs', label: 'Logs SMS', icon: '📜' },
  ];

  return (
    <>
      <div className={`sidebar ${isOpen ? '' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">OB</div>
            {isOpen && <span>OraBank SMS</span>}
          </div>
          {isOpen && (
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => isMobile && onClose()}
            >
              <span className="nav-icon">{item.icon}</span>
              {isOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {isOpen && (
            <p className="version">v1.0.0</p>
          )}
        </div>
      </div>

      {/* Overlay only for mobile */}
      {isMobile && isOpen && (
        <div className="sidebar-overlay active" onClick={onClose}></div>
      )}
    </>
  );
};

export default Sidebar;
