import React from 'react';
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
  if (!tournament) return null;

  const sportKey = (tournament.sport || 'badminton').toLowerCase();
  const bannerUrl = tournament.banner ||
    tournament.bannerImage ||
    tournament.image ||
    tournament.posterImage ||
    SPORT_FALLBACKS[sportKey] ||
    badmintonImg;

  const startDate = tournament.startDate
    ? new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'TBA';

  const endDate = tournament.endDate
    ? new Date(tournament.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : startDate;

  const regDeadline = tournament.registrationEndDate
    ? new Date(tournament.registrationEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="details-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px 16px', fontSize: '13px' }}>
          ← Back to Live Tournaments
        </button>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="pill dark" style={{ padding: '6px 14px', fontSize: '11px' }}>
            {(tournament.sport || 'SPORT').toUpperCase()}
          </span>
          {tournament.status && (
            <span style={{
              background: '#edf7d9',
              color: '#4b6e15',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              {tournament.status.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <img
        src={bannerUrl}
        alt={tournament.title}
        className="details-banner"
        style={{ width: '100%', maxHeight: '380px', objectFit: 'cover', borderRadius: '16px' }}
        onError={(e) => { e.target.src = badmintonImg; }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '40px', alignItems: 'start', marginTop: '20px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', marginBottom: '14px' }}>
            {tournament.title}
          </h1>

          <p style={{ color: 'var(--muted)', fontSize: '16px', lineHeight: '1.7', marginBottom: '30px', whiteSpace: 'pre-line' }}>
            {tournament.description ||
              'Join players and teams competing in this tournament hosted on the Arenova platform. Verified scores, digital draw management, and direct payments.'}
          </p>

          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', marginBottom: '16px' }}>
            Tournament Categories & Registration Fees
          </h3>

          <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
            {(tournament.categories || []).length > 0 ? (
              tournament.categories.map((cat, idx) => {
                const catName = typeof cat === 'string' ? cat : (cat.name || `Category ${idx + 1}`);
                const fee = typeof cat === 'object' && typeof cat.fee === 'number' ? cat.fee : (tournament.registrationFee || 500);
                const regType = typeof cat === 'object' && cat.registrationType ? cat.registrationType : 'INDIVIDUAL';
                const capacity = typeof cat === 'object' ? cat.capacity : null;
                const availability = typeof cat === 'object' ? (cat.availability ?? (capacity ? capacity - (cat.registeredCount || 0) : null)) : null;

                return (
                  <div
                    key={cat._id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '18px 22px',
                      background: 'var(--soft)',
                      borderRadius: '14px',
                      border: '1px solid var(--line)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '17px' }}>{catName}</strong>
                        <span style={{ fontSize: '10px', fontWeight: '700', background: '#e1e3e8', padding: '2px 7px', borderRadius: '4px' }}>
                          {regType}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {availability !== null ? `${availability} slots open` : 'Slots available'} {capacity ? ` (Total Capacity: ${capacity})` : ''}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Entry Fee</span>
                      <strong style={{ fontSize: '20px', color: 'var(--ink)' }}>₹{fee}</strong>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '16px', background: 'var(--soft)', borderRadius: '12px' }}>
                Open Championship Category • ₹{tournament.registrationFee || 500}
              </div>
            )}
          </div>

          {tournament.rules && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '10px' }}>
                Tournament Rules
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '14px', whiteSpace: 'pre-line', lineHeight: '1.7' }}>
                {tournament.rules}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Info Card */}
        <div style={{
          background: 'var(--soft)',
          border: '1px solid var(--line)',
          borderRadius: '16px',
          padding: '28px',
          display: 'grid',
          gap: '20px'
        }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)' }}>
              Tournament Dates
            </span>
            <div style={{ fontWeight: '700', fontSize: '16px', marginTop: '4px' }}>
              {startDate} {endDate !== startDate ? ` - ${endDate}` : ''}
            </div>
          </div>

          {regDeadline && (
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#b45309', fontWeight: '700' }}>
                Registration Deadline
              </span>
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#b45309', marginTop: '4px' }}>
                {regDeadline}
              </div>
            </div>
          )}

          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)' }}>
              Venue Location
            </span>
            <div style={{ fontWeight: '700', fontSize: '16px', marginTop: '4px' }}>
              {tournament.venue || 'Premium Complex'}, {tournament.city || 'India'}
            </div>
          </div>

          {tournament.prizePool && (
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)' }}>
                Total Prize Pool
              </span>
              <div style={{ fontWeight: '800', fontSize: '22px', color: '#387c14', marginTop: '4px' }}>
                ₹{tournament.prizePool.toLocaleString()}
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '15px', marginTop: '8px' }}
            onClick={onProceedRegistration}
          >
            Register for This Event →
          </button>
        </div>
      </div>
    </div>
  );
}
