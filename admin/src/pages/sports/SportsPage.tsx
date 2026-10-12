import { useState, useEffect, useCallback } from 'react';
import { Medal, Plus, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, SearchBar, StatCard, Table, Thead, Tbody, Th, Td, Tr, EmptyState, Modal, ConfirmDialog, Input } from '../../components/ui';
import { getAdminSports, createSport, updateSport, deleteSport, uploadImage } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Sport } from '../../types';


export default function SportsPage() {
  const { can } = useAuth();
  const [sports, setSports]     = useState<Sport[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState<Sport | null>(null);
  const [toDelete, setToDelete] = useState<Sport | null>(null);
  const [form, setForm]         = useState<{
    name: string;
    emoji: string;
    status: 'active' | 'inactive';
    image: string;
  }>({ name: '', emoji: '', status: 'active', image: '' });
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getAdminSports();
      setSports(res.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ name: '', emoji: '', status: 'active', image: '' }); setModalOpen(true); };
  const openEdit   = (s: Sport) => { setEditing(s); setForm({ name: s.name, emoji: s.emoji, status: s.status, image: s.image || '' }); setModalOpen(true); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploading(true);
      const res = await uploadImage(file);
      if (res.success) {
        setForm(f => ({ ...f, image: res.url }));
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await updateSport(editing.id, form);
        setSports(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
      } else {
        const res = await createSport(form);
        setSports(prev => [...prev, res.data]);
      }
      setModalOpen(false);
    } catch (err: any) { alert(err.message || 'Save failed'); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteSport(toDelete.id);
      setSports(prev => prev.filter(s => s.id !== toDelete.id));
    } catch (err: any) { alert(err.message || 'Delete failed'); }
    finally { setToDelete(null); }
  };

  const filtered = sports.filter(s =>
    search === '' || s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Sports"   value={String(sports.length)}                               icon={<Medal className="h-4 w-4 text-[#F05A22]"/>} iconBg="bg-[#F05A22]/10" />
        <StatCard label="Active"         value={String(sports.filter(s => s.status === 'active').length)} icon={<Medal className="h-4 w-4 text-emerald-400"/>} iconBg="bg-emerald-400/10" />
        <StatCard label="Total Bookings" value={String(sports.reduce((a, s) => a + (s.bookings || 0), 0))} icon={<Medal className="h-4 w-4 text-blue-400"/>} iconBg="bg-blue-400/10" />
        <StatCard label="Total Revenue"  value={`₹${(sports.reduce((a, s) => a + (s.revenue || 0), 0) / 1000).toFixed(0)}K`} icon={<Medal className="h-4 w-4 text-amber-400"/>} iconBg="bg-amber-400/10" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sports ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2">
            <SearchBar value={search} onChange={setSearch} placeholder="Search sports..." />
            {can('sports_write') && (
              <Button variant="primary" className="h-8 gap-1.5" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> Add Sport
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
            </div>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Sport</Th>
                  <Th>Coaches</Th>
                  <Th>Bookings</Th>
                  <Th>Revenue</Th>
                  <Th>Trend</Th>
                  <Th>Status</Th>
                  {can('sports_write') && <Th>Actions</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map(s => (
                  <Tr key={s.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{s.emoji}</span>
                        <span className="text-sm font-medium text-white">{s.name}</span>
                      </div>
                    </Td>
                    <Td><span className="text-sm text-white">{s.coaches}</span></Td>
                    <Td><span className="text-sm text-white">{s.bookings}</span></Td>
                    <Td><span className="text-sm text-emerald-400 font-medium">₹{(s.revenue / 1000).toFixed(0)}K</span></Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        {s.trendUp
                          ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                          : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                        <span className={`text-xs ${s.trendUp ? 'text-emerald-400' : 'text-red-400'}`}>{s.trend}</span>
                      </div>
                    </Td>
                    <Td>
                      <Badge className={s.status === 'active' ? 'badge-green' : 'badge-red'}>{s.status}</Badge>
                    </Td>
                    {can('sports_write') && (
                      <Td>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEdit(s)} className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-white hover:bg-[#21242a]">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setToDelete(s)} className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-red-400 hover:bg-red-400/10">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Sport' : 'Add Sport'}>
        <div className="space-y-4">
          <Input label="Sport Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Cricket" />
          <Input label="Emoji" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="e.g. ??" />
          <div>
            <label className="block text-xs font-medium text-[#9ba3af] mb-1.5">Sport Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="input-field"
            />
            {uploading && <p className="text-xs text-[#9ba3af] mt-1">Uploading...</p>}
            {form.image && (
              <div className="mt-2">
                <img src={form.image} alt="Preview" className="h-16 w-16 object-cover rounded" />
                <p className="text-xs text-[#9ba3af] mt-1">Image uploaded successfully</p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-[#9ba3af] mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
              className="input-field">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Sport"
        message={`Delete ${toDelete?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        danger={true}
      />
    </div>
  );
}
