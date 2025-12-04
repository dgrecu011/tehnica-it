import {
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  collection,
  getDocs,
  getDoc,
  doc
} from "./firebase.js";

const productsGrid = document.getElementById("productsGrid");
const cartCount = document.getElementById("cartCount");
const toast = document.getElementById("toast");
const searchInput = document.getElementById("searchInput");
const reloadBtn = document.getElementById("reloadProducts");
const authBtn = document.getElementById("authBtn");
const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const submitAuth = document.getElementById("submitAuth");
const authEmail = document.getElementById("authEmail");
const authPass = document.getElementById("authPass");
const resetPassBtn = document.getElementById("resetPass");
const googleLoginBtn = document.getElementById("googleLogin");
const userEmail = document.getElementById("userEmail");
const toAdmin = document.getElementById("toAdmin");
const newsletterBtn = document.getElementById("newsletterBtn");
const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
const searchInputMobile = document.getElementById("searchInputMobile");
const searchResults = document.getElementById("searchResults");
const searchResultsMobile = document.getElementById("searchResultsMobile");
const cartCountMobile = document.getElementById("cartCountMobile");
const notifyBtn = document.getElementById("notifyBtn");
const notifyBadge = document.getElementById("notifyBadge");
const notifyPanel = document.getElementById("notifyPanel");
const notifyPanelMobile = document.getElementById("notifyPanelMobile");
const bottomNotify = document.getElementById("bottomNotify");
const bottomNotifyBadge = document.getElementById("bottomNotifyBadge");
const bottomSearch = document.getElementById("bottomSearch");
const bottomProfile = document.getElementById("bottomProfile");
const mobileSearchPanel = document.getElementById("mobileSearchPanel");
const closeMobileSearch = document.getElementById("closeMobileSearch");
const latestStrip = document.getElementById("latestStrip");
const authBtnMobile = document.getElementById("authBtnMobile");
const userEmailMobile = document.getElementById("userEmailMobile");
const toAdminMobile = document.getElementById("toAdminMobile");
const profileLink = document.getElementById("profileLink");
const profileLinkMobile = document.getElementById("profileLinkMobile");
let isAdminUser = false;
let currentUser = null;

