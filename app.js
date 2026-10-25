
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Your existing Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyCTW9W1E2Fcw4CZzMPtyjG1LY0JHK5pmo0",
  authDomain: "excel-with-ai.firebaseapp.com",
  projectId: "excel-with-ai",
  storageBucket: "excel-with-ai.firebasestorage.app",
  messagingSenderId: "615391443440",
  appId: "1:615391443440:web:92b3a15f0e4596abc50535"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

let registrationInProgress = false;

if ($("#year")) $("#year").textContent = new Date().getFullYear();

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  $$(".reveal").forEach(el => observer.observe(el));
}

$("#menuToggle")?.addEventListener("click", () =>
  $("#mainNav")?.classList.toggle("open")
);

$$(".nav a").forEach(a => a.addEventListener("click", () =>
  $("#mainNav")?.classList.remove("open")
));

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal(element) {
  const modal = element?.closest(".modal-backdrop");
  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

$$("[data-open]").forEach(button => {
  button.addEventListener("click", event => {
    if (event.currentTarget.tagName === "A") event.preventDefault();
    openModal(event.currentTarget.dataset.open);
  });
});

$$("[data-close]").forEach(button =>
  button.addEventListener("click", () => closeModal(button))
);

$$(".modal-backdrop").forEach(backdrop => {
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) closeModal(backdrop);
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    $$(".modal-backdrop.open").forEach(closeModal);
  }
});

function toast(message) {
  const el = $("#toast");
  if (!el) return;

  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 3500);
}

function message(id, text) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = text;
  el.hidden = false;
}

function clearMessage(id) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = "";
    el.hidden = true;
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function explainError(error) {
  const errors = {
    "auth/email-already-in-use": "Account already exists. Please log in.",
    "auth/invalid-email": "Email/account ID format is incorrect.",
    "auth/weak-password": "Password must contain at least 6 characters.",
    "auth/invalid-credential": "Student ID/email or password is incorrect.",
    "auth/operation-not-allowed": "Enable Email/Password in Firebase Authentication settings.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/network-request-failed": "Check your internet connection.",
    "permission-denied": "Firestore Rules blocked this action. Check and publish the correct Rules.",
    "unavailable": "Firebase is temporarily unavailable. Try again."
  };

  return errors[error.code] || error.message || "An unexpected error occurred.";
}

// Student ID login uses a private-format Firebase Auth email.
function makeStudentId() {
  return "STU" + Math.floor(100000 + Math.random() * 900000);
}

function studentAuthEmail(studentId) {
  return `${studentId.toLowerCase()}@students.excelwithai.com`;
}

async function getRole(uid) {
  const snap = await getDoc(doc(db, "userRoles", uid));
  return snap.exists() && snap.data().role === "admin"
    ? "admin"
    : "student";
}

async function getProfile(uid) {
  const snap = await getDoc(doc(db, "studentProfiles", uid));
  return snap.exists() ? snap.data() : null;
}

// REGISTRATION: creates Firebase Auth account and Firestore records.
$("#enrollForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  clearMessage("enrollMessage");

  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const data = new FormData(form);

  const name = String(data.get("name") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const contactEmail = String(data.get("email") || "").trim().toLowerCase();
  const course = String(data.get("course") || "").trim();
  const password = String(data.get("password") || "");
  const paymentRef = String(data.get("paymentRef") || "").trim();
  const note = String(data.get("message") || "").trim();

  if (!name || !phone || !course || password.length < 6) {
    message("enrollMessage", "Fill in your name, mobile, course and password (minimum 6 characters).");
    return;
  }

  if (!/^[0-9+() -]{10,16}$/.test(phone)) {
    message("enrollMessage", "Please enter a valid mobile number.");
    return;
  }

  registrationInProgress = true;
  button.disabled = true;
  button.textContent = "Creating account…";

  let accountCreated = false;

  try {
    let studentId;
    let credential;

    // Firebase Auth prevents duplicate synthetic login IDs.
    for (let attempt = 0; attempt < 5; attempt++) {
      studentId = makeStudentId();

      try {
        credential = await createUserWithEmailAndPassword(
          auth,
          studentAuthEmail(studentId),
          password
        );
        accountCreated = true;
        break;
      } catch (error) {
        if (error.code !== "auth/email-already-in-use" || attempt === 4) {
          throw error;
        }
      }
    }

    if (!credential) throw new Error("Could not create an account. Please retry.");

    await updateProfile(credential.user, { displayName: name });

    await setDoc(doc(db, "studentProfiles", credential.user.uid), {
      uid: credential.user.uid,
      studentId,
      name,
      phone,
      contactEmail,
      course,
      role: "student",
      createdAt: serverTimestamp()
    });

    const requestRef = doc(collection(db, "enrollmentRequests"));

    await setDoc(requestRef, {
      studentUid: credential.user.uid,
      studentId,
      name,
      phone,
      email: contactEmail,
      course,
      paymentRef,
      message: note,
      status: "Pending review",
      createdAt: serverTimestamp()
    });

    form.hidden = true;
    $("#enrollSuccess").hidden = false;
    $("#newStudentId").textContent = studentId;

    $("#goToStudentLogin")?.addEventListener("click", async () => {
      // Keep the new account signed in, but show the login screen.
      try {
        await signOut(auth);
        closeModal($("#enrollModal"));
        openModal("loginModal");

        const loginInput = $('#loginForm [name="email"]');
        if (loginInput) loginInput.value = studentId;
      } catch (error) {
        message("enrollMessage", explainError(error));
      }
    }, { once: true });

    toast("Registration successful. Save your Student ID.");
  } catch (error) {
    console.error("Registration error:", error);

    if (accountCreated) {
      message(
        "enrollMessage",
        "Your login account was created, but saving all records failed. Do not register again. Check Firestore Rules. Error: " +
        explainError(error)
      );
    } else {
      message("enrollMessage", explainError(error));
    }
  } finally {
    registrationInProgress = false;
    button.disabled = false;
    button.textContent = "Register & Get Student ID ↗";
  }
});

