import {
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  collection,
  getDocs,
  getDoc,
  doc
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
const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
const searchInputMobile = document.getElementById("searchInputMobile");
const searchResults = document.getElementById("searchResults");
const searchResultsMobile = document.getElementById("searchResultsMobile");
const sortSelect = document.getElementById("sortSelect");
const cartCountMobile = document.getElementById("cartCountMobile");
const cartCountFloat = document.getElementById("cartCountFloat");
const bottomSearch = document.getElementById("bottomSearch");
const bottomProfile = document.getElementById("bottomProfile");
const mobileSearchPanel = document.getElementById("mobileSearchPanel");
const closeMobileSearch = document.getElementById("closeMobileSearch");
const floatSearch = document.getElementById("floatSearch");
const floatProfile = document.getElementById("floatProfile");
const latestStrip = document.getElementById("latestStrip");
const authBtnMobile = document.getElementById("authBtnMobile");
const userEmailMobile = document.getElementById("userEmailMobile");
const toAdminMobile = document.getElementById("toAdminMobile");
const profileLink = document.getElementById("profileLink");
const profileLinkMobile = document.getElementById("profileLinkMobile");
let isAdminUser = false;

let authMode = "login";
let productsBase = [];
let products = [];
let sortMode = "default";
const fallbackImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop offset='0%' stop-color='%230ea5e9' stop-opacity='0.25'/%3E%3Cstop offset='100%' stop-color='%234f8bff' stop-opacity='0.55'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='%23050915'/%3E%3Crect x='60' y='60' width='680' height='480' rx='28' fill='url(%23g)' opacity='0.6'/%3E%3Ctext x='50%' y='50%' fill='%23e2e8f0' font-family='Arial, sans-serif' font-size='46' font-weight='700' text-anchor='middle'%3EPlaceholder imagine%3C/text%3E%3C/svg%3E";

const cartKey = "cart";
const formatPrice = value =>
  Number(value || 0).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

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
  if (cartCountMobile) cartCountMobile.textContent = total;
  if (cartCountFloat) cartCountFloat.textContent = total;
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
    const price = formatPrice(item.price);
    const imgSrc = item.img || fallbackImg;
    productsGrid.innerHTML += `
      <article class="product-card">
        ${item.tag ? `<span class="badge">${item.tag}</span>` : ""}
        <a href="product.html?id=${item.id}" class="block">
          <img class="product-img" src="${imgSrc}" alt="${item.name || "Produs"}" onerror="this.onerror=null;this.src='${fallbackImg}'">
        </a>
        <div class="p-5 space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm text-slate-400">${item.category || "IT"}</p>
              <a href="product.html?id=${item.id}" class="text-lg font-bold text-white leading-tight hover:text-blue-300 transition">${item.name || "Produs"}</a>
            </div>
            <div class="text-right">
              <p class="text-slate-400 text-xs">Pret</p>
              <p class="text-xl font-black text-blue-300">${price}</p>
            </div>
          </div>
          <button class="btn-primary w-full flex items-center justify-center gap-2" data-id="${item.id}">
            <i class="fa-solid fa-cart-plus"></i> Adauga in cos
          </button>
          <a class="btn-ghost w-full text-center block" href="product.html?id=${item.id}">Vezi detalii</a>
        </div>
      </article>
    `;
  });

  productsGrid.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });
}

function applySort(list) {
  const copy = [...list];
  if (sortMode === "asc") {
    return copy.sort((a, b) => (a.price || 0) - (b.price || 0));
  }
  if (sortMode === "desc") {
    return copy.sort((a, b) => (b.price || 0) - (a.price || 0));
  }
  if (sortMode === "recent") {
    return copy.reverse();
  }
  return copy;
}

async function loadProducts() {
  renderSkeleton();
  try {
    const snapshot = await getDocs(collection(db, "products"));
    productsBase = snapshot.docs.map(p => {
      const data = p.data() || {};
      return {
        id: p.id,
        name: data.name || data.title || "Produs",
        price: Number(data.price || 0),
        category: data.category || "IT",
        tag: data.tag || "",
        img: data.img || data.imageURL || data.imageUrl || ""
      };
    });
    products = applySort(productsBase);
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
  const filtered = productsBase.filter(p =>
    (p.name || "").toLowerCase().includes(t) ||
    (p.category || "").toLowerCase().includes(t)
  );
  return applySort(filtered);
}

function renderSearchResults(list, target) {
  if (!target) return;
  if (!list.length) {
    target.innerHTML = `<div class="text-slate-400 text-sm px-2 py-1">Nicio potrivire</div>`;
    target.classList.add("open");
    return;
  }

  target.innerHTML = list
    .slice(0, 6)
    .map(
      p => `
      <a class="search-item" href="product.html?id=${p.id}">
        <span>${p.name}</span>
        <span class="text-blue-300 font-bold text-sm">${formatPrice(p.price)}</span>
      </a>
    `
    )
    .join("");
  target.classList.add("open");
}

function handleSearch(term, target, renderList = true) {
  const t = term.trim().toLowerCase();
  if (!t) {
    target?.classList.remove("open");
    return applySort(productsBase);
  }
  const filtered = filterProducts(t);
  if (renderList) renderSearchResults(filtered, target);
  return filtered;
}

function pickRandom(arr, count) {
  const copy = [...arr];
  const res = [];
  while (copy.length && res.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    res.push(copy.splice(idx, 1)[0]);
  }
  return res;
}

function closeMobileNav() {
  mobileNav?.classList.remove("open");
}

function initMobileNav() {
  if (!menuToggle || !mobileNav) return;

  menuToggle.addEventListener("click", () => {
    const willOpen = !mobileNav.classList.contains("open");
    mobileNav.classList.toggle("open");
    if (willOpen) {
      mobileNav.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  mobileNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => closeMobileNav());
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) {
      closeMobileNav();
    }
  });

  document.addEventListener("click", e => {
    if (!mobileNav.classList.contains("open")) return;
    const target = e.target;
    if (target === menuToggle || menuToggle.contains(target)) return;
    if (mobileNav.contains(target)) return;
    closeMobileNav();
  });
}

