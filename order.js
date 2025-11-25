import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const cartContainer = document.getElementById("cartContainer");
const totalPriceEl = document.getElementById("totalPrice");
const subtotalEl = document.getElementById("subtotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const clearCartBtn = document.getElementById("clearCart");
const toast = document.getElementById("toast");

const cartKey = "cart";

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

async function loadCart() {
  const cart = normalizeCart();
  cartContainer.innerHTML = "";

  if (!cart.length) {
    cartContainer.innerHTML = `<div class="text-center text-slate-400 py-10">Cosul este gol.</div>`;
    subtotalEl.textContent = "0 Lei";
    totalPriceEl.textContent = "0 Lei";
    return;
  }

  let total = 0;

  for (const item of cart) {
    const ref = doc(db, "products", item.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) continue;

    const data = snap.data();
    const price = Number(data.price || 0);
    const lineTotal = price * (item.qty || 1);
    total += lineTotal;

    cartContainer.innerHTML += `
      <div class="product-card flex gap-4 p-4 items-center">
        <img src="${data.img}" class="w-28 h-28 object-cover rounded-xl border border-white/10" alt="${data.name}">
        <div class="flex-1">
          <p class="text-sm text-slate-400">${data.category || "Produs"}</p>
          <h3 class="text-lg font-bold text-white">${data.name}</h3>
          <p class="text-blue-300 font-black">${price.toLocaleString("ro-RO")} Lei</p>
          <div class="flex items-center gap-2 mt-2">
            <button class="btn-ghost px-3" data-dec="${item.id}">-</button>
            <span class="pill">${item.qty || 1} buc</span>
            <button class="btn-ghost px-3" data-inc="${item.id}">+</button>
          </div>
        </div>
        <div class="text-right">
          <p class="text-slate-400 text-sm">Total</p>
          <p class="font-bold text-white">${lineTotal.toLocaleString("ro-RO")} Lei</p>
          <button class="btn-ghost mt-2" data-remove="${item.id}">Sterge</button>
        </div>
      </div>
    `;
  }

  subtotalEl.textContent = `${total.toLocaleString("ro-RO")} Lei`;
  totalPriceEl.textContent = `${total.toLocaleString("ro-RO")} Lei`;

  cartContainer.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => removeItem(btn.dataset.remove));
  });

  cartContainer.querySelectorAll("[data-inc]").forEach(btn => {
    btn.addEventListener("click", () => changeQty(btn.dataset.inc, 1));
  });

  cartContainer.querySelectorAll("[data-dec]").forEach(btn => {
    btn.addEventListener("click", () => changeQty(btn.dataset.dec, -1));
  });
}

function removeItem(id) {
  const cart = normalizeCart().filter(item => item.id !== id);
  saveCart(cart);
  loadCart();
}

function changeQty(id, delta) {
  const cart = normalizeCart();
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty = Math.max(1, (item.qty || 1) + delta);
  saveCart(cart);
  loadCart();
}

function clearCart() {
  saveCart([]);
  loadCart();
}

function boot() {
  loadCart();
  checkoutBtn.addEventListener("click", () => showToast("Checkout demonstrativ"));
  clearCartBtn.addEventListener("click", clearCart);
}

boot();
