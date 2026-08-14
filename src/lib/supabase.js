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

    const createChain = () => {
      let queryResult = null;
      let isDelete = false;
      let filterCol = null;
      let filterVal = null;
      let isNeq = false;

      const chain = {
        select() {
          if (!queryResult) {
            queryResult = { data: [...tableData], error: null };
          }
          return this;
        },
        order() { return this; },
        limit() { return this; },
        eq(col, val) {
          filterCol = col;
          filterVal = val;
          isNeq = false;
          return this;
        },
        neq(col, val) {
          filterCol = col;
          filterVal = val;
          isNeq = true;
          return this;
        },
        single() {
          if (queryResult && Array.isArray(queryResult.data)) {
            queryResult.data = queryResult.data[0] ?? null;
          }
          return this;
        },
        insert(rows) {
          const inserted = rows.map(r => ({ id: (Math.random() + 1).toString(36).slice(2), ...r }));
          tableData.push(...inserted);
          queryResult = { data: inserted, error: null };
          return this;
        },
        update(obj) {
          queryResult = { data: [obj], error: null };
          return this;
        },
        upsert(obj) {
          if (table === 'budgets') {
            const index = tableData.findIndex(item => item.id === obj.id);
            if (index > -1) {
              tableData[index] = { ...tableData[index], ...obj };
            } else {
              tableData.push(obj);
            }
          }
          queryResult = { data: [obj], error: null };
          return this;
        },
        delete() {
          isDelete = true;
          return this;
        },
        async then(onFulfilled, onRejected) {
          try {
            if (filterCol && filterVal !== null) {
              if (isDelete) {
                for (let i = tableData.length - 1; i >= 0; i--) {
                  const matches = isNeq 
                    ? tableData[i][filterCol] !== filterVal 
                    : tableData[i][filterCol] === filterVal;
                  if (matches) {
                    tableData.splice(i, 1);
                  }
                }
                queryResult = { data: [], error: null };
              } else if (queryResult && Array.isArray(queryResult.data)) {
                queryResult.data = queryResult.data.filter(item => {
                  return isNeq 
                    ? item[filterCol] !== filterVal 
                    : item[filterCol] === filterVal;
                });
              }
            } else if (isDelete) {
              tableData.length = 0;
              queryResult = { data: [], error: null };
            }

            if (!queryResult) {
              queryResult = { data: [...tableData], error: null };
            }

            return Promise.resolve(queryResult).then(onFulfilled, onRejected);
          } catch (err) {
            return Promise.reject(err).catch(onRejected);
          }
        }
      };
      return chain;
    };

    return createChain();
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
