// Base URL configuration for Arenova API (Production backend: https://api.getarenova.com)
// When running in the browser with relative '/api' or unset, same-origin calls proxy cleanly through
// Vite dev server or Vercel rewrites (eliminating CORS and mixed-content issues).
// If an absolute URL is configured (e.g., https://api.getarenova.com), it seamlessly resolves.
const rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const BASE_URL = (() => {
  if (!rawBase || rawBase === '/api') {
    return typeof window !== 'undefined' ? '' : 'https://api.getarenova.com';
  }
  return rawBase.endsWith('/api') ? rawBase.slice(0, -4) : rawBase;
})();

// Helper to normalize any legacy media/banner URLs from the database
// Converts absolute IP or backend URLs to same-origin relative /api/media/... paths
// to prevent cross-origin CORP blocks (net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin)
const normalizeMediaUrls = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(normalizeMediaUrls);
  const normalized = { ...data };
  for (const key of Object.keys(normalized)) {
    if (typeof normalized[key] === 'string') {
      const val = normalized[key];
      if (val.includes('/api/media/')) {
        // Strip out host and keep same-origin relative path /api/media/...
        normalized[key] = val.substring(val.indexOf('/api/media/'));
      } else if (val.includes('16.112.182.86')) {
        normalized[key] = val.replace(/http:\/\/16\.112\.182\.86/g, 'https://api.getarenova.com');
      }
    } else if (typeof normalized[key] === 'object' && normalized[key] !== null) {
      normalized[key] = normalizeMediaUrls(normalized[key]);
    }
  }
  return normalized;
};


// Local storage helpers for auth state
const STORAGE_KEYS = {
  TOKEN: 'arenova_auth_token',
  REFRESH_TOKEN: 'arenova_refresh_token',
  USER: 'arenova_user_data',
};

export const getStoredAuth = () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
  } catch (e) {
    user = null;
  }

  // Fallback to resolve user ID from JWT token claims if missing in stored user object
  if (token && (!user || (!user._id && !user.id))) {
    try {
      if (token.includes('.')) {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const resolvedId = decoded.id || decoded._id || decoded.userId || decoded.sub || decoded.novareUserId;
        if (resolvedId) {
          user = {
            ...(user || {}),
            _id: resolvedId,
            id: resolvedId,
            phone: user?.phone || decoded.phone || '',
            email: user?.email || decoded.email || '',
            name: user?.name || decoded.name || '',
          };
        }
      }
    } catch (e) {
      // Decode fallback
    }
  }

  return {
    token,
    refreshToken,
    user,
  };
};

export const setStoredAuth = (token, refreshToken, user) => {
  if (token) localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  if (refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  if (user) {
    const rawUserData = user.user || user.data || user;
    let resolvedId = rawUserData._id || rawUserData.id || rawUserData.userId || rawUserData.novareUserId;
    if (!resolvedId && token && token.includes('.')) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        resolvedId = decoded.id || decoded._id || decoded.userId || decoded.sub || decoded.novareUserId;
      } catch (e) {
        // Fallback
      }
    }

    const normalizedUser = {
      ...rawUserData,
      _id: resolvedId || rawUserData._id,
      id: resolvedId || rawUserData.id,
      firstName: rawUserData.firstName || (rawUserData.name ? rawUserData.name.split(' ')[0] : ''),
      lastName: rawUserData.lastName || (rawUserData.name ? rawUserData.name.split(' ').slice(1).join(' ') : ''),
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(normalizedUser));
  }
};

export const clearStoredAuth = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem('arenova_confirmed_registrations');
  localStorage.removeItem('arenova_permanent_uid');
};

// Immediate cleanup of obsolete dummy registration caches
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('arenova_confirmed_registrations');
    localStorage.removeItem('arenova_permanent_uid');
  } catch (e) {
    // Ignore storage access errors
  }
}

