import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout, ProtectedRoute } from './components/layout/Layout';

import LoginPage        from './pages/auth/LoginPage';
import DashboardPage    from './pages/dashboard/DashboardPage';
import CustomersPage    from './pages/customers/CustomersPage';
import EnquiriesPage    from './pages/enquiries/EnquiriesPage';
import CoachesPage      from './pages/coaches/CoachesPage';
import BookingsPage     from './pages/bookings/BookingsPage';
import PaymentsPage     from './pages/payments/PaymentsPage';
import RatingsPage      from './pages/ratings/RatingsPage';
import SportsPage       from './pages/sports/SportsPage';
import AdminsPage       from './pages/admins/AdminsPage';
import AuditLogsPage    from './pages/audit/AuditLogsPage';
import TournamentsPage  from './pages/tournaments/TournamentsPage';
import CommunityPage    from './pages/community/CommunityPage';
import VenuesPage       from './pages/venues/VenuesPage';
import SettingsPage     from './pages/settings/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/admin" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — all require auth (Layout checks) */}
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route element={<ProtectedRoute permission="customers" />}>
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/enquiries" element={<EnquiriesPage />} />
            </Route>

            <Route element={<ProtectedRoute permission="coaches" />}>
              <Route path="/coaches" element={<CoachesPage />} />
            </Route>

            <Route element={<ProtectedRoute permission="bookings" />}>
              <Route path="/bookings" element={<BookingsPage />} />
            </Route>

            <Route element={<ProtectedRoute permission="payments" />}>
              <Route path="/payments" element={<PaymentsPage />} />
            </Route>

            <Route element={<ProtectedRoute permission="ratings" />}>
              <Route path="/ratings" element={<RatingsPage />} />
            </Route>

            <Route element={<ProtectedRoute permission="sports" />}>
              <Route path="/sports"       element={<SportsPage />} />
              <Route path="/tournaments"  element={<TournamentsPage />} />
              <Route path="/community"    element={<CommunityPage />} />
              <Route path="/venues"       element={<VenuesPage />} />
            </Route>

            <Route element={<ProtectedRoute permission="admins" />}>
              <Route path="/admins" element={<AdminsPage />} />
            </Route>

            <Route path="/audit-logs" element={<AuditLogsPage />} />

            <Route path="/settings" element={<SettingsPage />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
