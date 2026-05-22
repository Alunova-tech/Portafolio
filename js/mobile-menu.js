const header = document.querySelector('.mega-header');
const menuButton = document.querySelector('.hamburguesa');
const menuList = document.querySelector('.nav-list');
const menuLinks = document.querySelectorAll('.nav-list a');

function setMenuState(isOpen) {
  if (!header || !menuButton) return;

  header.classList.toggle('open', isOpen);
  menuList?.classList.toggle('open', isOpen);
  document.body.classList.toggle('menu-open', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
}

function toggleMenu() {
  const isOpen = header?.classList.contains('open') ?? false;
  setMenuState(!isOpen);
}

menuButton?.addEventListener('click', toggleMenu);

menuLinks.forEach((link) => {
  link.addEventListener('click', () => setMenuState(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setMenuState(false);
  }
});
