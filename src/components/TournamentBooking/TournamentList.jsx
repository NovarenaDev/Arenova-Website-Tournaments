import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
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

export const isTournamentClosed = (t) => {
  if (t?.isRegistrationOpen === false || t?.registrationOpen === false) {
    return true;
  }
  const status = String(t?.status || '').toUpperCase().trim();
  const regStatus = String(t?.registrationStatus || '').toUpperCase().trim();
  if (['COMPLETED', 'CANCELLED', 'CANCELED', 'CLOSED', 'REGISTRATION_CLOSED', 'DRAFT'].includes(status)) {
    return true;
  }
  if (['CLOSED', 'ENDED', 'EXPIRED'].includes(regStatus)) {
    return true;
  }
  const now = Date.now();
  if (t?.registrationEndDate) {
    const regEnd = new Date(t.registrationEndDate).getTime();
    if (!isNaN(regEnd) && regEnd < now) return true;
  }
  if (t?.endDate) {
    const end = new Date(t.endDate).getTime();
    if (!isNaN(end) && end < now) return true;
  }
  return false;
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
  const [activeTab, setActiveTab] = useState('open');
  const [backendSports, setBackendSports] = useState([]);
  const [showMoreSports, setShowMoreSports] = useState(false);

  useEffect(() => {
    let active = true;
    api.getTournamentOptions()
      .then((res) => {
        if (!active) return;
        const list = res?.data?.sports || res?.sports || [];
        if (Array.isArray(list)) {
          setBackendSports(list.map((s) => (typeof s === 'string' ? s : s?.name || s?.label || '')).filter(Boolean));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const tournamentSportMap = new Map(
    (tournaments || [])
      .map((t) => String(t?.sport || '').trim())
      .filter(Boolean)
      .map((s) => [s.toLowerCase(), s])
  );

  const allSportsMap = new Map(tournamentSportMap);
  backendSports.forEach((s) => {
    const clean = String(s || '').trim();
    if (clean && !allSportsMap.has(clean.toLowerCase())) {
      allSportsMap.set(clean.toLowerCase(), clean);
    }
  });

  const activeSports = Array.from(tournamentSportMap.values());
  const remainingSports = Array.from(allSportsMap.values()).filter(
    (s) => !tournamentSportMap.has(s.toLowerCase())
  );
  const primaryExtra = remainingSports.slice(0, 1);
  const moreSports = remainingSports.slice(1);
  const selectedOutsidePrimary =
    selectedSport &&
    selectedSport !== 'All' &&
    moreSports.some((s) => s.toLowerCase() === selectedSport.toLowerCase());

  const visibleSports = [
    'All',
    ...activeSports,
    ...primaryExtra,
    ...(showMoreSports || selectedOutsidePrimary ? moreSports : [])
  ];

  const baseFiltered = (tournaments || []).filter((t) => {
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

  const openTournaments = baseFiltered.filter((t) => !isTournamentClosed(t));
  const closedTournaments = baseFiltered.filter((t) => isTournamentClosed(t));
  const effectiveTab = closedTournaments.length === 0 ? 'open' : activeTab;
  const filteredTournaments = effectiveTab === 'open' ? openTournaments : closedTournaments;

  return (
    <div className="tournament-explorer">
      {closedTournaments.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`filter-btn ${effectiveTab === 'open' ? 'active' : ''}`}
            onClick={() => setActiveTab('open')}
            style={{ padding: '10px 18px', fontSize: '14px', fontWeight: '700' }}
          >
            Open & Live ({openTournaments.length})
          </button>
          <button
            type="button"
            className={`filter-btn ${effectiveTab === 'closed' ? 'active' : ''}`}
            onClick={() => setActiveTab('closed')}
            style={{ padding: '10px 18px', fontSize: '14px', fontWeight: '700' }}
          >
            Closed / Past ({closedTournaments.length})
          </button>
        </div>
      )}

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
          {visibleSports.map((sport) => (
            <button
              key={sport}
              type="button"
              className={`filter-btn ${
                (selectedSport === sport || (!selectedSport && sport === 'All')) ? 'active' : ''
              }`}
              onClick={() => setSelectedSport(sport === 'All' ? '' : sport)}
            >
              {sport}
            </button>
          ))}
          {moreSports.length > 0 && (
            <button
              type="button"
              className="filter-btn"
              onClick={() => setShowMoreSports((prev) => !prev)}
              style={{ borderStyle: 'dashed' }}
            >
              {showMoreSports || selectedOutsidePrimary ? 'Less −' : `+${moreSports.length} More`}
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p>Loading live tournaments from Arenova network...</p>
        </div>
      )}

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

      {!loading && filteredTournaments.length > 0 && (
        <div className="tournaments-grid">
          {filteredTournaments.map((tournament) => {
            const sportKey = (tournament.sport || 'badminton').toLowerCase();

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
                  {(() => {
                    const closed = isTournamentClosed(tournament);
                    const rawStatus = (tournament.status || 'PUBLISHED').toUpperCase();
                    const badgeLabel = closed
                      ? (['COMPLETED', 'CANCELLED', 'CANCELED'].includes(rawStatus) ? rawStatus : 'CLOSED')
                      : rawStatus;
                    return (
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: closed ? '#fee2e2' : (rawStatus === 'PUBLISHED' ? '#edf7d9' : '#fff'),
                          color: closed ? '#b91c1c' : (rawStatus === 'PUBLISHED' ? '#4b6e15' : 'var(--ink)'),
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          letterSpacing: '0.05em'
                        }}
                      >
                        {badgeLabel}
                      </span>
                    );
                  })()}
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
                      <div style={{ color: isTournamentClosed(tournament) ? '#b91c1c' : '#b45309', fontSize: '12px', fontWeight: '600' }}>
                        <span>⏰</span>
                        <span>
                          {isTournamentClosed(tournament) ? 'Registration Closed:' : 'Registration Closes:'} {new Date(tournament.registrationEndDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="tournament-card-footer">
                    <div className="fee-display">
                      <span>Registration</span>
                      <strong>{displayFee}</strong>
                    </div>

                    {isTournamentClosed(tournament) ? (
                      <span
                        style={{
                          padding: '9px 14px',
                          fontSize: '12px',
                          fontWeight: '700',
                          borderRadius: '8px',
                          background: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        Registration Closed
                      </span>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '10px 18px', fontSize: '13px' }}
                        onClick={() => onSelectTournament(tournament)}
                      >
                        View & Register →
                      </button>
                    )}
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

