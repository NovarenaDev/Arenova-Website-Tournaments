import { get, post, put, del, getAdminToken, apiRequest, extractDataList } from './client';
import { BASE_URL } from './client';

export { extractDataList };

// ── Auth ──────────────────────────────────────────────────────────────────────
export const adminLogin = (email: string, password: string) =>
  post('/auth/admin/login', { email, password });

export const adminGetMe = () => get('/auth/admin/me');

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboard = () => get('/admin/dashboard');

// ── Customers ─────────────────────────────────────────────────────────────────
export const getCustomers = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/customers${q ? '?' + q : ''}`);
};
export const getCustomer = (id: string) => get(`/admin/customers/${id}`);
export const updateCustomerStatus = (id: string, status: string) =>
  put(`/admin/customers/${id}/status`, { status });
export const deleteCustomer = (id: string) => del(`/admin/customers/${id}`);

// ── Coaches ───────────────────────────────────────────────────────────────────
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

  // 1. Direct coach update endpoint
  try {
    const res = await put(`/admin/coaches/${id}`, payload);
    if (res && res.success !== false) return res;
  } catch {}

  // 2. Dedicated pricing endpoint if supported
  try {
    const res = await put(`/admin/coaches/${id}/pricing`, payload);
    if (res && res.success !== false) return res;
  } catch {}

  // 3. KYC approve endpoint
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



// ── Bookings ──────────────────────────────────────────────────────────────────
export const getAdminBookings = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/bookings${q ? '?' + q : ''}`);
};
export const getBooking = (id: string) => get(`/bookings/${id}`);
export const updateBookingStatus = (id: string, status: string) =>
  put(`/admin/bookings/${id}/status`, { status });


// ── Reviews / Ratings ─────────────────────────────────────────────────────────
export const getAdminReviews = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/reviews${q ? '?' + q : ''}`);
};
export const flagReview   = (id: string) => put(`/admin/reviews/${id}/flag`, {});
export const deleteReview = (id: string) => del(`/admin/reviews/${id}`);

// ── Sports ────────────────────────────────────────────────────────────────────
export const getAdminSports  = () => get('/admin/sports');
export const createSport     = (data: any) => post('/admin/sports', data);
export const updateSport     = (id: string, data: any) => put(`/admin/sports/${id}`, data);
export const deleteSport     = (id: string) => del(`/admin/sports/${id}`);

// ── Tournaments ───────────────────────────────────────────────────────────────
export const getTournamentOptions = () => get('/novare/tournaments/options');
export const getPublicTournaments = () => get('/novare/tournaments');

export const getAdminTournaments = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/novare/tournaments${q ? '?' + q : ''}`);
};

export const createTournament = (formData: FormData) => {
  return fetch(`${BASE_URL}/admin/novare/tournaments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAdminToken()}`
    },
    body: formData
  }).then(res => {
    if (!res.ok) throw new Error('Failed to create tournament');
    return res.json();
  });
};

export const updateTournament = (id: string, formData: FormData) => {
  return fetch(`${BASE_URL}/admin/novare/tournaments/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getAdminToken()}`
    },
    body: formData
  }).then(res => {
    if (!res.ok) throw new Error('Failed to update tournament');
    return res.json();
  });
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

// ── Venues ────────────────────────────────────────────────────────────────────
export const getVenues       = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/venues${q ? '?' + q : ''}`);
};
export const getVenue        = (id: string) => get(`/venues/${id}`);
export const getAdminVenues  = () => get('/admin/venues');
export const createVenue     = (data: any) => post('/admin/venues', data);
export const updateVenue     = (id: string, data: any) => put(`/admin/venues/${id}`, data);
export const deleteVenue     = (id: string) => del(`/admin/venues/${id}`);

// ── Community ─────────────────────────────────────────────────────────────────
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

// ── Coach Assignment & Salary Contract ────────────────────────────────────────
export const assignCoachToProgram = (programId: string, coachId: string, salary: number) =>
  post(`/admin/programs/${programId}/coaches`, { coachId, salary });

export const getProgramCoachesHistory = (programId: string) =>
  get(`/admin/programs/${programId}/coaches/history`);

export const updateProgramCoachSalary = (programId: string, coachId: string, salary: number) =>
  put(`/admin/programs/${programId}/coaches/${coachId}/salary`, { salary });

export const removeCoachFromProgram = (programId: string, coachId: string) =>
  del(`/admin/programs/${programId}/coaches/${coachId}`);

// ── Scoped Community Staff Permissions ────────────────────────────────────────
export const assignCommunityAdmin = (
  communityId: string,
  data: { adminId: string; permissions: string[]; active: boolean }
) => post(`/admin/communities/${communityId}/admins`, data);

// ── Subscriptions & Ledger ────────────────────────────────────────────────────
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

// ── Attendance Review ─────────────────────────────────────────────────────────
export const getProgramAttendance = (programId: string, params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/communities/programs/${programId}/attendance${q ? '?' + q : ''}`);
};