let authMode = "login";
let products = [];
let unsubscribeUserNotifications = null;
let notifications = [];
let notificationsMap = new Map();
let seenNotificationIds = new Set();
const getSeenKey = user => `seenNotifs:${(user?.email || "").toLowerCase()}`;
const loadSeenNotifications = user => {
  try {
    const raw = localStorage.getItem(getSeenKey(user));
    seenNotificationIds = new Set(Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []);
  } catch {
    seenNotificationIds = new Set();
  }
};
const persistSeenNotifications = user => {
  try {
    const key = getSeenKey(user);
    localStorage.setItem(key, JSON.stringify(Array.from(seenNotificationIds).slice(-200)));
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
const fallbackImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop offset='0%' stop-color='%230ea5e9' stop-opacity='0.25'/%3E%3Cstop offset='100%' stop-color='%234f8bff' stop-opacity='0.55'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='%23050915'/%3E%3Crect x='60' y='60' width='680' height='480' rx='28' fill='url(%23g)' opacity='0.6'/%3E%3Ctext x='50%' y='50%' fill='%23e2e8f0' font-family='Arial, sans-serif' font-size='46' font-weight='700' text-anchor='middle'%3EPlaceholder imagine%3C/text%3E%3C/svg%3E";

const cartKey = "cart";
const formatPrice = value =>
  Number(value || 0).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

function isPasswordUser(user) {
  return (user?.providerData || []).some(p => p.providerId === "password");
}

function subscribeUserNotifications(user, isAdmin = false) {
  if (unsubscribeUserNotifications) {
    unsubscribeUserNotifications();
    unsubscribeUserNotifications = null;
  }
  notifications = [];
  notificationsMap = new Map();
  loadSeenNotifications(user);
  renderNotifications();
  if (!user?.email) return;
  const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(30));
  let initialized = false;
  const isAdminOnly = data => {
    const audience = (data.audience || "").toLowerCase();
    const link = (data.link || "").toLowerCase();
    return audience === "admin" || link.includes("admin.html");
  };
  unsubscribeUserNotifications = onSnapshot(
    q,
    snap => {
      if (!initialized) {
        snap.docs.forEach(docSnap => {
          if (docSnap.metadata.hasPendingWrites) return;
          const data = docSnap.data() || {};
          const audience = (data.audience || "users").toLowerCase();
          if (!isAdmin && isAdminOnly(data)) return;
          const matchesUser =
            audience === "all" ||
            audience === "users" ||
            (audience === "user" &&
              (data.userId === user.uid || (data.email || "").toLowerCase() === user.email.toLowerCase())) ||
            (audience === "admin" && isAdmin);
          if (!matchesUser) return;
          const ts = data.createdAt || new Date();
          pushNotification(data.message || "Notificare", data.link || "", ts, docSnap.id);
        });
        initialized = true;
        return;
      }
      snap.docChanges().forEach(change => {
        if (!(change.type === "added" || change.type === "modified")) return;
        const data = change.doc.data() || {};
        if (change.doc.metadata.hasPendingWrites) return; // asteptam timestampul de pe server
        const audience = (data.audience || "users").toLowerCase();
        if (!isAdmin && isAdminOnly(data)) return;
        const isOwnerAdmin = isAdmin;
        const matchesUser =
          audience === "all" ||
          audience === "users" ||
          (audience === "user" && (data.userId === user.uid || (data.email || "").toLowerCase() === user.email.toLowerCase())) ||
          (audience === "admin" && isOwnerAdmin);
        if (!matchesUser) return;
        const msg = data.message || "Notificare";
        if (initialized) showToast(msg);
        const ts = data.createdAt || new Date();
        pushNotification(msg, data.link || "", ts, change.doc.id);
      });
      initialized = true;
    },
    err => {
      console.error("Notificari user", err);
    }
  );
}

function normalizeCart() {
  const raw = JSON.parse(localStorage.getItem(cartKey)) || [];
  if (raw.length && typeof raw[0] === "string") {
    return raw.map(id => ({ id, qty: 1 }));
  }
  return raw;
}

function saveCart(data) {
  localStorage.setItem(cartKey, JSON.stringify(data));
}

function updateCartBadge() {
  const cart = normalizeCart();
  const total = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  const show = total > 0;
  cartCount.textContent = total;
  cartCount.style.display = show ? "inline-flex" : "none";
  if (cartCountMobile) {
    cartCountMobile.textContent = total;
    cartCountMobile.style.display = show ? "inline-flex" : "none";
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 2200);
}

function renderNotifications() {
  if (!notifyBadge || !notifyPanel) return;
  // asiguram ordonare desc dupa createdAt
  const ordered = [...notificationsMap.values()].sort(
    (a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)
  );
  notifications = ordered;
  const unread = notifications.filter(n => !n.read).length;
  notifyBadge.textContent = unread;
  notifyBadge.style.display = unread ? "inline-flex" : "none";
  if (bottomNotifyBadge) {
    bottomNotifyBadge.textContent = unread;
    bottomNotifyBadge.style.display = unread ? "inline-flex" : "none";
  }
  const items = notifications.slice(0, 20);
  const panelContent = `
    <div class="notify-header">
      <span>Notificari</span>
      <button id="markAllNotify" class="text-blue-300 text-xs">Marcheaza citite</button>
    </div>
    ${
      items.length
        ? items
            .map(
              (n, idx) =>
                `<div class="notify-item ${n.read ? "" : "unread"}" data-notify-idx="${
                  notifications.length - 1 - idx
                }" ${n.link ? `data-link="${n.link}"` : ""}>
                  <span>${n.message}</span>
                  <span class="text-xs text-slate-400">${n.time}</span>
                </div>`
            )
            .join("")
        : `<div class="text-sm text-slate-400">Fara notificari</div>`
    }
  `;
  notifyPanel.innerHTML = panelContent;
  if (notifyPanelMobile) {
    notifyPanelMobile.innerHTML = panelContent;
  }
}

function pushNotification(message, link = "", createdAt = null, id = null) {
  const ts = createdAt || new Date();
  const d = ts?.toDate ? ts.toDate() : ts;
  const time = formatNotifTime(d || ts);
  const ms = d?.getTime?.() || (ts instanceof Date ? ts.getTime() : 0) || 0;
  const read = id && seenNotificationIds.has(id);
  const key = id || `${message}|${link}|${ms}`;
  const base = { id, message, time, link, createdAt: d || ts, read };
  const existing = notificationsMap.get(key);
  const entry = existing ? { ...existing, ...base, read: existing.read || read } : base;
  notificationsMap.set(key, entry);
  if (notificationsMap.size > 40) {
    const latest = [...notificationsMap.values()].sort(
      (a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)
    );
    notificationsMap = new Map(latest.slice(0, 40).map(n => [n.id || `${n.message}|${n.link}|${n.createdAt?.getTime?.() || 0}`, n]));
  }
  renderNotifications();
}

