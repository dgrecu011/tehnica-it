import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

// ===========================
// CONFIG FIREBASE
// ===========================
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

// ===========================
// ELEMENTE DOM
// ===========================
const productsEl = document.getElementById("products");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");

const adminPanel = document.getElementById("adminPanel");
const adminTitle = document.getElementById("adminTitle");
const adminDesc = document.getElementById("adminDesc");
const adminPrice = document.getElementById("adminPrice");
const adminStock = document.getElementById("adminStock");
const adminImage = document.getElementById("adminImage");
const adminCategory = document.getElementById("adminCategory");
const addProductBtn = document.getElementById("addProductBtn");
const adminProductsEl = document.getElementById("adminProducts");
const adminSearch = document.getElementById("adminSearch");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const cartBtn = document.getElementById("cartBtn");
const cart = document.getElementById("cart");
const closeCart = document.getElementById("closeCart");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");

// Auth modal
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

// ===========================
// STATE
// ===========================
let allProducts = [];
let cartItems = [];
let editingProductId = null; // pentru editare în admin

// ===========================
// FUNCȚII UI
// ===========================
const openAuthModal = (mode = "login") => {
  authModal.classList.remove("hidden");
  if (mode === "login") {
    authTitle.textContent = "Logare";
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    tabLogin.classList.add("border-yellow-400", "text-white");
    tabLogin.classList.remove("text-gray-400");
    tabRegister.classList.remove("border-yellow-400");
    tabRegister.classList.add("text-gray-400");
  } else {
    authTitle.textContent = "Înregistrare";
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    tabRegister.classList.add("border-yellow-400", "text-white");
    tabRegister.classList.remove("text-gray-400");
    tabLogin.classList.remove("border-yellow-400");
    tabLogin.classList.add("text-gray-400");
  }
};

const closeAuthModal = () => {
  authModal.classList.add("hidden");
};

// ===========================
// PRODUSE SHOP
// ===========================
const renderProduct = (product) => {
  const card = document.createElement("div");
  card.className = "product-card perspective";
  card.innerHTML = `
    <div class="product-card-inner">
      <div class="product-card-front p-3">
        <img src="${product.imageURL}" alt="${product.title}" class="w-full h-48 mb-3 rounded">
        <h4 class="font-bold text-lg">${product.title}</h4>
        <p class="text-gray-400 mb-1">${product.price} €</p>
        <p class="text-xs text-gray-500">${product.category || ""}</p>
      </div>
      <div class="product-card-back p-3">
        <h4 class="font-bold text-lg mb-2">${product.title}</h4>
        <p class="text-gray-400 mb-2 text-sm">${product.description || ""}</p>
        <button class="bg-yellow-400 text-black px-3 py-1 rounded add-to-cart">
          Adaugă în coș
        </button>
      </div>
    </div>
  `;
  const btn = card.querySelector(".add-to-cart");
  btn.onclick = () => {
    cartItems.push(product);
    updateCart();
  };
  return card;
};

const populateCategoryFilter = () => {
  // reset la opțiunile de bază
  const currentValue = categoryFilter.value;
  categoryFilter.innerHTML = `<option value="">Toate categoriile</option>`;
  const categories = [...new Set(allProducts.map((p) => p.category).filter(Boolean))];
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
  if (categories.includes(currentValue)) categoryFilter.value = currentValue;
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

  // filtre
  if (searchInput.value) {
    filtered = filtered.filter((p) =>
      p.title.toLowerCase().includes(searchInput.value.toLowerCase())
    );
  }
  if (categoryFilter.value) {
    filtered = filtered.filter((p) => p.category === categoryFilter.value);
  }

  if (sortFilter.value === "priceAsc") {
    filtered.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortFilter.value === "priceDesc") {
    filtered.sort((a, b) => Number(b.price) - Number(a.price));
  } else {
    // "new" – nu avem timestamp acum, deci lăsăm ordinea implicită
  }

  if (!filtered.length) {
    productsEl.innerHTML =
      '<p class="text-gray-400 col-span-full text-center">Nu s-au găsit produse.</p>';
  } else {
    filtered.forEach((p) => productsEl.appendChild(renderProduct(p)));
  }
};

// ===========================
// COȘ
// ===========================
const updateCart = () => {
  cartItemsEl.innerHTML = "";
  let total = 0;
  cartItems.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "flex justify-between items-center mb-2";
    div.innerHTML = `
      <div class="flex flex-col">
        <span>${item.title}</span>
        <span class="text-xs text-gray-400">${item.price} €</span>
      </div>
      <button data-index="${index}" class="text-red-400 text-sm hover:text-red-200">Șterge</button>
    `;
    div.querySelector("button").onclick = (e) => {
      const idx = Number(e.target.getAttribute("data-index"));
      cartItems.splice(idx, 1);
      updateCart();
    };
    cartItemsEl.appendChild(div);
    total += Number(item.price);
  });
  cartTotalEl.textContent = total.toFixed(2) + " €";
  cartCountEl.textContent = cartItems.length;
};

