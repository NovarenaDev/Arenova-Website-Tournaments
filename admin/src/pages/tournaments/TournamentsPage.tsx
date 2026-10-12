import { useState, useEffect, useCallback } from 'react';
import { Medal, Users, CalendarDays, Trophy, Plus, MapPin, Clock, Pencil, Trash2, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, SearchBar, FilterPill, StatCard, Table, Thead, Tbody, Th, Td, Tr, EmptyState, Modal, ConfirmDialog, Input, Select, Textarea, DetailRow } from '../../components/ui';
import { getAdminTournaments, createTournament, updateTournament, deleteTournament, getTournamentOptions, updateTournamentStatus, getTournamentRegistrations } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_MAP: Record<string, string> = {
  upcoming: 'badge-blue',
  ongoing: 'badge-green',
  completed: 'badge-gray',
  cancelled: 'badge-red',
  draft: 'badge-blue',
  published: 'badge-green',
  DRAFT: 'badge-blue',
  PUBLISHED: 'badge-green',
  UPCOMING: 'badge-blue',
  ONGOING: 'badge-green',
  COMPLETED: 'badge-gray',
  CANCELLED: 'badge-red'
};
const SPORT_ICONS: Record<string, string> = { Cricket: '🏏', Football: '⚽', Tennis: '🎾', Badminton: '🏸', Swimming: '🏊', Basketball: '🏀' };

type Tournament = {
  id: string;
  _id?: string;
  title: string;
  sport: string;
  registrationType?: string;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  status: string;
  city?: string;
  location?: string;
  venue?: string;
  registrations?: number;
  maxTeams?: number;
  prize?: string;
  description?: string;
  image?: string;
  banner?: string;
  registrationFee?: number;
  categories?: {
    name: string;
    capacity: number;
    registrationType: string;
    fee: number;
  }[];
};

const FILTERS = ['All', 'Draft', 'Published', 'Completed', 'Cancelled'];
const SPORTS  = ['Cricket', 'Football', 'Tennis', 'Badminton', 'Swimming', 'Basketball'];

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return 'TBA';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'TBA';
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return 'TBA';
  }
};

