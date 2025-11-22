import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification
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
const minPriceInput = document.getElementById("minPrice");
const maxPriceInput = document.getElementById("maxPrice");

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
const adminOrdersEl = document.getElementById("adminOrders");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const profileLink = document.getElementById("profileLink");

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
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");

// CHECKOUT
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

// Admin order stats
const statTotalOrdersEl = document.getElementById("statTotalOrders");
const statTotalRevenueEl = document.getElementById("statTotalRevenue");
const statNewOrdersEl = document.getElementById("statNewOrders");

// ===========================
// STATE
// ===========================
let allProducts = [];
let cartItems = [];
let editingProductId = null;
let orderStatusFilter = "all";
let isAdmin = false;

// labels pentru tab-uri status comenzi
const ORDER_STATUS_LABELS = {
  all: "Toate",
  "nouă": "Noi",
  "în procesare": "În procesare",
  "expediată": "Expediate",
  "livrată": "Livrate",
  "anulată": "Anulate"
};

// restaurăm coșul din localStorage, dacă există
const savedCart = localStorage.getItem("cartItems");
if (savedCart) {
  try {
    cartItems = JSON.parse(savedCart);
  } catch {
    cartItems = [];
  }
}

// ===========================
// UI UTILS
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

  if (searchInput.value) {
    filtered = filtered.filter((p) =>
      p.title.toLowerCase().includes(searchInput.value.toLowerCase())
    );
  }
  if (categoryFilter.value) {
    filtered = filtered.filter((p) => p.category === categoryFilter.value);
  }

  if (minPriceInput.value) {
    const min = Number(minPriceInput.value);
    filtered = filtered.filter((p) => Number(p.price) >= min);
  }
  if (maxPriceInput.value) {
    const max = Number(maxPriceInput.value);
    filtered = filtered.filter((p) => Number(p.price) <= max);
  }

  if (sortFilter.value === "priceAsc") {
    filtered.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortFilter.value === "priceDesc") {
    filtered.sort((a, b) => Number(b.price) - Number(a.price));
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

  localStorage.setItem("cartItems", JSON.stringify(cartItems));
};

// grupăm produsele din coș pentru checkout
const getCartSummaryItems = () => {
  const map = {};
  cartItems.forEach((p) => {
    const key = p.id || p.title;
    if (!map[key]) {
      map[key] = {
        productId: p.id || null,
        title: p.title,
        price: Number(p.price),
        quantity: 0
      };
    }
    map[key].quantity += 1;
  });
  return Object.values(map);
};

