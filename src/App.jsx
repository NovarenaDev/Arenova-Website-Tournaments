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
import PaymentModal from './components/TournamentBooking/PaymentModal';
import DownloadAppModal from './components/DownloadAppModal';
import WhatsAppButton from './components/WhatsAppButton';
import SEOHead from './components/SEOHead';
import { api, getStoredAuth, clearStoredAuth } from './utils/api';

// Parse current URL path for direct access without login
const parseRouteFromLocation = () => {
  const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  if (path === '/contact') {
    return { page: 'contact', legalType: null };
  }
  if (path === '/terms-and-conditions' || path === '/terms') {
    return { page: 'legal', legalType: 'terms' };
  }
  if (path === '/privacy-policy' || path === '/privacy') {
    return { page: 'legal', legalType: 'privacy' };
  }
  if (path === '/refund-cancellation-policy' || path === '/refund') {
    return { page: 'legal', legalType: 'refund' };
  }
  if (path === '/tournaments') {
    return { page: 'tournaments', legalType: null };
  }
  if (path === '/venues') {
    return { page: 'venues', legalType: null };
  }
  if (path === '/about') {
    return { page: 'about', legalType: null };
  }
  if (path === '/solutions') {
    return { page: 'solutions', legalType: null };
  }
  if (path === '/dashboard') {
    return { page: 'dashboard', legalType: null };
  }
  if (path === '/admin') {
    window.location.replace('/admin/');
    return { page: 'home', legalType: null };
  }
  return { page: 'home', legalType: null };
};

