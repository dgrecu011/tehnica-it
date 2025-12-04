import { db, auth, addDoc, collection, doc, getDoc, serverTimestamp, onAuthStateChanged } from "./firebase.js";

const cartContainer = document.getElementById("cartContainer");
const totalPriceEl = document.getElementById("totalPrice");
const subtotalEl = document.getElementById("subtotal");
const discountRow = document.getElementById("discountRow");
const discountValueEl = document.getElementById("discountValue");
const checkoutBtn = document.getElementById("checkoutBtn");
const clearCartBtn = document.getElementById("clearCart");
const toast = document.getElementById("toast");
const voucherInput = document.getElementById("voucherInput");
const voucherBtn = document.getElementById("applyVoucher");
const voucherMessage = document.getElementById("voucherMessage");
const shippingName = document.getElementById("shippingName");
const shippingEmail = document.getElementById("shippingEmail");
const shippingPhone = document.getElementById("shippingPhone");
const shippingAddress = document.getElementById("shippingAddress");
const shippingNotes = document.getElementById("shippingNotes");

const cartKey = "cart";
let cartDetails = [];
let currentUser = null;
let currentSubtotal = 0;
let appliedVoucher = "";
let discountValue = 0;
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

function updateSummary(subtotal) {
  currentSubtotal = subtotal;
  const totalBefore = Math.max(subtotal, 0);
  const eligibleDiscount =
    appliedVoucher === "TECH10" ? Math.min(Math.round(totalBefore * 0.1), totalBefore) : 0;
  discountValue = totalBefore ? eligibleDiscount : 0;
  const totalAfter = Math.max(totalBefore - discountValue, 0);

  if (subtotalEl) subtotalEl.textContent = formatPrice(totalBefore);
  if (discountValueEl) discountValueEl.textContent = `-${formatPrice(discountValue)}`;
  discountRow?.classList.toggle("hidden", !discountValue);
  if (totalPriceEl) totalPriceEl.textContent = formatPrice(totalAfter);
}

function applyVoucher() {
  const code = (voucherInput?.value || "").trim().toUpperCase();
  if (!code) {
    voucherMessage.textContent = "Introdu un cod pentru a aplica reducerea.";
    return;
  }
  if (code === "TECH10") {
    appliedVoucher = code;
    voucherMessage.textContent = "Reducere de 10% aplicata pe subtotal.";
    updateSummary(currentSubtotal);
    return;
  }
  appliedVoucher = "";
  discountValue = 0;
  voucherMessage.textContent = "Cod invalid sau expirat.";
  updateSummary(currentSubtotal);
}

