// =============================
// TABAC - Interactive Script
// (same interactivity, different content + theme storage)
// =============================
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// ===== Theme toggle (saved) =====
const themeBtn = $("#toggleTheme");
function setTheme(mode){
  document.body.classList.toggle("light", mode === "light");
  localStorage.setItem("tabac_theme", mode);
  if(themeBtn) themeBtn.textContent = mode === "light" ? "🌙 Mode sombre" : "☀️ Mode clair";
}
setTheme(localStorage.getItem("tabac_theme") || "dark");
themeBtn?.addEventListener("click", () => {
  const isLight = document.body.classList.contains("light");
  setTheme(isLight ? "dark" : "light");
});

// ===== Scroll progress =====
const scrollBar = $("#scrollBar");
function updateScrollBar(){
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const p = max > 0 ? (doc.scrollTop / max) * 100 : 0;
  if(scrollBar) scrollBar.style.width = `${clamp(p, 0, 100)}%`;
}
document.addEventListener("scroll", updateScrollBar, { passive: true });
updateScrollBar();

// ===== Back to top =====
const toTop = $("#toTop");
function updateToTop(){
  const y = window.scrollY || document.documentElement.scrollTop;
  toTop?.classList.toggle("show", y > 500);
}
document.addEventListener("scroll", updateToTop, { passive: true });
updateToTop();
toTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// ===== Toast =====
const toast = $("#toast");
let toastTimer = null;
function showToast(msg){
  if(!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
}
$$(".clickable").forEach(el => {
  const msg = el.getAttribute("data-toast");
  if(!msg) return;
  el.addEventListener("click", () => showToast(msg));
});

// ===== Reveal =====
const revealEls = $$(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting) e.target.classList.add("in");
  });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

// ===== Active TOC =====
const tocLinks = $$("#toc a[data-section]");
const sections = tocLinks
  .map(a => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

const spy = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(!e.isIntersecting) return;
    const id = `#${e.target.id}`;
    tocLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === id));
  });
}, { rootMargin: "-40% 0px -55% 0px", threshold: 0.01 });

sections.forEach(s => spy.observe(s));

// ===== Search highlight =====
const searchInput = $("#searchInput");
const contentRoot = $("#contentRoot");
let lastMarks = [];

function clearMarks(){
  lastMarks.forEach(m => {
    const parent = m.parentNode;
    if(!parent) return;
    parent.replaceChild(document.createTextNode(m.textContent), m);
    parent.normalize();
  });
  lastMarks = [];
}

