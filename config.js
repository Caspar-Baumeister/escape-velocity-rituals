/* Escape Velocity Rituals: everything Caspar may want to change lives here. */
window.EVR_CONFIG = {
  // Where signups go. "formsubmit" works without an account: the very first signup
  // triggers an activation mail to the address below, click "Activate Form" once.
  // Switch to "web3forms" and paste a key if you prefer Web3Forms.
  formProvider: "formsubmit",
  formsubmitEndpoint: "https://formsubmit.co/ajax/caspar.baumeister.privat@gmail.com",
  web3formsKey: "",

  // Planned price in euros and the early access discount for the waitlist.
  priceEUR: 49,
  earlyAccessPercent: 50,

  // Shown if the form cannot be sent.
  contactEmail: "caspar.baumeister.privat@gmail.com",

  // Horizontal position of the capsule in the hero on wide screens (0.5 = centre).
  heroFocusX: 0.62,

  // Default language: "de" or "en".
  defaultLang: "de"
};
