pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const apiUrl = "https://fullstackprojectnotesapp-4.onrender.com/api/notes/";
const BASE_URL = "https://fullstackprojectnotesapp-4.onrender.com";

const notesContainer = document.getElementById("notesContainer");
const uploadForm = document.getElementById("uploadForm");
const uploadMessage = document.getElementById("uploadMessage");
const searchInput = document.getElementById("searchInput");
const themeToggle = document.getElementById("themeToggle");

themeToggle.onclick = () => {
  document.body.classList.toggle("dark-mode");
};

async function getNotes() {
  try {
    let url = apiUrl;
    if (searchInput.value.trim()) {
      url += `?search=${encodeURIComponent(searchInput.value)}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");

    const notes = await res.json();
    displayNotes(notes);
  } catch {
    notesContainer.innerHTML = "<p>Error fetching notes</p>";
  }
}

function displayNotes(notes) {
  notesContainer.innerHTML = "";

  if (!notes.length) {
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

    if (ext === "pdf") {
      renderPdfPreview(viewUrl, `preview-${note.id}`);
    } else {
      document.getElementById(`preview-${note.id}`).innerText = "No preview";
    }

    card.querySelector(".view-btn").onclick = () => window.open(viewUrl, "_blank");
    notesContainer.appendChild(card);
  });
}

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
    document.getElementById(id).innerText = "Preview error";
  }
}

uploadForm.onsubmit = async e => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("title", title.value);
  formData.append("description", description.value);
  formData.append("file", file.files[0]);

  try {
    const res = await fetch(apiUrl, { method: "POST", body: formData });
    if (!res.ok) throw new Error();

    uploadMessage.innerText = "✅ Uploaded";
    uploadForm.reset();
    getNotes();
  } catch {
    uploadMessage.innerText = "❌ Upload failed";
  }
};

searchInput.oninput = () => setTimeout(getNotes, 300);

getNotes();
