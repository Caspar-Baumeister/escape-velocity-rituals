/* Escape Velocity Rituals: everything Caspar may want to change lives here. */
window.EVR_CONFIG = {
  /* ---------- Waitlist ---------- */
  // Where signups go: "loops", "brevo" or "formsubmit".
  //   loops:      paste the form ID from Loops (Forms, Custom form, the part after /newsletter-form/)
  //   brevo:      paste the form action URL from Brevo (Kontakte, Formulare, Formular, HTML-Code, action="...")
  //   formsubmit: no account; the very first signup sends an activation mail, click "Activate Form" once.
  formProvider: "formsubmit",
  loopsFormId: "",
  loopsUserGroup: "waitlist",
  // true: also send saunaFrequency, language and utm fields (create these contact properties in Loops first).
  loopsSendExtras: false,
  brevoFormUrl: "",
  brevoFields: { email: "EMAIL", firstName: "FIRSTNAME", source: "SOURCE" },
  formsubmitEndpoint: "https://formsubmit.co/ajax/caspar.baumeister.privat@gmail.com",
  // true as soon as the email tool sends a confirmation link (double opt in).
  // The confirmation link should point to danke.html on this site.
  doubleOptIn: false,

  /* ---------- Tracking ---------- */
  // PostHog EU project API key (starts with phc_). Empty = no analytics at all.
  posthogKey: "",
  posthogHost: "https://eu.i.posthog.com",
  // true: no storage on the device at all. Needs "Cookieless server hash mode" switched on
  // in the PostHog project settings (Settings, Project, Web analytics), otherwise use false.
  posthogCookieless: true,
  // Meta Pixel / Dataset ID (only digits). Empty = no pixel and no cookie banner.
  metaPixelId: "",

  /* ---------- Offer ---------- */
  // Planned price in euros and the early access discount for the waitlist.
  priceEUR: 49,
  earlyAccessPercent: 50,

  /* ---------- Misc ---------- */
  contactEmail: "caspar.baumeister.privat@gmail.com",
  defaultLang: "de"
};
