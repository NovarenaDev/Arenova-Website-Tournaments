import React from 'react';

export default function HomePage({ onNavigate }) {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-grid container">
          <div className="hero-copy">
            <div className="eyebrow">SPORTS TECHNOLOGY PLATFORM</div>
            <h1>
              Technology that<br />
              <span>moves sports forward.</span>
            </h1>
            <p>
              Arenova connects players, tournaments, venues, organizers and sports
              communities through one simple digital ecosystem.
            </p>
            <div className="hero-actions">
              <button
                className="btn btn-primary"
                onClick={() => onNavigate('solutions')}
              >
                Explore Platform <span>→</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => onNavigate('about')}
              >
                Discover Arenova
              </button>
            </div>
            <div className="powered">
              A product of <strong>Novarena</strong>
            </div>
          </div>

          <div className="hero-visual">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="dashboard-card">
              <div className="dash-top">
                <span>ARENA PULSE</span>
                <span className="live-dot">● LIVE</span>
              </div>
              <div className="dash-title">Your sports ecosystem</div>
              <div className="stat-row">
                <div>
                  <strong>Players</strong>
                  <span>Connected</span>
                </div>
                <div>
                  <strong>Events</strong>
                  <span>Managed</span>
                </div>
                <div>
                  <strong>Venues</strong>
                  <span>Bookable</span>
                </div>
              </div>
              <div className="match-card" onClick={() => onNavigate('tournaments')} style={{ cursor: 'pointer' }}>
                <div>
                  <span className="pill">BADMINTON</span>
                  <span style={{ fontSize: '12px', color: '#666' }}>Today</span>
                </div>
                <h3>City Open Championship</h3>
                <div className="match-meta">
                  <span>Singles • Doubles</span>
                  <span style={{ fontWeight: 'bold' }}>Register →</span>
                </div>
              </div>
              <div className="progress">
                <span></span>
              </div>
              <small>Connected sports operations</small>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="section">
        <div className="container">
          <div className="section-head center">
            <div className="eyebrow">ONE PLATFORM</div>
            <h2>Every part of the sports ecosystem.</h2>
            <p>
              Arenova is built to make sports participation and operations
              simpler — from the player experience to the organizer dashboard.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature-card">
              <div className="icon" style={{ visibility: 'hidden', userSelect: 'none' }}>01</div>
              <h3>For Players</h3>
              <p>
                Discover tournaments, register, manage profiles, teams and
                participation history.
              </p>
              <button className="link-btn" onClick={() => onNavigate('solutions')}>
                Explore →
              </button>
            </article>

            <article className="feature-card">
              <div className="icon" style={{ visibility: 'hidden', userSelect: 'none' }}>02</div>
              <h3>For Organizers</h3>
              <p>
                Create events, manage registrations, draws, schedules, matches and results.
              </p>
              <button className="link-btn" onClick={() => onNavigate('solutions')}>
                Explore →
              </button>
            </article>

            <article className="feature-card">
              <div className="icon" style={{ visibility: 'hidden', userSelect: 'none' }}>03</div>
              <h3>For Venues</h3>
              <p>
                Manage courts, availability, bookings, customers and sports facility operations.
              </p>
              <button className="link-btn" onClick={() => onNavigate('venues')}>
                Explore →
              </button>
            </article>

            <article className="feature-card">
              <div className="icon" style={{ visibility: 'hidden', userSelect: 'none' }}>04</div>
              <h3>For Communities</h3>
              <p>
                Bring athletes and sports communities together around participation and events.
              </p>
              <button className="link-btn" onClick={() => onNavigate('solutions')}>
                Explore →
              </button>
            </article>
          </div>
        </div>
      </section>

      {/* Dark Process Section */}
      <section className="dark-section">
        <div className="container split">
          <div>
            <div className="eyebrow light">BUILT FOR SPORT</div>
            <h2>From registration to results.</h2>
            <p>
              Arenova helps organizers run tournaments digitally while giving
              players a cleaner way to discover, register and participate.
            </p>
            <button
              className="btn btn-light"
              style={{ marginTop: '28px' }}
              onClick={() => onNavigate('tournaments')}
            >
              Explore Tournaments →
            </button>
          </div>
          <div className="process">
            <div>
              <b>01</b>
              <span>Discover</span>
              <p>Find tournaments and venues across your city.</p>
            </div>
            <div>
              <b>02</b>
              <span>Register</span>
              <p>Join events, choose categories, and manage teams.</p>
            </div>
            <div>
              <b>03</b>
              <span>Compete</span>
              <p>Access match schedules, draws, and live score updates.</p>
            </div>
            <div>
              <b>04</b>
              <span>Track</span>
              <p>View results and keep your participation history organized.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Box Section */}
      <section className="section">
        <div className="container payment-box">
          <div>
            <div className="eyebrow">PAYMENTS</div>
            <h2>Simple, digital transactions.</h2>
            <p>
              Arenova supports secure payments for eligible tournament
              registrations, venue bookings, and sports services through
              authorized payment gateway partners.
            </p>
          </div>
          <div className="payment-list">
            <span>UPI</span>
            <span>Cards</span>
            <span>Net Banking</span>
            <span>Receipts</span>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) Section - High Search Intent SEO */}
      <section className="faq-section" id="faq">
        <div className="container">
          <div className="section-head center">
            <div className="eyebrow">COMMON QUESTIONS</div>
            <h2>Frequently Asked Questions</h2>
            <p>
              Everything you need to know about participating, organizing, and booking on the Arenova sports platform.
            </p>
          </div>

          <div className="faq-list">
            <details className="faq-item" open>
              <summary className="faq-summary">
                <span>What is Arenova (getarenova.com)?</span>
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-content">
                <p>
                  <strong>Arenova</strong> is a premier sports technology platform operated by <strong>Novarena Technologies LLP</strong>. It provides an all-in-one digital infrastructure for sports players, tournament organizers, and sports venues. Available at <a href="https://getarenova.com">getarenova.com</a>, it simplifies tournament registrations, live match bracket tracking, and court bookings for Badminton, Pickleball, and competitive sports communities.
                </p>
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-summary">
                <span>How do players register for tournaments on Arenova?</span>
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-content">
                <p>
                  Registering is seamless! Head to the <button className="link-btn" onClick={() => onNavigate('tournaments')} style={{ textDecoration: 'underline', color: '#0d9488', fontWeight: 'bold' }}>Tournaments section</button>, choose an upcoming event, review category details (e.g., Men’s/Women’s Singles, Doubles, Mixed Doubles), and submit participant info. Secure payment can be made instantly via UPI, Debit/Credit Card, or Net Banking, after which you receive a digital booking pass.
                </p>
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-summary">
                <span>Can sports venues and badminton academies partner with Arenova?</span>
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-content">
                <p>
                  Yes! Arenova empowers venue operators and sports academies to eliminate manual booking registers. Facility managers can list courts, define hourly rates, manage bookable slots, and accept automated online payments. Visit our <button className="link-btn" onClick={() => onNavigate('venues')} style={{ textDecoration: 'underline', color: '#0d9488', fontWeight: 'bold' }}>Venues page</button> or <button className="link-btn" onClick={() => onNavigate('contact')} style={{ textDecoration: 'underline', color: '#0d9488', fontWeight: 'bold' }}>contact our team</button> to get your facility listed.
                </p>
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-summary">
                <span>How does Arenova assist tournament organizers?</span>
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-content">
                <p>
                  Arenova replaces spreadsheets and chaotic manual draws. Organizers can publish tournament details, collect online entry fees, generate automated single or double elimination draw brackets, schedule court matches, and publish live scores for players and fans to track in real-time.
                </p>
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-summary">
                <span>Which sports are currently supported on getarenova.com?</span>
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-content">
                <p>
                  Arenova currently focuses on <strong>Badminton</strong> and <strong>Pickleball</strong>, with active support expanding into Box Cricket, Tennis, Table Tennis, and Football across major cities including Hyderabad, Bangalore, and across India.
                </p>
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-summary">
                <span>Are transactions on Arenova secure?</span>
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-content">
                <p>
                  Yes. All tournament registration payments and venue fees are processed through RBI-authorized, PCI-DSS compliant payment gateways (such as Razorpay). We support UPI, major Credit/Debit Cards, and Net Banking with immediate payment verification and automated receipts.
                </p>
              </div>
            </details>
          </div>
        </div>

        {/* Structured Data: FAQPage Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is Arenova (getarenova.com)?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Arenova is a premier sports technology platform operated by Novarena Technologies LLP at getarenova.com. It connects players, tournament organizers, and sports venues with digital registrations, live brackets, and court bookings."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How do players register for tournaments on Arenova?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Browse tournaments on getarenova.com, select your event and category (Singles, Doubles, Mixed), submit participant names, and complete payment via UPI, Cards, or Net Banking to receive an instant digital registration pass."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can sports venues and badminton academies partner with Arenova?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, sports venues can list courts, manage time slot availability, accept online bookings, and track customer transactions seamlessly through Arenova."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How does Arenova assist tournament organizers?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Arenova automates registrations, online fee collection, draw and bracket generation, match scheduling, and live score updates."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Which sports are currently supported on getarenova.com?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Arenova primarily focuses on Badminton and Pickleball, with expansion underway for Box Cricket, Tennis, and football tournaments."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Are transactions on Arenova secure?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, payments on Arenova are processed through RBI-authorized, PCI-DSS compliant gateways like Razorpay with support for UPI, Cards, and Net Banking."
                  }
                }
              ]
            })
          }}
        />
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container cta-inner">
          <div>
            <div className="eyebrow" style={{ color: 'rgba(16, 17, 20, 0.7)' }}>
              THE NEXT PLAY
            </div>
            <h2>Build a better sports experience.</h2>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => onNavigate('contact')}
          >
            Talk to Arenova →
          </button>
        </div>
      </section>
    </main>
  );
}
