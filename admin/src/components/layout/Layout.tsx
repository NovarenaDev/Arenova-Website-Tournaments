import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header }  from './Header';
import type { Permission } from '../../types';

export function Layout() {
  const { admin, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    const handler = () => {
      setRateLimited(true);
      const timer = setTimeout(() => setRateLimited(false), 8000);
      return () => clearTimeout(timer);
    };
    window.addEventListener('api:ratelimit', handler);
    return () => window.removeEventListener('api:ratelimit', handler);
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" /></div>;
  if (!admin)  return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Responsive Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header with hamburger toggle */}
        <Header onMenuClick={() => setSidebarOpen(prev => !prev)} />
        {rateLimited && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-800 flex items-center justify-between">
            <span>⚠️ <strong>Server Rate Limit Active (HTTP 429)</strong>: The remote server is temporarily throttling requests from this IP. Please pause for 1-2 minutes for the window to reset.</span>
            <button onClick={() => setRateLimited(false)} className="text-amber-700 font-bold ml-2 hover:text-amber-900">✕</button>
          </div>
        )}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-slate-50/60"><Outlet /></main>
      </div>
    </div>
  );
}

export function ProtectedRoute({ permission }: { permission: Permission }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 bg-slate-50">
        <span style={{fontSize:48}} className="mb-4">🔒</span>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-500">You don't have permission to view this page.</p>
        <p className="text-xs text-slate-400 mt-1">Contact your Super Admin for access.</p>
      </div>
    );
  }
  return <Outlet />;
}
