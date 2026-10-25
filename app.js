
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

// Existing Firebase project configuration
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
let dashboardUserId = null;

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

$$(".nav a").forEach(a =>
  a.addEventListener("click", () => $("#mainNav")?.classList.remove("open"))
);

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

function toast(text) {
  const el = $("#toast");
  if (!el) return;

  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 3500);
}

function showMessage(id, text) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = text;
  el.hidden = false;
}

function clearMessage(id) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = "";
  el.hidden = true;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function explainError(error) {
  const errors = {
    "auth/email-already-in-use": "This account already exists. Please log in instead.",
    "auth/invalid-email": "The account ID or email format is invalid.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-credential": "Student ID/email or password is incorrect.",
    "auth/operation-not-allowed": "Enable Email/Password in Firebase Authentication.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/network-request-failed": "Check your internet connection.",
    "permission-denied": "Firestore Rules blocked this action. Check the published Rules.",
    "unavailable": "Firebase is temporarily unavailable. Try again."
  };

  return errors[error.code] || error.message || "Something went wrong.";
}

function makeStudentId() {
  return "STU" + Math.floor(100000 + Math.random() * 900000);
}

function studentAuthEmail(studentId) {
  return `${studentId.toLowerCase()}@students.excelwithai.com`;
}

function studentIdFromAuthEmail(email) {
  const match = String(email || "").match(
    /^((?:stu)\d{6})@students\.excelwithai\.com$/i
  );

  return match ? match[1].toUpperCase() : "";
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

// Show a polished Student ID success screen.
// Adds a Copy ID button without needing another HTML edit.
function showRegistrationSuccess(studentId, warning = "") {
  const form = $("#enrollForm");
  const success = $("#enrollSuccess");
  const idElement = $("#newStudentId");

  if (form) form.hidden = true;
  if (success) success.hidden = false;
  if (idElement) idElement.textContent = studentId;

  let copyButton = $("#copyStudentId");

  if (!copyButton && idElement) {
    copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.id = "copyStudentId";
    copyButton.className = "btn btn-outline btn-full";
    copyButton.textContent = "Copy Student ID";
    idElement.insertAdjacentElement("afterend", copyButton);
  }

  if (copyButton) {
    copyButton.onclick = async () => {
      try {
        await navigator.clipboard.writeText(studentId);
        copyButton.textContent = "✓ Student ID Copied";
        toast("Student ID copied successfully.");
      } catch {
        window.prompt("Copy your Student ID:", studentId);
      }
    };
  }

  const note = $("#registrationWarning");
  if (note) note.remove();

  if (warning && success) {
    const warningElement = document.createElement("p");
    warningElement.id = "registrationWarning";
    warningElement.className = "inline-message";
    warningElement.textContent = warning;
    success.appendChild(warningElement);
  }

  const loginButton = $("#goToStudentLogin");

  if (loginButton) {
    loginButton.onclick = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.warn("Sign out before login:", error);
      }

      closeModal($("#enrollModal"));
      openModal("loginModal");

      const loginInput = $('#loginForm [name="email"]');
      if (loginInput) loginInput.value = studentId;

      const passwordInput = $('#loginForm [name="password"]');
      passwordInput?.focus();
    };
  }
}

// Registration form: Firebase Authentication + Firestore.
$("#enrollForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  if (registrationInProgress) return;

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
    showMessage(
      "enrollMessage",
      "Enter your name, mobile number, course and password (minimum 6 characters)."
    );
    return;
  }

  if (!/^[0-9+() -]{10,16}$/.test(phone)) {
    showMessage("enrollMessage", "Please enter a valid mobile number.");
    return;
  }

  registrationInProgress = true;

  if (button) {
    button.disabled = true;
    button.textContent = "Creating your account…";
  }

  let accountCreated = false;
  let studentId = "";
  let uid = "";

  try {
    let credential;

    // Firebase Auth prevents duplicate synthetic login addresses.
    for (let attempt = 0; attempt < 10; attempt++) {
      studentId = makeStudentId();

      try {
        credential = await createUserWithEmailAndPassword(
          auth,
          studentAuthEmail(studentId),
          password
        );

        accountCreated = true;
        uid = credential.user.uid;
        break;
      } catch (error) {
        if (
          error.code !== "auth/email-already-in-use" ||
          attempt === 9
        ) {
          throw error;
        }
      }
    }

    if (!credential) throw new Error("Could not create account. Please try again.");

    await updateProfile(credential.user, { displayName: name });

    // Save each student's own profile.
    await setDoc(doc(db, "studentProfiles", uid), {
      uid,
      studentId,
      name,
      phone,
      contactEmail,
      course,
      role: "student",
      createdAt: serverTimestamp()
    });

    // Save the enrollment request for Admin review.
    const requestRef = doc(collection(db, "enrollmentRequests"));

    await setDoc(requestRef, {
      studentUid: uid,
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

    showRegistrationSuccess(studentId);
    toast("Registration successful! Save your Student ID.");

  } catch (error) {
    console.error("Registration failed:", error);

    // If Firebase Auth created the account, don't ask the student
    // to register again. Show the generated ID and the real error.
    if (accountCreated && studentId) {
      showRegistrationSuccess(
        studentId,
        "Your login account was created, but saving the profile or enrollment request failed. Save this ID. Do not register again. Error: " +
          explainError(error)
      );
    } else {
      showMessage("enrollMessage", explainError(error));
    }
  } finally {
    registrationInProgress = false;

    if (button) {
      button.disabled = false;
      button.textContent = "Register & Get Student ID ↗";
    }
  }
});

