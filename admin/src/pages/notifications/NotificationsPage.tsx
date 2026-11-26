import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell, Send, Users, UserCheck, Sparkles, CheckCircle2, AlertCircle,
  RefreshCw, Trash2, CheckSquare, Smartphone, Megaphone, Shield,
  Calendar, CreditCard, Star, FileCheck
} from 'lucide-react';
import {
  getMyNotifications, broadcastNotification, markNotificationRead,
  markAllNotificationsRead, deleteNotification, extractDataList
} from '../../api';
import {
  Card, CardHeader, CardTitle, CardContent, Badge, Button,
  StatCard, Input, Textarea, Select, SearchBar, ConfirmDialog, EmptyState
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';

type NotificationType = 'system' | 'promotion' | 'booking' | 'payment' | 'review' | 'kyc';

const TYPE_OPTIONS: { value: NotificationType; label: string; badge: string }[] = [
  { value: 'system',    label: 'System Announcement', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'promotion', label: 'Promotion / Offer',   badge: 'bg-orange-50 text-[#F05A22] border-orange-200' },
  { value: 'booking',   label: 'Booking / Event',     badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'payment',   label: 'Payment / Payout',    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'kyc',       label: 'KYC / Verification',  badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'review',    label: 'Ratings & Feedback',  badge: 'bg-amber-50 text-amber-700 border-amber-200' },
];

const AUDIENCE_OPTIONS = [
  {
    value: 'all',
    label: 'All App Users',
    desc: 'Players, Parents & Coaches',
    icon: Users,
    accent: 'border-[#F05A22] bg-orange-50/50 text-[#F05A22]',
  },
  {
    value: 'players',
    label: 'Players & Parents',
    desc: 'Arenova Player Mobile App',
    icon: Smartphone,
    accent: 'border-blue-500 bg-blue-50/50 text-blue-600',
  },
  {
    value: 'coaches',
    label: 'Coaches',
    desc: 'Arenova Coach Portal App',
    icon: UserCheck,
    accent: 'border-purple-500 bg-purple-50/50 text-purple-600',
  },
];

const QUICK_TEMPLATES = [
  {
    name: '🏆 New Tournament Open',
    title: 'New Tournament Registrations Open!',
    body: 'Registrations are now live for our upcoming championship. Reserve your slot early on the Arenova app!',
    type: 'promotion' as NotificationType,
    audience: 'players',
  },
  {
    name: '💸 Coach Payouts Processed',
    title: 'Monthly Coach Payouts Settled',
    body: 'All verified session & academy payouts have been processed. Check your wallet & payout history for details.',
    type: 'payment' as NotificationType,
    audience: 'coaches',
  },
  {
    name: '🛠️ Scheduled Maintenance',
    title: 'Scheduled App Maintenance Notice',
    body: 'Arenova services will undergo brief maintenance tonight between 2:00 AM and 2:30 AM IST. Thank you for your patience.',
    type: 'system' as NotificationType,
    audience: 'all',
  },
  {
    name: '🪪 KYC Verification Reminder',
    title: 'Complete Your Coach KYC Verification',
    body: 'Upload your coaching certificates and ID proof in the Coach App to get verified and start receiving bookings.',
    type: 'kyc' as NotificationType,
    audience: 'coaches',
  },
];

const READ_IDS_KEY = 'kridext_admin_read_notifs';
const READ_ALL_TS_KEY = 'kridext_admin_read_all_ts';
const DISMISSED_IDS_KEY = 'kridext_admin_dismissed_notifs';

export default function NotificationsPage() {
  const { admin, can } = useAuth();
  const canBroadcast = admin?.role === 'super_admin' || can('sports_write');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<NotificationType>('system');
  const [audience, setAudience] = useState<string>('all');
  const [formErrors, setFormErrors] = useState<{ title?: string; body?: string }>({});
  const [sending, setSending] = useState(false);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [recentBroadcasts, setRecentBroadcasts] = useState<Array<{
    id: string; title: string; body: string; type: string; audience: string; sentAt: string;
  }>>([]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [inboxFilter, setInboxFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [inboxSearch, setInboxSearch] = useState('');

  const getLocalReadState = () => {
    try {
      const ids = JSON.parse(localStorage.getItem(READ_IDS_KEY) || '[]');
      const dismissed = JSON.parse(localStorage.getItem(DISMISSED_IDS_KEY) || '[]');
      const allTs = Number(localStorage.getItem(READ_ALL_TS_KEY) || '0');
      return {
        ids: new Set<string>(Array.isArray(ids) ? ids : []),
        dismissed: new Set<string>(Array.isArray(dismissed) ? dismissed : []),
        allTs,
      };
    } catch {
      return { ids: new Set<string>(), dismissed: new Set<string>(), allTs: 0 };
    }
  };

  const loadInbox = useCallback(async () => {
    try {
      setLoadingInbox(true);
      const res = await getMyNotifications({ limit: 50 });
      const raw = extractDataList<any>(res);
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

        byId.push({
          ...item,
          id: id || `${item.title}-${item.createdAt || Math.random()}`,
          body: item.body || item.message || '',
          contentKey,
          read: isBackendRead || isLocalRead,
        });
      }

      const contentMap = new Map<string, any>();
      for (const item of byId) {
        const existing = contentMap.get(item.contentKey);
        if (!existing) {
          contentMap.set(item.contentKey, {
            ...item,
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
    } finally {
      setLoadingInbox(false);
    }
  }, []);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const handleMarkOneRead = async (n: any) => {
    const id = n.id || n._id;
    const allIds: string[] = Array.isArray(n.duplicateIds) && n.duplicateIds.length ? n.duplicateIds : (id ? [String(id)] : []);
    if (!n.read) {
      setNotifications(prev => prev.map(item => (item.id || item._id) === id ? { ...item, read: true } : item));
      try {
        const { ids } = getLocalReadState();
        allIds.forEach(dId => ids.add(dId));
        if (n.contentKey) ids.add(n.contentKey);
        localStorage.setItem(READ_IDS_KEY, JSON.stringify(Array.from(ids).slice(-200)));
      } catch {}
      for (const dId of allIds.slice(0, 5)) {
        markNotificationRead(dId).catch(() => {});
      }
    }
  };

  const handleMarkAllRead = async () => {
    const current = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      localStorage.setItem(READ_ALL_TS_KEY, String(Date.now()));
      const { ids } = getLocalReadState();
      current.forEach(n => {
        if (n.contentKey) ids.add(n.contentKey);
        (n.duplicateIds || []).forEach((dId: string) => ids.add(dId));
      });
      localStorage.setItem(READ_IDS_KEY, JSON.stringify(Array.from(ids).slice(-200)));
    } catch {}
    await markAllNotificationsRead().catch(() => {});
  };

  const handleDismissNotification = async (e: React.MouseEvent, n: any) => {
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

  const handleValidateAndConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setSendFeedback(null);
    const nextErrors: { title?: string; body?: string } = {};
    if (!title.trim()) nextErrors.title = 'Notification title is required.';
    if (!body.trim()) nextErrors.body = 'Notification message body is required.';
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setConfirmSendOpen(true);
  };

  const handleSendBroadcast = async () => {
    setConfirmSendOpen(false);
    try {
      setSending(true);
      setSendFeedback(null);
      const payload = {
        title: title.trim(),
        body: body.trim(),
        type,
        audience,
      };
      const res = await broadcastNotification(payload);
      setSendFeedback({
        kind: 'success',
        message: res?.message || `Push notification broadcast sent to ${audience === 'all' ? 'all users' : audience}!`,
      });
      setRecentBroadcasts(prev => [
        { id: String(Date.now()), ...payload, sentAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
        ...prev.slice(0, 4),
      ]);
      setTitle('');
      setBody('');
      setFormErrors({});
    } catch (err: any) {
      setSendFeedback({
        kind: 'error',
        message: err?.message || 'Failed to send push notification broadcast.',
      });
    } finally {
      setSending(false);
    }
  };

  const filteredInbox = useMemo(() => {
    return notifications.filter(n => {
      if (inboxFilter === 'unread' && n.read) return false;
      if (inboxFilter === 'read' && !n.read) return false;
      if (inboxSearch.trim()) {
        const q = inboxSearch.toLowerCase();
        const text = `${n.title || ''} ${n.body || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [notifications, inboxFilter, inboxSearch]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const activeTypeMeta = TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[0];
  const activeAudienceMeta = AUDIENCE_OPTIONS.find(a => a.value === audience) || AUDIENCE_OPTIONS[0];

  return (
    <div className="flex flex-col gap-5 p-3 sm:p-5 max-w-7xl mx-auto pb-16">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Push Notifications & Broadcasts
            </h1>
            <Badge className="bg-orange-50 text-[#F05A22] border-[#F05A22]/20 font-semibold text-xs">
              Live Messaging
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast push announcements to Players, Parents & Coaches, and manage your administrator alert inbox.
          </p>
        </div>

        <Button variant="outline" className="h-9 text-xs self-start sm:self-auto" onClick={loadInbox}>
          <RefreshCw className={clsx('h-3.5 w-3.5 mr-1.5', loadingInbox && 'animate-spin')} />
          Refresh Inbox
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Admin Alerts"
          value={String(notifications.length)}
          sub="Unique alerts in inbox"
          icon={<Bell className="h-4 w-4 text-orange-600" />}
          iconBg="bg-orange-100/80"
          tone="orange"
        />
        <StatCard
          label="Unread Alerts"
          value={String(unreadCount)}
          sub={unreadCount > 0 ? 'Requires attention' : 'All caught up'}
          subColor={unreadCount > 0 ? 'text-amber-600' : 'text-emerald-600'}
          icon={<AlertCircle className="h-4 w-4 text-amber-600" />}
          iconBg="bg-amber-100/80"
          tone="amber"
        />
        <StatCard
          label="Session Broadcasts"
          value={String(recentBroadcasts.length)}
          sub="Sent in this session"
          icon={<Megaphone className="h-4 w-4 text-blue-600" />}
          iconBg="bg-blue-100/80"
          tone="blue"
        />
        <StatCard
          label="Target Channels"
          value="3"
          sub="All · Players · Coaches"
          icon={<Smartphone className="h-4 w-4 text-purple-600" />}
          iconBg="bg-purple-100/80"
          tone="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        <div className="lg:col-span-7 space-y-5">
          <Card className="border border-slate-200 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-[#F05A22]" />
                    Broadcast Push Notification
                  </CardTitle>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sends an instant push notification via <code className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">POST /api/admin/notifications/broadcast</code>
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {!canBroadcast ? (
                <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                  <Shield className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Broadcast Permission Required</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Only Super Admins or Content Managers with write access can broadcast push notifications.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleValidateAndConfirm} className="space-y-4">
                  {sendFeedback && (
                    <div className={clsx(
                      'p-3 rounded-xl border text-xs flex items-start gap-2',
                      sendFeedback.kind === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    )}>
                      {sendFeedback.kind === 'success'
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        : <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />}
                      <span className="font-medium leading-relaxed">{sendFeedback.message}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-[#F05A22]" /> Quick Announcement Templates:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TEMPLATES.map(tpl => (
                        <button
                          key={tpl.name}
                          type="button"
                          onClick={() => {
                            setTitle(tpl.title);
                            setBody(tpl.body);
                            setType(tpl.type);
                            setAudience(tpl.audience);
                            setFormErrors({});
                            setSendFeedback(null);
                          }}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-orange-50/50 hover:border-[#F05A22]/40 transition-colors cursor-pointer"
                        >
                          {tpl.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-800 mb-2">
                      Target Audience <span className="text-rose-500">*</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {AUDIENCE_OPTIONS.map(opt => {
                        const Icon = opt.icon;
                        const selected = audience === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setAudience(opt.value)}
                            className={clsx(
                              'p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5',
                              selected
                                ? `${opt.accent} ring-2 ring-current/15`
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            )}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 leading-tight">{opt.label}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <Select
                        label="Category Type *"
                        value={type}
                        onChange={e => setType(e.target.value as NotificationType)}
                        options={TYPE_OPTIONS.map(t => ({ value: t.value, label: t.label }))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        label="Notification Title *"
                        value={title}
                        maxLength={100}
                        onChange={e => {
                          setTitle(e.target.value);
                          if (formErrors.title) setFormErrors(p => ({ ...p, title: undefined }));
                        }}
                        placeholder="e.g. Hyderabad Open Badminton Registrations Live!"
                      />
                      <div className="flex items-center justify-between mt-1">
                        {formErrors.title
                          ? <p className="text-[11px] text-rose-600 font-medium">{formErrors.title}</p>
                          : <span />}
                        <span className="text-[10px] text-slate-400 font-mono">{title.length}/100</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Textarea
                      label="Message Body *"
                      rows={4}
                      maxLength={500}
                      value={body}
                      onChange={e => {
                        setBody(e.target.value);
                        if (formErrors.body) setFormErrors(p => ({ ...p, body: undefined }));
                      }}
                      placeholder="Write a clear, concise push message for your players or coaches..."
                    />
                    <div className="flex items-center justify-between mt-1">
                      {formErrors.body
                        ? <p className="text-[11px] text-rose-600 font-medium">{formErrors.body}</p>
                        : <span />}
                      <span className="text-[10px] text-slate-400 font-mono">{body.length}/500</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-900 p-4 text-white space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Smartphone className="h-3 w-3 text-[#F05A22]" /> Mobile Push Preview
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                        {activeAudienceMeta.label}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-3.5 flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-[#F05A22] flex items-center justify-center flex-shrink-0 font-black text-white text-sm shadow-sm">
                        A
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-white/90">Arenova</span>
                          <span className="text-[10px] text-slate-400">now</span>
                        </div>
                        <p className="text-xs font-bold text-white mt-0.5 break-words">
                          {title.trim() || 'Your notification title appears here'}
                        </p>
                        <p className="text-[11px] text-slate-200 mt-0.5 leading-relaxed break-words">
                          {body.trim() || 'Your push notification message body will preview here in real time.'}
                        </p>
                        <span className={clsx('inline-block mt-2 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border', activeTypeMeta.badge)}>
                          {type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setTitle('');
                        setBody('');
                        setFormErrors({});
                        setSendFeedback(null);
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      type="submit"
                      disabled={sending}
                      className="bg-[#F05A22] hover:bg-[#d94e1b] text-white font-semibold px-5"
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      {sending ? 'Sending Broadcast...' : 'Send Push Broadcast'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {recentBroadcasts.length > 0 && (
            <Card className="border border-slate-200 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-900">Recently Sent Broadcasts (This Session)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentBroadcasts.map(b => (
                  <div key={b.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{b.title}</span>
                        <Badge className="bg-orange-50 text-[#F05A22] border-orange-200 text-[10px]">{b.type}</Badge>
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">{b.audience}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{b.body}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">{b.sentAt}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-5">
          <Card className="border border-slate-200 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#F05A22]" />
                  Admin Alerts Inbox ({filteredInbox.length})
                </CardTitle>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-[#F05A22] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckSquare className="h-3.5 w-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <SearchBar
                  value={inboxSearch}
                  onChange={setInboxSearch}
                  placeholder="Search alerts..."
                  className="sm:w-auto flex-1"
                />
                <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 self-start">
                  {(['all', 'unread', 'read'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setInboxFilter(f)}
                      className={clsx(
                        'px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors cursor-pointer',
                        inboxFilter === f
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3 max-h-[620px] overflow-y-auto space-y-2">
              {loadingInbox ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-6 w-6 text-[#F05A22] animate-spin" />
                </div>
              ) : filteredInbox.length === 0 ? (
                <EmptyState
                  icon={<Bell className="h-8 w-8 text-slate-300" />}
                  title="No notifications found"
                  text={inboxFilter === 'unread' ? 'All alerts have been read.' : 'Your administrator notification inbox is empty.'}
                />
              ) : (
                filteredInbox.map(n => (
                  <div
                    key={n.id || n._id}
                    onClick={() => handleMarkOneRead(n)}
                    className={clsx(
                      'p-3 rounded-xl border transition-colors cursor-pointer flex items-start gap-2.5 group',
                      n.read
                        ? 'bg-white border-slate-200 hover:bg-slate-50'
                        : 'bg-orange-50/40 border-orange-200 hover:bg-orange-50/70'
                    )}
                  >
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-[#F05A22] mt-1.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={clsx('text-xs leading-snug', n.read ? 'font-semibold text-slate-700' : 'font-bold text-slate-900')}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.body}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                        <span>
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : 'Recent'}
                        </span>
                        {n.type && <span className="uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">{n.type}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Dismiss notification"
                      onClick={(e) => handleDismissNotification(e, n)}
                      className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmSendOpen}
        onClose={() => setConfirmSendOpen(false)}
        onConfirm={handleSendBroadcast}
        title="Confirm Push Broadcast"
        message={`Send "${title.trim()}" as a ${type} notification to ${activeAudienceMeta.label}?`}
        confirmLabel="Send Broadcast"
      />
    </div>
  );
}

