import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Download, Calendar, Menu, Trash2, CheckSquare } from 'lucide-react';
import { getMyNotifications, markAllNotificationsRead, deleteNotification } from '../../api';
import { clsx } from 'clsx';

const TITLES: Record<string, string> = {
  '/dashboard':   'Dashboard',
  '/customers':   'Customer Management',
  '/coaches':     'Coach Management',
  '/bookings':    'Bookings Management',
  '/payments':    'Payments & Payouts',
  '/ratings':     'Ratings & Reviews',
  '/sports':      'Sports Management',
  '/tournaments': 'Tournaments',
  '/community':   'Community Centers',
  '/venues':      'Venues',
  '/admins':      'Admin Management',
  '/enquiries':   'Customer Enquiries',
  '/settings':    'Settings',
};

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const location = useLocation();
  const key = Object.keys(TITLES).find(k => location.pathname.startsWith(k)) || '/dashboard';
  const title = TITLES[key] || 'Dashboard';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const res = await getMyNotifications();
      setNotifications(res.data || res || []);
    } catch {
      // Fallback demo notifications
      setNotifications([
        { id: 'n1', title: 'New Coach Application', body: 'Coach Pavan Patel has applied for KYC approval.', read: false, createdAt: new Date().toISOString() },
        { id: 'n2', title: 'Payout Request', body: 'Coach Rajesh Kumar has requested a payout of ₹15,000.', read: false, createdAt: new Date().toISOString() },
        { id: 'n3', title: 'Flagged Post Alert', body: 'A post by Unknown User was flagged automatically.', read: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
      ]);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="flex h-[52px] flex-shrink-0 items-center justify-between border-b border-[#2e3139] bg-[#141518] px-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          className="mr-1 rounded-lg p-1.5 hover:bg-gray-100 md:hidden cursor-pointer flex items-center justify-center border border-[#e5e7eb]"
        >
          <Menu className="h-4 w-4 text-[#4b5563]" />
        </button>
        <span className="h-4 w-1 rounded-full bg-[#F05A22] inline-block hidden md:inline-block" />
        <h1 className="text-sm font-semibold text-white">{title}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <button className="flex h-8 items-center gap-1.5 rounded-md border border-[#2e3139] bg-transparent px-3 text-[11px] text-[#9ba3af] hover:bg-[#21242a] hover:text-white transition-colors">
          <Calendar className="h-3 w-3" />Apr 2026
        </button>
        <button className="flex h-8 items-center gap-1.5 rounded-md border border-[#2e3139] bg-transparent px-3 text-[11px] text-[#9ba3af] hover:bg-[#21242a] hover:text-white transition-colors">
          <Download className="h-3 w-3" />Export
        </button>
        
        {/* Notifications Dropdown Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            className="relative flex h-8 w-8 items-center justify-center rounded-md border border-[#2e3139] text-[#9ba3af] hover:bg-[#21242a] hover:text-white transition-colors cursor-pointer"
          >
            <Bell className="h-3.5 w-3.5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#F05A22]" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 top-[38px] z-50 w-80 rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-2">
                <span className="text-xs font-bold text-[#111827]">Notifications ({unreadCount} new)</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-semibold text-[#F05A22] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                  >
                    <CheckSquare className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-[11px] text-[#5c6370] italic text-center py-4">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={clsx(
                      "flex items-start gap-2.5 p-2 rounded-lg border text-left relative group transition-colors",
                      n.read ? "bg-white border-[#e5e7eb]" : "bg-[#FFF0E6]/20 border-[#FFD2B8]"
                    )}>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#F05A22] mt-1.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-[#111827] leading-snug">{n.title}</p>
                        <p className="text-[10px] text-[#4b5563] mt-0.5 leading-relaxed">{n.body}</p>
                        <span className="text-[8px] text-[#5c6370] block mt-1 font-mono">
                          {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteNotification(n.id)}
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
      </div>
    </header>
  );
}
