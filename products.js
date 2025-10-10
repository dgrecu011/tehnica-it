document.addEventListener('DOMContentLoaded', () => {
  const productsGrid = document.getElementById('products-grid');
  if (!productsGrid) return;

  const products = [
    { id: 1, name: "Laptop ASUS TUF Gaming F15", price: 4499.00, image: "https://source.unsplash.com/300x200/?laptop" },
    { id: 2, name: "Mouse Logitech G502 HERO", price: 349.00, image: "https://source.unsplash.com/300x200/?mouse" },
    { id: 3, name: "Căști HyperX Cloud II", price: 499.00, image: "https://source.unsplash.com/300x200/?headphones" },
    { id: 4, name: "Monitor Samsung Odyssey G5", price: 1299.00, image: "https://source.unsplash.com/300x200/?monitor" },
    { id: 5, name: "Tastatură mecanică Redragon Kumara", price: 279.00, image: "https://source.unsplash.com/300x200/?keyboard" },
    { id: 6, name: "Placă video MSI GeForce RTX 4070", price: 3799.00, image: "https://source.unsplash.com/300x200/?gpu" }
  ];

  productsGrid.innerHTML = products.map((p, index) => `
    <div class="product-card text-center p-5 rounded-lg shadow-md bg-white dark:bg-gray-800 transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl hover:scale-105"
         data-aos="fade-up" data-aos-delay="${index * 100}">
      <img src="${p.image}" alt="${p.name}" class="w-full h-52 object-cover rounded-lg mb-4">
      <h3 class="text-lg font-bold mb-2">${p.name}</h3>
      <p class="text-yellow-500 font-semibold mb-3">${p.price.toFixed(2)} €</p>
      <button onclick="addToCart(${p.id})" class="px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition">Adaugă în coș</button>
    </div>
  `).join('');

  updateCartCount();

  function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const product = products.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert(`${product.name} a fost adăugat în coș ✅`);
  }

  function updateCartCount() {
    const cartCountEl = document.getElementById('cart-count');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountEl) cartCountEl.textContent = totalCount;
  }

  window.addToCart = addToCart;
});
