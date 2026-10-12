import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Shield, Trash2, Pencil, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar, Button, SearchBar, Modal, Input, Select, StatCard, Table, Thead, Tbody, Th, Td, Tr, EmptyState, ConfirmDialog, DetailRow } from '../../components/ui';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, resetAdminPassword } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { AdminRole, AdminUser } from '../../types';
import { ROLE_LABELS, ROLE_COLORS, ROLE_PERMISSIONS } from '../../types';

const ROLE_OPTIONS = Object.entries(ROLE_LABELS)
  .filter(([k]) => k !== 'super_admin')
  .map(([value, label]) => ({ value, label }));

const ALL_PAGES = ['dashboard', 'customers', 'coaches', 'bookings', 'payments', 'ratings', 'sports', 'admins'];

function AdminViewModal({ admin, open, onClose }: { admin: AdminUser | null; open: boolean; onClose: () => void }) {
  if (!admin) return null;
  const perms = ROLE_PERMISSIONS[admin.role];
  return (
    <Modal open={open} onClose={onClose} title="Admin Details" size="md">
      <div className="flex items-center gap-4 pb-5 border-b border-[#2e3139] mb-5">
        <Avatar initials={`${admin.firstName[0]}${admin.lastName[0]}`} size={56} />
        <div>
          <h2 className="text-lg font-bold text-white">{admin.firstName} {admin.lastName}</h2>
          <p className="text-xs text-[#9ba3af] mt-0.5">{admin.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={ROLE_COLORS[admin.role]}>{ROLE_LABELS[admin.role]}</Badge>
            <Badge className={admin.isActive ? 'badge-green' : 'badge-gray'}>{admin.isActive ? 'Active' : 'Inactive'}</Badge>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <DetailRow label="Admin ID"   value={<span className="font-mono text-[#9ba3af]">#{admin.id}</span>} />
        <DetailRow label="Created"    value={admin.createdAt} />
        <DetailRow label="Added By"   value={admin.createdBy ? `Admin #${admin.createdBy}` : <span className="text-purple-400">System</span>} />
        <DetailRow label="Last Login" value={admin.lastLogin || <span className="text-[#5c6370]">—</span>} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5c6370] mb-3">Permissions</p>
        <div className="grid grid-cols-1 gap-2">
          {ALL_PAGES.map(page => {
            const canRead  = perms.includes(page as any);
            const canWrite = perms.includes(`${page}_write` as any);
            if (!canRead && !canWrite) return (
              <div key={page} className="flex items-center justify-between bg-[#0e0f11] rounded-lg px-3 py-2 opacity-40">
                <span className="text-xs text-[#5c6370] capitalize">{page}</span>
                <span className="text-[10px] text-[#5c6370]">No Access</span>
              </div>
            );
            return (
              <div key={page} className="flex items-center justify-between bg-[#1a1c20] rounded-lg px-3 py-2">
                <span className="text-xs font-medium text-white capitalize">{page}</span>
                <div className="flex gap-1.5">
                  {canRead  && <Badge className="badge-blue">View</Badge>}
                  {canWrite && <Badge className="badge-green">Edit</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

function AdminFormModal({ admin, open, onClose, onSave }: { admin: AdminUser | null; open: boolean; onClose: () => void; onSave: (a: any) => void }) {
  const isEdit = !!admin;
  const [form, setForm] = useState({ firstName: admin?.firstName || '', lastName: admin?.lastName || '', email: admin?.email || '', role: (admin?.role || 'viewer') as AdminRole, password: '' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Admin' : 'Add Admin'} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name" value={form.firstName} onChange={set('firstName')} placeholder="John" />
          <Input label="Last Name"  value={form.lastName}  onChange={set('lastName')}  placeholder="Doe"  />
        </div>
        <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="admin@kridext.in" />
        {!isEdit && <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Minimum 8 characters" />}
        <Select label="Role" value={form.role} onChange={set('role') as any} options={ROLE_OPTIONS} />
        <div className="bg-[#141518] border border-[#2e3139] rounded-xl p-3">
          <p className="text-[10px] font-semibold text-[#5c6370] uppercase tracking-wider mb-2">Permissions for {ROLE_LABELS[form.role]}</p>
          <div className="flex flex-wrap gap-1.5">
            {ROLE_PERMISSIONS[form.role].filter(p => !p.includes('_write')).map(p => (
              <Badge key={p} className="badge-blue capitalize">{p}</Badge>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave(form)}>Save Admin</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminsPage() {
  const { admin: currentAdmin, can } = useAuth();
  const [admins, setAdmins]     = useState<AdminUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [viewA, setViewA]       = useState<AdminUser | null>(null);
  const [editA, setEditA]       = useState<AdminUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteA, setDeleteA]   = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getAdmins();
      setAdmins(res.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = admins.filter(a =>
    search === '' || `${a.firstName} ${a.lastName} ${a.email} ${a.role}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (form: any) => {
    try {
      if (editA) {
        const { password, ...updates } = form;
        await updateAdmin(editA.id, updates);
        setAdmins(prev => prev.map(a => a.id === editA.id ? { ...a, ...updates } : a));
      } else {
        const res = await createAdmin(form);
        setAdmins(prev => [...prev, res.data]);
      }
    } catch (err: any) { alert(err.message || 'Save failed'); }
    setFormOpen(false); setEditA(null);
  };

  const handleDelete = async () => {
    if (!deleteA) return;
    try {
      await deleteAdmin(deleteA.id);
      setAdmins(prev => prev.filter(a => a.id !== deleteA.id));
    } catch (err: any) { alert(err.message || 'Delete failed'); }
    setDeleteA(null);
  };

  const stats = { total: admins.length, active: admins.filter(a => a.isActive).length, roles: new Set(admins.map(a => a.role)).size };

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Total Admins" value={String(stats.total)}  icon={<Shield className="h-4 w-4 text-[#F05A22]" />} iconBg="bg-[#F05A22]/10" />
        <StatCard label="Active"       value={String(stats.active)} icon={<Shield className="h-4 w-4 text-emerald-400" />} iconBg="bg-emerald-400/10" />
        <StatCard label="Roles Used"   value={String(stats.roles)}  icon={<UserPlus className="h-4 w-4 text-blue-400" />}  iconBg="bg-blue-400/10" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admins ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2">
            <SearchBar value={search} onChange={setSearch} placeholder="Search admins..." />
            {can('admins_write') && (
              <Button variant="primary" className="h-8 gap-1.5" onClick={() => { setEditA(null); setFormOpen(true); }}>
                <UserPlus className="h-3.5 w-3.5" /> Add Admin
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-12"><div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" /></div>
            : filtered.length === 0 ? <EmptyState icon={<Shield className="h-8 w-8" />} title="No admins found" />
            : (
              <Table>
                <Thead><Tr><Th>Admin</Th><Th>Role</Th><Th>Status</Th><Th>Created</Th><Th>Last Login</Th>{can('admins_write') && <Th>Actions</Th>}</Tr></Thead>
                <Tbody>
                  {filtered.map(a => (
                    <Tr key={a.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar initials={`${a.firstName[0]}${a.lastName[0]}`} size={34} />
                          <div>
                            <p className="text-sm font-medium text-white">{a.firstName} {a.lastName}</p>
                            <p className="text-[11px] text-[#5c6370]">{a.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td><Badge className={ROLE_COLORS[a.role]}>{ROLE_LABELS[a.role]}</Badge></Td>
                      <Td><Badge className={a.isActive ? 'badge-green' : 'badge-gray'}>{a.isActive ? 'Active' : 'Inactive'}</Badge></Td>
                      <Td className="text-xs text-[#5c6370]">{a.createdAt}</Td>
                      <Td className="text-xs text-[#5c6370]">{a.lastLogin ? new Date(a.lastLogin).toLocaleDateString('en-IN') : '—'}</Td>
                      {can('admins_write') && (
                        <Td>
                          <div className="flex gap-1.5">
                            <button onClick={() => setViewA(a)} className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-white hover:bg-[#21242a]"><Eye className="h-3.5 w-3.5" /></button>
                            {a.id !== currentAdmin?.id && a.role !== 'super_admin' && (
                              <>
                                <button onClick={() => { setEditA(a); setFormOpen(true); }} className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-white hover:bg-[#21242a]"><Pencil className="h-3.5 w-3.5" /></button>
                                <button onClick={() => setDeleteA(a)} className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-red-400 hover:bg-red-400/10"><Trash2 className="h-3.5 w-3.5" /></button>
                              </>
                            )}
                          </div>
                        </Td>
                      )}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
        </CardContent>
      </Card>

      <AdminViewModal admin={viewA} open={!!viewA} onClose={() => setViewA(null)} />
      <AdminFormModal admin={editA} open={formOpen} onClose={() => { setFormOpen(false); setEditA(null); }} onSave={handleSave} />
      <ConfirmDialog open={!!deleteA} onClose={() => setDeleteA(null)} title="Delete Admin"
        message={`Remove admin access for ${deleteA?.firstName} ${deleteA?.lastName}? This cannot be undone.`}
        confirmLabel="Delete" danger={true} onConfirm={handleDelete} />
    </div>
  );
}