function renderSkeleton() {
  productsGrid.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    productsGrid.innerHTML += `
      <div class="product-card p-5">
        <div class="skeleton product-img"></div>
        <div class="mt-4 space-y-3">
          <div class="skeleton h-4 w-2/3"></div>
          <div class="skeleton h-4 w-1/2"></div>
          <div class="skeleton h-10 w-full"></div>
        </div>
      </div>
    `;
  }
}

function renderProducts(list) {
  productsGrid.innerHTML = "";
  if (!list.length) {
    productsGrid.innerHTML = `<div class="glass p-6 text-center text-slate-400 col-span-full">Momentan nu sunt produse listate. Revino curand sau contacteaza echipa noastra.</div>`;
    return;
  }

  list.forEach(item => {
    const price = formatPrice(item.price);
    const imgSrc = item.img || fallbackImg;
    productsGrid.innerHTML += `
      <article class="product-card">
        ${item.tag ? `<span class="badge">${item.tag}</span>` : ""}
        <a href="product.html?id=${item.id}" class="block">
          <img class="product-img" src="${imgSrc}" alt="${item.name || "Produs"}" onerror="this.onerror=null;this.src='${fallbackImg}'">
        </a>
        <div class="p-5 space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm text-slate-400">${item.category || "IT"}</p>
              <a href="product.html?id=${item.id}" class="text-lg font-bold text-white leading-tight hover:text-blue-300 transition">${item.name || "Produs"}</a>
            </div>
            <div class="text-right">
              <p class="text-slate-400 text-xs">Pret</p>
              <p class="text-xl font-black text-blue-300">${price}</p>
            </div>
          </div>
          <button class="btn-primary w-full flex items-center justify-center gap-2" data-id="${item.id}">
            <i class="fa-solid fa-cart-plus"></i> Adauga in cos
          </button>
          <a class="btn-ghost w-full text-center block" href="product.html?id=${item.id}">Vezi detalii</a>
        </div>
      </article>
    `;
  });

  productsGrid.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });
}

async function loadProducts() {
  renderSkeleton();
  try {
    const snapshot = await getDocs(collection(db, "products"));
    products = snapshot.docs.map(p => {
      const data = p.data() || {};
      return {
        id: p.id,
        name: data.name || data.title || "Produs",
        price: Number(data.price || 0),
        category: data.category || "IT",
        tag: data.tag || "",
        img: data.img || data.imageURL || data.imageUrl || ""
      };
    });
    renderProducts(products);
const tagged = products.filter(p => (p.tag || "").toLowerCase().includes("nou"));
    const pool = tagged.length ? tagged : products;
    const uniquePool = pool.slice(-10); // ultimele din lista incarcata
    const recommended = uniquePool.slice(-5).slice(-Math.max(3, Math.min(5, uniquePool.length)));
    renderLatestStrip(products);
  } catch (err) {
    console.error("Nu pot incarca produsele", err);
    showToast("Eroare la incarcarea produselor");
    renderProducts([]);
  }
}

function addToCart(id) {
  const cart = normalizeCart();
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ id, qty: 1 });
  }
  saveCart(cart);
  updateCartBadge();
  showToast("Produs adaugat in cos");
}

function filterProducts(term) {
  const t = term.toLowerCase();
  const filtered = products.filter(p =>
    (p.name || "").toLowerCase().includes(t) ||
    (p.category || "").toLowerCase().includes(t)
  );
  renderProducts(filtered);
}

function renderRecommended(list) {
  return; // carousel removed
}

function renderSearchResults(list, target) {
  if (!target) return;
  if (!list.length) {
    target.innerHTML = `<div class="text-slate-400 text-sm px-2 py-1">Nicio potrivire</div>`;
    target.classList.add("open");
    return;
  }

  target.innerHTML = list
    .slice(0, 6)
    .map(
      p => `
      <a class="search-item" href="product.html?id=${p.id}">
        <span>${p.name}</span>
        <span class="text-blue-300 font-bold text-sm">${formatPrice(p.price)}</span>
      </a>
    `
    )
    .join("");
  target.classList.add("open");
}

