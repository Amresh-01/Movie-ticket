import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Film, User, LogOut, Ticket, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();

  const isAuthView = currentView === 'login';

  return (
    <header
      style={{
        position: isAuthView ? 'relative' : 'sticky',
        top: isAuthView ? '0' : '12px',
        zIndex: 50,
        maxWidth: '1260px',
        margin: '0 auto 24px',
        padding: '0 16px',
        width: '100%',
      }}
    >
      <nav
        style={{
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Brand Logo with CineSpot Theme */}
        <div
          onClick={() => onNavigate('movies')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FF385C 0%, #E11D48 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(255, 56, 92, 0.35)',
            }}
          >
            <Film size={22} color="#FFFFFF" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#0F172A' }}>
                Cine
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#FF385C' }}>
                Spot
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '0.64rem',
                  color: '#64748B',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                }}
              >
                Cinema Experience
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  color: '#059669',
                  background: '#ECFDF5',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontWeight: 800,
                  border: '1px solid #A7F3D0',
                }}
              >
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Movies Button */}
          <button
            onClick={() => onNavigate('movies')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              color: currentView === 'movies' || currentView === 'movie-details' ? '#FFFFFF' : '#475569',
              background:
                currentView === 'movies' || currentView === 'movie-details'
                  ? 'linear-gradient(135deg, #FF5A6E 0%, #E11D48 100%)'
                  : 'transparent',
              boxShadow:
                currentView === 'movies' || currentView === 'movie-details'
                  ? '0 3px 10px rgba(255, 90, 110, 0.3)'
                  : 'none',
            }}
            onMouseEnter={(e) => {
              if (currentView !== 'movies' && currentView !== 'movie-details') {
                e.currentTarget.style.background = '#F1F5F9';
                e.currentTarget.style.color = '#0F172A';
              }
            }}
            onMouseLeave={(e) => {
              if (currentView !== 'movies' && currentView !== 'movie-details') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#475569';
              }
            }}
          >
            <Film size={15} />
            <span>Movies</span>
          </button>

          {/* Passes Tab */}
          {user && (
            <button
              onClick={() => onNavigate('bookings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.15s ease',
                color: currentView === 'bookings' || currentView === 'confirmation' ? '#FFFFFF' : '#475569',
                background:
                  currentView === 'bookings' || currentView === 'confirmation'
                    ? 'linear-gradient(135deg, #FF5A6E 0%, #E11D48 100%)'
                    : 'transparent',
                boxShadow:
                  currentView === 'bookings' || currentView === 'confirmation'
                    ? '0 3px 10px rgba(255, 90, 110, 0.3)'
                    : 'none',
              }}
              onMouseEnter={(e) => {
                if (currentView !== 'bookings' && currentView !== 'confirmation') {
                  e.currentTarget.style.background = '#F1F5F9';
                  e.currentTarget.style.color = '#0F172A';
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'bookings' && currentView !== 'confirmation') {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }
              }}
            >
              <Ticket size={15} />
              <span>My Passes</span>
            </button>
          )}

          {/* Admin Tab */}
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => onNavigate('admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 13px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid #FCD34D',
                background: currentView === 'admin' ? '#FEF3C7' : '#FFFBEB',
                color: '#B45309',
              }}
            >
              <ShieldCheck size={14} />
              <span>Admin</span>
            </button>
          )}

          {/* User Account Capsule / Sign In */}
          {user ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px 10px 4px 6px',
                borderRadius: '12px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                marginLeft: '4px',
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#FFFFFF',
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>{user.name}</div>
                <div style={{ fontSize: '0.68rem', color: user.role === 'ADMIN' ? '#B45309' : '#64748B', fontWeight: 600 }}>
                  {user.role}
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              style={{
                background: 'linear-gradient(135deg, #FF5A6E 0%, #E11D48 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 20px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 3px 10px rgba(255, 90, 110, 0.3)',
                marginLeft: '6px',
              }}
            >
              <User size={15} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};
