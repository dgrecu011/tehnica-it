// Array cu obiecte – fiecare obiect = produs
const products = [
  { image: "/images/laptopGaming.png", title: "Laptop Gaming", price: 2500 },
  { image: "/images/mouseRGB.png", title: "Mouse RGB", price: 350 },
  { image: "/images/tastaturaMecan.png", title: "Tastatură Mechanical", price: 800 }
];

// Meniu mobil
const menuToggle = document.getElementById('mobile-menu');
const menu = document.getElementById('menu');
menuToggle.addEventListener('click', () => menu.classList.toggle('active'));

// Generare produse
const grid = document.getElementById('products-grid');
products.forEach(prod => {
  const card = document.createElement('div');
  card.className = "bg-white rounded-2xl shadow hover:shadow-xl transition p-6 text-center";
  card.innerHTML = `
    <img src="${prod.image}" alt="${prod.title}" class="h-48 w-full object-cover rounded-xl mb-4">
    <h3 class="text-xl font-semibold">${prod.title}</h3>
    <p class="text-gray-600 mb-4">Preț: <span class="font-bold text-blue-600">${prod.price} MDL</span></p>
    <button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition">
      Adaugă în coș
    </button>
  `;
  grid.appendChild(card);
});

// Scroll full-page lent între secțiuni
let sections = document.querySelectorAll("section");
let isScrolling = false;

window.addEventListener("wheel", (e) => {
  if (isScrolling) return;
  isScrolling = true;

  const delta = e.deltaY;
  let currentIndex = Array.from(sections).findIndex(sec => sec.getBoundingClientRect().top >= 0);

  if (delta > 0 && currentIndex < sections.length - 1) {
    sections[currentIndex + 1].scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (delta < 0 && currentIndex > 0) {
    sections[currentIndex - 1].scrollIntoView({ behavior: "smooth", block: "start" });
  }

  setTimeout(() => isScrolling = false, 1000); // scroll lent
});
