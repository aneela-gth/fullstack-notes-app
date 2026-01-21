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
const uploadForm = document.getElementById("uploadForm");
const uploadMessage = document.getElementById("uploadMessage");
const searchInput = document.getElementById("searchInput");
const themeToggle = document.getElementById("themeToggle");

const authContainer = document.getElementById("authContainer");
const appContainer = document.getElementById("appContainer");
const authBtn = document.getElementById("authBtn");
const authTitle = document.getElementById("authTitle");
const authMsg = document.getElementById("authMsg");
const switchAuth = document.getElementById("switchAuth");
const uploadSection = document.getElementById("upload");

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
   LOGIN / SIGNUP SUBMIT
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

    // Signup → switch to login
    if (!isLogin) {
      authMsg.innerText = "✅ Signup successful. Please login.";
      isLogin = true;
      authTitle.innerText = "Login";
      authBtn.innerText = "Login";
      return;
    }

    // Login success
    authContainer.style.display = "none";
    appContainer.style.display = "block";
    getNotes();
    checkAdminAccess();

  } catch {
    authMsg.innerText = "❌ Server error";
  }
};

/* ===============================
   AUTO LOGIN (SESSION CHECK)
================================ */
(async function autoLogin() {
  try {
    const res = await fetch(ME_API, { credentials: "include" });
    if (res.ok) {
      authContainer.style.display = "none";
      appContainer.style.display = "block";
      getNotes();
      checkAdminAccess();
    }
  } catch {}
})();

/* ===============================
   ADMIN CHECK
================================ */
async function checkAdminAccess() {
  try {
    const res = await fetch(ME_API, { credentials: "include" });
    if (!res.ok) {
      uploadSection.style.display = "none";
      return;
    }

    const data = await res.json();
    uploadSection.style.display = data.is_admin ? "block" : "none";
  } catch {
    uploadSection.style.display = "none";
  }
}

/* ===============================
   FETCH NOTES
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
    const fileUrl = note.file;
    const ext = fileUrl.split(".").pop().toLowerCase();

    const card = document.createElement("div");
    card.className = "note-card";

    card.innerHTML = `
      <div class="pdf-preview" id="preview-${note.id}">Loading...</div>
      <h3>${note.title}</h3>
      <p>${note.description}</p>
      <div class="card-actions">
        <button class="view-btn">View</button>
        <a class="download-btn" href="${fileUrl}" target="_blank">Download</a>
      </div>
    `;

    if (ext === "pdf") {
      renderPdfPreview(fileUrl, `preview-${note.id}`);
    } else {
      document.getElementById(`preview-${note.id}`).innerText = "No preview";
    }

    card.querySelector(".view-btn").onclick = () =>
      window.open(fileUrl, "_blank");

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
    const container = document.getElementById(id);
    if (container) container.innerText = "Preview error";
  }
}

/* ===============================
   UPLOAD NOTE (ADMIN ONLY)
================================ */
uploadForm.onsubmit = async e => {
  e.preventDefault();

  uploadMessage.innerText = "";

  const formData = new FormData();
  formData.append("title", title.value);
  formData.append("description", description.value);
  formData.append("file", file.files[0]);

  try {
    const res = await fetch(NOTES_API, {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    if (res.status === 403) {
      uploadMessage.innerText = "❌ Only admin can upload notes";
      uploadMessage.style.color = "red";
      return;
    }

    if (!res.ok) {
      uploadMessage.innerText = "❌ Upload failed";
      uploadMessage.style.color = "red";
      return;
    }

    uploadMessage.innerText = "✅ Note uploaded successfully";
    uploadMessage.style.color = "green";

    uploadForm.reset();
    getNotes();

  } catch {
    uploadMessage.innerText = "❌ Server error";
    uploadMessage.style.color = "red";
  }
};

/* ===============================
   LIVE SEARCH
================================ */
let searchTimer;
searchInput.oninput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(getNotes, 300);
};
