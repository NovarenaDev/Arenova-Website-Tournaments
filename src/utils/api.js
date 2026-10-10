const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://16.112.182.86';


// Local storage helpers for auth state
const STORAGE_KEYS = {
  TOKEN: 'arenova_auth_token',
  REFRESH_TOKEN: 'arenova_refresh_token',
  USER: 'arenova_user_data',
};

export const getStoredAuth = () => {
  return {
    token: localStorage.getItem(STORAGE_KEYS.TOKEN),
    refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    user: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null'),
  };
};

export const setStoredAuth = (token, refreshToken, user) => {
  if (token) localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  if (refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
};

// Helper for fetch with Authorization headers
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const isAuthEndpoint = endpoint.includes('/auth/sync') || endpoint.includes('/auth/complete-profile');
  const isPublicGet = (options.method || 'GET').toUpperCase() === 'GET' && !endpoint.includes('/registrations');
  
  const method = (options.method || 'GET').toUpperCase();
  const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const headers = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token && !isAuthEndpoint && !isPublicGet ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'Something went wrong';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // Ignored
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const api = {
  // Tournaments
  getTournaments: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.sport) query.append('sport', params.sport);
    if (params.city) query.append('city', params.city);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/api/novare/tournaments${queryString}`);
  },

  getTournamentById: async (id) => {
    return request(`/api/novare/tournaments/${id}`);
  },

  // Authentication
  syncUser: async (idToken) => {
    const data = await request('/api/novare/auth/sync', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    
    if (data.success && data.token) {
      setStoredAuth(data.token, data.refreshToken, data.data || {});
    }
    return data;
  },

  completeProfile: async (payload) => {
    // payload: { idToken, firstName, lastName, email }
    const data = await request('/api/novare/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (data.success && data.token) {
      setStoredAuth(data.token, data.refreshToken, data.data || {});
    }
    return data;
  },

  // Registrations
  registerForTournament: async (id, registrationData) => {
    // registrationData: { categoryName, partnerUserId, partnerName, partnerPhone, teamName, teamMembers: [{ name, phone, role }], playerName, playerEmail, playerPhone }
    return request(`/api/novare/tournaments/${id}/register`, {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  },

  verifyPayment: async (registrationId, paymentDetails) => {
    // paymentDetails: { paymentOrderId, paymentTransactionId, paymentSignature }
    return request(`/api/novare/registrations/${registrationId}/verify-payment`, {
      method: 'POST',
      body: JSON.stringify(paymentDetails),
    });
  },

  getMyRegistrations: async () => {
    return request('/api/novare/registrations/my');
  },

  getRegistrationById: async (id) => {
    return request(`/api/novare/registrations/${id}`);
  },

  // Enquiries
  submitEnquiry: async (enquiryData) => {
    // enquiryData: { firstName, lastName, email, company, serviceInterestedIn, message }
    return request('/api/novare/enquiries', {
      method: 'POST',
      body: JSON.stringify(enquiryData),
    });
  },
};
