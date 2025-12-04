import { db, doc, getDoc } from "./firebase.js";

const productContainer = document.getElementById("productContainer");
const cartCount = document.getElementById("cartCount");
const toast = document.getElementById("toast");
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

function showToast(message) {
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 2200);
}

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
  if (!cartCount) return;
  cartCount.textContent = total;
  cartCount.style.display = total ? "inline-flex" : "none";
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

function renderProduct(data, id) {
  const price = formatPrice(data.price);
  const imgSrc = data.img || fallbackImg;
  const stockLabel =
    typeof data.stock === "number" ? (data.stock > 0 ? "In stoc" : "Stoc epuizat") : "Disponibilitate la cerere";
  const stockTone = data.stock > 0 ? "text-green-400" : "text-amber-300";
  const perks = [
    { icon: "shield-halved", text: "Garantie 24 luni si retur 14 zile" },
    { icon: "truck-fast", text: "Livrare rapida 24-48h, oriunde in tara" },
    { icon: "headset", text: "Consultanta tehnica la configurare" }
  ];
  productContainer.innerHTML = `
    <div class="grid md:grid-cols-2 gap-6 lg:gap-8 items-start product-hero">
      <div class="glass p-3 relative overflow-hidden">
        <div class="absolute inset-0 pointer-events-none bg-gradient-radial"></div>
        <img src="${imgSrc}" alt="${data.name}" class="product-main-img" onerror="this.onerror=null;this.src='${fallbackImg}'">
        <div class="product-tags">
          ${data.tag ? `<span class="pill pill-ghost">${data.tag}</span>` : ""}
          <span class="pill pill-ghost">${data.category || "Produs"}</span>
          <span class="pill pill-ghost ${stockTone}">${stockLabel}</span>
        </div>
      </div>
      <div class="space-y-4">
        <div class="flex items-center gap-3 flex-wrap">
          <div class="brand-mark">TS</div>
          <div>
            <p class="text-sm text-slate-400">Cod produs: <span class="text-white font-semibold">${id.slice(0, 8)}</span></p>
            <h1 class="text-3xl font-black text-white leading-tight">${data.name}</h1>
          </div>
        </div>
        <p class="text-slate-300 leading-relaxed">${data.description || "Nu exista descriere pentru acest produs."}</p>

        <div class="price-card">
          <div>
            <p class="text-sm text-slate-400">Pret</p>
            <p class="text-3xl font-black text-blue-300">${price}</p>
            <p class="text-xs text-slate-400">TVA inclus • curs EUR oficial</p>
          </div>
          <div class="text-sm text-slate-300 space-y-1">
            <p class="flex items-center gap-2"><i class="fa-solid fa-truck-fast text-blue-300"></i> Livrare gratuita peste 300 EUR</p>
            <p class="flex items-center gap-2"><i class="fa-solid fa-rotate-left text-blue-300"></i> Retur 14 zile</p>
            <p class="flex items-center gap-2"><i class="fa-solid fa-clock text-blue-300"></i> Expediere in 24-48h</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <button id="addToCartBtn" class="btn-primary flex items-center gap-2">
            <i class="fa-solid fa-cart-plus"></i> Adauga in cos
          </button>
          <a href="index.html#produse" class="btn-ghost inline-flex items-center gap-2">
            <i class="fa-solid fa-arrow-left"></i> Inapoi la produse
          </a>
        </div>

        <ul class="list-check">
          ${perks.map(p => `<li><i class="fa-solid fa-${p.icon}"></i>${p.text}</li>`).join("")}
        </ul>

        <div class="spec-grid">
          <div class="info-card">
            <p class="text-slate-400 text-sm">Categorie</p>
            <p class="text-white font-semibold">${data.category || "Produs"}</p>
          </div>
          <div class="info-card">
            <p class="text-slate-400 text-sm">Disponibilitate</p>
            <p class="text-white font-semibold">${stockLabel}</p>
          </div>
          <div class="info-card">
            <p class="text-slate-400 text-sm">Livrare</p>
            <p class="text-white font-semibold">24-48h, curier rapid</p>
          </div>
          <div class="info-card">
            <p class="text-slate-400 text-sm">Suport</p>
            <p class="text-white font-semibold">Consultanta gratuita</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("addToCartBtn")?.addEventListener("click", () => addToCart(id));
}

async function loadProduct() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    productContainer.innerHTML = `<div class="text-center text-slate-400">Produsul nu a fost gasit.</div>`;
    return;
  }

  productContainer.innerHTML = `<div class="text-center text-slate-400">Se incarca produsul...</div>`;
  try {
    const snap = await getDoc(doc(db, "products", id));
    if (!snap.exists()) {
      productContainer.innerHTML = `<div class="text-center text-slate-400">Produsul nu exista.</div>`;
      return;
    }
    const raw = snap.data() || {};
    const data = {
      name: raw.name || raw.title || "Produs",
      description: raw.description || "",
      category: raw.category || "Produs",
      img: raw.img || raw.imageURL || raw.imageUrl || "",
      price: Number(raw.price || 0),
      tag: raw.tag || "",
      stock: raw.stock
    };
    renderProduct(data, id);
  } catch (err) {
    console.error("Nu pot incarca produsul", err);
    productContainer.innerHTML = `<div class="text-center text-slate-400">Eroare la incarcarea produsului.</div>`;
  }
}

function boot() {
  updateCartBadge();
  loadProduct();
}

boot();
