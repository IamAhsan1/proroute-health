import React, { useEffect, useState } from 'react';
import { api, UserProfile } from './api/client';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { AuthStatus } from './components/AuthStatus';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(true);

  // Check if an existing valid session exists via HttpOnly cookie
  useEffect(() => {
    let isMounted = true;
    api
      .getMe()
      .then((res) => {
        if (isMounted && res.data) {
          setCurrentUser(res.data);
        }
      })
      .catch(() => {
        // No active session or cookie expired
        if (isMounted) {
          setCurrentUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('login');
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon">⚕</div>
          <span className="brand-title">ProRoute</span>
          <span className="brand-badge">Phase 1: Core Auth Slice</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Healthcare Platform Architecture
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b' }}>
              Checking active session credentials...
            </div>
          ) : currentUser ? (
            <AuthStatus user={currentUser} onLogout={handleLogout} />
          ) : (
            <>
              {/* Tab Selector */}
              <div className="tabs">
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                  onClick={() => setActiveTab('login')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                  onClick={() => setActiveTab('register')}
                >
                  Create Account
                </button>
              </div>

              {activeTab === 'login' ? (
                <LoginForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToRegister={() => setActiveTab('register')}
                />
              ) : (
                <RegisterForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToLogin={() => setActiveTab('login')}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
