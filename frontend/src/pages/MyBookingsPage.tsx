import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import type { BookingReceipt } from '../types';
import { Ticket, Calendar, Clock, CheckCircle2, AlertCircle, XCircle, ChevronRight, MapPin } from 'lucide-react';

interface MyBookingsPageProps {
  onViewConfirmation?: (receipt: BookingReceipt) => void;
  onExploreMovies?: () => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({
  onViewConfirmation,
  onExploreMovies,
}) => {
  const [bookings, setBookings] = useState<BookingReceipt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST'>('UPCOMING');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const res = await apiRequest<{ bookings: BookingReceipt[] }>('/bookings/my');
    if (res.success && res.data) {
      setBookings(res.data.bookings);
    }
    setLoading(false);
  };

  const now = new Date();

  const upcomingBookings = bookings.filter((b) => {
    const showTime = new Date(b.startTime);
    return showTime >= now && b.status === 'CONFIRMED';
  });

  const pastBookings = bookings.filter((b) => {
    const showTime = new Date(b.startTime);
    return showTime < now || b.status !== 'CONFIRMED';
  });

  const displayBookings = activeTab === 'UPCOMING' ? upcomingBookings : pastBookings;

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelFeedback, setCancelFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This will release your seats back to the cinema.')) {
      return;
    }

    setCancellingId(bookingId);
    setCancelFeedback(null);

    const res = await apiRequest(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
    });

    if (res.success) {
      setCancelFeedback({
        message: 'Booking cancelled successfully. Your seats have been released.',
        isError: false,
      });
      await fetchBookings();
    } else {
      setCancelFeedback({
        message: res.error?.message || 'Failed to cancel booking. It may have already expired or already started.',
        isError: true,
      });
    }

    setCancellingId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="badge badge-emerald">
            <CheckCircle2 size={12} /> CONFIRMED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <XCircle size={12} /> CANCELLED
          </span>
        );
      case 'PENDING':
        return (
          <span className="badge" style={{ background: 'rgba(244, 183, 64, 0.15)', color: '#F4B740', border: '1px solid rgba(244, 183, 64, 0.3)' }}>
            <AlertCircle size={12} /> PENDING HOLD
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="badge" style={{ background: 'rgba(255, 98, 110, 0.15)', color: '#FF626E', border: '1px solid rgba(255, 98, 110, 0.3)' }}>
            <XCircle size={12} /> EXPIRED
          </span>
        );
      default:
        return (
          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#94A3B8' }}>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto', padding: '16px 16px 40px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(255, 90, 110, 0.15)', border: '1px solid rgba(255, 90, 110, 0.3)', padding: '12px', borderRadius: '14px' }}>
            <Ticket size={28} color="#FF5A6E" />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>My Admission Passes</h1>
            <p style={{ color: '#A7ADBC', fontSize: '0.9rem' }}>
              Only your authorized purchases and validated seat reservations are stored here.
            </p>
          </div>
        </div>

        {onExploreMovies && (
          <button onClick={onExploreMovies} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            Book More Tickets
          </button>
        )}
      </div>

      {cancelFeedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: cancelFeedback.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 201, 139, 0.15)',
            border: `1px solid ${cancelFeedback.isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 201, 139, 0.3)'}`,
            color: cancelFeedback.isError ? '#F87171' : '#38C98B',
            fontSize: '0.88rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{cancelFeedback.message}</span>
          <button
            onClick={() => setCancelFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`btn ${activeTab === 'UPCOMING' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '8px 18px', fontSize: '0.88rem', borderRadius: '10px' }}
        >
          Upcoming Experiences ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('PAST')}
          className={`btn ${activeTab === 'PAST' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '8px 18px', fontSize: '0.88rem', borderRadius: '10px' }}
        >
          Past / Expired ({pastBookings.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>Loading verified tickets...</div>
      ) : displayBookings.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
          <Ticket size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.25rem', color: '#F7F8FC' }}>No {activeTab.toLowerCase()} bookings found</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '8px', maxWidth: '420px', margin: '8px auto 20px' }}>
            Browse currently showing movies in Screen 1 and select your seats in 3D to reserve your experience.
          </p>
          {onExploreMovies && (
            <button onClick={onExploreMovies} className="btn btn-primary" style={{ padding: '10px 20px' }}>
              Explore Now Showing
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayBookings.map((booking) => (
            <div
              key={booking.id}
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
            >
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{booking.movieTitle}</h3>
                  {getStatusBadge(booking.status)}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', color: '#A7ADBC', fontSize: '0.88rem', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={14} color="#FF5A6E" /> {booking.screenName}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} />{' '}
                    {new Date(booking.startTime).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={14} />{' '}
                    {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Seat tags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Seats:</span>
                  {booking.seats.map((seat) => (
                    <span
                      key={seat}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#F7F8FC',
                      }}
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price and ticket button */}
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38C98B' }}>
                  ₹{Number(booking.totalAmount).toFixed(2)}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {booking.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="btn"
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#F87171',
                        borderRadius: '8px',
                        cursor: cancellingId === booking.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}

                  {onViewConfirmation && booking.status === 'CONFIRMED' && (
                    <button
                      onClick={() => onViewConfirmation(booking)}
                      className="btn btn-outline"
                      style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                    >
                      View Ticket Pass <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
