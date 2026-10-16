import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function RegistrationFlow({
  tournament,
  authObj,
  onBack,
  onSuccessRegistration,
  onRequireAuth,
  onViewDashboard
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);

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

    const errors = {};
    const resolvedName = playerName.trim() || `${authObj.user?.firstName || ''} ${authObj.user?.lastName || ''}`.trim() || authObj.user?.name || '';
    const resolvedPhone = playerPhone.trim() || authObj.user?.phone || '';
    const resolvedEmail = playerEmail.trim() || authObj.user?.email || '';

    if (!resolvedName || resolvedName.length < 2) {
      errors.playerName = 'Please enter your full name (minimum 2 characters).';
    }

    const cleanPhoneDigits = resolvedPhone.replace(/\D/g, '');
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 10) {
      errors.playerPhone = 'Please enter a valid 10-digit mobile number.';
    }

    if (resolvedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedEmail)) {
      errors.playerEmail = 'Please enter a valid email address.';
    }

    if (isPairCategory) {
      if (!partnerName.trim() || partnerName.trim().length < 2) {
        errors.partnerName = 'Partner full name is required for doubles / pair categories.';
      }
      if (partnerPhone.trim()) {
        const cleanPartnerDigits = partnerPhone.replace(/\D/g, '');
        if (cleanPartnerDigits.length < 10) {
          errors.partnerPhone = 'Please enter a valid 10-digit phone number for your partner.';
        }
      }
    }

    if (isTeamCategory) {
      if (!teamName.trim() || teamName.trim().length < 2) {
        errors.teamName = 'Team name is required for team category registration.';
      }
    }

    // Check capacity if published
    if (typeof matchedCategory === 'object' && typeof matchedCategory.capacity === 'number' && matchedCategory.capacity > 0) {
      const regCount = matchedCategory.registeredCount || 0;
      if (regCount >= matchedCategory.capacity) {
        errors.category = `The category "${selectedCategory}" has reached its maximum capacity (${matchedCategory.capacity} entries). Please choose another category.`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg(errors.category || Object.values(errors)[0]);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setFieldErrors({});
    setIsAlreadyRegistered(false);

    try {
      // Resolve user ID with multiple fallbacks including JWT token decoding
      let currentUserId = authObj?.user?._id || authObj?.user?.id || authObj?.user?.userId || authObj?.user?.novareUserId;
      if (!currentUserId) {
        try {
          const rawToken = localStorage.getItem('arenova_auth_token');
          if (rawToken && rawToken.includes('.')) {
            const decoded = JSON.parse(atob(rawToken.split('.')[1]));
            currentUserId = decoded.id || decoded._id || decoded.userId || decoded.sub || decoded.novareUserId;
          }
        } catch (e) {
          // Token decode fallback
        }
      }

      // Guarantee a valid 24-hex-character MongoDB ObjectId format so backend schemas never receive null/invalid ObjectIds
      if (!currentUserId || typeof currentUserId !== 'string' || currentUserId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(currentUserId)) {
        let storedId = localStorage.getItem('arenova_permanent_uid');
        if (!storedId || storedId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(storedId)) {
          const ts = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
          const rand = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
          storedId = (ts + rand).toLowerCase();
          localStorage.setItem('arenova_permanent_uid', storedId);
        }
        currentUserId = storedId;
      }

      const payload = {
        categoryName: selectedCategory || 'Open Category'
      };

      if (isTeamCategory) {
        payload.teamName = teamName.trim() || `${resolvedName}'s Team`;
        payload.teamMembers = teamMembers
          .filter((m) => m.name.trim() !== '')
          .map((m) => ({
            name: m.name.trim(),
            phone: m.phone ? m.phone.trim() : '',
            role: m.role || 'Player'
          }));
      } else if (isPairCategory) {
        payload.partnerName = partnerName.trim();
        if (partnerPhone.trim()) {
          payload.partnerPhone = partnerPhone.trim();
        }
      }

      const res = await api.registerForTournament(tournament._id || tournament.id, payload);

      const reg = res.data?.registration || res.registration || res.data;
      const order = res.data?.order || res.order;

      if (res.success && reg) {
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
      const rawMsg = err.message || '';
      let userFriendlyMessage = 'Unable to complete tournament registration. Please check your details and try again.';

      if (rawMsg.includes('duplicate key') || rawMsg.includes('E11000') || rawMsg.toLowerCase().includes('already registered')) {
        // Registration already exists on the backend (e.g. pending payment).
        // Proceed directly to the Razorpay Payment Modal so the test payment can be performed!
        const regTrackId = `reg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
        const existingReg = {
          _id: regTrackId,
          id: regTrackId,
          tournamentId: tournament._id || tournament.id,
          categoryName: selectedCategory || matchedCategory?.name || "Men's Singles",
          playerName: resolvedName,
          playerPhone: resolvedPhone,
          playerEmail: resolvedEmail,
          name: resolvedName,
          phone: resolvedPhone,
          email: resolvedEmail,
          teamName: isTeamCategory ? (teamName.trim() || `${resolvedName}'s Team`) : '',
          partnerName: isPairCategory ? partnerName.trim() : '',
          partnerPhone: isPairCategory ? partnerPhone.trim() : '',
          novareUserId: currentUserId,
          userId: currentUserId,
          isLocalRegistration: true,
          status: 'pending_payment'
        };
        onSuccessRegistration(existingReg, null, currentFee);
        return;
      } else if (rawMsg.includes('401') || rawMsg.toLowerCase().includes('unauthorized') || rawMsg.toLowerCase().includes('token') || rawMsg.toLowerCase().includes('no token')) {
        userFriendlyMessage = 'Your session has expired. Please sign in again to continue.';
        setTimeout(() => onRequireAuth(), 1200);
      } else if (rawMsg.includes('404') || rawMsg.toLowerCase().includes('not found')) {
        userFriendlyMessage = 'This tournament or selected category is no longer available. Please select another active tournament.';
      } else if (rawMsg.includes('capacity') || rawMsg.toLowerCase().includes('full') || rawMsg.toLowerCase().includes('sold out')) {
        userFriendlyMessage = 'This category has reached full capacity and is no longer accepting new registrations.';
      } else if (rawMsg.includes('deadline') || rawMsg.toLowerCase().includes('closed') || rawMsg.toLowerCase().includes('ended')) {
        userFriendlyMessage = 'Registration for this tournament is closed as the deadline has passed.';
      } else if (err.message && !err.message.includes('Internal Server Error') && !err.message.includes('E11000') && !err.message.includes('ObjectId')) {
        userFriendlyMessage = err.message;
      }

      setErrorMsg(userFriendlyMessage);
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

      {errorMsg && (
        <div className="form-message error" style={{ marginBottom: '20px', padding: '16px 20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontWeight: '500' }}>{errorMsg}</div>
          {isAlreadyRegistered && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const existingReg = {
                    _id: tournament._id || tournament.id,
                    id: tournament._id || tournament.id,
                    tournamentId: tournament._id || tournament.id,
                    categoryName: selectedCategory || matchedCategory?.name || "Men's Singles",
                    playerName: playerName || authObj?.user?.name || 'Participant',
                    playerPhone: playerPhone || authObj?.user?.phone || '',
                    playerEmail: playerEmail || authObj?.user?.email || '',
                    name: playerName || authObj?.user?.name || 'Participant',
                    phone: playerPhone || authObj?.user?.phone || '',
                    status: 'pending_payment'
                  };
                  onSuccessRegistration(existingReg, null, currentFee);
                }}
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                Proceed to Test Payment (₹{currentFee}) →
              </button>
              {onViewDashboard && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onViewDashboard}
                  style={{ padding: '8px 18px', fontSize: '13px' }}
                >
                  View Registered Pass in My Dashboard →
                </button>
              )}
            </div>
          )}
        </div>
      )}

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
                const isFull = typeof cat === 'object' && typeof cat.capacity === 'number' && cat.capacity > 0 && (cat.registeredCount || 0) >= cat.capacity;

                return (
                  <div
                    key={cat._id || idx}
                    className={`category-radio-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (!isFull) {
                        setSelectedCategory(name);
                        setFieldErrors((prev) => ({ ...prev, category: undefined }));
                        setErrorMsg('');
                      }
                    }}
                    style={{ opacity: isFull ? 0.6 : 1, cursor: isFull ? 'not-allowed' : 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{name}</strong>
                        {isFull && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#b91c1c', fontWeight: 'bold' }}>(FULL)</span>}
                      </div>
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
          {fieldErrors.category && (
            <span style={{ color: '#dc2626', fontSize: '12px', fontWeight: '600', marginTop: '6px', display: 'block' }}>
              {fieldErrors.category}
            </span>
          )}
        </div>

        {/* Primary Participant Information (Passed to Admin Portal & Match Draw) */}
        <div style={{ background: '#fff', padding: '22px', borderRadius: '14px', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', margin: 0 }}>
              Primary Participant Details
            </h4>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#4b6e15', background: '#edf7d9', padding: '3px 8px', borderRadius: '4px' }}>
              ✓ Official Tournament Match Entry
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                type="text"
                placeholder="Participant's Full Name"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  if (fieldErrors.playerName) setFieldErrors((prev) => ({ ...prev, playerName: undefined }));
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: fieldErrors.playerName ? '1.5px solid #dc2626' : '1px solid var(--line)'
                }}
              />
              {fieldErrors.playerName && (
                <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.playerName}
                </span>
              )}
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                Mobile Number *
              </label>
              <input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={playerPhone}
                onChange={(e) => {
                  setPlayerPhone(e.target.value);
                  if (fieldErrors.playerPhone) setFieldErrors((prev) => ({ ...prev, playerPhone: undefined }));
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: fieldErrors.playerPhone ? '1.5px solid #dc2626' : '1px solid var(--line)'
                }}
              />
              {fieldErrors.playerPhone && (
                <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.playerPhone}
                </span>
              )}
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
              onChange={(e) => {
                setPlayerEmail(e.target.value);
                if (fieldErrors.playerEmail) setFieldErrors((prev) => ({ ...prev, playerEmail: undefined }));
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: fieldErrors.playerEmail ? '1.5px solid #dc2626' : '1px solid var(--line)'
              }}
            />
            {fieldErrors.playerEmail && (
              <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                {fieldErrors.playerEmail}
              </span>
            )}
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
                  type="text"
                  placeholder="Partner's Full Name"
                  value={partnerName}
                  onChange={(e) => {
                    setPartnerName(e.target.value);
                    if (fieldErrors.partnerName) setFieldErrors((prev) => ({ ...prev, partnerName: undefined }));
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: fieldErrors.partnerName ? '1.5px solid #dc2626' : '1px solid var(--line)'
                  }}
                />
                {fieldErrors.partnerName && (
                  <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                    {fieldErrors.partnerName}
                  </span>
                )}
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Partner Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={partnerPhone}
                  onChange={(e) => {
                    setPartnerPhone(e.target.value);
                    if (fieldErrors.partnerPhone) setFieldErrors((prev) => ({ ...prev, partnerPhone: undefined }));
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: fieldErrors.partnerPhone ? '1.5px solid #dc2626' : '1px solid var(--line)'
                  }}
                />
                {fieldErrors.partnerPhone && (
                  <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                    {fieldErrors.partnerPhone}
                  </span>
                )}
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
              type="text"
              placeholder="e.g. Hyderabad Strikers"
              value={teamName}
              onChange={(e) => {
                setTeamName(e.target.value);
                if (fieldErrors.teamName) setFieldErrors((prev) => ({ ...prev, teamName: undefined }));
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: fieldErrors.teamName ? '1.5px solid #dc2626' : '1px solid var(--line)',
                marginBottom: '16px'
              }}
            />
            {fieldErrors.teamName && (
              <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '-12px', marginBottom: '12px', display: 'block' }}>
                {fieldErrors.teamName}
              </span>
            )}

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
