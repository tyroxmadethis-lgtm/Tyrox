/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Supabase client initialization is entirely disabled as we rely fully on local IndexedDB & mock database storage.
export const SUPABASE_PROJECT_URL = "";
export const SUPABASE_ANON_KEY = "";

(window as any).supabase = null;

export const supabase = null;

console.log("[Supabase Client Core] Disabled. Relying fully on local IndexedDB storage and Mock Backend endpoints.");

