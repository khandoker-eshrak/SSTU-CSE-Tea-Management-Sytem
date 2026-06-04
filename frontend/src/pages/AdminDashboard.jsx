import React, { useState, useEffect } from 'react';
import {
  Users, Coffee, DollarSign, LogOut, Plus, Trash2, Edit, Eye,
  RefreshCw, Send, CheckCircle2, ChevronRight, BookOpen, AlertTriangle
} from 'lucide-react';
import { api } from '../api.js';

export default function AdminDashboard({ onLogout }) {
  // Navigation
  const [activeTab, setActiveTab] = useState('overview'); // overview, students, inventory, logs

  // Data States
  const [stats, setStats] = useState({
    total_students: 0,
    total_tea_distributed: 0,
    total_revenue: 0,
    total_collected: 0,
    total_outstanding_due: 0
  });
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [students, setStudents] = useState([]);
  const [inventory, setInventory] = useState({ current_stock: 0, total_purchased: 0, total_distributed: 0, logs: [] });
  const [logs, setLogs] = useState([]);

  // Search & Filter States
  const [studentSearch, setStudentSearch] = useState('');
  const [logFilter, setLogFilter] = useState('all'); // all, distribution, payment

  // Loaders & Errors
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modal States
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showEditStudent, setShowEditStudent] = useState(null); // student object or null
  const [showAddStock, setShowAddStock] = useState(false);
  const [showDistribute, setShowDistribute] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [viewStudentDetail, setViewStudentDetail] = useState(null); // student details object or null

  // Form Fields
  const [studentForm, setStudentForm] = useState({ student_id: '', name: '', email: '', department: '', batch: '' });
  const [stockQty, setStockQty] = useState('');
  const [distributeForm, setDistributeForm] = useState({ student_id: '', quantity: '1', unit_price: '5' });
  const [paymentForm, setPaymentForm] = useState({ student_id: '', amount: '' });

  // Load all dashboard resources
  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.getDashboardStats();
      if (statsRes.success) {
        setStats(statsRes.stats);
        setMonthlyStats(statsRes.monthly_stats);
      }

      const studentsRes = await api.getStudents();
      if (studentsRes.success) {
        setStudents(studentsRes.students);
      }

      const inventoryRes = await api.getInventory();
      if (inventoryRes.success) {
        setInventory(inventoryRes);
      }

      const logsRes = await api.getTransactionLogs();
      if (logsRes.success) {
        setLogs(logsRes.logs);
      }
    } catch (err) {
      triggerAlert('danger', err.message || 'Error syncing data from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert({ type: '', message: '' });
    }, 5000);
  };

  // CRUD Operations
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.createStudent(studentForm);
      if (res.success) {
        triggerAlert('success', 'Student profile created successfully.');
        setShowAddStudent(false);
        setStudentForm({ student_id: '', name: '', email: '', department: '', batch: '' });
        loadData();
      }
    } catch (err) {
      triggerAlert('danger', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.updateStudent(showEditStudent.id, studentForm);
      if (res.success) {
        triggerAlert('success', 'Student profile updated successfully.');
        setShowEditStudent(null);
        setStudentForm({ student_id: '', name: '', email: '', department: '', batch: '' });
        loadData();
      }
    } catch (err) {
      triggerAlert('danger', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student? All their distributions and payment history will be permanently deleted.')) {
      return;
    }
    try {
      const res = await api.deleteStudent(id);
      if (res.success) {
        triggerAlert('success', 'Student deleted successfully.');
        loadData();
      }
    } catch (err) {
      triggerAlert('danger', err.message);
    }
  };

  // Transaction Operations
  const handleDistribute = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.distributeTea(
        distributeForm.student_id,
        distributeForm.quantity,
        distributeForm.unit_price
      );
      if (res.success) {
        triggerAlert('success', `Recorded ${distributeForm.quantity} tea bags distributed to student.`);
        setShowDistribute(false);
        setDistributeForm({ student_id: '', quantity: '1', unit_price: '5' });
        loadData();
      }
    } catch (err) {
      triggerAlert('danger', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.recordPayment(paymentForm.student_id, paymentForm.amount);
      if (res.success) {
        triggerAlert('success', `Recorded payment of ${paymentForm.amount} BDT successfully.`);
        setShowPayment(false);
        setPaymentForm({ student_id: '', amount: '' });
        loadData();
      }
    } catch (err) {
      triggerAlert('danger', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.addStock(stockQty);
      if (res.success) {
        triggerAlert('success', `Stock increased by ${stockQty} tea bags.`);
        setShowAddStock(false);
        setStockQty('');
        loadData();
      }
    } catch (err) {
      triggerAlert('danger', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Manual Trigger Email Reminders
  const handleTriggerEmails = async () => {
    if (!window.confirm('Do you want to run the billing reminder job now? This will scan for all outstanding dues and trigger notification files/emails.')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.triggerTestEmails();
      if (res.success) {
        triggerAlert('success', `Email billing scheduler executed! Sent reminders to ${res.sent_count} students with due balances.`);
      } else {
        triggerAlert('danger', `Run failed: ${res.error}`);
      }
    } catch (err) {
      triggerAlert('danger', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Profile Drawer
  const openStudentDetail = async (studentId) => {
    try {
      const data = await api.getStudentProfile(studentId);
      if (data.success) {
        setViewStudentDetail(data);
      }
    } catch (err) {
      triggerAlert('danger', 'Failed to retrieve profile detail: ' + err.message);
    }
  };

  // Filtering
  const filteredStudents = students.filter(s =>
    s.student_id.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredLogs = logs.filter(l => {
    if (logFilter === 'all') return true;
    return l.type === logFilter;
  });

  const getStockAlertColor = (stock) => {
    if (stock >= 100) return 'var(--success)';
    if (stock >= 20) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getStockBadgeClass = (stock) => {
    if (stock >= 100) return 'badge-success';
    if (stock >= 20) return 'badge-warning';
    return 'badge-danger';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexWrap: 'wrap' }} className="fade-in">
      {/* Sidebar Navigation */}
      <aside style={{
        backgroundColor: 'var(--bg-sidebar)',
        color: 'var(--text-on-dark)',
        width: '260px',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        flexShrink: 0
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: '800',
            fontSize: '1.25rem',
            color: 'white',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--accent), #ff8c00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a'
            }}>
              <Coffee size={18} />
            </div>
            <span>Tea Admin</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department Panel</span>
        </div>

        {/* Action Panel Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button onClick={() => setShowDistribute(true)} className="btn btn-accent" style={{ fontSize: '0.85rem', width: '100%' }}>
            <Plus size={16} />
            Distribute Tea
          </button>
          <button onClick={() => setShowPayment(true)} className="btn btn-primary" style={{ fontSize: '0.85rem', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <Plus size={16} />
            Record Payment
          </button>
        </div>

        {/* Navigation items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'overview' ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: activeTab === 'overview' ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
              textAlign: 'left',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              transition: 'var(--transition)'
            }}
          >
            <RefreshCw size={16} />
            Overview Dashboard
          </button>
          <button
            onClick={() => setActiveTab('students')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'students' ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: activeTab === 'students' ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
              textAlign: 'left',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              transition: 'var(--transition)'
            }}
          >
            <Users size={16} />
            Manage Students
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'inventory' ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: activeTab === 'inventory' ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
              textAlign: 'left',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              transition: 'var(--transition)'
            }}
          >
            <Coffee size={16} />
            Tea Stock Inventory
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'logs' ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: activeTab === 'logs' ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
              textAlign: 'left',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              transition: 'var(--transition)'
            }}
          >
            <DollarSign size={16} />
            Transaction Audit Logs
          </button>
        </nav>

        {/* Footer Logout */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
          <button
            onClick={() => { api.logout(); onLogout(); }}
            className="btn"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              color: '#f87171',
              backgroundColor: 'transparent',
              padding: '0.5rem'
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main dashboard content */}
      <main style={{ flexGrow: 1, padding: '2rem', minWidth: '320px', maxWidth: 'calc(100% - 260px)' }}>
        {/* Floating alerts */}
        {alert.message && (
          <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ boxShadow: 'var(--shadow-md)' }}>
            {alert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{alert.message}</span>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className="spinner" style={{ marginBottom: '1rem' }}></div>
            <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Syncing dashboard databases...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW PANEL */}
            {activeTab === 'overview' && (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', color: 'var(--text-main)' }}>Overview Analytics</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>General statistics, financial dues, and inventory summaries.</p>
                  </div>
                  <button onClick={loadData} className="btn btn-secondary btn-icon-only" title="Refresh Dashboard">
                    <RefreshCw size={16} />
                  </button>
                </div>

                {/* Dashboard Stats row */}
                <div className="dashboard-grid">
                  <div className="card stat-card">
                    <div className="stat-info">
                      <span className="stat-label">Total Students</span>
                      <span className="stat-val">{stats.total_students}</span>
                    </div>
                    <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                      <Users size={24} />
                    </div>
                  </div>

                  <div className="card stat-card">
                    <div className="stat-info">
                      <span className="stat-label">Bags Distributed</span>
                      <span className="stat-val">{stats.total_tea_distributed}</span>
                    </div>
                    <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                      <Coffee size={24} />
                    </div>
                  </div>

                  <div className="card stat-card">
                    <div className="stat-info">
                      <span className="stat-label">Total Cost</span>
                      <span className="stat-val">{parseFloat(stats.total_revenue).toFixed(0)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>BDT</span></span>
                    </div>
                    <div className="stat-icon">
                      <DollarSign size={24} />
                    </div>
                  </div>

                  <div className="card stat-card">
                    <div className="stat-info">
                      <span className="stat-label">Total Paid</span>
                      <span className="stat-val" style={{ color: 'var(--success)' }}>{parseFloat(stats.total_collected).toFixed(0)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>BDT</span></span>
                    </div>
                    <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                      <DollarSign size={24} />
                    </div>
                  </div>

                  <div className="card stat-card" style={{ borderLeft: '3px solid var(--danger)' }}>
                    <div className="stat-info">
                      <span className="stat-label">Outstanding Dues</span>
                      <span className="stat-val" style={{ color: 'var(--danger)' }}>{parseFloat(stats.total_outstanding_due).toFixed(0)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>BDT</span></span>
                    </div>
                    <div className="stat-icon" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
                      <DollarSign size={24} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  {/* Custom SVG Bar Chart */}
                  <div className="card">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Monthly Statistics (Last 6 Months)</h3>
                    
                    {monthlyStats.length === 0 ? (
                      <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        No monthly statistics aggregated yet.
                      </div>
                    ) : (
                      <div style={{ width: '100%', overflowX: 'auto' }}>
                        {/* Custom Pure SVG Responsive chart */}
                        <svg viewBox="0 0 500 240" style={{ width: '100%', height: '220px', minWidth: '400px' }}>
                          {/* Grid lines */}
                          <line x1="40" y1="40" x2="480" y2="40" stroke="var(--border)" strokeDasharray="4 4" />
                          <line x1="40" y1="90" x2="480" y2="90" stroke="var(--border)" strokeDasharray="4 4" />
                          <line x1="40" y1="140" x2="480" y2="140" stroke="var(--border)" strokeDasharray="4 4" />
                          <line x1="40" y1="190" x2="480" y2="190" stroke="var(--border)" />

                          {/* Render columns */}
                          {monthlyStats.map((item, idx) => {
                            const x = 70 + idx * 70;
                            
                            // Find max value to scale chart (default height 150px)
                            const maxVal = Math.max(...monthlyStats.map(s => Math.max(s.distributed, s.collected)), 100);
                            const scale = 150 / maxVal;
                            
                            const distHeight = item.distributed * scale;
                            const collHeight = item.collected * scale;

                            return (
                              <g key={item.month}>
                                {/* Distributed Bar */}
                                <rect
                                  x={x}
                                  y={190 - distHeight}
                                  width="16"
                                  height={distHeight}
                                  fill="var(--primary)"
                                  rx="3"
                                  style={{ transition: 'var(--transition)' }}
                                />
                                
                                {/* Collected Bar */}
                                <rect
                                  x={x + 20}
                                  y={190 - collHeight}
                                  width="16"
                                  height={collHeight}
                                  fill="var(--success)"
                                  rx="3"
                                  style={{ transition: 'var(--transition)' }}
                                />

                                {/* Label */}
                                <text
                                  x={x + 18}
                                  y="210"
                                  fill="var(--text-muted)"
                                  fontSize="9"
                                  textAnchor="middle"
                                  fontWeight="600"
                                >
                                  {item.month}
                                </text>
                              </g>
                            );
                          })}

                          {/* Chart Legend */}
                          <g transform="translate(100, 15)">
                            <rect x="0" y="0" width="10" height="10" fill="var(--primary)" rx="2" />
                            <text x="15" y="9" fill="var(--text-muted)" fontSize="9" fontWeight="600">Cost Distributed</text>
                            
                            <rect x="120" y="0" width="10" height="10" fill="var(--success)" rx="2" />
                            <text x="135" y="9" fill="var(--text-muted)" fontSize="9" fontWeight="600">Amount Paid</text>
                          </g>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Sidebar actions & info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Inventory summary */}
                    <div className="card">
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Stock Level</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{
                          width: '3.5rem',
                          height: '3.5rem',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'var(--primary-light)',
                          color: getStockAlertColor(inventory.current_stock)
                        }}>
                          <Coffee size={28} />
                        </div>
                        <div>
                          <span style={{ fontSize: '1.75rem', fontWeight: '800' }}>{inventory.current_stock}</span>
                          <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--text-muted)', fontWeight: '600' }}>Bags Remaining</span>
                        </div>
                      </div>

                      <span className={`badge ${getStockBadgeClass(inventory.current_stock)}`} style={{ display: 'block', textAlign: 'center', padding: '0.4rem' }}>
                        {inventory.current_stock < 20 ? 'CRITICAL LOW STOCK' : inventory.current_stock < 100 ? 'MODERATE STOCK' : 'INVENTORY SECURE'}
                      </span>
                    </div>

                    {/* Email Reminders System box */}
                    <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Send size={18} style={{ color: 'var(--accent)' }} />
                        Monthly Billing
                      </h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                        Scan outstanding student balances & write automated notification files/emails to reminders queue.
                      </p>
                      
                      <button
                        onClick={handleTriggerEmails}
                        className="btn btn-accent"
                        style={{ width: '100%', fontSize: '0.85rem', fontWeight: '700' }}
                        disabled={actionLoading}
                      >
                        Run Reminders Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STUDENTS PANEL */}
            {activeTab === 'students' && (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', color: 'var(--text-main)' }}>Student Database Registry</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Add new department students and edit accounts.</p>
                  </div>
                  <button onClick={() => {
                    setStudentForm({ student_id: '', name: '', email: '', department: '', batch: '' });
                    setShowAddStudent(true);
                  }} className="btn btn-primary">
                    <Plus size={18} />
                    Register New Student
                  </button>
                </div>

                {/* Instant search input */}
                <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Search instantly by Student ID or Name..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      style={{ flexGrow: 1 }}
                    />
                  </div>
                </div>

                {/* Students list */}
                {filteredStudents.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <Users size={40} style={{ marginBottom: '1rem', color: 'var(--text-light)', opacity: 0.5 }} />
                    <p style={{ fontWeight: '600' }}>No students found matching filters.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Full Name</th>
                          <th>Dept & Batch</th>
                          <th>Bags Taken</th>
                          <th>Total Cost</th>
                          <th>Total Paid</th>
                          <th>Outstanding Due</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((s) => {
                          const outstanding = parseFloat(s.due_amount || 0);
                          const totalCostVal = parseFloat(s.total_cost || 0);
                          const totalPaidVal = parseFloat(s.total_paid || 0);

                          return (
                            <tr key={s.id}>
                              <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{s.student_id}</td>
                              <td style={{ fontWeight: '600' }}>{s.name}</td>
                              <td>{s.department} (Batch {s.batch})</td>
                              <td style={{ fontWeight: '600' }}>{s.total_tea_bags}</td>
                              <td>{totalCostVal.toFixed(0)} BDT</td>
                              <td style={{ color: 'var(--success)' }}>{totalPaidVal.toFixed(0)} BDT</td>
                              <td style={{
                                fontWeight: '700',
                                color: outstanding > 0 ? 'var(--danger)' : 'var(--success)'
                              }}>
                                {outstanding.toFixed(2)} BDT
                              </td>
                              <td>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                  <button onClick={() => openStudentDetail(s.student_id)} className="btn btn-secondary btn-icon-only" style={{ width: '2rem', height: '2rem' }} title="View Details">
                                    <Eye size={14} />
                                  </button>
                                  <button onClick={() => {
                                    setStudentForm({
                                      student_id: s.student_id,
                                      name: s.name,
                                      email: s.email,
                                      department: s.department,
                                      batch: s.batch
                                    });
                                    setShowEditStudent(s);
                                  }} className="btn btn-secondary btn-icon-only" style={{ width: '2rem', height: '2rem' }} title="Edit Profile">
                                    <Edit size={14} />
                                  </button>
                                  <button onClick={() => handleDeleteStudent(s.id)} className="btn btn-secondary btn-icon-only" style={{ width: '2rem', height: '2rem', color: 'var(--danger)' }} title="Delete Student">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* INVENTORY PANEL */}
            {activeTab === 'inventory' && (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', color: 'var(--text-main)' }}>Tea Inventory Registry</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Track current stock levels and restock items.</p>
                  </div>
                  <button onClick={() => setShowAddStock(true)} className="btn btn-primary">
                    <Plus size={18} />
                    Restock Tea Bags
                  </button>
                </div>

                <div className="dashboard-grid">
                  <div className="card stat-card" style={{ borderLeft: `3px solid ${getStockAlertColor(inventory.current_stock)}` }}>
                    <div className="stat-info">
                      <span className="stat-label">Current Stock</span>
                      <span className="stat-val">{inventory.current_stock}</span>
                    </div>
                    <div className="stat-icon" style={{ color: getStockAlertColor(inventory.current_stock) }}>
                      <Coffee size={24} />
                    </div>
                  </div>

                  <div className="card stat-card">
                    <div className="stat-info">
                      <span className="stat-label">Total Purchased</span>
                      <span className="stat-val">{inventory.total_purchased}</span>
                    </div>
                    <div className="stat-icon">
                      <Plus size={24} />
                    </div>
                  </div>

                  <div className="card stat-card">
                    <div className="stat-info">
                      <span className="stat-label">Total Distributed</span>
                      <span className="stat-val">{inventory.total_distributed}</span>
                    </div>
                    <div className="stat-icon">
                      <Coffee size={24} style={{ opacity: 0.7 }} />
                    </div>
                  </div>
                </div>

                {/* Stock Audit logs */}
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-main)' }}>Stock Movement Logs</h3>
                  {inventory.logs.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No stock movements logged yet.</p>
                  ) : (
                    <div className="table-container" style={{ margin: 0 }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date & Time</th>
                            <th>Stock Added</th>
                            <th>Stock Used</th>
                            <th>Stock Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventory.logs.map((log) => (
                            <tr key={log.id}>
                              <td style={{ fontWeight: '500' }}>{new Date(log.created_at).toLocaleString()}</td>
                              <td style={{ color: log.stock_added > 0 ? 'var(--success)' : 'inherit', fontWeight: log.stock_added > 0 ? '700' : 'normal' }}>
                                {log.stock_added > 0 ? `+${log.stock_added} bags` : '-'}
                              </td>
                              <td style={{ color: log.stock_used > 0 ? 'var(--danger)' : 'inherit', fontWeight: log.stock_used > 0 ? '700' : 'normal' }}>
                                {log.stock_used > 0 ? `-${log.stock_used} bags` : '-'}
                              </td>
                              <td style={{ fontWeight: '700' }}>{log.stock_remaining} bags</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TRANSACTION LOGS PANEL */}
            {activeTab === 'logs' && (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', color: 'var(--text-main)' }}>Transaction Audit Logs</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Consolidated ledger of student tea distributions and payments.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      className="form-input"
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      <option value="all">All Transactions</option>
                      <option value="distribution">Only Tea Distributions</option>
                      <option value="payment">Only Payments</option>
                    </select>
                  </div>
                </div>

                {filteredLogs.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <DollarSign size={40} style={{ marginBottom: '1rem', color: 'var(--text-light)', opacity: 0.5 }} />
                    <p style={{ fontWeight: '600' }}>No transaction logs match filters.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Student ID</th>
                          <th>Student Name</th>
                          <th>Dept & Batch</th>
                          <th>Type</th>
                          <th>Details</th>
                          <th>Total Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map((log) => {
                          const isDist = log.type === 'distribution';
                          return (
                            <tr key={log.id}>
                              <td style={{ fontWeight: '500' }}>{new Date(log.date).toLocaleString()}</td>
                              <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{log.student_id}</td>
                              <td style={{ fontWeight: '600' }}>{log.student_name}</td>
                              <td>{log.department} (Batch {log.batch})</td>
                              <td>
                                <span className={`badge ${isDist ? 'badge-info' : 'badge-success'}`}>
                                  {isDist ? 'Tea Distributed' : 'Payment Received'}
                                </span>
                              </td>
                              <td>
                                {isDist ? `${log.quantity} bags @ ${parseFloat(log.rate).toFixed(0)} BDT` : 'Student Payment'}
                              </td>
                              <td style={{
                                fontWeight: '800',
                                color: isDist ? 'var(--text-main)' : 'var(--success)'
                              }}>
                                {isDist ? `${parseFloat(log.amount).toFixed(2)} BDT` : `- ${parseFloat(log.amount).toFixed(2)} BDT`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* DIALOG MODALS & OVERLAYS */}

      {/* Register Student Modal */}
      {showAddStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>Register New Student</h3>
              <button onClick={() => setShowAddStudent(false)} className="btn btn-secondary btn-icon-only" style={{ width: '2rem', height: '2rem' }}>×</button>
            </div>
            <form onSubmit={handleAddStudent}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="new-student-id">Student ID</label>
                  <input id="new-student-id" className="form-input" type="text" required placeholder="CSE-2023-045" value={studentForm.student_id} onChange={(e) => setStudentForm({ ...studentForm, student_id: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-student-name">Full Name</label>
                  <input id="new-student-name" className="form-input" type="text" required placeholder="John Doe" value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-student-email">Email Address</label>
                  <input id="new-student-email" className="form-input" type="email" required placeholder="johndoe@tea.edu" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-student-dept">Department</label>
                  <input id="new-student-dept" className="form-input" type="text" required placeholder="Computer Science" value={studentForm.department} onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-student-batch">Batch Name</label>
                  <input id="new-student-batch" className="form-input" type="text" required placeholder="2023" value={studentForm.batch} onChange={(e) => setStudentForm({ ...studentForm, batch: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddStudent(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Creating...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>Edit Student Details</h3>
              <button onClick={() => setShowEditStudent(null)} className="btn btn-secondary btn-icon-only" style={{ width: '2rem', height: '2rem' }}>×</button>
            </div>
            <form onSubmit={handleEditStudent}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Student ID (Cannot be changed)</label>
                  <input className="form-input" type="text" disabled value={showEditStudent.student_id} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-student-name">Full Name</label>
                  <input id="edit-student-name" className="form-input" type="text" required value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-student-email">Email Address</label>
                  <input id="edit-student-email" className="form-input" type="email" required value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-student-dept">Department</label>
                  <input id="edit-student-dept" className="form-input" type="text" required value={studentForm.department} onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-student-batch">Batch Name</label>
                  <input id="edit-student-batch" className="form-input" type="text" required value={studentForm.batch} onChange={(e) => setStudentForm({ ...studentForm, batch: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditStudent(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Inventory Modal */}
      {showAddStock && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>Restock Tea Bags</h3>
              <button onClick={() => setShowAddStock(false)} className="btn btn-secondary btn-icon-only" style={{ width: '2rem', height: '2rem' }}>×</button>
            </div>
            <form onSubmit={handleAddStock}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="restock-qty">Quantity to Purchase</label>
                  <input id="restock-qty" className="form-input" type="number" required min="1" placeholder="e.g., 200" value={stockQty} onChange={(e) => setStockQty(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddStock(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Restocking...' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Tea Distribution Modal */}
      {showDistribute && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>Record Tea Distribution</h3>
              <button onClick={() => setShowDistribute(false)} className="btn btn-secondary btn-icon-only" style={{ width: '2rem', height: '2rem' }}>×</button>
            </div>
            <form onSubmit={handleDistribute}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="distribute-student-id">Select Student (Enter ID)</label>
                  <input id="distribute-student-id" className="form-input" type="text" required placeholder="CSE-2023-045" value={distributeForm.student_id} onChange={(e) => setDistributeForm({ ...distributeForm, student_id: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="distribute-qty">Quantity of Tea Bags</label>
                  <input id="distribute-qty" className="form-input" type="number" required min="1" value={distributeForm.quantity} onChange={(e) => setDistributeForm({ ...distributeForm, quantity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="distribute-unit-price">Unit Price (BDT)</label>
                  <input id="distribute-unit-price" className="form-input" type="number" step="any" required value={distributeForm.unit_price} onChange={(e) => setDistributeForm({ ...distributeForm, unit_price: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowDistribute(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-accent" disabled={actionLoading}>
                  {actionLoading ? 'Recording...' : 'Record Distribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>Record Student Payment</h3>
              <button onClick={() => setShowPayment(false)} className="btn btn-secondary btn-icon-only" style={{ width: '2rem', height: '2rem' }}>×</button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="payment-student-id">Select Student (Enter ID)</label>
                  <input id="payment-student-id" className="form-input" type="text" required placeholder="CSE-2023-045" value={paymentForm.student_id} onChange={(e) => setPaymentForm({ ...paymentForm, student_id: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="payment-amount">Amount Paid (BDT)</label>
                  <input id="payment-amount" className="form-input" type="number" step="any" required min="0.01" placeholder="e.g., 50.00" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPayment(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Details Modal */}
      {viewStudentDetail && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header" style={{ borderLeft: '5px solid var(--primary)' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>{viewStudentDetail.student.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>ID: {viewStudentDetail.student.student_id}</span>
              </div>
              <button onClick={() => setViewStudentDetail(null)} className="btn btn-secondary btn-icon-only" style={{ width: '2rem', height: '2rem' }}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              
              {/* Profile card summary */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                backgroundColor: 'var(--bg-main)',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</span>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{viewStudentDetail.student.department}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Batch</span>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{viewStudentDetail.student.batch}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</span>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{viewStudentDetail.student.email}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Balance Due</span>
                  <span style={{
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    color: parseFloat(viewStudentDetail.student.due_amount) > 0 ? 'var(--danger)' : 'var(--success)'
                  }}>
                    {parseFloat(viewStudentDetail.student.due_amount).toFixed(2)} BDT
                  </span>
                </div>
              </div>

              {/* Student stats row */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', marginBottom: '1.5rem', textAlign: 'center' }}>
                <div style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bags Taken</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>{viewStudentDetail.student.total_tea_bags}</span>
                </div>
                <div style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Bills</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>{parseFloat(viewStudentDetail.student.total_cost).toFixed(0)} BDT</span>
                </div>
                <div style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Paid</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--success)' }}>{parseFloat(viewStudentDetail.student.total_paid).toFixed(0)} BDT</span>
                </div>
              </div>

              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>Recent Transactions</h4>
              {viewStudentDetail.history.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>No billing transactions found.</p>
              ) : (
                <div className="table-container" style={{ margin: 0 }}>
                  <table className="data-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Bags</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewStudentDetail.history.map((h) => (
                        <tr key={h.id}>
                          <td>{new Date(h.date).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${h.type === 'distribution' ? 'badge-info' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                              {h.type === 'distribution' ? 'Tea' : 'Payment'}
                            </span>
                          </td>
                          <td>{h.type === 'distribution' ? `${h.quantity} bags` : '-'}</td>
                          <td style={{
                            fontWeight: '700',
                            color: h.type === 'distribution' ? 'inherit' : 'var(--success)'
                          }}>
                            {h.type === 'distribution' ? `${parseFloat(h.amount).toFixed(2)}` : `-${parseFloat(h.amount).toFixed(2)}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setViewStudentDetail(null)} className="btn btn-secondary">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