export const reviewCommunityAttendance = (
  id: string,
  data: { action: 'ACKNOWLEDGED' | 'EXCUSED' | 'NEEDS_FOLLOW_UP'; reason: string }
) => post(`/admin/community-attendance/${id}/review`, data);

// ── Complaint Review & Resolution ─────────────────────────────────────────────
export const getCommunityComplaints = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/community-complaints${q ? '?' + q : ''}`);
};

export const resolveCommunityComplaint = (
  id: string,
  data: { status: 'RESOLVED' | 'MANUAL_REVIEW'; reason: string }
) => post(`/admin/community-complaints/${id}/resolve`, data);

// ── Program Cancellation & Pro-Rata Refunds ───────────────────────────────────
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

// ── Payroll & Coach Salary Processing ─────────────────────────────────────────
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

// ── Admins ────────────────────────────────────────────────────────────────────
export const getAdmins         = () => get('/admin/admins');
export const createAdmin       = (data: any) => post('/admin/admins', data);
export const updateAdmin       = (id: string, data: any) => put(`/admin/admins/${id}`, data);
export const deleteAdmin       = (id: string) => del(`/admin/admins/${id}`);
export const resetAdminPassword = (id: string, newPassword: string) =>
  put(`/admin/admins/${id}/reset-password`, { newPassword });

// Upload
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
    if (data?.message === 'User not found' || String(data?.message).toLowerCase().includes('user not found')) {
      throw new Error(
        "Upload failed: The backend '/api/upload/image' route is currently configured with User authentication instead of Admin authentication (backend returned 'User not found'). Please paste a direct image URL or have the backend developer allow Admin tokens on /api/upload/image."
      );
    }
    throw new Error(data?.message || `Upload failed with HTTP status ${res.status}`);
  }
  return data;
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const broadcastNotification = (data: { title: string; body: string; targetRole?: string }) =>
  post('/admin/notifications/broadcast', data);

// ── Payouts & Wallets ─────────────────────────────────────────────────────────
export const getAdminWithdrawals = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/withdrawals${q ? '?' + q : ''}`);
};
export const approveWithdrawal = (id: string, remarks?: string) =>
  put(`/admin/withdrawals/${id}/approve`, { remarks });
export const rejectWithdrawal = (id: string, remarks?: string) =>
  put(`/admin/withdrawals/${id}/reject`, { remarks });

// ── User Notifications ────────────────────────────────────────────────────────
export const getMyNotifications = () =>
  get('/admin/notifications').catch(() => get('/notifications')).catch(() => ({ data: [] }));
export const markNotificationRead = (id: string) => put(`/notifications/${id}/read`, {});
export const markAllNotificationsRead = () => put('/notifications/read-all', {});
export const deleteNotification = (id: string) => del(`/notifications/${id}`);

// ── Enquiries ─────────────────────────────────────────────────────────────────
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

// ── Subscriptions & Transactions ──────────────────────────────────────────────
export const verifySubscriptionPayment = (paymentData: any) =>
  post('/subscriptions/verify-payment', paymentData);

export const getAdminTransactions = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/transactions${q ? '?' + q : ''}`);
};

// ── Activity & Audit Logs ─────────────────────────────────────────────────────
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

// ── Super Admin Review & Settlement Tools ─────────────────────────────────────
// Dispute Queue: GET /api/admin/bookings/disputes?page=1&limit=50
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

// Settlement Evidence Detail: GET /api/admin/bookings/:bookingId/settlement
export const getSettlementDetail = (bookingId: string) => {
  return get(`/admin/bookings/${bookingId}/settlement`);
};

// Dispute Resolution Actions: POST /api/admin/bookings/:bookingId/resolve-dispute
// Release to Coach: { action: 'RELEASE_TO_COACH', reason }
// Refund to Customer: { action: 'REFUND_TO_CUSTOMER', reason, policyReference }
export const resolveDispute = (
  bookingId: string,
  payload: { action: 'RELEASE_TO_COACH' | 'REFUND_TO_CUSTOMER'; reason?: string; policyReference?: string }
) => {
  return post(`/admin/bookings/${bookingId}/resolve-dispute`, payload);
};

// Refund Operations: GET /api/admin/refunds?sourceType=SESSION
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

// ── Admin Banners ─────────────────────────────────────────────────────────────
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


