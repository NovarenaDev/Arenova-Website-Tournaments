const rawBase = (import.meta.env.VITE_API_BASE_URL || 'https://api.getarenova.com').trim().replace(/\/+$/, '');
const BASE_URL = (() => {
  if (!rawBase || rawBase === '/api') {
    return 'https://api.getarenova.com';
  }
  return rawBase.endsWith('/api') ? rawBase.slice(0, -4) : rawBase;
})();

const normalizeMediaUrls = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(normalizeMediaUrls);
  const normalized = { ...data };
  for (const key of Object.keys(normalized)) {
    if (typeof normalized[key] === 'string') {
      const val = normalized[key];
      if (val.includes('/api/media/')) {
        const path = val.substring(val.indexOf('/api/media/'));
        normalized[key] = `https://api.getarenova.com${path}`;
      } else if (val.includes('16.112.182.86')) {
        normalized[key] = val.replace(/http:\/\/16\.112\.182\.86/g, 'https://api.getarenova.com');
      }
    } else if (typeof normalized[key] === 'object' && normalized[key] !== null) {
      normalized[key] = normalizeMediaUrls(normalized[key]);
    }
  }
  return normalized;
};

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

if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('arenova_confirmed_registrations');
    localStorage.removeItem('arenova_permanent_uid');
  } catch (e) {

  }
}

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const isPublicAuthEndpoint =
    endpoint.includes('/auth/send-otp') ||
    endpoint.includes('/auth/verify-otp') ||
    endpoint.includes('/auth/coach/send-otp') ||
    endpoint.includes('/auth/coach/verify-otp') ||
    endpoint.includes('/auth/register') ||
    endpoint.includes('/auth/verify-email-otp');

  const method = (options.method || 'GET').toUpperCase();
  const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const headers = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token && !isPublicAuthEndpoint ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const requestUrl = (BASE_URL.endsWith('/api') && cleanEndpoint.startsWith('/api/'))
    ? `${BASE_URL.slice(0, -4)}${cleanEndpoint}`
    : (!cleanEndpoint.startsWith('/api/') && !BASE_URL.endsWith('/api'))
      ? `${BASE_URL}/api${cleanEndpoint}`
      : `${BASE_URL}${cleanEndpoint}`;

  let response;
  try {
    response = await fetch(requestUrl, {
      ...options,
      headers,
    });
  } catch (netErr) {

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
      console.error(`[ARENOVA API ERROR] ${response.status} ${requestUrl}:`, errorData);
      const rawText = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);

      if (
        (rawText.includes('E11000') || rawText.toLowerCase().includes('duplicate key')) &&
        (rawText.includes('novareregistrations') || rawText.includes('categoryName'))
      ) {
        errorMessage = 'You are already registered for this tournament category.';
      } else if (rawText.includes('email_1') || (rawText.includes('E11000') && rawText.includes('email'))) {
        errorMessage = 'This email address is already linked to another account. Please use a unique email address.';
      } else if (rawText.includes('phone_1') || (rawText.includes('E11000') && rawText.includes('phone'))) {
        errorMessage = 'This mobile number is already registered.';
      } else if (errorData.message && typeof errorData.message === 'string') {
        errorMessage = errorData.message;
      } else if (errorData.errors) {
        if (Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map(err => typeof err === 'string' ? err : err.msg || err.message || JSON.stringify(err)).join(', ');
        } else if (typeof errorData.errors === 'object') {
          errorMessage = Object.values(errorData.errors).map(err => typeof err === 'string' ? err : err.msg || err.message || JSON.stringify(err)).join(', ');
        }
      } else if (errorData.error) {
        errorMessage = typeof errorData.error === 'string' ? errorData.error : (errorData.error.message || errorMessage);
      }
    } catch (e) {

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

  getCurrentUser: async () => {
    try {
      const res = await request('/api/users/me');
      const user = res?.data?.user || res?.data || res?.user || res;
      if (user && (user._id || user.id || user.phone || user.email)) {
        const currentAuth = getStoredAuth();
        if (currentAuth.token) {
          setStoredAuth(currentAuth.token, currentAuth.refreshToken, { ...(currentAuth.user || {}), ...user });
        }
      }
      return user;
    } catch (e) {
      try {
        const res = await request('/api/auth/me');
        const user = res?.data?.user || res?.data || res?.user || res;
        if (user && (user._id || user.id || user.phone || user.email)) {
          const currentAuth = getStoredAuth();
          if (currentAuth.token) {
            setStoredAuth(currentAuth.token, currentAuth.refreshToken, { ...(currentAuth.user || {}), ...user });
          }
        }
        return user;
      } catch (err) {
        return null;
      }
    }
  },

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

  sendPhoneOtp: async (phoneOrPayload, purposeParam = 'login') => {
    let phone, purpose;
    if (typeof phoneOrPayload === 'object' && phoneOrPayload !== null) {
      phone = String(phoneOrPayload.phone).trim();
      purpose = phoneOrPayload.purpose || 'login';
    } else {
      phone = String(phoneOrPayload).trim();
      purpose = purposeParam || 'login';
    }

    return request('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, purpose }),
    });
  },

  verifyPhoneOtp: async (payload) => {

    const purpose = payload.purpose || 'login';
    const body = {
      phone: String(payload.phone).trim(),
      otp: String(payload.otp).trim(),
      purpose,
      ...(payload.firstName ? { firstName: String(payload.firstName).trim() } : {}),
      ...(payload.lastName ? { lastName: String(payload.lastName).trim() } : {}),
      ...(payload.role ? { role: String(payload.role).trim() } : {})
    };

    const data = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if ((data.success || data.token) && data.token) {
      setStoredAuth(data.token, data.refreshToken, data.data || {});
    }
    return data;
  },

  sendCoachOtp: async (phoneOrPayload, purposeParam = 'login') => {
    let phone, purpose;
    if (typeof phoneOrPayload === 'object' && phoneOrPayload !== null) {
      phone = String(phoneOrPayload.phone).trim();
      purpose = phoneOrPayload.purpose || 'login';
    } else {
      phone = String(phoneOrPayload).trim();
      purpose = purposeParam || 'login';
    }

    return request('/api/auth/coach/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, purpose }),
    });
  },

  verifyCoachOtp: async (payload) => {

    const purpose = payload.purpose || 'login';
    const body = {
      phone: String(payload.phone).trim(),
      otp: String(payload.otp).trim(),
      purpose,
      ...(payload.name ? { name: String(payload.name).trim() } : {}),
      ...(payload.sports ? { sports: Array.isArray(payload.sports) ? payload.sports : [payload.sports] } : {})
    };

    const data = await request('/api/auth/coach/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if ((data.success || data.token) && data.token) {
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

    const cleanPayload = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      ...(payload.email && typeof payload.email === 'string' && payload.email.trim() ? { email: payload.email.trim() } : {}),
      ...(payload.address ? { address: payload.address } : {})
    };

    let data;
    try {
      data = await request('/api/auth/complete-profile', {
        method: 'PUT',
        body: JSON.stringify(cleanPayload),
      });
    } catch (authErr) {

      const userPayload = {
        firstName: payload.firstName,
        lastName: payload.lastName,
        name: `${payload.firstName || ''} ${payload.lastName || ''}`.trim(),
        ...(payload.address ? { address: payload.address } : {})
      };
      try {
        data = await request('/api/users/me', {
          method: 'PUT',
          body: JSON.stringify(userPayload),
        });
      } catch (userErr) {
        throw authErr;
      }
    }

    const user = data?.data?.user || data?.data || data?.user || data;
    if (user && (user._id || user.id || user.phone || user.email)) {
      const currentAuth = getStoredAuth();
      const updatedUser = {
        ...(currentAuth.user || {}),
        ...user,
        firstName: user.firstName || payload.firstName,
        lastName: user.lastName || payload.lastName,
        email: user.email || (payload.email && payload.email.trim()) || currentAuth.user?.email,
        name: user.name || `${payload.firstName || ''} ${payload.lastName || ''}`.trim()
      };
      setStoredAuth(currentAuth.token, currentAuth.refreshToken, updatedUser);
    }
    return data;
  },

  registerForTournament: async (id, registrationData) => {

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

    const res = await request('/api/novare/registrations/my');
    let list = [];
    if (Array.isArray(res)) {
      list = res;
    } else if (Array.isArray(res?.data)) {
      list = res.data;
    } else if (Array.isArray(res?.data?.registrations)) {
      list = res.data.registrations;
    } else if (Array.isArray(res?.registrations)) {
      list = res.registrations;
    }
    return {
      success: true,
      data: list,
      count: list.length,
      raw: res
    };
  },

  getRegistrationById: async (id) => {
    return request(`/api/novare/registrations/${id}`);
  },

  submitEnquiry: async (enquiryData) => {

    return request('/api/novare/enquiries', {
      method: 'POST',
      body: JSON.stringify(enquiryData),
    });
  },

  getMyInvoices: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.type) query.append('type', params.type);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/api/invoices/my${queryString}`);
    let list = [];
    if (Array.isArray(res)) {
      list = res;
    } else if (Array.isArray(res?.data)) {
      list = res.data;
    } else if (Array.isArray(res?.data?.invoices)) {
      list = res.data.invoices;
    } else if (Array.isArray(res?.invoices)) {
      list = res.invoices;
    }
    return {
      success: true,
      data: list,
      count: list.length,
      raw: res
    };
  },

  getInvoiceById: async (id) => {
    return request(`/api/invoices/${id}`);
  },

  downloadInvoice: async (id) => {
    return request(`/api/invoices/${id}/download`);
  },
};

