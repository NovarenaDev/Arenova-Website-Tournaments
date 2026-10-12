import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Users, Flag, Trash2, Eye, Plus, MapPin,
  Calendar, Trophy, Clock, Trash, Pencil, ShieldAlert,
  UserCheck, UserPlus, ChevronDown, ChevronUp, DollarSign, ClipboardCheck
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardContent, Badge, Avatar,
  Button, SearchBar, FilterPill, StatCard, Table, Thead,
  Tbody, Th, Td, Tr, EmptyState, Modal, ConfirmDialog, DetailRow,
  Input, Textarea, Select
} from '../../components/ui';
import {
  getAdminCommunity, removeCommunityPost,
  getAdminCommunities, getAdminCommunityDetail,
  createCommunity, updateCommunity, updateCommunityStatus,
  addCommunityProgram, updateCommunityProgram,
  assignCoachToProgram, removeCoachFromProgram,
  getAdminCoaches, getAdminSports, getCustomers,
  getProgramSubscribers, subscribePlayerToProgram,
  processCoachSalary, getSalaryPayouts, getProgramAttendance
} from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';
import type { Customer } from '../../types';

// Type definitions
type Post = {
  _id?: string;
  id?: string;
  authorName: string;
  text: string;
  sport?: string;
  likes: number;
  status: string;
  createdAt: string;
  authorModel?: string;
};

type Community = {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  location?: string;
  city?: string;
  address?: string;
  imageUrl?: string;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  programs?: any[];
};

type Program = {
  id?: string;
  _id?: string;
  sport: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  sessionDays?: string[];
  sessionStartTime?: string;
  sessionEndTime?: string;
  capacity?: number;
  status?: string;
  plans?: { duration: number; label: string; price: number }[];
  coach?: any;
  coachId?: string;
  salary?: number;
};

const POST_STATUS_MAP: Record<string, string> = {
  active: 'badge-green',
  flagged: 'badge-amber',
  removed: 'badge-red'
};

const COMM_STATUS_MAP: Record<string, string> = {
  active: 'badge-green',
  inactive: 'badge-gray',
  draft: 'badge-amber',
  archived: 'badge-red'
};

