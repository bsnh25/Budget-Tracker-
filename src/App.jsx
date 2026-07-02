import React, { useState } from 'react';
import './App.css';
import { useBudget } from './useBudget';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Categories from './components/Categories';
import History from './components/History';
import Login from './components/Login';
import Settings from './components/Settings';

function App() {
  const budget = useBudget();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (budget.isAuthLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 0%, var(--bg-obsidian-light) 0%, var(--bg-obsidian-dark) 85%)',
        color: 'var(--text-primary)',
        gap: '1.5rem',
        fontFamily: 'Outfit, sans-serif'
      }}>
        <div style={{
          position: 'relative',
          width: '80px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '2px solid transparent',
            borderTopColor: 'var(--color-primary)',
            borderBottomColor: 'var(--color-secondary)',
            borderRadius: '50%',
            animation: 'spin 1.5s linear infinite',
            filter: 'drop-shadow(0 0 8px var(--color-primary-glow))'
          }} />
          <div style={{
            position: 'absolute',
            width: '70%',
            height: '70%',
            border: '2px solid transparent',
            borderRightColor: '#f43f5e',
            borderLeftColor: '#10b981',
            borderRadius: '50%',
            animation: 'spinReverse 1s linear infinite'
          }} />
          <span style={{ fontSize: '2.2rem', animation: 'pulse 1.8s ease-in-out infinite' }}>🌌</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            letterSpacing: '0.05em',
            background: 'linear-gradient(to right, #c084fc, #38bdf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            {budget.language === 'id' ? 'Menghubungkan ke Cloud' : 'Connecting to Cloud'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {budget.language === 'id' ? 'Menyelaraskan basis data finansial...' : 'Synchronizing financial databases...'}
          </p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes spinReverse {
            to { transform: rotate(-360deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.15); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (!budget.user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      {/* Mobile top-bar header */}
      <div className="mobile-top-bar">
        <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
          ☰
        </button>
        <span className="mobile-brand-title">🌌 KiaBiyu Budget</span>
      </div>

      {/* Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* 1. Sticky Navigation Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div>
          <div className="sidebar-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.8rem' }}>🌌</span>
              <span>KiaBiyu Budget Tracker</span>
            </div>
            <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
              &times;
            </button>
          </div>

          <ul className="sidebar-menu">
            <li 
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            >
              <span style={{ fontSize: '1.2rem' }}>📊</span>
              <span>{budget.t('dashboard')}</span>
            </li>
            <li 
              className={`sidebar-item ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => { setActiveTab('transactions'); setIsSidebarOpen(false); }}
            >
              <span style={{ fontSize: '1.2rem' }}>🧾</span>
              <span>{budget.t('ledgerBook')}</span>
            </li>
            <li 
              className={`sidebar-item ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => { setActiveTab('categories'); setIsSidebarOpen(false); }}
            >
              <span style={{ fontSize: '1.2rem' }}>🏷️</span>
              <span>{budget.t('categoryPlanner')}</span>
            </li>
            <li 
              className={`sidebar-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}
            >
              <span style={{ fontSize: '1.2rem' }}>📈</span>
              <span>{budget.t('historyRollovers')}</span>
            </li>
            <li 
              className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
            >
              <span style={{ fontSize: '1.2rem' }}>⚙️</span>
              <span>{budget.language === 'id' ? 'Pengaturan' : 'Settings'}</span>
            </li>
          </ul>
        </div>

        {/* Minimal Premium Sidebar Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
          {budget.user ? (
            <div className="glass-panel" style={{
              padding: '0.65rem 0.75rem',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>👤</span>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  width: '100%'
                }} title={budget.user?.email}>
                  {budget.user?.email}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {budget.language === 'id' ? 'Tersambung (Real-time)' : 'Connected (Real-time)'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '0.5rem' }}>
              ℹ️ {budget.language === 'id' ? 'Mode Tamu Luring' : 'Guest Offline Mode'}
            </div>
          )}
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', opacity: 0.6 }}>
            v1.1.0 • KiaBiyu Budget Tracker
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation Header */}
      <div className="mobile-header" style={{ display: 'none' }}>
        {/* We can write small media query in CSS to show it. It's standard for layout polish */}
      </div>

      {/* 2. Main Content View Router */}
      <main className="main-content">


        {/* View Switcher Routing */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            budget={budget} 
            openLogger={() => {
              setActiveTab('transactions');
              setIsLoggerOpen(true);
            }} 
          />
        )}
        
        {activeTab === 'transactions' && (
          <Transactions 
            budget={budget} 
            isLoggerOpen={isLoggerOpen} 
            openLogger={() => setIsLoggerOpen(true)}
            closeLogger={() => setIsLoggerOpen(false)} 
          />
        )}
        
        {activeTab === 'categories' && (
          <Categories budget={budget} />
        )}
        
        {activeTab === 'history' && (
          <History budget={budget} />
        )}
        
        {activeTab === 'settings' && (
          <Settings budget={budget} />
        )}

      </main>

      {/* Global Glassmorphic Confirm Popup */}
      {budget.confirmDialog && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center', border: '1px solid var(--glass-border-focus)' }}>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '1rem', fontFamily: 'Outfit', color: budget.confirmDialog.isDanger ? 'var(--color-danger)' : 'var(--text-primary)' }}>
              {budget.confirmDialog.title || (budget.language === 'id' ? 'Konfirmasi Tindakan' : 'Confirm Action')}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: '1.4' }}>
              {budget.confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn btn-secondary" 
                onClick={budget.closeConfirm}
                style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
              >
                {budget.confirmDialog.cancelText || budget.t('cancel')}
              </button>
              <button 
                className={budget.confirmDialog.isDanger ? 'btn btn-danger' : 'btn btn-primary'}
                onClick={() => {
                  budget.confirmDialog.onConfirm();
                  budget.closeConfirm();
                }}
                style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', border: 'none' }}
              >
                {budget.confirmDialog.confirmText || (budget.confirmDialog.isDanger ? (budget.language === 'id' ? 'Hapus' : 'Delete') : (budget.language === 'id' ? 'Ya' : 'Confirm'))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
