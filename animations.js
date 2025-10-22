// Scroll animations
const scrollElements = document.querySelectorAll('.fade-in, .slide-left, .slide-right');

const elementInView = (el, offset = 0) => {
  const elementTop = el.getBoundingClientRect().top;
  return elementTop <= (window.innerHeight || document.documentElement.clientHeight) - offset;
};

const displayScrollElement = (element) => { element.classList.add('show'); };
const hideScrollElement = (element) => { element.classList.remove('show'); };

const handleScrollAnimation = () => {
  scrollElements.forEach(el => {
    if (elementInView(el, 100)) displayScrollElement(el);
    else hideScrollElement(el);
  });
};

window.addEventListener('scroll', handleScrollAnimation);
window.addEventListener('load', handleScrollAnimation);

// Hamburger menu toggle
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navMenu = document.getElementById('navMenu');
hamburgerBtn.onclick = ()=>{
  navMenu.classList.toggle('hidden');
};
