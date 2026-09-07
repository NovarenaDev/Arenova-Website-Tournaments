import React, { useEffect } from 'react';

export default function DownloadAppModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Future APK location: placed in public folder or CDN
  const apkDownloadUrl = '/arenova-latest.apk';

  const handleDownloadClick = () => {
    // Triggers download or prompts user
    const link = document.createElement('a');
    link.href = apkDownloadUrl;
    link.setAttribute('download', 'arenova-latest.apk');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', padding: '36px' }}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="eyebrow" style={{ display: 'inline-block', marginBottom: '8px' }}>
          ARENOVA MOBILE APP
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', margin: '0 0 10px', letterSpacing: '-0.01em' }}>
          Take the Arena With You
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
          Experience tournament draws, live match scoring, real-time push alerts, and digital athlete passes in one high-performance app.
        </p>

        {/* Android APK Primary Download Card */}
        <div
          style={{
            background: 'var(--soft)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#101114',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}
              >
                🤖
              </div>
              <div>
                <strong style={{ fontSize: '16px', display: 'block', color: 'var(--ink)' }}>
                  Arenova for Android
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Direct APK Package • v1.2.0
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(184, 255, 61, 0.2)',
                color: '#4b6e15'
              }}
            >
              LATEST BUILD
            </span>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleDownloadClick}
            style={{
              width: '100%',
              padding: '13px 18px',
              fontSize: '15px',
              fontWeight: '700',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>📥</span> Download Android APK
          </button>

          <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)', textAlign: 'center' }}>
            Tip: Enable <em>"Install unknown apps"</em> in Android Settings if prompted during install.
          </p>
        </div>

        {/* Coming Soon Stores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div
            style={{
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#fafafa',
              opacity: 0.85
            }}
          >
            <span style={{ fontSize: '20px' }}>▶️</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink)' }}>Google Play</div>
              <div style={{ fontSize: '11px', color: '#999' }}>Coming Soon</div>
            </div>
          </div>

          <div
            style={{
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#fafafa',
              opacity: 0.85
            }}
          >
            <span style={{ fontSize: '20px' }}>🍎</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink)' }}>App Store</div>
              <div style={{ fontSize: '11px', color: '#999' }}>In Review</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
