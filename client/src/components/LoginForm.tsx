import React, { useState } from 'react';
import { api, UserProfile } from '../api/client';

interface LoginFormProps {
  onSuccess: (user: UserProfile) => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      if (res.data?.user) {
        onSuccess(res.data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="card-title">Welcome Back</h2>
      <p className="card-subtitle">Sign in to verify dual-mode HttpOnly cookie authentication.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label className="form-label" htmlFor="login-email">
          Email Address
        </label>
        <input
          id="login-email"
          type="email"
          required
          className="form-input"
          placeholder="e.g. dr.smith@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          required
          className="form-input"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Authenticating...' : 'Sign In'}
      </button>

      <button
        type="button"
        className="btn btn-outline"
        onClick={onSwitchToRegister}
        disabled={loading}
      >
        Need an account? Register
      </button>
    </form>
  );
};