// ===========================
// ADMIN - PRODUSE
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
    if (!isAdmin) {
      alert("Nu ai drepturi de admin.");
      return;
    }
    if (confirm("Sigur vrei să ștergi produsul?")) {
      await deleteDoc(doc(db, "products", product.id));
      await loadProducts();
      await loadAdminProducts();
    }
  };

  card.querySelector(".edit").onclick = () => {
    if (!isAdmin) {
      alert("Nu ai drepturi de admin.");
      return;
    }
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
  if (!isAdmin) return;
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
  if (!isAdmin) {
    alert("Nu ai drepturi de admin pentru a modifica produsele.");
    return;
  }

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
// ADMIN - COMENZI
// ===========================
const renderAdminOrder = (order) => {
  const card = document.createElement("div");
  card.className = "bg-gray-800 p-4 rounded-lg shadow-lg";

  let createdText = "necunoscută";
  if (order.createdAt && order.createdAt.seconds) {
    const d = new Date(order.createdAt.seconds * 1000);
    createdText = d.toLocaleString();
  }

  let total = order.total || 0;
  if (!total && Array.isArray(order.items)) {
    total = order.items.reduce(
      (s, i) => s + Number(i.price || 0) * Number(i.quantity || 1),
      0
    );
  }

  let itemsHtml = "";
  if (Array.isArray(order.items)) {
    itemsHtml = order.items
      .map(
        (i) =>
          `<li class="flex justify-between text-sm">
            <span>${i.title} <span class="text-gray-400">x${i.quantity}</span></span>
            <span>${(Number(i.price) * Number(i.quantity)).toFixed(2)} €</span>
          </li>`
      )
      .join("");
  }

  card.innerHTML = `
    <div class="flex justify-between items-start gap-4">
      <div class="flex-1">
        <p class="text-xs text-gray-500 mb-1">ID: <span class="font-mono">${order.id}</span></p>
        <p class="font-semibold text-lg mb-1">${order.customer?.name || "Client necunoscut"}</p>
        <p class="text-sm text-gray-300 mb-1">
          <span class="text-gray-400">Email:</span> ${order.customer?.email || "-"}
        </p>
        <p class="text-sm text-gray-300 mb-1">
          <span class="text-gray-400">Telefon:</span> ${order.customer?.phone || "-"}
        </p>
        <p class="text-sm text-gray-300 mb-1">
          <span class="text-gray-400">Adresă:</span> ${order.customer?.city || ""}, ${order.customer?.address || ""}
        </p>
        <p class="text-xs text-gray-500 mt-1">Plasată la: ${createdText}</p>
      </div>

      <div class="text-right">
        <p class="text-sm text-gray-400">Total</p>
        <p class="text-xl font-bold text-yellow-400 mb-2">${total.toFixed(2)} €</p>
        <label class="block text-xs text-gray-400 mb-1">Status</label>
        <select class="status-select w-full p-1 rounded bg-gray-900 border border-gray-700 text-sm">
          <option value="nouă" ${order.status === "nouă" ? "selected" : ""}>Nouă</option>
          <option value="în procesare" ${order.status === "în procesare" ? "selected" : ""}>În procesare</option>
          <option value="expediată" ${order.status === "expediată" ? "selected" : ""}>Expediată</option>
          <option value="livrată" ${order.status === "livrată" ? "selected" : ""}>Livrată</option>
          <option value="anulată" ${order.status === "anulată" ? "selected" : ""}>Anulată</option>
        </select>
      </div>
    </div>

    ${
      itemsHtml
        ? `<div class="mt-4">
             <p class="text-sm font-semibold mb-1">Produse:</p>
             <ul class="space-y-1">
               ${itemsHtml}
             </ul>
           </div>`
        : ""
    }

    ${
      order.customer?.notes
        ? `<p class="mt-3 text-xs text-gray-400">
             <span class="font-semibold text-gray-300">Observații client:</span> ${order.customer.notes}
           </p>`
        : ""
    }
  `;

  const statusSelect = card.querySelector(".status-select");
  statusSelect.onchange = async (e) => {
    if (!isAdmin) {
      alert("Nu ai drepturi de admin.");
      e.target.value = order.status || "nouă";
      return;
    }
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: e.target.value
      });
      order.status = e.target.value;
    } catch (err) {
      console.error(err);
      alert("Nu s-a putut actualiza statusul comenzii.");
      e.target.value = order.status || "nouă";
    }
  };

  return card;
};

