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

  const handleLink = (page) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLegal = (type) => {
    onOpenLegal(type);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand" onClick={() => handleLink('home')} style={{ cursor: 'pointer' }}>
            {logoSrc ? (
              <img src={logoSrc} alt="Arenova" style={{ height: '38px', objectFit: 'contain', filter: 'brightness(1.2)' }} />
            ) : (
              <>
                <span className="brand-mark">A</span>
                <span>ARENOVA</span>
              </>
            )}
          </div>
          <p>Sports technology platform operated by Novarena.</p>
        </div>

        <div>
          <h4>Platform</h4>
          <button onClick={() => handleLink('solutions')}>Solutions</button>
          <button onClick={() => handleLink('tournaments')}>Tournaments</button>
          <button onClick={() => handleLink('venues')}>Venues</button>
        </div>

        <div>
          <h4>Company</h4>
          <button onClick={() => handleLink('about')}>About</button>
          <button onClick={() => handleLink('contact')}>Contact</button>
        </div>

        <div>
          <h4>Legal</h4>
          <button onClick={() => handleLegal('privacy')}>Privacy Policy</button>
          <button onClick={() => handleLegal('terms')}>Terms & Conditions</button>
          <button onClick={() => handleLegal('refund')}>Refund & Cancellation</button>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© 2026 Novarena. All Rights Reserved.</span>
        <span>Arenova is a product/platform operated by Novarena.</span>
      </div>
    </footer>
  );
}
