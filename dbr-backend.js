/*
 * Tiny provider-agnostic backend adapter for DBR Complete Auto Centre.
 * Works with Supabase REST or Firebase Realtime Database REST. Falls back to a
 * local queue when no provider is configured, so submissions are never lost.
 */
(function () {
  "use strict";

  var CFG = window.DBR_BACKEND_CONFIG || {};
  var PROVIDER = String(CFG.provider || "none").toLowerCase();
  var QUEUES = {
    reviews: "dbr_queue_reviews",
    bookings: "dbr_queue_bookings"
  };

  function uid() {
    return "dbr_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function readQueue(name) {
    try {
      var v = JSON.parse(localStorage.getItem(QUEUES[name]) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }

  function writeQueue(name, items) {
    try {
      localStorage.setItem(QUEUES[name], JSON.stringify(items));
      return true;
    } catch (e) {
      return false;
    }
  }

  function enqueue(name, payload) {
    var items = readQueue(name);
    items.push(Object.assign({ id: uid(), createdAt: new Date().toISOString() }, payload));
    writeQueue(name, items);
  }

  function configured() {
    if (PROVIDER === "supabase") {
      var s = CFG.supabase || {};
      return /^https:\/\//.test(s.url || "") && !!s.anonKey && s.anonKey !== "YOUR-PUBLIC-ANON-KEY";
    }
    if (PROVIDER === "firebase") {
      var f = CFG.firebase || {};
      return /^https:\/\//.test(f.databaseURL || "");
    }
    return false;
  }

  function endpoint(kind) {
    var isReview = kind === "reviews";
    if (PROVIDER === "supabase") {
      var s = CFG.supabase || {};
      var table = encodeURIComponent(isReview ? (s.reviewsTable || "dbr_reviews") : (s.bookingsTable || "dbr_bookings"));
      return String(s.url).replace(/\/$/, "") + "/rest/v1/" + table;
    }
    if (PROVIDER === "firebase") {
      var f = CFG.firebase || {};
      var path = encodeURIComponent(isReview ? (f.reviewsPath || "dbr_reviews") : (f.bookingsPath || "dbr_bookings"));
      return String(f.databaseURL).replace(/\/$/, "") + "/" + path + ".json";
    }
    return "";
  }

  function headers(kind) {
    if (PROVIDER === "supabase") {
      var s = CFG.supabase || {};
      return {
        apikey: s.anonKey,
        Authorization: "Bearer " + s.anonKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      };
    }
    return { "Content-Type": "application/json" };
  }

  function post(kind, item) {
    if (!configured()) return Promise.resolve({ ok: false, reason: "not-configured" });
    return fetch(endpoint(kind), {
      method: "POST",
      headers: headers(kind),
      body: JSON.stringify(item),
      keepalive: true
    }).then(function (r) {
      return { ok: r.ok, status: r.status };
    }).catch(function (e) {
      return { ok: false, reason: String(e && e.message || e) };
    });
  }

  function fetchAll(kind) {
    if (!configured()) return Promise.resolve([]);
    var url = endpoint(kind);
    if (PROVIDER === "supabase") url += "?select=*";
    return fetch(url, { headers: headers(kind) }).then(function (r) {
      if (!r.ok) return [];
      return r.json();
    }).then(function (data) {
      if (Array.isArray(data)) return data;
      if (data && typeof data === "object") {
        return Object.keys(data).map(function (k) {
          return data[k] && typeof data[k] === "object" ? Object.assign({ _key: k }, data[k]) : { _key: k, value: data[k] };
        });
      }
      return [];
    }).catch(function () {
      return [];
    });
  }

  function flush(kind) {
    if (!configured()) return Promise.resolve({ sent: 0, pending: readQueue(kind).length, reason: "not-configured" });
    var items = readQueue(kind);
    if (!items.length) return Promise.resolve({ sent: 0, pending: 0 });

    var remaining = items.slice();
    var sent = 0;

    function next() {
      if (!remaining.length) {
        writeQueue(kind, remaining);
        return Promise.resolve({ sent: sent, pending: 0 });
      }
      var item = remaining[0];
      return post(kind, item).then(function (res) {
        if (res.ok) {
          sent += 1;
          remaining.shift();
          writeQueue(kind, remaining);
        }
        return next();
      });
    }

    return next();
  }

  function save(kind, payload) {
    enqueue(kind, payload);
    return flush(kind);
  }

  window.DBR_BACKEND = {
    provider: PROVIDER,
    configured: configured,
    queueSize: function (kind) { return readQueue(kind).length; },
    saveReview: function (review) { return save("reviews", review); },
    saveBooking: function (booking) { return save("bookings", booking); },
    loadReviews: function () { return fetchAll("reviews"); },
    loadBookings: function () { return fetchAll("bookings"); },
    flush: function () {
      return Promise.all([flush("reviews"), flush("bookings")]);
    }
  };
})();
