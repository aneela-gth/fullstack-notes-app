/* ===============================
   API URLs
================================ */
const NOTES_API = "https://fullstackprojectnotesapp6.onrender.com/api/notes/";
const LOGIN_API = "https://fullstackprojectnotesapp6.onrender.com/api/auth/login/";
const SIGNUP_API = "https://fullstackprojectnotesapp6.onrender.com/api/auth/signup/";
const ME_API = "https://fullstackprojectnotesapp6.onrender.com/api/auth/me/";

/* ===============================
   DOM ELEMENTS
================================ */
const notesContainer = document.getElementById("notesContainer");
const searchInput = document.getElementById("searchInput");
const themeToggle = document.getElementById("themeToggle");

const authContainer = document.getElementById("authContainer");
const appContainer = document.getElementById("appContainer");
const authBtn = document.getElementById("authBtn");
const authTitle = document.getElementById("authTitle");
const authMsg = document.getElementById("authMsg");
const switchAuth = document.getElementById("switchAuth");

let uploadSection = document.getElementById("upload");
let uploadForm = document.getElementById("uploadForm");
let uploadMessage = document.getElementById("uploadMessage");

/* ===============================
   HARD LOGIN GUARD ✅
================================ */
if (!sessionStorage.getItem("loggedIn")) {
  authContainer.style.display = "block";
  appContainer.style.display = "none";
}

/* ===============================
   THEME TOGGLE
================================ */
themeToggle.onclick = () => {
  document.body.classList.toggle("dark-mode");
};

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
  authMsg.innerText = "";
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

  try {
    const res = await fetch(isLogin ? LOGIN_API : SIGNUP_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      authMsg.innerText = data.error || "❌ Authentication failed";
      return;
    }

    if (!isLogin) {
      authMsg.innerText = "✅ Signup successful. Please login.";
      isLogin = true;
      authTitle.innerText = "Login";
      authBtn.innerText = "Login";
      return;
    }

    // ✅ IMPORTANT
    sessionStorage.setItem("loggedIn", "true");

    authContainer.style.display = "none";
    appContainer.style.display = "block";

    getNotes();
    checkAdminAccess();

  } catch {
    authMsg.innerText = "❌ Server error";
  }
};

/* ===============================
   ADMIN CHECK
================================ */
async function checkAdminAccess() {
  try {
    const res = await fetch(ME_API, { credentials: "include" });
    const data = await res.json();

    if (!data.is_admin && uploadSection) {
      uploadSection.remove();
      uploadForm = null;
    }
  } catch {
    if (uploadSection) uploadSection.remove();
  }
}

/* ===============================
   FETCH NOTES ✅ (WORKING)
================================ */
async function getNotes() {
  try {
    let url = NOTES_API;
    const search = searchInput.value.trim();

    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error();

    const notes = await res.json();
    displayNotes(notes);

  } catch {
    notesContainer.innerHTML =
      "<p style='color:red;'>❌ Error fetching notes</p>";
  }
}

/* ===============================
   DISPLAY NOTES
================================ */
function displayNotes(notes) {
  notesContainer.innerHTML = "";

  if (!notes || notes.length === 0) {
    notesContainer.innerHTML = "<p>No notes available</p>";
    return;
  }

  notes.forEach(note => {
    const ext = note.file.split(".").pop().toLowerCase();

    const card = document.createElement("div");
    card.className = "note-card";

    card.innerHTML = `
      <h3>${note.title}</h3>
      <p>${note.description}</p>
      <a href="${note.file}" target="_blank">Download</a>
    `;

    notesContainer.appendChild(card);
  });
}

/* ===============================
   UPLOAD NOTE (SAFE GUARD)
================================ */
if (uploadForm) {
  uploadForm.onsubmit = async e => {
    e.preventDefault();
    uploadMessage.innerText = "";

    // 🔴 PREVENT JS CRASH
    if (typeof uploadedFilePublicUrl === "undefined") {
      uploadMessage.innerText = "❌ Supabase upload not configured";
      return;
    }

    try {
      const res = await fetch(NOTES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.value,
          description: description.value,
          file: uploadedFilePublicUrl
        })
      });

      if (!res.ok) throw new Error();

      uploadMessage.innerText = "✅ Note uploaded";
      uploadForm.reset();
      getNotes();

    } catch {
      uploadMessage.innerText = "❌ Upload failed";
    }
  };
}

/* ===============================
   LIVE SEARCH
================================ */
let searchTimer;
searchInput.oninput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(getNotes, 300);
};
