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

const $ = (selector, root = document) =>
  root.querySelector(selector);

let activeUid = null;
let currentStreakData = {};
let savingActivity = false;

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateDifference(dateA, dateB) {
  const a = new Date(`${dateA}T12:00:00`);
  const b = new Date(`${dateB}T12:00:00`);

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
    const difference = dateDifference(
      uniqueDays[i - 1],
      uniqueDays[i]
    );

    if (difference === 1) {
      run++;
    } else {
      run = 1;
    }

    longest = Math.max(longest, run);
  }

  const today = getLocalDateKey();
  const yesterday = getLocalDateKey(
    new Date(Date.now() - 86400000)
  );

  const lastDay = uniqueDays[uniqueDays.length - 1];

  let current = 0;

  if (lastDay === today || lastDay === yesterday) {
    current = 1;

    for (let i = uniqueDays.length - 1; i > 0; i--) {
      if (
        dateDifference(
          uniqueDays[i - 1],
          uniqueDays[i]
        ) === 1
      ) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, longest };
}

function addStreakStyles() {
  if ($("#daily-streak-styles")) return;

  const style = document.createElement("style");
  style.id = "daily-streak-styles";

  style.textContent = `
    .ds-card {
      margin: 16px 0;
      padding: 20px;
      border: 1px solid #344668;
      border-radius: 16px;
      color: #f3f6ff;
      background:
        radial-gradient(circle at top right, #293a69, transparent 55%),
        #111c32;
    }

    .ds-heading {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .ds-flame {
      font-size: 30px;
    }

    .ds-card h3 {
      margin: 0 0 5px;
      font-size: 18px;
    }

    .ds-muted {
      color: #aab8d5;
      font-size: 12px;
      line-height: 1.6;
    }

    .ds-stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 18px;
    }

    .ds-stat {
      padding: 14px;
      border: 1px solid #344668;
      border-radius: 12px;
      background: rgba(7, 15, 32, .45);
    }

    .ds-stat strong {
      display: block;
      margin-top: 5px;
      font-size: 25px;
    }

    .ds-calendar {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 6px;
      margin-top: 14px;
    }

    .ds-day {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 30px;
      border-radius: 7px;
      background: #202d47;
      color: #aab8d5;
      font-size: 10px;
    }

    .ds-day.done {
      background: #17634e;
      color: #d1fae5;
      border: 1px solid #36a783;
    }

    .ds-day.today {
      outline: 2px solid #83a7ff;
      outline-offset: 1px;
    }

    .ds-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }

    .ds-badge {
      padding: 7px 10px;
      border-radius: 999px;
      border: 1px solid #344668;
      font-size: 11px;
      color: #aab8d5;
    }

    .ds-badge.earned {
      color: #ffdf8a;
      background: #42351e;
      border-color: #80622c;
    }

    @media(max-width: 600px) {
      .ds-card { padding: 15px; }
      .ds-stats { gap: 8px; }
    }
  `;

  document.head.appendChild(style);
}

function renderCalendar(days) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const todayKey = getLocalDateKey();

  let html = "";

  for (let i = 0; i < firstDay; i++) {
    html += `<span class="ds-day" aria-hidden="true"></span>`;
  }

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day);
    const key = getLocalDateKey(date);
    const done = days.includes(key);
    const isToday = key === todayKey;

    html += `
      <span
        class="ds-day ${done ? "done" : ""} ${isToday ? "today" : ""}"
        title="${key}${done ? " — Learning activity" : ""}"
      >${day}</span>
    `;
  }

  return html;
}

function renderStreak() {
  const dashboard = $("#studentDashboardV2");

  if (!dashboard || !activeUid) return;

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

  const days = Array.isArray(currentStreakData.activityDays)
    ? currentStreakData.activityDays
    : [];

  const streak = calculateStreak(days);
  const today = getLocalDateKey();
  const activeToday = days.includes(today);

  const monthName = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });

  const milestones = [
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
            : "Complete a lesson or MCQ to record today's activity."}
        </div>
      </div>
    </div>

    <div class="ds-stats">
      <div class="ds-stat">
        <span class="ds-muted">Current Streak</span>
        <strong>🔥 ${streak.current} day${streak.current === 1 ? "" : "s"}</strong>
      </div>

      <div class="ds-stat">
        <span class="ds-muted">Longest Streak</span>
        <strong>🏆 ${streak.longest} day${streak.longest === 1 ? "" : "s"}</strong>
      </div>
    </div>

    <h4 style="margin:20px 0 0">${monthName}</h4>
    <div class="ds-muted">Green dates show recorded learning activity.</div>

    <div class="ds-calendar">
      ${renderCalendar(days)}
    </div>

    <div class="ds-badges">
      ${milestones.map(item => {
        const earned = streak.longest >= item.days;

        return `
          <span class="ds-badge ${earned ? "earned" : ""}">
            ${earned ? "🏅" : "🔒"} ${item.label}
          </span>
        `;
      }).join("")}
    </div>
  `;
}

async function recordLearningActivity() {
  const user = auth.currentUser;

  if (!user || user.uid !== activeUid || savingActivity) {
    return;
  }

  const today = getLocalDateKey();
  const oldDays = Array.isArray(currentStreakData.activityDays)
    ? currentStreakData.activityDays
    : [];

  if (oldDays.includes(today)) {
    return;
  }

  savingActivity = true;

  try {
    const nextDays = [...oldDays, today].sort();

    await setDoc(
      doc(db, "studentProgress", user.uid),
      {
        learningActivityDays: nextDays,
        learningActivityUpdatedAt: serverTimestamp()
      },
      { merge: true }
    );

    currentStreakData.activityDays = nextDays;
    renderStreak();
  } catch (error) {
    console.error("Daily streak save failed:", error);
    alert(
      "Learning streak save nahi hui. Firebase Firestore Rules check karein."
    );
  } finally {
    savingActivity = false;
  }
}

async function loadStreak(user) {
  const snapshot = await getDoc(
    doc(db, "studentProgress", user.uid)
  );

  if (auth.currentUser?.uid !== user.uid) return;

  const data = snapshot.exists() ? snapshot.data() : {};

  currentStreakData = {
    activityDays: Array.isArray(data.learningActivityDays)
      ? data.learningActivityDays
      : []
  };

  renderStreak();
}

function attachActivityTracking() {
  const dashboard = $("#studentDashboardV2");

  if (!dashboard || dashboard.dataset.streakTracking === "true") {
    return;
  }

  dashboard.dataset.streakTracking = "true";

  dashboard.addEventListener("click", event => {
    const button = event.target.closest("button");

    if (!button || !dashboard.contains(button)) return;

    // Count activity only when a lesson action is enabled.
    if (button.matches("[data-lesson]") && !button.disabled) {
      recordLearningActivity();
    }

    // Count a passed Admin-created MCQ module.
    if (button.id === "cs-pass") {
      recordLearningActivity();
    }
  });
}

function setupDashboardObserver() {
  const observer = new MutationObserver(() => {
    if ($("#studentDashboardV2") && activeUid) {
      attachActivityTracking();
      renderStreak();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

onAuthStateChanged(auth, async user => {
  activeUid = user?.uid || null;
  currentStreakData = {};

  if (!user) {
    $("#daily-streak-card")?.remove();
    return;
  }

  addStreakStyles();

  try {
    await loadStreak(user);
    attachActivityTracking();
  } catch (error) {
    console.error("Daily streak load failed:", error);
  }
});

setupDashboardObserver();
