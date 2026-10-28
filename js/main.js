/* Escape Velocity Rituals: language, smooth scroll, hero frames, reveals, waitlist */
(function () {
  "use strict";
  var cfg = window.EVR_CONFIG || {};
  var dict = window.EVR_I18N || {};
  var T = window.EVR_TRACK || { event: function () {}, once: function () {}, pixel: function () {}, source: function () { return {}; }, sourceLabel: function () { return "direct"; } };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  /* ---------------- language ---------------- */
  var lang = "de";
  function storeGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function storeSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode */ } }

  function money(v, l) {
    var n = Number(v);
    var s = (Math.round(n * 100) % 100 === 0) ? String(Math.round(n)) : n.toFixed(2);
    return l === "de" ? s.replace(".", ",") + " €" : "€" + s;
  }
  function fill(str, l) {
    var price = Number(cfg.priceEUR || 49), pct = Number(cfg.earlyAccessPercent || 50);
    return String(str)
      .replace(/\{price\}/g, money(price, l))
      .replace(/\{priceEA\}/g, money(price * (100 - pct) / 100, l))
      .replace(/\{pct\}/g, l === "de" ? pct + " %" : pct + "%")
      .replace(/\{email\}/g, cfg.contactEmail || "");
  }
  function t(key) { var d = dict[lang] || {}; return fill(d[key] != null ? d[key] : (dict.de || {})[key] || "", lang); }
  window.EVR_T = function (k) { return t(k); };

  function splitLines(el) {
    // wrap each <br> separated line so it can slide up from a mask
    var html = el.innerHTML;
    var parts = html.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(function (p) { return '<span class="ln"><span>' + p + "</span></span>"; }).join("");
  }

  function applyLang(l) {
    if (!dict[l]) l = "de";
    lang = l;
    document.documentElement.lang = l;
    $$("[data-i18n]").forEach(function (el) { var k = el.getAttribute("data-i18n"); if (dict[l][k] != null) el.textContent = t(k); });
    $$("[data-i18n-html]").forEach(function (el) { var k = el.getAttribute("data-i18n-html"); if (dict[l][k] != null) el.innerHTML = t(k); });
    $$("[data-i18n-ph]").forEach(function (el) { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
    $$("[data-i18n-alt]").forEach(function (el) { el.setAttribute("alt", t(el.getAttribute("data-i18n-alt"))); });
    $$("[data-i18n-aria]").forEach(function (el) { el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria"))); });
    $$("[data-fill]").forEach(function (el) { el.textContent = fill("{" + el.getAttribute("data-fill") + "}", l); });
    $$("[data-fill-mail]").forEach(function (el) { el.textContent = cfg.contactEmail || el.textContent; el.href = "mailto:" + (cfg.contactEmail || ""); });
    $$(".split").forEach(splitLines);
    $$(".split.seen").forEach(function (el) { el.classList.add("in"); });
    if (dict[l].meta_title) document.title = t("meta_title");
    var md = $('meta[name="description"]'); if (md && dict[l].meta_desc) md.setAttribute("content", t("meta_desc"));
    $$(".lang [data-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === l)); });
    $$(".wl").forEach(function (f) { var m = $(".wl-msg", f); if (m && m.dataset.key) m.textContent = t(m.dataset.key); });
    fitGiant();
  }

  /* ---------------- giant word line: fit to the full width ---------------- */
  var giant = $("#giant");
  function fitGiant() {
    if (!giant) return;
    var box = giant.parentNode.clientWidth;
    if (!box) return;
    giant.style.fontSize = "100px";
    var w = giant.scrollWidth || 1;
    var target = box * (window.innerWidth < 760 ? 0.92 : 0.94);
    giant.style.fontSize = Math.max(28, Math.floor(100 * target / w)) + "px";
  }

  applyLang(storeGet("evr-lang") || cfg.defaultLang || "de");
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitGiant);
  var rz; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(fitGiant, 120); });

  $$(".lang [data-lang]").forEach(function (b) {
    b.addEventListener("click", function () {
      var to = b.getAttribute("data-lang");
      if (to === lang) return;
      applyLang(to);
      storeSet("evr-lang", lang);
      T.event("lang_switch", { to: lang });
      if (hasGsap) window.ScrollTrigger.refresh();
    });
  });

  /* ---------------- smooth scroll ---------------- */
  var lenis = null;
  if (hasGsap) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.config({ ignoreMobileResize: true });
  }
  if (!reduce && window.Lenis && hasGsap) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on("scroll", window.ScrollTrigger.update);
    window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    window.gsap.ticker.lagSmoothing(0);
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute("href");
    if (a.hasAttribute("data-cta")) T.event("waitlist_cta_click", { position: a.getAttribute("data-cta") });
    if (!id || id.length < 2) return;
    var el = document.getElementById(id.slice(1));
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { duration: 1.6, offset: id === "#top" ? 0 : -24 });
    else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    if (id === "#waitlist") {
      setTimeout(function () { var i = $("#w-email"); if (i) i.focus({ preventScroll: true }); }, lenis ? 1700 : 400);
    }
  });

  /* ---------------- bar state ---------------- */
  var bar = $("#bar");
  function barState() { if (bar && !bar.classList.contains("page-bar")) bar.classList.toggle("solid", window.scrollY > window.innerHeight * 0.85); }
  window.addEventListener("scroll", barState, { passive: true });
  barState();

  /* ---------------- frame sequence ---------------- */
  // Where the object sits inside the source frames (measured on the v4 Gemini take).
  var OBJ = { cx: 0.498, cy: 0.509, h: 0.751 };
  function FrameSequence(canvas, manifest, base) {
    var portrait = window.innerWidth / window.innerHeight < 0.9;
    var set = manifest.sets[portrait && manifest.sets.mobile ? "mobile" : "desktop"];
    var count = set.count, pad = set.pad || 3;
    var imgs = new Array(count), ready = new Uint8Array(count);
    var target = 0, drawn = -1;
    var ctx = canvas.getContext("2d");
    var bg = manifest.background || "#020406";
    function url(i) { var n = String(i); while (n.length < pad) n = "0" + n; return base + set.pattern.replace("{i}", n); }
    function nearest(tg) {
      if (ready[tg]) return tg;
      for (var d = 1; d < count; d++) {
        if (tg - d >= 0 && ready[tg - d]) return tg - d;
        if (tg + d < count && ready[tg + d]) return tg + d;
      }
      return -1;
    }
    function feather(x, y, w, h, f) {
      // soften the rectangle edges of the drawn frame into the scene colour
      var g;
      g = ctx.createLinearGradient(x, 0, x + f, 0); g.addColorStop(0, bg); g.addColorStop(1, "rgba(2,4,6,0)"); ctx.fillStyle = g; ctx.fillRect(x, y, f, h);
      g = ctx.createLinearGradient(x + w, 0, x + w - f, 0); g.addColorStop(0, bg); g.addColorStop(1, "rgba(2,4,6,0)"); ctx.fillStyle = g; ctx.fillRect(x + w - f, y, f, h);
      g = ctx.createLinearGradient(0, y, 0, y + f); g.addColorStop(0, bg); g.addColorStop(1, "rgba(2,4,6,0)"); ctx.fillStyle = g; ctx.fillRect(x, y, w, f);
      g = ctx.createLinearGradient(0, y + h, 0, y + h - f); g.addColorStop(0, bg); g.addColorStop(1, "rgba(2,4,6,0)"); ctx.fillStyle = g; ctx.fillRect(x, y + h - f, w, f);
    }
    function draw(force) {
      var i = nearest(target);
      if (i < 0 || (i === drawn && !force)) return;
      drawn = i;
      var im = imgs[i], cw = canvas.width, ch = canvas.height, iw = im.naturalWidth, ih = im.naturalHeight;
      var narrow = canvas.clientWidth < 760;
      // object height as share of the canvas, and where its centre goes (like the ORA+ bottle)
      var objShare = narrow ? 0.40 : 0.60;
      var cy = narrow ? 0.37 : 0.455;
      var s = (ch * objShare) / (ih * OBJ.h);
      if (narrow) s = Math.min(s, (cw * 0.98) / iw);
      var dw = iw * s, dh = ih * s;
      var x = cw * 0.5 - OBJ.cx * dw, y = ch * cy - OBJ.cy * dh;
      ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(im, x, y, dw, dh);
      feather(x, y, dw, dh, Math.round(Math.min(dw, dh) * 0.12));
    }
    function load(i) {
      if (imgs[i]) return imgs[i]._p;
      var im = new Image(); im.decoding = "async"; im.src = url(i); imgs[i] = im;
      var p = (im.decode ? im.decode() : new Promise(function (res, rej) { im.onload = res; im.onerror = rej; }))
        .then(function () { ready[i] = 1; var n = nearest(target); if (n === i || drawn < 0) draw(true); })
        .catch(function () { /* missing frame: skip */ });
      im._p = p; return p;
    }
    function order() {
      var seen = {}, out = [0, count - 1]; seen[0] = seen[count - 1] = 1;
      [16, 8, 4, 2, 1].forEach(function (st) { for (var i = 0; i < count; i += st) if (!seen[i]) { seen[i] = 1; out.push(i); } });
      return out;
    }
    function preload() {
      var q = order(), k = 0;
      function worker() { if (k >= q.length) return Promise.resolve(); var i = q[k++]; return load(i).then(worker); }
      return Promise.all([worker(), worker(), worker(), worker()]);
    }
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      draw(true);
    }
    return {
      count: count,
      set: function (p) { target = Math.max(0, Math.min(count - 1, Math.round(p * (count - 1)))); draw(false); },
      resize: resize, preload: preload, load: load
    };
  }

  var canvas = $("#seq");
  var seq = null;
  var heroState = { p: 0 };

  if (hasGsap && !reduce && $("#hero")) {
    var gsap = window.gsap;
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#hero", start: "top top",
        end: function () { return "+=" + Math.round(window.innerHeight * 2.6); },
        pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (self) {
          if (self.progress > 0.97 && !heroDone) { heroDone = true; T.event("hero_sequence_complete", {}); T.pixel("ViewContent", { content_name: "Cold Core" }); }
        }
      }
    });
    var heroDone = false;
    tl.to(heroState, { p: 1, duration: 1, ease: "none", onUpdate: function () { if (seq) seq.set(heroState.p); } }, 0);
    tl.to("#hero-left, #hero-right", { autoAlpha: 0, y: -24, duration: 0.08, ease: "power1.in" }, 0.02);
    tl.fromTo(".cap-1", { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.12)
      .to(".cap-1", { autoAlpha: 0, y: -22, duration: 0.06 }, 0.38);
    tl.fromTo(".cap-2", { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.6)
      .to(".cap-2", { autoAlpha: 0, y: -22, duration: 0.06 }, 0.82);
    tl.fromTo(".cap-3", { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.88);
    tl.fromTo(".giant-line", { xPercent: 0 }, { xPercent: -2, duration: 1, ease: "none" }, 0);
  }

  function startSequence(manifest) {
    if (!canvas || !canvas.getContext) { document.documentElement.classList.add("no-canvas"); return; }
    seq = FrameSequence(canvas, manifest, "assets/frames/");
    seq.resize();
    var still = (reduce || !hasGsap);
    seq.load(still ? seq.count - 1 : 0).then(function () {
      seq.set(still ? 1 : heroState.p);
      if (!still) seq.preload();
    });
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(seq.resize, 120); });
  }
  if (canvas) {
    fetch("assets/frames/manifest.json")
      .then(function (r) { if (!r.ok) throw new Error("manifest"); return r.json(); })
      .then(startSequence)
      .catch(function () { document.documentElement.classList.add("no-canvas"); });
  }

  /* ---------------- reveals ---------------- */
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in", "seen");
        io.unobserve(en.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    $$(".reveal, .split").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal, .split").forEach(function (el) { el.classList.add("in", "seen"); });
  }

  if (hasGsap && !reduce) {
    var g2 = window.gsap;
    $$(".reveal-clip").forEach(function (el) {
      g2.fromTo(el, { clipPath: "inset(8% 6% 8% 6% round 22px)" }, {
        clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
        scrollTrigger: { trigger: el, start: "top 92%", end: "top 35%", scrub: true }
      });
    });
    $$(".parallax").forEach(function (img) {
      g2.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: img.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
    });
    window.addEventListener("load", function () { window.ScrollTrigger.refresh(); fitGiant(); });
  }

  /* ---------------- accordions ---------------- */
  $$("[data-acc]").forEach(function (group) {
    var exclusive = group.getAttribute("data-acc") === "spec";
    $$("details", group).forEach(function (d, i) {
      d.addEventListener("toggle", function () {
        if (d.open) {
          if (exclusive) $$("details", group).forEach(function (o) { if (o !== d) o.open = false; });
          T.event(group.getAttribute("data-acc") === "faq" ? "faq_open" : "spec_open", { item: i + 1 });
        }
        if (hasGsap) setTimeout(function () { window.ScrollTrigger.refresh(); }, 50);
      });
    });
  });

  /* ---------------- waitlist ---------------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function say(form, key, isError) {
    var m = $(".wl-msg", form); if (!m) return;
    m.dataset.key = key; m.textContent = t(key); m.classList.toggle("is-error", !!isError);
  }
  function provider() {
    var p = cfg.formProvider || "formsubmit";
    if (p === "loops" && !cfg.loopsFormId) return "none";
    if (p === "brevo" && !cfg.brevoFormUrl) return "none";
    if (p === "formsubmit" && !cfg.formsubmitEndpoint) return "none";
    return p;
  }
  function okJson(r) { return r.json().catch(function () { return { success: r.ok }; }).then(function (j) { j = j || {}; j._status = r.status; return j; }); }
  function isOk(j) { return j && (j.success === true || j.success === "true"); }

  function sendLoops(f) {
    var b = new URLSearchParams();
    b.set("email", f.email);
    if (f.firstName) b.set("firstName", f.firstName);
    b.set("userGroup", cfg.loopsUserGroup || "waitlist");
    b.set("source", f.source);
    if (cfg.loopsSendExtras) {
      if (f.sauna) b.set("saunaFrequency", f.sauna);
      b.set("language", f.lang);
      var s = f.src; ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach(function (k) { if (s[k]) b.set(k.replace(/_(\w)/g, function (m, c) { return c.toUpperCase(); }), s[k]); });
    }
    return fetch("https://app.loops.so/api/newsletter-form/" + encodeURIComponent(cfg.loopsFormId), {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: b.toString()
    }).then(okJson);
  }
  function sendBrevo(f) {
    var map = cfg.brevoFields || {};
    var b = new URLSearchParams();
    b.set(map.email || "EMAIL", f.email);
    if (f.firstName && map.firstName) b.set(map.firstName, f.firstName);
    if (map.source) b.set(map.source, f.source);
    if (map.sauna && f.sauna) b.set(map.sauna, f.sauna);
    b.set("OPT_IN", "1");
    b.set("email_address_check", "");
    b.set("locale", f.lang);
    var opts = { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: b.toString() };
    return fetch(cfg.brevoFormUrl, opts).then(okJson).catch(function () {
      // Brevo forms do not always answer with CORS headers: send blind and trust the double opt in mail
      return fetch(cfg.brevoFormUrl, Object.assign({ mode: "no-cors" }, opts)).then(function () { return { success: true, blind: true }; });
    });
  }
  function sendFormsubmit(f) {
    var payload = {
      _subject: "Neue Warteliste: Escape Velocity Rituals", _template: "table", _captcha: "false",
      email: f.email, name: f.firstName, sauna: f.sauna, sprache: f.lang, quelle: f.source,
      einwilligung: "ja, per Checkbox am " + new Date().toISOString(), seite: location.href.split("#")[0].split("?")[0]
    };
    return fetch(cfg.formsubmitEndpoint, {
      method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload)
    }).then(okJson);
  }

  $$(".wl").forEach(function (form) {
    var started = false;
    function start() { if (started) return; started = true; T.event("waitlist_form_start", { form: form.getAttribute("data-source") || "" }); }
    form.addEventListener("focusin", start);
    form.addEventListener("input", start);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (form.email && form.email.value || "").trim();
      if (!EMAIL.test(email)) { say(form, "m_email", true); form.email.focus(); T.event("waitlist_validation_error", { field: "email" }); return; }
      if (!form.consent.checked) { say(form, "m_consent", true); form.consent.focus(); T.event("waitlist_validation_error", { field: "consent" }); return; }
      if (form.botcheck && form.botcheck.checked) { form.classList.add("done"); say(form, "m_ok"); return; }
      var p = provider();
      if (p === "none") { say(form, "m_nokey", true); T.event("waitlist_submit_error", { reason: "no_provider" }); return; }
      var btn = $('button[type="submit"]', form); if (btn) btn.disabled = true;
      say(form, "m_sending");
      var src = T.source() || {};
      var f = {
        email: email,
        firstName: form.name ? form.name.value.trim() : "",
        sauna: form.sauna ? form.sauna.value : "",
        lang: lang,
        src: src,
        source: (form.getAttribute("data-source") || "waitlist") + ":" + T.sourceLabel()
      };
      var send = p === "loops" ? sendLoops : p === "brevo" ? sendBrevo : sendFormsubmit;
      send(f).then(function (res) {
        if (isOk(res)) {
          form.classList.add("done");
          say(form, cfg.doubleOptIn ? "m_ok_doi" : "m_ok");
          T.event("waitlist_submit_success", { provider: p, double_opt_in: !!cfg.doubleOptIn, sauna: f.sauna || "none", lang: lang });
          T.pixel("Lead", { content_name: "Cold Core waitlist" });
        } else {
          say(form, "m_err", true); if (btn) btn.disabled = false;
          T.event("waitlist_submit_error", { provider: p, status: res && res._status, message: res && String(res.message || "").slice(0, 120) });
          if (window.console && res) console.warn("waitlist:", res.message || res);
        }
      }).catch(function (err) {
        say(form, "m_err", true); if (btn) btn.disabled = false;
        T.event("waitlist_submit_error", { provider: p, reason: "network" });
      });
    });
  });
})();
