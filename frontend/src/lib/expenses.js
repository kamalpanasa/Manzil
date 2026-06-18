import { supabase } from './supabaseClient';

/**
 * All functions here talk directly to Supabase (not the FastAPI backend) —
 * this is plain CRUD already secured by row-level security, so there's no
 * need for a server hop. Every call is implicitly scoped to the logged-in
 * user because Supabase RLS checks auth.uid() against expenses.user_id.
 */

export async function listExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createExpense({ category, description, amount, expense_date }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to add an expense.');

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      category,
      description: description || null,
      amount,
      expense_date,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateExpense(id, { category, description, amount, expense_date }) {
  const { data, error } = await supabase
    .from('expenses')
    .update({ category, description: description || null, amount, expense_date })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteExpense(id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Pulls the budget figure from the user's most recently generated trip
 * (saved by the AI itinerary feature) so the Budget page has something to
 * compare total spend against. Returns null if the user has no trips yet.
 */
export async function getLatestTripBudget() {
  const { data, error } = await supabase
    .from('trips')
    .select('destination, budget')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
