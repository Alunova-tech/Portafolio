(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const refreshers = [];

  document.querySelectorAll('[data-case-gallery]').forEach((gallery) => {
    const track = gallery.querySelector('[data-case-track]');
    const controls = gallery.querySelector('[data-case-controls]');
    const previous = gallery.querySelector('[data-case-previous]');
    const next = gallery.querySelector('[data-case-next]');
    const position = gallery.querySelector('[data-case-position]');
    const slides = track ? Array.from(track.children) : [];
    if (slides.length < 2 || !controls || !previous || !next || !position) return;
    let current = 0;
    let pendingFrame = 0;
    let timer = null;
    let announcementTimer = null;
    let visible = false;
    let hovered = false;
    let focused = false;
    let pointerDown = false;
    let touchActive = false;
    let automaticScroll = true;

    position.removeAttribute('role');
    position.setAttribute('aria-live', 'off');
    const announcements = document.createElement('p');
    announcements.className = 'sr-only';
    announcements.setAttribute('role', 'status');
    announcements.setAttribute('aria-live', 'polite');
    announcements.setAttribute('aria-atomic', 'true');
    gallery.append(announcements);

    const dots = document.createElement('div');
    dots.className = 'case-gallery-dots';
    dots.setAttribute('role', 'group');
    dots.setAttribute('aria-label', 'Elegir imagen del proyecto');
    const dotButtons = slides.map((slide, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.dataset.caseDot = String(index);
      dot.setAttribute('aria-label', `Mostrar imagen ${index + 1} de ${slides.length}`);
      dot.addEventListener('click', () => goTo(index));
      dots.append(dot);
      return dot;
    });
    controls.append(dots);

    function stopTimer() {
      clearTimeout(timer);
      timer = null;
    }

    function canRotate() {
      return visible && !reducedMotion.matches && !hovered && !focused && !pointerDown && !touchActive &&
        !document.hidden && track.clientWidth > 0 && gallery.getClientRects().length > 0 &&
        !gallery.closest('[hidden]') && !document.querySelector('dialog[open]');
    }

    function refreshAutoplay() {
      stopTimer();
      gallery.dataset.autoplay = canRotate() ? 'playing' : 'paused';
      if (!canRotate()) return;
      timer = setTimeout(() => {
        timer = null;
        if (canRotate()) goTo(current + 1, false);
        else refreshAutoplay();
      }, 5000);
    }

    function slideOffset(index) {
      return slides[index].offsetLeft - slides[0].offsetLeft;
    }

    function updateControls() {
      if (!track.clientWidth) { refreshAutoplay(); return; }
      current = slides.reduce((nearest, slide, index) => (
        Math.abs(slideOffset(index) - track.scrollLeft) < Math.abs(slideOffset(nearest) - track.scrollLeft) ? index : nearest
      ), 0);
      previous.disabled = false;
      next.disabled = false;
      const label = `${current + 1} de ${slides.length}`;
      if (position.textContent !== label) position.textContent = label;
      dotButtons.forEach((dot, index) => dot.setAttribute('aria-pressed', String(index === current)));
    }

    function goTo(index, manual = true) {
      const destination = (index % slides.length + slides.length) % slides.length;
      automaticScroll = !manual;
      if (manual) announcements.textContent = `Imagen ${destination + 1} de ${slides.length}`;
      track.scrollTo({left: slideOffset(destination), behavior: reducedMotion.matches ? 'auto' : 'smooth'});
      refreshAutoplay();
    }

    previous.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));
    track.addEventListener('scroll', () => {
      stopTimer();
      if (!automaticScroll) {
        clearTimeout(announcementTimer);
        announcementTimer = setTimeout(() => {
          const message = `Imagen ${current + 1} de ${slides.length}`;
          if (announcements.textContent !== message) announcements.textContent = message;
        }, 180);
      }
      if (pendingFrame) return;
      pendingFrame = requestAnimationFrame(() => {
        updateControls();
        refreshAutoplay();
        pendingFrame = 0;
      });
    }, {passive: true});
    track.addEventListener('keydown', (event) => {
      if (event.target !== track) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const destinations = {ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: slides.length - 1};
      if (!(event.key in destinations)) return;
      event.preventDefault();
      goTo(destinations[event.key]);
    });
    gallery.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      hovered = true;
      automaticScroll = false;
      refreshAutoplay();
    });
    gallery.addEventListener('pointerleave', () => { hovered = false; refreshAutoplay(); });
    gallery.addEventListener('pointerdown', () => { pointerDown = true; focused = false; automaticScroll = false; refreshAutoplay(); });
    const releasePointer = () => { if (pointerDown) { pointerDown = false; refreshAutoplay(); } };
    window.addEventListener('pointerup', releasePointer);
    window.addEventListener('pointercancel', releasePointer);
    gallery.addEventListener('touchstart', () => {
      touchActive = true;
      automaticScroll = false;
      refreshAutoplay();
    }, {passive: true});
    window.addEventListener('touchend', (event) => {
      if (!touchActive) return;
      touchActive = event.touches.length > 0;
      refreshAutoplay();
    }, {passive: true});
    window.addEventListener('touchcancel', () => {
      if (!touchActive) return;
      touchActive = false;
      refreshAutoplay();
    }, {passive: true});
    gallery.addEventListener('focusin', (event) => {
      focused = event.target.matches(':focus-visible');
      refreshAutoplay();
    });
    gallery.addEventListener('focusout', () => { focused = false; refreshAutoplay(); });
    gallery.addEventListener('keydown', () => { focused = true; refreshAutoplay(); });
    reducedMotion.addEventListener('change', refreshAutoplay);
    if ('IntersectionObserver' in window) {
      const visibility = new IntersectionObserver((entries) => {
        for (const entry of entries) visible = entry.isIntersecting && entry.intersectionRatio >= .25;
        refreshAutoplay();
      }, {threshold: [0, .25]});
      visibility.observe(gallery);
    } else {
      const checkVisibility = () => {
        const rect = gallery.getBoundingClientRect();
        visible = rect.bottom > 0 && rect.top < window.innerHeight;
        refreshAutoplay();
      };
      window.addEventListener('scroll', checkVisibility, {passive: true});
      checkVisibility();
    }
    if ('ResizeObserver' in window) {
      const resize = new ResizeObserver(() => { updateControls(); refreshAutoplay(); });
      resize.observe(track);
    } else {
      window.addEventListener('resize', () => { updateControls(); refreshAutoplay(); });
    }
    controls.hidden = false;
    updateControls();
    refreshers.push(refreshAutoplay);
    refreshAutoplay();
  });
  document.addEventListener('visibilitychange', () => refreshers.forEach((refresh) => refresh()));
  if ('MutationObserver' in window) {
    const dialogVisibility = new MutationObserver(() => refreshers.forEach((refresh) => refresh()));
    dialogVisibility.observe(document.body, {subtree: true, attributes: true, attributeFilter: ['open', 'hidden']});
  }
})();
