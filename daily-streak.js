import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCTW9W1E2Fcw4CZzMPtyjG1LY0JHK5pmo0",
  authDomain: "excel-with-ai.firebaseapp.com",
  projectId: "excel-with-ai",
  storageBucket: "excel-with-ai.firebasestorage.app",
  messagingSenderId: "615391443440",
  appId: "1:615391443440:web:92b3a15f0e4596abc50535"
};

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

let currentUid = null;
let activityDays = [];
let saving = false;
let dashboardObserver = null;
let discoveryObserver = null;

const $ = (selector, root = document) =>
  root.querySelector(selector);

function todayKey() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
}

function dayDifference(first, second) {
  const a = new Date(first + "T12:00:00");
  const b = new Date(second + "T12:00:00");

  return Math.round((b - a) / 86400000);
}

function calculateStreak(days) {
  const uniqueDays = [...new Set(days)].sort();

  if (!uniqueDays.length) {
    return { current: 0, longest: 0 };
  }

  let longest = 1;
  let run = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    if (
      dayDifference(uniqueDays[i - 1], uniqueDays[i]) === 1
    ) {
      run++;
    } else {
      run = 1;
    }

    longest = Math.max(longest, run);
  }

  const today = todayKey();
  const yesterday = todayKeyFromOffset(-1);
  const lastDay = uniqueDays[uniqueDays.length - 1];

  let current = 0;

  if (lastDay === today || lastDay === yesterday) {
    current = 1;

    for (let i = uniqueDays.length - 1; i > 0; i--) {
      if (
        dayDifference(uniqueDays[i - 1], uniqueDays[i]) === 1
      ) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, longest };
}

function todayKeyFromOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function addStyles() {
  if ($("#daily-streak-style")) return;

  const style = document.createElement("style");
  style.id = "daily-streak-style";

  style.textContent = `
    #daily-streak-card {
      margin: 16px 0;
      padding: 20px;
      border: 1px solid #344668;
      border-radius: 16px;
      color: #f3f6ff;
      background: linear-gradient(135deg,#172541,#10182b);
      box-sizing: border-box;
    }

    #daily-streak-card * {
      box-sizing: border-box;
    }

    #daily-streak-card .ds-heading {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    #daily-streak-card .ds-flame {
      font-size: 30px;
    }

    #daily-streak-card h3 {
      margin: 0 0 5px;
      font-size: 18px;
    }

    #daily-streak-card .ds-muted {
      color: #aab8d5;
      font-size: 12px;
      line-height: 1.6;
    }

    #daily-streak-card .ds-stats {
      display: grid;
      grid-template-columns: repeat(2,minmax(0,1fr));
      gap: 12px;
      margin-top: 18px;
    }

    #daily-streak-card .ds-stat {
      padding: 14px;
      border: 1px solid #344668;
      border-radius: 12px;
      background: #0b1428;
    }

    #daily-streak-card .ds-stat strong {
      display: block;
      margin-top: 6px;
      font-size: 24px;
    }

    #daily-streak-card .ds-calendar {
      display: grid;
      grid-template-columns: repeat(7,minmax(0,1fr));
      gap: 6px;
      margin-top: 14px;
    }

    #daily-streak-card .ds-day {
      min-height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 7px;
      background: #202d47;
      color: #aab8d5;
      font-size: 11px;
    }

    #daily-streak-card .ds-day.done {
      background: #17634e;
      color: #d1fae5;
    }

    #daily-streak-card .ds-day.today {
      outline: 2px solid #83a7ff;
    }

    #daily-streak-card .ds-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }

    #daily-streak-card .ds-badge {
      padding: 7px 10px;
      border-radius: 999px;
      border: 1px solid #344668;
      color: #aab8d5;
      font-size: 11px;
    }

    #daily-streak-card .ds-badge.earned {
      color: #ffdf8a;
      border-color: #80622c;
      background: #42351e;
    }

    @media(max-width:600px) {
      #daily-streak-card { padding: 15px; }
      #daily-streak-card .ds-stats { gap: 8px; }
    }
  `;

  document.head.appendChild(style);
}

function calendarHTML(days) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  let html = "";

  for (let i = 0; i < firstDay; i++) {
    html += `<span class="ds-day" aria-hidden="true"></span>`;
  }

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day);

    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");

    const done = days.includes(key);
    const isToday = key === todayKey();

    html += `
      <span class="ds-day ${done ? "done" : ""} ${isToday ? "today" : ""}"
        title="${key}">
        ${day}
      </span>
    `;
  }

  return html;
}

