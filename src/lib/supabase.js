import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function createMockClient() {
  const store = new Map();

  function ensureTable(table) {
    if (!store.has(table)) store.set(table, []);
    return store.get(table);
  }

  function from(table) {
    const tableData = ensureTable(table);

    const chain = {
      async select() {
        return { data: [...tableData], error: null };
      },
      order() { return this; },
      async insert(rows) {
        const inserted = rows.map(r => ({ id: (Math.random() + 1).toString(36).slice(2), ...r }));
        tableData.push(...inserted);
        return { data: inserted, error: null };
      },
      async delete() { return { data: [], error: null }; },
      async update(_obj) { return { data: [], error: null }; },
      async upsert(_obj) { return { data: [], error: null }; },
      eq() { return this; },
      neq() { return this; },
      limit() { return this; },
      single() { return { data: tableData[0] ?? null, error: null }; },
      select: async function() { return { data: [...tableData], error: null }; }
    };

    return chain;
  }

  const storage = {
    from() {
      return {
        async upload() { return { error: null }; },
        getPublicUrl(_path) { return { data: { publicUrl: '' } }; }
      };
    }
  };

  return { from, storage };
}

let supabase;
if (import.meta.env.DEV || !supabaseUrl) {
  console.warn('Using in-memory Supabase mock in development. Set VITE_SUPABASE_URL to use a real backend.');
  supabase = createMockClient();
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
