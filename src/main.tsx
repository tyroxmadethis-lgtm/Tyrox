import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './services/apiMock.ts';
import './services/supabaseClient.ts';
import App from './App.tsx';
import './index.css';

// Safe browser environment polyfills for Vercel/Vite compatibility
if (typeof window !== 'undefined') {
  // 1. Augment window.env
  (window as any).env = (window as any).env || {};
  (window as any).env.NEXT_PUBLIC_SUPABASE_URL = (window as any).env.NEXT_PUBLIC_SUPABASE_URL || (import.meta as any).env.NEXT_PUBLIC_SUPABASE_URL;
  (window as any).env.NEXT_PUBLIC_SUPABASE_ANON_KEY = (window as any).env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (import.meta as any).env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 2. Augment process.env to prevent ReferenceErrors or undefined crashes in external scripts
  const processEnv = {
    NEXT_PUBLIC_SUPABASE_URL: (import.meta as any).env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: (import.meta as any).env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NODE_ENV: (import.meta as any).env.MODE,
  };
  
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = { env: processEnv };
  } else {
    (window as any).process.env = {
      ...processEnv,
      ...(window as any).process.env
    };
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
