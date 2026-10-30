
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
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCT9W9W1E2Fcw4CZzMPtyjG1LY0JHK5pmo0",
  authDomain: "excel-with-ai.firebaseapp.com",
  projectId: "excel-with-ai",
  storageBucket: "excel-with-ai.firebasestorage.app",
  messagingSenderId: "615391443440",
  appId: "1:615391443440:web:92b3a15f0e4596abc50535"
};

// Google Apps Script Web App URL
const NOTICE_EMAIL_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycby9wVwlJT1FcR2Wx7SFXGjL62R4JeEn560QmXBIlDEdAkkwQDiJXYczoYqxKVSrW0H7/exec";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

let registering = false;
let dashboardUid = null;

if ($("#year")) {
  $("#year").textContent = new Date().getFullYear();
}

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

$("#menuToggle")?.addEventListener("click", () => {
  $("#mainNav")?.classList.toggle("open");
});

$$(".nav a").forEach(el => {
  el.addEventListener("click", () => {
    $("#mainNav")?.classList.remove("open");
  });
});

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.error("Modal not found:", id);
    return;
  }

  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal(el) {
  const modal = el?.closest(".modal-backdrop");
  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

$$("[data-open]").forEach(el => {
  el.addEventListener("click", e => {
    if (e.currentTarget.tagName === "A") {
      e.preventDefault();
    }

    openModal(e.currentTarget.dataset.open);
  });
});

$$("[data-close]").forEach(el => {
  el.addEventListener("click", () => closeModal(el));
});

$$(".modal-backdrop").forEach(el => {
  el.addEventListener("click", e => {
    if (e.target === el) closeModal(el);
  });
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    $$(".modal-backdrop.open").forEach(el => closeModal(el));
  }
});

function toast(message) {
  const el = $("#toast");

  if (!el) {
    console.info(message);
    return;
  }

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    el.classList.remove("show");
  }, 3500);
}

function showMessage(id, message) {
  const el = document.getElementById(id);

  if (el) {
    el.textContent = message;
    el.hidden = false;
  }
}

function clearMessage(id) {
  const el = document.getElementById(id);

  if (el) {
    el.textContent = "";
    el.hidden = true;
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function errorText(error) {
  const map = {
    "auth/email-already-in-use":
      "This account already exists. Please log in.",
    "auth/invalid-email":
      "Invalid Student ID or email.",
    "auth/weak-password":
      "Password must be at least 6 characters.",
    "auth/invalid-credential":
      "Student ID/email or password is incorrect.",
    "auth/operation-not-allowed":
      "Enable Email/Password in Firebase Authentication.",
    "auth/too-many-requests":
      "Too many attempts. Try again later.",
    "auth/network-request-failed":
      "Check your internet connection.",
    "permission-denied":
      "Firestore Rules blocked this action. Check published Rules."
  };

  return map[error.code] || error.message ||
    "An unexpected error occurred.";
}

function newStudentId() {
  return "STU" + Math.floor(100000 + Math.random() * 900000);
}

function studentAuthEmail(id) {
  return `${id.toLowerCase()}@students.excelwithai.com`;
}

function idFromEmail(email) {
  const match = String(email || "").match(
    /^(stu\d{6})@students\.excelwithai\.com$/i
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

  return snap.exists()
    ? { uid, ...snap.data() }
    : null;
}

// REGISTRATION SUCCESS SCREEN
function showSuccess(id, warning = "") {
  if ($("#enrollForm")) {
    $("#enrollForm").hidden = true;
  }

  if ($("#enrollSuccess")) {
    $("#enrollSuccess").hidden = false;
  }

  if ($("#newStudentId")) {
    $("#newStudentId").textContent = id;
  }

  let copy = $("#copyStudentId");

  if (!copy && $("#newStudentId")) {
    copy = document.createElement("button");
    copy.id = "copyStudentId";
    copy.type = "button";
    copy.className = "btn btn-outline btn-full";
    copy.textContent = "Copy Student ID";

    $("#newStudentId").insertAdjacentElement("afterend", copy);
  }

  if (copy) {
    copy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(id);
        copy.textContent = "✓ ID Copied";
        toast("Student ID copied.");
      } catch {
        window.prompt("Copy your Student ID:", id);
      }
    };
  }

  const loginBtn = $("#goToStudentLogin");

  if (loginBtn) {
    loginBtn.onclick = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.warn(error);
      }

      closeModal($("#enrollModal"));
      openModal("loginModal");

      const field = $('#loginForm [name="email"]');

      if (field) {
        field.value = id;
      }

      $('#loginForm [name="password"]')?.focus();
    };
  }

  let warningEl = $("#registrationWarning");

  if (warningEl) {
    warningEl.remove();
  }

  if (warning) {
    warningEl = document.createElement("p");
    warningEl.id = "registrationWarning";
    warningEl.className = "inline-message";
    warningEl.textContent = warning;
    $("#enrollSuccess")?.appendChild(warningEl);
  }
}

