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

const checkoutBtn = document.getElementById("checkoutBtn");

// ===========================
// STATE
// ===========================
let allProducts = [];
let cartItems = [];
let isAdmin = false;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  if (!authModal) return;
  authModal.classList.remove("hidden");
  if (mode === "login") {
    if (authTitle) authTitle.textContent = "Logare";
    if (loginForm) loginForm.classList.remove("hidden");
    if (registerForm) registerForm.classList.add("hidden");
    if (tabLogin) {
      tabLogin.classList.add("border-yellow-400", "text-white");
      tabLogin.classList.remove("text-gray-400");
    }
    if (tabRegister) {
      tabRegister.classList.remove("border-yellow-400");
      tabRegister.classList.add("text-gray-400");
    }
  } else {
    if (authTitle) authTitle.textContent = "Înregistrare";
    if (loginForm) loginForm.classList.add("hidden");
    if (registerForm) registerForm.classList.remove("hidden");
    if (tabRegister) {
      tabRegister.classList.add("border-yellow-400", "text-white");
      tabRegister.classList.remove("text-gray-400");
    }
    if (tabLogin) {
      tabLogin.classList.remove("border-yellow-400");
      tabLogin.classList.add("text-gray-400");
    }
  }
};

const closeAuthModal = () => {
  if (!authModal) return;
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
  if (!categoryFilter) return;
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
  if (!productsEl) return;

  try {
    const snapshot = await getDocs(collection(db, "products"));
    allProducts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    populateCategoryFilter();
    renderProductList();
  } catch (err) {
    console.error("Eroare la încărcarea produselor:", err);
    productsEl.innerHTML =
      '<p class="text-red-400 text-center w-full">Nu s-au putut încărca produsele. Încearcă din nou mai târziu.</p>';
  }
};

const renderProductList = () => {
  if (!productsEl) return;
  productsEl.innerHTML = "";
  let filtered = [...allProducts];

  if (searchInput && searchInput.value) {
    filtered = filtered.filter((p) =>
      p.title.toLowerCase().includes(searchInput.value.toLowerCase())
    );
  }
  if (categoryFilter && categoryFilter.value) {
    filtered = filtered.filter((p) => p.category === categoryFilter.value);
  }

  if (minPriceInput && minPriceInput.value) {
    const min = Number(minPriceInput.value);
    filtered = filtered.filter((p) => Number(p.price) >= min);
  }
  if (maxPriceInput && maxPriceInput.value) {
    const max = Number(maxPriceInput.value);
    filtered = filtered.filter((p) => Number(p.price) <= max);
  }

  if (sortFilter && sortFilter.value === "priceAsc") {
    filtered.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortFilter && sortFilter.value === "priceDesc") {
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
  if (!cartItemsEl || !cartTotalEl || !cartCountEl) return;
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
// AUTH
// ===========================
if (loginBtn) {
  loginBtn.onclick = () => openAuthModal("login");
}
if (logoutBtn) {
  logoutBtn.onclick = () => signOut(auth);
}
if (authClose) {
  authClose.onclick = closeAuthModal;
}
if (tabLogin) {
  tabLogin.onclick = () => openAuthModal("login");
}
if (tabRegister) {
  tabRegister.onclick = () => openAuthModal("register");
}

if (loginForm) {
  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const pass = loginPassword.value.trim();
    if (!emailRegex.test(email)) {
      alert("Email invalid.");
      return;
    }
    if (pass.length < 6) {
      alert("Parola trebuie să aibă minim 6 caractere.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      closeAuthModal();
    } catch (err) {
      alert("Eroare la logare: " + err.message);
    }
  };
}

if (registerForm) {
  registerForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = registerEmail.value.trim();
    const pass1 = registerPassword.value.trim();
    const pass2 = registerPassword2.value.trim();

    if (!emailRegex.test(email)) {
      alert("Email invalid.");
      return;
    }
    if (pass1.length < 6) {
      alert("Parola trebuie să aibă minim 6 caractere.");
      return;
    }
    if (pass1 !== pass2) {
      alert("Parolele nu coincid.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, pass1);
      alert("Cont creat cu succes! Te poți loga acum.");
      closeAuthModal();
    } catch (err) {
      alert("Eroare la înregistrare: " + err.message);
    }
  };
}

if (forgotPasswordBtn) {
  forgotPasswordBtn.onclick = async () => {
    const email = prompt("Introdu emailul cu care te-ai înregistrat:");
    if (!email) return;
    if (!emailRegex.test(email)) {
      alert("Email invalid.");
      return;
    }
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
    if (loginBtn) loginBtn.classList.add("hidden");
    if (logoutBtn) logoutBtn.classList.remove("hidden");
    if (profileLink) profileLink.classList.remove("hidden");

    try {
      // verificăm dacă userul este admin (colecția "admins", doc cu uid)
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      isAdmin = adminDoc.exists();
      if (adminLink) {
        if (isAdmin) adminLink.classList.remove("hidden");
        else adminLink.classList.add("hidden");
      }
    } catch (err) {
      console.error("Eroare la verificarea rolului de admin:", err);
      isAdmin = false;
      if (adminLink) adminLink.classList.add("hidden");
    }
  } else {
    isAdmin = false;
    if (loginBtn) loginBtn.classList.remove("hidden");
    if (logoutBtn) logoutBtn.classList.add("hidden");
    if (profileLink) profileLink.classList.add("hidden");
    if (adminLink) adminLink.classList.add("hidden");
  }
});

// ===========================
// CHECKOUT
// ===========================
if (checkoutBtn) {
  checkoutBtn.onclick = () => {
    if (!cartItems.length) {
      alert("Coșul este gol.");
      return;
    }

    const items = getCartSummaryItems();
    if (!checkoutSummaryEl || !checkoutTotalText || !checkoutModal) return;

    checkoutSummaryEl.innerHTML = "";
    let total = 0;

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "flex justify_between text-sm".replace("_", "-");
      row.innerHTML = `
        <span>${item.title} <span class="text-gray-400">x${item.quantity}</span></span>
        <span>${(item.price * item.quantity).toFixed(2)} €</span>
      `;
      checkoutSummaryEl.appendChild(row);
      total += item.price * item.quantity;
    });

    checkoutTotalText.textContent = total.toFixed(2) + " €";

    const user = auth.currentUser;
    if (user && ckEmail) {
      ckEmail.value = user.email || "";
    }

    if (checkoutMessage) {
      checkoutMessage.textContent = "";
      checkoutMessage.className = "text-sm mt-2 text-center";
    }

    checkoutModal.classList.remove("hidden");
    if (cart) cart.style.right = "-400px";
  };
}

