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
      if (container) container.innerHTML = marked.parse(text);
    })
    .catch(err => console.error(err));
}

// ------------------------------
// Helper: Load CSV via PapaParse
// ------------------------------
function loadCSV(path) {
  return new Promise(resolve => {
    Papa.parse(path, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: results => resolve(results.data || [])
    });
  });
}

// Pick a field by possible header names (for glossary.csv)
function pickField(row, candidates) {
  for (const c of candidates) if (row[c] != null) return row[c].trim();
  const lower = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));
  for (const c of candidates) if (lower[c.toLowerCase()] != null) return lower[c.toLowerCase()].trim();
  return null;
}

// ------------------------------
// Main initialization
// ------------------------------
document.addEventListener("DOMContentLoaded", async () => {

  // --------------------------
  // Dark mode toggle
  // --------------------------
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      darkModeToggle.textContent = document.body.classList.contains("dark-mode")
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";
    });
  }

  // --------------------------
  // Load Markdown sections
  // --------------------------
  loadMarkdown("intro-text", "text/intro.md");
  loadMarkdown("glossary-expl", "text/glossary_expl.md");
  loadMarkdown("comminution-expl", "text/comminution_expl.md");
  loadMarkdown("flotation-expl", "text/flotation_expl.md");
  loadMarkdown("leaching-expl", "text/leaching_expl.md");
  loadMarkdown("mineralogy-expl", "text/mineralogy_expl.md");
  loadMarkdown("feedback-expl", "text/feedback_expl.md");

  // --------------------------
  // Build merged glossary
  // --------------------------
  const glossaryTable = document.querySelector("#glossary-table tbody");
  const searchInput = document.getElementById("glossary-search");

  let glossaryData = [];
  let fuse = null;

  const filesToLoad = [
    { file: "data/glossary.csv", source: "glossary.csv", type: "glossary" },
    { file: "data/comminution.csv", source: "comminution.csv", type: "guide" },
    { file: "data/flotation.csv", source: "flotation.csv", type: "guide" },
    { file: "data/leaching.csv", source: "leaching.csv", type: "guide" },
    { file: "data/mineralogy.csv", source: "mineralogy.csv", type: "guide" }
  ];

  const merged = [];

  for (const entry of filesToLoad) {
    let rows = await loadCSV(entry.file);

    rows.forEach(row => {
      if (!row) return;

      // Clean values
      const keys = Object.keys(row);
      const clean = {};
      keys.forEach(k => clean[k.trim()] = (row[k] || "").toString().trim());

      if (entry.type === "glossary") {
        // Flexible header names
        const ID = pickField(clean, ["ID", "Term", "Parameter", "Name"]);
        const Description = pickField(clean, ["Description", "Definition", "Desc"]);
        const Unit = pickField(clean, ["Unit", "Units", "Unit(s)"]);

        if (ID && Description) {
          merged.push({
            ID,
            Description,
            Unit: Unit || "",
            Source: entry.source
          });
        }

      } else {
        // ---------------------------------------
        // STRICT COLUMN MAPPING FOR GUIDE FILES:
        // col2 → ID     (keys[1])
        // col3 → Description (keys[2])
        // col4 → Unit   (keys[3])
        // ---------------------------------------
        if (keys.length >= 4) {
          const ID = clean[keys[1]];
          const Description = clean[keys[2]];
          const Unit = clean[keys[3]];

          if (ID && Description) {
            merged.push({
              ID,
              Description,
              Unit: Unit || "",
              Source: entry.source
            });
          }
        }
      }
    });
  }

  glossaryData = merged;

  if (!glossaryData.length) {
    glossaryTable.innerHTML = "<tr><td colspan='4'><em>No glossary data available.</em></td></tr>";
    return;
  }

  // --------------------------
  // Initialize Fuse.js
  // --------------------------
  fuse = new Fuse(glossaryData, {
    keys: ["ID", "Description", "Unit", "Source"],
    threshold: 0.36,
    ignoreLocation: true,
    minMatchCharLength: 1
  });

  // Empty table until searching
  glossaryTable.innerHTML = "<tr><td colspan='4'><em>Start typing to search…</em></td></tr>";

  // --------------------------
  // Search input
  // --------------------------
  searchInput.addEventListener("input", e => {
    const query = e.target.value.trim();
    glossaryTable.innerHTML = "";

    if (!query) {
      glossaryTable.innerHTML = "<tr><td colspan='4'><em>Start typing to search…</em></td></tr>";
      return;
    }

    const results = fuse.search(query);

    if (!results.length) {
      glossaryTable.innerHTML = "<tr><td colspan='4'><em>No matches found.</em></td></tr>";
      return;
    }

    results.slice(0, 100).forEach(r => {
      const item = r.item;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.ID}</td>
        <td>${item.Description}</td>
        <td>${item.Unit}</td>
        <td><strong>${item.Source}</strong></td>
      `;
      glossaryTable.appendChild(tr);
    });
  });

});
