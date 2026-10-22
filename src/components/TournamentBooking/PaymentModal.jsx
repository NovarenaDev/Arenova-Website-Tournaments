import React, { useState } from 'react';
import { api } from '../../utils/api';

export default function PaymentModal({
  registration,
  order,
  tournament,
  selectedFee,
  onClose,
  onPaymentComplete,
  onViewDashboard
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [policyConsent, setPolicyConsent] = useState(false);
  const [invoiceData, setInvoiceData] = useState(registration?.invoice || null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [invoiceDownloadNotice, setInvoiceDownloadNotice] = useState('');

  // Handle immediate post-payment invoice PDF download (Spec Flow 1)
  const handleDownloadInvoicePdf = async () => {
    const invId = invoiceData?._id;
    if (!invId || downloadingInvoice) return;
    setDownloadingInvoice(true);
    setInvoiceDownloadNotice('');

    try {
      const res = await api.downloadInvoice(invId);
      if (res?.success && res.data?.downloadUrl) {
        window.open(res.data.downloadUrl, '_blank', 'noopener,noreferrer');
      } else {
        setInvoiceDownloadNotice(res?.message || 'Invoice PDF is still generating. Please try again in a few moments.');
      }
    } catch (err) {
      if (err?.status === 400 || err?.message?.toLowerCase().includes('generating')) {
        setInvoiceDownloadNotice('Generating PDF, please try again in a moment.');
      } else if (err?.status === 403) {
        setInvoiceDownloadNotice('Unauthorized: You can only access your own invoices.');
      } else if (err?.status === 404) {
        setInvoiceDownloadNotice('Invoice not found.');
      } else {
        setInvoiceDownloadNotice(err.message || 'Unable to download invoice. Please try again.');
      }
    } finally {
      setDownloadingInvoice(false);
    }
  };

  // Accurate backend amount resolution (in INR)
  let amountInRupees = 500;
  if (typeof selectedFee === 'number' && selectedFee >= 0) {
    amountInRupees = selectedFee;
  } else if (order?.amount) {
    // If backend returns order with amount in paise (standard Razorpay convention: 50000 = ₹500)
    amountInRupees = order.amount >= 100 ? Math.round(order.amount / 100) : order.amount;
  } else if (typeof tournament?.registrationFee === 'number') {
    amountInRupees = tournament.registrationFee;
  }

  // Exact paise required by Razorpay
  const amountInPaise = order?.amount ? order.amount : Math.round(amountInRupees * 100);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const [pendingVerification, setPendingVerification] = useState(null);

  // Launch official Razorpay Checkout Screen
  const handleLaunchRazorpay = async () => {
    if (!policyConsent) {
      setPaymentError('Please read and agree to the Terms & Conditions, Privacy Policy, and Refund & Cancellation Policy before proceeding.');
      return;
    }
    setPaymentError('');
    setIsProcessing(true);
    setStatusMessage('Initializing Razorpay Checkout...');

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      setPaymentError('Could not load Razorpay payment SDK. Please check your network connection.');
      setIsProcessing(false);
      return;
    }

    const keyId = order?.razorpayKeyId || order?.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_ToWiCACQpuVBCX';

    const options = {
      key: keyId,
      amount: amountInPaise,
      currency: order?.currency || 'INR',
      name: 'Arenova',
      description: `${tournament?.title || 'Tournament'} - ${registration?.categoryName || 'Entry'}`,
      ...(order?.id ? { order_id: order.id } : (order?.orderId ? { order_id: order.orderId } : (order?.order_id ? { order_id: order.order_id } : {}))),
      handler: async function (response) {
        setIsProcessing(true);
        setStatusMessage('Verifying payment with backend & securing slot...');

        const regId = registration?._id || registration?.id;
        if (!regId) {
          setPaymentError(`Payment was completed (Razorpay ID: ${response.razorpay_payment_id}), but registration ID is missing. Please contact support.`);
          setIsProcessing(false);
          return;
        }

        const resolvedOrderId = response.razorpay_order_id || order?.id || order?.orderId || order?.order_id || registration?.paymentOrderId || '';

        const confirmedTicket = {
          _id: regId,
          id: regId,
          tournamentId: tournament?._id || tournament?.id,
          tournament: tournament,
          categoryName: registration?.categoryName || 'Open Category',
          playerName: registration?.playerName || registration?.name || 'Player',
          playerPhone: registration?.playerPhone || registration?.phone || '',
          playerEmail: registration?.playerEmail || registration?.email || '',
          teamName: registration?.teamName || '',
          partnerName: registration?.partnerName || '',
          partnerPhone: registration?.partnerPhone || '',
          partnerEmail: registration?.partnerEmail || '',
          amount: amountInRupees,
          paymentOrderId: resolvedOrderId,
          paymentTransactionId: response.razorpay_payment_id,
          paymentSignature: response.razorpay_signature || '',
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          confirmedAt: new Date().toISOString()
        };

        const verifyPayload = {
          paymentOrderId: resolvedOrderId,
          paymentTransactionId: response.razorpay_payment_id,
          paymentSignature: response.razorpay_signature || ''
        };

        try {
          const verifyRes = await api.verifyPayment(regId, verifyPayload);
          if (verifyRes?.success) {
            const returnedInvoice = verifyRes?.invoice || verifyRes?.data?.invoice;
            if (returnedInvoice?._id) {
              confirmedTicket.invoice = returnedInvoice;
              setInvoiceData(returnedInvoice);
            }
            setIsProcessing(false);
            setIsSuccess(true);
            setPendingVerification(null);
            onPaymentComplete(confirmedTicket);
          } else {
            throw new Error(verifyRes?.message || 'Payment verification was not confirmed by the server.');
          }
        } catch (err) {
          setIsProcessing(false);
          setPendingVerification({
            regId,
            verifyPayload,
            confirmedTicket
          });
          setPaymentError(`Payment was charged by Razorpay (Payment ID: ${response.razorpay_payment_id}), but backend verification had a temporary issue: ${err.message || 'Verification failed'}. Click "Retry Verification" below to confirm your slot.`);
        }
      },
      prefill: {
        name: registration?.playerName || registration?.name || 'Player',
        email: registration?.playerEmail || registration?.email || '',
        contact: registration?.playerPhone || registration?.phone || ''
      },
      theme: {
        color: '#101114'
      },
      modal: {
        ondismiss: function () {
          setIsProcessing(false);
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setPaymentError(response?.error?.description || 'Payment was not completed. Please try again.');
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err) {
      setPaymentError('Unable to open payment modal. Please check your browser popup settings and try again.');
      setIsProcessing(false);
    }
  };

  const handleRetryVerification = async () => {
    if (!pendingVerification) return;
    setIsProcessing(true);
    setStatusMessage('Verifying payment with backend & securing slot...');
    setPaymentError('');
    try {
      const verifyRes = await api.verifyPayment(pendingVerification.regId, pendingVerification.verifyPayload);
      if (verifyRes?.success) {
        const returnedInvoice = verifyRes?.invoice || verifyRes?.data?.invoice;
        if (returnedInvoice?._id) {
          pendingVerification.confirmedTicket.invoice = returnedInvoice;
          setInvoiceData(returnedInvoice);
        }
        setIsProcessing(false);
        setIsSuccess(true);
        setPendingVerification(null);
        onPaymentComplete(pendingVerification.confirmedTicket);
      } else {
        throw new Error(verifyRes?.message || 'Payment verification failed.');
      }
    } catch (err) {
      setIsProcessing(false);
      setPaymentError(`Verification check failed: ${err.message}. Please click "Retry Verification" again or contact support with Payment ID: ${pendingVerification.verifyPayload.paymentTransactionId}.`);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '490px' }}>
        {!isSuccess && !isProcessing && (
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}

        {!isSuccess ? (
          <div>
            <div className="eyebrow">RAZORPAY CHECKOUT</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', marginBottom: '8px' }}>
              Complete Payment
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
              Confirm your registration for <strong>{tournament?.title}</strong>.
            </p>

            <div style={{
              background: 'var(--soft)',
              padding: '18px 20px',
              borderRadius: '14px',
              border: '1px solid var(--line)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--muted)' }}>Service:</span>
                <strong style={{ textAlign: 'right' }}>Tournament Registration</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--muted)' }}>Event / Venue:</span>
                <span style={{ fontWeight: '600', textAlign: 'right', maxWidth: '60%' }}>
                  {tournament?.venue || tournament?.location || 'Designated Arenova Arena'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--muted)' }}>Category:</span>
                <strong>{registration?.categoryName || 'Open Category'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--muted)' }}>Date & Schedule:</span>
                <span style={{ textAlign: 'right' }}>
                  {tournament?.startDate ? new Date(tournament.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (tournament?.date || 'As per tournament schedule')}
                </span>
              </div>
              {order?.id && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                  <span style={{ color: 'var(--muted)' }}>Order ID:</span>
                  <span style={{ fontFamily: 'monospace', color: '#555' }}>{order.id}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '10px', marginTop: '10px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Total Amount (INR):</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Inclusive of all taxes & charges</div>
                </div>
                <strong style={{ fontSize: '24px', color: 'var(--ink)' }}>₹{amountInRupees}</strong>
              </div>
            </div>

            <div style={{
              background: '#f8f9fa',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '12px',
              color: 'var(--muted)',
              marginBottom: '16px',
              lineHeight: '1.45',
              border: '1px solid var(--line)'
            }}>
              <strong style={{ color: 'var(--ink)' }}>Cancellation Terms:</strong> Eligible for refund as per published Refund & Cancellation Policy prior to tournament registration deadline. Post-deadline fees are non-refundable.
            </div>

            {/* Mandatory Policy Acceptance Checkbox (Unticked by default) */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', lineHeight: '1.45', cursor: 'pointer', color: 'var(--ink)' }}>
                <input
                  type="checkbox"
                  id="checkout-policy-consent"
                  checked={policyConsent}
                  onChange={(e) => {
                    setPolicyConsent(e.target.checked);
                    if (paymentError) setPaymentError('');
                  }}
                  style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#101114' }}
                />
                <span>
                  I have read and agree to the{' '}
                  <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', fontWeight: 600, color: 'inherit' }}>Terms & Conditions</a>,{' '}
                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', fontWeight: 600, color: 'inherit' }}>Privacy Policy</a>, and{' '}
                  <a href="/refund-cancellation-policy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', fontWeight: 600, color: 'inherit' }}>Refund & Cancellation Policy</a>.
                </span>
              </label>
            </div>

            {paymentError && (
              <div className="form-message error" style={{ marginBottom: '16px' }}>
                {paymentError}
              </div>
            )}

            {isProcessing ? (
              <div style={{ textAlign: 'center', padding: '24px 10px' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚡</div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '6px' }}>
                  Processing Transaction
                </h4>
                <p style={{ color: 'var(--muted)', fontSize: '14px' }}>{statusMessage}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {/* Primary Razorpay Checkout or Retry Verification Button */}
                {pendingVerification ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleRetryVerification}
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '15px',
                      background: '#166534',
                      borderColor: '#166534',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>✓ Retry Payment Verification</span>
                    <span>→</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleLaunchRazorpay}
                    disabled={!policyConsent}
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '15px',
                      background: policyConsent ? '#101114' : '#888',
                      cursor: policyConsent ? 'pointer' : 'not-allowed',
                      opacity: policyConsent ? 1 : 0.65,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px'
                    }}
                  >
                    <span>Pay ₹{amountInRupees} INR with Razorpay</span>
                    <span>→</span>
                  </button>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                  <span>🔒 256-Bit Encrypted</span>
                  <span>•</span>
                  <span>UPI / Cards / NetBanking</span>
                  <span>•</span>
                  <span>Razorpay Verified</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
            <div className="eyebrow" style={{ color: '#4b6e15' }}>REGISTRATION CONFIRMED</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', margin: '8px 0 12px' }}>
              You're In the Game!
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '24px' }}>
              Your registration for <strong>{tournament?.title}</strong> in the{' '}
              <strong>{registration?.categoryName || 'selected'}</strong> category is confirmed.
            </p>

            <div style={{
              background: 'var(--soft)',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid var(--line)',
              textAlign: 'left',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--muted)' }}>Registration ID:</span>
                <strong style={{ fontFamily: 'monospace' }}>{registration?._id || registration?.id || 'CONFIRMED'}</strong>
              </div>
              {invoiceData?.invoiceNumber && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--muted)' }}>Invoice Number:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#101114' }}>{invoiceData.invoiceNumber}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Payment Gateway:</span>
                <span style={{ color: '#2b7711', fontWeight: 'bold' }}>✓ Razorpay Verified</span>
              </div>
            </div>

            {/* Spec Flow 1: Immediate Post-Payment Invoice Download Action */}
            {invoiceData?._id && (
              <div style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={downloadingInvoice}
                  onClick={handleDownloadInvoicePdf}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#f8fdf2',
                    borderColor: '#a3e635',
                    color: '#275204',
                    fontWeight: '700'
                  }}
                >
                  {downloadingInvoice ? '⏳ Fetching Invoice Link...' : '📄 Download Invoice PDF'}
                </button>
                {invoiceDownloadNotice && (
                  <p style={{ fontSize: '12px', color: '#854d0e', marginTop: '6px', textAlign: 'center' }}>
                    {invoiceDownloadNotice}
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  onViewDashboard();
                }}
              >
                View in My Dashboard
              </button>
              <button
                className="btn btn-secondary"
                onClick={onClose}
              >
                Return to Tournaments
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
