// ===== Helpers =====
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

// ===== Theme toggle (saved) =====
const themeBtn = $("#toggleTheme");
function setTheme(mode){
  document.body.classList.toggle("light", mode === "light");
  localStorage.setItem("theme", mode);
  themeBtn.textContent = mode === "light" ? "🌙 Mode sombre" : "☀️ Mode clair";
}
const savedTheme = localStorage.getItem("theme") || "dark";
setTheme(savedTheme);

themeBtn.addEventListener("click", () => {
  const isLight = document.body.classList.contains("light");
  setTheme(isLight ? "dark" : "light");
});

// ===== Scroll progress =====
const scrollBar = $("#scrollBar");
function updateScrollBar(){
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const p = max > 0 ? (doc.scrollTop / max) * 100 : 0;
  scrollBar.style.width = `${clamp(p, 0, 100)}%`;
}
document.addEventListener("scroll", updateScrollBar, { passive: true });
updateScrollBar();

// ===== Back to top =====
const toTop = $("#toTop");
function updateToTop(){
  const y = window.scrollY || document.documentElement.scrollTop;
  toTop.classList.toggle("show", y > 500);
}
document.addEventListener("scroll", updateToTop, { passive: true });
updateToTop();
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// ===== Toast =====
const toast = $("#toast");
let toastTimer = null;
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
}

// Clickable cards -> toast
$$(".clickable").forEach(el => {
  const msg = el.getAttribute("data-toast");
  if(!msg) return;
  el.addEventListener("click", () => showToast(msg));
});

// ===== Reveal on scroll =====
const revealEls = $$(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting) e.target.classList.add("in");
  });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

// ===== Active TOC link =====
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

// ===== Search (filter highlights) =====
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
  if(!term) return;
  const walker = document.createTreeWalker(contentRoot, NodeFilter.SHOW_TEXT, {
    acceptNode(node){
      if(!node.nodeValue) return NodeFilter.FILTER_REJECT;
      const v = node.nodeValue.trim();
      if(!v) return NodeFilter.FILTER_REJECT;
      // ignore if inside script/style
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
    // collect <mark>
    span.querySelectorAll("mark").forEach(m => lastMarks.push(m));
  }

  if(lastMarks.length){
    lastMarks[0].scrollIntoView({ behavior: "smooth", block: "center" });
    showToast(`Trouvé: ${lastMarks.length} occurrence(s)`);
  } else {
    showToast("Aucun résultat");
  }
}

searchInput.addEventListener("input", () => {
  clearMarks();
  const term = searchInput.value.trim();
  if(term.length >= 2) markTerm(term);
});

// ===== Count-up stats =====
const counters = $$(".stat__num");
function animateCount(el){
  const target = Number(el.getAttribute("data-count")) || 0;
  const start = 0;
  const duration = 600;
  const t0 = performance.now();

  function tick(t){
    const p = clamp((t - t0) / duration, 0, 1);
    const val = Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3)));
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

// ===== Modal content =====
const modal = $("#modal");
const modalTitle = $("#modalTitle");
const modalBody = $("#modalBody");

const modalData = {
  chirurgie: {
    title: "Chirurgie (🔪)",
    body: `
      <p><strong>But :</strong> retirer la tumeur.</p>
      <ul>
        <li>Très efficace si la tumeur est localisée.</li>
        <li>Souvent combinée à chimio/radiothérapie.</li>
      </ul>
    `
  },
  radio: {
    title: "Radiothérapie (☢️)",
    body: `
      <p><strong>Principe :</strong> des rayons endommagent l’ADN des cellules tumorales.</p>
      <ul>
        <li>Agit localement sur une zone.</li>
        <li>Peut aussi toucher des tissus voisins.</li>
      </ul>
    `
  },
  chimio: {
    title: "Chimiothérapie (💊)",
    body: `
      <p><strong>Principe :</strong> médicaments qui ciblent surtout les cellules qui se divisent vite.</p>
      <ul>
        <li>Peut expliquer la chute de cheveux / fatigue.</li>
        <li>Objectif : tuer plus de cellules tumorales que saines.</li>
      </ul>
    `
  },
  ciblee: {
    title: "Thérapies ciblées (🎯)",
    body: `
      <p><strong>Principe :</strong> viser une protéine ou mutation spécifique de la tumeur.</p>
      <ul>
        <li>Souvent moins toxique que certaines chimios.</li>
        <li>Nécessite de connaître le profil de la tumeur.</li>
      </ul>
    `
  },
  immuno: {
    title: "Immunothérapie (🛡️)",
    body: `
      <p><strong>Principe :</strong> aider le système immunitaire à reconnaître/attaquer la tumeur.</p>
      <ul>
        <li>Très efficace pour certains cancers.</li>
        <li>Pas identique pour tous : dépend du type de tumeur.</li>
      </ul>
    `
  },
  schema: {
    title: "Mini schéma : ADN → Cancer",
    body: `
      <div style="display:grid; gap:10px;">
        <div style="padding:12px;border:1px solid var(--border);border-radius:16px;background:var(--card)">
          <strong>ADN</strong> (information génétique) → <strong>gènes</strong> → <strong>protéines</strong>
        </div>
        <div style="padding:12px;border:1px solid var(--border);border-radius:16px;background:var(--card)">
          Si mutation sur gènes du <strong>cycle cellulaire</strong> :
          frein cassé / accélérateur bloqué → <strong>division incontrôlée</strong>
        </div>
        <div style="padding:12px;border:1px solid var(--border);border-radius:16px;background:var(--card)">
          → <strong>tumeur</strong> → parfois <strong>métastases</strong>
        </div>
      </div>
    `
  }
};

