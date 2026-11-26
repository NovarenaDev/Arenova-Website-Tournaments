import logo from '../images/arenova_logo.png';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Users, UserCheck, CalendarDays,
  TrendingUp, Star, Trophy, Shield, Settings, LogOut,
  Medal, MapPin, MessageSquare, Mail, History, Scale, ImageIcon, Bell
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
  { href:'/settlements',  label:'Settlements',    icon:Scale,           permission:'payments',   group:'Activity' },
  { href:'/ratings',      label:'Ratings',        icon:Star,            permission:'ratings',    group:'Activity' },
  { href:'/audit-logs',   label:'Audit Logs',     icon:History,         superAdminOnly:true,     group:'Activity' },
  { href:'/tournaments',  label:'Tournaments',    icon:Medal,           permission:'sports',     group:'Content' },
  { href:'/community',    label:'Community',      icon:MessageSquare,   permission:'sports',     group:'Content' },
  { href:'/venues',       label:'Venues',         icon:MapPin,          permission:'sports',     group:'Content' },
  { href:'/sports',       label:'Sports',         icon:Trophy,          permission:'sports',     group:'Content' },
  { href:'/banners',      label:'Banners',        icon:ImageIcon,       permission:'sports',     group:'Content' },
  { href:'/notifications',label:'Notifications',  icon:Bell,            permission:'sports',     group:'Content' },
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

  const groups = ['', 'Users', 'Activity', 'Content'];
  const groupLabels: Record<string, string> = {
    'Users': 'USERS',
    'Activity': 'ACTIVITY',
    'Content': 'CONTENT',
  };

  return (
    <aside
      style={{ background: 'linear-gradient(180deg, #0b1c3d 0%, #07142e 55%, #050d1f 100%)' }}
      className={clsx(
        "fixed inset-y-0 left-0 z-50 flex h-screen w-[224px] flex-shrink-0 flex-col border-r border-slate-800/60 text-white transition-transform duration-200 md:static md:translate-x-0 shadow-xl",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >

      <div className="flex flex-col items-center justify-center gap-1.5 border-b border-white/10 px-4 py-3.5">
        <div className="rounded-xl bg-white/95 px-3 py-1.5 shadow-sm ring-1 ring-white/25">
          <img src={logo} alt="Arenova Logo" className="h-6 w-auto object-contain" />
        </div>
        <p className="text-[10px] text-slate-300/90 font-semibold tracking-wider uppercase">Admin Panel</p>
      </div>

      {admin && (
        <div className="px-4 py-2.5 border-b border-white/10">
          <Badge className="bg-white/10 text-amber-300 border-white/15">{ROLE_LABELS[admin.role] || admin.role}</Badge>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {groups.map(group => {
          const items = visibleNav.filter(n => (n.group || '') === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="mb-2.5">
              {group && (
                <p className="px-3 pt-2 pb-1 text-[9px] font-semibold tracking-wider text-slate-400/80 uppercase">{groupLabels[group]}</p>
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
                    <Icon className={clsx('h-3.5 w-3.5 flex-shrink-0', active ? 'text-white opacity-100' : 'text-slate-300/75')} />
                    <span className="flex-1 leading-none">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-2.5 py-3 space-y-0.5">
        {hasPermission('customers') && (
          <Link
            to="/enquiries"
            onClick={onClose}
            className={clsx(
              'sidebar-item mb-0.5',
              location.pathname.startsWith('/enquiries') ? 'sidebar-item-active' : 'sidebar-item-inactive'
            )}
          >
            <Mail className={clsx('h-3.5 w-3.5 flex-shrink-0', location.pathname.startsWith('/enquiries') ? 'text-white opacity-100' : 'text-slate-300/75')} />
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
          <Settings className={clsx('h-3.5 w-3.5 flex-shrink-0', location.pathname.startsWith('/settings') ? 'text-white opacity-100' : 'text-slate-300/75')} />
          <span className="flex-1 leading-none">Settings</span>
        </Link>
        <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 mt-1.5 bg-white/5 border border-white/10">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/25 text-[10px] font-bold text-blue-200 ring-1 ring-blue-400/40">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-white">{admin?.firstName} {admin?.lastName}</p>
            <p className="truncate text-[10px] text-slate-300/75">{admin?.email}</p>
          </div>
          <button onClick={logout} title="Logout" className="text-slate-300/75 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-white/10 cursor-pointer">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

