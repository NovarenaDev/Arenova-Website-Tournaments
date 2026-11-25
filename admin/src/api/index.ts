import { get, post, put, del, getAdminToken, apiRequest, extractDataList } from './client';
import { BASE_URL } from './client';

export { extractDataList };

export const adminLogin = (email: string, password: string) =>
  post('/auth/admin/login', { email, password });

export const adminGetMe = () => get('/auth/admin/me');

export const getDashboard = () => get('/admin/dashboard');

export const withAdminDocToken = (url?: string): string => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  const originBase = BASE_URL.replace(/\/api$/, '');
  return trimmed.startsWith('/') ? `${originBase}${trimmed}` : trimmed;
};

export const getCustomers = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/customers${q ? '?' + q : ''}`);
};
export const getCustomer = (id: string) => get(`/admin/customers/${id}`);
export const updateCustomer = (id: string, data: any) => put(`/admin/customers/${id}`, data);
export const updateCustomerStatus = (id: string, status: string) =>
  put(`/admin/customers/${id}/status`, { status });
export const deleteCustomer = (id: string) => del(`/admin/customers/${id}`);

export const getAdminCoaches = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/coaches${q ? '?' + q : ''}`);
};
export const getAdminCoach = (id: string) => get(`/admin/coaches/${id}`);
export const updateAdminCoach = (id: string, data: any) => put(`/admin/coaches/${id}`, data);
export const approveKyc = (id: string, individualPrice: number, groupPricePerPerson: number) =>
  put(`/admin/coaches/${id}/kyc/approve`, { individualPrice, groupPricePerPerson });
export const updateCoachPricing = async (id: string, individualPrice: number, groupPricePerPerson: number) => {
  const payload = {
    individualPrice,
    groupPricePerPerson,
    pricing: {
      individualPrice,
      groupPricePerPerson,
      individual: individualPrice,
      group: groupPricePerPerson,
      sessionPrice: individualPrice
    },
    profile: {
      individualPrice,
      groupPricePerPerson,
      pricing: {
        individualPrice,
        groupPricePerPerson
      }
    },
    sessionFee: individualPrice,
    individualFee: individualPrice
  };

  try {
    const res = await put(`/admin/coaches/${id}`, payload);
    if (res && res.success !== false) return res;
  } catch {}

  try {
    const res = await put(`/admin/coaches/${id}/pricing`, payload);
    if (res && res.success !== false) return res;
  } catch {}

  try {
    const res = await put(`/admin/coaches/${id}/kyc/approve`, { individualPrice, groupPricePerPerson });
    if (res && res.success !== false) return res;
  } catch {}

  return updateAdminCoach(id, payload);
};
export const rejectKyc  = (id: string, reason: string) =>
  put(`/admin/coaches/${id}/kyc/reject`, { kycNote: reason });
export const banCoach   = (id: string, reason: string) =>
  put(`/admin/coaches/${id}/ban`, { banReason: reason });
export const deleteAdminCoach = (id: string) => del(`/admin/coaches/${id}`);

export const getAdminBookings = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/bookings${q ? '?' + q : ''}`);
};
export const getBooking = (id: string) => get(`/bookings/${id}`);
export const updateBookingStatus = (id: string, status: string) =>
  put(`/admin/bookings/${id}/status`, { status });

export const getAdminReviews = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/reviews${q ? '?' + q : ''}`);
};
export const flagReview   = (id: string) => put(`/admin/reviews/${id}/flag`, {});
export const deleteReview = (id: string) => del(`/admin/reviews/${id}`);

export const getAdminSports  = () => get('/admin/sports');
export const createSport     = (data: any) => post('/admin/sports', data);
export const updateSport     = (id: string, data: any) => put(`/admin/sports/${id}`, data);
export const deleteSport     = (id: string) => del(`/admin/sports/${id}`);

export const getTournamentOptions = () => get('/novare/tournaments/options');
export const getPublicTournaments = () => get('/novare/tournaments');

