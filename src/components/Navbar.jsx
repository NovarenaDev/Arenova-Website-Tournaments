import React, { useState, useEffect } from 'react';
import defaultLogo from '../assets/logo.png';
import { getArenovaLogo } from '../utils/secureAsset';

export default function Navbar({
  activePage,
  setActivePage,
  authObj,
  onOpenAuth,
  onOpenDashboard,
  onSignOut,
  onOpenDownloadModal
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState(defaultLogo);

  useEffect(() => {
    try {
      const secureLogo = getArenovaLogo();
      if (secureLogo) {
        setLogoSrc(secureLogo);
      }
    } catch (e) {
      console.warn('Using default logo asset', e);
    }
  }, []);

  const handleNavClick = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const userName = authObj?.user?.firstName || (authObj?.user?.phone ? authObj.user.phone.slice(-4) : null);

  return (
    <header className="site-header">
      <div className="container nav">
        <div className="brand" onClick={() => handleNavClick('home')}>
          {logoSrc ? (
            <img src={logoSrc} alt="Arenova" className="brand-logo-img" />
          ) : (
            <>
              <span className="brand-mark">A</span>
              <span>ARENOVA</span>
            </>
          )}
        </div>

        <button
          className="menu-toggle"
          aria-label="Toggle navigation menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <button
            className={`nav-link ${activePage === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            Home
          </button>
          <button
            className={`nav-link ${activePage === 'about' ? 'active' : ''}`}
            onClick={() => handleNavClick('about')}
          >
            About
          </button>
          <button
            className={`nav-link ${activePage === 'solutions' ? 'active' : ''}`}
            onClick={() => handleNavClick('solutions')}
          >
            Solutions
          </button>
          <button
            className={`nav-link ${activePage === 'tournaments' ? 'active' : ''}`}
            onClick={() => handleNavClick('tournaments')}
          >
            Tournaments
          </button>
          <button
            className={`nav-link ${activePage === 'venues' ? 'active' : ''}`}
            onClick={() => handleNavClick('venues')}
          >
            Venues
          </button>
          <button
            className={`nav-link ${activePage === 'contact' ? 'active' : ''}`}
            onClick={() => handleNavClick('contact')}
          >
            Contact
          </button>

          <div className="nav-actions">
            {/* Download App Action */}
            <button
              className="nav-cta-secondary"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenDownloadModal) onOpenDownloadModal();
              }}
              title="Download Arenova Mobile App"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '700',
                background: 'rgba(184, 255, 61, 0.15)',
                borderColor: 'rgba(184, 255, 61, 0.4)',
                marginRight: '10px'
              }}
            >
              📲 App
            </button>

            {authObj?.token ? (
              <>
                <button
                  className="nav-cta-secondary"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDashboard();
                  }}
                  title="View my registrations & profile"
                >
                  👤 {userName ? `Hi, ${userName}` : 'Dashboard'}
                </button>
                <button
                  className="nav-cta"
                  style={{ background: '#222' }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignOut();
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  className="nav-cta-secondary"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                >
                  Sign In
                </button>
                <button
                  className="nav-cta"
                  onClick={() => handleNavClick('tournaments')}
                >
                  Get Started →
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
