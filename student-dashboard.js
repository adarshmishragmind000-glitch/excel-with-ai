
/* Student Dashboard add-on for Excel with AI
   Does not replace app.js or change Firebase login. */

(() => {
  "use strict";

  const PREFIX = "excelWithAiStudentDashboard:v1:";

  const lessons = [
    { id: "l1", module: "Module 1", title: "Getting Started with Excel", note: "Workbook, worksheet, rows, columns and cells." },
    { id: "l2", module: "Module 1", title: "Data Entry & Formatting", note: "Enter data and format a worksheet." },
    { id: "l3", module: "Module 2", title: "Essential Formulas", note: "SUM, AVERAGE, MIN, MAX and COUNT." },
    { id: "l4", module: "Module 2", title: "Logical Functions", note: "Practice IF and logical formulas." },
    { id: "l5", module: "Module 3", title: "Charts & Reports", note: "Create charts from spreadsheet data." },
    { id: "l6", module: "Module 3", title: "Using AI with Excel", note: "Use clear prompts for formulas and analysis." }
  ];

  const quiz = [
    { q: "Which function adds numbers?", options: ["COUNT", "SUM", "IF", "MAX"], answer: 1 },
    { q: "Which function checks a condition?", options: ["IF", "MIN", "SUM", "AVERAGE"], answer: 0 },
    { q: "What is an Excel workbook?", options: ["A cell", "A chart", "An Excel file containing worksheets", "A formula"], answer: 2 }
  ];

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(PREFIX + key) || "{}");
    } catch {
      return {};
    }
  }

  function save(key, state) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(state));
      return true;
    } catch {
      alert("Progress save nahi hua. Browser storage settings check karein.");
      return false;
    }
  }

  function initDashboard() {
    const view = document.getElementById("dashboardView");
    if (!view || view.hidden || view.dataset.studentAddonReady === "yes") return;

    // Do not modify the Admin Dashboard.
    const eyebrow = view.querySelector(".dashboard-top .eyebrow");
    if (eyebrow && eyebrow.textContent.includes("ADMIN CONSOLE")) return;

    const email = (
      view.querySelector(".dashboard-top small")?.textContent ||
      "student"
    ).trim().toLowerCase();

    // Separate local progress for each signed-in email.
    const key = encodeURIComponent(email);
    const state = read(key);
    const completed = new Set(
      Array.isArray(state.completedLessons) ? state.completedLessons : []
    );

    view.dataset.studentAddonReady = "yes";

    const panel = document.createElement("section");
    panel.className = "dashboard-panel student-extra-panel";
    panel.innerHTML = `
      <div class="panel-heading">
        <div>
          <h2>My Learning Center</h2>
          <p>Lessons, practice quiz and your learning progress.</p>
        </div>
        <span class="pill pill-blue" data-progress-label>0% COMPLETE</span>
      </div>

      <div class="student-extra-progress">
        <span data-progress-bar></span>
      </div>

      <div class="student-extra-tabs">
        <button type="button" class="btn btn-primary" data-tab="lessons">Lessons & Notes</button>
        <button type="button" class="btn btn-outline" data-tab="quiz">Quick Quiz</button>
        <button type="button" class="btn btn-outline" data-tab="profile">My Profile</button>
      </div>

      <div data-extra-content></div>

      <p class="student-extra-note">
        Progress and quiz scores are saved in this browser only.
        They are not synced to Firebase or other devices.
      </p>
    `;

    const stats = view.querySelector(".dashboard-stats");
    if (stats) stats.insertAdjacentElement("afterend", panel);
    else view.appendChild(panel);

    const content = panel.querySelector("[data-extra-content]");

    function updateProgress() {
      const percent = Math.round(completed.size / lessons.length * 100);
      panel.querySelector("[data-progress-label]").textContent =
        `${percent}% COMPLETE`;
      panel.querySelector("[data-progress-bar]").style.width =
        `${percent}%`;
    }

    function renderLessons() {
      content.innerHTML = `
        <div class="student-extra-list">
          ${lessons.map(lesson => `
            <label class="student-extra-lesson">
              <input type="checkbox"
                data-lesson="${lesson.id}"
                ${completed.has(lesson.id) ? "checked" : ""}>
              <span>
                <strong>${esc(lesson.module)} · ${esc(lesson.title)}</strong>
                <small>${esc(lesson.note)}</small>
              </span>
              <span class="student-extra-status">
                ${completed.has(lesson.id) ? "Completed" : "Mark complete"}
              </span>
            </label>
          `).join("")}
        </div>
      `;

      content.querySelectorAll("[data-lesson]").forEach(input => {
        input.addEventListener("change", () => {
          if (input.checked) completed.add(input.dataset.lesson);
          else completed.delete(input.dataset.lesson);

          state.completedLessons = [...completed];

          if (save(key, state)) {
            updateProgress();
            input.closest(".student-extra-lesson")
              .querySelector(".student-extra-status").textContent =
              input.checked ? "Completed" : "Mark complete";
          }
        });
      });
    }

    function renderQuiz() {
      content.innerHTML = `
        <form class="student-extra-quiz">
          <p>Choose one answer for each question.</p>

          ${quiz.map((item, i) => `
            <fieldset>
              <legend>${i + 1}. ${esc(item.q)}</legend>
              ${item.options.map((option, j) => `
                <label>
                  <input type="radio" name="q${i}" value="${j}" required>
                  ${esc(option)}
                </label>
              `).join("")}
            </fieldset>
          `).join("")}

          <button class="btn btn-primary" type="submit">Submit Quiz</button>
          <p class="student-extra-result" aria-live="polite"></p>
        </form>
      `;

      const form = content.querySelector("form");

      if (state.lastQuiz) {
        content.querySelector(".student-extra-result").textContent =
          `Previous score: ${state.lastQuiz.score}/${state.lastQuiz.total}`;
      }

      form.addEventListener("submit", event => {
        event.preventDefault();
        const answers = new FormData(form);
        let score = 0;

        quiz.forEach((item, i) => {
          if (Number(answers.get(`q${i}`)) === item.answer) score++;
        });

        state.lastQuiz = {
          score,
          total: quiz.length,
          attemptedAt: new Date().toISOString()
        };

        if (save(key, state)) {
          content.querySelector(".student-extra-result").textContent =
            `Your score: ${score}/${quiz.length}. ${
              score === quiz.length
                ? "Excellent work!"
                : "Review the lessons and try again."
            }`;
        }
      });
    }

    function renderProfile() {
      content.innerHTML = `
        <div class="student-extra-profile">
          <div>
            <small>Signed-in account</small>
            <strong>${esc(email)}</strong>
          </div>
          <div>
            <small>Course</small>
            <strong>Excel with AI</strong>
          </div>
          <div>
            <small>Completed lessons</small>
            <strong>${completed.size} of ${lessons.length}</strong>
          </div>
          <div>
            <small>Latest quiz score</small>
            <strong>${
              state.lastQuiz
                ? `${state.lastQuiz.score}/${state.lastQuiz.total}`
                : "Not attempted yet"
            }</strong>
          </div>
        </div>
        <p class="student-extra-note">
          Login and account details are managed by the existing authentication system.
        </p>
      `;
    }

    function showTab(tab) {
      panel.querySelectorAll("[data-tab]").forEach(button => {
        const active = button.dataset.tab === tab;
        button.classList.toggle("btn-primary", active);
        button.classList.toggle("btn-outline", !active);
        button.setAttribute("aria-pressed", String(active));
      });

      if (tab === "quiz") renderQuiz();
      else if (tab === "profile") renderProfile();
      else renderLessons();
    }

    panel.querySelectorAll("[data-tab]").forEach(button => {
      button.addEventListener("click", () => showTab(button.dataset.tab));
    });

    updateProgress();
    showTab("lessons");
  }

  // Dashboard is created dynamically by the existing app.js.
  const observer = new MutationObserver(initDashboard);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["hidden"]
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboard);
  } else {
    initDashboard();
  }
})();