export const getAdminTournaments = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/novare/tournaments${q ? '?' + q : ''}`);
};

export const createTournament = async (formData: FormData) => {
  const res = await fetch(`${BASE_URL}/admin/novare/tournaments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAdminToken()}`
    },
    body: formData
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || data?.error || `Failed to create tournament (HTTP ${res.status})`);
  }
  return data;
};

export const updateTournament = async (id: string, formData: FormData) => {
  const res = await fetch(`${BASE_URL}/admin/novare/tournaments/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getAdminToken()}`
    },
    body: formData
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || data?.error || `Failed to update tournament (HTTP ${res.status})`);
  }
  return data;
};

export const deleteTournament    = (id: string) => del(`/admin/novare/tournaments/${id}`);
export const updateTournamentStatus = (id: string, status: string) =>
  apiRequest(`/admin/novare/tournaments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const getTournamentRegistrations = (id: string, params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/novare/tournaments/${id}/registrations${q ? '?' + q : ''}`);
};
export const exportTournamentRegistrations = (id: string) => {
  return fetch(`${BASE_URL}/admin/novare/tournaments/${id}/registrations/export`, {
    headers: {
      'Authorization': `Bearer ${getAdminToken()}`
    }
  });
};

export const getVenues       = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/venues${q ? '?' + q : ''}`);
};
export const getVenue        = (id: string) => get(`/venues/${id}`);
export const getAdminVenues  = () => get('/admin/venues');
export const createVenue     = (data: any) => post('/admin/venues', data);
export const updateVenue     = (id: string, data: any) => put(`/admin/venues/${id}`, data);
export const deleteVenue     = (id: string) => del(`/admin/venues/${id}`);

export const getAdminCommunity    = () => get('/admin/community');
export const removeCommunityPost  = (id: string) => put(`/admin/community/${id}/remove`, {});

export const getAdminCommunities = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/communities${q ? '?' + q : ''}`);
};

export const getAdminCommunityDetail = (id: string) => get(`/admin/communities/${id}`);

export const createCommunity = (data: any) => {
  if (data instanceof FormData) {
    return fetch(`${BASE_URL}/admin/communities`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getAdminToken()}` },
      body: data
    }).then(res => res.json());
  }
  return post('/admin/communities', data);
};

export const updateCommunity = (id: string, data: any) => {
  if (data instanceof FormData) {
    return fetch(`${BASE_URL}/admin/communities/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${getAdminToken()}` },
      body: data
    }).then(res => res.json());
  }
  return put(`/admin/communities/${id}`, data);
};

export const updateCommunityStatus = (id: string, status: string) =>
  apiRequest(`/admin/communities/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });

export const addCommunityProgram = (communityId: string, programData: any) =>
  post(`/admin/communities/${communityId}/programs`, programData);

export const updateCommunityProgram = (communityId: string, programId: string, programData: any) =>
  put(`/admin/communities/${communityId}/programs/${programId}`, programData);

export const assignCoachToProgram = (programId: string, coachId: string, salary: number) =>
  post(`/admin/programs/${programId}/coaches`, { coachId, salary });

export const getProgramCoachesHistory = (programId: string) =>
  get(`/admin/programs/${programId}/coaches/history`);

export const updateProgramCoachSalary = (programId: string, coachId: string, salary: number) =>
  put(`/admin/programs/${programId}/coaches/${coachId}/salary`, { salary });

export const removeCoachFromProgram = (programId: string, coachId: string) =>
  del(`/admin/programs/${programId}/coaches/${coachId}`);

export const assignCommunityAdmin = (
  communityId: string,
  data: { adminId: string; permissions: string[]; active: boolean }
) => post(`/admin/communities/${communityId}/admins`, data);

export const getProgramSubscriptions = (programId: string, params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/programs/${programId}/subscriptions${q ? '?' + q : ''}`);
};

export const getProgramSubscribers = (programId: string) =>
  get(`/coach-app/programs/${programId}/subscribers`);

export const subscribePlayerToProgram = (programId: string, userId: string, childId?: string) =>
  post(`/admin/programs/${programId}/subscribers`, { userId, childId });

export const getCommunityLedger = (communityId: string, params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/communities/${communityId}/ledger${q ? '?' + q : ''}`);
};

export const getProgramAttendance = (programId: string, params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/communities/programs/${programId}/attendance${q ? '?' + q : ''}`);
};

