
let ALL_NOTES = [];

document.addEventListener("DOMContentLoaded", () => {

/* ===============================
   PDF.js
================================ */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

/* ===============================
   SUPABASE CONFIG
================================ */
const SUPABASE_URL = "https://blqmxvzvqrysvnzlygzh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJscW14dnp2cXJ5c3Zuemx5Z3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjk1MjcsImV4cCI6MjA4MzYwNTUyN30.NYnl0WXWfF4BCs1FSN4hMOdTvl6Ef8fRAKx7STKixIw";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ===============================
   BACKEND API
================================ */
const NOTES_API = "https://fullstackprojectnotesapp6.onrender.com/api/notes/";
const LOGIN_API = "https://fullstackprojectnotesapp6.onrender.com/api/auth/login/";
const SIGNUP_API = "https://fullstackprojectnotesapp6.onrender.com/api/auth/signup/";

/* ===============================
   DOM
================================ */
const authContainer = document.getElementById("authContainer");
const appContainer = document.getElementById("appContainer");
const authBtn = document.getElementById("authBtn");
const authTitle = document.getElementById("authTitle");
const authMsg = document.getElementById("authMsg");
const switchAuth = document.getElementById("switchAuth");

const notesContainer = document.getElementById("notesContainer");
const searchInput = document.getElementById("searchInput");

const uploadSection = document.getElementById("upload");
const uploadForm = document.getElementById("uploadForm");
const uploadMessage = document.getElementById("uploadMessage");
const themeToggle = document.getElementById("themeToggle");


/* ===============================
   LOGIN GUARD
================================ */
if (!sessionStorage.getItem("loggedIn")) {
  authContainer.style.display = "block";
  appContainer.style.display = "none";
}

/* ===============================
   LOGIN / SIGNUP TOGGLE
================================ */
let isLogin = true;

switchAuth.onclick = () => {
  isLogin = !isLogin;
  authTitle.innerText = isLogin ? "Login" : "Signup";
  authBtn.innerText = isLogin ? "Login" : "Signup";
  switchAuth.innerText = isLogin
    ? "Don’t have an account? Signup"
    : "Already have an account? Login";
};

/* ===============================
   LOGIN / SIGNUP
================================ */
authBtn.onclick = async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    authMsg.innerText = "❌ All fields required";
    return;
  }

  const res = await fetch(isLogin ? LOGIN_API : SIGNUP_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    authMsg.innerText = data.error || "❌ Failed";
    return;
  }

  if (!isLogin) {
    authMsg.innerText = "✅ Signup successful. Please login.";
    isLogin = true;
    authTitle.innerText = "Login";
    authBtn.innerText = "Login";
    return;
  }

  sessionStorage.setItem("loggedIn", "true");
  sessionStorage.setItem("username", username);

  authContainer.style.display = "none";
  appContainer.style.display = "block";

  checkAdmin();
  getNotes();
};

/* ===============================
   ADMIN CHECK
================================ */
function checkAdmin() {
  const adminUsers = ["supraja", "admin"];
  const user = sessionStorage.getItem("username");

  if (!adminUsers.includes(user)) {
    uploadSection.remove();
  }
}

/* ===============================
   FETCH NOTES
================================ */

async function getNotes() {
  try {
    const res = await fetch(NOTES_API);
    if (!res.ok) throw new Error();

    ALL_NOTES = await res.json(); // store all notes
    displayNotes(ALL_NOTES);

  } catch {
    notesContainer.innerHTML =
      "<p style='color:red;'>❌ Error fetching notes</p>";
  }
}

/* ===============================
   DISPLAY NOTES (PDF PREVIEW)
================================ */
function displayNotes(notes) {
  notesContainer.innerHTML = "";

  notes.forEach(note => {
    const card = document.createElement("div");
    card.className = "note-card";

    card.innerHTML = `
      <div class="pdf-preview" id="pdf-${note.id}">Loading...</div>
      <h3>${note.title}</h3>
      <p>${note.description}</p>
      <div class="card-actions">
        <button class="view-btn">View</button>
        <a class="download-btn" href="${note.file}" target="_blank">Download</a>
      </div>
    `;

    card.querySelector(".view-btn").onclick = () =>
      window.open(note.file, "_blank");

    notesContainer.appendChild(card);
    renderPdfPreview(note.file, `pdf-${note.id}`);
  });
}

/* ===============================
   PDF PREVIEW
================================ */
async function renderPdfPreview(url, id) {
  try {
    const pdf = await pdfjsLib.getDocument(url).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.4 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: canvas.getContext("2d"),
      viewport
    }).promise;

    const el = document.getElementById(id);
    el.innerHTML = "";
    el.appendChild(canvas);
  } catch {
    document.getElementById(id).innerText = "Preview error";
  }
}

/* ===============================
   UPLOAD NOTE (ADMIN)
================================ */
if (uploadForm) {
  uploadForm.onsubmit = async e => {
    e.preventDefault();
    uploadMessage.innerText = "";

    const file = document.getElementById("file").files[0];
    const fileName = `${Date.now()}_${file.name}`;

    try {
      const { error } = await supabase.storage
        .from("notes")
        .upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from("notes")
        .getPublicUrl(fileName);

      const res = await fetch(NOTES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.value,
          description: description.value,
          file: data.publicUrl
        })
      });

      if (!res.ok) throw new Error();

      uploadMessage.innerText = "✅ Uploaded";
      uploadForm.reset();
      getNotes();

    } catch {
      uploadMessage.innerText = "❌ Upload failed";
    }
  };
}
searchInput.oninput = () => {
  const query = searchInput.value.toLowerCase().trim();

  const filteredNotes = ALL_NOTES.filter(note =>
    note.title.toLowerCase().includes(query) ||
    note.description.toLowerCase().includes(query)
  );

  displayNotes(filteredNotes);
};

/* ===============================
     DARK / LIGHT MODE
  ================================ */
  if (themeToggle) {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      themeToggle.textContent = "☀️";
    }

    themeToggle.onclick = () => {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      themeToggle.textContent = isDark ? "☀️" : "🌙";
    };
  }

  
 /* ===============================
   SEARCH NOTES BY TITLE
================================ */
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase().trim();

  // If search box empty → show all notes
  if (!query) {
    displayNotes(ALL_NOTES);
    return;
  }

  // Filter by TITLE only
  const filteredNotes = ALL_NOTES.filter(note =>
    note.title.toLowerCase().includes(query)
  );

  displayNotes(filteredNotes);
});
 
});




