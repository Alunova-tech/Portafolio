(() => {
  const heroRegion = document.querySelector('#hero');
  if (heroRegion) {
    const canvas = document.createElement('div');
    canvas.className = 'hero-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    for (const name of ['hero-canvas-light', 'hero-canvas-grid', 'hero-canvas-curve']) {
      const layer = document.createElement('span');
      layer.className = name;
      canvas.append(layer);
    }
    heroRegion.prepend(canvas);
  }
  const surfaces = document.querySelectorAll('.hero-stage, .catalog-art, .case-study .case-screen, .case-study .case-copy, .installation-copy');
  for (const surface of surfaces) {
    surface.dataset.brandSurface = surface.matches('.hero-stage') ? 'hero' : surface.matches('.case-screen') ? 'media' : 'quiet';
    const scene = document.createElement('div');
    scene.className = 'brand-scene';
    scene.setAttribute('aria-hidden', 'true');
    const layers = ['brand-aura', 'brand-ring brand-ring-outer', 'brand-ring brand-ring-inner', 'brand-spark'];
    if (surface.matches('.hero-stage')) layers.unshift('brand-mesh', 'brand-ribbon', 'brand-eclipse');
    for (const name of layers) {
      const layer = document.createElement('span');
      layer.className = name;
      scene.append(layer);
    }
    surface.prepend(scene);
  }

  const hero = document.querySelector('.hero-stage[data-brand-surface="hero"]');
  if (!hero) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointerMotion = window.matchMedia('(min-width: 960px) and (hover: hover) and (pointer: fine)');
  let userPaused = false;
  let heroVisible = true;
  let parallaxFrame = 0;
  let pointerPosition = {x: 0, y: 0};

  const resetParallax = () => {
    cancelAnimationFrame(parallaxFrame);
    parallaxFrame = 0;
    if (!heroRegion) return;
    for (const property of ['--hero-canvas-x', '--hero-canvas-y', '--hero-scene-x', '--hero-scene-y']) {
      heroRegion.style.removeProperty(property);
    }
  };
  const canUsePointerMotion = () => pointerMotion.matches && !reducedMotion.matches &&
    !document.hidden && !document.querySelector('dialog[open]');
  const paintParallax = () => {
    parallaxFrame = 0;
    if (!heroRegion || !canUsePointerMotion() || userPaused || !heroVisible) { resetParallax(); return; }
    heroRegion.style.setProperty('--hero-canvas-x', `${(-pointerPosition.x * 5).toFixed(2)}px`);
    heroRegion.style.setProperty('--hero-canvas-y', `${(-pointerPosition.y * 4).toFixed(2)}px`);
    heroRegion.style.setProperty('--hero-scene-x', `${(pointerPosition.x * 7).toFixed(2)}px`);
    heroRegion.style.setProperty('--hero-scene-y', `${(pointerPosition.y * 5).toFixed(2)}px`);
  };
  heroRegion?.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || !canUsePointerMotion() || userPaused || !heroVisible) return;
    const rect = heroRegion.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerPosition = {
      x: Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2)),
      y: Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2)),
    };
    if (!parallaxFrame) parallaxFrame = requestAnimationFrame(paintParallax);
  }, {passive: true});
  heroRegion?.addEventListener('pointerleave', resetParallax);
  heroRegion?.addEventListener('pointercancel', resetParallax);

  const cover = document.querySelector('.catalog-cover');
  let coverFrame = 0;
  let coverPosition = {x: 0, y: 0};
  const resetCover = () => {
    cancelAnimationFrame(coverFrame);
    coverFrame = 0;
    cover?.style.removeProperty('--cover-tilt-x');
    cover?.style.removeProperty('--cover-tilt-y');
  };
  const paintCover = () => {
    coverFrame = 0;
    if (!cover || !canUsePointerMotion() || cover.matches(':focus-visible')) { resetCover(); return; }
    cover.style.setProperty('--cover-tilt-x', `${(-coverPosition.y * 2.2).toFixed(2)}deg`);
    cover.style.setProperty('--cover-tilt-y', `${(coverPosition.x * 3).toFixed(2)}deg`);
  };
  cover?.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || !canUsePointerMotion() || cover.matches(':focus-visible')) return;
    // Use the stable containing surface rather than the already tilted button.
    const rect = cover.closest('.catalog-art').getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    coverPosition = {
      x: Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2)),
      y: Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2)),
    };
    if (!coverFrame) coverFrame = requestAnimationFrame(paintCover);
  }, {passive: true});
  cover?.addEventListener('pointerleave', resetCover);
  cover?.addEventListener('pointercancel', resetCover);
  cover?.addEventListener('focus', resetCover);
  cover?.addEventListener('click', resetCover);
  cover?.addEventListener('pointerdown', (event) => { if (event.pointerType !== 'mouse') resetCover(); });
  const resetPointerMotion = () => { resetParallax(); resetCover(); };
  pointerMotion.addEventListener('change', resetPointerMotion);
  reducedMotion.addEventListener('change', resetPointerMotion);
  document.addEventListener('visibilitychange', resetPointerMotion);
  if ('MutationObserver' in window) {
    new MutationObserver(() => { if (document.querySelector('dialog[open]')) resetPointerMotion(); })
      .observe(document.body, {subtree: true, attributes: true, attributeFilter: ['open']});
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'scene-motion';
  const icon = document.createElement('span');
  icon.className = 'scene-motion-icon';
  icon.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  button.append(icon, label);
  hero.append(button);

  function updateMotion() {
    const paused = userPaused || reducedMotion.matches || document.hidden;
    document.documentElement.classList.toggle('brand-motion-paused', paused);
    if (paused) resetParallax();
    button.hidden = reducedMotion.matches;
    icon.textContent = userPaused ? '▶' : 'Ⅱ';
    label.textContent = userPaused ? 'Animar' : 'Pausar';
    button.setAttribute('aria-label', userPaused ? 'Reanudar animación del fondo' : 'Pausar animación del fondo');
  }
  button.addEventListener('click', () => { userPaused = !userPaused; updateMotion(); });
  reducedMotion.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        heroVisible = entry.isIntersecting;
        if (!heroVisible) resetParallax();
        hero.classList.toggle('scene-is-visible', entry.isIntersecting);
        heroRegion?.classList.toggle('brand-is-visible', entry.isIntersecting);
      }
    }, {threshold: .01});
    observer.observe(hero);
  } else {
    hero.classList.add('scene-is-visible');
    heroRegion?.classList.add('brand-is-visible');
  }
  updateMotion();
})();
