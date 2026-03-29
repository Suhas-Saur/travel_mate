// src/lib/dataStore.js
// Simple wrapper around Supabase for travel memories
import { supabase } from './supabase';

/**
 * Helper to get the current logged-in username.
 */
function getCurrentUsername() {
  return localStorage.getItem('travel_username');
}

/**
 * CUSTOM AUTH: Sign In with Username/Password
 */
export async function signIn(username, password) {
  const { data, error } = await supabase
    .from('travel_users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error || !data) {
    throw new Error('Invalid username or password');
  }

  localStorage.setItem('travel_username', username);
  return data;
}

/**
 * CUSTOM AUTH: Sign Up with Username/Password
 */
export async function signUp(username, password) {
  // Check if exists
  const { data: existing } = await supabase
    .from('travel_users')
    .select('username')
    .eq('username', username)
    .single();

  if (existing) throw new Error('Username already taken');

  const { data, error } = await supabase
    .from('travel_users')
    .insert([{ username, password }])
    .select();

  if (error) throw error;
  localStorage.setItem('travel_username', username);
  return data[0];
}

/**
 * CUSTOM AUTH: Sign Out
 */
export function signOut() {
  localStorage.removeItem('travel_username');
  window.location.reload();
}

/**
 * Fetch all memories for the current user.
 */
export async function fetchMemories() {
  const username = getCurrentUsername();
  if (!username) return [];

  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('username', username);
  
  if (error) {
    console.error('Error fetching memories:', error);
    return [];
  }
  return data;
}

/**
 * Add a new memory record for the current user.
 */
export async function addMemory(memory) {
  const username = getCurrentUsername();
  if (!username) return null;

  const { data, error } = await supabase
    .from('memories')
    .insert([{ ...memory, username }])
    .select();
    
  if (error) {
    console.error('Error adding memory:', error);
    return null;
  }
  return data[0];
}

/**
 * Delete a memory by id (restricted to current user).
 */
export async function deleteMemory(id) {
  const username = getCurrentUsername();
  if (!username) return false;

  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', id)
    .eq('username', username);
    
  if (error) {
    console.error('Error deleting memory:', error);
    return false;
  }
  return true;
}
/**
 * Upload a file to Supabase Storage and return the public URL.
 * @param {File} file - The file object to upload.
 */
export async function uploadFile(file) {
  if (!file) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `user_uploads/${fileName}`;

  const { data, error } = await supabase.storage
    .from('memories')
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading file:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('memories')
    .getPublicUrl(filePath);

  console.log('File uploaded. Public URL:', publicUrl);
  return publicUrl;
}
/**
 * Update the favorite status (restricted to current user).
 */
export async function toggleFavorite(id, is_favorite) {
  const username = getCurrentUsername();
  if (!username) return null;

  const { data, error } = await supabase
    .from('memories')
    .update({ is_favorite })
    .eq('id', id)
    .eq('username', username)
    .select();
    
  if (error) {
    console.error('Error toggling favorite:', error);
    return null;
  }
  return data[0];
}

/**
 * Fetch all future plans for the current user.
 */
export async function fetchFuturePlans() {
  const username = getCurrentUsername();
  if (!username) return [];

  const { data, error } = await supabase
    .from('future_plans')
    .select('*')
    .eq('username', username)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching future plans:', error);
    return [];
  }
  return data;
}

/**
 * Add a new future plan.
 */
export async function addFuturePlan(plan) {
  const username = getCurrentUsername();
  if (!username) return null;

  const { data, error } = await supabase
    .from('future_plans')
    .insert([{ ...plan, username }])
    .select();
    
  if (error) {
    console.error('Error adding future plan:', error);
    return null;
  }
  return data[0];
}

/**
 * Delete a future plan.
 */
export async function deleteFuturePlan(id) {
  const username = getCurrentUsername();
  if (!username) return false;

  const { error } = await supabase
    .from('future_plans')
    .delete()
    .eq('id', id)
    .eq('username', username);
    
  if (error) {
    console.error('Error deleting future plan:', error);
    return false;
  }
  return true;
}

/**
 * Fetch all expenses for current user.
 */
export async function fetchExpenses() {
  const username = getCurrentUsername();
  if (!username) return [];

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('username', username)
    .order('date', { ascending: false });
    
  if (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }
  return data;
}

/**
 * Add a new expense.
 */
export async function addExpense(expense) {
  const username = getCurrentUsername();
  if (!username) return null;

  const { data, error } = await supabase
    .from('expenses')
    .insert([{ ...expense, username }])
    .select();
    
  if (error) {
    console.error('Error adding expense:', error);
    return null;
  }
  return data[0];
}

/**
 * Delete an expense by id.
 */
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

/**
 * Fetch the current user's budget.
 */
export async function fetchBudget() {
  const username = getCurrentUsername();
  if (!username) return 5000;

  const { data, error } = await supabase
    .from('budgets')
    .select('amount')
    .eq('username', username)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return 5000; // No budget set yet
    console.error('Error fetching budget:', error);
    return 5000;
  }
  return data.amount;
}

/**
 * Update the budget for current user.
 */
export async function updateBudget(amount) {
  const username = getCurrentUsername();
  if (!username) return false;

  const { data, error } = await supabase
    .from('budgets')
    .upsert({ 
      username, 
      amount, 
      updated_at: new Date().toISOString() 
    }, { onConflict: 'username' })
    .select();
    
  if (error) {
    console.error('Error updating budget:', error);
    return false;
  }
  return true;
}

/**
 * Fetch all itinerary events for the current day.
 */
export async function fetchItinerary() {
  const username = getCurrentUsername();
  if (!username) return [];

  const { data, error } = await supabase
    .from('itinerary')
    .select('*')
    .eq('username', username)
    .order('time', { ascending: true });
    
  if (error) {
    console.error('Error fetching itinerary:', error);
    return [];
  }
  return data;
}

/**
 * Add a new itinerary event.
 */
export async function addItinerary(event) {
  const username = getCurrentUsername();
  if (!username) return null;

  const { data, error } = await supabase
    .from('itinerary')
    .insert([{ ...event, username }])
    .select();
    
  if (error) {
    console.error('Error adding itinerary event:', error);
    return null;
  }
  return data[0];
}

/**
 * Delete an itinerary event by id.
 */
export async function deleteItinerary(id) {
  const username = getCurrentUsername();
  if (!username) return false;

  const { error } = await supabase
    .from('itinerary')
    .delete()
    .eq('id', id)
    .eq('username', username);
    
  if (error) {
    console.error('Error deleting itinerary event:', error);
    return false;
  }
  return true;
}

/**
 * RESET ALL DATA for the current user.
 */
export async function resetUserData() {
  const username = getCurrentUsername();
  if (!username) return false;

  try {
    await Promise.all([
      resetMemories(),
      resetItinerary(),
      resetExpenses(),
      resetFuturePlans(),
      supabase.from('budgets').delete().eq('username', username)
    ]);
    return true;
  } catch (err) {
    console.error('Full Reset Failed:', err);
    return false;
  }
}

export async function resetMemories() {
  const username = getCurrentUsername();
  return await supabase.from('memories').delete().eq('username', username);
}

export async function resetItinerary() {
  const username = getCurrentUsername();
  return await supabase.from('itinerary').delete().eq('username', username);
}

export async function resetExpenses() {
  const username = getCurrentUsername();
  return await supabase.from('expenses').delete().eq('username', username);
}

export async function resetFuturePlans() {
  const username = getCurrentUsername();
  return await supabase.from('future_plans').delete().eq('username', username);
}
