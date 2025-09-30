// Lista de produse (poți adăuga câte vrei aici)
const productsData = [
  { id: 1, name: "Laptop Gaming X", price: 15000, desc: "Performanță maximă pentru jocuri și muncă.", img: "/images/laptop1.png" },
  { id: 2, name: "Set Tastatură + Mouse", price: 1200, desc: "Confort și precizie la un preț avantajos.", img: "/images/keyboard1.png" },
  { id: 3, name: "Monitor UltraHD 27\"", price: 5200, desc: "Claritate și culori vibrante pentru lucru și gaming.", img: "/images/monitor1.png" },
  { id: 4, name: "Căști Wireless Pro", price: 900, desc: "Sunet imersiv și autonomie de 30 ore.", img: "/images/headset1.png" },
  { id: 5, name: "Mouse Gaming RGB", price: 700, desc: "Precizie ridicată și design ergonomic.", img: "/images/mouse1.png" },
  { id: 6, name: "Laptop Business Elite", price: 17500, desc: "Subțire, puternic și elegant pentru birou.", img: "/images/laptop2.png" }
];

// Configurare câte produse să se afișeze inițial
let productsPerPage = 3;
let currentIndex = 0;

function renderProducts(){
  const grid = document.getElementById("products-grid");
  if(!grid) return;
  
  let end = currentIndex + productsPerPage;
  let sliced = productsData.slice(currentIndex, end);

  sliced.forEach(prod=>{
    let card = document.createElement("div");
    card.className = "card";
    card.setAttribute("data-id", prod.id);
    card.setAttribute("data-aos", "fade-up");
    card.innerHTML = `
      <img src="${prod.img}" alt="${prod.name}" class="rounded-2xl mb-4">
      <h3 class="text-xl font-bold mb-2">${prod.name}</h3>
      <p class="text-gray-700 mb-2">${prod.desc}</p>
      <span class="text-blue-700 font-semibold">${prod.price}</span>
      <button class="add-to-cart mt-2 px-4 py-2 bg-yellow-400 rounded-2xl font-semibold hover:bg-yellow-300 transition">Adaugă în coș</button>
    `;
    grid.appendChild(card);
  });

  currentIndex = end;

  if(currentIndex >= productsData.length){
    let btn = document.getElementById("load-more");
    if(btn) btn.style.display = "none";
  }

  // Reatașează butoanele pentru coș
  attachAddToCartEvents();
}

// Atașează butoanele pentru adăugare în coș
function attachAddToCartEvents(){
  document.querySelectorAll(".add-to-cart").forEach(btn=>{
    if(!btn.dataset.bound){
      btn.dataset.bound = true; // prevenim dubla legare
      btn.addEventListener("click", e=>{
        const card = e.target.closest(".card");
        const id = card.dataset.id;
        const name = card.querySelector("h3").textContent;
        const price = parseInt(card.querySelector("span").textContent);

        let currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if(!currentUser){ alert("Trebuie să fii logat!"); return; }

        let cart = currentUser.cart || [];
        let existing = cart.find(p=>p.id==id);
        if(existing) existing.quantity +=1;
        else cart.push({id, name, price, quantity:1});

        currentUser.cart = cart;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));

        // Actualizează badge-ul coșului
        let totalItems = cart.reduce((sum, item)=>sum + item.quantity, 0);
        document.getElementById("cart-count").textContent = totalItems;
        document.getElementById("mobile-cart-count").textContent = totalItems;

        alert(`${name} a fost adăugat în coș!`);
      });
    }
  });
}

// Load More
function loadMore(){
  renderProducts();
}

document.addEventListener("DOMContentLoaded", ()=>{
  renderProducts();

  // Butonul de încărcare suplimentară
  const grid = document.getElementById("products-grid");
  const btn = document.createElement("button");
  btn.id = "load-more";
  btn.className = "mt-10 px-6 py-3 bg-blue-700 text-white rounded-2xl hover:bg-blue-600 transition";
  btn.textContent = "Încarcă mai multe";
  btn.addEventListener("click", loadMore);
  grid.insertAdjacentElement("afterend", btn);
});
