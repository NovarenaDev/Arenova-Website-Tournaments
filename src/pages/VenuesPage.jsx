import React from 'react';

export default function VenuesPage({ onNavigate }) {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">VENUES</div>
          <h1>
            Better court operations.<br />
            <span>Better bookings.</span>
          </h1>
          <p>
            Arenova helps sports facilities move from manual scheduling to connected
            digital operations.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container venue-grid">
          <div className="venue-main">
            <div className="eyebrow">FOR SPORTS FACILITIES</div>
            <h2>Manage the venue without the spreadsheet chaos.</h2>
            <p>
              Give your team a single view of courts, availability, customers and
              bookings.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('contact')}
            >
              Partner with Arenova →
            </button>
          </div>

          <div className="venue-features">
            <div>
              <b>01</b>
              <h3>Court Management</h3>
              <p>Organize courts, lighting, and facility resources easily.</p>
            </div>
            <div>
              <b>02</b>
              <h3>Availability</h3>
              <p>Keep bookable time slots and member schedules visible.</p>
            </div>
            <div>
              <b>03</b>
              <h3>Online Booking</h3>
              <p>Allow players to view open slots and confirm bookings instantly.</p>
            </div>
            <div>
              <b>04</b>
              <h3>Payments</h3>
              <p>Collect booking fees and memberships securely through digital gateways.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section soft">
        <div className="container center narrow">
          <div className="eyebrow">SPORTS FOCUS</div>
          <h2>Badminton and Pickleball first.</h2>
          <p>
            Arenova is designed around the real workflows of modern racquet-sports
            facilities, with flexibility to expand into multiple indoor and outdoor sports.
          </p>
          <div style={{ marginTop: '30px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('contact')}
            >
              Request Venue Demo →
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