// STUDENT REGISTRATION
$("#enrollForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  if (registering) return;

  clearMessage("enrollMessage");

  const form = e.currentTarget;
  const button = form.querySelector('[type="submit"]');
  const data = new FormData(form);

  const name = String(data.get("name") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const contactEmail = String(data.get("email") || "")
    .trim().toLowerCase();
  const course = String(data.get("course") || "").trim();
  const password = String(data.get("password") || "");
  const paymentRef = String(data.get("paymentRef") || "").trim();
  const note = String(data.get("message") || "").trim();

  if (!name || !phone || !course || password.length < 6) {
    showMessage(
      "enrollMessage",
      "Fill all required fields. Password must be at least 6 characters."
    );
    return;
  }

  if (!/^[0-9+() -]{10,16}$/.test(phone)) {
    showMessage("enrollMessage", "Enter a valid mobile number.");
    return;
  }

  registering = true;

  if (button) {
    button.disabled = true;
    button.textContent = "Creating account…";
  }

  let user = null;
  let id = "";

  try {
    let credential;

    for (let i = 0; i < 10; i++) {
      id = newStudentId();

      try {
        credential = await createUserWithEmailAndPassword(
          auth,
          studentAuthEmail(id),
          password
        );

        user = credential.user;
        break;
      } catch (err) {
        if (
          err.code !== "auth/email-already-in-use" ||
          i === 9
        ) {
          throw err;
        }
      }
    }

    if (!user) {
      throw new Error("Could not create account.");
    }

    await updateProfile(user, { displayName: name });

    await setDoc(doc(db, "studentProfiles", user.uid), {
      uid: user.uid,
      studentId: id,
      name,
      phone,
      contactEmail,
      course,
      role: "student",
      status: "Pending Approval",
      createdAt: serverTimestamp()
    });

    const requestRef = doc(collection(db, "enrollmentRequests"));

    await setDoc(requestRef, {
      studentUid: user.uid,
      studentId: id,
      name,
      phone,
      email: contactEmail,
      course,
      paymentRef,
      message: note,
      status: "Pending Approval",
      createdAt: serverTimestamp()
    });

    showSuccess(id);
    toast("Registration saved. Save the Student ID.");
  } catch (err) {
    console.error("Registration error:", err);

    if (user && id) {
      showSuccess(
        id,
        "Account created, but saving the student record failed. Save this ID and contact Admin. Error: " +
          errorText(err)
      );
    } else {
      showMessage("enrollMessage", errorText(err));
    }
  } finally {
    registering = false;

    if (button) {
      button.disabled = false;
      button.textContent = "Register & Get Student ID ↗";
    }
  }
});

// COURSE BUTTONS
$$("[data-course]").forEach(button => {
  button.addEventListener("click", () => {
    const select = $("#courseSelect");

    if (select) {
      select.value = button.dataset.course;
    }

    openModal("enrollModal");
  });
});

function showWebsite() {
  if ($("#dashboardView")) {
    $("#dashboardView").hidden = true;
  }

  if ($("main")) {
    $("main").hidden = false;
  }

  if ($("footer")) {
    $("footer").hidden = false;
  }
}

