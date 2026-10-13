import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import type { Movie } from '../types';
import { Film, Calendar, Clock, ChevronRight } from 'lucide-react';

interface MovieListPageProps {
  onSelectShow: (showId: string) => void;
}

export const MovieListPage: React.FC<MovieListPageProps> = ({ onSelectShow }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setLoading(true);
    const res = await apiRequest<{ movies: Movie[] }>('/movies');
    if (res.success && res.data) {
      setMovies(res.data.movies);
    }
    setLoading(false);
  };

  const formatShowTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatShowDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>
      {/* Header Banner */}
      <div
        className="glass-panel glass-panel-glow"
        style={{
          padding: '40px',
          marginBottom: '36px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.7) 100%)',
        }}
      >
        <span
          style={{
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '0.8rem',
            color: '#a5b4fc',
            fontWeight: 700,
          }}
        >
          Cinema Screen 1 • 80 Luxury Seats
        </span>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '12px 0 8px 0', letterSpacing: '-0.02em' }}>
          Now Showing & Upcoming
        </h2>
        <p style={{ color: '#94a3b8', maxWidth: '580px', margin: '0 auto', fontSize: '1rem' }}>
          Experience cinema with atomic instant seat holds, live concurrency locks, and seamless bookings.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading movie experiences...</div>
      ) : movies.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
          <Film size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3>No Movies Currently Scheduled</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
            Seed movies or add shows using the Admin portal to begin booking.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="glass-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'transform 0.2s',
              }}
            >
              {/* Poster image */}
              <div
                style={{
                  height: '220px',
                  position: 'relative',
                  backgroundImage: `url(${movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(10, 14, 23, 0.95) 0%, transparent 80%)',
                  }}
                />
                <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        background: 'rgba(99, 102, 241, 0.85)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {movie.durationMin} mins
                    </span>
                    <span
                      style={{
                        background: 'rgba(236, 72, 153, 0.85)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {movie.rating || 'UA'}
                    </span>
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.85)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {movie.language || 'English'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{movie.title}</h3>
                </div>
              </div>

              {/* Description & Shows */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px', flex: 1, lineHeight: 1.6 }}>
                  {movie.description}
                </p>

                {/* Showtimes */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#a5b4fc',
                      textTransform: 'uppercase',
                      marginBottom: '10px',
                    }}
                  >
                    <Calendar size={14} /> Available Showtimes
                  </div>

                  {movie.shows && movie.shows.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {movie.shows.map((show) => (
                        <button
                          key={show.id}
                          onClick={() => onSelectShow(show.id)}
                          className="btn btn-outline"
                          style={{
                            padding: '8px 12px',
                            fontSize: '0.8rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '4px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            borderColor: 'rgba(99, 102, 241, 0.3)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                            <Clock size={12} />
                            <span>
                              {formatShowDate(show.startTime)} {formatShowTime(show.startTime)}
                            </span>
                            <span style={{ color: '#10b981', fontWeight: 700, marginLeft: 'auto' }}>${Number(show.price).toFixed(2)}</span>
                            <ChevronRight size={12} />
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600 }}>
                            {show.availableSeatsCount !== undefined ? `${show.availableSeatsCount} / 80 seats free` : '80 seats'}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>No upcoming shows scheduled yet.</div>
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
