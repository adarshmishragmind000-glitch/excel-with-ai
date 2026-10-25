
(() => {
  "use strict";

  const root = document.getElementById("learningToolsRoot");
  if (!root || root.dataset.initialized === "true") return;
  root.dataset.initialized = "true";

  const formulas = [
    ["SUM", "Basic", "=SUM(A1:A10)", "A1 से A10 तक numbers जोड़ें।"],
    ["AVERAGE", "Basic", "=AVERAGE(A1:A10)", "Average निकालें।"],
    ["MAX", "Basic", "=MAX(A1:A10)", "सबसे बड़ी value निकालें।"],
    ["MIN", "Basic", "=MIN(A1:A10)", "सबसे छोटी value निकालें।"],
    ["COUNT", "Basic", "=COUNT(A1:A10)", "Numeric cells गिनें।"],
    ["COUNTA", "Basic", "=COUNTA(A1:A10)", "Non-empty cells गिनें।"],
    ["IF", "Logical", '=IF(A1>=33,"Pass","Fail")', "Condition के अनुसार Pass या Fail।"],
    ["COUNTIF", "Logical", '=COUNTIF(A1:A20,"Pass")', "Pass वाली entries गिनें।"],
    ["SUMIF", "Logical", '=SUMIF(A1:A10,"Pen",B1:B10)', "Condition के अनुसार numbers जोड़ें।"],
    ["VLOOKUP", "Lookup", "=VLOOKUP(E2,A2:C20,3,FALSE)", "पहले column में खोजकर तीसरे column से result लें।"],
    ["INDEX + MATCH", "Lookup", "=INDEX(B2:B20,MATCH(E2,A2:A20,0))", "Matching value खोजें।"],
    ["LEFT", "Text", "=LEFT(A2,3)", "बाईं ओर से 3 characters लें।"],
    ["LEN", "Text", "=LEN(A2)", "Text की length निकालें।"],
    ["CONCATENATE", "Text", '=CONCATENATE(A2," ",B2)', "दो cells के text को जोड़ें।"],
    ["TODAY", "Date", "=TODAY()", "आज की तारीख दिखाएँ।"],
    ["ROUND", "Math", "=ROUND(A1,2)", "Number को 2 decimal places तक round करें।"]
  ];

  const questions = [
    { q: "Numbers जोड़ने का सही formula?", o: ["=ADD(A1:A10)", "=SUM(A1:A10)", "=TOTAL(A1:A10)", "=PLUS(A1:A10)"], a: 1, e: "SUM numbers जोड़ता है।" },
    { q: "Average के लिए कौन-सा function है?", o: ["COUNT", "MAX", "AVERAGE", "MIN"], a: 2, e: "AVERAGE औसत निकालता है।" },
    { q: "Pass/Fail के लिए कौन-सा function उपयोगी है?", o: ["IF", "LEFT", "MAX", "LEN"], a: 0, e: "IF condition के अनुसार result देता है।" },
    { q: "सबसे बड़ी value निकालने के लिए?", o: ["MIN", "MAX", "COUNT", "LEN"], a: 1, e: "MAX सबसे बड़ी value देता है।" },
    { q: "Non-empty cells गिनने के लिए?", o: ["COUNT", "COUNTA", "SUM", "MIN"], a: 1, e: "COUNTA भरी हुई cells गिनता है।" },
    { q: "आज की तारीख के लिए formula?", o: ["=NOWDATE()", "=TODAY()", "=CURRENT()", "=DATE NOW"], a: 1, e: "TODAY() वर्तमान तारीख देता है।" },
    { q: "Text की length निकालने के लिए?", o: ["LEFT", "RIGHT", "LEN", "IF"], a: 2, e: "LEN characters की संख्या बताता है।" },
    { q: "Condition के आधार पर जोड़ने के लिए?", o: ["SUMIF", "COUNT", "MAX", "LEFT"], a: 0, e: "SUMIF condition पूरी करने वाली values जोड़ता है।" },
    { q: "VLOOKUP में FALSE क्या बताता है?", o: ["Approximate match", "Exact match", "Delete", "Sort"], a: 1, e: "FALSE exact match के लिए है।" },
    { q: "Numeric cells गिनने के लिए?", o: ["COUNTA", "COUNT", "SUMIF", "LEN"], a: 1, e: "COUNT numeric cells गिनता है।" }
  ];

  const esc = value => String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);

  const jumpCard = (id, icon, title, description) => `
    <button type="button" class="hl-card" data-toggle="${id}"
      aria-expanded="false" aria-controls="${id}">
      <span class="hl-icon">${icon}</span>
      <span class="hl-card-text">
        <strong>${title}</strong>
        <small>${description}</small>
      </span>
      <span class="hl-chevron" aria-hidden="true">⌄</span>
    </button>`;

  root.innerHTML = `
    <section class="learning-tools-section hl-home">
      <div class="hl-welcome">
        <span class="hl-eyebrow">YOUR LEARNING SPACE</span>
        <h2>Learn Excel Smarter.</h2>
        <p>Learn • Practice • Improve</p>
      </div>

      <div class="hl-grid">
        ${jumpCard("hlDashboard", "📊", "Learning Dashboard", "View your practice progress")}
        ${jumpCard("hlFormulas", "📚", "Formula Library", "Search and copy formulas")}
        ${jumpCard("hlPractice", "🎯", "Excel Practice Zone", "Practice MCQ questions")}
        ${jumpCard("hlTips", "✨", "Quick Excel Tips", "Useful shortcuts and tips")}
      </div>
    </section>

    <section id="hlDashboard" class="hl-panel learning-tools-section" hidden>
      <h2>📊 Learning Dashboard</h2>
      <p id="hlProgress">Your practice progress will appear here.</p>
      <div class="learning-progress-track">
        <div id="hlProgressFill" class="learning-progress-fill"></div>
      </div>
      <p id="hlScore">Score: 0</p>
      <button type="button" class="learning-tool-button" data-toggle="hlFormulas">Explore Formulas</button>
    </section>

    <section id="hlFormulas" class="hl-panel learning-tools-section" hidden>
      <h2>📚 Formula Library</h2>
      <p>Search by formula name, category or purpose.</p>
      <input id="hlSearch" class="formula-search-input" type="search"
        placeholder="Search SUM, IF, Lookup, Text..." aria-label="Search formulas">
      <div id="hlFormulaList" class="formula-list"></div>
      <p id="hlCopyFeedback" class="learning-feedback" aria-live="polite"></p>
    </section>

    <section id="hlPractice" class="hl-panel learning-tools-section" hidden>
      <h2>🎯 Excel Practice Zone</h2>
      <p id="hlCounter"></p>
      <article class="learning-tool-card">
        <h3 id="hlQuestion"></h3>
        <div id="hlOptions"></div>
        <p id="hlFeedback" class="learning-feedback" aria-live="polite"></p>
        <button type="button" class="learning-tool-button" id="hlCheck">Check Answer</button>
        <button type="button" class="learning-tool-button" id="hlNext" hidden>Next Question</button>
        <button type="button" class="learning-tool-button" id="hlRetry" hidden>Try Again</button>
      </article>
    </section>

    <section id="hlTips" class="hl-panel learning-tools-section" hidden>
      <h2>✨ Quick Excel Tips</h2>
      <div class="hl-tip"><strong>Ctrl + C</strong><p>Copy selected cells or text.</p></div>
      <div class="hl-tip"><strong>Ctrl + V</strong><p>Paste copied content.</p></div>
      <div class="hl-tip"><strong>Ctrl + Z</strong><p>Undo the last action.</p></div>
      <div class="hl-tip"><strong>Alt + =</strong><p>Quickly insert AutoSum in many Excel layouts.</p></div>
      <div class="hl-tip"><strong>F2</strong><p>Edit the active cell.</p></div>
    </section>
  `;

  const panels = [...root.querySelectorAll(".hl-panel")];
  const cardButtons = [...root.querySelectorAll("[data-toggle]")];

  function togglePanel(id) {
    const panel = root.querySelector("#" + id);
    if (!panel) return;

    const willOpen = panel.hidden;
    panels.forEach(item => {
      item.hidden = true;
    });
    cardButtons.forEach(button => {
      button.setAttribute("aria-expanded", "false");
    });

    if (willOpen) {
      panel.hidden = false;
      root.querySelectorAll(`[data-toggle="${id}"]`).forEach(button => {
        button.setAttribute("aria-expanded", "true");
      });
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  root.addEventListener("click", async event => {
    const toggle = event.target.closest("[data-toggle]");
    if (toggle) {
      togglePanel(toggle.dataset.toggle);
      return;
    }

    const copy = event.target.closest("[data-copy]");
    if (copy) {
      const formula = formulas[Number(copy.dataset.copy)].slice(2, 3)[0];
      const feedback = root.querySelector("#hlCopyFeedback");
      try {
        await navigator.clipboard.writeText(formula);
        feedback.textContent = "Copied: " + formula;
      } catch {
        feedback.textContent = "Copy blocked by browser. Select and copy: " + formula;
      }
      return;
    }

    if (event.target.closest("#hlCheck")) {
      if (answered) return;
      const selected = root.querySelector('input[name="hlAnswer"]:checked');
      const feedback = root.querySelector("#hlFeedback");
      if (!selected) {
        feedback.textContent = "पहले एक answer चुनें।";
        return;
      }

      answered = true;
      const question = questions[index];
      if (Number(selected.value) === question.a) {
        score += 10;
        correct++;
        feedback.textContent = "✅ Correct! " + question.e;
      } else {
        feedback.textContent = "❌ सही उत्तर: " + question.o[question.a] + ". " + question.e;
      }

      localStorage.setItem("hlPracticeScore", String(score));
      localStorage.setItem("hlPracticeCorrect", String(correct));
      updateProgress();
      root.querySelector("#hlCheck").hidden = true;
      root.querySelector("#hlNext").hidden = index === questions.length - 1;
      root.querySelector("#hlRetry").hidden = index !== questions.length - 1;
      return;
    }

    if (event.target.closest("#hlNext")) {
      index++;
      renderQuestion();
      return;
    }

    if (event.target.closest("#hlRetry")) {
      index = 0;
      score = 0;
      correct = 0;
      localStorage.setItem("hlPracticeScore", "0");
      localStorage.setItem("hlPracticeCorrect", "0");
      updateProgress();
      renderQuestion();
    }
  });

  let index = 0;
  let score = Number(localStorage.getItem("hlPracticeScore")) || 0;
  let correct = Number(localStorage.getItem("hlPracticeCorrect")) || 0;
  let answered = false;

  function updateProgress() {
    const percent = Math.round((correct / questions.length) * 100);
    root.querySelector("#hlProgress").textContent =
      `${correct} of ${questions.length} questions answered correctly`;
    root.querySelector("#hlProgressFill").style.width = percent + "%";
    root.querySelector("#hlScore").textContent = "Practice score: " + score;
  }

  function renderFormulas(term = "") {
    const list = root.querySelector("#hlFormulaList");
    const query = term.toLowerCase().trim();
    const matches = formulas
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => f.join(" ").toLowerCase().includes(query));

    list.innerHTML = matches.length ? matches.map(({ f, i }) => `
      <article class="formula-item">
        <h3>${esc(f[0])} <small>· ${esc(f[1])}</small></h3>
        <code class="formula-code">${esc(f[2])}</code>
        <p>${esc(f[3])}</p>
        <button type="button" class="learning-tool-button" data-copy="${i}">Copy Formula</button>
      </article>
    `).join("") : "<p>No formulas found. Try another search.</p>";
  }

  function renderQuestion() {
    answered = false;
    const q = questions[index];
    root.querySelector("#hlCounter").textContent =
      `Question ${index + 1} of ${questions.length}`;
    root.querySelector("#hlQuestion").textContent = q.q;
    root.querySelector("#hlFeedback").textContent = "";
    root.querySelector("#hlOptions").innerHTML = q.o.map((option, i) => `
      <label class="hl-option">
        <input type="radio" name="hlAnswer" value="${i}">
        ${esc(option)}
      </label>
    `).join("");
    root.querySelector("#hlCheck").hidden = false;
    root.querySelector("#hlNext").hidden = true;
    root.querySelector("#hlRetry").hidden = true;
  }

  root.querySelector("#hlSearch").addEventListener("input", event => {
    renderFormulas(event.target.value);
  });

  renderFormulas();
  renderQuestion();
  updateProgress();
})();