// Course buttons open registration form.
$$("[data-course]").forEach(button => {
  button.addEventListener("click", () => {
    const select = $("#courseSelect");
    if (select) select.value = button.dataset.course;
    openModal("enrollModal");
  });
});

function showWebsite() {
  if ($("#dashboardView")) $("#dashboardView").hidden = true;
  if ($("main")) $("main").hidden = false;
  if ($("footer")) $("footer").hidden = false;
}

function renderDashboard(user) {
  let view = $("#dashboardView");

  if (!view) {
    view = document.createElement("section");
    view.id = "dashboardView";
    view.className = "dashboard-view section-wrap";
    view.hidden = true;
    $("footer")?.before(view);
  }

  const isAdmin = user.role === "admin";

  view.innerHTML = `
    <div class="dashboard-top">
      <div>
        <div class="eyebrow">EXCEL WITH AI · ${isAdmin ? "ADMIN CONSOLE" : "STUDENT SPACE"}</div>
        <h1>${isAdmin ? "Admin Dashboard" : "Student Dashboard"}</h1>
        <p>Welcome, ${escapeHtml(user.name)}.</p>
        <small>${escapeHtml(user.studentId || user.email || "")}</small>
      </div>
      <button class="btn btn-outline" id="logoutBtn">Log out ↗</button>
    </div>

    <div class="dashboard-stats">
      <article><span>${isAdmin ? "Enrollment requests" : "Student ID"}</span>
        <strong>${isAdmin ? "Firebase" : escapeHtml(user.studentId || "—")}</strong></article>
      <article><span>Account</span><strong>Active</strong></article>
      <article><span>Course</span><strong>${isAdmin ? "Admin" : escapeHtml(user.course || "Pending review")}</strong></article>
    </div>

    ${isAdmin ? `
      <div class="dashboard-panel">
        <div class="panel-heading">
          <div><h2>Student Enrollment Requests</h2>
          <p>Requests saved in Firebase Firestore.</p></div>
          <button class="btn btn-outline" id="refreshRequests">Refresh</button>
        </div>
        <div id="requestList">Loading…</div>
      </div>
    ` : `
      <div class="dashboard-panel">
        <div class="panel-heading">
          <div><h2>My Learning</h2><p>Your registered course and account details.</p></div>
          <span class="pill pill-blue">ACCOUNT ACTIVE</span>
        </div>
        <div class="learner-course">
          <div class="course-icon">✦</div>
          <div class="learner-course-main">
            <h3>${escapeHtml(user.course || "Course pending approval")}</h3>
            <p>Your Student ID: <strong>${escapeHtml(user.studentId || "—")}</strong></p>
            <p>Course access may require Admin approval.</p>
          </div>
        </div>
      </div>
    `}
  `;

  if ($("main")) $("main").hidden = true;
  if ($("footer")) $("footer").hidden = true;
  view.hidden = false;
  $("#mainNav")?.classList.remove("open");
  view.scrollIntoView({ behavior: "smooth", block: "start" });

  $("#logoutBtn")?.addEventListener("click", async () => {
    try {
      await signOut(auth);
      showWebsite();
      toast("Logged out successfully.");
    } catch (error) {
      toast(explainError(error));
    }
  });

  if (isAdmin) {
    const loadRequests = async () => {
      const list = $("#requestList");
      list.textContent = "Loading enrollment requests…";

      try {
        const snap = await getDocs(collection(db, "enrollmentRequests"));

        if (snap.empty) {
          list.innerHTML = '<div class="empty-state">No enrollment requests yet.</div>';
          return;
        }

        const requests = snap.docs.map(item => ({
          id: item.id,
          ...item.data()
        }));

        list.innerHTML = `<div class="request-table">${
          requests.map(r => `
            <div class="request-row">
              <div>
                <strong>${escapeHtml(r.name)}</strong>
                <small>Student ID: ${escapeHtml(r.studentId)}</small>
                <small>${escapeHtml(r.email || "No email")} · ${escapeHtml(r.phone)}</small>
                <small>Course: ${escapeHtml(r.course)}</small>
                <small>Payment: ${escapeHtml(r.paymentRef || "Not provided")}</small>
              </div>
              <span class="status-pill">${escapeHtml(r.status || "Pending review")}</span>
              <div class="request-actions">
                <button class="btn btn-outline btn-sm" data-id="${escapeHtml(r.id)}" data-status="Approved">Approve</button>
                <button class="btn btn-quiet btn-sm" data-id="${escapeHtml(r.id)}" data-status="Rejected">Reject</button>
              </div>
            </div>
          `).join("")
        }</div>`;

        $$("[data-status]", list).forEach(button => {
          button.addEventListener("click", async () => {
            button.disabled = true;
            try {
              await updateDoc(doc(db, "enrollmentRequests", button.dataset.id), {
                status: button.dataset.status,
                reviewedAt: serverTimestamp(),
                reviewedBy: auth.currentUser.uid
              });
              toast("Request updated: " + button.dataset.status);
              await loadRequests();
            } catch (error) {
              toast(explainError(error));
              button.disabled = false;
            }
          });
        });
      } catch (error) {
        console.error(error);
        list.textContent = "Could not load requests: " + explainError(error);
      }
    };

    $("#refreshRequests")?.addEventListener("click", loadRequests);
    loadRequests();
  }
}

