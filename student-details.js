
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs
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

const message = document.getElementById("message");
const details = document.getElementById("studentDetails");
const enrollment = document.getElementById("enrollmentDetails");

const params = new URLSearchParams(location.search);
const studentUid = params.get("uid");

function safe(value) {
  return String(value ?? "Not provided");
}

function addItem(container, label, value) {
  const item = document.createElement("div");
  item.className = "detail-item";

  const small = document.createElement("small");
  small.textContent = label;

  const strong = document.createElement("strong");
  strong.textContent = safe(value);

  item.append(small, strong);
  container.appendChild(item);
}

document.getElementById("backBtn").addEventListener("click", () => {
  location.href = "index.html";
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  location.href = "index.html";
});

onAuthStateChanged(auth, async user => {
  if (!user) {
    message.textContent = "Please log in as Admin first.";
    return;
  }

  try {
    const roleSnap = await getDoc(doc(db, "userRoles", user.uid));

    if (!roleSnap.exists() || roleSnap.data().role !== "admin") {
      message.textContent = "Access denied. Admin only.";
      return;
    }

    if (!studentUid) {
      message.textContent = "Student ID is missing from the URL.";
      return;
    }

    message.textContent = "Loading student data...";

    const studentSnap = await getDoc(
      doc(db, "studentProfiles", studentUid)
    );

    if (!studentSnap.exists()) {
      message.textContent = "Student record not found.";
      return;
    }

    const student = studentSnap.data();

    details.replaceChildren();
    addItem(details, "Full Name", student.name);
    addItem(details, "Student ID", student.studentId);
    addItem(details, "Mobile", student.phone);
    addItem(details, "Contact Email", student.contactEmail);
    addItem(details, "Course", student.course);
    addItem(details, "Account Status", student.status);
    addItem(details, "Firebase UID", student.uid || studentUid);

    if (student.createdAt?.toDate) {
      addItem(
        details,
        "Registration Date",
        student.createdAt.toDate().toLocaleString()
      );
    }

    details.hidden = false;

    const requestSnap = await getDocs(
      collection(db, "enrollmentRequests")
    );

    const requests = requestSnap.docs
      .filter(d => d.data().studentUid === studentUid);

    enrollment.replaceChildren();

    if (requests.length) {
      requests.forEach(requestDoc => {
        const request = requestDoc.data();

        addItem(enrollment, "Requested Course", request.course);
        addItem(enrollment, "Payment Reference", request.paymentRef);
        addItem(enrollment, "Enrollment Status", request.status);
        addItem(enrollment, "Student Message", request.message);

        if (request.createdAt?.toDate) {
          addItem(
            enrollment,
            "Request Date",
            request.createdAt.toDate().toLocaleString()
          );
        }
      });
    } else {
      addItem(enrollment, "Enrollment", "No enrollment request found");
    }

    enrollment.hidden = false;
    message.textContent = "Student record loaded successfully.";

  } catch (error) {
    console.error("Student details error:", error);
    message.textContent =
      "Could not load student data. Check Firestore Rules and browser console.";
  }
});
