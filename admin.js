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
  getDoc,
  setDoc,
  signOut,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot
} from "./firebase.js";

const OWNER_EMAIL = "dgrecu011@gmail.com";

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
const statusFilter = document.getElementById("statusFilter");
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
const statTotal = document.getElementById("statTotal");
const statActive = document.getElementById("statActive");
const statInactive = document.getElementById("statInactive");
const statLowStock = document.getElementById("statLowStock");
const selectAllProducts = document.getElementById("selectAllProducts");
const bulkActivate = document.getElementById("bulkActivate");
const bulkDeactivate = document.getElementById("bulkDeactivate");
const bulkDelete = document.getElementById("bulkDelete");
const bulkStockInput = document.getElementById("bulkStock");
const bulkSetStock = document.getElementById("bulkSetStock");
const bulkTagInput = document.getElementById("bulkTag");
const bulkSetTag = document.getElementById("bulkSetTag");
const adminEmailInput = document.getElementById("adminEmail");
const adminRoleSelect = document.getElementById("adminRole");
const addAdminBtn = document.getElementById("addAdminBtn");
const adminList = document.getElementById("adminList");
const refreshAdmins = document.getElementById("refreshAdmins");
const exportProductsBtn = document.getElementById("exportProducts");
const activityList = document.getElementById("activityList");
const refreshActivity = document.getElementById("refreshActivity");
const activityAction = document.getElementById("activityAction");
const activityLimit = document.getElementById("activityLimit");
const activitySearch = document.getElementById("activitySearch");
const adminNotifyBtn = document.getElementById("adminNotifyBtn");
const adminNotifyBadge = document.getElementById("adminNotifyBadge");
const adminNotifyPanel = document.getElementById("adminNotifyPanel");
const productCache = new Map();
let productsAll = [];
let visibleProducts = [];
const selectedProducts = new Set();
let currentAdmin = null;
let isOwner = false;
let unsubscribeOrdersFeed = null;
let adminNotifications = [];
let unsubscribeAdminNotifications = null;
let seenAdminNotificationIds = new Set();
let seenAdminNotificationKeys = new Set();
let adminNotificationsMap = new Map();
const getSeenAdminKey = admin => `seenNotifs:${(admin?.email || "").toLowerCase()}`; // folosim aceeasi cheie ca pe user page
const getLegacyAdminKey = admin => `seenAdminNotifs:${(admin?.email || "").toLowerCase()}`; // fallback vechi
const getSeenAdminKeysKey = admin => `seenNotifsKeys:${(admin?.email || "").toLowerCase()}`;
const loadSeenAdminNotifications = admin => {
  try {
    const raw = localStorage.getItem(getSeenAdminKey(admin)) || localStorage.getItem(getLegacyAdminKey(admin));
    seenAdminNotificationIds = new Set(Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []);
  } catch {
    seenAdminNotificationIds = new Set();
  }
  try {
    const rawKeys = localStorage.getItem(getSeenAdminKeysKey(admin));
    seenAdminNotificationKeys = new Set(Array.isArray(JSON.parse(rawKeys)) ? JSON.parse(rawKeys) : []);
  } catch {
    seenAdminNotificationKeys = new Set();
  }
};
const persistSeenAdminNotifications = admin => {
  try {
    localStorage.setItem(getSeenAdminKey(admin), JSON.stringify(Array.from(seenAdminNotificationIds).slice(-200)));
    localStorage.setItem(getSeenAdminKeysKey(admin), JSON.stringify(Array.from(seenAdminNotificationKeys).slice(-200)));
  } catch {
    /* ignore */
  }
};
const formatNotifTime = ts => {
  try {
    const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : null;
    return d
      ? d.toLocaleString("ro-RO", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      : "";
  } catch {
    return "";
  }
};

function isOwnerEmail(email) {
  return (email || "").toLowerCase() === OWNER_EMAIL.toLowerCase();
}
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
    const snapUid = await getDoc(doc(db, "admins", user.uid));
    const roleUid = (snapUid.data()?.role || "").toLowerCase();
    if (snapUid.exists() && (roleUid === "admin" || roleUid === "owner")) return true;
    if (!user.email) return false;
    const snapEmail = await getDoc(doc(db, "adminEmails", user.email.toLowerCase()));
    const roleEmail = (snapEmail.data()?.role || "").toLowerCase();
    return snapEmail.exists() && (roleEmail === "admin" || roleEmail === "owner");
  } catch (err) {
    console.error("Nu pot verifica rolul admin", err);
    return false;
  }
}

