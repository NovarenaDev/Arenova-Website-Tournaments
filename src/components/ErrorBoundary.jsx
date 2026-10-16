import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Caught by ErrorBoundary without polluting client console
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#070b13',
          color: '#f8fafc',
          textAlign: 'center'
        }}>
          <div className="glass-card" style={{
            maxWidth: '500px',
            padding: '40px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px'
          }}>
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              color: '#f43f5e',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={32} />
            </div>
            
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px' }}>
                Something went wrong
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6' }}>
                We encountered an unexpected error, but your browser session has been kept safe. Try refreshing the page or restarting the registration process.
              </p>
            </div>

            <button 
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              <RefreshCw size={18} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