// DASHBOARD
function renderDashboard(user) {
  let view = $("#dashboardView");

  if (!view) {
    view = document.createElement("section");
    view.id = "dashboardView";
    view.className = "dashboard-view section-wrap";
    view.hidden = true;

    $("footer")?.before(view);
  }

  const admin = user.role === "admin";
  const status = user.status || "Pending Approval";
  const id = user.studentId || "";

  view.innerHTML = `
    <div class="dashboard-top">
      <div>
        <div class="eyebrow">
          EXCEL WITH AI · ${admin ? "ADMIN CONSOLE" : "STUDENT SPACE"}
        </div>
        <h1>${admin ? "Admin Dashboard" : "Student Dashboard"}</h1>
        <p>Welcome, ${escapeHtml(user.name)}</p>
        <small>${escapeHtml(admin ? (user.email || "") : id)}</small>
      </div>

      <button class="btn btn-outline" id="logoutBtn">
        Log out ↗
      </button>
    </div>

    ${
      admin
        ? `
          <div class="dashboard-stats">
            <article>
              <span>Total Students</span>
              <strong id="studentCount">…</strong>
            </article>

            <article>
              <span>Pending Approval</span>
              <strong id="pendingCount">…</strong>
            </article>

            <article>
              <span>Admin Access</span>
              <strong>Active</strong>
            </article>
          </div>

          <div class="dashboard-panel live-class-admin">
            <div class="panel-heading">
              <div>
                <h2>🔴 Live Online Class</h2>
                <p>Publish or stop a Google Meet class on the homepage.</p>
              </div>
              <span id="liveAdminStatus" class="status-pill">Checking…</span>
            </div>

            <form id="liveClassForm">
              <label>
                Class title
                <input id="liveClassTitle" maxlength="100"
                  placeholder="Excel with AI — Live Class">
              </label>

              <label>
                Google Meet link
                <input id="liveClassUrl" type="url"
                  placeholder="https://meet.google.com/..." required>
              </label>

              <div class="request-actions">
                <button class="btn btn-primary" type="submit">
                  Activate Class
                </button>
                <button class="btn btn-outline" type="button"
                  id="deactivateLiveClass">
                  Deactivate
                </button>
                <button class="btn btn-quiet" type="button"
                  id="deleteLiveClass">
                  Delete Class
                </button>
              </div>

              <p id="liveClassMessage" role="status"></p>
            </form>
          </div>

          <div class="dashboard-panel notice-admin-panel">
            <div class="panel-heading">
              <div>
                <h2>📢 Notice Management</h2>
                <p>Create and publish important website notices.</p>
              </div>
            </div>

            <form id="adminNoticeForm">
              <label>
                Notice Title
                <input id="noticeTitle" type="text" maxlength="150"
                  placeholder="Example: New Excel Class Announcement" required>
              </label>

              <label>
                Notice Message
                <textarea id="noticeMessage" rows="5" maxlength="5000"
                  placeholder="Write your complete notice here..." required></textarea>
              </label>

              <button type="submit" class="btn btn-primary"
                id="publishNoticeBtn">
                📢 Publish Notice
              </button>

              <p id="noticePublishMessage" role="status"
                aria-live="polite"></p>
            </form>
          </div>

          <div class="dashboard-panel">
            <div class="panel-heading">
              <div>
                <h2>All Student Records</h2>
                <p>Registered students from Firestore.</p>
              </div>

              <button class="btn btn-outline" id="refreshStudents">
                Refresh
              </button>
            </div>

            <input id="studentSearch" type="search"
              placeholder="Search ID, name, phone, email or course">

            <div id="studentRecords">Loading records…</div>
          </div>
        `
        : `
          <div class="dashboard-stats">
            <article>
              <span>Student ID</span>
              <strong>${escapeHtml(id || "Not available")}</strong>
              ${
                id
                  ? '<button class="btn btn-outline btn-sm" id="copyDashboardId">Copy ID</button>'
                  : ""
              }
            </article>

            <article>
              <span>Account Status</span>
              <strong>${escapeHtml(status)}</strong>
            </article>

            <article>
              <span>Course</span>
              <strong>${escapeHtml(user.course || "Not assigned")}</strong>
            </article>
          </div>

          <div class="dashboard-panel">
            <h2>My Student Record</h2>

            <p><strong>Name:</strong> ${escapeHtml(user.name)}</p>
            <p><strong>Student ID:</strong> ${escapeHtml(id || "Not available")}</p>
            <p><strong>Mobile:</strong> ${escapeHtml(user.phone || "Not provided")}</p>
            <p><strong>Email:</strong> ${escapeHtml(user.email || "Not provided")}</p>
            <p><strong>Course:</strong> ${escapeHtml(user.course || "Not assigned")}</p>
            <p><strong>Status:</strong> ${escapeHtml(status)}</p>

            ${
              status === "Active"
                ? `
                  <h3>Account Approved</h3>
                  <p>Your account has been approved by Admin.</p>
                `
                : `
                  <h3>Waiting for Admin Approval</h3>
                  <p>Course access will be available after Admin approval.</p>
                `
            }
          </div>
        `
    }
  `;

  if ($("main")) {
    // LIVE ONLINE CLASS ADMIN CONTROLS
    if (admin) {
      const liveClassRef = doc(db, "liveClasses", "current");
      const liveForm = $("#liveClassForm");
      const liveStatus = $("#liveAdminStatus");
      const liveMessage = $("#liveClassMessage");

      const showLiveMessage = (message) => {
        if (liveMessage) liveMessage.textContent = message;
      };

      getDoc(liveClassRef).then((snap) => {
        if (!snap.exists()) {
          liveStatus.textContent = "OFFLINE";
          return;
        }

        const data = snap.data();
        $("#liveClassTitle").value = data.title || "";
        $("#liveClassUrl").value = data.meetUrl || "";
        liveStatus.textContent = data.active === true ? "LIVE" : "OFFLINE";
      }).catch((error) => {
        console.error(error);
        showLiveMessage("Could not load live class. Check Firestore Rules.");
      });

      liveForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const title = $("#liveClassTitle").value.trim();
        const meetUrl = $("#liveClassUrl").value.trim();

        let parsed;

        try {
          parsed = new URL(meetUrl);
        } catch {
          showLiveMessage("Enter a valid Google Meet URL.");
          return;
        }

        if (
          parsed.protocol !== "https:" ||
          parsed.hostname !== "meet.google.com"
        ) {
          showLiveMessage("Use a valid https://meet.google.com/ link.");
          return;
        }

        try {
          await setDoc(liveClassRef, {
            title,
            meetUrl: parsed.href,
            active: true,
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser.uid
          });

          liveStatus.textContent = "LIVE";
          showLiveMessage("Class activated. Homepage is updating.");
        } catch (error) {
          console.error(error);
          showLiveMessage("Activation failed. Check Firestore Rules.");
        }
      });

      $("#deactivateLiveClass")?.addEventListener("click", async () => {
        try {
          await setDoc(liveClassRef, {
            active: false,
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser.uid
          }, { merge: true });

          liveStatus.textContent = "OFFLINE";
          showLiveMessage("Class deactivated.");
        } catch (error) {
          console.error(error);
          showLiveMessage("Deactivation failed. Check Firestore Rules.");
        }
      });

      $("#deleteLiveClass")?.addEventListener("click", async () => {
        if (!confirm("Delete the live class and saved link?")) return;

        try {
          await deleteDoc(liveClassRef);
          $("#liveClassTitle").value = "";
          $("#liveClassUrl").value = "";
          liveStatus.textContent = "OFFLINE";
          showLiveMessage("Live class deleted.");
        } catch (error) {
          console.error(error);
          showLiveMessage("Delete failed. Check Firestore Rules.");
        }
      });

// ADMIN NOTICE PUBLISH + EMAIL TEST
      const noticeForm = $("#adminNoticeForm");
      const noticeButton = $("#publishNoticeBtn");
      const noticeStatus = $("#noticePublishMessage");

      noticeForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const title = $("#noticeTitle")?.value.trim() || "";
        const message = $("#noticeMessage")?.value.trim() || "";

        if (title.length < 3 || message.length < 3) {
          if (noticeStatus) {
            noticeStatus.textContent =
              "Enter a valid title and message (minimum 3 characters).";
          }
          return;
        }

        if (!auth.currentUser) {
          if (noticeStatus) {
            noticeStatus.textContent = "Please log in as Admin again.";
          }
          return;
        }

        if (noticeButton) {
          noticeButton.disabled = true;
          noticeButton.textContent = "Publishing...";
        }

        if (noticeStatus) noticeStatus.textContent = "";

        try {
          // Save Notice in Firestore
          const noticeRef = doc(collection(db, "notices"));

          await setDoc(noticeRef, {
            title,
            message,
            status: "published",
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser.uid
          });

          // Get Firebase Authentication Token
          const idToken = await auth.currentUser.getIdToken();

          // TEST MODE: Send email only to Admin Gmail
          await fetch(NOTICE_EMAIL_WEB_APP_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify({
              idToken,
              noticeId: noticeRef.id,
              testOnly: true
            })
          });

          noticeForm.reset();

          if (noticeStatus) {
            noticeStatus.textContent =
              "Notice saved. Email request submitted. Check Gmail Inbox, Spam and Sent.";
          }

          toast("Notice published. Test email request submitted.");

        } catch (error) {
          console.error("Notice publish/email error:", error);

          if (noticeStatus) {
            noticeStatus.textContent =
              "Notice saved or email request failed: " + errorText(error);
          }

        } finally {
          if (noticeButton) {
            noticeButton.disabled = false;
            noticeButton.textContent = "📢 Publish Notice";
          }
        }
      });
    }

    $("main").hidden = true;
  }

  // Make Admin Student Records collapsible
  if (admin) {
    const panel = view.querySelector("#studentRecords")
      ?.closest(".dashboard-panel");

    if (panel && !panel.closest("details.admin-accordion")) {
      const details = document.createElement("details");
      details.className = "admin-accordion";
      details.open = false;

      const summary = document.createElement("summary");
      summary.innerHTML = `
        <span class="admin-accordion-title">📋 All Student Records</span>
        <span class="admin-accordion-hint">Click to open / close</span>
      `;

      panel.parentNode.insertBefore(details, panel);
      details.appendChild(summary);
      details.appendChild(panel);
    }
  }

  if ($("footer")) {
    $("footer").hidden = true;
  }

  view.hidden = false;
  view.scrollIntoView({ behavior: "smooth", block: "start" });

  $("#copyDashboardId")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(id);
      toast("Student ID copied.");
    } catch {
      window.prompt("Copy Student ID:", id);
    }
  });

  $("#logoutBtn")?.addEventListener("click", async () => {
    try {
      await signOut(auth);
      dashboardUid = null;
      showWebsite();
    } catch (err) {
      toast(errorText(err));
    }
  });

  if (admin) {
    loadAdminStudents();
  }
}

