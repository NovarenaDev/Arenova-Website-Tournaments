import React, { useState, useEffect } from 'react';
import {
  auth,
  isFirebaseConfigured,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from '../utils/firebase';
import { signInWithToken, completeUserProfile } from '../utils/auth';
import { getStoredAuth, setStoredAuth } from '../utils/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [authStep, setAuthStep] = useState('login'); // 'login', 'otp', 'complete'
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'email'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailMode, setEmailMode] = useState('signin'); // 'signin' or 'signup'

  const [activeToken, setActiveToken] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset modal state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setAuthStep('login');
      setLoginMethod('phone');
      setEmailMode('signin');
      setPhoneNumber('');
      setOtpCode('');
      setEmail('');
      setPassword('');
      setAuthError('');
      setSuccessMsg('');
      setAuthLoading(false);
    }
  }, [isOpen]);

  // Recaptcha Verifier initialization for Firebase Phone Auth
  useEffect(() => {
    if (isFirebaseConfigured && isOpen && authStep === 'login' && loginMethod === 'phone' && auth) {
      const timer = setTimeout(() => {
        try {
          if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              size: 'invisible',
              callback: () => {}
            });
          }
        } catch (e) {
          console.error('Recaptcha initialization error:', e);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch {}
      }
    };
  }, [isOpen, authStep, loginMethod]);

  if (!isOpen) return null;

  // Direct continue with verified mobile session
  const handleProceedWithVerifiedSession = () => {
    const authData = getStoredAuth();
    if (authData?.token) {
      if (profileForm.firstName.trim()) {
        const updatedUser = {
          ...(authData.user || {}),
          firstName: profileForm.firstName.trim(),
          lastName: profileForm.lastName.trim() || authData.user?.lastName || '',
          email: profileForm.email.trim() || authData.user?.email || email.trim() || '',
          phone: authData.user?.phone || (phoneNumber ? `+91${phoneNumber.slice(-10)}` : '')
        };
        setStoredAuth(authData.token, authData.refreshToken, updatedUser);
        onAuthSuccess({ ...authData, user: updatedUser });
      } else {
        onAuthSuccess(authData);
      }
      onClose();
    } else {
      setAuthStep('login');
    }
  };

  // Step 1A: Send SMS OTP via Firebase
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    setSuccessMsg('');

    try {
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.slice(-10)}`;
      const verifier = window.recaptchaVerifier;
      if (!verifier) {
        throw new Error('reCAPTCHA verification not ready. Please close and reopen the sign-in modal.');
      }
      // Send real SMS code using Firebase Phone Auth
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      setAuthStep('otp');
    } catch (err) {
      console.error('Firebase send OTP error:', err);
      setAuthError(err.message || 'Failed to send OTP code. Please verify your phone number.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 1B: Email Authentication via Firebase
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    setSuccessMsg('');

    try {
      let userCredential;
      if (emailMode === 'signin') {
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      }

      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();
      setActiveToken(idToken);

      // Sync with Backend API (/api/novare/auth/sync)
      const result = await signInWithToken(idToken);
      const authData = getStoredAuth();

      console.log('Email backend sync result:', result);

      const isExistingUser = !result?.isNewUser || result?.data?.firstName || result?.user?.firstName;

      if (!isExistingUser) {
        setProfileForm({
          firstName: result?.user?.firstName || result?.data?.firstName || '',
          lastName: result?.user?.lastName || result?.data?.lastName || '',
          email: cleanEmail
        });
        setAuthStep('complete');
      } else {
        onAuthSuccess(authData);
        onClose();
      }
    } catch (err) {
      console.error('Email auth error:', err);
      let errorText = err.message || 'Authentication failed.';

      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errorText = 'Invalid email or password. Please verify your credentials or click Create Account.';
      } else if (err.code === 'auth/wrong-password') {
        errorText = 'Incorrect password. Please check your password or click Forgot Password.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorText = 'An account with this email already exists. Please switch to Sign In.';
      } else if (err.code === 'auth/invalid-email') {
        errorText = 'Invalid email address format.';
      } else if (err.code === 'auth/weak-password') {
        errorText = 'Password is too weak. Please use at least 6 characters.';
      }

      setAuthError(errorText);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter your email address above to receive reset instructions.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    setSuccessMsg('');

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccessMsg(`Password reset instructions sent to ${cleanEmail}.`);
    } catch (err) {
      console.error('Password reset error:', err);
      setAuthError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 2: Verify OTP & Sync with Backend API
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setAuthError('Please enter the 6-digit verification code received on your phone.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      if (!confirmationResult) {
        throw new Error('No active verification session. Please request a new OTP code.');
      }

      // 1. Verify OTP with Firebase
      const verifyRes = await confirmationResult.confirm(otpCode.trim());
      const user = verifyRes.user;
      const idToken = await user.getIdToken();
      setActiveToken(idToken);

      // 2. Sync with Backend API (/api/novare/auth/sync)
      const result = await signInWithToken(idToken);
      const authData = getStoredAuth();

      console.log('Backend sync result:', result);

      // 3. Require profile completion if user is brand new AND has no name in database
      const isExistingUser = !result?.isNewUser || result?.data?.firstName || result?.user?.firstName;

      if (!isExistingUser) {
        setAuthStep('complete');
      } else {
        onAuthSuccess(authData);
        onClose();
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setAuthError(err.message || 'Invalid verification code. Please check and re-enter.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 3: Complete Profile for new users
  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.firstName.trim()) {
      setAuthError('Please enter your first name.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      // 1. Submit real user profile to backend (/api/novare/auth/complete-profile)
      await completeUserProfile(
        activeToken,
        profileForm.firstName.trim(),
        profileForm.lastName.trim(),
        profileForm.email.trim() || email.trim()
      );

      const authData = getStoredAuth();
      onAuthSuccess(authData);
      onClose();
    } catch (err) {
      console.warn('Complete profile notice:', err);
      const errorMsg = err.message || '';

      if (
        errorMsg.toLowerCase().includes('already in use') ||
        errorMsg.toLowerCase().includes('duplicate') ||
        errorMsg.toLowerCase().includes('exists')
      ) {
        handleProceedWithVerifiedSession();
      } else {
        setAuthError(errorMsg || 'Failed to complete profile. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        {/* Firebase Recaptcha Container */}
        <div id="recaptcha-container"></div>

        {/* Step 1: Sign In Options (Phone or Email) */}
        {authStep === 'login' && (
          <div>
            <div className="eyebrow">ATHLETE SIGN IN</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', marginBottom: '8px' }}>
              Welcome to Arenova
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '18px' }}>
              Choose your preferred sign-in method to continue.
            </p>

            {/* Login Method Tabs */}
            <div style={{
              display: 'flex',
              background: '#f4f5f6',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '1px solid #dfe1e5',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => { setLoginMethod('phone'); setAuthError(''); setSuccessMsg(''); }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  background: loginMethod === 'phone' ? '#fff' : 'transparent',
                  color: loginMethod === 'phone' ? 'var(--ink)' : 'var(--muted)',
                  boxShadow: loginMethod === 'phone' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                📱 Mobile OTP
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod('email'); setAuthError(''); setSuccessMsg(''); }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  background: loginMethod === 'email' ? '#fff' : 'transparent',
                  color: loginMethod === 'email' ? 'var(--ink)' : 'var(--muted)',
                  boxShadow: loginMethod === 'email' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                ✉️ Email Address
              </button>
            </div>

            {authError && <div className="form-message error" style={{ marginBottom: '16px' }}>{authError}</div>}
            {successMsg && <div className="form-message success" style={{ marginBottom: '16px' }}>{successMsg}</div>}

            {/* Option A: Mobile Number Form */}
            {loginMethod === 'phone' ? (
              <form onSubmit={handleSendOtp} style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Mobile Number *
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                      padding: '12px 14px',
                      background: '#f4f5f6',
                      border: '1px solid #dfe1e5',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#555'
                    }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      autoFocus
                      placeholder="Enter 10-digit mobile number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid #dfe1e5',
                        fontSize: '15px'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={authLoading}
                  style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '6px' }}
                >
                  {authLoading ? 'Sending SMS OTP...' : 'Send Verification Code (SMS) →'}
                </button>
              </form>
            ) : (
              /* Option B: Email & Password Form */
              <form onSubmit={handleEmailAuth} style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid #dfe1e5',
                      fontSize: '15px'
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700' }}>
                      Password *
                    </label>
                    {emailMode === 'signin' && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0066ff',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: 0,
                          fontWeight: '600'
                        }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid #dfe1e5',
                      fontSize: '15px'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={authLoading}
                  style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '6px' }}
                >
                  {authLoading
                    ? (emailMode === 'signin' ? 'Signing In...' : 'Creating Account...')
                    : (emailMode === 'signin' ? 'Sign In with Email →' : 'Create Account →')
                  }
                </button>

                <div style={{ textAlign: 'center', fontSize: '13px', marginTop: '4px', color: 'var(--muted)' }}>
                  {emailMode === 'signin' ? (
                    <span>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setEmailMode('signup'); setAuthError(''); setSuccessMsg(''); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0066ff',
                          fontWeight: '700',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Create Account
                      </button>
                    </span>
                  ) : (
                    <span>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setEmailMode('signin'); setAuthError(''); setSuccessMsg(''); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0066ff',
                          fontWeight: '700',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Sign In
                      </button>
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {authStep === 'otp' && (
          <div>
            <div className="eyebrow">VERIFY CODE</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', marginBottom: '8px' }}>
              Enter Verification Code
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
              We sent a 6-digit SMS code to <strong>+91 {phoneNumber.slice(-10)}</strong>.
            </p>

            {authError && <div className="form-message error" style={{ marginBottom: '16px' }}>{authError}</div>}

            <form onSubmit={handleVerifyOtp} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  6-Digit Verification Code *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid #dfe1e5',
                    fontSize: '22px',
                    textAlign: 'center',
                    letterSpacing: '8px',
                    fontWeight: 'bold'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={authLoading}
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                {authLoading ? 'Verifying OTP with Server...' : 'Verify Code & Sign In →'}
              </button>

              <button
                type="button"
                className="link-btn"
                onClick={() => setAuthStep('login')}
                style={{ textAlign: 'center', justifyContent: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}
              >
                ← Back to Sign In
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Profile Completion (Only for Brand New Users) */}
        {authStep === 'complete' && (
          <div>
            <div className="eyebrow">COMPLETE PROFILE</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', marginBottom: '8px' }}>
              Set Up Your Athlete Profile
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
              Please enter your name and email. This will be associated with your tournament entries.
            </p>

            {authError && <div className="form-message error" style={{ marginBottom: '16px' }}>{authError}</div>}

            <form onSubmit={handleCompleteProfile} style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    placeholder="First name"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #dfe1e5'
                    }}
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
                    placeholder="Last name"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #dfe1e5'
                    }}
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
                  placeholder="your.email@example.com"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #dfe1e5'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={authLoading}
                style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '6px' }}
              >
                {authLoading ? 'Saving Profile...' : 'Complete Profile & Continue →'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleProceedWithVerifiedSession}
                style={{ width: '100%', padding: '12px', fontSize: '13px', marginTop: '4px' }}
              >
                Continue With Verified Session →
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

