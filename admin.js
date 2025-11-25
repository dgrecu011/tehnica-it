import {
  auth,
  db,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onAuthStateChanged,
  getDoc
} from "./firebase.js";

const nameInput = document.getElementById("name");
const priceInput = document.getElementById("price");
const categoryInput = document.getElementById("category");
const tagInput = document.getElementById("tag");
const imageUrlInput = document.getElementById("imageUrl");
const stockInput = document.getElementById("stock");
const activeInput = document.getElementById("active");
const addBtn = document.getElementById("addProductBtn");
const refreshBtn = document.getElementById("refreshProducts");
const list = document.getElementById("productsList");
const searchProducts = document.getElementById("searchProducts");
const sortProducts = document.getElementById("sortProducts");
const toast = document.getElementById("toast");
const editModal = document.getElementById("editModal");
const editName = document.getElementById("editName");
const editPrice = document.getElementById("editPrice");
const editCategory = document.getElementById("editCategory");
const editTag = document.getElementById("editTag");
const editImageUrl = document.getElementById("editImageUrl");
const editPreview = document.getElementById("editPreview");
const saveEdit = document.getElementById("saveEdit");
const closeEdit = document.getElementById("closeEdit");
const totalSalesEl = document.getElementById("totalSales");
const totalOrdersEl = document.getElementById("totalOrders");
const ordersChart = document.getElementById("ordersChart");
const refreshOrders = document.getElementById("refreshOrders");
const ordersList = document.getElementById("ordersList");
const productCache = new Map();
let productsAll = [];
const STATUS_OPTIONS = [
  { value: "new", label: "Noua" },
  { value: "processing", label: "In lucru" },
  { value: "shipped", label: "Trimisa" },
  { value: "done", label: "Finalizata" },
  { value: "canceled", label: "Anulata" }
];
const formatPrice = value =>
  Number(value || 0).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
async function isAdmin(user) {
  if (!user) return false;
  try {
    const snap = await getDoc(doc(db, "admins", user.uid));
    return snap.exists() && (snap.data()?.role || "").toLowerCase() === "admin";
  } catch (err) {
    console.error("Nu pot verifica rolul admin", err);
    return false;
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 2200);
}

async function addProduct() {
  const name = nameInput.value.trim();
  const price = Number(priceInput.value);
  const category = categoryInput.value.trim() || "IT";
  const tag = tagInput.value.trim();
  const img = imageUrlInput.value.trim();
  const stock = Number(stockInput.value || 0);
  const active = !!activeInput.checked;

  if (!name || !price || !img) {
    showToast("Completeaza nume, pret si URL imagine");
    return;
  }

  try {
    addBtn.disabled = true;
    await addDoc(collection(db, "products"), { name, price, category, tag, img, stock, active });
    showToast("Produs adaugat");
    nameInput.value = "";
    priceInput.value = "";
    categoryInput.value = "";
    tagInput.value = "";
    imageUrlInput.value = "";
    stockInput.value = "";
    activeInput.checked = true;
    loadProducts();
  } catch (err) {
    console.error(err);
    showToast("Eroare la salvare");
  } finally {
    addBtn.disabled = false;
  }
}

async function deleteProduct(id) {
  await deleteDoc(doc(db, "products", id));
  showToast("Produs sters");
  loadProducts();
}

async function toggleActive(id) {
  const current = productCache.get(id);
  if (!current) return;
  const newStatus = !current.active;
  await updateDoc(doc(db, "products", id), { active: newStatus });
  showToast(newStatus ? "Produs activat" : "Produs dezactivat");
  loadProducts();
}

function applyFilters() {
  let items = [...productsAll];
  const term = (searchProducts?.value || "").toLowerCase();
  if (term) {
    items = items.filter(
      p =>
        (p.name || "").toLowerCase().includes(term) ||
        (p.category || "").toLowerCase().includes(term) ||
        (p.tag || "").toLowerCase().includes(term)
    );
  }
  const sort = sortProducts?.value || "recent";
  if (sort === "priceAsc") {
    items.sort((a, b) => a.price - b.price);
  } else if (sort === "priceDesc") {
    items.sort((a, b) => b.price - a.price);
  } else if (sort === "name") {
    items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } else {
    items = items.reverse(); // recent = ultima intrare
  }
  renderProductsList(items);
}

async function loadProducts() {
  list.innerHTML = "";
  productCache.clear();
  const snapshot = await getDocs(collection(db, "products"));
  if (snapshot.empty) {
    list.innerHTML = `<div class="glass p-6 text-center text-slate-400 col-span-full">Niciun produs. Adauga mai sus.</div>`;
    productsAll = [];
    return;
  }

  productsAll = snapshot.docs.map(p => {
    const raw = p.data() || {};
    const data = {
      name: raw.name || raw.title || "Produs",
      category: raw.category || "IT",
      img: raw.img || raw.imageURL || raw.imageUrl || "",
      price: Number(raw.price || 0),
      tag: raw.tag || "",
      stock: Number(raw.stock || 0),
      active: raw.active !== false
    };
    productCache.set(p.id, data);
    return { id: p.id, ...data };
  });

  renderProductsList(productsAll);
}

