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

const orderContent = document.getElementById("orderContent");

function getOrderIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

(async () => {
  const id = getOrderIdFromUrl();
  if (!id) {
    orderContent.innerHTML = "<p class='text-red-400'>Lipsește ID-ul comenzii.</p>";
    return;
  }

  const ref = doc(db, "orders", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    orderContent.innerHTML = "<p class='text-red-400'>Comanda nu a fost găsită.</p>";
    return;
  }

  const o = snap.data();
  let html = "";
  html += `<p class='mb-2'><span class='font-semibold'>Comandă:</span> ${id}</p>`;
  html += `<p class='mb-2'><span class='font-semibold'>Client:</span> ${o.customer?.name || "-"} (${o.customer?.email || "-"})</p>`;
  html += `<p class='mb-2'><span class='font-semibold'>Total:</span> ${o.total?.toFixed ? o.total.toFixed(2) : o.total} €</p>`;
  html += "<h2 class='mt-4 mb-2 font-semibold text-yellow-400'>Produse</h2>";

  if (Array.isArray(o.items) && o.items.length) {
    html += "<ul class='space-y-1'>";
    o.items.forEach((i) => {
      html += `<li>- ${i.title} x${i.quantity} (${(i.price * i.quantity).toFixed(2)} €)</li>`;
    });
    html += "</ul>";
  } else {
    html += "<p>Fără produse.</p>";
  }

  orderContent.innerHTML = html;
})();
