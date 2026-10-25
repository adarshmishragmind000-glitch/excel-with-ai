
/* Excel with AI - Home Learning Tools
   Standalone module; does not modify existing Firebase code. */

(() => {
  "use strict";

  const formulas = [
    {
      name: "SUM",
      category: "Basic",
      syntax: "=SUM(A1:A10)",
      example: "A1 से A10 तक सभी numbers जोड़ता है।"
    },
    {
      name: "AVERAGE",
      category: "Basic",
      syntax: "=AVERAGE(A1:A10)",
      example: "दिए गए numbers का average निकालता है।"
    },
    {
      name: "MAX",
      category: "Basic",
      syntax: "=MAX(A1:A10)",
      example: "सबसे बड़ी value बताता है।"
    },
    {
      name: "MIN",
      category: "Basic",
      syntax: "=MIN(A1:A10)",
      example: "सबसे छोटी value बताता है।"
    },
    {
      name: "COUNT",
      category: "Basic",
      syntax: "=COUNT(A1:A10)",
      example: "Numbers वाली cells गिनता है।"
    },
    {
      name: "COUNTA",
      category: "Basic",
      syntax: "=COUNTA(A1:A10)",
      example: "खाली न होने वाली cells गिनता है।"
    },
    {
      name: "IF",
      category: "Logical",
      syntax: '=IF(A1>=33,"Pass","Fail")',
      example: "A1 में 33 या अधिक होने पर Pass, अन्यथा Fail।"
    },
    {
      name: "COUNTIF",
      category: "Logical",
      syntax: '=COUNTIF(A1:A20,"Pass")',
      example: "Range में Pass लिखी cells गिनता है।"
    },
    {
      name: "SUMIF",
      category: "Logical",
      syntax: '=SUMIF(A1:A10,"Pen",B1:B10)',
      example: "जहाँ A में Pen हो, वहाँ B की values जोड़ता है।"
    },
    {
      name: "VLOOKUP",
      category: "Lookup",
      syntax: "=VLOOKUP(E2,A2:C20,3,FALSE)",
      example: "पहले column में E2 खोजकर तीसरे column का result देता है।"
    },
    {
      name: "INDEX + MATCH",
      category: "Lookup",
      syntax: "=INDEX(B2:B20,MATCH(E2,A2:A20,0))",
      example: "A column में E2 खोजकर B column से matching value देता है।"
    },
    {
      name: "CONCATENATE",
      category: "Text",
      syntax: '=CONCATENATE(A2," ",B2)',
      example: "दो cells के text के बीच space जोड़ता है।"
    },
    {
      name: "LEFT",
      category: "Text",
      syntax: "=LEFT(A2,3)",
      example: "Text के बाईं ओर से 3 characters निकालता है।"
    },
    {
      name: "LEN",
      category: "Text",
      syntax: "=LEN(A2)",
      example: "Text में characters की संख्या बताता है।"
    },
    {
      name: "TODAY",
      category: "Date",
      syntax: "=TODAY()",
      example: "आज की तारीख दिखाता है।"
    }
  ];

  const questions = [
    {
      q: "A1 से A10 तक numbers जोड़ने का सही formula कौन-सा है?",
      options: ["=ADD(A1:A10)", "=SUM(A1:A10)", "=TOTAL(A1:A10)", "=PLUS(A1:A10)"],
      answer: 1,
      explanation: "SUM range के numbers को जोड़ता है।"
    },
    {
      q: "Average निकालने के लिए कौन-सा function है?",
      options: ["SUM", "COUNT", "AVERAGE", "MAX"],
      answer: 2,
      explanation: "AVERAGE दिए गए numeric values का औसत निकालता है।"
    },
    {
      q: "Pass/Fail दिखाने के लिए कौन-सा function उपयोगी है?",
      options: ["IF", "LEFT", "MAX", "TODAY"],
      answer: 0,
      explanation: "IF condition के आधार पर अलग result देता है।"
    },
    {
      q: "सबसे बड़ी value निकालने के लिए?",
      options: ["MIN", "MAX", "COUNT", "LEN"],
      answer: 1,
      explanation: "MAX सबसे बड़ी numeric value देता है।"
    },
    {
      q: "खाली न होने वाली cells गिनने के लिए?",
      options: ["COUNT", "COUNTA", "SUM", "MIN"],
      answer: 1,
      explanation: "COUNTA non-empty cells गिनता है।"
    },
    {
      q: "आज की तारीख के लिए कौन-सा formula है?",
      options: ["=DATE NOW", "=TODAY()", "=CURRENT()", "=TIME()"],
      answer: 1,
      explanation: "TODAY() current date देता है।"
    },
    {
      q: "Text की लंबाई पता करने वाला function?",
      options: ["LEFT", "RIGHT", "LEN", "IF"],
      answer: 2,
      explanation: "LEN characters की संख्या बताता है।"
    },
    {
      q: "किसी condition के आधार पर जोड़ने के लिए?",
      options: ["SUMIF", "COUNT", "MAX", "LEFT"],
      answer: 0,
      explanation: "SUMIF condition पूरी करने वाली values जोड़ता है।"
    },
    {
      q: "VLOOKUP में FALSE का सामान्य अर्थ क्या है?",
      options: ["Approximate match", "Exact match", "Delete value", "Sort data"],
      answer: 1,
      explanation: "FALSE exact match माँगता है।"
    },
    {
      q: "Numbers वाली cells गिनने के लिए?",
      options: ["COUNTA", "COUNT", "SUMIF", "LEN"],
      answer: 1,
      explanation: "COUNT numeric cells गिनता है।"
    }
  ];

  function init() {
    const root = document.getElementById("learningToolsRoot");
    if (!root || root.dataset.initialized === "true") return;
    root.dataset.initialized = "true";

    const escapeHtml = (value) =>
      String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]);

    let questionIndex = 0;
    let score = 0;
    let answered = false;
    let correctCount = 0;

    root.innerHTML = `
      <section class="learning-tools-section" id="learningDashboard">
        <h2 class="learning-tools-heading">🚀 Your Learning Dashboard</h2>
        <p class="learning-tools-subtitle">
          Learn Excel formulas, practice questions and improve your skills.
        </p>

        <div class="learning-tools-grid">
          <article class="learning-tool-card">
            <div class="learning-tool-icon">📊</div>
            <h3>Learning Progress</h3>
            <p id="learningProgressText">Your practice progress will appear here.</p>
            <div class="learning-progress-track">
              <div class="learning-progress-fill" id="learningProgressFill"></div>
            </div>
            <p id="learningScoreText">Practice score: 0</p>
          </article>

          <article class="learning-tool-card">
            <div class="learning-tool-icon">📚</div>
            <h3>Formula Library</h3>
            <p>Search formulas, see examples and copy syntax.</p>
            <button class="learning-tool-button" data-jump="formulaLibrary">
              Explore Formulas
            </button>
          </article>

          <article class="learning-tool-card">
            <div class="learning-tool-icon">🎯</div>
            <h3>Excel Practice Zone</h3>
            <p>Practice multiple-choice Excel questions.</p>
            <button class="learning-tool-button" data-jump="excelPractice">
              Start Practice
            </button>
          </article>

          <article class="learning-tool-card">
            <div class="learning-tool-icon">✨</div>
            <h3>Keep Learning</h3>
            <p>Learn one formula and solve a few questions every day.</p>
            <button class="learning-tool-button" data-jump="formulaLibrary">
              Start Learning
            </button>
          </article>
        </div>
      </section>

      <section class="learning-tools-section" id="formulaLibrary">
        <h2 class="learning-tools-heading">📚 Excel Formula Library</h2>
        <p class="learning-tools-subtitle">
          Search by formula name, category or purpose.
        </p>
        <input class="formula-search-input" id="formulaSearch"
          type="search" placeholder="Search SUM, IF, Lookup, Text...">
        <div class="formula-list" id="formulaList"></div>
        <p class="learning-feedback" id="formulaFeedback" aria-live="polite"></p>
      </section>

      <section class="learning-tools-section" id="excelPractice">
        <h2 class="learning-tools-heading">🎯 Excel Practice Zone</h2>
        <p class="learning-tools-subtitle" id="practiceCounter"></p>
        <article class="learning-tool-card">
          <h3 id="practiceQuestion"></h3>
          <div id="practiceOptions"></div>
          <p class="learning-feedback" id="practiceFeedback" aria-live="polite"></p>
          <button class="learning-tool-button" id="checkAnswer">Check Answer</button>
          <button class="learning-tool-button" id="nextQuestion" hidden>Next Question</button>
          <button class="learning-tool-button" id="restartPractice" hidden>Try Again</button>
        </article>
      </section>
    `;

    function renderFormulas(search = "") {
      const list = root.querySelector("#formulaList");
      const term = search.toLowerCase().trim();
      const matches = formulas.filter((item) =>
        `${item.name} ${item.category} ${item.syntax} ${item.example}`
          .toLowerCase().includes(term)
      );

      list.innerHTML = matches.length
        ? matches.map((item) => `
          <article class="formula-item">
            <h3>${escapeHtml(item.name)}
              <small>· ${escapeHtml(item.category)}</small>
            </h3>
            <code class="formula-code">${escapeHtml(item.syntax)}</code>
            <p>${escapeHtml(item.example)}</p>
            <button class="learning-tool-button"
              data-copy-formula="${escapeHtml(item.syntax)}">Copy Formula</button>
          </article>
        `).join("")
        : "<p>No formulas found. Try another search.</p>";
    }

    function updateProgress() {
      const percent = Math.round((correctCount / questions.length) * 100);
      root.querySelector("#learningProgressText").textContent =
        `${correctCount} of ${questions.length} questions answered correctly`;
      root.querySelector("#learningProgressFill").style.width = `${percent}%`;
      root.querySelector("#learningScoreText").textContent =
        `Practice score: ${score}`;
    }

    function renderQuestion() {
      answered = false;
      const question = questions[questionIndex];
      root.querySelector("#practiceCounter").textContent =
        `Question ${questionIndex + 1} of ${questions.length}`;
      root.querySelector("#practiceQuestion").textContent = question.q;
      root.querySelector("#practiceFeedback").textContent = "";
      root.querySelector("#checkAnswer").hidden = false;
      root.querySelector("#nextQuestion").hidden = true;
      root.querySelector("#restartPractice").hidden = true;

      root.querySelector("#practiceOptions").innerHTML =
        question.options.map((option, index) => `
          <label style="display:block;padding:10px;margin:8px 0;border:1px solid #475569;border-radius:9px;">
            <input type="radio" name="excelPracticeAnswer" value="${index}">
            ${escapeHtml(option)}
          </label>
        `).join("");
    }

    root.addEventListener("click", async (event) => {
      const jumpButton = event.target.closest("[data-jump]");
      if (jumpButton) {
        root.querySelector(`#${jumpButton.dataset.jump}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      const copyButton = event.target.closest("[data-copy-formula]");
      if (copyButton) {
        const formula = copyButton.dataset.copyFormula;
        const feedback = root.querySelector("#formulaFeedback");
        try {
          await navigator.clipboard.writeText(formula);
          feedback.textContent = `Copied: ${formula}`;
        } catch {
          feedback.textContent =
            "Clipboard access blocked. Please select and copy the formula manually.";
        }
        return;
      }

      if (event.target.closest("#checkAnswer")) {
        if (answered) return;
        const selected = root.querySelector(
          'input[name="excelPracticeAnswer"]:checked'
        );
        const feedback = root.querySelector("#practiceFeedback");

        if (!selected) {
          feedback.textContent = "Please select an answer first.";
          return;
        }

        answered = true;
        const question = questions[questionIndex];
        if (Number(selected.value) === question.answer) {
          score += 10;
          correctCount++;
          feedback.textContent = `✅ Correct! ${question.explanation}`;
        } else {
          feedback.textContent =
            `❌ Not quite. Correct answer: ${question.options[question.answer]}. ${question.explanation}`;
        }

        root.querySelector("#checkAnswer").hidden = true;
        root.querySelector("#nextQuestion").hidden =
          questionIndex === questions.length - 1;
        root.querySelector("#restartPractice").hidden =
          questionIndex !== questions.length - 1;
        updateProgress();
        return;
      }

      if (event.target.closest("#nextQuestion")) {
        questionIndex++;
        renderQuestion();
        return;
      }

      if (event.target.closest("#restartPractice")) {
        questionIndex = 0;
        score = 0;
        correctCount = 0;
        updateProgress();
        renderQuestion();
      }
    });

    root.querySelector("#formulaSearch").addEventListener("input", (event) => {
      renderFormulas(event.target.value);
    });

    renderFormulas();
    updateProgress();
    renderQuestion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
