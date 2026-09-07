import React from 'react';

export default function LegalPage({ docType, onBack }) {
  return (
    <main>
      <section className="legal-hero">
        <div className="container legal-copy">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div className="eyebrow" style={{ margin: 0 }}>LEGAL COMPLIANCE</div>
            <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px 16px', fontSize: '13px' }}>
              ← Back
            </button>
          </div>

          {docType === 'privacy' && (
            <>
              <h1>Privacy Policy</h1>
              <p><strong>Operated by:</strong> Novarena Technologies Private Limited (Platform: Arenova)</p>
              
              <h2>1. Introduction</h2>
              <p>
                Arenova is a sports technology platform operated by Novarena. We respect your privacy and are committed to protecting personal information collected through our website, mobile interfaces, and digital tournament services.
              </p>

              <h2>2. Information We Collect</h2>
              <p>
                Depending on the services used, we collect name, mobile number, email address, player category/skill info, sports and tournament participation records, team and partner info, venue booking data, transaction identifiers, and support requests.
              </p>

              <h2>3. How We Use Information</h2>
              <p>
                We use information to create athlete accounts, process tournament registrations, schedule draws and matches, verify payments, send confirmation receipts, provide support, and prevent fraudulent bookings.
              </p>

              <h2>4. Payments & Security</h2>
              <p>
                All digital transactions are processed securely through authorized payment gateway partners. Arenova does not store full credit/debit card numbers, CVV, or banking credentials on its servers.
              </p>

              <h2>5. Information Sharing</h2>
              <p>
                Tournament data (such as participant names, teams, and seedings) is shared with authorized tournament organizers and venues strictly for event execution and bracket publishing.
              </p>

              <h2>6. Contact Us</h2>
              <p>
                For privacy or account inquiries, contact us at <strong>support@novarena.in</strong>.
              </p>
            </>
          )}

          {docType === 'terms' && (
            <>
              <h1>Terms & Conditions</h1>
              <p><strong>Operated by:</strong> Novarena Technologies Private Limited (Platform: Arenova)</p>

              <h2>1. About Arenova</h2>
              <p>
                Arenova is a sports technology platform operated by Novarena, providing digital services related to sports tournaments, player registrations, venue bookings, and sports management tools.
              </p>

              <h2>2. User Accounts</h2>
              <p>
                Users must provide accurate, current, and complete details during registration and are solely responsible for activities occurring under their verified phone number.
              </p>

              <h2>3. Tournament Registrations</h2>
              <p>
                Registrations are subject to event-specific eligibility requirements, age criteria, category slots, and schedules set by the respective tournament organizers.
              </p>

              <h2>4. Venue Bookings & Conduct</h2>
              <p>
                Venue and court bookings are subject to availability and facility rules. Athletes and organizers agree to uphold fair play and respectful conduct at all participating venues.
              </p>

              <h2>5. Intellectual Property</h2>
              <p>
                The Arenova brand, logo, platform design, software code, and assets are owned by or licensed to Novarena.
              </p>

              <h2>6. Governing Law</h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of India.
              </p>
            </>
          )}

          {docType === 'refund' && (
            <>
              <h1>Refund & Cancellation Policy</h1>
              <p><strong>Operated by:</strong> Novarena Technologies Private Limited (Platform: Arenova)</p>

              <h2>1. Tournament Registration Cancellations</h2>
              <p>
                Refund eligibility depends on the organizer's event policy. Registrations cancelled prior to bracket generation or tournament registration deadlines may be eligible for a refund minus administrative gateway charges.
              </p>

              <h2>2. Failed Transactions</h2>
              <p>
                If your payment was debited but the registration slot was not confirmed due to network interruption, our system reconciles with the banking gateway automatically within 24–48 hours to complete or reverse the transaction.
              </p>

              <h2>3. Duplicate Payments</h2>
              <p>
                In the event of duplicate charges for the same category or booking, please submit your transaction ID to our support team for prompt verification and refund.
              </p>

              <h2>4. Support Contact</h2>
              <p>
                For refund assistance, email <strong>support@novarena.in</strong> with your registered mobile number, tournament name, and payment transaction reference.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
