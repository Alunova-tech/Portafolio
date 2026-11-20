(() => {
  const dialog = document.querySelector('#catalog-reader');
  const viewport = dialog?.querySelector('.catalog-page-viewport');
  const image = dialog?.querySelector('#catalog-page-image');
  const previous = dialog?.querySelector('[data-catalog-prev]');
  const next = dialog?.querySelector('[data-catalog-next]');
  const position = dialog?.querySelector('[data-catalog-position]');
  const zoom = dialog?.querySelector('[data-catalog-zoom]');
  const pageSelect = dialog?.querySelector('#catalog-page-select');
  if (!dialog?.showModal || !viewport || !image || !previous || !next ||
      !position || !zoom || !pageSelect) return;

  const pageCount = 11;
  let currentPage = 1;
  let opener = null;

  function setZoom(enlarged) {
    viewport.classList.toggle('is-zoomed', enlarged);
    zoom.setAttribute('aria-pressed', String(enlarged));
    zoom.textContent = enlarged ? 'Ajustar' : 'Ampliar';
    zoom.setAttribute('aria-label', enlarged ? 'Ajustar la página al lector' : 'Ampliar la página');
    if (!enlarged) {
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
    }
  }

  function renderPage() {
    setZoom(false);
    viewport.setAttribute('aria-busy', 'true');
    image.alt = `Página ${currentPage} de ${pageCount} del catálogo audiovisual de ALUNOVA`;
    image.src = `img/catalogo/pagina-${String(currentPage).padStart(2, '0')}.webp`;
    position.textContent = `Página ${currentPage} de ${pageCount}`;
    pageSelect.value = String(currentPage);
    previous.disabled = currentPage === 1;
    next.disabled = currentPage === pageCount;
  }

  function changePage(page) {
    if (!Number.isInteger(page) || page < 1 || page > pageCount || page === currentPage) return;
    currentPage = page;
    renderPage();
  }

  function canRestoreFocus(element) {
    return element?.isConnected && typeof element.focus === 'function' &&
      element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
  }

  const options = Array.from({length: pageCount}, (_, index) => {
    const option = document.createElement('option');
    option.value = String(index + 1);
    option.textContent = `Página ${index + 1}`;
    return option;
  });
  pageSelect.replaceChildren(...options);
  viewport.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight Home End');

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const trigger = event.target.closest('[data-open-catalog-reader]');
    if (!trigger) return;
    event.preventDefault();
    if (dialog.open) return;
    opener = trigger;
    currentPage = 1;
    renderPage();
    dialog.showModal();
    document.body.classList.add('catalog-reader-open');
    viewport.focus({preventScroll: true});
  });

  dialog.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('[data-close-catalog-reader]')) {
      dialog.close();
      return;
    }
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });

  // Escape conserva el cierre nativo del diálogo y pasa por la misma limpieza.
  dialog.addEventListener('close', () => {
    document.body.classList.remove('catalog-reader-open');
    setZoom(false);
    const candidates = [opener, ...document.querySelectorAll('[data-open-catalog-reader]')];
    const target = candidates.find(canRestoreFocus);
    const activeDialog = document.querySelector('dialog[open]');
    if (target && (!activeDialog || activeDialog.contains(target))) target.focus({preventScroll: true});
    opener = null;
  });

  previous.addEventListener('click', () => changePage(currentPage - 1));
  next.addEventListener('click', () => changePage(currentPage + 1));
  pageSelect.addEventListener('change', () => changePage(Number(pageSelect.value)));
  zoom.addEventListener('click', () => setZoom(!viewport.classList.contains('is-zoomed')));

  viewport.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const pages = {ArrowLeft: currentPage - 1, ArrowRight: currentPage + 1, Home: 1, End: pageCount};
    if (!(event.key in pages)) return;
    event.preventDefault();
    changePage(pages[event.key]);
  });

  image.addEventListener('load', () => viewport.removeAttribute('aria-busy'));
  image.addEventListener('error', () => {
    viewport.removeAttribute('aria-busy');
    position.textContent = `No se pudo cargar la página ${currentPage}. Prueba otra página o abre el PDF.`;
  });

  renderPage();
})();
