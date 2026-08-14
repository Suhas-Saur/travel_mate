// src/lib/dataStore.js
// Supabase wrapper for travel memories — no auth required
import { supabase } from './supabase';

// ─── MEMORIES ───────────────────────────────────────────────────────────────

export async function fetchMemories() {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching memories:', error);
    return [];
  }
  return data || [];
}

export async function addMemory(memory) {
  const { data, error } = await supabase
    .from('memories')
    .insert([memory])
    .select();

  if (error) {
    console.error('Error adding memory:', error);
    return null;
  }
  return data[0];
}

export async function deleteMemory(id) {
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting memory:', error);
    return false;
  }
  return true;
}

export async function toggleFavorite(id, is_favorite) {
  const { data, error } = await supabase
    .from('memories')
    .update({ is_favorite })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error toggling favorite:', error);
    return null;
  }
  return data[0];
}

export async function resetMemories() {
  const { error } = await supabase.from('memories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error('Error resetting memories:', error);
}

// ─── FILE UPLOAD ─────────────────────────────────────────────────────────────

export async function uploadFile(file) {
  if (!file) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `user_uploads/${fileName}`;

  const { error } = await supabase.storage
    .from('memories')
    .upload(filePath, file, { upsert: false });

  if (error) {
    console.error('Error uploading file:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('memories')
    .getPublicUrl(filePath);

  return publicUrl;
}

// ─── FUTURE PLANS ────────────────────────────────────────────────────────────

export async function fetchFuturePlans() {
  const { data, error } = await supabase
    .from('future_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching future plans:', error);
    return [];
  }
  return data || [];
}

export async function addFuturePlan(plan) {
  const { data, error } = await supabase
    .from('future_plans')
    .insert([plan])
    .select();

  if (error) {
    console.error('Error adding future plan:', error);
    return null;
  }
  return data[0];
}

export async function deleteFuturePlan(id) {
  const { error } = await supabase
    .from('future_plans')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting future plan:', error);
    return false;
  }
  return true;
}

export async function resetFuturePlans() {
  const { error } = await supabase.from('future_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error('Error resetting future plans:', error);
}

// ─── EXPENSES ────────────────────────────────────────────────────────────────

export async function fetchExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }
  return data || [];
}

export async function addExpense(expense) {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select();

  if (error) {
    console.error('Error adding expense:', error);
    return null;
  }
  return data[0];
}

export async function deleteExpense(id) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting expense:', error);
    return false;
  }
  return true;
}

export async function resetExpenses() {
  const { error } = await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error('Error resetting expenses:', error);
}

// ─── BUDGET ──────────────────────────────────────────────────────────────────

export async function fetchBudget() {
  const { data, error } = await supabase
    .from('budgets')
    .select('amount')
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return 5000;
    console.error('Error fetching budget:', error);
    return 5000;
  }
  return data?.amount ?? 5000;
}

export async function updateBudget(amount) {
  // Use a fixed id so upsert always updates the same row
  const { error } = await supabase
    .from('budgets')
    .upsert({ id: 1, amount, updated_at: new Date().toISOString() }, { onConflict: 'id' });

  if (error) {
    console.error('Error updating budget:', error);
    return false;
  }
  return true;
}

// ─── ITINERARY ───────────────────────────────────────────────────────────────

export async function fetchItinerary() {
  const { data, error } = await supabase
    .from('itinerary')
    .select('*')
    .order('time', { ascending: true });

  if (error) {
    console.error('Error fetching itinerary:', error);
    return [];
  }
  return data || [];
}

export async function addItinerary(event) {
  const { data, error } = await supabase
    .from('itinerary')
    .insert([event])
    .select();

  if (error) {
    console.error('Error adding itinerary event:', error);
    return null;
  }
  return data[0];
}

export async function deleteItinerary(id) {
  const { error } = await supabase
    .from('itinerary')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting itinerary event:', error);
    return false;
  }
  return true;
}

export async function resetItinerary() {
  const { error } = await supabase.from('itinerary').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error('Error resetting itinerary:', error);
}

// ─── FULL RESET ───────────────────────────────────────────────────────────────

export async function resetUserData() {
  try {
    await Promise.all([
      resetMemories(),
      resetItinerary(),
      resetExpenses(),
      resetFuturePlans(),
      supabase.from('budgets').delete().neq('id', 0)
    ]);
    return true;
  } catch (err) {
    console.error('Full Reset Failed:', err);
    return false;
  }
}

// ─── LEGACY STUBS (kept so nothing breaks) ───────────────────────────────────

export async function signIn() {}
export async function signUp() {}
export function signOut() { window.location.reload(); }
