import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage({ type: 'error', text: 'Lien invalide. Veuillez refaire une demande de réinitialisation.' });
      setIsValidating(false);
      return;
    }

    const validateToken = async () => {
      const result = await authService.validateResetToken(token);
      if (result.valid) {
        setIsTokenValid(true);
      } else {
        setMessage({ type: 'error', text: result.error || 'Lien invalide ou expiré. Veuillez refaire une demande.' });
      }
      setIsValidating(false);
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    const result = await authService.resetPassword(token, password);

    if (result.success) {
      setResetSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Une erreur est survenue' });
    }

    setIsLoading(false);
  };

  if (isValidating) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Vérification du lien...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-header">
          <div className="logo-icon">🔐</div>
          <h1>OraBank SMS Banking</h1>
          <p>Réinitialisation du mot de passe</p>
        </div>

        {resetSuccess ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Mot de passe réinitialisé !</h3>
            <p>Votre mot de passe a été modifié avec succès.</p>
            <p>Vous allez être redirigé vers la page de connexion...</p>
            <button className="btn-submit" onClick={() => navigate('/')}>
              Retour à la connexion
            </button>
          </div>
        ) : isTokenValid ? (
          <form onSubmit={handleSubmit} className="reset-password-form">
            <div className="form-group">
              <label htmlFor="password">Nouveau mot de passe</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  required
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <small className="form-hint">Le mot de passe doit contenir au moins 6 caractères</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retapez votre mot de passe"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {message.text && (
              <div className={`message-box ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => navigate('/')} disabled={isLoading}>
                Annuler
              </button>
              <button type="submit" className="btn-submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner-small"></span>
                    Réinitialisation...
                  </>
                ) : (
                  'Réinitialiser le mot de passe'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="error-message-box">
            <div className="error-icon">⚠️</div>
            <h3>Lien invalide ou expiré</h3>
            <p>{message.text}</p>
            <button className="btn-submit" onClick={() => navigate('/')}>
              Retour à la connexion
            </button>
          </div>
        )}

        <div className="reset-password-footer">
          <p>&copy; 2026 OraBank. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;