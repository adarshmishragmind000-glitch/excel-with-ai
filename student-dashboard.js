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
const $ = (selector, root = document) => root.querySelector(selector);

const LESSONS = [
  {
    id: "excel-foundations",
    module: "Module 01",
    title: "Excel Foundations",
    description: "Workbook basics, rows, columns, cells and navigation.",
    level: "Beginner",
    duration: "25 min"
  },
  {
    id: "clean-data",
    module: "Module 02",
    title: "Clean & Organise Data",
    description: "Formatting, tables, sorting, filters and clean datasets.",
    level: "Beginner",
    duration: "35 min"
  },
  {
    id: "essential-formulas",
    module: "Module 03",
    title: "Essential Formulas",
    description: "SUM, AVERAGE, COUNT, IF and practical formula patterns.",
    level: "Core skill",
    duration: "45 min"
  },
  {
    id: "lookup-functions",
    module: "Module 04",
    title: "Lookup & Logic",
    description: "VLOOKUP, IFERROR and reliable lookup workflows.",
    level: "Core skill",
    duration: "45 min"
  },
  {
    id: "business-dashboard",
    module: "Module 05",
    title: "Business Dashboard",
    description: "KPIs, charts and a useful monthly performance report.",
    level: "Project",
    duration: "60 min"
  },
  {
    id: "ai-workflows",
    module: "Module 06",
    title: "Excel with AI",
    description: "Write better prompts, explain formulas and plan automation.",
    level: "AI lab",
    duration: "45 min"
  }
];

let lastRenderedUid = null;
let observer = null;
let discoveryObserver = null;
let loadingUid = null;

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

    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3200);
  } else {
    console.info(message);
  }
}

