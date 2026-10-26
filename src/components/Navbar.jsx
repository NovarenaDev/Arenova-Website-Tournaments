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
      // Fallback to default bundled logo
    }
  }, []);

  const handleNavClick = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const userName = authObj?.user?.firstName || authObj?.user?.name || (authObj?.user?.phone ? authObj.user.phone.slice(-4) : null);
  const userRole = authObj?.user?.role;

  return (
    <header className="site-header">
      <div className="container nav">
        <a
          href="/"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home');
          }}
          title="Arenova - Sports Technology Platform"
        >
          {logoSrc ? (
            <img src={logoSrc} alt="Arenova" className="brand-logo-img" />
          ) : (
            <>
              <span className="brand-mark">A</span>
              <span>ARENOVA</span>
            </>
          )}
        </a>

        <button
          className="menu-toggle"
          aria-label="Toggle navigation menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <a
            href="/"
            className={`nav-link ${activePage === 'home' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('home');
            }}
          >
            Home
          </a>
          <a
            href="/about"
            className={`nav-link ${activePage === 'about' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('about');
            }}
          >
            About
          </a>
          <a
            href="/solutions"
            className={`nav-link ${activePage === 'solutions' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('solutions');
            }}
          >
            Solutions
          </a>
          <a
            href="/tournaments"
            className={`nav-link ${activePage === 'tournaments' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('tournaments');
            }}
          >
            Tournaments
          </a>
          <a
            href="/venues"
            className={`nav-link ${activePage === 'venues' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('venues');
            }}
          >
            Venues
          </a>
          <a
            href="/contact"
            className={`nav-link ${activePage === 'contact' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('contact');
            }}
          >
            Contact
          </a>

          <div className="nav-actions">
            {authObj?.token ? (
              <>
                <button
                  className={`nav-cta-secondary ${activePage === 'dashboard' ? 'active' : ''}`}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDashboard();
                  }}
                  title={userName ? `Logged in as ${userName} • Athlete Dashboard` : 'View Athlete Dashboard'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '700',
                    ...(activePage === 'dashboard'
                      ? {
                          borderColor: 'var(--accent)',
                          background: 'rgba(184, 255, 61, 0.15)',
                          color: 'var(--ink)'
                        }
                      : {})
                  }}
                >
                  <span style={{ fontSize: '15px' }}>👤</span>
                  <span>Dashboard</span>
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
                    borderColor: 'rgba(184, 255, 61, 0.4)'
                  }}
                >
                  📲 App
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
                  Login
                </button>

                <button
                  className="nav-cta"
                  onClick={() => handleNavClick('tournaments')}
                >
                  Get Started →
                </button>

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
                    borderColor: 'rgba(184, 255, 61, 0.4)'
                  }}
                >
                  📲 App
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
