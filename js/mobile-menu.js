{
  const header = document.querySelector('.mega-header');
  const menuButton = header?.querySelector('.hamburguesa');
  const menu = header?.querySelector('#menu-principal');

  if (menuButton && menu) {
    const mobileLayout = window.matchMedia('(max-width: 767px)');
    const isOpen = () => header.classList.contains('open');

    function setMenuOpen(open) {
      header.classList.toggle('open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    }

    menuButton.addEventListener('click', (event) => {
      if (!mobileLayout.matches) return;
      const open = !isOpen();
      setMenuOpen(open);
      if (open && event.detail === 0) menu.querySelector('a[href]')?.focus();
    });

    menu.addEventListener('click', (event) => {
      if (isOpen() && event.target.closest('a[href]')) setMenuOpen(false);
    });

    document.addEventListener('click', (event) => {
      if (isOpen() && !menu.contains(event.target) && !menuButton.contains(event.target)) {
        setMenuOpen(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        setMenuOpen(false);
        menuButton.focus();
      }
    });

    mobileLayout.addEventListener('change', (event) => {
      if (!event.matches) setMenuOpen(false);
    });

    setMenuOpen(false);
    header.classList.add('menu-ready');
  }
}