const loadAdminOrders = async () => {
  if (!adminOrdersEl || !isAdmin) return;

  adminOrdersEl.innerHTML = '<p class="text-gray-400 text-sm">Se încarcă comenzile...</p>';

  try {
    const snapshot = await getDocs(collection(db, "orders"));
    let orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // sortăm descrescător după dată
    orders.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0;
      const tb = b.createdAt?.seconds || 0;
      return tb - ta;
    });

    // statistici globale
    const counts = {
      all: orders.length,
      "nouă": 0,
      "în procesare": 0,
      "expediată": 0,
      "livrată": 0,
      "anulată": 0
    };

    let totalRevenue = 0;

    orders.forEach((o) => {
      const st = o.status || "nouă";
      if (counts[st] !== undefined) counts[st]++;

      if (typeof o.total === "number") {
        totalRevenue += o.total;
      } else if (Array.isArray(o.items)) {
        o.items.forEach((i) => {
          totalRevenue += Number(i.price || 0) * Number(i.quantity || 1);
        });
      }
    });

    // actualizăm cardurile de statistici
    if (statTotalOrdersEl) statTotalOrdersEl.textContent = counts.all;
    if (statTotalRevenueEl) statTotalRevenueEl.textContent = totalRevenue.toFixed(2) + " €";
    if (statNewOrdersEl) statNewOrdersEl.textContent = counts["nouă"];

    // actualizăm textul tab-urilor
    const orderStatusTabs = document.querySelectorAll(".order-status-tab");
    orderStatusTabs.forEach((btn) => {
      const status = btn.getAttribute("data-status");
      const baseLabel = ORDER_STATUS_LABELS[status] || status;
      const count = counts[status] ?? 0;
      btn.textContent = count > 0 ? `${baseLabel} (${count})` : baseLabel;
    });

    // aplicăm filtrul de status pentru lista afișată
    if (orderStatusFilter !== "all") {
      orders = orders.filter((o) => (o.status || "nouă") === orderStatusFilter);
    }

    if (!orders.length) {
      adminOrdersEl.innerHTML =
        '<p class="text-gray-400 text-sm">Nu există comenzi pentru acest filtru.</p>';
      return;
    }

    adminOrdersEl.innerHTML = "";
    orders.forEach((o) => adminOrdersEl.appendChild(renderAdminOrder(o)));
  } catch (err) {
    console.error(err);
    adminOrdersEl.innerHTML =
      '<p class="text-red-400 text-sm">Eroare la încărcarea comenzilor.</p>';
  }
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
    const userCred = await signInWithEmailAndPassword(auth, email, pass);
    if (!userCred.user.emailVerified) {
      alert("Emailul nu este verificat! Verifică inbox/spam și apoi reloghează-te.");
      await signOut(auth);
      return;
    }
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
    const userCred = await createUserWithEmailAndPassword(auth, email, pass1);
    await sendEmailVerification(userCred.user);
    alert("Cont creat! Ți-am trimis un email de verificare. Verifică inbox/spam și apoi loghează-te.");
    await signOut(auth);
    closeAuthModal();
  } catch (err) {
    alert("Eroare la înregistrare: " + err.message);
  }
};

if (forgotPasswordBtn) {
  forgotPasswordBtn.onclick = async () => {
    const email = prompt("Introdu emailul cu care te-ai înregistrat:");
    if (!email) return;
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Ți-am trimis un email cu link pentru resetarea parolei.");
    } catch (err) {
      alert("Eroare: " + err.message);
    }
  };
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    profileLink.classList.remove("hidden");

    try {
      // verificăm dacă userul este admin
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      isAdmin = adminDoc.exists();

      if (isAdmin) {
        adminPanel.classList.remove("hidden");
        await loadAdminProducts();
        await loadAdminOrders();
      } else {
        adminPanel.classList.add("hidden");
      }
    } catch (err) {
      console.error("Eroare la verificarea rolului de admin:", err);
      isAdmin = false;
      adminPanel.classList.add("hidden");
    }
  } else {
    isAdmin = false;
    adminPanel.classList.add("hidden");
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    profileLink.classList.add("hidden");
  }
});

// ===========================
// CHECKOUT
// ===========================
document.getElementById("checkoutBtn").onclick = () => {
  if (!cartItems.length) {
    alert("Coșul este gol.");
    return;
  }

  const items = getCartSummaryItems();
  checkoutSummaryEl.innerHTML = "";
  let total = 0;

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "flex justify-between text-sm";
    row.innerHTML = `
      <span>${item.title} <span class="text-gray-400">x${item.quantity}</span></span>
      <span>${(item.price * item.quantity).toFixed(2)} €</span>
    `;
    checkoutSummaryEl.appendChild(row);
    total += item.price * item.quantity;
  });

  checkoutTotalText.textContent = total.toFixed(2) + " €";

  const user = auth.currentUser;
  if (user) {
    ckEmail.value = user.email || "";
  }

  checkoutMessage.textContent = "";
  checkoutMessage.className = "text-sm mt-2 text-center";

  checkoutModal.classList.remove("hidden");
  cart.style.right = "-400px";
};

