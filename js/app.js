// ===== Data config =====
const DOMAINS = [
  { key: "bilangan", label: "Bilangan", color: "var(--accent-bilangan)" },
  { key: "aljabar", label: "Aljabar", color: "var(--accent-aljabar)" },
  { key: "pengukuran", label: "Pengukuran", color: "var(--accent-pengukuran)" },
  { key: "geometri", label: "Geometri", color: "var(--accent-geometri)" },
  { key: "analisis-data-peluang", label: "Analisis Data dan Peluang", color: "var(--accent-analisis)" },
];

const STATIC_PAGES = [
  { key: "home", label: "Home" },
  { key: "about", label: "About" },
];

const cache = {};

// ===== Tiny markdown renderer (no external deps, offline-friendly) =====
function renderMarkdown(md) {
  if (!md) return "";
  const escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = escaped.split("\n");
  let html = "";
  let inList = false;

  const closeList = () => {
    if (inList) { html += "</ul>"; inList = false; }
  };

  for (let raw of lines) {
    const line = raw.trim();
    if (line === "") { closeList(); continue; }

    let m;
    if ((m = line.match(/^###\s+(.*)/))) { closeList(); html += `<h3>${inline(m[1])}</h3>`; continue; }
    if ((m = line.match(/^##\s+(.*)/))) { closeList(); html += `<h2>${inline(m[1])}</h2>`; continue; }
    if ((m = line.match(/^[-*]\s+(.*)/))) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${inline(m[1])}</li>`;
      continue;
    }
    closeList();
    html += `<p>${inline(line)}</p>`;
  }
  closeList();
  return html;

  function inline(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");
  }
}

async function loadJSON(path) {
  if (cache[path]) return cache[path];
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Gagal memuat ${path}`);
  const data = await res.json();
  cache[path] = data;
  return data;
}

// ===== Rendering =====
const workspace = document.getElementById("workspace");
const menuList = document.getElementById("menu-list");

function setActiveMenu(key) {
  [...menuList.querySelectorAll(".menu-item")].forEach((el) => {
    el.classList.toggle("active", el.dataset.key === key);
  });
}

function domainByKey(key) {
  return DOMAINS.find((d) => d.key === key);
}

async function showHome() {
  setActiveMenu("home");
  let data;
  try {
    data = await loadJSON("content/home.json");
  } catch {
    data = { eyebrow: "", judul: "Selamat Datang", intro: "", catatan: "" };
  }
  workspace.innerHTML = `
    <div class="workspace-header">
      <p class="eyebrow">${escapeHtml(data.eyebrow || "")}</p>
      <h1 class="workspace-title">${escapeHtml(data.judul || "Selamat Datang")}</h1>
      <p class="workspace-lede">${escapeHtml(data.intro || "")}</p>
    </div>
    <div class="prose-card">${escapeHtml(data.catatan || "")}</div>
    <div class="home-grid" id="home-grid"></div>
  `;
  const grid = document.getElementById("home-grid");
  DOMAINS.forEach((d) => {
    const card = document.createElement("button");
    card.className = "home-domain-card";
    card.style.setProperty("--card-color", d.color);
    card.innerHTML = `<p class="stair-label">Domain</p><p class="stair-title">${escapeHtml(d.label)}</p>`;
    card.addEventListener("click", () => showDomain(d.key));
    grid.appendChild(card);
  });
}

async function showAbout() {
  setActiveMenu("about");
  let data;
  try {
    data = await loadJSON("content/about.json");
  } catch {
    data = { judul: "Tentang", konten: "Konten belum tersedia.", kontak: "" };
  }
  workspace.innerHTML = `
    <div class="workspace-header">
      <h1 class="workspace-title">${escapeHtml(data.judul || "Tentang")}</h1>
    </div>
    <div class="prose-card">${escapeHtml(data.konten || "")}${data.kontak ? "\n\n" + escapeHtml(data.kontak) : ""}</div>
  `;
}

async function showDomain(key) {
  setActiveMenu(key);
  const domain = domainByKey(key);
  workspace.style.setProperty("--domain-color", domain.color);

  let data;
  try {
    data = await loadJSON(`content/${key}.json`);
  } catch {
    workspace.innerHTML = `<div class="empty-note">Materi untuk ${escapeHtml(domain.label)} belum tersedia.</div>`;
    return;
  }

  workspace.innerHTML = `
    <div class="workspace-header">
      <p class="eyebrow">Domain · Fase A sampai F</p>
      <h1 class="workspace-title">${escapeHtml(data.title || domain.label)}</h1>
      <p class="workspace-lede">Materi disusun bertahap mengikuti enam fase Kurikulum Merdeka. Pilih satu fase untuk melihat isinya.</p>
    </div>
    <div class="staircase" id="staircase"></div>
  `;

  const staircase = document.getElementById("staircase");
  (data.fases || []).forEach((f) => {
    const step = document.createElement("div");
    step.className = "stair-step";
    const filled = Boolean(f.judul || f.konten || f.ringkasan);
    step.innerHTML = `
      <button class="stair-card" data-fase="${escapeHtml(f.fase)}">
        <span class="stair-badge">${escapeHtml(f.fase)}</span>
        <span class="stair-body">
          <p class="stair-label">${escapeHtml(f.label || "Fase " + f.fase)}</p>
          <p class="stair-title ${filled ? "" : "empty"}">${escapeHtml(filled ? f.judul || "Lihat materi" : "Belum diisi")}</p>
        </span>
        <span class="stair-arrow">&#8250;</span>
      </button>
    `;
    step.querySelector(".stair-card").addEventListener("click", () => showFaseDetail(key, f));
    staircase.appendChild(step);
  });
}

function showFaseDetail(domainKey, fase) {
  const domain = domainByKey(domainKey);
  const hasContent = Boolean(fase.judul || fase.konten || fase.ringkasan || (fase.materi && fase.materi.length));

  workspace.innerHTML = `
    <button class="back-link" id="back-btn">&#8249; Kembali ke ${escapeHtml(domain.label)}</button>
    <div class="detail-card">
      <span class="detail-tag">${escapeHtml(fase.label || "Fase " + fase.fase)}</span>
      <h1 class="detail-title">${escapeHtml(fase.judul || domain.label + " — " + fase.label)}</h1>
      ${fase.ringkasan ? `<p class="detail-summary">${escapeHtml(fase.ringkasan)}</p>` : ""}
      ${
        hasContent
          ? `
        ${(fase.materi && fase.materi.length) ? `<ul class="materi-list">${fase.materi.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}</ul>` : ""}
        <div class="detail-body">${renderMarkdown(fase.konten || "")}</div>
      `
          : `<div class="empty-note">Materi untuk fase ini belum diisi. Tambahkan melalui panel admin di /admin.</div>`
      }
    </div>
  `;
  document.getElementById("back-btn").addEventListener("click", () => showDomain(domainKey));
}

function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ===== Build sidebar menu =====
function buildMenu() {
  const items = [
    { key: "home", label: "Home" },
    ...DOMAINS.map((d) => ({ key: d.key, label: d.label, color: d.color })),
    { key: "about", label: "About" },
  ];
  items.forEach((item) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "menu-item";
    btn.dataset.key = item.key;
    if (item.color) btn.style.setProperty("--dot", item.color);
    btn.innerHTML = `<span class="menu-dot"></span>${escapeHtml(item.label)}`;
    btn.addEventListener("click", () => navigate(item.key));
    li.appendChild(btn);
    menuList.appendChild(li);
  });
}

function navigate(key) {
  location.hash = key;
}

function route() {
  const key = (location.hash || "#home").slice(1);
  if (key === "home") return showHome();
  if (key === "about") return showAbout();
  if (domainByKey(key)) return showDomain(key);
  return showHome();
}

window.addEventListener("hashchange", route);
buildMenu();
route();
