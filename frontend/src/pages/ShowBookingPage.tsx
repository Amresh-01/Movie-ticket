import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { SeatInfo, ShowDetail } from '../types';
import { SeatMap } from '../components/SeatMap';
import { PaymentModal } from '../components/PaymentModal';
import { AuthModal } from '../components/AuthModal';
import { ArrowLeft, Clock, DollarSign, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

interface ShowBookingPageProps {
  showId: string;
  onBack: () => void;
  onBookingSuccess: () => void;
}

export const ShowBookingPage: React.FC<ShowBookingPageProps> = ({
  showId,
  onBack,
  onBookingSuccess,
}) => {
  const { user } = useAuth();
  const [show, setShow] = useState<ShowDetail | null>(null);
  const [seats, setSeats] = useState<SeatInfo[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [holding, setHolding] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Hold State
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  useEffect(() => {
    fetchSeatData();
    const pollInterval = setInterval(() => {
      fetchSeatData(false);
    }, 6000);

    return () => clearInterval(pollInterval);
  }, [showId]);

  const fetchSeatData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    const res = await apiRequest<{ show: ShowDetail; seats: SeatInfo[] }>(`/shows/${showId}/seats`);

    if (res.success && res.data) {
      setShow(res.data.show);
      setSeats(res.data.seats);
    } else {
      setErrorMessage(res.error?.message || 'Failed to load show seats');
    }
    if (showLoadingSpinner) setLoading(false);
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

    const res = await apiRequest(`/bookings/${activeBookingId}/simulate-payment`, {
      method: 'POST',
      body: JSON.stringify({ status: 'SUCCESS' }),
    });

    if (res.success) {
      setShowPaymentModal(false);
      onBookingSuccess();
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
    alert('Your seat hold has expired. The seats have been released.');
    setShowPaymentModal(false);
    setActiveBookingId(null);
    setSelectedSeatIds([]);
    fetchSeatData(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', color: '#94a3b8' }}>
        Loading seat map & availability...
      </div>
    );
  }

  if (!show) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <h3>Show not found</h3>
        <button onClick={onBack} className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Movies
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
      {/* Top Navigation & Show Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={onBack} className="btn btn-outline" style={{ padding: '8px 14px' }}>
          <ArrowLeft size={16} /> All Movies
        </button>
        <button
          onClick={() => fetchSeatData(false)}
          className="btn btn-outline"
          title="Refresh availability"
          style={{ padding: '8px 14px' }}
        >
          <RefreshCw size={14} /> Refresh Seats
        </button>
      </div>

      <div
        className="glass-panel"
        style={{
          padding: '24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>
            Screen 1 • Standard Cinema
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>{show.movieTitle}</h2>
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', color: '#94a3b8', fontSize: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} /> {new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <DollarSign size={14} /> ${Number(show.price).toFixed(2)} / seat
            </span>
          </div>
        </div>

        {/* Selection checkout bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {selectedSeatIds.length} seat(s) selected
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
              ${(selectedSeatIds.length * Number(show.price)).toFixed(2)}
            </div>
          </div>
          <button
            onClick={handleInitiateHold}
            disabled={selectedSeatIds.length === 0 || holding}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '1rem' }}
          >
            <Sparkles size={16} />
            {holding ? 'Locking...' : 'Hold & Checkout'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            marginBottom: '20px',
            fontSize: '0.9rem',
          }}
        >
          <ShieldAlert size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Seat Map Area */}
      <div className="glass-panel" style={{ padding: '36px 20px', marginBottom: '40px' }}>
        <SeatMap
          seats={seats}
          selectedSeatIds={selectedSeatIds}
          onToggleSeat={handleToggleSeat}
          maxSelectable={6}
        />
      </div>

      {/* Payment Simulation Modal */}
      {showPaymentModal && activeBookingId && (
        <PaymentModal
          bookingId={activeBookingId}
          totalAmount={totalAmount}
          seatCount={selectedSeatIds.length}
          initialSeconds={holdSecondsLeft}
          onSimulateSuccess={handleSimulatePaymentSuccess}
          onSimulateFailure={handleSimulatePaymentFailure}
          onCancel={handleCancelHold}
          onExpire={handleHoldExpire}
        />
      )}

      {/* Auth Modal if guest attempts to hold seats */}
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
