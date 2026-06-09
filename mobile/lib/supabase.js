// Re-export the shared Supabase data layer for the mobile web app.
//
// The mobile app may dynamically import "./lib/supabase.js" from /mobile/.
// This bridge keeps that URL valid while reusing the existing implementation
// from /web/lib/supabase.js.

export * from '../../web/lib/supabase.js';
