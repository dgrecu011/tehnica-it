import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
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

const userEmailEl = document.getElementById("userEmail");
const userIdEl = document.getElementById("userId");
const ordersList = document.getElementById("ordersList");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    userEmailEl.textContent = "Nu ești logat. Te rugăm să revii în magazin și să te loghezi.";
    userIdEl.textContent = "";
    ordersList.innerHTML = "<p class='text-red-400'>Nu poți vedea comenzile fără autentificare.</p>";
    return;
  }

  userEmailEl.textContent = "Email: " + (user.email || "-");
  userIdEl.textContent = "UID: " + user.uid;

  const qOrders = query(collection(db, "orders"), where("userId", "==", user.uid));
  const snap = await getDocs(qOrders);

  if (snap.empty) {
    ordersList.innerHTML = "<p class='text-gray-300'>Nu ai comenzi încă.</p>";
    return;
  }

  let html = "";
  snap.forEach((d) => {
    const o = d.data();
    const total = o.total?.toFixed ? o.total.toFixed(2) : o.total;
    html += `<div class='border border-gray-700 rounded p-3'>
      <div class='flex justify-between'>
        <span class='font-semibold'>Comandă: ${d.id}</span>
        <span class='text-yellow-300'>${total} €</span>
      </div>
      <div class='text-xs text-gray-400 mt-1'>
        Status: ${o.status || "necunoscut"}
      </div>
    </div>`;
  });

  ordersList.innerHTML = html;
});
