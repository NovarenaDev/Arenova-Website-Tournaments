import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus, Users, Wallet, AlertTriangle, Baby, ChevronDown,
  ChevronUp, ChevronRight, Pencil, Ban, Trash2, MapPin, Mail,
  Phone, Calendar, Clock, Eye, CheckCircle2, FileText, ExternalLink, Download
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardContent, Badge, Avatar, Button,
  SearchBar, FilterPill, StatCard, Table, Thead, Tbody, Th, Td, Tr,
  EmptyState, Modal, ConfirmDialog, Input, Select, DetailRow,
  Pagination, usePagination, TableSkeleton
} from '../../components/ui';
import { getCustomers, updateCustomerStatus, updateCustomer, deleteCustomer, uploadImage, getMediaSignedUrl, withAdminDocToken, extractDataList } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Customer } from '../../types';
import { clsx } from 'clsx';

const STATUS_MAP: Record<string, string> = { active: 'badge-green', flagged: 'badge-amber', suspended: 'badge-red' };
const ROLE_MAP:   Record<string, string> = { parent: 'badge-purple', individual: 'badge-blue' };
const FILTERS      = ['All', 'Active', 'Flagged', 'Suspended'];
const ROLE_FILTERS = ['All Users', 'Parents', 'Individual'];

function inactiveDays(lastActive?: string): number | null {
  if (!lastActive) return null;
  const now = new Date();
  try {
    const d = new Date(lastActive);
    if (isNaN(d.getTime())) return null;
    return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
  } catch { return null; }
}

function inactiveBadge(days: number | null) {
  if (days === null) return <span className="text-xs text-slate-400">—</span>;
  if (days === 0) return <Badge className="badge-green">Today</Badge>;
  if (days <= 3)  return <Badge className="badge-green">{days}d ago</Badge>;
  if (days <= 14) return <Badge className="badge-amber">{days}d ago</Badge>;
  return <Badge className="badge-red">{days}d ago</Badge>;
}

