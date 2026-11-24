(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new WeakMap();
  const activeAnimations = new Set();
  const motionStyle = getComputedStyle(document.documentElement);
  const motionTime = (property, fallback) => {
    const value = motionStyle.getPropertyValue(property).trim();
    const number = parseFloat(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(80, Math.min(1000, value.endsWith('ms') ? number : value.endsWith('s') ? number * 1000 : fallback));
  };
  const timing = {
    entry: motionTime('--motion-entry', 620),
    ui: motionTime('--motion-ui', 320),
    fast: motionTime('--motion-fast', 180),
    ease: motionStyle.getPropertyValue('--motion-ease').trim() || 'cubic-bezier(.2,.75,.25,1)',
  };
  const animateMotion = (element, frames, options) => {
    if (reducedMotion.matches || document.hidden || !element?.animate) return;
    animations.get(element)?.cancel();
    const animation = element.animate(frames, options);
    animations.set(element, animation);
    activeAnimations.add(animation);
    const forget = () => {
      activeAnimations.delete(animation);
      if (animations.get(element) === animation) animations.delete(element);
    };
    animation.addEventListener('finish', forget, {once: true});
    animation.addEventListener('cancel', forget, {once: true});
  };
  const animateEntry = (element, delay = 0) => {
    animateMotion(element, [
      {opacity: .2, translate: '0 12px'},
      {opacity: 1, translate: '0 0'},
    ], {duration: timing.entry, delay, easing: timing.ease});
  };

  const orbitScenes = Array.from(document.querySelectorAll('.project-orbit'));
  const visibleOrbitScenes = new Set();
  const orbitVisibility = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visibleOrbitScenes.add(entry.target);
      else visibleOrbitScenes.delete(entry.target);
    }
    scheduleProgress();
  }, {threshold: 0}) : null;
  for (const scene of orbitScenes) orbitVisibility?.observe(scene);

  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const stepIndex = entry.target.matches('.process-steps > li') ? Array.from(entry.target.parentElement.children).indexOf(entry.target) : 0;
        animateEntry(entry.target, Math.min(stepIndex, 2) * 55);
        reveal.unobserve(entry.target);
      }
    }, {threshold: .08});
    document.querySelectorAll('.solutions-heading, .case-heading, .installation-case, .case-study, .process-heading, .contact-copy, .catalog-layout, .project-orbit').forEach((element) => reveal.observe(element));
    document.querySelectorAll('.process-steps > li').forEach((element) => reveal.observe(element));

    const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
    const sectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of navLinks) {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        }
      }
    }, {rootMargin: '-15% 0px -65% 0px', threshold: 0});
    for (const link of navLinks) {
      const section = document.getElementById(link.hash.slice(1));
      if (section) sectionObserver.observe(section);
    }
    const hero = document.querySelector('#hero');
    if (hero) sectionObserver.observe(hero);
  }

  document.querySelector('.service-grid')?.addEventListener('servicesfiltered', () => {
    document.querySelectorAll('.service-card:not([hidden])').forEach((card, index) => animateEntry(card, Math.min(index, 4) * 40));
  });

  document.addEventListener('servicechanged', (event) => {
    if (reducedMotion.matches || !event.detail?.selected) return;
    const card = document.getElementById(event.detail.id);
    animateMotion(card, [
      {boxShadow: '0 0 0 0 #c9f63a00'},
      {boxShadow: '0 0 0 4px #c9f63a99', offset: .45},
      {boxShadow: '0 0 0 0 #c9f63a00'},
    ], {duration: timing.ui, easing: timing.ease});
  });

  const counts = document.querySelectorAll('[data-inquiry-count]');
  if ('MutationObserver' in window) {
    const countObserver = new MutationObserver(() => {
      if (reducedMotion.matches) return;
      for (const count of counts) {
        animateMotion(count, [{scale: 1}, {scale: 1.16}, {scale: 1}], {duration: timing.fast + 80, easing: timing.ease});
      }
    });
    for (const count of counts) countObserver.observe(count, {childList: true, characterData: true, subtree: true});
  }

  const header = document.querySelector('.mega-header');
  let scheduled = false;
  const updateProgress = () => {
    scheduled = false;
    if (document.hidden) return;
    const viewportHeight = window.innerHeight;
    const length = document.documentElement.scrollHeight - viewportHeight;
    const readingProgress = length > 0 ? Math.min(1, Math.max(0, window.scrollY / length)) : 0;
    const sceneValues = [];
    if (!reducedMotion.matches) {
      // Batch geometry reads before updating decorative custom properties.
      const candidates = orbitVisibility ? visibleOrbitScenes : orbitScenes;
      for (const scene of candidates) {
        const rect = scene.getBoundingClientRect();
        if (!rect.height || rect.bottom <= 0 || rect.top >= viewportHeight) continue;
        const progress = (viewportHeight / 2 - (rect.top + rect.height / 2)) / ((viewportHeight + rect.height) / 2);
        sceneValues.push([scene, Math.max(-1, Math.min(1, progress)).toFixed(4)]);
      }
    }
    header?.style.setProperty('--reading-progress', String(readingProgress));
    for (const [scene, value] of sceneValues) scene.style.setProperty('--orbit-progress', value);
  };
  function scheduleProgress() {
    if (document.hidden) return;
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateProgress); }
  }
  window.addEventListener('scroll', scheduleProgress, {passive: true});
  window.addEventListener('resize', scheduleProgress);
  const refreshMotion = () => {
    if (reducedMotion.matches || document.hidden) {
      for (const animation of activeAnimations) animation.cancel();
      for (const scene of orbitScenes) scene.style.removeProperty('--orbit-progress');
    }
    if (!document.hidden) scheduleProgress();
  };
  reducedMotion.addEventListener('change', refreshMotion);
  document.addEventListener('visibilitychange', refreshMotion);
  updateProgress();
})();
