const products = [
  { name: "Laptop Gaming X", desc: "Performanță maximă pentru jocuri și muncă.", price: 15000, img: "images/laptop.png" },
  { name: "Mouse Wireless", desc: "Conexiune rapidă și precizie ridicată.", price: 350, img: "images/mouse.png" },
  { name: "Tastatură Mechanical", desc: "Tastare confortabilă și iluminare RGB.", price: 1200, img: "images/keyboard.png" },
  { name: "Monitor 27\" 4K", desc: "Rezoluție ultra HD pentru productivitate și gaming.", price: 5500, img: "images/monitor.png" },
  { name: "Căști Gaming", desc: "Sunet surround și microfon detașabil.", price: 800, img: "images/headset.png" },
  { name: "SSD 1TB", desc: "Viteză mare de citire și scriere.", price: 1500, img: "images/ssd.png" },
  { name: "Placă Video RTX 4070", desc: "Performanță de top pentru gaming.", price: 12000, img: "images/gpu.png" },
  { name: "Router WiFi 6", desc: "Viteză și stabilitate maximă pentru rețea.", price: 900, img: "images/router.png" },
  { name: "Suport Laptop", desc: "Ergonomie și răcire optimă.", price: 200, img: "images/laptop-stand.png" }
];

const productsGrid = document.getElementById('products-grid');
const loadMoreButton = document.getElementById('load-more');

let currentIndex = 0;
const itemsPerPage = 6;

// Funcție pentru glow constant pe card
function glowCard(card) {
  const glow = document.createElement("div");
  glow.className = `
    absolute inset-0 rounded-xl pointer-events-none
    bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20
    animate-glowCard
  `;
  card.appendChild(glow);
}

// Funcție pentru glow pulsant buton
function glowButton(btn) {
  btn.classList.add("animate-glowBtn");
}

function displayProducts() {
  const nextProducts = products.slice(currentIndex, currentIndex + itemsPerPage);
  nextProducts.forEach(product => {
    const card = document.createElement('div');
    card.className = `
      relative bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-transparent
      transition duration-300 transform hover:-translate-y-2 hover:scale-105 hover:shadow-2xl
      hover:border-blue-500 overflow-hidden flex flex-col
    `;
    card.setAttribute("data-aos", "fade-up");

    card.innerHTML = `
      <div class="overflow-hidden relative">
        <img src="${product.img}" alt="${product.name}" class="w-full h-48 object-cover transition-transform duration-500 hover:scale-110">
      </div>
      <div class="p-4 flex flex-col flex-1">
        <h3 class="font-bold text-lg">${product.name}</h3>
        <p class="mt-2 text-gray-700 dark:text-gray-300 flex-1">${product.desc}</p>
        <p class="mt-3 font-semibold text-blue-700 dark:text-blue-400">${product.price} RON</p>
        <button class="mt-4 flex items-center justify-center gap-2 bg-yellow-400 text-black py-2 rounded-lg
          hover:bg-yellow-300 hover:scale-105 transition transform">
          <i class="fas fa-cart-plus"></i> Adaugă în coș
        </button>
      </div>
    `;

    // Glow constant pe card
    glowCard(card);
    // Glow pulsant pe buton
    const btn = card.querySelector("button");
    glowButton(btn);

    productsGrid.appendChild(card);
  });

  currentIndex += itemsPerPage;

  if (currentIndex >= products.length) {
    loadMoreButton.style.display = 'none';
  }
}

// Load more
loadMoreButton.addEventListener('click', displayProducts);

// Primele produse
displayProducts();
