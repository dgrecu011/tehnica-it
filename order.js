import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

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

const orderInfo = document.getElementById("orderInfo");

const params = new URLSearchParams(window.location.search);
const orderId = params.get("id");

if (!orderId) {
  orderInfo.innerHTML = `<p class="text-red-400">ID comandă lipsă.</p>`;
}

const loadOrder = async () => {
  if (!orderId) return;
  try {
    const ref = doc(db, "orders", orderId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      orderInfo.innerHTML = `<p class="text-red-400">Comanda nu există.</p>`;
      return;
    }

    const order = snap.data();

    const created = order.createdAt?.seconds
      ? new Date(order.createdAt.seconds * 1000).toLocaleString()
      : "necunoscută";

    let total = order.total || 0;
    if (!total && Array.isArray(order.items)) {
      total = order.items.reduce(
        (s, i) => s + Number(i.price || 0) * Number(i.quantity || 1),
        0
      );
    }

    const itemsHtml = (order.items || [])
      .map(
        (i) => `
        <li class="flex justify-between text-sm mb-1">
          <span>${i.title} <span class="text-gray-400">x${i.quantity}</span></span>
          <span>${(i.price * i.quantity).toFixed(2)} €</span>
        </li>`
      )
      .join("");

    const statuses = ["nouă", "în procesare", "expediată", "livrată"];
    const currentIndex = statuses.indexOf(order.status || "nouă");

    const timelineHtml = statuses
      .map(
        (s, idx) => `
      <div class="flex items-center">
        <div class="w-3 h-3 rounded-full ${
          idx <= currentIndex ? "bg-yellow-400" : "bg-gray-600"
        }"></div>
        <span class="ml-2 ${
          idx <= currentIndex ? "text-yellow-300" : "text-gray-400"
        }">${s}</span>
      </div>
    `
      )
      .join("");

    orderInfo.innerHTML = `
      <div class="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">

        <p><strong>ID Comandă:</strong> ${orderId}</p>
        <p><strong>Status:</strong> <span class="text-yellow-400">${order.status || "nouă"}</span></p>
        <p><strong>Plasată la:</strong> ${created}</p>

        <h3 class="text-xl font-bold text-yellow-400 mt-6">Timeline comandă</h3>
        <div class="space-y-2">
          ${timelineHtml}
        </div>

        <h3 class="text-xl font-bold text-yellow-400 mt-6">Produse</h3>
        <ul class="space-y-1">${itemsHtml}</ul>

        <h3 class="text-xl font-bold text-yellow-400 mt-6">Total</h3>
        <p class="text-2xl font-bold">${total.toFixed(2)} €</p>

        <h3 class="text-xl font-bold text-yellow-400 mt-6">Detalii client</h3>
        <p><strong>Nume:</strong> ${order.customer?.name || "-"}</p>
        <p><strong>Email:</strong> ${order.customer?.email || "-"}</p>
        <p><strong>Telefon:</strong> ${order.customer?.phone || "-"}</p>
        <p><strong>Oraș:</strong> ${order.customer?.city || "-"}</p>
        <p><strong>Adresă:</strong> ${order.customer?.address || "-"}</p>

        ${
          order.customer?.notes
            ? `<p><strong>Note:</strong> ${order.customer.notes}</p>`
            : ""
        }
      </div>
    `;
  } catch (err) {
    orderInfo.innerHTML = `<p class="text-red-400">Eroare la citirea comenzii.</p>`;
    console.error(err);
  }
};

loadOrder();
