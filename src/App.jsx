import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Clients from './pages/Clients';
import Accounts from './pages/Accounts';
import SMSLogs from './pages/SMSLogs';
import ResetPassword from './pages/ResetPassword';
import UserManagement from './pages/admin/UserManagement';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import authService from './services/authService';
import './styles/index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const auth = authService.isAuthenticated();
      setIsAuthenticated(auth);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogin = async (username, password) => {
    try {
      const success = await authService.login(username, password);
      if (success) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      // ✅ Propager l'erreur pour qu'elle soit capturée dans Login.jsx
      throw error;
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <h2>Chargement...</h2>
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} />

        <Route path="/*" element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <div className="app-container">
              <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
              <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`} style={{ marginLeft: sidebarOpen ? '280px' : '0' }}>
                <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} />
                <main className="content-area">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/accounts" element={authService.isAdmin() ? <Accounts /> : <Navigate to="/" replace />} />
                    <Route path="/admin/users" element={authService.isAdmin() ? <UserManagement /> : <Navigate to="/" replace />} />
                    <Route path="/sms-logs" element={<SMSLogs />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          )
        } />
      </Routes>
    </Router>
  );
}

export default App;