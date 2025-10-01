const cartGrid = document.getElementById("cart-grid");
const cartCount = document.getElementById("cart-count");
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

if(cartCount) cartCount.innerText = cart.length;

if(cartGrid){
  cartGrid.innerHTML = "";
  cart.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "cart-item flex justify-between items-center p-4 bg-white dark:bg-gray-900 mb-4 rounded-xl shadow-md";
    div.innerHTML = `
      <span>${item.name} - ${item.price} MDL</span>
      <button class="remove-btn px-3 py-1 bg-red-600 text-white rounded-xl hover:bg-red-500">Șterge</button>
    `;
    cartGrid.appendChild(div);

    div.querySelector(".remove-btn").addEventListener("click", ()=>{
      cart.splice(index,1);
      localStorage.setItem("cart",JSON.stringify(cart));
      location.reload();
    });
  });
}
