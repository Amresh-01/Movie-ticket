import React, { useState } from 'react';
import { CreditCard, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';

interface PaymentModalProps {
  bookingId: string;
  totalAmount: string | number;
  seatCount: number;
  initialSeconds: number;
  onSimulateSuccess: () => Promise<void>;
  onSimulateFailure: () => Promise<void>;
  onCancel: () => void;
  onExpire: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  totalAmount,
  seatCount,
  initialSeconds,
  onSimulateSuccess,
  onSimulateFailure,
  onCancel,
  onExpire,
}) => {
  const [processing, setProcessing] = useState<boolean>(false);
  const [failureNotice, setFailureNotice] = useState<string | null>(null);

  const handleSuccess = async () => {
    setProcessing(true);
    setFailureNotice(null);
    try {
      await onSimulateSuccess();
    } finally {
      setProcessing(false);
    }
  };

  const handleFailure = async () => {
    setProcessing(true);
    try {
      await onSimulateFailure();
      setFailureNotice('Payment simulation failed. Your seats remain held so you can retry below.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ padding: '28px', border: '1px solid var(--border-glow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '8px', borderRadius: '8px' }}>
              <CreditCard size={20} color="#818cf8" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Simulate Payment</h3>
          </div>
          <CountdownTimer initialSeconds={initialSeconds} onExpire={onExpire} />
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
          Your selected seats are temporarily locked. Choose a simulation scenario to test order confirmation or retry flows.
        </p>

        {/* Order Summary */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total for {seatCount} seats</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
              ${Number(totalAmount).toFixed(2)}
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '4px 8px', borderRadius: '6px' }}>
            Hold Active
          </span>
        </div>

        {/* Failure Feedback banner if retry occurred */}
        {failureNotice && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '12px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '20px',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{failureNotice}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleSuccess}
            disabled={processing}
            className="btn btn-success"
            style={{ width: '100%', padding: '12px' }}
          >
            {processing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            Simulate Payment Success (Confirm Booking)
          </button>

          <button
            onClick={handleFailure}
            disabled={processing}
            className="btn btn-danger"
            style={{ width: '100%', padding: '12px' }}
          >
            <XCircle size={18} />
            Simulate Payment Failure (Test Retry)
          </button>

          <button
            onClick={onCancel}
            disabled={processing}
            className="btn btn-outline"
            style={{ width: '100%', marginTop: '4px' }}
          >
            Cancel & Release Seats
          </button>
        </div>
      </div>
    </div>
  );
};
