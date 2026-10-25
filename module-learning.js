
const MODULES = {
  "excel-foundations": {
    title: "Excel Foundations",
    video: "",
    notes: [
      ["What is Excel?", "Microsoft Excel is a spreadsheet application used to organise data, perform calculations and create reports."],
      ["Workbook and Worksheet", "A workbook is an Excel file. A worksheet is a sheet inside that workbook."],
      ["Rows, Columns and Cells", "Rows run horizontally and use numbers. Columns run vertically and use letters. A cell is the intersection of a row and a column, such as A1."],
      ["Practical task", "Open Excel, enter your name in cell A1, your course in B1 and save the workbook."]
    ],
    questions: [
      { q: "What is Microsoft Excel mainly used for?", options: ["Video editing", "Data and calculations", "Operating system installation", "Web browsing"], answer: 1 },
      { q: "An Excel file is called a:", options: ["Workbook", "Browser", "Database server", "Slide"], answer: 0 },
      { q: "Which is a valid cell address?", options: ["1A", "AA", "A1", "Row1"], answer: 2 },
      { q: "Rows run in which direction?", options: ["Vertically", "Horizontally", "Diagonally", "Circularly"], answer: 1 },
      { q: "Columns are identified by:", options: ["Letters", "Only dates", "Only symbols", "Paragraphs"], answer: 0 }
    ]
  },

  "clean-data": {
    title: "Clean & Organise Data",
    video: "",
    notes: [
      ["Data formatting", "Formatting changes how data looks, including font, colour, borders, alignment and number formats."],
      ["Sort", "Sorting arranges data in an order, such as A to Z, Z to A, smallest to largest or oldest to newest."],
      ["Filter", "Filtering temporarily displays records that meet selected conditions."],
      ["Practical task", "Create a list of five students and practise sorting their names alphabetically."]
    ],
    questions: [
      { q: "What does sorting do?", options: ["Deletes the workbook", "Arranges data in an order", "Closes Excel", "Adds a password automatically"], answer: 1 },
      { q: "What is the purpose of a filter?", options: ["Show matching records", "Turn off the computer", "Create a video", "Delete every row"], answer: 0 },
      { q: "Which is an example of formatting?", options: ["Changing font colour", "Unplugging the computer", "Deleting Excel", "Opening a browser"], answer: 0 },
      { q: "A to Z sorting is generally:", options: ["Ascending order", "Descending order", "Random order", "Print order"], answer: 0 },
      { q: "Before sorting a table, you should usually:", options: ["Select the correct data range", "Delete all headings", "Close the file without saving", "Remove all records"], answer: 0 }
    ]
  },

  "essential-formulas": {
    title: "Essential Formulas",
    video: "",
    notes: [
      ["What is a formula?", "A formula performs a calculation in Excel and normally begins with an equals sign (=)."],
      ["SUM", "SUM adds numbers. Example: =SUM(A1:A5) adds values from A1 through A5."],
      ["AVERAGE and COUNT", "AVERAGE calculates the arithmetic mean. COUNT counts cells containing numbers."],
      ["IF", "IF checks a condition and returns one result if it is true and another if it is false. Example: =IF(A1>=40,\"Pass\",\"Fail\")"]
    ],
    questions: [
      { q: "Which symbol usually starts an Excel formula?", options: ["#", "=", "@", "&"], answer: 1 },
      { q: "Which function adds numbers?", options: ["COUNT", "SUM", "IF", "LEFT"], answer: 1 },
      { q: "What does AVERAGE calculate?", options: ["Total only", "Arithmetic mean", "Largest text", "Number format"], answer: 1 },
      { q: "What does COUNT count?", options: ["Numeric cells", "Only colours", "Worksheets only", "File names"], answer: 0 },
      { q: "Which function checks a condition?", options: ["SUM", "IF", "MAX", "ROUND"], answer: 1 }
    ]
  },

  "lookup-functions": {
    title: "Lookup & Logic",
    video: "",
    notes: [
      ["Lookup functions", "Lookup functions help find information in a table using a matching value."],
      ["VLOOKUP", "VLOOKUP searches for a value in the first column of a table and returns a value from a specified column."],
      ["IFERROR", "IFERROR returns a chosen alternative when a formula produces an error."],
      ["Practical task", "Create a small product table with Product ID, Product Name and Price. Practise looking up a product."]
    ],
    questions: [
      { q: "What is a lookup function used for?", options: ["Finding matching information", "Playing music", "Formatting Windows", "Drawing only"], answer: 0 },
      { q: "VLOOKUP searches in which part of its table?", options: ["First column", "Last worksheet only", "Formula bar only", "Page footer"], answer: 0 },
      { q: "What does IFERROR help handle?", options: ["Formula errors", "Computer hardware", "Internet speed", "Screen brightness"], answer: 0 },
      { q: "In VLOOKUP, the column index tells Excel:", options: ["Which return column to use", "The monitor size", "The file password", "The worksheet colour"], answer: 0 },
      { q: "Lookup data is commonly organised in:", options: ["A table", "A video timeline", "A music playlist", "A desktop wallpaper"], answer: 0 }
    ]
  },

  "business-dashboard": {
    title: "Business Dashboard",
    video: "",
    notes: [
      ["What is a dashboard?", "A dashboard summarises important information using metrics, tables and charts."],
      ["KPI", "A Key Performance Indicator (KPI) measures progress toward a business goal, such as monthly sales."],
      ["Charts", "Charts help communicate patterns and comparisons in data."],
      ["Practical task", "Create a monthly sales table and insert a column chart to compare sales across months."]
    ],
    questions: [
      { q: "What is the purpose of a dashboard?", options: ["Summarise important information", "Install Windows", "Write computer drivers", "Edit audio only"], answer: 0 },
      { q: "KPI stands for:", options: ["Key Performance Indicator", "Keyboard Program Interface", "Known Product Input", "Key Page Instruction"], answer: 0 },
      { q: "Which chart is useful for comparing categories?", options: ["Column chart", "Only a text paragraph", "File explorer", "Calculator window"], answer: 0 },
      { q: "A sales dashboard may show:", options: ["Total sales", "Only desktop icons", "Only passwords", "Keyboard layout"], answer: 0 },
      { q: "Good dashboard design should be:", options: ["Clear and relevant", "Needlessly confusing", "Missing labels", "Full of unrelated data"], answer: 0 }
    ]
  },

  "ai-workflows": {
    title: "Excel with AI",
    video: "",
    notes: [
      ["AI and Excel", "AI tools can help explain formulas, suggest approaches and assist with spreadsheet tasks. Always verify their output."],
      ["Prompt writing", "A useful prompt states the task, data structure, desired output and any important conditions."],
      ["Formula assistance", "You can ask an AI assistant to explain a formula or draft one for a clearly described task."],
      ["Responsible use", "Check calculations, protect confidential data and test generated formulas before using them in important work."]
    ],
    questions: [
      { q: "AI can help Excel users by:", options: ["Explaining formulas", "Guaranteeing every answer is correct", "Replacing all verification", "Preventing all errors automatically"], answer: 0 },
      { q: "A good prompt should include:", options: ["A clear task and requirements", "Only random letters", "No task at all", "An unrelated sentence"], answer: 0 },
      { q: "Should AI-generated formulas be checked?", options: ["Yes", "Never", "Only after deleting the data", "No verification is needed"], answer: 0 },
      { q: "What should you do with confidential data?", options: ["Protect it and follow applicable policies", "Share it publicly", "Put all passwords in prompts", "Ignore privacy"], answer: 0 },
      { q: "AI output should be:", options: ["Tested and verified", "Accepted blindly", "Used without reading", "Assumed perfect"], answer: 0 }
    ]
  }
};