function addDashboardStyles() {
  if ($("#student-dashboard-runtime-style")) return;

  const style = document.createElement("style");
  style.id = "student-dashboard-runtime-style";

  style.textContent = `
    .student-v2 {
      margin: 26px 0 32px;
      color: #f4f6ff;
      font-family: inherit;
    }

    .student-v2 * {
      box-sizing: border-box;
    }

    .student-v2 .sv2-welcome {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 18px;
      padding: 24px;
      border: 1px solid rgba(147,177,255,.2);
      border-radius: 20px;
      background:
        radial-gradient(ellipse at 90% 0%,rgba(104,119,255,.2),transparent 42%),
        linear-gradient(135deg,#172541,#10182b);
    }

    .student-v2 .sv2-kicker {
      font-size: 10px;
      letter-spacing: 1.8px;
      color: #9bbaff;
      font-weight: 800;
    }

    .student-v2 .sv2-welcome h2 {
      font-size: clamp(25px,3vw,36px);
      letter-spacing: -1px;
      margin: 10px 0 8px;
    }

    .student-v2 .sv2-welcome p {
      color: #aab8d5;
      font-size: 13px;
      line-height: 1.7;
      margin-bottom: 0;
    }

    .student-v2 .sv2-id {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 14px;
      padding: 8px 11px;
      border-radius: 9px;
      background: #0b1428;
      border: 1px solid #334567;
      color: #dce7ff;
      font-size: 12px;
    }

    .student-v2 .sv2-status {
      white-space: nowrap;
      padding: 8px 11px;
      border-radius: 999px;
      background: #203c39;
      color: #91f0cc;
      border: 1px solid #2d6b5d;
      font-size: 11px;
      font-weight: 800;
    }

    .student-v2 .sv2-status.pending {
      background: #42351e;
      color: #ffdb8b;
      border-color: #66532d;
    }

    .student-v2 .sv2-metrics {
      display: grid;
      grid-template-columns: repeat(3,minmax(0,1fr));
      gap: 12px;
      margin-top: 14px;
    }

    .student-v2 .sv2-metric {
      padding: 17px;
      border: 1px solid #2b3b5d;
      border-radius: 15px;
      background: #111c32;
      min-width: 0;
    }

    .student-v2 .sv2-metric span {
      display: block;
      color: #9eafcf;
      font-size: 11px;
      margin-bottom: 9px;
    }

    .student-v2 .sv2-metric strong {
      font-size: clamp(16px,2vw,25px);
      letter-spacing: -.5px;
      overflow-wrap: anywhere;
    }

    .student-v2 .sv2-metric small {
      display: block;
      color: #8394b7;
      font-size: 10px;
      margin-top: 7px;
    }

    .student-v2 .sv2-section-head {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 14px;
      margin: 28px 0 14px;
    }

    .student-v2 .sv2-section-head h3 {
      font-size: 19px;
      letter-spacing: -.4px;
      margin-bottom: 5px;
    }

    .student-v2 .sv2-section-head p {
      font-size: 12px;
      color: #91a1c1;
      margin-bottom: 0;
    }

    .student-v2 .sv2-course-grid {
      display: grid;
      grid-template-columns: repeat(2,minmax(0,1fr));
      gap: 12px;
    }

    .student-v2 .sv2-course {
      padding: 18px;
      border: 1px solid #2c3c5e;
      border-radius: 16px;
      background: linear-gradient(145deg,#141f36,#10182b);
      min-width: 0;
    }

    .student-v2 .sv2-course-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 15px;
    }

    .student-v2 .sv2-module {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1px;
      color: #9cbaff;
    }

    .student-v2 .sv2-tag {
      font-size: 10px;
      color: #b8c7e5;
      border: 1px solid #334563;
      border-radius: 999px;
      padding: 5px 8px;
    }

    .student-v2 .sv2-course h4 {
      font-size: 15px;
      margin: 0 0 8px;
    }

    .student-v2 .sv2-course p {
      font-size: 12px;
      line-height: 1.7;
      color: #9caccb;
      min-height: 40px;
      margin: 0 0 14px;
    }

    .student-v2 .sv2-course-meta {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      color: #8598ba;
      font-size: 10px;
      margin-bottom: 14px;
    }

    .student-v2 .sv2-course button {
      width: 100%;
      border: 1px solid #405681;
      background: #1b2b49;
      color: #e9f0ff;
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
    }

    .student-v2 .sv2-course button:hover {
      background: #243b63;
    }

    .student-v2 .sv2-course button:disabled {
      opacity: .55;
      cursor: not-allowed;
    }

    .student-v2 .sv2-progress-track {
      height: 7px;
      overflow: hidden;
      background: #263552;
      border-radius: 999px;
      margin-top: 12px;
    }

    .student-v2 .sv2-progress-fill {
      height: 100%;
      background: #80a8ff;
      border-radius: inherit;
      transition: width .25s ease;
    }

    .student-v2 .sv2-resources {
      display: grid;
      grid-template-columns: repeat(3,minmax(0,1fr));
      gap: 12px;
    }

    .student-v2 .sv2-resource {
      padding: 16px;
      border: 1px solid #293a5b;
      background: #111b30;
      border-radius: 14px;
    }

    .student-v2 .sv2-resource-icon {
      font-size: 20px;
      margin-bottom: 12px;
    }

    .student-v2 .sv2-resource b {
      display: block;
      font-size: 12px;
      margin-bottom: 6px;
    }

    .student-v2 .sv2-resource p {
      font-size: 11px;
      line-height: 1.6;
      color: #91a1c0;
      margin: 0;
    }

    .student-v2 .sv2-notice {
      padding: 16px 18px;
      border: 1px solid #354b72;
      background: #15233d;
      border-radius: 14px;
      color: #c9d8f6;
      font-size: 12px;
      line-height: 1.7;
      margin-top: 14px;
    }

    .student-v2 .sv2-notice strong {
      color: #fff;
    }

    .student-v2 .sv2-legacy {
      margin-top: 16px;
    }

    .student-v2 .sv2-legacy summary {
      cursor: pointer;
      color: #a9bee9;
      font-size: 12px;
      padding: 12px 2px;
    }

    .student-v2 .sv2-legacy .dashboard-panel {
      margin-top: 0;
    }

    @media(max-width:700px) {
      .student-v2 .sv2-welcome {
        padding: 18px;
        flex-direction: column;
      }

      .student-v2 .sv2-metrics,
      .student-v2 .sv2-course-grid,
      .student-v2 .sv2-resources {
        grid-template-columns: 1fr;
      }

      .student-v2 .sv2-section-head {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `;

  document.head.appendChild(style);
}