export default function App() {
  const initialRoute = parseRouteFromLocation();
  const [activePage, setActivePageState] = useState(initialRoute.page);
  const [legalDocType, setLegalDocType] = useState(initialRoute.legalType || 'terms');
  const [authObj, setAuthObj] = useState(getStoredAuth());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [tournamentsError, setTournamentsError] = useState('');

  // Centralized navigation that keeps browser URL and history in sync
  const navigateTo = (target, customDocType = null) => {
    let newPage = target;
    let newDocType = customDocType;
    let newPath = '/';

    if (target === '/contact' || target === 'contact') {
      newPage = 'contact';
      newPath = '/contact';
    } else if (target === '/terms-and-conditions' || target === 'terms' || (target === 'legal' && (newDocType === 'terms' || !newDocType))) {
      newPage = 'legal';
      newDocType = newDocType || 'terms';
      newPath = '/terms-and-conditions';
    } else if (target === '/privacy-policy' || target === 'privacy' || (target === 'legal' && newDocType === 'privacy')) {
      newPage = 'legal';
      newDocType = 'privacy';
      newPath = '/privacy-policy';
    } else if (target === '/refund-cancellation-policy' || target === 'refund' || (target === 'legal' && newDocType === 'refund')) {
      newPage = 'legal';
      newDocType = 'refund';
      newPath = '/refund-cancellation-policy';
    } else if (target === '/tournaments' || target === 'tournaments') {
      newPage = 'tournaments';
      newPath = '/tournaments';
    } else if (target === '/venues' || target === 'venues') {
      newPage = 'venues';
      newPath = '/venues';
    } else if (target === '/about' || target === 'about') {
      newPage = 'about';
      newPath = '/about';
    } else if (target === '/solutions' || target === 'solutions') {
      newPage = 'solutions';
      newPath = '/solutions';
    } else if (target === '/dashboard' || target === 'dashboard') {
      newPage = 'dashboard';
      newPath = '/dashboard';
    } else if (target === '/admin' || target === 'admin') {
      window.location.href = '/admin/';
      return;
    } else {
      newPage = 'home';
      newPath = '/';
    }

    setActivePageState(newPage);
    if (newDocType) setLegalDocType(newDocType);

    if (window.location.pathname !== newPath) {
      window.history.pushState({ page: newPage, legalType: newDocType }, '', newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync state on browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const route = parseRouteFromLocation();
      setActivePageState(route.page);
      if (route.legalType) {
        setLegalDocType(route.legalType);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch tournaments from API - strictly backend data without any mock/duplicate fallback
  const fetchTournaments = async () => {
    setLoadingTournaments(true);
    setTournamentsError('');
    try {
      const data = await api.getTournaments();
      const extractList = (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.tournaments)) return res.tournaments;
        if (res.data && typeof res.data === 'object') {
          if (Array.isArray(res.data.tournaments)) return res.data.tournaments;
          if (Array.isArray(res.data.data)) return res.data.data;
          for (const v of Object.values(res.data)) {
            if (Array.isArray(v)) return v;
          }
        }
        for (const v of Object.values(res)) {
          if (Array.isArray(v)) return v;
        }
        return [];
      };

      const rawList = extractList(data);
      // Strictly deduplicate by ID so no tournament ever appears twice
      const seen = new Set();
      const uniqueList = [];
      for (const t of rawList) {
        const id = t._id || t.id;
        if (id && !seen.has(id)) {
          seen.add(id);
          uniqueList.push(t);
        } else if (!id) {
          uniqueList.push(t);
        }
      }
      setTournaments(uniqueList);
    } catch (err) {
      console.warn('Tournaments fetch error:', err?.message || err);
      setTournaments([]);
      setTournamentsError(err.message || 'Unable to load tournaments from server.');
    } finally {
      setLoadingTournaments(false);
    }
  };

  useEffect(() => {
    // Clear any stale mock tokens and dummy registration caches
    try {
      localStorage.removeItem('arenova_confirmed_registrations');
      localStorage.removeItem('arenova_permanent_uid');
    } catch (e) {
      // Ignore storage access errors
    }
    const currentAuth = getStoredAuth();
    if (currentAuth?.token && (!currentAuth.token.includes('.') || currentAuth.token.startsWith('mock_') || currentAuth.token.startsWith('arenova_token_'))) {
      clearStoredAuth();
      setAuthObj(getStoredAuth());
    } else if (currentAuth?.token) {
      // Always sync live user profile from database on load
      api.getCurrentUser().then(res => {
        const userData = res?.data || res?.user || res;
        if (userData && (userData._id || userData.id || userData.phone || userData.email)) {
          setAuthObj(prev => ({ ...prev, user: userData }));
        }
      }).catch(() => {});
    }
    fetchTournaments();
  }, []);

  const [dashboardPayment, setDashboardPayment] = useState(null);

  const handleSignOut = () => {
    clearStoredAuth();
    setAuthObj(getStoredAuth());
    navigateTo('home');
  };

  const handleOpenDashboard = () => {
    if (!authObj?.token) {
      setShowAuthModal(true);
    } else {
      navigateTo('dashboard');
    }
  };

  const handleOpenLegal = (docType, customPath) => {
    navigateTo(customPath || docType || 'terms', docType);
  };

  const handleAuthSuccess = (newAuth) => {
    setAuthObj(newAuth);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SEOHead activePage={activePage} legalDocType={legalDocType} />
      <Navbar
        activePage={activePage}
        setActivePage={navigateTo}
        authObj={authObj}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenDashboard={handleOpenDashboard}
        onSignOut={handleSignOut}
        onOpenDownloadModal={() => setShowDownloadModal(true)}
      />

      <div style={{ flex: 1 }}>
        {activePage === 'home' && (
          <HomePage onNavigate={(page) => navigateTo(page)} />
        )}

        {activePage === 'about' && (
          <AboutPage onNavigate={(page) => navigateTo(page)} />
        )}

        {activePage === 'solutions' && (
          <SolutionsPage onNavigate={(page) => navigateTo(page)} />
        )}

        {activePage === 'tournaments' && (
          <TournamentsPage
            tournaments={tournaments}
            loadingTournaments={loadingTournaments}
            tournamentsError={tournamentsError}
            onRetryTournaments={fetchTournaments}
            authObj={authObj}
            onRequireAuth={() => setShowAuthModal(true)}
            onViewDashboard={handleOpenDashboard}
          />
        )}

        {activePage === 'venues' && (
          <VenuesPage onNavigate={(page) => navigateTo(page)} />
        )}

        {activePage === 'contact' && (
          <ContactPage />
        )}

        {activePage === 'legal' && (
          <LegalPage
            docType={legalDocType}
            onNavigateLegal={(type) => handleOpenLegal(type)}
            onBack={() => navigateTo('home')}
          />
        )}

        {activePage === 'dashboard' && (
          <UserDashboard
            authObj={authObj}
            onSignOut={handleSignOut}
            onBrowseTournaments={() => navigateTo('tournaments')}
            onUpdateAuth={(updatedUser) => {
              const currentAuth = getStoredAuth();
              if (currentAuth?.token) {
                setStoredAuth(currentAuth.token, currentAuth.refreshToken, updatedUser);
              }
              setAuthObj(prev => ({ ...prev, user: updatedUser }));
            }}
            onOpenDownloadModal={() => setShowDownloadModal(true)}
            onPayPendingRegistration={(reg) => setDashboardPayment(reg)}
          />
        )}
      </div>

      <Footer
        onNavigate={(page) => navigateTo(page)}
        onOpenLegal={handleOpenLegal}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <DownloadAppModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />

      {dashboardPayment && (
        <PaymentModal
          registration={dashboardPayment}
          order={dashboardPayment.order}
          tournament={dashboardPayment.tournament}
          selectedFee={dashboardPayment.amount || dashboardPayment.tournament?.registrationFee || 500}
          onClose={() => setDashboardPayment(null)}
          onPaymentComplete={() => {
            setDashboardPayment(null);
            navigateTo('dashboard');
          }}
          onViewDashboard={() => setDashboardPayment(null)}
        />
      )}

      <WhatsAppButton />
    </div>
  );
}
