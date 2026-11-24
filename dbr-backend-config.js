/*
 * Backend configuration for DBR Complete Auto Centre.
 *
 * Fill in ONE provider below, then set `provider` to "supabase" or "firebase".
 * Leaving `provider` as "none" keeps the site working in local/offline demo mode:
 * reviews and bookings are queued in localStorage until a backend is configured.
 *
 * Never put a service-role/secret key here. Only public anon/web keys belong in
 * front-end code, and both Supabase RLS and Firebase rules must be configured.
 */
window.DBR_BACKEND_CONFIG = {
  provider: "none", // "none" | "supabase" | "firebase"

  supabase: {
    url: "https://YOUR-PROJECT.supabase.co",
    anonKey: "YOUR-PUBLIC-ANON-KEY",
    reviewsTable: "dbr_reviews",
    bookingsTable: "dbr_bookings"
  },

  firebase: {
    // Realtime Database REST endpoint, e.g.
    // https://YOUR-PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app
    databaseURL: "",
    reviewsPath: "dbr_reviews",
    bookingsPath: "dbr_bookings"
  },

  // Optional: also push to the existing legacy Firebase RTDB URL on page load.
  legacySyncUrl: "https://dbrcenter-fc588-default-rtdb.firebaseio.com"
};
