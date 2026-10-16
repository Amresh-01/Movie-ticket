import React from 'react';
import type { SeatInfo } from '../types';
import { Check, Eye } from 'lucide-react';

interface SeatMapProps {
  seats: SeatInfo[];
  selectedSeatIds: string[];
  onToggleSeat: (seatId: string) => void;
  maxSelectable?: number;
  onPreviewSeatIn3D?: (seat: SeatInfo) => void;
  inspectedSeatId?: string | null;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeatIds,
  onToggleSeat,
  maxSelectable = 6,
  onPreviewSeatIn3D,
  inspectedSeatId,
}) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  const getSeatStatusClass = (seat: SeatInfo): string => {
    if (selectedSeatIds.includes(seat.seatId)) return 'selected';
    if (seat.seatId === inspectedSeatId) return 'inspected';
    if (seat.status === 'BOOKED') return 'booked';
    if (seat.status === 'HELD_BY_YOU') return 'held_by_you';
    if (seat.status === 'HELD') return 'held';
    return 'available';
  };

  const handleSeatClick = (seat: SeatInfo) => {
    // If user clicked, toggle seat if available
    if (seat.status === 'BOOKED' || seat.status === 'HELD') {
      // If booked or held, still let user preview the 3D sightline!
      if (onPreviewSeatIn3D) {
        onPreviewSeatIn3D(seat);
      }
      return;
    }

    if (!selectedSeatIds.includes(seat.seatId) && selectedSeatIds.length >= maxSelectable) {
      alert(`You can select up to ${maxSelectable} seats per booking.`);
      return;
    }

    onToggleSeat(seat.seatId);

    // Also trigger preview in 3D simulator if requested
    if (onPreviewSeatIn3D) {
      onPreviewSeatIn3D(seat);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '10px 0' }}>
      {/* Cinema Screen Arc */}
      <div className="cinema-screen-container">
        <div className="cinema-screen-arc" />
        <span className="cinema-screen-label">CINEMA PROJECTION SCREEN</span>
      </div>

      {/* 2D Helper Prompt */}
      {onPreviewSeatIn3D && (
        <div
          style={{
            fontSize: '0.82rem',
            color: '#94A3B8',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <Eye size={14} color="#8B5CF6" />
          <span>Click any 2D seat to select and preview its 3D eye-level sightline</span>
        </div>
      )}

      {/* 80-Seat Interactive Grid (8 Rows x 10 Seats with Center Aisle) */}
      <div className="seat-grid">
        {rows.map((rowLetter) => {
          const rowSeats = seats
            .filter((s) => s.row === rowLetter)
            .sort((a, b) => a.number - b.number);

          // Split into Left Block (1-5) and Right Block (6-10) for realistic center aisle
          const leftBlock = rowSeats.filter((s) => s.number <= 5);
          const rightBlock = rowSeats.filter((s) => s.number > 5);

          return (
            <div key={rowLetter} className="seat-row">
              <span className="seat-row-label">{rowLetter}</span>

              {/* Left Wing (Seats 1-5) */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {leftBlock.map((seat) => {
                  const statusClass = getSeatStatusClass(seat);
                  const isSelected = selectedSeatIds.includes(seat.seatId);

                  return (
                    <button
                      key={seat.seatId}
                      className={`seat-btn ${statusClass}`}
                      onClick={() => handleSeatClick(seat)}
                      title={`Seat ${seat.row}${seat.number} • ${seat.status} (Click to select & preview in 3D)`}
                    >
                      {isSelected ? <Check size={14} /> : seat.number}
                    </button>
                  );
                })}
              </div>

              {/* Center Aisle Spacer */}
              <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '2px', height: '100%', background: 'rgba(255,255,255,0.05)' }} />
              </div>

              {/* Right Wing (Seats 6-10) */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {rightBlock.map((seat) => {
                  const statusClass = getSeatStatusClass(seat);
                  const isSelected = selectedSeatIds.includes(seat.seatId);

                  return (
                    <button
                      key={seat.seatId}
                      className={`seat-btn ${statusClass}`}
                      onClick={() => handleSeatClick(seat)}
                      title={`Seat ${seat.row}${seat.number} • ${seat.status} (Click to select & preview in 3D)`}
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
    </div>
  );
};
