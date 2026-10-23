document.documentElement.classList.add("js-enabled");
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Firebase web config from the user's Excel with AI project. Web config is not a server secret.
const firebaseConfig = {
  apiKey: "AIzaSyCTW9W1E2Fcw4CZzMPtyjG1LY0JHK5pmo0",
  authDomain: "excel-with-ai.firebaseapp.com",
  projectId: "excel-with-ai",
  storageBucket: "excel-with-ai.firebasestorage.app",
  messagingSenderId: "615391443440",
  appId: "1:615391443440:web:92b3a15f0e4596abc50535"
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
$("#year").textContent = new Date().getFullYear();

const observer = new IntersectionObserver(entries => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      entry.target.style.transitionDelay = `${Math.min(index % 4, 3) * 80}ms`;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
$$(".reveal").forEach(el => observer.observe(el));

$("#menuToggle").addEventListener("click", () => $("#mainNav").classList.toggle("open"));
$$(".nav a").forEach(a => a.addEventListener("click", () => $("#mainNav").classList.remove("open")));
function openModal(id) {
  const el = document.getElementById(id); if (!el) return;
  el.classList.add("open"); el.setAttribute("aria-hidden", "false"); document.body.classList.add("modal-open");
  const first = el.querySelector("input"); if (first) setTimeout(() => first.focus(), 80);
}
function closeModal(el) {
  const modal = el.closest(".modal-backdrop"); if (!modal) return;
  modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); document.body.classList.remove("modal-open");
}
$$("[data-open]").forEach(btn => btn.addEventListener("click", () => openModal(btn.dataset.open)));
$$("[data-close]").forEach(btn => btn.addEventListener("click", () => closeModal(btn)));
$$(".modal-backdrop").forEach(backdrop => backdrop.addEventListener("click", e => { if (e.target === backdrop) closeModal(backdrop); }));
document.addEventListener("keydown", e => { if (e.key === "Escape") $$(".modal-backdrop.open").forEach(closeModal); });
function toast(message) {
  const el = $("#toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 3300);
}
$$("[data-course]").forEach(btn => btn.addEventListener("click", () => { $("#courseSelect").value = btn.dataset.course; openModal("enrollModal"); }));

// Enrollment requests remain local demo data until we wire the full protected workflow.
$("#enrollForm").addEventListener("submit", e => {
  e.preventDefault(); const form = new FormData(e.currentTarget);
  const request = { id:`DEMO-${Date.now()}`, name:String(form.get("name")||"").trim(), phone:String(form.get("phone")||"").trim(), email:String(form.get("email")||"").trim(), course:String(form.get("course")||""), paymentRef:String(form.get("paymentRef")||"").trim(), message:String(form.get("message")||"").trim(), status:"Pending review", createdAt:new Date().toISOString(), demoOnly:true };
  const key = "excelWithAiDemoEnrollmentRequests"; const saved = JSON.parse(localStorage.getItem(key) || "[]"); saved.push(request); localStorage.setItem(key, JSON.stringify(saved));
  e.currentTarget.hidden = true; $("#enrollSuccess").hidden = false;
});

function renderDashboard(user) {
  let view = $("#dashboardView");
  if (!view) { view = document.createElement("section"); view.id = "dashboardView"; view.className = "dashboard-view section-wrap"; view.hidden = true; $("footer").before(view); }
  const isAdmin = user.role === "admin";
  const requests = JSON.parse(localStorage.getItem("excelWithAiDemoEnrollmentRequests") || "[]");
  view.innerHTML = `
    <div class="dashboard-top"><div><div class="eyebrow">EXCEL WITH AI · ${isAdmin ? "ADMIN CONSOLE" : "LEARNER SPACE"}</div><h1>${isAdmin ? "Admin Dashboard" : "Student Dashboard"}</h1><p>Welcome, ${escapeHtml(user.name)}. ${isAdmin ? "Manage course requests and review the demo enrollment queue." : "Continue learning and explore your course resources."}</p><small>${escapeHtml(user.email)}</small></div><button class="btn btn-outline" id="logoutBtn">Log out ↗</button></div>
    <div class="dashboard-stats"><article><span>${isAdmin ? "Enrollment requests" : "My courses"}</span><strong>${isAdmin ? requests.length : "1"}</strong></article><article><span>${isAdmin ? "Pending review" : "Learning progress"}</span><strong>${isAdmin ? requests.filter(r => r.status === "Pending review").length : "12%"}</strong></article><article><span>${isAdmin ? "Course library" : "Certificates"}</span><strong>${isAdmin ? "4" : "0"}</strong></article></div>
    ${isAdmin ? `<div class="dashboard-panel"><div class="panel-heading"><div><h2>Enrollment requests</h2><p>These are still demo requests saved in this browser only.</p></div><button class="btn btn-outline" id="refreshRequests">Refresh</button></div><div id="requestList"></div></div><div class="dashboard-panel"><h2>Course & module management</h2><p>Admin tools preview. Firebase login is connected; uploads, payment workflow and course data are not connected yet.</p><div class="admin-tool-grid"><div><strong>Course library</strong><span>Excel Basics · Excel with AI · Dashboards · AI Prompt Lab</span></div><div><strong>Learning materials</strong><span>Video links, notes and downloadable practice files</span></div><div><strong>Payments</strong><span>UPI reference review and manual approval workflow</span></div><div><strong>Reports</strong><span>Student progress, quiz results and certificates</span></div></div></div>` : `<div class="dashboard-panel"><div class="panel-heading"><div><h2>My learning</h2><p>Your learning space</p></div><span class="pill pill-blue">ACCOUNT ACTIVE</span></div><div class="learner-course"><div class="course-icon">✦</div><div class="learner-course-main"><h3>Excel with AI</h3><p>Learn formulas, AI prompts, reports and business dashboards.</p><div class="progress-track"><span style="width:12%"></span></div><small>Progress and learning resources will connect in the next step.</small></div><button class="btn btn-primary" id="openLearning">Open course</button></div><div id="learningResources" hidden class="resource-grid"><article><span>▶ VIDEO LESSONS</span><h3>Module 1 · Getting Started</h3><p>Video links will appear here after the course admin adds them.</p></article><article><span>▤ NOTES & FILES</span><h3>Practice materials</h3><p>Lesson notes and Excel practice files will appear here.</p></article><article><span>✧ QUIZZES</span><h3>Check your learning</h3><p>Quizzes and certificate eligibility will be available after setup.</p></article></div></div>`}`;
  $("main").hidden = true; $("footer").hidden = true; view.hidden = false; $("#mainNav").classList.remove("open"); view.scrollIntoView({behavior:"smooth",block:"start"});
  $("#logoutBtn").addEventListener("click", async () => { try { await signOut(auth); } catch(err) { toast("Logout error: " + err.message); } });
  if (isAdmin) {
    const renderRequests = () => {
      const list = $("#requestList"); const rows = JSON.parse(localStorage.getItem("excelWithAiDemoEnrollmentRequests") || "[]");
      list.innerHTML = rows.length ? `<div class="request-table">${rows.map(r => `<div class="request-row"><div><strong>${escapeHtml(r.name)}</strong><small>${escapeHtml(r.email)} · ${escapeHtml(r.phone)}</small><small>${escapeHtml(r.course)} · ${new Date(r.createdAt).toLocaleDateString()}</small></div><span class="status-pill">${escapeHtml(r.status)}</span><div class="request-actions"><button class="btn btn-outline btn-sm" data-approve="${r.id}">Approve</button><button class="btn btn-quiet btn-sm" data-reject="${r.id}">Reject</button></div></div>`).join("")}</div>` : `<div class="empty-state">No demo enrollment requests in this browser yet.</div>`;
      $$('[data-approve]').forEach(b => b.addEventListener('click', () => updateRequest(b.dataset.approve, 'Approved')));
      $$('[data-reject]').forEach(b => b.addEventListener('click', () => updateRequest(b.dataset.reject, 'Rejected')));
    };
    const updateRequest = (id, status) => { const rows = JSON.parse(localStorage.getItem("excelWithAiDemoEnrollmentRequests") || "[]"); localStorage.setItem("excelWithAiDemoEnrollmentRequests", JSON.stringify(rows.map(r => r.id === id ? {...r,status} : r))); renderDashboard(user); };
    $("#refreshRequests").addEventListener("click", renderRequests); renderRequests();
  } else { $("#openLearning").addEventListener("click", () => { $("#learningResources").hidden = !$("#learningResources").hidden; }); }
}
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch])); }

