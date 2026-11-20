import React, { useState, useEffect, useCallback } from 'react';
import {
  Star, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Ban, Trash2, Phone, Mail, Award, RotateCw, Edit2, Coins, RotateCcw,
  ChevronRight, Upload, FileText, ExternalLink, Lock
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardContent, Badge, Avatar, Button,
  SearchBar, FilterPill, StatCard, Table, Thead, Tbody, Th, Td, Tr,
  EmptyState, ConfirmDialog, Modal, Input
} from '../../components/ui';
import {
  getAdminCoaches, getAdminCoach, approveKyc, updateCoachPricing,
  rejectKyc, banCoach, deleteAdminCoach, uploadImage, updateAdminCoach,
  getMediaSignedUrl, withAdminDocToken, extractDataList
} from '../../api';
import { getAdminToken } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import type { Coach } from '../../types';

if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('arenova_coach_overrides');
  } catch {

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
    c?.individualPrice,
    c?.pricing?.individualPrice,
    c?.profile?.individualPrice,
    c?.pricing?.individual,
    c?.sessionFee,
    c?.individualFee,
    c?.price,
    c?.fee,
    c?.requestedIndividualPrice,
    c?.profile?.requestedIndividualPrice,
    c?.pricing?.requestedIndividualPrice,
    c?.requestedIndividualFee,
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
    c?.groupPricePerPerson,
    c?.pricing?.groupPricePerPerson,
    c?.profile?.groupPricePerPerson,
    c?.pricing?.group,
    c?.groupPrice,
    c?.groupFee,
    c?.requestedGroupPricePerPerson,
    c?.profile?.requestedGroupPricePerPerson,
    c?.pricing?.requestedGroupPricePerPerson,
    c?.requestedGroupPrice,
    c?.requestedGroupFee,
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

const getCoachRequestedIndPrice = (c: any): number => {
  const candidates = [
    c?.requestedIndividualPrice,
    c?.profile?.requestedIndividualPrice,
    c?.pricing?.requestedIndividualPrice,
    c?.requestedIndividualFee,
    c?.onboarding?.requestedIndividualPrice,
  ];
  for (const val of candidates) {
    if (val !== undefined && val !== null && val !== '') {
      const num = Number(val);
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return 0;
};

const getCoachRequestedGrpPrice = (c: any): number => {
  const candidates = [
    c?.requestedGroupPricePerPerson,
    c?.profile?.requestedGroupPricePerPerson,
    c?.pricing?.requestedGroupPricePerPerson,
    c?.requestedGroupPrice,
    c?.requestedGroupFee,
    c?.onboarding?.requestedGroupPricePerPerson,
  ];
  for (const val of candidates) {
    if (val !== undefined && val !== null && val !== '') {
      const num = Number(val);
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return 0;
};

const getCoachKycDocuments = (c: any): Array<{ label: string; url: string; isImage: boolean }> => {
  if (!c) return [];
  const results: Array<{ label: string; url: string; isImage: boolean }> = [];
  const seenUrls = new Set<string>();

  const checkIsImage = (url: string, label: string) => {
    if (/\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url)) return true;
    if (/avatar|photo|selfie|image|pic/i.test(label) && !/\.pdf(\?.*)?$/i.test(url)) return true;
    return false;
  };

  const addItem = (label: string, val: any) => {
    if (!val) return;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed || seenUrls.has(trimmed)) return;

      if (trimmed.includes('@') && !trimmed.includes('/')) return;
      if (/^[\d\s+\-()]+$/.test(trimmed)) return;
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/') || trimmed.includes('/')) {
        seenUrls.add(trimmed);
        results.push({ label, url: trimmed, isImage: checkIsImage(trimmed, label) });
      }
      return;
    }
    if (Array.isArray(val)) {
      val.forEach((item, idx) => addItem(`${label} #${idx + 1}`, item));
      return;
    }
    if (typeof val === 'object') {
      const urlCandidate = val.url || val.fileUrl || val.documentUrl || val.docUrl || val.s3Key || val.key || val.uri || val.path;
      if (typeof urlCandidate === 'string' && urlCandidate.trim()) {
        const niceLabel = val.label || val.name || val.title || val.documentType || val.type || label;
        addItem(niceLabel, urlCandidate);
      } else {
        Object.entries(val).forEach(([k, v]) => {
          if (['email', 'emailId', 'mailId', 'phone', 'phoneNumber', 'status', 'kycStatus', 'note', 'reason'].includes(k)) return;
          const formattedKey = k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, s => s.toUpperCase());
          addItem(formattedKey, v);
        });
      }
    }
  };

  addItem('KYC Documents', c.documents);
  addItem('KYC Files', c.kycDocuments || c.kycFiles);
  addItem('Certificates', c.certificates || c.certification || c.certifications);
  addItem('ID Proof', c.idProof || c.aadhaar || c.aadhar || c.pan || c.governmentId || c.nationalId);
  addItem('KYC Details', c.kycDetails || c.kycData || (typeof c.kyc === 'object' ? c.kyc : null));
  addItem('Profile Documents', c.profile?.documents || c.profile?.kycDocuments || c.profile?.certificates);
  addItem('Profile Photo / Avatar', c.avatar || c.profileImage || c.photo);

  return results;
};