function makeDashboardMarkup(profile, progress) {
  const fullName =
    profile?.name ||
    auth.currentUser?.displayName ||
    "Student";

  const firstName = fullName.trim().split(/\s+/)[0] || "Student";
  const studentId = profile?.studentId || "ID not available";
  const course = profile?.course || "Excel with AI";
  const status = profile?.status || "Pending Approval";
  const approved = ["Active", "Approved"].includes(status);

  const completed = Array.isArray(progress?.completedLessons)
    ? progress.completedLessons.filter(id =>
        LESSONS.some(lesson => lesson.id === id)
      )
    : [];

  const percent = Math.round(
    (completed.length / LESSONS.length) * 100
  );

  return `
    <section class="student-v2" id="studentDashboardV2"
      aria-label="Student dashboard">

      <div class="sv2-welcome">
        <div>
          <div class="sv2-kicker">YOUR LEARNING OVERVIEW</div>
          <h2>Welcome back, ${escapeHTML(firstName)}.</h2>
          <p>Continue your lessons and track your learning progress in one place.</p>
          <div class="sv2-id">
            Student ID: <strong>${escapeHTML(studentId)}</strong>
          </div>
        </div>

        <span class="sv2-status ${approved ? "" : "pending"}">
          ${approved ? "✓ Account Active" : "◷ Awaiting approval"}
        </span>
      </div>

      <div class="sv2-metrics">
        <article class="sv2-metric">
          <span>Course</span>
          <strong>${escapeHTML(course)}</strong>
          <small>Your assigned learning path</small>
        </article>

        <article class="sv2-metric">
          <span>Learning progress</span>
          <strong>${percent}%</strong>
          <div class="sv2-progress-track">
            <div class="sv2-progress-fill" style="width:${percent}%"></div>
          </div>
          <small>${completed.length} of ${LESSONS.length} modules completed</small>
        </article>

        <article class="sv2-metric">
          <span>Completed modules</span>
          <strong>${completed.length}/${LESSONS.length}</strong>
          <small>Progress saved to your account</small>
        </article>
      </div>

      ${approved ? "" : `
        <div class="sv2-notice">
          <strong>Account review in progress.</strong><br>
          Your registration is saved. Modules unlock after Admin approval.
        </div>
      `}

      <div class="sv2-section-head">
        <div>
          <h3>My learning path</h3>
          <p>Build your Excel skills step by step.</p>
        </div>
        <span class="sv2-tag">${LESSONS.length} modules</span>
      </div>

      <div class="sv2-course-grid">
        ${LESSONS.map((lesson, index) => {
          const done = completed.includes(lesson.id);
          const locked = !approved;

          return `
            <article class="sv2-course">
              <div class="sv2-course-top">
                <span class="sv2-module">${escapeHTML(lesson.module)}</span>
                <span class="sv2-tag">
                  ${done ? "✓ Completed" : locked ? "Locked" : escapeHTML(lesson.level)}
                </span>
              </div>

              <h4>${escapeHTML(lesson.title)}</h4>
              <p>${escapeHTML(lesson.description)}</p>

              <div class="sv2-course-meta">
                <span>◷ ${escapeHTML(lesson.duration)}</span>
                <span>${done ? "Progress saved" : "Practical learning"}</span>
              </div>

              <button type="button"
                data-lesson="${escapeHTML(lesson.id)}"
                ${locked ? "disabled" : ""}>
                ${done ? "Mark incomplete" : "Mark complete"} ↗
              </button>
            </article>
          `;
        }).join("")}
      </div>

      <div class="sv2-section-head">
        <div>
          <h3>Quick access</h3>
          <p>Your learning resources at a glance.</p>
        </div>
      </div>

      <div class="sv2-resources">
        <article class="sv2-resource">
          <div class="sv2-resource-icon">▦</div>
          <b>Practice projects</b>
          <p>Practise salary sheets, attendance trackers and reports.</p>
        </article>

        <article class="sv2-resource">
          <div class="sv2-resource-icon">✦</div>
          <b>AI Prompt Lab</b>
          <p>Practise prompts for formulas and spreadsheet workflows.</p>
        </article>

        <article class="sv2-resource">
          <div class="sv2-resource-icon">✓</div>
          <b>Results & certificates</b>
          <p>Assessment and certificate records can be connected later.</p>
        </article>
      </div>

      <details class="sv2-legacy">
        <summary>View account details</summary>
        <div class="dashboard-panel">
          <p><strong>Full name:</strong> ${escapeHTML(fullName)}</p>
          <p><strong>Student ID:</strong> ${escapeHTML(studentId)}</p>
          <p><strong>Mobile:</strong> ${escapeHTML(profile?.phone || "Not provided")}</p>
          <p><strong>Email:</strong> ${escapeHTML(profile?.contactEmail || "Not provided")}</p>
          <p><strong>Course:</strong> ${escapeHTML(course)}</p>
          <p><strong>Status:</strong> ${escapeHTML(status)}</p>
        </div>
      </details>
    </section>
  `;
}

