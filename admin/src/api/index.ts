import { get, post, put, del, getAdminToken, apiRequest } from './client';
import { BASE_URL } from './client';

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

export const createCommunity = (formData: FormData) => {
  return fetch(`${BASE_URL}/admin/communities`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAdminToken()}`
    },
    body: formData
  }).then(res => {
    if (!res.ok) throw new Error('Failed to create community');
    return res.json();
  });
};

export const updateCommunity = (id: string, formData: FormData) => {
  return fetch(`${BASE_URL}/admin/communities/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getAdminToken()}`
    },
    body: formData
  }).then(res => {
    if (!res.ok) throw new Error('Failed to update community');
    return res.json();
  });
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

export const removeCoachFromProgram = (programId: string, coachId: string) =>
  del(`/admin/programs/${programId}/coaches/${coachId}`);

export const getProgramSubscribers = (programId: string) =>
  get(`/coach-app/programs/${programId}/subscribers`);

export const subscribePlayerToProgram = (programId: string, userId: string, childId?: string) =>
  post(`/admin/programs/${programId}/subscribers`, { userId, childId });

export const processCoachSalary = (coachId: string, programId: string, month: string) =>
  post('/admin/salary/process', { coachId, programId, month });

export const getSalaryPayouts = (params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/salary-payouts${q ? '?' + q : ''}`);
};

export const getProgramAttendance = (programId: string, params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/admin/communities/programs/${programId}/attendance${q ? '?' + q : ''}`);
};

// ── Admins ────────────────────────────────────────────────────────────────────
export const getAdmins         = () => get('/admin/admins');
export const createAdmin       = (data: any) => post('/admin/admins', data);
export const updateAdmin       = (id: string, data: any) => put(`/admin/admins/${id}`, data);
export const deleteAdmin       = (id: string) => del(`/admin/admins/${id}`);
export const resetAdminPassword = (id: string, newPassword: string) =>
  put(`/admin/admins/${id}/reset-password`, { newPassword });

// Upload
export const uploadImage = (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  return fetch(`${BASE_URL}/upload/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAdminToken()}`
    },
    body: formData
  }).then(res => res.json());
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
export const getMyNotifications = () => get('/notifications');
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

