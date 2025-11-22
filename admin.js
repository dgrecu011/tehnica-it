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
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

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

// ELEMENTE DOM
const adminTitle = document.getElementById("adminTitle");
const adminDesc = document.getElementById("adminDesc");
const adminPrice = document.getElementById("adminPrice");
const adminStock = document.getElementById("adminStock");
const adminImage = document.getElementById("adminImage");
const adminCategory = document.getElementById("adminCategory");
const addProductBtn = document.getElementById("addProductBtn");
const adminSearch = document.getElementById("adminSearch");
const adminProductsEl = document.getElementById("adminProducts");
const adminOrdersEl = document.getElementById("adminOrders");

const statTotalOrdersEl = document.getElementById("statTotalOrders");
const statTotalRevenueEl = document.getElementById("statTotalRevenue");
const statNewOrdersEl = document.getElementById("statNewOrders");

const salesChartCanvas = document.getElementById("salesChart");
const statusChartCanvas = document.getElementById("statusChart");

const ORDER_STATUS_LABELS = {
  all: "Toate",
  "nouă": "Noi",
  "în procesare": "În procesare",
  "expediată": "Expediate",
  "livrată": "Livrate",
  "anulată": "Anulate"
};

let isAdmin = false;
let allProducts = [];
let editingProductId = null;
let orderStatusFilter = "all";
let salesChart = null;
let statusChart = null;

// ===========================
// PRODUCTE ADMIN
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
    if (!confirm("Sigur vrei să ștergi produsul?")) return;
    await deleteDoc(doc(db, "products", product.id));
    await loadAdminProducts();
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
  adminProductsEl.innerHTML = '<p class="text-gray-400 text-sm">Se încarcă produsele...</p>';
  const snapshot = await getDocs(collection(db, "products"));
  allProducts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  let products = [...allProducts];
  if (adminSearch.value.trim()) {
    const q = adminSearch.value.toLowerCase();
    products = products.filter((p) => p.title.toLowerCase().includes(q));
  }

  if (!products.length) {
    adminProductsEl.innerHTML =
      '<p class="text-gray-400 text-sm">Nu există produse.</p>';
    return;
  }

  adminProductsEl.innerHTML = "";
  products.forEach((p) => adminProductsEl.appendChild(renderAdminProduct(p)));
};

const saveProduct = async () => {
  const title = adminTitle.value.trim();
  const desc = adminDesc.value.trim();
  const priceRaw = adminPrice.value.replace(",", ".").trim();
  const stockRaw = adminStock.value.trim();

  if (!title || !priceRaw || !stockRaw) {
    alert("Titlu, preț și stoc sunt obligatorii.");
    return;
  }

  const price = Number(priceRaw);
  const stock = Number(stockRaw);

  if (!Number.isFinite(price) || price <= 0) {
    alert("Preț invalid. Introdu un număr pozitiv.");
    return;
  }

  if (!Number.isInteger(stock) || stock < 0) {
    alert("Stoc invalid. Introdu un număr întreg ≥ 0.");
    return;
  }

  const payload = {
    title,
    description: desc,
    price,
    stock,
    imageURL: adminImage.value.trim() || "https://via.placeholder.com/400x250",
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

  await loadAdminProducts();
};

// ===========================
// COMENZI ADMIN
// ===========================
const renderAdminOrder = (order) => {
  const card = document.createElement("div");
  card.className = "bg-gray-800 p-4 rounded-lg shadow-lg";

  let createdText = "necunoscută";
  if (order.createdAt?.seconds) {
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
             <ul class="space-y-1">${itemsHtml}</ul>
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

const updateAdminCharts = (orders, counts) => {
  if (!salesChartCanvas || !statusChartCanvas) return;

  const today = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      key,
      label: d.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit" }),
      total: 0
    });
  }

  const dayMap = {};
  days.forEach((d) => (dayMap[d.key] = d));

  orders.forEach((o) => {
    if (!o.createdAt?.seconds) return;
    const d = new Date(o.createdAt.seconds * 1000);
    const key = d.toISOString().slice(0, 10);
    if (!dayMap[key]) return;

    let total = typeof o.total === "number" ? o.total : 0;
    if (!total && Array.isArray(o.items)) {
      total = o.items.reduce(
        (s, i) => s + Number(i.price || 0) * Number(i.quantity || 1),
        0
      );
    }
    dayMap[key].total += total;
  });

  const salesLabels = days.map((d) => d.label);
  const salesData = days.map((d) => Number(d.total.toFixed(2)));

  const statusLabels = ["Nouă", "În procesare", "Expediată", "Livrată", "Anulată"];
  const statusKeys = ["nouă", "în procesare", "expediată", "livrată", "anulată"];
  const statusData = statusKeys.map((k) => counts[k] || 0);

  if (salesChart) salesChart.destroy();
  if (statusChart) statusChart.destroy();

  salesChart = new Chart(salesChartCanvas.getContext("2d"), {
    type: "line",
    data: {
      labels: salesLabels,
      datasets: [{
        label: "Venit (€)",
        data: salesData,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: { labels: { color: "#e5e7eb" } }
      }
    }
  });

  statusChart = new Chart(statusChartCanvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: statusLabels,
      datasets: [{
        data: statusData
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#e5e7eb",
            boxWidth: 12
          }
        }
      }
    }
  });
};

const loadAdminOrders = async () => {
  if (!adminOrdersEl) return;

  adminOrdersEl.innerHTML = '<p class="text-gray-400 text-sm">Se încarcă comenzile...</p>';

  try {
    const snapshot = await getDocs(collection(db, "orders"));
    let orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const allOrdersForCharts = [...orders];

    orders.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0;
      const tb = b.createdAt?.seconds || 0;
      return tb - ta;
    });

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

    if (statTotalOrdersEl) statTotalOrdersEl.textContent = counts.all;
    if (statTotalRevenueEl) statTotalRevenueEl.textContent = totalRevenue.toFixed(2) + " €";
    if (statNewOrdersEl) statNewOrdersEl.textContent = counts["nouă"];

    const orderStatusTabs = document.querySelectorAll(".order-status-tab");
    orderStatusTabs.forEach((btn) => {
      const status = btn.getAttribute("data-status");
      const baseLabel = ORDER_STATUS_LABELS[status] || status;
      const count = counts[status] ?? 0;
      btn.textContent = count > 0 ? `${baseLabel} (${count})` : baseLabel;
    });

    updateAdminCharts(allOrdersForCharts, counts);

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
// AUTH & INIT
// ===========================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Trebuie să fii logat ca admin.");
    window.location.href = "index.html";
    return;
  }

  try {
    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    if (!adminDoc.exists()) {
      alert("Nu ai drepturi de administrator.");
      window.location.href = "index.html";
      return;
    }
    isAdmin = true;
    await loadAdminProducts();
    await loadAdminOrders();
  } catch (err) {
    console.error(err);
    alert("Eroare la verificarea drepturilor de admin.");
    window.location.href = "index.html";
  }
});

// ===========================
// EVENT LISTENERS
// ===========================
if (addProductBtn) addProductBtn.onclick = saveProduct;
if (adminSearch) adminSearch.oninput = loadAdminProducts;

const numericAdminInputs = [adminPrice, adminStock];
numericAdminInputs.forEach((input) => {
  if (!input) return;
  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^0-9.,]/g, "");
  });
});

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
