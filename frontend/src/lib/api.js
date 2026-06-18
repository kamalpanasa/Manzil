import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function request(path, { method = 'GET', body } = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('You must be logged in to do that.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

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
  return request('/api/itinerary/generate', {
    method: 'POST',
    body: { source, destination, days, budget, interests },
  });
}

export function getLatestItinerary() {
  return request('/api/itinerary/latest', { method: 'GET' });
}

export function getChatHistory() {
  return request('/api/chat/history', { method: 'GET' });
}

export function sendChatMessage(message) {
  return request('/api/chat/send', {
    method: 'POST',
    body: { message },
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
