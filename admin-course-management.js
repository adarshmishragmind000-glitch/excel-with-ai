
import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, collection, getDocs,
  addDoc, updateDoc, deleteDoc, serverTimestamp
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
const auth = getAuth(app);
const db = getFirestore(app);
const $ = (s, root = document) => root.querySelector(s);

let isAdmin = false;
let loading = false;

const styles = `
#courseManager{margin:22px 0;padding:22px;border:1px solid #2c3d60;border-radius:18px;background:#101a2e;color:#f3f6ff}
#courseManager *{box-sizing:border-box}
#courseManager h2{margin:0 0 6px;font-size:22px}
#courseManager .cm-sub{color:#9eafcf;font-size:13px;line-height:1.6}
#courseManager .cm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}
#courseManager label{display:block;font-size:12px;color:#b8c7e5;margin-bottom:6px}
#courseManager input,#courseManager textarea{width:100%;padding:11px;border:1px solid #34496e;border-radius:9px;background:#0b1426;color:white;font:inherit;font-size:13px}
#courseManager textarea{min-height:100px;resize:vertical}
#courseManager .cm-wide{grid-column:1/-1}
#courseManager .cm-btn{padding:10px 14px;border-radius:9px;border:1px solid #405780;background:#20365a;color:white;cursor:pointer;font-weight:700;font-size:12px}
#courseManager .cm-primary{background:#4267b2;border-color:#5579c2}
#courseManager .cm-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
#courseManager .cm-list{display:grid;gap:10px;margin-top:18px}
#courseManager .cm-item{padding:14px;border:1px solid #2b3b5b;border-radius:12px;background:#15213a}
#courseManager .cm-item h3{margin:0 0 6px;font-size:15px}
#courseManager .cm-item p{color:#a7b7d4;font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere}
#courseManager .cm-status{font-size:12px;color:#a8c6ff;margin-top:12px;white-space:pre-wrap}
@media(max-width:600px){#courseManager{padding:15px}#courseManager .cm-grid{grid-template-columns:1fr}#courseManager .cm-wide{grid-column:auto}}
`;

function notifyCM(message) {
  const toast = $("#toast");
  if (toast) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
  } else {
    alert(message);
  }
}

function escapeCM(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function addStyles() {
  if ($("#course-manager-styles")) return;
  const style = document.createElement("style");
  style.id = "course-manager-styles";
  style.textContent = styles;
  document.head.appendChild(style);
}

function createPanel() {
  const view = $("#dashboardView");
  if (!view || !isAdmin || view.hidden) return;
  if ($("#courseManager")) return;

  addStyles();

  const panel = document.createElement("section");
  panel.id = "courseManager";
  panel.innerHTML = `
    <h2>Course Management</h2>
    <p class="cm-sub">Create and manage course modules, notes, video links and MCQ questions.</p>

    <form id="cmForm">
      <div class="cm-grid">
        <div>
          <label for="cmTitle">Module title *</label>
          <input id="cmTitle" required maxlength="120" placeholder="e.g. Excel Foundations">
        </div>
        <div>
          <label for="cmVideo">Video URL (optional)</label>
          <input id="cmVideo" type="url" placeholder="https://youtube.com/...">
        </div>
        <div class="cm-wide">
          <label for="cmNotes">Notes *</label>
          <textarea id="cmNotes" required placeholder="Write lesson notes here..."></textarea>
        </div>
        <div class="cm-wide">
          <label for="cmQuestions">MCQ Questions (valid JSON array)</label>
          <textarea id="cmQuestions" placeholder='[{"q":"What is Excel?","options":["Spreadsheet","Browser","OS","Game"],"answer":0}]'></textarea>
          <p class="cm-sub">Each question needs q, four options, and answer (0–3). Use [] if there are no questions yet.</p>
        </div>
      </div>
      <div class="cm-actions">
        <button class="cm-btn cm-primary" id="cmSave" type="submit">Save Module</button>
        <button class="cm-btn" id="cmCancel" type="button" hidden>Cancel Edit</button>
        <button class="cm-btn" id="cmRefresh" type="button">Refresh List</button>
      </div>
      <p id="cmStatus" class="cm-status" role="status"></p>
    </form>
    <div id="cmList" class="cm-list">Loading modules…</div>
  `;

  view.appendChild(panel);
  bindForm();
  loadModules();
}

let editingId = null;

function setStatus(message) {
  const el = $("#cmStatus");
  if (el) el.textContent = message;
}

function clearForm() {
  $("#cmForm")?.reset();
  editingId = null;
  $("#cmSave").textContent = "Save Module";
  $("#cmCancel").hidden = true;
  setStatus("");
}

function bindForm() {
  $("#cmForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (!isAdmin || !auth.currentUser) return;

    const title = $("#cmTitle").value.trim();
    const videoUrl = $("#cmVideo").value.trim();
    const notes = $("#cmNotes").value.trim();
    let questions;

    try {
      questions = JSON.parse($("#cmQuestions").value.trim() || "[]");
    } catch {
      setStatus("Questions JSON is invalid. Please correct it.");
      return;
    }

    if (!Array.isArray(questions)) {
      setStatus("Questions must be a JSON array.");
      return;
    }

    for (const q of questions) {
      if (
        typeof q.q !== "string" ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        !Number.isInteger(q.answer) ||
        q.answer < 0 ||
        q.answer > 3 ||
        q.options.some(option => typeof option !== "string")
      ) {
        setStatus("Each question must have q, exactly 4 string options, and answer from 0 to 3.");
        return;
      }
    }

    if (videoUrl && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be|drive\.google\.com)\//i.test(videoUrl)) {
      setStatus("Use an HTTPS YouTube or Google Drive video link.");
      return;
    }

    const button = $("#cmSave");
    button.disabled = true;
    setStatus("Saving module…");

    try {
      const payload = {
        title,
        videoUrl,
        notes,
        questions,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser.uid
      };

      if (editingId) {
        await updateDoc(doc(db, "courseModules", editingId), payload);
        setStatus("Module updated successfully.");
      } else {
        await addDoc(collection(db, "courseModules"), {
          ...payload,
          active: true,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser.uid
        });
        setStatus("Module created successfully.");
      }

      clearForm();
      await loadModules();
    } catch (error) {
      console.error("Course save error:", error);
      setStatus("Save failed: " + (error.code || error.message));
    } finally {
      button.disabled = false;
    }
  });

  $("#cmCancel").addEventListener("click", clearForm);
  $("#cmRefresh").addEventListener("click", loadModules);
}

