import React, { useState, useEffect, useCallback } from 'react';
import {
  Star, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Ban, Trash2, Phone, Mail, Award, RotateCw, Edit2, Coins, RotateCcw
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardContent, Badge, Avatar, Button,
  SearchBar, FilterPill, StatCard, Table, Thead, Tbody, Th, Td, Tr,
  EmptyState, ConfirmDialog, Modal, Input
} from '../../components/ui';
import {
  getAdminCoaches, getAdminCoach, approveKyc, updateCoachPricing,
  rejectKyc, banCoach, deleteAdminCoach, uploadImage, updateAdminCoach,
  extractDataList
} from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Coach } from '../../types';

// Immediate purge of any legacy fake or cross-matched email overrides
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('arenova_coach_overrides');
  } catch {
    // Ignore storage errors
  }
}

const KYC_MAP: Record<string, string> = {
  approved: 'badge-green',
  pending: 'badge-amber',
  rejected: 'badge-red',
  under_review: 'badge-blue'
};

const FILTERS = ['All', 'Pending Review', 'Active', 'Banned', 'Rejected'];

function fmt(n?: number) {
  if (n === undefined || n === null) return '₹0';
  return '₹' + n.toLocaleString('en-IN');
}

const getInitials = (name?: string) => {
  if (!name) return 'U';
  return name.trim().split(/\s+/).map(n => n[0] || '').join('').slice(0, 2).toUpperCase() || 'U';
};

// ── Extraction Helpers ────────────────────────────────────────────────────────

const getCoachPhone = (c: any): string => {
  const raw =
    c?.phone ||
    c?.phoneNumber ||
    c?.mobile ||
    c?.mobileNumber ||
    c?.contact ||
    c?.contactNumber ||
    c?.phone_number ||
    c?.contact_number ||
    c?.user?.phone ||
    c?.user?.phoneNumber ||
    c?.user?.mobile ||
    c?.userId?.phone ||
    c?.profile?.phone ||
    c?.profile?.phoneNumber ||
    c?.profile?.mobile ||
    c?.onboarding?.phone ||
    c?.address?.phone ||
    c?.professionalDetails?.phone ||
    c?.whatsapp ||
    '';
  return raw !== undefined && raw !== null ? String(raw).trim() : '';
};

// Strictly extracts the coach's own email from their backend record
const getCoachEmail = (c: any): string => {
  if (!c) return '';
  const candidates = [
    c?.email,
    c?.emailId,
    c?.email_id,
    c?.mailId,
    c?.mail_id,
    c?.mail,
    c?.coachEmail,
    c?.contactEmail,
    c?.loginEmail,
    c?.emailAddress,
    c?.registeredEmail,
    c?.personalEmail,
    c?.officialEmail,
    c?.workEmail,
    c?.user?.email,
    c?.user?.emailId,
    c?.user?.email_id,
    c?.user?.mailId,
    c?.user?.mail,
    c?.user?.emailAddress,
    c?.userId?.email,
    c?.userId?.emailId,
    c?.userId?.mailId,
    c?.profile?.email,
    c?.profile?.emailId,
    c?.profile?.mailId,
    c?.profile?.mail,
    c?.profile?.user?.email,
    c?.profile?.user?.emailId,
    c?.profile?.userId?.email,
    c?.profile?.userId?.emailId,
    c?.profile?.contactEmail,
    c?.onboarding?.email,
    c?.onboarding?.emailId,
    c?.onboarding?.mailId,
    c?.onboarding?.mail,
    c?.onboarding?.coachEmail,
    c?.onboarding?.contactEmail,
    c?.onboarding?.user?.email,
    c?.onboarding?.user?.emailId,
    c?.onboarding?.personalDetails?.email,
    c?.onboarding?.personalDetails?.emailId,
    c?.onboarding?.coachDetails?.email,
    c?.onboarding?.coachDetails?.emailId,
    c?.onboardingData?.email,
    c?.onboardingData?.emailId,
    c?.onboardingData?.mailId,
    c?.onboardingData?.mail,
    c?.onboardingData?.coachEmail,
    c?.onboardingData?.contactEmail,
    c?.onboardingDetails?.email,
    c?.onboardingDetails?.emailId,
    c?.onboardingDetails?.mailId,
    c?.onboardingDetails?.mail,
    c?.onboardData?.email,
    c?.onboardData?.emailId,
    c?.onboardData?.mailId,
    c?.kyc?.email,
    c?.kyc?.emailId,
    c?.kyc?.mailId,
    c?.kyc?.mail,
    c?.kycDetails?.email,
    c?.kycDetails?.emailId,
    c?.kycDetails?.mailId,
    c?.kycData?.email,
    c?.kycData?.emailId,
    c?.personalDetails?.email,
    c?.personalDetails?.emailId,
    c?.personalDetails?.mailId,
    c?.personalInfo?.email,
    c?.personalInfo?.emailId,
    c?.personalInfo?.mailId,
    c?.coachDetails?.email,
    c?.coachDetails?.emailId,
    c?.coachDetails?.mailId,
    c?.application?.email,
    c?.application?.emailId,
    c?.application?.mailId,
    c?.applicationDetails?.email,
    c?.applicationDetails?.emailId,
    c?.contactDetails?.email,
    c?.contactDetails?.emailId,
    c?.contactInfo?.email,
    c?.contactInfo?.emailId,
    c?.contact?.email,
    c?.contact?.emailId,
    c?.account?.email,
    c?.account?.emailId,
    c?.auth?.email,
    c?.auth?.emailId,
    c?.details?.email,
    c?.details?.emailId,
    c?.details?.mailId,
    c?.documents?.email,
    c?.documents?.emailId,
    c?.bankDetails?.email,
    c?.bankDetails?.emailId,
    c?.professionalDetails?.email,
    c?.professionalDetails?.emailId,
  ];

  for (const val of candidates) {
    if (val && typeof val === 'string' && val.trim().length > 4 && val.includes('@')) {
      const clean = val.trim().toLowerCase();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
        // Discard placeholders (like rohit.sharma@example.com)
        if (!clean.endsWith('@example.com') && !clean.endsWith('@test.com') && !clean.includes('example.com') && !clean.includes('noreply')) {
          return clean;
        }
      }
    }
  }

  return '';
};