function openModal(key){
  const d = modalData[key];
  if(!d) return;
  modalTitle.textContent = d.title;
  modalBody.innerHTML = d.body;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}
function closeModal(){
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

$$("[data-modal]").forEach(btn => {
  btn.addEventListener("click", () => openModal(btn.getAttribute("data-modal")));
});
$("#openCheat").addEventListener("click", () => openModal("schema"));
$$("[data-close]").forEach(el => el.addEventListener("click", closeModal));
document.addEventListener("keydown", (e) => {
  if(e.key === "Escape" && modal.classList.contains("open")) closeModal();
});

// ===== Quiz =====
const quizRoot = $("#quizRoot");
const quizScore = $("#quizScore");
const btnCheck = $("#btnCheckQuiz");
const btnReset = $("#btnResetQuiz");

const quiz = [
  {
    q: "Le cancer est surtout…",
    a: [
      "Une infection due à une bactérie",
      "Une multiplication incontrôlée de cellules",
      "Une maladie qui touche uniquement le sang",
      "Un problème de digestion"
    ],
    correct: 1
  },
  {
    q: "Une mutation est…",
    a: ["Un sport", "Un changement dans l’ADN", "Une vitamine", "Un organe"],
    correct: 1
  },
  {
    q: "Les métastases correspondent à…",
    a: [
      "Une guérison complète",
      "La propagation des cellules cancéreuses vers d’autres organes",
      "La réparation de l’ADN",
      "La production d’hormones"
    ],
    correct: 1
  },
  {
    q: "Pourquoi ne peut-on pas stopper toutes les divisions cellulaires dans le corps ?",
    a: [
      "Parce que la peau, le sang et l’intestin doivent se renouveler",
      "Parce que l’ADN disparaît",
      "Parce que les cellules deviennent invisibles",
      "Parce que les virus l’empêchent"
    ],
    correct: 0
  },
  {
    q: "L’immunothérapie vise à…",
    a: [
      "Remplacer le sang",
      "Aider le système immunitaire à attaquer la tumeur",
      "Augmenter les UV",
      "Arrêter le cœur"
    ],
    correct: 1
  }
];

function renderQuiz(){
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

  quizScore.textContent = "";
}

function checkQuiz(){
  let score = 0;
  $$(".qcard").forEach(card => {
    const idx = Number(card.getAttribute("data-q"));
    const chosen = card.querySelector("input[type=radio]:checked");
    const correct = quiz[idx].correct;

    // reset border
    card.style.borderColor = "var(--border)";

    if(!chosen) return;

    const val = Number(chosen.value);
    if(val === correct){
      score++;
      card.style.borderColor = "rgba(66,245,164,0.65)";
    } else {
      card.style.borderColor = "rgba(255,107,138,0.65)";
    }
  });

  quizScore.textContent = `Score : ${score} / ${quiz.length}`;
  showToast("Quiz corrigé ✅");
}

function resetQuiz(){
  renderQuiz();
  showToast("Quiz réinitialisé");
}

btnCheck.addEventListener("click", checkQuiz);
btnReset.addEventListener("click", resetQuiz);
renderQuiz();