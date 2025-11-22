import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

// aceeași configurație
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

const userEmailEl = document.getElementById("userEmail");
const userIdEl = document.getElementById("userId");
const verifiedEl = document.getElementById("verified");
const myOrdersEl = document.getElementById("myOrders");

const renderOrderCard = (order) => {
  const div = document.createElement("div");
  div.className = "bg-gray-800 p-4 rounded-lg shadow-lg";

  const created = order.createdAt?.seconds
    ? new Date(order.createdAt.seconds * 1000).toLocaleString()
    : "necunoscută";

  let total = typeof order.total === "number" ? order.total : 0;
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

  div.innerHTML = `
    <a href="order.html?id=${order.id}"
       class="text-yellow-400 font-semibold mb-1 inline-block underline hover:text-yellow-300">
       Comandă #${order.id}
    </a>
    <p class="text-gray-300 mb-1">Status: <strong>${order.status || "nouă"}</strong></p>
    <p class="text-gray-400 text-xs mb-3">Plasată la: ${created}</p>

    ${
      itemsHtml
        ? `<p class="font-semibold mb-1">Produse:</p>
           <ul class="mb-3">${itemsHtml}</ul>`
        : ""
    }

    <p class="text-lg font-bold text-yellow-400">Total: ${total.toFixed(2)} €</p>
  `;

  return div;
};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Trebuie să fii logat pentru a vedea profilul!");
    window.location.href = "index.html";
    return;
  }

  userEmailEl.textContent = user.email || "-";
  userIdEl.textContent = user.uid;
  verifiedEl.textContent = user.emailVerified ? "Da ✔" : "Nu ❌";

  const q = query(
    collection(db, "orders"),
    where("userId", "==", user.uid)
  );

  const snapshot = await getDocs(q);
  const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (!orders.length) {
    myOrdersEl.innerHTML =
      '<p class="text-gray-400">Nu ai plasat încă nicio comandă.</p>';
    return;
  }

  orders.sort((a, b) => {
    const ta = a.createdAt?.seconds || 0;
    const tb = b.createdAt?.seconds || 0;
    return tb - ta;
  });

  myOrdersEl.innerHTML = "";
  orders.forEach((o) => myOrdersEl.appendChild(renderOrderCard(o)));
});