function renderProductsList(items) {
  list.innerHTML = "";
  if (!items.length) {
    list.innerHTML = `<div class="glass p-6 text-center text-slate-400 col-span-full">Niciun produs. Ajusteaza filtrele.</div>`;
    return;
  }
  items.forEach(data => {
    const price = formatPrice(data.price);
    list.innerHTML += `
      <div class="product-card">
        <div class="product-img-wrap">
          <img src="${data.img}" class="product-img" alt="${data.name}">
          ${data.tag ? `<span class="badge badge-admin">${data.tag}</span>` : ""}
        </div>
        <div class="p-4 space-y-2">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm text-slate-400">${data.category || "IT"}</p>
              <p class="text-lg font-bold text-white">${data.name}</p>
            </div>
            <p class="text-blue-300 font-black">${price}</p>
          </div>
          <p class="text-xs text-slate-400">Stoc: ${data.stock}</p>
          <p class="text-xs ${data.active ? "text-emerald-300" : "text-slate-500"}">Status: ${data.active ? "Activ" : "Inactiv"}</p>
          <div class="flex gap-2">
            <button class="btn-primary flex-1" data-edit="${data.id}">Editeaza</button>
            <button class="btn-ghost flex-1" data-delete="${data.id}">Sterge</button>
            <button class="btn-ghost flex-1" data-toggle="${data.id}">${data.active ? "Dezactiveaza" : "Activeaza"}</button>
          </div>
        </div>
      </div>
    `;
  });

  list.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => deleteProduct(btn.dataset.delete));
  });

  list.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openEditModal(btn.dataset.edit, productCache.get(btn.dataset.edit)));
  });

  list.querySelectorAll("[data-toggle]").forEach(btn => {
    btn.addEventListener("click", () => toggleActive(btn.dataset.toggle));
  });
}

function guardAuth() {
  onAuthStateChanged(auth, async user => {
    const allowed = await isAdmin(user);
    if (!user) {
      showToast("Autentificare necesara");
      setTimeout(() => (window.location = "index.html"), 800);
      return;
    }
    if (!allowed) {
      showToast("Acces permis doar adminilor");
      setTimeout(() => (window.location = "index.html"), 800);
    }
  });
}

function closeEditModal() {
  if (!editModal) return;
  editModal.classList.remove("open");
  editModal.dataset.id = "";
}

function openEditModal(id, data) {
  if (!editModal || !data) return;
  editModal.dataset.id = id;
  editName.value = data.name || "";
  editPrice.value = data.price || "";
  editCategory.value = data.category || "IT";
  editTag.value = data.tag || "";
  editImageUrl.value = data.img || "";
  stockInput.value = data.stock || 0;
  activeInput.checked = data.active !== false;
  editPreview.src = data.img || "https://via.placeholder.com/150?text=Preview";
  editModal.classList.add("open");
}

async function saveEditProduct() {
  const id = editModal?.dataset.id;
  if (!id) return;
  const name = editName.value.trim();
  const price = Number(editPrice.value);
  const category = editCategory.value.trim() || "IT";
  const tag = editTag.value.trim();
  const existing = productCache.get(id) || {};

  if (!name || !price) {
    showToast("Completeaza nume si pret");
    return;
  }

  const img = editImageUrl.value.trim() || existing.img || "";
  const stock = Number(stockInput.value || existing.stock || 0);
  const active = activeInput.checked;

  await updateDoc(doc(db, "products", id), { name, price, category, tag, img, stock, active });
  showToast("Produs actualizat");
  closeEditModal();
  loadProducts();
}

async function updateOrderStatus(id, status) {
  try {
    await updateDoc(doc(db, "orders", id), { status });
    showToast("Status actualizat");
  } catch (err) {
    console.error("Nu pot actualiza statusul", err);
    showToast("Eroare la actualizare status");
  }
}

async function deleteOrder(id) {
  const sure = confirm("Stergi aceasta comanda?");
  if (!sure) return;
  try {
    await deleteDoc(doc(db, "orders", id));
    showToast("Comanda stearsa");
    loadOrdersSummary();
  } catch (err) {
    console.error("Nu pot sterge comanda", err);
    showToast("Eroare la stergere");
  }
}

function getOrderTotal(data) {
  if (!data) return 0;
  const direct = Number(data.total ?? data.amount ?? data.price ?? 0);
  if (direct) return direct;
  if (Array.isArray(data.items)) {
    return data.items.reduce((sum, item) => {
      const price = Number(item.price || 0);
      const qty = Number(item.qty || 1);
      return sum + price * qty;
    }, 0);
  }
  return 0;
}

function renderOrdersChart(orders) {
  if (!ordersChart) return;
  if (!orders.length) {
    ordersChart.innerHTML = `<div class="text-slate-400 text-sm">Nu exista comenzi inca.</div>`;
    return;
  }

  const max = Math.max(...orders.map(o => o.total || 0), 1);
  ordersChart.innerHTML = orders
    .map(order => {
      const h = Math.max(18, Math.round((order.total / max) * 100));
      return `
        <div class="chart-col">
          <div class="chart-bar" style="height:${h}%;">
            <span>${order.totalFormatted}</span>
          </div>
          <span class="chart-label">${order.label}</span>
        </div>
      `;
    })
    .join("");
}