if (checkoutClose && checkoutModal) {
  checkoutClose.onclick = () => {
    checkoutModal.classList.add("hidden");
  };

  checkoutModal.addEventListener("click", (e) => {
    if (e.target === checkoutModal) {
      checkoutModal.classList.add("hidden");
    }
  });
}

if (checkoutForm) {
  checkoutForm.onsubmit = async (e) => {
    e.preventDefault();

    if (!cartItems.length) {
      if (checkoutMessage) {
        checkoutMessage.textContent = "Coșul este gol.";
        checkoutMessage.classList.add("text-red-400");
      }
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

    if (!name || !city || !address || !delivery || !payment) {
      checkoutMessage.textContent = "Completează toate câmpurile obligatorii.";
      checkoutMessage.classList.remove("text-green-400");
      checkoutMessage.classList.add("text-red-400");
      return;
    }

    if (!emailRegex.test(email)) {
      checkoutMessage.textContent = "Email invalid.";
      checkoutMessage.classList.remove("text-green-400");
      checkoutMessage.classList.add("text-red-400");
      return;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 6) {
      checkoutMessage.textContent = "Telefon invalid.";
      checkoutMessage.classList.remove("text-green-400");
      checkoutMessage.classList.add("text-red-400");
      return;
    }

    const items = getCartSummaryItems();

    const invalidItem = items.find(
      (i) =>
        !Number.isFinite(i.price) ||
        i.price <= 0 ||
        !Number.isInteger(i.quantity) ||
        i.quantity <= 0
    );
    if (invalidItem) {
      checkoutMessage.textContent = "Există produse cu preț sau cantitate invalidă.";
      checkoutMessage.classList.remove("text-green-400");
      checkoutMessage.classList.add("text-red-400");
      return;
    }

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
}

// ===========================
// EVENT LISTENERS
// ===========================
if (searchInput) searchInput.oninput = renderProductList;
if (categoryFilter) categoryFilter.onchange = renderProductList;
if (sortFilter) sortFilter.onchange = renderProductList;
if (minPriceInput) minPriceInput.oninput = renderProductList;
if (maxPriceInput) maxPriceInput.oninput = renderProductList;

if (cartBtn && cart) {
  cartBtn.onclick = () => {
    cart.style.right = "0";
  };
}
if (closeCart && cart) {
  closeCart.onclick = () => {
    cart.style.right = "-400px";
  };
}

// 🧹 curățare input numeric (opțional)
const numericInputs = [minPriceInput, maxPriceInput];
numericInputs.forEach((input) => {
  if (!input) return;
  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^0-9.,]/g, "");
  });
});

// ===========================
// INITIAL LOAD
// ===========================
window.addEventListener("load", async () => {
  await loadProducts();
  updateCart();
});