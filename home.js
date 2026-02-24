const btn = document.getElementById("toggleHomeTheme");
const toast = document.getElementById("toast");

function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast.t);
  showToast.t = setTimeout(()=>toast.classList.remove("show"), 1400);
}

function setTheme(mode){
  document.body.classList.toggle("light", mode === "light");
  localStorage.setItem("home_theme", mode);
  btn.textContent = mode === "light" ? "🌙 Mode sombre" : "☀️ Mode clair";
}

setTheme(localStorage.getItem("home_theme") || "dark");
btn.addEventListener("click", () => {
  const isLight = document.body.classList.contains("light");
  setTheme(isLight ? "dark" : "light");
});

document.getElementById("cardCancer").addEventListener("mouseenter", ()=>showToast("Ouvrir le projet : Cancer 🧬"));
document.getElementById("cardTabac").addEventListener("mouseenter", ()=>showToast("Ouvrir le projet : Tabac 🚬"));