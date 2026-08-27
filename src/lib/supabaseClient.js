import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from local storage or environment
const getSupabaseConfig = () => {
  const storedUrl = localStorage.getItem('ctrl_supabase_url');
  const storedKey = localStorage.getItem('ctrl_supabase_anon_key');
  
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return {
    url: storedUrl || envUrl || 'https://xggcznnaoneibpyvtgfv.supabase.co',
    key: storedKey || envKey || ''
  };
};

const config = getSupabaseConfig();

export const supabase = createClient(config.url, config.key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const isSupabaseConfigured = () => {
  const { url, key } = getSupabaseConfig();
  return url && key && url !== 'https://demo-ctrl-construction.supabase.co';
};

export const saveSupabaseConfig = (url, key) => {
  if (url) localStorage.setItem('ctrl_supabase_url', url);
  if (key) localStorage.setItem('ctrl_supabase_anon_key', key);
  window.location.reload();
};
