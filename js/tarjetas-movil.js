(() => {
  const compact = window.matchMedia('(max-width: 599px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const entries = [];

  for (const article of document.querySelectorAll('.case-projects .installation-case, .case-projects .case-study')) {
    if (!article.id || article.querySelector('.mobile-project-heading')) continue;
    const originalTitle = article.querySelector('h3');
    const image = article.querySelector('.installation-photo > img, .case-slide img, .case-identity-image img');
    if (!originalTitle || !image) continue;
    const originalLabel = article.getAttribute('aria-labelledby');
    const context = article.querySelector('.case-context, .installation-copy > .eyebrow');
    const content = document.createElement('div');
    content.id = `mobile-project-content-${article.id}`;
    content.className = 'mobile-project-body';
    content.append(...Array.from(article.childNodes));

    const heading = document.createElement('h3');
    heading.className = 'mobile-project-heading';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mobile-project-toggle';
    button.setAttribute('aria-controls', content.id);
    const thumb = document.createElement('span');
    thumb.className = 'mobile-project-thumb';
    thumb.classList.toggle('is-identity', !!content.querySelector('.case-identity'));
    const thumbnail = document.createElement('img');
    thumbnail.src = image.getAttribute('src');
    thumbnail.alt = '';
    thumbnail.width = 160;
    thumbnail.height = 160;
    thumbnail.loading = 'lazy';
    thumbnail.decoding = 'async';
    thumb.append(thumbnail);

    const summary = document.createElement('span');
    summary.className = 'mobile-project-summary';
    const category = document.createElement('span');
    category.className = 'mobile-project-context';
    category.id = `mobile-project-context-${article.id}`;
    category.textContent = context?.textContent.trim() || '';
    const title = document.createElement('span');
    title.className = 'mobile-project-title';
    title.id = `mobile-project-title-${article.id}`;
    title.textContent = originalTitle.textContent.trim();
    summary.append(category, title);
    button.setAttribute('aria-labelledby', title.id);
    if (category.textContent) button.setAttribute('aria-describedby', category.id);
    const indicator = document.createElement('span');
    indicator.className = 'mobile-project-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    button.append(thumb, summary, indicator);
    heading.append(button);
    article.append(heading, content);
    article.classList.add('mobile-project-card');

    const entry = {article, originalTitle, originalLabel, heading, button, content, title, indicator, open: false, hinted: false};
    entries.push(entry);
    button.addEventListener('click', () => {
      if (!compact.matches) return;
      if (entry.open) button.focus({preventScroll: true});
      entry.open = !entry.open;
      syncEntry(entry);
      if (entry.open && !reducedMotion.matches && entry.content.animate) {
        entry.content.animate([{opacity: .5, transform: 'translateY(-5px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 220, easing: 'ease-out'});
      }
      if (!entry.open) button.focus({preventScroll: true});
    });
    article.addEventListener('animationend', (event) => {
      if (event.animationName === 'project-card-relief') article.classList.remove('has-mobile-hint');
    });
  }
  if (!entries.length) return;
  document.querySelector('.case-index')?.classList.add('has-compact-project-cards');

  function syncEntry(entry) {
    const isCompact = compact.matches;
    const summaryFocused = entry.heading.contains(document.activeElement);
    if (isCompact && entry.content.contains(document.activeElement)) entry.open = true;
    entry.content.hidden = isCompact && !entry.open;
    entry.heading.hidden = !isCompact;
    entry.button.setAttribute('aria-expanded', String(!isCompact || entry.open));
    entry.indicator.textContent = entry.open ? '−' : '+';
    entry.article.classList.toggle('is-expanded', isCompact && entry.open);
    if (isCompact) entry.article.setAttribute('aria-labelledby', entry.title.id);
    else {
      if (entry.originalLabel) entry.article.setAttribute('aria-labelledby', entry.originalLabel);
      else entry.article.removeAttribute('aria-labelledby');
      if (summaryFocused) {
        entry.originalTitle.setAttribute('tabindex', '-1');
        entry.originalTitle.focus({preventScroll: true});
      }
    }
  }

  function anchorEntry(hash) {
    if (!hash || hash === '#') return null;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return null; }
    const target = document.getElementById(id);
    if (!target) return null;
    const entry = entries.find((item) => item.article === target || item.content.contains(target));
    return entry ? {entry, target} : null;
  }

  function expandHash(hash, scroll = false) {
    if (!compact.matches) return;
    const match = anchorEntry(hash);
    if (!match) return;
    match.entry.open = true;
    syncEntry(match.entry);
    if (scroll) requestAnimationFrame(() => {
      const target = match.target === match.entry.originalTitle ? match.entry.article : match.target;
      target.scrollIntoView({block: 'start', behavior: 'instant'});
    });
  }

  function syncLayout() {
    entries.forEach(syncEntry);
    expandHash(window.location.hash);
  }
  compact.addEventListener('change', syncLayout);
  window.addEventListener('pageshow', syncLayout);
  window.addEventListener('hashchange', () => expandHash(window.location.hash, true));
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
    const link = event.target.closest('a[href^="#"]');
    if (link) expandHash(link.getAttribute('href'));
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) entries.forEach(({article}) => article.classList.remove('has-mobile-hint'));
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((records) => {
      for (const record of records) {
        if (!record.isIntersecting || !compact.matches) continue;
        const entry = entries.find((item) => item.button === record.target);
        if (!entry || entry.hinted) continue;
        entry.hinted = true;
        if (!reducedMotion.matches) entry.article.classList.add('has-mobile-hint');
        observer.unobserve(record.target);
      }
    }, {threshold: .2});
    entries.forEach(({button}) => observer.observe(button));
  }
  syncLayout();
})();
