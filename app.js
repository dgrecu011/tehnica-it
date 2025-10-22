import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

// ===========================
// CONFIG FIREBASE
// ===========================
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

// ===========================
// ELEMENTE DOM
// ===========================
const productsEl = document.getElementById('products');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');

const adminPanel = document.getElementById('adminPanel');
const adminTitle = document.getElementById('adminTitle');
const adminDesc = document.getElementById('adminDesc');
const adminPrice = document.getElementById('adminPrice');
const adminStock = document.getElementById('adminStock');
const adminImage = document.getElementById('adminImage');
const addProductBtn = document.getElementById('addProductBtn');
const adminProductsEl = document.getElementById('adminProducts');
const adminSearch = document.getElementById('adminSearch');

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

const cartBtn = document.getElementById('cartBtn');
const cart = document.getElementById('cart');
const closeCart = document.getElementById('closeCart');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');

let allProducts = [];
let cartItems = [];

// ===========================
// FUNCȚII
// ===========================
const renderProduct = (product) => {
  const card = document.createElement('div');
  card.className = 'product-card perspective';
  card.innerHTML = `
    <div class="product-card-inner">
      <div class="product-card-front p-3">
        <img src="${product.imageURL}" alt="${product.title}" class="w-full h-48 mb-3 rounded">
        <h4 class="font-bold text-lg">${product.title}</h4>
        <p class="text-gray-400">${product.price} €</p>
      </div>
      <div class="product-card-back p-3">
        <h4 class="font-bold text-lg mb-2">${product.title}</h4>
        <p class="text-gray-400 mb-2">${product.description}</p>
        <button class="bg-yellow-400 text-black px-3 py-1 rounded add-to-cart">Adaugă în coș</button>
      </div>
    </div>
  `;
  const btn = card.querySelector('.add-to-cart');
  btn.onclick = () => {
    cartItems.push(product);
    updateCart();
  };
  return card;
};

const loadProducts = async () => {
  productsEl.innerHTML = '';
  const snapshot = await getDocs(collection(db,'products'));
  allProducts = snapshot.docs.map(doc => ({id:doc.id, ...doc.data()}));
  let filtered = [...allProducts];

  // filtre
  if(searchInput.value) filtered = filtered.filter(p=>p.title.toLowerCase().includes(searchInput.value.toLowerCase()));
  if(categoryFilter.value) filtered = filtered.filter(p=>p.category===categoryFilter.value);
  if(sortFilter.value==='priceAsc') filtered.sort((a,b)=>a.price-b.price);
  if(sortFilter.value==='priceDesc') filtered.sort((a,b)=>b.price-a.price);

  filtered.forEach(p=>productsEl.appendChild(renderProduct(p)));
};

const updateCart = () => {
  cartItemsEl.innerHTML='';
  let total = 0;
  cartItems.forEach(item=>{
    const div = document.createElement('div');
    div.className='flex justify-between mb-2';
    div.innerHTML=`<span>${item.title}</span><span>${item.price} €</span>`;
    cartItemsEl.appendChild(div);
    total += parseFloat(item.price);
  });
  cartTotalEl.textContent = total.toFixed(2)+' €';
  document.getElementById('cartCount').textContent = cartItems.length;
};

// ===========================
// ADMIN
// ===========================
const renderAdminProduct = (product) => {
  const card = document.createElement('div');
  card.className='bg-gray-800 p-3 rounded shadow-lg flex flex-col';
  card.innerHTML = `
    <h4 class="font-bold mb-1">${product.title}</h4>
    <p class="text-gray-400 mb-2">${product.price} €</p>
    <div class="mt-auto flex gap-2">
      <button class="bg-yellow-400 px-2 py-1 rounded edit">Editează</button>
      <button class="bg-red-500 px-2 py-1 rounded delete">Șterge</button>
    </div>
  `;
  card.querySelector('.delete').onclick = async ()=>{ await deleteDoc(doc(db,'products',product.id)); loadProducts(); loadAdminProducts(); };
  card.querySelector('.edit').onclick = ()=>{
    adminTitle.value=product.title;
    adminDesc.value=product.description;
    adminPrice.value=product.price;
    adminStock.value=product.stock;
    adminImage.value=product.imageURL;
    addProductBtn.onclick = async ()=>{
      await updateDoc(doc(db,'products',product.id), {
        title:adminTitle.value,
        description:adminDesc.value,
        price:parseFloat(adminPrice.value),
        stock:parseInt(adminStock.value),
        imageURL:adminImage.value
      });
      adminTitle.value=''; adminDesc.value=''; adminPrice.value=''; adminStock.value=''; adminImage.value='';
      loadProducts(); loadAdminProducts();
      addProductBtn.onclick = addNewProduct;
    };
  };
  return card;
};

const loadAdminProducts = async () => {
  adminProductsEl.innerHTML='';
  const snapshot = await getDocs(collection(db,'products'));
  const products = snapshot.docs.map(doc => ({id:doc.id, ...doc.data()}));
  products.forEach(p=>adminProductsEl.appendChild(renderAdminProduct(p)));
};

// ===========================
// AUTH
// ===========================
const addNewProduct = async ()=>{
  if(!adminTitle.value || !adminPrice.value) return alert('Titlu și preț obligatorii');
  await addDoc(collection(db,'products'),{
    title:adminTitle.value,
    description:adminDesc.value||'',
    price:parseFloat(adminPrice.value),
    stock:parseInt(adminStock.value)||0,
    imageURL:adminImage.value||'https://via.placeholder.com/400x250',
    category:'Component'
  });
  adminTitle.value=''; adminDesc.value=''; adminPrice.value=''; adminStock.value=''; adminImage.value='';
  loadProducts(); loadAdminProducts();
};

addProductBtn.onclick = addNewProduct;

loginBtn.onclick=async ()=>{
  const email = prompt("Email admin:");
  const pass = prompt("Parola:");
  try{ await signInWithEmailAndPassword(auth,email,pass); }
  catch(e){ alert("Eroare login: "+e.message); }
};
logoutBtn.onclick=()=>signOut(auth);

onAuthStateChanged(auth,user=>{
  if(user){ adminPanel.classList.remove('hidden'); loginBtn.classList.add('hidden'); logoutBtn.classList.remove('hidden'); }
  else{ adminPanel.classList.add('hidden'); loginBtn.classList.remove('hidden'); logoutBtn.classList.add('hidden'); }
});

// ===========================
// EVENT LISTENERS
// ===========================
searchInput.oninput = loadProducts;
categoryFilter.onchange = loadProducts;
sortFilter.onchange = loadProducts;

cartBtn.onclick = ()=>{ cart.style.right='0'; };
closeCart.onclick = ()=>{ cart.style.right='-400px'; };

// ===========================
// INITIAL LOAD
// ===========================
window.onload = ()=>{ loadProducts(); loadAdminProducts(); };