// Helper for fetch with Authorization headers and user-friendly error formatting
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const isPublicAuthEndpoint = endpoint.includes('/auth/send-otp') || endpoint.includes('/auth/verify-otp') || endpoint.includes('/auth/register') || endpoint.includes('/auth/verify-email-otp');
  
  const method = (options.method || 'GET').toUpperCase();
  const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const headers = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token && !isPublicAuthEndpoint ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const requestUrl = BASE_URL ? `${BASE_URL}${cleanEndpoint}` : cleanEndpoint;

  let response;
  try {
    response = await fetch(requestUrl, {
      ...options,
      headers,
    });
  } catch (netErr) {
    // If browser experiences a transient network interface switch or connection reset (ERR_NETWORK_CHANGED), retry once
    await new Promise(r => setTimeout(r, 400));
    try {
      response = await fetch(requestUrl, {
        ...options,
        headers,
      });
    } catch (secondErr) {
      throw new Error('Network connection issue. Please check your internet connection and try again.');
    }
  }

  if (!response.ok) {
    let errorMessage = 'Something went wrong';
    let errorData = null;
    try {
      errorData = await response.json();
      const rawText = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);

      if (rawText.includes('E11000') || rawText.toLowerCase().includes('duplicate key')) {
        errorMessage = 'You are already registered for this tournament category.';
      } else if (errorData.errors) {
        if (Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map(err => typeof err === 'string' ? err : err.msg || err.message || JSON.stringify(err)).join(', ');
        } else if (typeof errorData.errors === 'object') {
          errorMessage = Object.values(errorData.errors).map(err => typeof err === 'string' ? err : err.msg || err.message || JSON.stringify(err)).join(', ');
        }
      } else if (errorData.message && typeof errorData.message === 'string') {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = typeof errorData.error === 'string' ? errorData.error : (errorData.error.message || errorMessage);
      }

      // Sanitize raw MongoDB or internal server details from leaking into UI
      if (errorMessage.includes('E11000') || errorMessage.includes('ObjectId(') || errorMessage.includes('duplicate key')) {
        errorMessage = 'You are already registered for this tournament category.';
      }
    } catch (e) {
      // Ignored
    }

    const err = new Error(errorMessage);
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  const result = await response.json();
  return normalizeMediaUrls(result);
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
    // If updating email, route via /api/auth/complete-profile since /api/users/me only handles non-sensitive fields
    if (profileData.email) {
      return api.completeProfile(profileData);
    }
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
    // Backend endpoint: PUT /api/auth/complete-profile { firstName, lastName, email, address }
    const cleanPayload = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      ...(payload.address ? { address: payload.address } : {})
    };
    const data = await request('/api/auth/complete-profile', {
      method: 'PUT',
      body: JSON.stringify(cleanPayload),
    });

    if (data.success && data.data) {
      const currentAuth = getStoredAuth();
      const user = data.data;
      const updatedUser = {
        ...(currentAuth.user || {}),
        ...user,
        firstName: user.firstName || payload.firstName,
        lastName: user.lastName || payload.lastName,
        email: user.email || payload.email,
        name: user.name || `${payload.firstName || ''} ${payload.lastName || ''}`.trim()
      };
      setStoredAuth(currentAuth.token, currentAuth.refreshToken, updatedUser);
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
    if (!registrationId) {
      throw new Error('Valid tournament registration ID is required to verify payment.');
    }
    return request(`/api/novare/registrations/${registrationId}/verify-payment`, {
      method: 'POST',
      body: JSON.stringify(paymentDetails),
    });
  },

  getMyRegistrations: async () => {
    // Pure backend database fetch - returns confirmed registrations directly from MongoDB
    const res = await request('/api/novare/registrations/my');
    const rawList = res?.data || res?.registrations || (Array.isArray(res) ? res : []);
    const list = Array.isArray(rawList) ? rawList : [];
    return {
      success: true,
      data: list,
      count: list.length
    };
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

  // Invoices (https://api.getarenova.com/api-docs/#/Invoices)
  getMyInvoices: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.type) query.append('type', params.type);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/api/invoices/my${queryString}`);
  },

  getInvoiceById: async (id) => {
    return request(`/api/invoices/${id}`);
  },

  downloadInvoice: async (id) => {
    return request(`/api/invoices/${id}/download`);
  },
};
