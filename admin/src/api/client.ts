// ── Base URL configuration ──────────────────────────────────────
const rawEnvUrl = (import.meta.env.VITE_API_BASE_URL || 'https://api.getarenova.com').trim().replace(/\/+$/, '');
export const BASE_URL = rawEnvUrl.endsWith('/api') ? rawEnvUrl : `${rawEnvUrl}/api`;

const TOKEN_KEY = 'kridext_admin_token';
let _token: string | null = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

export const setAdminToken = (t: string | null) => {
  _token = t;
  if (typeof window !== 'undefined') {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }
};

export const getAdminToken = () => {
  if (!_token && typeof window !== 'undefined') {
    _token = localStorage.getItem(TOKEN_KEY);
  }
  return _token;
};

// Universal helper to reliably extract an array list from any backend response wrapper
export function extractDataList<T = any>(res: any): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.users)) return res.users;
  if (Array.isArray(res.customers)) return res.customers;
  if (Array.isArray(res.coaches)) return res.coaches;
  if (Array.isArray(res.bookings)) return res.bookings;
  if (Array.isArray(res.tournaments)) return res.tournaments;
  if (Array.isArray(res.venues)) return res.venues;
  if (Array.isArray(res.sports)) return res.sports;
  if (Array.isArray(res.reviews)) return res.reviews;
  if (Array.isArray(res.posts)) return res.posts;
  if (Array.isArray(res.enquiries)) return res.enquiries;
  if (Array.isArray(res.admins)) return res.admins;
  if (Array.isArray(res.transactions)) return res.transactions;
  if (Array.isArray(res.payouts)) return res.payouts;
  if (Array.isArray(res.withdrawals)) return res.withdrawals;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.results)) return res.results;
  if (Array.isArray(res.records)) return res.records;
  if (Array.isArray(res.list)) return res.list;

  if (res.data && typeof res.data === 'object') {
    if (Array.isArray(res.data.data)) return res.data.data;
    if (Array.isArray(res.data.users)) return res.data.users;
    if (Array.isArray(res.data.customers)) return res.data.customers;
    if (Array.isArray(res.data.coaches)) return res.data.coaches;
    if (Array.isArray(res.data.bookings)) return res.data.bookings;
    if (Array.isArray(res.data.tournaments)) return res.data.tournaments;
    if (Array.isArray(res.data.venues)) return res.data.venues;
    if (Array.isArray(res.data.sports)) return res.data.sports;
    if (Array.isArray(res.data.reviews)) return res.data.reviews;
    if (Array.isArray(res.data.posts)) return res.data.posts;
    if (Array.isArray(res.data.enquiries)) return res.data.enquiries;
    if (Array.isArray(res.data.admins)) return res.data.admins;
    if (Array.isArray(res.data.transactions)) return res.data.transactions;
    if (Array.isArray(res.data.payouts)) return res.data.payouts;
    if (Array.isArray(res.data.withdrawals)) return res.data.withdrawals;
    if (Array.isArray(res.data.items)) return res.data.items;
    if (Array.isArray(res.data.results)) return res.data.results;
    if (Array.isArray(res.data.records)) return res.data.records;
    if (Array.isArray(res.data.list)) return res.data.list;

    for (const v of Object.values(res.data)) {
      if (Array.isArray(v)) return v as T[];
    }
  }

  for (const v of Object.values(res)) {
    if (Array.isArray(v)) return v as T[];
  }
  return [];
}

// Validator for authentic coach email addresses (rejects empty strings and dummy placeholders like @example.com)
export function isValidCoachEmail(val: any): boolean {
  if (!val || typeof val !== 'string') return false;
  const s = val.trim().toLowerCase();
  if (s.length < 5 || !s.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
    return false;
  }
  if (s.endsWith('@example.com') || s.endsWith('@test.com') || s.includes('example.com') || s.includes('noreply')) {
    return false;
  }
  return true;
}

