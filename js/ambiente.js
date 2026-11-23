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
  let userPaused = false;
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
