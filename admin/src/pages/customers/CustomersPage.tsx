import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Users, Wallet, AlertTriangle, Baby, ChevronDown, ChevronUp, Pencil, Ban, Trash2, MapPin, Mail, Phone, Calendar, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar, Button, SearchBar, FilterPill, StatCard, Table, Thead, Tbody, Th, Td, Tr, EmptyState, Modal, ConfirmDialog, Input, Select, DetailRow } from '../../components/ui';
import { getCustomers, updateCustomerStatus, deleteCustomer, uploadImage, extractDataList } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Customer } from '../../types';


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

  const load = useCallback(async () => {
    try {
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
        // Update customer avatar in local state
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
        <StatCard label="Total Users"  value={String(stats.total)}     icon={<Users className="h-4 w-4 text-blue-400"/>}         iconBg="bg-blue-400/10" />
        <StatCard label="Active"       value={String(stats.active)}    icon={<Users className="h-4 w-4 text-emerald-400"/>}       iconBg="bg-emerald-400/10" />
        <StatCard label="Flagged"      value={String(stats.flagged)}   icon={<AlertTriangle className="h-4 w-4 text-amber-400"/>} iconBg="bg-amber-400/10" />
        <StatCard label="Suspended"    value={String(stats.suspended)} icon={<Ban className="h-4 w-4 text-red-400"/>}             iconBg="bg-red-400/10" />
        <StatCard label="Parents"      value={String(stats.parents)}   icon={<Baby className="h-4 w-4 text-purple-400"/>}         iconBg="bg-purple-400/10" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customers ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search customers..." />
            <div className="flex gap-1 flex-wrap">
              {FILTERS.map(f => <FilterPill key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />)}
            </div>
            <div className="flex gap-1 flex-wrap">
              {ROLE_FILTERS.map(f => <FilterPill key={f} label={f} active={roleFilter === f} onClick={() => setRoleFilter(f)} />)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Users className="h-8 w-8" />} title="No customers found" />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th></Th>
                  <Th>Customer</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Bookings</Th>
                  <Th>Last Active</Th>
                  <Th>Wallet</Th>
                  {can('customers_write') && <Th>Actions</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map(c => {
                  const days = inactiveDays(c.lastActive);
                  const isExpanded = expanded === c.id;
                  const initials = `${c.firstName?.[0] || ''}${c.lastName?.[0] || ''}` || '?';
                  return (
                    <React.Fragment key={c.id}>
                      <Tr onClick={() => { setSelected(c); setDetailOpen(true); }} className="cursor-pointer">
                        <Td onClick={e => { e.stopPropagation(); setExpanded(isExpanded ? null : c.id); }}>
                          <button className="text-[#5c6370] hover:text-white">
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar initials={initials} size={32} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate max-w-[160px] sm:max-w-[200px]" title={(c.firstName || '') + ' ' + (c.lastName || '')}>{(c.firstName || '') + ' ' + (c.lastName || '') || 'Unknown'}</p>
                              <p className="text-[11px] text-[#5c6370] truncate max-w-[160px] sm:max-w-[200px]" title={c.email}>{c.email || 'No email'}</p>
                            </div>
                          </div>
                        </Td>
                        <Td><Badge className={ROLE_MAP[c.role] || 'badge-gray'}>{c.role || 'user'}</Badge></Td>
                        <Td><Badge className={STATUS_MAP[c.status] || 'badge-gray'}>{c.status || 'active'}</Badge></Td>
                        <Td><span className="text-sm text-white">{c.bookings || 0}</span></Td>
                        <Td>{inactiveBadge(days)}</Td>
                        <Td><span className="text-sm text-emerald-400 font-medium">₹{c.walletCredits || 0}</span></Td>
                        {can('customers_write') && (
                          <Td onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <Button variant="ghost" className="h-7 text-[10px] px-2 text-blue-400 hover:bg-blue-400/10"
                                onClick={() => setAvatarUpload({ customerId: c.id, customerName: `${c.firstName} ${c.lastName}` })}>
                                Avatar
                              </Button>
                              {c.status !== 'active' && (
                                <Button variant="ghost" className="h-7 text-[10px] px-2 text-emerald-400 hover:bg-emerald-400/10"
                                  onClick={() => handleStatusChange(c, 'active')}>Activate</Button>
                              )}
                              {c.status !== 'flagged' && (
                                <Button variant="ghost" className="h-7 text-[10px] px-2 text-amber-400 hover:bg-amber-400/10"
                                  onClick={() => handleStatusChange(c, 'flagged')}>Flag</Button>
                              )}
                              {c.status !== 'suspended' && (
                                <Button variant="ghost" className="h-7 text-[10px] px-2 text-red-400 hover:bg-red-400/10"
                                  onClick={() => handleStatusChange(c, 'suspended')}>Suspend</Button>
                              )}
                              <button className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                onClick={() => { setToDelete(c); setConfirmOpen(true); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </Td>
                        )}
                      </Tr>
                      {isExpanded && (
                        <Tr key={c.id + '-exp'}>
                          <Td colSpan={can('customers_write') ? 8 : 7}>
                            <div className="px-4 py-3 bg-[#0e0f11] rounded-xl border border-[#2e3139] m-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <DetailRow label="Phone"   value={c.phone} />
                              <DetailRow label="Joined"  value={c.joined} />
                              {c.address && (
                                <DetailRow label="City" value={`${c.address.city}, ${c.address.state}`} />
                              )}
                              {c.role === 'parent' && (
                                <DetailRow label="Children" value={String(c.children)} />
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

      <Modal
        open={!!avatarUpload}
        onClose={() => setAvatarUpload(null)}
        title={`Update Avatar - ${avatarUpload?.customerName}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#9ba3af] mb-1.5">Customer Avatar</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
              className="input-field"
            />
            {uploadingAvatar && <p className="text-xs text-[#9ba3af] mt-1">Uploading...</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAvatarUpload(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete ${toDelete?.firstName} ${toDelete?.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        danger={true}
      />
    </div>
  );
}
