document.addEventListener('DOMContentLoaded', () => {
  const productsGrid = document.getElementById('products-grid');
  if (!productsGrid) return;

 // Daca nu exista produse in localStorage, le initializam
let products = JSON.parse(localStorage.getItem('products')) || [
  { id: 1, name: "Monitor Samsung", price: 199.99, image: "https://via.placeholder.com/300x200?text=Monitor+Samsung" },
  { id: 2, name: "Laptop Dell", price: 599.99, image: "https://via.placeholder.com/300x200?text=Laptop+Dell" },
  { id: 3, name: "Mouse Gaming", price: 29.99, image: "https://via.placeholder.com/300x200?text=Mouse+Gaming" }
];

localStorage.setItem('products', JSON.stringify(products));


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
