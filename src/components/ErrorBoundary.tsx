import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-container">
          <div className="error-card">
            <div className="error-icon">⚠️</div>
            <h2>Ups! Terjadi kesalahan sistem</h2>
            <p>
              Gagal memuat modul Traveling. Hal ini biasanya terjadi jika data offline Anda tidak lengkap atau tidak valid.
            </p>
            {this.state.error && (
              <pre className="error-stack">
                {this.state.error.message}
              </pre>
            )}
            <button 
              className="error-reset-btn"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('harmony_budget_state_guest');
                  const savedTheme = localStorage.getItem('harmony_budget_theme');
                  localStorage.clear();
                  if (savedTheme) localStorage.setItem('harmony_budget_theme', savedTheme);
                  window.location.reload();
                }
              }}
            >
              Reset Data Offline & Muat Ulang
            </button>
          </div>

          <style jsx>{`
            .error-boundary-container {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 350px;
              padding: 24px;
              width: 100%;
            }
            .error-card {
              background: rgba(255, 255, 255, 0.05);
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 24px;
              padding: 32px;
              max-width: 480px;
              width: 100%;
              text-align: center;
              box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
            }
            .error-icon {
              font-size: 48px;
              margin-bottom: 16px;
            }
            .error-card h2 {
              font-size: 20px;
              font-weight: 600;
              margin-bottom: 12px;
              color: #fca5a5;
            }
            .error-card p {
              font-size: 14px;
              color: rgba(255, 255, 255, 0.7);
              line-height: 1.6;
              margin-bottom: 20px;
            }
            .error-stack {
              text-align: left;
              background: rgba(0, 0, 0, 0.3);
              padding: 12px;
              border-radius: 12px;
              font-size: 11px;
              font-family: monospace;
              color: #f87171;
              overflow-x: auto;
              max-height: 120px;
              margin-bottom: 24px;
              border: 1px solid rgba(248, 113, 113, 0.2);
            }
            .error-reset-btn {
              background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
              border: none;
              color: white;
              font-size: 14px;
              font-weight: 500;
              padding: 12px 24px;
              border-radius: 12px;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
            }
            .error-reset-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
            }
            .error-reset-btn:active {
              transform: translateY(0);
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