// ===========================
// ADMIN
// ===========================
const renderAdminProduct = (product) => {
  const card = document.createElement("div");
  card.className = "bg-gray-800 p-3 rounded shadow-lg flex flex-col";
  card.innerHTML = `
    <h4 class="font-bold mb-1">${product.title}</h4>
    <p class="text-gray-400 mb-1 text-sm">${product.price} €</p>
    <p class="text-xs text-gray-500 mb-2">${product.category || ""}</p>
    <div class="mt-auto flex gap-2">
      <button class="bg-yellow-400 text-black px-2 py-1 rounded text-sm edit">Editează</button>
      <button class="bg-red-500 text-white px-2 py-1 rounded text-sm delete">Șterge</button>
    </div>
  `;

  card.querySelector(".delete").onclick = async () => {
    if (confirm("Sigur vrei să ștergi produsul?")) {
      await deleteDoc(doc(db, "products", product.id));
      await loadProducts();
      await loadAdminProducts();
    }
  };

  card.querySelector(".edit").onclick = () => {
    editingProductId = product.id;
    adminTitle.value = product.title;
    adminDesc.value = product.description || "";
    adminPrice.value = product.price;
    adminStock.value = product.stock ?? 0;
    adminImage.value = product.imageURL || "";
    adminCategory.value = product.category || "Component";
  };

  return card;
};

const loadAdminProducts = async () => {
  adminProductsEl.innerHTML = "";
  const snapshot = await getDocs(collection(db, "products"));
  let products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (adminSearch.value) {
    products = products.filter((p) =>
      p.title.toLowerCase().includes(adminSearch.value.toLowerCase())
    );
  }

  products.forEach((p) => adminProductsEl.appendChild(renderAdminProduct(p)));
};

const saveProduct = async () => {
  if (!adminTitle.value || !adminPrice.value) {
    alert("Titlu și preț sunt obligatorii");
    return;
  }

  const payload = {
    title: adminTitle.value,
    description: adminDesc.value || "",
    price: parseFloat(adminPrice.value),
    stock: parseInt(adminStock.value || "0", 10),
    imageURL: adminImage.value || "https://via.placeholder.com/400x250",
    category: adminCategory.value || "Component"
  };

  if (editingProductId) {
    await updateDoc(doc(db, "products", editingProductId), payload);
  } else {
    await addDoc(collection(db, "products"), payload);
  }

  // reset
  editingProductId = null;
  adminTitle.value = "";
  adminDesc.value = "";
  adminPrice.value = "";
  adminStock.value = "";
  adminImage.value = "";
  adminCategory.value = "Laptop";

  await loadProducts();
  await loadAdminProducts();
};

// ===========================
// AUTH
// ===========================
loginBtn.onclick = () => openAuthModal("login");
logoutBtn.onclick = () => signOut(auth);
authClose.onclick = closeAuthModal;

tabLogin.onclick = () => openAuthModal("login");
tabRegister.onclick = () => openAuthModal("register");

loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const pass = loginPassword.value.trim();
  if (!email || !pass) {
    alert("Completează email și parolă.");
    return;
  }
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

  if (!email || !pass1 || !pass2) {
    alert("Completează toate câmpurile.");
    return;
  }
  if (pass1 !== pass2) {
    alert("Parolele nu coincid.");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, pass1);
    alert("Cont creat cu succes. Ești autentificat.");
    closeAuthModal();
  } catch (err) {
    alert("Eroare la înregistrare: " + err.message);
  }
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    adminPanel.classList.remove("hidden");
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
  } else {
    adminPanel.classList.add("hidden");
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
  }
});

// ===========================
// EVENT LISTENERS
// ===========================
searchInput.oninput = renderProductList;
categoryFilter.onchange = renderProductList;
sortFilter.onchange = renderProductList;

cartBtn.onclick = () => {
  cart.style.right = "0";
};
closeCart.onclick = () => {
  cart.style.right = "-400px";
};

document.getElementById("checkoutBtn").onclick = () => {
  if (!cartItems.length) {
    alert("Coșul este gol.");
    return;
  }
  alert("Checkout doar de prezent pentru demo 😄");
};

addProductBtn.onclick = saveProduct;
adminSearch.oninput = loadAdminProducts;

// ===========================
// INITIAL LOAD
// ===========================
window.addEventListener("load", async () => {
  await loadProducts();
  await loadAdminProducts();
});