function markTerm(term){
  if(!term || !contentRoot) return;

  const walker = document.createTreeWalker(contentRoot, NodeFilter.SHOW_TEXT, {
    acceptNode(node){
      if(!node.nodeValue) return NodeFilter.FILTER_REJECT;
      const v = node.nodeValue.trim();
      if(!v) return NodeFilter.FILTER_REJECT;
      const p = node.parentElement;
      if(!p) return NodeFilter.FILTER_REJECT;
      const tag = p.tagName?.toLowerCase();
      if(["script","style","input","textarea"].includes(tag)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  let node;

  while((node = walker.nextNode())){
    if(!re.test(node.nodeValue)) continue;
    const span = document.createElement("span");
    span.innerHTML = node.nodeValue.replace(re, m => `<mark>${m}</mark>`);
    node.parentNode.replaceChild(span, node);
    span.querySelectorAll("mark").forEach(m => lastMarks.push(m));
  }

  if(lastMarks.length){
    lastMarks[0].scrollIntoView({ behavior: "smooth", block: "center" });
    showToast(`Trouvé : ${lastMarks.length} occurrence(s)`);
  } else {
    showToast("Aucun résultat");
  }
}

searchInput?.addEventListener("input", () => {
  clearMarks();
  const term = searchInput.value.trim();
  if(term.length >= 2) markTerm(term);
});

// ===== Count-up stats =====
const counters = $$(".stat__num");
function animateCount(el){
  const target = Number(el.getAttribute("data-count")) || 0;
  const duration = 650;
  const t0 = performance.now();

  function tick(t){
    const p = clamp((t - t0) / duration, 0, 1);
    const val = Math.round(target * (1 - Math.pow(1 - p, 3)));
    el.textContent = val;
    if(p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const counterIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting){
      animateCount(e.target);
      counterIO.unobserve(e.target);
    }
  });
}, { threshold: 0.6 });
counters.forEach(c => counterIO.observe(c));

// ===== Modal =====
const modal = $("#modal");
const modalTitle = $("#modalTitle");
const modalBody = $("#modalBody");

const modalData = {
  poumon: {
    title: "Poumons (🫁)",
    body: `
      <p>La fumée arrive directement dans les poumons.</p>
      <ul>
        <li>Mutagènes + inflammation → mutations.</li>
        <li>Risque augmenté de cancer du poumon.</li>
      </ul>
    `
  },
  gorge: {
    title: "Bouche / Gorge (👄)",
    body: `
      <p>Les muqueuses sont en contact avec la fumée.</p>
      <ul>
        <li>Irritation chronique.</li>
        <li>Substances cancérigènes → dommages ADN.</li>
      </ul>
    `
  },
  coeur: {
    title: "Cœur / Vaisseaux (❤️)",
    body: `
      <p>Le tabac n'affecte pas seulement l’ADN : il augmente aussi les risques cardio-vasculaires.</p>
      <ul>
        <li>Monoxyde de carbone : moins d’oxygène dans le sang.</li>
        <li>Inflammation + effet sur les vaisseaux.</li>
      </ul>
    `
  },
  danger: {
    title: "Pourquoi c’est dangereux ? (🧯)",
    body: `
      <div style="display:grid; gap:10px;">
        <div style="padding:12px;border:1px solid var(--border);border-radius:16px;background:var(--card)">
          <strong>Tabac</strong> → substances <strong>mutagènes</strong>
        </div>
        <div style="padding:12px;border:1px solid var(--border);border-radius:16px;background:var(--card)">
          Mutagènes → <strong>dommages à l’ADN</strong> (adduits, cassures, stress oxydatif)
        </div>
        <div style="padding:12px;border:1px solid var(--border);border-radius:16px;background:var(--card)">
          Dommages → erreurs de copie → <strong>mutations</strong> → risque de <strong>cancer</strong>
        </div>
      </div>
    `
  }
};

function openModal(key){
  const d = modalData[key];
  if(!d || !modal) return;
  modalTitle.textContent = d.title;
  modalBody.innerHTML = d.body;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}
function closeModal(){
  if(!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

$$("[data-modal]").forEach(btn => {
  btn.addEventListener("click", () => openModal(btn.getAttribute("data-modal")));
});
$("#openCheat")?.addEventListener("click", () => openModal("danger"));
$$("[data-close]").forEach(el => el.addEventListener("click", closeModal));
document.addEventListener("keydown", (e) => {
  if(e.key === "Escape" && modal?.classList.contains("open")) closeModal();
});

// ===== Quiz =====
const quizRoot = $("#quizRoot");
const quizScore = $("#quizScore");
const btnCheck = $("#btnCheckQuiz");
const btnReset = $("#btnResetQuiz");

const quiz = [
  {
    q: "La nicotine est surtout…",
    a: ["Une substance cancérigène principale", "Responsable de la dépendance", "Un type de goudron", "Une vitamine"],
    correct: 1
  },
  {
    q: "Un mutagène est…",
    a: ["Une substance qui augmente les mutations", "Une cellule du sang", "Un organe", "Un vaccin"],
    correct: 0
  },
  {
    q: "Le tabac peut endommager l’ADN par…",
    a: ["Adduits à l’ADN et stress oxydatif", "Augmentation de la taille des chromosomes", "Réparation parfaite", "Aucune action"],
    correct: 0
  },
  {
    q: "Pourquoi le tabac augmente le risque de cancer ?",
    a: ["Il diminue la température du corps", "Il favorise mutations + dérèglement du cycle cellulaire", "Il augmente la vitamine C", "Il empêche les divisions"],
    correct: 1
  },
  {
    q: "Arrêter de fumer…",
    a: ["Ne change rien", "Réduit progressivement les risques", "Augmente les mutations", "Crée des métastases"],
    correct: 1
  }
];

function renderQuiz(){
  if(!quizRoot) return;
  quizRoot.innerHTML = quiz.map((item, idx) => {
    const answers = item.a.map((txt, j) => `
      <label class="answer">
        <input type="radio" name="q${idx}" value="${j}">
        <span>${txt}</span>
      </label>
    `).join("");

    return `
      <div class="qcard" data-q="${idx}">
        <p class="qcard__q">${idx + 1}. ${item.q}</p>
        <div class="answers">${answers}</div>
      </div>
    `;
  }).join("");
  if(quizScore) quizScore.textContent = "";
}

function checkQuiz(){
  let score = 0;
  $$(".qcard").forEach(card => {
    const idx = Number(card.getAttribute("data-q"));
    const chosen = card.querySelector("input[type=radio]:checked");
    const correct = quiz[idx].correct;

    card.style.borderColor = "var(--border)";
    if(!chosen) return;

    const val = Number(chosen.value);
    if(val === correct){
      score++;
      card.style.borderColor = "rgba(46,246,164,0.65)";
    } else {
      card.style.borderColor = "rgba(255,77,77,0.70)";
    }
  });

  if(quizScore) quizScore.textContent = `Score : ${score} / ${quiz.length}`;
  showToast("Quiz corrigé ✅");
}

function resetQuiz(){
  renderQuiz();
  showToast("Quiz réinitialisé");
}

btnCheck?.addEventListener("click", checkQuiz);
btnReset?.addEventListener("click", resetQuiz);
renderQuiz();