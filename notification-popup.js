
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Existing Excel with AI Firebase Project
const firebaseConfig = {
  apiKey: "AIzaSyCTW9W1E2Fcw4CZzMPtyjG1LY0JHK5pmo0",
  authDomain: "excel-with-ai.firebaseapp.com",
  projectId: "excel-with-ai",
  storageBucket: "excel-with-ai.firebasestorage.app",
  messagingSenderId: "615391443440",
  appId: "1:615391443440:web:92b3a15f0e4596abc50535"
};

// Reuse the existing Firebase app if already initialized.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const SUBSCRIBED_KEY = "excelAI_email_subscribed";
const DISMISSED_KEY = "excelAI_popup_dismissed_until";

function createPopup() {
  if (document.getElementById("emailSubscribePopup")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "emailSubscribePopup";
  wrapper.className = "email-popup-overlay";

  wrapper.innerHTML = `
    <div class="email-popup" role="dialog"
         aria-modal="true"
         aria-labelledby="emailPopupTitle">

      <button type="button"
        class="email-popup-close"
        id="emailPopupClose"
        aria-label="Close popup">×</button>

      <div class="email-popup-icon">✉</div>

      <div class="email-popup-tag">EXCEL WITH AI</div>

      <h2 id="emailPopupTitle">
        Stay Updated!
      </h2>

      <p class="email-popup-description">
        Get important notices, new class announcements,
        course updates and learning opportunities directly
        in your email inbox.
      </p>

      <form id="emailSubscribeForm">

        <label for="subscriberName">Your Full Name</label>
        <input
          id="subscriberName"
          name="name"
          type="text"
          maxlength="80"
          placeholder="Enter your full name"
          autocomplete="name"
          required
        >

        <label for="subscriberEmail">Email Address</label>
        <input
          id="subscriberEmail"
          name="email"
          type="email"
          maxlength="150"
          placeholder="Enter your email address"
          autocomplete="email"
          required
        >

        <label class="email-consent">
          <input
            id="subscriberConsent"
            type="checkbox"
            required
          >
          <span>
            I agree to receive important Excel with AI
            website updates by email.
          </span>
        </label>

        <button
          type="submit"
          id="emailSubscribeButton"
          class="email-subscribe-button">
          Subscribe & Continue
        </button>

        <p id="emailSubscribeMessage"
           class="email-popup-message"
           role="status"
           aria-live="polite"></p>
      </form>

      <button type="button"
        id="emailPopupLater"
        class="email-popup-later">
        Maybe Later
      </button>

      <div class="email-popup-footer">
        Your email will only be used for Excel with AI updates.
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  const closePopup = () => {
    wrapper.classList.remove("email-popup-visible");

    // Show again after 7 days if the visitor has not subscribed.
   const nextShow = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem(DISMISSED_KEY, String(nextShow));
  };

  document.getElementById("emailPopupClose")
    .addEventListener("click", closePopup);

  document.getElementById("emailPopupLater")
    .addEventListener("click", closePopup);

  wrapper.addEventListener("click", event => {
    if (event.target === wrapper) closePopup();
  });

  document.getElementById("emailSubscribeForm")
    .addEventListener("submit", saveSubscriber);
}

async function saveSubscriber(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const button = document.getElementById("emailSubscribeButton");
  const message = document.getElementById("emailSubscribeMessage");

  const name = document.getElementById("subscriberName")
    .value.trim();

  const email = document.getElementById("subscriberEmail")
    .value.trim().toLowerCase();

  const consent = document.getElementById("subscriberConsent").checked;

  if (name.length < 2) {
    message.textContent = "Please enter your full name.";
    return;
  }

  if (!email || !consent) {
    message.textContent =
      "Please enter your email and accept the consent.";
    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";

  message.textContent = "";

  try {
    await addDoc(collection(db, "notificationSubscribers"), {
      name: name,
      email: email,
      emailConsent: true,
      createdAt: serverTimestamp(),
      source: "website"
    });

    localStorage.setItem(SUBSCRIBED_KEY, "yes");
    localStorage.removeItem(DISMISSED_KEY);

    document.querySelector(".email-popup")?.classList.add("email-popup-success");

    document.querySelector(".email-popup").innerHTML = `
      <div class="email-popup-icon">✓</div>
      <h2>You're Subscribed!</h2>
      <p class="email-popup-description">
        Thank you, ${escapePopupText(name)}.
        You will receive important Excel with AI updates
        at your email address.
      </p>
      <button type="button"
        id="emailPopupDone"
        class="email-subscribe-button">
        Continue to Website
      </button>
    `;

    document.getElementById("emailPopupDone")
      .addEventListener("click", () => {
        document.getElementById("emailSubscribePopup")
          ?.remove();
      });

  } catch (error) {
    console.error("Email subscriber save error:", error);

    message.textContent =
      error.code === "permission-denied"
        ? "Registration blocked by Firestore Rules. Please contact the website admin."
        : "Could not save your details. Please try again.";

    button.disabled = false;
    button.textContent = "Subscribe & Continue";
  }
}

function escapePopupText(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function shouldShowPopup() {
  if (localStorage.getItem(SUBSCRIBED_KEY) === "yes") {
    return false;
  }

  const dismissedUntil =
    Number(localStorage.getItem(DISMISSED_KEY) || 0);

  return Date.now() >= dismissedUntil;
}

function startEmailPopup() {
  if (!shouldShowPopup()) return;

  createPopup();

  // Small delay so the homepage loads first.
  setTimeout(() => {
    document.getElementById("emailSubscribePopup")
      ?.classList.add("email-popup-visible");
  }, 1800);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startEmailPopup);
} else {
  startEmailPopup();
}
