// cart.js - gestionează coșul
function updateCartCount(){
  const cartCount = document.getElementById("cart-count");
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalItems = cart.reduce((sum,item)=>sum+item.quantity,0);
  if(cartCount) cartCount.innerText = totalItems;
}

// Funcție pentru adăugat produs în coș
function setupAddToCartButtons(){
  document.querySelectorAll(".add-to-cart").forEach(btn=>{
    btn.addEventListener("click", e=>{
      e.preventDefault();
      const card = e.currentTarget.closest(".card");
      const id = card.dataset.id;
      const title = card.querySelector("h3").innerText;
      const price = parseInt(card.querySelector("span").innerText.replace(/\D/g,""));
      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      const existing = cart.find(item=>item.id==id);
      if(existing) existing.quantity++;
      else cart.push({id, title, price, quantity:1});
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartCount();
      alert(title + " a fost adăugat în coș!");
    });
  });
}

// Populare coș în cart.html
function renderCart(){
  const cartItemsDiv = document.getElementById("cart-items");
  const cartTotalDiv = document.getElementById("cart-total");
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cartItemsDiv.innerHTML = '';
  if(cart.length === 0){
    cartItemsDiv.innerHTML = '<p class="text-gray-700 text-center text-lg">Coșul tău este gol.</p>';
    if(cartTotalDiv) cartTotalDiv.innerText = '';
    return;
  }
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.quantity;
    const itemDiv = document.createElement("div");
    itemDiv.className = "bg-white p-4 rounded-2xl shadow flex justify-between items-center";
    itemDiv.innerHTML = `
      <div>
        <h3 class="font-bold text-gray-900">${item.title}</h3>
        <p class="text-gray-700">Preț: MDL ${item.price} x ${item.quantity}</p>
      </div>
      <div>
        <button class="bg-red-500 text-white px-3 py-1 rounded-xl remove-item">Șterge</button>
      </div>
    `;
    itemDiv.querySelector(".remove-item").addEventListener("click", ()=>{
      cart = cart.filter(i => i.id !== item.id);
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
      updateCartCount();
    });
    cartItemsDiv.appendChild(itemDiv);
  });
  if(cartTotalDiv) cartTotalDiv.innerText = `Total: MDL ${total}`;
}

function setupCheckout(){
  const checkoutBtn = document.getElementById("checkoutBtn");
  if(checkoutBtn){
    checkoutBtn.addEventListener("click", ()=>{
      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      if(cart.length === 0){
        alert("Coșul este gol!");
        return;
      }
      alert("Comanda a fost plasată cu succes!");
      localStorage.removeItem("cart");
      renderCart();
      updateCartCount();
    });
  }
}

// Apelare funcții la încărcarea paginii
document.addEventListener("DOMContentLoaded", ()=>{
  updateCartCount();
  setupAddToCartButtons();
  renderCart();
  setupCheckout();
});
let currentUser = JSON.parse(localStorage.getItem("currentUser"));

let cart = currentUser?.cart || [];

function updateCart() {
  // ... restul codului pentru afișare coș

  // Salvăm coșul în LocalStorage per user
  if(currentUser){
    currentUser.cart = cart;
    let users = JSON.parse(localStorage.getItem("users")) || [];
    users = users.map(u=>u.email===currentUser.email ? currentUser : u);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  }
}