// Course buttons open the enrollment popup.
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
  const studentId = user.studentId || "";

  view.innerHTML = `
    <div class="dashboard-top">
      <div>
        <div class="eyebrow">EXCEL WITH AI · ${isAdmin ? "ADMIN CONSOLE" : "STUDENT SPACE"}</div>
        <h1>${isAdmin ? "Admin Dashboard" : "Student Dashboard"}</h1>
        <p>Welcome, ${escapeHtml(user.name)}.</p>
        <small>${escapeHtml(isAdmin ? (user.email || "") : studentId)}</small>
      </div>
      <button class="btn btn-outline" id="logoutBtn">Log out ↗</button>
    </div>

    <div class="dashboard-stats">
      <article>
        <span>${isAdmin ? "Enrollment requests" : "Your Student ID"}</span>
        <strong>${isAdmin ? "Admin" : escapeHtml(studentId || "Not available")}</strong>
        ${!isAdmin && studentId ? '<button class="btn btn-outline btn-sm" id="dashboardCopyId">Copy ID</button>' : ""}
      </article>
      <article><span>Account</span><strong>Active</strong></article>
      <article><span>Course</span><strong>${isAdmin ? "Admin" : escapeHtml(user.course || "Pending review")}</strong></article>
    </div>

    ${isAdmin ? `
      <div class="dashboard-panel">
        <div class="panel-heading">
          <div><h2>Student Enrollment Requests</h2><p>Registration requests saved in Firebase.</p></div>
          <button class="btn btn-outline" id="refreshRequests">Refresh</button>
        </div>
        <div id="requestList">Loading requests…</div>
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
            <p>Your Student ID: <strong>${escapeHtml(studentId || "Not available")}</strong></p>
            <p>Keep your Student ID and password safe. Course access may require Admin approval.</p>
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

  $("#dashboardCopyId")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(studentId);
      toast("Student ID copied.");
    } catch {
      window.prompt("Copy your Student ID:", studentId);
    }
  });

  $("#logoutBtn")?.addEventListener("click", async () => {
    try {
      await signOut(auth);
      dashboardUserId = null;
      showWebsite();
      toast("Logged out successfully.");
    } catch (error) {
      toast(explainError(error));
    }
  });

  if (isAdmin) {
    const loadRequests = async () => {
      const list = $("#requestList");
      if (!list) return;

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
                <small>${escapeHtml(r.email || "No email")} · ${escapeHtml(r.phone || "")}</small>
                <small>Course: ${escapeHtml(r.course || "")}</small>
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

// Login: Student ID or existing Admin email.
$("#loginForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  clearMessage("loginMessage");

  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const data = new FormData(form);

  const loginValue = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "");

  if (!loginValue || !password) {
    showMessage("loginMessage", "Enter your Student ID/email and password.");
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

    const studentId = profile?.studentId || studentIdFromAuthEmail(firebaseUser.email);

    dashboardUserId = firebaseUser.uid;
    closeModal($("#loginModal"));
    form.reset();

    renderDashboard({
      role,
      name: role === "admin"
        ? (firebaseUser.displayName || "Excel with AI Admin")
        : (profile?.name || firebaseUser.displayName || "Student"),
      email: profile?.contactEmail || firebaseUser.email,
      uid: firebaseUser.uid,
      studentId,
      course: profile?.course || ""
    });
  } catch (error) {
    console.error("Login failed:", error);
    showMessage("loginMessage", explainError(error));
  } finally {
    button.disabled = false;
    button.textContent = "Continue";
  }
});

// Restore the dashboard after page refresh.
onAuthStateChanged(auth, async firebaseUser => {
  if (registrationInProgress) return;

  if (!firebaseUser) {
    dashboardUserId = null;
    showWebsite();
    return;
  }

  if (dashboardUserId === firebaseUser.uid && $("#dashboardView") && !$("#dashboardView").hidden) {
    return;
  }

  try {
    const role = await getRole(firebaseUser.uid);
    const profile = await getProfile(firebaseUser.uid);
    const studentId = profile?.studentId || studentIdFromAuthEmail(firebaseUser.email);

    dashboardUserId = firebaseUser.uid;

    renderDashboard({
      role,
      name: role === "admin"
        ? (firebaseUser.displayName || "Excel with AI Admin")
        : (profile?.name || firebaseUser.displayName || "Student"),
      email: profile?.contactEmail || firebaseUser.email,
      uid: firebaseUser.uid,
      studentId,
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
