import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Download, Calendar, Menu, Trash2, CheckSquare } from 'lucide-react';
import { getMyNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';
import dashboardHeaderBg from '../images/headers/dashboard-header.jpg';
import customersHeaderBg from '../images/headers/customers-header.jpg';
import coachesHeaderBg from '../images/headers/coaches-header.jpg';
import tournamentsHeaderBg from '../images/headers/tournaments-header.jpg';
import bookingsHeaderBg from '../images/headers/bookings-header.jpg';
import paymentsHeaderBg from '../images/headers/payments-header.jpg';
import settlementsHeaderBg from '../images/headers/settlements-header.jpg';
import ratingsHeaderBg from '../images/headers/ratings-header.jpg';
import sportsHeaderBg from '../images/headers/sports-header.jpg';
import venuesHeaderBg from '../images/headers/venues-header.jpg';
import communityHeaderBg from '../images/headers/community-header.jpg';
import bannersHeaderBg from '../images/headers/banners-header.jpg';
import notificationsHeaderBg from '../images/headers/notifications-header.jpg';
import adminsHeaderBg from '../images/headers/admins-header.jpg';
import auditHeaderBg from '../images/headers/audit-header.jpg';
import enquiriesHeaderBg from '../images/headers/enquiries-header.jpg';
import settingsHeaderBg from '../images/headers/settings-header.jpg';

const TITLES: Record<string, string> = {
  '/dashboard':   'Dashboard',
  '/customers':   'Customer Management',
  '/coaches':     'Coach Management',
  '/bookings':    'Bookings Management',
  '/payments':    'Payments & Payouts',
  '/settlements': 'Review & Settlement Tools',
  '/disputes':    'Dispute Queue & Arbitration',
  '/withdrawals': 'Withdrawals Review',
  '/refunds':     'Refund Operations',
  '/ratings':     'Ratings & Reviews',
  '/sports':      'Sports Management',
  '/tournaments': 'Tournaments',
  '/community':   'Community Centers',
  '/venues':      'Venues',
  '/banners':       'App Banners Management',
  '/notifications': 'Push Notifications & Broadcasts',
  '/admins':        'Manage Admins',
  '/audit-logs':  'Admin Activity / Audit Logs',
  '/enquiries':   'Customer Enquiries',
  '/settings':    'Settings',
};

const SUBTITLES: Record<string, string> = {
  '/dashboard':     "Welcome back! Here's what's happening on Arenova.",
  '/customers':     'Manage all players, parents and community members on Arenova.',
  '/coaches':       'Manage coaches, verify KYC, track performance and grow your coaching community.',
  '/bookings':      'Track coaching sessions, schedules and booking statuses.',
  '/payments':      'Monitor transactions, payouts and platform revenue.',
  '/settlements':   'Review coach settlements and payout batches.',
  '/disputes':      'Resolve booking and payment disputes fairly.',
  '/withdrawals':   'Review and process coach withdrawal requests.',
  '/refunds':       'Manage customer refund requests and statuses.',
  '/ratings':       'Monitor player ratings, reviews and feedback.',
  '/sports':        'Configure supported sports and platform categories.',
  '/tournaments':   'Create, manage and track all tournaments across different sports on Arenova.',
  '/community':     'Manage community centers and local hubs.',
  '/venues':        'Manage partner sports venues and facilities.',
  '/banners':       'Manage promotional banners across the Arenova app.',
  '/notifications': 'Send push notifications and broadcasts to users.',
  '/admins':        'Invite, manage and configure permissions for admin accounts.',
  '/audit-logs':    'Inspect administrative actions and security logs.',
  '/enquiries':     'Respond to customer support enquiries and requests.',
  '/settings':      'Configure platform and account preferences.',
};

const HEADER_BGS: Record<string, string> = {
  '/dashboard':     dashboardHeaderBg,
  '/customers':     customersHeaderBg,
  '/coaches':       coachesHeaderBg,
  '/tournaments':   tournamentsHeaderBg,
  '/bookings':      bookingsHeaderBg,
  '/payments':      paymentsHeaderBg,
  '/settlements':   settlementsHeaderBg,
  '/withdrawals':   settlementsHeaderBg,
  '/refunds':       settlementsHeaderBg,
  '/disputes':      settlementsHeaderBg,
  '/ratings':       ratingsHeaderBg,
  '/sports':        sportsHeaderBg,
  '/venues':        venuesHeaderBg,
  '/community':     communityHeaderBg,
  '/banners':       bannersHeaderBg,
  '/notifications': notificationsHeaderBg,
  '/admins':        adminsHeaderBg,
  '/audit-logs':    auditHeaderBg,
  '/enquiries':     enquiriesHeaderBg,
  '/settings':      settingsHeaderBg,
};

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const location = useLocation();
  const { admin } = useAuth();
  const key = Object.keys(TITLES).find(k => location.pathname.startsWith(k)) || '/dashboard';
  const title = TITLES[key] || 'Dashboard';
  const subtitle = SUBTITLES[key] || '';
  const headerBg = HEADER_BGS[key] || dashboardHeaderBg;
  const adminInitials = admin?.name
    ? admin.name.trim().split(/\s+/).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SA';
  const roleLabel = admin?.role === 'super_admin' ? 'Super Admin' : 'Admin';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [todayOnly, setTodayOnly] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTodayOnly(false);
  }, [location.pathname]);

  const READ_IDS_KEY = 'kridext_admin_read_notifs';
  const READ_ALL_TS_KEY = 'kridext_admin_read_all_ts';
  const DISMISSED_IDS_KEY = 'kridext_admin_dismissed_notifs';

  const getLocalReadState = () => {
    try {
      const ids = JSON.parse(localStorage.getItem(READ_IDS_KEY) || '[]');
      const dismissed = JSON.parse(localStorage.getItem(DISMISSED_IDS_KEY) || '[]');
      const allTs = Number(localStorage.getItem(READ_ALL_TS_KEY) || '0');
      return {
        ids: new Set<string>(Array.isArray(ids) ? ids : []),
        dismissed: new Set<string>(Array.isArray(dismissed) ? dismissed : []),
        allTs
      };
    } catch {
      return { ids: new Set<string>(), dismissed: new Set<string>(), allTs: 0 };
    }
  };

  const lastNotifFetchRef = useRef<number>(0);
  const rateLimitUntilRef = useRef<number>(0);

  useEffect(() => {
    const onRateLimit = () => {
      rateLimitUntilRef.current = Date.now() + 90_000;
    };
    window.addEventListener('api:ratelimit', onRateLimit);
    return () => window.removeEventListener('api:ratelimit', onRateLimit);
  }, []);

  const loadNotifications = async (force = false) => {
    const now = Date.now();
    if (!force && now < rateLimitUntilRef.current) return;
    if (!force && now - lastNotifFetchRef.current < 45_000) return;
    lastNotifFetchRef.current = now;
    try {
      const res = await getMyNotifications();
      const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const { ids: localReadIds, dismissed: localDismissedIds, allTs } = getLocalReadState();

      const seenIds = new Set<string>();
      const byId: any[] = [];
      for (const item of raw) {
        const id = item?.id || item?._id;
        const contentKey = `${(item.title || '').trim()}||${(item.body || item.message || '').trim()}`;
        if (id && localDismissedIds.has(String(id))) continue;
        if (localDismissedIds.has(contentKey)) continue;
        if (id && seenIds.has(String(id))) continue;
        if (id) seenIds.add(String(id));

        const createdMs = item?.createdAt ? new Date(item.createdAt).getTime() : 0;
        const isBackendRead = Boolean(item.read ?? item.isRead);
        const isLocalRead =
          (id && localReadIds.has(String(id))) ||
          localReadIds.has(contentKey) ||
          (allTs > 0 && (createdMs === 0 || createdMs <= allTs));

        if (isBackendRead || isLocalRead) continue;

        byId.push({
          ...item,
          id: id || `${item.title}-${item.createdAt || Math.random()}`,
          contentKey,
          read: false,
        });
      }

      const contentMap = new Map<string, any>();
      for (const item of byId) {
        const existing = contentMap.get(item.contentKey);
        if (!existing) {
          contentMap.set(item.contentKey, {
            ...item,
            body: item.body || item.message || '',
            duplicateIds: item._id || item.id ? [String(item._id || item.id)] : [],
          });
        } else {
          if (item._id || item.id) existing.duplicateIds.push(String(item._id || item.id));
          const existingTs = existing.createdAt ? new Date(existing.createdAt).getTime() : 0;
          const itemTs = item.createdAt ? new Date(item.createdAt).getTime() : 0;
          if (itemTs > existingTs) existing.createdAt = item.createdAt;
          existing.read = existing.read && item.read;
        }
      }

      const deduped = Array.from(contentMap.values()).sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });

      setNotifications(deduped);
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    loadNotifications(true);
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadNotifications();
      }
    }, 120_000);
    const onFocus = () => loadNotifications();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkOneRead = async (n: any) => {
    const id = n.id || n._id;
    const allIds: string[] = Array.isArray(n.duplicateIds) && n.duplicateIds.length ? n.duplicateIds : (id ? [String(id)] : []);
    setNotifications(prev => prev.filter(item => (item.id || item._id) !== id));
    try {
      const { ids } = getLocalReadState();
      allIds.forEach(dId => ids.add(dId));
      if (n.contentKey) ids.add(n.contentKey);
      localStorage.setItem(READ_IDS_KEY, JSON.stringify(Array.from(ids).slice(-200)));
    } catch {}
    for (const dId of allIds.slice(0, 5)) {
      markNotificationRead(dId).catch(() => {});
    }
  };

  const handleMarkAllRead = async () => {
    const current = notifications;
    setNotifications([]);
    try {
      localStorage.setItem(READ_ALL_TS_KEY, String(Date.now()));
      const { ids } = getLocalReadState();
      current.forEach(n => {
        if (n.contentKey) ids.add(n.contentKey);
        (n.duplicateIds || []).forEach((dId: string) => ids.add(dId));
      });
      localStorage.setItem(READ_IDS_KEY, JSON.stringify(Array.from(ids).slice(-200)));
    } catch {}
    try {
      await markAllNotificationsRead();
    } catch {

    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, n: any) => {
    e.stopPropagation();
    const id = n.id || n._id;
    const allIds: string[] = Array.isArray(n.duplicateIds) && n.duplicateIds.length ? n.duplicateIds : (id ? [String(id)] : []);
    setNotifications(prev => prev.filter(item => (item.id || item._id) !== id));
    try {
      const { dismissed } = getLocalReadState();
      allIds.forEach(dId => dismissed.add(dId));
      if (n.contentKey) dismissed.add(n.contentKey);
      localStorage.setItem(DISMISSED_IDS_KEY, JSON.stringify(Array.from(dismissed).slice(-200)));
    } catch {}
    for (const dId of allIds.slice(0, 5)) {
      deleteNotification(dId).catch(() => {});
    }
  };

  const handleToggleToday = () => {
    const next = !todayOnly;
    setTodayOnly(next);
    window.dispatchEvent(new CustomEvent('arenova:today-filter', { detail: { active: next } }));
  };

  const handleExportClick = () => {
    window.dispatchEvent(new CustomEvent('arenova:export', { detail: { path: location.pathname } }));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="relative flex min-h-[88px] sm:min-h-[100px] flex-shrink-0 items-center justify-between bg-[#eef3fa] px-4 sm:px-6 py-3 overflow-visible">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src={headerBg}
          alt=""
          className="h-full w-full object-cover object-center opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#eef4fb]/75 via-[#eef4fb]/20 via-25% to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-b from-transparent to-[#eef2f7]/80" />
      </div>

      <div className="relative z-10 flex items-center gap-3 min-w-0 mr-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl p-2 hover:bg-white/80 md:hidden cursor-pointer flex items-center justify-center border border-slate-200/80 bg-white/90 flex-shrink-0 shadow-xs"
        >
          <Menu className="h-4 w-4 text-slate-700" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-[#0f172a] truncate">{title}</h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="relative z-20 flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleToggleToday}
          title={todayOnly ? 'Showing today only (click to reset)' : 'Filter records for today'}
          className={clsx(
            'hidden sm:flex h-9 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-medium transition-all cursor-pointer shadow-xs backdrop-blur-sm',
            todayOnly
              ? 'border-[#fdba74] bg-gradient-to-r from-[#fff6f0] to-[#ffe6d5] text-[#c2410c] font-semibold'
              : 'border-white/90 bg-white/90 text-slate-700 hover:bg-white hover:text-slate-900'
          )}
        >
          <Calendar className={clsx('h-3.5 w-3.5', todayOnly ? 'text-[#c2410c]' : 'text-slate-400')} />
          {todayOnly ? 'Today (Active)' : 'Today'}
        </button>
        <button
          type="button"
          onClick={handleExportClick}
          title="Export current view to CSV"
          className="hidden sm:flex h-9 items-center gap-1.5 rounded-xl border border-white/90 bg-white/90 backdrop-blur-sm px-3.5 text-xs font-medium text-slate-700 hover:bg-white hover:text-slate-900 transition-all cursor-pointer shadow-xs"
        >
          <Download className="h-3.5 w-3.5 text-slate-400" />Export
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => {
              const next = !showNotifications;
              setShowNotifications(next);
              if (next) loadNotifications(true);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/90 bg-white/90 backdrop-blur-sm text-slate-600 hover:bg-white hover:text-slate-900 transition-all cursor-pointer shadow-xs"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F05A22] ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-[42px] z-50 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900">
                  Notifications {unreadCount > 0 ? `(${unreadCount} new)` : ''}
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-semibold text-[#F05A22] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                  >
                    <CheckSquare className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic text-center py-4">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id || n._id}
                      onClick={() => handleMarkOneRead(n)}
                      className={clsx(
                        "flex items-start gap-2.5 p-2 rounded-lg border text-left relative group transition-colors cursor-pointer",
                        n.read ? "bg-white border-[#e5e7eb] hover:bg-slate-50" : "bg-[#FFF0E6]/30 border-[#FFD2B8] hover:bg-[#FFF0E6]/50"
                      )}
                    >
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#F05A22] mt-1.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={clsx("text-[11px] leading-snug", n.read ? "font-medium text-[#374151]" : "font-bold text-[#111827]")}>{n.title}</p>
                        <p className="text-[10px] text-[#4b5563] mt-0.5 leading-relaxed">{n.body}</p>
                        <span className="text-[8px] text-[#5c6370] block mt-1 font-mono">
                          {n.createdAt ? new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNotification(e, n)}
                        className="text-[#5c6370] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 bg-transparent border-0 cursor-pointer self-start"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-2.5 rounded-xl border border-white/90 bg-white/90 backdrop-blur-sm px-2.5 py-1 shadow-xs">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1d63ff] text-[11px] font-bold text-white flex-shrink-0">
            {adminInitials}
          </div>
          <div className="min-w-0 leading-tight pr-1">
            <p className="text-xs font-bold text-slate-900 truncate max-w-[110px]">{roleLabel}</p>
            <p className="text-[10px] text-slate-500 truncate max-w-[130px]">{admin?.email || ''}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

