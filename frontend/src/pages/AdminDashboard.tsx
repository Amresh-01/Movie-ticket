import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import type { Movie } from '../types';
import { ShieldCheck, Plus, Calendar, Film, BarChart3 } from 'lucide-react';

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

  const handleInspectOccupancy = async (showId: string) => {
    setSelectedShowId(showId);
    const res = await apiRequest<OccupancyData>(`/shows/${showId}/occupancy`);
    if (res.success && res.data) {
      setOccupancy(res.data);
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
                Ticket Price ($)
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
          {movies.flatMap((m) => m.shows || []).map((s) => (
            <button
              key={s.id}
              onClick={() => handleInspectOccupancy(s.id)}
              className={`btn ${selectedShowId === s.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              Show {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </button>
          ))}
        </div>

        {occupancy && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Screen Seats</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{occupancy.totalSeats}</div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '16px', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: '#34d399' }}>Confirmed Bookings</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>{occupancy.bookedCount}</div>
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
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>${occupancy.totalRevenue.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
