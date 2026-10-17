import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MovieListPage } from './pages/MovieListPage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { ShowBookingPage } from './pages/ShowBookingPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthPage } from './pages/AuthPage';
import { AuthModal } from './components/AuthModal';
import type { Movie, BookingReceipt } from './types';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [lastReceipt, setLastReceipt] = useState<BookingReceipt | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [selectedCity, setSelectedCity] = useState<string>('New York • Times Square');

  // Derive current view from current route path
  const getCurrentView = (): string => {
    const path = location.pathname;
    if (path === '/') return 'movies';
    if (path === '/auth' || path === '/login') return 'login';
    if (path.startsWith('/movies')) return 'movie-details';
    if (path.startsWith('/shows')) return 'booking';
    if (path.startsWith('/booking/confirmation')) return 'confirmation';
    if (path === '/my-bookings') return 'bookings';
    if (path.startsWith('/admin')) return 'admin';
    return 'movies';
  };

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    navigate(`/movies/${movie.id}`);
  };

  const handleSelectShow = (showId: string) => {
    navigate(`/shows/${showId}/seats`);
  };

  const handleBookingSuccess = (receipt?: BookingReceipt) => {
    if (receipt) {
      setLastReceipt(receipt);
      navigate(`/booking/confirmation/${receipt.id}`);
    } else {
      navigate('/my-bookings');
    }
  };

  const currentView = getCurrentView();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Universal Responsive Navbar (hidden on auth/login page) */}
      {currentView !== 'login' && (
        <Navbar
          currentView={currentView}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          onNavigate={(view) => {
            if (view === 'login') {
              navigate('/auth');
            } else if (view === 'movies') {
              navigate('/');
            } else if (view === 'bookings') {
              navigate('/my-bookings');
            } else if (view === 'admin') {
              navigate('/admin');
            }
          }}
        />
      )}

      {/* Declarative React Router Routes */}
      <main style={{ flex: 1, paddingBottom: '40px' }}>
        <Routes>
          {/* Route 1: Movie Discovery Homepage */}
          <Route
            path="/"
            element={
              <MovieListPage
                onSelectMovie={handleSelectMovie}
                onSelectShow={handleSelectShow}
              />
            }
          />

          {/* Route 2: Movie Details & Showtime Selection */}
          <Route
            path="/movies/:movieId"
            element={
              <MovieDetailsPage
                movie={selectedMovie}
                onBack={() => navigate('/')}
                onSelectShow={handleSelectShow}
              />
            }
          />

          {/* Route 3: Interactive 3D Cinema Seat Selection */}
          <Route
            path="/shows/:showId/seats"
            element={
              <ShowBookingPage
                movie={selectedMovie}
                onBack={() => {
                  if (selectedMovie) {
                    navigate(`/movies/${selectedMovie.id}`);
                  } else {
                    navigate('/');
                  }
                }}
                onBookingSuccess={handleBookingSuccess}
              />
            }
          />

          {/* Route 4: Confirmed Admission Ticket Pass */}
          <Route
            path="/booking/confirmation/:bookingId"
            element={
              lastReceipt ? (
                <BookingConfirmationPage
                  receipt={lastReceipt}
                  onNavigateToBookings={() => navigate('/my-bookings')}
                  onNavigateToMovies={() => navigate('/')}
                />
              ) : (
                <MyBookingsPage
                  onExploreMovies={() => navigate('/')}
                />
              )
            }
          />

          {/* Route 5: Customer My Bookings History */}
          <Route
            path="/my-bookings"
            element={
              <MyBookingsPage
                onViewConfirmation={(receipt) => {
                  setLastReceipt(receipt);
                  navigate(`/booking/confirmation/${receipt.id}`);
                }}
                onExploreMovies={() => navigate('/')}
              />
            }
          />

          {/* Route 6: Admin Dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Route 7: Dedicated Full-Page Sign In / Sign Up View */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />

          {/* Catch-all redirect to Home */}
          <Route
            path="*"
            element={
              <MovieListPage
                onSelectMovie={handleSelectMovie}
                onSelectShow={handleSelectShow}
              />
            }
          />
        </Routes>
      </main>

      {/* Global Auth Modal */}
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
          padding: '24px 16px',
          color: '#6B7280',
          fontSize: '0.82rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(11, 13, 18, 0.95)',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span>© {new Date().getFullYear()} CineSpot. All rights reserved.</span>
          <span>Screen 1 • 80 Cinema Seats • Clean & Fast Booking</span>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
