import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MovieListPage } from './pages/MovieListPage';
import { ShowBookingPage } from './pages/ShowBookingPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthModal } from './components/AuthModal';

const MainLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<'movies' | 'booking' | 'bookings' | 'admin'>('movies');
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const handleSelectShow = (showId: string) => {
    setSelectedShowId(showId);
    setCurrentView('booking');
  };

  const handleBookingSuccess = () => {
    setCurrentView('bookings');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'login') {
            setShowAuthModal(true);
          } else {
            setCurrentView(view as any);
          }
        }}
      />

      <main style={{ flex: 1, paddingBottom: '40px' }}>
        {currentView === 'movies' && (
          <MovieListPage onSelectShow={handleSelectShow} />
        )}

        {currentView === 'booking' && selectedShowId && (
          <ShowBookingPage
            showId={selectedShowId}
            onBack={() => setCurrentView('movies')}
            onBookingSuccess={handleBookingSuccess}
          />
        )}

        {currentView === 'bookings' && <MyBookingsPage />}

        {currentView === 'admin' && <AdminDashboard />}
      </main>

      {showAuthModal && (
        <AuthModal
          onSuccess={() => setShowAuthModal(false)}
          onCancel={() => setShowAuthModal(false)}
        />
      )}

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '24px',
          color: '#64748b',
          fontSize: '0.8rem',
          borderTop: '1px solid var(--border-glass)',
        }}
      >
        CineHold Cinema Booking System • 80 Seats Single Screen • Powered by PostgreSQL Pessimistic Locks & React
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