// Helper function to recursively normalize response data
function normalizeData(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      if (obj.includes('/api/media/')) {
        const path = obj.substring(obj.indexOf('/api/media/'));
        return `https://api.getarenova.com${path}`;
      }
      if (obj.includes('16.112.182.86')) {
        return obj.replace(/http:\/\/16\.112\.182\.86/g, 'https://api.getarenova.com');
      }
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(normalizeData);
  }
  
  const normalized: any = { ...obj };
  
  // Flatten coach profile if it exists (preserving existing valid properties)
  if (normalized.profile && typeof normalized.profile === 'object') {
    const profile = normalized.profile;
    for (const key of Object.keys(profile)) {
      if (key !== '_id' && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
        if (profile[key] !== null && profile[key] !== undefined && profile[key] !== '') {
          if (normalized[key] === undefined || normalized[key] === null || normalized[key] === '') {
            normalized[key] = profile[key];
          }
        }
      }
    }
  }
  
  // Flatten user or userId object if attached
  const u = (normalized.user && typeof normalized.user === 'object' ? normalized.user : null) ||
            (normalized.userId && typeof normalized.userId === 'object' ? normalized.userId : null);
  if (u) {
    if (!normalized.name && (u.name || u.firstName || u.fullName)) {
      normalized.name = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
    }
    if (!normalized.email && (u.email || u.emailId || u.mailId || u.mail)) {
      normalized.email = u.email || u.emailId || u.mailId || u.mail;
    }
  }

  if (!normalized.name) {
    if (normalized.firstName || normalized.fullName) {
      normalized.name = normalized.fullName || `${normalized.firstName || ''} ${normalized.lastName || ''}`.trim();
    } else if (normalized.profile && typeof normalized.profile === 'object' && (normalized.profile.name || normalized.profile.fullName)) {
      normalized.name = normalized.profile.name || normalized.profile.fullName;
    }
  }

  // Extract email / mail ID strictly from this object's own direct coach onboarding fields
  const candidateEmail =
    (isValidCoachEmail(normalized.email) && normalized.email) ||
    (isValidCoachEmail(normalized.emailId) && normalized.emailId) ||
    (isValidCoachEmail(normalized.email_id) && normalized.email_id) ||
    (isValidCoachEmail(normalized.mailId) && normalized.mailId) ||
    (isValidCoachEmail(normalized.mail_id) && normalized.mail_id) ||
    (isValidCoachEmail(normalized.mail) && normalized.mail) ||
    (isValidCoachEmail(normalized.coachEmail) && normalized.coachEmail) ||
    (isValidCoachEmail(normalized.contactEmail) && normalized.contactEmail) ||
    (isValidCoachEmail(normalized.loginEmail) && normalized.loginEmail) ||
    (isValidCoachEmail(normalized.emailAddress) && normalized.emailAddress) ||
    (isValidCoachEmail(normalized.registeredEmail) && normalized.registeredEmail) ||
    (isValidCoachEmail(normalized.personalEmail) && normalized.personalEmail) ||
    (isValidCoachEmail(normalized.officialEmail) && normalized.officialEmail) ||
    (isValidCoachEmail(normalized.workEmail) && normalized.workEmail) ||
    (isValidCoachEmail(u?.email) && u?.email) ||
    (isValidCoachEmail(u?.emailId) && u?.emailId) ||
    (isValidCoachEmail(u?.mailId) && u?.mailId) ||
    (isValidCoachEmail(u?.mail) && u?.mail) ||
    (isValidCoachEmail(u?.emailAddress) && u?.emailAddress) ||
    (normalized.profile && typeof normalized.profile === 'object' ? (
      (isValidCoachEmail(normalized.profile.email) && normalized.profile.email) ||
      (isValidCoachEmail(normalized.profile.emailId) && normalized.profile.emailId) ||
      (isValidCoachEmail(normalized.profile.mailId) && normalized.profile.mailId) ||
      (isValidCoachEmail(normalized.profile.mail) && normalized.profile.mail) ||
      (isValidCoachEmail(normalized.profile.contactEmail) && normalized.profile.contactEmail) ||
      (isValidCoachEmail(normalized.profile.user?.email) && normalized.profile.user?.email) ||
      (isValidCoachEmail(normalized.profile.user?.emailId) && normalized.profile.user?.emailId) ||
      (isValidCoachEmail(normalized.profile.userId?.email) && normalized.profile.userId?.email) ||
      (isValidCoachEmail(normalized.profile.userId?.emailId) && normalized.profile.userId?.emailId)
    ) : '') ||
    (normalized.onboarding && typeof normalized.onboarding === 'object' ? (
      (isValidCoachEmail(normalized.onboarding.email) && normalized.onboarding.email) ||
      (isValidCoachEmail(normalized.onboarding.emailId) && normalized.onboarding.emailId) ||
      (isValidCoachEmail(normalized.onboarding.mailId) && normalized.onboarding.mailId) ||
      (isValidCoachEmail(normalized.onboarding.mail) && normalized.onboarding.mail) ||
      (isValidCoachEmail(normalized.onboarding.coachEmail) && normalized.onboarding.coachEmail) ||
      (isValidCoachEmail(normalized.onboarding.contactEmail) && normalized.onboarding.contactEmail) ||
      (isValidCoachEmail(normalized.onboarding.user?.email) && normalized.onboarding.user?.email) ||
      (isValidCoachEmail(normalized.onboarding.user?.emailId) && normalized.onboarding.user?.emailId) ||
      (isValidCoachEmail(normalized.onboarding.personalDetails?.email) && normalized.onboarding.personalDetails?.email) ||
      (isValidCoachEmail(normalized.onboarding.personalDetails?.emailId) && normalized.onboarding.personalDetails?.emailId) ||
      (isValidCoachEmail(normalized.onboarding.coachDetails?.email) && normalized.onboarding.coachDetails?.email) ||
      (isValidCoachEmail(normalized.onboarding.coachDetails?.emailId) && normalized.onboarding.coachDetails?.emailId)
    ) : '') ||
    (normalized.onboardingData && typeof normalized.onboardingData === 'object' ? (
      (isValidCoachEmail(normalized.onboardingData.email) && normalized.onboardingData.email) ||
      (isValidCoachEmail(normalized.onboardingData.emailId) && normalized.onboardingData.emailId) ||
      (isValidCoachEmail(normalized.onboardingData.mailId) && normalized.onboardingData.mailId) ||
      (isValidCoachEmail(normalized.onboardingData.mail) && normalized.onboardingData.mail) ||
      (isValidCoachEmail(normalized.onboardingData.coachEmail) && normalized.onboardingData.coachEmail) ||
      (isValidCoachEmail(normalized.onboardingData.contactEmail) && normalized.onboardingData.contactEmail)
    ) : '') ||
    (normalized.onboardingDetails && typeof normalized.onboardingDetails === 'object' ? (
      (isValidCoachEmail(normalized.onboardingDetails.email) && normalized.onboardingDetails.email) ||
      (isValidCoachEmail(normalized.onboardingDetails.emailId) && normalized.onboardingDetails.emailId) ||
      (isValidCoachEmail(normalized.onboardingDetails.mailId) && normalized.onboardingDetails.mailId) ||
      (isValidCoachEmail(normalized.onboardingDetails.mail) && normalized.onboardingDetails.mail)
    ) : '') ||
    (normalized.onboardData && typeof normalized.onboardData === 'object' ? (
      (isValidCoachEmail(normalized.onboardData.email) && normalized.onboardData.email) ||
      (isValidCoachEmail(normalized.onboardData.emailId) && normalized.onboardData.emailId) ||
      (isValidCoachEmail(normalized.onboardData.mailId) && normalized.onboardData.mailId)
    ) : '') ||
    (normalized.kyc && typeof normalized.kyc === 'object' ? (
      (isValidCoachEmail(normalized.kyc.email) && normalized.kyc.email) ||
      (isValidCoachEmail(normalized.kyc.emailId) && normalized.kyc.emailId) ||
      (isValidCoachEmail(normalized.kyc.mailId) && normalized.kyc.mailId) ||
      (isValidCoachEmail(normalized.kyc.mail) && normalized.kyc.mail)
    ) : '') ||
    (normalized.kycDetails && typeof normalized.kycDetails === 'object' ? (
      (isValidCoachEmail(normalized.kycDetails.email) && normalized.kycDetails.email) ||
      (isValidCoachEmail(normalized.kycDetails.emailId) && normalized.kycDetails.emailId) ||
      (isValidCoachEmail(normalized.kycDetails.mailId) && normalized.kycDetails.mailId)
    ) : '') ||
    (normalized.kycData && typeof normalized.kycData === 'object' ? (
      (isValidCoachEmail(normalized.kycData.email) && normalized.kycData.email) ||
      (isValidCoachEmail(normalized.kycData.emailId) && normalized.kycData.emailId) ||
      (isValidCoachEmail(normalized.kycData.mailId) && normalized.kycData.mailId)
    ) : '') ||
    (normalized.personalDetails && typeof normalized.personalDetails === 'object' ? (
      (isValidCoachEmail(normalized.personalDetails.email) && normalized.personalDetails.email) ||
      (isValidCoachEmail(normalized.personalDetails.emailId) && normalized.personalDetails.emailId) ||
      (isValidCoachEmail(normalized.personalDetails.mailId) && normalized.personalDetails.mailId)
    ) : '') ||
    (normalized.personalInfo && typeof normalized.personalInfo === 'object' ? (
      (isValidCoachEmail(normalized.personalInfo.email) && normalized.personalInfo.email) ||
      (isValidCoachEmail(normalized.personalInfo.emailId) && normalized.personalInfo.emailId) ||
      (isValidCoachEmail(normalized.personalInfo.mailId) && normalized.personalInfo.mailId)
    ) : '') ||
    (normalized.coachDetails && typeof normalized.coachDetails === 'object' ? (
      (isValidCoachEmail(normalized.coachDetails.email) && normalized.coachDetails.email) ||
      (isValidCoachEmail(normalized.coachDetails.emailId) && normalized.coachDetails.emailId) ||
      (isValidCoachEmail(normalized.coachDetails.mailId) && normalized.coachDetails.mailId)
    ) : '') ||
    (normalized.application && typeof normalized.application === 'object' ? (
      (isValidCoachEmail(normalized.application.email) && normalized.application.email) ||
      (isValidCoachEmail(normalized.application.emailId) && normalized.application.emailId) ||
      (isValidCoachEmail(normalized.application.mailId) && normalized.application.mailId)
    ) : '') ||
    (normalized.applicationDetails && typeof normalized.applicationDetails === 'object' ? (
      (isValidCoachEmail(normalized.applicationDetails.email) && normalized.applicationDetails.email) ||
      (isValidCoachEmail(normalized.applicationDetails.emailId) && normalized.applicationDetails.emailId)
    ) : '') ||
    (normalized.contactDetails && typeof normalized.contactDetails === 'object' ? (
      (isValidCoachEmail(normalized.contactDetails.email) && normalized.contactDetails.email) ||
      (isValidCoachEmail(normalized.contactDetails.emailId) && normalized.contactDetails.emailId) ||
      (isValidCoachEmail(normalized.contactDetails.mailId) && normalized.contactDetails.mailId)
    ) : '') ||
    '';

  const resolvedEmail = candidateEmail ? String(candidateEmail).trim().toLowerCase() : '';
  if (resolvedEmail) {
    normalized.email = resolvedEmail;
    normalized.emailId = resolvedEmail;
    normalized.mailId = resolvedEmail;
  } else if ('sports' in normalized || 'kyc' in normalized || 'kycStatus' in normalized) {
    // Only set empty on genuine coach records, not on wrapper responses
    normalized.email = '';
    normalized.emailId = '';
    normalized.mailId = '';
  }

  // Extract phone number from all possible direct and nested fields
  const rawPhone =
    normalized.phone ||
    normalized.phoneNumber ||
    normalized.mobile ||
    normalized.mobileNumber ||
    normalized.contact ||
    normalized.contactNumber ||
    normalized.phone_number ||
    normalized.contact_number ||
    normalized.whatsapp ||
    normalized.whatsappNumber ||
    u?.phone ||
    u?.phoneNumber ||
    u?.mobile ||
    u?.mobileNumber ||
    u?.contact ||
    u?.contactNumber ||
    (normalized.profile && typeof normalized.profile === 'object' ? (
      normalized.profile.phone ||
      normalized.profile.phoneNumber ||
      normalized.profile.mobile ||
      normalized.profile.contactNumber
    ) : '') ||
    (normalized.onboarding && typeof normalized.onboarding === 'object' ? (
      normalized.onboarding.phone ||
      normalized.onboarding.phoneNumber ||
      normalized.onboarding.mobile ||
      normalized.onboarding.contactNumber ||
      normalized.onboarding.user?.phone
    ) : '') ||
    (normalized.onboardingData && typeof normalized.onboardingData === 'object' ? (
      normalized.onboardingData.phone ||
      normalized.onboardingData.phoneNumber ||
      normalized.onboardingData.mobile
    ) : '') ||
    (normalized.kyc && typeof normalized.kyc === 'object' ? (
      normalized.kyc.phone ||
      normalized.kyc.phoneNumber ||
      normalized.kyc.mobile
    ) : '') ||
    (normalized.kycDetails && typeof normalized.kycDetails === 'object' ? (
      normalized.kycDetails.phone ||
      normalized.kycDetails.phoneNumber
    ) : '') ||
    (normalized.personalDetails && typeof normalized.personalDetails === 'object' ? (
      normalized.personalDetails.phone ||
      normalized.personalDetails.phoneNumber ||
      normalized.personalDetails.mobile
    ) : '') ||
    (normalized.personalInfo && typeof normalized.personalInfo === 'object' ? (
      normalized.personalInfo.phone ||
      normalized.personalInfo.phoneNumber ||
      normalized.personalInfo.mobile
    ) : '') ||
    (normalized.address && typeof normalized.address === 'object' ? normalized.address.phone : '') ||
    '';

  normalized.phone = (rawPhone !== undefined && rawPhone !== null) ? String(rawPhone).trim() : '';
  normalized.phoneNumber = normalized.phone;

  // Normalize kyc status safely without stringifying KYC objects to "[object Object]"
  if (normalized.kyc !== undefined && normalized.kyc !== null) {
    if (typeof normalized.kyc === 'object') {
      const kycObj = normalized.kyc;
      normalized.kycDetails = kycObj;
      const statusCandidate = kycObj.status || kycObj.kycStatus || normalized.kycStatus || 'pending';
      normalized.kyc = String(statusCandidate).toLowerCase();
      normalized.kycStatus = normalized.kyc;
    } else {
      normalized.kyc = String(normalized.kyc).toLowerCase();
      normalized.kycStatus = normalized.kyc;
    }
  } else if (normalized.kycStatus !== undefined && normalized.kycStatus !== null) {
    normalized.kyc = String(normalized.kycStatus).toLowerCase();
    normalized.kycStatus = normalized.kyc;
  }
  
  // 1. Map _id to id if id doesn't exist
  if ('_id' in normalized && !('id' in normalized)) {
    normalized.id = normalized._id;
  }
  
  // 2. Map createdAt to joined if joined doesn't exist
  if ('createdAt' in normalized && !('joined' in normalized)) {
    normalized.joined = new Date(normalized.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  // 3. Map totalBookings to bookings
  if ('totalBookings' in normalized && !('bookings' in normalized)) {
    normalized.bookings = normalized.totalBookings;
  }

  // 4. Normalize pricing & requested onboarding fee fields
  const reqInd =
    normalized.requestedIndividualPrice ??
    normalized.requestedIndividualFee ??
    normalized.requestedPrice ??
    normalized.requestedFee ??
    normalized.pricing?.requestedIndividualPrice ??
    normalized.pricing?.requestedPrice ??
    normalized.pricing?.requestedIndividualFee ??
    normalized.profile?.requestedIndividualPrice ??
    normalized.profile?.pricing?.requestedIndividualPrice ??
    normalized.onboarding?.requestedIndividualPrice ??
    normalized.onboarding?.pricing?.requestedIndividualPrice ??
    normalized.individualFee ??
    normalized.individualPrice ??
    normalized.pricing?.individual ??
    normalized.pricing?.individualPrice ??
    normalized.pricing?.individualFee ??
    normalized.fee ??
    normalized.fees ??
    normalized.sessionFee ??
    normalized.hourlyRate ??
    normalized.price;
  if (reqInd !== undefined && reqInd !== null && !isNaN(Number(reqInd))) {
    normalized.requestedIndividualPrice = Number(reqInd);
  }

  const reqGrp =
    normalized.requestedGroupPricePerPerson ??
    normalized.requestedGroupPrice ??
    normalized.requestedGroupFee ??
    normalized.requestedGroupFeePerPerson ??
    normalized.pricing?.requestedGroupPricePerPerson ??
    normalized.pricing?.requestedGroupPrice ??
    normalized.pricing?.requestedGroupFee ??
    normalized.profile?.requestedGroupPricePerPerson ??
    normalized.profile?.pricing?.requestedGroupPricePerPerson ??
    normalized.onboarding?.requestedGroupPricePerPerson ??
    normalized.onboarding?.pricing?.requestedGroupPricePerPerson ??
    normalized.groupFee ??
    normalized.groupPrice ??
    normalized.groupPricePerPerson ??
    normalized.pricing?.group ??
    normalized.pricing?.groupPricePerPerson ??
    normalized.pricing?.groupPrice ??
    normalized.pricing?.groupFee;
  if (reqGrp !== undefined && reqGrp !== null && !isNaN(Number(reqGrp))) {
    normalized.requestedGroupPricePerPerson = Number(reqGrp);
  }

  // Also resolve approved/active individualPrice and groupPricePerPerson
  const indPrice =
    normalized.individualPrice ??
    normalized.pricing?.individualPrice ??
    normalized.profile?.individualPrice ??
    normalized.profile?.pricing?.individualPrice ??
    normalized.fee ??
    normalized.sessionFee ??
    normalized.requestedIndividualPrice;
  if (indPrice !== undefined && indPrice !== null && !isNaN(Number(indPrice))) {
    normalized.individualPrice = Number(indPrice);
  }

  const grpPrice =
    normalized.groupPricePerPerson ??
    normalized.pricing?.groupPricePerPerson ??
    normalized.profile?.groupPricePerPerson ??
    normalized.profile?.pricing?.groupPricePerPerson ??
    normalized.groupFee ??
    normalized.groupPrice ??
    normalized.requestedGroupPricePerPerson;
  if (grpPrice !== undefined && grpPrice !== null && !isNaN(Number(grpPrice))) {
    normalized.groupPricePerPerson = Number(grpPrice);
  }
  
  // 5. Fallback missing numeric values for Coach to 0
  if ('kyc' in normalized && 'sports' in normalized) {
    if (!('grossEarnings' in normalized)) normalized.grossEarnings = 0;
    if (!('netEarnings' in normalized)) normalized.netEarnings = 0;
    if (!('pendingPayout' in normalized)) normalized.pendingPayout = 0;
    if (!('noShows' in normalized)) normalized.noShows = 0;
  }
  
  // Recursively normalize children properties
  for (const key of Object.keys(normalized)) {
    normalized[key] = normalizeData(normalized[key]);
  }
  
  return normalized;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  const token = getAdminToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const requestUrl = (BASE_URL.endsWith('/api') && cleanEndpoint.startsWith('/api/'))
    ? `${BASE_URL.slice(0, -4)}${cleanEndpoint}`
    : `${BASE_URL}${cleanEndpoint}`;

  let res: Response;
  try {
    res = await fetch(requestUrl, { ...options, headers });
  } catch (netErr: any) {
    console.warn(`[API Network Error] ${requestUrl}:`, netErr?.message);
    throw new Error('Network connection issue. Please check your internet connection.');
  }

  if (res.status === 429) {
    console.error(`[Rate Limit (HTTP 429)] ${requestUrl}: Server rate limit active.`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api:ratelimit', { detail: { url: requestUrl } }));
    }
    const err: any = new Error('Server rate limit reached (HTTP 429). The remote server is temporarily throttling requests. Please wait a moment.');
    err.status = 429;
    err.isRateLimit = true;
    throw err;
  }

  if (res.status === 401) {
    const isAdminRoute = cleanEndpoint.startsWith('/admin') || cleanEndpoint.startsWith('/auth/admin');
    if (isAdminRoute) {
      localStorage.removeItem('kridext_admin_token');
      localStorage.removeItem('kridext_admin');
      setAdminToken(null);
      if (!window.location.pathname.endsWith('/admin/login') && !window.location.pathname.endsWith('/login')) {
        window.location.href = '/admin/login';
      }
    }
    throw new Error('Unauthorized');
  }

  if (res.status === 403) {
    alert('Access Restricted: Insufficient admin permissions.');
    throw new Error('Forbidden');
  }

  if (!res.ok) {
    let msg = `Server returned HTTP ${res.status}`;
    try {
      const errData = await res.json();
      if (errData?.message) msg = errData.message;
      else if (errData?.error) msg = typeof errData.error === 'string' ? errData.error : errData.error.message || msg;
    } catch {}
    const err: any = new Error(msg);
    err.status = res.status;
    throw err;
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error('Invalid JSON response from server');
  }

  if (data && typeof data === 'object' && data.success === false) {
    const err: any = new Error(data.message || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return normalizeData(data) as T;
}

export const get  = <T = any>(url: string, opts?: RequestInit) =>
  apiRequest<T>(url, { method: 'GET', ...opts });

export const post = <T = any>(url: string, body: any, opts?: RequestInit) =>
  apiRequest<T>(url, { method: 'POST', body: JSON.stringify(body), ...opts });

export const put  = <T = any>(url: string, body: any, opts?: RequestInit) =>
  apiRequest<T>(url, { method: 'PUT', body: JSON.stringify(body), ...opts });

export const del  = <T = any>(url: string, opts?: RequestInit) =>
  apiRequest<T>(url, { method: 'DELETE', ...opts });
