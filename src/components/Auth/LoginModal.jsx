import React, { useState } from 'react';
import styles from './LoginModal.module.css';
import { useAuth } from '../../context/AuthContext';
import { config } from '../../config';
import { useNavigate } from 'react-router-dom';

const TOKEN_URL = `${config.apiBaseUrl}/auth/login`;

const LoginModal = () => {
  const { isLoginOpen, setIsLoginOpen, saveTokens, sessionExpiredReason } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isLoginOpen) return null;

  const getSessionExpiredMessage = () => {
    switch (sessionExpiredReason) {
      case 'inactivity':
        return 'Your session has expired due to inactivity. Please sign in again.';
      case 'refresh_token_expired':
        return 'Your session has expired. Please sign in again.';
      case 'refresh_error':
        return 'Session renewal failed. Please sign in again.';
      default:
        return null;
    }
  };

  const handleCancel = () => {
    setUsername('');
    setPassword('');
    setError('');
    setIsLoginOpen(false);
    navigate('/');
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new URLSearchParams();
      formData.append('grant_type', 'password');
      formData.append('username', username);
      formData.append('password', password);
      formData.append('scope', '');
      formData.append('client_id', 'string');
      formData.append('client_secret', '');

      const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'accept': 'application/json'
        },
        body: formData.toString()
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || 'Login failed');
      }
      const tokens = await res.json();
      saveTokens(tokens);
      setUsername('');
      setPassword('');
      setIsLoginOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sessionExpiredMsg = getSessionExpiredMessage();

  return (
    <div className={styles.backdrop} onClick={() => !loading && !sessionExpiredReason && handleCancel()}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>
          {sessionExpiredReason ? 'Session Expired' : 'Sign in to continue'}
        </h3>
        {sessionExpiredMsg && (
          <div className={styles.sessionExpired}>
            {sessionExpiredMsg}
          </div>
        )}
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={submit} className={styles.form}>
          <label className={styles.label}>
            Email
            <input className={styles.input} type="email" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label className={styles.label}>
            Password
            <input className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <div className={styles.buttonGroup}>
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            {sessionExpiredReason && (
              <button className={styles.cancelButton} type="button" disabled={loading} onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;