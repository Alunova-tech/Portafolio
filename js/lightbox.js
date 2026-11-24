(() => {
  if (!('HTMLDialogElement' in window) || !HTMLDialogElement.prototype.showModal) return;

  const dialog = document.createElement('dialog');
  dialog.id = 'image-lightbox';
  dialog.className = 'image-lightbox';
  dialog.setAttribute('aria-labelledby', 'image-lightbox-title');
  const header = document.createElement('div');
  header.className = 'image-lightbox-header';
  const title = document.createElement('h2');
  title.id = 'image-lightbox-title';
  const position = document.createElement('span');
  position.className = 'image-lightbox-position';
  position.setAttribute('aria-live', 'polite');
  position.setAttribute('aria-atomic', 'true');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'image-lightbox-close';
  close.textContent = 'Cerrar';
  close.setAttribute('aria-label', 'Cerrar vista ampliada');
  header.append(title, position, close);

  const stage = document.createElement('div');
  stage.className = 'image-lightbox-stage';
  stage.tabIndex = 0;
  stage.setAttribute('aria-label', 'Imagen ampliada. Usa las flechas del teclado para navegar.');
  const image = document.createElement('img');
  image.className = 'image-lightbox-image';
  image.decoding = 'async';
  image.draggable = false;
  const error = document.createElement('p');
  error.className = 'image-lightbox-error';
  error.hidden = true;
  error.setAttribute('role', 'status');
  error.textContent = 'No se pudo cargar esta imagen. Puedes cambiar de imagen o cerrar la vista.';

  function navigationButton(direction, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `image-lightbox-nav image-lightbox-${direction}`;
    button.setAttribute('aria-label', label);
    button.textContent = label;
    return button;
  }
  const previous = navigationButton('previous', 'Imagen anterior');
  const next = navigationButton('next', 'Imagen siguiente');
  stage.append(image, error, previous, next);
  dialog.append(header, stage);
  document.body.append(dialog);

  let activeGroup = null;
  let current = 0;
  let opener = null;
  let gesture = null;

  function render() {
    if (!activeGroup) return;
    const source = activeGroup.images[current];
    error.hidden = true;
    stage.setAttribute('aria-busy', 'true');
    image.alt = source.alt || '';
    // Only the requested source is loaded; the other images stay in their page groups.
    image.src = source.currentSrc || source.src;
    position.textContent = `${current + 1} / ${activeGroup.images.length}`;
    position.hidden = activeGroup.images.length < 2;
    previous.hidden = activeGroup.images.length < 2;
    next.hidden = activeGroup.images.length < 2;
  }

  function show(group, trigger) {
    if (!group.images.length || document.querySelector('dialog[open]')) return;
    activeGroup = group;
    opener = trigger;
    const requested = typeof group.getIndex === 'function' ? group.getIndex() : 0;
    current = Math.max(0, Math.min(group.images.length - 1, requested));
    title.textContent = group.title;
    dialog.showModal();
    document.body.classList.add('image-lightbox-open');
    render();
    close.focus({preventScroll: true});
  }

  function changeImage(index) {
    if (!activeGroup || activeGroup.images.length < 2) return;
    current = (index % activeGroup.images.length + activeGroup.images.length) % activeGroup.images.length;
    render();
  }

  function canFocus(element) {
    return element?.isConnected && typeof element.focus === 'function' &&
      element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
  }

  close.addEventListener('click', () => dialog.close());
  previous.addEventListener('click', () => changeImage(current - 1));
  next.addEventListener('click', () => changeImage(current + 1));
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !activeGroup) return;
    const destinations = {ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: activeGroup.images.length - 1};
    if (!(event.key in destinations)) return;
    event.preventDefault();
    changeImage(destinations[event.key]);
  });
  stage.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' || !event.isPrimary || event.target.closest('button')) {
      gesture = null;
      return;
    }
    gesture = {id: event.pointerId, x: event.clientX, y: event.clientY};
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointerup', (event) => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    gesture = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) changeImage(current + (dx < 0 ? 1 : -1));
  });
  stage.addEventListener('pointercancel', () => { gesture = null; });
  image.addEventListener('load', () => { stage.removeAttribute('aria-busy'); });
  image.addEventListener('error', () => {
    if (!activeGroup) return;
    stage.removeAttribute('aria-busy');
    error.hidden = false;
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('image-lightbox-open');
    stage.removeAttribute('aria-busy');
    gesture = null;
    const fallback = opener?.closest('.mobile-project-card')?.querySelector('.mobile-project-toggle');
    const target = [opener, fallback].find(canFocus);
    const activeDialog = document.querySelector('dialog[open]');
    if (target && (!activeDialog || activeDialog.contains(target))) target.focus({preventScroll: true});
    activeGroup = null;
    opener = null;
    image.removeAttribute('src');
  });

  function attach(host, group, clickableImage = false) {
    if (!host || !group.images.length || host.querySelector('.image-preview-trigger')) return;
    host.classList.add('has-image-preview');
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'image-preview-trigger';
    trigger.textContent = 'Ampliar';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', dialog.id);
    trigger.setAttribute('aria-label', `Ampliar: ${group.title}`);
    trigger.addEventListener('click', () => show(group, trigger));
    host.append(trigger);
    if (clickableImage) {
      group.images[0].classList.add('can-preview-image');
      group.images[0].addEventListener('click', (event) => {
        if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        show(group, trigger);
      });
    }
  }

  const heroImage = document.querySelector('.hero-media > img');
  if (heroImage) attach(heroImage.parentElement, {title: 'Equipos ALUNOVA · Fotografía real', images: [heroImage]}, true);
  const installationImage = document.querySelector('.installation-photo > img');
  if (installationImage) attach(installationImage.parentElement, {title: 'Montaje audiovisual del OEP · Fotografía real', images: [installationImage]}, true);
  for (const gallery of document.querySelectorAll('[data-case-gallery]')) {
    const images = Array.from(gallery.querySelectorAll('[data-case-track] .case-slide img'));
    attach(gallery, {
      title: gallery.getAttribute('aria-label') || 'Imágenes del proyecto',
      images,
      getIndex: () => {
        const selected = gallery.querySelector('[data-case-dot][aria-pressed="true"]');
        return selected ? Number(selected.dataset.caseDot) : 0;
      },
    });
  }
})();
