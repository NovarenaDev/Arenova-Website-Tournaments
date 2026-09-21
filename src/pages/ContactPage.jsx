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
            <div className="eyebrow">COMPANY</div>
            <h2>Novarena</h2>
            <p style={{ fontSize: '18px', color: 'var(--muted)', marginBottom: '24px' }}>
              <strong>Product / Platform:</strong> Arenova
            </p>

            <div className="contact-item">
              <span>Email</span>
              <a href="mailto:support@novarena.in" style={{ fontWeight: '600', color: 'var(--ink)' }}>
                support@novarena.in
              </a>
            </div>

            <div className="contact-item">
              <span>Phone / Support</span>
              <b>+91 98765 43210</b>
            </div>

            <div className="contact-item">
              <span>Registered Entity</span>
              <b>Novarena Technologies LLP</b>
            </div>

            <p className="notice">
              For official tournament or organizer inquiries, please provide full event details in the message box.
            </p>
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
