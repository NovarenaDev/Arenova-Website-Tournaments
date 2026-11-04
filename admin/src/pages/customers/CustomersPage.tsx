import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus, Users, Wallet, AlertTriangle, Baby, ChevronDown,
  ChevronUp, ChevronRight, Pencil, Ban, Trash2, MapPin, Mail,
  Phone, Calendar, Clock, Eye, CheckCircle2
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardContent, Badge, Avatar, Button,
  SearchBar, FilterPill, StatCard, Table, Thead, Tbody, Th, Td, Tr,
  EmptyState, Modal, ConfirmDialog, Input, Select, DetailRow
} from '../../components/ui';
import { getCustomers, updateCustomerStatus, deleteCustomer, uploadImage, extractDataList } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Customer } from '../../types';
import { clsx } from 'clsx';

const STATUS_MAP: Record<string, string> = { active: 'badge-green', flagged: 'badge-amber', suspended: 'badge-red' };
const ROLE_MAP:   Record<string, string> = { parent: 'badge-purple', individual: 'badge-blue' };
const FILTERS      = ['All', 'Active', 'Flagged', 'Suspended'];
const ROLE_FILTERS = ['All Users', 'Parents', 'Individual'];

function inactiveDays(lastActive?: string): number {
  if (!lastActive) return 999;
  const now = new Date();
  try {
    const d = new Date(lastActive);
    return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  } catch { return 999; }
}

function inactiveBadge(days: number) {
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
  const [actionCustomer, setActionCustomer] = useState<Customer | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCustomers({ limit: 100 });
      const list = extractDataList<Customer>(res);
      const seen = new Set<string>();
      const unique: Customer[] = [];
      for (const c of list) {
        const id = c.id || (c as any)._id;
        if (id && !seen.has(String(id))) {
          seen.add(String(id));
          unique.push(c);
        } else if (!id) {
          unique.push(c);
        }
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
    const matchSearch = search === '' ||
      `${c.firstName || ''} ${c.lastName || ''} ${c.email || ''} ${c.phone || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filter === 'All' || c.status?.toLowerCase() === filter.toLowerCase();
    const matchRole   = roleFilter === 'All Users' ||
      (roleFilter === 'Parents' && c.role === 'parent') ||
      (roleFilter === 'Individual' && c.role === 'individual');
    return matchSearch && matchStatus && matchRole;
  });

  const handleStatusChange = async (customer: Customer, status: string) => {
    try {
      await updateCustomerStatus(customer.id, status);
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, status: status as any } : c));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteCustomer(toDelete.id);
      setCustomers(prev => prev.filter(c => c.id !== toDelete.id));
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
    
    try {
      setUploadingAvatar(true);
      const res = await uploadImage(file);
      if (res.success) {
        setCustomers(prev => prev.map(c => 
          c.id === avatarUpload.customerId ? { ...c, avatar: res.url } : c
        ));
        setAvatarUpload(null);
      }
    } catch (err: any) {
      alert(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const stats = {
    total:     customers.length,
    active:    customers.filter(c => c.status === 'active').length,
    flagged:   customers.filter(c => c.status === 'flagged').length,
    suspended: customers.filter(c => c.status === 'suspended').length,
    parents:   customers.filter(c => c.role === 'parent').length,
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 p-3 sm:p-5 min-w-0 max-w-full">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Users"  value={String(stats.total)}     icon={<Users className="h-4 w-4 text-blue-500"/>}         iconBg="bg-blue-50" />
        <StatCard label="Active"       value={String(stats.active)}    icon={<Users className="h-4 w-4 text-emerald-500"/>}      iconBg="bg-emerald-50" />
        <StatCard label="Flagged"      value={String(stats.flagged)}   icon={<AlertTriangle className="h-4 w-4 text-amber-500"/>}iconBg="bg-amber-50" />
        <StatCard label="Suspended"    value={String(stats.suspended)} icon={<Ban className="h-4 w-4 text-rose-500"/>}          iconBg="bg-rose-50" />
        <StatCard label="Parents"      value={String(stats.parents)}   icon={<Baby className="h-4 w-4 text-purple-500"/>}        iconBg="bg-purple-50" />
      </div>

      {/* Main card */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search customers..." />
            <div className="flex gap-1 flex-wrap">
              {FILTERS.map(f => (
                <FilterPill key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />
              ))}
            </div>
            <div className="flex gap-1 flex-wrap">
              {ROLE_FILTERS.map(r => (
                <FilterPill key={r} label={r} active={roleFilter === r} onClick={() => setRoleFilter(r)} />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12">
              <EmptyState icon={<Users className="h-8 w-8 text-slate-300" />} title="No customers found" />
            </div>
          ) : (
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
                {filtered.map(c => {
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
                            <Avatar initials={initials} size={32} />
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
          )}
        </CardContent>
      </Card>

      {/* Customer Action Popup Modal */}
      <Modal
        open={Boolean(actionCustomer)}
        onClose={() => setActionCustomer(null)}
        title="Manage Customer"
        size="md"
      >
        {actionCustomer && (
          <div className="space-y-4">
            {/* Customer Summary Banner */}
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

            {/* Quick Actions List */}
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

              {/* Status Change Buttons */}
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

              {/* Danger: Delete */}
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

      {/* Customer Detail Modal */}
      {selected && (
        <Modal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          title={`Customer: ${selected.firstName} ${selected.lastName}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <Avatar initials={`${selected.firstName?.[0] || ''}${selected.lastName?.[0] || ''}`} size={48} />
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
              <DetailRow label="Last Active" value={selected.lastActive || '—'} />
              <DetailRow label="Member Since" value={selected.joined || '—'} />
            </div>
          </div>
        </Modal>
      )}

      {/* Avatar Upload Modal */}
      <Modal
        open={!!avatarUpload}
        onClose={() => setAvatarUpload(null)}
        title={`Update Avatar - ${avatarUpload?.customerName}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
              className="input-field"
            />
            {uploadingAvatar && <p className="text-xs text-slate-500 mt-1">Uploading...</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAvatarUpload(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Dialog */}
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
