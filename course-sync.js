
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

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let modules = [];
let completedLessons = [];
let currentUid = null;
let activeModule = null;
let answers = {};
let submitted = false;
let courseUnsubscribe = null;
let renderTimer = null;

const $ = (selector, root = document) => root.querySelector(selector);

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function notify(message) {
  const toast = $("#toast");
  if (toast) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  } else {
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
    #cs-modal button, #cs-modal .cs-link {
      padding:10px 14px; border:1px solid #425a80;
      border-radius:9px; color:#eef3ff; background:#1c2b47;
      cursor:pointer; display:inline-block; text-decoration:none;
    }
    #cs-modal .cs-head h2 { font-size:21px; }
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
    .cs-card-status { font-size:11px; color:#a9c3ff; }
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
    if (event.target === modal || event.target.closest("[data-cs-close]")) {
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

function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => renderStudentModules(), 250);
}

async function loadProgress() {
  if (!auth.currentUser) return;

  const uid = auth.currentUser.uid;
  const snap = await getDoc(doc(db, "studentProgress", uid));

  completedLessons = snap.exists() &&
    Array.isArray(snap.data().completedLessons)
      ? snap.data().completedLessons
      : [];
}

function renderStudentModules() {
  const dashboard = $("#studentDashboardV2");
  if (!dashboard || !auth.currentUser) return;

  // Admin-created modules take over the course list when available.
  if (!modules.length) return;

  const grid = $(".sv2-course-grid", dashboard);
  if (!grid) return;

  const doneCount = modules.filter(m => completedLessons.includes(m.id)).length;
  const percent = modules.length
    ? Math.round(doneCount / modules.length * 100)
    : 0;

  const metricCards = dashboard.querySelectorAll(".sv2-metric");
  if (metricCards[1]) {
    const strong = metricCards[1].querySelector("strong");
    const small = metricCards[1].querySelector("small");
    const fill = metricCards[1].querySelector(".sv2-progress-fill");
    if (strong) strong.textContent = percent + "%";
    if (small) small.textContent = `${doneCount} of ${modules.length} modules completed`;
    if (fill) fill.style.width = percent + "%";
  }

  if (metricCards[2]) {
    const strong = metricCards[2].querySelector("strong");
    if (strong) strong.textContent = `${doneCount}/${modules.length}`;
  }

  const countTag = dashboard.querySelector(".sv2-section-head .sv2-tag");
  if (countTag) countTag.textContent = `${modules.length} modules`;

  grid.innerHTML = modules.map((module, index) => {
    const done = completedLessons.includes(module.id);
    const title = module.title || "Untitled Module";
    const noteText = module.notes || "";
    const description = noteText.replace(/\s+/g, " ").slice(0, 140) ||
      "Open this module to view lesson content and MCQ test.";

    return `
      <article class="sv2-course">
        <div class="sv2-course-top">
          <span class="sv2-module">Module ${String(index + 1).padStart(2, "0")}</span>
          <span class="sv2-tag">${done ? "✓ Completed" : "Course Module"}</span>
        </div>
        <h4>${esc(title)}</h4>
        <p>${esc(description)}</p>
        <div class="sv2-course-meta">
          <span class="cs-card-status">${done ? "Progress saved" : "Notes • Video • MCQ"}</span>
        </div>
        <button type="button" data-cs-open="${esc(module.id)}">
          ${done ? "Review Module" : "Open Module"} ↗
        </button>
        <div style="margin-top:8px">
          <button type="button" data-cs-toggle="${esc(module.id)}"
            style="width:100%">
            ${done ? "Mark incomplete" : "Mark complete"}
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function openModule(id) {
  const module = modules.find(item => item.id === id);
  if (!module) return;

  activeModule = module;
  answers = {};
  submitted = false;

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
      <div class="cs-note">${esc(activeModule.notes || "Admin has not added notes yet.")}</div>
    `;
    return;
  }

  if (tab === "video") {
    const url = String(activeModule.videoUrl || "").trim();

    if (url && /^https?:\/\//i.test(url)) {
      content.innerHTML = `
        <p class="cs-muted">Video lesson</p>
        <a class="cs-link" href="${esc(url)}" target="_blank"
           rel="noopener noreferrer">Open Video Lesson ↗</a>
      `;
    } else {
      content.innerHTML = `<p class="cs-muted">इस Module का वीडियो लिंक अभी उपलब्ध नहीं है।</p>`;
    }
    return;
  }

  if (tab === "quiz") renderQuiz();
}

function renderQuiz() {
  const content = $("#cs-content");
  const questions = Array.isArray(activeModule.questions)
    ? activeModule.questions.filter(q =>
        q && typeof q.q === "string" &&
        Array.isArray(q.options) && q.options.length === 4 &&
        Number.isInteger(Number(q.answer)) &&
        Number(q.answer) >= 0 && Number(q.answer) <= 3
      )
    : [];

  if (!questions.length) {
    content.innerHTML = `
      <p class="cs-muted">इस Module के लिए अभी MCQ उपलब्ध नहीं हैं। Admin से MCQ जोड़ने को कहें।</p>
    `;
    return;
  }

  const score = questions.reduce((total, question, index) =>
    total + (Number(answers[index]) === Number(question.answer) ? 1 : 0), 0
  );

  content.innerHTML = `
    <p class="cs-muted">कुल ${questions.length} प्रश्न। पास होने के लिए 60% अंक चाहिए।</p>
    <form id="cs-quiz">
      ${questions.map((question, index) => `
        <fieldset class="cs-question">
          <legend>${index + 1}. ${esc(question.q)}</legend>
          ${question.options.map((option, optionIndex) => `
            <label class="cs-option">
              <input type="radio" name="q${index}" value="${optionIndex}"
                ${Number(answers[index]) === optionIndex ? "checked" : ""}
                ${submitted ? "disabled" : ""}>
              <span>${esc(option)}</span>
            </label>
          `).join("")}
          ${submitted ? `<p class="cs-muted">Correct answer: ${esc(question.options[Number(question.answer)])}</p>` : ""}
        </fieldset>
      `).join("")}
      ${submitted ? `
        <div class="cs-result">
          <strong>Score: ${score}/${questions.length} (${Math.round(score / questions.length * 100)}%)</strong>
          <p>${score / questions.length >= 0.6 ? "Test passed!" : "पास होने के लिए फिर कोशिश करें।"}</p>
          <button type="button" id="cs-retry">Try Again</button>
          ${score / questions.length >= 0.6
            ? `<button type="button" id="cs-pass">Complete Module</button>`
            : ""}
        </div>
      ` : `<button type="submit">Submit Test</button>`}
    </form>
  `;

  const form = $("#cs-quiz");
  if (!submitted) {
    form.addEventListener("change", event => {
      const input = event.target;
      if (input.matches('input[type="radio"]')) {
        answers[Number(input.name.slice(1))] = Number(input.value);
      }
    });

    form.addEventListener("submit", event => {
      event.preventDefault();
      if (Object.keys(answers).length !== questions.length) {
        alert("कृपया सभी प्रश्नों के उत्तर दें।");
        return;
      }
      submitted = true;
      renderQuiz();
    });
  }

  $("#cs-retry")?.addEventListener("click", () => {
    answers = {};
    submitted = false;
    renderQuiz();
  });

  $("#cs-pass")?.addEventListener("click", async () => {
    if (score / questions.length < 0.6) return;
    await setCompletion(activeModule.id, true);
    $("#cs-modal").hidden = true;
  });
}

async function setCompletion(moduleId, complete) {
  const user = auth.currentUser;
  if (!user) {
    notify("कृपया Student Login करें।");
    return;
  }

  const next = new Set(completedLessons);
  if (complete) next.add(moduleId);
  else next.delete(moduleId);

  try {
    await setDoc(doc(db, "studentProgress", user.uid), {
      completedLessons: [...next],
      lastLessonId: moduleId,
      updatedAt: serverTimestamp()
    }, { merge: true });

    completedLessons = [...next];
    scheduleRender();
    notify(complete ? "Module completed and progress saved." : "Module marked incomplete.");
  } catch (error) {
    console.error("Module progress save failed:", error);
    notify("Progress save नहीं हुआ। Firestore Rules जाँचें।");
  }
}

document.addEventListener("click", async event => {
  const openButton = event.target.closest("[data-cs-open]");
  if (openButton) {
    event.preventDefault();
    event.stopPropagation();
    openModule(openButton.dataset.csOpen);
    return;
  }

  const toggleButton = event.target.closest("[data-cs-toggle]");
  if (toggleButton) {
    event.preventDefault();
    event.stopPropagation();

    const id = toggleButton.dataset.csToggle;
    const isDone = completedLessons.includes(id);
    await setCompletion(id, !isDone);
  }
}, true);

function startCourseListener() {
  if (courseUnsubscribe) courseUnsubscribe();

  courseUnsubscribe = onSnapshot(collection(db, "courseModules"), snapshot => {
    modules = snapshot.docs
      .map(item => ({ id: item.id, ...item.data() }))
      .filter(item => item.active !== false)
      .sort((a, b) =>
        String(a.title || "").localeCompare(String(b.title || ""))
      );

    scheduleRender();
  }, error => {
    console.error("Course module loading failed:", error);
    notify("Course Modules load नहीं हुए। Firestore Rules जाँचें।");
  });
}

const dashboardObserver = new MutationObserver(() => {
  if ($("#studentDashboardV2") && auth.currentUser) scheduleRender();
});

dashboardObserver.observe(document.body, {
  childList: true,
  subtree: true
});

onAuthStateChanged(auth, async user => {
  currentUid = user?.uid || null;
  completedLessons = [];

  if (!user) {
    if (courseUnsubscribe) {
      courseUnsubscribe();
      courseUnsubscribe = null;
    }
    modules = [];
    return;
  }

  try {
    await loadProgress();
    if (auth.currentUser?.uid !== currentUid) return;
    startCourseListener();
    scheduleRender();
  } catch (error) {
    console.error("Course sync initialization failed:", error);
  }
});