function handleSearch(term, target, renderList = true) {
  const t = term.trim().toLowerCase();
  if (!t) {
    target?.classList.remove("open");
    return products;
  }
  const filtered = products.filter(
    p =>
      (p.name || "").toLowerCase().includes(t) ||
      (p.category || "").toLowerCase().includes(t)
  );
  if (renderList) renderSearchResults(filtered, target);
  return filtered;
}

function pickRandom(arr, count) {
  const copy = [...arr];
  const res = [];
  while (copy.length && res.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    res.push(copy.splice(idx, 1)[0]);
  }
  return res;
}

function closeMobileNav() {
  mobileNav?.classList.remove("open");
}

function initMobileNav() {
  if (!menuToggle || !mobileNav) return;

  menuToggle.addEventListener("click", () => {
    const willOpen = !mobileNav.classList.contains("open");
    mobileNav.classList.toggle("open");
    if (willOpen) {
      mobileNav.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  mobileNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => closeMobileNav());
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) {
      closeMobileNav();
    }
  });

  document.addEventListener("click", e => {
    if (!mobileNav.classList.contains("open")) return;
    const target = e.target;
    if (target === menuToggle || menuToggle.contains(target)) return;
    if (mobileNav.contains(target)) return;
    closeMobileNav();
  });
}

function initNotificationsBell() {
  if (!notifyBtn || !notifyPanel) return;
  const closePanels = () => {
    notifyPanel.classList.remove("open");
    notifyPanelMobile?.classList.remove("open");
    notifyBtn?.classList.remove("active");
  };

  notifyBtn.addEventListener("click", () => {
    const isOpen = notifyPanel.classList.contains("open");
    closePanels();
    if (!isOpen) notifyPanel.classList.add("open");
    notifyBtn.classList.toggle("active", !isOpen);
  });

  bottomNotify?.addEventListener("click", () => {
    const useMobilePanel = window.innerWidth <= 900 && notifyPanelMobile;
    const targetPanel = useMobilePanel ? notifyPanelMobile : notifyPanel;
    const isOpen = targetPanel.classList.contains("open");
    closePanels();
    if (!isOpen) targetPanel.classList.add("open");
    notifyBtn?.classList.toggle("active", !isOpen);
  });

  document.addEventListener("click", e => {
    if (notifyPanel.contains(e.target) || notifyBtn.contains(e.target)) return;
    if (bottomNotify && bottomNotify.contains(e.target)) return;
    if (notifyPanelMobile && notifyPanelMobile.contains(e.target)) return;
    closePanels();
  });

  const handlePanelClick = panel => panel?.addEventListener("click", e => {
    const markAll = e.target.closest("#markAllNotify");
    if (markAll) {
      notificationsMap.forEach((val, key) => {
        if (val.id) seenNotificationIds.add(val.id);
        notificationsMap.set(key, { ...val, read: true });
      });
      notifications = notifications.map(n => {
        if (n.id) seenNotificationIds.add(n.id);
        return { ...n, read: true };
      });
      persistSeenNotifications(currentUser);
      renderNotifications();
      return;
    }
    const item = e.target.closest("[data-notify-idx]");
    if (item) {
      const idx = Number(item.dataset.notifyIdx);
      const notif = notifications[idx];
      if (!notif) return;
      notifications[idx].read = true;
      const key = notif.id || `${notif.message}|${notif.link}|${notif.createdAt?.getTime?.() || 0}`;
      const existing = notificationsMap.get(key);
      if (existing) notificationsMap.set(key, { ...existing, read: true });
      if (notif.id) {
        seenNotificationIds.add(notif.id);
        persistSeenNotifications(currentUser);
      }
      renderNotifications();
      if (notif.link) window.location = notif.link;
    }
  });

  handlePanelClick(notifyPanel);
  handlePanelClick(notifyPanelMobile);
  renderNotifications();
}

function setAdminVisibility(isAdmin) {
  [toAdmin, toAdminMobile].forEach(btn => {
    if (!btn) return;
    btn.classList.toggle("hidden", !isAdmin);
  });
  const footerAdmin = document.getElementById("footerAdmin");
  if (footerAdmin) footerAdmin.classList.toggle("hidden", !isAdmin);
}

