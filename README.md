# 📝 Task Manager — Vanilla JS + Firebase Firestore

A clean, responsive **full CRUD task manager** built as a static front-end
project using **only HTML, CSS, and vanilla JavaScript** — no frameworks, no
build tools, no npm, no bundler. Data is stored and synced in real time using
**Google Cloud Firestore**.

---

Website URL : https://task-manager-six-black-69.vercel.app/

## ✨ Features

- **Create** — add a new task from an input box (empty input is rejected).
- **Read (live)** — all tasks display newest-first and update in **real time**
  across every open tab/device via Firestore's `onSnapshot` listener — no page
  refresh needed.
- **Update** — toggle a task complete/incomplete with a checkbox (with
  strike-through styling), or edit a task's title.
- **Delete** — remove any task with one click.
- **Summary** — a live "X of Y tasks completed" counter.
- **Loading state** while the initial data loads.
- **Graceful error handling** — every Firestore call is wrapped in
  `try/catch` and surfaces a friendly message if something goes wrong
  (offline, blocked by security rules, etc.).
- **Responsive UI** — a centered card that works on mobile and desktop.

---

## 📂 Project structure

```
task-manager/
├── index.html     # Markup: form, status/loading/empty states, task list
├── styles.css     # All styling (modern, responsive, completed-task styles)
├── script.js      # Firebase init + full CRUD + real-time onSnapshot listener
└── README.md      # This file
```

> **Separation of concerns:** there is no inline CSS or inline JavaScript.
> `script.js` is loaded as an ES module (`<script type="module">`) because the
> Firebase v9+ modular SDK is imported via ES module `import` statements.

---

## 🗄️ Data model

A single Firestore collection named **`tasks`**. Each task document has:

| Field       | Type                | Notes                                  |
| ----------- | ------------------- | -------------------------------------- |
| `title`     | string              | The task text                          |
| `completed` | boolean             | Defaults to `false`                    |
| `createdAt` | Firestore timestamp | Set with `serverTimestamp()`, used for ordering (newest first) |

You do **not** need to create the collection manually — Firestore creates it
automatically the first time you add a task.

---

## 🧰 Tech stack

- HTML5 + CSS3 (no preprocessor)
- Vanilla JavaScript (ES modules)
- **Firebase v11 modular SDK** loaded from the official gstatic CDN:
  - `https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js`
  - `https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js`
- **Cloud Firestore** (NOT the Realtime Database)

---

## 🚀 Quick start (TL;DR)

1. Create a Firebase project and a **Web App** in the Firebase console.
2. Enable **Cloud Firestore** in test mode.
3. Copy your `firebaseConfig` into the top of `script.js`.
4. Open `index.html` in a browser (or serve the folder locally).

Detailed steps are below. 👇

---

## 🔥 Full Firebase setup (step by step)

> You must do these steps yourself — they require your own Google account and
> Firebase console access.

### Step 0 — Create / sign in to a Google account

1. Firebase is a Google product, so you need a Google account.
   - If you already have a Gmail/Google account, you're set.
   - Otherwise create one at <https://accounts.google.com/signup>.
2. There is **no separate "Firebase account"** — you sign in to Firebase with
   your Google account.

### Step 1 — Create a Firebase project

1. Go to the **Firebase console**: <https://console.firebase.google.com/>.
2. Click **Add project** (or **Create a project**).
3. Enter a project name, e.g. `my-task-manager`. Firebase will append a unique
   ID like `my-task-manager-3f9a2`.
4. **Google Analytics** is optional for this app — you can toggle it **off** to
   keep things simple. Click **Continue**.
5. Wait for the project to be provisioned, then click **Continue** to open the
   project dashboard.

> 💡 **Cost:** The free **Spark plan** is more than enough for this app. You do
> not need to enter a credit card.

### Step 2 — Register a Web App and get your config

1. On the project **Overview** page, find **"Get started by adding Firebase to
   your app"** and click the **Web** icon: **`</>`**.
2. Enter an app nickname, e.g. `task-manager-web`.
3. **Do NOT** check "Also set up Firebase Hosting" (not needed). Click
   **Register app**.
