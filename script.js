// --- DARK MODE GLOBAL ---
const darkToggle = document.getElementById("dark-toggle");
const root = document.documentElement;

// Verifică preferința salvată
if (localStorage.getItem("theme") === "dark") {
  root.classList.add("dark");
} else {
  root.classList.remove("dark");
}

// Când utilizatorul apasă pe butonul 🌙
if (darkToggle) {
  darkToggle.addEventListener("click", () => {
    root.classList.toggle("dark");

    // Salvează preferința
    if (root.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  });
}

// --- COȘ GLOBAL (NUMĂR PRODUSE) ---
const cartCountEl = document.getElementById("cart-count");

function updateCartCount() {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cartCountEl) {
    cartCountEl.textContent = cart.length;
  }
}

// Actualizează la încărcarea paginii
updateCartCount();

// --- MICĂ ANIMAȚIE LA SCROLL (DARK HEADER GLOW) ---
window.addEventListener("scroll", () => {
  const header = document.querySelector("header");
  if (!header) return;

  if (window.scrollY > 50) {
    header.classList.add("shadow-2xl", "bg-opacity-95");
  } else {
    header.classList.remove("shadow-2xl", "bg-opacity-95");
  }
});

// --- RESETARE COȘ (pentru debugging, opțional) ---
// localStorage.removeItem("cart");

const loginLogoutLink = document.getElementById('login-logout');

function updateLoginState() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (isLoggedIn) {
    loginLogoutLink.textContent = 'Logout';
    loginLogoutLink.href = '#';
    loginLogoutLink.onclick = () => {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      alert("Ai fost delogat!");
      window.location.href = 'index.html';
    };
  } else {
    loginLogoutLink.textContent = 'Login';
    loginLogoutLink.href = 'login.html';
    loginLogoutLink.onclick = null;
  }
}

updateLoginState();
