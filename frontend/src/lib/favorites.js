import { supabase } from './supabaseClient';

export async function listFavorites() {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    // Return empty array if table doesn't exist yet to prevent hard crashes
    if (error.code === 'P0001' || error.message?.includes('does not exist')) {
      console.warn('favorites table does not exist yet. Run SQL schema commands in Supabase.');
      return [];
    }
    throw error;
  }
  return data || [];
}

export async function addFavorite({ type, title, location, image_url, rating, price, description }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to save favorites.');

  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: user.id,
      type,
      title,
      location: location || null,
      image_url: image_url || null,
      rating: rating ? Number(rating) : null,
      price: price ? Number(price) : null,
      description: description || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFavorite(id) {
  const { error } = await supabase.from('favorites').delete().eq('id', id);
  if (error) throw error;
}

const CATEGORY_EMOJI = {
  'Food & Dining': '🍽️',
  'Cultural': '🏛️',
  'Adventure': '🏔️',
  'Shopping': '🛍️',
  'Nature': '🌿',
  'Nightlife': '🌃',
  'Wellness': '🧘',
  'Transport': '🚌',
};

export async function saveAttraction({ name, description, category, location, cost }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to save attractions.');

  const emoji = CATEGORY_EMOJI[category] || '⭐';

  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: user.id,
      type: 'activity',
      title: name,
      location: location || null,
      image_url: emoji,
      rating: null,
      price: cost != null ? Number(cost) : null,
      description: description || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveTrip({ title, destination, source, days, tripId, totalCost }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to save trips.');

  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: user.id,
      type: 'trip',
      title: title || `${destination} — ${days}-Day Trip`,
      location: source ? `${source} → ${destination}` : destination,
      image_url: '✈️',
      rating: null,
      price: totalCost ? Number(totalCost) : null,
      description: tripId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
