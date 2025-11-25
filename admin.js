import {
  auth,
  db,
  storage,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  ref,
  uploadBytes,
  getDownloadURL,
  onAuthStateChanged
} from "./firebase.js";

const nameInput = document.getElementById("name");
const priceInput = document.getElementById("price");
const categoryInput = document.getElementById("category");
const tagInput = document.getElementById("tag");
const fileInput = document.getElementById("imageFile");
const addBtn = document.getElementById("addProductBtn");
const refreshBtn = document.getElementById("refreshProducts");
const list = document.getElementById("productsList");
const toast = document.getElementById("toast");

function showToast(message) {
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 2200);
}

async function uploadImage(file) {
  const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

async function addProduct() {
  const name = nameInput.value.trim();
  const price = Number(priceInput.value);
  const category = categoryInput.value.trim() || "IT";
  const tag = tagInput.value.trim();
  const file = fileInput.files[0];

  if (!name || !price || !file) {
    showToast("Completeaza nume, pret si imagine");
    return;
  }

  try {
    addBtn.disabled = true;
    const img = await uploadImage(file);
    await addDoc(collection(db, "products"), { name, price, category, tag, img });
    showToast("Produs adaugat");
    nameInput.value = "";
    priceInput.value = "";
    categoryInput.value = "";
    tagInput.value = "";
    fileInput.value = "";
    loadProducts();
  } catch (err) {
    console.error(err);
    showToast("Eroare la salvare");
  } finally {
    addBtn.disabled = false;
  }
}

async function deleteProduct(id) {
  await deleteDoc(doc(db, "products", id));
  showToast("Produs sters");
  loadProducts();
}

async function editProduct(id, prev) {
  const name = prompt("Nume nou", prev.name) || prev.name;
  const price = Number(prompt("Pret nou", prev.price) || prev.price);
  const tag = prompt("Badge (optional)", prev.tag || "") ?? prev.tag;
  const category = prompt("Categorie", prev.category || "IT") || prev.category;
  await updateDoc(doc(db, "products", id), { name, price, tag, category });
  showToast("Produs actualizat");
  loadProducts();
}

async function loadProducts() {
  list.innerHTML = "";
  const snapshot = await getDocs(collection(db, "products"));
  if (snapshot.empty) {
    list.innerHTML = `<div class="glass p-6 text-center text-slate-400 col-span-full">Niciun produs. Adauga mai sus.</div>`;
    return;
  }

  snapshot.forEach(p => {
    const data = p.data();
    const price = Number(data.price || 0).toLocaleString("ro-RO");
    list.innerHTML += `
      <div class="product-card">
        <img src="${data.img}" class="product-img" alt="${data.name}">
        <div class="p-4 space-y-2">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm text-slate-400">${data.category || "IT"}</p>
              <p class="text-lg font-bold text-white">${data.name}</p>
            </div>
            <p class="text-blue-300 font-black">${price} Lei</p>
          </div>
          ${data.tag ? `<span class="pill">${data.tag}</span>` : ""}
          <div class="flex gap-2">
            <button class="btn-primary flex-1" data-edit="${p.id}">Editeaza</button>
            <button class="btn-ghost flex-1" data-delete="${p.id}">Sterge</button>
          </div>
        </div>
      </div>
    `;
  });

  list.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => deleteProduct(btn.dataset.delete));
  });

  list.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".product-card");
      const name = card.querySelector("p.font-bold")?.textContent || "";
      const price = Number(card.querySelector(".font-black")?.textContent.replace(/\D/g, "")) || 0;
      const tag = card.querySelector(".pill")?.textContent || "";
      const category = card.querySelector(".text-sm")?.textContent || "IT";
      editProduct(btn.dataset.edit, { name, price, tag, category });
    });
  });
}

function guardAuth() {
  onAuthStateChanged(auth, user => {
    if (!user) {
      showToast("Autentificare necesara");
      setTimeout(() => (window.location = "index.html"), 800);
    }
  });
}

function boot() {
  guardAuth();
  addBtn.addEventListener("click", addProduct);
  refreshBtn.addEventListener("click", loadProducts);
  loadProducts();
}

boot();
