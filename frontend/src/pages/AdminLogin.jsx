import React, { useState } from 'react';
import { Lock, Mail, ArrowLeft, ShieldAlert } from 'lucide-react';
import { api } from '../api.js';

export default function AdminLogin({ onLoginSuccess, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.login(email, password);
      if (data.success) {
        onLoginSuccess();
      } else {
        setError(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '1.5rem',
      width: '100%'
    }} className="fade-in">
      <div className="card" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem 2rem',
        borderTop: '5px solid var(--accent)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        
        <button onClick={onBack} className="btn btn-secondary" style={{
          padding: '0.4rem 0.8rem',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          marginBottom: '1.5rem',
          alignSelf: 'flex-start'
        }}>
          <ArrowLeft size={14} />
          Student Search
        </button>

        <h2 style={{
          fontSize: '1.75rem',
          marginBottom: '0.5rem',
          color: 'var(--text-main)',
          textAlign: 'center'
        }}>Admin Access Portal</h2>
        
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          Authenticate to access administrative dashboards, billing logs, and student databases.
        </p>

        {error && (
          <div className="alert alert-danger" style={{ fontSize: '0.875rem' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="admin-email-input">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-email-input"
                className="form-input"
                type="email"
                placeholder="admin@tea.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                disabled={loading}
                autoComplete="email"
              />
              <Mail size={16} style={{
                position: 'absolute',
                left: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)'
              }} />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="admin-password-input">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password-input"
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                disabled={loading}
                autoComplete="current-password"
              />
              <Lock size={16} style={{
                position: 'absolute',
                left: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)'
              }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-accent"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontWeight: '700' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
