import React, { useEffect } from 'react';
import badmintonImg from '../../assets/stadium_badminton_pro.jpg';
import basketballImg from '../../assets/stadium_basketball_pro.jpg';
import cricketImg from '../../assets/stadium_cricket_pro.jpg';

const SPORT_FALLBACKS = {
  badminton: badmintonImg,
  basketball: basketballImg,
  cricket: cricketImg,
  pickleball: badmintonImg,
  tennis: badmintonImg
};

export default function TournamentDetails({
  tournament,
  onBack,
  onProceedRegistration
}) {
  useEffect(() => {
    if (tournament?.title) {
      document.title = `${tournament.title} | Arenova Tournament Registration`;
    }
    return () => {
      document.title = 'Live Tournaments, Brackets & Registrations | Arenova';
    };
  }, [tournament?.title]);

  if (!tournament) return null;

  const sportKey = (tournament.sport || 'badminton').toLowerCase();
  let rawBanner = tournament.banner ||
    tournament.bannerImage ||
    tournament.image ||
    tournament.posterImage;

  if (typeof rawBanner === 'string' && rawBanner.includes('/api/media/')) {
    rawBanner = rawBanner.substring(rawBanner.indexOf('/api/media/'));
  }

  const bannerUrl = rawBanner || SPORT_FALLBACKS[sportKey] || badmintonImg;

  const startDate = tournament.startDate
    ? new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'TBA';

  const endDate = tournament.endDate
    ? new Date(tournament.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : startDate;

  const regDeadline = tournament.registrationEndDate
    ? new Date(tournament.registrationEndDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    : null;

  return (
    <div className="details-view td-shell">
      <div className="td-topbar">
        <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px 14px', fontSize: '13px' }}>
          ← Back to Tournaments
        </button>
      </div>

      <div className="td-hero">
        <img
          src={bannerUrl}
          alt={tournament.title}
          className="td-banner"
          loading="lazy"
          onError={(e) => {
            if (e.target.src.includes('/api/media/') && !e.target.dataset.triedFallback) {
              e.target.dataset.triedFallback = 'true';
              const path = e.target.src.substring(e.target.src.indexOf('/api/media/'));
              e.target.src = `https://api.getarenova.com${path}`;
              return;
            }
            e.target.src = SPORT_FALLBACKS[sportKey] || badmintonImg;
          }}
        />
        <div className="td-hero-overlay">
          <div className="td-badges">
            <span className="td-sport-pill">{(tournament.sport || 'SPORT').toUpperCase()}</span>
            {tournament.status && (
              <span className="td-status-badge">{tournament.status.toUpperCase()}</span>
            )}
          </div>
          <h1 className="td-hero-title">{tournament.title}</h1>
        </div>
      </div>

      <div className="td-grid">
        <div className="td-intro">
          <p className="td-desc">
            {tournament.description ||
              'Join players and teams competing in this tournament hosted on the Arenova platform. Verified scores, digital draw management, and direct payments.'}
          </p>
        </div>

        <aside className="td-sidebar">
          <div className="td-info-row">
            <span className="td-info-label">Tournament Dates</span>
            <div className="td-info-value">
              {startDate} {endDate !== startDate ? ` – ${endDate}` : ''}
            </div>
          </div>

          {regDeadline && (
            <div className="td-info-row">
              <span className="td-info-label td-deadline-label">Registration Deadline</span>
              <div className="td-info-value td-deadline-value">
                {regDeadline}
              </div>
            </div>
          )}

          <div className="td-info-row">
            <span className="td-info-label">Venue Location</span>
            <div className="td-info-value">
              {tournament.venue || 'Premium Complex'}, {tournament.city || 'India'}
            </div>
          </div>

          {tournament.prizePool && (
            <div className="td-info-row">
              <span className="td-info-label">Total Prize Pool</span>
              <div className="td-prize-value">
                ₹{tournament.prizePool.toLocaleString()}
              </div>
            </div>
          )}

          <button className="td-cta" onClick={onProceedRegistration}>
            Register for This Event →
          </button>
        </aside>

        <div className="td-sections">
          <div>
            <h3 className="td-section-title">Categories & Entry Fees</h3>
            <div className="td-cat-list">
              {(tournament.categories || []).length > 0 ? (
                tournament.categories.map((cat, idx) => {
                  const catName = typeof cat === 'string' ? cat : (cat.name || `Category ${idx + 1}`);
                  const fee = typeof cat === 'object' && typeof cat.fee === 'number' ? cat.fee : (tournament.registrationFee || 500);
                  const regType = typeof cat === 'object' && cat.registrationType ? cat.registrationType : 'INDIVIDUAL';
                  const capacity = typeof cat === 'object' ? cat.capacity : null;
                  const availability = typeof cat === 'object' ? (cat.availability ?? (capacity ? capacity - (cat.registeredCount || 0) : null)) : null;

                  return (
                    <div key={cat._id || idx} className="td-cat-card">
                      <div>
                        <div className="td-cat-meta">
                          <span className="td-cat-name">{catName}</span>
                          <span className="td-cat-type">{regType}</span>
                        </div>
                        <span className="td-cat-slots">
                          {availability !== null ? `${availability} slots open` : 'Slots available'}
                          {capacity ? ` • ${capacity} total` : ''}
                        </span>
                      </div>
                      <div className="td-cat-fee">
                        <span className="td-cat-fee-label">Entry Fee</span>
                        <span className="td-cat-fee-val">{fee === 0 ? 'Free' : `₹${fee}`}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="td-cat-card">
                  <span className="td-cat-name">Open Championship Category</span>
                  <span className="td-cat-fee-val">₹{tournament.registrationFee || 500}</span>
                </div>
              )}
            </div>
          </div>

          {tournament.rules && String(tournament.rules).trim() !== '' && String(tournament.rules).trim().toLowerCase() !== 'string' && (
            <div className="td-rules-box">
              <h3 className="td-section-title" style={{ marginBottom: '8px', fontSize: '16px' }}>Tournament Rules</h3>
              <p className="td-desc" style={{ fontSize: '14px' }}>
                {tournament.rules}
              </p>
            </div>
          )}
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            "name": tournament.title,
            "description": tournament.description || `Participate in ${tournament.title} organized on Arenova (getarenova.com).`,
            "startDate": tournament.startDate || new Date().toISOString(),
            "endDate": tournament.endDate || tournament.startDate || new Date().toISOString(),
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "location": {
              "@type": "Place",
              "name": tournament.venue || "Sports Arena",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": tournament.city || "Hyderabad",
                "addressCountry": "IN"
              }
            },
            "image": [
              typeof rawBanner === 'string' && rawBanner.startsWith('http')
                ? rawBanner
                : `https://getarenova.com/og-image.png`
            ],
            "organizer": {
              "@type": "Organization",
              "name": tournament.organizer || "Arenova & Novarena",
              "url": "https://getarenova.com"
            },
            "offers": {
              "@type": "Offer",
              "url": "https://getarenova.com/tournaments",
              "price": tournament.registrationFee || 500,
              "priceCurrency": "INR",
              "availability": "https://schema.org/InStock",
              "validFrom": new Date().toISOString().split('T')[0]
            }
          })
        }}
      />
    </div>
  );
}

