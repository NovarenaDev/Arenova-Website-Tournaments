// ── Base URL configuration ──────────────────────────────────────
const rawEnvUrl = (import.meta.env.VITE_API_BASE_URL || 'https://api.getarenova.com').trim().replace(/\/+$/, '');
export const BASE_URL = rawEnvUrl.endsWith('/api') ? rawEnvUrl : `${rawEnvUrl}/api`;

let _token: string | null = null;

export const setAdminToken = (t: string | null) => { _token = t; };
export const getAdminToken = () => _token;

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
  
  // Flatten coach profile if it exists
  if (normalized.profile && typeof normalized.profile === 'object') {
    const profile = normalized.profile;
    for (const key of Object.keys(profile)) {
      if (key !== '_id' && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
        normalized[key] = profile[key];
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
    if (!normalized.email && u.email) normalized.email = u.email;
    if (!normalized.phone && (u.phone || u.phoneNumber || u.mobile || u.mobileNumber || u.contactNumber)) {
      normalized.phone = u.phone || u.phoneNumber || u.mobile || u.mobileNumber || u.contactNumber;
    }
  }

  if (!normalized.name && (normalized.firstName || normalized.fullName)) {
    normalized.name = normalized.fullName || `${normalized.firstName || ''} ${normalized.lastName || ''}`.trim();
  }

  // Extract phone number from all common key names
  if (!normalized.phone) {
    normalized.phone =
      normalized.phoneNumber ||
      normalized.mobile ||
      normalized.mobileNumber ||
      normalized.contact ||
      normalized.contactNumber ||
      normalized.phone_number ||
      normalized.profile?.phone ||
      normalized.profile?.phoneNumber ||
      '';
  }

  // Normalize kyc status (handles kyc, kycStatus, uppercase/lowercase)
  if (normalized.kyc || normalized.kycStatus) {
    normalized.kyc = String(normalized.kyc || normalized.kycStatus).toLowerCase();
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
    normalized.individualFee ??
    normalized.fee ??
    normalized.fees ??
    normalized.sessionFee ??
    normalized.hourlyRate ??
    normalized.price ??
    normalized.pricing?.individual ??
    normalized.pricing?.individualPrice ??
    normalized.pricing?.individualFee;
  if (reqInd !== undefined && reqInd !== null && !isNaN(Number(reqInd))) {
    normalized.requestedIndividualPrice = Number(reqInd);
  }

  const reqGrp =
    normalized.requestedGroupPricePerPerson ??
    normalized.requestedGroupPrice ??
    normalized.requestedGroupFee ??
    normalized.groupFee ??
    normalized.pricing?.group ??
    normalized.pricing?.groupPricePerPerson ??
    normalized.pricing?.groupPrice ??
    normalized.pricing?.groupFee;
  if (reqGrp !== undefined && reqGrp !== null && !isNaN(Number(reqGrp))) {
    normalized.requestedGroupPricePerPerson = Number(reqGrp);
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
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const requestUrl = (BASE_URL.endsWith('/api') && cleanEndpoint.startsWith('/api/'))
    ? `${BASE_URL.slice(0, -4)}${cleanEndpoint}`
    : `${BASE_URL}${cleanEndpoint}`;

  const res = await fetch(requestUrl, { ...options, headers });

  if (res.status === 401) {
    const isAdminRoute = endpoint.startsWith('/admin') || endpoint.startsWith('/auth/admin');
    if (!isAdminRoute) {
      throw new Error('Unauthorized');
    }
    localStorage.removeItem('kridext_admin_token');
    localStorage.removeItem('kridext_admin');
    setAdminToken(null);
    if (!window.location.pathname.endsWith('/admin/login') && !window.location.pathname.endsWith('/login')) {
      window.location.href = '/admin/login';
    }
    throw new Error('Unauthorized');
  }

  if (res.status === 403) {
    alert('Access Restricted: Insufficient admin permissions.');
    throw new Error('Forbidden');
  }

  const data = await res.json();

  if (!data.success) {
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
