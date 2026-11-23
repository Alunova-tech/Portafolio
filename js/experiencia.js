(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new WeakMap();
  const animateEntry = (element, delay = 0) => {
    if (reducedMotion.matches || !element.animate) return;
    animations.get(element)?.cancel();
    animations.set(element, element.animate([
      {opacity: .25, transform: 'translateY(16px)'},
      {opacity: 1, transform: 'translateY(0)'},
    ], {duration: 450, delay, easing: 'cubic-bezier(.2,.75,.25,1)'}));
  };

  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        animateEntry(entry.target);
        reveal.unobserve(entry.target);
      }
    }, {threshold: .08});
    document.querySelectorAll('.solutions-heading, .installation-case, .case-study, .process-heading, .process-steps, .contact-copy').forEach((element) => reveal.observe(element));

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
    document.querySelectorAll('.service-card:not([hidden])').forEach((card, index) => animateEntry(card, index * 45));
  });

  document.addEventListener('servicechanged', (event) => {
    if (reducedMotion.matches || !event.detail?.selected) return;
    const card = document.getElementById(event.detail.id);
    if (card?.animate) card.animate([
      {boxShadow: '0 0 0 0 #c9f63a00'},
      {boxShadow: '0 0 0 4px #c9f63a99', offset: .45},
      {boxShadow: '0 0 0 0 #c9f63a00'},
    ], {duration: 360, easing: 'ease-out'});
  });

  const counts = document.querySelectorAll('[data-inquiry-count]');
  if ('MutationObserver' in window) {
    const countObserver = new MutationObserver(() => {
      if (reducedMotion.matches) return;
      for (const count of counts) {
        if (!count.animate) continue;
        count.animate([{transform: 'scale(1)'}, {transform: 'scale(1.2)'}, {transform: 'scale(1)'}], {duration: 280});
      }
    });
    for (const count of counts) countObserver.observe(count, {childList: true, characterData: true, subtree: true});
  }

  const header = document.querySelector('.mega-header');
  let scheduled = false;
  const updateProgress = () => {
    const length = document.documentElement.scrollHeight - window.innerHeight;
    header?.style.setProperty('--reading-progress', String(length > 0 ? Math.min(1, Math.max(0, window.scrollY / length)) : 0));
    scheduled = false;
  };
  const scheduleProgress = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateProgress); }
  };
  window.addEventListener('scroll', scheduleProgress, {passive: true});
  window.addEventListener('resize', scheduleProgress);
  updateProgress();
})();
