// admin.js (COMPLET)

// ===========================
// IMPORTURI FIREBASE
// ===========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

// ===========================
// CONFIG FIREBASE – LA FEL CA ÎN app.js
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
// DOM – PRODUSE
// ===========================
const adminTitle = document.getElementById("adminTitle");
const adminPrice = document.getElementById("adminPrice");
const adminStock = document.getElementById("adminStock");
const adminImage = document.getElementById("adminImage");
const adminDesc = document.getElementById("adminDesc");
const adminCategory = document.getElementById("adminCategory");
const addProductBtn = document.getElementById("addProductBtn");

const adminSearch = document.getElementById("adminSearch");
const adminProducts = document.getElementById("adminProducts");

// ===========================
// DOM – COMENZI + STATISTICI
// ===========================
const adminOrders = document.getElementById("adminOrders");
const statTotalOrders = document.getElementById("statTotalOrders");
const statTotalRevenue = document.getElementById("statTotalRevenue");
const statNewOrders = document.getElementById("statNewOrders");

const statusTabs = document.querySelectorAll(".order-status-tab");

let salesChartInstance = null;
let statusChartInstance = null;

// ===========================
// STATE
// ===========================
let products = [];
let orders = [];
let editingProductId = null;
let currentStatusFilter = "all";

// ===========================
// HELPERS
// ===========================
const numberToPrice = (n) => `${Number(n).toFixed(2)} €`;

const formatDate = (ts) => {
  if (!ts || !ts.toDate) return "-";
  const d = ts.toDate();
  return d.toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// ===========================
// VERIFICARE ADMIN
// ===========================
const requireAdmin = () =>
  new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        alert("Trebuie să fii logat ca admin pentru a accesa acest panou.");
        window.location.href = "index.html";
        return reject("not-logged-in");
      }

      try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (!adminDoc.exists()) {
          alert("Nu ai drepturi de admin.");
          window.location.href = "index.html";
          return reject("not-admin");
        }
        resolve(user);
      } catch (err) {
        console.error("Eroare la verificarea admin:", err);
        alert("A apărut o eroare la verificarea drepturilor de admin.");
        window.location.href = "index.html";
        reject(err);
      }
    });
  });

// ===========================
// PRODUSE – LOAD + RENDER
// ===========================
const loadProducts = async () => {
  const snap = await getDocs(collection(db, "products"));
  products = snap.docs.map((d) => ({
    id: d.id,
    ...d.data()
  }));
  renderProducts();
};

const renderProducts = () => {
  if (!adminProducts) return;

  const queryText = adminSearch.value.trim().toLowerCase();

  let filtered = [...products];
  if (queryText) {
    filtered = filtered.filter(
      (p) =>
        (p.title || "").toLowerCase().includes(queryText) ||
        (p.category || "").toLowerCase().includes(queryText)
    );
  }

  adminProducts.innerHTML = "";

  if (!filtered.length) {
    adminProducts.innerHTML =
      '<p class="text-gray-400 col-span-full">Nu s-au găsit produse.</p>';
    return;
  }

  filtered.forEach((p) => {
    const div = document.createElement("div");
    div.className =
      "bg-gray-800 p-3 rounded-lg flex flex-col justify-between shadow";

    div.innerHTML = `
      <div class="flex gap-3 mb-3">
        <div class="w-20 h-20 bg-gray-900 rounded overflow-hidden flex-shrink-0">
          <img src="${p.imageURL || "https://via.placeholder.com/150"}" 
               class="w-full h-full object-cover" alt="${p.title || ""}">
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-yellow-300">${p.title || "Fără titlu"}</h4>
          <p class="text-sm text-gray-300">${p.category || "Categorie necunoscută"}</p>
          <p class="text-sm text-gray-400 mt-1">
            Preț: <span class="font-semibold text-yellow-400">${numberToPrice(
              p.price || 0
            )}</span>
          </p>
          <p class="text-sm text-gray-400">
            Stoc: <span class="font-semibold">${p.stock ?? 0}</span>
          </p>
        </div>
      </div>
      <p class="text-xs text-gray-400 line-clamp-2 mb-3">${
        p.description || ""
      }</p>
      <div class="flex justify-between gap-2 text-sm">
        <button 
          data-id="${p.id}"
          class="edit-product flex-1 bg-blue-500 hover:bg-blue-400 text-white py-1 rounded">
          Editează
        </button>
        <button 
          data-id="${p.id}"
          class="delete-product flex-1 bg-red-500 hover:bg-red-400 text-white py-1 rounded">
          Șterge
        </button>
      </div>
    `;
    adminProducts.appendChild(div);
  });
};

