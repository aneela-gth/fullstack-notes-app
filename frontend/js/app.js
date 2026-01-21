/* ===============================
   PDF.js WORKER
================================ */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

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

  const url = isLogin ? LOGIN_API : SIGNUP_API;

  try {
    const res = await fetch(url, {
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

    authContainer.style.display = "none";
    appContainer.style.display = "block";
    getNotes();
    checkAdminAccess();

  } catch {
    authMsg.innerText = "❌ Server error";
  }
};

/* ===============================
   AUTO LOGIN (STRICT FIX 🔥)
================================ */
(async function autoLogin() {
  try {
    const res = await fetch(ME_API, { credentials: "include" });

    if (!res.ok) throw new Error();

    const data = await res.json();

    // 🔐 MUST HAVE USERNAME
    if (!data.username) throw new Error();

    authContainer.style.display = "none";
    appContainer.style.display = "block";
    getNotes();
    checkAdminAccess();

  } catch {
    authContainer.style.display = "block";
    appContainer.style.display = "none";
  }
})();

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
   FETCH NOTES
================================ */
async function getNotes() {
  try {
    const res = await fetch(NOTES_API);
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

  if (!notes.length) {
    notesContainer.innerHTML = "<p>No notes available</p>";
    return;
  }

  notes.forEach(note => {
    const ext = note.file.split(".").pop().toLowerCase();

    const card = document.createElement("div");
    card.className = "note-card";

    card.innerHTML = `
      <div class="pdf-preview" id="preview-${note.id}">Loading...</div>
      <h3>${note.title}</h3>
      <p>${note.description}</p>
      <div class="card-actions">
        <button class="view-btn">View</button>
        <a class="download-btn" href="${note.file}" target="_blank">Download</a>
      </div>
    `;

    if (ext === "pdf") {
      renderPdfPreview(note.file, `preview-${note.id}`);
    } else {
      document.getElementById(`preview-${note.id}`).innerText = "No preview";
    }

    card.querySelector(".view-btn").onclick = () =>
      window.open(note.file, "_blank");

    notesContainer.appendChild(card);
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

    const container = document.getElementById(id);
    container.innerHTML = "";
    container.appendChild(canvas);

  } catch {
    document.getElementById(id).innerText = "Preview error";
  }
}

/* ===============================
   UPLOAD NOTE (ADMIN ONLY)
   🔥 URL ONLY (SUPABASE)
================================ */
if (uploadForm) {
  uploadForm.onsubmit = async e => {
    e.preventDefault();
    uploadMessage.innerText = "";

    try {
      // ⛔ You MUST already upload to Supabase
      // and get this URL
      const supabaseFileUrl = uploadedFilePublicUrl;

      const res = await fetch(NOTES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.value,
          description: description.value,
          file: supabaseFileUrl
        })
      });

      if (!res.ok) throw new Error();

      uploadMessage.innerText = "✅ Note uploaded successfully";
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
