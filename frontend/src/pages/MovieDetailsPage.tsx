import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import type { Movie, ShowBrief } from '../types';
import { Clock, Calendar, Star, ChevronLeft, Ticket, MapPin, Film, Shield } from 'lucide-react';
import { BookingProgressIndicator } from '../components/BookingProgressIndicator';

interface MovieDetailsPageProps {
  movie?: Movie | null;
  onBack?: () => void;
  onSelectShow?: (showId: string) => void;
}

export const MovieDetailsPage: React.FC<MovieDetailsPageProps> = ({
  movie: propMovie,
  onBack,
  onSelectShow,
}) => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(propMovie || null);
  const [loading, setLoading] = useState<boolean>(!propMovie);
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0);

  useEffect(() => {
    if (propMovie) {
      setMovie(propMovie);
      setLoading(false);
      return;
    }

    if (movieId) {
      fetchMovieById(movieId);
    }
  }, [movieId, propMovie]);

  const fetchMovieById = async (id: string) => {
    setLoading(true);
    const res = await apiRequest<{ movie: Movie }>(`/movies/${id}`);
    if (res.success && res.data) {
      setMovie(res.data.movie);
    }
    setLoading(false);
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/');
  };

  const handleShowClick = (showId: string) => {
    if (onSelectShow) onSelectShow(showId);
    else navigate(`/shows/${showId}/seats`);
  };

  // Group shows by date
  const showsByDate = React.useMemo(() => {
    if (!movie?.shows || movie.shows.length === 0) return {};

    const map: Record<string, ShowBrief[]> = {};
    movie.shows.forEach((show) => {
      const dateKey = new Date(show.startTime).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(show);
    });

    return map;
  }, [movie?.shows]);

  const availableDates = Object.keys(showsByDate);
  const currentShows = availableDates[selectedDateIndex]
    ? showsByDate[availableDates[selectedDateIndex]]
    : [];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 16px', color: '#94A3B8' }}>
        Loading movie details & showtimes...
      </div>
    );
  }

  if (!movie) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 16px', color: '#f87171' }}>
        <h2>Movie not found</h2>
        <button onClick={handleBack} className="btn btn-outline" style={{ marginTop: '16px' }}>
          Back to Movies
        </button>
      </div>
    );
  }

  const backdrop =
    movie.backdropUrl ||
    movie.posterUrl ||
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1400';

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 40px' }}>
      {/* Journey Progress Indicator */}
      <BookingProgressIndicator currentStep="show" movieTitle={movie.title} />

      {/* Back button */}
      <div style={{ marginBottom: '16px' }}>
        <button onClick={handleBack} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          <ChevronLeft size={16} /> Back to Movies
        </button>
      </div>

      {/* Cinematic Hero Backdrop Banner */}
      <div
        className="glass-panel"
        style={{
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          marginBottom: '36px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            height: '420px',
            backgroundImage: `url(${backdrop})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
            position: 'relative',
          }}
        >
          {/* Gradient shadows */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(11, 13, 18, 0.2) 0%, rgba(11, 13, 18, 0.8) 60%, rgba(11, 13, 18, 1) 100%), linear-gradient(90deg, rgba(11, 13, 18, 0.95) 0%, rgba(11, 13, 18, 0.4) 60%, transparent 100%)',
            }}
          />

          {/* Hero Content Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: '32px',
              left: '36px',
              right: '36px',
              display: 'flex',
              gap: '32px',
              alignItems: 'flex-end',
            }}
          >
            {/* Movie metadata */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <span className="badge badge-coral">
                  <Film size={12} /> {movie.language || 'English'}
                </span>
                <span className="badge badge-violet">
                  <Clock size={12} /> {movie.durationMin} mins
                </span>
                {movie.rating && (
                  <span className="badge" style={{ background: 'rgba(244, 183, 64, 0.15)', color: '#F4B740', border: '1px solid rgba(244, 183, 64, 0.3)' }}>
                    <Star size={12} fill="#F4B740" /> {movie.rating}
                  </span>
                )}
                <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#CBD5E1' }}>
                  <Shield size={12} /> {movie.certification || 'UA 13+'}
                </span>
              </div>

              <h1 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '12px', lineHeight: 1.15 }}>
                {movie.title}
              </h1>

              <p style={{ color: '#CBD5E1', maxWidth: '720px', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '16px' }}>
                {movie.description}
              </p>

              <div style={{ display: 'flex', gap: '20px', color: '#94A3B8', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#FF5A6E" /> Screen 1 • 80 Luxury Chairs (3D Simulator)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Showtimes & Booking Section */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Select Showtime</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '4px' }}>
              Select a session to launch the interactive 3D auditorium seat picker.
            </p>
          </div>
        </div>

        {/* Date Selector Tabs */}
        {availableDates.length > 0 ? (
          <div>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
              {availableDates.map((dateStr, idx) => (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDateIndex(idx)}
                  className={`btn ${selectedDateIndex === idx ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' }}
                >
                  <span style={{ fontSize: '0.75rem', opacity: 0.85, textTransform: 'uppercase' }}>
                    <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    Session
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{dateStr}</span>
                </button>
              ))}
            </div>

            {/* Showtime Pills Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {currentShows.map((show) => {
                const startTime = new Date(show.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const endTime = new Date(show.endTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={show.id}
                    className="glass-panel"
                    style={{
                      padding: '20px',
                      background: 'rgba(29, 35, 48, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F7F8FC' }}>
                          {startTime}
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38C98B' }}>
                          ${Number(show.price).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: '0.8rem', display: 'flex', gap: '12px' }}>
                        <span>Ends {endTime}</span>
                        <span>•</span>
                        <span>{show.availableSeatsCount ?? 80} / 80 seats available</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleShowClick(show.id)}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '10px 16px', fontSize: '0.88rem' }}
                    >
                      <Ticket size={14} /> Select Seats in 3D
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94A3B8' }}>
            <Calendar size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <h3>No Scheduled Shows for this Movie</h3>
            <p style={{ fontSize: '0.88rem', marginTop: '6px' }}>
              Please check back soon or browse other movies currently playing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
