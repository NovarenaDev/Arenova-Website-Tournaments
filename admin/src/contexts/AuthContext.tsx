import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AdminUser, Permission, AdminRole } from '../types';
import { ROLE_PERMISSIONS } from '../types';
import { adminLogin, adminGetMe } from '../api';
import { setAdminToken, getAdminToken } from '../api/client';

interface AuthContextType {
  admin:         AdminUser | null;
  loading:       boolean;
  login:         (email: string, password: string) => Promise<void>;
  logout:        () => void;
  hasPermission: (p: Permission) => boolean;
  can:           (p: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY   = 'kridext_admin_token';
const REFRESH_KEY = 'kridext_admin_refresh_token';
const USER_KEY    = 'kridext_admin';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        try { return JSON.parse(stored); } catch {}
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const stored = localStorage.getItem(USER_KEY);
      if (token) {
        setAdminToken(token);
        if (stored) {
          try { setAdmin(JSON.parse(stored)); } catch {}
        }
        try {
          const res = await adminGetMe();
          const adminData = res?.data || res;
          if (adminData && (adminData.id || adminData._id || adminData.email)) {
            setAdmin(adminData);
            localStorage.setItem(USER_KEY, JSON.stringify(adminData));
          }
        } catch (err: any) {
          console.warn('Session check warning:', err?.message || err);
          if (err?.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_KEY);
            localStorage.removeItem(USER_KEY);
            setAdmin(null);
            setAdminToken(null);
          }
        }
      }
      setLoading(false);
    };
    restore();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await adminLogin(email, password);
    const token = res.token;
    const refreshToken = res.refreshToken || res.data?.refreshToken;
    const adminData = res.data;
    setAdminToken(token);
    setAdmin(adminData);
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(REFRESH_KEY, refreshToken);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(adminData));
  };

  const logout = () => {
    setAdmin(null);
    setAdminToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const hasPermission = (p: Permission): boolean => {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;
    if (Array.isArray(admin.permissions) && admin.permissions.length > 0) {
      return admin.permissions.includes(p);
    }
    return ROLE_PERMISSIONS[admin.role]?.includes(p) ?? false;
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, hasPermission, can: hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