const getCoachIndPrice = (c: any): number => {
  const candidates = [
    c?.requestedIndividualPrice,
    c?.profile?.requestedIndividualPrice,
    c?.pricing?.requestedIndividualPrice,
    c?.pricing?.individualPrice,
    c?.profile?.individualPrice,
    c?.individualPrice,
    c?.requestedIndividualFee,
    c?.individualFee,
    c?.fee,
    c?.sessionFee,
    c?.pricing?.individual,
    c?.price,
  ];

  for (const val of candidates) {
    if (val !== undefined && val !== null && val !== '') {
      const num = Number(val);
      if (!isNaN(num) && num > 0) return num;
    }
  }
  for (const val of candidates) {
    if (val !== undefined && val !== null && val !== '') {
      const num = Number(val);
      if (!isNaN(num)) return num;
    }
  }
  return 0;
};

const getCoachGrpPrice = (c: any): number => {
  const candidates = [
    c?.requestedGroupPricePerPerson,
    c?.profile?.requestedGroupPricePerPerson,
    c?.pricing?.requestedGroupPricePerPerson,
    c?.pricing?.groupPricePerPerson,
    c?.profile?.groupPricePerPerson,
    c?.groupPricePerPerson,
    c?.requestedGroupPrice,
    c?.requestedGroupFee,
    c?.groupFee,
    c?.groupPrice,
    c?.pricing?.group,
  ];

  for (const val of candidates) {
    if (val !== undefined && val !== null && val !== '') {
      const num = Number(val);
      if (!isNaN(num) && num > 0) return num;
    }
  }
  for (const val of candidates) {
    if (val !== undefined && val !== null && val !== '') {
      const num = Number(val);
      if (!isNaN(num)) return num;
    }
  }
  return 0;
};

