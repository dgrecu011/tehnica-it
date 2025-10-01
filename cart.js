// ===== Cart Array =====
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// ===== DOM Elements =====
const cartContainer = document.getElementById('cart-container');
const cartCountElements = document.querySelectorAll('#cart-count');
const totalPriceEl = document.getElementById('total-price');
const checkoutBtn = document.getElementById('checkout-btn');

// ===== Update Cart Count =====
function updateCartCount() {
  cartCountElements.forEach(el => el.textContent = cart.length);
}

// ===== Render Cart Items =====
function renderCart() {
  cartContainer.innerHTML = '';

  if(cart.length === 0){
    cartContainer.innerHTML = `<p class="text-center text-lg py-10">Coșul tău este gol.</p>`;
    totalPriceEl.textContent = "0 RON";
    checkoutBtn.disabled = true;
    checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
    return;
  }

  checkoutBtn.disabled = false;
  checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');

  let total = 0;

  cart.forEach((item, index) => {
    total += item.price;

    const card = document.createElement('div');
    card.className = "cart-item flex items-center justify-between p-4 mb-4 rounded-xl shadow-md bg-white dark:bg-gray-900 transition transform hover:scale-105";
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-aos-delay', index*100);

    card.innerHTML = `
      <div class="flex items-center space-x-4">
        <img src="${item.img}" alt="${item.name}" class="w-20 h-20 object-cover rounded-lg">
        <div>
          <h3 class="font-bold">${item.name}</h3>
          <p class="text-blue-700 dark:text-blue-400 font-semibold">${item.price} RON</p>
        </div>
      </div>
      <button class="remove-item px-3 py-1 bg-red-500 text-white rounded-xl hover:bg-red-400 transition">X</button>
    `;

    cartContainer.appendChild(card);

    // Remove item functionality
    card.querySelector('.remove-item').addEventListener('click', () => {
      cart.splice(index, 1);
      localStorage.setItem('cart', JSON.stringify(cart));
      renderCart();
      updateCartCount();
    });
  });

  totalPriceEl.textContent = `${total} RON`;
}

// ===== Checkout =====
checkoutBtn.addEventListener('click', () => {
  if(cart.length === 0) return;
  alert('Comanda a fost finalizată cu succes!');
  cart = [];
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  updateCartCount();
});

// ===== Initialize =====
updateCartCount();
renderCart();

// ===== Dark Mode Toggle =====
const darkToggle = document.getElementById('dark-toggle');
darkToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('dark-mode', document.body.classList.contains('dark'));
});

// Load dark mode from localStorage
if(localStorage.getItem('dark-mode') === 'true') {
  document.body.classList.add('dark');
}