function toCsvValue(value) {
  if (value === null || value === undefined) return "";
  const str = value.toString().replace(/"/g, '""');
  if (str.includes(",") || str.includes("\n")) {
    return `"${str}"`;
  }
  return str;
}

function exportProductsCsv() {
  const rows = [
    ["id", "name", "category", "price", "stock", "active", "tag", "image"]
  ];
  visibleProducts.forEach(p => {
    rows.push([
      p.id,
      p.name || "",
      p.category || "",
      p.price || 0,
      p.stock || 0,
      p.active ? "true" : "false",
      p.tag || "",
      p.img || ""
    ]);
  });
  const csv = rows.map(r => r.map(toCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `products_export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Export CSV generat");
}

function showToast(message) {
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 2200);
}

function setAdminControlsState() {
  const disabled = !isOwner;
  [adminEmailInput, adminRoleSelect, addAdminBtn].forEach(el => {
    if (!el) return;
    el.disabled = disabled;
    el.classList.toggle("opacity-60", disabled);
    el.classList.toggle("cursor-not-allowed", disabled);
  });
}

function requireOwner(action = "Aceasta actiune") {
  if (!isOwner) {
    showToast(`${action} este permis doar owner-ului`);
    return false;
  }
  return true;
}

function renderAdminNotifications() {
  if (!adminNotifyBadge || !adminNotifyPanel) return;
  const ordered = [...adminNotificationsMap.values()].sort(
    (a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)
  );
  adminNotifications = ordered.slice(0, 20);
  const unread = adminNotifications.filter(n => !n.read).length;
  adminNotifyBadge.textContent = unread;
  adminNotifyBadge.style.display = unread ? "inline-flex" : "none";
  const items = adminNotifications.slice(0, 20);
  adminNotifyPanel.innerHTML = `
    <div class="notify-header">
      <span>Notificari admin</span>
      <button id="adminMarkAll" class="text-blue-300 text-xs">Marcheaza citite</button>
    </div>
    ${
      items.length
        ? items
            .map(
              (n, idx) =>
                `<div class="notify-item ${n.read ? "" : "unread"}" data-admin-notify-idx="${
                  adminNotifications.length - 1 - idx
                }" ${n.link ? `data-link="${n.link}"` : ""}>
                  <span>${n.message}</span>
                  <span class="text-xs text-slate-400">${n.time}</span>
                </div>`
            )
            .join("")
        : `<div class="text-sm text-slate-400">Fara notificari</div>`
    }
  `;
}

function pushAdminNotification(message, link = "", createdAt = null, id = null) {
  const ts = createdAt || new Date();
  const d = ts?.toDate ? ts.toDate() : ts;
  const time = formatNotifTime(d || ts);
  const ms = d?.getTime?.() || (ts instanceof Date ? ts.getTime() : 0) || 0;
  const key = id || `${message}|${link}|${ms}`;
  const read = (id && seenAdminNotificationIds.has(id)) || seenAdminNotificationKeys.has(key);
  const base = { id, message, time, link, createdAt: d || ts, read };
  const existing = adminNotificationsMap.get(key);
  const entry = existing ? { ...existing, ...base, read: existing.read || read } : base;
  adminNotificationsMap.set(key, entry);
  if (adminNotificationsMap.size > 50) {
    const latest = [...adminNotificationsMap.values()].sort(
      (a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)
    );
    adminNotificationsMap = new Map(latest.slice(0, 50).map(n => [n.id || `${n.message}|${n.link}|${n.createdAt?.getTime?.() || 0}`, n]));
  }
  renderAdminNotifications();
}

async function logAction(action, target, details = {}) {
  try {
    const meta = {
      action,
      target,
      details,
      userEmail: currentAdmin?.email || "",
      userId: currentAdmin?.uid || "",
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, "activityLog"), meta);
  } catch (err) {
    console.error("Nu pot salva logul", err);
  }
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
    const docRef = await addDoc(collection(db, "products"), { name, price, category, tag, img, stock, active });
    showToast("Produs adaugat");
    logAction("add_product", docRef.id, { name, price, stock, active });
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
  const sure = confirm("Stergi acest produs?");
  if (!sure) return;
  await deleteDoc(doc(db, "products", id));
  showToast("Produs sters");
  logAction("delete_product", id);
  loadProducts();
}

async function toggleActive(id) {
  const current = productCache.get(id);
  if (!current) return;
  const newStatus = !current.active;
  await updateDoc(doc(db, "products", id), { active: newStatus });
  showToast(newStatus ? "Produs activat" : "Produs dezactivat");
  logAction("toggle_product", id, { active: newStatus });
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
  const status = statusFilter?.value || "all";
  if (status === "active") {
    items = items.filter(p => p.active);
  } else if (status === "inactive") {
    items = items.filter(p => !p.active);
  } else if (status === "low") {
    items = items.filter(p => (p.stock || 0) < 5);
  }
  const sort = sortProducts?.value || "recent";
  if (sort === "priceAsc") {
    items.sort((a, b) => a.price - b.price);
  } else if (sort === "priceDesc") {
    items.sort((a, b) => b.price - a.price);
  } else if (sort === "stockDesc") {
    items.sort((a, b) => b.stock - a.stock);
  } else if (sort === "stockAsc") {
    items.sort((a, b) => a.stock - b.stock);
  } else if (sort === "name") {
    items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } else {
    items = items.reverse(); // recent = ultima intrare
  }
  visibleProducts = items;
  renderProductsList(items);
}

function updateStats() {
  if (!productsAll.length) {
    [statTotal, statActive, statInactive, statLowStock].forEach(el => {
      if (el) el.textContent = "0";
    });
    return;
  }
  const total = productsAll.length;
  const active = productsAll.filter(p => p.active).length;
  const inactive = productsAll.filter(p => !p.active).length;
  const low = productsAll.filter(p => (p.stock || 0) < 5).length;
  if (statTotal) statTotal.textContent = total.toString();
  if (statActive) statActive.textContent = active.toString();
  if (statInactive) statInactive.textContent = inactive.toString();
  if (statLowStock) statLowStock.textContent = low.toString();
}

async function loadProducts() {
  list.innerHTML = "";
  productCache.clear();
  const snapshot = await getDocs(collection(db, "products"));
  if (snapshot.empty) {
    list.innerHTML = `<div class="glass p-6 text-center text-slate-400 col-span-full">Niciun produs. Adauga mai sus.</div>`;
    productsAll = [];
    updateStats();
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

  // curata selectiile care nu mai exista
  selectedProducts.forEach(id => {
    if (!productCache.has(id)) selectedProducts.delete(id);
  });

  updateStats();
  applyFilters();
}

function renderProductsList(items) {
  list.innerHTML = "";
  if (!items.length) {
    list.innerHTML = `<div class="glass p-6 text-center text-slate-400 col-span-full">Niciun produs. Ajusteaza filtrele.</div>`;
    syncSelectAllCheckbox();
    return;
  }
  items.forEach(data => {
    const price = formatPrice(data.price);
    const lowStock = (data.stock || 0) < 5;
    list.innerHTML += `
      <div class="product-card">
        <div class="product-img-wrap">
          <img src="${data.img}" class="product-img" alt="${data.name}">
          ${data.tag ? `<span class="badge badge-admin">${data.tag}</span>` : ""}
          ${lowStock ? `<span class="badge badge-warning">Stoc scazut</span>` : ""}
        </div>
        <div class="p-4 space-y-2">
          <div class="flex items-center justify-between text-sm text-slate-400">
            <label class="flex items-center gap-2">
              <input type="checkbox" class="select-product" data-id="${data.id}" ${selectedProducts.has(data.id) ? "checked" : ""}>
              Selecteaza
            </label>
            <span class="text-xs ${data.active ? "text-emerald-300" : "text-slate-500"}">${data.active ? "Activ" : "Inactiv"}</span>
          </div>
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm text-slate-400">${data.category || "IT"}</p>
              <p class="text-lg font-bold text-white">${data.name}</p>
            </div>
            <p class="text-blue-300 font-black">${price}</p>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <button class="pill pill-small" data-stock-dec="${data.id}">-</button>
            <span class="pill">Stoc: ${data.stock}</span>
            <button class="pill pill-small" data-stock-inc="${data.id}">+</button>
          </div>
          <div class="flex gap-2 mt-2">
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

  list.querySelectorAll("[data-stock-inc]").forEach(btn => {
    btn.addEventListener("click", () => changeStock(btn.dataset.stockInc, 1));
  });
  list.querySelectorAll("[data-stock-dec]").forEach(btn => {
    btn.addEventListener("click", () => changeStock(btn.dataset.stockDec, -1));
  });

  list.querySelectorAll(".select-product").forEach(chk => {
    chk.addEventListener("change", () => {
      const id = chk.dataset.id;
      if (!id) return;
      if (chk.checked) {
        selectedProducts.add(id);
      } else {
        selectedProducts.delete(id);
      }
      syncSelectAllCheckbox();
    });
  });
  syncSelectAllCheckbox();
}

function guardAuth() {
  onAuthStateChanged(auth, async user => {
    currentAdmin = user;
    const usesPassword = (user?.providerData || []).some(p => p.providerId === "password");
    if (user && usesPassword && !user.emailVerified) {
      showToast("Verifica email-ul pentru acces");
      await signOut(auth);
      setTimeout(() => (window.location = "index.html"), 800);
      return;
    }
    const allowed = await isAdmin(user);
    if (!user) {
      if (unsubscribeAdminNotifications) {
        unsubscribeAdminNotifications();
        unsubscribeAdminNotifications = null;
      }
      adminNotifications = [];
      renderAdminNotifications();
      showToast("Autentificare necesara");
      setTimeout(() => (window.location = "index.html"), 800);
      return;
    }
    if (!allowed) {
      if (unsubscribeAdminNotifications) {
        unsubscribeAdminNotifications();
        unsubscribeAdminNotifications = null;
      }
      adminNotifications = [];
      renderAdminNotifications();
      showToast("Acces permis doar adminilor");
      setTimeout(() => (window.location = "index.html"), 800);
      return;
    }
    isOwner = isOwnerEmail(user?.email);
    setAdminControlsState();
    subscribeOrdersFeed();
    pushAdminNotification("Logat ca admin");
    subscribeAdminNotificationsFeed();
    renderAdminNotifications();
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
  logAction("edit_product", id, { name, price, category, tag, stock, active });
  closeEditModal();
  loadProducts();
}

async function changeStock(id, delta) {
  const current = productCache.get(id);
  if (!current) return;
  const nextStock = Math.max(0, (current.stock || 0) + delta);
  await updateDoc(doc(db, "products", id), { stock: nextStock });
  showToast(`Stoc actualizat la ${nextStock}`);
  logAction("update_stock", id, { stock: nextStock, delta });
  loadProducts();
}

function getSelectedIds() {
  return Array.from(selectedProducts);
}

function requireSelection() {
  const ids = getSelectedIds();
  if (!ids.length) {
    showToast("Selecteaza cel putin un produs");
    return null;
  }
  return ids;
}

function syncSelectAllCheckbox() {
  if (!selectAllProducts) return;
  const ids = visibleProducts.map(p => p.id);
  const allSelected = ids.length > 0 && ids.every(id => selectedProducts.has(id));
  selectAllProducts.checked = allSelected;
}

function selectVisible(flag) {
  visibleProducts.forEach(p => {
    if (flag) {
      selectedProducts.add(p.id);
    } else {
      selectedProducts.delete(p.id);
    }
  });
  renderProductsList(visibleProducts);
}

async function bulkSetActive(flag) {
  const ids = requireSelection();
  if (!ids) return;
  for (const id of ids) {
    await updateDoc(doc(db, "products", id), { active: flag });
  }
  showToast(flag ? "Produse activate" : "Produse dezactivate");
  logAction(flag ? "bulk_activate" : "bulk_deactivate", "products", { ids });
  loadProducts();
}

async function bulkDeleteProducts() {
  const ids = requireSelection();
  if (!ids) return;
  const sure = confirm(`Stergi ${ids.length} produse?`);
  if (!sure) return;
  for (const id of ids) {
    await deleteDoc(doc(db, "products", id));
    selectedProducts.delete(id);
  }
  showToast("Produse sterse");
  logAction("bulk_delete_products", "products", { ids });
  loadProducts();
}

async function bulkUpdateStock() {
  const ids = requireSelection();
  if (!ids) return;
  const stock = Number(bulkStockInput?.value || 0);
  if (isNaN(stock) || stock < 0) {
    showToast("Seteaza un stoc valid");
    return;
  }
  for (const id of ids) {
    await updateDoc(doc(db, "products", id), { stock });
  }
  showToast("Stoc setat");
  logAction("bulk_set_stock", "products", { ids, stock });
  loadProducts();
}

async function bulkUpdateTag() {
  const ids = requireSelection();
  if (!ids) return;
  const tag = (bulkTagInput?.value || "").trim();
  for (const id of ids) {
    await updateDoc(doc(db, "products", id), { tag });
  }
  showToast(tag ? "Badge setat" : "Badge sters");
  logAction("bulk_set_tag", "products", { ids, tag });
  loadProducts();
}

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

async function addAdminEmail() {
  if (!requireOwner("Acordarea de acces")) return;
  const email = normalizeEmail(adminEmailInput?.value);
  const role = (adminRoleSelect?.value || "admin").toLowerCase();
  if (!email) {
    showToast("Introdu un email");
    return;
  }
  try {
    addAdminBtn.disabled = true;
    await setDoc(doc(db, "adminEmails", email), {
      email,
      role,
      createdAt: serverTimestamp()
    });
    showToast("Acces acordat");
    logAction("add_admin_email", email, { role });
    adminEmailInput.value = "";
    loadAdminEmails();
  } catch (err) {
    console.error("Nu pot salva adminul", err);
    showToast("Eroare la salvare admin");
  } finally {
    addAdminBtn.disabled = false;
  }
}

async function removeAdminEmail(email) {
  if (!requireOwner("Stergerea accesului")) return;
  if (isOwnerEmail(email)) {
    showToast("Owner nu poate fi sters");
    return;
  }
  const sure = confirm(`Stergi accesul pentru ${email}?`);
  if (!sure) return;
  try {
    await deleteDoc(doc(db, "adminEmails", email));
    showToast("Acces sters");
    logAction("remove_admin_email", email);
    loadAdminEmails();
  } catch (err) {
    console.error("Nu pot sterge admin", err);
    showToast("Eroare la stergere admin");
  }
}

async function loadAdminEmails() {
  if (!adminList) return;
  adminList.innerHTML = `<div class="glass p-4 text-slate-400 text-sm">Se incarca...</div>`;
  try {
    const snap = await getDocs(collection(db, "adminEmails"));
    if (snap.empty) {
      adminList.innerHTML = `<div class="glass p-4 text-slate-400 text-sm">Nu exista administratori setati pe email.</div>`;
      return;
    }
    const admins = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
    adminList.innerHTML = admins
      .map(
        a => `
        <div class="glass p-4 flex items-center justify-between gap-3">
          <div>
            <p class="font-bold text-white">${a.email || a.id}</p>
            <p class="text-slate-400 text-sm">Rol: ${(a.role || "admin").toUpperCase()}${(a.email || a.id).toLowerCase() === OWNER_EMAIL.toLowerCase() ? " (OWNER)" : ""}</p>
          </div>
          ${isOwner ? `<button class="btn-ghost" data-remove-admin="${a.id}">Sterge</button>` : `<span class="text-xs text-slate-500">Doar owner poate sterge</span>`}
        </div>
      `
      )
      .join("");

    adminList.querySelectorAll("[data-remove-admin]").forEach(btn => {
      btn.addEventListener("click", () => removeAdminEmail(btn.dataset.removeAdmin));
    });
  } catch (err) {
    console.error("Nu pot incarca lista admin", err);
    adminList.innerHTML = `<div class="glass p-4 text-slate-400 text-sm">Eroare la incarcarea listei</div>`;
  }
}

async function ensureOwner() {
  try {
    await setDoc(
      doc(db, "adminEmails", OWNER_EMAIL.toLowerCase()),
      { email: OWNER_EMAIL.toLowerCase(), role: "owner", createdAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.error("Nu pot seta owner", err);
  }
}

async function loadActivity() {
  if (!activityList) return;
  activityList.innerHTML = `<div class="glass p-4 text-slate-400 text-sm">Se incarca...</div>`;
  try {
    const limitVal = Number(activityLimit?.value || 15);
    const q = query(collection(db, "activityLog"), orderBy("createdAt", "desc"), limit(limitVal));
    const snap = await getDocs(q);
    if (snap.empty) {
      activityList.innerHTML = `<div class="glass p-4 text-slate-400 text-sm">Nu exista activitate inregistrata.</div>`;
      return;
    }
    const actionFilter = (activityAction?.value || "all").toLowerCase();
    const searchTerm = (activitySearch?.value || "").toLowerCase();
    const items = snap.docs
      .map(d => ({ id: d.id, ...(d.data() || {}) }))
      .filter(item => {
        const matchesAction = actionFilter === "all" || (item.action || "").toLowerCase() === actionFilter;
        const searchable = `${item.userEmail || ""} ${item.target || ""} ${item.action || ""}`.toLowerCase();
        const matchesSearch = !searchTerm || searchable.includes(searchTerm);
        return matchesAction && matchesSearch;
      });
    activityList.innerHTML = items
      .map(item => {
        const date = item.createdAt?.toDate?.()
          ? item.createdAt.toDate().toLocaleString("ro-RO", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
          : "-";
        return `
          <div class="glass p-4 flex items-center justify-between gap-3">
            <div>
              <p class="font-bold text-white text-sm">${item.action || "actiune"}</p>
              <p class="text-slate-400 text-xs">${item.target || ""}</p>
              ${item.details ? `<p class="text-slate-500 text-xs">Detalii: ${JSON.stringify(item.details)}</p>` : ""}
            </div>
            <div class="text-right text-xs text-slate-400">
              <p>${item.userEmail || item.userId || "?"}</p>
              <p>${date}</p>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    console.error("Nu pot incarca activitatea", err);
    activityList.innerHTML = `<div class="glass p-4 text-slate-400 text-sm">Eroare la incarcare</div>`;
  }
}

function subscribeOrdersFeed() {
  if (unsubscribeOrdersFeed) {
    unsubscribeOrdersFeed();
    unsubscribeOrdersFeed = null;
  }
  if (!currentAdmin) return;
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  let initialized = false;
  unsubscribeOrdersFeed = onSnapshot(
    q,
    snap => {
      snap.docChanges().forEach(change => {
        const data = change.doc.data() || {};
        if (change.type === "added") {
          const msg = `Comanda noua: ${change.doc.id.slice(0, 6)}`;
          if (initialized) showToast(msg);
        } else if (change.type === "modified") {
          const msg = `Status comanda #${change.doc.id.slice(0, 6)}: ${data.status || "actualizat"}`;
          showToast(msg);
        }
      });
      initialized = true;
    },
    err => {
      console.error("Nu pot asculta comenzi", err);
    }
  );
}

function subscribeAdminNotificationsFeed() {
  if (unsubscribeAdminNotifications) {
    unsubscribeAdminNotifications();
    unsubscribeAdminNotifications = null;
  }
  if (!currentAdmin) return;
  loadSeenAdminNotifications(currentAdmin);
  adminNotifications = [];
  adminNotificationsMap = new Map();
  renderAdminNotifications();
  const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(30));
  let initialized = false;
  unsubscribeAdminNotifications = onSnapshot(
    q,
    snap => {
      if (!initialized) {
        snap.docs.forEach(docSnap => {
          if (docSnap.metadata.hasPendingWrites) return;
          const data = docSnap.data() || {};
          const audience = (data.audience || "users").toLowerCase();
          const matchesUser =
            audience === "all" ||
            audience === "users" ||
            (audience === "user" &&
              ((data.userId || "").toString() === (currentAdmin?.uid || "") ||
                (data.email || "").toLowerCase() === (currentAdmin?.email || "").toLowerCase())) ||
            audience === "admin";
          if (!matchesUser) return;
          const ts = data.createdAt || new Date();
          pushAdminNotification(data.message || "Notificare", data.link || "", ts, docSnap.id);
        });
        initialized = true;
        return;
      }
      snap.docChanges().forEach(change => {
        if (!(change.type === "added" || change.type === "modified")) return;
        const data = change.doc.data() || {};
        if (change.doc.metadata.hasPendingWrites) return;
        const audience = (data.audience || "users").toLowerCase();
        const matchesUser =
          audience === "all" ||
          audience === "users" ||
          (audience === "user" &&
            ((data.userId || "").toString() === (currentAdmin?.uid || "") ||
              (data.email || "").toLowerCase() === (currentAdmin?.email || "").toLowerCase())) ||
          audience === "admin";
        if (!matchesUser) return;
        const msg = data.message || "Notificare";
        if (initialized) showToast(msg);
        const ts = data.createdAt || new Date();
        pushAdminNotification(msg, data.link || "", ts, change.doc.id);
      });
      initialized = true;
    },
    err => {
      console.error("Nu pot asculta notificari admin", err);
    }
  );
}

async function updateOrderStatus(id, status) {
  try {
    const orderRef = doc(db, "orders", id);
    const snap = await getDoc(orderRef);
    const data = snap.data() || {};
    await updateDoc(orderRef, { status });
    showToast("Status actualizat");
    logAction("update_order_status", id, { status });
    if (data.email) {
      await addDoc(collection(db, "notifications"), {
        audience: "user",
        email: (data.email || "").toLowerCase(),
        userId: data.userId || "",
        message: `Status comanda: ${status}`,
        link: "order.html",
        createdAt: serverTimestamp()
      });
    }
    await addDoc(collection(db, "notifications"), {
      audience: "admin",
      message: `Status comanda #${id.slice(0, 6)}: ${status}`,
      link: "admin.html#ordersSection",
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Nu pot actualiza statusul", err);
    showToast("Eroare la actualizare status");
  }
}

async function deleteOrder(id) {
  const sure = confirm("Stergi aceasta comanda?");
  if (!sure) return;
  try {
    const orderRef = doc(db, "orders", id);
    const snap = await getDoc(orderRef);
    const data = snap.data() || {};
    await deleteDoc(orderRef);
    showToast("Comanda stearsa");
    logAction("delete_order", id);
    if (data.email) {
      await addDoc(collection(db, "notifications"), {
        audience: "user",
        email: (data.email || "").toLowerCase(),
        userId: data.userId || "",
        message: "Comanda anulata/stearsa",
        link: "order.html",
        createdAt: serverTimestamp()
      });
    }
    await addDoc(collection(db, "notifications"), {
      audience: "admin",
      message: `Comanda stearsa #${id.slice(0, 6)}`,
      link: "admin.html#ordersSection",
      createdAt: serverTimestamp()
    });
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
  statusFilter?.addEventListener("change", applyFilters);
  closeEdit?.addEventListener("click", closeEditModal);
  editModal?.addEventListener("click", e => {
    if (e.target === editModal) closeEditModal();
  });
  saveEdit?.addEventListener("click", saveEditProduct);
  editImageUrl?.addEventListener("input", () => {
    editPreview.src = editImageUrl.value || editPreview.src;
  });
  refreshOrders?.addEventListener("click", loadOrdersSummary);
  selectAllProducts?.addEventListener("change", () => selectVisible(selectAllProducts.checked));
  bulkActivate?.addEventListener("click", () => bulkSetActive(true));
  bulkDeactivate?.addEventListener("click", () => bulkSetActive(false));
  bulkDelete?.addEventListener("click", bulkDeleteProducts);
  bulkSetStock?.addEventListener("click", bulkUpdateStock);
  bulkSetTag?.addEventListener("click", bulkUpdateTag);
  addAdminBtn?.addEventListener("click", addAdminEmail);
  refreshAdmins?.addEventListener("click", loadAdminEmails);
  exportProductsBtn?.addEventListener("click", exportProductsCsv);
  refreshActivity?.addEventListener("click", loadActivity);
  adminNotifyBtn?.addEventListener("click", () => adminNotifyPanel?.classList.toggle("open"));
  adminNotifyPanel?.addEventListener("click", e => {
    const markAll = e.target.closest("#adminMarkAll");
    if (markAll) {
      adminNotificationsMap.forEach((val, key) => {
        if (val.id) seenAdminNotificationIds.add(val.id);
        seenAdminNotificationKeys.add(key);
        adminNotificationsMap.set(key, { ...val, read: true });
      });
      adminNotifications = adminNotifications.map(n => ({ ...n, read: true }));
      persistSeenAdminNotifications(currentAdmin);
      renderAdminNotifications();
      return;
    }
    const item = e.target.closest("[data-admin-notify-idx]");
    if (item) {
      const idx = Number(item.dataset.adminNotifyIdx);
      const notif = adminNotifications[idx];
      if (notif) {
        adminNotifications[idx].read = true;
        const key = notif.id || `${notif.message}|${notif.link}|${notif.createdAt?.getTime?.() || 0}`;
        const existing = adminNotificationsMap.get(key);
        if (existing) adminNotificationsMap.set(key, { ...existing, read: true });
        if (notif.id) seenAdminNotificationIds.add(notif.id);
        seenAdminNotificationKeys.add(key);
        persistSeenAdminNotifications(currentAdmin);
        renderAdminNotifications();
        if (notif.link) window.location = notif.link;
      }
    }
  });
  document.addEventListener("click", e => {
    if (!adminNotifyPanel) return;
    if (adminNotifyPanel.contains(e.target) || adminNotifyBtn?.contains(e.target)) return;
    adminNotifyPanel.classList.remove("open");
  });
  activityAction?.addEventListener("change", loadActivity);
  activityLimit?.addEventListener("change", loadActivity);
  activitySearch?.addEventListener("input", () => {
    // debounce minimal via timeout
    clearTimeout(loadActivity._t);
    loadActivity._t = setTimeout(loadActivity, 250);
  });
  loadProducts();
  loadOrdersSummary();
  ensureOwner().then(() => {
    loadAdminEmails();
    setAdminControlsState();
  });
  loadActivity();
  subscribeOrdersFeed();
}

boot();
