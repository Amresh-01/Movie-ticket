import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Film, User, LogOut, ShieldCheck, Ticket } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="glass-panel" style={{ margin: '16px 24px', padding: '12px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <div
          onClick={() => onNavigate('movies')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
            }}
          >
            <Film size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Cine<span style={{ color: '#6366f1' }}>Hold</span>
            </h1>
          </div>
        </div>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => onNavigate('movies')}
            className={`btn ${currentView === 'movies' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', padding: '8px 14px' }}
          >
            <Film size={16} /> Movies
          </button>

          {user && (
            <button
              onClick={() => onNavigate('bookings')}
              className={`btn ${currentView === 'bookings' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.85rem', padding: '8px 14px' }}
            >
              <Ticket size={16} /> My Bookings
            </button>
          )}

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => onNavigate('admin')}
              className={`btn ${currentView === 'admin' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.85rem', padding: '8px 14px', borderColor: 'rgba(245, 158, 11, 0.4)' }}
            >
              <ShieldCheck size={16} color="#f59e0b" /> Admin
            </button>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px' }}>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{user.role}</span>
              </div>
              <button
                onClick={logout}
                className="btn btn-outline"
                title="Logout"
                style={{ padding: '8px', borderRadius: '8px' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '8px 16px' }}
            >
              <User size={16} /> Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
