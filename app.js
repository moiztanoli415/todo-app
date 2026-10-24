import { auth, db } from "./firebase.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

const authPanel = document.getElementById("auth-panel");
const todoPanel = document.getElementById("todo-panel");
const authForm = document.getElementById("auth-form");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authMessage = document.getElementById("auth-message");
const authTitle = document.getElementById("auth-title");
const authDescription = document.getElementById("auth-description");
const authSubmit = document.getElementById("auth-submit");
const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");
const accountEmail = document.getElementById("account-email");
const logoutButton = document.getElementById("logout-btn");
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const taskCount = document.getElementById("task-count");
const emptyMessage = document.getElementById("empty-message");

let authMode = "login";
let tasks = [];
let unsubscribeTasks = null;
let busy = false;

function showTodoError(error) {
  console.error(error);
  alert("Error: " + error.message);
}

function setAuthMode(mode) {
  authMode = mode;
  const isSignup = mode === "signup";

  authTitle.textContent = isSignup ? "Create your account" : "Welcome back";
  authDescription.textContent = isSignup
    ? "Sign up to keep your tasks safe and in sync."
    : "Sign in to pick up where you left off.";
  authSubmit.textContent = isSignup ? "Create account" : "Log in";
  authPassword.autocomplete = isSignup ? "new-password" : "current-password";
  authMessage.textContent = "";
  loginTab.classList.toggle("active", !isSignup);
  signupTab.classList.toggle("active", isSignup);
  loginTab.setAttribute("aria-pressed", String(!isSignup));
  signupTab.setAttribute("aria-pressed", String(isSignup));
}

function authErrorMessage(error) {
  const messages = {
    "auth/email-already-in-use": "An account already exists for this email. Try logging in.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/weak-password": "Choose a password with at least 6 characters."
  };

  return messages[error.code] || "We couldn't authenticate you. Please try again.";
}

function renderTasks() {
  todoList.innerHTML = "";
  taskCount.textContent =
    `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
  emptyMessage.style.display = tasks.length === 0 ? "block" : "none";

  tasks.forEach((task) => {
    const li = document.createElement("li");

    if (task.completed) {
      li.classList.add("completed");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", "Complete task");
    checkbox.addEventListener("change", () => {
      changeTask(task.id, { completed: checkbox.checked });
    });

    const span = document.createElement("span");
    span.textContent = task.text;

    const completeButton = document.createElement("button");
    completeButton.textContent = task.completed ? "Undo" : "Done";
    completeButton.className = "complete-btn";
    completeButton.addEventListener("click", () => {
      changeTask(task.id, { completed: !task.completed });
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-btn";
    deleteButton.addEventListener("click", () => {
      removeTask(task.id);
    });

    li.append(checkbox, span, completeButton, deleteButton);
    todoList.appendChild(li);
  });
}

loginTab.addEventListener("click", () => setAuthMode("login"));
signupTab.addEventListener("click", () => setAuthMode("signup"));

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;

  busy = true;
  authSubmit.disabled = true;
  authMessage.textContent = "";

  try {
    if (authMode === "signup") {
      await createUserWithEmailAndPassword(
        auth,
        authEmail.value.trim(),
        authPassword.value
      );
    } else {
      await signInWithEmailAndPassword(
        auth,
        authEmail.value.trim(),
        authPassword.value
      );
    }
  } catch (error) {
    console.error(error);
    authMessage.textContent = authErrorMessage(error);
  } finally {
    busy = false;
    authSubmit.disabled = false;
  }
});

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    showTodoError(error);
  }
});

todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();

  if (!text || busy) return;

  busy = true;
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Please log in to add a task.");

    await addDoc(collection(db, "users", user.uid, "tasks"), {
      text,
      completed: false
    });
    todoInput.value = "";
  } catch (error) {
    showTodoError(error);
  } finally {
    busy = false;
  }
});

async function changeTask(taskId, changes) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Please log in to update a task.");

    await updateDoc(doc(db, "users", user.uid, "tasks", taskId), changes);
  } catch (error) {
    showTodoError(error);
  }
}

async function removeTask(taskId) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Please log in to delete a task.");

    await deleteDoc(doc(db, "users", user.uid, "tasks", taskId));
  } catch (error) {
    showTodoError(error);
  }
}

onAuthStateChanged(auth, (user) => {
  if (unsubscribeTasks) {
    unsubscribeTasks();
    unsubscribeTasks = null;
  }

  tasks = [];
  renderTasks();

  if (!user) {
    todoPanel.hidden = true;
    authPanel.hidden = false;
    accountEmail.textContent = "";
    return;
  }

  authPanel.hidden = true;
  todoPanel.hidden = false;
  accountEmail.textContent = user.email || "";
  unsubscribeTasks = onSnapshot(
    collection(db, "users", user.uid, "tasks"),
    (snapshot) => {
      tasks = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));
      renderTasks();
    },
    showTodoError
  );
}, (error) => {
  console.error(error);
  authPanel.hidden = false;
  authMessage.textContent = "We couldn't check your sign-in status. Refresh and try again.";
});
