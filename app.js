/* ==========================================================
   IMPORTURI FIREBASE
========================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

/* ==========================================================
   CONFIG FIREBASE
========================================================== */
const firebaseConfig = {
  apiKey: "AIzaSyAKe4zLHem2_1LSOkTc4StNVqJJFCB9_Uc",
  authDomain: "it-store-2da3a.firebaseapp.com",
  projectId: "it-store-2da3a",
  storageBucket: "it-store-2da3a.appspot.com",
  messagingSenderId: "639717223245",
  appId: "1:639717223245:web:45c9fc6204e66a1abd2504",
  measurementId: "G-MXR3K43CHM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ==========================================================
   ELEMENTE DOM
========================================================== */
const productsEl = document.getElementById("products");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");
const minPriceInput = document.getElementById("minPrice");
const maxPriceInput = document.getElementById("maxPrice");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const profileLink = document.getElementById("profileLink");
const adminLink = document.getElementById("adminLink");

const cartBtn = document.getElementById("cartBtn");
const cart = document.getElementById("cart");
const closeCart = document.getElementById("closeCart");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");

/* AUTH MODAL */
const authModal = document.getElementById("authModal");
const authClose = document.getElementById("authClose");
const authTitle = document.getElementById("authTitle");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerPassword2 = document.getElementById("registerPassword2");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");

/* CHECKOUT */
const checkoutModal = document.getElementById("checkoutModal");
const checkoutClose = document.getElementById("checkoutClose");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutSummaryEl = document.getElementById("checkoutSummary");
const checkoutTotalText = document.getElementById("checkoutTotalText");
const checkoutMessage = document.getElementById("checkoutMessage");
const checkoutSubmitBtn = document.getElementById("checkoutSubmitBtn");

const ckName = document.getElementById("ckName");
const ckEmail = document.getElementById("ckEmail");
const ckPhone = document.getElementById("ckPhone");
const ckCity = document.getElementById("ckCity");
const ckAddress = document.getElementById("ckAddress");
const ckDelivery = document.getElementById("ckDelivery");
const ckPayment = document.getElementById("ckPayment");
const ckNotes = document.getElementById("ckNotes");

const checkoutBtn = document.getElementById("checkoutBtn");

/* ---------------- BOTTOM NAV ---------------- */
const bottomPromoBtn = document.getElementById("bottomPromoBtn");
const bottomCatalogBtn = document.getElementById("bottomCatalogBtn");
const bottomCartBtn = document.getElementById("bottomCartBtn");
const bottomAccountBtn = document.getElementById("bottomAccountBtn");
const bottomMoreBtn = document.getElementById("bottomMoreBtn");

const moreSheet = document.getElementById("moreSheet");
const moreCloseBtn = document.getElementById("moreCloseBtn");
const moreAdminLink = document.getElementById("moreAdminLink");

/* ==========================================================
   STATE
========================================================== */
let allProducts = [];
let cartItems = [];
let isAdmin = false;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Restaurăm coșul */
const savedCart = localStorage.getItem("cartItems");
if (savedCart) {
  try {
    cartItems = JSON.parse(savedCart);
  } catch {
    cartItems = [];
  }
}

/* ==========================================================
   UI UTILS
========================================================== */
const openAuthModal = (mode = "login") => {
  authModal.classList.remove("hidden");

  if (mode === "login") {
    authTitle.textContent = "Logare";
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    tabLogin.classList.add("border-yellow-400", "text-white");
    tabRegister.classList.remove("border-yellow-400");
  } else {
    authTitle.textContent = "Înregistrare";
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    tabRegister.classList.add("border-yellow-400", "text-white");
    tabLogin.classList.remove("border-yellow-400");
  }
};

const closeAuthModal = () => authModal.classList.add("hidden");

/* ==========================================================
   RENDER PRODUSE
========================================================== */
const renderProduct = (product) => {
  const card = document.createElement("div");
  card.className = "product-card perspective";

  card.innerHTML = `
    <div class="product-card-inner">
      <div class="product-card-front p-3">
        <img src="${product.imageURL}" class="w-full h-48 rounded mb-3 object-cover">
        <h4 class="font-bold text-lg">${product.title}</h4>
        <p class="text-gray-400 mb-1">${product.price} €</p>
        <p class="text-xs text-gray-500">${product.category || ""}</p>
      </div>

      <div class="product-card-back p-3">
        <h4 class="font-bold mb-2">${product.title}</h4>
        <p class="text-gray-400 text-sm mb-2">${product.description || ""}</p>
        <button class="bg-yellow-400 text-black px-3 py-1 rounded add-to-cart">
          Adaugă în coș
        </button>
      </div>
    </div>
  `;

  card.querySelector(".add-to-cart").onclick = () => {
    cartItems.push(product);
    updateCart();
  };

  return card;
};

const populateCategoryFilter = () => {
  const current = categoryFilter.value;

  categoryFilter.innerHTML = `<option value="">Toate categoriile</option>`;

  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];

  categories.forEach((cat) => {
    const o = document.createElement("option");
    o.value = cat;
    o.textContent = cat;
    categoryFilter.appendChild(o);
  });

  if (categories.includes(current)) {
    categoryFilter.value = current;
  }
};