// ===========================
// PRODUSE – ADD / EDIT / DELETE
// ===========================
const resetProductForm = () => {
  adminTitle.value = "";
  adminPrice.value = "";
  adminStock.value = "";
  adminImage.value = "";
  adminDesc.value = "";
  adminCategory.value = "Laptop";
  editingProductId = null;
  addProductBtn.textContent = "Salvează produs";
};

addProductBtn?.addEventListener("click", async () => {
  const title = adminTitle.value.trim();
  const price = Number(adminPrice.value);
  const stock = Number(adminStock.value || 0);
  const imageURL = adminImage.value.trim();
  const description = adminDesc.value.trim();
  const category = adminCategory.value;

  if (!title || !Number.isFinite(price) || price <= 0) {
    alert("Titlu și preț valid sunt obligatorii.");
    return;
  }
  if (!Number.isFinite(stock) || stock < 0) {
    alert("Stoc invalid.");
    return;
  }

  const payload = {
    title,
    price,
    stock,
    imageURL: imageURL || "",
    description,
    category
  };

  try {
    if (editingProductId) {
      // UPDATE
      await updateDoc(doc(db, "products", editingProductId), payload);
      alert("Produs actualizat!");
    } else {
      // ADD
      await addDoc(collection(db, "products"), payload);
      alert("Produs adăugat!");
    }
    await loadProducts();
    resetProductForm();
  } catch (err) {
    console.error(err);
    alert("Eroare la salvarea produsului.");
  }
});

// click pe Editează / Șterge
adminProducts?.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".edit-product");
  const deleteBtn = e.target.closest(".delete-product");

  if (editBtn) {
    const id = editBtn.dataset.id;
    const prod = products.find((p) => p.id === id);
    if (!prod) return;

    adminTitle.value = prod.title || "";
    adminPrice.value = prod.price ?? "";
    adminStock.value = prod.stock ?? "";
    adminImage.value = prod.imageURL || "";
    adminDesc.value = prod.description || "";
    adminCategory.value = prod.category || "Laptop";

    editingProductId = id;
    addProductBtn.textContent = "Actualizează produsul";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    const prod = products.find((p) => p.id === id);
    if (!prod) return;

    if (!confirm(`Sigur ștergi produsul "${prod.title}"?`)) return;

    try {
      await deleteDoc(doc(db, "products", id));
      alert("Produs șters.");
      await loadProducts();
    } catch (err) {
      console.error(err);
      alert("Eroare la ștergerea produsului.");
    }
  }
});

adminSearch?.addEventListener("input", renderProducts);

// ===========================
// COMENZI – LOAD
// ===========================
const loadOrders = async () => {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  orders = snap.docs.map((d) => ({
    id: d.id,
    ...d.data()
  }));

  updateOrderStatsAndCharts();
  renderOrders();
};

// ===========================
// COMENZI – STATISTICI + GRAFICE
// ===========================
const updateOrderStatsAndCharts = () => {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const newOrders = orders.filter((o) => (o.status || "nouă") === "nouă").length;

  statTotalOrders.textContent = totalOrders;
  statTotalRevenue.textContent = numberToPrice(totalRevenue);
  statNewOrders.textContent = newOrders;

  buildSalesChart();
  buildStatusChart();
};

const buildSalesChart = () => {
  const ctx = document.getElementById("salesChart");
  if (!ctx) return;

  // distrugem graficul vechi
  if (salesChartInstance) salesChartInstance.destroy();

  // ultimele 7 zile
  const today = new Date();
  const labels = [];
  const sums = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD

    labels.push(d.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit" }));

    const daySum = orders
      .filter((o) => {
        if (!o.createdAt || !o.createdAt.toDate) return false;
        const od = o.createdAt.toDate().toISOString().slice(0, 10);
        return od === key;
      })
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    sums.push(daySum);
  }

  salesChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "€ pe zi",
          data: sums
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
};