export default function CoachesPage() {
  const { can } = useAuth();
  const [coaches, setCoaches]         = useState<Coach[]>([]);
  const [applications, setApps]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('All');
  const [expanded, setExpanded]       = useState<string | null>(null);

  // Verification & Approval Modal
  const [approveModal, setApproveModal] = useState<{
    id: string;
    name: string;
    phone: string;
    email: string;
    individualPrice: string;
    groupPricePerPerson: string;
    requestedIndividualPrice: number;
    requestedGroupPricePerPerson: number;
  } | null>(null);
  const [approving, setApproving] = useState(false);

  // Dedicated Pricing Modal
  const [pricingModal, setPricingModal] = useState<{
    id: string;
    name: string;
    individualPrice: string;
    groupPricePerPerson: string;
    requestedIndividualPrice: number;
    requestedGroupPricePerPerson: number;
  } | null>(null);
  const [savingPricing, setSavingPricing] = useState(false);

  // Phone Modal
  const [phoneModal, setPhoneModal] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [savingPhone, setSavingPhone] = useState(false);

  // Email Modal
  const [emailModal, setEmailModal] = useState<{ id: string; name: string; email: string } | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  // Rejection & Ban & Delete Modals
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string; reason: string } | null>(null);
  const [banModal, setBanModal]       = useState<{ id: string; name: string; reason: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);

  // Avatar Upload
  const [avatarUpload, setAvatarUpload] = useState<{ coachId: string; coachName: string } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const openApproveModal = async (coach: any) => {
    const coachId = coach.id || coach._id;
    const indPrice = getCoachIndPrice(coach);
    const grpPrice = getCoachGrpPrice(coach);
    const coachPhone = getCoachPhone(coach);
    const coachEmail = getCoachEmail(coach);

    setApproveModal({
      id: coachId,
      name: coach.name || 'Coach',
      phone: coachPhone,
      email: coachEmail,
      individualPrice: indPrice ? String(indPrice) : '',
      groupPricePerPerson: grpPrice ? String(grpPrice) : '',
      requestedIndividualPrice: indPrice,
      requestedGroupPricePerPerson: grpPrice,
    });

    // Asynchronously fetch latest details strictly from the backend coach record
    try {
      const res = await getAdminCoach(coachId);
      const detail = res?.data || res?.coach || res;
      if (detail) {
        const freshEmail = getCoachEmail(detail) || coachEmail;
        const freshPhone = getCoachPhone(detail) || coachPhone;
        const freshInd = getCoachIndPrice(detail) || indPrice;
        const freshGrp = getCoachGrpPrice(detail) || grpPrice;

        if (freshEmail) {
          setCoaches(prev => prev.map(c => (c.id === coachId || (c as any)._id === coachId) ? { ...c, email: freshEmail } : c));
          setApps(prev => prev.map(a => (a.id === coachId || a._id === coachId) ? { ...a, email: freshEmail } : a));
        }

        setApproveModal(prev => {
          if (!prev || prev.id !== coachId) return prev;
          return {
            ...prev,
            email: freshEmail || prev.email,
            phone: freshPhone || prev.phone,
            requestedIndividualPrice: freshInd,
            requestedGroupPricePerPerson: freshGrp,
            individualPrice: prev.individualPrice || (freshInd ? String(freshInd) : ''),
            groupPricePerPerson: prev.groupPricePerPerson || (freshGrp ? String(freshGrp) : ''),
          };
        });
      }
    } catch {
      // Background refresh ignore
    }
  };

  const openPricingModal = (coach: any) => {
    const indPrice = getCoachIndPrice(coach);
    const grpPrice = getCoachGrpPrice(coach);

    setPricingModal({
      id: coach.id || coach._id,
      name: coach.name || 'Coach',
      individualPrice: indPrice ? String(indPrice) : '',
      groupPricePerPerson: grpPrice ? String(grpPrice) : '',
      requestedIndividualPrice: indPrice,
      requestedGroupPricePerPerson: grpPrice,
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Query all coaches cleanly with a single request to avoid triggering 429 rate limits
      const res = await getAdminCoaches({ limit: 200 });
      const rawList = extractDataList(res);

      // Strictly deduplicate coaches by ID to avoid any duplicates
      const seen = new Set<string>();
      const uniqueList: any[] = [];
      for (const c of rawList) {
        const id = c?.id || c?._id;
        if (id && !seen.has(String(id))) {
          seen.add(String(id));
          uniqueList.push(c);
        } else if (!id) {
          uniqueList.push(c);
        }
      }

      const finalCoachData = uniqueList.map((c: any) => {
        const id = c.id || c._id;
        const kyc = (c.kyc || c.kycStatus || c.profile?.kyc || 'pending').toLowerCase();
        const phone = getCoachPhone(c);
        const email = getCoachEmail(c);

        const indPrice = getCoachIndPrice(c);
        const grpPrice = getCoachGrpPrice(c);

        return {
          ...c,
          id,
          _id: id,
          phone,
          phoneNumber: phone,
          email,
          requestedIndividualPrice: indPrice,
          requestedGroupPricePerPerson: grpPrice,
          individualPrice: indPrice,
          groupPricePerPerson: grpPrice,
          kyc,
          isActive: c.isActive ?? (kyc === 'approved')
        };
      });

      setCoaches(finalCoachData);

      // Derive applications locally from coaches with under_review or pending kyc status
      const apps = finalCoachData.filter((c: any) => c.kyc === 'under_review' || c.kyc === 'pending');
      setApps(apps);
    } catch (err: any) {
      console.warn('Failed to load coaches:', err?.message || err);
      // Preserve existing coaches on rate limit or network glitch rather than clearing to empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = coaches.filter(c => {
    const phone = c.phone || c.phoneNumber || '';
    const email = c.email || '';
    const matchSearch = search === '' ||
      `${c.name || ''} ${email} ${phone} ${(c.sports || []).join(' ')}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' ? true :
      (filter === 'Pending Review' && (c.kyc === 'under_review' || c.kyc === 'pending')) ||
      (filter === 'Active' && c.kyc === 'approved' && (c.isActive ?? true)) ||
      (filter === 'Banned' && (c.kyc === 'approved' || !c.kyc) && c.isActive === false) ||
      (filter === 'Rejected' && c.kyc === 'rejected');
    return matchSearch && matchFilter;
  });

  const handleApproveConfirm = async () => {
    if (!approveModal) return;
    const { id, phone, email, individualPrice, groupPricePerPerson, requestedIndividualPrice, requestedGroupPricePerPerson } = approveModal;
    const indPrice = parseFloat(individualPrice) || requestedIndividualPrice || 0;
    const grpPrice = parseFloat(groupPricePerPerson) || requestedGroupPricePerPerson || 0;
    const cleanPhone = (phone || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    try {
      setApproving(true);
      await approveKyc(id, indPrice, grpPrice);

      const updatePayload: any = {
        individualPrice: indPrice,
        groupPricePerPerson: grpPrice,
      };
      if (cleanPhone) {
        updatePayload.phone = cleanPhone;
        updatePayload.phoneNumber = cleanPhone;
      }
      if (cleanEmail) {
        updatePayload.email = cleanEmail;
        updatePayload.emailId = cleanEmail;
        updatePayload.coachEmail = cleanEmail;
        updatePayload.contactEmail = cleanEmail;
      }

      await updateAdminCoach(id, updatePayload).catch(() => {});

      setCoaches(prev => prev.map(c => (c.id === id || (c as any)._id === id) ? {
        ...c,
        kyc: 'approved',
        isActive: true,
        individualPrice: indPrice,
        groupPricePerPerson: grpPrice,
        phone: cleanPhone || c.phone,
        phoneNumber: cleanPhone || c.phoneNumber,
        email: cleanEmail || c.email
      } : c));

      setApps(prev => prev.filter(a => (a.id || a._id) !== id));
      setApproveModal(null);
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setApproving(false);
    }
  };

  const handlePricingSave = async () => {
    if (!pricingModal) return;
    const { id, individualPrice, groupPricePerPerson } = pricingModal;
    const indPrice = parseFloat(individualPrice) || 0;
    const grpPrice = parseFloat(groupPricePerPerson) || 0;

    try {
      setSavingPricing(true);
      await updateCoachPricing(id, indPrice, grpPrice);

      setCoaches(prev => prev.map(c => (c.id === id || (c as any)._id === id) ? {
        ...c,
        individualPrice: indPrice,
        groupPricePerPerson: grpPrice,
      } : c));
      setApps(prev => prev.map(a => (a.id === id || (a as any)._id === id) ? {
        ...a,
        individualPrice: indPrice,
        groupPricePerPerson: grpPrice,
      } : a));
      setPricingModal(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update pricing');
    } finally {
      setSavingPricing(false);
    }
  };

  const handlePhoneSave = async () => {
    if (!phoneModal) return;
    const { id, phone } = phoneModal;
    const cleanPhone = (phone || '').trim();
    try {
      setSavingPhone(true);
      await updateAdminCoach(id, { phone: cleanPhone, phoneNumber: cleanPhone });
      setCoaches(prev => prev.map(c => (c.id === id || (c as any)._id === id) ? { ...c, phone: cleanPhone, phoneNumber: cleanPhone } : c));
      setApps(prev => prev.map(a => (a.id === id || (a as any)._id === id) ? { ...a, phone: cleanPhone, phoneNumber: cleanPhone } : a));
      setPhoneModal(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update phone number');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleEmailSave = async () => {
    if (!emailModal) return;
    const { id, email } = emailModal;
    const cleanEmail = (email || '').trim().toLowerCase();
    try {
      setSavingEmail(true);
      await updateAdminCoach(id, {
        email: cleanEmail,
        emailId: cleanEmail,
        coachEmail: cleanEmail,
        contactEmail: cleanEmail
      });
      setCoaches(prev => prev.map(c => (c.id === id || (c as any)._id === id) ? { ...c, email: cleanEmail } : c));
      setApps(prev => prev.map(a => (a.id === id || (a as any)._id === id) ? { ...a, email: cleanEmail } : a));
      setEmailModal(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update email address');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    const { id, reason } = rejectModal;
    if (!reason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    try {
      await rejectKyc(id, reason);
      setCoaches(prev => prev.map(c => (c.id === id || (c as any)._id === id) ? { ...c, kyc: 'rejected', isActive: false } : c));
      setApps(prev => prev.filter(a => (a.id || a._id) !== id));
      setRejectModal(null);
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const handleBanConfirm = async () => {
    if (!banModal) return;
    const { id, reason } = banModal;
    if (!reason.trim()) {
      alert('Please enter a ban reason.');
      return;
    }
    try {
      await banCoach(id, reason);
      setCoaches(prev => prev.map(c => c.id === id ? { ...c, isActive: false } : c));
      setBanModal(null);
    } catch (err: any) {
      alert(err.message || 'Ban failed');
    }
  };

  const handleActivateConfirm = async (id: string) => {
    try {
      await updateAdminCoach(id, { isActive: true });
      setCoaches(prev => prev.map(c => c.id === id ? { ...c, isActive: true } : c));
    } catch (err: any) {
      alert(err.message || 'Activation failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    const { id } = deleteModal;
    try {
      await deleteAdminCoach(id);
      setCoaches(prev => prev.filter(c => c.id !== id));
      setApps(prev => prev.filter(a => (a.id || a._id) !== id));
      setDeleteModal(null);
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !avatarUpload) return;
    try {
      setUploadingAvatar(true);
      const res = await uploadImage(file);
      if (res.success) {
        setCoaches(prev => prev.map(c =>
          c.id === avatarUpload.coachId ? { ...c, avatar: res.url } : c
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
    total:         coaches.length,
    totalApproved: coaches.filter(c => c.kyc === 'approved').length,
    active:        coaches.filter(c => c.kyc === 'approved' && c.isActive).length,
    banned:        coaches.filter(c => c.kyc === 'approved' && !c.isActive).length,
    pending:       coaches.filter(c => c.kyc === 'under_review' || c.kyc === 'pending').length,
    rejected:      coaches.filter(c => c.kyc === 'rejected').length,
  };

  const currentIndPrice = approveModal?.individualPrice ? parseFloat(approveModal.individualPrice) : (approveModal?.requestedIndividualPrice ?? 0);
  const currentGrpPrice = approveModal?.groupPricePerPerson ? parseFloat(approveModal.groupPricePerPerson) : (approveModal?.requestedGroupPricePerPerson ?? 0);
  const isPricesMatchingProposed =
    approveModal &&
    currentIndPrice === approveModal.requestedIndividualPrice &&
    currentGrpPrice === approveModal.requestedGroupPricePerPerson;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-5 lg:p-6 min-w-0 max-w-full">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => setFilter('All')}>
          <StatCard label="Total Coaches"   value={String(stats.total)}    icon={<Award className="h-4 w-4 text-[#F05A22]"/>}        iconBg="bg-[#FFF0E6]" />
        </div>
        <div className="cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => setFilter('Active')}>
          <StatCard label="Active Coaches"  value={String(stats.active)}   icon={<CheckCircle className="h-4 w-4 text-emerald-600"/>} iconBg="bg-emerald-50" />
        </div>
        <div className="cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => setFilter('Pending Review')}>
          <StatCard label="Pending KYC"     value={String(stats.pending)}  icon={<Clock className="h-4 w-4 text-amber-600"/>}          iconBg="bg-amber-50" />
        </div>
        <div className="cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => setFilter('Banned')}>
          <StatCard label="Banned/Inactive" value={String(stats.banned)}   icon={<Ban className="h-4 w-4 text-red-600"/>}             iconBg="bg-red-50" />
        </div>
        <div className="cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => setFilter('Rejected')}>
          <StatCard label="Rejected KYC"    value={String(stats.rejected)} icon={<XCircle className="h-4 w-4 text-rose-600"/>}         iconBg="bg-rose-50" />
        </div>
      </div>

      {/* Pending Applications Section */}
      {applications.length > 0 && (
        <Card className="border border-gray-200 bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/80 border-b border-gray-200/80 py-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F05A22] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F05A22]"></span>
                </span>
                <div className="min-w-0">
                  <CardTitle className="text-sm font-bold text-gray-900 truncate">
                    Pending KYC Applications ({applications.length})
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    Coaches awaiting profile and session pricing review
                  </p>
                </div>
              </div>
              <Button variant="ghost" className="h-8 text-xs px-3 text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-white flex-shrink-0" onClick={() => load()}>
                <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-5 space-y-4">
            {applications.map((app: any) => {
              const phone = app.phone || app.phoneNumber || '';
              const email = app.email || '';
              const reqInd = app.requestedIndividualPrice ?? app.individualPrice ?? 0;
              const reqGrp = app.requestedGroupPricePerPerson ?? app.groupPricePerPerson ?? 0;

              return (
                <div key={app._id || app.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-gray-300 hover:shadow-sm transition-all min-w-0">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 min-w-0">
                    {/* Left: Coach Info */}
                    <div className="flex items-start gap-4 min-w-0 sm:min-w-[260px] flex-1">
                      <Avatar initials={getInitials(app.name)} size={48} />
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-base">{app.name || 'Unknown Coach'}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                            Awaiting KYC Verification
                          </span>
                        </div>

                        {/* Contact details */}
                        <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                          {/* Email badge */}
                          <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md text-slate-700">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {email ? (
                              <span className="font-medium text-slate-900">{email}</span>
                            ) : (
                              <span className="text-amber-600 font-medium">No email</span>
                            )}
                            {can('coaches_write') && (
                              <button
                                onClick={() => setEmailModal({ id: app._id || app.id, name: app.name, email })}
                                className="text-[10px] text-[#F05A22] hover:underline font-bold ml-1 cursor-pointer"
                              >
                                {email ? 'Edit' : '+ Add'}
                              </button>
                            )}
                          </span>

                          {/* Phone badge */}
                          <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md text-slate-700">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-medium text-slate-900">{phone || 'No phone'}</span>
                            {can('coaches_write') && (
                              <button
                                onClick={() => setPhoneModal({ id: app._id || app.id, name: app.name, phone })}
                                className="text-[10px] text-[#F05A22] hover:underline font-bold ml-1 cursor-pointer"
                              >
                                {phone ? 'Edit' : '+ Add'}
                              </button>
                            )}
                          </span>
                        </div>

                        {/* Sports pills */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {(app.sports || []).map((s: string) => (
                            <span key={s} className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-200/70">
                              {s}
                            </span>
                          ))}
                          {app.experience ? (
                            <span className="text-[11px] text-gray-500 font-medium ml-1">
                              • {app.experience} yrs exp
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Coach Proposed Pricing Block */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 min-w-0 sm:min-w-[260px] flex-1">
                      <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-slate-200/60">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 truncate">
                          <Coins className="h-3.5 w-3.5 text-[#F05A22] flex-shrink-0" /> Coach Requested Rates
                        </span>
                        <span className="text-[10px] font-semibold text-[#F05A22] bg-white px-2 py-0.5 rounded border border-[#FFD2B8] flex-shrink-0">
                          Pending Approval
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white border border-slate-200/80 rounded-lg p-2.5 text-center shadow-xs min-w-0">
                          <p className="text-[10px] font-medium text-slate-500 uppercase truncate">1-on-1 Individual</p>
                          <p className="text-base font-black text-gray-900 mt-0.5 truncate">
                            {fmt(reqInd)}
                            <span className="text-[10px] text-slate-400 font-normal"> / session</span>
                          </p>
                        </div>
                        <div className="bg-white border border-slate-200/80 rounded-lg p-2.5 text-center shadow-xs min-w-0">
                          <p className="text-[10px] font-medium text-slate-500 uppercase truncate">Group Session</p>
                          <p className="text-base font-black text-gray-900 mt-0.5 truncate">
                            {fmt(reqGrp)}
                            <span className="text-[10px] text-slate-400 font-normal"> / person</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    {can('coaches_write') && (
                      <div className="flex flex-row lg:flex-col items-stretch justify-center gap-2 shrink-0 flex-wrap">
                        <Button
                          variant="primary"
                          className="h-9 text-xs px-4 font-bold shadow-xs flex items-center justify-center gap-1.5"
                          onClick={() => openApproveModal(app)}
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Verify & Set Rates
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 text-xs px-3 font-semibold text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                          onClick={() => openPricingModal(app)}
                        >
                          <Edit2 className="h-3 w-3 text-[#F05A22]" /> Edit Pricing
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 text-xs px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center gap-1.5"
                          onClick={() => setRejectModal({ id: app._id || app.id, name: app.name, reason: '' })}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* All Coaches Table Card */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="py-4">
          <CardTitle className="text-base font-bold text-gray-900">All Coaches ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, phone, sport..." />
            <div className="flex gap-1 flex-wrap">
              {FILTERS.map(f => <FilterPill key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12">
              <EmptyState icon={<Award className="h-8 w-8 text-gray-400" />} title="No coaches found" />
            </div>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th></Th>
                  <Th>Coach</Th>
                  <Th>Sports</Th>
                  <Th>KYC</Th>
                  <Th>Pricing (Ind / Grp)</Th>
                  <Th>Rating</Th>
                  <Th>Sessions</Th>
                  <Th>Net Earnings</Th>
                  <Th>Status</Th>
                  {can('coaches_write') && <Th>Actions</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map(c => {
                  const isExp = expanded === c.id;
                  const indPrice = c.individualPrice ?? c.requestedIndividualPrice ?? 0;
                  const grpPrice = c.groupPricePerPerson ?? c.requestedGroupPricePerPerson ?? 0;

                  return (
                    <React.Fragment key={c.id}>
                      <Tr className="hover:bg-gray-50/70 transition-colors">
                        <Td>
                          <button onClick={() => setExpanded(isExp ? null : c.id)} className="text-gray-400 hover:text-gray-700">
                            {isExp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar initials={getInitials(c.name)} size={36} className="flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px] sm:max-w-[200px]" title={c.name || 'Unknown Coach'}>{c.name || 'Unknown Coach'}</p>
                              <div className="flex flex-col gap-0.5 mt-0.5 min-w-0">
                                {/* Email */}
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                                  {c.email ? (
                                    <span className="truncate max-w-[190px]" title={c.email}>{c.email}</span>
                                  ) : (
                                    <span className="text-gray-400 italic text-[11px]">No email</span>
                                  )}
                                  {can('coaches_write') && (
                                    <button
                                      onClick={() => setEmailModal({ id: c.id || (c as any)._id, name: c.name, email: c.email || '' })}
                                      className="text-[10px] text-[#F05A22] hover:underline font-semibold cursor-pointer"
                                    >
                                      {c.email ? 'Edit' : '+ Add'}
                                    </button>
                                  )}
                                </div>

                                {/* Phone */}
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                                  <span>{c.phone || 'No phone'}</span>
                                  {can('coaches_write') && (
                                    <button
                                      onClick={() => setPhoneModal({ id: c.id || (c as any)._id, name: c.name, phone: c.phone || '' })}
                                      className="text-[10px] text-[#F05A22] hover:underline font-semibold cursor-pointer"
                                    >
                                      {c.phone ? 'Edit' : '+ Add'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <div className="flex gap-1 flex-wrap">
                            {(c.sports || []).slice(0, 2).map(s => (
                              <span key={s} className="bg-gray-100 text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded border border-gray-200">
                                {s}
                              </span>
                            ))}
                          </div>
                        </Td>
                        <Td><Badge className={KYC_MAP[c.kyc] || 'badge-gray'}>{c.kyc?.replace('_', ' ') || 'pending'}</Badge></Td>
                        {/* Dedicated Pricing Column */}
                        <Td>
                          <div className="flex flex-col gap-0.5 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-400 text-[10px] font-semibold uppercase">Ind:</span>
                              <span className="text-gray-900 font-bold">{fmt(indPrice)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-400 text-[10px] font-semibold uppercase">Grp:</span>
                              <span className="text-gray-900 font-bold">{fmt(grpPrice)}<span className="text-[10px] text-gray-400 font-normal">/p</span></span>
                            </div>
                            {(c.kyc === 'under_review' || c.kyc === 'pending') && (
                              <span className="text-[9px] text-amber-700 font-semibold bg-amber-50 px-1 py-0.5 rounded border border-amber-200 self-start">
                                Proposed
                              </span>
                            )}
                          </div>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-medium text-gray-900">{c.rating || 0}</span>
                          </div>
                        </Td>
                        <Td><span className="text-sm text-gray-800">{c.sessions || 0}</span></Td>
                        <Td><span className="text-sm text-emerald-600 font-semibold">{fmt(c.netEarnings)}</span></Td>
                        <Td>
                          <Badge className={c.isActive ? 'badge-green' : 'badge-red'}>
                            {c.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </Td>
                        {can('coaches_write') && (
                          <Td>
                            <div className="flex items-center gap-1 flex-wrap">
                              {(c.kyc === 'under_review' || c.kyc === 'pending') ? (
                                <>
                                  <Button
                                    variant="primary"
                                    className="h-7 text-[10px] px-2.5 font-bold shadow-xs"
                                    onClick={() => openApproveModal(c)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" /> Verify
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="h-7 text-[10px] px-2 text-gray-600 hover:text-gray-900"
                                    onClick={() => openPricingModal(c)}
                                    title="Edit Pricing"
                                  >
                                    <Coins className="h-3 w-3 mr-1 text-[#F05A22]" /> Pricing
                                  </Button>
                                  <Button
                                    variant="danger"
                                    className="h-7 text-[10px] px-2"
                                    onClick={() => setRejectModal({ id: c.id || (c as any)._id, name: c.name, reason: '' })}
                                  >
                                    Reject
                                  </Button>
                                </>
                              ) : c.kyc === 'approved' ? (
                                <>
                                  <Button
                                    variant="outline"
                                    className="h-7 text-[10px] px-2 text-gray-600 hover:text-gray-900"
                                    onClick={() => openPricingModal(c)}
                                    title="Edit Pricing"
                                  >
                                    <Coins className="h-3 w-3 mr-1 text-gray-500" /> Pricing
                                  </Button>
                                  {c.isActive ? (
                                    <Button
                                      variant="ghost"
                                      className="h-7 text-[10px] px-2 text-red-600 hover:bg-red-50"
                                      onClick={() => setBanModal({ id: c.id, name: c.name, reason: '' })}
                                    >
                                      Ban
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      className="h-7 text-[10px] px-2 text-emerald-600 hover:bg-emerald-50"
                                      onClick={() => handleActivateConfirm(c.id)}
                                    >
                                      Activate
                                    </Button>
                                  )}
                                </>
                              ) : c.kyc === 'rejected' ? (
                                <>
                                  <Button
                                    variant="primary"
                                    className="h-7 text-[10px] px-2"
                                    onClick={() => openApproveModal(c)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="h-7 text-[10px] px-2"
                                    onClick={() => openPricingModal(c)}
                                  >
                                    Pricing
                                  </Button>
                                </>
                              ) : null}
                              <Button
                                variant="ghost"
                                className="h-7 text-[10px] px-2 text-gray-600 hover:text-gray-900"
                                onClick={() => setAvatarUpload({ coachId: c.id, coachName: c.name })}
                              >
                                Avatar
                              </Button>
                              <button
                                className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteModal({ id: c.id, name: c.name })}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </Td>
                        )}
                      </Tr>
                      {isExp && (
                        <Tr key={c.id + '-exp'}>
                          <Td colSpan={can('coaches_write') ? 10 : 9} className="bg-gray-50/80 p-4">
                            <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-2 lg:grid-cols-4 gap-4 shadow-xs">
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase">Email</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <p className="text-xs font-semibold text-gray-900">{c.email || 'N/A'}</p>
                                  {can('coaches_write') && (
                                    <button
                                      onClick={() => setEmailModal({ id: c.id, name: c.name, email: c.email || '' })}
                                      className="text-[10px] text-[#F05A22] hover:underline font-semibold cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase">Phone</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <p className="text-xs font-semibold text-gray-900">{c.phone || 'N/A'}</p>
                                  {can('coaches_write') && (
                                    <button
                                      onClick={() => setPhoneModal({ id: c.id, name: c.name, phone: c.phone || '' })}
                                      className="text-[10px] text-[#F05A22] hover:underline font-semibold cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Joined</p><p className="text-xs text-gray-800 mt-0.5">{c.joined || 'N/A'}</p></div>
                              <div><p className="text-[10px] font-semibold text-gray-400 uppercase">No Shows</p><p className="text-xs text-gray-800 mt-0.5">{c.noShows || 0}</p></div>
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase">Individual Session Price</p>
                                <p className="text-xs font-bold text-gray-900 mt-0.5">{fmt(indPrice)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase">Group Price / Person</p>
                                <p className="text-xs font-bold text-gray-900 mt-0.5">{fmt(grpPrice)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase">Net Earnings</p>
                                <p className="text-xs font-bold text-emerald-600 mt-0.5">{fmt(c.netEarnings)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase">Pending Payout</p>
                                <p className="text-xs font-bold text-amber-600 mt-0.5">{fmt(c.pendingPayout)}</p>
                              </div>
                              {can('coaches_write') && (
                                <div className="col-span-2 lg:col-span-4 pt-2 flex items-center justify-between border-t border-gray-100">
                                  <Button
                                    variant="outline"
                                    className="h-7 text-xs text-gray-700 hover:text-gray-900"
                                    onClick={() => openPricingModal(c)}
                                  >
                                    <Edit2 className="h-3 w-3 mr-1 text-[#F05A22]" /> Edit Pricing
                                  </Button>
                                </div>
                              )}
                              {c.bio && (
                                <div className="col-span-2 lg:col-span-4">
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Bio</p>
                                  <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{c.bio}</p>
                                </div>
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

      {/* Avatar Upload Modal */}
      <Modal
        open={!!avatarUpload}
        onClose={() => setAvatarUpload(null)}
        title={`Update Avatar - ${avatarUpload?.coachName}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Coach Avatar</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
              className="input-field"
            />
            {uploadingAvatar && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAvatarUpload(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Verify & Approve Modal */}
      <Modal
        open={!!approveModal}
        onClose={() => setApproveModal(null)}
        title={`Verify Coach KYC - ${approveModal?.name}`}
        size="md"
      >
        <div className="space-y-4">
          {/* Coach Summary Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 text-sm">{approveModal?.name}</span>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Pending KYC
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-gray-400" /> {approveModal?.email || 'No email on record'}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-gray-400" /> {approveModal?.phone || 'No phone on record'}</span>
            </div>
          </div>

          {/* Proposed Pricing Card */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-[#F05A22]" /> Coach's Proposed Session Rates
              </span>
              <button
                type="button"
                className="text-xs text-[#F05A22] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                onClick={() => {
                  if (!approveModal) return;
                  setApproveModal(prev => prev ? {
                    ...prev,
                    individualPrice: String(prev.requestedIndividualPrice || 0),
                    groupPricePerPerson: String(prev.requestedGroupPricePerPerson || 0)
                  } : null);
                }}
              >
                <RotateCcw className="h-3 w-3" /> Reset to Proposed
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-xs">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Proposed 1-on-1 Individual</p>
                <p className="text-lg font-black text-gray-900 mt-0.5">{fmt(approveModal?.requestedIndividualPrice)}</p>
                <p className="text-[10px] text-slate-400">per session</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-xs">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Proposed Group (per person)</p>
                <p className="text-lg font-black text-gray-900 mt-0.5">{fmt(approveModal?.requestedGroupPricePerPerson)}</p>
                <p className="text-[10px] text-slate-400">per person / session</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed pt-0.5">
              {isPricesMatchingProposed
                ? 'The rates below match the coach’s proposal. Click "Accept Proposed & Verify" to confirm.'
                : 'You have customized the rates below. Click "Verify with Custom Prices" to approve with adjusted pricing.'}
            </p>
          </div>

          {/* Contact Details Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Coach Email Address"
              type="email"
              placeholder="coach@example.com"
              value={approveModal?.email || ''}
              onChange={e => setApproveModal(prev => prev ? { ...prev, email: e.target.value } : null)}
            />
            <Input
              label="Coach Phone Number"
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={approveModal?.phone || ''}
              onChange={e => setApproveModal(prev => prev ? { ...prev, phone: e.target.value } : null)}
            />
          </div>

          {/* Pricing Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Approved Individual Price (₹)"
              type="number"
              placeholder="e.g. 500"
              value={approveModal?.individualPrice || ''}
              onChange={e => setApproveModal(prev => prev ? { ...prev, individualPrice: e.target.value } : null)}
            />
            <Input
              label="Approved Group Price / Person (₹)"
              type="number"
              placeholder="e.g. 200"
              value={approveModal?.groupPricePerPerson || ''}
              onChange={e => setApproveModal(prev => prev ? { ...prev, groupPricePerPerson: e.target.value } : null)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="outline" onClick={() => setApproveModal(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={approving}
              className="font-bold px-4 text-xs h-9 shadow-xs"
              onClick={handleApproveConfirm}
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              {approving ? 'Verifying...' : isPricesMatchingProposed
                ? `Accept Proposed & Verify (${fmt(currentIndPrice)} / ${fmt(currentGrpPrice)})`
                : `Verify with Custom Prices (${fmt(currentIndPrice)} / ${fmt(currentGrpPrice)})`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Pricing Modal */}
      <Modal
        open={!!pricingModal}
        onClose={() => setPricingModal(null)}
        title={`Edit Pricing - ${pricingModal?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-[#F05A22]" /> Coach's Proposed Session Rates
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-center shadow-xs">
                <p className="text-[10px] font-semibold text-slate-500 uppercase">1-on-1 Individual</p>
                <p className="text-base font-black text-gray-900 mt-0.5">{fmt(pricingModal?.requestedIndividualPrice)}</p>
                <p className="text-[10px] text-slate-400">per session</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-center shadow-xs">
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Group (per person)</p>
                <p className="text-base font-black text-gray-900 mt-0.5">{fmt(pricingModal?.requestedGroupPricePerPerson)}</p>
                <p className="text-[10px] text-slate-400">per person / session</p>
              </div>
            </div>
          </div>

          <Input
            label="Individual Session Price (₹)"
            type="number"
            placeholder="e.g. 500"
            value={pricingModal?.individualPrice || ''}
            onChange={e => setPricingModal(prev => prev ? { ...prev, individualPrice: e.target.value } : null)}
          />
          <Input
            label="Group Session Price per Person (₹)"
            type="number"
            placeholder="e.g. 200"
            value={pricingModal?.groupPricePerPerson || ''}
            onChange={e => setPricingModal(prev => prev ? { ...prev, groupPricePerPerson: e.target.value } : null)}
          />

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              className="text-xs text-[#F05A22] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              onClick={() => {
                if (!pricingModal) return;
                setPricingModal(prev => prev ? {
                  ...prev,
                  individualPrice: String(prev.requestedIndividualPrice || 0),
                  groupPricePerPerson: String(prev.requestedGroupPricePerPerson || 0)
                } : null);
              }}
            >
              <RotateCcw className="h-3 w-3" /> Use Proposed Rates
            </button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPricingModal(null)}>Cancel</Button>
              <Button variant="primary" disabled={savingPricing} onClick={handlePricingSave}>
                {savingPricing ? 'Saving...' : 'Save Pricing'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Phone Number Modal */}
      <Modal
        open={!!phoneModal}
        onClose={() => setPhoneModal(null)}
        title={`Update Phone Number - ${phoneModal?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="e.g. +91 98765 43210 or 9876543210"
            value={phoneModal?.phone || ''}
            onChange={e => setPhoneModal(prev => prev ? { ...prev, phone: e.target.value } : null)}
          />
          <p className="text-[11px] text-gray-500">
            Enter the active mobile contact number for this coach to receive notifications and player bookings.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPhoneModal(null)}>Cancel</Button>
            <Button variant="primary" disabled={savingPhone} onClick={handlePhoneSave}>
              {savingPhone ? 'Saving...' : 'Save Phone Number'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Email Modal */}
      <Modal
        open={!!emailModal}
        onClose={() => setEmailModal(null)}
        title={`Update Email Address - ${emailModal?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="coach@example.com"
            value={emailModal?.email || ''}
            onChange={e => setEmailModal(prev => prev ? { ...prev, email: e.target.value } : null)}
          />
          <p className="text-[11px] text-gray-500">
            Update the primary email address on file for this coach for account communications and notifications.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEmailModal(null)}>Cancel</Button>
            <Button variant="primary" disabled={savingEmail} onClick={handleEmailSave}>
              {savingEmail ? 'Saving...' : 'Save Email Address'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title={`Reject KYC - ${rejectModal?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Reason for Rejection"
            placeholder="E.g., Invalid credentials, blurry documents..."
            value={rejectModal?.reason || ''}
            onChange={e => setRejectModal(prev => prev ? { ...prev, reason: e.target.value } : null)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleRejectConfirm}>Reject KYC</Button>
          </div>
        </div>
      </Modal>

      {/* Ban Modal */}
      <Modal
        open={!!banModal}
        onClose={() => setBanModal(null)}
        title={`Ban Coach - ${banModal?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Reason for Banning"
            placeholder="E.g., Violation of terms, misconduct..."
            value={banModal?.reason || ''}
            onChange={e => setBanModal(prev => prev ? { ...prev, reason: e.target.value } : null)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setBanModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleBanConfirm}>Ban Coach</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Coach"
        message={`Are you sure you want to delete coach ${deleteModal?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        danger={true}
      />
    </div>
  );
}