function setProfileVisibility(show) {
  [profileLink, profileLinkMobile].forEach(link => {
    if (!link) return;
    link.classList.toggle("hidden", !show);
  });
  if (!bottomProfile) return;
  const label = bottomProfile.querySelector("span");
  if (show) {
    if (label) label.textContent = "Profil";
    bottomProfile.href = "profile.html";
    bottomProfile.onclick = null;
  } else {
    if (label) label.textContent = "Autentificare";
    bottomProfile.href = "#";
    bottomProfile.onclick = e => {
      e.preventDefault();
      openAuth("login");
    };
  }
}

async function resolveAdmin(user) {
  if (!user) return false;
  try {
    const snap = await getDoc(doc(db, "admins", user.uid));
    const roleUid = (snap.data()?.role || "").toLowerCase();
    const byUid = snap.exists() && (roleUid === "admin" || roleUid === "owner");
    let byEmail = false;
    if (user.email) {
      const snapEmail = await getDoc(doc(db, "adminEmails", user.email.toLowerCase()));
      const roleEmail = (snapEmail.data()?.role || "").toLowerCase();
      byEmail = snapEmail.exists() && (roleEmail === "admin" || roleEmail === "owner");
    }
    if (byUid || byEmail) {
      return true;
    }
    return false;
  } catch (err) {
    console.error("Nu pot verifica rolul admin", err);
    return false;
  }
}

function openAuth(mode) {
  authMode = mode;
  tabLogin.classList.toggle("btn-primary", mode === "login");
  tabLogin.classList.toggle("btn-ghost", mode !== "login");
  tabRegister.classList.toggle("btn-primary", mode === "register");
  tabRegister.classList.toggle("btn-ghost", mode !== "register");
  authModal.classList.add("open");
}

function closeAuthModal() {
  authModal.classList.remove("open");
}

function initAuth() {
  tabLogin?.addEventListener("click", () => openAuth("login"));
  tabRegister?.addEventListener("click", () => openAuth("register"));
  authBtn?.addEventListener("click", () => openAuth("login"));
  authBtnMobile?.addEventListener("click", () => openAuth("login"));
  closeAuth?.addEventListener("click", closeAuthModal);

  submitAuth?.addEventListener("click", async () => {
    const email = authEmail.value;
    const pass = authPass.value;
    if (!email || !pass) {
      showToast("Completeaza email si parola");
      return;
    }

    try {
      if (authMode === "login") {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        if (!cred.user.emailVerified) {
          await sendEmailVerification(cred.user);
          showToast("Verifica email-ul trimis pentru confirmare");
          await signOut(auth);
          return;
        }
        showToast("Logat");
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await sendEmailVerification(cred.user);
        showToast("Verifica email-ul trimis pentru confirmare");
        await signOut(auth);
        return;
      }
      closeAuthModal();
    } catch (err) {
      console.error("Auth error", err);
      const map = {
        "auth/popup-blocked": "Permite fereastra de login",
        "auth/popup-closed-by-user": "Fereastra de login inchisa",
        "auth/invalid-credential": "Email sau parola invalida",
        "auth/user-not-found": "Cont inexistent",
        "auth/wrong-password": "Parola gresita",
        "auth/too-many-requests": "Prea multe incercari, asteapta putin"
      };
      const msg = map[err?.code] || "Eroare la autentificare";
      showToast(msg);
    }
  });

  onAuthStateChanged(auth, async user => {
    currentUser = user;
    if (user && isPasswordUser(user) && !user.emailVerified) {
      showToast("Verifica email-ul pentru a continua");
      await signOut(auth);
      return;
    }
    isAdminUser = await resolveAdmin(user);
    subscribeUserNotifications(user, isAdminUser);
    const bottomProfileLabel = bottomProfile?.querySelector("span");
    if (user) {
      if (userEmail) userEmail.textContent = user.email;
      if (userEmailMobile) userEmailMobile.textContent = user.email;
      if (bottomProfileLabel) bottomProfileLabel.textContent = "Profil";
      setProfileVisibility(true);
    } else {
      if (userEmail) userEmail.textContent = "Conecteaza-te";
      if (userEmailMobile) userEmailMobile.textContent = "Profil";
      if (bottomProfileLabel) bottomProfileLabel.textContent = "Profil";
      setProfileVisibility(false);
    }

    const setAuthButton = btn => {
      if (!btn) return;
      if (user) {
        btn.textContent = "Logout";
        btn.onclick = async () => {
          await signOut(auth);
          showToast("Delogat");
          closeMobileNav();
          setAdminVisibility(false);
          setProfileVisibility(false);
        };
      } else {
        btn.textContent = "Autentificare";
        btn.onclick = () => {
          openAuth("login");
          closeMobileNav();
          setAdminVisibility(false);
          setProfileVisibility(false);
        };
      }
    };

    setAuthButton(authBtn);
    setAuthButton(authBtnMobile);
    setAdminVisibility(isAdminUser);
  });

  resetPassBtn?.addEventListener("click", async () => {
    const email = authEmail.value.trim();
    if (!email) {
      showToast("Introdu emailul pentru resetare");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Link de resetare trimis");
    } catch (err) {
      console.error("Nu pot trimite resetarea", err);
      showToast("Eroare la resetare");
    }
  });

  googleLoginBtn?.addEventListener("click", async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      showToast("Logat cu Google");
      closeAuthModal();
    } catch (err) {
      console.error("Google login esuat", err);
      const map = {
        "auth/popup-blocked": "Permite fereastra de login",
        "auth/popup-closed-by-user": "Fereastra de login inchisa",
        "auth/unauthorized-domain": "Adauga domeniul in Firebase > Authorized domains"
      };
      const msg = map[err?.code] || "Eroare la login Google";
      showToast(msg);
    }
  });
}

