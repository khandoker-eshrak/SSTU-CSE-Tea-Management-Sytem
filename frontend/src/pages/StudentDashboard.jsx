import React from 'react';
import { ArrowLeft, Coffee, DollarSign, User, BookOpen, Calendar } from 'lucide-react';

export default function StudentDashboard({ student, history, onBack }) {
  const formatCurrency = (value) => {
    return `${parseFloat(value || 0).toFixed(2)} BDT`;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isDueOutstanding = parseFloat(student.due_amount) > 0;

  return (
    <div className="fade-in" style={{ padding: '1.5rem 0' }}>
      {/* Back button and profile title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} />
          Back to Search
        </button>
        
        <div style={{ textAlign: 'right' }}>
          <span className={`badge ${isDueOutstanding ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
            {isDueOutstanding ? `Due Balance: ${formatCurrency(student.due_amount)}` : 'No Outstanding Dues'}
          </span>
        </div>
      </div>

      {/* Profile Info Header */}
      <div className="card" style={{ marginBottom: '2rem', padding: '2rem', borderLeft: '5px solid var(--primary)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={24} style={{ color: 'var(--primary)' }} />
          Student Profile Information
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Full Name</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>{student.name}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Student ID</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)' }}>{student.student_id}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Department & Batch</span>
            <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <BookOpen size={16} style={{ color: 'var(--text-light)' }} />
              {student.department} (Batch {student.batch})
            </span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Email Address</span>
            <span style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-main)' }}>{student.email}</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="dashboard-grid">
        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-label">Tea Bags Received</span>
            <span className="stat-val">{student.total_tea_bags}</span>
          </div>
          <div className="stat-icon">
            <Coffee size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Cost</span>
            <span className="stat-val" style={{ color: 'var(--text-main)' }}>{parseFloat(student.total_cost).toFixed(0)} <span style={{ fontSize: '1.1rem' }}>BDT</span></span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <DollarSign size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Paid</span>
            <span className="stat-val" style={{ color: 'var(--success)' }}>{parseFloat(student.total_paid).toFixed(0)} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>BDT</span></span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
            <DollarSign size={24} />
          </div>
        </div>

        <div className="card stat-card" style={{
          borderLeft: isDueOutstanding ? '3px solid var(--danger)' : '3px solid var(--success)',
          boxShadow: isDueOutstanding ? '0 4px 6px -1px rgba(239, 68, 68, 0.05)' : 'none'
        }}>
          <div className="stat-info">
            <span className="stat-label">Remaining Due</span>
            <span className="stat-val" style={{ color: isDueOutstanding ? 'var(--danger)' : 'var(--success)' }}>
              {parseFloat(student.due_amount).toFixed(0)} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>BDT</span>
            </span>
          </div>
          <div className="stat-icon" style={{
            backgroundColor: isDueOutstanding ? 'var(--danger-light)' : 'var(--success-light)',
            color: isDueOutstanding ? 'var(--danger)' : 'var(--success)'
          }}>
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
          <Calendar size={20} style={{ color: 'var(--primary)' }} />
          Transaction History Log
        </h3>
        
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Coffee size={40} style={{ marginBottom: '1rem', color: 'var(--text-light)', opacity: 0.5 }} />
            <p style={{ fontWeight: '500' }}>No transactions recorded yet.</p>
            <p style={{ fontSize: '0.85rem' }}>Tea bag distributions and payments will appear here.</p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log) => {
                  const isDist = log.type === 'distribution';
                  return (
                    <tr key={log.id}>
                      <td style={{ fontWeight: '500' }}>{formatDate(log.date)}</td>
                      <td>
                        <span className={`badge ${isDist ? 'badge-info' : 'badge-success'}`}>
                          {isDist ? 'Tea Distributed' : 'Payment Received'}
                        </span>
                      </td>
                      <td>{isDist ? `${log.quantity} bags` : '-'}</td>
                      <td>{isDist ? `${parseFloat(log.rate).toFixed(2)} BDT` : '-'}</td>
                      <td style={{
                        fontWeight: '700',
                        color: isDist ? 'var(--text-main)' : 'var(--success)'
                      }}>
                        {isDist ? formatCurrency(log.amount) : `- ${formatCurrency(log.amount)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
