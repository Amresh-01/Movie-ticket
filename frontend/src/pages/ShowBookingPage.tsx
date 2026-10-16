import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import type { SeatInfo, ShowDetail, BookingReceipt, Movie } from '../types';
import { CinemaAuditorium3D } from '../components/CinemaAuditorium3D';
import { SeatMap } from '../components/SeatMap';
import { PaymentModal } from '../components/PaymentModal';
import { AuthModal } from '../components/AuthModal';
import { BookingProgressIndicator } from '../components/BookingProgressIndicator';
import { useAuth } from '../context/AuthContext';
import {
  ChevronLeft,
  Clock,
  DollarSign,
  Sparkles,
  ShieldAlert,
  Box,
  Grid,
  RefreshCw,
} from 'lucide-react';

import { useParams, useNavigate } from 'react-router-dom';

interface ShowBookingPageProps {
  showId?: string;
  movie?: Movie | null;
  onBack?: () => void;
  onBookingSuccess?: (receipt?: BookingReceipt) => void;
}

export const ShowBookingPage: React.FC<ShowBookingPageProps> = ({
  showId: propShowId,
  movie,
  onBack,
  onBookingSuccess,
}) => {
  const { showId: paramShowId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const showId = propShowId || paramShowId || '';
  const { user } = useAuth();
  const [show, setShow] = useState<ShowDetail | null>(null);
  const [seats, setSeats] = useState<SeatInfo[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [holding, setHolding] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Hold & Payment Modal state
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number>(300);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // View Mode: '3D' (Cinema Auditorium) or '2D' (Grid Map)
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
  const [previewSeatId, setPreviewSeatId] = useState<string | null>(null);

  useEffect(() => {
    fetchSeatData(true);

    // Live seat updates: Auto-refresh seat availability every 3 seconds
    // to catch real-time holds and bookings without manual page reload
    const interval = setInterval(() => {
      fetchSeatData(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [showId]);

  const fetchSeatData = async (isInitial = false) => {
    if (isInitial) setLoading(true);

    const res = await apiRequest<{ show: ShowDetail; seats: SeatInfo[] }>(`/shows/${showId}/seats`);

    if (res.success && res.data) {
      setShow(res.data.show);
      setSeats(res.data.seats);
    } else {
      setErrorMessage(res.error?.message || 'Could not load seating data.');
    }

    if (isInitial) setLoading(false);
  };

  const handleToggleSeat = (seatId: string) => {
    setErrorMessage(null);
    if (selectedSeatIds.includes(seatId)) {
      setSelectedSeatIds(selectedSeatIds.filter((id) => id !== seatId));
    } else {
      if (selectedSeatIds.length >= 6) {
        setErrorMessage('You can select a maximum of 6 seats per transaction.');
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, seatId]);
    }
  };

  const handleInitiateHold = async () => {
    setErrorMessage(null);

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (selectedSeatIds.length === 0) {
      setErrorMessage('Please select at least 1 seat to hold.');
      return;
    }

    setHolding(true);
    const res = await apiRequest<{
      bookingId: string;
      totalAmount: number;
      expiresInSeconds: number;
    }>(`/shows/${showId}/hold`, {
      method: 'POST',
      body: JSON.stringify({ seatIds: selectedSeatIds }),
    });

    setHolding(false);

    if (res.success && res.data) {
      setActiveBookingId(res.data.bookingId);
      setTotalAmount(res.data.totalAmount);
      setHoldSecondsLeft(res.data.expiresInSeconds);
      setShowPaymentModal(true);
      fetchSeatData(false);
    } else {
      setErrorMessage(res.error?.message || 'Could not hold selected seats. They may have just been taken.');
      fetchSeatData(false);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!activeBookingId) return;

    const res = await apiRequest<{ booking: BookingReceipt }>(`/bookings/${activeBookingId}/simulate-payment`, {
      method: 'POST',
      body: JSON.stringify({ status: 'SUCCESS' }),
    });

    if (res.success) {
      setShowPaymentModal(false);
      if (onBookingSuccess) {
        onBookingSuccess(res.data?.booking);
      } else {
        navigate('/my-bookings');
      }
    } else {
      alert(res.error?.message || 'Payment simulation failed');
    }
  };

  const handleSimulatePaymentFailure = async () => {
    if (!activeBookingId) return;

    const res = await apiRequest(`/bookings/${activeBookingId}/simulate-payment`, {
      method: 'POST',
      body: JSON.stringify({ status: 'FAILED' }),
    });

    if (!res.success) {
      alert(res.error?.message || 'Could not process payment simulation');
    }
  };

  const handleCancelHold = async () => {
    if (activeBookingId) {
      await apiRequest(`/bookings/${activeBookingId}/release`, { method: 'POST' });
    }
    setShowPaymentModal(false);
    setActiveBookingId(null);
    setSelectedSeatIds([]);
    fetchSeatData(false);
  };

  const handleHoldExpire = () => {
    alert('Your 5-minute seat hold has expired. The seats have been released back to general availability.');
    setShowPaymentModal(false);
    setActiveBookingId(null);
    setSelectedSeatIds([]);
    fetchSeatData(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 16px', color: '#94A3B8' }}>
        Loading 3D auditorium & seat availability...
      </div>
    );
  }

  if (!show) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 16px', color: '#f87171' }}>
        <h2>Show session not found</h2>
        <button onClick={onBack} className="btn btn-outline" style={{ marginTop: '16px' }}>
          Back to Movies
        </button>
      </div>
    );
  }

  // Calculate selected seat names (e.g. A1, A2)
  const selectedSeatLabels = selectedSeatIds
    .map((id) => {
      const s = seats.find((seat) => seat.seatId === id);
      return s ? `${s.row}${s.number}` : id;
    })
    .join(', ');

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 16px 40px' }}>
      {/* Visual Journey Progress Bar */}
      <BookingProgressIndicator
        currentStep="seats"
        movieTitle={show.movieTitle}
        showTime={new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      />

      {/* Top Header Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button
          onClick={() => {
            if (onBack) onBack();
            else navigate('/');
          }}
          className="btn btn-outline"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <ChevronLeft size={16} /> Back to Movies
        </button>
        <button
          onClick={() => fetchSeatData(false)}
          className="btn btn-outline"
          title="Refresh Availability"
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} /> Refresh Seats
        </button>
      </div>

      {/* Show Info & Action Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <span className="badge badge-coral" style={{ marginBottom: '6px' }}>
            Screen 1 • 80 Physical Seats
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>{show.movieTitle}</h2>
          <div style={{ display: 'flex', gap: '20px', marginTop: '6px', color: '#A7ADBC', fontSize: '0.88rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={14} />{' '}
              {new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <DollarSign size={14} /> ${Number(show.price).toFixed(2)} / seat
            </span>
          </div>
        </div>

        {/* Selection checkout summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
              {selectedSeatIds.length} seat(s) selected
              {selectedSeatLabels && ` (${selectedSeatLabels})`}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38C98B' }}>
              ${(selectedSeatIds.length * Number(show.price)).toFixed(2)}
            </div>
          </div>
          <button
            onClick={handleInitiateHold}
            disabled={selectedSeatIds.length === 0 || holding}
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontSize: '1rem' }}
          >
            <Sparkles size={16} />
            {holding ? 'Holding Seats...' : 'Proceed to Checkout'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#FF626E',
            marginBottom: '20px',
            fontSize: '0.9rem',
          }}
        >
          <ShieldAlert size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Seat Map Area */}
      <div className="glass-panel" style={{ padding: '24px 24px', marginBottom: '40px' }}>
        {/* View Mode Switcher & Legend Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>Auditorium View:</span>
            <button
              onClick={() => setViewMode('3D')}
              className={`btn ${viewMode === '3D' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', fontSize: '0.85rem', borderRadius: '8px' }}
            >
              <Box size={14} /> 3D Cinema Experience
            </button>
            <button
              onClick={() => setViewMode('2D')}
              className={`btn ${viewMode === '2D' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', fontSize: '0.85rem', borderRadius: '8px' }}
            >
              <Grid size={14} /> Standard 2D Grid
            </button>
          </div>

          {/* Legend Indicators */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: '#CBD5E1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#881337', border: '1px solid rgba(255,255,255,0.1)' }} />
              <span>Available</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#FF5A6E', boxShadow: '0 0 8px rgba(255,90,110,0.5)' }} />
              <span>Selected (Max 6)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#F4B740' }} />
              <span>Held by Other</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#38C98B' }} />
              <span>Held by You</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#1E2330', border: '1px solid rgba(255,255,255,0.08)' }} />
              <span>Booked</span>
            </div>
          </div>
        </div>

        {viewMode === '3D' ? (
          <CinemaAuditorium3D
            seats={seats}
            selectedSeatIds={selectedSeatIds}
            onToggleSeat={handleToggleSeat}
            maxSelectable={6}
            movieTitle={show.movieTitle}
            moviePosterUrl={show.posterUrl || movie?.posterUrl || null}
            seatPrice={Number(show.price)}
            externalPreviewSeatId={previewSeatId}
            onResetExternalPreview={() => setPreviewSeatId(null)}
          />
        ) : (
          <SeatMap
            seats={seats}
            selectedSeatIds={selectedSeatIds}
            onToggleSeat={handleToggleSeat}
            maxSelectable={6}
            inspectedSeatId={previewSeatId}
            onPreviewSeatIn3D={(seat) => {
              setPreviewSeatId(seat.seatId);
              // Switch instantly to 3D Cinema Experience to show the exact seated vantage
              setViewMode('3D');
            }}
          />
        )}
      </div>

      {/* Simulated Payment Modal */}
      {showPaymentModal && activeBookingId && (
        <PaymentModal
          bookingId={activeBookingId}
          totalAmount={totalAmount}
          expiresInSeconds={holdSecondsLeft}
          movieTitle={show.movieTitle}
          selectedSeatCount={selectedSeatIds.length}
          onSuccess={handleSimulatePaymentSuccess}
          onFail={handleSimulatePaymentFailure}
          onCancel={handleCancelHold}
          onExpire={handleHoldExpire}
        />
      )}

      {/* Auth Modal if user attempts checkout while unauthenticated */}
      {showAuthModal && (
        <AuthModal
          onSuccess={() => {
            setShowAuthModal(false);
            handleInitiateHold();
          }}
          onCancel={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};