let allowExistingProgressClick = false;
let activeModuleId = null;
let selectedAnswers = {};
let quizSubmitted = false;

function mlEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function addLearningStyles() {
  if (document.getElementById("module-learning-styles")) return;

  const style = document.createElement("style");
  style.id = "module-learning-styles";
  style.textContent = `
    #ml-modal[hidden] { display:none !important; }
    #ml-modal { position:fixed; inset:0; z-index:99999; background:rgba(4,9,22,.82); display:flex; align-items:center; justify-content:center; padding:16px; }
    #ml-modal .ml-box { width:min(760px,100%); max-height:90vh; overflow:auto; background:#111c32; color:#f3f6ff; border:1px solid #344668; border-radius:18px; padding:22px; box-shadow:0 20px 70px #0008; }
    #ml-modal .ml-head { display:flex; justify-content:space-between; gap:12px; align-items:center; }
    #ml-modal .ml-head h2 { margin:0; font-size:23px; }
    #ml-modal .ml-close { background:#263653; color:white; border:1px solid #465a7d; border-radius:9px; padding:8px 12px; cursor:pointer; }
    #ml-modal .ml-tabs { display:flex; gap:8px; flex-wrap:wrap; margin:20px 0; }
    #ml-modal .ml-tab, #ml-modal .ml-action { border:1px solid #425a80; border-radius:9px; background:#1c2b47; color:#eef3ff; padding:10px 14px; cursor:pointer; }
    #ml-modal .ml-tab.active { background:#35548a; }
    #ml-modal .ml-note { padding:15px; margin:10px 0; background:#172541; border:1px solid #2d4266; border-radius:12px; line-height:1.65; }
    #ml-modal .ml-note h3 { margin:0 0 8px; font-size:15px; }
    #ml-modal .ml-note p { margin:0; color:#c2cde2; font-size:13px; }
    #ml-modal .ml-question { margin:14px 0; padding:15px; border:1px solid #2d4266; border-radius:12px; }
    #ml-modal .ml-question legend { padding:0 4px; font-size:14px; font-weight:700; }
    #ml-modal .ml-option { display:flex; gap:9px; align-items:flex-start; margin:11px 0; color:#d7e1f6; font-size:13px; }
    #ml-modal .ml-result { margin-top:15px; padding:14px; border-radius:10px; background:#1c304b; line-height:1.6; }
    #ml-modal .ml-muted { color:#aab8d5; font-size:13px; line-height:1.7; }
    #ml-modal .ml-video { padding:24px; text-align:center; border:1px dashed #52698f; border-radius:14px; }
    @media(max-width:560px) { #ml-modal .ml-box { padding:16px; } #ml-modal .ml-head h2 { font-size:19px; } }
  `;
  document.head.appendChild(style);
}

