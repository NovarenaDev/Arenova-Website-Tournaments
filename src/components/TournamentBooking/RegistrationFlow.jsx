import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function RegistrationFlow({
  tournament,
  authObj,
  onBack,
  onSuccessRegistration,
  onRequireAuth
}) {
  const initialName = `${authObj?.user?.firstName || ''} ${authObj?.user?.lastName || ''}`.trim() || authObj?.user?.name || '';
  const initialPhone = authObj?.user?.phone || '';
  const initialEmail = authObj?.user?.email || '';

  const [playerName, setPlayerName] = useState(initialName);
  const [playerPhone, setPlayerPhone] = useState(initialPhone);
  const [playerEmail, setPlayerEmail] = useState(initialEmail);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState([{ name: '', phone: '', role: 'Captain' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const categories = tournament?.categories || [];

  useEffect(() => {
    if (authObj?.user) {
      const n = `${authObj.user.firstName || ''} ${authObj.user.lastName || ''}`.trim() || authObj.user.name || '';
      if (n && !playerName) setPlayerName(n);
      if (authObj.user.phone && !playerPhone) setPlayerPhone(authObj.user.phone);
      if (authObj.user.email && !playerEmail) setPlayerEmail(authObj.user.email);
    }
  }, [authObj]);

  useEffect(() => {
    const cats = tournament?.categories || [];
    if (cats.length > 0) {
      const first = cats[0];
      setSelectedCategory(typeof first === 'string' ? first : (first.name || 'Open Category'));
    } else {
      setSelectedCategory('Open Category');
    }
  }, [tournament]);

  // Resolve category object and registration type from backend data
  const matchedCategory = categories.find((c) =>
    (typeof c === 'string' ? c : c.name) === selectedCategory
  );

  const currentFee = typeof matchedCategory === 'object' && typeof matchedCategory.fee === 'number'
    ? matchedCategory.fee
    : (tournament.registrationFee || 500);

  const backendRegType = (typeof matchedCategory === 'object' && matchedCategory.registrationType)
    ? matchedCategory.registrationType.toUpperCase()
    : null;

  const isPairCategory = backendRegType === 'PAIR' ||
    selectedCategory.toLowerCase().includes('double') ||
    selectedCategory.toLowerCase().includes('pair') ||
    selectedCategory.toLowerCase().includes('mixed');

  const isTeamCategory = backendRegType === 'TEAM' ||
    selectedCategory.toLowerCase().includes('team') ||
    selectedCategory.toLowerCase().includes('squad') ||
    (tournament.sport || '').toLowerCase() === 'cricket' ||
    (tournament.sport || '').toLowerCase() === 'basketball';

  const handleAddTeamMember = () => {
    setTeamMembers([...teamMembers, { name: '', phone: '', role: `Player ${teamMembers.length + 1}` }]);
  };

  const handleRemoveTeamMember = (index) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...teamMembers];
    updated[index][field] = value;
    setTeamMembers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authObj?.token) {
      onRequireAuth();
      return;
    }

    const resolvedName = playerName.trim() || `${authObj.user?.firstName || ''} ${authObj.user?.lastName || ''}`.trim() || authObj.user?.name || 'Athlete';
    const resolvedPhone = playerPhone.trim() || authObj.user?.phone || '';
    const resolvedEmail = playerEmail.trim() || authObj.user?.email || '';

    if (!resolvedName) {
      setErrorMsg('Please enter the participant full name.');
      return;
    }

    if (!resolvedPhone) {
      setErrorMsg('Please enter a valid mobile number for registration.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        categoryName: selectedCategory || 'Open Category',
        // Pass all field variations so Admin Portal and match management schemas pick it up
        playerName: resolvedName,
        playerPhone: resolvedPhone,
        playerEmail: resolvedEmail,
        name: resolvedName,
        phone: resolvedPhone,
        email: resolvedEmail,
        mobile: resolvedPhone,
        phoneNumber: resolvedPhone,
        registrantName: resolvedName,
        registrantPhone: resolvedPhone,
        participantName: resolvedName,
        participantPhone: resolvedPhone,
        user: {
          name: resolvedName,
          firstName: resolvedName.split(' ')[0] || resolvedName,
          lastName: resolvedName.split(' ').slice(1).join(' ') || '',
          phone: resolvedPhone,
          email: resolvedEmail
        }
      };

      if (isTeamCategory) {
        payload.teamName = teamName || `${resolvedName}'s Team`;
        payload.teamMembers = teamMembers.filter((m) => m.name.trim() !== '');
      } else if (isPairCategory) {
        payload.partnerName = partnerName || undefined;
        payload.partnerPhone = partnerPhone || undefined;
      }

      console.log('Submitting registration payload with full participant details to live backend:', payload);
      const res = await api.registerForTournament(tournament._id || tournament.id, payload);

      const reg = res.data?.registration || res.registration || res.data;
      const order = res.data?.order || res.order;

      if (res.success && reg) {
        // Attach explicit player info to reg object for immediate payment modal & confirmation
        reg.playerName = resolvedName;
        reg.playerPhone = resolvedPhone;
        reg.playerEmail = resolvedEmail;
        reg.name = resolvedName;
        reg.phone = resolvedPhone;
        onSuccessRegistration(reg, order, currentFee);
      } else {
        throw new Error(res.message || 'Registration failed to initialize.');
      }
    } catch (err) {
      console.error('Tournament registration error:', err);
      const msg = err.message || '';
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('token')) {
        setErrorMsg('Your session has expired or the token is invalid. Please sign in again with OTP.');
        setTimeout(() => onRequireAuth(), 1200);
      } else {
        setErrorMsg(msg || 'Unable to submit registration. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="details-view" style={{ maxWidth: '800px', margin: '30px auto' }}>
      <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px 16px', fontSize: '13px', marginBottom: '24px' }}>
        ← Back to Details
      </button>

      <div className="eyebrow">REGISTRATION STEP</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', marginBottom: '8px' }}>
        {tournament.title}
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '30px' }}>
        Select your category and confirm your participant details to secure your spot.
      </p>

      {errorMsg && <div className="form-message error" style={{ marginBottom: '20px' }}>{errorMsg}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
        {/* Category Selection with Backend Fees */}
        <div>
          <label style={{ fontSize: '14px', fontWeight: '700', display: 'block', marginBottom: '10px' }}>
            Choose Category *
          </label>
          <div className="category-selection-grid">
            {categories.length > 0 ? (
              categories.map((cat, idx) => {
                const name = typeof cat === 'string' ? cat : (cat.name || `Category ${idx + 1}`);
                const fee = typeof cat === 'object' && typeof cat.fee === 'number' ? cat.fee : (tournament.registrationFee || 500);
                const isSelected = selectedCategory === name;

                return (
                  <div
                    key={cat._id || idx}
                    className={`category-radio-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(name)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{name}</strong>
                      <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--ink)' }}>₹{fee}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                className="category-radio-card selected"
                onClick={() => setSelectedCategory('Open Championship')}
              >
                <strong>Open Championship</strong>
                <span style={{ fontSize: '15px', fontWeight: 'bold' }}>₹{tournament.registrationFee || 500}</span>
              </div>
            )}
          </div>
        </div>

        {/* Primary Participant Information (Passed to Admin Portal & Match Draw) */}
        <div style={{ background: '#fff', padding: '22px', borderRadius: '14px', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', margin: 0 }}>
              Primary Participant Details
            </h4>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#4b6e15', background: '#edf7d9', padding: '3px 8px', borderRadius: '4px' }}>
              ✓ Displays on Admin Portal & Match Draws
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                required
                type="text"
                placeholder="Participant's Full Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                Mobile Number *
              </label>
              <input
                required
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={playerPhone}
                onChange={(e) => setPlayerPhone(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
              Email Address (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g. athlete@example.com"
              value={playerEmail}
              onChange={(e) => setPlayerEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}
            />
          </div>
        </div>

        {/* Pair Details */}
        {isPairCategory && (
          <div style={{ background: 'var(--soft)', padding: '20px', borderRadius: '14px', border: '1px solid var(--line)' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '14px' }}>
              Partner Details (Doubles / Mixed)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Partner Full Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Partner's Full Name"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Partner Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={partnerPhone}
                  onChange={(e) => setPartnerPhone(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Team Details */}
        {isTeamCategory && (
          <div style={{ background: 'var(--soft)', padding: '20px', borderRadius: '14px', border: '1px solid var(--line)' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '14px' }}>
              Team Information
            </h4>
            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
              Team Name *
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Hyderabad Strikers"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '16px' }}
            />

            <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '10px' }}>
              Roster / Team Members
            </label>
            {teamMembers.map((member, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder={`Player ${idx + 1} Name`}
                  value={member.name}
                  onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }}
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={member.phone}
                  onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                  style={{ width: '150px', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }}
                />
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTeamMember(idx)}
                    style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', padding: '0 8px' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddTeamMember}
              style={{ padding: '6px 14px', fontSize: '12px', marginTop: '6px' }}
            >
              + Add Player
            </button>
          </div>
        )}

        {/* Summary & Price */}
        <div style={{
          background: 'var(--soft)',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid var(--line)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>Selected Category</span>
            <strong>{selectedCategory}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>Total Fee</span>
            <strong style={{ fontSize: '22px', color: 'var(--ink)' }}>₹{currentFee}</strong>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
          style={{ width: '100%', padding: '16px', fontSize: '16px' }}
        >
          {isSubmitting ? 'Processing Registration...' : `Pay ₹${currentFee} & Confirm Slot →`}
        </button>
      </form>
    </div>
  );
}
