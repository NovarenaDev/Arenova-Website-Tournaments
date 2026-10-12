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
              <a href="tel:+917793934108" style={{ fontWeight: '700', color: 'var(--ink)' }}>
                +91 7793934108
              </a>
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
