import logo from '../images/arenova_logo.png';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Users, UserCheck, CalendarDays,
  TrendingUp, Star, Trophy, Shield, Settings, LogOut,
  Medal, MapPin, MessageSquare, Mail, History
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS, ROLE_COLORS } from '../../types';
import { Badge } from '../ui';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  permission?: string;
  superAdminOnly?: boolean;
  group?: string;
}

const NAV: NavItem[] = [
  { href:'/dashboard',    label:'Dashboard',      icon:LayoutDashboard, permission:'dashboard' },
  { href:'/customers',    label:'Customers',      icon:Users,           permission:'customers',  group:'Users' },
  { href:'/coaches',      label:'Coaches',        icon:UserCheck,       permission:'coaches',    group:'Users' },
  { href:'/bookings',     label:'Bookings',       icon:CalendarDays,    permission:'bookings',   group:'Activity' },
  { href:'/payments',     label:'Payments',       icon:TrendingUp,      permission:'payments',   group:'Activity' },
  { href:'/ratings',      label:'Ratings',        icon:Star,            permission:'ratings',    group:'Activity' },
  { href:'/audit-logs',   label:'Audit Logs',     icon:History,         superAdminOnly:true,     group:'Activity' },
  { href:'/tournaments',  label:'Tournaments',    icon:Medal,           permission:'sports',     group:'Content' },
  { href:'/community',    label:'Community',      icon:MessageSquare,   permission:'sports',     group:'Content' },
  { href:'/venues',       label:'Venues',         icon:MapPin,          permission:'sports',     group:'Content' },
  { href:'/sports',       label:'Sports',         icon:Trophy,          permission:'sports',     group:'Content' },
  { href:'/admins',       label:'Manage Admins',  icon:Shield,          permission:'admins' },
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { admin, logout, hasPermission } = useAuth();
  const location = useLocation();
  const initials = admin ? `${admin.firstName[0]}${admin.lastName[0]}` : 'AD';

  const visibleNav = NAV.filter(n => {
    if (n.superAdminOnly) {
      return admin?.role === 'super_admin';
    }
    return n.permission ? hasPermission(n.permission as any) : true;
  });

  // Group items for section labels
  const groups = ['', 'Users', 'Activity', 'Content'];
  const groupLabels: Record<string, string> = {
    'Users': 'USERS',
    'Activity': 'ACTIVITY',
    'Content': 'CONTENT',
  };

  return (
    <aside className={clsx(
      "fixed inset-y-0 left-0 z-50 flex h-screen w-[220px] flex-shrink-0 flex-col border-r border-[#e5e7eb] bg-white transition-transform duration-200 md:static md:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-4 py-[18px]">
        <img src={logo} alt="Arenova Logo" className="h-8 w-auto object-contain flex-shrink-0" />
        <div>
          <p className="text-[10px] text-[#9ba3af]">Admin Panel</p>
        </div>
      </div>

      {/* Role badge */}
      {admin && (
        <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
          <Badge className={ROLE_COLORS[admin.role]}>{ROLE_LABELS[admin.role]}</Badge>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map(group => {
          const items = visibleNav.filter(n => (n.group || '') === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="mb-2">
              {group && (
                <p className="px-3 pt-2 pb-1 text-[9px] font-semibold tracking-wider text-[#5c6370] uppercase">{groupLabels[group]}</p>
              )}
              {items.map(item => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={clsx('sidebar-item mb-0.5', active ? 'sidebar-item-active' : 'sidebar-item-inactive')}
                  >
                    <Icon className={clsx('h-3.5 w-3.5 flex-shrink-0', active ? 'opacity-100' : 'opacity-60')} />
                    <span className="flex-1 leading-none">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#e5e7eb] px-2 py-3 space-y-0.5">
        {hasPermission('customers') && (
          <Link
            to="/enquiries"
            onClick={onClose}
            className={clsx(
              'sidebar-item mb-0.5',
              location.pathname.startsWith('/enquiries') ? 'sidebar-item-active' : 'sidebar-item-inactive'
            )}
          >
            <Mail className={clsx('h-3.5 w-3.5 flex-shrink-0', location.pathname.startsWith('/enquiries') ? 'opacity-100' : 'opacity-60')} />
            <span className="flex-1 leading-none">Customer Enquiries</span>
          </Link>
        )}
        <Link
          to="/settings"
          onClick={onClose}
          className={clsx(
            'sidebar-item',
            location.pathname.startsWith('/settings') ? 'sidebar-item-active' : 'sidebar-item-inactive'
          )}
        >
          <Settings className={clsx('h-3.5 w-3.5 flex-shrink-0', location.pathname.startsWith('/settings') ? 'opacity-100' : 'opacity-60')} />
          <span className="flex-1 leading-none">Settings</span>
        </Link>
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 mt-1">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F05A22]/15 text-[10px] font-bold text-[#F05A22] ring-1 ring-[#F05A22]/30">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-white">{admin?.firstName} {admin?.lastName}</p>
            <p className="truncate text-[10px] text-[#9ba3af]">{admin?.email}</p>
          </div>
          <button onClick={logout} title="Logout" className="text-[#5c6370] hover:text-red-400 transition-colors">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
