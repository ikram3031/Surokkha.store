import { SITE_CONFIG } from '../config/siteConfig';

// Customer accounts live in the same collection as SurokkhaStore's (the backend's /customer-auth routes),
// so an account made on either site works on both.
const API_BASE_URL = (SITE_CONFIG.apiBaseUrl || 'https://api.surokkha.store').replace(/\/$/, '');
const AUTH_URL = `${API_BASE_URL}/api/v1/customer-auth`;
const TOKEN_KEY = 'surokkha-customer-token';
// Fired on window whenever the customer logs in or out, so the header can refresh
export const SESSION_EVENT = 'surokkha-customer-session';

export const getCustomerToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const setCustomerToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked (private mode): the session then lasts until the page closes */
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
};

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${AUTH_URL}${path}?lang=en`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error(data?.message || 'Something went wrong. Please try again.');
    err.status = res.status;
    throw err;
  }
  return data;
}

const startSession = (res) => {
  setCustomerToken(res.data.accessToken);
  return res.data.customer;
};

export const registerCustomer = async (payload) => startSession(await request('/register', { method: 'POST', body: payload }));
export const loginCustomer = async (payload) => startSession(await request('/login', { method: 'POST', body: payload }));
export const forgotPassword = (email) => request('/forgot-password', { method: 'POST', body: { email } });
export const resetPassword = async (payload) => startSession(await request('/reset-password', { method: 'POST', body: payload }));

/** The logged-in customer, or null when there is no valid session (a stale token is dropped). */
export const fetchCurrentCustomer = async () => {
  const token = getCustomerToken();
  if (!token) return null;
  try {
    const res = await request('/me', { token });
    return res.data.customer;
  } catch (err) {
    // Only an auth failure ends the session; a network blip keeps the token
    if (err.status === 401 || err.status === 403) setCustomerToken(null);
    return null;
  }
};

export const logoutCustomer = () => setCustomerToken(null);