const openKycDocument = async (urlOrKey: string) => {
  if (!urlOrKey) return;
  let targetUrl = urlOrKey;
  const isDirect =
    urlOrKey.startsWith('http://') ||
    urlOrKey.startsWith('https://') ||
    urlOrKey.startsWith('data:') ||
    urlOrKey.startsWith('blob:') ||
    urlOrKey.startsWith('/');

  if (!isDirect) {
    try {
      const res = await getMediaSignedUrl(urlOrKey);
      const signedUrl = res?.url || res?.data?.url || res?.signedUrl;
      if (!signedUrl) {
        alert('Could not resolve a viewable URL for this file.');
        return;
      }
      targetUrl = signedUrl;
    } catch (err: any) {
      alert(err?.message || 'Failed to open protected document.');
      return;
    }
  }

  if (targetUrl.startsWith('data:') || targetUrl.startsWith('blob:')) {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const authedUrl = withAdminDocToken(targetUrl);
  const token = getAdminToken();
  const isApiHosted =
    authedUrl.includes('api.getarenova.com') ||
    targetUrl.startsWith('/');

  if (isApiHosted && token && !/X-Amz-Signature=|Signature=/i.test(authedUrl)) {
    try {
      const res = await fetch(authedUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json().catch(() => null);
          const resolved = json?.url || json?.data?.url || json?.signedUrl;
          if (resolved) {
            window.open(withAdminDocToken(resolved), '_blank', 'noopener,noreferrer');
            return;
          }
        } else {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank', 'noopener,noreferrer');
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
          return;
        }
      }
    } catch {}
  }

  window.open(authedUrl, '_blank', 'noopener,noreferrer');
};

function KycThumb({ url, label, isImage, variant = 'small' }: { url: string; label: string; isImage: boolean; variant?: 'small' | 'card' }) {
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    if (!url || !isImage) {
      setResolvedUrl('');
      return;
    }
    const isDirect =
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('data:') ||
      url.startsWith('blob:') ||
      url.startsWith('/');

    if (isDirect) {
      setResolvedUrl(withAdminDocToken(url));
    } else {
      getMediaSignedUrl(url)
        .then(res => {
          if (!active) return;
          const signed = res?.url || res?.data?.url || res?.signedUrl;
          setResolvedUrl(signed ? withAdminDocToken(signed) : '');
        })
        .catch(() => {
          if (active) setFailed(true);
        });
    }
    return () => { active = false; };
  }, [url, isImage]);

  if (variant === 'card') {
    if (!isImage || failed || !resolvedUrl) {
      return (
        <div className="aspect-video w-full rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-400">
          <FileText className="h-8 w-8 text-[#F05A22] mb-1" />
          <span className="text-[11px] font-medium text-slate-500">Document File</span>
        </div>
      );
    }
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-white border border-slate-200">
        <img
          src={resolvedUrl}
          alt={label}
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  if (!isImage || failed || !resolvedUrl) {
    return (
      <div className="h-8 w-8 rounded bg-orange-50 text-[#F05A22] flex items-center justify-center flex-shrink-0">
        <FileText className="h-4 w-4" />
      </div>
    );
  }
  return (
    <img
      src={resolvedUrl}
      alt={label}
      onError={() => setFailed(true)}
      className="h-8 w-8 rounded object-cover border border-slate-200 flex-shrink-0"
    />
  );
}

