import React from 'react';
import type { SeatInfo } from '../types';
import { Check } from 'lucide-react';

interface SeatMapProps {
  seats: SeatInfo[];
  selectedSeatIds: string[];
  onToggleSeat: (seatId: string) => void;
  maxSelectable?: number;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeatIds,
  onToggleSeat,
  maxSelectable = 6,
}) => {
  // Group seats by row (A through H)
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  const getSeatStatusClass = (seat: SeatInfo): string => {
    if (selectedSeatIds.includes(seat.seatId)) return 'selected';
    if (seat.status === 'BOOKED') return 'booked';
    if (seat.status === 'HELD_BY_YOU') return 'held_by_you';
    if (seat.status === 'HELD') return 'held';
    return 'available';
  };

  const handleSeatClick = (seat: SeatInfo) => {
    if (seat.status === 'BOOKED' || seat.status === 'HELD') return;

    // Check if adding exceeds max limit
    if (!selectedSeatIds.includes(seat.seatId) && selectedSeatIds.length >= maxSelectable) {
      alert(`You can select up to ${maxSelectable} seats at once.`);
      return;
    }

    onToggleSeat(seat.seatId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Cinema Screen Curve */}
      <div className="cinema-screen-container">
        <div className="cinema-screen-arc" />
        <span className="cinema-screen-label">Cinema Screen</span>
      </div>

      {/* 80-Seat Interactive Grid (8 Rows x 10 Seats) */}
      <div className="seat-grid">
        {rows.map((rowLetter) => {
          const rowSeats = seats
            .filter((s) => s.row === rowLetter)
            .sort((a, b) => a.number - b.number);

          return (
            <div key={rowLetter} className="seat-row">
              <span className="seat-row-label">{rowLetter}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {rowSeats.map((seat) => {
                  const statusClass = getSeatStatusClass(seat);
                  const isSelected = selectedSeatIds.includes(seat.seatId);

                  return (
                    <button
                      key={seat.seatId}
                      className={`seat-btn ${statusClass}`}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status === 'BOOKED' || seat.status === 'HELD'}
                      title={`Seat ${seat.row}${seat.number} - ${seat.status}`}
                    >
                      {isSelected ? <Check size={14} /> : seat.number}
                    </button>
                  );
                })}
              </div>
              <span className="seat-row-label">{rowLetter}</span>
            </div>
          );
        })}
      </div>

      {/* Legend Indicator */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          marginTop: '30px',
          padding: '12px 24px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#334155' }} />
          <span>Available</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#6366f1' }} />
          <span>Selected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.4)', border: '1px solid #f59e0b' }} />
          <span>Held (Other User)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#10b981' }} />
          <span>Held (By You)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#1e293b', border: '1px solid #334155' }} />
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
};
