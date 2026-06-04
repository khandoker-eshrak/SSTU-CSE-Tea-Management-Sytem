import React, { useState, useEffect } from 'react';
import { Sun, Moon, Coffee, ShieldCheck } from 'lucide-react';
import Welcome from './pages/Welcome.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { api } from './api.js';

export default function App() {
  const [page, setPage] = useState('welcome'); // welcome, student-dashboard, admin-login, admin-dashboard
  
  // Student Context
  const [activeStudent, setActiveStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);

  // Theme Management
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tea_theme') || 'light';
  });

  // Check auth session on boot
  useEffect(() => {
    if (api.isAuthenticated()) {
      setPage('admin-dashboard');
    }
  }, []);

  // Sync theme with HTML attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tea_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleStudentFound = (student, history) => {
    setActiveStudent(student);
    setStudentHistory(history);
    setPage('student-dashboard');
  };

  const handleAdminLoginSuccess = () => {
    setPage('admin-dashboard');
  };

  const handleLogout = () => {
    setPage('welcome');
  };

  return (
    <div className="app-container">
      {/* Universal Header Bar */}
      <header className="navbar">
        <div className="brand" onClick={() => !api.isAuthenticated() && setPage('welcome')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">
            <Coffee size={20} />
          </div>
          <span>University Tea Ledger</span>
        </div>
        
        <div className="nav-actions">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-icon-only"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Admin badge if logged in */}
          {page === 'admin-dashboard' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: '700'
            }}>
              <ShieldCheck size={14} />
              <span>Admin Session</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Page Routing Wrapper */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {page === 'welcome' && (
            <Welcome
              onStudentFound={handleStudentFound}
              navigateToAdminLogin={() => setPage('admin-login')}
            />
          )}

          {page === 'student-dashboard' && (
            <StudentDashboard
              student={activeStudent}
              history={studentHistory}
              onBack={() => {
                setActiveStudent(null);
                setStudentHistory([]);
                setPage('welcome');
              }}
            />
          )}

          {page === 'admin-login' && (
            <AdminLogin
              onLoginSuccess={handleAdminLoginSuccess}
              onBack={() => setPage('welcome')}
            />
          )}

          {page === 'admin-dashboard' && (
            <AdminDashboard
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>

      {/* Shared Footer branding */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--bg-card)',
        transition: 'var(--transition)'
      }}>
        © {new Date().getFullYear()} University Department. Built for academic tea distribution tracking.
      </footer>
    </div>
  );
}
