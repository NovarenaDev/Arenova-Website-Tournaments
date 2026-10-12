import React, { useState, useEffect } from 'react';
import defaultLogo from '../assets/logo.png';
import { getArenovaLogo } from '../utils/secureAsset';

export default function Footer({ onNavigate, onOpenLegal }) {
  const [logoSrc, setLogoSrc] = useState(defaultLogo);

  useEffect(() => {
    try {
      const secureLogo = getArenovaLogo();
      if (secureLogo) {
        setLogoSrc(secureLogo);
      }
    } catch {
      // Keep default
    }
  }, []);

  const handleLink = (e, path, pageName) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path || pageName);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLegalLink = (e, path, docType) => {
    e.preventDefault();
    if (onOpenLegal) {
      onOpenLegal(docType, path);
    } else if (onNavigate) {
      onNavigate(path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer" style={{ borderTop: '1px solid var(--line)', background: '#ffffff', color: 'var(--ink)' }}>
      <div className="container footer-grid" style={{ paddingTop: '50px', paddingBottom: '40px' }}>
        <div>
          <a
            href="/"
            onClick={(e) => handleLink(e, '/', 'home')}
            className="brand footer-brand"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '14px' }}
          >
            {logoSrc ? (
              <img src={logoSrc} alt="Arenova" style={{ height: '36px', objectFit: 'contain' }} />
            ) : (
              <>
                <span className="brand-mark">A</span>
                <span style={{ fontWeight: '800', letterSpacing: '0.05em', color: 'var(--ink)' }}>ARENOVA</span>
              </>
            )}
          </a>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 16px', maxWidth: '320px' }}>
            Arenova is a high-performance sports technology platform operated by <strong>Novarena Technologies LLP</strong>.
          </p>
          <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6' }}>
            <div><strong>Support:</strong> <a href="mailto:support@novarena.in" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>support@novarena.in</a></div>
            <div><strong>Phone:</strong> <a href="tel:+917793934108" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>+91 7793934108</a></div>
            <div style={{ marginTop: '4px' }}><strong>Hours:</strong> Mon – Sat: 9:00 AM – 7:00 PM IST</div>
          </div>
        </div>

        <div>
          <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginBottom: '16px' }}>Platform</h4>
          <a href="/tournaments" onClick={(e) => handleLink(e, '/tournaments', 'tournaments')}>Tournaments</a>
          <a href="/venues" onClick={(e) => handleLink(e, '/venues', 'venues')}>Venues & Courts</a>
          <a href="/solutions" onClick={(e) => handleLink(e, '/solutions', 'solutions')}>Solutions</a>
        </div>

        <div>
          <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginBottom: '16px' }}>Company</h4>
          <a href="/about" onClick={(e) => handleLink(e, '/about', 'about')}>About Us</a>
          <a href="/contact" onClick={(e) => handleLink(e, '/contact', 'contact')}>Contact Us</a>
        </div>

        <div>
          <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginBottom: '16px' }}>Legal & Policies</h4>
          <a href="/terms-and-conditions" onClick={(e) => handleLegalLink(e, '/terms-and-conditions', 'terms')}>
            Terms & Conditions
          </a>
          <a href="/privacy-policy" onClick={(e) => handleLegalLink(e, '/privacy-policy', 'privacy')}>
            Privacy Policy
          </a>
          <a href="/refund-cancellation-policy" onClick={(e) => handleLegalLink(e, '/refund-cancellation-policy', 'refund')}>
            Refund & Cancellation Policy
          </a>
          <a href="/contact" onClick={(e) => handleLink(e, '/contact', 'contact')}>
            Grievance Redressal
          </a>
        </div>
      </div>

      <div className="container footer-bottom" style={{ borderTop: '1px solid var(--line)', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: 'var(--muted)' }}>
        <span>© 2026 Novarena Technologies LLP. All rights reserved.</span>
        <span>Registered Entity: Novarena Technologies LLP • Hyderabad, Telangana, India</span>
      </div>
    </footer>
  );
}