export const reviewCommunityAttendance = (
  id: string,
  data: { action: 'ACKNOWLEDGED' | 'EXCUSED' | 'NEEDS_FOLLOW_UP'; reason: string }
) => post(`/admin/community-attendance/${id}/review`, data);

export const getCommunityComplaints = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/community-complaints${q ? '?' + q : ''}`);
};

export const resolveCommunityComplaint = (
  id: string,
  data: { status: 'RESOLVED' | 'MANUAL_REVIEW'; reason: string }
) => post(`/admin/community-complaints/${id}/resolve`, data);

export const cancelCommunityProgram = (programId: string, reason: string) =>
  post(`/admin/programs/${programId}/cancel`, { reason });

export const getProgramCancellation = (programId: string) =>
  get(`/admin/programs/${programId}/cancellation`);

export const retryProgramCancellation = (programId: string, reason: string) =>
  post(`/admin/programs/${programId}/cancellation/retry`, { reason });

export const getCommunityRefunds = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams({ sourceType: 'SUBSCRIPTION', ...params }).toString();
  return get(`/admin/refunds${q ? '?' + q : ''}`);
};

export const reconcileCommunityRefund = (id: string) =>
  post(`/admin/refunds/${id}/reconcile`, {});

export const approveCommunityRefund = (id: string, reason: string, policyReference: string) =>
  post(`/admin/refunds/${id}/approve`, { reason, policyReference });

export const processCoachSalary = (data: {
  coachId: string;
  programId: string;
  month: string;
  approvedAmountPaise?: number;
  approvalReference?: string;
  reason?: string;
}) => post('/admin/salary/process', data);

export const getSalaryPayouts = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/salary-payouts${q ? '?' + q : ''}`);
};

export const getAdmins              = () => get('/admin/admins');
export const createAdmin            = (data: { firstName: string; lastName: string; email: string }) => post('/admin/admins', data);
export const updateAdmin            = (id: string, data: { firstName: string; lastName: string }) => put(`/admin/admins/${id}`, data);
export const resendAdminInvitation  = (id: string) => post(`/admin/admins/${id}/resend-invitation`, {});
export const deactivateAdmin        = (id: string) => post(`/admin/admins/${id}/deactivate`, {});
export const reactivateAdmin        = (id: string) => post(`/admin/admins/${id}/reactivate`, {});
export const sendAdminPasswordReset = (id: string) => post(`/admin/admins/${id}/send-password-reset`, {});
export const deleteAdmin            = (id: string) => del(`/admin/admins/${id}`);
export const resetAdminPassword     = (id: string, newPassword: string) =>
  put(`/admin/admins/${id}/reset-password`, { newPassword });

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  const token = getAdminToken();
  const res = await fetch(`${BASE_URL}/upload/image`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: formData
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const msg = String(data?.message || '').toLowerCase();
    if (res.status === 401 || msg.includes('user not found') || msg.includes('invalid token') || msg.includes('no token')) {
      throw new Error(
        `Backend upload permission error (HTTP ${res.status}): The /api/upload/image endpoint rejected your Admin token ("${data?.message || 'Invalid token'}"). This endpoint currently only accepts mobile User/Coach tokens. Please paste a direct image URL below, or ask the backend developer to allow Admin tokens on /api/upload/image.`
      );
    }
    throw new Error(data?.message || `Upload failed with HTTP status ${res.status}`);
  }
  return data;
};

export const broadcastNotification = (data: {
  title: string;
  body: string;
  type?: 'booking' | 'review' | 'payment' | 'system' | 'promotion' | 'kyc' | string;
  audience?: string;
}) => post('/admin/notifications/broadcast', data);

export const getAdminWithdrawals = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/withdrawals${q ? '?' + q : ''}`);
};
export const approveWithdrawal = (id: string, remarks?: string) =>
  put(`/admin/withdrawals/${id}/approve`, { remarks });
export const rejectWithdrawal = (id: string, remarks?: string) =>
  put(`/admin/withdrawals/${id}/reject`, { remarks });

export const getMyNotifications = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/notifications${q ? '?' + q : ''}`).catch(() => ({ data: [] }));
};
export const markNotificationRead = (id: string) =>
  put(`/admin/notifications/${id}/read`, {}).catch(() => ({ success: false }));
