import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import SolutionsPage from './pages/SolutionsPage';
import TournamentsPage from './pages/TournamentsPage';
import VenuesPage from './pages/VenuesPage';
import ContactPage from './pages/ContactPage';
import LegalPage from './pages/LegalPage';
import UserDashboard from './components/TournamentBooking/UserDashboard';
import { api, getStoredAuth, clearStoredAuth } from './utils/api';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [legalDocType, setLegalDocType] = useState('privacy');
  const [authObj, setAuthObj] = useState(getStoredAuth());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);

  // Fetch tournaments from API
  const fetchTournaments = async () => {
    setLoadingTournaments(true);
    try {
      const data = await api.getTournaments();
      setTournaments(data.data || data || []);
    } catch (err) {
      console.warn('Live tournament fetch notice:', err.message);
      setTournaments([]);
    } finally {
      setLoadingTournaments(false);
    }
  };

  useEffect(() => {
    // Clear any stale mock tokens from previous tests so real backend JWT is required
    const currentAuth = getStoredAuth();
    if (currentAuth?.token && (currentAuth.token.startsWith('arenova_token_direct_') || currentAuth.token.startsWith('mock_'))) {
      clearStoredAuth();
      setAuthObj(getStoredAuth());
    }
    fetchTournaments();
  }, []);

  const handleSignOut = () => {
    clearStoredAuth();
    setAuthObj(getStoredAuth());
    setActivePage('home');
  };

  const handleOpenDashboard = () => {
    if (!authObj?.token) {
      setShowAuthModal(true);
    } else {
      setActivePage('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenLegal = (docType) => {
    setLegalDocType(docType);
    setActivePage('legal');
  };

  const handleAuthSuccess = (newAuth) => {
    setAuthObj(newAuth);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        authObj={authObj}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenDashboard={handleOpenDashboard}
        onSignOut={handleSignOut}
      />

      <div style={{ flex: 1 }}>
        {activePage === 'home' && (
          <HomePage onNavigate={(page) => setActivePage(page)} />
        )}

        {activePage === 'about' && (
          <AboutPage onNavigate={(page) => setActivePage(page)} />
        )}

        {activePage === 'solutions' && (
          <SolutionsPage onNavigate={(page) => setActivePage(page)} />
        )}

        {activePage === 'tournaments' && (
          <TournamentsPage
            tournaments={tournaments}
            loadingTournaments={loadingTournaments}
            authObj={authObj}
            onRequireAuth={() => setShowAuthModal(true)}
            onViewDashboard={handleOpenDashboard}
          />
        )}

        {activePage === 'venues' && (
          <VenuesPage onNavigate={(page) => setActivePage(page)} />
        )}

        {activePage === 'contact' && (
          <ContactPage />
        )}

        {activePage === 'legal' && (
          <LegalPage
            docType={legalDocType}
            onBack={() => setActivePage('home')}
          />
        )}

        {activePage === 'dashboard' && (
          <UserDashboard
            authObj={authObj}
            onSignOut={handleSignOut}
            onBrowseTournaments={() => setActivePage('tournaments')}
            onUpdateAuth={(updatedUser) => {
              setAuthObj({ ...authObj, user: updatedUser });
            }}
          />
        )}
      </div>

      <Footer
        onNavigate={(page) => setActivePage(page)}
        onOpenLegal={handleOpenLegal}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
