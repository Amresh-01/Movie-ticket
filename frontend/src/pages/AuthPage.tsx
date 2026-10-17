import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { User, LogIn, Lock, Mail, Film, ArrowLeft, ShieldCheck, CheckCircle } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  // If already logged in, provide easy redirect
  const redirectPath = (location.state as any)?.from || '/';

  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // If already authenticated, redirect or show logged in state
  if (user) {
    return (
      <div style={{ maxWidth: '500px', margin: '80px auto', padding: '24px' }}>
        <div className="glass-panel" style={{ padding: '40px 32px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(56, 201, 139, 0.15)',
              border: '1px solid rgba(56, 201, 139, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <CheckCircle size={32} color="#38C98B" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
            Already Signed In
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
            You are signed in as <strong>{user.name}</strong> ({user.email}) with role <strong>{user.role}</strong>.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {user.role === 'ADMIN' ? (
              <button
                onClick={() => navigate('/admin')}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                Go to Admin Portal
              </button>
            ) : (
              <button
                onClick={() => navigate(redirectPath)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                Continue to Cinema Experience
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="btn btn-outline"
              style={{ width: '100%', padding: '10px' }}
            >
              Browse Movies
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { name, email, password } : { email, password };

      const res = await apiRequest<{ user: any; token: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        if (res.data.user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate(redirectPath);
        }
      } else {
        setError(res.error?.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 160px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '36px 32px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
        }}
      >
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '0.85rem',
            cursor: 'pointer',
            padding: '0 0 16px 0',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Branding header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #FF5A6E 0%, #8B5CF6 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(255, 90, 110, 0.35)',
              marginBottom: '14px',
            }}
          >
            <Film size={26} color="#FFFFFF" />
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 900, letterSpacing: '-0.025em' }}>
            {isRegister ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '6px' }}>
            {isRegister
              ? 'Join Yozigo Cinemas to select and book your movie tickets.'
              : 'Sign in to access your luxury 3D cinema passes.'}
          </p>
        </div>

        {/* Toggle Mode Pills */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '22px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            style={{
              padding: '9px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: !isRegister ? 'linear-gradient(135deg, #FF5A6E 0%, #E11D48 100%)' : 'transparent',
              color: !isRegister ? '#fff' : '#94a3b8',
              boxShadow: !isRegister ? '0 3px 10px rgba(255, 90, 110, 0.3)' : 'none',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            style={{
              padding: '9px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: isRegister ? 'linear-gradient(135deg, #FF5A6E 0%, #E11D48 100%)' : 'transparent',
              color: isRegister ? '#fff' : '#94a3b8',
              boxShadow: isRegister ? '0 3px 10px rgba(255, 90, 110, 0.3)' : 'none',
            }}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.18)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '0.86rem',
              marginBottom: '18px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={17} color="#94a3b8" style={{ position: 'absolute', left: '13px', top: '13px' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 42px',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid var(--border-glass)',
                    color: '#fff',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={17} color="#94a3b8" style={{ position: 'absolute', left: '13px', top: '13px' }} />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 42px',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid var(--border-glass)',
                  color: '#fff',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={17} color="#94a3b8" style={{ position: 'absolute', left: '13px', top: '13px' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 42px',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid var(--border-glass)',
                  color: '#fff',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '13px', fontSize: '0.95rem', fontWeight: 700 }}
          >
            <LogIn size={18} />
            {loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        {/* One-Click Quick Mode Actions (Guest Customer / Demo Admin) */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '12px', fontWeight: 600 }}>
            Or continue instantly with demo access:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setError(null);
                setLoading(true);
                try {
                  const res = await apiRequest<{ user: any; token: string }>('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email: 'customer@test.com', password: 'Customer@12345Password!' }),
                  });
                  if (res.success && res.data) {
                    login(res.data.token, res.data.user);
                    navigate(redirectPath);
                  } else {
                    setError('Unable to log in as Guest.');
                  }
                } finally {
                  setLoading(false);
                }
              }}
              className="btn btn-outline"
              style={{
                padding: '10px 12px',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                borderColor: 'rgba(56, 201, 139, 0.35)',
                color: '#34D399',
                background: 'rgba(56, 201, 139, 0.08)',
              }}
            >
              <User size={15} />
              <span>Guest Mode</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setError(null);
                setLoading(true);
                try {
                  const res = await apiRequest<{ user: any; token: string }>('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email: 'admin@cinema.com', password: 'Admin@12345Password!' }),
                  });
                  if (res.success && res.data) {
                    login(res.data.token, res.data.user);
                    navigate('/admin');
                  } else {
                    setError('Unable to log in as Demo Admin.');
                  }
                } finally {
                  setLoading(false);
                }
              }}
              className="btn btn-outline"
              style={{
                padding: '10px 12px',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                borderColor: 'rgba(245, 158, 11, 0.35)',
                color: '#FBBF24',
                background: 'rgba(245, 158, 11, 0.08)',
              }}
            >
              <ShieldCheck size={15} />
              <span>Demo Admin</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
          {isRegister ? 'Already registered?' : 'Need a new cinema account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#FF5A6E',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              marginLeft: '4px',
            }}
          >
            {isRegister ? 'Sign in here' : 'Sign up now'}
          </button>
        </div>
      </div>
    </div>
  );
};
