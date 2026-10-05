import React, { useState } from 'react';
import { api, UserProfile } from '../api/client';

interface RegisterFormProps {
  onSuccess: (user: UserProfile) => void;
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.register({
        name,
        email,
        password,
        role,
        phone: phone.trim() ? phone : undefined,
      });

      if (res.data?.user) {
        onSuccess(res.data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="card-title">Create Account</h2>
      <p className="card-subtitle">Register a Patient or Doctor account with secure Argon2id & JWT.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label className="form-label" htmlFor="register-name">
          Full Name
        </label>
        <input
          id="register-name"
          type="text"
          required
          className="form-input"
          placeholder="e.g. Dr. Jane Doe or John Patient"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="register-role">
          Account Role
        </label>
        <select
          id="register-role"
          className="form-select"
          value={role}
          onChange={(e) => setRole(e.target.value as 'PATIENT' | 'DOCTOR')}
        >
          <option value="PATIENT">Patient (Book Appointments & Consultations)</option>
          <option value="DOCTOR">Doctor / Medical Professional</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="register-email">
          Email Address
        </label>
        <input
          id="register-email"
          type="email"
          required
          className="form-input"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="register-password">
          Password
        </label>
        <input
          id="register-password"
          type="password"
          required
          className="form-input"
          placeholder="Min 8 chars, 1 upper, 1 lower, 1 number, 1 symbol"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
          Must contain min 8 chars, uppercase, lowercase, number, and special symbol (e.g. Password123!)
        </span>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="register-phone">
          Phone Number (Optional)
        </label>
        <input
          id="register-phone"
          type="tel"
          className="form-input"
          placeholder="+1 555-0199"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Creating Account...' : 'Register'}
      </button>

      <button
        type="button"
        className="btn btn-outline"
        onClick={onSwitchToLogin}
        disabled={loading}
      >
        Already have an account? Sign In
      </button>
    </form>
  );
};
