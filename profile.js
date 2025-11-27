import {
  auth,
  db,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  onAuthStateChanged,
  signOut
} from "./firebase.js";

const profileBox = document.getElementById("profileData");
const logoutBtn = document.getElementById("logoutBtn");
const toAdmin = document.getElementById("toAdmin");
const toast = document.getElementById("toast");
const copyUid = document.getElementById("copyUid");
const userEmailLabel = document.getElementById("userEmailLabel");
const userUidLabel = document.getElementById("userUidLabel");
const userCreatedLabel = document.getElementById("userCreatedLabel");
const userLastLoginLabel = document.getElementById("userLastLoginLabel");
const userProviderLabel = document.getElementById("userProviderLabel");
const userRoleLabel = document.getElementById("userRoleLabel");
const userVerifiedLabel = document.getElementById("userVerifiedLabel");
const orderCountEl = document.getElementById("orderCount");
const lastOrderLabel = document.getElementById("lastOrderLabel");
const accountStatusLabel = document.getElementById("accountStatusLabel");
const recentOrders = document.getElementById("recentOrders");
const orderDetailModal = document.getElementById("orderDetailModal");
const detailOrderId = document.getElementById("detailOrderId");
const detailOrderDate = document.getElementById("detailOrderDate");
const detailOrderStatus = document.getElementById("detailOrderStatus");
const detailOrderTotal = document.getElementById("detailOrderTotal");
const detailItems = document.getElementById("detailItems");
const closeOrderDetail = document.getElementById("closeOrderDetail");
let recentOrdersCache = [];
const fallbackImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop offset='0%' stop-color='%230ea5e9' stop-opacity='0.25'/%3E%3Cstop offset='100%' stop-color='%234f8bff' stop-opacity='0.55'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='300' fill='%23050915'/%3E%3Crect x='30' y='30' width='340' height='240' rx='20' fill='url(%23g)' opacity='0.6'/%3E%3Ctext x='50%' y='50%' fill='%23e2e8f0' font-family='Arial, sans-serif' font-size='20' font-weight='700' text-anchor='middle'%3EProdus%3C/text%3E%3C/svg%3E";

function isPasswordUser(user) {
  return (user?.providerData || []).some(p => p.providerId === "password");
}

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

function showToast(message) {
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 2200);
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
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

function renderOrdersList(list) {
  if (!recentOrders) return;
  recentOrdersCache = list;
  if (!list.length) {
    recentOrders.innerHTML = `<div class="glass p-4 text-sm text-slate-400">Nu ai comenzi inca.</div>`;
    return;
  }
  recentOrders.innerHTML = list
    .slice(0, 8)
    .map(order => {
      const itemsText = (order.items || [])
        .slice(0, 3)
        .map(it => `${it.name || it.title || "Produs"} x${it.qty || 1}`)
        .join(", ");
      const firstImg =
        (order.items || []).find(it => it.img || it.imageURL || it.imageUrl || it.image) || {};
      const imgSrc = firstImg.img || firstImg.imageURL || firstImg.imageUrl || firstImg.image || fallbackImg;
      return `
        <div class="glass p-4 space-y-2">
          <div class="flex items-center gap-3">
            <img src="${imgSrc}" alt="${(order.items?.[0]?.name || order.id)}" class="w-16 h-16 rounded-lg object-cover border border-white/10" onerror="this.onerror=null;this.src='${fallbackImg}'">
            <div class="flex-1">
              <div class="flex items-center justify-between text-sm text-slate-400">
                <span>#${order.id.slice(0, 6)}</span>
                <span>${order.createdLabel}</span>
              </div>
              <div class="flex items-center justify-between">
                <p class="text-white font-bold">${order.statusLabel}</p>
                <p class="text-blue-300 font-black">${order.totalFormatted}</p>
              </div>
            </div>
          </div>
          ${itemsText ? `<p class="text-xs text-slate-400 truncate">Items: ${itemsText}</p>` : ""}
          <button class="text-sm text-blue-300 underline" data-order-detail="${order.id}">Vezi detalii</button>
        </div>
      `;
    })
    .join("");
  recentOrders.querySelectorAll("[data-order-detail]").forEach(btn => {
    btn.addEventListener("click", () => openOrderDetail(btn.dataset.orderDetail));
  });
}

