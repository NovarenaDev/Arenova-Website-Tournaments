import React, { useState, useEffect } from 'react';
import TournamentList from '../components/TournamentBooking/TournamentList';
import TournamentDetails from '../components/TournamentBooking/TournamentDetails';
import RegistrationFlow from '../components/TournamentBooking/RegistrationFlow';
import PaymentModal from '../components/TournamentBooking/PaymentModal';

export default function TournamentsPage({
  tournaments,
  loadingTournaments,
  tournamentsError,
  onRetryTournaments,
  authObj,
  onRequireAuth,
  onViewDashboard
}) {
  // Sub-views: 'overview' (reference tournaments.html), 'live' (dedicated tournament finder), 'details', 'register'
  const [subView, setSubView] = useState('overview');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [selectedSport, setSelectedSport] = useState('');

  // Payment modal state
  const [paymentData, setPaymentData] = useState(null);
  const [pendingRegister, setPendingRegister] = useState(false);

  const handleSelectTournament = (tournament) => {
    setSelectedTournament(tournament);
    setSubView('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedRegistration = () => {
    if (!authObj?.token) {
      setPendingRegister(true);
      onRequireAuth();
      return;
    }
    setSubView('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Automatically continue to registration once authenticated
  useEffect(() => {
    if (authObj?.token && pendingRegister) {
      setPendingRegister(false);
      setSubView('register');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [authObj, pendingRegister]);

  const handleSuccessRegistration = (registration, order, fee) => {
    setPaymentData({
      registration,
      order,
      tournament: selectedTournament,
      fee
    });
  };

  return (
    <main>
      {/* 1. Sub-view: Tournament Details */}
      {subView === 'details' && selectedTournament && (
        <section className="section" style={{ paddingTop: '40px' }}>
          <div className="container">
            <TournamentDetails
              tournament={selectedTournament}
              onBack={() => {
                setSubView('live');
                setSelectedTournament(null);
              }}
              onProceedRegistration={handleProceedRegistration}
            />
          </div>
        </section>
      )}

      {/* 2. Sub-view: Registration Form */}
      {subView === 'register' && selectedTournament && (
        <section className="section" style={{ paddingTop: '40px' }}>
          <div className="container">
            <RegistrationFlow
              tournament={selectedTournament}
              authObj={authObj}
              onBack={() => setSubView('details')}
              onSuccessRegistration={handleSuccessRegistration}
              onRequireAuth={onRequireAuth}
              onViewDashboard={onViewDashboard}
            />
          </div>
        </section>
      )}

      {/* 3. Sub-view: Dedicated Live Tournaments Page (Navigated from Register Now) */}
      {subView === 'live' && (
        <section className="section" style={{ paddingTop: '40px' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSubView('overview');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                ← Back to Overview
              </button>
              <span className="pill dark" style={{ padding: '6px 12px', fontSize: '11px' }}>
                ● {tournaments.length} LIVE EVENTS
              </span>
            </div>

            <div className="section-head">
              <div className="eyebrow">LIVE EVENT REGISTRATION</div>
              <h2>Explore & Register for Active Events</h2>
              <p>
                Browse tournaments hosted on Arenova. Filter by sport, review prize pools,
                and complete your registration digitally.
              </p>
            </div>

            <TournamentList
              tournaments={tournaments}
              loading={loadingTournaments}
              error={tournamentsError}
              onRetry={onRetryTournaments}
              onSelectTournament={handleSelectTournament}
              selectedSport={selectedSport}
              setSelectedSport={setSelectedSport}
            />
          </div>
        </section>
      )}

      {/* 4. Primary View: Pure tournaments.html showcase with small Register Now navigation button */}
      {subView === 'overview' && (
        <>
          {/* Reference Page Hero with Right-aligned prominent Register Action */}
          <section className="page-hero" style={{ padding: '80px 0 40px' }}>
            <div className="container">
              <div
                className="tournament-hero-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
                  gap: '40px',
                  alignItems: 'center'
                }}
              >
                {/* Left: Headline & Introduction */}
                <div>
                  <div className="eyebrow">TOURNAMENTS</div>
                  <h1 style={{ marginBottom: '16px' }}>
                    Discover. Register.<br />
                    <span>Compete.</span>
                  </h1>
                  <p style={{ maxWidth: '520px', margin: 0, fontSize: '17px', color: 'var(--muted)' }}>
                    Tournaments are one part of the Arenova ecosystem — designed to
                    connect registration, operations, matches and results.
                  </p>
                </div>

                {/* Right: Prominent, High-Visibility Registration Action Box */}
                <div
                  style={{
                    background: '#101114',
                    color: '#fff',
                    borderRadius: '16px',
                    padding: '28px 30px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 16px 36px rgba(0,0,0,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(184, 255, 61, 0.15)',
                        color: 'var(--accent)',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        letterSpacing: '0.04em'
                      }}
                    >
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          boxShadow: '0 0 8px var(--accent)'
                        }}
                      ></span>
                      LIVE EVENT REGISTRATION
                    </span>
                    <span style={{ fontSize: '12px', color: '#9da3af', fontWeight: '500' }}>
                      {tournaments.length} Active {tournaments.length === 1 ? 'Event' : 'Events'}
                    </span>
                  </div>

                  <div>
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '22px',
                        color: '#fff',
                        margin: '0 0 6px',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      Ready to Hit the Court?
                    </h3>
                    <p style={{ color: '#9da3af', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                      Browse active brackets, choose your category, and complete your registration digitally with instant confirmation.
                    </p>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setSubView('live');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      padding: '14px 24px',
                      fontSize: '15px',
                      fontWeight: '700',
                      borderRadius: '8px',
                      width: '100%',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(184, 255, 61, 0.25)'
                    }}
                  >
                    ⚡ Register Now for Live Tournaments →
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Supported Categories from Reference HTML with Optimized Vertical Spacing */}
          <section className="section" style={{ paddingTop: '30px', paddingBottom: '70px' }}>
            <div className="container">
              <div className="section-head" style={{ marginBottom: '32px' }}>
                <div className="eyebrow">SUPPORTED CATEGORIES</div>
                <h2>Built for modern tournament operations.</h2>
              </div>
              <div className="event-grid">
                <article>
                  <span className="pill">BADMINTON</span>
                  <h3>Singles</h3>
                  <p>Individual tournament registration and match management.</p>
                </article>
                <article>
                  <span className="pill">BADMINTON</span>
                  <h3>Doubles</h3>
                  <p>Team registration with player and partner information.</p>
                </article>
                <article>
                  <span className="pill">BADMINTON</span>
                  <h3>Mixed Doubles</h3>
                  <p>Manage mixed teams and tournament progression.</p>
                </article>
                <article>
                  <span className="pill">PICKLEBALL</span>
                  <h3>Coming / Available</h3>
                  <p>Support for pickleball events and categories.</p>
                </article>
              </div>
            </div>
          </section>

          {/* Digital Tournament Flow Timeline from Reference HTML */}
          <section className="dark-section">
            <div className="container">
              <div className="eyebrow light">DIGITAL TOURNAMENT FLOW</div>
              <div className="timeline">
                <div>
                  <b>01</b>
                  <h3>Event Setup</h3>
                  <p>Organizer creates the tournament and categories.</p>
                </div>
                <div>
                  <b>02</b>
                  <h3>Registration</h3>
                  <p>Players submit details and pay applicable fees.</p>
                </div>
                <div>
                  <b>03</b>
                  <h3>Draw & Schedule</h3>
                  <p>Draws and match schedules are prepared.</p>
                </div>
                <div>
                  <b>04</b>
                  <h3>Competition</h3>
                  <p>Matches, scores and progression are managed.</p>
                </div>
                <div>
                  <b>05</b>
                  <h3>Results</h3>
                  <p>Final results and participation records are published.</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Payment & Confirmation Modal */}
      {paymentData && (
        <PaymentModal
          registration={paymentData.registration}
          order={paymentData.order}
          tournament={paymentData.tournament}
          selectedFee={paymentData.fee}
          onClose={() => {
            setPaymentData(null);
            setSubView('live');
          }}
          onPaymentComplete={() => {
            // Completed
          }}
          onViewDashboard={() => {
            setPaymentData(null);
            onViewDashboard();
          }}
        />
      )}
    </main>
  );
}
