(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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

    function slideOffset(index) {
      return slides[index].offsetLeft - slides[0].offsetLeft;
    }

    function updateControls() {
      current = slides.reduce((nearest, slide, index) => (
        Math.abs(slideOffset(index) - track.scrollLeft) < Math.abs(slideOffset(nearest) - track.scrollLeft) ? index : nearest
      ), 0);
      previous.disabled = current === 0;
      next.disabled = current === slides.length - 1;
      const label = `${current + 1} de ${slides.length}`;
      if (position.textContent !== label) position.textContent = label;
    }

    function goTo(index) {
      const destination = Math.max(0, Math.min(index, slides.length - 1));
      track.scrollTo({left: slideOffset(destination), behavior: reducedMotion.matches ? 'auto' : 'smooth'});
    }

    previous.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));
    track.addEventListener('scroll', () => {
      if (pendingFrame) return;
      pendingFrame = requestAnimationFrame(() => {
        updateControls();
        pendingFrame = 0;
      });
    }, {passive: true});
    track.addEventListener('keydown', (event) => {
      if (event.target !== track) return;
      const destinations = {ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: slides.length - 1};
      if (!(event.key in destinations)) return;
      event.preventDefault();
      goTo(destinations[event.key]);
    });
    if ('ResizeObserver' in window) {
      const resize = new ResizeObserver(updateControls);
      resize.observe(track);
    } else {
      window.addEventListener('resize', updateControls);
    }
    controls.hidden = false;
    updateControls();
  });
})();
