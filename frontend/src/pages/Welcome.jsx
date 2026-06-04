import React, { useState } from 'react';
import { Search, ShieldAlert, Coffee } from 'lucide-react';
import { api } from '../api.js';

export default function Welcome({ onStudentFound, navigateToAdminLogin }) {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!studentId.trim()) {
      setError('Please enter your Student ID.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.getStudentProfile(studentId.trim());
      if (data.success) {
        onStudentFound(data.student, data.history);
      } else {
        setError('No record found for this Student ID.');
      }
    } catch (err) {
      setError(err.message || 'Student not found or connection failed.');
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
        maxWidth: '480px',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        borderTop: '5px solid var(--primary)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '4.5rem',
            height: '4.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Coffee size={40} />
          </div>
        </div>

        <h1 style={{
          fontSize: '2rem',
          marginBottom: '0.5rem',
          color: 'var(--text-main)'
        }}>Tea Billing System</h1>
        
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.95rem',
          marginBottom: '2rem',
          lineHeight: '1.4'
        }}>
          University Department Tea Distribution & Dues Tracker. Enter your Student ID to view your current bill.
        </p>

        {error && (
          <div className="alert alert-danger" style={{ textAlign: 'left', fontSize: '0.9rem' }}>
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ textAlign: 'left', margin: 0 }}>
            <label className="form-label" htmlFor="student-id-input">Student ID</label>
            <div style={{ position: 'relative' }}>
              <input
                id="student-id-input"
                className="form-input"
                type="text"
                placeholder="e.g., CSE-2023-045"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  fontSize: '1.05rem',
                  fontWeight: '500'
                }}
                disabled={loading}
              />
              <Search size={18} style={{
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
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Searching Record...' : 'View My Dashboard'}
          </button>
        </form>

        <div style={{
          marginTop: '2.5rem',
          borderTop: '1px solid var(--border)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={navigateToAdminLogin}
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            Go to Admin Portal
          </button>
        </div>
      </div>
    </div>
  );
}
