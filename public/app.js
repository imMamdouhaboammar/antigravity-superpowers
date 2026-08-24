let allSkills = [];
let currentCategory = "all";
let currentQuery = "";

// Tab Switching
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".install-panel").forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    const target = btn.getAttribute("data-target");
    if (target) {
      document.getElementById(target)?.classList.add("active");
    }
  });
});

// Category Filter Buttons
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    currentCategory = btn.getAttribute("data-cat") || "all";
    renderSkills();
  });
});

// Search Input
const searchInput = document.getElementById("searchInput");
searchInput?.addEventListener("input", (e) => {
  currentQuery = (e.target.value || "").toLowerCase().trim();
  renderSkills();
});

// Copy button handler
function copyCode(btn) {
  const codeEl = btn.parentElement.querySelector("code");
  if (!codeEl) return;
  navigator.clipboard.writeText(codeEl.textContent || "");
  const originalText = btn.textContent;
  btn.textContent = "Copied!";
  btn.style.background = "#10b981";
  btn.style.color = "#000";
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = "";
    btn.style.color = "";
  }, 2000);
}

function copySkillInstall(skillName, btn) {
  const cmd = `bunx skills add imMamdouhaboammar/antigravity-superpowers/${skillName}`;
  navigator.clipboard.writeText(cmd);
  const originalText = btn.textContent;
  btn.textContent = "Copied!";
  setTimeout(() => {
    btn.textContent = originalText;
  }, 1500);
}

// Fetch skills data
async function loadSkills() {
  const grid = document.getElementById("skillsGrid");
  try {
    const res = await fetch("/skills.json");
    if (!res.ok) throw new Error("Failed to load skills.json");
    const data = await res.json();
    allSkills = data.skills || [];

    const totalEl = document.getElementById("totalSkillsCount");
    if (totalEl) totalEl.textContent = data.skillsCount || allSkills.length;

    const countAllEl = document.getElementById("countAll");
    if (countAllEl) countAllEl.textContent = allSkills.length;

    renderSkills();
  } catch (err) {
    if (grid) {
      grid.innerHTML = `<div class="error-msg" style="color:#ef4444;padding:24px;">Could not load skills list dynamically. Please view <a href="/skills.json" style="color:#38bdf8;">skills.json</a>.</div>`;
    }
  }
}

function renderSkills() {
  const grid = document.getElementById("skillsGrid");
  if (!grid) return;

  const filtered = allSkills.filter((s) => {
    const matchCat = currentCategory === "all" || s.category === currentCategory;
    const matchQuery =
      !currentQuery ||
      s.name.toLowerCase().includes(currentQuery) ||
      s.description.toLowerCase().includes(currentQuery) ||
      (s.triggers && s.triggers.some((t) => t.toLowerCase().includes(currentQuery)));
    return matchCat && matchQuery;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 48px 0;">No skills found matching your search.</div>`;
    return;
  }

  grid.innerHTML = filtered
    .map(
      (s) => `
    <div class="skill-card">
      <div>
        <div class="skill-header">
          <span class="skill-name">${s.name}</span>
          <span class="skill-cat cat-${s.category}">${s.category}</span>
        </div>
        <p class="skill-desc">${s.description}</p>
      </div>
      <div class="skill-footer">
        <button class="btn-skill" onclick="viewSkill('${s.name}')">View Rule</button>
        <button class="btn-skill" onclick="copySkillInstall('${s.name}', this)">Copy Add Cmd</button>
      </div>
    </div>
  `
    )
    .join("");
}

async function viewSkill(name) {
  const modal = document.getElementById("skillModal");
  const modalBody = document.getElementById("modalBody");
  if (!modal || !modalBody) return;

  modalBody.innerHTML = `<div style="color:var(--text-muted);">Loading skill definition for <strong>${name}</strong>...</div>`;
  modal.classList.add("open");

  try {
    const res = await fetch(`/api/skills?name=${encodeURIComponent(name)}`);
    const data = await res.json();

    modalBody.innerHTML = `
      <h2 style="font-size:22px;margin-bottom:8px;font-family:var(--font-mono);">${data.name}</h2>
      <span class="skill-cat cat-${data.category}" style="display:inline-block;margin-bottom:16px;">${data.category}</span>
      <p style="color:var(--text-muted);font-size:14px;margin-bottom:16px;">${data.description}</p>
      
      <div class="code-box" style="margin-bottom:16px;">
        <code>npx skills add imMamdouhaboammar/antigravity-superpowers/${data.name}</code>
        <button class="btn-copy" onclick="copyCode(this)">Copy</button>
      </div>

      <pre><code>${escapeHtml(data.content || "SKILL.md definition")}</code></pre>
    `;
  } catch (err) {
    modalBody.innerHTML = `<p style="color:#ef4444;">Failed to load skill details.</p>`;
  }
}

function closeModal() {
  document.getElementById("skillModal")?.classList.remove("open");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.addEventListener("click", (e) => {
  const modal = document.getElementById("skillModal");
  if (e.target === modal) closeModal();
});

// Load on start
loadSkills();
