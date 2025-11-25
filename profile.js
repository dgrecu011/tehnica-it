import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const profileBox = document.getElementById("profileData");
const logoutBtn = document.getElementById("logoutBtn");
const toAdmin = document.getElementById("toAdmin");
const toast = document.getElementById("toast");
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

onAuthStateChanged(auth, async user => {
  if (!user) {
    profileBox.innerHTML = `<p class="text-slate-400">Nu esti autentificat. Te redirectionam...</p>`;
    setTimeout(() => (window.location = "index.html"), 800);
    return;
  }

  const admin = await isAdmin(user);
  if (toAdmin) toAdmin.classList.toggle("hidden", !admin);

  const created = new Date(user.metadata.creationTime).toLocaleString();
  const lastLogin = new Date(user.metadata.lastSignInTime).toLocaleString();

  profileBox.innerHTML = `
    <div class="space-y-2">
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>User ID:</strong> ${user.uid}</p>
      <p><strong>Creat la:</strong> ${created}</p>
      <p><strong>Ultima logare:</strong> ${lastLogin}</p>
    </div>
  `;
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
  // fallback: role check will run again on navigation guard
  if (toAdmin.classList.contains("hidden")) {
    showToast("Acces doar pentru admin");
    return;
  }
  window.location = "admin.html";
};
