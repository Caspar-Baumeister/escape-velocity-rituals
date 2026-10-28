/* Escape Velocity Rituals: funnel tracking.
   PostHog (EU) runs cookieless: nothing is stored on the device, so no banner is needed for it.
   Meta Pixel only loads after an explicit yes in the small consent banner, and only if
   config.metaPixelId is set. All calls are no-ops when keys are empty. */
(function () {
  "use strict";
  var cfg = window.EVR_CONFIG || {};
  var SRC_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "ref"];

  function ssGet(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* blocked */ } }
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* blocked */ } }

  /* ---------- where the visitor came from (first touch in this session) ---------- */
  var source = {};
  (function captureSource() {
    var q = {};
    try { new URLSearchParams(window.location.search).forEach(function (v, k) { q[k] = v; }); } catch (e) { /* old browser */ }
    var fresh = {};
    SRC_KEYS.forEach(function (k) { if (q[k]) fresh[k] = String(q[k]).slice(0, 200); });
    var stored = null;
    try { stored = JSON.parse(ssGet("evr-src") || "null"); } catch (e) { stored = null; }
    if (Object.keys(fresh).length) {
      source = fresh;
      if (document.referrer) source.referrer = document.referrer.split("?")[0].slice(0, 200);
      source.landing = window.location.pathname;
      ssSet("evr-src", JSON.stringify(source));
    } else if (stored) {
      source = stored;
    } else {
      if (document.referrer) source.referrer = document.referrer.split("?")[0].slice(0, 200);
      source.landing = window.location.pathname;
      ssSet("evr-src", JSON.stringify(source));
    }
    if (source.fbclid) source.has_fbclid = true;
  })();

  function sourceLabel() {
    var s = source;
    var parts = [];
    if (s.utm_source) parts.push(s.utm_source);
    if (s.utm_medium) parts.push(s.utm_medium);
    if (s.utm_campaign) parts.push(s.utm_campaign);
    if (s.utm_content) parts.push(s.utm_content);
    if (!parts.length && s.fbclid) parts.push("meta");
    if (!parts.length && s.referrer) { try { parts.push(new URL(s.referrer).hostname); } catch (e) { parts.push("referrer"); } }
    return parts.length ? parts.join("/") : "direct";
  }

  /* ---------- PostHog ---------- */
  var ph = null;
  if (cfg.posthogKey) {
    /* official PostHog loader snippet (loads array.js from the EU assets host) */
    !function (t, e) { var o, n, p, r; e.__SV || (window.posthog && window.posthog.__loaded) || (window.posthog = e, e._i = [], e.init = function (i, s, a) { function g(t, e) { var o = e.split("."); 2 == o.length && (t = t[o[0]], e = o[1]), t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } } (p = t.createElement("script")).type = "text/javascript", p.crossOrigin = "anonymous", p.async = !0, p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js", (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r); var u = e; for (void 0 !== a ? u = e[a] = [] : a = "posthog", u.people = u.people || [], u.toString = function (t) { var e = "posthog"; return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e }, u.people.toString = function () { return u.toString(1) + ".people (stub)" }, o = "init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "), n = 0; n < o.length; n++)g(u, o[n]); e._i.push([i, s, a]) }, e.__SV = 1) }(document, window.posthog || []);
    var opts = {
      api_host: cfg.posthogHost || "https://eu.i.posthog.com",
      ui_host: "https://eu.posthog.com",
      persistence: "memory",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: true,
      disable_session_recording: true,
      person_profiles: "identified_only"
    };
    // "always" needs "Cookieless server hash mode" switched on in the PostHog project settings.
    if (cfg.posthogCookieless !== false) opts.cookieless_mode = "always";
    window.posthog.init(cfg.posthogKey, opts);
    ph = window.posthog;
    var sp = { site: "evr-waitlist", lang: document.documentElement.lang || "de", source_label: sourceLabel() };
    Object.keys(source).forEach(function (k) { sp[k] = source[k]; });
    ph.register(sp);
  }

  /* ---------- Meta Pixel (consent only) ---------- */
  var pixelOn = false;
  function loadPixel() {
    if (pixelOn || !cfg.metaPixelId) return;
    pixelOn = true;
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", String(cfg.metaPixelId));
    window.fbq("track", "PageView");
  }
  function pixel(name, props) { if (pixelOn && window.fbq) window.fbq("track", name, props || {}); }

  function t(key) {
    var d = window.EVR_I18N || {}, l = document.documentElement.lang === "en" ? "en" : "de";
    return (d[l] && d[l][key]) || (d.de && d.de[key]) || "";
  }
  var banner = null;
  function showBanner() {
    if (!cfg.metaPixelId) return;
    if (!banner) {
      banner = document.createElement("div");
      banner.className = "consent-box";
      banner.setAttribute("role", "dialog");
      banner.setAttribute("aria-live", "polite");
      banner.innerHTML = '<p class="consent-title"></p><p class="consent-text"></p>' +
        '<div class="consent-actions"><button type="button" class="btn btn-ghost" data-c="no"></button>' +
        '<button type="button" class="btn btn-solid" data-c="yes"></button></div>';
      document.body.appendChild(banner);
      banner.addEventListener("click", function (e) {
        var b = e.target.closest ? e.target.closest("[data-c]") : null;
        if (!b) return;
        var yes = b.getAttribute("data-c") === "yes";
        lsSet("evr-consent-meta", yes ? "yes" : "no");
        track("consent_choice", { meta_pixel: yes });
        banner.classList.remove("show");
        if (yes) loadPixel();
      });
    }
    banner.querySelector(".consent-title").textContent = t("c_title");
    banner.querySelector(".consent-text").innerHTML = t("c_text");
    banner.querySelector('[data-c="no"]').textContent = t("c_no");
    banner.querySelector('[data-c="yes"]').textContent = t("c_yes");
    requestAnimationFrame(function () { banner.classList.add("show"); });
  }
  if (cfg.metaPixelId) {
    var choice = lsGet("evr-consent-meta");
    if (choice === "yes") loadPixel();
    else if (choice !== "no") {
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(showBanner, 1200); });
      else setTimeout(showBanner, 1200);
    }
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("[data-consent-open]") : null;
    if (a) { e.preventDefault(); showBanner(); }
  });
  function revealConsentLinks() {
    if (!cfg.metaPixelId) return;
    Array.prototype.forEach.call(document.querySelectorAll("[data-consent-open]"), function (el) { el.hidden = false; });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", revealConsentLinks); else revealConsentLinks();

  /* ---------- public API ---------- */
  var fired = {};
  function track(name, props) {
    if (ph) { try { ph.capture(name, props || {}); } catch (e) { /* ignore */ } }
    if (window.EVR_DEBUG && window.console) console.log("[evr]", name, props || {});
  }
  function once(name, props) { if (fired[name]) return; fired[name] = 1; track(name, props); }

  window.EVR_TRACK = {
    event: track,
    once: once,
    pixel: pixel,
    source: function () { return source; },
    sourceLabel: sourceLabel,
    pageview: function (props) {
      var p = { $current_url: window.location.href, page: window.location.pathname };
      if (props) Object.keys(props).forEach(function (k) { p[k] = props[k]; });
      track("$pageview", p);
    }
  };

  /* ---------- automatic page level events ---------- */
  function setupAuto() {
    window.EVR_TRACK.pageview({ viewport: window.innerWidth < 760 ? "mobile" : "desktop" });
    // sections seen: only counts when a section stays in view for a moment,
    // so jumping past it with a button does not inflate the funnel
    if ("IntersectionObserver" in window) {
      var timers = {};
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var id = en.target.getAttribute("data-track-section");
          if (!en.isIntersecting) { clearTimeout(timers[id]); return; }
          clearTimeout(timers[id]);
          timers[id] = setTimeout(function () {
            track("section_viewed", { section: id });
            io.unobserve(en.target);
          }, 900);
        });
      }, { threshold: 0.35 });
      Array.prototype.forEach.call(document.querySelectorAll("[data-track-section]"), function (el) { io.observe(el); });
    }
    // scroll depth
    var marks = [25, 50, 75, 100], hit = {};
    function depth() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      var p = Math.round((window.scrollY / h) * 100);
      marks.forEach(function (m) { if (p >= m - 1 && !hit[m]) { hit[m] = 1; track("scroll_depth", { percent: m }); } });
    }
    window.addEventListener("scroll", depth, { passive: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setupAuto); else setupAuto();
})();