// ADMIN STUDENT MANAGEMENT
async function loadAdminStudents() {
  const target = $("#studentRecords");

  if (!target) return;

  let students = [];

  const renderRows = () => {
    const query = ($("#studentSearch")?.value || "")
      .trim()
      .toLowerCase();

    const filtered = students.filter(s =>
      [
        s.studentId,
        s.name,
        s.phone,
        s.contactEmail,
        s.course,
        s.status
      ].join(" ").toLowerCase().includes(query)
    );

    if (!filtered.length) {
      target.innerHTML =
        '<p class="empty-state">No student records found.</p>';
      return;
    }

    target.innerHTML = `
      <div class="request-table">
        ${
          filtered.map(s => `
            <div class="request-row">
              <div>
                <strong>${escapeHtml(s.name || "Student")}</strong>
                <small>ID: ${escapeHtml(s.studentId || "—")}</small>
                <small>Mobile: ${escapeHtml(s.phone || "—")}</small>
                <small>Email: ${escapeHtml(s.contactEmail || "Not provided")}</small>
                <small>Course: ${escapeHtml(s.course || "Not selected")}</small>
                <small>Status: ${escapeHtml(s.status || "Pending Approval")}</small>
              </div>

              <div class="request-actions">
                ${
                  s.status !== "Active"
                    ? `<button class="btn btn-primary btn-sm" data-status="Active" data-uid="${escapeHtml(s.uid)}">Approve</button>`
                    : '<span class="status-pill">Active</span>'
                }

                ${
                  s.status !== "Rejected"
                    ? `<button class="btn btn-quiet btn-sm" data-status="Rejected" data-uid="${escapeHtml(s.uid)}">Reject</button>`
                    : ""
                }

                <button class="btn btn-primary btn-sm"
                  data-view="${escapeHtml(s.uid)}">
                  View Student Data ↗
                </button>

                <button class="btn btn-outline btn-sm"
                  data-edit="${escapeHtml(s.uid)}">
                  Edit
                </button>

                <button class="btn btn-quiet btn-sm"
                  data-delete="${escapeHtml(s.uid)}">
                  Delete
                </button>
              </div>
            </div>
          `).join("")
        }
      </div>
    `;

    $$("[data-view]", target).forEach(button => {
      button.addEventListener("click", () => {
        const uid = button.dataset.view;
        window.location.href =
          "student-details.html?uid=" + encodeURIComponent(uid);
      });
    });

    $$("[data-status]", target).forEach(button => {
      button.addEventListener("click", async () => {
        const uid = button.dataset.uid;
        const newStatus = button.dataset.status;

        button.disabled = true;

        try {
          await updateDoc(doc(db, "studentProfiles", uid), {
            status: newStatus
          });

          const requests = await getDocs(
            collection(db, "enrollmentRequests")
          );

          for (const request of requests.docs) {
            if (request.data().studentUid === uid) {
              await updateDoc(
                doc(db, "enrollmentRequests", request.id),
                {
                  status: newStatus === "Active" ? "Approved" : "Rejected",
                  reviewedAt: serverTimestamp(),
                  reviewedBy: auth.currentUser.uid
                }
              );
            }
          }

          toast("Student status: " + newStatus);
          await loadAdminStudents();

        } catch (err) {
          console.error(err);
          toast(errorText(err));
          button.disabled = false;
        }
      });
    });

    $$("[data-edit]", target).forEach(button => {
      button.addEventListener("click", async () => {
        const student = students.find(
          s => s.uid === button.dataset.edit
        );

        if (!student) return;

        const name = prompt("Student name:", student.name || "");
        if (name === null) return;

        const phone = prompt("Mobile number:", student.phone || "");
        if (phone === null) return;

        const email = prompt(
          "Contact email:",
          student.contactEmail || ""
        );
        if (email === null) return;

        const course = prompt("Course:", student.course || "");
        if (course === null) return;

        button.disabled = true;

        try {
          await updateDoc(
            doc(db, "studentProfiles", student.uid),
            {
              name: name.trim(),
              phone: phone.trim(),
              contactEmail: email.trim().toLowerCase(),
              course: course.trim()
            }
          );

          toast("Student record updated.");
          await loadAdminStudents();

        } catch (err) {
          console.error(err);
          toast("Update failed: " + errorText(err));
          button.disabled = false;
        }
      });
    });

    $$("[data-delete]", target).forEach(button => {
      button.addEventListener("click", async () => {
        const student = students.find(
          s => s.uid === button.dataset.delete
        );

        if (!student) return;

        const confirmed = confirm(
          `Delete Firestore profile for ${student.name} (${student.studentId})? The Firebase Authentication login account will not be deleted by this action.`
        );

        if (!confirmed) return;

        button.disabled = true;

        try {
          const requests = await getDocs(
            collection(db, "enrollmentRequests")
          );

          for (const request of requests.docs) {
            if (request.data().studentUid === student.uid) {
              await updateDoc(
                doc(db, "enrollmentRequests", request.id),
                {
                  status: "Deleted",
                  reviewedAt: serverTimestamp(),
                  reviewedBy: auth.currentUser.uid
                }
              );
            }
          }

          await deleteDoc(
            doc(db, "studentProfiles", student.uid)
          );

          toast(
            "Student profile deleted. Authentication login still exists."
          );

          await loadAdminStudents();

        } catch (err) {
          console.error(err);
          toast("Delete failed: " + errorText(err));
          button.disabled = false;
        }
      });
    });
  };

  const refresh = async () => {
    target.textContent = "Loading student records…";

    try {
      const snapshot = await getDocs(
        collection(db, "studentProfiles")
      );

      students = snapshot.docs.map(d => ({
        uid: d.id,
        ...d.data()
      }));

      if ($("#studentCount")) {
        $("#studentCount").textContent = String(students.length);
      }

      if ($("#pendingCount")) {
        $("#pendingCount").textContent = String(
          students.filter(
            s => (s.status || "Pending Approval") === "Pending Approval"
          ).length
        );
      }

      renderRows();

    } catch (err) {
      console.error(err);
      target.textContent =
        "Could not load records: " + errorText(err);
    }
  };

  $("#studentSearch")?.addEventListener("input", renderRows);
  $("#refreshStudents")?.addEventListener("click", refresh);

  await refresh();
}

