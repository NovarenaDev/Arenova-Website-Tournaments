import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2, Shield, Calendar, Clock, MapPin, Users, UserCheck,
  DollarSign, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Plus,
  Edit2, Trash2, ChevronRight, ChevronDown, ChevronUp, Search, Eye,
  Filter, Sparkles, AlertCircle, FileText, ArrowRight, ArrowUpRight,
  Scale, Undo2, Lock, Unlock, HelpCircle, Landmark, Check, X,
  MessageSquare, UserPlus, Layers, History, Award, Trophy
} from 'lucide-react';
import {
  getAdminCommunities, getAdminCommunityDetail, createCommunity,
  updateCommunity, updateCommunityStatus, addCommunityProgram,
  updateCommunityProgram, assignCoachToProgram, getProgramCoachesHistory,
  updateProgramCoachSalary, removeCoachFromProgram, assignCommunityAdmin,
  getProgramAttendance, reviewCommunityAttendance, getCommunityComplaints,
  resolveCommunityComplaint, cancelCommunityProgram, getProgramCancellation,
  retryProgramCancellation, getCommunityRefunds, reconcileCommunityRefund,
  approveCommunityRefund, processCoachSalary, getSalaryPayouts,
  getProgramSubscriptions, getCommunityLedger, getAdminCommunity,
  removeCommunityPost, getAdminCoaches, getAdminSports, getAdmins,
  getCustomers, subscribePlayerToProgram, extractDataList
} from '../../api';
import {
  Community, CommunityProgram, CommunityPlan, CommunityStatus,
  CoachSalaryHistory, CommunityAttendanceRecord, CommunityComplaint,
  CommunityLedgerEntry, Coach, AdminUser, Customer
} from '../../types';
import {
  Card, CardHeader, CardTitle, CardContent, Badge, Button,
  StatCard, Table, Thead, Tbody, Th, Td, Tr, EmptyState, Modal, ConfirmDialog
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';

// Constants
const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const CITIES = ['All', 'Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Delhi NCR', 'Pune', 'Kolkata'];
const STATUS_OPTIONS: CommunityStatus[] = ['active', 'inactive', 'draft', 'archived'];

const SCOPED_PERMISSIONS = [
  { id: 'programs', label: 'Programs & Schedules', desc: 'Create and edit sports batches' },
  { id: 'assignments', label: 'Coach Assignments', desc: 'Assign/remove coaching staff' },
  { id: 'salary', label: 'Salary Contracts', desc: 'Manage contracted monthly amounts' },
  { id: 'attendance', label: 'Attendance Review', desc: 'Review GPS check-in exceptions' },
  { id: 'complaints', label: 'Complaint Resolution', desc: 'Resolve player/parent session issues' },
  { id: 'refunds', label: 'Refunds & Cancellations', desc: 'Trigger pro-rata refund workflows' },
  { id: 'subscriptions', label: 'Subscriptions', desc: 'Inspect enrolled player contracts' },
  { id: 'reports', label: 'Ledger & Reports', desc: 'Read academy financial ledger' },
];

export default function CommunityPage() {
  const { admin, can } = useAuth();
  const isSuperAdmin = admin?.role === 'super_admin';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'academies' | 'attendance' | 'complaints' | 'payroll' | 'ledger' | 'feed'>('academies');

  // Shared master data
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Filters for Academies
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCommunityIds, setExpandedCommunityIds] = useState<Record<string, boolean>>({});

  // ── Modal States ─────────────────────────────────────────────────────────────
  // 1. Academy Modal (Create / Edit)
  const [academyModalOpen, setAcademyModalOpen] = useState(false);
  const [editingAcademy, setEditingAcademy] = useState<Community | null>(null);
  const [savingAcademy, setSavingAcademy] = useState(false);
  const [academyForm, setAcademyForm] = useState({
    name: '',
    description: '',
    city: 'Hyderabad',
    address: '',
    latitude: 17.4375,
    longitude: 78.4483,
    attendanceRadius: 100,
    timeZone: 'Asia/Kolkata',
    attendanceEarlyMinutes: 15,
    attendanceGraceMinutes: 30,
    attendanceEndEarlyMinutes: 15
  });

  // 2. Program Modal (Create / Edit)
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [targetCommunity, setTargetCommunity] = useState<Community | null>(null);
  const [editingProgram, setEditingProgram] = useState<CommunityProgram | null>(null);
  const [savingProgram, setSavingProgram] = useState(false);
  const [programForm, setProgramForm] = useState<{
    sport: string;
    title: string;
    startDate: string;
    endDate: string;
    sessionDays: string[];
    sessionStartTime: string;
    sessionEndTime: string;
    capacity: number;
    plans: CommunityPlan[];
  }>({
    sport: '',
    title: '',
    startDate: '',
    endDate: '',
    sessionDays: ['MON', 'WED', 'FRI'],
    sessionStartTime: '10:00',
    sessionEndTime: '11:00',
    capacity: 20,
    plans: [
      { duration: 1, unit: 'week', price: 700, label: 'Weekly', isActive: true },
      { duration: 1, unit: 'month', price: 2000, label: 'Monthly', isActive: true },
      { duration: 3, unit: 'month', price: 5000, label: 'Quarterly', isActive: true }
    ]
  });

  // 3. Coach Assignment & Salary Contract Modal
  const [coachModalOpen, setCoachModalOpen] = useState(false);
  const [targetProgram, setTargetProgram] = useState<CommunityProgram | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [contractSalary, setContractSalary] = useState<number>(20000);
  const [savingCoachAssignment, setSavingCoachAssignment] = useState(false);
  const [salaryHistory, setSalaryHistory] = useState<CoachSalaryHistory[]>([]);
  const [loadingSalaryHistory, setLoadingSalaryHistory] = useState(false);

  // 4. Scoped Staff Admin Access Modal
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffTargetCommunity, setStaffTargetCommunity] = useState<Community | null>(null);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [assignedPermissions, setAssignedPermissions] = useState<string[]>([
    'programs', 'assignments', 'attendance', 'subscriptions'
  ]);
  const [staffActive, setStaffActive] = useState(true);
  const [savingStaff, setSavingStaff] = useState(false);

  // 5. Program Cancellation & Refunds Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetProgram, setCancelTargetProgram] = useState<CommunityProgram | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingProgram, setCancellingProgram] = useState(false);
  const [cancellationProgress, setCancellationProgress] = useState<any>(null);
  const [loadingCancellationProgress, setLoadingCancellationProgress] = useState(false);

  // 6. Program Subscriptions Drawer
  const [subscriptionsModalOpen, setSubscriptionsModalOpen] = useState(false);
  const [subscriptionsProgram, setSubscriptionsProgram] = useState<CommunityProgram | null>(null);
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

  // ── Tab 2: Attendance Review State ───────────────────────────────────────────
  const [selectedAttProgramId, setSelectedAttProgramId] = useState('');
  const [attDate, setAttDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attRecords, setAttRecords] = useState<CommunityAttendanceRecord[]>([]);
  const [loadingAtt, setLoadingAtt] = useState(false);
  const [reviewingAttRecord, setReviewingAttRecord] = useState<CommunityAttendanceRecord | null>(null);
  const [reviewAction, setReviewAction] = useState<'ACKNOWLEDGED' | 'EXCUSED' | 'NEEDS_FOLLOW_UP'>('ACKNOWLEDGED');
  const [reviewReason, setReviewReason] = useState('');
  const [savingAttReview, setSavingAttReview] = useState(false);

  // ── Tab 3: Complaints Queue State ────────────────────────────────────────────
  const [complaints, setComplaints] = useState<CommunityComplaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [complaintFilterStatus, setComplaintFilterStatus] = useState<string>('OPEN');
  const [complaintProgramId, setComplaintProgramId] = useState<string>('');
  const [resolvingComplaint, setResolvingComplaint] = useState<CommunityComplaint | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'RESOLVED' | 'MANUAL_REVIEW'>('RESOLVED');
  const [resolutionReason, setResolutionReason] = useState('');
  const [savingComplaintResolution, setSavingComplaintResolution] = useState(false);

  // ── Tab 4: Monthly Payroll & Coach Salary State ──────────────────────────────
  const [payrollMonth, setPayrollMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [payrollCommunityId, setPayrollCommunityId] = useState('');
  const [salaryPayouts, setSalaryPayouts] = useState<any[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [payrollModalOpen, setPayrollModalOpen] = useState(false);
  const [payrollCoachId, setPayrollCoachId] = useState('');
  const [payrollProgramId, setPayrollProgramId] = useState('');
  const [isExceptionApproval, setIsExceptionApproval] = useState(false);
  const [exceptionAmountInr, setExceptionAmountInr] = useState<number>(0);
  const [exceptionReference, setExceptionReference] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');
  const [processingPayroll, setProcessingPayroll] = useState(false);

  // ── Tab 5: Community Financial Ledger State ──────────────────────────────────
  const [ledgerCommunityId, setLedgerCommunityId] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState<CommunityLedgerEntry[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [refundsQueue, setRefundsQueue] = useState<any[]>([]);
  const [loadingRefundsQueue, setLoadingRefundsQueue] = useState(false);
  const [reconcilingRefundId, setReconcilingRefundId] = useState<string | null>(null);

  // ── Tab 6: Feed Moderation State ─────────────────────────────────────────────
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [postToRemove, setPostToRemove] = useState<any | null>(null);

  // ── 1. Fetch Communities & Master Data ───────────────────────────────────────
  const fetchCommunities = useCallback(async () => {
    try {
      setLoadingCommunities(true);
      const params: Record<string, string> = {};
      if (selectedCity !== 'All') params.city = selectedCity;
      if (selectedStatus !== 'All') params.status = selectedStatus;

      const res = await getAdminCommunities(params);
      const list = extractDataList<Community>(res);

      // Fetch detail for each community to ensure programs and subscriber counts are loaded
      const detailed = await Promise.all(
        list.map(async (comm) => {
          const id = comm.id || comm._id;
          if (!id) return comm;
          try {
            const dRes = await getAdminCommunityDetail(id);
            const d = dRes?.data || dRes;
            return { ...comm, ...d };
          } catch {
            return comm;
          }
        })
      );
      setCommunities(detailed);
    } catch (err: any) {
      console.warn('Failed to load communities:', err);
      setCommunities([]);
    } finally {
      setLoadingCommunities(false);
    }
  }, [selectedCity, selectedStatus]);

  const fetchAuxMasterData = useCallback(async () => {
    try {
      const [coachesRes, sportsRes, adminsRes, customersRes] = await Promise.allSettled([
        getAdminCoaches(),
        getAdminSports(),
        getAdmins(),
        getCustomers({ limit: 100 })
      ]);

      if (coachesRes.status === 'fulfilled') setCoaches(extractDataList(coachesRes.value));
      if (sportsRes.status === 'fulfilled') setSports(extractDataList(sportsRes.value));
      if (adminsRes.status === 'fulfilled') setAdminsList(extractDataList(adminsRes.value));
      if (customersRes.status === 'fulfilled') setCustomers(extractDataList(customersRes.value));
    } catch (err) {
      console.warn('Aux master data error:', err);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
    fetchAuxMasterData();
  }, [fetchCommunities, fetchAuxMasterData]);

  // Expand first community by default on initial load
  useEffect(() => {
    if (communities.length > 0 && Object.keys(expandedCommunityIds).length === 0) {
      const firstId = communities[0].id || communities[0]._id;
      if (firstId) setExpandedCommunityIds({ [firstId]: true });
    }
  }, [communities]);

  // ── Tab 2: Fetch Attendance ──────────────────────────────────────────────────
  const fetchAttendance = useCallback(async (programId: string, date: string) => {
    if (!programId) {
      setAttRecords([]);
      return;
    }
    try {
      setLoadingAtt(true);
      const res = await getProgramAttendance(programId, { date });
      setAttRecords(extractDataList<CommunityAttendanceRecord>(res));
    } catch (err) {
      console.warn('Failed to fetch attendance:', err);
      setAttRecords([]);
    } finally {
      setLoadingAtt(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance' && selectedAttProgramId) {
      fetchAttendance(selectedAttProgramId, attDate);
    }
  }, [activeTab, selectedAttProgramId, attDate, fetchAttendance]);

  // ── Tab 3: Fetch Complaints ──────────────────────────────────────────────────
  const fetchComplaints = useCallback(async () => {
    try {
      setLoadingComplaints(true);
      const params: Record<string, string> = {};
      if (complaintFilterStatus) params.status = complaintFilterStatus;
      if (complaintProgramId) params.programId = complaintProgramId;
      const res = await getCommunityComplaints(params);
      setComplaints(extractDataList<CommunityComplaint>(res));
    } catch (err) {
      console.warn('Failed to load complaints:', err);
      setComplaints([]);
    } finally {
      setLoadingComplaints(false);
    }
  }, [complaintFilterStatus, complaintProgramId]);

  useEffect(() => {
    if (activeTab === 'complaints') fetchComplaints();
  }, [activeTab, fetchComplaints]);

  // ── Tab 4: Fetch Payroll ─────────────────────────────────────────────────────
  const fetchPayroll = useCallback(async () => {
    try {
      setLoadingPayroll(true);
      const params: Record<string, string> = { month: payrollMonth };
      if (payrollCommunityId) params.communityId = payrollCommunityId;
      const res = await getSalaryPayouts(params);
      setSalaryPayouts(extractDataList(res));
    } catch (err) {
      console.warn('Failed to load salary payouts:', err);
      setSalaryPayouts([]);
    } finally {
      setLoadingPayroll(false);
    }
  }, [payrollMonth, payrollCommunityId]);

  useEffect(() => {
    if (activeTab === 'payroll') fetchPayroll();
  }, [activeTab, fetchPayroll]);

  // ── Tab 5: Fetch Ledger & Community Refunds ──────────────────────────────────
  const fetchLedger = useCallback(async (communityId: string) => {
    if (!communityId) {
      setLedgerEntries([]);
      return;
    }
    try {
      setLoadingLedger(true);
      const res = await getCommunityLedger(communityId);
      setLedgerEntries(extractDataList<CommunityLedgerEntry>(res));
    } catch (err) {
      console.warn('Failed to load community ledger:', err);
      setLedgerEntries([]);
    } finally {
      setLoadingLedger(false);
    }
  }, []);

  const fetchSubscriptionRefunds = useCallback(async () => {
    try {
      setLoadingRefundsQueue(true);
      const res = await getCommunityRefunds();
      setRefundsQueue(extractDataList(res));
    } catch (err) {
      console.warn('Failed to load subscription refunds:', err);
      setRefundsQueue([]);
    } finally {
      setLoadingRefundsQueue(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'ledger') {
      if (ledgerCommunityId) fetchLedger(ledgerCommunityId);
      fetchSubscriptionRefunds();
    }
  }, [activeTab, ledgerCommunityId, fetchLedger, fetchSubscriptionRefunds]);

  // ── Tab 6: Feed Moderation ───────────────────────────────────────────────────
  const fetchFeed = useCallback(async () => {
    try {
      setLoadingFeed(true);
      const res = await getAdminCommunity();
      setFeedPosts(extractDataList(res));
    } catch (err) {
      setFeedPosts([]);
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'feed') fetchFeed();
  }, [activeTab, fetchFeed]);

  // ── Academy CRUD Handlers ────────────────────────────────────────────────────
  const openCreateAcademy = () => {
    setEditingAcademy(null);
    setAcademyForm({
      name: '',
      description: '',
      city: 'Hyderabad',
      address: '',
      latitude: 17.4375,
      longitude: 78.4483,
      attendanceRadius: 100,
      timeZone: 'Asia/Kolkata',
      attendanceEarlyMinutes: 15,
      attendanceGraceMinutes: 30,
      attendanceEndEarlyMinutes: 15
    });
    setAcademyModalOpen(true);
  };

  const openEditAcademy = (comm: Community) => {
    setEditingAcademy(comm);
    setAcademyForm({
      name: comm.name || '',
      description: comm.description || '',
      city: comm.city || 'Hyderabad',
      address: comm.address || '',
      latitude: Number(comm.latitude) || 17.4375,
      longitude: Number(comm.longitude) || 78.4483,
      attendanceRadius: Number(comm.attendanceRadius) || 100,
      timeZone: comm.timeZone || 'Asia/Kolkata',
      attendanceEarlyMinutes: Number(comm.attendanceEarlyMinutes) || 15,
      attendanceGraceMinutes: Number(comm.attendanceGraceMinutes) || 30,
      attendanceEndEarlyMinutes: Number(comm.attendanceEndEarlyMinutes) || 15
    });
    setAcademyModalOpen(true);
  };

  const handleSaveAcademy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingAcademy(true);
      const payload = {
        name: academyForm.name.trim(),
        description: academyForm.description.trim(),
        city: academyForm.city.trim(),
        address: academyForm.address.trim(),
        latitude: Number(academyForm.latitude),
        longitude: Number(academyForm.longitude),
        attendanceRadius: Number(academyForm.attendanceRadius),
        timeZone: academyForm.timeZone.trim() || 'Asia/Kolkata',
        attendanceEarlyMinutes: Number(academyForm.attendanceEarlyMinutes),
        attendanceGraceMinutes: Number(academyForm.attendanceGraceMinutes),
        attendanceEndEarlyMinutes: Number(academyForm.attendanceEndEarlyMinutes)
      };

      if (editingAcademy) {
        const id = editingAcademy.id || editingAcademy._id;
        await updateCommunity(id!, payload);
      } else {
        await createCommunity(payload);
      }

      setAcademyModalOpen(false);
      fetchCommunities();
    } catch (err: any) {
      alert(err.message || 'Failed to save academy');
    } finally {
      setSavingAcademy(false);
    }
  };

  const handleUpdateStatus = async (comm: Community, newStatus: CommunityStatus) => {
    const id = comm.id || comm._id;
    if (!id) return;
    if (newStatus === 'inactive' || newStatus === 'archived') {
      if (!confirm(`Warning: Deactivation is blocked if there are active subscriptions or open attendance records. Are you sure you want to set status to "${newStatus}"?`)) {
        return;
      }
    }
    try {
      await updateCommunityStatus(id, newStatus);
      fetchCommunities();
    } catch (err: any) {
      alert(err.message || `Failed to update status to ${newStatus}`);
    }
  };

  // ── Program CRUD Handlers ────────────────────────────────────────────────────
  const openCreateProgram = (comm: Community) => {
    setTargetCommunity(comm);
    setEditingProgram(null);
    const today = new Date();
    const nextQuarter = new Date();
    nextQuarter.setMonth(today.getMonth() + 4);

    setProgramForm({
      sport: sports[0]?.name || 'Badminton',
      title: 'Morning Badminton Batch',
      startDate: today.toISOString().split('T')[0],
      endDate: nextQuarter.toISOString().split('T')[0],
      sessionDays: ['MON', 'WED', 'FRI'],
      sessionStartTime: '10:00',
      sessionEndTime: '11:00',
      capacity: 20,
      plans: [
        { duration: 1, unit: 'week', price: 700, label: 'Weekly', isActive: true },
        { duration: 1, unit: 'month', price: 2000, label: 'Monthly', isActive: true },
        { duration: 3, unit: 'month', price: 5000, label: 'Quarterly', isActive: true }
      ]
    });
    setProgramModalOpen(true);
  };

  const openEditProgram = (comm: Community, prog: CommunityProgram) => {
    setTargetCommunity(comm);
    setEditingProgram(prog);
    setProgramForm({
      sport: prog.sport || '',
      title: prog.title || '',
      startDate: prog.startDate ? prog.startDate.split('T')[0] : '',
      endDate: prog.endDate ? prog.endDate.split('T')[0] : '',
      sessionDays: prog.sessionDays || ['MON', 'WED', 'FRI'],
      sessionStartTime: prog.sessionStartTime || '10:00',
      sessionEndTime: prog.sessionEndTime || '11:00',
      capacity: Number(prog.capacity) || 20,
      plans: prog.plans && prog.plans.length > 0 ? prog.plans : [
        { duration: 1, unit: 'week', price: 700, label: 'Weekly', isActive: true },
        { duration: 1, unit: 'month', price: 2000, label: 'Monthly', isActive: true }
      ]
    });
    setProgramModalOpen(true);
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCommunity) return;
    const commId = targetCommunity.id || targetCommunity._id;
    if (!commId) return;

    try {
      setSavingProgram(true);
      const payload = {
        sport: programForm.sport.trim(),
        title: programForm.title.trim(),
        startDate: programForm.startDate,
        endDate: programForm.endDate,
        sessionDays: programForm.sessionDays,
        sessionStartTime: programForm.sessionStartTime,
        sessionEndTime: programForm.sessionEndTime,
        capacity: Number(programForm.capacity),
        plans: programForm.plans.map(p => ({
          ...(p._id ? { _id: p._id } : {}),
          duration: Number(p.duration) || 1,
          unit: p.unit || 'month',
          price: Number(p.price) || 0,
          label: p.label || `${p.duration} ${p.unit}`,
          isActive: p.isActive ?? true
        }))
      };

      if (editingProgram) {
        const progId = editingProgram.id || editingProgram._id;
        await updateCommunityProgram(commId, progId!, payload);
      } else {
        await addCommunityProgram(commId, payload);
      }

      setProgramModalOpen(false);
      fetchCommunities();
    } catch (err: any) {
      alert(err.message || 'Failed to save community program');
    } finally {
      setSavingProgram(false);
    }
  };

  // ── Coach Assignment & Salary Handlers ───────────────────────────────────────
  const openCoachAssignment = async (comm: Community, prog: CommunityProgram) => {
    setTargetCommunity(comm);
    setTargetProgram(prog);
    const existingCoachId = prog.coachId || (prog.coach && (prog.coach.id || prog.coach._id)) || '';
    setSelectedCoachId(existingCoachId);
    setContractSalary(prog.salary || 20000);
    setCoachModalOpen(true);

    const progId = prog.id || prog._id;
    if (progId) {
      try {
        setLoadingSalaryHistory(true);
        const res = await getProgramCoachesHistory(progId);
        setSalaryHistory(extractDataList<CoachSalaryHistory>(res));
      } catch (err) {
        setSalaryHistory([]);
      } finally {
        setLoadingSalaryHistory(false);
      }
    }
  };

  const handleSaveCoachAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProgram || !selectedCoachId) return;
    const progId = targetProgram.id || targetProgram._id;
    if (!progId) return;

    try {
      setSavingCoachAssignment(true);
      const currentCoachId = targetProgram.coachId || (targetProgram.coach && (targetProgram.coach.id || targetProgram.coach._id));

      if (currentCoachId && currentCoachId === selectedCoachId) {
        // Prospective salary update
        await updateProgramCoachSalary(progId, selectedCoachId, Number(contractSalary));
      } else {
        // Fresh assignment
        await assignCoachToProgram(progId, selectedCoachId, Number(contractSalary));
      }

      setCoachModalOpen(false);
      fetchCommunities();
    } catch (err: any) {
      alert(err.message || 'Failed to update coach contract');
    } finally {
      setSavingCoachAssignment(false);
    }
  };

  const handleEndCoachAssignment = async () => {
    if (!targetProgram || !selectedCoachId) return;
    const progId = targetProgram.id || targetProgram._id;
    if (!progId) return;
    if (!confirm('Are you sure you want to end this coach assignment? Historical attendance and salary records will be safely preserved.')) {
      return;
    }

    try {
      setSavingCoachAssignment(true);
      await removeCoachFromProgram(progId, selectedCoachId);
      setCoachModalOpen(false);
      fetchCommunities();
    } catch (err: any) {
      alert(err.message || 'Failed to end coach assignment');
    } finally {
      setSavingCoachAssignment(false);
    }
  };

  // ── Scoped Staff Admin Access Handlers ───────────────────────────────────────
  const openStaffModal = (comm: Community) => {
    setStaffTargetCommunity(comm);
    setSelectedAdminId(adminsList[0]?._id || adminsList[0]?.id || '');
    setAssignedPermissions(['programs', 'assignments', 'attendance', 'subscriptions']);
    setStaffActive(true);
    setStaffModalOpen(true);
  };

  const handleSaveStaffGrants = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffTargetCommunity || !selectedAdminId) return;
    const commId = staffTargetCommunity.id || staffTargetCommunity._id;
    if (!commId) return;

    try {
      setSavingStaff(true);
      await assignCommunityAdmin(commId, {
        adminId: selectedAdminId,
        permissions: assignedPermissions,
        active: staffActive
      });
      alert('Community administrator scoped permissions saved successfully');
      setStaffModalOpen(false);
      fetchCommunities();
    } catch (err: any) {
      alert(err.message || 'Failed to assign community permissions');
    } finally {
      setSavingStaff(false);
    }
  };

  // ── Program Cancellation & Pro-Rata Refunds Handlers ─────────────────────────
  const openCancelProgramModal = async (comm: Community, prog: CommunityProgram) => {
    setTargetCommunity(comm);
    setCancelTargetProgram(prog);
    setCancelReason('Facility structural maintenance; remaining sessions cancelled');
    setCancellationProgress(null);
    setCancelModalOpen(true);

    const progId = prog.id || prog._id;
    if (progId) {
      try {
        setLoadingCancellationProgress(true);
        const res = await getProgramCancellation(progId);
        setCancellationProgress(res?.data || res);
      } catch {
        setCancellationProgress(null);
      } finally {
        setLoadingCancellationProgress(false);
      }
    }
  };

  const handleExecuteCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTargetProgram) return;
    const progId = cancelTargetProgram.id || cancelTargetProgram._id;
    if (!progId) return;

    if (!confirm('WARNING: Cancelling this program will freeze future activation and queue deterministic, pro-rata subscriber refunds. Are you sure you want to proceed?')) {
      return;
    }

    try {
      setCancellingProgram(true);
      const res = await cancelCommunityProgram(progId, cancelReason.trim());
      alert(res?.message || 'Program cancellation initiated. Pro-rata refund batch queued.');
      const progressRes = await getProgramCancellation(progId);
      setCancellationProgress(progressRes?.data || progressRes);
      fetchCommunities();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel program');
    } finally {
      setCancellingProgram(false);
    }
  };

  const handleRetryCancellation = async () => {
    if (!cancelTargetProgram) return;
    const progId = cancelTargetProgram.id || cancelTargetProgram._id;
    if (!progId) return;

    try {
      setCancellingProgram(true);
      const res = await retryProgramCancellation(progId, cancelReason.trim() || 'Retry subscriber refund allocation batch');
      alert(res?.message || 'Cancellation allocation retried successfully');
      const progressRes = await getProgramCancellation(progId);
      setCancellationProgress(progressRes?.data || progressRes);
    } catch (err: any) {
      alert(err.message || 'Retry failed');
    } finally {
      setCancellingProgram(false);
    }
  };

  // ── Program Subscriptions Drawer Handlers ────────────────────────────────────
  const openSubscriptionsDrawer = async (prog: CommunityProgram) => {
    setSubscriptionsProgram(prog);
    setSubscriptionsList([]);
    setSubscriptionsModalOpen(true);

    const progId = prog.id || prog._id;
    if (progId) {
      try {
        setLoadingSubscriptions(true);
        const res = await getProgramSubscriptions(progId);
        setSubscriptionsList(extractDataList(res));
      } catch (err) {
        console.warn('Failed to load subscriptions:', err);
        setSubscriptionsList([]);
      } finally {
        setLoadingSubscriptions(false);
      }
    }
  };

  // ── Tab 2: Attendance Review Handlers ────────────────────────────────────────
  const handleOpenAttReview = (record: CommunityAttendanceRecord) => {
    setReviewingAttRecord(record);
    setReviewAction((record.reviewAction as any) || 'ACKNOWLEDGED');
    setReviewReason(record.reviewReason || '');
  };

  const handleSaveAttReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingAttRecord) return;
    const id = reviewingAttRecord.id || reviewingAttRecord._id;
    if (!id) return;

    try {
      setSavingAttReview(true);
      await reviewCommunityAttendance(id, {
        action: reviewAction,
        reason: reviewReason.trim()
      });
      setReviewingAttRecord(null);
      if (selectedAttProgramId) fetchAttendance(selectedAttProgramId, attDate);
    } catch (err: any) {
      alert(err.message || 'Failed to review attendance record');
    } finally {
      setSavingAttReview(false);
    }
  };

  // ── Tab 3: Complaint Resolution Handlers ─────────────────────────────────────
  const handleOpenResolveComplaint = (c: CommunityComplaint) => {
    setResolvingComplaint(c);
    setResolutionStatus((c.status as any) === 'RESOLVED' ? 'RESOLVED' : 'RESOLVED');
    setResolutionReason(c.resolutionReason || '');
  };

  const handleSaveComplaintResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingComplaint) return;
    const id = resolvingComplaint.id || resolvingComplaint._id;
    if (!id) return;

    try {
      setSavingComplaintResolution(true);
      await resolveCommunityComplaint(id, {
        status: resolutionStatus,
        reason: resolutionReason.trim()
      });
      setResolvingComplaint(null);
      fetchComplaints();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve complaint');
    } finally {
      setSavingComplaintResolution(false);
    }
  };

  // ── Tab 4: Process Monthly Salary Handlers ───────────────────────────────────
  const openProcessSalaryModal = (coachId?: string, programId?: string) => {
    setPayrollCoachId(coachId || coaches[0]?._id || coaches[0]?.id || '');
    setPayrollProgramId(programId || '');
    setIsExceptionApproval(false);
    setExceptionAmountInr(20000);
    setExceptionReference('');
    setExceptionReason('');
    setPayrollModalOpen(true);
  };

  const handleProcessMonthlySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payrollCoachId || !payrollProgramId || !payrollMonth) {
      alert('Please select coach, program and month');
      return;
    }

    try {
      setProcessingPayroll(true);
      if (isExceptionApproval) {
        if (!isSuperAdmin) {
          alert('Only Super Administrators can approve exception salary adjustments.');
          return;
        }
        if (!exceptionReference.trim() || !exceptionReason.trim()) {
          alert('Exception salary approval requires both an Approval Reference and an Audit Justification Reason.');
          return;
        }
        await processCoachSalary({
          coachId: payrollCoachId,
          programId: payrollProgramId,
          month: payrollMonth,
          approvedAmountPaise: Math.round(Number(exceptionAmountInr) * 100),
          approvalReference: exceptionReference.trim(),
          reason: exceptionReason.trim()
        });
      } else {
        await processCoachSalary({
          coachId: payrollCoachId,
          programId: payrollProgramId,
          month: payrollMonth
        });
      }

      alert('Monthly coach salary processed successfully');
      setPayrollModalOpen(false);
      fetchPayroll();
    } catch (err: any) {
      alert(err.message || 'Failed to process monthly coach salary');
    } finally {
      setProcessingPayroll(false);
    }
  };

  // ── Tab 5: Reconcile Refund Handlers ─────────────────────────────────────────
  const handleReconcileRefund = async (refundId: string) => {
    try {
      setReconcilingRefundId(refundId);
      await reconcileCommunityRefund(refundId);
      alert('Refund reconciliation query completed');
      fetchSubscriptionRefunds();
    } catch (err: any) {
      alert(err.message || 'Reconciliation failed');
    } finally {
      setReconcilingRefundId(null);
    }
  };

  const handleApproveRefund = async (refund: any) => {
    const id = refund.id || refund._id;
    if (!id) return;
    const refCode = prompt('Enter Bank/Policy Reference for re-approving refund:', 'POLICY-MANUAL-OBLIGATION');
    if (!refCode) return;
    const reason = prompt('Enter Audit Reason for re-approval:', 'Provider failure reviewed; retry original obligation');
    if (!reason) return;

    try {
      await approveCommunityRefund(id, reason, refCode);
      alert('Refund re-approved successfully');
      fetchSubscriptionRefunds();
    } catch (err: any) {
      alert(err.message || 'Refund approval failed');
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getCoachLabel = (coachId?: string) => {
    if (!coachId) return 'Unassigned';
    const c = coaches.find(item => (item.id || item._id) === coachId);
    if (!c) return 'Coach ' + coachId.slice(-4);
    return c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || 'Coach';
  };

  const allCommunityPrograms = useMemo(() => {
    return communities.flatMap(c => (c.programs || []).map(p => ({
      ...p,
      communityId: c.id || c._id,
      communityName: c.name
    })));
  }, [communities]);

  const filteredCommunities = useMemo(() => {
    return communities.filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesCity = c.city?.toLowerCase().includes(q);
        const matchesAddress = c.address?.toLowerCase().includes(q);
        const matchesProgram = (c.programs || []).some(p => p.title?.toLowerCase().includes(q) || p.sport?.toLowerCase().includes(q));
        if (!matchesName && !matchesCity && !matchesAddress && !matchesProgram) return false;
      }
      return true;
    });
  }, [communities, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & METRICS                                                 */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Coaching Academies & Communities
            </h1>
            <Badge className="bg-orange-50 text-[#F05A22] border-[#F05A22]/20 font-semibold text-xs">
              Scoped Admin Hub
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Super Admin & Academy Operations: Programs, Monthly Coach Salaries, Geofence Attendance & Pro-Rata Refunds
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-9 text-xs"
            onClick={() => {
              fetchCommunities();
              if (activeTab === 'attendance' && selectedAttProgramId) fetchAttendance(selectedAttProgramId, attDate);
              if (activeTab === 'complaints') fetchComplaints();
              if (activeTab === 'payroll') fetchPayroll();
              if (activeTab === 'ledger') { if (ledgerCommunityId) fetchLedger(ledgerCommunityId); fetchSubscriptionRefunds(); }
            }}
          >
            <RefreshCw className={clsx("h-3.5 w-3.5 mr-1.5", loadingCommunities && "animate-spin")} />
            Refresh
          </Button>

          {can('sports_write') && (
            <Button
              className="h-9 text-xs bg-[#F05A22] hover:bg-[#d94e1b] text-white font-semibold shadow-xs"
              onClick={openCreateAcademy}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Create Academy
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Building2 className="h-5 w-5 text-[#F05A22]" />}
          label="Active Academies"
          value={String(communities.filter(c => c.status === 'active').length)}
          sub={`${communities.length} total across ${new Set(communities.map(c => c.city)).size} cities`}
        />
        <StatCard
          icon={<Trophy className="h-5 w-5 text-blue-600" />}
          label="Total Programs"
          value={String(allCommunityPrograms.length)}
          sub={`${allCommunityPrograms.filter(p => p.status !== 'inactive').length} active schedules`}
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-emerald-600" />}
          label="Subscribers"
          value={String(communities.reduce((acc, c) => acc + (c.subscriberCount || 0), 0))}
          sub="Platform player enrollments"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-purple-600" />}
          label="Monthly Coach Contracts"
          value={`₹${allCommunityPrograms.reduce((acc, p) => acc + (Number(p.salary) || 0), 0).toLocaleString('en-IN')}`}
          sub="Platform-funded salaries"
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 2. NAVIGATION TABS                                                      */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto scrollbar-none">
        {[
          { key: 'academies', label: 'Academies & Programs', icon: Building2 },
          { key: 'attendance', label: 'Attendance & Geofencing', icon: CheckCircle2 },
          { key: 'complaints', label: 'Complaints Queue', icon: AlertTriangle },
          { key: 'payroll', label: 'Coach Monthly Payroll', icon: DollarSign },
          { key: 'ledger', label: 'Financial Ledger & Refunds', icon: Landmark },
          { key: 'feed', label: 'Community Feed', icon: MessageSquare }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key as any)}
              className={clsx(
                "cursor-pointer flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors",
                isActive
                  ? "border-[#F05A22] text-[#F05A22] bg-orange-50/40"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              )}
            >
              <Icon className={clsx("h-4 w-4", isActive ? "text-[#F05A22]" : "text-slate-400")} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: ACADEMIES & PROGRAMS                                             */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'academies' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <Card className="p-3 bg-white border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search academies, sports, programs, address..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input-field pl-9 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">City:</span>
                  <select
                    value={selectedCity}
                    onChange={e => setSelectedCity(e.target.value)}
                    className="select-field text-xs py-1.5 h-8 font-medium"
                  >
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">Status:</span>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="select-field text-xs py-1.5 h-8 font-medium"
                  >
                    <option value="All">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Communities Accordion List */}
          {loadingCommunities ? (
            <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl">
              <RefreshCw className="h-8 w-8 text-[#F05A22] animate-spin" />
            </div>
          ) : filteredCommunities.length === 0 ? (
            <EmptyState
              icon={<Building2 className="h-10 w-10 text-slate-300" />}
              title="No Coaching Academies Found"
              text="Create a coaching academy or adjust search/filters to view batches."
            />
          ) : (
            <div className="space-y-4">
              {filteredCommunities.map((comm) => {
                const commId = comm.id || comm._id || '';
                const isExpanded = !!expandedCommunityIds[commId];
                const commPrograms = comm.programs || [];

                return (
                  <Card key={commId} className="border border-slate-200 shadow-xs overflow-hidden transition-all">
                    {/* Academy Header Banner */}
                    <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => setExpandedCommunityIds(prev => ({ ...prev, [commId]: !prev[commId] }))}
                          className="mt-1 p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        >
                          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </button>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-bold text-slate-900">{comm.name}</h2>
                            <Badge className={clsx(
                              "text-[10px] font-bold uppercase tracking-wider",
                              comm.status === 'active' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                              comm.status === 'draft' && "bg-amber-50 text-amber-700 border-amber-200",
                              comm.status === 'inactive' && "bg-slate-100 text-slate-600 border-slate-200",
                              comm.status === 'archived' && "bg-rose-50 text-rose-700 border-rose-200"
                            )}>
                              {comm.status}
                            </Badge>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                              📍 {comm.city}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {comm.address || 'Address unlisted'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {comm.timeZone || 'Asia/Kolkata'}
                            </span>
                            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                              Radius: {comm.attendanceRadius || 100}m
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons for Academy */}
                      <div className="flex flex-wrap items-center gap-2 pl-9 lg:pl-0">
                        {/* Status Select Switcher */}
                        <select
                          value={comm.status}
                          onChange={(e) => handleUpdateStatus(comm, e.target.value as CommunityStatus)}
                          className="select-field text-xs py-1 h-8 font-semibold bg-white"
                        >
                          {STATUS_OPTIONS.map(st => (
                            <option key={st} value={st}>Status: {st}</option>
                          ))}
                        </select>

                        {can('sports_write') && (
                          <>
                            <Button
                              variant="outline"
                              className="h-8 text-xs px-2.5"
                              onClick={() => openEditAcademy(comm)}
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1 text-[#F05A22]" /> Edit
                            </Button>

                            <Button
                              variant="outline"
                              className="h-8 text-xs px-2.5"
                              onClick={() => openStaffModal(comm)}
                            >
                              <Shield className="h-3.5 w-3.5 mr-1 text-purple-600" /> Staff
                            </Button>

                            <Button
                              className="h-8 text-xs px-3 bg-[#F05A22] hover:bg-[#d94e1b] text-white font-semibold"
                              onClick={() => openCreateProgram(comm)}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" /> Add Program
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Programs List Inside Academy */}
                    {isExpanded && (
                      <div className="p-4 bg-white space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Active Sports Programs & Batches ({commPrograms.length})
                          </h3>
                        </div>

                        {commPrograms.length === 0 ? (
                          <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50">
                            <p className="text-xs text-slate-500">No programs created yet for this academy.</p>
                            {can('sports_write') && (
                              <Button
                                variant="outline"
                                className="mt-2 h-7 text-xs"
                                onClick={() => openCreateProgram(comm)}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Create Program Batch
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {commPrograms.map((prog) => {
                              const progId = prog.id || prog._id || '';
                              const coachName = getCoachLabel(prog.coachId || (prog.coach && (prog.coach.id || prog.coach._id)));
                              const isCancelled = prog.cancellation?.status === 'COMPLETED' || prog.status === 'cancelled';

                              return (
                                <div
                                  key={progId}
                                  className={clsx(
                                    "p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4",
                                    isCancelled ? "bg-rose-50/40 border-rose-200" : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                                  )}
                                >
                                  <div className="space-y-1.5 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="px-2 py-0.5 rounded-md bg-[#F05A22]/10 text-[#F05A22] text-xs font-bold">
                                        {prog.sport}
                                      </span>
                                      <h4 className="text-sm font-bold text-slate-900">{prog.title}</h4>
                                      {isCancelled && (
                                        <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px]">
                                          CANCELLED
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Days & Time */}
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        {(prog.sessionDays || []).join(', ') || 'Daily'}
                                      </span>
                                      <span className="flex items-center gap-1 font-mono">
                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                        {prog.sessionStartTime || '10:00'} – {prog.sessionEndTime || '11:00'}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5 text-slate-400" />
                                        Capacity: {prog.capacity || 20} players
                                      </span>
                                    </div>

                                    {/* Subscription Plans Available */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                      {(prog.plans || []).map((pl, idx) => (
                                        <span
                                          key={pl._id || idx}
                                          className={clsx(
                                            "text-[11px] px-2 py-0.5 rounded-lg border font-medium",
                                            pl.isActive
                                              ? "bg-white text-slate-800 border-slate-200 shadow-2xs"
                                              : "bg-slate-100 text-slate-400 border-slate-200 line-through"
                                          )}
                                        >
                                          {pl.label}: <strong className="text-emerald-600">₹{pl.price}</strong>
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Coach & Contract Salary Pill */}
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-left min-w-[170px]">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Coach</p>
                                      <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{coachName}</p>
                                      <p className="text-[11px] text-purple-700 font-semibold mt-0.5">
                                        ₹{(Number(prog.salary) || 20000).toLocaleString('en-IN')} / month
                                      </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <Button
                                        variant="outline"
                                        className="h-8 text-xs px-2.5"
                                        onClick={() => openSubscriptionsDrawer(prog)}
                                      >
                                        <Users className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                                        Subscribers
                                      </Button>

                                      {can('sports_write') && (
                                        <>
                                          <Button
                                            variant="outline"
                                            className="h-8 text-xs px-2.5"
                                            onClick={() => openCoachAssignment(comm, prog)}
                                          >
                                            <UserCheck className="h-3.5 w-3.5 mr-1 text-purple-600" />
                                            Coach Contract
                                          </Button>

                                          <Button
                                            variant="outline"
                                            className="h-8 text-xs px-2.5"
                                            onClick={() => openEditProgram(comm, prog)}
                                          >
                                            <Edit2 className="h-3.5 w-3.5 mr-1 text-blue-600" />
                                            Edit
                                          </Button>

                                          {!isCancelled && (
                                            <Button
                                              variant="danger"
                                              className="h-8 text-xs px-2.5"
                                              onClick={() => openCancelProgramModal(comm, prog)}
                                            >
                                              <Undo2 className="h-3.5 w-3.5 mr-1" />
                                              Cancel
                                            </Button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: ATTENDANCE & GEOFENCING REVIEW                                   */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <Card className="border border-slate-200">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Coach GPS Attendance & Geofence Evidence
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect coach check-in timestamps, GPS radius offsets, and resolve flagged sessions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedAttProgramId}
                onChange={e => setSelectedAttProgramId(e.target.value)}
                className="select-field text-xs py-1.5 h-9 font-medium max-w-xs"
              >
                <option value="">— Select Community Program Batch —</option>
                {allCommunityPrograms.map(p => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.communityName} · {p.title}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={attDate}
                onChange={e => setAttDate(e.target.value)}
                className="input-field text-xs py-1.5 h-9 font-mono"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {!selectedAttProgramId ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Select a community program batch above to load GPS attendance logs.
              </div>
            ) : loadingAtt ? (
              <div className="flex justify-center py-16">
                <RefreshCw className="h-6 w-6 text-[#F05A22] animate-spin" />
              </div>
            ) : attRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No coach attendance records logged for {attDate}.
              </div>
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Coach</Th>
                    <Th>Session Date</Th>
                    <Th>Check-In</Th>
                    <Th>Check-Out</Th>
                    <Th>Geofence Offset</Th>
                    <Th>Status</Th>
                    <Th>Review Action</Th>
                    <Th className="text-right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {attRecords.map((r) => {
                    const rId = r.id || r._id || '';
                    return (
                      <Tr key={rId}>
                        <Td className="font-bold text-slate-900">{r.coachName || getCoachLabel(r.coachId)}</Td>
                        <Td className="font-mono text-xs text-slate-600">{r.date}</Td>
                        <Td className="text-xs text-emerald-600 font-mono font-semibold">{r.checkIn || '—'}</Td>
                        <Td className="text-xs text-blue-600 font-mono font-semibold">{r.checkOut || '—'}</Td>
                        <Td>
                          <span className="text-xs font-mono text-slate-700">
                            {r.distanceMetres !== undefined ? `${r.distanceMetres}m` : 'Validated'}
                          </span>
                        </Td>
                        <Td>
                          <Badge className={clsx(
                            "text-[10px]",
                            r.status === 'completed' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                            r.status === 'started' && "bg-blue-50 text-blue-700 border-blue-200",
                            r.status === 'no_show' && "bg-rose-50 text-rose-700 border-rose-200",
                            r.status === 'flagged' && "bg-amber-50 text-amber-700 border-amber-200"
                          )}>
                            {r.status}
                          </Badge>
                        </Td>
                        <Td>
                          {r.reviewAction ? (
                            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                              {r.reviewAction}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </Td>
                        <Td className="text-right">
                          <Button
                            variant="outline"
                            className="h-7 text-xs px-2"
                            onClick={() => handleOpenAttReview(r)}
                          >
                            Review
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: COMMUNITY COMPLAINTS QUEUE                                       */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'complaints' && (
        <Card className="border border-slate-200">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Community Complaints & Dispute Resolution
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Player and parent feedback for community coaching batches. Non-financial administrative resolution.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={complaintFilterStatus}
                onChange={e => setComplaintFilterStatus(e.target.value)}
                className="select-field text-xs py-1.5 h-9 font-semibold"
              >
                <option value="OPEN">Status: OPEN</option>
                <option value="RESOLVED">Status: RESOLVED</option>
                <option value="MANUAL_REVIEW">Status: MANUAL_REVIEW</option>
                <option value="">Status: ALL</option>
              </select>

              <select
                value={complaintProgramId}
                onChange={e => setComplaintProgramId(e.target.value)}
                className="select-field text-xs py-1.5 h-9 font-medium max-w-xs"
              >
                <option value="">All Programs</option>
                {allCommunityPrograms.map(p => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.communityName} · {p.title}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loadingComplaints ? (
              <div className="flex justify-center py-16">
                <RefreshCw className="h-6 w-6 text-[#F05A22] animate-spin" />
              </div>
            ) : complaints.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No complaints found matching current filters.
              </div>
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Complaint / Player</Th>
                    <Th>Program Batch</Th>
                    <Th>Issue Summary</Th>
                    <Th>Submitted</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {complaints.map(c => {
                    const cId = c.id || c._id || '';
                    return (
                      <Tr key={cId}>
                        <Td>
                          <p className="font-bold text-slate-900 text-xs">{c.userName || 'Parent / Subscriber'}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{c.userEmail || c.userId}</p>
                        </Td>
                        <Td>
                          <span className="text-xs text-slate-700 font-medium">
                            {c.programTitle || 'Community Program'}
                          </span>
                        </Td>
                        <Td>
                          <p className="text-xs text-slate-800 line-clamp-2 max-w-md">
                            {c.issue || c.text || 'No text provided'}
                          </p>
                          {c.resolutionReason && (
                            <p className="text-[11px] text-emerald-700 mt-1 italic">
                              Resolved: {c.resolutionReason}
                            </p>
                          )}
                        </Td>
                        <Td className="text-xs text-slate-500 whitespace-nowrap">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '—'}
                        </Td>
                        <Td>
                          <Badge className={clsx(
                            "text-[10px]",
                            c.status === 'OPEN' && "bg-amber-50 text-amber-700 border-amber-200",
                            c.status === 'RESOLVED' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                            c.status === 'MANUAL_REVIEW' && "bg-purple-50 text-purple-700 border-purple-200"
                          )}>
                            {c.status}
                          </Badge>
                        </Td>
                        <Td className="text-right">
                          <Button
                            variant="outline"
                            className="h-7 text-xs px-2.5"
                            onClick={() => handleOpenResolveComplaint(c)}
                          >
                            Resolve
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: MONTHLY PAYROLL & COACH SALARY PROCESSING                        */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <Card className="border border-slate-200">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  Monthly Coach Payroll & Salary Processing
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Platform-funded fixed monthly coach salaries. Process standard payouts or approve Super Admin exception amounts.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="month"
                  value={payrollMonth}
                  onChange={e => setPayrollMonth(e.target.value)}
                  className="input-field text-xs py-1.5 h-9 font-semibold"
                />

                <Button
                  className="h-9 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs"
                  onClick={() => openProcessSalaryModal()}
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Process Month Payout
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingPayroll ? (
                <div className="flex justify-center py-16">
                  <RefreshCw className="h-6 w-6 text-[#F05A22] animate-spin" />
                </div>
              ) : salaryPayouts.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No salary payout records found for {payrollMonth}.
                </div>
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Coach</Th>
                      <Th>Program Batch</Th>
                      <Th>Month</Th>
                      <Th>Disbursed Amount</Th>
                      <Th>Reference Code</Th>
                      <Th>Status</Th>
                      <Th>Processed On</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {salaryPayouts.map((sp, idx) => {
                      const amount = sp.amountInr ?? sp.salary ?? (sp.approvedAmountPaise ? sp.approvedAmountPaise / 100 : sp.amount) ?? 0;
                      return (
                        <Tr key={sp.id || sp._id || idx}>
                          <Td className="font-bold text-slate-900">
                            {sp.coachName || getCoachLabel(sp.coachId)}
                          </Td>
                          <Td className="text-xs text-slate-700 font-medium">
                            {sp.programTitle || 'Program Batch'}
                          </Td>
                          <Td className="text-xs font-mono text-slate-600">{sp.month || payrollMonth}</Td>
                          <Td className="text-sm font-black text-emerald-600">
                            ₹{Number(amount).toLocaleString('en-IN')}
                          </Td>
                          <Td className="text-xs font-mono text-slate-500">
                            {sp.approvalReference || sp.reference || 'STANDARD-PAYOUT'}
                          </Td>
                          <Td>
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                              {sp.status || 'PAID'}
                            </Badge>
                          </Td>
                          <Td className="text-xs text-slate-500">
                            {sp.createdAt ? new Date(sp.createdAt).toLocaleDateString('en-IN') : '—'}
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: FINANCIAL LEDGER & REFUNDS QUEUE                                 */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          {/* Academy Financial Ledger */}
          <Card className="border border-slate-200">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-blue-600" />
                  Platform Community Ledger
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gross subscription revenues, platform-funded salary expenses, and refund liabilities.
                </p>
              </div>

              <select
                value={ledgerCommunityId}
                onChange={e => {
                  setLedgerCommunityId(e.target.value);
                  fetchLedger(e.target.value);
                }}
                className="select-field text-xs py-1.5 h-9 font-medium max-w-xs"
              >
                <option value="">— Select Academy to View Ledger —</option>
                {communities.map(c => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </CardHeader>

            <CardContent className="p-0">
              {!ledgerCommunityId ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Select an academy above to load its platform financial ledger.
                </div>
              ) : loadingLedger ? (
                <div className="flex justify-center py-16">
                  <RefreshCw className="h-6 w-6 text-[#F05A22] animate-spin" />
                </div>
              ) : ledgerEntries.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No ledger events recorded for this academy yet.
                </div>
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Event Type</Th>
                      <Th>Amount</Th>
                      <Th>Reference ID</Th>
                      <Th>Description</Th>
                      <Th>Recorded At</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {ledgerEntries.map((entry, idx) => (
                      <Tr key={entry.id || entry._id || idx}>
                        <Td>
                          <Badge className={clsx(
                            "text-[10px] font-bold",
                            entry.eventType === 'SUBSCRIPTION_PAYMENT' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                            entry.eventType === 'SALARY_EXPENSE' && "bg-purple-50 text-purple-700 border-purple-200",
                            entry.eventType.includes('REFUND') && "bg-rose-50 text-rose-700 border-rose-200"
                          )}>
                            {entry.eventType}
                          </Badge>
                        </Td>
                        <Td className={clsx(
                          "font-bold text-xs",
                          entry.eventType === 'SUBSCRIPTION_PAYMENT' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {entry.eventType === 'SUBSCRIPTION_PAYMENT' ? '+' : '-'}₹{entry.amount?.toLocaleString('en-IN')}
                        </Td>
                        <Td className="font-mono text-xs text-slate-500">{entry.referenceId || '—'}</Td>
                        <Td className="text-xs text-slate-700">{entry.description || '—'}</Td>
                        <Td className="text-xs text-slate-400 whitespace-nowrap">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-IN') : '—'}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Global Community Refunds Queue */}
          <Card className="border border-slate-200">
            <CardHeader className="border-b border-slate-200/80 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Undo2 className="h-4 w-4 text-rose-500" />
                Community Subscription Refunds Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingRefundsQueue ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-5 w-5 text-[#F05A22] animate-spin" />
                </div>
              ) : refundsQueue.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No pending subscription refunds.
                </div>
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Subscriber</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                      <Th>Reason</Th>
                      <Th className="text-right">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {refundsQueue.map((rf, idx) => {
                      const rfId = rf.id || rf._id || '';
                      return (
                        <Tr key={rfId || idx}>
                          <Td className="text-xs font-bold text-slate-900">{rf.userName || rf.userId}</Td>
                          <Td className="text-xs font-black text-rose-600">₹{rf.amount}</Td>
                          <Td>
                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                              {rf.status}
                            </Badge>
                          </Td>
                          <Td className="text-xs text-slate-600">{rf.reason || 'Pro-rata refund'}</Td>
                          <Td className="text-right space-x-1.5">
                            <Button
                              variant="outline"
                              className="h-7 text-xs px-2"
                              disabled={reconcilingRefundId === rfId}
                              onClick={() => handleReconcileRefund(rfId)}
                            >
                              Reconcile
                            </Button>
                            <Button
                              className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleApproveRefund(rf)}
                            >
                              Approve
                            </Button>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: FEED MODERATION                                                  */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'feed' && (
        <Card className="border border-slate-200">
          <CardHeader className="border-b border-slate-200/80 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Community Social Feed Moderation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingFeed ? (
              <div className="flex justify-center py-16">
                <RefreshCw className="h-6 w-6 text-[#F05A22] animate-spin" />
              </div>
            ) : feedPosts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No social feed posts currently found.
              </div>
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Author</Th>
                    <Th>Sport</Th>
                    <Th>Message</Th>
                    <Th>Likes</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {feedPosts.map((post) => {
                    const pId = post.id || post._id || '';
                    return (
                      <Tr key={pId}>
                        <Td className="text-xs font-bold text-slate-900">{post.authorName || 'User'}</Td>
                        <Td><Badge className="bg-slate-100 text-slate-700 text-[10px]">{post.sport || 'General'}</Badge></Td>
                        <Td className="text-xs text-slate-700 max-w-md truncate">{post.text}</Td>
                        <Td className="text-xs text-slate-600 font-mono">{post.likes || 0}</Td>
                        <Td>
                          <Badge className={post.status === 'flagged' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}>
                            {post.status || 'active'}
                          </Badge>
                        </Td>
                        <Td className="text-right">
                          <Button
                            variant="danger"
                            className="h-7 text-xs px-2"
                            onClick={() => setPostToRemove(post)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: CREATE / EDIT ACADEMY (COMMUNITY)                              */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={academyModalOpen}
        onClose={() => setAcademyModalOpen(false)}
        title={editingAcademy ? "Edit Coaching Academy" : "Create Coaching Academy"}
        size="lg"
      >
        <form onSubmit={handleSaveAcademy} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Academy Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={academyForm.name}
                onChange={e => setAcademyForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Hyderabad Sports Academy"
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={academyForm.city}
                onChange={e => setAcademyForm(f => ({ ...f, city: e.target.value }))}
                placeholder="e.g. Hyderabad"
                className="input-field text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Description</label>
            <textarea
              rows={2}
              value={academyForm.description}
              onChange={e => setAcademyForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Daily community coaching academy and facilities"
              className="input-field text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Physical Facility Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={academyForm.address}
              onChange={e => setAcademyForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Building 12, Ameerpet Main Road"
              className="input-field text-xs"
            />
          </div>

          {/* GPS Coordinates & Geofencing Parameters */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#F05A22]" />
              GPS Geofencing & Schedule Parameters
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={academyForm.latitude}
                  onChange={e => setAcademyForm(f => ({ ...f, latitude: parseFloat(e.target.value) || 0 }))}
                  className="input-field text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={academyForm.longitude}
                  onChange={e => setAcademyForm(f => ({ ...f, longitude: parseFloat(e.target.value) || 0 }))}
                  className="input-field text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Radius (Metres)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  required
                  value={academyForm.attendanceRadius}
                  onChange={e => setAcademyForm(f => ({ ...f, attendanceRadius: parseInt(e.target.value, 10) || 100 }))}
                  className="input-field text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Time Zone</label>
                <input
                  type="text"
                  required
                  value={academyForm.timeZone}
                  onChange={e => setAcademyForm(f => ({ ...f, timeZone: e.target.value }))}
                  className="input-field text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Early In (min)</label>
                <input
                  type="number"
                  min={0}
                  value={academyForm.attendanceEarlyMinutes}
                  onChange={e => setAcademyForm(f => ({ ...f, attendanceEarlyMinutes: parseInt(e.target.value, 10) || 15 }))}
                  className="input-field text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Grace In (min)</label>
                <input
                  type="number"
                  min={0}
                  value={academyForm.attendanceGraceMinutes}
                  onChange={e => setAcademyForm(f => ({ ...f, attendanceGraceMinutes: parseInt(e.target.value, 10) || 30 }))}
                  className="input-field text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Early Out (min)</label>
                <input
                  type="number"
                  min={0}
                  value={academyForm.attendanceEndEarlyMinutes}
                  onChange={e => setAcademyForm(f => ({ ...f, attendanceEndEarlyMinutes: parseInt(e.target.value, 10) || 15 }))}
                  className="input-field text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAcademyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={savingAcademy}
              className="bg-[#F05A22] hover:bg-[#d94e1b] text-white font-semibold"
            >
              {savingAcademy ? 'Saving...' : editingAcademy ? 'Update Academy' : 'Create Academy'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: CREATE / EDIT COMMUNITY PROGRAM                                */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={programModalOpen}
        onClose={() => setProgramModalOpen(false)}
        title={editingProgram ? "Edit Program Batch" : `Add Program to ${targetCommunity?.name || 'Academy'}`}
        size="lg"
      >
        <form onSubmit={handleSaveProgram} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Sport</label>
              <select
                value={programForm.sport}
                onChange={e => setProgramForm(f => ({ ...f, sport: e.target.value }))}
                className="select-field text-xs font-semibold"
                required
              >
                {sports.map(s => <option key={s.id || s._id} value={s.name}>{s.name}</option>)}
                <option value="Badminton">Badminton</option>
                <option value="Cricket">Cricket</option>
                <option value="Tennis">Tennis</option>
                <option value="Football">Football</option>
                <option value="Basketball">Basketball</option>
                <option value="Swimming">Swimming</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Batch Title</label>
              <input
                type="text"
                required
                value={programForm.title}
                onChange={e => setProgramForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Morning Badminton Batch"
                className="input-field text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={programForm.startDate}
                onChange={e => setProgramForm(f => ({ ...f, startDate: e.target.value }))}
                className="input-field text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">End Date</label>
              <input
                type="date"
                required
                value={programForm.endDate}
                onChange={e => setProgramForm(f => ({ ...f, endDate: e.target.value }))}
                className="input-field text-xs font-mono"
              />
            </div>
          </div>

          {/* Session Days of Week */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Weekly Session Days</label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OF_WEEK.map(d => {
                const selected = programForm.sessionDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setProgramForm(f => ({
                        ...f,
                        sessionDays: selected
                          ? f.sessionDays.filter(day => day !== d)
                          : [...f.sessionDays, d]
                      }));
                    }}
                    className={clsx(
                      "px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer",
                      selected
                        ? "bg-[#F05A22] text-white border-[#F05A22]"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={programForm.sessionStartTime}
                onChange={e => setProgramForm(f => ({ ...f, sessionStartTime: e.target.value }))}
                className="input-field text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">End Time</label>
              <input
                type="time"
                required
                value={programForm.sessionEndTime}
                onChange={e => setProgramForm(f => ({ ...f, sessionEndTime: e.target.value }))}
                className="input-field text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Max Capacity</label>
              <input
                type="number"
                min={1}
                required
                value={programForm.capacity}
                onChange={e => setProgramForm(f => ({ ...f, capacity: parseInt(e.target.value, 10) || 20 }))}
                className="input-field text-xs font-mono"
              />
            </div>
          </div>

          {/* Subscription Plans Builder */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900">
                Subscription Pricing Plans (Weekly / Monthly / Quarterly)
              </label>
              <button
                type="button"
                onClick={() => {
                  setProgramForm(f => ({
                    ...f,
                    plans: [...f.plans, { duration: 1, unit: 'month', price: 2000, label: 'Monthly', isActive: true }]
                  }));
                }}
                className="text-xs text-[#F05A22] font-bold hover:underline cursor-pointer"
              >
                + Add Plan
              </button>
            </div>

            <div className="space-y-2">
              {programForm.plans.map((pl, idx) => (
                <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Plan Label (e.g. Monthly)"
                    value={pl.label}
                    onChange={e => {
                      const updated = [...programForm.plans];
                      updated[idx].label = e.target.value;
                      setProgramForm(f => ({ ...f, plans: updated }));
                    }}
                    className="input-field text-xs py-1 flex-1 font-semibold"
                  />

                  <input
                    type="number"
                    min={1}
                    value={pl.duration}
                    onChange={e => {
                      const updated = [...programForm.plans];
                      updated[idx].duration = parseInt(e.target.value, 10) || 1;
                      setProgramForm(f => ({ ...f, plans: updated }));
                    }}
                    className="input-field text-xs py-1 w-16 font-mono"
                  />

                  <select
                    value={pl.unit}
                    onChange={e => {
                      const updated = [...programForm.plans];
                      updated[idx].unit = e.target.value as any;
                      setProgramForm(f => ({ ...f, plans: updated }));
                    }}
                    className="select-field text-xs py-1 w-24 font-medium"
                  >
                    <option value="week">week(s)</option>
                    <option value="month">month(s)</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={pl.price}
                      onChange={e => {
                        const updated = [...programForm.plans];
                        updated[idx].price = parseFloat(e.target.value) || 0;
                        setProgramForm(f => ({ ...f, plans: updated }));
                      }}
                      className="input-field text-xs py-1 w-24 font-mono font-bold text-emerald-600"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProgramForm(f => ({
                        ...f,
                        plans: f.plans.filter((_, i) => i !== idx)
                      }));
                    }}
                    className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setProgramModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={savingProgram}
              className="bg-[#F05A22] hover:bg-[#d94e1b] text-white font-semibold"
            >
              {savingProgram ? 'Saving...' : editingProgram ? 'Update Program' : 'Create Program'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: ASSIGN COACH & MONTHLY SALARY CONTRACT                         */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={coachModalOpen}
        onClose={() => setCoachModalOpen(false)}
        title={`Coach Contract: ${targetProgram?.title || 'Program Batch'}`}
        size="md"
      >
        <form onSubmit={handleSaveCoachAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Select KYC-Approved Coach <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={selectedCoachId}
              onChange={e => setSelectedCoachId(e.target.value)}
              className="select-field text-xs font-semibold"
            >
              <option value="">— Select Coach —</option>
              {coaches.map(c => {
                const id = c.id || c._id;
                const name = c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email;
                return (
                  <option key={id} value={id}>
                    {name} ({c.sport || 'General Coach'})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Monthly Platform-Funded Salary (INR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min={0}
                required
                value={contractSalary}
                onChange={e => setContractSalary(parseFloat(e.target.value) || 0)}
                placeholder="20000"
                className="input-field pl-7 text-sm font-bold font-mono text-purple-700"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Fixed monthly salary paid by platform revenue. Retained across assignment history.
            </p>
          </div>

          {/* Historical Assignment Records */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-slate-400" />
              Contract & Assignment History
            </h4>

            {loadingSalaryHistory ? (
              <div className="py-4 text-center text-xs text-slate-400">Loading history...</div>
            ) : salaryHistory.length === 0 ? (
              <div className="py-2 text-xs text-slate-400 italic">No previous contract revisions recorded.</div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {salaryHistory.map((h, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-50 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{h.coachName || getCoachLabel(h.coachId)}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {h.effectiveFrom ? new Date(h.effectiveFrom).toLocaleDateString('en-IN') : 'Start'}
                        {h.effectiveTo ? ` – ${new Date(h.effectiveTo).toLocaleDateString('en-IN')}` : ' – Present'}
                      </p>
                    </div>
                    <span className="font-bold text-purple-700">₹{h.salary?.toLocaleString('en-IN')}/mo</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            {targetProgram?.coachId && (
              <Button
                type="button"
                variant="danger"
                className="h-8 text-xs"
                onClick={handleEndCoachAssignment}
                disabled={savingCoachAssignment}
              >
                End Assignment
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => setCoachModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingCoachAssignment}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                {savingCoachAssignment ? 'Saving...' : 'Save Contract'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: SCOPED STAFF ADMIN ACCESS                                      */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        title={`Staff Permissions: ${staffTargetCommunity?.name || 'Academy'}`}
        size="md"
      >
        <form onSubmit={handleSaveStaffGrants} className="space-y-4">
          <p className="text-xs text-slate-500">
            Super Admin grants scoped access for this specific coaching academy only. Global roles remain unchanged.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Select Administrator
            </label>
            <select
              value={selectedAdminId}
              onChange={e => setSelectedAdminId(e.target.value)}
              className="select-field text-xs font-semibold"
              required
            >
              {adminsList.map(a => {
                const id = a.id || a._id;
                return (
                  <option key={id} value={id}>
                    {a.name || a.email} ({a.role})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Community Operational Grants
            </label>
            <div className="grid grid-cols-1 gap-2">
              {SCOPED_PERMISSIONS.map(p => {
                const isGranted = assignedPermissions.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={clsx(
                      "p-2.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors",
                      isGranted ? "bg-purple-50/50 border-purple-300" : "bg-white border-slate-200"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isGranted}
                      onChange={() => {
                        setAssignedPermissions(prev =>
                          isGranted ? prev.filter(x => x !== p.id) : [...prev, p.id]
                        );
                      }}
                      className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{p.label}</p>
                      <p className="text-[11px] text-slate-500">{p.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 pt-1 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={staffActive}
              onChange={e => setStaffActive(e.target.checked)}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="font-semibold">Grant active for this academy</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setStaffModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={savingStaff}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              {savingStaff ? 'Saving...' : 'Save Staff Grants'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 5: PROGRAM CANCELLATION & PRO-RATA REFUNDS                        */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={`Cancel Program: ${cancelTargetProgram?.title || 'Batch'}`}
        size="md"
      >
        <form onSubmit={handleExecuteCancellation} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-rose-900">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              Irreversible Program Cancellation Notice
            </p>
            <p className="text-rose-800 leading-relaxed">
              Cancelling a program freezes activation, calculates deterministic remaining pro-rata refunds for each active subscriber, and queues automated provider refunds.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Cancellation Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="e.g. Facility structural maintenance; remaining sessions cancelled"
              className="input-field text-xs"
            />
          </div>

          {/* Cancellation Progress Tracking */}
          {cancellationProgress && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Allocation Batch Status:</span>
                <Badge className={clsx(
                  "text-[10px]",
                  cancellationProgress.status === 'COMPLETED' && "bg-emerald-50 text-emerald-700",
                  cancellationProgress.status === 'PROCESSING' && "bg-blue-50 text-blue-700",
                  cancellationProgress.status === 'REVIEW_REQUIRED' && "bg-amber-50 text-amber-700"
                )}>
                  {cancellationProgress.status || 'PENDING'}
                </Badge>
              </div>
              <p className="text-slate-500 text-[11px]">
                Allocated refunds: {cancellationProgress.allocatedCount || 0} subscribers
              </p>
              {cancellationProgress.status === 'REVIEW_REQUIRED' && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-1 h-7 text-xs text-rose-600 border-rose-200"
                  onClick={handleRetryCancellation}
                  disabled={cancellingProgram}
                >
                  Retry Failed Allocation
                </Button>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCancelModalOpen(false)}>
              Close
            </Button>
            <Button
              type="submit"
              disabled={cancellingProgram}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {cancellingProgram ? 'Processing...' : 'Execute Cancellation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 6: PROGRAM SUBSCRIBERS DRAWER                                     */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={subscriptionsModalOpen}
        onClose={() => setSubscriptionsModalOpen(false)}
        title={`Subscribers: ${subscriptionsProgram?.title || 'Program Batch'}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Active player subscriptions, contract validity and enrollment details.
          </p>

          {loadingSubscriptions ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-6 w-6 text-[#F05A22] animate-spin" />
            </div>
          ) : subscriptionsList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No players enrolled in this program batch yet.
            </div>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Subscriber Name</Th>
                  <Th>Plan</Th>
                  <Th>Validity</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {subscriptionsList.map((sub, idx) => (
                  <Tr key={sub.id || sub._id || idx}>
                    <Td>
                      <p className="font-bold text-slate-900 text-xs">{sub.userName || sub.playerName || 'Subscriber'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{sub.userEmail || sub.userPhone || sub.userId}</p>
                    </Td>
                    <Td className="text-xs font-semibold text-emerald-600">{sub.planLabel || sub.planName || 'Standard'}</Td>
                    <Td className="text-xs text-slate-500 font-mono">
                      {sub.validUntil ? new Date(sub.validUntil).toLocaleDateString('en-IN') : 'Active'}
                    </Td>
                    <Td>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                        {sub.status || 'ACTIVE'}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setSubscriptionsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 7: ATTENDANCE REVIEW RESOLUTION                                   */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={!!reviewingAttRecord}
        onClose={() => setReviewingAttRecord(null)}
        title="Review Flagged GPS Attendance"
        size="md"
      >
        <form onSubmit={handleSaveAttReview} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Record preserved attendance evidence. Does not fabricate GPS coordinates or deduct coach salary.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Action Determination</label>
            <select
              value={reviewAction}
              onChange={e => setReviewAction(e.target.value as any)}
              className="select-field text-xs font-semibold"
            >
              <option value="ACKNOWLEDGED">ACKNOWLEDGED (Session verified with staff)</option>
              <option value="EXCUSED">EXCUSED (Legitimate connectivity/device issue)</option>
              <option value="NEEDS_FOLLOW_UP">NEEDS_FOLLOW_UP (Requires coach discussion)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Review Notes / Justification (Max 2000 chars)
            </label>
            <textarea
              rows={3}
              required
              maxLength={2000}
              value={reviewReason}
              onChange={e => setReviewReason(e.target.value)}
              placeholder="e.g. Reviewed connectivity issue with coach and facility security footage confirmed attendance"
              className="input-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setReviewingAttRecord(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={savingAttReview}
              className="bg-[#F05A22] hover:bg-[#d94e1b] text-white font-semibold"
            >
              {savingAttReview ? 'Saving...' : 'Submit Determination'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 8: COMPLAINT RESOLUTION                                           */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={!!resolvingComplaint}
        onClose={() => setResolvingComplaint(null)}
        title="Resolve Community Complaint"
        size="md"
      >
        <form onSubmit={handleSaveComplaintResolution} className="space-y-4">
          <p className="text-xs text-slate-500">
            Administrative investigation resolution. Only non-financial resolution is handled here.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Resolution Status</label>
            <select
              value={resolutionStatus}
              onChange={e => setResolutionStatus(e.target.value as any)}
              className="select-field text-xs font-semibold"
            >
              <option value="RESOLVED">RESOLVED (Addressed with coach & facility)</option>
              <option value="MANUAL_REVIEW">MANUAL_REVIEW (Escalate for manual inspection)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Resolution Reason / Summary
            </label>
            <textarea
              rows={3}
              required
              value={resolutionReason}
              onChange={e => setResolutionReason(e.target.value)}
              placeholder="e.g. Reviewed session delivery and discussed schedule with facility staff"
              className="input-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setResolvingComplaint(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={savingComplaintResolution}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {savingComplaintResolution ? 'Saving...' : 'Save Resolution'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 9: PROCESS MONTHLY SALARY PAYOUT                                  */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={payrollModalOpen}
        onClose={() => setPayrollModalOpen(false)}
        title={`Process Coach Salary Payout: ${payrollMonth}`}
        size="md"
      >
        <form onSubmit={handleProcessMonthlySalary} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Coach</label>
            <select
              required
              value={payrollCoachId}
              onChange={e => setPayrollCoachId(e.target.value)}
              className="select-field text-xs font-semibold"
            >
              <option value="">— Select Coach —</option>
              {coaches.map(c => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Program Batch</label>
            <select
              required
              value={payrollProgramId}
              onChange={e => setPayrollProgramId(e.target.value)}
              className="select-field text-xs font-semibold"
            >
              <option value="">— Select Program —</option>
              {allCommunityPrograms.map(p => (
                <option key={p.id || p._id} value={p.id || p._id}>
                  {p.communityName} · {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Super Admin Exception Override */}
          {isSuperAdmin && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isExceptionApproval}
                  onChange={e => setIsExceptionApproval(e.target.checked)}
                  className="rounded border-amber-300 text-[#F05A22] focus:ring-[#F05A22]"
                />
                <span>Super Admin Exception Override (Partial-month or adjusted salary)</span>
              </label>

              {isExceptionApproval && (
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Approved Amount (INR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={exceptionAmountInr}
                      onChange={e => setExceptionAmountInr(parseFloat(e.target.value) || 0)}
                      className="input-field text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Approval Reference Code
                    </label>
                    <input
                      type="text"
                      required
                      value={exceptionReference}
                      onChange={e => setExceptionReference(e.target.value)}
                      placeholder="e.g. EXCEPTION-OCT-PRORATED-REF"
                      className="input-field text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Audit Justification Reason
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={exceptionReason}
                      onChange={e => setExceptionReason(e.target.value)}
                      placeholder="e.g. Agreed partial-month prorated salary due to mid-month start"
                      className="input-field text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setPayrollModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={processingPayroll}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              {processingPayroll ? 'Processing...' : 'Disburse Salary'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* CONFIRM DIALOG: REMOVE SOCIAL FEED POST                                 */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!postToRemove}
        title="Remove Social Feed Post"
        message="Are you sure you want to remove this post from the public community feed? This action cannot be undone."
        confirmLabel="Remove Post"
        danger
        onClose={() => setPostToRemove(null)}
        onConfirm={() => {
          if (!postToRemove) return;
          const id = postToRemove.id || postToRemove._id;
          if (id) {
            removeCommunityPost(id).catch(() => {});
            setFeedPosts(prev => prev.filter(p => (p.id || p._id) !== id));
          }
          setPostToRemove(null);
        }}
      />
    </div>
  );
}
