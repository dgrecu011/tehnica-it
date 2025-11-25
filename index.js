import {
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  collection,
  getDocs
} from "./firebase.js";

const productsGrid = document.getElementById("productsGrid");
const cartCount = document.getElementById("cartCount");
const toast = document.getElementById("toast");
const searchInput = document.getElementById("searchInput");
const reloadBtn = document.getElementById("reloadProducts");
const authBtn = document.getElementById("authBtn");
const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const submitAuth = document.getElementById("submitAuth");
const authEmail = document.getElementById("authEmail");
const authPass = document.getElementById("authPass");
const userEmail = document.getElementById("userEmail");
const toAdmin = document.getElementById("toAdmin");
const newsletterBtn = document.getElementById("newsletterBtn");

let authMode = "login";
let products = [];
const fallbackImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop offset='0%' stop-color='%230ea5e9' stop-opacity='0.25'/%3E%3Cstop offset='100%' stop-color='%234f8bff' stop-opacity='0.55'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='%23050915'/%3E%3Crect x='60' y='60' width='680' height='480' rx='28' fill='url(%23g)' opacity='0.6'/%3E%3Ctext x='50%' y='50%' fill='%23e2e8f0' font-family='Arial, sans-serif' font-size='46' font-weight='700' text-anchor='middle'%3EPlaceholder imagine%3C/text%3E%3C/svg%3E";

const cartKey = "cart";

function normalizeCart() {
  const raw = JSON.parse(localStorage.getItem(cartKey)) || [];
  if (raw.length && typeof raw[0] === "string") {
    return raw.map(id => ({ id, qty: 1 }));
  }
  return raw;
}

function saveCart(data) {
  localStorage.setItem(cartKey, JSON.stringify(data));
}

function updateCartBadge() {
  const cart = normalizeCart();
  const total = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  cartCount.textContent = total;
}

function showToast(message) {
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 2200);
}

function renderSkeleton() {
  productsGrid.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    productsGrid.innerHTML += `
      <div class="product-card p-5">
        <div class="skeleton product-img"></div>
        <div class="mt-4 space-y-3">
          <div class="skeleton h-4 w-2/3"></div>
          <div class="skeleton h-4 w-1/2"></div>
          <div class="skeleton h-10 w-full"></div>
        </div>
      </div>
    `;
  }
}

function renderProducts(list) {
  productsGrid.innerHTML = "";
  if (!list.length) {
    productsGrid.innerHTML = `<div class="glass p-6 text-center text-slate-400 col-span-full">Nu exista produse in Firestore inca. Adauga din admin.</div>`;
    return;
  }

  list.forEach(item => {
    const price = Number(item.price || 0).toLocaleString("ro-RO");
    const imgSrc = item.img || fallbackImg;
    productsGrid.innerHTML += `
      <article class="product-card">
        ${item.tag ? `<span class="badge">${item.tag}</span>` : ""}
        <img class="product-img" src="${imgSrc}" alt="${item.name || "Produs"}" onerror="this.onerror=null;this.src='${fallbackImg}'">
        <div class="p-5 space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm text-slate-400">${item.category || "IT"}</p>
              <h3 class="text-lg font-bold text-white leading-tight">${item.name || "Produs"}</h3>
            </div>
            <div class="text-right">
              <p class="text-slate-400 text-xs">Pret</p>
              <p class="text-xl font-black text-blue-300">${price} Lei</p>
            </div>
          </div>
          <button class="btn-primary w-full flex items-center justify-center gap-2" data-id="${item.id}">
            <i class="fa-solid fa-cart-plus"></i> Adauga in cos
          </button>
        </div>
      </article>
    `;
  });

  productsGrid.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });
}

async function loadProducts() {
  renderSkeleton();
  try {
    const snapshot = await getDocs(collection(db, "products"));
    products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderProducts(products);
  } catch (err) {
    console.error("Nu pot incarca produsele", err);
    showToast("Eroare la incarcarea produselor");
    renderProducts([]);
  }
}

function addToCart(id) {
  const cart = normalizeCart();
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ id, qty: 1 });
  }
  saveCart(cart);
  updateCartBadge();
  showToast("Produs adaugat in cos");
}

function filterProducts(term) {
  const t = term.toLowerCase();
  const filtered = products.filter(p =>
    (p.name || "").toLowerCase().includes(t) ||
    (p.category || "").toLowerCase().includes(t)
  );
  renderProducts(filtered);
}

function openAuth(mode) {
  authMode = mode;
  tabLogin.classList.toggle("btn-primary", mode === "login");
  tabLogin.classList.toggle("btn-ghost", mode !== "login");
  tabRegister.classList.toggle("btn-primary", mode === "register");
  tabRegister.classList.toggle("btn-ghost", mode !== "register");
  authModal.classList.add("open");
}

function closeAuthModal() {
  authModal.classList.remove("open");
}

function initAuth() {
  tabLogin.addEventListener("click", () => openAuth("login"));
  tabRegister.addEventListener("click", () => openAuth("register"));
  authBtn.addEventListener("click", () => openAuth("login"));
  closeAuth.addEventListener("click", closeAuthModal);

  submitAuth.addEventListener("click", async () => {
    const email = authEmail.value;
    const pass = authPass.value;
    if (!email || !pass) {
      showToast("Completeaza email si parola");
      return;
    }

    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, email, pass);
        showToast("Logat");
      } else {
        await createUserWithEmailAndPassword(auth, email, pass);
        showToast("Cont creat");
      }
      closeAuthModal();
    } catch (err) {
      console.error(err);
      showToast("Eroare la autentificare");
    }
  });

  onAuthStateChanged(auth, user => {
    if (user) {
      userEmail.textContent = user.email;
      authBtn.textContent = "Logout";
      authBtn.onclick = async () => {
        await signOut(auth);
        showToast("Delogat");
      };
    } else {
      userEmail.textContent = "Conecteaza-te";
      authBtn.textContent = "Autentificare";
      authBtn.onclick = () => openAuth("login");
    }
  });
}

function initSearch() {
  searchInput?.addEventListener("input", e => filterProducts(e.target.value));
}

function initReload() {
  reloadBtn?.addEventListener("click", loadProducts);
}

function initNewsletter() {
  newsletterBtn?.addEventListener("click", () => showToast("Salvat (demo)"));
}

function initShortcuts() {
  toAdmin?.addEventListener("click", () => (window.location = "admin.html"));
}

function boot() {
  updateCartBadge();
  renderSkeleton();
  loadProducts();
  initAuth();
  initSearch();
  initReload();
  initNewsletter();
  initShortcuts();
}

boot();