function TournamentDetailModal({ t, open, onClose }: { t: Tournament | null; open: boolean; onClose: () => void }) {
  if (!t) return null;
  const startDate = formatDateTime(t.startDate);
  const endDate = formatDateTime(t.endDate);
  const regStart = formatDateTime(t.registrationStartDate);
  const regEnd = formatDateTime(t.registrationEndDate);
  
  return (
    <Modal open={open} onClose={onClose} title="Tournament Details" size="lg">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <span style={{ fontSize: 44 }}>{SPORT_ICONS[t.sport] || '🏆'}</span>
          <div>
            <h2 className="text-xl font-bold text-white">{t.title}</h2>
            <p className="text-xs text-[#9ba3af] mt-1">Registration Type: <span className="capitalize font-semibold text-white">{t.categories && t.categories.length ? Array.from(new Set(t.categories.map(c => c.registrationType))).join(', ') : '—'}</span></p>
          </div>
        </div>
        
        {(t.banner || t.image) && (
          <div className="w-full h-48 overflow-hidden rounded-lg border border-[#2e3139] bg-[#1a1c20]">
            <img src={t.banner || t.image} alt={t.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        {t.description && (
          <div className="border border-[#2e3139] bg-[#1a1c20] rounded-lg p-3 text-xs text-[#9ba3af] leading-relaxed">
            <span className="block font-semibold text-white mb-1 uppercase tracking-wider text-[10px]">Description</span>
            {t.description}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-[#2e3139] pt-4">
          <DetailRow label="Sport" value={t.sport} />
          <DetailRow label="Status" value={<Badge className={STATUS_MAP[t.status] || 'badge-gray'}>{t.status}</Badge>} />
          <DetailRow label="Registration Fee" value={t.registrationFee !== undefined ? `₹${t.registrationFee}` : 'Free / TBA'} />
          <DetailRow label="City" value={t.city || 'TBA'} />
          <DetailRow label="Venue" value={t.venue || t.location || 'TBA'} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-[#2e3139] pt-4">
          <DetailRow label="Start Date" value={<span className="flex items-center gap-1"><Clock className="h-3 w-3 text-[#5c6370]" />{startDate}</span>} />
          <DetailRow label="End Date" value={<span className="flex items-center gap-1"><Clock className="h-3 w-3 text-[#5c6370]" />{endDate}</span>} />
          <DetailRow label="Reg Start" value={<span className="flex items-center gap-1"><CalendarDays className="h-3 w-3 text-[#5c6370]" />{regStart}</span>} />
          <DetailRow label="Reg End" value={<span className="flex items-center gap-1"><CalendarDays className="h-3 w-3 text-[#5c6370]" />{regEnd}</span>} />
        </div>

        {t.categories && t.categories.length > 0 && (
          <div className="border-t border-[#2e3139] pt-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Categories</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-[#2e3139] rounded-lg overflow-hidden">
                <thead className="bg-[#1a1c20] text-[#5c6370] uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Category Name</th>
                    <th className="px-3 py-2">Capacity</th>
                    <th className="px-3 py-2">Reg Type</th>
                    <th className="px-3 py-2">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e3139]">
                  {t.categories.map((c, idx) => (
                    <tr key={idx} className="hover:bg-[#1a1c20]/50">
                      <td className="px-3 py-2 text-white font-medium">{c.name}</td>
                      <td className="px-3 py-2 text-[#9ba3af]">{c.capacity}</td>
                      <td className="px-3 py-2 text-[#9ba3af] capitalize">{c.registrationType || 'Inherited'}</td>
                      <td className="px-3 py-2 text-[#9ba3af]">{c.fee !== undefined ? `₹${c.fee}` : 'Inherited'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function TournamentFormModal({ t, open, onClose, onSave, options, saving }: { t: Tournament | null; open: boolean; onClose: () => void; onSave: (x: FormData) => void; options: { sports: string[]; categories: string[]; registrationTypes: string[] }; saving: boolean }) {
  const isEdit = !!t;
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  const [form, setForm] = useState<{
    title: string;
    sport: string;
    startDate: string;
    endDate: string;
    registrationStartDate: string;
    registrationEndDate: string;
    city: string;
    venue: string;
    description: string;
    categories: { name: string; capacity: number; registrationType: string; fee: number }[];
    status: string;
    banner: string;
  }>({
    title: '',
    sport: '',
    startDate: '',
    endDate: '',
    registrationStartDate: '',
    registrationEndDate: '',
    city: '',
    venue: '',
    description: '',
    categories: [],
    status: 'DRAFT',
    banner: ''
  });

  const formatDateTimeLocal = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    setImageFile(null);
    if (t) {
      setForm({
        title: t.title || '',
        sport: t.sport || '',
        startDate: formatDateTimeLocal(t.startDate),
        endDate: formatDateTimeLocal(t.endDate),
        registrationStartDate: formatDateTimeLocal(t.registrationStartDate),
        registrationEndDate: formatDateTimeLocal(t.registrationEndDate),
        city: t.city || '',
        venue: t.venue || t.location || '',
        description: t.description || '',
        categories: (t.categories || []).map(c => ({
          name: c.name || '',
          capacity: Number(c.capacity || 0),
          registrationType: c.registrationType || 'INDIVIDUAL',
          fee: Number(c.fee || 0)
        })),
        status: t.status || 'DRAFT',
        banner: t.banner || t.image || ''
      });
      setPreviewUrl(t.banner || t.image || '');
    } else {
      setForm({
        title: '',
        sport: options.sports[0] || 'Cricket',
        startDate: '',
        endDate: '',
        registrationStartDate: '',
        registrationEndDate: '',
        city: '',
        venue: '',
        description: '',
        categories: [],
        status: 'DRAFT',
        banner: ''
      });
      setPreviewUrl('');
    }
  }, [t, open, options]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  
  const addCategory = () => {
    setForm(f => ({
      ...f,
      categories: [...f.categories, { name: options.categories[0] || '', capacity: 32, registrationType: options.registrationTypes[0] || 'INDIVIDUAL', fee: 0 }]
    }));
  };

  const removeCategory = (index: number) => {
    setForm(f => ({
      ...f,
      categories: f.categories.filter((_, idx) => idx !== index)
    }));
  };

  const updateCategory = (index: number, key: string, val: any) => {
    setForm(f => ({
      ...f,
      categories: f.categories.map((c, idx) => {
        if (idx !== index) return c;
        if (key === 'capacity') {
          return { ...c, [key]: val === '' ? 0 : Number(val) };
        }
        if (key === 'fee') {
          return { ...c, [key]: val === '' ? 0 : Number(val) };
        }
        return { ...c, [key]: val };
      })
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveClick = () => {
    const toISO = (dStr: string) => {
      if (!dStr) return '';
      try {
        const d = new Date(dStr);
        return isNaN(d.getTime()) ? '' : d.toISOString();
      } catch {
        return '';
      }
    };

    const formData = new FormData();

    if (isEdit) {
      if (form.title !== t.title) formData.append('title', form.title);
      if (form.sport !== t.sport) formData.append('sport', form.sport);
      if (form.description !== t.description) formData.append('description', form.description);
      if (toISO(form.startDate) !== toISO(t.startDate)) formData.append('startDate', toISO(form.startDate));
      if (toISO(form.endDate) !== toISO(t.endDate)) formData.append('endDate', toISO(form.endDate));
      if (toISO(form.registrationStartDate) !== toISO(t.registrationStartDate)) formData.append('registrationStartDate', toISO(form.registrationStartDate));
      if (toISO(form.registrationEndDate) !== toISO(t.registrationEndDate)) formData.append('registrationEndDate', toISO(form.registrationEndDate));
      if (form.city !== t.city) formData.append('city', form.city);
      if (form.venue !== (t.venue || t.location)) formData.append('venue', form.venue);
      
      const originalCats = JSON.stringify(t.categories || []);
      const currentCats = JSON.stringify(form.categories);
      if (originalCats !== currentCats) {
        formData.append('categories', JSON.stringify(form.categories));
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }
    } else {
      formData.append('title', form.title);
      formData.append('sport', form.sport);
      formData.append('description', form.description);
      formData.append('startDate', toISO(form.startDate));
      formData.append('endDate', toISO(form.endDate));
      formData.append('registrationStartDate', toISO(form.registrationStartDate));
      formData.append('registrationEndDate', toISO(form.registrationEndDate));
      formData.append('city', form.city);
      formData.append('venue', form.venue);
      formData.append('categories', JSON.stringify(form.categories));
      if (imageFile) {
        formData.append('image', imageFile);
      }
    }

    onSave(formData);
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Tournament' : 'Create Tournament'} size="lg">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Basic Info</h3>
          <Input label="Tournament Title" value={form.title} onChange={set('title')} placeholder="Hyderabad Open Badminton" />
          <Textarea label="Description" value={form.description} onChange={set('description')} placeholder="Annual badminton championship." rows={3} />
          
          <div>
            <label className="block text-xs font-medium text-[#9ba3af] mb-1.5">Tournament Banner Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="input-field"
            />
            <p className="text-[10px] text-[#5c6370] mt-1">Supported formats: JPG, JPEG, PNG, GIF, WEBP (Max 5MB)</p>
            {previewUrl && (
              <div className="mt-2 relative w-48 h-28 group">
                <img src={previewUrl} alt="Tournament banner" className="h-full w-full object-cover rounded border border-[#2e3139]" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setPreviewUrl('');
                    setForm(f => ({ ...f, banner: '' }));
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#2e3139] pt-4 space-y-3">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select label="Sport" value={form.sport} onChange={set('sport') as any} options={(options.sports.length ? options.sports : SPORTS).map(s => ({ value: s, label: `${SPORT_ICONS[s] || '🏆'} ${s}` }))} />
          </div>
        </div>

        <div className="border-t border-[#2e3139] pt-4 space-y-3">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="City" value={form.city} onChange={set('city')} placeholder="Hyderabad" />
            <Input label="Venue" value={form.venue} onChange={set('venue')} placeholder="Ameerpet Sports Academy" />
          </div>
        </div>

        <div className="border-t border-[#2e3139] pt-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Tournament Dates & Schedule</h3>
            <p className="text-[10px] text-[#5c6370] mt-0.5">Please clarify when players register vs when the matches take place.</p>
          </div>
          <div className="bg-[#141518]/60 border border-[#2e3139] rounded-xl p-3.5 space-y-4">
            <div>
              <span className="text-[11px] font-bold text-white uppercase tracking-wider block mb-2">1. Match Playing Dates</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Matches Start Date & Time" type="datetime-local" value={form.startDate} onChange={set('startDate')} />
                <Input label="Matches End Date & Time" type="datetime-local" value={form.endDate} onChange={set('endDate')} />
              </div>
            </div>

            <div className="border-t border-[#2e3139] pt-3">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider block mb-2">2. Player Registration Window</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Registration Opens" type="datetime-local" value={form.registrationStartDate} onChange={set('registrationStartDate')} />
                <Input label="Registration Closes" type="datetime-local" value={form.registrationEndDate} onChange={set('registrationEndDate')} />
              </div>
              <p className="text-[10px] text-[#5c6370] mt-2">Registration period must close before matches begin.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#2e3139] pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Categories</h3>
            <Button variant="outline" className="h-7 px-2 text-xs" onClick={addCategory}>
              <Plus className="h-3 w-3" /> Add Category
            </Button>
          </div>

          <div className="space-y-3">
            {form.categories.length === 0 ? (
              <p className="text-xs text-[#5c6370] italic">No categories added yet. Add categories to specify tournament divisions.</p>
            ) : (
              form.categories.map((c, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-3 bg-[#1a1c20] border border-[#2e3139] rounded-lg relative">
                  <button type="button" onClick={() => removeCategory(idx)} className="absolute top-2 right-2 text-[#5c6370] hover:text-red-400 p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-6">
                    <Select 
                      label="Category Name" 
                      value={c.name} 
                      onChange={e => updateCategory(idx, 'name', e.target.value)} 
                      options={(options.categories.length ? options.categories : ['Men\'s Singles', 'Women\'s Singles']).map(cat => ({ value: cat, label: cat }))} 
                    />
                    <Input 
                      label="Capacity" 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={c.capacity} 
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        updateCategory(idx, 'capacity', val);
                      }} 
                      placeholder="e.g. 32" 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-6">
                    <Select 
                      label="Registration Type" 
                      value={c.registrationType || ''} 
                      onChange={e => updateCategory(idx, 'registrationType', e.target.value) as any} 
                      options={(options.registrationTypes.length ? options.registrationTypes : ['INDIVIDUAL', 'PAIR', 'TEAM']).map(rt => ({ 
                        value: rt, 
                        label: rt.charAt(0).toUpperCase() + rt.slice(1).toLowerCase() 
                      }))} 
                    />
                    <Input 
                      label="Category Fee (₹)" 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={c.fee !== undefined ? c.fee : 0} 
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        updateCategory(idx, 'fee', val);
                      }} 
                      placeholder="e.g. 500" 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {isEdit && (
          <div className="border-t border-[#2e3139] pt-4">
            <Select label="Status" value={form.status} onChange={set('status') as any} options={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' }
            ]} />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-[#2e3139]">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveClick} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function RegistrationsModal({ t, open, onClose }: { t: Tournament | null; open: boolean; onClose: () => void }) {
  const [regs, setRegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    if (!t || !open) return;
    const fetchRegs = async () => {
      setLoading(true);
      try {
        const id = t._id || t.id;
        const res = await getTournamentRegistrations(id);
        if (res.data) {
          setRegs(res.data);
        } else if (Array.isArray(res)) {
          setRegs(res);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRegs();
  }, [t, open]);

  const handleExport = async () => {
    if (!t) return;
    try {
      const id = t._id || t.id;
      const token = localStorage.getItem('kridext_admin_token') || '';
      const res = await fetch(`/api/admin/novare/tournaments/${id}/registrations/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations-${t.title.replace(/\s+/g, '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Export failed');
    }
  };

  if (!t) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Registrations - ${t.title}`} size="lg">
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search registrations..." />
          <Button variant="primary" onClick={handleExport} className="text-xs">Export to Excel</Button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" /></div>
        ) : regs.length === 0 ? (
          <EmptyState title="No registrations found" />
        ) : (
          <div className="overflow-x-auto max-h-[50vh]">
            <Table>
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email/Phone</Th>
                  <Th>Registration Type</Th>
                  <Th>Payment Status</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {regs.filter(r => {
                  const query = search.toLowerCase();
                  const name = r.playerName || r.player?.name || r.name || (r.user ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() : '') || (r.firstName || r.lastName ? `${r.firstName || ''} ${r.lastName || ''}`.trim() : '') || r.teamName || r.team?.name || '';
                  const email = r.playerEmail || r.player?.email || r.email || r.user?.email || '';
                  const phone = r.playerPhone || r.player?.phone || r.phone || r.user?.phone || '';
                  return (
                    !query ||
                    name.toLowerCase().includes(query) ||
                    email.toLowerCase().includes(query) ||
                    phone.toLowerCase().includes(query)
                  );
                }).map((r, i) => {
                  const name = r.playerName || r.player?.name || r.name || (r.user ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() : '') || (r.firstName || r.lastName ? `${r.firstName || ''} ${r.lastName || ''}`.trim() : '') || r.teamName || r.team?.name || 'N/A';
                  const email = r.playerEmail || r.player?.email || r.email || r.user?.email || '';
                  const phone = r.playerPhone || r.player?.phone || r.phone || r.user?.phone || '';
                  const regType = r.registrationType || r.category?.registrationType || t.registrationType || '—';
                  const categoryName = r.category?.name || r.categoryName || '';
                  return (
                    <Tr key={r.id || r._id || i}>
                      <Td>
                        <div className="font-semibold text-white">{name}</div>
                        {categoryName && <div className="text-[10px] text-[#F05A22]">{categoryName}</div>}
                      </Td>
                      <Td>
                        <div className="text-xs">{email}</div>
                        <div className="text-[10px] text-[#5c6370]">{phone}</div>
                      </Td>
                      <Td className="capitalize">{regType}</Td>
                      <Td><Badge className={r.paymentStatus === 'paid' ? 'badge-green' : 'badge-red'}>{r.paymentStatus || 'pending'}</Badge></Td>
                      <Td><Badge className={r.status === 'approved' ? 'badge-green' : 'badge-gray'}>{r.status || 'pending'}</Badge></Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function TournamentsPage() {
  const { can } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('All');
  const [viewT, setViewT]             = useState<Tournament | null>(null);
  const [editT, setEditT]             = useState<Tournament | null>(null);
  const [formOpen, setFormOpen]       = useState(false);
  const [deleteT, setDeleteT]         = useState<Tournament | null>(null);
  const [regsT, setRegsT]             = useState<Tournament | null>(null);
  const [saving, setSaving]           = useState(false);

  const [options, setOptions] = useState<{ sports: string[]; categories: string[]; registrationTypes: string[] }>({
    sports: [],
    categories: [],
    registrationTypes: []
  });

  const load = useCallback(async () => {
    try {
      getTournamentOptions().then(res => {
        if (res.success && res.data) {
          setOptions(res.data);
        } else if (res.data) {
          setOptions(res.data);
        }
      }).catch(err => console.error('Failed to fetch tournament options:', err));

      const res = await getAdminTournaments();
      if (res.data?.length) {
        setTournaments(res.data);
      } else if (Array.isArray(res)) {
        setTournaments(res);
      } else {
        // Fallback mock data matching the schema
        setTournaments([
          { id: 'T001', title: 'Spring Badminton Open', sport: 'Badminton', registrationType: 'individual', startDate: '2026-04-25T09:00:00Z', endDate: '2026-04-26T18:00:00Z', registrationStartDate: '2026-04-01T00:00:00Z', registrationEndDate: '2026-04-20T23:59:59Z', status: 'upcoming' },
          { id: 'T002', title: 'Cricket Premier League', sport: 'Cricket', registrationType: 'team', startDate: '2026-04-18T09:00:00Z', endDate: '2026-04-20T18:00:00Z', registrationStartDate: '2026-03-15T00:00:00Z', registrationEndDate: '2026-04-10T23:59:59Z', status: 'ongoing' },
          { id: 'T003', title: 'Football 5s Challenge', sport: 'Football', registrationType: 'team', startDate: '2026-04-10T09:00:00Z', endDate: '2026-04-11T18:00:00Z', registrationStartDate: '2026-03-10T00:00:00Z', registrationEndDate: '2026-04-05T23:59:59Z', status: 'ongoing' },
          { id: 'T004', title: 'Tennis Singles Open', sport: 'Tennis', registrationType: 'individual', startDate: '2026-03-01T09:00:00Z', endDate: '2026-03-02T18:00:00Z', registrationStartDate: '2026-02-01T00:00:00Z', registrationEndDate: '2026-02-25T23:59:59Z', status: 'completed' },
          { id: 'T005', title: 'Swimming Championship', sport: 'Swimming', registrationType: 'individual', startDate: '2026-05-15T09:00:00Z', endDate: '2026-05-16T18:00:00Z', registrationStartDate: '2026-04-15T00:00:00Z', registrationEndDate: '2026-05-10T23:59:59Z', status: 'upcoming' },
        ]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = tournaments.filter(t => {
    const ms = search === '' || `${t.title} ${t.sport}`.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'All' || t.status.toLowerCase() === filter.toLowerCase();
    return ms && mf;
  });

  const handleSave = async (formData: FormData) => {
    if (saving) return;
    setSaving(true);
    try {
      if (editT) {
        const id = editT._id || editT.id;
        await updateTournament(id, formData);
      } else {
        await createTournament(formData);
      }
      load();
      setFormOpen(false); 
      setEditT(null);
    } catch (err: any) { 
      alert(err.message || 'Save failed'); 
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteT) return;
    try {
      await deleteTournament(deleteT._id || deleteT.id);
      setTournaments(prev => prev.filter(t => (t._id || t.id) !== (deleteT._id || deleteT.id)));
    } catch (err: any) { alert(err.message || 'Delete failed'); }
    setDeleteT(null);
  };

  const stats = {
    total: tournaments.length,
    draft: tournaments.filter(t => t.status?.toUpperCase() === 'DRAFT').length,
    published: tournaments.filter(t => t.status?.toUpperCase() === 'PUBLISHED').length,
    completed: tournaments.filter(t => t.status?.toUpperCase() === 'COMPLETED').length
  };

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total"     value={String(stats.total)}     icon={<Trophy className="h-4 w-4 text-[#F05A22]" />}    iconBg="bg-[#F05A22]/10" />
        <StatCard label="Draft"     value={String(stats.draft)}     icon={<CalendarDays className="h-4 w-4 text-blue-400" />} iconBg="bg-blue-400/10" />
        <StatCard label="Published" value={String(stats.published)} icon={<Medal className="h-4 w-4 text-emerald-400" />}    iconBg="bg-emerald-400/10" />
        <StatCard label="Completed" value={String(stats.completed)} icon={<Trophy className="h-4 w-4 text-amber-400" />}     iconBg="bg-amber-400/10" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tournaments ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search tournaments..." />
            <div className="flex gap-1 flex-wrap">{FILTERS.map(f => <FilterPill key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />)}</div>
            {can('sports_write') && <Button variant="primary" className="h-8 gap-1.5" onClick={() => { setEditT(null); setFormOpen(true); }}><Plus className="h-3.5 w-3.5" />Create</Button>}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-12"><div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" /></div>
            : filtered.length === 0 ? <EmptyState icon={<Trophy className="h-8 w-8" />} title="No tournaments found" />
            : (
              <Table>
                <Thead><Tr><Th>Tournament</Th><Th>Sport</Th><Th>Registration Type</Th><Th>Tournament Dates</Th><Th>Reg Dates</Th><Th>Status</Th><Th>Actions</Th></Tr></Thead>
                <Tbody>
                  {filtered.map(t => {
                    const startDateStr = formatDateTime(t.startDate);
                    const regEndStr = formatDateTime(t.registrationEndDate);
                    return (
                      <Tr key={t._id || t.id}>
                        <Td><div className="flex items-center gap-2"><span>{SPORT_ICONS[t.sport] || '🏆'}</span><span className="text-sm font-medium text-white">{t.title}</span></div></Td>
                        <Td><Badge className="badge-blue">{t.sport}</Badge></Td>
                        <Td className="capitalize text-xs text-[#9ba3af]">{t.categories && t.categories.length ? Array.from(new Set(t.categories.map(c => c.registrationType))).join(', ') : '—'}</Td>
                        <Td className="text-xs text-[#9ba3af]">{startDateStr}</Td>
                        <Td className="text-xs text-[#9ba3af]">Ends: {regEndStr}</Td>
                        <Td><Badge className={STATUS_MAP[t.status] || 'badge-gray'}>{t.status}</Badge></Td>
                        <Td>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setViewT(t)} title="View Details" className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-white hover:bg-[#21242a]"><Eye className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setRegsT(t)} title="View Registrations" className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-white hover:bg-[#21242a]"><Users className="h-3.5 w-3.5" /></button>
                            {can('sports_write') && (
                              <>
                                <button onClick={() => { setEditT(t); setFormOpen(true); }} title="Edit" className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-white hover:bg-[#21242a]"><Pencil className="h-3.5 w-3.5" /></button>
                                <button onClick={() => setDeleteT(t)} title="Delete" className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-red-400 hover:bg-red-400/10"><Trash2 className="h-3.5 w-3.5" /></button>
                              </>
                            )}
                            {can('sports_write') && t.status?.toUpperCase() === 'DRAFT' && (
                              <Button variant="primary" onClick={async () => {
                                try {
                                  await updateTournamentStatus(t._id || t.id, 'PUBLISHED');
                                  setTournaments(prev => prev.map(item => (item._id || item.id) === (t._id || t.id) ? { ...item, status: 'PUBLISHED' } : item));
                                } catch (err: any) {
                                  alert(err.message || 'Publish failed');
                                }
                              }} className="h-6 px-2 text-[10px] bg-emerald-500 hover:bg-emerald-600 border-none text-white">Publish</Button>
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

      <TournamentDetailModal t={viewT} open={!!viewT} onClose={() => setViewT(null)} />
      <TournamentFormModal t={editT} open={formOpen} onClose={() => { setFormOpen(false); setEditT(null); }} onSave={handleSave} options={options} saving={saving} />
      <RegistrationsModal t={regsT} open={!!regsT} onClose={() => setRegsT(null)} />
      <ConfirmDialog open={!!deleteT} onClose={() => setDeleteT(null)} title="Delete Tournament"
        message={`Delete "${deleteT?.title}"? This cannot be undone.`} confirmLabel="Delete" danger={true} onConfirm={handleDelete} />
    </div>
  );
}
