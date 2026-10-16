import React, { useState } from 'react';
import badmintonImg from '../../assets/stadium_badminton_pro.jpg';
import basketballImg from '../../assets/stadium_basketball_pro.jpg';
import cricketImg from '../../assets/stadium_cricket_pro.jpg';

const SPORT_IMAGES = {
  badminton: badmintonImg,
  basketball: basketballImg,
  cricket: cricketImg,
  pickleball: badmintonImg,
  tennis: badmintonImg
};

export default function TournamentList({
  tournaments,
  loading,
  error,
  onRetry,
  onSelectTournament,
  selectedSport,
  setSelectedSport
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const sports = ['All', 'Badminton', 'Pickleball', 'Cricket', 'Basketball'];

  const filteredTournaments = (tournaments || []).filter((t) => {
    const matchesSearch =
      (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.venue || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport =
      !selectedSport ||
      selectedSport === 'All' ||
      (t.sport || '').toLowerCase() === selectedSport.toLowerCase();

    return matchesSearch && matchesSport;
  });

  return (
    <div className="tournament-explorer">
      {/* Search & Filter Bar */}
      <div className="tournament-filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search tournaments by name, city, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          {sports.map((sport) => (
            <button
              key={sport}
              className={`filter-btn ${
                (selectedSport === sport || (!selectedSport && sport === 'All')) ? 'active' : ''
              }`}
              onClick={() => setSelectedSport(sport === 'All' ? '' : sport)}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p>Loading live tournaments from Arenova network...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && filteredTournaments.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#fff8df',
            borderRadius: '16px',
            border: '1px solid #fde047',
            marginBottom: '24px'
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '8px', color: '#854d0e' }}>
            Unable to Connect to Tournament Network
          </h3>
          <p style={{ color: '#713f12', maxWidth: '440px', margin: '0 auto 16px', fontSize: '14px' }}>
            {error}
          </p>
          {onRetry && (
            <button className="btn btn-primary" onClick={onRetry}>
              Retry Connection
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredTournaments.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '70px 20px',
            background: 'var(--soft)',
            borderRadius: '16px',
            border: '1px dashed var(--line)'
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏆</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', marginBottom: '8px' }}>
            No Tournaments Found
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '15px' }}>
            There are currently no active tournaments matching your filter. Try adjusting your search query or sport filter.
          </p>
        </div>
      )}

      {/* Grid of tournaments */}
      {!loading && filteredTournaments.length > 0 && (
        <div className="tournaments-grid">
          {filteredTournaments.map((tournament) => {
            const sportKey = (tournament.sport || 'badminton').toLowerCase();
            
            // Tournament banner resolution - keep same-origin relative /api/media/... to avoid CORP errors
            let rawBanner = tournament.banner ||
              tournament.bannerImage ||
              tournament.image ||
              tournament.posterImage;

            if (typeof rawBanner === 'string' && rawBanner.includes('/api/media/')) {
              rawBanner = rawBanner.substring(rawBanner.indexOf('/api/media/'));
            }

            const cardImg = rawBanner || SPORT_IMAGES[sportKey] || badmintonImg;

            const startDate = tournament.startDate
              ? new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Dates TBA';

            const endDate = tournament.endDate
              ? new Date(tournament.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '';

            const dateRange = endDate && endDate !== startDate ? `${startDate} - ${endDate}` : startDate;

            // Extract category fee from backend response
            const categoryFees = (tournament.categories || [])
              .map((c) => (typeof c === 'object' && typeof c.fee === 'number' ? c.fee : null))
              .filter((f) => f !== null);

            let displayFee = 'Free / TBA';
            if (categoryFees.length > 1) {
              displayFee = `From ₹${Math.min(...categoryFees)}`;
            } else if (categoryFees.length === 1) {
              displayFee = `₹${categoryFees[0]}`;
            } else if (typeof tournament.registrationFee === 'number') {
              displayFee = `₹${tournament.registrationFee}`;
            }

            const categoriesCount = (tournament.categories || []).length;

            return (
              <article key={tournament._id || tournament.id} className="tournament-card">
                <div style={{ position: 'relative', overflow: 'hidden', height: '190px' }}>
                  <img
                    src={cardImg}
                    alt={tournament.title}
                    className="tournament-card-img"
                    style={{ height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                    onError={(e) => {
                      if (e.target.src.includes('/api/media/') && !e.target.dataset.triedFallback) {
                        e.target.dataset.triedFallback = 'true';
                        const path = e.target.src.substring(e.target.src.indexOf('/api/media/'));
                        e.target.src = `https://api.getarenova.com${path}`;
                        return;
                      }
                      e.target.src = SPORT_IMAGES[sportKey] || badmintonImg;
                    }}
                  />
                  {tournament.status && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: tournament.status.toUpperCase() === 'PUBLISHED' ? '#edf7d9' : '#fff',
                        color: tournament.status.toUpperCase() === 'PUBLISHED' ? '#4b6e15' : 'var(--ink)',
                        fontSize: '10px',
                        fontWeight: '800',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {tournament.status.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="tournament-card-body">
                  <div className="tournament-card-header">
                    <span className="pill dark">{(tournament.sport || 'SPORT').toUpperCase()}</span>
                    <span style={{ fontSize: '12px', color: '#555', fontWeight: '600' }}>
                      📍 {tournament.venue ? `${tournament.venue}, ` : ''}{tournament.city || 'India'}
                    </span>
                  </div>

                  <h3>{tournament.title}</h3>

                  <div className="tournament-card-meta">
                    <div>
                      <span>📅</span>
                      <span>{dateRange}</span>
                    </div>
                    {categoriesCount > 0 && (
                      <div>
                        <span>🏅</span>
                        <span>{categoriesCount} Categories ({tournament.categories.map((c) => typeof c === 'string' ? c : c.name).join(', ')})</span>
                      </div>
                    )}
                    {tournament.registrationEndDate && (
                      <div style={{ color: '#b45309', fontSize: '12px', fontWeight: '600' }}>
                        <span>⏰</span>
                        <span>
                          Registration Closes: {new Date(tournament.registrationEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="tournament-card-footer">
                    <div className="fee-display">
                      <span>Registration</span>
                      <strong>{displayFee}</strong>
                    </div>

                    <button
                      className="btn btn-primary"
                      style={{ padding: '10px 18px', fontSize: '13px' }}
                      onClick={() => onSelectTournament(tournament)}
                    >
                      View & Register →
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
