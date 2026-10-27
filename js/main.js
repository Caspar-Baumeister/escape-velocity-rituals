/* Escape Velocity Rituals: scroll, frames, language, waitlist */
(function () {
  "use strict";
  var cfg = window.EVR_CONFIG || {};
  var dict = window.EVR_I18N || {};
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
    return l === "de" ? s.replace(".", ",") + "\u00a0€" : "€" + s;
  }
  function fill(str, l) {
    var price = Number(cfg.priceEUR || 49), pct = Number(cfg.earlyAccessPercent || 50);
    return String(str)
      .replace(/\{price\}/g, money(price, l))
      .replace(/\{priceEA\}/g, money(price * (100 - pct) / 100, l))
      .replace(/\{pct\}/g, l === "de" ? pct + "\u00a0%" : pct + "%")
      .replace(/\{email\}/g, cfg.contactEmail || "");
  }
  function t(key) { var d = dict[lang] || {}; return fill(d[key] != null ? d[key] : (dict.de || {})[key] || "", lang); }

  function applyLang(l) {
    if (!dict[l]) l = "de";
    lang = l;
    document.documentElement.lang = l;
    $$("[data-i18n]").forEach(function (el) { var k = el.getAttribute("data-i18n"); if (dict[l][k] != null) el.textContent = t(k); });
    $$("[data-i18n-html]").forEach(function (el) { var k = el.getAttribute("data-i18n-html"); if (dict[l][k] != null) el.innerHTML = t(k); });
    $$("[data-i18n-ph]").forEach(function (el) { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
    $$("[data-i18n-alt]").forEach(function (el) { el.setAttribute("alt", t(el.getAttribute("data-i18n-alt"))); });
    document.title = t("meta_title");
    var md = $('meta[name="description"]'); if (md) md.setAttribute("content", t("meta_desc"));
    var btn = $("#lang"); if (btn) { btn.textContent = t("lang_btn"); btn.setAttribute("aria-label", t("lang_aria")); }
    var tl = $("#temp-label"); if (tl) tl.textContent = t(tl.getAttribute("data-state") === "core" ? "temp_core" : "temp_air");
    $$(".wl").forEach(function (f) { var m = $(".wl-msg", f); if (m && m.dataset.key) m.textContent = t(m.dataset.key); });
  }
  applyLang(storeGet("evr-lang") || cfg.defaultLang || "de");
  var langBtn = $("#lang");
  if (langBtn) langBtn.addEventListener("click", function () {
    applyLang(lang === "de" ? "en" : "de");
    storeSet("evr-lang", lang);
    if (hasGsap) window.ScrollTrigger.refresh();
  });

  /* ---------------- smooth scroll ---------------- */
  var lenis = null;
  if (hasGsap) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.config({ ignoreMobileResize: true });
  }
  if (!reduce && window.Lenis && hasGsap) {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on("scroll", window.ScrollTrigger.update);
    window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    window.gsap.ticker.lagSmoothing(0);
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute("href");
    if (!id || id.length < 2) return;
    var el = document.getElementById(id.slice(1));
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { duration: 1.6 });
    else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    if (id === "#waitlist") {
      setTimeout(function () { var i = $("#w-email"); if (i) i.focus({ preventScroll: true }); }, lenis ? 1700 : 400);
    }
  });

  /* ---------------- header state ---------------- */
  var bar = $("#bar");
  function barState() { if (bar) bar.classList.toggle("solid", window.scrollY > window.innerHeight * 0.5); }
  window.addEventListener("scroll", barState, { passive: true });
  barState();

  /* ---------------- frame sequence ---------------- */
  function FrameSequence(canvas, manifest, base) {
    var portrait = window.innerWidth / window.innerHeight < 1;
    var set = manifest.sets[portrait && manifest.sets.mobile ? "mobile" : "desktop"];
    var count = set.count, pad = set.pad || 3;
    var imgs = new Array(count), ready = new Uint8Array(count);
    var target = 0, drawn = -1;
    var ctx = canvas.getContext("2d");
    var bg = manifest.background || "#050706";
    function url(i) { var n = String(i); while (n.length < pad) n = "0" + n; return base + set.pattern.replace("{i}", n); }
    function nearest(tg) {
      if (ready[tg]) return tg;
      for (var d = 1; d < count; d++) {
        if (tg - d >= 0 && ready[tg - d]) return tg - d;
        if (tg + d < count && ready[tg + d]) return tg + d;
      }
      return -1;
    }
    function draw(force) {
      var i = nearest(target);
      if (i < 0 || (i === drawn && !force)) return;
      drawn = i;
      var im = imgs[i], cw = canvas.width, ch = canvas.height, iw = im.naturalWidth, ih = im.naturalHeight;
      var s, x, y;
      if (cw / ch >= 1) {
        s = Math.max(cw / iw, ch / ih); y = (ch - ih * s) / 2;
        var fx = (canvas.clientWidth >= 1000) ? Number(cfg.heroFocusX || 0.5) : 0.5;
        x = cw * fx - (iw * s) / 2;
      }
      else { s = Math.max(cw / iw, (ch * 0.5) / ih); x = (cw - iw * s) / 2; y = ch * 0.29 - (ih * s) / 2; }
      ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(im, x, y, iw * s, ih * s);
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

  // the pinned hero timeline is created first, so every later trigger accounts for its pin spacing
  if (hasGsap && !reduce) {
    var gsap = window.gsap;
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#hero", start: "top top",
        end: function () { return "+=" + Math.round(window.innerHeight * 2.8); },
        pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true
      }
    });
    tl.to(heroState, { p: 1, duration: 1, ease: "none", onUpdate: function () { if (seq) seq.set(heroState.p); } }, 0);
    tl.to(".scroll-hint", { autoAlpha: 0, duration: 0.04 }, 0.01);
    tl.to("#hero-copy", { autoAlpha: 0, y: -36, duration: 0.12, ease: "power1.in" }, 0.03);
    tl.fromTo(".cap-1", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.07 }, 0.17)
      .to(".cap-1", { autoAlpha: 0, y: -24, duration: 0.07 }, 0.4);
    tl.fromTo(".cap-2", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.07 }, 0.58)
      .to(".cap-2", { autoAlpha: 0, y: -24, duration: 0.07 }, 0.78);
    tl.fromTo(".cap-3", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.07 }, 0.88);
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
  fetch("assets/frames/manifest.json")
    .then(function (r) { if (!r.ok) throw new Error("manifest"); return r.json(); })
    .then(startSequence)
    .catch(function () { document.documentElement.classList.add("no-canvas"); });

  /* ---------------- heat to cold ---------------- */
  var tempNum = $("#temp-num"), tempBox = $("#temp"), tempLabel = $("#temp-label");
  function setTemp(p) {
    var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    tempNum.textContent = String(Math.round(85 - 65 * e));
    if (hasGsap) tempBox.style.color = window.gsap.utils.interpolate("#c8643b", "#8fe6d2", e);
    var core = p > 0.62;
    if ((tempLabel.getAttribute("data-state") === "core") !== core) {
      tempLabel.setAttribute("data-state", core ? "core" : "air");
      tempLabel.textContent = t(core ? "temp_core" : "temp_air");
      tempLabel.style.color = core ? "#8fe6d2" : "";
    }
  }
  if (tempNum && hasGsap && !reduce) {
    var steps = $$(".heat-step");
    window.ScrollTrigger.create({
      trigger: steps[1], start: "top 70%", endTrigger: steps[2], end: "top 45%",
      onUpdate: function (self) { setTemp(self.progress); },
      onLeave: function () { setTemp(1); }, onLeaveBack: function () { setTemp(0); }
    });
  } else if (tempNum && reduce) { setTemp(1); }

  /* ---------------- quiet image motion ---------------- */
  if (hasGsap && !reduce) {
    var gsap2 = window.gsap;
    $$(".reveal-clip").forEach(function (el) {
      gsap2.fromTo(el, { clipPath: "inset(10% 8% 10% 8% round 4px)" }, {
        clipPath: "inset(0% 0% 0% 0% round 4px)", ease: "none",
        scrollTrigger: { trigger: el, start: "top 88%", end: "top 30%", scrub: true }
      });
      var img = $("img", el);
      if (img) gsap2.fromTo(img, { scale: 1.14 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    });
    $$(".parallax").forEach(function (img) {
      gsap2.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: img.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
    });
    window.addEventListener("load", function () { window.ScrollTrigger.refresh(); });
  }

  /* ---------------- waitlist ---------------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function say(form, key, isError) {
    var m = $(".wl-msg", form); if (!m) return;
    m.dataset.key = key; m.textContent = t(key); m.classList.toggle("is-error", !!isError);
  }
  function markDone() {
    $$(".wl").forEach(function (f) { f.classList.add("done"); say(f, "m_ok"); });
  }
  $$(".wl").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (form.email && form.email.value || "").trim();
      if (!EMAIL.test(email)) { say(form, "m_email", true); form.email.focus(); return; }
      if (!form.consent.checked) { say(form, "m_consent", true); form.consent.focus(); return; }
      if (form.botcheck && form.botcheck.checked) { markDone(); return; }
      var useW3F = cfg.formProvider === "web3forms" && cfg.web3formsKey && !/REPLACE/.test(cfg.web3formsKey);
      var endpoint = useW3F ? "https://api.web3forms.com/submit" : (cfg.formsubmitEndpoint || "");
      if (!endpoint) { say(form, "m_nokey", true); return; }
      var btn = $('button[type="submit"]', form); if (btn) btn.disabled = true;
      say(form, "m_sending");
      var fields = {
        email: email,
        name: form.name ? form.name.value.trim() : "",
        sauna: form.sauna ? form.sauna.value : "",
        sprache: lang,
        quelle: form.getAttribute("data-source") || "",
        einwilligung: "ja, per Checkbox am " + new Date().toISOString(),
        seite: location.href.split("#")[0]
      };
      var payload = useW3F
        ? Object.assign({ access_key: cfg.web3formsKey, subject: "Neue Warteliste: Escape Velocity Rituals", from_name: "Escape Velocity Rituals", botcheck: false }, fields)
        : Object.assign({ _subject: "Neue Warteliste: Escape Velocity Rituals", _template: "table", _captcha: "false" }, fields);
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json().catch(function () { return { success: r.ok }; }); })
        .then(function (res) {
          if (res && (res.success === true || res.success === "true")) markDone();
          else { say(form, "m_err", true); if (btn) btn.disabled = false; if (window.console && res) console.warn("waitlist:", res.message || res); }
        })
        .catch(function () { say(form, "m_err", true); if (btn) btn.disabled = false; });
    });
  });
})();
