import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { completeUserProfile } from '../../utils/auth';

export default function UserDashboard({
  authObj,
  onSignOut,
  onBrowseTournaments,
  onUpdateAuth,
  onOpenDownloadModal
}) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('registrations'); // 'registrations' or 'profile'
  const [profileForm, setProfileForm] = useState({
    firstName: authObj?.user?.firstName || (authObj?.user?.name ? authObj.user.name.split(' ')[0] : ''),
    lastName: authObj?.user?.lastName || (authObj?.user?.name ? authObj.user.name.split(' ').slice(1).join(' ') : ''),
    email: authObj?.user?.email || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState({ type: '', message: '' });

  const [cancelInfoId, setCancelInfoId] = useState(null);

  // Invoices state
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [invoiceError, setInvoiceError] = useState('');
  const [registrationsError, setRegistrationsError] = useState('');

  useEffect(() => {
    fetchRegistrations();
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (authObj?.user) {
      setProfileForm({
        firstName: authObj.user.firstName || (authObj.user.name ? authObj.user.name.split(' ')[0] : ''),
        lastName: authObj.user.lastName || (authObj.user.name ? authObj.user.name.split(' ').slice(1).join(' ') : ''),
        email: authObj.user.email || ''
      });
    }
  }, [authObj]);

  const fetchRegistrations = async () => {
    setLoading(true);
    setRegistrationsError('');
    try {
      const res = await api.getMyRegistrations();
      const rawList = res?.data || res || [];
      const list = Array.isArray(rawList) ? rawList : [];

      // Fetch tournaments list to enrich any registration that only has an ID
      const tournamentsRes = await api.getTournaments().catch(() => ({ data: [] }));
      const allTournaments = tournamentsRes?.data || tournamentsRes || [];
      const tMap = {};
      if (Array.isArray(allTournaments)) {
        allTournaments.forEach(t => {
          if (t._id) tMap[t._id] = t;
          if (t.id) tMap[t.id] = t;
        });
      }

      const enriched = list.map(reg => {
        let t = reg.tournament;
        if (!t || typeof t === 'string') {
          const tId = typeof t === 'string' ? t : reg.tournamentId;
          t = tMap[tId] || {
            title: reg.tournamentTitle || 'Tournament Pass',
            sport: reg.sport || 'Sports',
            venue: reg.venue || 'Arenova Designated Arena'
          };
        }
        return {
          ...reg,
          tournament: t
        };
      });

      setRegistrations(enriched);
    } catch (err) {
      setRegistrations([]);
      setRegistrationsError(err.message || 'Unable to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    setInvoiceError('');
    try {
      const res = await api.getMyInvoices({ type: 'tournament_registration' });
      const rawList = res?.data || res || [];
      setInvoices(Array.isArray(rawList) ? rawList : []);
    } catch (err) {
      setInvoices([]);
      setInvoiceError(err.message || 'Unable to load invoices. Please check your internet connection.');
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    if (!invoiceId || downloadingInvoiceId) return;
    setDownloadingInvoiceId(invoiceId);
    setInvoiceError('');
    try {
      const res = await api.downloadInvoice(invoiceId);
      if (res?.success && res.data?.downloadUrl) {
        window.open(res.data.downloadUrl, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error(res?.message || 'Invoice PDF is still generating. Please try again in a few moments.');
      }
    } catch (err) {
      if (err?.status === 400 || err?.message?.toLowerCase().includes('generating')) {
        setInvoiceError('Generating PDF, please try again in a moment.');
      } else if (err?.status === 403) {
        setInvoiceError('Unauthorized: Users can only access their own invoices.');
      } else if (err?.status === 404) {
        setInvoiceError('Invoice not found.');
      } else if (err?.status === 401) {
        setInvoiceError('Session expired. Please sign in again.');
      } else {
        setInvoiceError(err.message || 'Unable to download invoice. Please try again.');
      }
    } finally {
      setDownloadingInvoiceId(null);
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
        profileForm.firstName.trim(),
        profileForm.lastName.trim(),
        profileForm.email.trim()
      );

      const updatedUser = {
        ...authObj?.user,
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        email: profileForm.email.trim(),
        name: `${profileForm.firstName.trim()} ${profileForm.lastName.trim()}`.trim()
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
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>Logged in as <strong>{authObj?.user?.name || (authObj?.user?.phone ? `+91 ${authObj.user.phone.slice(-10)}` : (authObj?.user?.email || 'Verified'))}</strong></span>
                {authObj?.user?.role && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      background: '#eef2e7',
                      color: '#4b6e15',
                      border: '1px solid #d0e4ba',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    {authObj.user.role}
                  </span>
                )}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={onBrowseTournaments}>
                Browse Tournaments
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onOpenDownloadModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(184, 255, 61, 0.15)',
                  borderColor: 'rgba(184, 255, 61, 0.5)',
                  color: 'var(--ink)',
                  fontWeight: '700'
                }}
              >
                📲 Download App
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
              onClick={() => {
                setActiveTab('invoices');
                fetchInvoices();
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 16px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                color: activeTab === 'invoices' ? 'var(--ink)' : 'var(--muted)',
                borderBottom: activeTab === 'invoices' ? '3px solid var(--ink)' : '3px solid transparent'
              }}
            >
              Invoices & Receipts ({invoices.length})
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
              {registrationsError && (
                <div style={{
                  background: '#fff8df',
                  border: '1px solid #fde047',
                  color: '#854d0e',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: '13px' }}>⚠️ {registrationsError}</span>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                    onClick={fetchRegistrations}
                  >
                    Retry
                  </button>
                </div>
              )}

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
                                {reg.partnerName ? ` • Partner: ${reg.partnerName}` : ''}
                              </div>
                              <div>
                                Participant: <strong style={{ color: 'var(--ink)' }}>{athleteName}</strong>
                                {athletePhone ? ` (${athletePhone})` : ''}
                              </div>
                              {(tournament.venue || tournament.location) && (
                                <div>
                                  Venue: <strong style={{ color: 'var(--ink)' }}>{tournament.venue || tournament.location}</strong>
                                </div>
                              )}
                              {(tournament.startDate || tournament.date) && (
                                <div>
                                  Schedule: <strong style={{ color: 'var(--ink)' }}>
                                    {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : tournament.date}
                                  </strong>
                                </div>
                              )}
                              {reg.amount ? (
                                <div>
                                  Amount Paid: <strong style={{ color: 'var(--ink)' }}>₹{reg.amount}</strong>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <div>
                              <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Pass ID</span>
                              <strong style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                                {regId?.slice(-8) || 'ACTIVE'}
                              </strong>
                            </div>

                            {/* Direct Invoice PDF download button if pass has an invoice linked */}
                            {reg.invoice?._id && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                disabled={downloadingInvoiceId === reg.invoice._id}
                                onClick={() => handleDownloadInvoice(reg.invoice._id)}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: '#f8fdf2',
                                  borderColor: '#a3e635',
                                  color: '#275204',
                                  fontWeight: '600',
                                  borderRadius: '6px'
                                }}
                              >
                                {downloadingInvoiceId === reg.invoice._id ? '⏳ Fetching...' : '📄 Tax Invoice (PDF)'}
                              </button>
                            )}

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

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div>
              {invoiceError && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: '13px' }}>⚠️ {invoiceError}</span>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '12px', background: '#991b1b', borderColor: '#991b1b', color: '#fff' }}
                    onClick={fetchInvoices}
                  >
                    Retry
                  </button>
                </div>
              )}

              {loadingInvoices && (
                <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--muted)' }}>
                  Loading payment invoices...
                </div>
              )}

              {!loadingInvoices && invoices.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: 'var(--soft)',
                  borderRadius: '16px',
                  border: '1px dashed var(--line)'
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>📄</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '8px' }}>
                    No Invoices Available
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
                    Official tax invoices and payment receipts generated for tournament registrations will appear here.
                  </p>
                  <button className="btn btn-primary" onClick={onBrowseTournaments}>
                    Browse Tournaments
                  </button>
                </div>
              )}

              {!loadingInvoices && invoices.length > 0 && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {invoices.map((inv) => {
                    const isDownloading = downloadingInvoiceId === inv._id;
                    const formattedDate = inv.paidAt
                      ? new Date(inv.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Recently Paid';

                    return (
                      <div
                        key={inv._id}
                        style={{
                          background: '#fff',
                          border: '1px solid var(--line)',
                          borderRadius: '14px',
                          padding: '20px 24px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '16px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '14px' }}>
                              {inv.invoiceNumber || 'INV-ARENOVA'}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: '#edf7d9',
                              color: '#4b6e15'
                            }}>
                              PAID
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                            <span>Tournament Registration</span> • <span>{formattedDate}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <strong style={{ fontSize: '18px', color: 'var(--ink)' }}>
                            ₹{inv.total || inv.amount || 0}
                          </strong>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            disabled={isDownloading || inv.downloadReady === false}
                            onClick={() => handleDownloadInvoice(inv._id)}
                            style={{
                              padding: '8px 14px',
                              fontSize: '13px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              opacity: inv.downloadReady === false ? 0.65 : 1,
                              cursor: inv.downloadReady === false ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {isDownloading
                              ? '⏳ Fetching...'
                              : (inv.downloadReady === false ? '⏳ Generating PDF...' : '📄 Download PDF')}
                          </button>
                        </div>
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
