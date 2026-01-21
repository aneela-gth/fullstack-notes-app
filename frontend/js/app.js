// ===============================
// PDF.js WORKER
// ===============================
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// ===============================
// API CONFIG (PRODUCTION)
// ===============================
const apiUrl = "https://fullstackprojectnotesapp6.onrender.com/api/notes/";
const BASE_URL = "https://fullstackprojectnotesapp6.onrender.com";

// ===============================
// DOM ELEMENTS
// ===============================
const notesContainer = document.getElementById("notesContainer");
const uploadForm = document.getElementById("uploadForm");
const uploadMessage = document.getElementById("uploadMessage");
const searchInput = document.getElementById("searchInput");
const themeToggle = document.getElementById("themeToggle");

// ===============================
// THEME TOGGLE
// ===============================
themeToggle.onclick = () => {
  document.body.classList.toggle("dark-mode");
};

// ===============================
// FETCH NOTES
// ===============================
async function getNotes() {
  try {
    let url = apiUrl;
    const search = searchInput.value.trim();

    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");

    const notes = await res.json();
    displayNotes(notes);
  } catch {
    notesContainer.innerHTML = "<p>❌ Error fetching notes</p>";
  }
}

// ===============================
// DISPLAY NOTES
// ===============================
function displayNotes(notes) {
  notesContainer.innerHTML = "";

  if (!notes || notes.length === 0) {
    notesContainer.innerHTML = "<p>No notes found</p>";
    return;
  }

  notes.forEach(note => {
    const viewUrl = note.file.startsWith("http")
      ? note.file
      : BASE_URL + note.file;

    const ext = viewUrl.split(".").pop().toLowerCase();

    const card = document.createElement("div");
    card.className = "note-card";

    card.innerHTML = `
      <div class="pdf-preview" id="preview-${note.id}">Loading...</div>
      <h3>${note.title}</h3>
      <p>${note.description}</p>
      <div class="card-actions">
        <button class="view-btn">View</button>
        <a class="download-btn" href="${apiUrl}${note.id}/download/">Download</a>
      </div>
    `;

    // PDF preview
    if (ext === "pdf") {
      renderPdfPreview(viewUrl, `preview-${note.id}`);
    } else {
      document.getElementById(`preview-${note.id}`).innerText = "No preview";
    }

    card.querySelector(".view-btn").onclick = () =>
      window.open(viewUrl, "_blank");

    notesContainer.appendChild(card);
  });
}

// ===============================
// PDF PREVIEW
// ===============================
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
      viewport,
    }).promise;

    const container = document.getElementById(id);
    container.innerHTML = "";
    container.appendChild(canvas);
  } catch {
    const container = document.getElementById(id);
    if (container) container.innerText = "Preview error";
  }
}

// ===============================
// UPLOAD NOTE (ADMIN ONLY)
// ===============================
uploadForm.onsubmit = async e => {
  e.preventDefault();

  uploadMessage.innerText = "";

  const formData = new FormData();
  formData.append("title", title.value);
  formData.append("description", description.value);
  formData.append("file", file.files[0]);

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      body: formData,
    });

    // 🔐 ADMIN‑ONLY HANDLING
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

// ===============================
// LIVE SEARCH (DEBOUNCE)
// ===============================
let searchTimer;
searchInput.oninput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(getNotes, 300);
};

// ===============================
// INITIAL LOAD
// ===============================
getNotes();
















