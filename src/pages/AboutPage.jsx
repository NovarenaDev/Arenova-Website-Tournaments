import React from 'react';

export default function AboutPage({ onNavigate }) {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">ABOUT ARENOVA</div>
          <h1>
            Building the digital<br />
            <span>future of sports.</span>
          </h1>
          <p>
            Arenova is a sports technology platform developed and operated by Novarena.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container split about-split">
          <div>
            <div className="eyebrow">OUR PURPOSE</div>
            <h2>Make sports easier to participate in and easier to manage.</h2>
          </div>
          <div>
            <p>
              Arenova brings together players, tournament organizers, venues,
              academies and sports communities through connected digital tools.
            </p>
            <p>
              Our initial focus is on <strong>Badminton and Pickleball</strong>,
              with a platform architecture designed to expand into additional sports
              and services.
            </p>
          </div>
        </div>
      </section>

      <section className="section soft">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">COMPANY STRUCTURE</div>
            <h2>Clear brand. Clear legal entity.</h2>
          </div>
          <div className="company-cards">
            <div>
              <span>LEGAL COMPANY</span>
              <h3>Novarena</h3>
              <p>The incorporated legal entity responsible for the business and operations.</p>
            </div>
            <div>
              <span>PRODUCT / BRAND</span>
              <h3>Arenova</h3>
              <p>The sports technology platform and customer product operated by Novarena.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="dark-section">
        <div className="container center narrow">
          <div className="eyebrow light">OUR MISSION</div>
          <h2>Connect. Play. Compete. Manage.</h2>
          <p>We believe technology should remove friction from sport, not add to it.</p>
          <button
            className="btn btn-accent"
            style={{ marginTop: '28px' }}
            onClick={() => onNavigate('tournaments')}
          >
            Explore Live Tournaments →
          </button>
        </div>
      </section>
    </main>
  );
}
