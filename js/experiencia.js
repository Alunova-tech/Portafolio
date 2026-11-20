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
    document.querySelectorAll('.solutions-heading, .case-study, .contact-copy').forEach((element) => reveal.observe(element));

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

  const catalog = document.querySelector('#brochure.catalog-access');
  const catalogSummary = catalog?.querySelector('summary');
  if (catalog && catalogSummary) {
    catalog.addEventListener('toggle', () => {
      if (catalog.open && window.matchMedia('(max-width: 767px)').matches) {
        catalog.scrollIntoView({block: 'start'});
      }
    });
    const closeCatalog = (restoreFocus = false) => {
      catalog.open = false;
      if (restoreFocus) catalogSummary.focus({preventScroll: true});
    };
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('[data-open-catalog]')) {
        event.preventDefault();
        catalog.open = true;
        window.location.hash = 'brochure';
        catalog.scrollIntoView({block: 'start'});
        catalogSummary.focus({preventScroll: true});
      } else if (event.target.closest('[data-close-catalog]')) {
        closeCatalog(true);
      } else if (catalog.open && !catalog.contains(event.target)) {
        closeCatalog();
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && catalog.open && catalog.contains(event.target)) {
        event.preventDefault();
        closeCatalog(true);
      }
    });
    // Keep a shared catalogue link useful after opening it in a new tab.
    if (window.location.hash === '#brochure') catalog.open = true;
  }

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
