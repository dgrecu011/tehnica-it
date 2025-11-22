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

// aceeași config ca în app.js
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

const renderOrder = (order) => {
  const div = document.createElement("div");
  div.className = "bg-gray-800 p-4 rounded-lg shadow-lg";

  const d = order.createdAt?.seconds
    ? new Date(order.createdAt.seconds * 1000).toLocaleString()
    : "necunoscut";

  let itemsHtml = "";
  if (Array.isArray(order.items)) {
    itemsHtml = order.items
      .map(
        (i) =>
          `<li class="flex justify-between text-sm">
             <span>${i.title} x${i.quantity}</span>
             <span>${(i.price * i.quantity).toFixed(2)} €</span>
           </li>`
      )
      .join("");
  }

  div.innerHTML = `
    <p class="text-yellow-400 font-bold mb-2">Comanda #${order.id}</p>
    <p class="text-gray-300 mb-1">Status: <strong>${order.status}</strong></p>
    <p class="text-gray-300 mb-3">Plasată la: ${d}</p>

    <p class="font-semibold mb-2">Produse:</p>
    <ul class="mb-3">${itemsHtml}</ul>

    <p class="text-lg font-bold text-yellow-400">Total: ${order.total.toFixed(2)} €</p>
  `;

  return div;
};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Trebuie să fii logat pentru a vedea profilul!");
    window.location.href = "index.html";
    return;
  }

  userEmailEl.textContent = user.email;
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

  myOrdersEl.innerHTML = "";
  orders.forEach((o) => myOrdersEl.appendChild(renderOrder(o)));
});
