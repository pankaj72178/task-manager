// =====================================================================
// Firebase modular SDK (v11) imported straight from the gstatic CDN.
// No bundler/npm needed — this file is loaded with <script type="module">.
// =====================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// ===== FIREBASE CONFIG — PASTE YOURS HERE =====
// Only the firebaseConfig OBJECT goes here — do NOT paste the import lines or
// initializeApp() call from the console snippet (the imports at the top of this
// file already handle that). measurementId is optional and unused by this app.
const firebaseConfig = {
  apiKey: "AIzaSyAEsC7jRf7VBidMxYZkEJWpz90GCnEme60",
  authDomain: "first-project-11ebd.firebaseapp.com",
  databaseURL: "https://first-project-11ebd-default-rtdb.firebaseio.com",
  projectId: "first-project-11ebd",
  storageBucket: "first-project-11ebd.firebasestorage.app",
  messagingSenderId: "163807213303",
  appId: "1:163807213303:web:cb87dff8360801625ec5f2",
  measurementId: "G-RTMLDSQCZY",
};
// ===============================================

// Initialize Firebase + Cloud Firestore (NOT the Realtime Database).
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Reference to the single "tasks" collection used by the whole app.
const tasksCol = collection(db, "tasks");

/* ---------- DOM references ---------- */
const form = document.getElementById("add-form");
const input = document.getElementById("task-input");
const addBtn = document.getElementById("add-btn");
const statusEl = document.getElementById("status");
const summaryEl = document.getElementById("summary");
const loadingEl = document.getElementById("loading");
const emptyEl = document.getElementById("empty");
const listEl = document.getElementById("task-list");

// Filter tabs + their badge counters.
const filtersEl = document.getElementById("filters");
const filterButtons = filtersEl.querySelectorAll(".filter");
const countAllEl = document.getElementById("count-all");
const countPendingEl = document.getElementById("count-pending");
const countCompletedEl = document.getElementById("count-completed");

// App state: which filter is active ("all" | "pending" | "completed"), and the
// latest tasks from Firestore. We keep the tasks cached so switching filters
// re-renders instantly without re-querying the database.
let currentFilter = "all";
let allTasks = [];

/* ---------- UI helpers ---------- */
function showError(message) {
  statusEl.textContent = message;
}

function clearError() {
  statusEl.textContent = "";
}

/* =====================================================================
 * CREATE — add a new task document to the "tasks" collection.
 * Empty titles are rejected before any network call. createdAt uses the
 * server timestamp so ordering is consistent across clients.
 * ===================================================================== */
async function addTask(title) {
  await addDoc(tasksCol, {
    title: title,
    completed: false,
    createdAt: serverTimestamp(),
  });
}

/* =====================================================================
 * UPDATE — toggle the `completed` boolean for one task.
 * ===================================================================== */
async function toggleTask(id, completed) {
  await updateDoc(doc(db, "tasks", id), { completed: completed });
}

/* =====================================================================
 * UPDATE — change a task's title (via a simple prompt()).
 * ===================================================================== */
async function editTaskTitle(id, newTitle) {
  await updateDoc(doc(db, "tasks", id), { title: newTitle });
}

/* =====================================================================
 * DELETE — remove one task document.
 * ===================================================================== */
async function deleteTask(id) {
  await deleteDoc(doc(db, "tasks", id));
}

/* ---------- Rendering ---------- */

// Build a single <li> for a task, wiring up its checkbox/edit/delete handlers.
function renderTask(id, data) {
  const li = document.createElement("li");
  li.className = "task" + (data.completed ? " task--done" : "");

  // Checkbox toggles `completed`.
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task__checkbox";
  checkbox.checked = !!data.completed;
  checkbox.addEventListener("change", async () => {
    clearError();
    try {
      await toggleTask(id, checkbox.checked);
    } catch (err) {
      console.error(err);
      checkbox.checked = !checkbox.checked; // revert UI on failure
      showError("Couldn't update the task. Please try again.");
    }
  });

  // Title text.
  const titleSpan = document.createElement("span");
  titleSpan.className = "task__title";
  titleSpan.textContent = data.title;

  // Edit button -> prompt for a new title.
  const editBtn = document.createElement("button");
  editBtn.className = "task__btn task__btn--edit";
  editBtn.type = "button";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", async () => {
    clearError();
    const next = prompt("Edit task:", data.title);
    if (next === null) return; // user cancelled
    const trimmed = next.trim();
    if (!trimmed) {
      showError("Task title can't be empty.");
      return;
    }
    try {
      await editTaskTitle(id, trimmed);
    } catch (err) {
      console.error(err);
      showError("Couldn't save your edit. Please try again.");
    }
  });

  // Delete button -> remove the document.
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "task__btn task__btn--delete";
  deleteBtn.type = "button";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", async () => {
    clearError();
    try {
      await deleteTask(id);
    } catch (err) {
      console.error(err);
      showError("Couldn't delete the task. Please try again.");
    }
  });

  li.appendChild(checkbox);
  li.appendChild(titleSpan);
  li.appendChild(editBtn);
  li.appendChild(deleteBtn);
  return li;
}