const buildStatusChart = () => {
  const ctx = document.getElementById("statusChart");
  if (!ctx) return;

  if (statusChartInstance) statusChartInstance.destroy();

  const statuses = ["nouă", "în procesare", "expediată", "livrată", "anulată"];
  const counts = statuses.map(
    (st) => orders.filter((o) => (o.status || "nouă") === st).length
  );

  statusChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: statuses,
      datasets: [
        {
          data: counts
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
};

// ===========================
// COMENZI – LISTARE + UPDATE STATUS
// ===========================
const renderOrders = () => {
  if (!adminOrders) return;

  adminOrders.innerHTML = "";

  let filtered = [...orders];
  if (currentStatusFilter !== "all") {
    filtered = filtered.filter(
      (o) => (o.status || "nouă") === currentStatusFilter
    );
  }

  if (!filtered.length) {
    adminOrders.innerHTML =
      '<p class="text-gray-400">Nu există comenzi pentru filtrul selectat.</p>';
    return;
  }

  filtered.forEach((o) => {
    const card = document.createElement("div");
    card.className = "bg-gray-800 rounded-lg p-4 shadow";

    const cust = o.customer || {};
    const items = o.items || [];

    card.innerHTML = `
      <div class="flex justify-between items-start mb-2 gap-2">
        <div>
          <p class="font-semibold text-yellow-300 text-sm">${
            cust.name || "Client necunoscut"
          }</p>
          <p class="text-xs text-gray-300">${cust.email || ""}</p>
          <p class="text-xs text-gray-400">${cust.city || ""}, ${
      cust.address || ""
    }</p>
          <p class="text-xs text-gray-400">Telefon: ${cust.phone || ""}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-300">Total:</p>
          <p class="font-bold text-yellow-400">${numberToPrice(
            o.total || 0
          )}</p>
          <p class="text-xs text-gray-400 mt-1">${formatDate(
            o.createdAt
          )}</p>
        </div>
      </div>

      <div class="mb-3">
        <p class="text-xs text-gray-400 mb-1">Produse:</p>
        <ul class="text-xs text-gray-200 list-disc ml-4 space-y-1">
          ${items
            .map(
              (it) =>
                `<li>${it.title} <span class="text-gray-400">x${
                  it.quantity
                }</span> – ${numberToPrice(it.price || 0)}</li>`
            )
            .join("")}
        </ul>
      </div>

      ${
        cust.notes
          ? `<p class="text-xs text-gray-300 mb-3"><span class="font-semibold text-gray-400">Observații:</span> ${cust.notes}</p>`
          : ""
      }

      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col text-xs text-gray-300">
          <span>Status comandă:</span>
          <select data-id="${
            o.id
          }" class="order-status-select mt-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs">
            <option value="nouă" ${
              (o.status || "nouă") === "nouă" ? "selected" : ""
            }>Nouă</option>
            <option value="în procesare" ${
              o.status === "în procesare" ? "selected" : ""
            }>În procesare</option>
            <option value="expediată" ${
              o.status === "expediată" ? "selected" : ""
            }>Expediată</option>
            <option value="livrată" ${
              o.status === "livrată" ? "selected" : ""
            }>Livrată</option>
            <option value="anulată" ${
              o.status === "anulată" ? "selected" : ""
            }>Anulată</option>
          </select>
        </div>
        <p class="text-[11px] text-gray-500">ID comandă: ${o.id}</p>
      </div>
    `;

    adminOrders.appendChild(card);
  });
};

// schimbare status din select
adminOrders?.addEventListener("change", async (e) => {
  const sel = e.target.closest(".order-status-select");
  if (!sel) return;

  const id = sel.dataset.id;
  const newStatus = sel.value;

  try {
    await updateDoc(doc(db, "orders", id), { status: newStatus });

    const idx = orders.findIndex((o) => o.id === id);
    if (idx !== -1) orders[idx].status = newStatus;

    updateOrderStatsAndCharts();
    renderOrders();
  } catch (err) {
    console.error(err);
    alert("Eroare la actualizarea statusului.");
  }
});

// TAB-uri de status
statusTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    statusTabs.forEach((b) =>
      b.classList.remove("bg-yellow-400", "text-black", "font-semibold")
    );
    statusTabs.forEach((b) =>
      b.classList.add("bg-gray-800", "text-gray-200")
    );

    btn.classList.remove("bg-gray-800", "text-gray-200");
    btn.classList.add("bg-yellow-400", "text-black", "font-semibold");

    currentStatusFilter = btn.dataset.status || "all";
    renderOrders();
  });
});

// ===========================
// INIT
// ===========================
(async () => {
  try {
    await requireAdmin();   // verifică user + admin
    await loadProducts();
    await loadOrders();
  } catch (err) {
    // redirect deja făcut în requireAdmin, nu mai facem nimic aici
  }
})();