function createLearningModal() {
  if (document.getElementById("ml-modal")) return;

  const modal = document.createElement("div");
  modal.id = "ml-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <section class="ml-box" role="dialog" aria-modal="true" aria-labelledby="ml-title">
      <div class="ml-head">
        <h2 id="ml-title">Module Learning</h2>
        <button class="ml-close" type="button" data-ml-close>Close ✕</button>
      </div>
      <div class="ml-tabs">
        <button class="ml-tab active" type="button" data-ml-tab="notes">Notes</button>
        <button class="ml-tab" type="button" data-ml-tab="video">Video</button>
        <button class="ml-tab" type="button" data-ml-tab="quiz">MCQ Test</button>
      </div>
      <div id="ml-content"></div>
    </section>
  `;
  document.body.appendChild(modal);

  modal.addEventListener("click", event => {
    if (event.target === modal || event.target.closest("[data-ml-close]")) {
      closeLearningModal();
      return;
    }

    const tab = event.target.closest("[data-ml-tab]");
    if (tab) {
      showLearningTab(tab.dataset.mlTab);
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeLearningModal();
  });
}

function openLearningModal(moduleId) {
  if (!MODULES[moduleId]) return;

  activeModuleId = moduleId;
  selectedAnswers = {};
  quizSubmitted = false;

  createLearningModal();
  addLearningStyles();

  const modal = document.getElementById("ml-modal");
  document.getElementById("ml-title").textContent = MODULES[moduleId].title;
  modal.hidden = false;

  showLearningTab("notes");
}

function closeLearningModal() {
  const modal = document.getElementById("ml-modal");
  if (modal) modal.hidden = true;
  activeModuleId = null;
}

function showLearningTab(tabName) {
  if (!activeModuleId || !MODULES[activeModuleId]) return;

  document.querySelectorAll("#ml-modal [data-ml-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.mlTab === tabName);
  });

  const module = MODULES[activeModuleId];
  const content = document.getElementById("ml-content");

  if (tabName === "notes") {
    content.innerHTML = module.notes.map(([heading, body]) => `
      <article class="ml-note">
        <h3>${mlEscape(heading)}</h3>
        <p>${mlEscape(body)}</p>
      </article>
    `).join("");
    return;
  }

  if (tabName === "video") {
    if (module.video) {
      content.innerHTML = `
        <div class="ml-video">
          <p class="ml-muted">Video lesson</p>
          <a class="ml-action" href="${mlEscape(module.video)}" target="_blank" rel="noopener noreferrer">Open video lesson ↗</a>
        </div>
      `;
    } else {
      content.innerHTML = `
        <div class="ml-video">
          <h3>🎬 Video Coming Soon</h3>
          <p class="ml-muted">इस Module का वीडियो अभी तैयार नहीं है। फिलहाल Notes पढ़ें और MCQ Test दें। वीडियो तैयार होने पर इसका लिंक जोड़ा जा सकता है।</p>
        </div>
      `;
    }
    return;
  }

  if (tabName === "quiz") renderQuiz(module, content);
}

function renderQuiz(module, content) {
  const questionsHTML = module.questions.map((question, index) => `
    <fieldset class="ml-question">
      <legend>${index + 1}. ${mlEscape(question.q)}</legend>
      ${question.options.map((option, optionIndex) => `
        <label class="ml-option">
          <input
            type="radio"
            name="ml-q-${index}"
            value="${optionIndex}"
            ${selectedAnswers[index] === optionIndex ? "checked" : ""}
            ${quizSubmitted ? "disabled" : ""}
          >
          <span>${mlEscape(option)}</span>
        </label>
      `).join("")}
      ${quizSubmitted ? `
        <p class="ml-muted">
          Correct answer: ${mlEscape(question.options[question.answer])}
        </p>
      ` : ""}
    </fieldset>
  `).join("");

  const score = module.questions.reduce((total, question, index) => {
    return total + (selectedAnswers[index] === question.answer ? 1 : 0);
  }, 0);

  content.innerHTML = `
    <p class="ml-muted">कुल ${module.questions.length} प्रश्न। प्रत्येक प्रश्न का एक सही उत्तर है। पास होने के लिए कम से कम 60% अंक चाहिए।</p>
    <form id="ml-quiz-form">
      ${questionsHTML}
      ${quizSubmitted ? `
        <div class="ml-result">
          <strong>Your score: ${score}/${module.questions.length} (${Math.round(score / module.questions.length * 100)}%)</strong>
          <p>${score / module.questions.length >= 0.6
            ? "Test passed! आपका Module complete mark किया जा सकता है।"
            : "अभी पास नहीं हुए। Notes दोबारा पढ़कर फिर कोशिश करें।"}</p>
          <button class="ml-action" type="button" data-ml-retry>Try again</button>
          ${score / module.questions.length >= 0.6
            ? `<button class="ml-action" type="button" data-ml-complete>Complete Module</button>`
            : ""}
        </div>
      ` : `
        <button class="ml-action" type="submit">Submit Test</button>
      `}
    </form>
  `;

  const form = content.querySelector("#ml-quiz-form");

  if (!quizSubmitted) {
    form.addEventListener("change", event => {
      if (event.target.matches('input[type="radio"]')) {
        const index = Number(event.target.name.replace("ml-q-", ""));
        selectedAnswers[index] = Number(event.target.value);
      }
    });

    form.addEventListener("submit", event => {
      event.preventDefault();

      if (Object.keys(selectedAnswers).length !== module.questions.length) {
        alert("Please answer all questions before submitting.");
        return;
      }

      quizSubmitted = true;
      renderQuiz(module, content);
    });
  }

  content.querySelector("[data-ml-retry]")?.addEventListener("click", () => {
    selectedAnswers = {};
    quizSubmitted = false;
    renderQuiz(module, content);
  });

  content.querySelector("[data-ml-complete]")?.addEventListener("click", () => {
    const cardButton = document.querySelector(
      `#studentDashboardV2 [data-lesson="${CSS.escape(activeModuleId)}"]`
    );

    if (!cardButton) {
      alert("Dashboard progress button not found. Please refresh and try again.");
      return;
    }

    if (cardButton.textContent.includes("Mark incomplete")) {
      closeLearningModal();
      alert("This Module is already marked complete.");
      return;
    }

    allowExistingProgressClick = true;
    closeLearningModal();
    cardButton.click();
    allowExistingProgressClick = false;
  });
}

function attachModuleLearning() {
  if (document.documentElement.dataset.moduleLearningAttached === "yes") return;
  document.documentElement.dataset.moduleLearningAttached = "yes";

  // Capture phase prevents the old button handler from running when a
  // student opens a lesson. The existing progress handler stays unchanged.
  document.addEventListener("click", event => {
    const button = event.target.closest("#studentDashboardV2 [data-lesson]");
    if (!button || allowExistingProgressClick) return;

    const moduleId = button.dataset.lesson;
    if (!MODULES[moduleId]) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    openLearningModal(moduleId);
  }, true);

  const observer = new MutationObserver(() => {
    if (document.getElementById("studentDashboardV2")) {
      createLearningModal();
      addLearningStyles();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", attachModuleLearning, { once: true });
} else {
  attachModuleLearning();
}
