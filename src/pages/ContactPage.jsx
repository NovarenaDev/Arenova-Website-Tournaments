import React, { useState } from 'react';
import { api } from '../utils/api';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    mobile: '',
    subject: 'Tournament services',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const rawFirst = (formData.firstName || formData.name || '').trim();
      const rawLast = (formData.lastName || '').trim();

      let firstName = rawFirst;
      let lastName = rawLast;

      if (!lastName) {
        const parts = rawFirst.split(' ');
        if (parts.length > 1) {
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        } else {
          lastName = '.'; // Backend requires non-empty string for lastName
        }
      }

      if (!firstName) {
        setErrorMessage('Please enter your name.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        firstName,
        lastName,
        email: formData.email.trim(),
        company: 'Individual / Club',
        serviceInterestedIn: 'Other', // Backend schema enum constraint: 'Other' is valid
        message: `[Mobile: ${formData.mobile || 'N/A'}] [Interest: ${formData.subject || 'General enquiry'}]\n\n${formData.message.trim()}`
      };

      const res = await api.submitEnquiry(payload);
      if (res.success || res.message) {
        setSuccessMessage(res.message || 'Thank you! Your enquiry has been received. Our team will contact you shortly.');
        setFormData({
          firstName: '',
          lastName: '',
          name: '',
          email: '',
          mobile: '',
          subject: 'Tournament services',
          message: ''
        });
      } else {
        setSuccessMessage('Thank you for reaching out! We have recorded your enquiry.');
      }
    } catch (err) {
      console.error('Contact enquiry error:', err);
      setErrorMessage(err.message || 'Failed to submit enquiry. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">CONTACT</div>
          <h1>
            Let's connect<br />
            <span>around sport.</span>
          </h1>
          <p>
            Questions about Arenova, tournaments, venue partnerships, payments or
            support? Talk to our team.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container contact-grid">
          <div className="contact-info">
            <div className="eyebrow">COMPANY INFORMATION</div>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '6px' }}>Arenova</h2>
            <p style={{ fontSize: '15px', color: 'var(--muted)', marginBottom: '20px' }}>
              Sports technology platform operated by <strong>Novarena Technologies LLP</strong>.
            </p>

            <div className="contact-item">
              <span>Legal Entity</span>
              <b>Novarena Technologies LLP</b>
            </div>

            <div className="contact-item">
              <span>Customer Support Email</span>
              <a href="mailto:support@novarena.in" style={{ fontWeight: '700', color: 'var(--ink)' }}>
                support@novarena.in
              </a>
            </div>

            <div className="contact-item">
              <span>Contact Number</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <a href="tel:+917793934108" style={{ fontWeight: '700', color: 'var(--ink)' }}>
                  +91 7793934108
                </a>
                <a
                  href={`https://wa.me/917793934108?text=${encodeURIComponent('Hello Arenova! I would like to enquire about tournaments, sports venue bookings, and services.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#0e7955',
                    background: '#e8f8f0',
                    padding: '3px 9px',
                    borderRadius: '12px',
                    border: '1px solid #b7ecd0',
                    textDecoration: 'none'
                  }}
                  title="Chat with Arenova on WhatsApp"
                >
                  <svg width="13" height="13" viewBox="0 0 32 32" fill="none" style={{ display: 'block' }}>
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M16 3C8.82 3 3 8.82 3 16C3 18.55 3.74 20.93 5.02 22.95L3.33 28.67L9.23 27.02C11.19 28.21 13.51 28.9 16 28.9C23.18 28.9 29 23.08 29 15.9C29 8.72 23.18 3 16 3ZM16 26.6C13.84 26.6 11.83 26 10.12 24.97L9.75 24.75L5.78 25.86L6.91 22.01L6.67 21.62C5.56 19.85 4.97 17.78 4.97 15.6C4.97 9.8 9.7 5.07 15.5 5.07C18.31 5.07 20.95 6.16 22.94 8.15C24.93 10.14 26.03 12.78 26.03 15.6C26.03 21.4 21.8 26.6 16 26.6ZM21.56 18.98C21.26 18.83 19.76 18.09 19.48 17.99C19.2 17.89 19 17.84 18.8 18.14C18.6 18.44 18.02 19.12 17.85 19.32C17.67 19.52 17.5 19.55 17.2 19.4C16.9 19.25 15.92 18.93 14.77 17.9C13.87 17.1 13.27 16.11 13.1 15.81C12.92 15.51 13.08 15.35 13.23 15.2C13.37 15.06 13.54 14.86 13.69 14.68C13.84 14.5 13.89 14.37 13.99 14.17C14.09 13.97 14.04 13.8 13.96 13.65C13.89 13.5 13.29 12.01 13.04 11.41C12.8 10.82 12.55 10.9 12.36 10.89L11.78 10.88C11.58 10.88 11.26 10.95 10.99 11.25C10.72 11.55 9.94 12.28 9.94 13.76C9.94 15.24 11.02 16.67 11.17 16.87C11.32 17.07 13.31 20.14 16.36 21.46C17.09 21.77 17.65 21.96 18.1 22.1C18.83 22.33 19.5 22.3 20.03 22.22C20.62 22.13 21.84 21.48 22.09 20.78C22.34 20.08 22.34 19.48 22.26 19.35C22.19 19.22 21.86 19.13 21.56 18.98Z"
                      fill="#0e7955"
                    />
                  </svg>
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="contact-item">
              <span>Support Working Hours</span>
              <b>Mon – Sat: 9:00 AM – 7:00 PM IST</b>
            </div>

            <div className="contact-item">
              <span>Registered Office</span>
              <b style={{ fontSize: '13px', lineHeight: '1.4' }}>
                Plot No. 12, Survey No. 41, Hitech City, Madhapur, Hyderabad, Telangana, India - 500081
              </b>
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--soft)', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
                Grievance Redressal
              </div>
              <p style={{ fontSize: '13px', margin: '0 0 6px', color: 'var(--ink)', lineHeight: '1.5' }}>
                For unresolved complaints regarding Arenova's platform or tournament services, contact our designated Grievance Officer:
              </p>
              <div style={{ fontSize: '13px', color: 'var(--ink)' }}>
                <strong>Email:</strong> <a href="mailto:support@novarena.in" style={{ color: 'var(--ink)', fontWeight: '600' }}>support@novarena.in</a><br />
                <strong>Phone:</strong> +91 7793934108<br />
                <strong>Timelines:</strong> Acknowledged within 48 hours and resolved as required by law.
              </div>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            {successMessage && (
              <div className="form-message success">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="form-message error">
                {errorMessage}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <label>
                First Name *
                <input
                  required
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g. Ravi"
                />
              </label>

              <label>
                Last Name
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Kumar"
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <label>
                Email Address *
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />
              </label>

              <label>
                Mobile Number
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX"
                />
              </label>
            </div>

            <label>
              Subject / Area of Interest
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
              >
                <option value="General enquiry">General enquiry</option>
                <option value="Tournament services">Tournament services</option>
                <option value="Venue partnership">Venue partnership</option>
                <option value="Payment support">Payment support</option>
                <option value="Business partnership">Business partnership</option>
              </select>
            </label>

            <label>
              Message *
              <textarea
                required
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                placeholder="How can we help you?"
              ></textarea>
            </label>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={isSubmitting}
              style={{ marginTop: '8px' }}
            >
              {isSubmitting ? 'Sending...' : 'Send Enquiry →'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
