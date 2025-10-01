// Lista de produse
const productsData = [
  { id: 1, name: "Laptop Gaming X", price: 1500, img: "/images/laptop1.jpg" },
  { id: 2, name: "Laptop Office Y", price: 1200, img: "/images/laptop2.jpg" },
  { id: 3, name: "Tastatură Mecanică", price: 80, img: "/images/keyboard.jpg" },
  { id: 4, name: "Mouse Wireless", price: 50, img: "/images/mouse.jpg" },
  { id: 5, name: "Monitor 24'' Full HD", price: 200, img: "/images/monitor.jpg" },
  { id: 6, name: "Căști Gaming", price: 70, img: "/images/headset.jpg" },
  { id: 7, name: "SSD 1TB", price: 150, img: "/images/ssd.jpg" }
];

// Coșul din localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Containerul de produse
const productsGrid = document.getElementById("products-grid");

// Render produse
function renderProducts() {
  productsGrid.innerHTML = "";
  productsData.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex flex-col items-center text-center transition hover:shadow-lg";
    card.innerHTML = `
      <img src="${product.img}" alt="${product.name}" class="w-48 h-48 object-cover mb-4 rounded">
      <h3 class="font-semibold text-lg mb-2">${product.name}</h3>
      <p class="text-blue-900 dark:text-blue-400 font-bold mb-4">${product.price.toFixed(2)} USD</p>
      <button data-id="${product.id}" class="px-4 py-2 bg-blue-900 dark:bg-blue-700 text-white rounded-xl hover:bg-blue-800 dark:hover:bg-blue-600 transition">Adaugă în coș</button>
    `;
    productsGrid.appendChild(card);
  });

  // Adaugăm eveniment butoane
  document.querySelectorAll(".product-card button").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(e.target.getAttribute("data-id"));
      addToCart(id);
    });
  });
}

// Adaugă în coș
function addToCart(productId) {
  const product = productsData.find(p => p.id === productId);
  const existing = cart.find(item => item.id === productId);

  if(existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  alert(`${product.name} a fost adăugat în coș!`);
}

// Actualizează numărul de produse din header
function updateCartCount() {
  const cartCountEl = document.getElementById("cart-count");
  cartCountEl.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
}

// Inițializare
renderProducts();
updateCartCount();
