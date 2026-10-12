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

const TOKEN_KEY = 'kridext_admin_token';
const USER_KEY  = 'kridext_admin';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin]     = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      const token  = localStorage.getItem(TOKEN_KEY);
      const stored = localStorage.getItem(USER_KEY);
      if (token && stored) {
        try {
          setAdminToken(token);
          // Try to refresh admin data from API; fall back to cached if offline
          try {
            const res = await adminGetMe();
            const adminData = res.data;
            setAdmin(adminData);
            localStorage.setItem(USER_KEY, JSON.stringify(adminData));
          } catch {
            // API unreachable – use cached
            setAdmin(JSON.parse(stored));
          }
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
      setLoading(false);
    };
    restore();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await adminLogin(email, password);
    const token = res.token;
    const adminData = res.data;
    setAdminToken(token);
    setAdmin(adminData);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(adminData));
  };

  const logout = () => {
    setAdmin(null);
    setAdminToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const hasPermission = (p: Permission): boolean => {
    if (!admin) return false;
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