export default function CustomersPage() {
  const { can } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('All');
  const [roleFilter, setRoleFilter] = useState('All Users');
  const [selected, setSelected]   = useState<Customer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete]   = useState<Customer | null>(null);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [avatarUpload, setAvatarUpload] = useState<{ customerId: string; customerName: string } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [todayOnly, setTodayOnly] = useState(false);
  const [actionCustomer, setActionCustomer] = useState<Customer | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCustomers({ limit: 100 });
      const list = extractDataList<any>(res);
      const seen = new Set<string>();
      const unique: Customer[] = [];
      for (const raw of list) {
        const id = raw.id || raw._id;
        if (id && seen.has(String(id))) continue;
        if (id) seen.add(String(id));

        const rawRole = String(raw.role || raw.accountType || '').toLowerCase().trim();
        const childrenCount = Array.isArray(raw.children) ? raw.children.length : Number(raw.children || 0);
        const normalizedRole = rawRole === 'parent' || childrenCount > 0 ? 'parent' : 'individual';

        const rawStatus = String(raw.status || (raw.isActive === false ? 'suspended' : 'active')).toLowerCase().trim();
        const normalizedStatus = (['active', 'flagged', 'suspended'].includes(rawStatus) ? rawStatus : 'active') as Customer['status'];

        const fullName = raw.name || `${raw.firstName || ''} ${raw.lastName || ''}`.trim();
        const nameParts = fullName ? fullName.split(' ') : [];

        unique.push({
          ...raw,
          id: String(id || ''),
          firstName: raw.firstName || nameParts[0] || '',
          lastName: raw.lastName || nameParts.slice(1).join(' ') || '',
          email: raw.email || raw.emailId || raw.mailId || '',
          phone: raw.phone || raw.phoneNumber || raw.mobile || raw.mobileNumber || '',
          role: normalizedRole,
          status: normalizedStatus,
          children: childrenCount,
          bookings: raw.bookings ?? raw.totalBookings ?? 0,
          walletCredits: raw.walletCredits ?? 0,
          lastActive: raw.lastActive || raw.lastLoginAt || raw.lastSeenAt || raw.lastActivity || raw.updatedAt || '',
          joined: raw.joined || (raw.createdAt ? new Date(raw.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''),
        });
      }
      setCustomers(unique);
    } catch (e: any) {
      console.warn('Failed to load customers:', e?.message || e);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const customerList = Array.isArray(customers) ? customers : [];
  const filtered = customerList.filter(c => {
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/[\s\-+]/g, '');
    const haystack = `${c.firstName || ''} ${c.lastName || ''} ${c.email || ''} ${c.phone || ''}`.toLowerCase();
    const phoneDigits = String(c.phone || '').replace(/[\s\-+]/g, '');
    const matchSearch = q === '' || haystack.includes(q) || (qDigits.length >= 3 && phoneDigits.includes(qDigits));

    const matchStatus = filter === 'All' || (c.status || 'active').toLowerCase() === filter.toLowerCase();
    const matchRole   = roleFilter === 'All Users' ||
      (roleFilter === 'Parents' && c.role === 'parent') ||
      (roleFilter === 'Individual' && c.role !== 'parent');

    let matchToday = true;
    if (todayOnly) {
      const created = (c as any).createdAt || c.joined;
      if (!created) matchToday = false;
      else {
        const d = new Date(created);
        const now = new Date();
        matchToday = !isNaN(d.getTime()) &&
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate();
      }
    }

    return matchSearch && matchStatus && matchRole && matchToday;
  });

  const { page, setPage, pageSize, setPageSize, totalItems, totalPages, paginatedItems, startIdx, endIdx } = usePagination(filtered, 10);

  const exportCustomersCsv = useCallback(() => {
    if (filtered.length === 0) {
      alert('No customer records match the current filters to export.');
      return;
    }
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Role', 'Status', 'Bookings', 'Wallet Credits', 'Joined'];
    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map(c => [
      c.id, c.firstName, c.lastName, c.email, c.phone, c.role, c.status, c.bookings, c.walletCredits, c.joined
    ].map(escapeCsv).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arenova-customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  useEffect(() => {
    const onExport = () => exportCustomersCsv();
    const onToday = (e: any) => setTodayOnly(Boolean(e?.detail?.active));
    window.addEventListener('arenova:export', onExport);
    window.addEventListener('arenova:today-filter', onToday);
    return () => {
      window.removeEventListener('arenova:export', onExport);
      window.removeEventListener('arenova:today-filter', onToday);
    };
  }, [exportCustomersCsv]);

  const handleStatusChange = async (customer: Customer, status: string) => {
    const cid = customer.id || (customer as any)._id;
    if (!cid) return;
    try {
      await updateCustomerStatus(cid, status);
      setCustomers(prev => prev.map(c => (c.id || (c as any)._id) === cid ? { ...c, status: status as any } : c));
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const cid = toDelete.id || (toDelete as any)._id;
    try {
      await deleteCustomer(cid);
      setCustomers(prev => prev.filter(c => (c.id || (c as any)._id) !== cid));
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer');
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !avatarUpload) return;

    setAvatarError('');
    if (!file.type.startsWith('image/')) {
      setAvatarError('Invalid file format. Please select a JPG, PNG, GIF, or WebP image.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 5 MB limit.`);
      e.target.value = '';
      return;
    }

    try {
      setUploadingAvatar(true);
      const res = await uploadImage(file);
      const uploadedUrl = res?.url || res?.data?.url || res?.imageUrl || '';
      if (uploadedUrl) {
        await updateCustomer(avatarUpload.customerId, { avatar: uploadedUrl }).catch(() => {});
        setCustomers(prev => prev.map(c =>
          (c.id || (c as any)._id) === avatarUpload.customerId ? { ...c, avatar: uploadedUrl } : c
        ));
        setAvatarUpload(null);
      } else {
        setAvatarError(res?.message || 'Upload succeeded but no URL was returned.');
      }
    } catch (err: any) {
      setAvatarError(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const buildCustomerTrend = (pred: (c: Customer) => boolean): number[] => {
    const now = new Date();
    const counts = [0, 0, 0, 0, 0, 0];
    customers.forEach(c => {
      if (!pred(c)) return;
      const raw = (c as any).createdAt || c.joined;
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (diff >= 0 && diff < 6) {
        counts[5 - diff] += 1;
      }
    });
    return counts;
  };

  const stats = {
    total:     customers.length,
    active:    customers.filter(c => c.status === 'active').length,
    flagged:   customers.filter(c => c.status === 'flagged').length,
    suspended: customers.filter(c => c.status === 'suspended').length,
    parents:   customers.filter(c => c.role === 'parent').length,
  };

  const customerFilterDots: Record<string, string> = {
    Active: 'bg-emerald-500',
    Flagged: 'bg-amber-500',
    Suspended: 'bg-rose-500',
  };
  const customerFilterCounts: Record<string, number> = {
    All: stats.total,
    Active: stats.active,
    Flagged: stats.flagged,
    Suspended: stats.suspended,
  };
  const roleFilterDots: Record<string, string> = {
    Parents: 'bg-purple-500',
    Individual: 'bg-slate-500',
  };
  const roleFilterCounts: Record<string, number> = {
    'All Users': stats.total,
    Parents: stats.parents,
    Individual: stats.total - stats.parents,
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 p-3 sm:p-5 min-w-0 max-w-full">

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Users"  value={String(stats.total)}     icon={<Users className="h-4 w-4 text-blue-600"/>}         iconBg="bg-blue-100/80"    tone="blue"    sparklineData={buildCustomerTrend(() => true)} onClick={() => { setFilter('All'); setRoleFilter('All Users'); }} active={filter === 'All' && roleFilter === 'All Users'} />
        <StatCard label="Active"       value={String(stats.active)}    icon={<Users className="h-4 w-4 text-emerald-600"/>}      iconBg="bg-emerald-100/80" tone="emerald" sparklineData={buildCustomerTrend(c => c.status === 'active')} onClick={() => setFilter('Active')} active={filter === 'Active'} />
        <StatCard label="Flagged"      value={String(stats.flagged)}   icon={<AlertTriangle className="h-4 w-4 text-amber-600"/>}iconBg="bg-amber-100/80"   tone="amber"   sparklineData={buildCustomerTrend(c => c.status === 'flagged')} onClick={() => setFilter('Flagged')} active={filter === 'Flagged'} />
        <StatCard label="Suspended"    value={String(stats.suspended)} icon={<Ban className="h-4 w-4 text-rose-600"/>}           iconBg="bg-rose-100/80"    tone="rose"    sparklineData={buildCustomerTrend(c => c.status === 'suspended')} onClick={() => setFilter('Suspended')} active={filter === 'Suspended'} />
        <StatCard label="Parents"      value={String(stats.parents)}   icon={<Baby className="h-4 w-4 text-purple-600"/>}        iconBg="bg-purple-100/80"  tone="purple"  sparklineData={buildCustomerTrend(c => c.role === 'parent')} onClick={() => { setFilter('All'); setRoleFilter('Parents'); }} active={roleFilter === 'Parents'} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search customers..." />
            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map(f => (
                <FilterPill key={f} label={f} active={filter === f} onClick={() => setFilter(f)} dotColor={customerFilterDots[f]} count={customerFilterCounts[f]} />
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {ROLE_FILTERS.map(r => (
                <FilterPill key={r} label={r} active={roleFilter === r} onClick={() => setRoleFilter(r)} dotColor={roleFilterDots[r]} count={roleFilterCounts[r]} />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          {loading ? (
            <TableSkeleton rows={6} cols={7} />
          ) : filtered.length === 0 ? (
            <div className="py-12">
              <EmptyState icon={<Users className="h-8 w-8 text-slate-300" />} title="No customers found" />
            </div>
          ) : (
            <>
            <Table>
              <Thead>
                <Tr>
                  <Th></Th>
                  <Th>Customer</Th>
                  <Th>Account Type</Th>
                  <Th>Status</Th>
                  <Th>Bookings</Th>
                  <Th>Last Active</Th>
                  <Th>Wallet Credits</Th>
                  {can('customers_write') && <Th className="text-right">Actions</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {paginatedItems.map(c => {
                  const initials = `${c.firstName?.[0] || ''}${c.lastName?.[0] || ''}` || 'U';
                  const days     = inactiveDays(c.lastActive);
                  const isExpanded = expanded === c.id;

                  return (
                    <React.Fragment key={c.id}>
                      <Tr className="cursor-pointer" onClick={() => setExpanded(isExpanded ? null : c.id)}>
                        <Td className="w-8 pl-4 pr-0">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setExpanded(isExpanded ? null : c.id); }}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar initials={initials} src={withAdminDocToken((c as any).avatar || (c as any).profileImage || (c as any).photo)} size={32} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate max-w-[160px] sm:max-w-[200px]" title={(c.firstName || '') + ' ' + (c.lastName || '')}>
                                {(c.firstName || '') + ' ' + (c.lastName || '') || 'Unknown'}
                              </p>
                              <p className="text-xs text-slate-500 truncate max-w-[160px] sm:max-w-[200px]" title={c.email}>
                                {c.email || 'No email'}
                              </p>
                            </div>
                          </div>
                        </Td>
                        <Td><Badge className={ROLE_MAP[c.role] || 'badge-gray'}>{c.role || 'user'}</Badge></Td>
                        <Td><Badge className={STATUS_MAP[c.status] || 'badge-gray'}>{c.status || 'active'}</Badge></Td>
                        <Td><span className="text-sm font-semibold text-slate-900">{c.bookings || 0}</span></Td>
                        <Td>{inactiveBadge(days)}</Td>
                        <Td><span className="text-sm text-emerald-600 font-bold">₹{c.walletCredits || 0}</span></Td>
                        {can('customers_write') && (
                          <Td onClick={e => e.stopPropagation()} className="text-right">
                            <Button
                              variant="outline"
                              className="h-7 text-xs px-2.5 font-semibold text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-50 inline-flex items-center gap-1 cursor-pointer"
                              onClick={() => setActionCustomer(c)}
                            >
                              Actions <ChevronDown className="h-3 w-3 text-slate-400" />
                            </Button>
                          </Td>
                        )}
                      </Tr>
                      {isExpanded && (
                        <Tr key={c.id + '-exp'}>
                          <Td colSpan={can('customers_write') ? 8 : 7}>
                            <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 m-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <DetailRow label="Phone"   value={c.phone || '—'} />
                              <DetailRow label="Joined"  value={c.joined || '—'} />
                              {c.address && (
                                <DetailRow label="City" value={`${c.address.city || ''}, ${c.address.state || ''}`} />
                              )}
                              {c.role === 'parent' && (
                                <DetailRow label="Children" value={String(c.children || 0)} />
                              )}
                            </div>
                          </Td>
                        </Tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </Tbody>
            </Table>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              startIdx={startIdx}
              endIdx={endIdx}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              noun="customers"
            />
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        open={Boolean(actionCustomer)}
        onClose={() => setActionCustomer(null)}
        title="Manage Customer"
        size="md"
      >
        {actionCustomer && (
          <div className="space-y-4">

            <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <Avatar initials={`${actionCustomer.firstName?.[0] || ''}${actionCustomer.lastName?.[0] || ''}`} size={44} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm truncate">
                    {actionCustomer.firstName} {actionCustomer.lastName}
                  </h3>
                  <Badge className={STATUS_MAP[actionCustomer.status] || 'badge-gray'}>
                    {actionCustomer.status}
                  </Badge>
                  <Badge className={ROLE_MAP[actionCustomer.role] || 'badge-gray'}>
                    {actionCustomer.role}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{actionCustomer.email} · {actionCustomer.phone || 'No phone'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
                onClick={() => {
                  setSelected(actionCustomer);
                  setDetailOpen(true);
                  setActionCustomer(null);
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><Eye className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">View Full Profile & Details</p>
                    <p className="text-[11px] text-slate-500">Inspect personal details, addresses, and children accounts</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
                onClick={() => {
                  setAvatarUpload({ customerId: actionCustomer.id, customerName: `${actionCustomer.firstName} ${actionCustomer.lastName}` });
                  setActionCustomer(null);
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600"><Pencil className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Upload Profile Photo</p>
                    <p className="text-[11px] text-slate-500">Update avatar photo for this customer account</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Change Account Status</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    disabled={actionCustomer.status === 'active'}
                    className={clsx(
                      "py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer",
                      actionCustomer.status === 'active'
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                    )}
                    onClick={() => {
                      handleStatusChange(actionCustomer, 'active');
                      setActionCustomer(null);
                    }}
                  >
                    Activate
                  </button>

                  <button
                    disabled={actionCustomer.status === 'flagged'}
                    className={clsx(
                      "py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer",
                      actionCustomer.status === 'flagged'
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                    )}
                    onClick={() => {
                      handleStatusChange(actionCustomer, 'flagged');
                      setActionCustomer(null);
                    }}
                  >
                    Flag
                  </button>

                  <button
                    disabled={actionCustomer.status === 'suspended'}
                    className={clsx(
                      "py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer",
                      actionCustomer.status === 'suspended'
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                    )}
                    onClick={() => {
                      handleStatusChange(actionCustomer, 'suspended');
                      setActionCustomer(null);
                    }}
                  >
                    Suspend
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                  onClick={() => {
                    setToDelete(actionCustomer);
                    setConfirmOpen(true);
                    setActionCustomer(null);
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-rose-100 text-rose-600"><Trash2 className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs font-bold text-rose-700">Delete Customer Account</p>
                      <p className="text-[11px] text-rose-500">Permanently erase customer records and access</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-rose-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {selected && (() => {
        const sAny = selected as any;
        const docs: Array<{ label: string; url: string; publicId?: string }> = [];
        const addDoc = (label: string, val: any) => {
          if (!val) return;
          if (typeof val === 'string' && val.trim()) {
            const trimmed = val.trim();
            const isRawKey = !trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/') && !trimmed.startsWith('data:') && !trimmed.startsWith('blob:');
            docs.push({ label, url: trimmed, ...(isRawKey ? { publicId: trimmed } : {}) });
          } else if (Array.isArray(val)) val.forEach((v, i) => addDoc(`${label} #${i + 1}`, v));
          else if (typeof val === 'object') {
            const pid = val.publicId || val.s3Key || val.key;
            const u = val.url || val.fileUrl || val.documentUrl || val.uri || pid;
            if (u || pid) {
              docs.push({ label: val.label || val.name || val.type || label, url: String(u || pid), ...(pid ? { publicId: String(pid) } : {}) });
            } else {
              Object.entries(val).forEach(([k, v]) => addDoc(`${label}: ${k}`, v));
            }
          }
        };
        addDoc('Profile Photo', sAny.avatar || sAny.profileImage || sAny.photo);
        addDoc('KYC Document', sAny.kycDocument || sAny.kycDocuments || sAny.documents || sAny.kyc?.documents);
        addDoc('ID Proof', sAny.idProof || sAny.aadhaar || sAny.pan);

        return (
          <Modal
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
            title={`Customer: ${selected.firstName} ${selected.lastName}`}
            size="md"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <Avatar initials={`${selected.firstName?.[0] || ''}${selected.lastName?.[0] || ''}`} src={withAdminDocToken(sAny.avatar || sAny.profileImage || sAny.photo)} size={48} />
                <div>
                  <p className="text-base font-bold text-slate-900">{selected.firstName} {selected.lastName}</p>
                  <p className="text-xs text-slate-500">{selected.email}</p>
                  <p className="text-xs text-slate-500">{selected.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DetailRow label="Role" value={<Badge className={ROLE_MAP[selected.role] || 'badge-gray'}>{selected.role}</Badge>} />
                <DetailRow label="Status" value={<Badge className={STATUS_MAP[selected.status] || 'badge-gray'}>{selected.status}</Badge>} />
                <DetailRow label="Total Bookings" value={<span className="font-semibold text-slate-900">{selected.bookings || 0}</span>} />
                <DetailRow label="Wallet Credits" value={<span className="font-bold text-emerald-600">₹{selected.walletCredits || 0}</span>} />
                <DetailRow
                  label="Last Active"
                  value={
                    selected.lastActive && !isNaN(new Date(selected.lastActive).getTime())
                      ? new Date(selected.lastActive).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : (selected.lastActive || '—')
                  }
                />
                <DetailRow label="Member Since" value={selected.joined || '—'} />
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#F05A22]" /> Uploaded Files & KYC Documents ({docs.length})
                </p>
                {docs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No files or KYC documents uploaded by this customer.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {docs.map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={async () => {
                          let key = d.publicId;
                          if (!key && d.url) {
                            try {
                              const parsed = new URL(d.url, 'https://api.getarenova.com');
                              key = parsed.searchParams.get('key') || (parsed.pathname.includes('/api/media/') && !parsed.pathname.endsWith('/signed-url')
                                ? decodeURIComponent(parsed.pathname.replace(/^.*\/api\/media\//, ''))
                                : undefined);
                            } catch {}
                          }
                          if (key) {
                            try {
                              const res = await getMediaSignedUrl(key);
                              const signedUrl = res?.url || res?.data?.url || res?.signedUrl;
                              if (signedUrl) {
                                window.open(signedUrl, '_blank', 'noopener,noreferrer');
                                return;
                              }
                            } catch (err: any) {
                              alert(err?.message || 'Failed to open protected document.');
                              return;
                            }
                          }
                          window.open(withAdminDocToken(d.url), '_blank', 'noopener,noreferrer');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs text-left cursor-pointer"
                      >
                        <span className="font-semibold text-slate-800 truncate pr-2">{d.label}</span>
                        <span className="text-[#F05A22] font-bold flex items-center gap-1 flex-shrink-0">
                          View <ExternalLink className="h-3 w-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => {
                    const target = selected;
                    setDetailOpen(false);
                    if (target) setActionCustomer(target);
                  }}
                >
                  ← Back
                </Button>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      <Modal
        open={!!avatarUpload}
        onClose={() => { setAvatarUpload(null); setAvatarError(''); }}
        title={`Update Avatar - ${avatarUpload?.customerName}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="customer-avatar-file" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Image <span className="text-slate-400 font-normal">(JPG, PNG, WebP · Max 5 MB)</span>
            </label>
            <input
              id="customer-avatar-file"
              name="customerAvatar"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
              className="input-field"
            />
            {uploadingAvatar && <p className="text-xs text-slate-500 mt-1.5">Uploading image...</p>}
            {avatarError && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5 mt-2 leading-relaxed">
                {avatarError}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                const cid = avatarUpload?.customerId;
                setAvatarUpload(null);
                setAvatarError('');
                const match = customerList.find(c => (c.id || (c as any)._id) === cid);
                if (match) setActionCustomer(match);
              }}
            >
              ← Back
            </Button>
            <Button variant="outline" onClick={() => { setAvatarUpload(null); setAvatarError(''); }}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={handleDelete}
        title="Delete Customer Account"
        message={`Are you sure you want to permanently delete ${toDelete?.firstName} ${toDelete?.lastName}? This action cannot be undone.`}
        confirmLabel="Delete Customer"
        danger
      />
    </div>
  );
}