function initSearch() {
  const onInputDesktop = e => {
    const filtered = handleSearch(e.target.value, searchResults, true);
    renderProducts(filtered);
  };
  const onInputMobile = e => {
    const filtered = handleSearch(e.target.value, searchResultsMobile, true);
    renderProducts(filtered);
  };

  searchInput?.addEventListener("input", onInputDesktop);
  searchInputMobile?.addEventListener("input", onInputMobile);

  document.addEventListener("click", e => {
    if (searchResults && !searchResults.contains(e.target) && e.target !== searchInput) {
      searchResults.classList.remove("open");
    }
    if (searchResultsMobile && !searchResultsMobile.contains(e.target) && e.target !== searchInputMobile) {
      searchResultsMobile.classList.remove("open");
    }
  });
}

function initReload() {
  reloadBtn?.addEventListener("click", loadProducts);
}

function initNewsletter() {
  newsletterBtn?.addEventListener("click", () => showToast("Te-ai abonat la newsletter"));
}

function initShortcuts() {
  [toAdmin, toAdminMobile].forEach(btn => {
    btn?.addEventListener("click", () => {
      window.location = "admin.html";
      closeMobileNav();
    });
  });
}

function initBottomNav() {
  bottomSearch?.addEventListener("click", () => {
    if (mobileSearchPanel) {
      mobileSearchPanel.classList.add("open");
      setTimeout(() => searchInputMobile?.focus(), 200);
    }
  });

  closeMobileSearch?.addEventListener("click", () => mobileSearchPanel?.classList.remove("open"));
  mobileSearchPanel?.addEventListener("click", e => {
    if (e.target === mobileSearchPanel) mobileSearchPanel.classList.remove("open");
  });
}

function renderLatestStrip(data) {
  if (!latestStrip) return;
  if (!data.length) {
    latestStrip.innerHTML = `<div class="text-slate-400 text-sm">Nu exista produse.</div>`;
    return;
  }
  const items = data.slice(-5);
  const doubled = [...items, ...items];
  latestStrip.innerHTML = `<div class="strip-inner">${doubled
    .map(
      item => `
        <a class="strip-item" href="product.html?id=${item.id}">
          <img src="${item.img || fallbackImg}" alt="${item.name}">
          <div>
            <p class="text-xs text-slate-400">${item.category || "Produs"}</p>
            <p class="text-white font-bold">${item.name}</p>
            <p class="text-blue-300 font-black text-sm">${formatPrice(item.price)}</p>
          </div>
        </a>
      `
    )
    .join("")}</div>`;
}

function boot() {
  setAdminVisibility(false);
  setProfileVisibility(false);
  updateCartBadge();
  renderSkeleton();
  loadProducts();
  initAuth();
  initMobileNav();
  initNotificationsBell();
  initSearch();
  initReload();
  initNewsletter();
  initShortcuts();
  initBottomNav();
}

boot();
