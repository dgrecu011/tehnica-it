// Cart JS complet cu dark mode, footer fix și mesaj coș gol

let cart = JSON.parse(localStorage.getItem('cart')) || [];
const cartCountElems = document.querySelectorAll('#cart-count');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElem = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

// Salvează și actualizează UI
function saveAndUpdate() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

// Actualizează interfața coșului
function updateCartUI() {
  // Update counter
  cartCountElems.forEach(el => el.textContent = cart.length);

  if(cartItemsContainer){
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if(cart.length === 0){
      cartItemsContainer.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 py-10">Coșul este gol.</p>';
    } else {
      cart.forEach((item,index)=>{
        total += item.price;
        const itemDiv = document.createElement('div');
        itemDiv.className = "flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md transition transform hover:scale-105 mb-4";
        itemDiv.innerHTML = `
          <div class="flex items-center gap-4">
            <img src="${item.img}" alt="${item.name}" class="w-24 h-24 object-cover rounded-lg">
            <div>
              <h3 class="font-bold text-lg">${item.name}</h3>
              <p class="text-blue-700 dark:text-blue-400 font-semibold">${item.price} RON</p>
            </div>
          </div>
          <button data-index="${index}" class="remove-btn px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-400 transition">X</button>
        `;
        cartItemsContainer.appendChild(itemDiv);
      });
    }

    if(cartTotalElem) cartTotalElem.textContent = total;

    document.querySelectorAll('.remove-btn').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const idx = e.target.dataset.index;
        cart.splice(idx,1);
        saveAndUpdate();
      });
    });
  }
}

// Adaugă produs în cart (de pe products sau index)
document.querySelectorAll('.add-to-cart-btn').forEach(btn=>{
  btn.addEventListener('click', e=>{
    const card = e.target.closest('.product-card');
    const name = card.querySelector('h3').textContent;
    const price = parseInt(card.querySelector('p').textContent.replace(/\D/g,''));
    const img = card.querySelector('img').src;
    cart.push({name, price, img});
    saveAndUpdate();
  });
});

// Checkout
if(checkoutBtn){
  checkoutBtn.addEventListener('click', ()=>{
    if(cart.length === 0) {
      alert("Coșul este gol!");
      return;
    }
    alert("Comanda a fost finalizată cu succes!");
    cart = [];
    saveAndUpdate();
  });
}

// Initializare UI la load
updateCartUI();