async function enhanceStudentDashboard() {
  const view = $("#dashboardView");
  const user = auth.currentUser;

  if (!view || view.hidden || !user) return;
  if (loadingUid === user.uid) return;

  // Admin dashboard ko touch nahi karna.
  if (
    view.querySelector(".dashboard-top .eyebrow")
      ?.textContent?.includes("ADMIN CONSOLE")
  ) {
    return;
  }

  if (
    view.querySelector("#studentDashboardV2") &&
    lastRenderedUid === user.uid
  ) {
    return;
  }

  const oldPanel = view.querySelector(".dashboard-panel");
  if (!oldPanel) return;

  loadingUid = user.uid;

  try {
    const profileSnap = await getDoc(
      doc(db, "studentProfiles", user.uid)
    );

    if (!profileSnap.exists()) {
      console.warn("Student profile not found; preserving existing dashboard.");
      return;
    }

    const profile = profileSnap.data();
    let progress = {};

    try {
      const progressSnap = await getDoc(
        doc(db, "studentProgress", user.uid)
      );

      if (progressSnap.exists()) {
        progress = progressSnap.data();
      }
    } catch (progressError) {
      console.warn("Progress could not be loaded:", progressError);
    }

    // Login/user badal gaya ho to purana data render na karein.
    if (auth.currentUser?.uid !== user.uid) return;

    addDashboardStyles();

    view.querySelector("#studentDashboardV2")?.remove();

    const holder = document.createElement("div");
    holder.innerHTML = makeDashboardMarkup(profile, progress).trim();

    const dashboard = holder.firstElementChild;
    oldPanel.before(dashboard);
    oldPanel.hidden = true;

    lastRenderedUid = user.uid;

    dashboard.querySelectorAll("[data-lesson]").forEach(button => {
      button.addEventListener("click", async () => {
        if (button.disabled || auth.currentUser?.uid !== user.uid) return;

        const lessonId = button.dataset.lesson;

        if (!LESSONS.some(lesson => lesson.id === lessonId)) return;

        const current = Array.isArray(progress.completedLessons)
          ? progress.completedLessons
          : [];

        const wasDone = current.includes(lessonId);
        const completed = new Set(current);

        if (wasDone) {
          completed.delete(lessonId);
        } else {
          completed.add(lessonId);
        }

        button.disabled = true;
        const previousText = button.textContent;
        button.textContent = "Saving progress…";

        try {
          await setDoc(
            doc(db, "studentProgress", user.uid),
            {
              completedLessons: [...completed],
              lastLessonId: lessonId,
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );

          progress.completedLessons = [...completed];
          progress.lastLessonId = lessonId;

          notify(
            wasDone
              ? "Module marked incomplete."
              : "Learning progress saved."
          );

          lastRenderedUid = null;
          await enhanceStudentDashboard();
        } catch (error) {
          console.error("Progress save failed:", error);

          button.disabled = false;
          button.textContent = previousText;

          notify(
            "Progress save failed. Check Firestore Rules and account approval."
          );
        }
      });
    });
  } catch (error) {
    console.error("Student dashboard load error:", error);
    notify("Dashboard load nahi hua. Please refresh and try again.");
  } finally {
    loadingUid = null;
  }
}

function observeDashboard() {
  const attach = () => {
    const root = $("#dashboardView");
    if (!root) return false;

    if (observer) observer.disconnect();

    observer = new MutationObserver(() => {
      if (root.hidden) {
        lastRenderedUid = null;
        return;
      }

      requestAnimationFrame(() => {
        enhanceStudentDashboard().catch(console.error);
      });
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden"]
    });

    if (!root.hidden) {
      setTimeout(() => {
        enhanceStudentDashboard().catch(console.error);
      }, 150);
    }

    return true;
  };

  if (attach()) return;

  if (discoveryObserver) discoveryObserver.disconnect();

  discoveryObserver = new MutationObserver(() => {
    if ($("#dashboardView")) {
      discoveryObserver.disconnect();
      attach();
    }
  });

  discoveryObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

onAuthStateChanged(auth, user => {
  if (!user) {
    lastRenderedUid = null;
    loadingUid = null;

    $("#studentDashboardV2")?.remove();

    const oldPanel = $("#dashboardView .dashboard-panel");
    if (oldPanel) oldPanel.hidden = false;

    if (observer) observer.disconnect();
    if (discoveryObserver) discoveryObserver.disconnect();

    return;
  }

  observeDashboard();

  setTimeout(() => {
    enhanceStudentDashboard().catch(console.error);
  }, 350);
});
