const productsData = [
  {id:1,name:"Laptop Gaming X",price:15000,img:"images/laptop1.jpg"},
  {id:2,name:"PC Desktop Y",price:12000,img:"images/pc1.jpg"},
  {id:3,name:"Monitor 27” Z",price:3500,img:"images/monitor1.jpg"},
];

let productsGrid = document.getElementById("products-grid");
let loadMoreBtn = document.getElementById("load-more");

function displayProducts(products){
  productsGrid.innerHTML = "";
  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card p-4 bg-white dark:bg-gray-900 rounded-xl shadow-md";
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}" class="rounded-xl mb-4">
      <h3 class="font-bold mb-2">${p.name}</h3>
      <p class="mb-2">${p.price} MDL</p>
      <button class="add-to-cart-btn px-4 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-600">Adaugă în coș</button>
    `;
    productsGrid.appendChild(card);

    card.querySelector("button").addEventListener("click", ()=>{
      addToCart(p);
    });
  });
}

function addToCart(product){
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart.push(product);
  localStorage.setItem("cart", JSON.stringify(cart));
  document.getElementById("cart-count").innerText = cart.length;
}

displayProducts(productsData);

if(loadMoreBtn){
  loadMoreBtn.addEventListener("click", ()=>{
    alert("Load More funcționalitate demo!");
  });
}