async function loadOrdersForUser(user) {
  if (!user?.email) return { count: 0, last: "-", list: [] };
  try {
    const q = query(collection(db, "orders"), where("email", "==", user.email));
    const snap = await getDocs(q);
    if (snap.empty) return { count: 0, last: "-", list: [] };
    const orders = snap.docs
      .map(d => {
        const data = d.data() || {};
        const createdAt =
          data.createdAt?.toDate?.() ||
          data.timestamp?.toDate?.() ||
          data.date?.toDate?.() ||
          null;
        const total = getOrderTotal(data);
        const status = (data.status || "new").toString().toLowerCase();
        const items = Array.isArray(data.items) ? data.items : [];
        return {
          id: d.id,
          createdAt,
          total,
          status,
          items,
          totalFormatted: formatPrice(total),
          statusLabel:
            {
              new: "Noua",
              processing: "In lucru",
              shipped: "Trimisa",
              done: "Finalizata",
              canceled: "Anulata"
            }[status] || status,
          createdLabel: createdAt
            ? createdAt.toLocaleString("ro-RO", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
            : "-"
        };
      })
      .sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
    const last = orders[0]?.createdLabel || "-";
    return { count: snap.size, last, list: orders };
  } catch (err) {
    console.error("Nu pot incarca comenzile utilizatorului", err);
    return { count: 0, last: "-", list: [] };
  }
}

function renderProfile(user, admin, ordersMeta) {
  if (!user) return;
  const created = new Date(user.metadata.creationTime).toLocaleString();
  const lastLogin = new Date(user.metadata.lastSignInTime).toLocaleString();
  const provider = user.providerData?.[0]?.providerId || "email/password";
  if (userEmailLabel) userEmailLabel.textContent = user.email || "-";
  if (userUidLabel) userUidLabel.textContent = user.uid || "-";
  if (userCreatedLabel) userCreatedLabel.textContent = created;
  if (userLastLoginLabel) userLastLoginLabel.textContent = lastLogin;
  if (userProviderLabel) userProviderLabel.textContent = provider;
  if (userRoleLabel) userRoleLabel.textContent = admin ? "Admin" : "Utilizator";
  if (userVerifiedLabel) {
    userVerifiedLabel.textContent = user.emailVerified ? "Email verificat" : "Email neverificat";
    userVerifiedLabel.classList.toggle("pill", true);
    userVerifiedLabel.classList.toggle("text-emerald-300", user.emailVerified);
    userVerifiedLabel.classList.toggle("text-amber-300", !user.emailVerified);
  }
  if (orderCountEl) orderCountEl.textContent = (ordersMeta?.count || 0).toString();
  if (lastOrderLabel) lastOrderLabel.textContent = ordersMeta?.last || "-";
  if (accountStatusLabel) accountStatusLabel.textContent = "Activ";
  if (toAdmin) toAdmin.classList.toggle("hidden", !admin);
  renderOrdersList(ordersMeta?.list || []);
}

function openOrderDetail(id) {
  if (!orderDetailModal) return;
  const order = recentOrdersCache.find(o => o.id === id);
  if (!order) return;
  detailOrderId.textContent = `#${order.id}`;
  detailOrderDate.textContent = order.createdLabel || "-";
  detailOrderStatus.textContent = order.statusLabel || "-";
  detailOrderTotal.textContent = order.totalFormatted || "-";
  detailItems.innerHTML = (order.items || [])
    .map(item => {
      const img = item.img || item.imageURL || item.imageUrl || item.image || fallbackImg;
      const name = item.name || item.title || "Produs";
      const qty = item.qty || 1;
      const price = formatPrice(Number(item.price || 0));
      return `
        <div class="glass p-3 flex items-center gap-3">
          <img src="${img}" alt="${name}" class="w-12 h-12 rounded-lg object-cover border border-white/10" onerror="this.onerror=null;this.src='${fallbackImg}'">
          <div class="flex-1">
            <p class="font-bold text-white">${name}</p>
            <p class="text-xs text-slate-400">Cantitate: ${qty}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-400">Pret</p>
            <p class="text-blue-300 font-bold">${price}</p>
          </div>
        </div>
      `;
    })
    .join("");
  orderDetailModal.classList.add("open");
}

function closeOrderDetailModal() {
  orderDetailModal?.classList.remove("open");
}

onAuthStateChanged(auth, async user => {
  if (!user) {
    if (profileBox) profileBox.innerHTML = `<p class="text-slate-400">Nu esti autentificat. Te redirectionam...</p>`;
    setTimeout(() => (window.location = "index.html"), 800);
    return;
  }

  if (isPasswordUser(user) && !user.emailVerified) {
    showToast("Verifica email-ul pentru a continua");
    await signOut(auth);
    setTimeout(() => (window.location = "index.html"), 800);
    return;
  }

  const admin = await isAdmin(user);
  const ordersMeta = await loadOrdersForUser(user);
  renderProfile(user, admin, ordersMeta);
});

logoutBtn.onclick = async () => {
  await signOut(auth);
  showToast("Delogat");
  setTimeout(() => (window.location = "index.html"), 500);
};

toAdmin.onclick = () => {
  const user = auth.currentUser;
  if (!user) {
    showToast("Autentificare necesara");
    return;
  }
  if (toAdmin.classList.contains("hidden")) {
    showToast("Acces doar pentru admin");
    return;
  }
  window.location = "admin.html";
};

copyUid?.addEventListener("click", async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    await navigator.clipboard.writeText(uid);
    showToast("UID copiat");
  } catch (err) {
    console.error("Nu pot copia UID", err);
    showToast("Nu pot copia UID");
  }
});

closeOrderDetail?.addEventListener("click", closeOrderDetailModal);
orderDetailModal?.addEventListener("click", e => {
  if (e.target === orderDetailModal) closeOrderDetailModal();
});
