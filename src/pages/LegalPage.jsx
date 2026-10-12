import React from 'react';

export default function LegalPage({ docType, onNavigateLegal, onBack }) {
  const activeDoc = docType || 'terms';

  const handleTabClick = (type) => {
    if (onNavigateLegal) {
      onNavigateLegal(type);
    }
  };

  return (
    <main style={{ background: '#ffffff', minHeight: '80vh', paddingBottom: '60px' }}>
      <section className="legal-hero" style={{ background: 'var(--soft)', padding: '50px 0 30px', borderBottom: '1px solid var(--line)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div className="eyebrow" style={{ margin: 0 }}>
              LEGAL & COMPLIANCE • NOVARENA TECHNOLOGIES LLP
            </div>
            {onBack && (
              <button
                className="btn btn-secondary"
                onClick={onBack}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                ← Back to Home
              </button>
            )}
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 42px)', margin: '0 0 10px', color: 'var(--ink)' }}>
            {activeDoc === 'terms' && 'Terms & Conditions'}
            {activeDoc === 'privacy' && 'Privacy Policy'}
            {activeDoc === 'refund' && 'Refund & Cancellation Policy'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '15px', margin: 0 }}>
            Effective Date: <strong>11 October 2026</strong> • Official policy documentation for Arenova, operated by Novarena Technologies LLP.
          </p>

          {/* Quick Legal Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleTabClick('terms')}
              className="btn"
              style={{
                padding: '9px 18px',
                fontSize: '13px',
                borderRadius: '8px',
                fontWeight: '700',
                background: activeDoc === 'terms' ? 'var(--ink)' : '#ffffff',
                color: activeDoc === 'terms' ? '#ffffff' : 'var(--ink)',
                border: '1px solid var(--line)',
                boxShadow: activeDoc === 'terms' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Terms & Conditions
            </button>
            <button
              onClick={() => handleTabClick('privacy')}
              className="btn"
              style={{
                padding: '9px 18px',
                fontSize: '13px',
                borderRadius: '8px',
                fontWeight: '700',
                background: activeDoc === 'privacy' ? 'var(--ink)' : '#ffffff',
                color: activeDoc === 'privacy' ? '#ffffff' : 'var(--ink)',
                border: '1px solid var(--line)',
                boxShadow: activeDoc === 'privacy' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => handleTabClick('refund')}
              className="btn"
              style={{
                padding: '9px 18px',
                fontSize: '13px',
                borderRadius: '8px',
                fontWeight: '700',
                background: activeDoc === 'refund' ? 'var(--ink)' : '#ffffff',
                color: activeDoc === 'refund' ? '#ffffff' : 'var(--ink)',
                border: '1px solid var(--line)',
                boxShadow: activeDoc === 'refund' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Refund & Cancellation Policy
            </button>
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: '920px' }}>
          <div
            className="legal-copy"
            style={{
              lineHeight: '1.75',
              color: '#2d3748',
              fontSize: '15px'
            }}
          >
            {/* ========================================================= */}
            {/* 1. TERMS & CONDITIONS                                     */}
            {/* ========================================================= */}
            {activeDoc === 'terms' && (
              <article>
                <div style={{ background: 'var(--soft)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--line)', marginBottom: '30px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>
                    <strong>Legal Entity:</strong> Novarena Technologies LLP<br />
                    <strong>Effective Date:</strong> 11 October 2026
                  </p>
                </div>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  1. Introduction
                </h3>
                <p>
                  These Terms & Conditions govern access to and use of the Arenova website, application, and related sports technology services. Arenova is a sports technology platform operated by <strong>Novarena Technologies LLP</strong>. By accessing our platform, creating an account, registering for a tournament, making a booking, or completing a payment, you agree to these terms. If you do not agree to these terms, please discontinue using the relevant services.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  2. Services Offered
                </h3>
                <p>
                  Arenova provides the following digital services, depending on availability: sports tournament discovery, registration, and bracket management; player and team registration and management; sports venue and court discovery and booking; coach, academy, and sports community services; and related sports technology and event management services. The services available, applicable charges, and booking conditions are displayed on the relevant event or booking page before confirmation.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  3. User Accounts
                </h3>
                <p>
                  Users must provide accurate and current information when registering or using the platform. You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted through your account. Please notify us immediately if you suspect unauthorized access. Parents or legal guardians must supervise account use and provide any required permissions when registering or managing accounts for minors. We reserve the right to restrict or suspend accounts involved in fraud, misuse, false registrations, or violations of these terms, subject to applicable law.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  4. Tournament Registrations
                </h3>
                <p>
                  Tournament details, eligibility criteria, categories, entry fees, venue, schedule, and other applicable rules are clearly displayed before registration. Users must provide accurate player and team information and satisfy stated eligibility requirements. Registration is subject to payment confirmation and tournament-specific rules. A registration confirmation does not guarantee participation if eligibility requirements are not met or the organizer validly cancels or changes the event. Schedules, match timings, and formats may change due to operational requirements, safety concerns, weather, or other circumstances. Material changes and cancellations will be communicated through available contact channels where reasonably possible.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  5. Sports Venue and Court Bookings
                </h3>
                <p>
                  Venue bookings are subject to availability and the rules of the relevant facility. Users must verify the venue location, date, time slot, duration, price, and cancellation conditions before completing a booking. Users must follow venue rules and use sports facilities responsibly. Additional charges or damages may be the user's responsibility where permitted by law and supported by applicable booking terms.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  6. Pricing and Payments
                </h3>
                <p>
                  All applicable prices and fees are displayed before payment. Unless expressly stated otherwise, prices are in Indian Rupees (INR). Payments are processed through authorized third-party payment service providers, including Razorpay, where enabled. A payment is considered successful only after the transaction has been verified server-side through the payment provider and our system. Users must not attempt fraudulent payments, manipulate transactions, or misuse payment facilities. Arenova does not intentionally store full payment card credentials, CVV, or payment instrument security credentials.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  7. Cancellations and Refunds
                </h3>
                <p>
                  Tournament registration cancellations, venue booking cancellations, organizer cancellations, and refund eligibility are governed by our separate Refund and Cancellation Policy and any specific terms disclosed before payment. Please review those terms before completing your transaction.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  8. Third-Party Organisers and Venues
                </h3>
                <p>
                  Some tournaments, coaching activities, or venue services may be delivered by independent organizers, coaches, academies, or venue partners. Where applicable, their event rules, availability, facilities, and service conditions apply in addition to these terms. Arenova communicates its role in the relevant transaction and provides appropriate support for platform-related issues. Nothing in these terms excludes rights or remedies users have under applicable law.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  9. Acceptable Use
                </h3>
                <p>
                  Users must not provide false or misleading information; make fraudulent registrations or payments; interfere with platform security or operation; misuse another user's account or personal information; upload unlawful, abusive, or infringing content; or use the platform for unlawful activities. We may take appropriate action against violations, subject to applicable law.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  10. Intellectual Property
                </h3>
                <p>
                  The Arenova name, branding, website design, software, and original platform content are owned by or licensed to Novarena Technologies LLP, unless otherwise indicated. Users may not copy, distribute, modify, or commercially exploit protected material without prior authorization.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  11. Privacy
                </h3>
                <p>
                  Personal information is handled in accordance with our Privacy Policy, which explains what information we collect, how we use it, and when it may be shared.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  12. Service Availability
                </h3>
                <p>
                  We aim to maintain reliable access to the platform but cannot guarantee uninterrupted or error-free operation. We may conduct scheduled maintenance, introduce updates, or temporarily restrict features for operational, technical, security, or legal reasons.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  13. Limitation of Liability
                </h3>
                <p>
                  To the extent permitted by applicable law, Novarena Technologies LLP will not be liable for indirect or consequential losses arising from the use of the platform. Nothing in these terms excludes or limits liability that cannot legally be excluded or limited under applicable consumer protection laws.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  14. Changes to These Terms
                </h3>
                <p>
                  We may update these terms to reflect changes to our services, operations, or applicable laws. Updated terms will be published on this page with a revised effective date.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  15. Governing Law and Disputes
                </h3>
                <p>
                  These terms are governed by the laws of India. Disputes will be handled by competent courts or dispute resolution forums as determined under applicable Indian laws.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  16. Contact
                </h3>
                <div style={{ background: 'var(--soft)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--line)', marginTop: '12px' }}>
                  <p style={{ margin: 0 }}>
                    <strong>Legal Entity:</strong> Novarena Technologies LLP – Arenova<br />
                    <strong>Official Support Email:</strong> <a href="mailto:support@novarena.in" style={{ color: 'var(--ink)', fontWeight: '600' }}>support@novarena.in</a><br />
                    <strong>Business Contact Phone:</strong> +91 7793934108<br />
                    <strong>Registered Address:</strong> Novarena Technologies LLP, Plot No. 12, Survey No. 41, Hitech City, Madhapur, Hyderabad, Telangana, India - 500081
                  </p>
                </div>
              </article>
            )}

            {/* ========================================================= */}
            {/* 2. PRIVACY POLICY                                         */}
            {/* ========================================================= */}
            {activeDoc === 'privacy' && (
              <article>
                <div style={{ background: 'var(--soft)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--line)', marginBottom: '30px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>
                    <strong>Legal Entity:</strong> Novarena Technologies LLP<br />
                    <strong>Effective Date:</strong> 11 October 2026
                  </p>
                </div>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  1. Introduction
                </h3>
                <p>
                  Arenova is a sports technology platform operated by <strong>Novarena Technologies LLP</strong>. This Privacy Policy explains how we collect, use, disclose, and protect personal information when users access our website, application, or related services. Information will be handled as described in this policy, subject to applicable Indian laws.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  2. Information We Collect
                </h3>
                <p>Depending on the services used, we may collect:</p>
                <ul style={{ paddingLeft: '24px', margin: '10px 0 16px' }}>
                  <li><strong>Personal and Account Information:</strong> Full name, email address, mobile number, login credentials, verification information, profile details, and sports preferences.</li>
                  <li><strong>Player and Sports Information:</strong> Athlete profiles, team details, tournament registrations, age/date of birth where required for category eligibility, and tournament participation records.</li>
                  <li><strong>Booking and Transaction Information:</strong> Venue, court, and tournament booking details, transaction references, payment and refund statuses, amount paid, and service fee breakdowns.</li>
                  <li><strong>Technical Information:</strong> Device type, browser version, operating system, diagnostic logs, IP address, and platform usage information.</li>
                </ul>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  3. How We Use Your Information
                </h3>
                <p>
                  We use personal information to create and manage accounts; verify accounts through OTP or authentication methods; process tournament registrations and venue bookings; confirm digital payments and coordinate eligible refunds; communicate booking updates and service notifications; provide athlete support and resolve queries; detect fraud and maintain platform security; improve sports platform features; and comply with legal obligations.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  4. Payments and Payment Service Providers
                </h3>
                <p>
                  Payments are processed through authorized third-party payment service providers, including Razorpay, where enabled. Providers collect and process information required to complete and secure transactions under their own privacy policies. Arenova receives transaction references, payment status, amounts, and other transaction-related details needed to confirm registrations and manage refunds. <strong>We do not intentionally store full credit/debit card numbers, card security codes (CVV), UPI PINs, or bank passwords on our servers.</strong>
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  5. Sharing of Information
                </h3>
                <p>
                  We may share relevant information with payment service providers (e.g. Razorpay); tournament organizers and venue partners strictly necessary to deliver a requested sports service; technology, hosting, and communication providers; and law enforcement or government authorities where required by applicable law. <strong>We do not sell personal information to third parties as a business practice.</strong>
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  6. Children's Privacy
                </h3>
                <p>
                  Arenova supports youth sports activities involving minors. Where information about a child athlete is collected for tournament age eligibility, we implement parental consent and data protection measures. Parents or legal guardians may contact us to request access to, correction of, or deletion of eligible child records, subject to legitimate record-retention requirements under applicable law.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  7. Data Security
                </h3>
                <p>
                  We implement reasonable technical, operational, and organizational safeguards designed to protect personal information against unauthorized access, loss, misuse, or disclosure. All transaction channels use HTTPS/TLS encryption.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  8. Data Retention
                </h3>
                <p>
                  We retain information for as long as reasonably necessary to provide services, manage bookings and tournament records, maintain financial compliance records, resolve disputes, and comply with statutory obligations. When information is no longer needed, it is securely deleted or anonymized.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  9. Your Privacy Rights
                </h3>
                <p>
                  Subject to applicable law, you may request access to, correction of, or deletion of your personal information, withdraw consent, or raise a privacy-related concern by contacting our support team using the details below.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  10. Cookies and Similar Technologies
                </h3>
                <p>
                  Our platform may use cookies or browser storage tokens for essential authentication sessions, security, user preferences, and performance analytics.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  11. Third-Party Services
                </h3>
                <p>
                  Our platform may contain links to third-party sports associations or venue partner sites. Their privacy practices are governed by their respective privacy policies.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  12. Changes to This Policy
                </h3>
                <p>
                  We may update this Privacy Policy from time to time. The latest version and effective date will always be published on this page.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  13. Contact and Privacy Grievances
                </h3>
                <div style={{ background: 'var(--soft)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--line)', marginTop: '12px' }}>
                  <p style={{ margin: 0 }}>
                    <strong>Operating Entity:</strong> Novarena Technologies LLP – Arenova<br />
                    <strong>Official Support / Privacy Email:</strong> <a href="mailto:support@novarena.in" style={{ color: 'var(--ink)', fontWeight: '600' }}>support@novarena.in</a><br />
                    <strong>Business Contact Phone:</strong> +91 7793934108<br />
                    <strong>Registered Address:</strong> Novarena Technologies LLP, Plot No. 12, Survey No. 41, Hitech City, Madhapur, Hyderabad, Telangana, India - 500081<br />
                    <strong>Designated Grievance Officer:</strong> Grievance & Compliance Officer, Novarena Technologies LLP<br />
                    <strong>Grievance Email:</strong> <a href="mailto:support@novarena.in" style={{ color: 'var(--ink)', fontWeight: '600' }}>support@novarena.in</a>
                  </p>
                </div>
              </article>
            )}

            {/* ========================================================= */}
            {/* 3. REFUND & CANCELLATION POLICY                           */}
            {/* ========================================================= */}
            {activeDoc === 'refund' && (
              <article>
                <div style={{ background: 'var(--soft)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--line)', marginBottom: '30px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>
                    <strong>Legal Entity:</strong> Novarena Technologies LLP<br />
                    <strong>Effective Date:</strong> 11 October 2026<br />
                    <strong>Standard Refund Processing Target:</strong> 5–7 Business Days
                  </p>
                </div>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  1. Introduction
                </h3>
                <p>
                  This Refund and Cancellation Policy applies to eligible payments made through the Arenova platform, operated by <strong>Novarena Technologies LLP</strong>, for tournament registrations, sports venue bookings, and other sports technology services offered through the platform. Please review the applicable cancellation conditions, event rules, and booking details before completing any payment.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  2. Tournament Registration Cancellation by a User
                </h3>
                <p>
                  Tournament registration fees may be refundable or non-refundable depending on the specific cancellation cutoff and conditions displayed for the tournament before payment. Before the stated registration deadline or draw publishing date, eligible cancellations qualify for a refund according to published event rules. After the published registration deadline, refunds are generally unavailable unless required by law or the organizer's published rules. After event commencement or service delivery, registration fees are strictly non-refundable.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  3. Tournament Cancellation by the Organiser
                </h3>
                <p>
                  If a tournament is cancelled by its organizer due to administrative reasons, inclement weather, or force majeure, registered participants will be notified via their registered email and mobile number. Where a full refund is applicable, the refund will be initiated for the eligible amount paid. Any statutory or disclosed payment processing deductions will be communicated in advance. If an event is rescheduled, participants will be provided options to transfer registration or request a refund in accordance with event terms.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  4. Venue and Court Booking Cancellations
                </h3>
                <p>
                  Court and venue bookings are subject to specific cancellation conditions displayed at the time of booking. Cancellations made within the eligible advance cutoff period qualify for a full or partial refund as stated in the booking terms. Cancellations requested after the cutoff are ineligible for refunds. If a venue cancels a confirmed booking and cannot provide the reserved slot, an eligible refund or agreed slot reschedule will be offered promptly.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  5. Failed, Pending or Duplicate Payments
                </h3>
                <p>
                  If money is debited from your bank account or UPI application but the booking or tournament registration is not confirmed on the platform, please contact support with your payment transaction ID or UPI reference number. We will verify the transaction status server-side with our payment service provider (Razorpay). If a payment is confirmed as failed or duplicated, the debited amount will be refunded or reversed through the automated banking settlement process.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  6. Refund Processing Time
                </h3>
                <p>
                  Once a refund is approved and initiated by Novarena Technologies LLP, our operational service target is to process it within <strong>5–7 business days</strong>. The actual time for the funds to reflect in your bank account, card, or UPI wallet may vary depending on your bank and payment gateway settlement cycles. If your refund has not appeared within 7 business days, please contact support with your transaction reference.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  7. Refund Method
                </h3>
                <p>
                  Approved refunds will strictly be credited back to the <strong>original payment method</strong> used during the transaction (original card, UPI ID, or net banking account). <strong>Arenova staff will never ask you to disclose your UPI PIN, ATM PIN, CVV, OTP, or net banking passwords to process a refund.</strong>
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  8. How to Request a Refund
                </h3>
                <p>To submit an eligible refund request:</p>
                <ol style={{ paddingLeft: '24px', margin: '10px 0 16px' }}>
                  <li>Contact Arenova customer support via email at <a href="mailto:support@novarena.in" style={{ color: 'var(--ink)', fontWeight: '600' }}>support@novarena.in</a> or by phone at <strong>+91 7793934108</strong>.</li>
                  <li>Provide your full name and registered mobile number or email address.</li>
                  <li>Include your tournament registration ID or booking ID and the payment transaction reference number.</li>
                  <li>Provide a brief explanation for the cancellation request along with proof of payment if available.</li>
                </ol>
                <p>Our team will acknowledge your request and communicate the review outcome within statutory timelines.</p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  9. Non-Refundable Transactions
                </h3>
                <p>
                  Transactions are non-refundable where: (a) the tournament has started or the match draw has been published; (b) the athlete has participated in the event; (c) the disclosed advance cancellation cutoff has passed; or (d) the player is disqualified due to age fraud or violation of tournament rules.
                </p>

                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginTop: '28px', marginBottom: '10px' }}>
                  10. Contact Us
                </h3>
                <div style={{ background: 'var(--soft)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--line)', marginTop: '12px' }}>
                  <p style={{ margin: 0 }}>
                    <strong>Legal Entity:</strong> Novarena Technologies LLP – Arenova<br />
                    <strong>Customer Support Email:</strong> <a href="mailto:support@novarena.in" style={{ color: 'var(--ink)', fontWeight: '600' }}>support@novarena.in</a><br />
                    <strong>Business Contact Phone:</strong> +91 7793934108<br />
                    <strong>Registered Office Address:</strong> Novarena Technologies LLP, Plot No. 12, Survey No. 41, Hitech City, Madhapur, Hyderabad, Telangana, India - 500081
                  </p>
                </div>
              </article>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
