import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
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

const adminContent = document.getElementById("adminContent");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    adminContent.innerHTML = "<p class='text-red-400'>Trebuie să fii logat pentru a accesa panoul admin.</p>";
    return;
  }

  const adminDoc = await getDoc(doc(db, "admins", user.uid));
  if (!adminDoc.exists()) {
    adminContent.innerHTML = "<p class='text-red-400'>Nu ai drepturi de admin.</p>";
    return;
  }

  // dacă e admin → încărcăm produse + comenzi
  const [productsSnap, ordersSnap] = await Promise.all([
    getDocs(collection(db, "products")),
    getDocs(collection(db, "orders"))
  ]);

  let html = "";

  html += "<section>";
  html += "<h2 class='text-xl font-bold text-yellow-400 mb-2'>Produse</h2>";
  if (productsSnap.empty) {
    html += "<p class='text-gray-300 mb-4'>Nu există produse.</p>";
  } else {
    html += "<ul class='space-y-1 mb-4'>";
    productsSnap.forEach((d) => {
      const p = d.data();
      html += `<li class='text-gray-200 text-sm'>${p.title || "(fără titlu)"} - ${p.price || 0} €</li>`;
    });
    html += "</ul>";
  }
  html += "</section>";

  html += "<section class='mt-6'>";
  html += "<h2 class='text-xl font-bold text-yellow-400 mb-2'>Comenzi</h2>";
  if (ordersSnap.empty) {
    html += "<p class='text-gray-300'>Nu există comenzi.</p>";
  } else {
    html += "<ul class='space-y-2'>";
    ordersSnap.forEach((d) => {
      const o = d.data();
      html += `<li class='text-gray-200 text-sm border border-gray-700 rounded p-2'>
          <div><span class='font-semibold'>Client:</span> ${o.customer?.name || "N/A"}</div>
          <div><span class='font-semibold'>Total:</span> ${o.total?.toFixed ? o.total.toFixed(2) : o.total} €</div>
        </li>`;
    });
    html += "</ul>";
  }
  html += "</section>";

  adminContent.innerHTML = html;
});