async function loadCart() {
  const cart = normalizeCart();
  cartContainer.innerHTML = "";
  cartDetails = [];

  if (!cart.length) {
    cartContainer.innerHTML = `<div class="text-center text-slate-400 py-10">Cosul este gol.</div>`;
    updateSummary(0);
    return;
  }

  let total = 0;

  for (const item of cart) {
    const ref = doc(db, "products", item.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) continue;

    const raw = snap.data() || {};
    const data = {
      name: raw.name || raw.title || "Produs",
      category: raw.category || "Produs",
      img: raw.img || raw.imageURL || raw.imageUrl || "",
      price: Number(raw.price || 0)
    };
    const price = data.price;
    const lineTotal = price * (item.qty || 1);
    total += lineTotal;

    const detail = {
      id: item.id,
      name: data.name,
      price,
      qty: item.qty || 1,
      category: data.category,
      img: data.img
    };
    cartDetails.push(detail);

    cartContainer.innerHTML += `
      <div class="product-card flex gap-4 p-4 items-center">
        <img src="${data.img}" class="w-28 h-28 object-cover rounded-xl border border-white/10" alt="${data.name}">
        <div class="flex-1">
          <p class="text-sm text-slate-400">${data.category || "Produs"}</p>
          <h3 class="text-lg font-bold text-white">${data.name}</h3>
          <p class="text-blue-300 font-black">${formatPrice(price)}</p>
          <div class="flex items-center gap-2 mt-2">
            <button class="btn-ghost px-3" data-dec="${item.id}">-</button>
            <span class="pill">${item.qty || 1} buc</span>
            <button class="btn-ghost px-3" data-inc="${item.id}">+</button>
          </div>
        </div>
        <div class="text-right">
          <p class="text-slate-400 text-sm">Total</p>
          <p class="font-bold text-white">${formatPrice(lineTotal)}</p>
          <button class="btn-ghost mt-2" data-remove="${item.id}">Sterge</button>
        </div>
      </div>
    `;
  }

  updateSummary(total);

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

function getPaymentMethod() {
  const checked = document.querySelector("input[name='paymentMethod']:checked");
  return checked?.value || "card";
}

function getDeliveryData() {
  return {
    name: shippingName?.value.trim() || "",
    email: shippingEmail?.value.trim() || "",
    phone: shippingPhone?.value.trim() || "",
    address: shippingAddress?.value.trim() || "",
    notes: shippingNotes?.value.trim() || ""
  };
}

function validateDelivery() {
  const data = getDeliveryData();
  if (!data.name || !data.email || !data.phone || !data.address) {
    showToast("Completeaza nume, email, telefon si adresa");
    return null;
  }
  if (!data.email.includes("@") || data.email.length < 6) {
    showToast("Email invalid");
    return null;
  }
  if (data.phone.replace(/\D/g, "").length < 9) {
    showToast("Telefon invalid");
    return null;
  }
  return data;
}

async function checkout() {
  if (!cartDetails.length) {
    showToast("Cosul este gol");
    return;
  }
  const delivery = validateDelivery();
  if (!delivery) return;
  const totalBefore = cartDetails.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = Math.max(totalBefore - discountValue, 0);
  checkoutBtn.disabled = true;
  try {
    const orderRef = await addDoc(collection(db, "orders"), {
      items: cartDetails,
      total,
      subtotal: totalBefore,
      discount: discountValue,
      discountCode: appliedVoucher || "",
      status: "new",
      createdAt: serverTimestamp(),
      name: delivery.name || currentUser?.displayName || currentUser?.email || "Guest",
      email: delivery.email || currentUser?.email || "",
      phone: delivery.phone,
      address: delivery.address,
      notes: delivery.notes,
      paymentMethod: getPaymentMethod(),
      userId: currentUser?.uid || ""
    });
    await addDoc(collection(db, "notifications"), {
      audience: "user",
      userId: currentUser?.uid || "",
      email: (delivery.email || currentUser?.email || "").toLowerCase(),
      message: "Comanda plasata. Multumim!",
      link: "order.html",
      createdAt: serverTimestamp()
    });
    await addDoc(collection(db, "notifications"), {
      audience: "admin",
      message: `Comanda noua: ${orderRef.id.slice(0, 6)}`,
      link: "admin.html#ordersSection",
      createdAt: serverTimestamp()
    });
    showToast("Comanda plasata");
    clearCart();
    setTimeout(() => (window.location = "index.html"), 600);
  } catch (err) {
    console.error("Nu pot salva comanda", err);
    showToast("Eroare la checkout");
  } finally {
    checkoutBtn.disabled = false;
  }
}

function boot() {
  loadCart();
  onAuthStateChanged(auth, user => {
    currentUser = user;
    if (user?.displayName && shippingName && !shippingName.value) shippingName.value = user.displayName;
    if (user?.email && shippingEmail && !shippingEmail.value) shippingEmail.value = user.email;
    if (user?.phoneNumber && shippingPhone && !shippingPhone.value) shippingPhone.value = user.phoneNumber;
  });
  checkoutBtn.addEventListener("click", checkout);
  clearCartBtn.addEventListener("click", clearCart);
  voucherBtn?.addEventListener("click", applyVoucher);
  voucherInput?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyVoucher();
    }
  });
}

boot();
