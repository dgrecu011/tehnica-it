// ===============================
// SCROLL ANIMATIONS
// ===============================
const scrollElements = document.querySelectorAll(".fade-in, .slide-left, .slide-right");

const elementInView = (el, offset = 0) => {
  const elementTop = el.getBoundingClientRect().top;
  return elementTop <= (window.innerHeight || document.documentElement.clientHeight) - offset;
};

const displayScrollElement = (element) => {
  element.classList.add("show");
};

const hideScrollElement = (element) => {
  element.classList.remove("show");
};

const handleScrollAnimation = () => {
  scrollElements.forEach((el) => {
    if (elementInView(el, 100)) displayScrollElement(el);
    else hideScrollElement(el);
  });
};

window.addEventListener("scroll", handleScrollAnimation);
window.addEventListener("load", handleScrollAnimation);


// ===============================
// HAMBURGER MENU ANIMAT
// ===============================
const hamburgerBtn = document.getElementById("hamburgerBtn");
const navMenu = document.getElementById("navMenu");

if (hamburgerBtn && navMenu) {
  hamburgerBtn.addEventListener("click", () => {
    hamburgerBtn.classList.toggle("open");
    navMenu.classList.toggle("open");
  });

  // închide meniul când apeși pe un link
  navMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      hamburgerBtn.classList.remove("open");
      navMenu.classList.remove("open");
    });
  });
}