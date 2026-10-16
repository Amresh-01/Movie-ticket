import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import type { Movie } from '../types';
import { Film, Clock, Star, Sparkles, Search, ChevronRight, Ticket } from 'lucide-react';

interface MovieListPageProps {
  onSelectMovie: (movie: Movie) => void;
  onSelectShow: (showId: string) => void;
}

export const MovieListPage: React.FC<MovieListPageProps> = ({ onSelectMovie, onSelectShow }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');

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

  // Filter movies by search term and genre
  const filteredMovies = movies.filter((movie) => {
    const matchesSearch =
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGenre =
      selectedGenre === 'ALL' ||
      (movie.genre && movie.genre.toUpperCase() === selectedGenre) ||
      (movie.genres && movie.genres.some((g) => g.toUpperCase() === selectedGenre));

    return matchesSearch && matchesGenre;
  });

  const featuredMovie = movies[0];

  const genres = ['ALL', 'ACTION', 'SCI-FI', 'DRAMA', 'ANIMATION', 'ADVENTURE'];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px 40px' }}>
      {/* Featured Cinematic Hero Banner */}
      {featuredMovie && (
        <div
          className="glass-panel"
          style={{
            position: 'relative',
            borderRadius: '24px',
            overflow: 'hidden',
            marginBottom: '40px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minHeight: '380px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${featuredMovie.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 25%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, rgba(11, 13, 18, 0.96) 0%, rgba(11, 13, 18, 0.8) 50%, rgba(11, 13, 18, 0.3) 100%), linear-gradient(0deg, rgba(11, 13, 18, 1) 0%, transparent 60%)',
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 2,
              padding: '48px 40px',
              maxWidth: '680px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="badge badge-coral">
                <Sparkles size={12} /> Spotlight Premiere
              </span>
              <span className="badge badge-violet">
                <Film size={12} /> 3D Simulator Enabled
              </span>
            </div>

            <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
              {featuredMovie.title}
            </h1>

            <div style={{ display: 'flex', gap: '16px', color: '#CBD5E1', fontSize: '0.88rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={14} color="#A7ADBC" /> {featuredMovie.durationMin} mins
              </span>
              {featuredMovie.rating && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#F4B740' }}>
                  <Star size={14} fill="#F4B740" /> {featuredMovie.rating} IMDb
                </span>
              )}
              <span>•</span>
              <span>{featuredMovie.language || 'English'}</span>
            </div>

            <p style={{ color: '#A7ADBC', fontSize: '0.95rem', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {featuredMovie.description}
            </p>

            <div style={{ display: 'flex', gap: '14px', marginTop: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => onSelectMovie(featuredMovie)}
                className="btn btn-primary"
                style={{ padding: '12px 26px', fontSize: '1rem' }}
              >
                <Ticket size={18} /> Book Tickets
              </button>
              <button
                onClick={() => onSelectMovie(featuredMovie)}
                className="btn btn-outline"
                style={{ padding: '12px 20px', fontSize: '0.95rem' }}
              >
                View Details & Sessions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Filters Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 24px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
          <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search movies by title, actor, or genre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 42px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#F7F8FC',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`btn ${selectedGenre === g ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '8px' }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Movies Grid Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Now Showing in Screen 1</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
              80 physical cinema seats with real-time seat lock & 3D auditorium preview.
            </p>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#FF5A6E', fontWeight: 700 }}>
            {filteredMovies.length} movies available
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
            Loading cinematic experiences...
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
            <Film size={44} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h3>No Movies Found</h3>
            <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
              Try adjusting your search query or genre filter.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {filteredMovies.map((movie) => (
              <div
                key={movie.id}
                className="glass-panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
                  cursor: 'pointer',
                }}
                onClick={() => onSelectMovie(movie)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 20px 35px rgba(0,0,0,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                {/* Poster Artwork */}
                <div
                  style={{
                    height: '240px',
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
                      background: 'linear-gradient(to top, rgba(21, 25, 35, 1) 0%, rgba(21, 25, 35, 0.2) 60%, transparent 100%)',
                    }}
                  />
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    {movie.rating && (
                      <span className="badge" style={{ background: 'rgba(11, 13, 18, 0.85)', backdropFilter: 'blur(6px)', color: '#F4B740', border: '1px solid rgba(244, 183, 64, 0.3)' }}>
                        <Star size={11} fill="#F4B740" /> {movie.rating}
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px' }}>
                    <span className="badge badge-coral">
                      {movie.durationMin} mins
                    </span>
                  </div>
                </div>

                {/* Content description */}
                <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px', color: '#F7F8FC' }}>
                      {movie.title}
                    </h3>
                    <p style={{ color: '#A7ADBC', fontSize: '0.85rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {movie.description}
                    </p>
                  </div>

                  {/* Upcoming showtimes pills */}
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Available Sessions
                    </div>
                    {movie.shows && movie.shows.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {movie.shows.slice(0, 3).map((show) => {
                          const timeStr = new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          return (
                            <button
                              key={show.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectShow(show.id);
                              }}
                              className="btn btn-outline"
                              style={{ padding: '6px 10px', fontSize: '0.78rem', borderRadius: '8px' }}
                            >
                              <Clock size={11} /> {timeStr}
                            </button>
                          );
                        })}
                        {movie.shows.length > 3 && (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', alignSelf: 'center' }}>
                            +{movie.shows.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>No shows scheduled</div>
                    )}
                  </div>

                  {/* Action Link */}
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#A7ADBC' }}>Experience in 3D</span>
                    <span style={{ color: '#FF5A6E', display: 'flex', alignItems: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
                      Book <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
