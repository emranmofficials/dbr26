/*
 * Add-ons for DBR Complete Auto Centre.
 * Loaded last, so every feature is safe to remove by deleting its script tag.
 * Each feature is isolated: one failure never blocks the rest of the site.
 */
(function () {
  "use strict";

  function run(name, fn) {
    try { fn(); } catch (e) { console.warn("[dbr:" + name + "]", e); }
  }

  function css(rules) {
    var s = document.createElement("style");
    s.setAttribute("data-dbr-addon", "true");
    s.textContent = rules;
    document.head.appendChild(s);
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ------------------------------------------------------------------ */
  /* 1. Make the existing hidden admin panel reachable with a local PIN  */
  /* ------------------------------------------------------------------ */
  run("admin", function () {
    css([
      ".admin-trigger{display:inline-block!important;margin:10px auto 0;padding:6px 14px;",
      "border:1px solid #ffd1b1;border-radius:999px;background:#fff6ed;color:#c25100;",
      "font-size:12px;font-weight:800;cursor:pointer}",
      ".admin-trigger:hover{background:#ffe7d2}",
      "body.admin-mode #adminPanel.open{display:block}"
    ].join(""));

    function openAdmin() {
      var key = "dbr_admin_pin";
      var saved = localStorage.getItem(key);
      var pin;

      if (!saved) {
        pin = prompt("Set a local admin PIN (at least 4 characters):");
        if (pin === null) return;
        if (pin.length < 4) { alert("Use at least 4 characters."); return; }
        localStorage.setItem(key, pin);
        alert("PIN saved on this device. This is a demo PIN, not server security.");
      } else {
        pin = prompt("Enter admin PIN:");
        if (pin === null) return;
        if (pin !== saved) { alert("Wrong PIN."); return; }
      }

      document.body.classList.add("admin-mode");
      var panel = document.getElementById("adminPanel");
      if (panel) panel.classList.add("open");
      if (typeof window.renderReviews === "function") window.renderReviews();
    }

    var trigger = document.getElementById("adminTrigger");
    if (trigger) trigger.addEventListener("click", openAdmin);

    var nav = document.getElementById("adminNav");
    if (nav) {
      nav.style.display = "";
      nav.addEventListener("click", openAdmin);
    }

    var exit = document.getElementById("adminExit");
    if (exit) {
      exit.addEventListener("click", function () {
        document.body.classList.remove("admin-mode");
      });
    }
  });

  /* ------------------------------------------------------------------ */
  /* 2. Consistent horizontal review carousel on the home page          */
  /* ------------------------------------------------------------------ */
  run("reviews-layout", function () {
    var list = document.getElementById("reviewList");
    if (!list) return;

    css([
      "main #home #reviewList{display:flex!important;flex-direction:row!important;",
      "gap:13px!important;overflow-x:auto!important;overflow-y:hidden!important;",
      "scroll-snap-type:x mandatory!important;scroll-behavior:smooth!important;",
      "padding:8px 3px 15px!important}",
      "main #home #reviewList .dbr-rv,main #home #reviewList .review{",
      "flex:0 0 min(290px,82vw)!important;width:min(290px,82vw)!important;",
      "min-width:0!important;margin:0!important;scroll-snap-align:start}",
      ".dbr-review-nav{display:flex;gap:8px;justify-content:flex-end;margin:0 0 6px}",
      ".dbr-review-nav button{width:36px;height:32px;border-radius:10px;border:1px solid #f5c49b;",
      "background:#fff6ed;color:#df5a00;font-size:19px;font-weight:900;cursor:pointer}"
    ].join(""));

    var controls = document.createElement("div");
    controls.className = "dbr-review-nav";
    controls.innerHTML = '<button type="button" aria-label="Previous review">‹</button>' +
      '<button type="button" aria-label="Next review">›</button>';
    list.parentNode.insertBefore(controls, list);

    controls.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var card = list.querySelector(".dbr-rv,.review");
      var step = (card ? card.getBoundingClientRect().width : 290) + 13;
      list.scrollBy({ left: btn.textContent === "›" ? step : -step, behavior: "smooth" });
    });
  });

  /* ------------------------------------------------------------------ */
  /* 3. Search inside the service directory                             */
  /* ------------------------------------------------------------------ */
  run("service-search", function () {
    var box = document.querySelector("#services .services");
    if (!box || !box.parentNode) return;

    css(".dbr-service-search{width:100%;max-width:420px;margin:0 0 14px;padding:11px 14px;" +
      "border:1px solid #ffd1b1;border-radius:12px;background:#fffaf5;color:#3a2a20;" +
      "font-size:14px;box-shadow:inset 1px 1px 3px #ffe9d8}");

    var input = document.createElement("input");
    input.type = "search";
    input.className = "field dbr-service-search";
    input.placeholder = "Search a service…";
    input.setAttribute("aria-label", "Search services");
    box.parentNode.insertBefore(input, box);

    input.addEventListener("input", function () {
      var q = input.value.toLowerCase().trim();
      Array.prototype.forEach.call(box.querySelectorAll(".service"), function (card) {
        var title = (card.querySelector("h3") || { textContent: "" }).textContent.toLowerCase();
        var titleMatch = !q || title.indexOf(q) > -1;
        var visibleItems = 0;

        Array.prototype.forEach.call(card.querySelectorAll("li"), function (li) {
          var match = !q || li.textContent.toLowerCase().indexOf(q) > -1;
          li.style.display = match ? "" : "none";
          if (match) visibleItems += 1;
        });

        card.style.display = (titleMatch || visibleItems) ? "" : "none";
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /* 4. Fixed-price calculator                                          */
  /* ------------------------------------------------------------------ */
  run("price-calculator", function () {
    var host = document.querySelector("#services .dbr-fixed-prices");
    if (!host || !window.DBR_DEFAULTS || !Array.isArray(window.DBR_DEFAULTS.prices)) return;

    var groups = window.DBR_DEFAULTS.prices;
    try {
      var saved = JSON.parse(localStorage.getItem("dbr_content_v1") || "null");
      if (saved && Array.isArray(saved.prices)) groups = saved.prices;
    } catch (e) { /* use defaults */ }

    css([
      ".dbr-calc{margin-top:16px;border:1px solid #ffd1b1;border-radius:14px;",
      "background:#fffdfb;padding:12px 14px;box-shadow:0 4px 10px #c8a78a33}",
      ".dbr-calc summary{cursor:pointer;color:#c25100;font-weight:800;font-size:14px}",
      ".dbr-calc-body{display:grid;gap:8px;margin-top:10px}",
      ".dbr-calc select,.dbr-calc input{width:100%;padding:9px 10px;border:1px solid #ffd1b1;",
      "border-radius:10px;background:white;color:#3a2a20;font-size:13px}",
      ".dbr-calc-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
      ".dbr-calc-total{padding:10px;border-radius:10px;background:#fff1e3;color:#b64800;",
      "font-size:18px;font-weight:900;text-align:center}",
      ".dbr-calc-note{font-size:11px;color:#8a6b58;line-height:1.5}",
      ".dbr-calc-book{width:100%;padding:10px;border:0;border-radius:10px;background:#f66a00;",
      "color:white;font-weight:800;cursor:pointer}"
    ].join(""));

    var el = document.createElement("details");
    el.className = "dbr-calc";
    el.innerHTML =
      "<summary>🧮 Price calculator</summary>" +
      '<div class="dbr-calc-body">' +
        '<select class="dbr-calc-service" aria-label="Choose a service"><option value="">Choose a service…</option></select>' +
        '<div class="dbr-calc-row">' +
          '<select class="dbr-calc-variant" aria-label="Choose a price option"></select>' +
          '<input class="dbr-calc-qty" type="number" min="1" max="99" value="1" aria-label="Quantity">' +
        "</div>" +
        '<output class="dbr-calc-total">৳0</output>' +
        '<p class="dbr-calc-note"></p>' +
        '<button class="dbr-calc-book" type="button">Enquire / Book this service →</button>' +
      "</div>";
    host.appendChild(el);

    var serviceSel = el.querySelector(".dbr-calc-service");
    var variantSel = el.querySelector(".dbr-calc-variant");
    var qty = el.querySelector(".dbr-calc-qty");
    var total = el.querySelector(".dbr-calc-total");
    var note = el.querySelector(".dbr-calc-note");
    var bookBtn = el.querySelector(".dbr-calc-book");
    var currentRow = null;

    groups.forEach(function (group, gi) {
      var og = document.createElement("optgroup");
      og.label = group.title;
      (group.rows || []).forEach(function (row, ri) {
        var opt = document.createElement("option");
        opt.value = gi + "." + ri;
        opt.textContent = row.name;
        og.appendChild(opt);
      });
      serviceSel.appendChild(og);
    });

    function amounts(text) {
      var matches = String(text || "").match(/\d[\d,]*/g) || [];
      return matches.map(function (n) { return Number(n.replace(/,/g, "")); })
        .filter(function (n) { return n > 0; });
    }

    function update() {
      var values = currentRow ? amounts(currentRow.price) : [];
      variantSel.innerHTML = values.length
        ? values.map(function (n, i) {
            return '<option value="' + n + '">' + (values.length > 1 ? "Option " + (i + 1) + " · " : "") + "৳" + n.toLocaleString("en-US") + "</option>";
          }).join("")
        : '<option value="0">Price on request</option>';

      var price = Number(variantSel.value || 0);
      var count = Math.max(1, Math.min(99, Number(qty.value) || 1));
      qty.value = count;
      total.textContent = "৳" + (price * count).toLocaleString("en-US");
      note.textContent = currentRow && currentRow.note ? currentRow.note : "";
    }

    serviceSel.addEventListener("change", function () {
      var parts = serviceSel.value.split(".");
      currentRow = serviceSel.value && groups[+parts[0]] ? groups[+parts[0]].rows[+parts[1]] : null;
      update();
    });
    variantSel.addEventListener("change", update);
    qty.addEventListener("input", update);
    bookBtn.addEventListener("click", function () {
      if (!currentRow) { alert("Choose a service first."); return; }
      if (typeof window.openBooking === "function") window.openBooking(currentRow.name);
    });
  });

  /* ------------------------------------------------------------------ */
  /* 5. FAQ block on the home page                                       */
  /* ------------------------------------------------------------------ */
  run("faq", function () {
    var home = document.getElementById("home");
    if (!home || home.querySelector(".dbr-faq")) return;

    css([
      ".dbr-faq h2.title{font-size:22px}",
      ".dbr-faq details{border:1px solid #ffe0c7;border-radius:12px;background:#fffaf5;",
      "margin:8px 0;padding:10px 14px}",
      ".dbr-faq summary{cursor:pointer;color:#c25100;font-weight:800;font-size:14px}",
      ".dbr-faq p{margin:8px 0 2px;font-size:13px;line-height:1.6;color:#4a382c}"
    ].join(""));

    var faq = document.createElement("section");
    faq.className = "wrap dbr-faq";
    faq.innerHTML = [
      '<h2 class="title">Frequently Asked Questions</h2>',
      '<details><summary>How do I book a service?</summary><p>Tap Book Now, fill in your car details and we will receive your request on WhatsApp. Booking is confirmed after our team replies.</p></details>',
      '<details><summary>What are the opening hours?</summary><p>Saturday to Thursday, 10:00 AM – 9:00 PM. The workshop is closed on Friday.</p></details>',
      '<details><summary>Do you service hybrid and dual-clutch cars?</summary><p>Yes. We handle hybrid servicing, dual-clutch systems, diagnostics, engine and gearbox repairs.</p></details>',
      '<details><summary>Are the listed prices final?</summary><p>Prices are guide rates in BDT. Some jobs such as wheel balancing depend on parts or weight, so we confirm the final amount before starting work.</p></details>',
      '<details><summary>Where is the workshop?</summary><p>Malgram, Bogura, Bangladesh. Use the Google Maps link on this page for directions.</p></details>'
    ].join("");
    home.appendChild(faq);
  });

  /* ------------------------------------------------------------------ */
  /* 6. Send reviews and bookings to the configured backend             */
  /* ------------------------------------------------------------------ */
  run("backend-hooks", function () {
    var api = window.DBR_BACKEND;
    if (!api) return;

    var val = function (id) {
      var el = document.getElementById(id);
      return el ? String(el.value || "").trim() : "";
    };

    var booking = document.getElementById("bookingForm");
    if (booking) {
      booking.addEventListener("submit", function () {
        api.saveBooking({
          name: val("bkName"), phone: val("bkPhone"), car: val("bkCar"),
          service: val("bkService"), date: val("bkDate"), time: val("bkTime"),
          note: val("bkNote"), source: "website"
        });
      }, true);
    }

    var review = document.getElementById("reviewForm");
    if (review) {
      review.addEventListener("submit", function () {
        var profile = null;
        try { profile = JSON.parse(localStorage.getItem("dbr_google_profile") || "null"); } catch (e) { /* ignore */ }
        if (!profile || !profile.name) return;
        api.saveReview({
          name: profile.name,
          picture: profile.picture || "",
          sub: profile.sub || "",
          comment: val("comment"),
          rating: document.querySelectorAll("[data-star].sel").length || 5,
          date: new Date().toLocaleDateString(),
          source: "website"
        });
      }, true);
    }

    window.addEventListener("online", function () { api.flush(); });
    api.flush();
  });

  /* ------------------------------------------------------------------ */
  /* 7. PWA install button + service worker                              */
  /* ------------------------------------------------------------------ */
  run("pwa", function () {
    var deferred = null;

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferred = e;
      var btn = document.getElementById("dbrInstall");
      if (btn) btn.hidden = false;
    });

    function addButton() {
      if (document.getElementById("dbrInstall")) return;
      var btn = document.createElement("button");
      btn.id = "dbrInstall";
      btn.type = "button";
      btn.className = "admin-trigger";
      btn.textContent = "↓ Install app";
      btn.hidden = true;
      btn.style.marginLeft = "8px";
      btn.addEventListener("click", function () {
        if (!deferred) return;
        deferred.prompt();
        deferred.userChoice.then(function () { deferred = null; btn.hidden = true; });
      });
      var admin = document.getElementById("adminTrigger");
      if (admin && admin.parentNode) admin.parentNode.insertBefore(btn, admin.nextSibling);
    }
    addButton();

    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(function () { /* offline support optional */ });
    }
  });
})();