const loadProducts = async () => {
  const snap = await getDocs(collection(db, "products"));
  allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  populateCategoryFilter();
  renderProductList();
};

const renderProductList = () => {
  productsEl.innerHTML = "";
  let filtered = [...allProducts];

  if (searchInput.value) {
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(searchInput.value.toLowerCase())
    );
  }

  if (categoryFilter.value) {
    filtered = filtered.filter(p => p.category === categoryFilter.value);
  }

  if (minPriceInput.value) {
    filtered = filtered.filter(
      p => Number(p.price) >= Number(minPriceInput.value)
    );
  }

  if (maxPriceInput.value) {
    filtered = filtered.filter(
      p => Number(p.price) <= Number(maxPriceInput.value)
    );
  }

  if (sortFilter.value === "priceAsc") {
    filtered.sort((a, b) => Number(a.price) - Number(b.price));
  }
  if (sortFilter.value === "priceDesc") {
    filtered.sort((a, b) => Number(b.price) - Number(a.price));
  }

  if (!filtered.length) {
    productsEl.innerHTML =
      `<p class="text-center text-gray-400 col-span-full">Nu s-au găsit produse.</p>`;
    return;
  }

  filtered.forEach(p => productsEl.appendChild(renderProduct(p)));
};

/* ==========================================================
   COȘ
========================================================== */
const updateCart = () => {
  cartItemsEl.innerHTML = "";
  let total = 0;

  cartItems.forEach((p, i) => {
    const item = document.createElement("div");
    item.className = "flex justify-between items-center mb-2";

    item.innerHTML = `
      <div class="flex flex-col">
        <span>${p.title}</span>
        <span class="text-xs text-gray-400">${p.price} €</span>
      </div>
      <button class="text-red-400 text-sm" data-i="${i}">Șterge</button>
    `;

    item.querySelector("button").onclick = (e) => {
      const index = Number(e.target.getAttribute("data-i"));
      cartItems.splice(index, 1);
      updateCart();
    };

    cartItemsEl.appendChild(item);
    total += Number(p.price);
  });

  cartTotalEl.textContent = total.toFixed(2) + " €";
  cartCountEl.textContent = cartItems.length;

  localStorage.setItem("cartItems", JSON.stringify(cartItems));
};

const getCartSummary = () => {
  const map = {};
  cartItems.forEach(p => {
    const key = p.id || p.title;
    if (!map[key]) {
      map[key] = { title: p.title, price: Number(p.price), quantity: 0 };
    }
    map[key].quantity++;
  });
  return Object.values(map);
};

/* ==========================================================
   AUTH
========================================================== */
loginBtn.onclick = () => openAuthModal("login");
logoutBtn.onclick = () => signOut(auth);
authClose.onclick = closeAuthModal;
tabLogin.onclick = () => openAuthModal("login");
tabRegister.onclick = () => openAuthModal("register");

loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const pass = loginPassword.value.trim();

  if (!emailRegex.test(email)) return alert("Email invalid.");
  if (pass.length < 6) return alert("Parola minim 6 caractere.");

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    closeAuthModal();
  } catch (err) {
    alert("Eroare la logare: " + err.message);
  }
};

registerForm.onsubmit = async (e) => {
  e.preventDefault();

  const email = registerEmail.value.trim();
  const pass1 = registerPassword.value.trim();
  const pass2 = registerPassword2.value.trim();

  if (!emailRegex.test(email)) return alert("Email invalid.");
  if (pass1.length < 6) return alert("Parola minim 6 caractere.");
  if (pass1 !== pass2) return alert("Parolele nu coincid.");

  try {
    await createUserWithEmailAndPassword(auth, email, pass1);
    alert("Cont creat! Te poți loga.");
    closeAuthModal();
  } catch (err) {
    alert("Eroare: " + err.message);
  }
};

if (forgotPasswordBtn) {
  forgotPasswordBtn.onclick = async () => {
    const email = prompt("Introdu emailul tău:");
    if (!email || !emailRegex.test(email)) return;
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Email trimis.");
    } catch (err) {
      alert(err.message);
    }
  };
}

/* ==========================================================
   ON AUTH STATE CHANGED
========================================================== */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    profileLink.classList.remove("hidden");

    // verificare admin
    try {
      const ad = await getDoc(doc(db, "admins", user.uid));
      isAdmin = ad.exists();
    } catch {
      isAdmin = false;
    }

    if (isAdmin) {
      adminLink.classList.remove("hidden");
      moreAdminLink?.classList.remove("hidden");
    } else {
      adminLink.classList.add("hidden");
      moreAdminLink?.classList.add("hidden");
    }

  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    profileLink.classList.add("hidden");
    adminLink.classList.add("hidden");
    moreAdminLink?.classList.add("hidden");
  }
});

