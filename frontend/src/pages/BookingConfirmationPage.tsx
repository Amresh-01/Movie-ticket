import React from 'react';
import type { BookingReceipt } from '../types';
import { CheckCircle2, Ticket, Calendar, Clock, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
import { BookingProgressIndicator } from '../components/BookingProgressIndicator';

interface BookingConfirmationPageProps {
  receipt: BookingReceipt;
  onNavigateToBookings: () => void;
  onNavigateToMovies: () => void;
}

export const BookingConfirmationPage: React.FC<BookingConfirmationPageProps> = ({
  receipt,
  onNavigateToBookings,
  onNavigateToMovies,
}) => {
  const showDate = new Date(receipt.startTime).toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const showTime = new Date(receipt.startTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: '680px', margin: '0 auto', padding: '16px 16px 40px' }}>
      {/* Journey Progress Indicator */}
      <BookingProgressIndicator
        currentStep="confirmation"
        movieTitle={receipt.movieTitle}
        showTime={showTime}
      />

      {/* Success Notification Banner */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(56, 201, 139, 0.15)',
            border: '2px solid rgba(56, 201, 139, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 0 25px rgba(56, 201, 139, 0.3)',
          }}
        >
          <CheckCircle2 size={36} color="#38C98B" />
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '8px' }}>
          Booking Confirmed!
        </h1>
        <p style={{ color: '#A7ADBC', fontSize: '0.95rem' }}>
          Your seats are reserved and your cinematic admission ticket is ready.
        </p>
      </div>

      {/* Realistic Cinematic Ticket Pass Card */}
      <div className="ticket-card" style={{ padding: '0', marginBottom: '28px' }}>
        {/* Ticket Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1D2330 0%, #151923 100%)',
            padding: '24px 28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="badge badge-coral" style={{ marginBottom: '8px' }}>
                Screen 1 • Standard Cinema
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '6px' }}>
                {receipt.movieTitle}
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Reference</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F7F8FC', fontFamily: 'monospace' }}>
                #{receipt.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Details Body */}
        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '0.8rem', marginBottom: '4px' }}>
                <Calendar size={13} /> DATE
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F7F8FC' }}>{showDate}</div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '0.8rem', marginBottom: '4px' }}>
                <Clock size={13} /> SHOWTIME
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F7F8FC' }}>{showTime}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '0.8rem', marginBottom: '4px' }}>
                <MapPin size={13} /> CINEMA SCREEN
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F7F8FC' }}>{receipt.screenName}</div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '0.8rem', marginBottom: '4px' }}>
                <ShieldCheck size={13} /> PAYMENT
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38C98B' }}>
                ₹{Number(receipt.totalAmount).toFixed(2)} (PAID)
              </div>
            </div>
          </div>
        </div>

        {/* Perforated Ticket Divider with Notches */}
        <div className="ticket-divider">
          <div className="ticket-divider-line" />
        </div>

        {/* Ticket Stub Footer: Reserved Seats & Barcode */}
        <div style={{ padding: '20px 28px 24px', background: 'rgba(15, 19, 28, 0.6)' }}>
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
              RESERVED SEATS ({receipt.seats.length})
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {receipt.seats.map((seatName) => (
                <span
                  key={seatName}
                  style={{
                    background: 'rgba(255, 90, 110, 0.2)',
                    border: '1px solid rgba(255, 90, 110, 0.4)',
                    color: '#FF5A6E',
                    fontWeight: 800,
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                  }}
                >
                  Seat {seatName}
                </span>
              ))}
            </div>
          </div>

          {/* Barcode Graphic */}
          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div
              style={{
                letterSpacing: '5px',
                fontFamily: 'monospace',
                fontSize: '1.4rem',
                color: '#6B7280',
                userSelect: 'none',
              }}
            >
              ||||| ||| ||||||| || |||| ||||| ||| ||||||
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
              SCAN AT SCREEN ENTRANCE • SCREEN 1
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={onNavigateToBookings}
          className="btn btn-primary"
          style={{ padding: '12px 24px', fontSize: '0.95rem' }}
        >
          <Ticket size={16} /> View My Bookings
        </button>
        <button
          onClick={onNavigateToMovies}
          className="btn btn-outline"
          style={{ padding: '12px 24px', fontSize: '0.95rem' }}
        >
          Explore More Movies <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