$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault(); const button = e.currentTarget.querySelector('button[type="submit"]'); button.disabled = true; button.textContent = "Signing in…";
  const fields = new FormData(e.currentTarget); const email = String(fields.get("email") || "").trim().toLowerCase(); const password = String(fields.get("password") || "");
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const roleSnap = await getDoc(doc(db, "userRoles", credential.user.uid));
    const role = roleSnap.exists() && roleSnap.data().role === "admin" ? "admin" : "student";
    closeModal($("#loginModal")); e.currentTarget.reset(); $("#loginMessage").hidden = true;
    renderDashboard({ role, name: role === "admin" ? "Excel with AI Admin" : (credential.user.displayName || credential.user.email.split("@")[0]), email: credential.user.email, uid: credential.user.uid });
  } catch (error) {
    $("#loginMessage").hidden = false;
    const messages = { "auth/invalid-credential":"Email ya password sahi nahi hai. Firebase Users mein banaya hua account use karein.", "auth/too-many-requests":"Bahut baar try hua hai. Thodi der baad dobara koshish karein.", "auth/network-request-failed":"Internet connection check karke phir try karein." };
    $("#loginMessage").textContent = messages[error.code] || `Login nahi hua: ${error.message}`;
  } finally { button.disabled = false; button.textContent = "Continue"; }
});

// If the user refreshes while signed in, restore their role-based dashboard.
onAuthStateChanged(auth, async user => {
  if (!user) return;
  try {
    const roleSnap = await getDoc(doc(db, "userRoles", user.uid));
    const role = roleSnap.exists() && roleSnap.data().role === "admin" ? "admin" : "student";
    renderDashboard({ role, name: role === "admin" ? "Excel with AI Admin" : (user.displayName || user.email.split("@")[0]), email: user.email, uid: user.uid });
  } catch (e) { console.warn("Could not restore signed-in view", e); }
});
$$(".faq-list details").forEach(detail => detail.addEventListener("toggle", () => { if (detail.open) $$(".faq-list details").filter(other => other !== detail).forEach(other => other.open = false); }));
