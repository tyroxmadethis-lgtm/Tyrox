/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

// AUTOMATED BRIDGE INITIALIZATION (Hardcoded to bypass AI Studio variables)
// REASON: Placing your project keys directly into the code forces your website's
// data pipeline to open immediately, removing the "Cloud Disconnected" error.
export const SUPABASE_PROJECT_URL = (window as any).env?.NEXT_PUBLIC_SUPABASE_URL || (typeof process !== "undefined" ? (process as any).env?.NEXT_PUBLIC_SUPABASE_URL : "") || "https://supabase.co";

// Paste your long encrypted 'anon' / 'public' token string inside these quotes
export const SUPABASE_ANON_KEY = (window as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || (typeof process !== "undefined" ? (process as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : "") || "PASTE_YOUR_LONG_ANON_PUBLIC_KEY_HERE";

// Handshake bridge to expose createClient directly on the window object
(window as any).supabase = { createClient };

// Connect your custom standalone builder engine natively
export const supabase = (SUPABASE_PROJECT_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== "PASTE_YOUR_LONG_ANON_PUBLIC_KEY_HERE") 
  ? createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY) 
  : null;

console.log("[Supabase Client Core] Initialized. Status:", SUPABASE_PROJECT_URL ? "Exposed" : "Pending Credentials", supabase ? "Client Loaded" : "Client Null");

