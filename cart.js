const cartItemsContainer = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');

let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Funcție pentru afișarea produselor din coș
function displayCart() {
  cartItemsContainer.innerHTML = '';

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="text-center text-lg">Coșul este gol.</p>';
    cartTotalEl.textContent = 0;
    return;
  }

  let total = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;

    const div = document.createElement('div');
    div.className = "flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl shadow";

    div.innerHTML = `
      <div class="flex items-center space-x-4">
        <img src="${item.img}" alt="${item.name}" class="w-20 h-20 object-cover rounded-lg">
        <div>
          <h4 class="font-semibold">${item.name}</h4>
          <p>$${item.price} x ${item.quantity}</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <button class="px-2 py-1 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-500 dark:hover:bg-red-600 decrease">-</button>
        <span>${item.quantity}</span>
        <button class="px-2 py-1 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-500 dark:hover:bg-green-600 increase">+</button>
        <button class="px-2 py-1 bg-gray-400 dark:bg-gray-600 text-black rounded hover:bg-gray-300 dark:hover:bg-gray-500 remove">X</button>
      </div>
    `;

    // Evenimente pentru butoane
    div.querySelector('.increase').addEventListener('click', () => {
      item.quantity += 1;
      saveAndRefresh();
    });
    div.querySelector('.decrease').addEventListener('click', () => {
      if (item.quantity > 1) item.quantity -= 1;
      saveAndRefresh();
    });
    div.querySelector('.remove').addEventListener('click', () => {
      cart = cart.filter(i => i.id !== item.id);
      saveAndRefresh();
    });

    cartItemsContainer.appendChild(div);
  });

  cartTotalEl.textContent = total.toFixed(2);
}

// Salvează coș și actualizează
function saveAndRefresh() {
  localStorage.setItem('cart', JSON.stringify(cart));
  displayCart();
  updateCartCount();
}

// Funcție pentru actualizarea numărului de produse
function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cart-count').textContent = count;
}

// Checkout
document.getElementById('checkout-btn').addEventListener('click', () => {
  if (cart.length === 0) {
    alert('Coșul este gol!');
    return;
  }
  alert('Comanda a fost finalizată!');
  cart = [];
  saveAndRefresh();
});

displayCart();
updateCartCount();