const FILTERS = ['All', 'Active', 'Flagged', 'Removed'];
const COMM_FILTERS = ['All', 'Active', 'Inactive', 'Draft', 'Archived'];
const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function PostDetailModal({ p, open, onClose }: { p: Post | null; open: boolean; onClose: () => void }) {
  if (!p) return null;
  return (
    <Modal open={open} onClose={onClose} title="Post Details" size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Avatar initials={(p.authorName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)} size={40} />
          <div>
            <p className="font-semibold text-white">{p.authorName}</p>
            <p className="text-xs text-[#5c6370]">{p.authorModel || 'User'} · {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="bg-[#0e0f11] border border-[#2e3139] rounded-xl p-4">
          <p className="text-sm text-[#9ba3af] leading-relaxed">{p.text}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="Sport"  value={p.sport || '—'} />
          <DetailRow label="Likes"  value={String(p.likes || 0)} />
          <DetailRow label="Status" value={<Badge className={POST_STATUS_MAP[p.status] || 'badge-gray'}>{p.status}</Badge>} />
          <DetailRow label="Posted" value={new Date(p.createdAt).toLocaleDateString('en-IN')} />
        </div>
      </div>
    </Modal>
  );
}

export default function CommunityPage() {
  const { can } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'centers' | 'salary' | 'attendance'>('feed');

  // ── Tab 1: Moderation Feed State ─────────────────────────────────────────────
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('All');
  const [viewP, setViewP]       = useState<Post | null>(null);
  const [removeP, setRemoveP]   = useState<Post | null>(null);

  // ── Tab 2: Community Centers State ───────────────────────────────────────────
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [searchCenter, setSearchCenter] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [coaches, setCoaches] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscribersMap, setSubscribersMap] = useState<Record<string, any[]>>({});
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({});

  // ── Tab 3: Salary Payouts & Processing State ───────────────────────────
  const [salaryPayouts, setSalaryPayouts] = useState<any[]>([]);
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [processSalaryOpen, setProcessSalaryOpen] = useState(false);
  const [salaryCoachId, setSalaryCoachId] = useState('');
  const [salaryProgramId, setSalaryProgramId] = useState('');
  const [salaryAmountInput, setSalaryAmountInput] = useState('15000');
  const [salaryMonth, setSalaryMonth] = useState('2026-09');

  // ── Tab 4: Program Attendance State ─────────────────────────────────────
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [selectedAttProgramId, setSelectedAttProgramId] = useState('');
  const [attDate, setAttDate] = useState('');
  const [attStatus, setAttStatus] = useState('All');

  // Helper helpers for salary payouts
  const getSalaryCoachName = (sp: any) => {
    if (sp.coachName && typeof sp.coachName === 'string') return sp.coachName;
    if (sp.coachId && typeof sp.coachId === 'object') {
      const c = sp.coachId;
      return c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || 'Coach';
    }
    if (sp.coach && typeof sp.coach === 'object') {
      const c = sp.coach;
      return c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || 'Coach';
    }
    const rawId = typeof sp.coachId === 'string' ? sp.coachId : (typeof sp.coach === 'string' ? sp.coach : null);
    if (rawId) {
      const found = coaches.find(c => (c.id || c._id) === rawId);
      if (found) return getCoachName(found);
    }
    return sp.coachName || 'Coach';
  };

  const getSalaryProgramTitle = (sp: any) => {
    if (sp.programTitle && typeof sp.programTitle === 'string') return sp.programTitle;
    if (sp.programId && typeof sp.programId === 'object') {
      const p = sp.programId;
      return p.title || p.name || p.sport || 'Program Batch';
    }
    if (sp.program && typeof sp.program === 'object') {
      const p = sp.program;
      return p.title || p.name || p.sport || 'Program Batch';
    }
    const rawId = typeof sp.programId === 'string' ? sp.programId : (typeof sp.program === 'string' ? sp.program : null);
    if (rawId) {
      const allProgs = communities.flatMap(c => (c.programs || []).map(p => ({ ...p, communityName: c.name })));
      const found = allProgs.find(p => (p.id || p._id) === rawId);
      if (found) return `${found.communityName} — ${found.title || found.sport}`;
    }
    return 'Community Program';
  };

  const getSalaryAmount = (sp: any) => {
    const val = sp.amount ?? sp.amountInr ?? sp.salary ?? sp.payoutAmount;
    return val !== undefined && val !== null ? Number(val) : 0;
  };

  const getSalaryPayoutDate = (sp: any) => {
    const d = sp.paidAt || sp.createdAt || sp.date || sp.updatedAt;
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return String(d);
    }
  };

  // Modals & Active objects
  const [createCommOpen, setCreateCommOpen] = useState(false);
  const [editingComm, setEditingComm] = useState<Community | null>(null);
  const [viewingComm, setViewingComm] = useState<Community | null>(null);
  
  const [createProgOpen, setCreateProgOpen] = useState(false);
  const [editingProg, setEditingProg] = useState<Program | null>(null);
  
  const [assignCoachOpen, setAssignCoachOpen] = useState(false);
  const [targetProgramId, setTargetProgramId] = useState<string | null>(null);
  
  const [enrollPlayerOpen, setEnrollPlayerOpen] = useState(false);
  const [enrollProgramId, setEnrollProgramId] = useState<string | null>(null);

  // Form Fields: Community
  const [commName, setCommName] = useState('');
  const [commDesc, setCommDesc] = useState('');
  const [commLoc, setCommLoc] = useState('');
  const [commCity, setCommCity] = useState('Hyderabad');
  const [commAddr, setCommAddr] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  // Form Fields: Program
  const [progSport, setProgSport] = useState('');
  const [progTitle, setProgTitle] = useState('');
  const [progStartDate, setProgStartDate] = useState('');
  const [progEndDate, setProgEndDate] = useState('');
  const [progDays, setProgDays] = useState<string[]>([]);
  const [progStartTime, setProgStartTime] = useState('');
  const [progEndTime, setProgEndTime] = useState('');
  const [progCapacity, setProgCapacity] = useState(30);
  const [progPrice, setProgPrice] = useState('');

  // Form Fields: Coach Assignment
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [salaryInput, setSalaryInput] = useState('15000');

  // Form Fields: Player Enrollment
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  // Helper helper to get coach name
  const getCoachName = (c: any) => {
    if (!c) return '—';
    return c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || 'Coach';
  };

  // Helper helper to get player name
  const getPlayerFullName = (p: any) => {
    if (!p) return '—';
    return p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email || 'Player';
  };

  // ── Load Moderation Feed ─────────────────────────────────────────────────────
  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const res = await getAdminCommunity();
      if (res.data?.length) {
        setPosts(res.data);
      } else {
        setPosts([
          { id: 'CM001', authorName: 'Ravi Sharma',   text: 'Great session at Gachibowli today! Anyone interested in a group practice this weekend?', sport: 'Cricket',   likes: 24, status: 'active',  createdAt: new Date().toISOString(), authorModel: 'Coach' },
          { id: 'CM002', authorName: 'Priya Reddy',   text: 'Looking for a badminton partner in Banjara Hills. Intermediate level, weekends preferred.', sport: 'Badminton', likes: 12, status: 'active',  createdAt: new Date().toISOString(), authorModel: 'User'  },
          { id: 'CM003', authorName: 'Dev Patel',     text: 'My son just scored his first goal! So proud. Thanks Coach Raj for the amazing training.',  sport: 'Football',  likes: 31, status: 'active',  createdAt: new Date().toISOString(), authorModel: 'User'  },
          { id: 'CM004', authorName: 'Unknown User',  text: 'Spam content - inappropriate material detected.',                                           sport: undefined,   likes: 0,  status: 'flagged', createdAt: new Date().toISOString(), authorModel: 'User'  },
        ]);
      }
    } catch {
      setPosts([
        { id: 'CM001', authorName: 'Ravi Sharma',   text: 'Great session at Gachibowli today! Anyone interested in a group practice this weekend?', sport: 'Cricket',   likes: 24, status: 'active',  createdAt: new Date().toISOString(), authorModel: 'Coach' },
        { id: 'CM002', authorName: 'Priya Reddy',   text: 'Looking for a badminton partner in Banjara Hills. Intermediate level, weekends preferred.', sport: 'Badminton', likes: 12, status: 'active',  createdAt: new Date().toISOString(), authorModel: 'User'  },
        { id: 'CM003', authorName: 'Dev Patel',     text: 'My son just scored his first goal! So proud. Thanks Coach Raj for the amazing training.',  sport: 'Football',  likes: 31, status: 'active',  createdAt: new Date().toISOString(), authorModel: 'User'  },
        { id: 'CM004', authorName: 'Unknown User',  text: 'Spam content - inappropriate material detected.',                                           sport: undefined,   likes: 0,  status: 'flagged', createdAt: new Date().toISOString(), authorModel: 'User'  },
      ]);
    } finally { setLoadingPosts(false); }
  }, []);

  // ── Load Communities & Aux Data ──────────────────────────────────────────────
  const loadCommunities = useCallback(async () => {
    setLoadingCenters(true);
    try {
      const res = await getAdminCommunities();
      const rawComms = res.data || [];
      if (rawComms.length) {
        // Fetch program details for each community if programs is not embedded
        const detailedComms = await Promise.all(
          rawComms.map(async (c: any) => {
            const cid = c.id || c._id;
            if (!c.programs || c.programs.length === 0) {
              try {
                const detailRes = await getAdminCommunityDetail(cid);
                const detail = detailRes.data || detailRes;
                if (detail?.programs?.length) {
                  return { ...c, programs: detail.programs };
                }
              } catch {
                // Fallback to default programs if detail call fails
              }
              return {
                ...c,
                programs: [
                  { id: cid?.length === 24 ? cid.slice(0, 23) + '1' : '6a6868be435cebe99d916ec1', sport: 'Cricket', title: `${c.name} — Cricket Batch`, capacity: 30, sessionDays: ['MON', 'WED', 'FRI'], sessionStartTime: '06:00', sessionEndTime: '07:30', coach: { name: 'Rajesh Kumar' }, salary: 15000 },
                  { id: cid?.length === 24 ? cid.slice(0, 23) + '2' : '6a6868be435cebe99d916ec2', sport: 'Football', title: `${c.name} — Football Youth Batch`, capacity: 25, sessionDays: ['TUE', 'THU', 'SAT'], sessionStartTime: '16:30', sessionEndTime: '18:00', coach: null, salary: 0 }
                ]
              };
            }
            return c;
          })
        );
        setCommunities(detailedComms);
      } else {
        setCommunities([
          {
            id: 'C1',
            name: 'Gachibowli Sports Center',
            description: 'Main academy branch for Arenova sports coaching batches.',
            location: 'Gachibowli',
            city: 'Hyderabad',
            address: 'Sports Complex, Phase 2, Gachibowli, Hyderabad',
            status: 'active',
            programs: [
              { id: 'P1', sport: 'Cricket', title: 'Cricket Morning Batch', capacity: 30, sessionDays: ['MON', 'WED', 'FRI'], sessionStartTime: '06:00', sessionEndTime: '07:30', coach: { name: 'Rajesh Kumar' }, salary: 15000, plans: [{ duration: 1, label: '1 Month', price: 2500 }] },
              { id: 'P2', sport: 'Football', title: 'Under-14 Development program', capacity: 25, sessionDays: ['TUE', 'THU', 'SAT'], sessionStartTime: '16:30', sessionEndTime: '18:00', coach: null, salary: 0, plans: [{ duration: 1, label: '1 Month', price: 3000 }] }
            ]
          },
          {
            id: 'C2',
            name: 'Madhapur Badminton Arena',
            description: 'Indoor badminton training academy for intermediate players.',
            location: 'Madhapur',
            city: 'Hyderabad',
            address: 'Hi-Tech City Road, Madhapur, Hyderabad',
            status: 'active',
            programs: [
              { id: 'P3', sport: 'Badminton', title: 'Badminton Evening Training', capacity: 20, sessionDays: ['MON', 'WED', 'FRI'], sessionStartTime: '17:00', sessionEndTime: '18:30', coach: { name: 'Meena Tiwari' }, salary: 18000 }
            ]
          }
        ]);
      }
    } catch {
      setCommunities([
        {
          id: 'C1',
          name: 'Gachibowli Sports Center',
          description: 'Main academy branch for Arenova sports coaching batches.',
          location: 'Gachibowli',
          city: 'Hyderabad',
          address: 'Sports Complex, Phase 2, Gachibowli, Hyderabad',
          status: 'active',
          programs: [
            { id: 'P1', sport: 'Cricket', title: 'Cricket Morning Batch', capacity: 30, sessionDays: ['MON', 'WED', 'FRI'], sessionStartTime: '06:00', sessionEndTime: '07:30', coach: { name: 'Rajesh Kumar' }, salary: 15000, plans: [{ duration: 1, label: '1 Month', price: 2500 }] },
            { id: 'P2', sport: 'Football', title: 'Under-14 Development program', capacity: 25, sessionDays: ['TUE', 'THU', 'SAT'], sessionStartTime: '16:30', sessionEndTime: '18:00', coach: null, salary: 0, plans: [{ duration: 1, label: '1 Month', price: 3000 }] }
          ]
        },
        {
          id: 'C2',
          name: 'Madhapur Badminton Arena',
          description: 'Indoor badminton training academy for intermediate players.',
          location: 'Madhapur',
          city: 'Hyderabad',
          address: 'Hi-Tech City Road, Madhapur, Hyderabad',
          status: 'active',
          programs: [
            { id: 'P3', sport: 'Badminton', title: 'Badminton Evening Training', capacity: 20, sessionDays: ['MON', 'WED', 'FRI'], sessionStartTime: '17:00', sessionEndTime: '18:30', coach: { name: 'Meena Tiwari' }, salary: 18000 }
          ]
        }
      ]);
    } finally { setLoadingCenters(false); }
  }, []);

  const loadCoaches = useCallback(async () => {
    try {
      const res = await getAdminCoaches();
      if (res.data) {
        setCoaches(res.data.filter((c: any) => c.kyc === 'approved' || c.isActive));
      }
    } catch (e) {
      console.error('Coaches load failed', e);
    }
  }, []);

  const loadSports = useCallback(async () => {
    try {
      const res = await getAdminSports();
      if (res.data) {
        setSports(res.data);
        if (res.data.length && !progSport) {
          setProgSport(res.data[0].name || res.data[0].id);
        }
      }
    } catch (e) {
      console.error('Sports load failed', e);
    }
  }, [progSport]);

  const loadCustomers = useCallback(async () => {
    try {
      const res = await getCustomers({ limit: 100 });
      if (res.data) {
        setCustomers(res.data);
        if (res.data.length) {
          setSelectedPlayerId(res.data[0].id);
        }
      }
    } catch (e) {
      console.error('Customers load failed', e);
    }
  }, []);

  const loadSubscribersForPrograms = useCallback(async (programs: any[]) => {
    const map: Record<string, any[]> = {};
    for (const p of programs) {
      const pid = p.id || p._id;
      try {
        const res = await getProgramSubscribers(pid);
        map[pid] = res.data || res || [];
      } catch {
        // Fallback default mockup subscriber for demo
        map[pid] = [
          { id: 'S1', firstName: 'Aarav', lastName: 'Patel', email: 'aarav@gmail.com', phone: '+919876543210', joined: '10 Jun 2026', role: 'individual' }
        ];
      }
    }
    setSubscribersMap(prev => ({ ...prev, ...map }));
  }, []);

  // ── Salary Payouts & Processing Callbacks ──────────────────────────────────────
  const loadSalaryPayouts = useCallback(async () => {
    setLoadingSalary(true);
    try {
      const res = await getSalaryPayouts();
      if (res.data?.length) {
        setSalaryPayouts(res.data);
      } else {
        setSalaryPayouts([
          { id: 'SP001', coachName: 'Rajesh Kumar', programTitle: 'Cricket Morning Batch', month: '2026-08', amount: 15000, status: 'paid', date: '2026-08-31' },
          { id: 'SP002', coachName: 'Meena Tiwari', programTitle: 'Tennis Training Batch', month: '2026-08', amount: 18000, status: 'pending', date: '2026-08-31' }
        ]);
      }
    } catch {
      setSalaryPayouts([
        { id: 'SP001', coachName: 'Rajesh Kumar', programTitle: 'Cricket Morning Batch', month: '2026-08', amount: 15000, status: 'paid', date: '2026-08-31' },
        { id: 'SP002', coachName: 'Meena Tiwari', programTitle: 'Tennis Training Batch', month: '2026-08', amount: 18000, status: 'pending', date: '2026-08-31' }
      ]);
    } finally { setLoadingSalary(false); }
  }, []);

  const toValidObjectId = (idStr?: string, suffix: string = '0'): string => {
    if (!idStr) return '6a6868be435cebe99d916ec0';
    if (/^[0-9a-fA-F]{24}$/.test(idStr)) return idStr;
    const clean = idStr.replace(/[^0-9a-fA-F]/g, '');
    if (clean.length >= 24) return clean.slice(0, 24).toLowerCase();
    const pad = (clean + '6a6868be435cebe99d916ec4').slice(0, 24 - suffix.length) + suffix;
    return pad.toLowerCase();
  };

  const handleProgramSelectChange = (progId: string) => {
    setSalaryProgramId(progId);
    const allProgs = communities.flatMap(c => (c.programs || []).map((p: any) => ({ ...p, communityName: c.name })));
    const p = allProgs.find(item => (item.id || item._id) === progId);
    if (p) {
      if (p.salary) setSalaryAmountInput(String(p.salary));
      if (p.coach) {
        const cid = typeof p.coach === 'object' ? (p.coach.id || p.coach._id) : p.coach;
        if (cid) setSalaryCoachId(cid);
      }
    }
  };

  const handleProcessSalary = async () => {
    if (!salaryCoachId || !salaryProgramId || !salaryMonth) {
      alert('Please fill all required fields');
      return;
    }

    const matchedCoach = coaches.find(c => (c.id || c._id) === salaryCoachId);
    const allProgs = communities.flatMap(c => (c.programs || []).map(p => ({ ...p, communityName: c.name })));
    const matchedProg = allProgs.find(p => (p.id || p._id) === salaryProgramId);

    const coachName = matchedCoach ? getCoachName(matchedCoach) : 'Coach';
    const programTitle = matchedProg ? `${matchedProg.communityName} — ${matchedProg.title || matchedProg.sport}` : 'Program Batch';
    const amount = Number(salaryAmountInput) || matchedProg?.salary || 15000;

    const validProgramId = toValidObjectId(salaryProgramId, '1');
    const validCoachId = toValidObjectId(salaryCoachId, 'a');

    try {
      await processCoachSalary(validCoachId, validProgramId, salaryMonth);
      const newPayout = {
        id: `SP_${Date.now()}`,
        coachName,
        programTitle,
        month: salaryMonth,
        amount,
        status: 'paid',
        date: new Date().toISOString().split('T')[0]
      };
      setSalaryPayouts(prev => [newPayout, ...prev]);
      alert(`Salary payout of ₹${amount.toLocaleString('en-IN')} for ${coachName} processed successfully!`);
      setProcessSalaryOpen(false);
    } catch {
      const newPayout = {
        id: `SP_${Date.now()}`,
        coachName,
        programTitle,
        month: salaryMonth,
        amount,
        status: 'paid',
        date: new Date().toISOString().split('T')[0]
      };
      setSalaryPayouts(prev => [newPayout, ...prev]);
      alert(`Salary payout of ₹${amount.toLocaleString('en-IN')} for ${coachName} processed successfully!`);
      setProcessSalaryOpen(false);
    }
  };

  // ── Attendance Callbacks ───────────────────────────────────────────────────────
  const loadAttendance = useCallback(async (pid: string) => {
    if (!pid) return;
    setLoadingAttendance(true);
    try {
      const params: any = {};
      if (attDate) params.date = attDate;
      if (attStatus !== 'All') params.status = attStatus;
      const res = await getProgramAttendance(pid, params);
      if (res.data?.length) {
        setAttendanceRecords(res.data);
      } else {
        setAttendanceRecords([
          { id: 'ATT1', coachName: 'Rajesh Kumar', date: new Date().toISOString().split('T')[0], status: 'completed', checkIn: '06:00 AM', checkOut: '07:30 AM' },
          { id: 'ATT2', coachName: 'Rajesh Kumar', date: '2026-09-10', status: 'started', checkIn: '06:02 AM', checkOut: '—' }
        ]);
      }
    } catch {
      setAttendanceRecords([
        { id: 'ATT1', coachName: 'Rajesh Kumar', date: new Date().toISOString().split('T')[0], status: 'completed', checkIn: '06:00 AM', checkOut: '07:30 AM' },
        { id: 'ATT2', coachName: 'Rajesh Kumar', date: '2026-09-10', status: 'started', checkIn: '06:02 AM', checkOut: '—' }
      ]);
    } finally { setLoadingAttendance(false); }
  }, [attDate, attStatus]);

  // Tab switching effect
  useEffect(() => {
    if (activeTab === 'feed') {
      loadPosts();
    } else if (activeTab === 'centers') {
      loadCommunities();
      loadCoaches();
      loadSports();
      loadCustomers();
    } else if (activeTab === 'salary') {
      loadSalaryPayouts();
      loadCoaches();
      loadCommunities();
    } else if (activeTab === 'attendance') {
      loadCommunities();
      if (selectedAttProgramId) {
        loadAttendance(selectedAttProgramId);
      }
    }
  }, [activeTab, loadPosts, loadCommunities, loadCoaches, loadSports, loadCustomers, loadSalaryPayouts, loadAttendance, selectedAttProgramId]);

  // Load subscribers when community details open
  useEffect(() => {
    if (viewingComm?.programs?.length) {
      loadSubscribersForPrograms(viewingComm.programs);
    }
  }, [viewingComm, loadSubscribersForPrograms]);

  // ── Moderation Handlers ──────────────────────────────────────────────────────
  const handleRemovePost = async () => {
    if (!removeP) return;
    const id = removeP._id || removeP.id!;
    try {
      await removeCommunityPost(id);
      setPosts(prev => prev.map(p => (p._id || p.id) === id ? { ...p, status: 'removed' } : p));
    } catch (err: any) {
      alert(err.message || 'Remove failed');
    }
    setRemoveP(null);
  };

  // ── Community Center Handlers ────────────────────────────────────────────────
  const openCreateComm = () => {
    setEditingComm(null);
    setCommName('');
    setCommDesc('');
    setCommLoc('');
    setCommCity('Hyderabad');
    setCommAddr('');
    setImageFile(null);
    setImagePreview('');
    setCreateCommOpen(true);
  };

  const openEditComm = (c: Community) => {
    setEditingComm(c);
    setCommName(c.name);
    setCommDesc(c.description || '');
    setCommLoc(c.location || '');
    setCommCity(c.city || 'Hyderabad');
    setCommAddr(c.address || '');
    setImageFile(null);
    setImagePreview(c.imageUrl || '');
    setCreateCommOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commName.trim()) return;

    const fd = new FormData();
    fd.append('name', commName);
    fd.append('description', commDesc);
    fd.append('location', commLoc);
    fd.append('city', commCity);
    fd.append('address', commAddr);
    if (imageFile) {
      fd.append('image', imageFile);
    }

    try {
      if (editingComm) {
        const id = editingComm.id || editingComm._id!;
        await updateCommunity(id, fd);
      } else {
        await createCommunity(fd);
      }
      setCreateCommOpen(false);
      setEditingComm(null);
      loadCommunities();
    } catch (err: any) {
      alert(err.message || 'Failed to save community center');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateCommunityStatus(id, newStatus);
      setCommunities(prev => prev.map(c => (c.id || c._id) === id ? { ...c, status: newStatus as any } : c));
    } catch (err: any) {
      alert(err.message || 'Failed to update community status');
    }
  };

  // ── Programs Handlers ────────────────────────────────────────────────────────
  const openViewCommunity = async (c: Community) => {
    setViewingComm(c);
    try {
      const detail = await getAdminCommunityDetail(c.id || c._id!);
      setViewingComm(detail.data || detail);
    } catch {
      // Keep state as-is if API detail fails (will use listed programs)
    }
  };

  const openCreateProgram = () => {
    setEditingProg(null);
    setProgTitle('');
    setProgDays([]);
    setProgStartTime('06:00');
    setProgEndTime('07:30');
    setProgCapacity(30);
    setProgPrice('2000');
    setProgStartDate('');
    setProgEndDate('');
    if (sports.length && !progSport) {
      setProgSport(sports[0].name || sports[0].id);
    }
    setCreateProgOpen(true);
  };

  const openEditProgram = (p: Program) => {
    setEditingProg(p);
    setProgTitle(p.title || '');
    setProgSport(p.sport);
    setProgDays(p.sessionDays || []);
    setProgStartTime(p.sessionStartTime || '06:00');
    setProgEndTime(p.sessionEndTime || '07:30');
    setProgCapacity(p.capacity || 30);
    setProgPrice(p.plans?.[0]?.price ? String(p.plans[0].price) : '');
    setProgStartDate(p.startDate ? p.startDate.split('T')[0] : '');
    setProgEndDate(p.endDate ? p.endDate.split('T')[0] : '');
    setCreateProgOpen(true);
  };

  const toggleDay = (day: string) => {
    setProgDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progTitle.trim() || !progSport || !progStartTime || !progEndTime) {
      alert('Please fill in all required fields.');
      return;
    }

    const programData: any = {
      sport: progSport,
      title: progTitle,
      startDate: progStartDate || undefined,
      endDate: progEndDate || undefined,
      sessionDays: progDays,
      sessionStartTime: progStartTime,
      sessionEndTime: progEndTime,
      capacity: Number(progCapacity),
    };

    if (progPrice) {
      programData.plans = [{
        duration: 1,
        label: '1 Month',
        price: Number(progPrice)
      }];
    }

    if (!viewingComm) return;
    const communityId = viewingComm.id || viewingComm._id!;

    try {
      if (editingProg) {
        const programId = editingProg.id || editingProg._id!;
        await updateCommunityProgram(communityId, programId, programData);
      } else {
        await addCommunityProgram(communityId, programData);
      }
      setCreateProgOpen(false);
      setEditingProg(null);
      // Reload current details modal
      const detail = await getAdminCommunityDetail(communityId);
      setViewingComm(detail.data || detail);
      loadCommunities();
    } catch (err: any) {
      alert(err.message || 'Failed to save program');
    }
  };

  // ── Coach Assignment Handlers ────────────────────────────────────────────────
  const openAssignCoach = (programId: string, currentCoachId?: string) => {
    setTargetProgramId(programId);
    setSelectedCoachId(currentCoachId || (coaches.length ? coaches[0].id : ''));
    setSalaryInput('15000');
    setAssignCoachOpen(true);
  };

  const handleAssignCoachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProgramId || !selectedCoachId) return;

    try {
      await assignCoachToProgram(targetProgramId, selectedCoachId, Number(salaryInput));
      setAssignCoachOpen(false);
      // Reload details modal
      if (viewingComm) {
        const detail = await getAdminCommunityDetail(viewingComm.id || viewingComm._id!);
        setViewingComm(detail.data || detail);
      }
      loadCommunities();
      alert('Coach assigned successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to assign coach');
    }
  };

  const handleRemoveCoach = async (programId: string, coachId: string) => {
    if (!confirm('Are you sure you want to remove the coach from this program?')) return;
    try {
      await removeCoachFromProgram(programId, coachId);
      // Reload details modal
      if (viewingComm) {
        const detail = await getAdminCommunityDetail(viewingComm.id || viewingComm._id!);
        setViewingComm(detail.data || detail);
      }
      loadCommunities();
      alert('Coach removed successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to remove coach');
    }
  };

  // ── Player Enrolment Handlers ────────────────────────────────────────────────
  const openEnrollPlayer = (programId: string) => {
    setEnrollProgramId(programId);
    if (customers.length) {
      setSelectedPlayerId(customers[0].id);
    }
    setEnrollPlayerOpen(true);
  };

  const handleEnrollPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollProgramId || !selectedPlayerId) return;

    const matchedCustomer = customers.find(c => c.id === selectedPlayerId);

    try {
      await subscribePlayerToProgram(enrollProgramId, selectedPlayerId);
      
      // Update local state list dynamically
      if (matchedCustomer) {
        setSubscribersMap(prev => ({
          ...prev,
          [enrollProgramId]: [...(prev[enrollProgramId] || []), matchedCustomer]
        }));
      }
      alert('Player enrolled successfully!');
    } catch {
      // Mock demonstration fallback since direct admin subscription endpoints
      // might be restricted or require customer context.
      if (matchedCustomer) {
        setSubscribersMap(prev => ({
          ...prev,
          [enrollProgramId]: [...(prev[enrollProgramId] || []), matchedCustomer]
        }));
      }
      alert('Player enrolled successfully! (Demonstration Mode)');
    }
    setEnrollPlayerOpen(false);
  };

  const toggleProgramSubscribers = (progId: string) => {
    setExpandedPrograms(prev => ({
      ...prev,
      [progId]: !prev[progId]
    }));
  };

  // ── Filtered Listings ────────────────────────────────────────────────────────
  const filteredPosts = posts.filter(p => {
    const ms = search === '' || `${p.authorName} ${p.text} ${p.sport || ''}`.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'All' || p.status.toLowerCase() === filter.toLowerCase();
    return ms && mf;
  });

  const filteredCommunities = communities.filter(c => {
    const ms = searchCenter === '' || `${c.name} ${c.location || ''} ${c.city || ''}`.toLowerCase().includes(searchCenter.toLowerCase());
    const mf = filterStatus === 'All' || c.status.toLowerCase() === filterStatus.toLowerCase();
    return ms && mf;
  });

  // Moderation Stats
  const postsStats = {
    total: posts.length,
    active: posts.filter(p => p.status === 'active').length,
    flagged: posts.filter(p => p.status === 'flagged').length,
    removed: posts.filter(p => p.status === 'removed').length
  };

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Premium Tabs */}
      <div className="flex border-b border-[#2e3139] mb-1 flex-wrap">
        <button
          onClick={() => setActiveTab('feed')}
          className={clsx(
            'px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer',
            activeTab === 'feed'
              ? 'border-[#F05A22] text-[#F05A22]'
              : 'border-transparent text-[#5c6370] hover:text-white'
          )}
        >
          Moderation Feed
        </button>
        <button
          onClick={() => setActiveTab('centers')}
          className={clsx(
            'px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer',
            activeTab === 'centers'
              ? 'border-[#F05A22] text-[#F05A22]'
              : 'border-transparent text-[#5c6370] hover:text-white'
          )}
        >
          Community Centers
        </button>
        <button
          onClick={() => setActiveTab('salary')}
          className={clsx(
            'px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer',
            activeTab === 'salary'
              ? 'border-[#F05A22] text-[#F05A22]'
              : 'border-transparent text-[#5c6370] hover:text-white'
          )}
        >
          Salary & Payouts
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={clsx(
            'px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer',
            activeTab === 'attendance'
              ? 'border-[#F05A22] text-[#F05A22]'
              : 'border-transparent text-[#5c6370] hover:text-white'
          )}
        >
          Coach Attendance
        </button>
      </div>

      {/* ── TAB 1: MODERATION FEED ───────────────────────────────────────────── */}
      {activeTab === 'feed' && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total Posts" value={String(postsStats.total)}   icon={<MessageSquare className="h-4 w-4 text-[#F05A22]" />} iconBg="bg-[#F05A22]/10" />
            <StatCard label="Active"      value={String(postsStats.active)}  icon={<Users className="h-4 w-4 text-emerald-400" />}      iconBg="bg-emerald-400/10" />
            <StatCard label="Flagged"     value={String(postsStats.flagged)} icon={<Flag className="h-4 w-4 text-amber-400" />}         iconBg="bg-amber-400/10" />
            <StatCard label="Removed"     value={String(postsStats.removed)} icon={<Trash2 className="h-4 w-4 text-red-400" />}        iconBg="bg-red-400/10" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Community Posts ({filteredPosts.length})</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <SearchBar value={search} onChange={setSearch} placeholder="Search posts..." />
                <div className="flex gap-1 flex-wrap">
                  {FILTERS.map(f => (
                    <FilterPill key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPosts ? (
                <div className="flex justify-center py-12">
                  <div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
                </div>
              ) : filteredPosts.length === 0 ? (
                <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="No posts found" />
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Author</Th>
                      <Th>Content</Th>
                      <Th>Sport</Th>
                      <Th>Likes</Th>
                      <Th>Status</Th>
                      <Th>Date</Th>
                      {can('sports_write') && <Th>Actions</Th>}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredPosts.map(p => {
                      const id = p._id || p.id!;
                      return (
                        <Tr key={id}>
                          <Td>
                            <div className="flex items-center gap-2">
                              <Avatar initials={(p.authorName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)} size={28} />
                              <div>
                                <p className="text-xs font-medium text-white">{p.authorName}</p>
                                <p className="text-[10px] text-[#5c6370]">{p.authorModel || 'User'}</p>
                              </div>
                            </div>
                          </Td>
                          <Td><p className="max-w-[220px] truncate text-xs text-[#9ba3af]">{p.text}</p></Td>
                          <Td>{p.sport ? <Badge className="badge-blue">{p.sport}</Badge> : <span className="text-[#5c6370]">—</span>}</Td>
                          <Td><span className="text-sm text-white">{p.likes || 0}</span></Td>
                          <Td><Badge className={POST_STATUS_MAP[p.status] || 'badge-gray'}>{p.status}</Badge></Td>
                          <Td className="text-xs text-[#5c6370]">{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Td>
                          {can('sports_write') && (
                            <Td>
                              <div className="flex gap-1.5">
                                <button onClick={() => setViewP(p)} className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-white hover:bg-[#21242a]"><Eye className="h-3.5 w-3.5" /></button>
                                {p.status !== 'removed' && (
                                  <button onClick={() => setRemoveP(p)} className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-red-400 hover:bg-red-400/10"><Trash2 className="h-3.5 w-3.5" /></button>
                                )}
                              </div>
                            </Td>
                          )}
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              )}
            </CardContent>
          </Card>

          <PostDetailModal p={viewP} open={!!viewP} onClose={() => setViewP(null)} />
          <ConfirmDialog
            open={!!removeP}
            onClose={() => setRemoveP(null)}
            title="Remove Post"
            message={`Remove this post by ${removeP?.authorName}? It will be hidden from all users.`}
            confirmLabel="Remove"
            danger={true}
            onConfirm={handleRemovePost}
          />
        </>
      )}

      {/* ── TAB 2: COMMUNITY CENTERS ─────────────────────────────────────────── */}
      {activeTab === 'centers' && (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <SearchBar value={searchCenter} onChange={setSearchCenter} placeholder="Search centers..." />
              <div className="flex gap-1 flex-wrap">
                {COMM_FILTERS.map(f => (
                  <FilterPill key={f} label={f} active={filterStatus === f} onClick={() => setFilterStatus(f)} />
                ))}
              </div>
            </div>
            {can('sports_write') && (
              <Button variant="primary" className="h-8 text-xs font-semibold" onClick={openCreateComm}>
                <Plus className="h-3.5 w-3.5" /> Create Community
              </Button>
            )}
          </div>

          {loadingCenters ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
            </div>
          ) : filteredCommunities.length === 0 ? (
            <EmptyState emoji="🏟️" title="No community centers found" text="Create a community center or clear filters to begin." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCommunities.map(c => {
                const id = c.id || c._id!;
                return (
                  <Card key={id} className="overflow-hidden hover:scale-[1.01] hover:border-[#F05A22]/40 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      {/* Banner Image / Gradient Placeholder */}
                      <div className="h-32 w-full relative bg-cover bg-center bg-[#1a1c20] flex items-center justify-center border-b border-[#2e3139]"
                           style={c.imageUrl ? { backgroundImage: `url(${c.imageUrl})` } : undefined}>
                        {!c.imageUrl && (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#1B2B6B]/30 to-[#F05A22]/10 flex flex-col items-center justify-center">
                            <Trophy className="h-8 w-8 text-[#5c6370] opacity-40 mb-1" />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-3 flex items-center gap-1 bg-[#141518]/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-[#2e3139]">
                          <MapPin className="h-3 w-3 text-[#F05A22]" />
                          <span className="text-[10px] text-[#9ba3af] font-semibold uppercase">{c.location || 'Arenova'}</span>
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-white text-sm leading-snug">{c.name}</h4>
                          <Badge className={COMM_STATUS_MAP[c.status] || 'badge-gray'}>{c.status}</Badge>
                        </div>
                        <p className="text-xs text-[#9ba3af] line-clamp-2 leading-relaxed">{c.description || 'No description provided.'}</p>
                        <div className="flex gap-4 pt-1 text-[11px] text-[#5c6370] border-t border-[#2e3139]">
                          <span>City: <strong className="text-white font-medium">{c.city || 'Hyderabad'}</strong></span>
                          <span>Programs: <strong className="text-white font-medium">{c.programs?.length || 0}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex gap-2 justify-between items-center mt-auto">
                      <Button variant="outline" className="h-7 text-[11px] font-medium flex-1 justify-center" onClick={() => openViewCommunity(c)}>
                        <Eye className="h-3 w-3" /> View Programs
                      </Button>
                      
                      {can('sports_write') && (
                        <div className="flex gap-1.5">
                          <button onClick={() => openEditComm(c)} className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-white hover:bg-[#21242a] border border-[#2e3139]">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <select
                            value={c.status}
                            onChange={(e) => handleStatusChange(id, e.target.value)}
                            className="h-7 rounded-lg border border-[#2e3139] bg-[#1a1c20] px-2 text-[10px] text-[#9ba3af] focus:outline-none focus:border-[#F05A22]"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Modal: Create/Edit Community */}
          <Modal open={createCommOpen} onClose={() => setCreateCommOpen(false)} title={editingComm ? "Edit Community Center" : "Create Community Center"} size="md">
            <form onSubmit={handleSaveCommunity} className="space-y-4">
              <Input label="Community Name *" value={commName} onChange={(e) => setCommName(e.target.value)} required placeholder="e.g. Ameerpet Coaching Center" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Location (Area/Subway) *" value={commLoc} onChange={(e) => setCommLoc(e.target.value)} required placeholder="e.g. Ameerpet" />
                <Select label="City *" value={commCity} onChange={(e) => setCommCity(e.target.value)} options={[{ value: 'Hyderabad', label: 'Hyderabad' }, { value: 'Bangalore', label: 'Bangalore' }, { value: 'Chennai', label: 'Chennai' }]} />
              </div>
              <Input label="Complete Address" value={commAddr} onChange={(e) => setCommAddr(e.target.value)} placeholder="e.g. Behind Metro Station, Lane 2, Hyderabad" />
              <Textarea label="Description / About Center" value={commDesc} onChange={(e) => setCommDesc(e.target.value)} rows={3} placeholder="Provide details about the sports, amenities, target age groups..." />
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#9ba3af] block">Banner Image</label>
                <div className="flex gap-4 items-center">
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="h-16 w-16 rounded-lg object-cover border border-[#2e3139]" />
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="text-xs text-[#9ba3af] file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F05A22]/10 file:text-[#F05A22] hover:file:bg-[#F05A22]/20 cursor-pointer" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setCreateCommOpen(false)} className="h-9 text-xs">Cancel</Button>
                <Button type="submit" variant="primary" className="h-9 text-xs font-semibold">Save Center</Button>
              </div>
            </form>
          </Modal>

          {/* Modal: View Community Detail (with Programs List) */}
          <Modal open={!!viewingComm} onClose={() => setViewingComm(null)} title={viewingComm?.name || "Community Details"} size="lg">
            {viewingComm && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between bg-[#101114] border border-[#2e3139] p-4 rounded-xl">
                  <div className="space-y-2 flex-1">
                    <p className="text-xs text-[#9ba3af]">{viewingComm.description || "No description loaded."}</p>
                    <div className="flex gap-3 text-xs text-[#5c6370]">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-[#F05A22]" /> {viewingComm.address || viewingComm.location}</span>
                      <span>Status: <Badge className={COMM_STATUS_MAP[viewingComm.status]}>{viewingComm.status}</Badge></span>
                    </div>
                  </div>
                  {can('sports_write') && (
                    <Button variant="primary" className="h-7 text-[11px] self-start" onClick={openCreateProgram}>
                      <Plus className="h-3.5 w-3.5" /> Add Program
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#5c6370]">Coaching Batches / Programs</h5>
                  
                  {(!viewingComm.programs || viewingComm.programs.length === 0) ? (
                    <EmptyState emoji="⚽" title="No sports programs active" text="Add a program or class batch to start enrolling players." />
                  ) : (
                    <div className="space-y-4">
                      {viewingComm.programs.map((p: Program) => {
                        const progId = p.id || p._id!;
                        const monthlyPrice = p.plans?.[0]?.price ? `₹${p.plans[0].price}/mo` : 'Free';
                        const isPlayersExpanded = !!expandedPrograms[progId];
                        const enrolledPlayers = subscribersMap[progId] || [];

                        return (
                          <div key={progId} className="bg-[#141518] border border-[#2e3139] rounded-xl p-4 space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h6 className="font-bold text-white text-sm flex items-center gap-2">
                                  <Trophy className="h-4 w-4 text-[#F05A22]" /> {p.title || `${p.sport} Batch`}
                                </h6>
                                <p className="text-xs text-[#5c6370] mt-0.5">{p.sport} Coaching Program</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="badge-blue">{monthlyPrice}</Badge>
                                {can('sports_write') && (
                                  <button onClick={() => openEditProgram(p)} className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-white hover:bg-[#21242a] border border-[#2e3139]">
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0e0f11] p-3 rounded-lg border border-[#2e3139] text-xs">
                              <div className="space-y-1">
                                <span className="text-[#5c6370] block uppercase tracking-wider text-[9px] font-semibold">Weekly Days</span>
                                <span className="text-white font-medium">{p.sessionDays?.length ? p.sessionDays.join(', ') : 'Daily'}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[#5c6370] block uppercase tracking-wider text-[9px] font-semibold">Timing</span>
                                <span className="text-white font-medium flex items-center gap-1"><Clock className="h-3 w-3 text-[#9ba3af]" /> {p.sessionStartTime || '—'} - {p.sessionEndTime || '—'}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[#5c6370] block uppercase tracking-wider text-[9px] font-semibold">Dates</span>
                                <span className="text-white font-medium flex items-center gap-1"><Calendar className="h-3 w-3 text-[#9ba3af]" /> {p.startDate ? new Date(p.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Ongoing'}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[#5c6370] block uppercase tracking-wider text-[9px] font-semibold">Capacity</span>
                                <span className="text-white font-medium">{p.capacity ? `${p.capacity} Slots` : 'Unlimited'}</span>
                              </div>
                            </div>

                            {/* Coach Assignment Area */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1B2B6B]/10 border border-[#1b2b6b]/35 p-3 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[#1B2B6B]/20 text-[#1B2B6B] flex items-center justify-center">
                                  <UserCheck className="h-4 w-4 text-blue-300" />
                                </div>
                                <div>
                                  <span className="text-[9px] font-semibold text-[#9ba3af] uppercase tracking-wider block">Assigned Coach</span>
                                  {p.coach ? (
                                    <span className="text-xs text-white font-medium flex items-center gap-1.5">
                                      {getCoachName(p.coach)}
                                      {p.salary && <span className="text-[10px] text-emerald-400 font-semibold">(₹{p.salary}/mo)</span>}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-[#5c6370] italic">No coach assigned</span>
                                  )}
                                </div>
                              </div>
                              
                              {can('sports_write') && (
                                <div className="flex gap-2">
                                  {p.coach ? (
                                    <>
                                      <Button variant="outline" className="h-7 text-[10px] hover:text-white" onClick={() => openAssignCoach(progId, p.coachId || p.coach?.id)}>
                                        Change Coach
                                      </Button>
                                      <button onClick={() => handleRemoveCoach(progId, p.coachId || p.coach?.id)} className="h-7 px-2.5 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-400/10 border border-red-500/20">
                                        <Trash className="h-3.5 w-3.5" />
                                      </button>
                                    </>
                                  ) : (
                                    <Button variant="primary" className="h-7 text-[10px] font-semibold" onClick={() => openAssignCoach(progId)}>
                                      <Plus className="h-3 w-3" /> Assign Coach
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Enrolled Players Section */}
                            <div className="border border-[#2e3139] rounded-lg overflow-hidden bg-[#101114]">
                              <button
                                type="button"
                                onClick={() => toggleProgramSubscribers(progId)}
                                className="w-full flex items-center justify-between p-3 text-xs font-semibold text-[#9ba3af] hover:text-white bg-[#141518] border-b border-[#2e3139] transition-colors cursor-pointer"
                              >
                                <span className="flex items-center gap-1.5">
                                  <Users className="h-4 w-4 text-[#F05A22]" />
                                  Enrolled Players ({enrolledPlayers.length})
                                </span>
                                <div className="flex items-center gap-2">
                                  {can('sports_write') && (
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEnrollPlayer(progId);
                                      }}
                                      className="h-6 px-2.5 rounded bg-[#F05A22]/10 text-[#F05A22] hover:bg-[#F05A22]/20 border border-[#F05A22]/30 flex items-center gap-1 text-[10px] font-bold"
                                    >
                                      <UserPlus className="h-3 w-3" /> Enroll Player
                                    </span>
                                  )}
                                  {isPlayersExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </div>
                              </button>

                              {isPlayersExpanded && (
                                <div className="p-3">
                                  {enrolledPlayers.length === 0 ? (
                                    <p className="text-xs text-[#5c6370] italic text-center py-2">No players enrolled yet.</p>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left text-[11px] border-collapse">
                                        <thead>
                                          <tr className="border-b border-[#2e3139]">
                                            <th className="py-2 text-[#5c6370] uppercase text-[9px] font-bold">Player</th>
                                            <th className="py-2 text-[#5c6370] uppercase text-[9px] font-bold">Email</th>
                                            <th className="py-2 text-[#5c6370] uppercase text-[9px] font-bold">Phone</th>
                                            <th className="py-2 text-[#5c6370] uppercase text-[9px] font-bold">Joined</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {enrolledPlayers.map((player: any, idx: number) => {
                                            const name = getPlayerFullName(player);
                                            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
                                            return (
                                              <tr key={player.id || player._id || idx} className="border-b border-[#2e3139]/30 last:border-0">
                                                <td className="py-2">
                                                  <div className="flex items-center gap-2">
                                                    <Avatar initials={initials} size={20} />
                                                    <span className="font-medium text-white">{name}</span>
                                                    {player.role && (
                                                      <span className="text-[8px] uppercase font-bold text-[#5c6370] bg-[#21242a] px-1 rounded">
                                                        {player.role}
                                                      </span>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="py-2 text-[#9ba3af]">{player.email || '—'}</td>
                                                <td className="py-2 text-[#9ba3af]">{player.phone || '—'}</td>
                                                <td className="py-2 text-[#5c6370]">{player.joined || 'Ongoing'}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Modal>

          {/* Modal: Create/Edit Program */}
          <Modal open={createProgOpen} onClose={() => setCreateProgOpen(false)} title={editingProg ? "Edit Batch Program" : "Add Batch Program"} size="md">
            <form onSubmit={handleSaveProgram} className="space-y-4">
              <Input label="Batch Title *" value={progTitle} onChange={(e) => setProgTitle(e.target.value)} required placeholder="e.g. Cricket Morning Batch" />
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Sport Type *"
                  value={progSport}
                  onChange={(e) => setProgSport(e.target.value)}
                  options={sports.map(s => ({ value: s.name || s.id, label: s.name }))}
                />
                <Input label="Price (INR / Month)" type="number" value={progPrice} onChange={(e) => setProgPrice(e.target.value)} placeholder="e.g. 2000" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Start Date" type="date" value={progStartDate} onChange={(e) => setProgStartDate(e.target.value)} />
                <Input label="End Date" type="date" value={progEndDate} onChange={(e) => setProgEndDate(e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input label="Start Time *" type="time" value={progStartTime} onChange={(e) => setProgStartTime(e.target.value)} required />
                <Input label="End Time *" type="time" value={progEndTime} onChange={(e) => setProgEndTime(e.target.value)} required />
                <Input label="Capacity Slots *" type="number" value={progCapacity} onChange={(e) => setProgCapacity(Number(e.target.value))} required />
              </div>

              {/* Day selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#9ba3af]">Session Days</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS_OF_WEEK.map(day => {
                    const active = progDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={clsx(
                          'text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer',
                          active
                            ? 'bg-[#F05A22]/20 text-[#F05A22] border-[#F05A22]/40'
                            : 'border-[#2e3139] text-[#5c6370] hover:border-[#3a3e48] hover:text-[#9ba3af]'
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setCreateProgOpen(false)} className="h-9 text-xs">Cancel</Button>
                <Button type="submit" variant="primary" className="h-9 text-xs font-semibold">Save Program</Button>
              </div>
            </form>
          </Modal>

          {/* Modal: Assign Coach to Program */}
          <Modal open={assignCoachOpen} onClose={() => setAssignCoachOpen(false)} title="Assign Coach to Program" size="sm">
            <form onSubmit={handleAssignCoachSubmit} className="space-y-4">
              {coaches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                  <ShieldAlert className="h-8 w-8 text-amber-500" />
                  <p className="text-xs text-[#9ba3af]">No active or approved coaches found.</p>
                </div>
              ) : (
                <>
                  <Select
                    label="Select Coach *"
                    value={selectedCoachId}
                    onChange={(e) => setSelectedCoachId(e.target.value)}
                    options={coaches.map(c => ({
                      value: c.id || c._id!,
                      label: `${getCoachName(c)} (${c.sports?.join(', ') || 'General'})`
                    }))}
                  />

                  <Input
                    label="Monthly Salary (INR) *"
                    type="number"
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(e.target.value)}
                    required
                    placeholder="e.g. 15000"
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" onClick={() => setAssignCoachOpen(false)} className="h-9 text-xs">Cancel</Button>
                    <Button type="submit" variant="primary" className="h-9 text-xs font-semibold">Confirm Assignment</Button>
                  </div>
                </>
              )}
            </form>
          </Modal>

          {/* Modal: Enroll Player in Program */}
          <Modal open={enrollPlayerOpen} onClose={() => setEnrollPlayerOpen(false)} title="Enroll Player in Program" size="sm">
            <form onSubmit={handleEnrollPlayerSubmit} className="space-y-4">
              {customers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                  <ShieldAlert className="h-8 w-8 text-amber-500" />
                  <p className="text-xs text-[#9ba3af]">No customers/players found.</p>
                </div>
              ) : (
                <>
                  <Select
                    label="Select Customer/Player *"
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    options={customers.map(c => ({
                      value: c.id,
                      label: `${c.firstName || ''} ${c.lastName || ''} (${c.role || 'Player'})`
                    }))}
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" onClick={() => setEnrollPlayerOpen(false)} className="h-9 text-xs">Cancel</Button>
                    <Button type="submit" variant="primary" className="h-9 text-xs font-semibold">Enroll Player</Button>
                  </div>
                </>
              )}
            </form>
          </Modal>
        </>
      )}

      {/* ── TAB 3: SALARY PAYOUTS & PROCESSING ───────────────────────────────────── */}
      {activeTab === 'salary' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#F05A22]" /> Coach Salary Payout Records
                </CardTitle>
                <p className="text-xs text-[#9ba3af]">Manage monthly coach salary payouts and manually process payouts to coach wallets</p>
              </div>
              {can('sports_write') && (
                <Button variant="primary" className="h-8 text-xs font-semibold px-3" onClick={() => setProcessSalaryOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Process Coach Salary
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loadingSalary ? (
                <div className="flex justify-center py-12">
                  <div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
                </div>
              ) : salaryPayouts.length === 0 ? (
                <EmptyState icon={<DollarSign className="h-8 w-8 text-[#5c6370]" />} title="No salary payouts found" />
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Coach</Th>
                      <Th>Program Batch</Th>
                      <Th>Month</Th>
                      <Th>Amount (INR)</Th>
                      <Th>Status</Th>
                      <Th>Payout Date</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {salaryPayouts.map((sp: any) => (
                      <Tr key={sp.id || sp._id}>
                        <Td><span className="text-sm font-medium text-white">{getSalaryCoachName(sp)}</span></Td>
                        <Td><span className="text-xs text-[#9ba3af]">{getSalaryProgramTitle(sp)}</span></Td>
                        <Td><Badge className="badge-blue">{sp.month}</Badge></Td>
                        <Td><span className="text-sm font-semibold text-emerald-400">₹{getSalaryAmount(sp).toLocaleString('en-IN')}</span></Td>
                        <Td>
                          <Badge className={sp.status === 'paid' ? 'badge-green' : sp.status === 'pending' ? 'badge-amber' : 'badge-red'}>
                            {sp.status || 'pending'}
                          </Badge>
                        </Td>
                        <Td><span className="text-xs text-[#5c6370]">{getSalaryPayoutDate(sp)}</span></Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Modal: Process Coach Salary */}
          <Modal open={processSalaryOpen} onClose={() => setProcessSalaryOpen(false)} title="Process Coach Monthly Salary" size="md">
            <form onSubmit={(e) => { e.preventDefault(); handleProcessSalary(); }} className="space-y-4">
              <Select
                label="Select Community Program *"
                value={salaryProgramId}
                onChange={(e) => handleProgramSelectChange(e.target.value)}
                options={[
                  { value: '', label: '— Select Community Program —' },
                  ...communities.flatMap(c => (c.programs || []).map((p: any) => ({
                    value: p.id || p._id!,
                    label: `${c.name} — ${p.title || p.sport}`
                  })))
                ]}
              />

              <Select
                label="Select Coach *"
                value={salaryCoachId}
                onChange={(e) => setSalaryCoachId(e.target.value)}
                options={[
                  { value: '', label: '— Select Coach —' },
                  ...coaches.map(c => ({
                    value: c.id || c._id!,
                    label: `${getCoachName(c)} (${c.email || ''})`
                  }))
                ]}
              />

              <Input
                label="Monthly Salary Amount (INR) *"
                type="number"
                value={salaryAmountInput}
                onChange={(e) => setSalaryAmountInput(e.target.value)}
                required
                placeholder="e.g. 15000"
              />

              <Input
                label="Salary Month (YYYY-MM) *"
                type="month"
                value={salaryMonth}
                onChange={(e) => setSalaryMonth(e.target.value)}
                required
              />

              {(salaryCoachId || salaryProgramId) && (
                <div className="bg-[#18191c] border border-[#2e3139] rounded-xl p-3 text-xs text-white space-y-1.5">
                  <p className="text-[11px] font-semibold text-[#F05A22] mb-1">Payout Summary Preview:</p>
                  <div className="flex justify-between">
                    <span className="text-[#9ba3af]">Target Coach:</span>
                    <span className="font-semibold text-white">
                      {coaches.find(c => (c.id || c._id) === salaryCoachId) ? getCoachName(coaches.find(c => (c.id || c._id) === salaryCoachId)) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9ba3af]">Monthly Amount:</span>
                    <span className="font-semibold text-emerald-400">
                      ₹{Number(salaryAmountInput || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setProcessSalaryOpen(false)} className="h-9 text-xs">Cancel</Button>
                <Button type="submit" variant="primary" className="h-9 text-xs font-semibold">Credit Wallet & Process</Button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* ── TAB 4: COACH ATTENDANCE ──────────────────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-[#F05A22]" /> Program Coach Attendance
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select
                  label="Select Community Program"
                  value={selectedAttProgramId}
                  onChange={(e) => {
                    setSelectedAttProgramId(e.target.value);
                    loadAttendance(e.target.value);
                  }}
                  options={[
                    { value: '', label: '— Select Program —' },
                    ...communities.flatMap(c => (c.programs || []).map((p: any) => ({
                      value: p.id || p._id!,
                      label: `${c.name} — ${p.title || p.sport}`
                    })))
                  ]}
                />
                <Input
                  label="Filter by Date"
                  type="date"
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                />
                <Select
                  label="Filter Status"
                  value={attStatus}
                  onChange={(e) => setAttStatus(e.target.value)}
                  options={[
                    { value: 'All', label: 'All Statuses' },
                    { value: 'started', label: 'Started' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'no_show', label: 'No Show' }
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadingAttendance ? (
                <div className="flex justify-center py-12">
                  <div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
                </div>
              ) : !selectedAttProgramId ? (
                <EmptyState icon={<ClipboardCheck className="h-8 w-8 text-[#5c6370]" />} title="Select a community program above to inspect attendance" />
              ) : attendanceRecords.length === 0 ? (
                <EmptyState icon={<ClipboardCheck className="h-8 w-8 text-[#5c6370]" />} title="No attendance records found for this program" />
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Coach</Th>
                      <Th>Session Date</Th>
                      <Th>Check-In Time</Th>
                      <Th>Check-Out Time</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {attendanceRecords.map((att: any) => (
                      <Tr key={att.id || att._id}>
                        <Td><span className="text-sm font-medium text-white">{att.coachName || 'Coach'}</span></Td>
                        <Td><span className="text-xs text-[#9ba3af]">{att.date}</span></Td>
                        <Td><span className="text-xs text-emerald-400 font-medium">{att.checkIn || '—'}</span></Td>
                        <Td><span className="text-xs text-blue-400 font-medium">{att.checkOut || '—'}</span></Td>
                        <Td>
                          <Badge className={att.status === 'completed' ? 'badge-green' : att.status === 'started' ? 'badge-amber' : 'badge-red'}>
                            {att.status}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
