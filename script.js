// Meniu mobil
const menuToggle = document.getElementById('mobile-menu');
const menu = document.getElementById('menu');

menuToggle.addEventListener('click', () => {
  menu.classList.toggle('active');
  // Animare icon hamburger -> X
  menuToggle.classList.toggle('open');
});

// Scroll full-page lent între secțiuni
const sections = document.querySelectorAll("section");
let isScrolling = false;

window.addEventListener("wheel", (e) => {
  if (isScrolling) return;
  isScrolling = true;

  const delta = e.deltaY;
  const currentIndex = Array.from(sections).findIndex(sec => sec.getBoundingClientRect().top >= 0);

  if (delta > 0 && currentIndex < sections.length - 1) {
    sections[currentIndex + 1].scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (delta < 0 && currentIndex > 0) {
    sections[currentIndex - 1].scrollIntoView({ behavior: "smooth", block: "start" });
  }

  setTimeout(() => isScrolling = false, 1000); // scroll lent
});

// Optional: închide meniul mobil când dai click pe un link
document.querySelectorAll('#menu a').forEach(link => {
  link.addEventListener('click', () => {
    menu.classList.remove('active');
    menuToggle.classList.remove('open');
  });
});
