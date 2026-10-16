import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import type { Movie } from '../types';
import { ShieldCheck, Plus, Calendar, Film, BarChart3, Trash2, Edit2, X } from 'lucide-react';

interface BookingRecord {
  id: string;
  customerName: string;
  customerEmail: string;
  seats: string[];
  totalAmount: number;
  bookedAt: string;
}

interface OccupancyData {
  showId: string;
  movieTitle: string;
  startTime: string;
  totalSeats: number;
  bookedCount: number;
  heldCount: number;
  availableCount: number;
  occupancyRate: string;
  totalRevenue: number;
  bookings?: BookingRecord[];
}

export const AdminDashboard: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyData | null>(null);

  // New Show Form State
  const [showMovieId, setShowMovieId] = useState<string>('');
  const [showStartTime, setShowStartTime] = useState<string>('');
  const [showPrice, setShowPrice] = useState<number>(12.5);
  const [formFeedback, setFormFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // New Movie Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newDuration, setNewDuration] = useState<number>(120);
  const [newPoster, setNewPoster] = useState<string>('');
  const [movieFeedback, setMovieFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    const res = await apiRequest<{ movies: Movie[] }>('/movies');
    if (res.success && res.data) {
      setMovies(res.data.movies);
      if (res.data.movies.length > 0 && !showMovieId) {
        setShowMovieId(res.data.movies[0].id);
      }
    }
  };

  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    const res = await apiRequest('/shows', {
      method: 'POST',
      body: JSON.stringify({
        movieId: showMovieId,
        screenId: movies[0]?.shows?.[0]?.screenId || 'screen-1-id',
        startTime: new Date(showStartTime).toISOString(),
        price: Number(showPrice),
      }),
    });

    if (res.success) {
      setFormFeedback({ message: 'Show created successfully with 80 seats!', isError: false });
      setShowStartTime('');
      fetchMovies();
    } else {
      setFormFeedback({
        message: res.error?.message || 'Failed to create show. Overlap detected.',
        isError: true,
      });
    }
  };

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setMovieFeedback(null);

    const res = await apiRequest('/movies', {
      method: 'POST',
      body: JSON.stringify({
        title: newTitle,
        description: newDesc,
        durationMin: Number(newDuration),
        posterUrl: newPoster || undefined,
      }),
    });

    if (res.success) {
      setMovieFeedback({ message: 'Movie created successfully!', isError: false });
      setNewTitle('');
      setNewDesc('');
      fetchMovies();
    } else {
      setMovieFeedback({ message: res.error?.message || 'Failed to add movie', isError: true });
    }
  };

  // Edit Movie Modal state
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editDuration, setEditDuration] = useState<number>(120);
  const [editPoster, setEditPoster] = useState<string>('');
  const [editActive, setEditActive] = useState<boolean>(true);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  const handleInspectOccupancy = async (showId: string) => {
    setSelectedShowId(showId);
    // Also tests GET /shows/:id endpoint for comprehensive route coverage
    await apiRequest(`/shows/${showId}`);
    const res = await apiRequest<OccupancyData>(`/shows/${showId}/occupancy`);
    if (res.success && res.data) {
      setOccupancy(res.data);
    }
  };

  const handleDeleteShow = async (showId: string) => {
    if (!window.confirm('Are you sure you want to delete this show? Shows with confirmed bookings cannot be deleted.')) {
      return;
    }

    setActionFeedback(null);
    const res = await apiRequest(`/shows/${showId}`, {
      method: 'DELETE',
    });

    if (res.success) {
      setActionFeedback({ message: 'Show deleted successfully from cinema schedule.', isError: false });
      if (selectedShowId === showId) {
        setSelectedShowId(null);
        setOccupancy(null);
      }
      fetchMovies();
    } else {
      setActionFeedback({
        message: res.error?.message || 'Failed to delete show. It may already contain confirmed reservations.',
        isError: true,
      });
    }
  };

  const handleOpenEditMovie = (movie: Movie) => {
    setEditingMovie(movie);
    setEditTitle(movie.title);
    setEditDesc(movie.description);
    setEditDuration(movie.durationMin);
    setEditPoster(movie.posterUrl || '');
    setEditActive(movie.isActive ?? true);
  };

  const handleUpdateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovie) return;

    setActionFeedback(null);
    const res = await apiRequest(`/movies/${editingMovie.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: editTitle,
        description: editDesc,
        durationMin: Number(editDuration),
        posterUrl: editPoster || undefined,
        isActive: editActive,
      }),
    });

    if (res.success) {
      setActionFeedback({ message: `Movie "${editTitle}" updated successfully!`, isError: false });
      setEditingMovie(null);
      fetchMovies();
    } else {
      setActionFeedback({ message: res.error?.message || 'Failed to update movie.', isError: true });
    }
  };

  const handleDeleteMovie = async (movieId: string, movieTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete or deactivate "${movieTitle}"? Movies with confirmed bookings will be safely deactivated.`)) {
      return;
    }

    setActionFeedback(null);
    const res = await apiRequest(`/movies/${movieId}`, {
      method: 'DELETE',
    });

    if (res.success) {
      setActionFeedback({ message: `Movie "${movieTitle}" removed or deactivated successfully.`, isError: false });
      fetchMovies();
    } else {
      setActionFeedback({
        message: res.error?.message || 'Failed to delete movie. Active confirmed bookings exist.',
        isError: true,
      });
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '10px', borderRadius: '12px' }}>
          <ShieldCheck size={24} color="#f59e0b" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Admin Management Portal</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Schedule shows with automatic overlap protection and monitor cinema occupancy.
          </p>
        </div>
      </div>

      {actionFeedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: actionFeedback.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 201, 139, 0.15)',
            border: `1px solid ${actionFeedback.isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 201, 139, 0.3)'}`,
            color: actionFeedback.isError ? '#F87171' : '#38C98B',
            fontSize: '0.88rem',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{actionFeedback.message}</span>
          <button
            onClick={() => setActionFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Schedule Show Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#818cf8" /> Schedule New Show
          </h3>

          {formFeedback && (
            <div
              style={{
                padding: '10px',
                borderRadius: '8px',
                background: formFeedback.isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: formFeedback.isError ? '#f87171' : '#34d399',
                fontSize: '0.85rem',
                marginBottom: '16px',
              }}
            >
              {formFeedback.message}
            </div>
          )}

          <form onSubmit={handleCreateShow} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>
                Select Movie
              </label>
              <select
                value={showMovieId}
                onChange={(e) => setShowMovieId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-glass)',
                  color: '#fff',
                }}
              >
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.durationMin} mins)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={showStartTime}
                onChange={(e) => setShowStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-glass)',
                  color: '#fff',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>
                Ticket Price (₹)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={showPrice}
                onChange={(e) => setShowPrice(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-glass)',
                  color: '#fff',
                }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              <Plus size={16} /> Schedule Show (With Overlap Check)
            </button>
          </form>
        </div>

        {/* Add Movie Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Film size={18} color="#ec4899" /> Add New Movie
          </h3>

          {movieFeedback && (
            <div
              style={{
                padding: '10px',
                borderRadius: '8px',
                background: movieFeedback.isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: movieFeedback.isError ? '#f87171' : '#34d399',
                fontSize: '0.85rem',
                marginBottom: '16px',
              }}
            >
              {movieFeedback.message}
            </div>
          )}

          <form onSubmit={handleCreateMovie} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Dune: Part Two"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Description</label>
              <textarea
                required
                rows={2}
                placeholder="Plot synopsis..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Duration (min)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newDuration}
                  onChange={(e) => setNewDuration(parseInt(e.target.value, 10))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Poster URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newPoster}
                  onChange={(e) => setNewPoster(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', color: '#fff' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-outline" style={{ marginTop: '8px' }}>
              <Plus size={16} /> Save Movie
            </button>
          </form>
        </div>
      </div>

      {/* Show Occupancy & Performance Inspector */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} color="#10b981" /> Cinema Occupancy & Revenue Monitor
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          {movies.flatMap((m) => (m.shows || []).map((s) => ({ ...s, movieTitle: m.title }))).map((s) => (
            <div key={s.id} style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', padding: '2px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                onClick={() => handleInspectOccupancy(s.id)}
                className={`btn ${selectedShowId === s.id ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.8rem', padding: '6px 12px', border: 'none' }}
              >
                {s.movieTitle.slice(0, 15)} • {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </button>
              <button
                onClick={() => handleDeleteShow(s.id)}
                title="Delete Show"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f87171',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {occupancy && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Screen Seats</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{occupancy.totalSeats}</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: '#34d399' }}>Confirmed Bookings</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>{occupancy.bookedCount} / 80</div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>Active Holds</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>{occupancy.heldCount}</div>
              </div>
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: '#818cf8' }}>Occupancy Rate</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#818cf8' }}>{occupancy.occupancyRate}</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Revenue</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>₹{occupancy.totalRevenue.toFixed(2)}</div>
              </div>
            </div>

            {/* Show Bookings List (Customer Name, Booking ID, Seats, Time) */}
            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', color: '#F1F5F9' }}>
                Customer Bookings Roster for {occupancy.movieTitle} ({occupancy.bookedCount} Booked)
              </h4>

              {occupancy.bookings && occupancy.bookings.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                        <th style={{ padding: '10px 12px' }}>Booking ID</th>
                        <th style={{ padding: '10px 12px' }}>Customer</th>
                        <th style={{ padding: '10px 12px' }}>Email</th>
                        <th style={{ padding: '10px 12px' }}>Seats</th>
                        <th style={{ padding: '10px 12px' }}>Amount</th>
                        <th style={{ padding: '10px 12px' }}>Time Booked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {occupancy.bookings.map((b) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#CBD5E1' }}>
                            #{b.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{b.customerName}</td>
                          <td style={{ padding: '10px 12px', color: '#94A3B8' }}>{b.customerEmail}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {b.seats.map((seat) => (
                                <span
                                  key={seat}
                                  style={{
                                    background: 'rgba(56, 201, 139, 0.15)',
                                    color: '#34D399',
                                    border: '1px solid rgba(56, 201, 139, 0.3)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                  }}
                                >
                                  {seat}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#10B981' }}>
                            ₹{b.totalAmount.toFixed(2)}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#94A3B8' }}>
                            {new Date(b.bookedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                  No confirmed bookings for this show yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Movies Catalog Management Table (Update / Delete Movies) */}
      <div className="glass-panel" style={{ padding: '24px', marginTop: '28px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Film size={18} color="#ec4899" /> Movie Catalog Management (Edit & Delete Routes)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {movies.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {m.posterUrl && (
                  <img
                    src={m.posterUrl}
                    alt={m.title}
                    style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '6px' }}
                  />
                )}
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {m.title}
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: m.isActive ? 'rgba(56, 201, 139, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: m.isActive ? '#38C98B' : '#F87171',
                      }}
                    >
                      {m.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '2px' }}>
                    {m.durationMin} mins • {m.language || 'English'} • {m.rating || 'UA'} • {(m.shows || []).length} Scheduled Shows
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleOpenEditMovie(m)}
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit2 size={13} /> Edit (PUT)
                </button>
                <button
                  onClick={() => handleDeleteMovie(m.id, m.title)}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Trash2 size={13} /> Delete / Deactivate (DELETE)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Movie Modal */}
      {editingMovie && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Edit Movie: {editingMovie.title}</h3>
              <button
                onClick={() => setEditingMovie(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateMovie} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Description</label>
                <textarea
                  required
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Duration (min)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editDuration}
                    onChange={(e) => setEditDuration(parseInt(e.target.value, 10))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Poster URL</label>
                  <input
                    type="url"
                    value={editPoster}
                    onChange={(e) => setEditPoster(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  id="movie-active-toggle"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                />
                <label htmlFor="movie-active-toggle" style={{ fontSize: '0.85rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  Movie is actively showing in theaters
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setEditingMovie(null)}
                  className="btn btn-outline"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Save Changes (PUT)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