/* ==========================================================
   CHECKOUT
========================================================== */
checkoutBtn.onclick = () => {
  if (!cartItems.length) return alert("Coș gol.");

  const items = getCartSummary();

  checkoutSummaryEl.innerHTML = "";
  let total = 0;

  items.forEach((i) => {
    total += i.price * i.quantity;
    const row = document.createElement("div");
    row.className = "flex justify-between text-sm";
    row.innerHTML = `
      <span>${i.title} <span class="text-gray-400">x${i.quantity}</span></span>
      <span>${(i.price * i.quantity).toFixed(2)} €</span>
    `;
    checkoutSummaryEl.appendChild(row);
  });

  checkoutTotalText.textContent = total.toFixed(2) + " €";

  if (auth.currentUser) ckEmail.value = auth.currentUser.email;

  checkoutModal.classList.remove("hidden");
  cart.style.right = "-400px";
};

checkoutClose.onclick = () => checkoutModal.classList.add("hidden");

checkoutModal.onclick = (e) => {
  if (e.target === checkoutModal) checkoutModal.classList.add("hidden");
};

checkoutForm.onsubmit = async (e) => {
  e.preventDefault();

  if (!cartItems.length) {
    checkoutMessage.textContent = "Coș gol.";
    checkoutMessage.classList.add("text-red-400");
    return;
  }

  const name = ckName.value.trim();
  const email = ckEmail.value.trim();
  const phone = ckPhone.value.trim();
  const city = ckCity.value.trim();
  const address = ckAddress.value.trim();
  const delivery = ckDelivery.value;
  const payment = ckPayment.value;
  const notes = ckNotes.value.trim();

  if (!name || !city || !address) {
    checkoutMessage.textContent = "Completează câmpurile necesare.";
    checkoutMessage.classList.add("text-red-400");
    return;
  }

  if (!emailRegex.test(email)) {
    checkoutMessage.textContent = "Email invalid.";
    checkoutMessage.classList.add("text-red-400");
    return;
  }

  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 6) {
    checkoutMessage.textContent = "Telefon invalid.";
    checkoutMessage.classList.add("text-red-400");
    return;
  }

  const items = getCartSummary();
  let total = 0; items.forEach(i => total += i.price * i.quantity);

  checkoutSubmitBtn.disabled = true;
  checkoutSubmitBtn.textContent = "Se procesează...";

  try {
    const ref = await addDoc(collection(db, "orders"), {
      items, total,
      customer: { name, email, phone, city, address, delivery, payment, notes },
      createdAt: serverTimestamp(),
      userId: auth.currentUser?.uid || null,
      status: "nouă"
    });

    checkoutMessage.textContent = "Comandă plasată! ID: " + ref.id;
    checkoutMessage.classList.add("text-green-400");

    cartItems = [];
    updateCart();
    localStorage.removeItem("cartItems");

    setTimeout(() => {
      checkoutModal.classList.add("hidden");
      checkoutSubmitBtn.disabled = false;
      checkoutSubmitBtn.textContent = "Plasează comanda";
      checkoutMessage.textContent = "";
      checkoutForm.reset();
    }, 2500);

  } catch (err) {
    checkoutMessage.textContent = "Eroare la salvare.";
    checkoutMessage.classList.add("text-red-400");
    checkoutSubmitBtn.disabled = false;
    checkoutSubmitBtn.textContent = "Plasează comanda";
  }
};

/* ==========================================================
   BOTTOM NAV (MOBILE)
========================================================== */
const scrollToSection = (sel) => {
  const el = document.querySelector(sel);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top, behavior: "smooth" });
};

bottomPromoBtn?.addEventListener("click", () => scrollToSection("#promotions"));
bottomCatalogBtn?.addEventListener("click", () => scrollToSection("#productsSection"));

bottomCartBtn?.addEventListener("click", () => cart.style.right = "0");

bottomAccountBtn?.addEventListener("click", () => {
  if (auth.currentUser) {
    window.location.href = "profile.html";
  } else {
    openAuthModal("login");
  }
});

bottomMoreBtn?.addEventListener("click", () => {
  moreSheet.classList.toggle("hidden");
});

moreCloseBtn?.addEventListener("click", () => {
  moreSheet.classList.add("hidden");
});

moreSheet?.addEventListener("click", (e) => {
  if (e.target === moreSheet) {
    moreSheet.classList.add("hidden");
  }
});

/* ==========================================================
   FILTRE INPUTS
========================================================== */
searchInput.oninput = renderProductList;
categoryFilter.onchange = renderProductList;
sortFilter.onchange = renderProductList;
minPriceInput.oninput = renderProductList;
maxPriceInput.oninput = renderProductList;

cartBtn.onclick = () => cart.style.right = "0";
closeCart.onclick = () => cart.style.right = "-400px";

[minPriceInput, maxPriceInput].forEach(input => {
  if (!input) return;
  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^0-9.]/g, "");
  });
});

/* ==========================================================
   INITIAL LOAD
========================================================== */
window.addEventListener("load", async () => {
  await loadProducts();
  updateCart();
});