// LOGIN: students may use Student ID; Admin uses their existing email.
$("#loginForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  clearMessage("loginMessage");

  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const data = new FormData(form);

  const loginValue = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "");

  if (!loginValue || !password) {
    message("loginMessage", "Enter your Student ID/email and password.");
    return;
  }

  button.disabled = true;
  button.textContent = "Signing in…";

  try {
    const isStudentId = /^STU\d{6}$/i.test(loginValue);

    const email = isStudentId
      ? studentAuthEmail(loginValue.toUpperCase())
      : loginValue.toLowerCase();

    const result = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = result.user;
    const role = await getRole(firebaseUser.uid);
    const profile = await getProfile(firebaseUser.uid);

    closeModal($("#loginModal"));
    form.reset();

    renderDashboard({
      role,
      name: role === "admin"
        ? (firebaseUser.displayName || "Excel with AI Admin")
        : (profile?.name || firebaseUser.displayName || "Student"),
      email: profile?.contactEmail || firebaseUser.email,
      uid: firebaseUser.uid,
      studentId: profile?.studentId || "",
      course: profile?.course || ""
    });
  } catch (error) {
    console.error("Login error:", error);
    message("loginMessage", explainError(error));
  } finally {
    button.disabled = false;
    button.textContent = "Continue";
  }
});

// Restore the dashboard after refresh.
onAuthStateChanged(auth, async firebaseUser => {
  if (registrationInProgress) return;

  if (!firebaseUser) {
    showWebsite();
    return;
  }

  try {
    const role = await getRole(firebaseUser.uid);
    const profile = await getProfile(firebaseUser.uid);

    renderDashboard({
      role,
      name: role === "admin"
        ? (firebaseUser.displayName || "Excel with AI Admin")
        : (profile?.name || firebaseUser.displayName || "Student"),
      email: profile?.contactEmail || firebaseUser.email,
      uid: firebaseUser.uid,
      studentId: profile?.studentId || "",
      course: profile?.course || ""
    });
  } catch (error) {
    console.error("Could not restore dashboard:", error);
  }
});

$$(".faq-list details").forEach(detail => {
  detail.addEventListener("toggle", () => {
    if (detail.open) {
      $$(".faq-list details")
        .filter(other => other !== detail)
        .forEach(other => other.open = false);
    }
  });
});
