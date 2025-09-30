const products = [
  {
    name: "Laptop Gaming RTX 3060",
    description: "Performanță la nivel înalt pentru gaming și muncă.",
    price: 15999,
    image: "/images/tastaturaMecan.png",
    rating: 5,
    badge: "Reducere 20%",
    stock: "limitat"
  },
  {
    name: "Mouse Wireless Ergonomic",
    description: "Confort și precizie pentru zile lungi de lucru.",
    price: 1299,
    image: "/images/mouse1.jpg",
    rating: 4,
    badge: "Nou",
    stock: ""
  },
  {
    name: "Tastatură Mecanică RGB",
    description: "Gaming și productivitate cu iluminare RGB personalizată.",
    price: 2299,
    image: "/images/keyboard1.jpg",
    rating: 5,
    badge: "",
    stock: "limitat"
  },
  // adaugă mai multe produse după nevoie
];

const grid = document.getElementById("products-grid");
const loadMoreBtn = document.getElementById("loadMoreBtn");

let productsToShow = 3;

function displayProducts() {
  grid.innerHTML = "";
  products.slice(0, productsToShow).forEach((product, index) => {
    const stars = Array.from({ length: 5 }, (_, i) => 
      `<svg class="w-5 h-5 ${i < product.rating ? 'text-yellow-400' : 'text-gray-300'}" fill="currentColor" viewBox="0 0 20 20">
         <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.945a1 1 0 00.95.69h4.157c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.945c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.285-3.945a1 1 0 00-.364-1.118L2.028 9.372c-.783-.57-.38-1.81.588-1.81h4.157a1 1 0 00.951-.69l1.285-3.945z"/>
       </svg>`
    ).join('');

    const card = document.createElement("div");
    card.className = `
      product-card relative flex flex-col p-6 rounded-3xl shadow-lg overflow-hidden
      transition-transform transform hover:-translate-y-3 hover:shadow-2xl
      bg-gradient-to-tr from-white via-gray-50 to-white group
      hover:from-blue-50 hover:via-purple-50 hover:to-pink-50
      aos-init aos-animate
    `;
    card.setAttribute("data-aos", "fade-up");
    card.setAttribute("data-aos-delay", `${index * 150}`);

    card.innerHTML = `
      ${product.badge ? `<span class="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full font-semibold text-sm animate-pulse">${product.badge}</span>` : ''}
      ${product.stock ? `<span class="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full font-semibold text-sm animate-pulse">${product.stock}</span>` : ''}
      
      <div class="overflow-hidden rounded-2xl mb-4 relative group">
        <img src="${product.image || '/images/placeholder.jpg'}" alt="${product.name}" 
             class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110 group-hover:brightness-110 rounded-2xl shadow-md">
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition transform group-hover:translate-y-1 text-white text-sm p-2 rounded-2xl flex items-center justify-center">
          ${product.description}
        </div>
      </div>

      <h3 class="text-xl font-semibold text-gray-800 mb-2">${product.name}</h3>
      <div class="flex items-center mb-4">
        ${stars}
      </div>
      <div class="mt-auto flex justify-between items-center">
        <span class="text-lg font-bold text-blue-700">${product.price} MDL</span>
        <button class="bg-yellow-400 text-gray-900 px-4 py-2 rounded-xl font-semibold hover:bg-yellow-300 hover:scale-105 transition transform shadow-md">
          Adaugă în coș
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Inițial
displayProducts();

// Load more
loadMoreBtn.addEventListener("click", () => {
  productsToShow += 3;
  if (productsToShow >= products.length) loadMoreBtn.style.display = "none";
  displayProducts();
});
