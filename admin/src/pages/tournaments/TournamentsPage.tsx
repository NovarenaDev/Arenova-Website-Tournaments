import { useState, useEffect, useCallback, useId } from 'react';
import { Medal, Users, CalendarDays, Trophy, Plus, MapPin, Clock, Pencil, Trash2, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, SearchBar, FilterPill, StatCard, Table, Thead, Tbody, Th, Td, Tr, EmptyState, Modal, ConfirmDialog, Input, Select, Textarea, DetailRow } from '../../components/ui';
import { getAdminTournaments, getPublicTournaments, createTournament, updateTournament, deleteTournament, getTournamentOptions, updateTournamentStatus, getTournamentRegistrations, exportTournamentRegistrations, extractDataList } from '../../api';
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
  rules?: string;
  image?: string;
  banner?: string;
  registrationFee?: number;
  categories?: {
    name: string;
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
  const regTypes = t.categories && t.categories.length
    ? Array.from(new Set(t.categories.map(c => c.registrationType).filter(Boolean))).join(', ')
    : '—';

  return (
    <Modal open={open} onClose={onClose} title="Tournament Details" size="lg">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-2xl flex-shrink-0">
              {SPORT_ICONS[t.sport] || '🏆'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold text-slate-900 leading-snug">{t.title}</h2>
                <Badge className={STATUS_MAP[t.status] || 'badge-gray'}>{t.status}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-700">{t.sport}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#F05A22]" />
                  {[t.venue || t.location, t.city].filter(Boolean).join(', ') || 'Venue TBA'}
                </span>
                <span>•</span>
                <span>Type: <strong className="text-slate-800 capitalize">{regTypes}</strong></span>
              </p>
            </div>
          </div>
        </div>

        {(t.banner || t.image) && (
          <div className="w-full h-52 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-2xs">
            <img src={t.banner || t.image} alt={t.title} className="w-full h-full object-cover" />
          </div>
        )}

        {t.description && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-700 leading-relaxed">
            <span className="block font-bold text-slate-900 mb-1 uppercase tracking-wider text-[10px]">
              Tournament Overview
            </span>
            {t.description}
          </div>
        )}

        {t.rules && String(t.rules).trim() !== '' && String(t.rules).trim().toLowerCase() !== 'string' && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            <span className="block font-bold text-slate-900 mb-1 uppercase tracking-wider text-[10px]">
              Tournament Rules
            </span>
            {t.rules}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-3.5 space-y-2.5">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-blue-600" /> Registration Window
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Opens</p>
                <p className="font-bold text-slate-900 mt-0.5">{regStart}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Closes</p>
                <p className="font-bold text-slate-900 mt-0.5">{regEnd}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-200/80 bg-orange-50/40 p-3.5 space-y-2.5">
            <span className="text-[10px] font-bold text-[#F05A22] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#F05A22]" /> Match Schedule
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Starts</p>
                <p className="font-bold text-slate-900 mt-0.5">{startDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Ends</p>
                <p className="font-bold text-slate-900 mt-0.5">{endDate}</p>
              </div>
            </div>
          </div>
        </div>

        {t.categories && t.categories.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Medal className="h-3.5 w-3.5 text-[#F05A22]" />
                Tournament Categories ({t.categories.length})
              </h3>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/90 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Category Name</th>
                    <th className="px-4 py-2.5">Registration Type</th>
                    <th className="px-4 py-2.5 text-right">Entry Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {t.categories.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-slate-900 font-bold">{c.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                          {(c.registrationType || 'Individual').toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {c.fee !== undefined ? (c.fee === 0 ? 'Free' : `₹${c.fee}`) : 'TBA'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

function ScheduleDateTimePicker({
  label,
  value,
  onChange,
  error,
  minDate,
  defaultHour = '09',
  defaultPeriod = 'AM',
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  minDate?: string;
  defaultHour?: string;
  defaultPeriod?: 'AM' | 'PM';
}) {

  const [datePart, timePart] = (value || '').split('T');
  const rawHour = timePart ? parseInt(timePart.split(':')[0] || '9', 10) : (defaultPeriod === 'PM' ? (parseInt(defaultHour, 10) % 12) + 12 : parseInt(defaultHour, 10) % 12);
  const rawMin = timePart ? (timePart.split(':')[1] || '00').slice(0, 2) : '00';

  const period: 'AM' | 'PM' = rawHour >= 12 ? 'PM' : 'AM';
  const hour12 = String(rawHour % 12 === 0 ? 12 : rawHour % 12).padStart(2, '0');
  const minuteVal = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].includes(rawMin)
    ? rawMin
    : String(Math.floor(parseInt(rawMin, 10) / 5) * 5).padStart(2, '0');

  const emitChange = (nextDate: string, nextHour12: string, nextMin: string, nextPeriod: 'AM' | 'PM') => {
    const resolvedDate = nextDate || minDate || new Date().toISOString().split('T')[0];
    let h24 = parseInt(nextHour12, 10) % 12;
    if (nextPeriod === 'PM') h24 += 12;
    onChange(`${resolvedDate}T${String(h24).padStart(2, '0')}:${nextMin}`);
  };

  const baseId = useId();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2.5">
      <label htmlFor={`${baseId}-date`} className="block text-xs font-bold text-slate-800">{label}</label>

      <div className="relative">
        <input
          id={`${baseId}-date`}
          name={`${baseId}-date`}
          type="date"
          min={minDate}
          value={datePart || ''}
          onChange={(e) => {
            if (!e.target.value) {
              onChange('');
              return;
            }
            emitChange(e.target.value, hour12, minuteVal, period);
          }}
          className="input-field text-xs font-medium w-full"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mr-1">
          <Clock className="h-3.5 w-3.5 text-[#F05A22]" />
        </div>
        <select
          id={`${baseId}-hour`}
          name={`${baseId}-hour`}
          aria-label={`${label} Hour`}
          value={hour12}
          onChange={(e) => emitChange(datePart, e.target.value, minuteVal, period)}
          className="input-field text-xs font-mono font-semibold py-1.5 px-2 w-16 text-center cursor-pointer"
        >
          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="text-xs font-bold text-slate-400">:</span>
        <select
          id={`${baseId}-minute`}
          name={`${baseId}-minute`}
          aria-label={`${label} Minute`}
          value={minuteVal}
          onChange={(e) => emitChange(datePart, hour12, e.target.value, period)}
          className="input-field text-xs font-mono font-semibold py-1.5 px-2 w-16 text-center cursor-pointer"
        >
          {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 ml-auto">
          {(['AM', 'PM'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => emitChange(datePart, hour12, minuteVal, p)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                period === p
                  ? 'bg-[#F05A22] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
    </div>
  );
}

const TOURNAMENT_DRAFT_KEY = 'arenova_tournament_create_draft';

const inferRegistrationType = (categoryName: string, availableTypes: string[]): string => {
  const lower = (categoryName || '').toLowerCase();
  const types = availableTypes.length ? availableTypes : ['INDIVIDUAL', 'PAIR', 'TEAM'];
  const findMatch = (target: string) =>
    types.find(rt => rt.toUpperCase() === target.toUpperCase()) || target;

  if (lower.includes('double') || lower.includes('pair') || lower.includes('mixed')) {
    return findMatch('PAIR');
  }
  if (lower.includes('team') || lower.includes('squad') || lower.includes('club') || lower.includes('relay') || lower.includes('group')) {
    return findMatch('TEAM');
  }
  if (lower.includes('single') || lower.includes('solo') || lower.includes('individual')) {
    return findMatch('INDIVIDUAL');
  }
  return types[0] || 'INDIVIDUAL';
};

function TournamentFormModal({ t, open, onClose, onSave, options, saving }: { t: Tournament | null; open: boolean; onClose: () => void; onSave: (x: FormData, nextStatus?: string) => void; options: { sports: string[]; categories: string[]; registrationTypes: string[] }; saving: boolean }) {
  const isEdit = !!t;
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageError, setImageError] = useState<string>('');
  const [hasResumedDraft, setHasResumedDraft] = useState(false);

  const getBlankCreateForm = () => {
    const defaultCat = options.categories[0] || "Men's Singles";
    return {
      title: '',
      sport: options.sports[0] || SPORTS[0] || 'Cricket',
      startDate: '',
      endDate: '',
      registrationStartDate: '',
      registrationEndDate: '',
      city: '',
      venue: '',
      description: '',
      rules: '',
      categories: [
        {
          name: defaultCat,
          registrationType: inferRegistrationType(defaultCat, options.registrationTypes),
          fee: 500
        }
      ],
      status: 'DRAFT',
      banner: ''
    };
  };

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
    rules: string;
    categories: { name: string; registrationType: string; fee: number }[];
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
    rules: '',
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
    if (!open) return;
    setImageFile(null);
    setErrors({});
    setImageError('');
    if (t) {
      setHasResumedDraft(false);
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
        rules: t.rules && String(t.rules).trim().toLowerCase() !== 'string' ? t.rules : '',
        categories: (t.categories || []).map(c => ({
          name: c.name || '',
          registrationType: c.registrationType || inferRegistrationType(c.name || '', options.registrationTypes),
          fee: Number(c.fee || 0)
        })),
        status: String(t.status || 'DRAFT').toUpperCase(),
        banner: t.banner || t.image || ''
      });
      setPreviewUrl(t.banner || t.image || '');
    } else {
      let restored: any = null;
      try {
        const raw = localStorage.getItem(TOURNAMENT_DRAFT_KEY);
        if (raw) restored = JSON.parse(raw);
      } catch {
        restored = null;
      }
      if (restored && typeof restored === 'object') {
        setHasResumedDraft(Boolean(restored.title || restored.city || restored.venue || restored.description));
        setForm({
          ...getBlankCreateForm(),
          ...restored,
          sport: restored.sport || options.sports[0] || SPORTS[0] || 'Cricket',
          categories: Array.isArray(restored.categories) && restored.categories.length > 0
            ? restored.categories
            : getBlankCreateForm().categories
        });
      } else {
        setHasResumedDraft(false);
        setForm(getBlankCreateForm());
      }
      setPreviewUrl('');
    }
  }, [t, open]);

  useEffect(() => {
    if (!open || isEdit) return;
    try {
      localStorage.setItem(TOURNAMENT_DRAFT_KEY, JSON.stringify(form));
    } catch {

    }
  }, [form, open, isEdit]);

  const handleExplicitCancel = () => {
    if (!isEdit) {
      try {
        localStorage.removeItem(TOURNAMENT_DRAFT_KEY);
      } catch {

      }
      setForm(getBlankCreateForm());
      setHasResumedDraft(false);
    }
    setImageFile(null);
    setPreviewUrl('');
    setErrors({});
    setImageError('');
    onClose();
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setErrors(prev => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
    setForm(f => ({ ...f, [k]: e.target.value }));
  };

  const addCategory = () => {
    setErrors(prev => {
      if (!prev.categories) return prev;
      const next = { ...prev };
      delete next.categories;
      return next;
    });
    const defaultCat = options.categories[0] || "Men's Singles";
    setForm(f => ({
      ...f,
      categories: [
        ...f.categories,
        {
          name: defaultCat,
          registrationType: inferRegistrationType(defaultCat, options.registrationTypes),
          fee: 500
        }
      ]
    }));
  };

  const removeCategory = (index: number) => {
    setForm(f => ({
      ...f,
      categories: f.categories.filter((_, idx) => idx !== index)
    }));
  };

  const updateCategory = (index: number, key: string, val: any) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next.categories;
      delete next[`cat_${index}_${key}`];
      return next;
    });
    setForm(f => ({
      ...f,
      categories: f.categories.map((c, idx) => {
        if (idx !== index) return c;
        if (key === 'name') {
          return {
            ...c,
            name: val,
            registrationType: inferRegistrationType(val, options.registrationTypes)
          };
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
    setImageError('');
    if (!file.type.startsWith('image/')) {
      setImageError('Invalid file type. Please select a JPG, JPEG, PNG, GIF, or WEBP image.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError(`Banner image size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 5 MB limit.`);
      e.target.value = '';
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};
    const cleanTitle = form.title.trim();
    const cleanCity = form.city.trim();
    const cleanVenue = form.venue.trim();
    const cleanSport = (form.sport || options.sports[0] || 'Cricket').trim();

    if (!cleanTitle) nextErrors.title = 'Tournament title is required.';
    if (!cleanSport) nextErrors.sport = 'Sport is required.';
    if (!cleanCity) nextErrors.city = 'City is required.';
    if (!cleanVenue) nextErrors.venue = 'Venue is required.';

    const startMs = form.startDate ? new Date(form.startDate).getTime() : NaN;
    const endMs = form.endDate ? new Date(form.endDate).getTime() : NaN;
    const regStartMs = form.registrationStartDate ? new Date(form.registrationStartDate).getTime() : NaN;
    const regEndMs = form.registrationEndDate ? new Date(form.registrationEndDate).getTime() : NaN;

    if (!form.startDate || isNaN(startMs)) {
      nextErrors.startDate = 'Match start date & time is required.';
    } else if (!isEdit) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      if (startMs < todayStart.getTime()) {
        nextErrors.startDate = 'Match start date cannot be in the past.';
      }
    }

    if (!form.endDate || isNaN(endMs)) {
      nextErrors.endDate = 'Match end date & time is required.';
    } else if (!isNaN(startMs) && endMs < startMs) {
      nextErrors.endDate = 'Match end date cannot be earlier than match start date.';
    }

    if (!form.registrationStartDate || isNaN(regStartMs)) {
      nextErrors.registrationStartDate = 'Registration open date & time is required.';
    } else if (!isNaN(endMs) && regStartMs > endMs) {
      nextErrors.registrationStartDate = 'Registration open date must be within tournament dates.';
    }

    if (!form.registrationEndDate || isNaN(regEndMs)) {
      nextErrors.registrationEndDate = 'Registration close date & time is required.';
    } else {
      if (!isEdit && regEndMs <= Date.now()) {
        nextErrors.registrationEndDate = 'Registration close date & time cannot be in the past.';
      } else if (!isNaN(regStartMs) && regEndMs < regStartMs) {
        nextErrors.registrationEndDate = 'Registration close date cannot be before registration open date.';
      } else if (!isNaN(startMs) && regEndMs > startMs) {
        nextErrors.registrationEndDate = 'Registration must close on or before match start date.';
      } else if (!isNaN(endMs) && regEndMs > endMs) {
        nextErrors.registrationEndDate = 'Registration close date cannot be after match end date.';
      }
    }

    if (!form.categories || form.categories.length === 0) {
      nextErrors.categories = 'At least one tournament category is required.';
    } else {
      form.categories.forEach((c, idx) => {
        if (!c.name || !c.name.trim()) {
          nextErrors[`cat_${idx}_name`] = 'Category name is required.';
        }
        if (Number(c.fee) < 0 || isNaN(Number(c.fee))) {
          nextErrors[`cat_${idx}_fee`] = 'Fee cannot be negative.';
        }
      });
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveClick = () => {
    if (!validateForm()) return;

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
    const resolvedSport = (form.sport || options.sports[0] || 'Cricket').trim();

    if (isEdit) {
      if (form.title.trim() !== t.title) formData.append('title', form.title.trim());
      if (resolvedSport !== t.sport) formData.append('sport', resolvedSport);
      if (form.description.trim() !== (t.description || '')) formData.append('description', form.description.trim());
      if (form.rules.trim() !== (t.rules || '')) formData.append('rules', form.rules.trim());
      if (toISO(form.startDate) !== toISO(t.startDate)) formData.append('startDate', toISO(form.startDate));
      if (toISO(form.endDate) !== toISO(t.endDate)) formData.append('endDate', toISO(form.endDate));
      if (toISO(form.registrationStartDate) !== toISO(t.registrationStartDate)) formData.append('registrationStartDate', toISO(form.registrationStartDate));
      if (toISO(form.registrationEndDate) !== toISO(t.registrationEndDate)) formData.append('registrationEndDate', toISO(form.registrationEndDate));
      if (form.city.trim() !== (t.city || '')) formData.append('city', form.city.trim());
      if (form.venue.trim() !== (t.venue || t.location || '')) formData.append('venue', form.venue.trim());

      const originalCats = JSON.stringify(t.categories || []);
      const currentCats = JSON.stringify(form.categories);
      if (originalCats !== currentCats) {
        formData.append('categories', JSON.stringify(form.categories));
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }
    } else {
      formData.append('title', form.title.trim());
      formData.append('sport', resolvedSport);
      formData.append('description', form.description.trim());
      if (form.rules.trim()) {
        formData.append('rules', form.rules.trim());
      }
      formData.append('startDate', toISO(form.startDate));
      formData.append('endDate', toISO(form.endDate));
      formData.append('registrationStartDate', toISO(form.registrationStartDate));
      formData.append('registrationEndDate', toISO(form.registrationEndDate));
      formData.append('city', form.city.trim());
      formData.append('venue', form.venue.trim());
      formData.append('categories', JSON.stringify(form.categories));
      if (imageFile) {
        formData.append('image', imageFile);
      }
    }

    const originalStatus = isEdit ? String(t.status || 'DRAFT').toUpperCase() : '';
    const nextStatus = isEdit && form.status && form.status !== originalStatus ? form.status : undefined;
    onSave(formData, nextStatus);
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Tournament' : 'Create Tournament'} size="lg" closeOnBackdropClick={false}>
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {!isEdit && hasResumedDraft && (
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between gap-2">
            <span>Resumed your unsaved tournament draft. Click <strong>Cancel</strong> to discard it.</span>
            <button
              type="button"
              onClick={() => {
                try { localStorage.removeItem(TOURNAMENT_DRAFT_KEY); } catch {}
                setForm(getBlankCreateForm());
                setHasResumedDraft(false);
              }}
              className="text-[11px] font-bold text-blue-700 hover:underline flex-shrink-0 cursor-pointer"
            >
              Clear Draft
            </button>
          </div>
        )}
        {Object.keys(errors).length > 0 && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            Please fix the highlighted required fields below before saving.
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Basic Info</h3>
          <div>
            <Input label="Tournament Title *" value={form.title} onChange={set('title')} placeholder="Hyderabad Open Badminton" />
            {errors.title && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.title}</p>}
          </div>
          <Textarea label="Description" value={form.description} onChange={set('description')} placeholder="Annual badminton championship." rows={3} />
          <Textarea label="Tournament Rules" value={form.rules} onChange={set('rules')} placeholder="e.g. Non-marking shoes mandatory. Players must report 15 minutes before scheduled match time." rows={3} />

          <div>
            <label htmlFor="tournament-banner-file" className="block text-xs font-semibold text-slate-700 mb-1.5">Tournament Banner Image</label>
            <input
              id="tournament-banner-file"
              name="banner"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className="input-field"
            />
            <p className="text-[10px] text-slate-500 mt-1">Supported formats: JPG, JPEG, PNG, GIF, WEBP (Max 5 MB)</p>
            {imageError && <p className="text-[11px] text-rose-600 font-medium mt-1">{imageError}</p>}
            {previewUrl && (
              <div className="mt-2 relative w-48 h-28 group">
                <img src={previewUrl} alt="Tournament banner" className="h-full w-full object-cover rounded border border-slate-200" />
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

        <div className="border-t border-slate-200 pt-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Select label="Sport *" value={form.sport} onChange={set('sport') as any} options={(options.sports.length ? options.sports : SPORTS).map(s => ({ value: s, label: `${SPORT_ICONS[s] || '🏆'} ${s}` }))} />
              {errors.sport && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.sport}</p>}
            </div>
            {isEdit && (() => {
              const curStatus = String(t?.status || 'DRAFT').toUpperCase().trim();
              const isTerminal = ['COMPLETED', 'CANCELLED', 'CANCELED', 'FINISHED', 'ENDED', 'PAST'].includes(curStatus);
              const isDraft = ['DRAFT', 'PENDING'].includes(curStatus);
              const curLabel = curStatus.charAt(0) + curStatus.slice(1).toLowerCase().replace(/_/g, ' ');
              const statusOptions = isDraft
                ? [
                    { value: 'DRAFT', label: 'Draft' },
                    { value: 'PUBLISHED', label: 'Published' },
                    { value: 'CANCELLED', label: 'Cancelled' }
                  ]
                : isTerminal
                ? [{ value: curStatus, label: curLabel }]
                : [
                    { value: curStatus, label: curStatus === 'PUBLISHED' ? 'Published' : curLabel },
                    { value: 'CANCELLED', label: 'Cancelled' }
                  ];
              return (
                <div>
                  <Select
                    label="Status"
                    value={form.status}
                    disabled={statusOptions.length <= 1}
                    onChange={set('status') as any}
                    options={statusOptions}
                  />
                </div>
              );
            })()}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Input label="City *" value={form.city} onChange={set('city')} placeholder="Hyderabad" />
              {errors.city && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.city}</p>}
            </div>
            <div>
              <Input label="Venue *" value={form.venue} onChange={set('venue')} placeholder="Ameerpet Sports Academy" />
              {errors.venue && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.venue}</p>}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-[#F05A22]" />
                Tournament Dates & Schedule *
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Set registration window first, followed by non-overlapping match playing dates.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-black">1</span>
                Player Registration Window
              </span>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                Must close before matches begin
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ScheduleDateTimePicker
                label="Registration Opens *"
                value={form.registrationStartDate}
                minDate={!isEdit ? new Date().toISOString().split('T')[0] : undefined}
                defaultHour="09"
                defaultPeriod="AM"
                onChange={(val) => {
                  setErrors(prev => {
                    const next = { ...prev };
                    delete next.registrationStartDate;
                    return next;
                  });
                  setForm(f => ({ ...f, registrationStartDate: val }));
                }}
                error={errors.registrationStartDate}
              />
              <ScheduleDateTimePicker
                label="Registration Closes *"
                value={form.registrationEndDate}
                minDate={form.registrationStartDate ? form.registrationStartDate.split('T')[0] : (!isEdit ? new Date().toISOString().split('T')[0] : undefined)}
                defaultHour="06"
                defaultPeriod="PM"
                onChange={(val) => {
                  setErrors(prev => {
                    const next = { ...prev };
                    delete next.registrationEndDate;
                    return next;
                  });
                  setForm(f => ({ ...f, registrationEndDate: val }));
                }}
                error={errors.registrationEndDate}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-orange-200/80 bg-orange-50/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                <span className="h-5 w-5 rounded-full bg-[#F05A22] text-white text-[10px] flex items-center justify-center font-black">2</span>
                Match Playing Dates
              </span>
              <span className="text-[10px] font-semibold text-[#F05A22] bg-orange-100/80 px-2 py-0.5 rounded-full">
                Hours & Minutes (12h)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ScheduleDateTimePicker
                label="Matches Start Date & Time *"
                value={form.startDate}
                minDate={form.registrationEndDate ? form.registrationEndDate.split('T')[0] : (!isEdit ? new Date().toISOString().split('T')[0] : undefined)}
                defaultHour="08"
                defaultPeriod="AM"
                onChange={(val) => {
                  setErrors(prev => {
                    const next = { ...prev };
                    delete next.startDate;
                    return next;
                  });
                  setForm(f => ({ ...f, startDate: val }));
                }}
                error={errors.startDate}
              />
              <ScheduleDateTimePicker
                label="Matches End Date & Time *"
                value={form.endDate}
                minDate={form.startDate ? form.startDate.split('T')[0] : (!isEdit ? new Date().toISOString().split('T')[0] : undefined)}
                defaultHour="08"
                defaultPeriod="PM"
                onChange={(val) => {
                  setErrors(prev => {
                    const next = { ...prev };
                    delete next.endDate;
                    return next;
                  });
                  setForm(f => ({ ...f, endDate: val }));
                }}
                error={errors.endDate}
              />
            </div>
          </div>

          {(form.registrationStartDate || form.registrationEndDate || form.startDate || form.endDate) && (() => {
            const fmtStep = (s: string) => {
              if (!s) return 'Not set';
              const d = new Date(s);
              return isNaN(d.getTime()) ? 'Invalid' : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            };
            const rs = form.registrationStartDate ? new Date(form.registrationStartDate).getTime() : null;
            const re = form.registrationEndDate ? new Date(form.registrationEndDate).getTime() : null;
            const ms = form.startDate ? new Date(form.startDate).getTime() : null;
            const me = form.endDate ? new Date(form.endDate).getTime() : null;
            const hasOverlap =
              (rs && re && re < rs) ||
              (re && ms && re > ms) ||
              (ms && me && me < ms);

            return (
              <div className={`rounded-xl border px-3 py-2 text-[11px] flex flex-wrap items-center justify-between gap-2 ${
                hasOverlap ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex flex-wrap items-center gap-1.5 font-medium">
                  <span>Reg Opens: <strong>{fmtStep(form.registrationStartDate)}</strong></span>
                  <span className="text-slate-400">→</span>
                  <span>Reg Closes: <strong>{fmtStep(form.registrationEndDate)}</strong></span>
                  <span className="text-slate-400">→</span>
                  <span>Matches Start: <strong>{fmtStep(form.startDate)}</strong></span>
                  <span className="text-slate-400">→</span>
                  <span>Matches End: <strong>{fmtStep(form.endDate)}</strong></span>
                </div>
                {hasOverlap && (
                  <span className="font-bold text-rose-700">⚠ Dates/times overlap or are out of order</span>
                )}
              </div>
            );
          })()}
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Categories *</h3>
            <Button variant="outline" className="h-7 px-2 text-xs" onClick={addCategory}>
              <Plus className="h-3 w-3" /> Add Category
            </Button>
          </div>
          {errors.categories && <p className="text-[11px] text-rose-600 font-medium">{errors.categories}</p>}

          <div className="space-y-3">
            {form.categories.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No categories added yet. Add at least one category to specify tournament divisions.</p>
            ) : (
              form.categories.map((c, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg relative">
                  <button type="button" onClick={() => removeCategory(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 p-1 cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pr-6">
                    <div>
                      <Select
                        label="Category Name *"
                        value={c.name}
                        onChange={e => updateCategory(idx, 'name', e.target.value)}
                        options={(options.categories.length ? options.categories : ['Men\'s Singles', 'Women\'s Singles']).map(cat => ({ value: cat, label: cat }))}
                      />
                      {errors[`cat_${idx}_name`] && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors[`cat_${idx}_name`]}</p>}
                    </div>
                    <Select
                      label="Registration Type *"
                      value={c.registrationType || ''}
                      onChange={e => updateCategory(idx, 'registrationType', e.target.value) as any}
                      options={(options.registrationTypes.length ? options.registrationTypes : ['INDIVIDUAL', 'PAIR', 'TEAM']).map(rt => ({
                        value: rt,
                        label: rt.charAt(0).toUpperCase() + rt.slice(1).toLowerCase()
                      }))}
                    />
                    <div>
                      <Input
                        label="Category Fee (₹) *"
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
                      {errors[`cat_${idx}_fee`] && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors[`cat_${idx}_fee`]}</p>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <Button variant="ghost" onClick={handleExplicitCancel} disabled={saving}>Cancel</Button>
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
        console.warn('Failed to load tournament registrations:', err?.message || err);
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
      const res = await exportTournamentRegistrations(id);
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
                  const rawPayStatus = String(r.paymentStatus || '').toUpperCase();
                  const isPaid = ['PAID', 'SUCCESS', 'COMPLETED', 'CAPTURED'].includes(rawPayStatus);
                  const rawRegStatus = String(r.registrationStatus || r.status || '').toUpperCase();
                  const displayStatus = (isPaid && (!rawRegStatus || rawRegStatus === 'PENDING'))
                    ? 'CONFIRMED'
                    : (rawRegStatus || 'PENDING');
                  const isConfirmed = ['CONFIRMED', 'APPROVED', 'ACTIVE', 'PAID'].includes(displayStatus);

                  return (
                    <Tr key={r.id || r._id || i}>
                      <Td>
                        <div className="font-semibold text-slate-900">{name}</div>
                        {categoryName && <div className="text-[10px] font-semibold text-[#F05A22]">{categoryName}</div>}
                      </Td>
                      <Td>
                        <div className="text-xs text-slate-700">{email || '—'}</div>
                        <div className="text-[10px] text-slate-500">{phone}</div>
                      </Td>
                      <Td className="capitalize text-slate-700">{regType}</Td>
                      <Td>
                        <Badge className={isPaid ? 'badge-green' : 'badge-red'}>
                          {rawPayStatus || 'PENDING'}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge className={isConfirmed ? 'badge-green' : 'badge-amber'}>
                          {displayStatus}
                        </Badge>
                      </Td>
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
  const [todayOnly, setTodayOnly]     = useState(false);
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
        if (res?.data) {
          setOptions(res.data);
        }
      }).catch(() => {});

      const res = await getAdminTournaments().catch(() => getPublicTournaments()).catch(() => null);
      const list = extractDataList<Tournament>(res);

      const seen = new Set<string>();
      const uniqueList: Tournament[] = [];
      for (const t of list) {
        const id = t._id || t.id;
        if (id && !seen.has(String(id))) {
          seen.add(String(id));
          uniqueList.push(t);
        } else if (!id) {
          uniqueList.push(t);
        }
      }
      setTournaments(uniqueList);
    } catch (err: any) {
      console.warn('Tournaments load warning:', err?.message || err);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getEffectiveTournamentStatus = (t: Tournament): string => {
    const s = String(t?.status || 'DRAFT').toUpperCase().trim();
    if (['DRAFT', 'PENDING', 'CANCELLED', 'CANCELED', 'COMPLETED', 'FINISHED', 'ENDED', 'PAST'].includes(s)) {
      return s;
    }
    const endTs = t?.endDate ? new Date(t.endDate).getTime() : NaN;
    if (!isNaN(endTs) && endTs < Date.now()) {
      return 'COMPLETED';
    }
    return s;
  };

  const matchesTournamentStatus = (t: Tournament, targetFilter: string) => {
    const s = getEffectiveTournamentStatus(t);
    const f = targetFilter.toUpperCase().trim();
    if (f === 'ALL') return true;
    if (f === 'DRAFT') return s === 'DRAFT' || s === 'PENDING';
    if (f === 'PUBLISHED') return ['PUBLISHED', 'OPEN', 'UPCOMING', 'ONGOING', 'ACTIVE', 'REGISTRATION_OPEN', 'LIVE'].includes(s);
    if (f === 'COMPLETED') return ['COMPLETED', 'FINISHED', 'ENDED', 'PAST'].includes(s);
    if (f === 'CANCELLED') return s === 'CANCELLED' || s === 'CANCELED';
    return s === f;
  };

  const filtered = tournaments.filter(t => {
    const ms = search === '' || `${t.title} ${t.sport} ${t.city || ''} ${t.venue || ''}`.toLowerCase().includes(search.toLowerCase());
    const mf = matchesTournamentStatus(t, filter);
    let matchToday = true;
    if (todayOnly) {
      const targetDate = t.startDate || (t as any).createdAt;
      if (!targetDate) matchToday = false;
      else {
        const d = new Date(targetDate);
        const now = new Date();
        matchToday = !isNaN(d.getTime()) &&
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate();
      }
    }
    return ms && mf && matchToday;
  });

  const exportTournamentsCsv = useCallback(() => {
    if (filtered.length === 0) {
      alert('No tournaments match the current filters to export.');
      return;
    }
    const headers = ['ID', 'Title', 'Sport', 'City', 'Venue', 'Start Date', 'End Date', 'Reg Open', 'Reg Close', 'Status'];
    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map(t => [
      t._id || t.id, t.title, t.sport, t.city, t.venue || t.location,
      t.startDate, t.endDate, t.registrationStartDate, t.registrationEndDate, t.status
    ].map(escapeCsv).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arenova-tournaments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  useEffect(() => {
    const onExport = () => exportTournamentsCsv();
    const onToday = (e: any) => setTodayOnly(Boolean(e?.detail?.active));
    window.addEventListener('arenova:export', onExport);
    window.addEventListener('arenova:today-filter', onToday);
    return () => {
      window.removeEventListener('arenova:export', onExport);
      window.removeEventListener('arenova:today-filter', onToday);
    };
  }, [exportTournamentsCsv]);

  const handleSave = async (formData: FormData, nextStatus?: string) => {
    if (saving) return;
    setSaving(true);
    try {
      if (editT) {
        const id = editT._id || editT.id;
        if (Array.from(formData.keys()).length > 0) {
          await updateTournament(id, formData);
        }
        if (nextStatus) {
          await updateTournamentStatus(id, nextStatus);
        }
      } else {
        await createTournament(formData);
        try { localStorage.removeItem(TOURNAMENT_DRAFT_KEY); } catch {}
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

  const buildTournamentTrend = (pred: (t: Tournament) => boolean): number[] => {
    const now = new Date();
    const counts = [0, 0, 0, 0, 0, 0];
    tournaments.forEach(t => {
      if (!pred(t)) return;
      const raw = (t as any).createdAt || t.startDate;
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

  const SPORT_BADGES: Record<string, string> = {
    Cricket: 'bg-orange-50 text-orange-600 border-orange-200',
    Football: 'bg-blue-50 text-blue-600 border-blue-200',
    Badminton: 'bg-sky-50 text-sky-600 border-sky-200',
    Tennis: 'bg-purple-50 text-purple-600 border-purple-200',
    Swimming: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    Basketball: 'bg-amber-50 text-amber-600 border-amber-200',
  };

  const stats = {
    total: tournaments.length,
    draft: tournaments.filter(t => matchesTournamentStatus(t, 'Draft')).length,
    published: tournaments.filter(t => matchesTournamentStatus(t, 'Published')).length,
    completed: tournaments.filter(t => matchesTournamentStatus(t, 'Completed')).length
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 p-3 sm:p-5 min-w-0 max-w-full">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total"     value={String(stats.total)}     icon={<Trophy className="h-4 w-4 text-blue-600" />}       iconBg="bg-blue-100/80"    tone="blue"    sparklineData={buildTournamentTrend(() => true)} onClick={() => setFilter('All')} active={filter === 'All'} />
        <StatCard label="Draft"     value={String(stats.draft)}     icon={<CalendarDays className="h-4 w-4 text-[#F05A22]" />} iconBg="bg-orange-100/80"  tone="orange"  sparklineData={buildTournamentTrend(t => matchesTournamentStatus(t, 'Draft'))} onClick={() => setFilter('Draft')} active={filter === 'Draft'} />
        <StatCard label="Published" value={String(stats.published)} icon={<Medal className="h-4 w-4 text-emerald-600" />}     iconBg="bg-emerald-100/80" tone="emerald" sparklineData={buildTournamentTrend(t => matchesTournamentStatus(t, 'Published'))} onClick={() => setFilter('Published')} active={filter === 'Published'} />
        <StatCard label="Completed" value={String(stats.completed)} icon={<Trophy className="h-4 w-4 text-amber-600" />}      iconBg="bg-amber-100/80"   tone="amber"   sparklineData={buildTournamentTrend(t => matchesTournamentStatus(t, 'Completed'))} onClick={() => setFilter('Completed')} active={filter === 'Completed'} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tournaments ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search tournaments..." />
            <div className="flex gap-1.5 flex-wrap">{FILTERS.map(f => <FilterPill key={f} label={f} active={filter === f} onClick={() => setFilter(f)} accent="orange" />)}</div>
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
                    const displayStatus = getEffectiveTournamentStatus(t);
                    return (
                      <Tr key={t._id || t.id}>
                        <Td><div className="flex items-center gap-2.5 min-w-0"><span className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center flex-shrink-0 text-sm">{SPORT_ICONS[t.sport] || '🏆'}</span><span className="text-sm font-semibold text-slate-900 truncate max-w-[170px]" title={t.title}>{t.title}</span></div></Td>
                        <Td><Badge className={SPORT_BADGES[t.sport] || 'badge-blue'}>{t.sport}</Badge></Td>
                        <Td className="capitalize text-xs text-slate-500">{t.categories && t.categories.length ? Array.from(new Set(t.categories.map(c => c.registrationType))).join(', ') : '—'}</Td>
                        <Td className="text-xs text-slate-500 whitespace-nowrap">{startDateStr}</Td>
                        <Td className="text-xs text-slate-500 whitespace-nowrap">Ends: {regEndStr}</Td>
                        <Td><Badge className={STATUS_MAP[displayStatus] || 'badge-gray'}>{displayStatus}</Badge></Td>
                        <Td>
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <button onClick={() => setViewT(t)} title="View Details" className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 cursor-pointer transition-colors"><Eye className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setRegsT(t)} title="View Registrations" className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 cursor-pointer transition-colors"><Users className="h-3.5 w-3.5" /></button>
                            {can('sports_write') && (
                              <>
                                <button onClick={() => { setEditT(t); setFormOpen(true); }} title="Edit" className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 cursor-pointer transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                                <button onClick={() => setDeleteT(t)} title="Delete" className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 cursor-pointer transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
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

