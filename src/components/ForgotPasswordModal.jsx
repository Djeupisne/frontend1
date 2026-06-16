import React, { useState } from 'react';
import authService from '../services/authService';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [sent, setSent] = useState(false);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setMessage({ type: 'error', text: 'Veuillez saisir votre adresse email' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return;
    }

    if (!validateEmail(email)) {
      setMessage({ type: 'error', text: 'Veuillez saisir une adresse email valide (exemple: nom@orabank.tg)' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    const result = await authService.forgotPassword(email);

    if (result.success) {
      setSent(true);
      setMessage({ type: 'success', text: result.message || 'Un email de réinitialisation vous a été envoyé.' });
    } else {
      setMessage({
        type: 'error',
        text: result.message || 'Une erreur est survenue. Veuillez réessayer plus tard.'
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    setEmail('');
    setMessage({ type: '', text: '' });
    setSent(false);
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content forgot-password-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-icon">🔐</div>
          <h2>Mot de passe oublié ?</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {!sent ? (
            <>
              <p className="modal-description">
                Saisissez votre adresse email, nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="reset-email">
                    <span className="label-icon">📧</span>
                    Adresse email
                  </label>
                  <input
                    type="email"
                    id="reset-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@orabank.tg"
                    required
                    disabled={isLoading}
                    autoFocus
                    className={message.type === 'error' ? 'input-error' : ''}
                  />
                  <small className="form-hint">
                    Nous enverrons le lien de réinitialisation à cette adresse
                  </small>
                </div>

                {message.text && (
                  <div className={`message-box ${message.type}`}>
                    <div className="message-icon">
                      {message.type === 'success' ? '✓' : message.type === 'error' ? '⚠️' : 'ℹ️'}
                    </div>
                    <div className="message-content">{message.text}</div>
                    <button
                      className="message-close"
                      onClick={() => setMessage({ type: '', text: '' })}
                      aria-label="Fermer"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-small"></span>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">📧</span>
                        Envoyer le lien
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="modal-footer">
                <p>
                  <a href="#" onClick={handleClose} className="back-to-login">
                    ← Retour à la connexion
                  </a>
                </p>
              </div>
            </>
          ) : (
            <div className="success-message">
              <div className="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Email envoyé avec succès !</h3>
              <p>{message.text}</p>
              <div className="email-sent-info">
                <div className="info-icon">📨</div>
                <p>Vérifiez votre boîte de réception (et vos spams).</p>
                <p className="info-note">Le lien est valable pendant 24 heures.</p>
              </div>
              <button className="btn-submit" onClick={handleClose}>
                Retour à la connexion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;