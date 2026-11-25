import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Shield, Pencil, Eye, Mail, Ban, RotateCcw, KeyRound, RefreshCw, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar, Button, SearchBar, Modal, Input, StatCard, Table, Thead, Tbody, Th, Td, Tr, EmptyState, ConfirmDialog, DetailRow } from '../../components/ui';
import {
  getAdmins,
  createAdmin,
  updateAdmin,
  resendAdminInvitation,
  deactivateAdmin,
  reactivateAdmin,
  sendAdminPasswordReset,
  extractDataList
} from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { AdminUser } from '../../types';
import { ROLE_LABELS, ROLE_COLORS, ROLE_PERMISSIONS } from '../../types';

const ALL_PAGES = ['dashboard', 'customers', 'coaches', 'bookings', 'payments', 'ratings', 'sports', 'admins'];

const normalizeAdmin = (raw: any): AdminUser => {
  const id = String(raw?._id || raw?.id || '');
  const fullName = String(raw?.name || '').trim();
  const parts = fullName ? fullName.split(/\s+/) : [];
  return {
    ...raw,
    id,
    _id: raw?._id || id,
    firstName: raw?.firstName || parts[0] || '',
    lastName: raw?.lastName || parts.slice(1).join(' ') || '',
    email: raw?.email || '',
    role: raw?.role || 'admin',
    isActive: Boolean(raw?.isActive),
    accountStatus: raw?.accountStatus,
    setupDelivery: raw?.setupDelivery,
    setupExpiresAt: raw?.setupExpiresAt,
    createdAt: raw?.createdAt || '',
    lastLogin: raw?.lastLogin,
  };
};

const getAccountStatusInfo = (a: AdminUser) => {
  const acct = String(a.accountStatus || '').toUpperCase().trim();
  if (acct === 'PENDING_INVITATION') {
    return { key: 'PENDING_INVITATION', label: 'Pending invitation', badge: 'badge-amber' };
  }
  if (a.isActive || acct === 'ACTIVE') {
    return { key: 'ACTIVE', label: 'Active', badge: 'badge-green' };
  }
  return { key: 'INACTIVE', label: 'Inactive', badge: 'badge-gray' };
};

const getDeliveryText = (delivery?: string) => {
  const d = String(delivery || '').toUpperCase().trim();
  if (d === 'SUBMITTED') return { label: 'Submitted to email provider', cls: 'text-emerald-700' };
  if (d === 'FAILED') return { label: 'Email delivery failed', cls: 'text-rose-600' };
  if (d === 'PENDING') return { label: 'Submission pending', cls: 'text-amber-700' };
  return null;
};

const formatLocalDateTime = (val?: string) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleString();
};

