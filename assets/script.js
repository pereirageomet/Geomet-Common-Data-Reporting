// ------------------------------
// Load and render Markdown text
// ------------------------------
function loadMarkdown(id, filePath) {
  fetch(filePath)
    .then(response => {
      if (!response.ok) throw new Error(`Failed to load ${filePath}`);
      return response.text();
    })
    .then(text => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = marked.parse(text);
      }
    })
    .catch(err => console.error(err));
}

// ------------------------------
// Main initialization
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {

  // --- Dark mode toggle ---
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      darkModeToggle.textContent = document.body.classList.contains("dark-mode")
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";
    });
  } else {
    console.error("Dark mode button not found");
  }

  // --- Load Markdown sections ---
  loadMarkdown("intro-text", "text/intro.md");
  loadMarkdown("glossary-expl", "text/glossary_expl.md");
  loadMarkdown("comminution-expl", "text/comminution_expl.md");
  loadMarkdown("flotation-expl", "text/flotation_expl.md");
  loadMarkdown("leaching-expl", "text/leaching_expl.md");
  loadMarkdown("mineralogy-expl", "text/mineralogy_expl.md");
  loadMarkdown("feedback-expl", "text/feedback_expl.md");

  // --- Glossary fuzzy search ---
  const glossaryTable = document.querySelector("#glossary-table tbody");
  const searchInput = document.getElementById("glossary-search");
  let glossaryData = [];
  let fuse = null;

  Papa.parse("data/glossary.csv", {
    download: true,
    header: true,
    complete: results => {
      glossaryData = results.data.filter(row => row.Term && row.Definition);

      if (glossaryData.length === 0) {
        glossaryTable.innerHTML = "<tr><td colspan='2'><em>No glossary data found.</em></td></tr>";
        return;
      }

      // Initialize Fuse.js for fuzzy search
      fuse = new Fuse(glossaryData, {
        keys: ["Term", "Definition"],
        threshold: 0.4,
        includeScore: true
      });

      // Add search input listener
      searchInput.addEventListener("input", e => {
        const query = e.target.value.trim();
        glossaryTable.innerHTML = "";

        if (!query) return;

        const results = fuse.search(query);
        if (results.length === 0) {
          glossaryTable.innerHTML = "<tr><td colspan='2'><em>No matches found.</em></td></tr>";
          return;
        }

        results.slice(0, 20).forEach(r => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${r.item.Term}</td><td>${r.item.Definition}</td>`;
          glossaryTable.appendChild(tr);
        });
      });
    }
  });

});
