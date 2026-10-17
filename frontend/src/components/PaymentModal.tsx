import React, { useState } from 'react';
import { CountdownTimer } from './CountdownTimer';
import { CheckCircle2, XCircle, AlertCircle, Lock } from 'lucide-react';

interface PaymentModalProps {
  bookingId: string;
  totalAmount: number;
  expiresInSeconds: number;
  movieTitle: string;
  selectedSeatCount: number;
  onSuccess: () => void;
  onFail: () => void;
  onCancel: () => void;
  onExpire: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  bookingId: _bookingId,
  totalAmount,
  expiresInSeconds,
  movieTitle,
  selectedSeatCount,
  onSuccess,
  onFail,
  onCancel,
  onExpire,
}) => {
  const [processing, setProcessing] = useState<boolean>(false);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);

  const handlePaySuccess = async () => {
    setProcessing(true);
    setFailureMessage(null);
    await onSuccess();
    setProcessing(false);
  };

  const handlePayFail = async () => {
    setProcessing(true);
    await onFail();
    setFailureMessage('Payment simulation failed as requested. Your seat hold is still active for a retry.');
    setProcessing(false);
  };

  const serviceFee = 1.5;
  const grandTotal = Number(totalAmount) + serviceFee;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 10, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px',
            background: 'linear-gradient(135deg, #1D2330 0%, #151923 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span className="badge badge-coral" style={{ marginBottom: '6px' }}>
              <Lock size={10} /> Secure Checkout
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Simulated Payment</h2>
          </div>
          <div>
            <CountdownTimer initialSeconds={expiresInSeconds} onExpire={onExpire} />
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          {failureMessage && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                marginBottom: '18px',
                fontSize: '0.88rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.98rem' }}>
                <AlertCircle size={18} />
                <span>Payment failed</span>
              </div>
              <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.84rem', lineHeight: 1.4 }}>
                {failureMessage}
              </p>
            </div>
          )}

          {/* Itemized summary */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span style={{ color: '#A7ADBC' }}>Experience</span>
              <span style={{ fontWeight: 700, color: '#F7F8FC' }}>{movieTitle}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span style={{ color: '#A7ADBC' }}>Tickets ({selectedSeatCount})</span>
              <span style={{ fontWeight: 600, color: '#F7F8FC' }}>₹{Number(totalAmount).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
              <span style={{ color: '#A7ADBC' }}>Cinema Booking Fee</span>
              <span style={{ fontWeight: 600, color: '#F7F8FC' }}>₹{serviceFee.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '1.15rem',
              }}
            >
              <span style={{ fontWeight: 700, color: '#F7F8FC' }}>Total Amount</span>
              <span style={{ fontWeight: 900, color: '#38C98B' }}>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <p style={{ color: '#94A3B8', fontSize: '0.82rem', marginBottom: '20px', lineHeight: 1.5 }}>
            This gateway tests concurrency and race conditions under the 5-minute seat lock. Click below to test either scenario.
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={handlePaySuccess}
              disabled={processing}
              className="btn btn-success"
              style={{ padding: '12px', fontSize: '0.95rem' }}
            >
              <CheckCircle2 size={18} />
              {processing ? 'Processing...' : failureMessage ? 'Try again (Payment success)' : 'Payment success'}
            </button>

            <button
              onClick={handlePayFail}
              disabled={processing}
              className="btn btn-outline"
              style={{ padding: '10px', fontSize: '0.88rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
            >
              <XCircle size={16} />
              {processing ? 'Processing...' : 'Payment failure'}
            </button>

            <button
              onClick={onCancel}
              disabled={processing}
              className="btn btn-outline"
              style={{ padding: '10px', fontSize: '0.85rem' }}
            >
              Cancel Hold & Release Seats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