async function loadModules() {
  const list = $("#cmList");
  if (!list || !isAdmin || loading) return;

  loading = true;
  list.textContent = "Loading modules…";

  try {
    const snapshot = await getDocs(collection(db, "courseModules"));

    if (snapshot.empty) {
      list.innerHTML = '<p class="cm-sub">No modules created yet. Use the form above to add the first module.</p>';
      return;
    }

    list.innerHTML = snapshot.docs.map(item => {
      const data = item.data();
      return `
        <article class="cm-item">
          <h3>${escapeCM(data.title || "Untitled module")}</h3>
          <p>${escapeCM((data.notes || "").slice(0, 240))}</p>
          <p>Questions: ${Array.isArray(data.questions) ? data.questions.length : 0}
          · ${data.active === false ? "Inactive" : "Active"}</p>
          <div class="cm-actions">
            <button class="cm-btn" type="button" data-cm-edit="${escapeCM(item.id)}">Edit</button>
            <button class="cm-btn" type="button" data-cm-toggle="${escapeCM(item.id)}" data-active="${data.active === false ? "false" : "true"}">
              ${data.active === false ? "Activate" : "Deactivate"}
            </button>
            <button class="cm-btn" type="button" data-cm-delete="${escapeCM(item.id)}">Delete</button>
          </div>
        </article>`;
    }).join("");

    list.querySelectorAll("[data-cm-edit]").forEach(button => {
      button.addEventListener("click", async () => {
        const snap = await getDoc(doc(db, "courseModules", button.dataset.cmEdit));
        if (!snap.exists()) return notifyCM("Module no longer exists.");

        const data = snap.data();
        editingId = snap.id;
        $("#cmTitle").value = data.title || "";
        $("#cmVideo").value = data.videoUrl || "";
        $("#cmNotes").value = data.notes || "";
        $("#cmQuestions").value = JSON.stringify(data.questions || [], null, 2);
        $("#cmSave").textContent = "Update Module";
        $("#cmCancel").hidden = false;
        setStatus("Editing: " + (data.title || "Module"));
        $("#courseManager").scrollIntoView({ behavior: "smooth" });
      });
    });

    list.querySelectorAll("[data-cm-toggle]").forEach(button => {
      button.addEventListener("click", async () => {
        if (!confirm("Change this module's active status?")) return;
        try {
          await updateDoc(doc(db, "courseModules", button.dataset.cmToggle), {
            active: button.dataset.active !== "true",
            updatedAt: serverTimestamp()
          });
          await loadModules();
        } catch (error) {
          notifyCM("Status update failed: " + error.message);
        }
      });
    });

    list.querySelectorAll("[data-cm-delete]").forEach(button => {
      button.addEventListener("click", async () => {
        if (!confirm("Permanently delete this module?")) return;
        try {
          await deleteDoc(doc(db, "courseModules", button.dataset.cmDelete));
          notifyCM("Module deleted.");
          await loadModules();
        } catch (error) {
          notifyCM("Delete failed: " + error.message);
        }
      });
    });
  } catch (error) {
    console.error("Course load error:", error);
    list.textContent = "Could not load modules: " + (error.code || error.message);
  } finally {
    loading = false;
  }
}

async function checkAdmin(user) {
  if (!user) {
    isAdmin = false;
    $("#courseManager")?.remove();
    return;
  }

  try {
    const roleSnap = await getDoc(doc(db, "userRoles", user.uid));
    isAdmin = roleSnap.exists() && roleSnap.data().role === "admin";
    if (isAdmin) createPanel();
    else $("#courseManager")?.remove();
  } catch (error) {
    isAdmin = false;
    console.error("Admin role check failed:", error);
  }
}

onAuthStateChanged(auth, checkAdmin);

const observer = new MutationObserver(() => {
  const view = $("#dashboardView");
  const adminHeading = view?.querySelector(".dashboard-top .eyebrow")?.textContent || "";
  if (isAdmin && view && !view.hidden && adminHeading.includes("ADMIN CONSOLE")) {
    createPanel();
  }
});

observer.observe(document.body, { childList: true, subtree: true, attributes: true });
