(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sceneMedia = window.matchMedia('(min-width: 960px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)');
  const root = document.documentElement;
  const animations = new WeakMap();
  const activeAnimations = new Set();
  const motionStyle = getComputedStyle(root);
  const ease = motionStyle.getPropertyValue('--motion-ease').trim() || 'cubic-bezier(.2,.75,.25,1)';
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const containsFocus = (element) => element.contains(document.activeElement);
  const cancelMotion = (element) => animations.get(element)?.cancel();
  const animateMotion = (element, frames, options) => {
    if (reducedMotion.matches || document.hidden || !element?.animate) return;
    cancelMotion(element);
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

  // Animate compact content only; gallery tracks and large case articles stay stable.
  const entryElements = Array.from(document.querySelectorAll('.service-card, .solutions-intro, .process-steps > li, .catalog-editorial-copy, .contact-channels'));
  const entryStates = new WeakMap(entryElements.map((element) => [element, {armed: true}]));
  const animateEntry = (element, delay = 0) => {
    const state = entryStates.get(element);
    if (state) state.armed = false;
    if (containsFocus(element) || element.closest('[hidden]')) { cancelMotion(element); return; }
    animateMotion(element, [
      {opacity: 0, translate: '0 36px', scale: .97},
      {opacity: 1, translate: '0 0', scale: 1},
    ], {duration: 750, delay, easing: ease, fill: 'backwards'});
  };
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver((entries) => {
      let cardStep = 0;
      for (const entry of entries) {
        const state = entryStates.get(entry.target);
        if (!entry.isIntersecting) {
          state.armed = true;
          cancelMotion(entry.target);
          continue;
        }
        if (!state.armed || entry.intersectionRatio < .08) continue;
        const step = entry.target.matches('.process-steps > li')
          ? Array.from(entry.target.parentElement.children).indexOf(entry.target)
          : entry.target.matches('.service-card') ? cardStep++ : 0;
        animateEntry(entry.target, Math.min(step, 4) * 90);
      }
    }, {threshold: [0, .08]});
    for (const element of entryElements) reveal.observe(element);
  }

  // Wrap visual words without replacing heading semantics, emphasis or line breaks.
  const titles = Array.from(document.querySelectorAll('.solutions-heading h2, .project-orbit h2, .process-heading h2, .contact-copy h2'));
  for (const heading of titles) {
    if (heading.dataset.scrollTitle || heading.querySelector('a, button, input')) continue;
    const labelSource = heading.cloneNode(true);
    labelSource.querySelectorAll('br').forEach((lineBreak) => lineBreak.replaceWith(' '));
    if (!heading.hasAttribute('aria-label')) heading.setAttribute('aria-label', labelSource.textContent.replace(/\s+/g, ' ').trim());
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let wordIndex = 0;
    for (const text of nodes) {
      if (!/\S/.test(text.textContent)) continue;
      const fragment = document.createDocumentFragment();
      for (const part of text.textContent.split(/(\s+)/)) {
        if (!part || /^\s+$/.test(part)) { fragment.append(document.createTextNode(part)); continue; }
        const word = document.createElement('span');
        word.className = 'scroll-title-word';
        word.setAttribute('aria-hidden', 'true');
        word.style.setProperty('--word-delay', (wordIndex++ * 80) + 'ms');
        const inner = document.createElement('span');
        inner.className = 'scroll-title-word-inner';
        inner.textContent = part;
        word.append(inner);
        fragment.append(word);
      }
      text.replaceWith(fragment);
    }
    heading.dataset.scrollTitle = 'true';
  }
  const visibleTitles = new Set();
  if ('IntersectionObserver' in window) {
    const titleObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visibleTitles.add(entry.target);
          entry.target.classList.add('is-title-visible');
        } else {
          visibleTitles.delete(entry.target);
          if (!reducedMotion.matches && !containsFocus(entry.target)) entry.target.classList.remove('is-title-visible');
        }
      }
    }, {threshold: 0});
    for (const heading of titles) titleObserver.observe(heading);
  } else {
    for (const heading of titles) heading.classList.add('is-title-visible');
  }

  const scenes = Array.from(document.querySelectorAll('.project-orbit')).map((scene) => ({
    scene,
    wrapper: scene.closest('.project-orbit-scroll') || scene,
    height: 0,
    wrapperHeight: 0,
    pinTop: 0,
  }));
  const visibleScenes = new Set();
  const sceneByWrapper = new Map(scenes.map((record) => [record.wrapper, record]));
  const sceneObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const record = sceneByWrapper.get(entry.target);
      if (entry.isIntersecting) visibleScenes.add(record);
      else visibleScenes.delete(record);
    }
    scheduleProgress();
  }, {threshold: 0}) : null;
  for (const record of scenes) sceneObserver?.observe(record.wrapper);
  const stickySupported = Boolean(window.CSS?.supports('position', 'sticky'));
  let stickyScenes = false;
  let geometryDirty = true;
  function configureScenes() {
    stickyScenes = stickySupported && sceneMedia.matches && scenes.some((record) => record.wrapper !== record.scene);
    root.classList.toggle('has-scroll-scenes', stickyScenes);
    root.classList.toggle('has-scroll-reveals', !reducedMotion.matches && 'IntersectionObserver' in window);
    for (const record of scenes) {
      record.scene.style.removeProperty('--orbit-progress');
      if (reducedMotion.matches) {
        record.scene.style.setProperty('--orbit-spread', '1');
        record.scene.style.setProperty('--orbit-scale', '1');
        record.scene.style.setProperty('--orbit-alpha', '1');
      }
    }
    if (reducedMotion.matches) {
      for (const heading of titles) heading.classList.add('is-title-visible');
    } else {
      for (const heading of titles) heading.classList.toggle('is-title-visible', visibleTitles.has(heading) || containsFocus(heading));
    }
    geometryDirty = true;
    scheduleProgress();
  }

  document.querySelector('.service-grid')?.addEventListener('servicesfiltered', () => {
    document.querySelectorAll('.service-card:not([hidden])').forEach((card, index) => animateEntry(card, Math.min(index, 4) * 90));
  });
  document.addEventListener('servicechanged', (event) => {
    if (!event.detail?.selected) return;
    const card = document.getElementById(event.detail.id);
    animateMotion(card, [
      {boxShadow: '0 0 0 0 #c9f63a00'},
      {boxShadow: '0 0 0 4px #c9f63a99', offset: .45},
      {boxShadow: '0 0 0 0 #c9f63a00'},
    ], {duration: 320, easing: ease});
  });
  const counts = document.querySelectorAll('[data-inquiry-count]');
  if ('MutationObserver' in window) {
    const countObserver = new MutationObserver(() => {
      for (const count of counts) animateMotion(count, [{scale: 1}, {scale: 1.16}, {scale: 1}], {duration: 260, easing: ease});
    });
    for (const count of counts) countObserver.observe(count, {childList: true, characterData: true, subtree: true});
  }
  document.addEventListener('focusin', (event) => {
    const heading = event.target.closest('[data-scroll-title]');
    heading?.classList.add('is-title-visible');
    for (const element of entryElements) {
      if (!element.contains(event.target)) continue;
      entryStates.get(element).armed = false;
      cancelMotion(element);
    }
  });

  if ('IntersectionObserver' in window) {
    const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
    const sectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of navLinks) {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
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

  const header = document.querySelector('.mega-header');
  let frame = 0;
  function updateProgress() {
    frame = 0;
    if (document.hidden) return;
    const viewportHeight = window.innerHeight;
    const length = root.scrollHeight - viewportHeight;
    const readingProgress = length > 0 ? clamp(window.scrollY / length) : 0;
    if (geometryDirty) {
      for (const record of scenes) {
        record.height = record.scene.offsetHeight;
        record.wrapperHeight = record.wrapper.offsetHeight;
        record.pinTop = parseFloat(getComputedStyle(record.scene).top) || 0;
      }
      geometryDirty = false;
    }
    const updates = [];
    if (!reducedMotion.matches) {
      const candidates = sceneObserver ? visibleScenes : scenes;
      for (const record of candidates) {
        const bounds = record.wrapper.getBoundingClientRect();
        if (!bounds.height || bounds.bottom <= 0 || bounds.top >= viewportHeight) continue;
        const travel = record.wrapperHeight - record.height;
        const pinned = stickyScenes && record.wrapper !== record.scene && travel > 0;
        const rawProgress = pinned
          ? clamp((record.pinTop - bounds.top) / travel)
          : clamp((viewportHeight * .85 - bounds.top) / (viewportHeight * .55));
        // Finish the composition before the sticky section leaves; reverse scroll rewinds it.
        const phase = clamp(pinned ? rawProgress / .82 : rawProgress);
        const spread = phase * phase * (3 - 2 * phase);
        updates.push([record.scene, spread, (pinned ? .35 : .88) + (pinned ? .65 : .12) * spread, .2 + .8 * spread]);
      }
    }
    header?.style.setProperty('--reading-progress', String(readingProgress));
    for (const [scene, spread, scale, alpha] of updates) {
      scene.style.setProperty('--orbit-spread', spread.toFixed(4));
      scene.style.setProperty('--orbit-scale', scale.toFixed(4));
      scene.style.setProperty('--orbit-alpha', alpha.toFixed(4));
    }
  }
  function scheduleProgress() {
    if (!document.hidden && !frame) frame = requestAnimationFrame(updateProgress);
  }
  function invalidateGeometry() {
    geometryDirty = true;
    scheduleProgress();
  }
  window.addEventListener('scroll', scheduleProgress, {passive: true});
  window.addEventListener('resize', invalidateGeometry);
  sceneMedia.addEventListener('change', configureScenes);
  reducedMotion.addEventListener('change', () => {
    for (const animation of activeAnimations) animation.cancel();
    configureScenes();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      for (const animation of activeAnimations) animation.cancel();
    } else invalidateGeometry();
  });
  if ('ResizeObserver' in window) {
    const resize = new ResizeObserver(invalidateGeometry);
    for (const record of scenes) {
      resize.observe(record.wrapper);
      if (record.wrapper !== record.scene) resize.observe(record.scene);
    }
    if (header) resize.observe(header);
  }
  document.fonts?.ready.then(invalidateGeometry);
  configureScenes();
})();