4. Firebase now shows a code snippet containing a `firebaseConfig` object that
   looks like this:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "my-task-manager-3f9a2.firebaseapp.com",
     projectId: "my-task-manager-3f9a2",
     storageBucket: "my-task-manager-3f9a2.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123def456",
   };
   ```

5. **Copy these values.** You'll paste them into `script.js` in Step 4.
6. Click **Continue to console**.

> 🔁 You can always find this config again later via:
> **⚙️ Project settings → General → Your apps → SDK setup and configuration →
> Config**.

> 🔐 **Is it safe to put `apiKey` in front-end code?** Yes — a Firebase web API
> key is an identifier, not a secret. It's expected to be visible in the
> browser. What actually protects your data is your **Firestore security
> rules** (Step 5).

### Step 3 — Enable Cloud Firestore

1. In the left sidebar, open **Build → Firestore Database**.
2. Click **Create database**.
3. Choose a **location** (pick the region closest to your users — ⚠️ this
   **cannot be changed later**).
4. Choose a starting mode — select **Start in test mode** for now (see Step 5
   for what this means and the important warning). Click **Enable / Create**.
5. Make sure you are using **Cloud Firestore**, *not* the **Realtime Database**
   (that's a different product in the same menu). This app uses Firestore only.

### Step 4 — Paste your config into the app

1. Open `script.js`.
2. At the very top you'll find a clearly marked block:

   ```js
   // ===== FIREBASE CONFIG — PASTE YOURS HERE =====
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
   };
   // ===============================================
   ```

3. Replace **every** placeholder value with the corresponding value from the
   `firebaseConfig` you copied in Step 2. Save the file.

### Step 5 — Firestore security rules (⚠️ important)

When you chose **test mode** in Step 3, Firestore generated rules like:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Test mode: anyone may read/write until this date
      allow read, write: if request.time < timestamp.date(2026, 7, 9);
    }
  }
}
```

You can view/edit these under **Firestore Database → Rules**.

> ### 🚨 WARNING — test mode is for local testing only
> Test mode allows **public read AND write to your entire database** by anyone
> who knows your project ID, and it **automatically expires** (about 30 days).
> When it expires, all requests are denied and the app will stop loading data.
>
> **Never store real, private, or production data behind test-mode rules.**
>
> Before deploying anything real, replace them with proper rules — ideally
> requiring authentication. For example:
>
> ```
> rules_version = '2';
> service cloud.firestore {
>   match /databases/{database}/documents {
>     match /tasks/{taskId} {
>       allow read, write: if request.auth != null;  // signed-in users only
>     }
>   }
> }
> ```
>
> Learn more: <https://firebase.google.com/docs/firestore/security/get-started>

---

## ▶️ Running the app

Because the app uses ES module imports over `https://`, modern browsers can run
it by opening the file directly. If your browser is strict about ES modules on
the `file://` protocol, serve the folder over a tiny local web server instead.

**Option A — open directly**

- Double-click `index.html`, or drag it into a browser window.

**Option B — local server (recommended)**

```bash
cd task-manager
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

> Other quick server options if you don't have Python:
> - Node: `npx serve` (or `npx http-server`)
> - VS Code: the **Live Server** extension

### Try the real-time sync

Open the app in **two browser tabs** side by side, then add/complete/delete a
task in one tab — watch it update instantly in the other. That's the
`onSnapshot` listener at work.

---

## 🧩 How it works (code tour)

| Operation        | Firestore call                                  | Where in `script.js`        |
| ---------------- | ----------------------------------------------- | --------------------------- |
| Initialize       | `initializeApp` + `getFirestore`                | top of file                 |
| **Create**       | `addDoc(tasksCol, { title, completed, createdAt: serverTimestamp() })` | `addTask()` |
| **Read (live)**  | `onSnapshot(query(tasksCol, orderBy("createdAt", "desc")), …)` | `startRealtimeListener()` |
| **Update** (toggle) | `updateDoc(doc(db, "tasks", id), { completed })` | `toggleTask()`            |
| **Update** (title)  | `updateDoc(doc(db, "tasks", id), { title })`     | `editTaskTitle()`         |
| **Delete**       | `deleteDoc(doc(db, "tasks", id))`               | `deleteTask()`              |

The `onSnapshot` listener re-renders the whole list whenever the data changes
(from any client), so the UI always reflects the database without manual
refreshes. Its error callback surfaces problems like blocked rules or being
offline.

---

## 🛠️ Troubleshooting

| Symptom | Likely cause / fix |
| ------- | ------------------ |
| "Couldn't load tasks…" message | Config not pasted correctly, or Firestore rules block access / expired. Re-check Step 4 and Step 5. |
| Nothing happens / blank page, console shows module errors | Serve via a local server (Option B) instead of opening the file directly. |
| `Missing or insufficient permissions` in console | Your security rules deny the request — verify the Rules tab (Step 5). |
| Tasks don't sort newest-first | `createdAt` is `null` only for a split second on write; it resolves once the server timestamp lands. |
| It worked, then suddenly stopped | Test-mode rules likely **expired** — update your rules (Step 5). |

---

## 🔄 Updating the Firebase SDK version

This project pins **v11.0.2**. To use a newer patch/minor, change the version
number in **both** import URLs at the top of `script.js`:

```js
import { initializeApp } from "https://www.gstatic.com/firebasejs/<VERSION>/firebase-app.js";
import { ... } from "https://www.gstatic.com/firebasejs/<VERSION>/firebase-firestore.js";
```

Find the latest version at <https://firebase.google.com/support/release-notes/js>.

---

## 📜 License

Free to use for learning and personal projects.