function AdminViewModal({ admin, open, onClose }: { admin: AdminUser | null; open: boolean; onClose: () => void }) {
  if (!admin) return null;
  const perms = ROLE_PERMISSIONS[admin.role] || ROLE_PERMISSIONS.admin || [];
  const statusInfo = getAccountStatusInfo(admin);
  const deliveryInfo = getDeliveryText(admin.setupDelivery);
  const initials = `${admin.firstName?.[0] || ''}${admin.lastName?.[0] || ''}` || 'AD';

  return (
    <Modal open={open} onClose={onClose} title="Admin Details" size="md">
      <div className="space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
          <Avatar initials={initials} size={54} />
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">{admin.firstName} {admin.lastName}</h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{admin.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={ROLE_COLORS[admin.role] || 'badge-blue'}>{ROLE_LABELS[admin.role] || admin.role}</Badge>
              <Badge className={statusInfo.badge}>{statusInfo.label}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <DetailRow label="Admin ID" value={<span className="font-mono text-xs text-slate-700">#{admin.id}</span>} />
          <DetailRow label="Created" value={admin.createdAt ? formatLocalDateTime(admin.createdAt) : '—'} />
          <DetailRow label="Last Login" value={admin.lastLogin ? formatLocalDateTime(admin.lastLogin) : '—'} />
          {statusInfo.key === 'PENDING_INVITATION' && (
            <DetailRow label="Invitation Expires" value={formatLocalDateTime(admin.setupExpiresAt)} />
          )}
          {deliveryInfo && (
            <DetailRow label="Email Delivery" value={<span className={`font-semibold text-xs ${deliveryInfo.cls}`}>{deliveryInfo.label}</span>} />
          )}
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">Permissions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ALL_PAGES.map(page => {
              const canRead = perms.includes(page as any);
              const canWrite = perms.includes(`${page}_write` as any);
              if (!canRead && !canWrite) {
                return (
                  <div key={page} className="flex items-center justify-between bg-slate-50 border border-slate-200/70 rounded-lg px-3 py-2 opacity-50">
                    <span className="text-xs text-slate-500 capitalize">{page}</span>
                    <span className="text-[10px] text-slate-400">No Access</span>
                  </div>
                );
              }
              return (
                <div key={page} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <span className="text-xs font-semibold text-slate-800 capitalize">{page}</span>
                  <div className="flex gap-1.5">
                    {canRead && <Badge className="badge-blue">View</Badge>}
                    {canWrite && <Badge className="badge-green">Edit</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

function AdminFormModal({
  admin,
  open,
  onClose,
  onSave,
  submitting,
  serverError,
  onClearServerError
}: {
  admin: AdminUser | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: { firstName: string; lastName: string; email: string }) => void;
  submitting: boolean;
  serverError?: string;
  onClearServerError?: () => void;
}) {
  const isEdit = !!admin;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setFirstName(admin?.firstName || '');
    setLastName(admin?.lastName || '');
    setEmail(admin?.email || '');
    setError('');
  }, [admin, open]);

  const clearErr = () => {
    setError('');
    onClearServerError?.();
  };

  const handleSubmit = () => {
    const f = firstName.trim();
    const l = lastName.trim();
    const em = email.trim();

    if (isEdit) {
      if (!f && !l) {
        setError('At least one name (first name or last name) is required.');
        return;
      }
      onSave({ firstName: f, lastName: l, email: em });
      return;
    }

    if (!f || !l) {
      setError('First name and last name are required.');
      return;
    }
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) {
      setError('Please enter a valid email address.');
      return;
    }
    onSave({ firstName: f, lastName: l, email: em });
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Admin Name' : 'Invite Admin'} size="md">
      <div className="space-y-4">
        {!isEdit && (
          <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
            The backend assigns role <strong>Admin</strong> and sends a password setup invitation link to this email.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="First Name *"
            value={firstName}
            onChange={e => { setFirstName(e.target.value); setError(''); }}
            placeholder="Ravi"
          />
          <Input
            label="Last Name *"
            value={lastName}
            onChange={e => { setLastName(e.target.value); setError(''); }}
            placeholder="Kumar"
          />
        </div>

        <Input
          label="Email Address *"
          type="email"
          value={email}
          disabled={isEdit}
          onChange={e => { setEmail(e.target.value); setError(''); }}
          placeholder="admin@example.com"
        />

        {(error || serverError) && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">{error || serverError}</p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (isEdit ? 'Saving...' : 'Sending Invite...') : (isEdit ? 'Save Name' : 'Send Invitation')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminsPage() {
  const { admin: currentAdmin, can } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewA, setViewA] = useState<AdminUser | null>(null);
  const [editA, setEditA] = useState<AdminUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(null);
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const hasActive = Object.values(cooldowns).some(v => v > 0);
    if (!hasActive) return;
    const timer = setInterval(() => {
      setCooldowns(prev => {
        const next: Record<string, number> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (v > 1) next[k] = v - 1;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldowns]);

  const formatApiError = (err: any, context: 'invite' | 'edit' | 'lifecycle'): string => {
    const status = err?.status;
    if (status === 403) return 'Access restricted: You do not have permission to perform this action.';
    if (status === 404) return 'This admin account is no longer available. The list has been refreshed.';
    if (status === 409) {
      return context === 'invite'
        ? (err?.message || 'An admin account with this email already exists.')
        : (err?.message || 'Account state changed. Reloaded current row state.');
    }
    if (status === 429) {
      const wait = err?.retryAfter || 60;
      return err?.message || `Too many requests. Please wait ${wait} seconds before trying again.`;
    }
    if (status === 503) {
      return 'Admin invitation setup is temporarily unavailable. Please contact backend support.';
    }
    return err?.message || 'Request failed.';
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdmins();
      const raw = extractDataList<any>(res);
      const seen = new Set<string>();
      const unique: AdminUser[] = [];
      for (const item of raw) {
        const normalized = normalizeAdmin(item);
        if (normalized.id && !seen.has(normalized.id)) {
          seen.add(normalized.id);
          unique.push(normalized);
        } else if (!normalized.id) {
          unique.push(normalized);
        }
      }
      setAdmins(unique);
    } catch (e: any) {
      setBannerMsg({ type: 'error', text: e?.message || 'Failed to load admins.' });
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = admins.filter(a =>
    search === '' || `${a.firstName} ${a.lastName} ${a.email} ${a.role}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (form: { firstName: string; lastName: string; email: string }) => {
    if (submitting) return;
    setSubmitting(true);
    setFormError('');
    setBannerMsg(null);
    try {
      if (editA) {
        const res = await updateAdmin(editA.id, { firstName: form.firstName, lastName: form.lastName });
        const updated = res?.data ? normalizeAdmin(res.data) : null;
        if (updated?.id) {
          setAdmins(prev => prev.map(a => (a.id === editA.id ? updated : a)));
        } else {
          await load();
        }
        setBannerMsg({ type: 'success', text: `Updated name for ${form.firstName} ${form.lastName}.` });
      } else {
        const res = await createAdmin({ firstName: form.firstName, lastName: form.lastName, email: form.email });
        const created = res?.data ? normalizeAdmin(res.data) : null;
        if (created?.id) {
          setAdmins(prev => [created, ...prev.filter(a => a.id !== created.id)]);
        } else {
          await load();
        }
        setBannerMsg({ type: 'success', text: `Invitation sent to ${form.email}.` });
      }
      setFormOpen(false);
      setEditA(null);
    } catch (err: any) {
      const msg = formatApiError(err, editA ? 'edit' : 'invite');
      setFormError(msg);
      if (err?.status === 404) {
        setFormOpen(false);
        setEditA(null);
        setBannerMsg({ type: 'error', text: msg });
        load();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const runRowAction = async (target: AdminUser, action: 'resend' | 'deactivate' | 'reactivate' | 'reset') => {
    if (actionBusyId) return;
    setActionBusyId(target.id);
    setBannerMsg(null);
    try {
      let res: any;
      if (action === 'resend') {
        res = await resendAdminInvitation(target.id);
        setCooldowns(prev => ({ ...prev, [`${target.id}:resend`]: 60 }));
        setBannerMsg({ type: 'success', text: `Invitation re-sent to ${target.email}.` });
      } else if (action === 'deactivate') {
        res = await deactivateAdmin(target.id);
        setBannerMsg({ type: 'success', text: `${target.firstName} ${target.lastName} deactivated.` });
      } else if (action === 'reactivate') {
        res = await reactivateAdmin(target.id);
        setBannerMsg({ type: 'success', text: `${target.firstName} ${target.lastName} reactivated.` });
      } else {
        res = await sendAdminPasswordReset(target.id);
        setCooldowns(prev => ({ ...prev, [`${target.id}:reset`]: 60 }));
        setBannerMsg({ type: 'success', text: `Password reset link sent to ${target.email}.` });
      }

      const updated = res?.data ? normalizeAdmin(res.data) : null;
      if (updated?.id) {
        setAdmins(prev => prev.map(a => (a.id === target.id ? updated : a)));
      } else {
        await load();
      }
    } catch (err: any) {
      if (err?.status === 429 && (action === 'resend' || action === 'reset')) {
        const wait = err?.retryAfter || 60;
        setCooldowns(prev => ({ ...prev, [`${target.id}:${action}`]: wait }));
      }
      if (err?.status === 404 || err?.status === 409) {
        await load();
      }
      setBannerMsg({ type: 'error', text: formatApiError(err, 'lifecycle') });
    } finally {
      setActionBusyId(null);
    }
  };

  const stats = {
    total: admins.length,
    active: admins.filter(a => getAccountStatusInfo(a).key === 'ACTIVE').length,
    pending: admins.filter(a => getAccountStatusInfo(a).key === 'PENDING_INVITATION').length,
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 p-3 sm:p-5 min-w-0 max-w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Total Admins" value={String(stats.total)} icon={<Shield className="h-4 w-4 text-[#F05A22]" />} iconBg="bg-[#F05A22]/10" />
        <StatCard label="Active" value={String(stats.active)} icon={<Shield className="h-4 w-4 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Pending Invitations" value={String(stats.pending)} icon={<Clock className="h-4 w-4 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      {bannerMsg && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-medium ${
            bannerMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <span>{bannerMsg.text}</span>
          <button type="button" onClick={() => setBannerMsg(null)} className="text-xs font-bold underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Admins ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <SearchBar value={search} onChange={setSearch} placeholder="Search admins..." />
            <Button variant="outline" className="h-8 gap-1.5 flex-shrink-0" onClick={load} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            {can('admins_write') && (
              <Button variant="primary" className="h-8 gap-1.5 flex-shrink-0" onClick={() => { setEditA(null); setFormOpen(true); }}>
                <UserPlus className="h-3.5 w-3.5" /> Invite Admin
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Shield className="h-8 w-8" />} title="No admins found" />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Admin</Th>
                  <Th>Role</Th>
                  <Th>Account Status</Th>
                  <Th>Invitation / Delivery</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map(a => {
                  const statusInfo = getAccountStatusInfo(a);
                  const deliveryInfo = getDeliveryText(a.setupDelivery);
                  const isRegularAdmin = String(a.role || '').toLowerCase() === 'admin';
                  const isSelf = a.id === (currentAdmin?.id || currentAdmin?._id);
                  const showLifecycle = can('admins_write') && isRegularAdmin && !isSelf;
                  const busy = actionBusyId === a.id;
                  const initials = `${a.firstName?.[0] || ''}${a.lastName?.[0] || ''}` || 'AD';

                  return (
                    <Tr key={a.id || a.email}>
                      <Td>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar initials={initials} size={34} className="flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate max-w-[180px]">{a.firstName} {a.lastName}</p>
                            <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{a.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <Badge className={ROLE_COLORS[a.role] || 'badge-blue'}>{ROLE_LABELS[a.role] || a.role}</Badge>
                      </Td>
                      <Td>
                        <div className="flex flex-col gap-0.5">
                          <Badge className={statusInfo.badge}>{statusInfo.label}</Badge>
                          {statusInfo.key === 'PENDING_INVITATION' && (
                            <span className="text-[10px] text-slate-500">Needs password setup</span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        {statusInfo.key === 'PENDING_INVITATION' ? (
                          <div className="flex flex-col gap-0.5 text-[11px]">
                            {deliveryInfo && <span className={`font-medium ${deliveryInfo.cls}`}>{deliveryInfo.label}</span>}
                            {a.setupExpiresAt && (
                              <span className="text-slate-500">Expires: {formatLocalDateTime(a.setupExpiresAt)}</span>
                            )}
                            {!deliveryInfo && !a.setupExpiresAt && <span className="text-slate-400">—</span>}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">
                            {a.lastLogin ? `Last login: ${new Date(a.lastLogin).toLocaleDateString('en-IN')}` : '—'}
                          </span>
                        )}
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            title="View Details"
                            onClick={() => setViewA(a)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {showLifecycle && (
                            <>
                              <button
                                type="button"
                                title="Edit Name"
                                disabled={busy}
                                onClick={() => { setEditA(a); setFormOpen(true); }}
                                className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer disabled:opacity-40"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>

                              {statusInfo.key === 'PENDING_INVITATION' && (
                                <Button
                                  variant="outline"
                                  disabled={busy || (cooldowns[`${a.id}:resend`] || 0) > 0}
                                  onClick={() => runRowAction(a, 'resend')}
                                  className="h-7 px-2 text-[11px] font-semibold"
                                >
                                  <Mail className="h-3 w-3 mr-1" />
                                  {(cooldowns[`${a.id}:resend`] || 0) > 0 ? `Resend (${cooldowns[`${a.id}:resend`]}s)` : 'Resend invitation'}
                                </Button>
                              )}

                              {statusInfo.key === 'ACTIVE' && (
                                <Button
                                  variant="outline"
                                  disabled={busy || (cooldowns[`${a.id}:reset`] || 0) > 0}
                                  onClick={() => runRowAction(a, 'reset')}
                                  className="h-7 px-2 text-[11px] font-semibold"
                                >
                                  <KeyRound className="h-3 w-3 mr-1" />
                                  {(cooldowns[`${a.id}:reset`] || 0) > 0 ? `Reset (${cooldowns[`${a.id}:reset`]}s)` : 'Send password reset link'}
                                </Button>
                              )}

                              {(statusInfo.key === 'ACTIVE' || statusInfo.key === 'PENDING_INVITATION') && (
                                <Button
                                  variant="outline"
                                  disabled={busy}
                                  onClick={() => setDeactivateTarget(a)}
                                  className="h-7 px-2 text-[11px] font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                                >
                                  <Ban className="h-3 w-3 mr-1" />
                                  Deactivate
                                </Button>
                              )}

                              {statusInfo.key === 'INACTIVE' && (
                                <Button
                                  variant="outline"
                                  disabled={busy}
                                  onClick={() => runRowAction(a, 'reactivate')}
                                  className="h-7 px-2 text-[11px] font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Reactivate
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AdminViewModal admin={viewA} open={!!viewA} onClose={() => setViewA(null)} />
      <AdminFormModal
        admin={editA}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditA(null); setFormError(''); }}
        onSave={handleSave}
        submitting={submitting}
        serverError={formError}
        onClearServerError={() => setFormError('')}
      />
      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate Admin"
        message={`Deactivate ${deactivateTarget?.firstName} ${deactivateTarget?.lastName}? Existing sessions and any outstanding invitation setup links will be revoked.`}
        confirmLabel="Deactivate"
        danger={true}
        onConfirm={() => {
          if (!deactivateTarget) return;
          const target = deactivateTarget;
          setDeactivateTarget(null);
          runRowAction(target, 'deactivate');
        }}
      />
    </div>
  );
}
