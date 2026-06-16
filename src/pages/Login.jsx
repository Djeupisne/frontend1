import React, { useState } from 'react';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorType('');
    setIsLoading(true);

    try {
      const success = await onLogin(username, password);
      if (!success) {
        setError('Nom d\'utilisateur ou mot de passe incorrect');
        setErrorType('invalid');
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);

      const errorMessage = err.message || err.toString();

      // ✅ Détection du message de compte désactivé
      if (errorMessage.includes('désactivé') ||
          errorMessage.includes('disabled') ||
          errorMessage.includes('inactif') ||
          errorMessage.includes('contacter')) {
        setError('Votre compte a été désactivé. Veuillez contacter l\'administrateur.');
        setErrorType('disabled');
      } else {
        setError('Nom d\'utilisateur ou mot de passe incorrect');
        setErrorType('invalid');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">
            <h1>OraBank SMS Banking</h1>
          </div>
          <p>Tableau de bord d'administration</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre nom d'utilisateur"
              required
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="login-links">
            <button type="button" className="forgot-password-link" onClick={() => setShowForgotPassword(true)}>
              Mot de passe oublié ?
            </button>
          </div>

          {error && (
            <div className={`error-message error-${errorType}`}>
              <div className="error-icon">
                {errorType === 'disabled' ? '🔒' : '⚠️'}
              </div>
              <div className="error-content">
                <strong>{errorType === 'disabled' ? 'Compte désactivé' : 'Échec de connexion'}</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>
      </div>

      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
    </div>
  );
};

export default Login;