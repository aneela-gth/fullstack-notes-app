/* ===============================
   API URLs
================================ */
const NOTES_API = "https://fullstackprojectnotesapp6.onrender.com/api/notes/";
const LOGIN_API = "https://fullstackprojectnotesapp6.onrender.com/api/auth/login/";
const SIGNUP_API = "https://fullstackprojectnotesapp6.onrender.com/api/auth/signup/";

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
   HARD LOGIN GUARD
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
   LOGIN / SIGNUP (FIXED)
================================ */
authBtn.onclick = async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    authMsg.innerText = "❌ All fields required";
    authMsg.style.color = "red";
    return;
  }

  try {
    const res = await fetch(isLogin ? LOGIN_API : SIGNUP_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      authMsg.innerText = data.error || "❌ Something went wrong";
      authMsg.style.color = "red";
      return;
    }

    // ✅ SIGNUP SUCCESS
    if (!isLogin) {
      authMsg.innerText = "✅ Signup successful. Please login.";
      authMsg.style.color = "green";

      isLogin = true;
      authTitle.innerText = "Login";
      authBtn.innerText = "Login";
      switchAuth.innerText = "Don’t have an account? Signup";
      return;
    }

    // ✅ LOGIN SUCCESS
    sessionStorage.setItem("loggedIn", "true");
    sessionStorage.setItem("username", username);

    authContainer.style.display = "none";
    appContainer.style.display = "block";
    authMsg.innerText = "";

    getNotes();
    checkAdminAccess();

  } catch {
    authMsg.innerText = "❌ Server error";
    authMsg.style.color = "red";
  }
};

/* ===============================
   ADMIN CHECK (NO COOKIES)
================================ */
function checkAdminAccess() {
  const adminUsers = ["supraja", "admin"]; // 👈 put admin username here
  const loggedUser = sessionStorage.getItem("username");

  if (!adminUsers.includes(loggedUser) && uploadSection) {
    uploadSection.remove();
    uploadForm = null;
  }
}

/* ===============================
   FETCH NOTES (WORKING)
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
   UPLOAD NOTE (OPTIONAL / SAFE)
================================ */
if (uploadForm) {
  uploadForm.onsubmit = async e => {
    e.preventDefault();
    uploadMessage.innerText = "";

    if (typeof uploadedFilePublicUrl === "undefined") {
      uploadMessage.innerText = "❌ Supabase upload not configured";
      uploadMessage.style.color = "red";
      return;
    }

    try {
      const res = await fetch(NOTES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.value,
          description: description.value,
          file: uploadedFilePublicUrl
        })
      });

      if (!res.ok) throw new Error();

      uploadMessage.innerText = "✅ Note uploaded";
      uploadMessage.style.color = "green";
      uploadForm.reset();
      getNotes();

    } catch {
      uploadMessage.innerText = "❌ Upload failed";
      uploadMessage.style.color = "red";
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
