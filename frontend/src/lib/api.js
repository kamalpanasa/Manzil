import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function forceSignOut() {
  try { await supabase.auth.signOut(); } catch {}
}

async function getValidSession() {
  let { data: { session } } = await supabase.auth.getSession();

  if (!session) return null;

  const expiresAt = session.expires_at;
  const nowSecs = Math.floor(Date.now() / 1000);
  const isExpiredOrClose = !expiresAt || expiresAt - nowSecs < 60;

  if (isExpiredOrClose) {
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (!error && refreshed.session) return refreshed.session;
    await forceSignOut();
    return null;
  }

  return session;
}

async function doFetch(path, token, method, body, extraHeaders) {
  return fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function request(path, { method = 'GET', body, extraHeaders = {} } = {}) {
  let session = await getValidSession();

  if (!session) {
    throw new Error('You must be logged in to do that.');
  }

  let response = await doFetch(path, session.access_token, method, body, extraHeaders);

  if (response.status === 401) {
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (!error && refreshed.session) {
      session = refreshed.session;
      response = await doFetch(path, session.access_token, method, body, extraHeaders);
    } else {
      await forceSignOut();
      throw new Error('Your session has expired. Please log in again.');
    }
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      detail = errorBody.detail || detail;
    } catch {
      // keep generic message
    }
    throw new Error(detail);
  }

  return response.json();
}

export function generateItinerary({ source, destination, days, budget, interests }) {
  const extraHeaders = {};
  const groqKey = localStorage.getItem('manzil_groq_key');
  if (groqKey) extraHeaders['X-Groq-Key'] = groqKey;

  return request('/api/itinerary/generate', {
    method: 'POST',
    body: { source, destination, days, budget, interests },
    extraHeaders,
  });
}

export function getLatestItinerary() {
  return request('/api/itinerary/latest', { method: 'GET' });
}

export function getChatHistory() {
  return request('/api/chat/history', { method: 'GET' });
}

export function sendChatMessage(message) {
  const extraHeaders = {};
  const groqKey = localStorage.getItem('manzil_groq_key');
  if (groqKey) extraHeaders['X-Groq-Key'] = groqKey;

  return request('/api/chat/send', {
    method: 'POST',
    body: { message },
    extraHeaders,
  });
}

export function listTrips() {
  return request('/api/itinerary/list', { method: 'GET' });
}

export function updateItinerary(tripId, updatedDays) {
  return request(`/api/itinerary/${tripId}`, {
    method: 'PUT',
    body: updatedDays,
  });
}

export function deleteTrip(tripId) {
  return request(`/api/itinerary/${tripId}`, { method: 'DELETE' });
}

export function getProfileStats() {
  return request('/api/profile/stats', { method: 'GET' });
}
