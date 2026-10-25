
import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
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

let adminModules = [];
let completedLessons = [];
let currentUid = null;
let activeModule = null;
let selectedAnswers = {};
let quizSubmitted = false;
let courseUnsubscribe = null;
let renderedDashboard = null;
let renderPending = false;

const $ = (selector, root = document) => root.querySelector(selector);

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function notify(message) {
  const toast = $("#toast");

  if (toast) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  } else {
    console.info(message);
    alert(message);
  }
}

function addStyles() {
  if ($("#course-sync-styles")) return;

  const style = document.createElement("style");
  style.id = "course-sync-styles";

  style.textContent = `
    #cs-modal[hidden] { display:none !important; }
    #cs-modal {
      position:fixed; inset:0; z-index:100000;
      display:flex; align-items:center; justify-content:center;
      padding:16px; background:rgba(2,6,18,.84);
    }
    #cs-modal .cs-box {
      width:min(760px,100%); max-height:90vh; overflow:auto;
      padding:22px; color:#f3f6ff; background:#111c32;
      border:1px solid #344668; border-radius:16px;
    }
    #cs-modal .cs-head {
      display:flex; align-items:center; justify-content:space-between; gap:12px;
    }
    #cs-modal .cs-head h2 { font-size:21px; }
    #cs-modal button, #cs-modal .cs-link {
      padding:10px 14px; border:1px solid #425a80;
      border-radius:9px; color:#eef3ff; background:#1c2b47;
      cursor:pointer; display:inline-block; text-decoration:none;
    }
    #cs-modal .cs-note, #cs-modal .cs-question {
      margin:12px 0; padding:15px; background:#172541;
      border:1px solid #2d4266; border-radius:12px;
    }
    #cs-modal .cs-note { white-space:pre-wrap; line-height:1.7; }
    #cs-modal .cs-option {
      display:flex; gap:10px; padding:8px 0; cursor:pointer;
    }
    #cs-modal .cs-muted { color:#aab8d5; font-size:13px; line-height:1.7; }
    #cs-modal .cs-result {
      margin-top:14px; padding:14px; background:#20344f;
      border-radius:10px; line-height:1.7;
    }
    .cs-dynamic-card { min-width:0; }
    .cs-dynamic-card .cs-buttons {
      display:grid; grid-template-columns:1fr; gap:8px; margin-top:10px;
    }
    @media(max-width:600px) {
      #cs-modal .cs-box { padding:15px; }
    }
  `;

  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "cs-modal";
  modal.hidden = true;

  modal.innerHTML = `
    <section class="cs-box" role="dialog" aria-modal="true">
      <div class="cs-head">
        <h2 id="cs-title">Course Module</h2>
        <button type="button" data-cs-close>Close ✕</button>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:18px 0">
        <button type="button" data-cs-tab="notes">Notes</button>
        <button type="button" data-cs-tab="video">Video</button>
        <button type="button" data-cs-tab="quiz">MCQ Test</button>
      </div>

      <div id="cs-content"></div>
    </section>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", event => {
    if (
      event.target === modal ||
      event.target.closest("[data-cs-close]")
    ) {
      modal.hidden = true;
      activeModule = null;
      return;
    }

    const tab = event.target.closest("[data-cs-tab]");
    if (tab) showTab(tab.dataset.csTab);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && $("#cs-modal")) {
      $("#cs-modal").hidden = true;
      activeModule = null;
    }
  });
}

async function loadProgress() {
  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "studentProgress", user.uid));

  completedLessons =
    snap.exists() && Array.isArray(snap.data().completedLessons)
      ? snap.data().completedLessons
      : [];
}

function scheduleRender() {
  if (renderPending) return;
  renderPending = true;

  requestAnimationFrame(() => {
    renderPending = false;
    renderStudentModules();
  });
}

function renderStudentModules() {
  const dashboard = $("#studentDashboardV2");

  if (!dashboard || !auth.currentUser) return;

  const grid = $(".sv2-course-grid", dashboard);
  if (!grid) return;

  // Keep the original six hard-coded modules.
  const legacyCards = [
    ...grid.querySelectorAll(".sv2-course:not(.cs-dynamic-card)")
  ];

  // Remove only cards created by this file.
  grid.querySelectorAll(".cs-dynamic-card").forEach(card => card.remove());

  const activeModules = adminModules;

  const dynamicCards = activeModules.map((module, index) => {
    const done = completedLessons.includes(module.id);
    const title = module.title || "Untitled Module";
    const description = String(module.notes || "")
      .replace(/\s+/g, " ")
      .slice(0, 140) ||
      "Open this module to view Notes, Video and MCQ Test.";

    const article = document.createElement("article");
    article.className = "sv2-course cs-dynamic-card";

    const top = document.createElement("div");
    top.className = "sv2-course-top";

    const number = document.createElement("span");
    number.className = "sv2-module";
    number.textContent = `ADMIN MODULE ${index + 1}`;

    const status = document.createElement("span");
    status.className = "sv2-tag";
    status.textContent = done ? "✓ Completed" : "Course Module";

    top.append(number, status);

    const heading = document.createElement("h4");
    heading.textContent = title;

    const paragraph = document.createElement("p");
    paragraph.textContent = description;

    const meta = document.createElement("div");
    meta.className = "sv2-course-meta";
    meta.textContent = done
      ? "Progress saved"
      : "Notes • Video • MCQ";

    const buttons = document.createElement("div");
    buttons.className = "cs-buttons";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.textContent = done ? "Review Module ↗" : "Open Module ↗";
    openButton.addEventListener("click", () => openModule(module.id));

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.textContent = done ? "Mark incomplete" : "Mark complete";

    toggleButton.addEventListener("click", async () => {
      if (completedLessons.includes(module.id)) {
        await setCompletion(module.id, false);
      } else {
        notify("Pehle Open Module par jaakar MCQ Test pass karein.");
      }
    });

    buttons.append(openButton, toggleButton);
    article.append(top, heading, paragraph, meta, buttons);

    return article;
  });

  grid.append(...dynamicCards);

  // Calculate progress across the original and Admin-created modules.
  const legacyIds = legacyCards
    .map(card => card.querySelector("[data-lesson]")?.dataset.lesson)
    .filter(Boolean);

  const allIds = [...new Set([
    ...legacyIds,
    ...activeModules.map(module => module.id)
  ])];

  const completedCount = allIds.filter(id =>
    completedLessons.includes(id)
  ).length;

  const totalCount = allIds.length;
  const percent = totalCount
    ? Math.round(completedCount / totalCount * 100)
    : 0;

  const metricCards = dashboard.querySelectorAll(".sv2-metric");

  if (metricCards[1]) {
    const strong = metricCards[1].querySelector("strong");
    const small = metricCards[1].querySelector("small");
    const fill = metricCards[1].querySelector(".sv2-progress-fill");

    if (strong) strong.textContent = `${percent}%`;
    if (small) {
      small.textContent =
        `${completedCount} of ${totalCount} modules completed`;
    }
    if (fill) fill.style.width = `${percent}%`;
  }

  if (metricCards[2]) {
    const strong = metricCards[2].querySelector("strong");
    if (strong) strong.textContent = `${completedCount}/${totalCount}`;
  }

  const sectionTags = dashboard.querySelectorAll(".sv2-section-head .sv2-tag");
  const moduleTag = sectionTags[0];

  if (moduleTag) moduleTag.textContent = `${totalCount} modules`;
}

function openModule(id) {
  const module = adminModules.find(item => item.id === id);
  if (!module) return;

  activeModule = module;
  selectedAnswers = {};
  quizSubmitted = false;

  addStyles();

  $("#cs-title").textContent = module.title || "Course Module";
  $("#cs-modal").hidden = false;

  showTab("notes");
}

function showTab(tab) {
  if (!activeModule) return;

  const content = $("#cs-content");

  if (tab === "notes") {
    content.innerHTML = `
      <h3>Lesson Notes</h3>
      <div class="cs-note">${
        escapeHTML(activeModule.notes || "Admin has not added notes yet.")
      }</div>
    `;
    return;
  }

  if (tab === "video") {
    const url = String(activeModule.videoUrl || "").trim();

    if (url && /^https?:\/\//i.test(url)) {
      content.innerHTML = `
        <p class="cs-muted">Video lesson</p>
        <a class="cs-link"
           href="${escapeHTML(url)}"
           target="_blank"
           rel="noopener noreferrer">
          Open Video Lesson ↗
        </a>
      `;
    } else {
      content.innerHTML = `
        <p class="cs-muted">
          इस Module का वीडियो लिंक अभी उपलब्ध नहीं है।
        </p>
      `;
    }
    return;
  }

  if (tab === "quiz") renderQuiz();
}

function getValidQuestions() {
  return Array.isArray(activeModule?.questions)
    ? activeModule.questions.filter(question =>
        question &&
        typeof question.q === "string" &&
        Array.isArray(question.options) &&
        question.options.length === 4 &&
        question.options.every(option => typeof option === "string") &&
        Number.isInteger(Number(question.answer)) &&
        Number(question.answer) >= 0 &&
        Number(question.answer) <= 3
      )
    : [];
}

function renderQuiz() {
  const content = $("#cs-content");
  const questions = getValidQuestions();

  if (!questions.length) {
    content.innerHTML = `
      <p class="cs-muted">
        इस Module के लिए अभी सही format में MCQ उपलब्ध नहीं हैं।
        Admin से MCQ JSON जाँचने को कहें।
      </p>
    `;
    return;
  }

  const score = questions.reduce((total, question, index) => {
    return total +
      (Number(selectedAnswers[index]) === Number(question.answer) ? 1 : 0);
  }, 0);

  content.innerHTML = `
    <p class="cs-muted">
      कुल ${questions.length} प्रश्न। पास होने के लिए कम से कम 60% अंक चाहिए।
    </p>

    <form id="cs-quiz-form">
      ${questions.map((question, index) => `
        <fieldset class="cs-question">
          <legend>${index + 1}. ${escapeHTML(question.q)}</legend>

          ${question.options.map((option, optionIndex) => `
            <label class="cs-option">
              <input
                type="radio"
                name="q${index}"
                value="${optionIndex}"
                ${Number(selectedAnswers[index]) === optionIndex ? "checked" : ""}
                ${quizSubmitted ? "disabled" : ""}
              >
              <span>${escapeHTML(option)}</span>
            </label>
          `).join("")}

          ${quizSubmitted ? `
            <p class="cs-muted">
              Correct answer: ${
                escapeHTML(question.options[Number(question.answer)])
              }
            </p>
          ` : ""}
        </fieldset>
      `).join("")}

      ${quizSubmitted ? `
        <div class="cs-result">
          <strong>
            Score: ${score}/${questions.length}
            (${Math.round(score / questions.length * 100)}%)
          </strong>

          <p>${
            score / questions.length >= 0.6
              ? "Test passed! Module complete kar sakte hain."
              : "60% marks ke liye dobara try karein."
          }</p>

          <button type="button" id="cs-retry">Try Again</button>

          ${score / questions.length >= 0.6
            ? `<button type="button" id="cs-pass">Complete Module</button>`
            : ""}
        </div>
      ` : `<button type="submit">Submit Test</button>`}
    </form>
  `;

  const form = $("#cs-quiz-form");

  if (!quizSubmitted) {
    form.addEventListener("change", event => {
      const input = event.target;

      if (input.matches('input[type="radio"]')) {
        selectedAnswers[Number(input.name.slice(1))] =
          Number(input.value);
      }
    });

    form.addEventListener("submit", event => {
      event.preventDefault();

      if (Object.keys(selectedAnswers).length !== questions.length) {
        alert("कृपया सभी प्रश्नों के उत्तर दें।");
        return;
      }

      quizSubmitted = true;
      renderQuiz();
    });
  }

  $("#cs-retry")?.addEventListener("click", () => {
    selectedAnswers = {};
    quizSubmitted = false;
    renderQuiz();
  });

  $("#cs-pass")?.addEventListener("click", async () => {
    if (score / questions.length < 0.6) return;

    const moduleId = activeModule.id;
    const saved = await setCompletion(moduleId, true);

    if (saved) {
      $("#cs-modal").hidden = true;
      activeModule = null;
    }
  });
}

async function setCompletion(moduleId, complete) {
  const user = auth.currentUser;

  if (!user || user.uid !== currentUid) {
    notify("कृपया दोबारा Student Login करें।");
    return false;
  }

  const next = new Set(completedLessons);

  if (complete) {
    next.add(moduleId);
  } else {
    next.delete(moduleId);
  }

  try {
    await setDoc(
      doc(db, "studentProgress", user.uid),
      {
        completedLessons: [...next],
        lastLessonId: moduleId,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    completedLessons = [...next];
    scheduleRender();

    notify(
      complete
        ? "Module completed and progress saved."
        : "Module marked incomplete."
    );

    return true;
  } catch (error) {
    console.error("Progress save failed:", error);
    notify("Progress save nahi hua. Firestore Rules check karein.");
    return false;
  }
}

// Load Admin-created Modules without removing the original six cards.
function startCourseListener() {
  if (courseUnsubscribe) {
    courseUnsubscribe();
    courseUnsubscribe = null;
  }

  courseUnsubscribe = onSnapshot(
    collection(db, "courseModules"),
    snapshot => {
      adminModules = snapshot.docs
        .map(item => ({
          id: item.id,
          ...item.data()
        }))
        .filter(item =>
          item.active !== false &&
          typeof item.title === "string" &&
          item.title.trim().length > 0
        )
        .sort((a, b) =>
          String(a.title).localeCompare(String(b.title))
        );

      scheduleRender();
    },
    error => {
      console.error("Course modules load failed:", error);
      notify("Admin Modules load nahi hue. Firestore Rules check karein.");
    }
  );
}

// Notice when the dashboard first appears; do not observe our own card updates.
const dashboardObserver = new MutationObserver(() => {
  const dashboard = $("#studentDashboardV2");

  if (dashboard && dashboard !== renderedDashboard) {
    renderedDashboard = dashboard;
    scheduleRender();
  }

  if (!dashboard) renderedDashboard = null;
});

dashboardObserver.observe(document.body, {
  childList: true,
  subtree: true
});

onAuthStateChanged(auth, async user => {
  currentUid = user?.uid || null;
  completedLessons = [];
  adminModules = [];
  renderedDashboard = null;

  if (courseUnsubscribe) {
    courseUnsubscribe();
    courseUnsubscribe = null;
  }

  if (!user) return;

  try {
    await loadProgress();

    if (auth.currentUser?.uid !== currentUid) return;

    startCourseListener();
    scheduleRender();
  } catch (error) {
    console.error("Course sync setup failed:", error);
  }
});
