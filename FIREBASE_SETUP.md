# Excel with AI — Firebase connection

## Already connected in this package
- Firebase Web SDK (modular CDN imports)
- Email/password sign-in via Firebase Authentication
- Role lookup from Firestore `userRoles/{uid}`
- Admin dashboard when that role document has `role: "admin"`; otherwise Student dashboard

## Required one-time setup
1. In Firebase Console > Firestore Database > Rules, replace the current rules with `FIRESTORE_RULES.txt` and Publish.
2. In Authentication > Users, open your own admin account and copy the full User UID.
3. In Firestore > Data, click Start collection. Collection ID: `userRoles`.
4. Document ID: paste the full admin User UID (must match exactly).
5. Add field `role`, type `string`, value `admin`, then Save.
6. Do not create an admin role document for ordinary students. Their accounts default to the student dashboard.
7. Keep the web config public; never add service-account JSON, private keys, or passwords to website files.

## Run the site
Because `app.js` uses JavaScript modules, do not open `index.html` by double-clicking it. Use a local development server (e.g. VS Code + Live Server) or deploy the folder to Firebase Hosting/Netlify/Vercel. Add your deployed domain in Firebase Console > Authentication > Settings > Authorized domains if it is not already listed.

## Current limitations
Login is connected to Firebase. Enrollment requests and course content in this starter are still demo/local browser data; uploads, payments, quizzes, certificates, and persistent course management are not yet implemented. Do not use this prototype to collect real sensitive student documents until those workflows and rules are completed and tested.
