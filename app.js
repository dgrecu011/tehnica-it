// =========================
// IMPORTURI FIREBASE
// =========================
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


// =========================
// FIREBASE CONFIG
// =========================
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


// =========================
// ELEMENTE DOM
// =========================
const productsEl = document.getElementById("products");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");
const minPriceInput = document.getElementById("minPrice");
const maxPriceInput = document.getElementById("maxPrice");

// NAVBAR sus
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const profileLink = document.getElementById("profileLink");
const adminLink = document.getElementById("adminLink");

// NAVBAR jos
const bottomProfileBtn = document.getElementById("bottomProfileBtn");
const mobileAccountMenu = document.getElementById("mobileAccountMenu");
const notLogged = document.getElementById("notLogged");
const loggedUser = document.getElementById("loggedUser");
const adminPanelBtn = document.getElementById("adminPanelBtn");
const logoutBtnMobile = document.getElementById("logoutBtnMobile");
const openLogin = document.getElementById("openLogin");
const goToProfile = document.getElementById("goToProfile");

const bottomCartBtn = document.getElementById("bottomCartBtn");
const navCatalog = document.getElementById("navCatalog");
const navPromo = document.getElementById("navPromo");

// COȘ
const cartBtn = document.getElementById("cartBtn");
const cart = document.getElementById("cart");
const closeCart = document.getElementById("closeCart");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");

// AUTH
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

// CHECKOUT
const checkoutModal = document.getElementById("checkoutModal");
const checkoutClose = document.getElementById("checkoutClose");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutSummaryEl = document.getElementById("checkoutSummary");
const checkoutTotalText = document.getElementById("checkoutTotalText");
const checkoutMessage = document.getElementById("checkoutMessage");
const checkoutSubmitBtn = document.getElementById("checkoutSubmitBtn");
const checkoutBtn = document.getElementById("checkoutBtn");

// FORM FIELDS
const ckName = document.getElementById("ckName");
const ckEmail = document.getElementById("ckEmail");
const ckPhone = document.getElementById("ckPhone");
const ckCity = document.getElementById("ckCity");
const ckAddress = document.getElementById("ckAddress");
const ckDelivery = document.getElementById("ckDelivery");
const ckPayment = document.getElementById("ckPayment");
const ckNotes = document.getElementById("ckNotes");


// =========================
// STATE
// =========================
let allProducts = [];
let cartItems = [];
let isAdmin = false;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// restore cart
const savedCart = localStorage.getItem("cartItems");
if (savedCart) {
  try {
    cartItems = JSON.parse(savedCart);
  } catch {
    cartItems = [];
  }
}


// ================================
// AUTH MODAL
// ================================
const openAuthModal = (mode = "login") => {
  authModal.classList.remove("hidden");

  if (mode === "login") {
    authTitle.textContent = "Logare";
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    tabLogin.classList.add("border-yellow-400", "text-white");
    tabRegister.classList.add("text-gray-400");
  } else {
    authTitle.textContent = "Înregistrare";
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    tabRegister.classList.add("border-yellow-400", "text-white");
  }
};

const closeAuthModal = () => {
  authModal.classList.add("hidden");
};