export const markAllNotificationsRead = () =>
  put('/admin/notifications/read-all', {}).catch(() => ({ success: false }));
export const deleteNotification = (id: string) =>
  del(`/admin/notifications/${id}`).catch(() => ({ success: false }));

export const getMediaSignedUrl = (key: string) =>
  get(`/media/signed-url?key=${encodeURIComponent(key)}`);

export const getEnquiryStats = () => get('/admin/novare/enquiries/stats');
export const getEnquiries = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/novare/enquiries${q ? '?' + q : ''}`);
};
export const getEnquiry = (id: string) => get(`/admin/novare/enquiries/${id}`);
export const updateEnquiryStatus = (id: string, status: string, adminNotes?: string) =>
  apiRequest(`/admin/novare/enquiries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminNotes })
  });
export const deleteEnquiry = (id: string) => del(`/admin/novare/enquiries/${id}`);

export const verifySubscriptionPayment = (paymentData: any) =>
  post('/subscriptions/verify-payment', paymentData);

export const getAdminTransactions = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/transactions${q ? '?' + q : ''}`);
};

export const getAuditLogs = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      q.append(key, String(val).trim());
    }
  }
  const queryString = q.toString() ? `?${q.toString()}` : '';
  return get(`/admin/audit-logs${queryString}`);
};

export const getAuditLogDetail = (id: string) => {
  return get(`/admin/audit-logs/${id}`);
};

export const getAuditLogsSummary = (params: { startDate?: string; endDate?: string } = {}) => {
  const q = new URLSearchParams();
  if (params.startDate && params.startDate.trim()) q.append('startDate', params.startDate.trim());
  if (params.endDate && params.endDate.trim()) q.append('endDate', params.endDate.trim());
  const queryString = q.toString() ? `?${q.toString()}` : '';
  return get(`/admin/audit-logs/summary${queryString}`);
};

export const getAdminDisputes = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      q.append(key, String(val).trim());
    }
  }
  const queryString = q.toString() ? `?${q.toString()}` : '';
  return get(`/admin/bookings/disputes${queryString}`);
};

export const getSettlementDetail = (bookingId: string) => {
  return get(`/admin/bookings/${bookingId}/settlement`);
};

export const resolveDispute = (
  bookingId: string,
  payload: { action: 'RELEASE_TO_COACH' | 'REFUND_TO_CUSTOMER'; reason?: string; policyReference?: string }
) => {
  return post(`/admin/bookings/${bookingId}/resolve-dispute`, payload);
};

export const getAdminRefunds = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      q.append(key, String(val).trim());
    }
  }
  const queryString = q.toString() ? `?${q.toString()}` : '';
  return get(`/admin/refunds${queryString}`);
};

export const approveRefund = (id: string, data: any = {}) => {
  return put(`/admin/refunds/${id}/approve`, data);
};

export const rejectRefund = (id: string, reason?: string) => {
  return put(`/admin/refunds/${id}/reject`, { reason });
};

export const reconcileRefund = (id: string, data: any = {}) => {
  return post(`/admin/refunds/${id}/reconcile`, data);
};

export const getAdminBanners = (params: { type?: 'coach' | 'player' } = {}) => {
  const q = new URLSearchParams();
  if (params.type) q.append('type', params.type);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return get(`/admin/banners${qs}`);
};

export const createAdminBanner = (data: {
  type: 'coach' | 'player';
  imageUrl: string;
  link?: string;
  order?: number;
  isActive?: boolean;
  title?: string;
}) => post('/admin/banners', data);

export const updateAdminBanner = (
  id: string,
  data: Partial<{
    type: 'coach' | 'player';
    imageUrl: string;
    link?: string;
    order?: number;
    isActive?: boolean;
    title?: string;
  }>
) => put(`/admin/banners/${id}`, data);

export const deleteAdminBanner = (id: string) => del(`/admin/banners/${id}`);

export const reorderAdminBanners = (banners: Array<{ id: string; order: number }>) =>
  put('/admin/banners/reorder', { banners });

