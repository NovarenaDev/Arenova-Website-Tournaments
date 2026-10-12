import { useState, useEffect, useCallback } from 'react';
import { MapPin, Building2, Star, Plus, CheckCircle, Pencil, Trash2, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, SearchBar, FilterPill, StatCard, Table, Thead, Tbody, Th, Td, Tr, EmptyState, Modal, ConfirmDialog, Input, Textarea, DetailRow } from '../../components/ui';
import { getAdminVenues, getVenues, getVenue, createVenue, updateVenue, deleteVenue, uploadImage } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_MAP: Record<string, string> = { active: 'badge-green', pending: 'badge-amber', inactive: 'badge-gray', rejected: 'badge-red' };
type Venue = { id: string; _id?: string; name: string; location?: string; city?: string; sports: string[]; rating: number; courts?: number; pricePerHour?: number; pricePerHr?: string; status: string; verified?: boolean; desc?: string; description?: string; added?: string; images?: string[]; };
const FILTERS = ['All', 'Active', 'Pending', 'Inactive'];
const ALL_SPORTS = ['Cricket', 'Football', 'Tennis', 'Badminton', 'Swimming', 'Basketball'];

function VenueFormModal({ v, open, onClose, onSave }: { v: Venue | null; open: boolean; onClose: () => void; onSave: (x: any) => void }) {
  const isEdit = !!v;
  const [form, setForm] = useState({ name: v?.name || '', city: v?.city || v?.location || '', pricePerHour: String(v?.pricePerHour || ''), desc: v?.desc || v?.description || '', images: v?.images || [] });
  const [uploading, setUploading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploading(true);
      const res = await uploadImage(file);
      if (res.success) {
        setForm(f => ({ ...f, images: [...f.images, res.url] }));
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Venue' : 'Add Venue'} size="md">
      <div className="space-y-4">
        <Input label="Venue Name" value={form.name} onChange={set('name')} placeholder="Sports Complex Name" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="City" value={form.city} onChange={set('city')} placeholder="Gachibowli" />
          <Input label="Price per Hour (₹)" type="number" value={form.pricePerHour} onChange={set('pricePerHour')} placeholder="300" />
        </div>
        <Textarea label="Description" value={form.desc} onChange={set('desc')} rows={3} placeholder="About this venue..." />
        <div>
          <label className="block text-xs font-medium text-[#9ba3af] mb-1.5">Venue Images</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="input-field"
          />
          {uploading && <p className="text-xs text-[#9ba3af] mt-1">Uploading...</p>}
          {form.images.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {form.images.map((img, index) => (
                <div key={index} className="relative group">
                  <img src={img} alt={`Venue ${index + 1}`} className="h-20 w-full object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave({ ...form, pricePerHour: Number(form.pricePerHour) })}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function VenuesPage() {
  const { can } = useAuth();
  const [venues, setVenues]       = useState<Venue[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('All');
  const [viewV, setViewV]         = useState<Venue | null>(null);
  const [editV, setEditV]         = useState<Venue | null>(null);
  const [formOpen, setFormOpen]   = useState(false);
  const [deleteV, setDeleteV]     = useState<Venue | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getAdminVenues().catch(() => getVenues());
      const data = res.data || res || [];
      setVenues(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load venues', e);
      setVenues([]);
    } finally { setLoading(false); }
  }, []);

  const openViewVenue = async (v: Venue) => {
    setViewV(v);
    try {
      const res = await getVenue(v._id || v.id);
      const detail = res.data || res;
      if (detail && detail.name) {
        setViewV(detail);
      }
    } catch {
      // Keep existing venue object if detail call fails
    }
  };

  useEffect(() => { load(); }, [load]);

  const filtered = venues.filter(v => {
    const ms = search === '' || `${v.name} ${v.city || v.location}`.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'All' || v.status.toLowerCase() === filter.toLowerCase();
    return ms && mf;
  });

  const handleSave = async (form: any) => {
    try {
      if (editV) {
        const id = editV._id || editV.id;
        await updateVenue(id, form);
        setVenues(prev => prev.map(v => (v._id || v.id) === id ? { ...v, ...form } : v));
      } else {
        const res = await createVenue(form);
        setVenues(prev => [...prev, { ...res.data, id: res.data._id || res.data.id }]);
      }
    } catch (err: any) { alert(err.message || 'Save failed'); }
    setFormOpen(false); setEditV(null);
  };

  const handleDelete = async () => {
    if (!deleteV) return;
    try {
      await deleteVenue(deleteV._id || deleteV.id);
      setVenues(prev => prev.filter(v => (v._id || v.id) !== (deleteV._id || deleteV.id)));
    } catch (err: any) { alert(err.message || 'Delete failed'); }
    setDeleteV(null);
  };

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Venues"  value={String(venues.length)}                                       icon={<Building2 className="h-4 w-4 text-[#F05A22]" />}     iconBg="bg-[#F05A22]/10" />
        <StatCard label="Active"        value={String(venues.filter(v => v.status === 'active').length)}    icon={<CheckCircle className="h-4 w-4 text-emerald-400" />}  iconBg="bg-emerald-400/10" />
        <StatCard label="Pending"       value={String(venues.filter(v => v.status === 'pending').length)}   icon={<MapPin className="h-4 w-4 text-amber-400" />}         iconBg="bg-amber-400/10" />
        <StatCard label="Avg Rating"    value={venues.length ? (venues.reduce((s, v) => s + v.rating, 0) / venues.length).toFixed(1) + ' ★' : '—'} icon={<Star className="h-4 w-4 text-amber-400" />} iconBg="bg-amber-400/10" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Venues ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search venues..." />
            <div className="flex gap-1 flex-wrap">{FILTERS.map(f => <FilterPill key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />)}</div>
            {can('sports_write') && <Button variant="primary" className="h-8 gap-1.5" onClick={() => { setEditV(null); setFormOpen(true); }}><Plus className="h-3.5 w-3.5" />Add Venue</Button>}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-12"><div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" /></div>
            : filtered.length === 0 ? <EmptyState icon={<MapPin className="h-8 w-8" />} title="No venues found" />
            : (
              <Table>
                <Thead><Tr><Th>Venue</Th><Th>City</Th><Th>Sports</Th><Th>Rating</Th><Th>Price/Hr</Th><Th>Status</Th><Th>Verified</Th>{can('sports_write') && <Th>Actions</Th>}</Tr></Thead>
                <Tbody>
                  {filtered.map(v => (
                    <Tr key={v._id || v.id}>
                      <Td><span className="text-sm font-medium text-white">{v.name}</span></Td>
                      <Td><span className="text-xs text-[#9ba3af]">{v.city || v.location}</span></Td>
                      <Td><div className="flex gap-1 flex-wrap">{(v.sports || []).slice(0, 2).map(s => <Badge key={s} className="badge-blue">{s}</Badge>)}{v.sports?.length > 2 && <Badge className="badge-gray">+{v.sports.length - 2}</Badge>}</div></Td>
                      <Td><div className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="text-sm text-white">{v.rating}</span></div></Td>
                      <Td><span className="text-sm text-[#F05A22] font-medium">{v.pricePerHour ? `₹${v.pricePerHour}` : v.pricePerHr || '—'}</span></Td>
                      <Td><Badge className={STATUS_MAP[v.status] || 'badge-gray'}>{v.status}</Badge></Td>
                      <Td>{v.verified ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <span className="text-xs text-[#5c6370]">—</span>}</Td>
                      {can('sports_write') && (
                        <Td>
                          <div className="flex gap-1.5">
                            <button onClick={() => openViewVenue(v)} className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-white hover:bg-[#21242a]"><Eye className="h-3.5 w-3.5" /></button>
                            <button onClick={() => { setEditV(v); setFormOpen(true); }} className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-white hover:bg-[#21242a]"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setDeleteV(v)} className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-red-400 hover:bg-red-400/10"><Trash2 className="h-3.5 w-3.5" /></button>
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

      {viewV && (
        <Modal open={!!viewV} onClose={() => setViewV(null)} title="Venue Details" size="md">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-[#1B2B6B]/30 flex items-center justify-center flex-shrink-0"><Building2 className="h-6 w-6 text-blue-400" /></div>
              <div><h2 className="text-lg font-bold text-white">{viewV.name}</h2><p className="text-sm text-[#9ba3af] mt-0.5">{viewV.desc || viewV.description}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="City"       value={viewV.city || viewV.location || '—'} />
              <DetailRow label="Status"     value={<Badge className={STATUS_MAP[viewV.status]}>{viewV.status}</Badge>} />
              <DetailRow label="Rating"     value={<span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="font-semibold">{viewV.rating}</span></span>} />
              <DetailRow label="Price/Hour" value={<span className="text-[#F05A22] font-semibold">{viewV.pricePerHour ? `₹${viewV.pricePerHour}` : viewV.pricePerHr || '—'}</span>} />
            </div>
            <DetailRow label="Sports" value={<div className="flex flex-wrap gap-1.5 mt-0.5">{(viewV.sports || []).map(s => <Badge key={s} className="badge-blue">{s}</Badge>)}</div>} />
          </div>
        </Modal>
      )}

      <VenueFormModal v={editV} open={formOpen} onClose={() => { setFormOpen(false); setEditV(null); }} onSave={handleSave} />
      <ConfirmDialog open={!!deleteV} onClose={() => setDeleteV(null)} title="Delete Venue"
        message={`Delete "${deleteV?.name}"? This cannot be undone.`} confirmLabel="Delete" danger={true} onConfirm={handleDelete} />
    </div>
  );
}
