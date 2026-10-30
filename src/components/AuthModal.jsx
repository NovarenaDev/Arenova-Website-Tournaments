import React, { useState, useEffect } from 'react';
import { api, getStoredAuth } from '../utils/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState('login');
  // Method: 'phone' | 'email'
  const [authMethod, setAuthMethod] = useState('phone');
  // Step: 'credentials' | 'otp'
  const [authStep, setAuthStep] = useState('credentials');

  // Form Fields
  const [role, setRole] = useState('player'); // 'player' | 'parent'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Reset state when modal is opened or closed
  useEffect(() => {
    if (isOpen) {
      setAuthStep('credentials');
      setErrorMsg('');
      setSuccessMsg('');
      setOtp('');
      setLoading(false);
    }
  }, [isOpen]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  if (!isOpen) return null;

  // Helper to format phone to string (e.g. 10 digits "9000000001")
  const formatPhoneNumber = (raw) => {
    if (!raw) return '';
    const digits = raw.trim().replace(/\D/g, '');
    if (digits.length === 10) return digits;
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (raw.startsWith('+')) return raw.trim();
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  const handleModeSwitch = (newMode) => {
    setAuthMode(newMode);
    setAuthStep('credentials');
    setErrorMsg('');
    setSuccessMsg('');
    setOtp('');
  };

  const handleMethodSwitch = (newMethod) => {
    setAuthMethod(newMethod);
    setAuthStep('credentials');
    setErrorMsg('');
    setSuccessMsg('');
    setOtp('');
  };

  // Step 1: Submit Initial Form (Login or Register Step 1)
  const handleSubmitInitial = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // --- REGISTRATION FLOW ---
    if (authMode === 'register') {
      if (!firstName.trim() || !lastName.trim()) {
        setErrorMsg('Please enter your First Name and Last Name.');
        return;
      }

      if (authMethod === 'email') {
        if (!email.trim() || !email.includes('@')) {
          setErrorMsg('Please enter a valid email address.');
          return;
        }
        if (!password || password.length < 6) {
          setErrorMsg('Password must be at least 6 characters.');
          return;
        }
        const cleanPhone = phone.trim().replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          setErrorMsg('Please enter a valid 10-digit mobile number.');
          return;
        }

        setLoading(true);
        try {
          const formattedPhone = formatPhoneNumber(phone);
          const res = await api.registerEmail({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role,
            phone: formattedPhone,
            email: email.trim(),
            password
          });
          setSuccessMsg(res?.message || 'Verification code sent to your email.');
          setAuthStep('otp');
          setResendTimer(30);
        } catch (err) {
          if (err.message?.includes('emailService') || err.message?.includes('sendEmail')) {
            setErrorMsg('Server notice: Email sending is currently disabled on the server. Please switch to "Mobile OTP" to register and create your account instantly.');
          } else {
            setErrorMsg(err.message || 'Registration failed. Please check your details.');
          }
        } finally {
          setLoading(false);
        }
      } else {
        // Phone Registration: Step 1 (Send OTP with purpose: "register")
        const cleanPhone = phone.trim().replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          setErrorMsg('Please enter a valid 10-digit mobile number.');
          return;
        }

        setLoading(true);
        try {
          const formattedPhone = formatPhoneNumber(phone);
          const res = await api.sendPhoneOtp({
            phone: formattedPhone,
            purpose: 'register'
          });
          if (res && res.success !== false) {
            setSuccessMsg(res?.message || 'Verification code sent via SMS.');
            setAuthStep('otp');
            setResendTimer(30);
          } else {
            setErrorMsg(res?.message || 'Failed to send OTP.');
          }
        } catch (err) {
          // Backend returns 409 if number is already registered
          setErrorMsg(err.message || 'Failed to send OTP. This number may already be registered.');
        } finally {
          setLoading(false);
        }
      }
    }

    // --- LOGIN FLOW ---
    if (authMode === 'login') {
      if (authMethod === 'email') {
        if (!email.trim() || !email.includes('@')) {
          setErrorMsg('Please enter a valid email address.');
          return;
        }
        if (!password) {
          setErrorMsg('Please enter your password.');
          return;
        }

        setLoading(true);
        try {
          await api.loginEmail(email.trim(), password);
          const authData = getStoredAuth();
          onAuthSuccess(authData);
          onClose();
        } catch (err) {
          setErrorMsg(err.message || 'Invalid credentials. Please check email and password.');
        } finally {
          setLoading(false);
        }
      } else {
        // Phone Login: Step 1 (Send OTP with purpose: "login")
        const cleanPhone = phone.trim().replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          setErrorMsg('Please enter a valid 10-digit mobile number.');
          return;
        }

        setLoading(true);
        try {
          const formattedPhone = formatPhoneNumber(phone);
          const res = await api.sendPhoneOtp({
            phone: formattedPhone,
            purpose: 'login'
          });
          if (res && res.success !== false) {
            setSuccessMsg(res?.message || 'Verification code sent via SMS.');
            setAuthStep('otp');
            setResendTimer(30);
          } else {
            setErrorMsg(res?.message || 'Failed to send OTP.');
          }
        } catch (err) {
          // An unregistered number returns 404: show backend message and do not navigate to OTP
          setErrorMsg(err.message || 'Account not found. Please register or check your mobile number.');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  // Step 2: Submit OTP Verification
  const handleSubmitOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (cleanOtp.length < 4) {
      setErrorMsg('Please enter the verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (authMode === 'register') {
        if (authMethod === 'email') {
          // Verify Email OTP
          await api.verifyEmailOtp(email.trim(), cleanOtp);
        } else {
          // Verify Phone OTP with registration profile payload and purpose: "register"
          const formattedPhone = formatPhoneNumber(phone);
          await api.verifyPhoneOtp({
            phone: formattedPhone,
            otp: cleanOtp,
            purpose: 'register',
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role
          });
        }
      } else {
        // Login via Phone: verify phone OTP with purpose: "login"
        const formattedPhone = formatPhoneNumber(phone);
        await api.verifyPhoneOtp({
          phone: formattedPhone,
          otp: cleanOtp,
          purpose: 'login'
        });
      }

      const authData = getStoredAuth();
      onAuthSuccess(authData);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (authMethod === 'email') {
        const formattedPhone = formatPhoneNumber(phone);
        await api.registerEmail({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role,
          phone: formattedPhone,
          email: email.trim(),
          password
        });
        setSuccessMsg('A new verification code has been sent to your email.');
      } else {
        const formattedPhone = formatPhoneNumber(phone);
        const currentPurpose = authMode === 'register' ? 'register' : 'login';
        const res = await api.sendPhoneOtp({
          phone: formattedPhone,
          purpose: currentPurpose
        });
        setSuccessMsg(res?.message || 'A new verification code has been sent to your phone.');
      }
      setResendTimer(30);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(16, 17, 20, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '490px',
          width: '100%',
          padding: '36px',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* Header / Brand */}
        <div style={{ marginBottom: '22px' }}>
          <div className="eyebrow" style={{ display: 'inline-block', marginBottom: '8px' }}>
            ARENOVA IDENTITY
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '26px',
              margin: '0 0 6px',
              color: 'var(--ink)'
            }}
          >
            {authStep === 'otp'
              ? 'Enter Verification Code'
              : authMode === 'register'
              ? 'Create Athlete Profile'
              : 'Sign In to Arenova'}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
            {authStep === 'otp'
              ? authMethod === 'email'
                ? `Enter the 6-digit code sent to ${email}`
                : `Enter the 6-digit code sent to ${phone}`
              : authMode === 'register'
              ? 'Register as a Player or Parent for tournament registrations & bookings.'
              : 'Access your tournament passes, bookings, and dashboard.'}
          </p>
        </div>

        {/* Global Error & Success Alerts */}
        {errorMsg && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#b91c1c',
              padding: '11px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '16px',
              lineHeight: '1.4'
            }}
          >
            <div>{errorMsg}</div>
            {errorMsg.includes('Mobile OTP') && (
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setErrorMsg('');
                }}
                className="btn btn-primary"
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  borderRadius: '7px'
                }}
              >
                Switch to Mobile OTP Registration →
              </button>
            )}
          </div>
        )}
        {successMsg && (
          <div
            style={{
              background: '#eef2e7',
              border: '1px solid #cce2b8',
              color: '#3b5a10',
              padding: '11px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '16px',
              lineHeight: '1.4'
            }}
          >
            {successMsg}
          </div>
        )}

        {/* STEP 1: CREDENTIALS (LOGIN / REGISTER) */}
        {authStep === 'credentials' && (
          <div>
            {/* Mode Switch (Sign In vs Register) Tabs */}
            <div
              style={{
                display: 'flex',
                background: 'var(--soft)',
                borderRadius: '12px',
                padding: '4px',
                marginBottom: '16px',
                border: '1px solid var(--line)',
                gap: '4px'
              }}
            >
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: authMode === 'login' ? '#ffffff' : 'transparent',
                  color: authMode === 'login' ? 'var(--ink)' : 'var(--muted)',
                  boxShadow: authMode === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('register')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: authMode === 'register' ? '#ffffff' : 'transparent',
                  color: authMode === 'register' ? 'var(--ink)' : 'var(--muted)',
                  boxShadow: authMode === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                Create Account
              </button>
            </div>

            {/* Method Switch (Phone vs Email) */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '18px'
              }}
            >
              <button
                type="button"
                onClick={() => handleMethodSwitch('phone')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '9px',
                  border: authMethod === 'phone' ? '1.5px solid var(--ink)' : '1px solid var(--line)',
                  background: authMethod === 'phone' ? 'var(--soft)' : '#ffffff',
                  color: authMethod === 'phone' ? 'var(--ink)' : 'var(--muted)',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                📱 Mobile OTP
              </button>
              <button
                type="button"
                onClick={() => handleMethodSwitch('email')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '9px',
                  border: authMethod === 'email' ? '1.5px solid var(--ink)' : '1px solid var(--line)',
                  background: authMethod === 'email' ? 'var(--soft)' : '#ffffff',
                  color: authMethod === 'email' ? 'var(--ink)' : 'var(--muted)',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                ✉️ Email Address
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmitInitial} style={{ display: 'grid', gap: '14px' }}>
              {/* Registration Upfront Profile Fields */}
              {authMode === 'register' && (
                <>
                  {/* Role Selector: Player vs Parent */}
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                      Registering As:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setRole('player')}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: role === 'player' ? '2px solid var(--ink)' : '1px solid var(--line)',
                          background: role === 'player' ? 'var(--soft)' : '#ffffff',
                          color: 'var(--ink)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          ⚡ Player
                          {role === 'player' && (
                            <span
                              style={{
                                background: 'var(--accent)',
                                color: 'var(--ink)',
                                fontSize: '10px',
                                fontWeight: '800',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              Selected
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px' }}>
                          Compete & Book
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('parent')}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: role === 'parent' ? '2px solid var(--ink)' : '1px solid var(--line)',
                          background: role === 'parent' ? 'var(--soft)' : '#ffffff',
                          color: 'var(--ink)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          👨‍👧 Parent
                          {role === 'parent' && (
                            <span
                              style={{
                                background: 'var(--accent)',
                                color: 'var(--ink)',
                                fontSize: '10px',
                                fontWeight: '800',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              Selected
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px' }}>
                          For Child Athlete
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Name Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Rahul"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          borderRadius: '9px',
                          background: 'var(--soft)',
                          border: '1px solid var(--line)',
                          color: 'var(--ink)',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Sharma"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          borderRadius: '9px',
                          background: 'var(--soft)',
                          border: '1px solid var(--line)',
                          color: 'var(--ink)',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* PHONE INPUT (Used in Phone Login, Phone Register, and Email Register) */}
              {(authMethod === 'phone' || (authMode === 'register' && authMethod === 'email')) && (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                    Mobile Number *
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span
                      style={{
                        padding: '11px 14px',
                        background: 'var(--soft)',
                        border: '1px solid var(--line)',
                        borderRadius: '9px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: 'var(--muted)'
                      }}
                    >
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '11px 12px',
                        borderRadius: '9px',
                        background: 'var(--soft)',
                        border: '1px solid var(--line)',
                        color: 'var(--ink)',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* EMAIL & PASSWORD INPUTS */}
              {authMethod === 'email' && (
                <>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 12px',
                        borderRadius: '9px',
                        background: 'var(--soft)',
                        border: '1px solid var(--line)',
                        color: 'var(--ink)',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 12px',
                        borderRadius: '9px',
                        background: 'var(--soft)',
                        border: '1px solid var(--line)',
                        color: 'var(--ink)',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: '700',
                  marginTop: '6px'
                }}
              >
                {loading
                  ? 'Processing...'
                  : authMode === 'register'
                  ? authMethod === 'email'
                    ? 'Create Account & Send Email OTP →'
                    : 'Send Verification Code (SMS) →'
                  : authMethod === 'email'
                  ? 'Sign In →'
                  : 'Send Login OTP →'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {authStep === 'otp' && (
          <form onSubmit={handleSubmitOtp} style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                6-Digit Verification Code *
              </label>
              <input
                type="text"
                required
                autoFocus
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'var(--soft)',
                  border: '2px solid var(--ink)',
                  color: 'var(--ink)',
                  fontSize: '22px',
                  letterSpacing: '6px',
                  textAlign: 'center',
                  fontWeight: '800',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '14px',
                fontWeight: '700'
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Continue →'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setAuthStep('credentials')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                ← Back / Change {authMethod === 'email' ? 'Email' : 'Number'}
              </button>

              <button
                type="button"
                disabled={resendTimer > 0 || loading}
                onClick={handleResendOtp}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: resendTimer > 0 ? 'var(--muted)' : 'var(--ink)',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: resendTimer > 0 ? 'default' : 'pointer'
                }}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
