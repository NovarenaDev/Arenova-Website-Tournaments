// Automatically resolve secure API Base URL to prevent browser Mixed Content blockage on HTTPS
const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl && envUrl.startsWith('https://')) {
      return envUrl.replace(/\/$/, '');
    }
    if (window.location.hostname.includes('vercel.app')) {
      return '';
    }
    // Secure HTTPS gateway to backend server (eliminates Mixed Content & CORS blocks)
    return 'https://arenova-website.vercel.app';
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://16.112.182.86';
};

const BASE_URL = getBaseUrl();


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
  if (user) {
    const normalizedUser = {
      ...user,
      firstName: user.firstName || (user.name ? user.name.split(' ')[0] : ''),
      lastName: user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : ''),
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(normalizedUser));
  }
};

export const clearStoredAuth = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
};

// Helper for fetch with Authorization headers
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const isAuthEndpoint = endpoint.startsWith('/api/auth/') || endpoint.includes('/auth/sync') || endpoint.includes('/auth/complete-profile');
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

  // Player & Parent Authentication (Unified Identity System)
  registerEmail: async ({ firstName, lastName, role, phone, email, password }) => {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, role, phone, email, password }),
    });
  },

  verifyEmailOtp: async (email, otp) => {
    const data = await request('/api/auth/verify-email-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    if (data.success && data.token) {
      setStoredAuth(data.token, data.refreshToken, data.data || {});
    }
    return data;
  },

  sendPhoneOtp: async (phone) => {
    return request('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  verifyPhoneOtp: async (payload) => {
    // payload: { phone, otp } OR { phone, otp, firstName, lastName, role }
    const data = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.success && data.token) {
      setStoredAuth(data.token, data.refreshToken, data.data || {});
    }
    return data;
  },

  loginEmail: async (email, password) => {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.success && data.token) {
      setStoredAuth(data.token, data.refreshToken, data.data || {});
    }
    return data;
  },

  updateUserProfile: async (profileData) => {
    // profileData: { firstName, lastName, email }
    const data = await request('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    if (data.success && data.data) {
      const currentAuth = getStoredAuth();
      const updatedUser = {
        ...(currentAuth.user || {}),
        ...data.data,
        firstName: data.data.firstName || (data.data.name ? data.data.name.split(' ')[0] : profileData.firstName),
        lastName: data.data.lastName || (data.data.name ? data.data.name.split(' ').slice(1).join(' ') : profileData.lastName),
        email: data.data.email || profileData.email,
        name: data.data.name || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim()
      };
      setStoredAuth(currentAuth.token, currentAuth.refreshToken, updatedUser);
    }
    return data;
  },

  // Legacy fallback
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
