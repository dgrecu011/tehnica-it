// Preluăm coșul din localStorage sau inițializăm unul gol
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Selectăm elementele din DOM
const cartItemsContainer = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout");
const cartCountEl = document.getElementById("cart-count");

// Funcție pentru a actualiza coșul în DOM
function renderCart() {
  cartItemsContainer.innerHTML = ""; // Resetăm lista

  if(cart.length === 0){
    cartItemsContainer.innerHTML = `<p class="text-center text-lg">Coșul este gol</p>`;
    cartTotalEl.textContent = "0.00";
    cartCountEl.textContent = "0";
    return;
  }

  let total = 0;
  cart.forEach((item, index) => {
    total += item.price * item.quantity;

    const cartItem = document.createElement("div");
    cartItem.className = "flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow";

    cartItem.innerHTML = `
      <div class="flex items-center space-x-4">
        <img src="${item.img}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
        <div>
          <p class="font-semibold">${item.name}</p>
          <p>${item.price.toFixed(2)} USD x ${item.quantity}</p>
        </div>
      </div>
      <button data-index="${index}" class="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg transition">Șterge</button>
    `;

    cartItemsContainer.appendChild(cartItem);
  });

  cartTotalEl.textContent = total.toFixed(2);
  cartCountEl.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Adăugăm eveniment de ștergere pentru fiecare produs
  document.querySelectorAll("#cart-items button").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.getAttribute("data-index");
      cart.splice(idx, 1);
      saveCart();
      renderCart();
    });
  });
}

// Salvăm coșul în localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Buton finalizează comanda
checkoutBtn.addEventListener("click", () => {
  if(cart.length === 0){
    alert("Coșul este gol!");
    return;
  }
  alert("Comanda a fost finalizată!");
  cart = [];
  saveCart();
  renderCart();
});

// Inițializare
renderCart();