function renderOrdersList(orders) {
  if (!ordersList) return;
  if (!orders.length) {
    ordersList.innerHTML = `<div class="glass p-4 text-slate-400 text-sm">Nu exista comenzi.</div>`;
    return;
  }

  ordersList.innerHTML = orders
    .map(order => {
      const statusClass = `status-pill status-${order.status}`;
      const itemsText = (order.items || []).slice(0, 3).map(it => `${it.name || it.title || "Produs"} x${it.qty || 1}`).join(", ");
      return `
        <div class="glass p-4 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <div>
              <p class="text-sm text-slate-400">#${order.id.slice(0, 6)} • ${order.dateLabel}</p>
              <p class="font-bold text-white">${order.name || "Client"}${order.email ? ` • ${order.email}` : ""}</p>
            </div>
            <span class="${statusClass}">${order.statusLabel}</span>
          </div>
          <p class="text-blue-300 font-black text-lg">${order.totalFormatted}</p>
          ${itemsText ? `<p class="text-sm text-slate-400 truncate">Items: ${itemsText}</p>` : ""}
          <div class="flex items-center gap-2">
            <select class="input flex-1" data-status="${order.id}">
              ${STATUS_OPTIONS.map(opt => `<option value="${opt.value}" ${opt.value === order.status ? "selected" : ""}>${opt.label}</option>`).join("")}
            </select>
            <button class="btn-ghost" data-delete-order="${order.id}">Sterge</button>
          </div>
        </div>
      `;
    })
    .join("");

  ordersList.querySelectorAll("[data-status]").forEach(sel => {
    sel.addEventListener("change", () => updateOrderStatus(sel.dataset.status, sel.value));
  });

  ordersList.querySelectorAll("[data-delete-order]").forEach(btn => {
    btn.addEventListener("click", () => deleteOrder(btn.dataset.deleteOrder));
  });
}

async function loadOrdersSummary() {
  if (!totalOrdersEl || !totalSalesEl) return;
  totalOrdersEl.textContent = "0";
  totalSalesEl.textContent = formatPrice(0);
  ordersChart.innerHTML = `<div class="text-slate-400 text-sm">Se incarca...</div>`;

  try {
    const snap = await getDocs(collection(db, "orders"));
    if (snap.empty) {
      totalOrdersEl.textContent = "0";
      totalSalesEl.textContent = formatPrice(0);
      renderOrdersChart([]);
      return;
    }

    const orders = snap.docs.map(docSnap => {
      const data = docSnap.data() || {};
      const total = getOrderTotal(data);
      const createdAt =
        data.createdAt?.toDate?.() ||
        data.timestamp?.toDate?.() ||
        data.date?.toDate?.() ||
        null;
      const label = createdAt
        ? createdAt.toLocaleDateString("ro-RO", { month: "short", day: "numeric" })
        : `#${docSnap.id.slice(0, 4)}`;
      return {
        id: docSnap.id,
        total,
        label,
        createdAt,
        status: (data.status || "new").toString().toLowerCase(),
        name: data.name || data.customerName || "",
        email: data.email || data.customerEmail || "",
        items: Array.isArray(data.items) ? data.items : [],
        totalFormatted: formatPrice(total),
        statusLabel: (STATUS_OPTIONS.find(s => s.value === (data.status || "new")) || STATUS_OPTIONS[0]).label,
        dateLabel: createdAt ? createdAt.toLocaleString("ro-RO", { month: "short", day: "numeric" }) : "-"
      };
    });

    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    totalOrdersEl.textContent = orders.length.toString();
    totalSalesEl.textContent = formatPrice(totalSales);

    const chartOrders = orders
      .sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0))
      .slice(0, 6)
      .reverse()
      .map(o => ({ ...o, totalFormatted: formatPrice(o.total) }));

    renderOrdersChart(chartOrders);
    renderOrdersList(
      orders.sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0))
    );
  } catch (err) {
    console.error("Nu pot incarca comenzile", err);
    ordersChart.innerHTML = `<div class="text-slate-400 text-sm">Eroare la incarcarea comenzilor</div>`;
    if (ordersList) ordersList.innerHTML = `<div class="glass p-4 text-slate-400 text-sm">Eroare la incarcarea comenzilor</div>`;
  }
}

function boot() {
  guardAuth();
  addBtn.addEventListener("click", addProduct);
  refreshBtn.addEventListener("click", loadProducts);
  searchProducts?.addEventListener("input", applyFilters);
  sortProducts?.addEventListener("change", applyFilters);
  closeEdit?.addEventListener("click", closeEditModal);
  editModal?.addEventListener("click", e => {
    if (e.target === editModal) closeEditModal();
  });
  saveEdit?.addEventListener("click", saveEditProduct);
  editImageUrl?.addEventListener("input", () => {
    editPreview.src = editImageUrl.value || editPreview.src;
  });
  refreshOrders?.addEventListener("click", loadOrdersSummary);
  loadProducts();
  loadOrdersSummary();
}

boot();
