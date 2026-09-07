import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { completeUserProfile } from '../../utils/auth';

export default function UserDashboard({
  authObj,
  onSignOut,
  onBrowseTournaments,
  onUpdateAuth
}) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('registrations'); // 'registrations' or 'profile'
  const [profileForm, setProfileForm] = useState({
    firstName: authObj?.user?.firstName || '',
    lastName: authObj?.user?.lastName || '',
    email: authObj?.user?.email || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState({ type: '', message: '' });

  const [cancelInfoId, setCancelInfoId] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await api.getMyRegistrations();
      setRegistrations(res.data || res || []);
    } catch (err) {
      console.error('Failed to load registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileStatus({ type: '', message: '' });

    try {
      const token = authObj?.token || localStorage.getItem('arenova_auth_token');
      await completeUserProfile(
        token,
        profileForm.firstName,
        profileForm.lastName,
        profileForm.email
      );

      const updatedUser = {
        ...authObj?.user,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email
      };

      onUpdateAuth(updatedUser);
      setProfileStatus({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err) {
      setProfileStatus({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <main>
      <section className="page-hero" style={{ padding: '80px 0 40px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div className="eyebrow">ATHLETE HUB</div>
              <h1 style={{ fontSize: 'clamp(36px, 5vw, 52px)', margin: '0 0 8px' }}>
                My Dashboard
              </h1>
              <p style={{ margin: 0 }}>
                Logged in as <strong>+91 {authObj?.user?.phone ? authObj.user.phone.slice(-10) : 'Verified'}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={onBrowseTournaments}>
                Browse Tournaments
              </button>
              <button className="btn btn-danger" onClick={onSignOut} style={{ padding: '10px 18px', fontSize: '13px' }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '30px' }}>
        <div className="container">
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--line)', marginBottom: '30px' }}>
            <button
              onClick={() => setActiveTab('registrations')}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 16px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                color: activeTab === 'registrations' ? 'var(--ink)' : 'var(--muted)',
                borderBottom: activeTab === 'registrations' ? '3px solid var(--ink)' : '3px solid transparent'
              }}
            >
              My Registered Tournaments ({registrations.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 16px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                color: activeTab === 'profile' ? 'var(--ink)' : 'var(--muted)',
                borderBottom: activeTab === 'profile' ? '3px solid var(--ink)' : '3px solid transparent'
              }}
            >
              Profile & Details
            </button>
          </div>

          {/* Registrations Tab */}
          {activeTab === 'registrations' && (
            <div>
              {loading && (
                <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--muted)' }}>
                  Loading your tournament passes...
                </div>
              )}

              {!loading && registrations.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: 'var(--soft)',
                  borderRadius: '16px',
                  border: '1px dashed var(--line)'
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎟️</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '8px' }}>
                    No Active Registrations Yet
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
                    You haven't signed up for any tournaments yet. Ready to hit the court?
                  </p>
                  <button className="btn btn-primary" onClick={onBrowseTournaments}>
                    Explore Tournaments Now →
                  </button>
                </div>
              )}

              {!loading && registrations.length > 0 && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {registrations.map((reg) => {
                    const tournament = reg.tournament || {};
                    const isPaid = reg.paymentStatus === 'PAID' || reg.paymentStatus === 'COMPLETED' || reg.status === 'CONFIRMED';
                    const regId = reg._id || reg.id;
                    const isCancelOpen = cancelInfoId === regId;
                    const athleteName = reg.playerName || reg.name || `${authObj?.user?.firstName || ''} ${authObj?.user?.lastName || ''}`.trim() || 'Player';
                    const athletePhone = reg.playerPhone || reg.phone || authObj?.user?.phone || 'Verified Mobile';

                    return (
                      <div
                        key={regId}
                        style={{
                          background: '#fff',
                          border: '1px solid var(--line)',
                          borderRadius: '14px',
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: '16px'
                        }}>
                          <div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                              <span className="pill dark">{(tournament.sport || 'SPORTS').toUpperCase()}</span>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: isPaid ? '#edf7d9' : '#fff8df',
                                color: isPaid ? '#4b6e15' : '#854d0e'
                              }}>
                                {isPaid ? '✓ CONFIRMED' : 'PENDING PAYMENT'}
                              </span>
                            </div>

                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '6px' }}>
                              {tournament.title || 'Tournament Entry'}
                            </h3>
                            <div style={{ fontSize: '13px', color: 'var(--muted)', display: 'grid', gap: '4px' }}>
                              <div>
                                Category: <strong style={{ color: 'var(--ink)' }}>{reg.categoryName || 'Open'}</strong>
                                {reg.teamName ? ` • Team: ${reg.teamName}` : ''}
                              </div>
                              <div>
                                Participant: <strong style={{ color: 'var(--ink)' }}>{athleteName}</strong>
                                {athletePhone ? ` (${athletePhone})` : ''}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <div>
                              <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Pass ID</span>
                              <strong style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                                {regId?.slice(-8) || 'ACTIVE'}
                              </strong>
                            </div>

                            <button
                              type="button"
                              onClick={() => setCancelInfoId(isCancelOpen ? null : regId)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#b91c1c',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                padding: 0
                              }}
                            >
                              {isCancelOpen ? 'Hide Cancellation Info' : 'Need to Cancel or Refund?'}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Cancellation & Refund Guidance */}
                        {isCancelOpen && (
                          <div style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '10px',
                            padding: '16px 18px',
                            fontSize: '13px',
                            color: '#991b1b'
                          }}>
                            <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '14px' }}>
                              Tournament Cancellation & Refund Procedure
                            </div>
                            <p style={{ margin: '0 0 10px', lineHeight: '1.5' }}>
                              Per the Arenova Refund & Cancellation Policy, cancellations and refunds are approved by the tournament organizers / Admin Portal before brackets are published.
                            </p>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <a
                                href={`mailto:support@novarena.in?subject=Cancellation Request: Pass ${regId}&body=Hi Arenova Support,%0D%0A%0D%0AI would like to request cancellation for my tournament registration.%0D%0A%0D%0ATournament: ${tournament.title || ''}%0D%0APass ID: ${regId}%0D%0ACategory: ${reg.categoryName || ''}%0D%0AParticipant: ${athleteName}%0D%0APhone: ${athletePhone}%0D%0A%0D%0AReason for cancellation:%0D%0A`}
                                className="btn btn-primary"
                                style={{
                                  background: '#b91c1c',
                                  borderColor: '#b91c1c',
                                  color: '#fff',
                                  padding: '8px 14px',
                                  fontSize: '12px'
                                }}
                              >
                                Email Support to Cancel →
                              </a>
                              <span style={{ fontSize: '12px', color: '#7f1d1d' }}>
                                Or contact the tournament director directly.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '600px', background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid var(--line)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', marginBottom: '6px' }}>
                Player Details
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
                Keep your details updated so tournament organizers can contact you with match draws.
              </p>

              {profileStatus.message && (
                <div className={`form-message ${profileStatus.type}`} style={{ marginBottom: '20px' }}>
                  {profileStatus.message}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Registered Mobile
                  </label>
                  <input
                    type="text"
                    disabled
                    value={authObj?.user?.phone || 'Mobile Verified'}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', background: '#f5f6f8', color: '#777' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingProfile}
                  style={{ marginTop: '10px' }}
                >
                  {savingProfile ? 'Saving Changes...' : 'Save Profile Details'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
