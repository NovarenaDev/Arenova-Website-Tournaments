import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header }  from './Header';
import type { Permission } from '../../types';

export function Layout() {
  const { admin, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0e0f11]"><div className="h-8 w-8 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" /></div>;
  if (!admin)  return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0e0f11] relative">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Responsive Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header with hamburger toggle */}
        <Header onMenuClick={() => setSidebarOpen(prev => !prev)} />
        <main className="flex-1 overflow-y-auto bg-gray-50"><Outlet /></main>
      </div>
    </div>
  );
}

export function ProtectedRoute({ permission }: { permission: Permission }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 bg-gray-50">
        <span style={{fontSize:48}} className="mb-4">🔒</span>
        <h2 className="text-lg font-semibold text-white mb-2">Access Restricted</h2>
        <p className="text-sm text-[#5c6370]">You don't have permission to view this page.</p>
        <p className="text-xs text-[#5c6370] mt-1">Contact your Super Admin for access.</p>
      </div>
    );
  }
  return <Outlet />;
}
