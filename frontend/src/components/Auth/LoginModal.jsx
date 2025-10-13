import React, { useState } from 'react';
import styles from './LoginModal.module.css';
import { useAuth } from '../../context/AuthContext';

const TOKEN_URL = 'http://10.0.5.22:8000/auth/login';

const LoginModal = () => {
  const { isLoginOpen, setIsLoginOpen, saveTokens } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isLoginOpen) return null;

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
      setIsLoginOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={() => !loading && setIsLoginOpen(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Sign in to continue</h3>
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
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;