// LOGIN: STUDENT ID OR ADMIN EMAIL
$("#loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  clearMessage("loginMessage");

  const form = e.currentTarget;
  const button = form.querySelector('[type="submit"]');
  const data = new FormData(form);

  const value = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "");

  if (!value || !password) {
    showMessage(
      "loginMessage",
      "Enter your Student ID/email and password."
    );
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Signing in…";
  }

  try {
    const isId = /^STU\d{6}$/i.test(value);

    const email = isId
      ? studentAuthEmail(value.toUpperCase())
      : value.toLowerCase();

    const result = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const firebaseUser = result.user;
    const role = await getRole(firebaseUser.uid);
    const profile = await getProfile(firebaseUser.uid);
    const id = profile?.studentId ||
      idFromEmail(firebaseUser.email);

    dashboardUid = firebaseUser.uid;

    closeModal($("#loginModal"));
    form.reset();

    renderDashboard({
      role,
      name: role === "admin"
        ? (firebaseUser.displayName || "Institute Admin")
        : (profile?.name || firebaseUser.displayName || "Student"),
      email: profile?.contactEmail || firebaseUser.email,
      uid: firebaseUser.uid,
      studentId: id,
      phone: profile?.phone || "",
      course: profile?.course || "",
      status: profile?.status || "Pending Approval"
    });

  } catch (err) {
    console.error("Login error:", err);
    showMessage("loginMessage", errorText(err));

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Continue";
    }
  }
});

