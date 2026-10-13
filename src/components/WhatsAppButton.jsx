import React, { useState } from 'react';

/**
 * Minimalist Floating WhatsApp Action Button
 * Direct WhatsApp chat with Arenova customer support: +91 7793934108
 */
export default function WhatsAppButton() {
  const [isHovered, setIsHovered] = useState(false);

  const phoneNumber = '917793934108';
  const message = 'Hello Arenova! I would like to enquire about tournaments, sports venue bookings, and services.';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <aside
      aria-label="WhatsApp Support"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        pointerEvents: 'none' // Allow click only on the actual interactive button
      }}
    >
      {/* Sleek minimal hover tooltip */}
      <div
        style={{
          background: 'rgba(16, 17, 20, 0.92)',
          color: '#ffffff',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateX(0)' : 'translateX(8px)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          pointerEvents: 'none',
          backdropFilter: 'blur(6px)',
          fontFamily: 'var(--font-body, inherit)'
        }}
      >
        Chat with Arenova
      </div>

      {/* Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Arenova on WhatsApp (+91 7793934108)"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          pointerEvents: 'auto',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#25D366',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isHovered
            ? '0 6px 20px rgba(37, 211, 102, 0.45), 0 2px 6px rgba(0, 0, 0, 0.12)'
            : '0 4px 14px rgba(37, 211, 102, 0.32), 0 2px 4px rgba(0, 0, 0, 0.08)',
          transform: isHovered ? 'scale(1.08) translateY(-2px)' : 'scale(1) translateY(0)',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
          textDecoration: 'none',
          cursor: 'pointer'
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          {/* Official WhatsApp silhouette */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M16 3C8.82 3 3 8.82 3 16C3 18.55 3.74 20.93 5.02 22.95L3.33 28.67L9.23 27.02C11.19 28.21 13.51 28.9 16 28.9C23.18 28.9 29 23.08 29 15.9C29 8.72 23.18 3 16 3ZM16 26.6C13.84 26.6 11.83 26 10.12 24.97L9.75 24.75L5.78 25.86L6.91 22.01L6.67 21.62C5.56 19.85 4.97 17.78 4.97 15.6C4.97 9.8 9.7 5.07 15.5 5.07C18.31 5.07 20.95 6.16 22.94 8.15C24.93 10.14 26.03 12.78 26.03 15.6C26.03 21.4 21.8 26.6 16 26.6ZM21.56 18.98C21.26 18.83 19.76 18.09 19.48 17.99C19.2 17.89 19 17.84 18.8 18.14C18.6 18.44 18.02 19.12 17.85 19.32C17.67 19.52 17.5 19.55 17.2 19.4C16.9 19.25 15.92 18.93 14.77 17.9C13.87 17.1 13.27 16.11 13.1 15.81C12.92 15.51 13.08 15.35 13.23 15.2C13.37 15.06 13.54 14.86 13.69 14.68C13.84 14.5 13.89 14.37 13.99 14.17C14.09 13.97 14.04 13.8 13.96 13.65C13.89 13.5 13.29 12.01 13.04 11.41C12.8 10.82 12.55 10.9 12.36 10.89L11.78 10.88C11.58 10.88 11.26 10.95 10.99 11.25C10.72 11.55 9.94 12.28 9.94 13.76C9.94 15.24 11.02 16.67 11.17 16.87C11.32 17.07 13.31 20.14 16.36 21.46C17.09 21.77 17.65 21.96 18.1 22.1C18.83 22.33 19.5 22.3 20.03 22.22C20.62 22.13 21.84 21.48 22.09 20.78C22.34 20.08 22.34 19.48 22.26 19.35C22.19 19.22 21.86 19.13 21.56 18.98Z"
            fill="#ffffff"
          />
        </svg>
      </a>
    </aside>
  );
}
