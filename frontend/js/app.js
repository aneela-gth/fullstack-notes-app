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
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJscW14dnp2cXJ5c3Zuemx5Z3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjk1MjcsImV4cCI6MjA4MzYwNTUyN30.NYnl0WXWfF4BCs1FSN4hMOdTvl6Ef8fRAKx7STKixIw";

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  /* ===============================
     BACKEND API
  ================================ */
  const NOTES_API = "https://fullstackprojectnotesapp6.onrender.com/api/notes/";
  const LOGIN_API =
    "https://fullstackprojectnotesapp6.onrender.com/api/auth/login/";
  const SIGNUP_API =
    "https://fullstackprojectnotesapp6.onrender.com/api/auth/signup/";

  /* ===============================
     DOM
  ================================ */
  const authContainer = document.getElementById("authContainer");
  const appContainer = document.getElementById("appContainer");
  const authBtn = document.getElementById("authBtn");
  const authTitle = document.getElementById("authTitle");
  const authMsg = document.getElementById("authMsg");
  const switchAuth = document.getElementById("switchAuth");
  const loadingBox = document.getElementById("loadingBox");

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
  } else {
    authContainer.style.display = "none";
    appContainer.style.display = "block";
    checkAdmin();
    getNotes();
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
    authMsg.innerText = "";
  };

  /* ===============================
     LOGIN / SIGNUP (WITH LOADER)
  ================================ */
  authBtn.onclick = async () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      authMsg.innerText = "❌ All fields required";
      return;
    }

    try {
      // ✅ show loader
      if (loadingBox) loadingBox.style.display = "block";
      authBtn.disabled = true;
      authBtn.innerText = "Please wait...";

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

      // signup success
      if (!isLogin) {
        authMsg.innerText = "✅ Signup successful. Please login.";
        isLogin = true;
        authTitle.innerText = "Login";
        authBtn.innerText = "Login";
        return;
      }

      // login success
      sessionStorage.setItem("loggedIn", "true");
      sessionStorage.setItem("username", username);

      authContainer.style.display = "none";
      appContainer.style.display = "block";

      checkAdmin();
      getNotes();
    } catch (err) {
      authMsg.innerText =
        "⏳ Server is waking up... wait 20-30 sec and try again.";
    } finally {
      // ✅ hide loader
      if (loadingBox) loadingBox.style.display = "none";
      authBtn.disabled = false;
      authBtn.innerText = isLogin ? "Login" : "Signup";
    }
  };

  /* ===============================
     ADMIN CHECK
  ================================ */
  function checkAdmin() {
    const adminUsers = ["supraja", "admin"];
    const user = sessionStorage.getItem("username");

    if (!adminUsers.includes(user) && uploadSection) {
      uploadSection.remove();
    }
  }

  /* ===============================
     FETCH NOTES
  ================================ */
  async function getNotes() {
    try {
      notesContainer.innerHTML = "<p>⏳ Loading notes...</p>";

      const res = await fetch(NOTES_API);
      if (!res.ok) throw new Error("Notes fetch failed");

      ALL_NOTES = await res.json();
      displayNotes(ALL_NOTES);
    } catch (err) {
      notesContainer.innerHTML =
        "<p style='color:red;'>❌ Error fetching notes</p>";
    }
  }

  /* ===============================
     DISPLAY NOTES (PDF + IMAGE + DOCX)
  ================================ */
  function displayNotes(notes) {
    notesContainer.innerHTML = "";

    notes.forEach((note) => {
      const card = document.createElement("div");
      card.className = "note-card";

      card.innerHTML = `
        <div class="pdf-preview" id="pdf-${note.id}">
          <span class="file-badge">FILE</span>
        </div>

        <h3>${note.title}</h3>
        <p>${note.description}</p>

        <div class="card-actions">
          <button class="view-btn">View</button>
          <a class="download-btn" href="${note.file}" target="_blank">Download</a>
        </div>
      `;

      card.querySelector(".view-btn").onclick = () =>
        window.open(note.file, "_blank");

      const preview = card.querySelector(".pdf-preview");
      const badge = card.querySelector(".file-badge");
      const fileUrl = note.file.toLowerCase();

      // ✅ PDF
      if (fileUrl.endsWith(".pdf")) {
        badge.textContent = "PDF";
        badge.className = "file-badge pdf-badge";

        renderPdfPreview(note.file, `pdf-${note.id}`).then(() => {
          // re-add badge after pdf renders
          preview.prepend(badge);
        });
      }

      // ✅ IMAGE
      else if (
        fileUrl.endsWith(".png") ||
        fileUrl.endsWith(".jpg") ||
        fileUrl.endsWith(".jpeg")
      ) {
        badge.textContent = "IMAGE";
        badge.className = "file-badge image-badge";

        preview.innerHTML = `
          <span class="file-badge image-badge">IMAGE</span>
          <img src="${note.file}" alt="Note Image" class="image-preview" />
        `;
      }

      // ✅ DOCX
      else if (fileUrl.endsWith(".docx")) {
        badge.textContent = "DOCX";
        badge.className = "file-badge docx-badge";

        preview.innerHTML = `
          <span class="file-badge docx-badge">DOCX</span>
          <div class="docx-preview">📄 Word Document</div>
        `;
      }

      // ✅ Other files
      else {
        preview.innerHTML = `
          <span class="file-badge docx-badge">FILE</span>
          <div class="docx-preview">📁 File</div>
        `;
      }

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

      await page
        .render({
          canvasContext: canvas.getContext("2d"),
          viewport,
        })
        .promise;

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
    uploadForm.onsubmit = async (e) => {
      e.preventDefault();
      uploadMessage.innerText = "";

      const title = document.getElementById("title").value.trim();
      const description = document.getElementById("description").value.trim();
      const file = document.getElementById("file").files[0];

      if (!file || !title || !description) {
        uploadMessage.innerText = "❌ All fields required";
        return;
      }

      const fileName = `${Date.now()}_${file.name}`;

      try {
        uploadMessage.innerText = "⏳ Uploading...";

        const { error } = await supabase.storage.from("notes").upload(fileName, file);
        if (error) throw error;

        const { data } = supabase.storage.from("notes").getPublicUrl(fileName);

        const res = await fetch(NOTES_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            file: data.publicUrl,
          }),
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

  /* ===============================
     SEARCH (ONLY ONE LISTENER ✅)
  ================================ */
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase().trim();

      if (!query) {
        displayNotes(ALL_NOTES);
        return;
      }

      const filteredNotes = ALL_NOTES.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.description.toLowerCase().includes(query)
      );

      displayNotes(filteredNotes);
    });
  }

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
});