function renderCard(dashboard) {
  if (!dashboard || !currentUid) return;

  let card = $("#daily-streak-card", dashboard);

  if (!card) {
    card = document.createElement("section");
    card.id = "daily-streak-card";
    card.className = "ds-card";

    const welcome = $(".sv2-welcome", dashboard);

    if (welcome) {
      welcome.insertAdjacentElement("afterend", card);
    } else {
      dashboard.prepend(card);
    }
  }

  const streak = calculateStreak(activityDays);
  const monthName = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });

  const activeToday = activityDays.includes(todayKey());

  const badges = [
    { days: 3, label: "3-Day Starter" },
    { days: 7, label: "7-Day Learner" },
    { days: 30, label: "30-Day Champion" }
  ];

  card.innerHTML = `
    <div class="ds-heading">
      <span class="ds-flame">🔥</span>
      <div>
        <h3>Daily Learning Streak</h3>
        <div class="ds-muted">
          ${activeToday
            ? "Today's learning activity recorded."
            : "Complete a lesson to record today's activity."}
        </div>
      </div>
    </div>

    <div class="ds-stats">
      <div class="ds-stat">
        <span class="ds-muted">Current Streak</span>
        <strong>🔥 ${streak.current} day(s)</strong>
      </div>

      <div class="ds-stat">
        <span class="ds-muted">Longest Streak</span>
        <strong>🏆 ${streak.longest} day(s)</strong>
      </div>
    </div>

    <h4 style="margin:20px 0 0">${monthName}</h4>
    <div class="ds-muted">
      Green dates show recorded learning activity.
    </div>

    <div class="ds-calendar">
      ${calendarHTML(activityDays)}
    </div>

    <div class="ds-badges">
      ${badges.map(badge => `
        <span class="ds-badge ${
          streak.longest >= badge.days ? "earned" : ""
        }">
          ${streak.longest >= badge.days ? "🏅" : "🔒"}
          ${badge.label}
        </span>
      `).join("")}
    </div>
  `;
}

async function recordActivity() {
  const user = auth.currentUser;

  if (!user || user.uid !== currentUid || saving) return;

  const today = todayKey();

  if (activityDays.includes(today)) return;

  saving = true;

  try {
    const updatedDays = [...activityDays, today].sort();

    await setDoc(
      doc(db, "studentProgress", user.uid),
      {
        learningActivityDays: updatedDays,
        learningActivityUpdatedAt: serverTimestamp()
      },
      { merge: true }
    );

    activityDays = updatedDays;

    const dashboard = $("#studentDashboardV2");
    if (dashboard) renderCard(dashboard);
  } catch (error) {
    console.error("Daily streak save failed:", error);
    alert(
      "Streak save nahi hui. Firestore Rules ya browser Console check karein."
    );
  } finally {
    saving = false;
  }
}

function attachActivityHandler(dashboard) {
  if (dashboard.dataset.dailyStreakHandler === "yes") return;

  dashboard.dataset.dailyStreakHandler = "yes";

  dashboard.addEventListener("click", event => {
    const button = event.target.closest("button");

    if (!button || !dashboard.contains(button)) return;

    if (
      button.matches("[data-lesson]") &&
      !button.disabled
    ) {
      recordActivity();
    }
  });
}

function watchDashboard() {
  const root = $("#dashboardView");

  if (!root) return false;

  if (dashboardObserver) dashboardObserver.disconnect();

  dashboardObserver = new MutationObserver(() => {
    const dashboard = $("#studentDashboardV2", root);

    if (!dashboard || !currentUid) return;

    attachActivityHandler(dashboard);

    // Render only if the card is missing.
    // This prevents an observer/render loop.
    if (!$("#daily-streak-card", dashboard)) {
      renderCard(dashboard);
    }
  });

  dashboardObserver.observe(root, {
    childList: true,
    subtree: true
  });

  const dashboard = $("#studentDashboardV2", root);

  if (dashboard && currentUid) {
    attachActivityHandler(dashboard);
    renderCard(dashboard);
  }

  return true;
}

function discoverDashboard() {
  if (watchDashboard()) return;

  if (discoveryObserver) discoveryObserver.disconnect();

  discoveryObserver = new MutationObserver(() => {
    if (watchDashboard()) {
      discoveryObserver.disconnect();
      discoveryObserver = null;
    }
  });

  discoveryObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

onAuthStateChanged(auth, async user => {
  currentUid = user?.uid || null;
  activityDays = [];

  if (!user) {
    $("#daily-streak-card")?.remove();

    if (dashboardObserver) dashboardObserver.disconnect();
    if (discoveryObserver) discoveryObserver.disconnect();

    return;
  }

  addStyles();
  discoverDashboard();

  try {
    const snapshot = await getDoc(
      doc(db, "studentProgress", user.uid)
    );

    if (auth.currentUser?.uid !== user.uid) return;

    const data = snapshot.exists() ? snapshot.data() : {};

    activityDays = Array.isArray(data.learningActivityDays)
      ? data.learningActivityDays.filter(day =>
          /^\d{4}-\d{2}-\d{2}$/.test(day)
        )
      : [];

    const dashboard = $("#studentDashboardV2");

    if (dashboard) {
      attachActivityHandler(dashboard);
      renderCard(dashboard);
    }
  } catch (error) {
    console.error("Daily streak load failed:", error);
  }
});
