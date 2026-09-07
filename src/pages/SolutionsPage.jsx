import React from 'react';

export default function SolutionsPage({ onNavigate }) {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">PLATFORM SOLUTIONS</div>
          <h1>
            Tools for every<br />
            <span>side of sport.</span>
          </h1>
          <p>
            Arenova is more than a tournament registration website. It is the digital
            layer connecting every participant in the sports ecosystem.
          </p>
        </div>
      </section>

      <section className="section" id="players">
        <div className="container solution-row">
          <div className="solution-number">01</div>
          <div>
            <div className="eyebrow">FOR PLAYERS</div>
            <h2>Your sports journey, in one place.</h2>
            <p>
              Discover events, create a profile, register for tournaments, manage
              partners and teams, and keep your participation history organized.
            </p>
            <div className="tag-list">
              <span>Player Profiles</span>
              <span>Registrations</span>
              <span>Teams & Partners</span>
              <span>Participation History</span>
            </div>
            <button
              className="btn btn-primary"
              style={{ marginTop: '28px' }}
              onClick={() => onNavigate('tournaments')}
            >
              Browse Tournaments →
            </button>
          </div>
        </div>
      </section>

      <section className="section soft" id="organizers">
        <div className="container solution-row">
          <div className="solution-number">02</div>
          <div>
            <div className="eyebrow">FOR ORGANIZERS</div>
            <h2>Run tournaments with less manual work.</h2>
            <p>
              Build events, collect registrations, manage categories, generate
              draws, schedule matches, manage scores and publish live results.
            </p>
            <div className="tag-list">
              <span>Event Creation</span>
              <span>Registration Management</span>
              <span>Draws & Brackets</span>
              <span>Match Scheduling</span>
              <span>Live Scores</span>
              <span>Results Publishing</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="venues">
        <div className="container solution-row">
          <div className="solution-number">03</div>
          <div>
            <div className="eyebrow">FOR VENUES</div>
            <h2>Turn court operations into a digital workflow.</h2>
            <p>
              Manage courts, availability, bookings, customers and transaction
              history from one connected platform.
            </p>
            <div className="tag-list">
              <span>Court Management</span>
              <span>Availability Calendar</span>
              <span>Bookings</span>
              <span>Customer Records</span>
              <span>Online Payments</span>
            </div>
            <button
              className="btn btn-secondary"
              style={{ marginTop: '28px' }}
              onClick={() => onNavigate('venues')}
            >
              Explore Venue Operations →
            </button>
          </div>
        </div>
      </section>

      <section className="section soft" id="communities">
        <div className="container solution-row">
          <div className="solution-number">04</div>
          <div>
            <div className="eyebrow">FOR COMMUNITIES</div>
            <h2>Grow participation around sport.</h2>
            <p>
              Help sports communities discover events, connect athletes, and
              create a stronger local sports network across cities.
            </p>
            <div className="tag-list">
              <span>Local Clubs</span>
              <span>Amateur Leagues</span>
              <span>Community Tournaments</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