// Update the "X of Y tasks completed" summary line + the tab badge counts.
function renderSummary() {
  const total = allTasks.length;
  const done = allTasks.filter((t) => t.completed).length;
  const pending = total - done;

  summaryEl.textContent = total ? `${done} of ${total} tasks completed` : "";

  // Keep the badge on each filter tab in sync.
  countAllEl.textContent = total;
  countPendingEl.textContent = pending;
  countCompletedEl.textContent = done;
}

// Return only the tasks that match the active filter tab.
function getVisibleTasks() {
  if (currentFilter === "pending") {
    return allTasks.filter((t) => !t.completed);
  }
  if (currentFilter === "completed") {
    return allTasks.filter((t) => t.completed);
  }
  return allTasks; // "all"
}

// Render the list based on the cached tasks + the active filter. Called both
// when Firestore pushes new data and when the user switches tabs.
function renderList() {
  const visible = getVisibleTasks();

  listEl.innerHTML = ""; // rebuild from scratch
  visible.forEach((task) => {
    listEl.appendChild(renderTask(task.id, task));
  });

  // Empty-state message depends on whether there are no tasks at all, or just
  // none in the current filter.
  if (visible.length === 0) {
    if (allTasks.length === 0) {
      emptyEl.textContent = "No tasks yet. Add your first one above!";
    } else if (currentFilter === "pending") {
      emptyEl.textContent = "No pending tasks. Nice work! 🎉";
    } else if (currentFilter === "completed") {
      emptyEl.textContent = "No completed tasks yet.";
    }
    emptyEl.hidden = false;
  } else {
    emptyEl.hidden = true;
  }

  renderSummary();
}

/* =====================================================================
 * READ (real-time) — onSnapshot subscribes to the query and re-runs the
 * callback every time the data changes (add/edit/delete/toggle), on this
 * client or any other. ordered by createdAt descending = newest first.
 * The 2nd callback handles listener errors (e.g. blocked by rules / offline).
 * ===================================================================== */
function startRealtimeListener() {
  const q = query(tasksCol, orderBy("createdAt", "desc"));

  onSnapshot(
    q,
    (snapshot) => {
      loadingEl.hidden = true;
      clearError();

      // Cache the latest tasks (id + data) so filter switches are instant.
      allTasks = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Render through the currently-active filter.
      renderList();
    },
    (err) => {
      // Listener-level errors land here (permissions, network, etc.)
      console.error(err);
      loadingEl.hidden = true;
      showError(
        "Couldn't load tasks. Check your Firebase config and Firestore " +
          "rules, then refresh.",
      );
    },
  );
}

/* ---------- Wire up CREATE form ---------- */
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const title = input.value.trim();
  if (!title) {
    showError("Please enter a task before adding.");
    return;
  }

  // Clear the input right away. Firestore's local cache shows the new task
  // instantly via onSnapshot (latency compensation), so we don't block the UI
  // on the server round-trip — that round-trip can be slow or, if Firestore
  // isn't reachable, never resolve. We restore the text only if the write fails.
  input.value = "";
  input.focus();

  try {
    // Race the write against an 8s timeout. addDoc only resolves once the
    // SERVER confirms the write. If Cloud Firestore hasn't been created in the
    // console (or rules block it), the write hangs forever — the timeout turns
    // that silent hang into a clear, actionable message.
    await Promise.race([
      addTask(title),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 8000),
      ),
    ]);
    showError(""); // success — clear any prior message
  } catch (err) {
    console.error(err);
    if (err.message === "timeout") {
      showError(
        "Not saved: Firestore isn't responding. In the Firebase console open " +
          "Build → Firestore Database and click 'Create database' (test mode).",
      );
    } else if (err.code === "permission-denied") {
      showError(
        "Not saved: blocked by security rules. Set Firestore Rules to allow " +
          "read, write (test mode) and Publish.",
      );
    } else {
      showError("Couldn't add the task: " + (err.code || err.message || err));
    }
    input.value = title; // restore the text so it isn't lost
  }
});

/* ---------- Wire up filter tabs ---------- */
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter; // "all" | "pending" | "completed"

    // Move the active styling to the clicked tab.
    filterButtons.forEach((b) => b.classList.remove("filter--active"));
    btn.classList.add("filter--active");

    // Re-render the cached tasks through the new filter (no DB query needed).
    renderList();
  });
});

// Kick off the live listener as soon as the module loads.
startRealtimeListener();