checkoutClose.onclick = () => {
  checkoutModal.classList.add("hidden");
};

checkoutModal.addEventListener("click", (e) => {
  if (e.target === checkoutModal) {
    checkoutModal.classList.add("hidden");
  }
});

checkoutForm.onsubmit = async (e) => {
  e.preventDefault();

  if (!cartItems.length) {
    checkoutMessage.textContent = "Coșul este gol.";
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

  if (!name || !email || !phone || !city || !address) {
    checkoutMessage.textContent = "Te rugăm să completezi toate câmpurile obligatorii.";
    checkoutMessage.classList.remove("text-green-400");
    checkoutMessage.classList.add("text-red-400");
    return;
  }

  const items = getCartSummaryItems();
  let total = 0;
  items.forEach((i) => (total += i.price * i.quantity));

  checkoutSubmitBtn.disabled = true;
  checkoutSubmitBtn.textContent = "Se procesează comanda...";
  checkoutMessage.textContent = "";
  checkoutMessage.className = "text-sm mt-2 text-center";

  try {
    const orderRef = await addDoc(collection(db, "orders"), {
      items,
      total,
      customer: {
        name,
        email,
        phone,
        city,
        address,
        delivery,
        payment,
        notes
      },
      status: "nouă",
      createdAt: serverTimestamp(),
      userId: auth.currentUser ? auth.currentUser.uid : null
    });

    checkoutMessage.textContent =
      "Comanda a fost plasată cu succes! ID comandă: " + orderRef.id;
    checkoutMessage.classList.remove("text-red-400");
    checkoutMessage.classList.add("text-green-400");

    cartItems = [];
    updateCart();
    localStorage.removeItem("cartItems");

    if (isAdmin) {
      loadAdminOrders();
    }

    setTimeout(() => {
      checkoutModal.classList.add("hidden");
      checkoutForm.reset();
      checkoutSubmitBtn.disabled = false;
      checkoutSubmitBtn.textContent = "Plasează comanda";
      checkoutMessage.textContent = "";
    }, 2500);
  } catch (err) {
    console.error(err);
    checkoutMessage.textContent = "A apărut o eroare la salvarea comenzii.";
    checkoutMessage.classList.remove("text-green-400");
    checkoutMessage.classList.add("text-red-400");
    checkoutSubmitBtn.disabled = false;
    checkoutSubmitBtn.textContent = "Plasează comanda";
  }
};

// ===========================
// EVENT LISTENERS
// ===========================
searchInput.oninput = renderProductList;
categoryFilter.onchange = renderProductList;
sortFilter.onchange = renderProductList;
minPriceInput.oninput = renderProductList;
maxPriceInput.oninput = renderProductList;

cartBtn.onclick = () => {
  cart.style.right = "0";
};
closeCart.onclick = () => {
  cart.style.right = "-400px";
};

addProductBtn.onclick = saveProduct;
adminSearch.oninput = loadAdminProducts;

const orderStatusTabs = document.querySelectorAll(".order-status-tab");
orderStatusTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    orderStatusFilter = btn.getAttribute("data-status");

    orderStatusTabs.forEach((b) => {
      b.classList.remove("bg-yellow-400", "text-black", "font-semibold");
      b.classList.add("bg-gray-800", "text-gray-200");
    });
    btn.classList.remove("bg-gray-800", "text-gray-200");
    btn.classList.add("bg-yellow-400", "text-black", "font-semibold");

    loadAdminOrders();
  });
});

// ===========================
// INITIAL LOAD
// ===========================
window.addEventListener("load", async () => {
  await loadProducts();
  updateCart();
});
