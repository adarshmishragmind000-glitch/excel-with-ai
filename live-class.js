
import { getApp, getApps, initializeApp } from
  "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
  getFirestore, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCTW9W1E2Fcw4CZzMPtyjG1LY0JHK5pmo0",
  authDomain: "excel-with-ai.firebaseapp.com",
  projectId: "excel-with-ai",
  storageBucket: "excel-with-ai.firebasestorage.app",
  messagingSenderId: "615391443440",
  appId: "1:615391443440:web:92b3a15f0e4596abc50535"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const popup = document.createElement("aside");
popup.id = "liveClassPopup";
popup.className = "live-class-popup";
popup.hidden = true;
popup.innerHTML = `
  <div class="live-class-top">
    <span class="live-pulse"></span>
    <strong>LIVE CLASS NOW</strong>
    <button type="button" id="closeLivePopup" aria-label="Close">×</button>
  </div>
  <div id="liveClassPopupTitle" class="live-class-title"></div>
  <p>Join your online session on Google Meet.</p>
  <a id="liveClassJoin" href="#" target="_blank"
    rel="noopener noreferrer">Join Google Meet ↗</a>
`;
document.body.appendChild(popup);

document.getElementById("closeLivePopup").addEventListener("click", () => {
  popup.hidden = true;
});

onSnapshot(doc(db, "liveClasses", "current"), (snap) => {
  if (!snap.exists() || snap.data().active !== true) {
    popup.hidden = true;
    return;
  }

  const data = snap.data();

  try {
    const url = new URL(data.meetUrl);
    if (url.protocol !== "https:" || url.hostname !== "meet.google.com") {
      popup.hidden = true;
      return;
    }

    document.getElementById("liveClassPopupTitle").textContent =
      data.title || "Excel with AI — Live Class";

    document.getElementById("liveClassJoin").href = url.href;
    popup.hidden = false;
  } catch {
    popup.hidden = true;
  }
}, (error) => {
  console.error("Live class status error:", error);
  popup.hidden = true;
});
