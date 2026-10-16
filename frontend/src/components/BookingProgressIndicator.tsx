import React from 'react';
import { Film, Calendar, Armchair, CreditCard, Ticket } from 'lucide-react';

export type BookingStep = 'movie' | 'show' | 'seats' | 'checkout' | 'confirmation';

interface BookingProgressIndicatorProps {
  currentStep: BookingStep;
  movieTitle?: string;
  showTime?: string;
}

export const BookingProgressIndicator: React.FC<BookingProgressIndicatorProps> = ({
  currentStep,
  movieTitle,
  showTime,
}) => {
  const steps: { key: BookingStep; label: string; icon: React.ReactNode }[] = [
    { key: 'movie', label: 'Movie', icon: <Film size={13} /> },
    { key: 'show', label: 'Showtime', icon: <Calendar size={13} /> },
    { key: 'seats', label: 'Seats & 3D', icon: <Armchair size={13} /> },
    { key: 'checkout', label: 'Review & Pay', icon: <CreditCard size={13} /> },
    { key: 'confirmation', label: 'Ticket', icon: <Ticket size={13} /> },
  ];

  const getStepStatus = (stepKey: BookingStep) => {
    const order: BookingStep[] = ['movie', 'show', 'seats', 'checkout', 'confirmation'];
    const currentIndex = order.indexOf(currentStep);
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        background: 'rgba(21, 25, 35, 0.75)',
        backdropFilter: 'blur(12px)',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {steps.map((step, idx) => {
          const status = getStepStatus(step.key);
          const isActive = status === 'active';
          const isCompleted = status === 'completed';

          return (
            <React.Fragment key={step.key}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  background: isActive
                    ? 'rgba(255, 90, 110, 0.18)'
                    : isCompleted
                    ? 'rgba(56, 201, 139, 0.12)'
                    : 'transparent',
                  border: isActive
                    ? '1px solid rgba(255, 90, 110, 0.35)'
                    : isCompleted
                    ? '1px solid rgba(56, 201, 139, 0.25)'
                    : '1px solid transparent',
                  color: isActive
                    ? '#FF5A6E'
                    : isCompleted
                    ? '#38C98B'
                    : '#6B7280',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                <span>{step.icon}</span>
                <span>{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div style={{ width: '12px', height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {(movieTitle || showTime) && (
        <div style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'flex', gap: '10px' }}>
          {movieTitle && <span style={{ color: '#F7F8FC', fontWeight: 600 }}>{movieTitle}</span>}
          {showTime && <span>• {showTime}</span>}
        </div>
      )}
    </div>
  );
};
