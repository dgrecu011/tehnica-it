// Lista de produse
const products = [
  { id: 1, name: "Laptop Gaming X", price: 1500, img: "images/laptop1.jpg" },
  { id: 2, name: "Laptop Office Y", price: 1200, img: "images/laptop2.jpg" },
  { id: 3, name: "Mouse RGB Z", price: 50, img: "images/mouse1.jpg" },
  { id: 4, name: "Tastatură Mecanică A", price: 100, img: "images/keyboard1.jpg" },
  { id: 5, name: "Căști Gaming B", price: 80, img: "images/headset1.jpg" },
  { id: 6, name: "Placă Video RTX 4090", price: 2000, img: "images/gpu1.jpg" },
];

// Salvează coșul în localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Funcție pentru a actualiza numărul de produse în coș
function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cart-count').textContent = count;
}
updateCartCount();

// Funcție pentru a genera cardurile de produse
function displayProducts() {
  const grid = document.getElementById('products-grid') || document.getElementById('recommended-products');
  if (!grid) return;

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = "product-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow hover:scale-105 transition text-center";

    card.innerHTML = `
      <img src="${product.img}" alt="${product.name}" class="w-full h-48 object-cover mb-4 rounded-lg">
      <h4 class="font-semibold text-xl mb-2">${product.name}</h4>
      <p class="text-lg font-bold mb-4">$${product.price}</p>
      <button class="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-xl hover:bg-blue-500 dark:hover:bg-blue-600 transition add-to-cart">Adaugă în coș</button>
    `;

    const button = card.querySelector('.add-to-cart');
    button.addEventListener('click', () => addToCart(product.id));

    grid.appendChild(card);
  });
}

// Adaugă produs în coș
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  const cartItem = cart.find(item => item.id === productId);
  if (cartItem) {
    cartItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert(`${product.name} a fost adăugat în coș!`);
}

displayProducts();
