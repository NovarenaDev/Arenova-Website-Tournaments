import React, { useState, useEffect } from 'react';
import { auth, isFirebaseConfigured, RecaptchaVerifier, signInWithPhoneNumber } from '../utils/firebase';
import { signInWithToken, completeUserProfile } from '../utils/auth';
import { getStoredAuth, setStoredAuth } from '../utils/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [authStep, setAuthStep] = useState('phone'); // 'phone', 'otp', 'complete'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [activeToken, setActiveToken] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Reset modal state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setAuthStep('phone');
      setPhoneNumber('');
      setOtpCode('');
      setAuthError('');
      setAuthLoading(false);
    }
  }, [isOpen]);

  // Recaptcha Verifier initialization for Firebase Phone Auth
  useEffect(() => {
    if (isFirebaseConfigured && isOpen && authStep === 'phone' && auth) {
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
  }, [isOpen, authStep]);

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
          email: profileForm.email.trim() || authData.user?.email || '',
          phone: authData.user?.phone || `+91${phoneNumber.slice(-10)}`
        };
        setStoredAuth(authData.token, authData.refreshToken, updatedUser);
        onAuthSuccess({ ...authData, user: updatedUser });
      } else {
        onAuthSuccess(authData);
      }
      onClose();
    } else {
      setAuthStep('phone');
    }
  };

  // Step 1: Send SMS OTP via Firebase
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

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
      // This creates or finds the user in MongoDB and issues the real JWT token
      const result = await signInWithToken(idToken);
      const authData = getStoredAuth();

      console.log('Backend sync result:', result);

      // 3. Only require profile completion if user is brand new AND has no name in database
      const isExistingUser = !result?.isNewUser || result?.data?.firstName || result?.user?.firstName;

      if (!isExistingUser) {
        setAuthStep('complete');
      } else {
        // Existing user in MongoDB with verified profile -> log in directly!
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
        profileForm.email.trim()
      );

      const authData = getStoredAuth();
      onAuthSuccess(authData);
      onClose();
    } catch (err) {
      console.warn('Complete profile notice:', err);
      const errorMsg = err.message || '';

      // If phone/email is already in use in MongoDB, the account already exists and is authenticated
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

        {/* Step 1: Phone Input */}
        {authStep === 'phone' && (
          <div>
            <div className="eyebrow">ATHLETE SIGN IN</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', marginBottom: '8px' }}>
              Welcome to Arenova
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '22px' }}>
              Enter your mobile number to receive a secure SMS verification code.
            </p>

            {authError && <div className="form-message error" style={{ marginBottom: '16px' }}>{authError}</div>}

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
                onClick={() => setAuthStep('phone')}
                style={{ textAlign: 'center', justifyContent: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}
              >
                ← Change Mobile Number
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
                Continue With Verified Mobile (+91 {phoneNumber.slice(-10)}) →
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
