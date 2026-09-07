import React from 'react';

export default function HomePage({ onNavigate }) {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-grid container">
          <div className="hero-copy">
            <div className="eyebrow">SPORTS TECHNOLOGY PLATFORM</div>
            <h1>
              Technology that<br />
              <span>moves sports forward.</span>
            </h1>
            <p>
              Arenova connects players, tournaments, venues, organizers and sports
              communities through one simple digital ecosystem.
            </p>
            <div className="hero-actions">
              <button
                className="btn btn-primary"
                onClick={() => onNavigate('solutions')}
              >
                Explore Platform <span>→</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => onNavigate('about')}
              >
                Discover Arenova
              </button>
            </div>
            <div className="powered">
              A product of <strong>Novarena</strong>
            </div>
          </div>

          <div className="hero-visual">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="dashboard-card">
              <div className="dash-top">
                <span>ARENA PULSE</span>
                <span className="live-dot">● LIVE</span>
              </div>
              <div className="dash-title">Your sports ecosystem</div>
              <div className="stat-row">
                <div>
                  <strong>Players</strong>
                  <span>Connected</span>
                </div>
                <div>
                  <strong>Events</strong>
                  <span>Managed</span>
                </div>
                <div>
                  <strong>Venues</strong>
                  <span>Bookable</span>
                </div>
              </div>
              <div className="match-card" onClick={() => onNavigate('tournaments')} style={{ cursor: 'pointer' }}>
                <div>
                  <span className="pill">BADMINTON</span>
                  <span style={{ fontSize: '12px', color: '#666' }}>Today</span>
                </div>
                <h3>City Open Championship</h3>
                <div className="match-meta">
                  <span>Singles • Doubles</span>
                  <span style={{ fontWeight: 'bold' }}>Register →</span>
                </div>
              </div>
              <div className="progress">
                <span></span>
              </div>
              <small>Connected sports operations</small>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="section">
        <div className="container">
          <div className="section-head center">
            <div className="eyebrow">ONE PLATFORM</div>
            <h2>Every part of the sports ecosystem.</h2>
            <p>
              Arenova is built to make sports participation and operations
              simpler — from the player experience to the organizer dashboard.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature-card">
              <div className="icon" style={{ visibility: 'hidden', userSelect: 'none' }}>01</div>
              <h3>For Players</h3>
              <p>
                Discover tournaments, register, manage profiles, teams and
                participation history.
              </p>
              <button className="link-btn" onClick={() => onNavigate('solutions')}>
                Explore →
              </button>
            </article>

            <article className="feature-card">
              <div className="icon" style={{ visibility: 'hidden', userSelect: 'none' }}>02</div>
              <h3>For Organizers</h3>
              <p>
                Create events, manage registrations, draws, schedules, matches and results.
              </p>
              <button className="link-btn" onClick={() => onNavigate('solutions')}>
                Explore →
              </button>
            </article>

            <article className="feature-card">
              <div className="icon" style={{ visibility: 'hidden', userSelect: 'none' }}>03</div>
              <h3>For Venues</h3>
              <p>
                Manage courts, availability, bookings, customers and sports facility operations.
              </p>
              <button className="link-btn" onClick={() => onNavigate('venues')}>
                Explore →
              </button>
            </article>

            <article className="feature-card">
              <div className="icon" style={{ visibility: 'hidden', userSelect: 'none' }}>04</div>
              <h3>For Communities</h3>
              <p>
                Bring athletes and sports communities together around participation and events.
              </p>
              <button className="link-btn" onClick={() => onNavigate('solutions')}>
                Explore →
              </button>
            </article>
          </div>
        </div>
      </section>

      {/* Dark Process Section */}
      <section className="dark-section">
        <div className="container split">
          <div>
            <div className="eyebrow light">BUILT FOR SPORT</div>
            <h2>From registration to results.</h2>
            <p>
              Arenova helps organizers run tournaments digitally while giving
              players a cleaner way to discover, register and participate.
            </p>
            <button
              className="btn btn-light"
              style={{ marginTop: '28px' }}
              onClick={() => onNavigate('tournaments')}
            >
              Explore Tournaments →
            </button>
          </div>
          <div className="process">
            <div>
              <b>01</b>
              <span>Discover</span>
              <p>Find tournaments and venues across your city.</p>
            </div>
            <div>
              <b>02</b>
              <span>Register</span>
              <p>Join events, choose categories, and manage teams.</p>
            </div>
            <div>
              <b>03</b>
              <span>Compete</span>
              <p>Access match schedules, draws, and live score updates.</p>
            </div>
            <div>
              <b>04</b>
              <span>Track</span>
              <p>View results and keep your participation history organized.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Box Section */}
      <section className="section">
        <div className="container payment-box">
          <div>
            <div className="eyebrow">PAYMENTS</div>
            <h2>Simple, digital transactions.</h2>
            <p>
              Arenova supports secure payments for eligible tournament
              registrations, venue bookings, and sports services through
              authorized payment gateway partners.
            </p>
          </div>
          <div className="payment-list">
            <span>UPI</span>
            <span>Cards</span>
            <span>Net Banking</span>
            <span>Receipts</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container cta-inner">
          <div>
            <div className="eyebrow" style={{ color: 'rgba(16, 17, 20, 0.7)' }}>
              THE NEXT PLAY
            </div>
            <h2>Build a better sports experience.</h2>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => onNavigate('contact')}
          >
            Talk to Arenova →
          </button>
        </div>
      </section>
    </main>
  );
}