// RESTORE DASHBOARD AFTER REFRESH
onAuthStateChanged(auth, async firebaseUser => {
  if (registering) return;

  if (!firebaseUser) {
    dashboardUid = null;
    showWebsite();
    return;
  }

  if (
    dashboardUid === firebaseUser.uid &&
    $("#dashboardView") &&
    !$("#dashboardView").hidden
  ) {
    return;
  }

  try {
    const role = await getRole(firebaseUser.uid);
    const profile = await getProfile(firebaseUser.uid);
    const id = profile?.studentId ||
      idFromEmail(firebaseUser.email);

    dashboardUid = firebaseUser.uid;

    renderDashboard({
      role,
      name: role === "admin"
        ? (firebaseUser.displayName || "Institute Admin")
        : (profile?.name || firebaseUser.displayName || "Student"),
      email: profile?.contactEmail || firebaseUser.email,
      uid: firebaseUser.uid,
      studentId: id,
      phone: profile?.phone || "",
      course: profile?.course || "",
      status: profile?.status || "Pending Approval"
    });

  } catch (err) {
    console.error("Dashboard restore failed:", err);
  }
});

// FAQ ACCORDION
$$(".faq-list details").forEach(detail => {
  detail.addEventListener("toggle", () => {
    if (detail.open) {
      $$(".faq-list details")
        .filter(other => other !== detail)
        .forEach(other => {
          other.open = false;
        });
    }
  });
});

// PUBLIC HOMEPAGE NOTICE LOADER
async function loadPublicNotices() {
  const section = $("#publicNoticeSection");
  const target = $("#publicNoticeList");

  if (!section || !target) return;

  try {
    const snapshot = await getDocs(collection(db, "notices"));

    const notices = snapshot.docs
      .map(item => ({
        id: item.id,
        ...item.data()
      }))
      .filter(item => item.status === "published")
      .sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      })
      .slice(0, 10);

    if (notices.length === 0) {
      section.hidden = true;
      return;
    }

    target.innerHTML = notices.map(notice => {
      const date = notice.createdAt?.toDate
        ? notice.createdAt.toDate().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          })
        : "Recently published";

      return `
        <article class="public-notice-card">
          <div class="public-notice-card-top">
            <span class="public-notice-badge">NEW UPDATE</span>
            <time>${escapeHtml(date)}</time>
          </div>

          <h3>${escapeHtml(notice.title)}</h3>
          <p>${escapeHtml(notice.message).replace(/\n/g, "<br>")}</p>
        </article>
      `;
    }).join("");

    section.hidden = false;

  } catch (error) {
    console.error("Homepage notices loading error:", error);
    section.hidden = true;
  }
}

// Load notices when website opens
loadPublicNotices();