export default function CoachesPage() {
  const { can } = useAuth();
  const [coaches, setCoaches]         = useState<Coach[]>([]);
  const [applications, setApps]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('All');
  const [todayOnly, setTodayOnly]     = useState(false);
  const [expanded, setExpanded]       = useState<string | null>(null);

  const [approveModal, setApproveModal] = useState<{
    id: string;
    name: string;
    kyc: string;
    phone: string;
    email: string;
    individualPrice: string;
    groupPricePerPerson: string;
    requestedIndividualPrice: number;
    requestedGroupPricePerPerson: number;
    documents: Array<{ label: string; url: string; isImage: boolean }>;
  } | null>(null);
  const [approveErrors, setApproveErrors] = useState<{ individualPrice?: string; groupPricePerPerson?: string }>({});
  const [approving, setApproving] = useState(false);

  const [pricingModal, setPricingModal] = useState<{
    id: string;
    name: string;
    individualPrice: string;
    groupPricePerPerson: string;
    requestedIndividualPrice: number;
    requestedGroupPricePerPerson: number;
  } | null>(null);
  const [pricingErrors, setPricingErrors] = useState<{ individualPrice?: string; groupPricePerPerson?: string }>({});
  const [savingPricing, setSavingPricing] = useState(false);

  const [docsModal, setDocsModal] = useState<{ name: string; documents: Array<{ label: string; url: string; isImage: boolean }> } | null>(null);

  const [rejectModal, setRejectModal] = useState<{ id: string; name: string; reason: string } | null>(null);
  const [banModal, setBanModal]       = useState<{ id: string; name: string; reason: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);

  const [avatarUpload, setAvatarUpload] = useState<{ coachId: string; coachName: string } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const [actionCoach, setActionCoach] = useState<any | null>(null);

  const openApproveModal = async (coach: any) => {
    const coachId = coach.id || coach._id;
    const indPrice = getCoachIndPrice(coach);
    const grpPrice = getCoachGrpPrice(coach);
    const reqInd = getCoachRequestedIndPrice(coach) || indPrice;
    const reqGrp = getCoachRequestedGrpPrice(coach) || grpPrice;
    const coachPhone = getCoachPhone(coach);
    const coachEmail = getCoachEmail(coach);
    const initialDocs = getCoachKycDocuments(coach);

    const coachKyc = String(coach.kyc || coach.kycStatus || coach.profile?.kyc || 'pending').toLowerCase();

    setApproveErrors({});
    setApproveModal({
      id: coachId,
      name: coach.name || 'Coach',
      kyc: coachKyc,
      phone: coachPhone,
      email: coachEmail,
      individualPrice: indPrice ? String(indPrice) : (reqInd ? String(reqInd) : ''),
      groupPricePerPerson: grpPrice ? String(grpPrice) : (reqGrp ? String(reqGrp) : ''),
      requestedIndividualPrice: reqInd,
      requestedGroupPricePerPerson: reqGrp,
      documents: initialDocs,
    });

    try {
      const res = await getAdminCoach(coachId);
      const detail = res?.data || res?.coach || res;
      if (detail) {
        const freshEmail = getCoachEmail(detail) || coachEmail;
        const freshPhone = getCoachPhone(detail) || coachPhone;
        const freshKyc = String(detail.kyc || detail.kycStatus || detail.profile?.kyc || coachKyc).toLowerCase();
        const freshInd = getCoachIndPrice(detail) || indPrice;
        const freshGrp = getCoachGrpPrice(detail) || grpPrice;
        const freshReqInd = getCoachRequestedIndPrice(detail) || freshInd;
        const freshReqGrp = getCoachRequestedGrpPrice(detail) || freshGrp;
        const freshDocs = getCoachKycDocuments(detail);

        if (freshEmail) {
          setCoaches(prev => prev.map(c => (c.id === coachId || (c as any)._id === coachId) ? { ...c, email: freshEmail } : c));
          setApps(prev => prev.map(a => (a.id === coachId || a._id === coachId) ? { ...a, email: freshEmail } : a));
        }

        setApproveModal(prev => {
          if (!prev || prev.id !== coachId) return prev;
          return {
            ...prev,
            kyc: freshKyc || prev.kyc,
            email: freshEmail || prev.email,
            phone: freshPhone || prev.phone,
            requestedIndividualPrice: freshReqInd,
            requestedGroupPricePerPerson: freshReqGrp,
            individualPrice: prev.individualPrice || (freshInd ? String(freshInd) : (freshReqInd ? String(freshReqInd) : '')),
            groupPricePerPerson: prev.groupPricePerPerson || (freshGrp ? String(freshGrp) : (freshReqGrp ? String(freshReqGrp) : '')),
            documents: freshDocs.length > 0 ? freshDocs : prev.documents,
          };
        });
      }
    } catch {

    }
  };

  const openDocsModal = async (coach: any) => {
    const coachId = coach.id || coach._id;
    const initialDocs = getCoachKycDocuments(coach);
    setDocsModal({ name: coach.name || 'Coach', documents: initialDocs });
    try {
      const res = await getAdminCoach(coachId);
      const detail = res?.data || res?.coach || res;
      if (detail) {
        const freshDocs = getCoachKycDocuments(detail);
        if (freshDocs.length > 0) {
          setDocsModal({ name: coach.name || detail.name || 'Coach', documents: freshDocs });
        }
      }
    } catch {

    }
  };

  const openPricingModal = (coach: any) => {
    const indPrice = getCoachIndPrice(coach);
    const grpPrice = getCoachGrpPrice(coach);
    const reqInd = getCoachRequestedIndPrice(coach) || indPrice;
    const reqGrp = getCoachRequestedGrpPrice(coach) || grpPrice;

    setPricingErrors({});
    setPricingModal({
      id: coach.id || coach._id,
      name: coach.name || 'Coach',
      individualPrice: indPrice ? String(indPrice) : '',
      groupPricePerPerson: grpPrice ? String(grpPrice) : '',
      requestedIndividualPrice: reqInd,
      requestedGroupPricePerPerson: reqGrp,
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {

      const res = await getAdminCoaches({ limit: 200 });
      const rawList = extractDataList(res);

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
        const reqInd = getCoachRequestedIndPrice(c) || indPrice;
        const reqGrp = getCoachRequestedGrpPrice(c) || grpPrice;

        return {
          ...c,
          id,
          _id: id,
          phone,
          phoneNumber: phone,
          email,
          requestedIndividualPrice: reqInd,
          requestedGroupPricePerPerson: reqGrp,
          individualPrice: indPrice,
          groupPricePerPerson: grpPrice,
          pricing: {
            ...(c.pricing || {}),
            individualPrice: indPrice,
            groupPricePerPerson: grpPrice,
            individual: indPrice,
            group: grpPrice,
          },
          profile: {
            ...(c.profile || {}),
            individualPrice: indPrice,
            groupPricePerPerson: grpPrice,
          },
          kyc,
          isActive: c.isActive ?? (kyc === 'approved')
        };
      });

      setCoaches(finalCoachData);

      const apps = finalCoachData.filter((c: any) => c.kyc === 'under_review' || c.kyc === 'pending');
      setApps(apps);
    } catch (err: any) {
      console.warn('Failed to load coaches:', err?.message || err);

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

    let matchToday = true;
    if (todayOnly) {
      const created = (c as any).createdAt || c.joined;
      if (!created) matchToday = false;
      else {
        const d = new Date(created);
        const now = new Date();
        matchToday = !isNaN(d.getTime()) &&
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate();
      }
    }

    return matchSearch && matchFilter && matchToday;
  });

  const exportCoachesCsv = useCallback(() => {
    if (filtered.length === 0) {
      alert('No coach records match the current filters to export.');
      return;
    }
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Sports', 'KYC Status', 'Active', 'Individual Price (INR)', 'Group Price (INR)', 'Joined'];
    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map(c => [
      c.id || (c as any)._id,
      c.name,
      getCoachEmail(c),
      getCoachPhone(c),
      (c.sports || []).join('; '),
      c.kyc,
      c.isActive ? 'Yes' : 'No',
      getCoachIndPrice(c),
      getCoachGrpPrice(c),
      c.joined
    ].map(escapeCsv).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arenova-coaches-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  useEffect(() => {
    const onExport = () => exportCoachesCsv();
    const onToday = (e: any) => setTodayOnly(Boolean(e?.detail?.active));
    window.addEventListener('arenova:export', onExport);
    window.addEventListener('arenova:today-filter', onToday);
    return () => {
      window.removeEventListener('arenova:export', onExport);
      window.removeEventListener('arenova:today-filter', onToday);
    };
  }, [exportCoachesCsv]);

  const validateRate = (raw: string, label: string): { valid: boolean; value: number; error?: string } => {
    const trimmed = String(raw ?? '').trim();
    if (!trimmed) {
      return { valid: false, value: 0, error: `${label} is required.` };
    }
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
      return { valid: false, value: 0, error: `${label} must be a valid positive number (no letters or negative signs).` };
    }
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num <= 0) {
      return { valid: false, value: 0, error: `${label} must be greater than ₹0.` };
    }
    return { valid: true, value: num };
  };

  const handleApproveConfirm = async () => {
    if (!approveModal) return;
    const { id } = approveModal;
    const indPrice = Number(approveModal.requestedIndividualPrice || 0);
    const grpPrice = Number(approveModal.requestedGroupPricePerPerson || 0);

    setApproveErrors({});

    try {
      setApproving(true);
      await approveKyc(id, indPrice, grpPrice);

      await updateAdminCoach(id, {
        individualPrice: indPrice,
        groupPricePerPerson: grpPrice,
      }).catch(() => {});

      setCoaches(prev => prev.map(c => (c.id === id || (c as any)._id === id) ? {
        ...c,
        kyc: 'approved',
        isActive: true,
        individualPrice: indPrice,
        groupPricePerPerson: grpPrice,
        pricing: {
          ...(c.pricing || {}),
          individualPrice: indPrice,
          groupPricePerPerson: grpPrice,
          individual: indPrice,
          group: grpPrice,
        },
        profile: {
          ...(c.profile || {}),
          individualPrice: indPrice,
          groupPricePerPerson: grpPrice,
        }
      } : c));

      setApps(prev => prev.filter(a => (a.id || a._id) !== id));
      setApproveModal(null);
      load();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setApproving(false);
    }
  };

  const handlePricingSave = async () => {
    if (!pricingModal) return;
    const { id, individualPrice, groupPricePerPerson } = pricingModal;

    const indCheck = validateRate(individualPrice, 'Individual session rate');
    const grpCheck = validateRate(groupPricePerPerson, 'Group session rate');

    if (!indCheck.valid || !grpCheck.valid) {
      setPricingErrors({
        individualPrice: indCheck.error,
        groupPricePerPerson: grpCheck.error,
      });
      return;
    }

    setPricingErrors({});
    const indPrice = indCheck.value;
    const grpPrice = grpCheck.value;

    try {
      setSavingPricing(true);
      await updateCoachPricing(id, indPrice, grpPrice);

      setCoaches(prev => prev.map(c => (c.id === id || (c as any)._id === id) ? {
        ...c,
        individualPrice: indPrice,
        groupPricePerPerson: grpPrice,
        pricing: {
          ...(c.pricing || {}),
          individualPrice: indPrice,
          groupPricePerPerson: grpPrice,
          individual: indPrice,
          group: grpPrice,
        },
        profile: {
          ...(c.profile || {}),
          individualPrice: indPrice,
          groupPricePerPerson: grpPrice,
        }
      } : c));
      setApps(prev => prev.map(a => (a.id === id || (a as any)._id === id) ? {
        ...a,
        individualPrice: indPrice,
        groupPricePerPerson: grpPrice,
        pricing: {
          ...(a.pricing || {}),
          individualPrice: indPrice,
          groupPricePerPerson: grpPrice,
          individual: indPrice,
          group: grpPrice,
        },
        profile: {
          ...(a.profile || {}),
          individualPrice: indPrice,
          groupPricePerPerson: grpPrice,
        }
      } : a));
      setPricingModal(null);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to update pricing');
    } finally {
      setSavingPricing(false);
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

    setAvatarError('');
    if (!file.type.startsWith('image/')) {
      setAvatarError('Invalid file format. Please select a JPG, PNG, GIF, or WebP image.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 5 MB limit.`);
      e.target.value = '';
      return;
    }

    try {
      setUploadingAvatar(true);
      const res = await uploadImage(file);
      const uploadedUrl = res?.url || res?.data?.url || res?.imageUrl || '';
      if (uploadedUrl) {
        await updateAdminCoach(avatarUpload.coachId, { avatar: uploadedUrl }).catch(() => {});
        setCoaches(prev => prev.map(c =>
          (c.id || (c as any)._id) === avatarUpload.coachId ? { ...c, avatar: uploadedUrl } : c
        ));
        setAvatarUpload(null);
      } else {
        setAvatarError(res?.message || 'Upload succeeded but no URL was returned.');
      }
    } catch (err: any) {
      setAvatarError(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
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

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-5 lg:p-6 min-w-0 max-w-full">

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

                    <div className="flex items-start gap-4 min-w-0 sm:min-w-[260px] flex-1">
                      <Avatar initials={getInitials(app.name)} size={48} />
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-base">{app.name || 'Unknown Coach'}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                            Awaiting KYC Verification
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">

                          <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md text-slate-700">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {email ? (
                              <span className="font-medium text-slate-900">{email}</span>
                            ) : (
                              <span className="text-amber-600 font-medium">No email</span>
                            )}
                          </span>

                          <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md text-slate-700">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-medium text-slate-900">{phone || 'No phone'}</span>
                          </span>
                        </div>

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

                    {can('coaches_write') && (
                      <div className="flex items-center justify-center shrink-0">
                        <Button
                          variant="outline"
                          className="h-8 text-xs px-3.5 font-semibold text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                          onClick={() => setActionCoach(app)}
                        >
                          Actions <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
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
                            <Avatar initials={getInitials(c.name)} src={withAdminDocToken((c as any).avatar || (c as any).profileImage || (c as any).photo)} size={36} className="flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px] sm:max-w-[200px]" title={c.name || 'Unknown Coach'}>{c.name || 'Unknown Coach'}</p>
                              <div className="flex flex-col gap-0.5 mt-0.5 min-w-0">

                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                                  {c.email ? (
                                    <span className="truncate max-w-[190px]" title={c.email}>{c.email}</span>
                                  ) : (
                                    <span className="text-gray-400 italic text-[11px]">No email</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                                  <span>{c.phone || 'No phone'}</span>
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
                          <Td className="text-right">
                            <Button
                              variant="outline"
                              className="h-7 text-xs px-2.5 font-semibold text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-50 inline-flex items-center gap-1 cursor-pointer shadow-xs"
                              onClick={() => setActionCoach(c)}
                            >
                              Actions <ChevronDown className="h-3 w-3 text-slate-400" />
                            </Button>
                          </Td>
                        )}
                      </Tr>
                      {isExp && (
                        <Tr key={c.id + '-exp'}>
                          <Td colSpan={can('coaches_write') ? 10 : 9} className="bg-gray-50/80 p-4">
                            <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-2 lg:grid-cols-4 gap-4 shadow-xs">
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase flex items-center gap-1">
                                  Email <Lock className="h-2.5 w-2.5 text-gray-400" />
                                </p>
                                <p className="text-xs font-semibold text-gray-900 mt-0.5">{c.email || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase flex items-center gap-1">
                                  Phone <Lock className="h-2.5 w-2.5 text-gray-400" />
                                </p>
                                <p className="text-xs font-semibold text-gray-900 mt-0.5">{c.phone || 'N/A'}</p>
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

                              {(() => {
                                const docs = getCoachKycDocuments(c);
                                return (
                                  <div className="col-span-2 lg:col-span-4 pt-2 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <p className="text-[10px] font-semibold text-gray-500 uppercase flex items-center gap-1">
                                        <FileText className="h-3 w-3 text-[#F05A22]" /> Uploaded KYC Documents & Files ({docs.length})
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => openDocsModal(c)}
                                        className="text-[11px] font-semibold text-[#F05A22] hover:underline cursor-pointer"
                                      >
                                        Open Document Viewer
                                      </button>
                                    </div>
                                    {docs.length === 0 ? (
                                      <p className="text-xs text-gray-400 italic">No KYC files found in list payload — click "Open Document Viewer" to fetch full profile files.</p>
                                    ) : (
                                      <div className="flex flex-wrap gap-2">
                                        {docs.map((d, idx) => (
                                          <button
                                            key={idx}
                                            type="button"
                                            onClick={() => openKycDocument(d.url)}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-medium text-gray-800 cursor-pointer"
                                          >
                                            <FileText className="h-3 w-3 text-[#F05A22]" />
                                            <span>{d.label}</span>
                                            <ExternalLink className="h-3 w-3 text-gray-400" />
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
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

      <Modal
        open={!!avatarUpload}
        onClose={() => { setAvatarUpload(null); setAvatarError(''); }}
        title={`Update Avatar - ${avatarUpload?.coachName}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="coach-avatar-file" className="block text-xs font-medium text-gray-700 mb-1.5">
              Coach Avatar <span className="text-gray-400 font-normal">(JPG, PNG, WebP · Max 5 MB)</span>
            </label>
            <input
              id="coach-avatar-file"
              name="coachAvatar"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
              className="input-field"
            />
            {uploadingAvatar && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
            {avatarError && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5 mt-2 leading-relaxed">
                {avatarError}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setAvatarUpload(null); setAvatarError(''); }}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!approveModal}
        onClose={() => setApproveModal(null)}
        title={`Verify Coach KYC - ${approveModal?.name}`}
        size="md"
      >
        <div className="space-y-4">

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 text-sm">{approveModal?.name}</span>
              {(() => {
                const kyc = approveModal?.kyc || 'pending';
                if (kyc === 'approved') {
                  return (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Approved
                    </span>
                  );
                }
                if (kyc === 'rejected') {
                  return (
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      Rejected
                    </span>
                  );
                }
                if (kyc === 'under_review') {
                  return (
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      Under Review
                    </span>
                  );
                }
                return (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Pending KYC
                  </span>
                );
              })()}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-gray-400" /> {approveModal?.email || 'No email on record'}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-gray-400" /> {approveModal?.phone || 'No phone on record'}</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-[#F05A22]" /> Coach's Proposed Session Rates
              </span>
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
              Pricing can be adjusted anytime from Actions → Update Session Pricing.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Lock className="h-3 w-3 text-slate-400" /> Contact Details (Coach-Managed · Read-Only)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
              <div><span className="text-slate-400">Email:</span> <strong className="text-slate-900">{approveModal?.email || 'Not provided'}</strong></div>
              <div><span className="text-slate-400">Phone:</span> <strong className="text-slate-900">{approveModal?.phone || 'Not provided'}</strong></div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[#F05A22]" />
              Uploaded KYC Files & Certificates ({approveModal?.documents?.length || 0})
            </p>
            {!approveModal?.documents || approveModal.documents.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No KYC files found on this coach's profile.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {approveModal.documents.map((doc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => openKycDocument(doc.url)}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <KycThumb url={doc.url} label={doc.label} isImage={doc.isImage} variant="small" />
                      <span className="text-xs font-semibold text-slate-800 truncate">{doc.label}</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#F05A22] flex items-center gap-1 flex-shrink-0">
                      View <ExternalLink className="h-3 w-3" />
                    </span>
                  </button>
                ))}
              </div>
            )}
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
              {approving ? 'Verifying...' : 'Approve & Verify KYC'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!pricingModal}
        onClose={() => { setPricingModal(null); setPricingErrors({}); }}
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

          <div>
            <Input
              label="Individual Session Price (₹) *"
              type="number"
              min={1}
              placeholder="e.g. 500"
              value={pricingModal?.individualPrice || ''}
              onChange={e => {
                setPricingErrors(prev => ({ ...prev, individualPrice: undefined }));
                setPricingModal(prev => prev ? { ...prev, individualPrice: e.target.value } : null);
              }}
            />
            {pricingErrors.individualPrice && (
              <p className="text-[11px] text-rose-600 font-medium mt-1">{pricingErrors.individualPrice}</p>
            )}
          </div>
          <div>
            <Input
              label="Group Session Price per Person (₹) *"
              type="number"
              min={1}
              placeholder="e.g. 200"
              value={pricingModal?.groupPricePerPerson || ''}
              onChange={e => {
                setPricingErrors(prev => ({ ...prev, groupPricePerPerson: undefined }));
                setPricingModal(prev => prev ? { ...prev, groupPricePerPerson: e.target.value } : null);
              }}
            />
            {pricingErrors.groupPricePerPerson && (
              <p className="text-[11px] text-rose-600 font-medium mt-1">{pricingErrors.groupPricePerPerson}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              className="text-xs text-[#F05A22] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              onClick={() => {
                if (!pricingModal) return;
                setPricingErrors({});
                setPricingModal(prev => prev ? {
                  ...prev,
                  individualPrice: String(prev.requestedIndividualPrice || ''),
                  groupPricePerPerson: String(prev.requestedGroupPricePerPerson || '')
                } : null);
              }}
            >
              <RotateCcw className="h-3 w-3" /> Use Proposed Rates
            </button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setPricingModal(null); setPricingErrors({}); }}>Cancel</Button>
              <Button variant="primary" disabled={savingPricing} onClick={handlePricingSave}>
                {savingPricing ? 'Saving...' : 'Save Pricing'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!docsModal}
        onClose={() => setDocsModal(null)}
        title={`Uploaded KYC Files - ${docsModal?.name}`}
        size="md"
      >
        <div className="space-y-3">
          {!docsModal?.documents || docsModal.documents.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No KYC documents or uploaded files found for this coach.</p>
              <p className="text-[11px] text-slate-400 mt-1">If the coach uploaded files from the mobile app, verify the backend coach detail endpoint returns their document URLs/keys.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {docsModal.documents.map((doc, idx) => (
                <div key={idx} className="border border-slate-200 rounded-2xl p-3 bg-slate-50/70 flex flex-col gap-2">
                  <KycThumb url={doc.url} label={doc.label} isImage={doc.isImage} variant="card" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 truncate">{doc.label}</span>
                    <Button
                      variant="outline"
                      className="h-7 text-[11px] px-2.5 flex-shrink-0"
                      onClick={() => openKycDocument(doc.url)}
                    >
                      Open <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setDocsModal(null)}>Close</Button>
          </div>
        </div>
      </Modal>

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

      <Modal
        open={Boolean(actionCoach)}
        onClose={() => setActionCoach(null)}
        title="Manage Coach"
        size="md"
      >
        {actionCoach && (
          <div className="space-y-4">

            <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <Avatar initials={actionCoach.name ? actionCoach.name.slice(0, 2) : 'CO'} src={withAdminDocToken((actionCoach as any).avatar || (actionCoach as any).profileImage || (actionCoach as any).photo)} size={44} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-sm truncate">
                    {actionCoach.name || 'Coach'}
                  </h3>
                  <Badge className={
                    actionCoach.kyc === 'approved' ? 'badge-green' :
                    actionCoach.kyc === 'rejected' ? 'badge-red' : 'badge-amber'
                  }>
                    KYC: {actionCoach.kyc || 'Pending'}
                  </Badge>
                  <Badge className={actionCoach.isActive ? 'badge-green' : 'badge-red'}>
                    {actionCoach.isActive ? 'Active' : 'Banned/Inactive'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {getCoachEmail(actionCoach) || 'No email'} · {getCoachPhone(actionCoach) || 'No phone'}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-700">
                  <span>Ind: <strong className="text-slate-900">{fmt(getCoachIndPrice(actionCoach))}</strong></span>
                  <span>Grp: <strong className="text-slate-900">{fmt(getCoachGrpPrice(actionCoach))}</strong></span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
                onClick={() => {
                  const target = actionCoach;
                  setActionCoach(null);
                  openApproveModal(target);
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {actionCoach.kyc === 'approved'
                        ? 'KYC Approved · Review Credentials & Rates'
                        : 'Verify KYC & Set Approved Rates'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {actionCoach.kyc === 'approved'
                        ? 'Inspect KYC documents and adjust approved session rates'
                        : 'Approve coach credentials and decide session pricing'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
                onClick={() => {
                  const target = actionCoach;
                  setActionCoach(null);
                  openPricingModal(target);
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600"><Coins className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Update Session Pricing</p>
                    <p className="text-[11px] text-slate-500">Change 1-on-1 individual and group session rates</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
                onClick={() => {
                  const target = actionCoach;
                  setActionCoach(null);
                  openDocsModal(target);
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><FileText className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">View Uploaded KYC Files</p>
                    <p className="text-[11px] text-slate-500">Inspect ID proof, certificates, and uploaded documents</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
                onClick={() => {
                  const target = actionCoach;
                  setActionCoach(null);
                  setAvatarUpload({ coachId: target.id || target._id, coachName: target.name || 'Coach' });
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-teal-50 text-teal-600"><Upload className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Upload Profile Avatar</p>
                    <p className="text-[11px] text-slate-500">Update coach profile picture</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                {actionCoach.isActive ? (
                  <button
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                    onClick={() => {
                      const id = actionCoach.id || actionCoach._id;
                      const name = actionCoach.name || 'Coach';
                      setActionCoach(null);
                      setBanModal({ id, name, reason: '' });
                    }}
                  >
                    Ban / Suspend Coach
                  </button>
                ) : (
                  <button
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                    onClick={() => {
                      const id = actionCoach.id || actionCoach._id;
                      setActionCoach(null);
                      handleActivateConfirm(id);
                    }}
                  >
                    Activate Coach
                  </button>
                )}

                {(actionCoach.kyc === 'under_review' || actionCoach.kyc === 'pending') && (
                  <button
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                    onClick={() => {
                      const id = actionCoach.id || actionCoach._id;
                      const name = actionCoach.name || 'Coach';
                      setActionCoach(null);
                      setRejectModal({ id, name, reason: '' });
                    }}
                  >
                    Reject Application
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                  onClick={() => {
                    const id = actionCoach.id || actionCoach._id;
                    const name = actionCoach.name || 'Coach';
                    setActionCoach(null);
                    setDeleteModal({ id, name });
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-rose-100 text-rose-600"><Trash2 className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs font-bold text-rose-700">Delete Coach Record</p>
                      <p className="text-[11px] text-rose-500">Permanently remove coach from system</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-rose-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

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

