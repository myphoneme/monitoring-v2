import React, { useState } from 'react';
import styles from './LoginModal.module.css';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CreateUserModal = ({ open, onClose }) => {
  const { requireAuth } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(0);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!requireAuth()) return;
    setLoading(true);
    setError('');
    try {
      const payload = { name, email, role: Number(role), password };
      const res = await api.post('/users/create', payload);
      alert('User created successfully');
      onClose?.(res.data);
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to create user';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={() => !loading && onClose?.()}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Create User</h3>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={submit} className={styles.form}>
          <label className={styles.label}>
            Name
            <input className={styles.input} type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className={styles.label}>
            Email
            <input className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className={styles.label}>
            Role
            <select className={styles.input} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value={0}>User</option>
              <option value={1}>Admin</option>
            </select>
          </label>
          <label className={styles.label}>
            Password
            <input className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button className={styles.button} type="button" disabled={loading} onClick={() => onClose?.()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;