// ===================================
// PRODUSE
// ===================================
const renderProduct = (product) => {
  const card = document.createElement("div");
  card.className = "product-card perspective";
  card.innerHTML = `
    <div class="product-card-inner">
      <div class="product-card-front p-3">
        <img src="${product.imageURL}" class="w-full h-48 mb-3 rounded">
        <h4 class="font-bold text-lg">${product.title}</h4>
        <p class="text-gray-400 mb-1">${product.price} €</p>
        <p class="text-xs text-gray-500">${product.category || ""}</p>
      </div>

      <div class="product-card-back p-3">
        <h4 class="font-bold text-lg mb-2">${product.title}</h4>
        <p class="text-gray-400 text-sm mb-2">${product.description || ""}</p>
        <button class="bg-yellow-400 text-black px-3 py-1 rounded add-to-cart">Adaugă în coș</button>
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
  categoryFilter.innerHTML = `<option value="">Toate categoriile</option>`;
  const categories = [...new Set(allProducts.map((p) => p.category).filter(Boolean))];
  categories.forEach((cat) => {
    const o = document.createElement("option");
    o.value = cat;
    o.textContent = cat;
    categoryFilter.appendChild(o);
  });
};

const loadProducts = async () => {
  const snapshot = await getDocs(collection(db, "products"));
  allProducts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  populateCategoryFilter();
  renderProductList();
};

const renderProductList = () => {
  productsEl.innerHTML = "";

  let filtered = [...allProducts];

  if (searchInput && searchInput.value)
    filtered = filtered.filter((p) => p.title.toLowerCase().includes(searchInput.value.toLowerCase()));

  if (categoryFilter && categoryFilter.value)
    filtered = filtered.filter((p) => p.category === categoryFilter.value);

  if (minPriceInput && minPriceInput.value)
    filtered = filtered.filter((p) => Number(p.price) >= Number(minPriceInput.value));

  if (maxPriceInput && maxPriceInput.value)
    filtered = filtered.filter((p) => Number(p.price) <= Number(maxPriceInput.value));

  if (sortFilter && sortFilter.value === "priceAsc")
    filtered.sort((a, b) => Number(a.price) - Number(b.price));

  if (sortFilter && sortFilter.value === "priceDesc")
    filtered.sort((a, b) => Number(b.price) - Number(a.price));

  if (!filtered.length) {
    productsEl.innerHTML = `<p class="text-gray-400 text-center">Nu s-au găsit produse.</p>`;
    return;
  }

  filtered.forEach((p) => productsEl.appendChild(renderProduct(p)));
};


// ================================
// COȘ
// ================================
const updateCart = () => {
  if (!cartItemsEl || !cartTotalEl || !cartCountEl) return;

  cartItemsEl.innerHTML = "";
  let total = 0;

  cartItems.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "flex justify-between items-center mb-2";
    row.innerHTML = `
      <div class="flex flex-col">
        <span>${item.title}</span>
        <span class="text-xs text-gray-400">${item.price} €</span>
      </div>
      <button class="text-red-400" data-index="${index}">Șterge</button>
    `;
    row.querySelector("button").onclick = () => {
      cartItems.splice(index, 1);
      updateCart();
    };

    cartItemsEl.appendChild(row);
    total += Number(item.price);
  });

  cartTotalEl.textContent = total.toFixed(2) + " €";
  cartCountEl.textContent = cartItems.length;

  localStorage.setItem("cartItems", JSON.stringify(cartItems));
};

const getCartSummaryItems = () => {
  const map = {};
  cartItems.forEach((p) => {
    const key = p.id || p.title;

    if (!map[key]) {
      map[key] = {
        title: p.title,
        price: Number(p.price),
        quantity: 0
      };
    }
    map[key].quantity += 1;
  });
  return Object.values(map);
};


// =====================================
// NAVBAR JOS – CONT
// =====================================
if (bottomProfileBtn && mobileAccountMenu) {
  bottomProfileBtn.addEventListener("click", () => {
    const user = auth.currentUser;

    if (user) {
      if (notLogged) notLogged.classList.add("hidden");
      if (loggedUser) loggedUser.classList.remove("hidden");
    } else {
      if (loggedUser) loggedUser.classList.add("hidden");
      if (notLogged) notLogged.classList.remove("hidden");
    }

    mobileAccountMenu.classList.toggle("hidden");
  });
}

if (openLogin) {
  openLogin.addEventListener("click", () => {
    mobileAccountMenu.classList.add("hidden");
    openAuthModal("login");
  });
}

if (logoutBtnMobile) {
  logoutBtnMobile.addEventListener("click", () => {
    signOut(auth);
    mobileAccountMenu.classList.add("hidden");
  });
}

if (goToProfile) {
  goToProfile.addEventListener("click", () => {
    window.location.href = "profile.html";
  });
}

if (adminPanelBtn) {
  adminPanelBtn.addEventListener("click", () => {
    window.location.href = "admin.html";
  });
}


// ======================================
// NAVBAR JOS – COȘ & SECTIONS
// ======================================
if (bottomCartBtn && cart) {
  bottomCartBtn.onclick = () => {
    cart.style.right = "0";
  };
}

if (navCatalog) {
  navCatalog.addEventListener("click", () => {
    const section = document.getElementById("productsSection");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  });
}

if (navPromo) {
  navPromo.addEventListener("click", () => {
    const section = document.getElementById("promotions");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  });
}


// ======================================
// NAVBAR SUS & AUTH
// ======================================
if (loginBtn) loginBtn.onclick = () => openAuthModal("login");
if (logoutBtn) logoutBtn.onclick = () => signOut(auth);
if (authClose) authClose.onclick = closeAuthModal;

if (tabLogin) tabLogin.onclick = () => openAuthModal("login");
if (tabRegister) tabRegister.onclick = () => openAuthModal("register");


// ======================================
// LOGARE
// ======================================
if (loginForm) {
  loginForm.onsubmit = async (e) => {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const pass = loginPassword.value.trim();

    if (!emailRegex.test(email)) return alert("Email invalid!");
    if (pass.length < 6) return alert("Parola trebuie să aibă minim 6 caractere.");

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      closeAuthModal();
    } catch (err) {
      alert("Eroare la logare: " + err.message);
    }
  };
}


// ======================================
// REGISTER
// ======================================
if (registerForm) {
  registerForm.onsubmit = async (e) => {
    e.preventDefault();

    const email = registerEmail.value.trim();
    const pass1 = registerPassword.value.trim();
    const pass2 = registerPassword2.value.trim();

    if (!emailRegex.test(email)) return alert("Email invalid!");
    if (pass1 !== pass2) return alert("Parolele nu coincid!");
    if (pass1.length < 6) return alert("Parola minim 6 caractere.");

    try {
      await createUserWithEmailAndPassword(auth, email, pass1);
      alert("Cont creat cu succes!");
      closeAuthModal();
    } catch (err) {
      alert("Eroare la înregistrare: " + err.message);
    }
  };
}


// ======================================
// RESET PAROLĂ
// ======================================
if (forgotPasswordBtn) {
  forgotPasswordBtn.onclick = async () => {
    const email = prompt("Emailul tău:");
    if (!email || !emailRegex.test(email)) return alert("Email invalid!");

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Email trimis pentru resetare.");
    } catch (err) {
      alert("Eroare: " + err.message);
    }
  };
}


// ======================================
// ON AUTH CHANGE
// ======================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (loginBtn) loginBtn.classList.add("hidden");
    if (logoutBtn) logoutBtn.classList.remove("hidden");
    if (profileLink) profileLink.classList.remove("hidden");

    try {
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      isAdmin = adminDoc.exists();

      if (isAdmin) {
        if (adminLink) adminLink.classList.remove("hidden");
        if (adminPanelBtn) adminPanelBtn.classList.remove("hidden");
      } else {
        if (adminLink) adminLink.classList.add("hidden");
        if (adminPanelBtn) adminPanelBtn.classList.add("hidden");
      }
    } catch (err) {
      console.error("Eroare la verificarea admin:", err);
      isAdmin = false;
      if (adminLink) adminLink.classList.add("hidden");
      if (adminPanelBtn) adminPanelBtn.classList.add("hidden");
    }
  } else {
    isAdmin = false;
    if (loginBtn) loginBtn.classList.remove("hidden");
    if (logoutBtn) logoutBtn.classList.add("hidden");
    if (profileLink) profileLink.classList.add("hidden");
    if (adminLink) adminLink.classList.add("hidden");
    if (adminPanelBtn) adminPanelBtn.classList.add("hidden");
  }
});


// ======================================
// CHECKOUT
// ======================================
if (checkoutBtn) {
  checkoutBtn.onclick = () => {
    if (!cartItems.length) return alert("Coșul e gol.");

    const items = getCartSummaryItems();
    if (!checkoutSummaryEl || !checkoutTotalText) return;

    checkoutSummaryEl.innerHTML = "";
    let total = 0;

    items.forEach((i) => {
      const row = document.createElement("div");
      row.className = "flex justify-between text-sm";
      row.innerHTML = `
        <span>${i.title} x${i.quantity}</span>
        <span>${(i.price * i.quantity).toFixed(2)} €</span>
      `;
      checkoutSummaryEl.appendChild(row);

      total += i.price * i.quantity;
    });

    checkoutTotalText.textContent = total.toFixed(2) + " €";

    const user = auth.currentUser;
    if (user && ckEmail) ckEmail.value = user.email;

    checkoutModal.classList.remove("hidden");
    if (cart) cart.style.right = "-400px";
  };
}

if (checkoutClose) {
  checkoutClose.onclick = () => checkoutModal.classList.add("hidden");
}

if (checkoutModal) {
  checkoutModal.onclick = (e) => {
    if (e.target === checkoutModal) checkoutModal.classList.add("hidden");
  };
}

function showError(msg) {
  if (!checkoutMessage || !checkoutSubmitBtn) return;
  checkoutMessage.textContent = msg;
  checkoutMessage.className = "text-red-400 text-center";
  checkoutSubmitBtn.disabled = false;
  checkoutSubmitBtn.textContent = "Plasează comanda";
}

if (checkoutForm) {
  checkoutForm.onsubmit = async (e) => {
    e.preventDefault();

    if (!checkoutMessage || !checkoutSubmitBtn) return;

    const name = ckName.value.trim();
    const email = ckEmail.value.trim();
    const phone = ckPhone.value.trim();
    const city = ckCity.value.trim();
    const address = ckAddress.value.trim();
    const delivery = ckDelivery.value;
    const payment = ckPayment.value;
    const notes = ckNotes.value.trim();

    if (!name || !city || !address || !delivery || !payment) return showError("Completează toate câmpurile!");

    if (!emailRegex.test(email)) return showError("Email invalid!");

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 6) return showError("Telefon invalid!");

    const items = getCartSummaryItems();
    if (!items.length) return showError("Coșul este gol.");

    let total = 0;
    items.forEach((i) => (total += i.price * i.quantity));

    checkoutSubmitBtn.disabled = true;
    checkoutSubmitBtn.textContent = "Se procesează...";

    try {
      await addDoc(collection(db, "orders"), {
        items,
        total,
        customer: { name, email, phone, city, address, delivery, payment, notes },
        createdAt: serverTimestamp(),
        status: "nouă",
        userId: auth.currentUser ? auth.currentUser.uid : null
      });

      checkoutMessage.textContent = "Comandă plasată!";
      checkoutMessage.className = "text-green-400 text-center";

      cartItems = [];
      updateCart();

      setTimeout(() => {
        checkoutModal.classList.add("hidden");
        checkoutSubmitBtn.disabled = false;
        checkoutSubmitBtn.textContent = "Plasează comanda";
        checkoutForm.reset();
        checkoutMessage.textContent = "";
      }, 2000);
    } catch (err) {
      console.error(err);
      showError("Eroare la salvarea comenzii.");
    }
  };
}


// ======================================
// EVENT LISTENERS
// ======================================
if (searchInput) searchInput.oninput = renderProductList;
if (categoryFilter) categoryFilter.onchange = renderProductList;
if (sortFilter) sortFilter.onchange = renderProductList;
if (minPriceInput) minPriceInput.oninput = renderProductList;
if (maxPriceInput) maxPriceInput.oninput = renderProductList;

if (cartBtn && cart) cartBtn.onclick = () => (cart.style.right = "0");
if (closeCart && cart) closeCart.onclick = () => (cart.style.right = "-400px");


// ======================================
// INITIAL LOAD
// ======================================
window.addEventListener("load", async () => {
  await loadProducts();
  updateCart();
});
