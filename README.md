# Excel with AI — Firebase-connected starter

## Important: how to open it
Do NOT double-click `index.html`. The browser blocks Firebase JavaScript modules from `file://`, so login buttons will not work that way.

### Option A — VS Code + Live Server (recommended)
1. Extract this ZIP.
2. Open VS Code. Choose **File → Open Folder** and select `excel_with_ai_lms`.
3. In Extensions, install **Live Server** by Ritwick Dey if not already installed.
4. Open `index.html`, right-click inside it, and choose **Open with Live Server**.
5. It should open at an address like `http://127.0.0.1:5500`. Use that tab to test login.

### Option B — Python local server
If Python is installed, open a terminal in this folder and run `python -m http.server 8000`, then visit `http://localhost:8000`.

## Firebase setup
1. Follow `FIREBASE_SETUP.md`.
2. Enable Email/Password under Firebase Authentication.
3. Create your admin user in Authentication.
4. In Firestore, create `userRoles` collection, use the admin's full User UID as the document ID, and add string field `role` with value `admin`.
5. Publish secure Firestore rules from `FIRESTORE_RULES.txt` only after reviewing them.

## Current scope
Firebase Email/Password sign-in and role lookup are connected. The home page is a frontend prototype. Enrollment requests, courses, notes/videos uploads, payment approval, quizzes, progress, and certificates are not yet fully connected to Firestore. Do not use this prototype to collect real sensitive documents until these workflows and security rules are implemented and tested.

Never add service-account JSON, private keys, or passwords to website files.