function setAdminVisibility(isAdmin) {
  [toAdmin, toAdminMobile].forEach(btn => {
    if (!btn) return;
    btn.classList.toggle("hidden", !isAdmin);
  });
  const footerAdmin = document.getElementById("footerAdmin");
  if (footerAdmin) footerAdmin.classList.toggle("hidden", !isAdmin);
}

function setProfileVisibility(show) {
  [profileLink, profileLinkMobile, floatProfile].forEach(link => {
    if (!link) return;
    link.classList.toggle("hidden", !show);
  });
}

async function resolveAdmin(user) {
  if (!user) return false;
  try {
    const snap = await getDoc(doc(db, "admins", user.uid));
    if (snap.exists() && (snap.data()?.role || "").toLowerCase() === "admin") {
      return true;
    }
    return false;
  } catch (err) {
    console.error("Nu pot verifica rolul admin", err);
    return false;
  }
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
  tabLogin?.addEventListener("click", () => openAuth("login"));
  tabRegister?.addEventListener("click", () => openAuth("register"));
  authBtn?.addEventListener("click", () => openAuth("login"));
  authBtnMobile?.addEventListener("click", () => openAuth("login"));
  closeAuth?.addEventListener("click", closeAuthModal);

  submitAuth?.addEventListener("click", async () => {
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

  onAuthStateChanged(auth, async user => {
    isAdminUser = await resolveAdmin(user);
    if (user) {
      if (userEmail) userEmail.textContent = user.email;
      if (userEmailMobile) userEmailMobile.textContent = user.email;
      setProfileVisibility(true);
    } else {
      if (userEmail) userEmail.textContent = "Conecteaza-te";
      if (userEmailMobile) userEmailMobile.textContent = "Profil";
      setProfileVisibility(false);
    }

    const setAuthButton = btn => {
      if (!btn) return;
      if (user) {
        btn.textContent = "Logout";
        btn.onclick = async () => {
          await signOut(auth);
          showToast("Delogat");
          closeMobileNav();
          setAdminVisibility(false);
          setProfileVisibility(false);
        };
      } else {
        btn.textContent = "Autentificare";
        btn.onclick = () => {
          openAuth("login");
          closeMobileNav();
          setAdminVisibility(false);
          setProfileVisibility(false);
        };
      }
    };

    setAuthButton(authBtn);
    setAuthButton(authBtnMobile);
    setAdminVisibility(isAdminUser);
  });
}

function initSearch() {
  const onInputDesktop = e => {
    const filtered = handleSearch(e.target.value, searchResults, true);
    renderProducts(filtered);
  };
  const onInputMobile = e => {
    const filtered = handleSearch(e.target.value, searchResultsMobile, true);
    renderProducts(filtered);
  };

  searchInput?.addEventListener("input", onInputDesktop);
  searchInputMobile?.addEventListener("input", onInputMobile);

  document.addEventListener("click", e => {
    if (searchResults && !searchResults.contains(e.target) && e.target !== searchInput) {
      searchResults.classList.remove("open");
    }
    if (searchResultsMobile && !searchResultsMobile.contains(e.target) && e.target !== searchInputMobile) {
      searchResultsMobile.classList.remove("open");
    }
  });
}

function initReload() {
  reloadBtn?.addEventListener("click", loadProducts);
}

function initNewsletter() {
  newsletterBtn?.addEventListener("click", () => showToast("Salvat (demo)"));
}

function initShortcuts() {
  [toAdmin, toAdminMobile].forEach(btn => {
    btn?.addEventListener("click", () => {
      window.location = "admin.html";
      closeMobileNav();
    });
  });
}

function initBottomNav() {
  bottomSearch?.addEventListener("click", () => {
    if (mobileSearchPanel) {
      mobileSearchPanel.classList.add("open");
      setTimeout(() => searchInputMobile?.focus(), 200);
    }
  });

  closeMobileSearch?.addEventListener("click", () => mobileSearchPanel?.classList.remove("open"));
  mobileSearchPanel?.addEventListener("click", e => {
    if (e.target === mobileSearchPanel) mobileSearchPanel.classList.remove("open");
  });

  floatSearch?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => searchInput?.focus(), 300);
  });
}

function renderLatestStrip(data) {
  return;
}

function initSort() {
  sortSelect?.addEventListener("change", e => {
    sortMode = e.target.value || "default";
    const term = (searchInput?.value || "").trim();
    const filtered = term ? handleSearch(term, null, false) : applySort(productsBase);
    renderProducts(filtered);
  });
}

function boot() {
  setAdminVisibility(false);
  setProfileVisibility(false);
  updateCartBadge();
  renderSkeleton();
  loadProducts();
  initAuth();
  initMobileNav();
  initSearch();
  initReload();
  initNewsletter();
  initShortcuts();
  initBottomNav();
  initSort();
}

boot();
