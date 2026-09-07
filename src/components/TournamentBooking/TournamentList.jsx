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

      {/* Empty state */}
      {!loading && filteredTournaments.length === 0 && (
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
            
            // API returns banner URL from Cloudinary (tournament.banner)
            const cardImg = tournament.banner ||
              tournament.bannerImage ||
              tournament.image ||
              tournament.posterImage ||
              SPORT_IMAGES[sportKey] ||
              badmintonImg;

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
                    onError={(e) => { e.target.src = badmintonImg; }}
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
