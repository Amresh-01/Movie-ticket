import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import type { BookingReceipt } from '../types';
import { Ticket, Calendar, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingReceipt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
            <CheckCircle2 size={12} /> CONFIRMED
          </span>
        );
      case 'PENDING':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
            <AlertCircle size={12} /> PENDING HOLD
          </span>
        );
      case 'EXPIRED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
            <XCircle size={12} /> EXPIRED
          </span>
        );
      default:
        return (
          <span style={{ background: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
            {status}
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '10px', borderRadius: '12px' }}>
          <Ticket size={24} color="#818cf8" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>My Booking Receipts</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Only your verified purchases and active seat holds are shown here.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading receipts...</div>
      ) : bookings.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
          <Ticket size={44} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3>No Bookings Yet</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
            Explore upcoming movies and select your favorite seats to book.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="glass-panel"
              style={{
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{booking.movieTitle}</h3>
                  {getStatusBadge(booking.status)}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: '#94a3b8', fontSize: '0.85rem' }}>
                  <span>Screen: {booking.screenName}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> {new Date(booking.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} /> {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Seats:</span>
                  {booking.seats.map((seatStr) => (
                    <span
                      key={seatStr}
                      style={{
                        background: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        color: '#c7d2fe',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      {seatStr}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Paid / Due</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
                    ${Number(booking.totalAmount).toFixed(2)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Ref: {booking.id.slice(0, 8)}...
                  </span>
                </div>

                {booking.status === 'CONFIRMED' && (
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to cancel this booking? (Allowed up to 2 hours before showtime)')) {
                        const res = await apiRequest(`/bookings/${booking.id}/cancel`, { method: 'POST' });
                        if (res.success) {
                          alert('Booking cancelled successfully.');
                          fetchBookings();
                        } else {
                          alert(res.error?.message || 'Could not cancel booking.');
                        }
                      }
                    }}
                    className="btn btn-outline"
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      color: '#f87171',
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
