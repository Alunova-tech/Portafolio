const clientTrack = document.querySelector('#logos-clientes');
const clientControls = document.querySelector('.carousel-controls');

if (clientTrack && clientControls) {
  const previous = clientControls.querySelector('[data-clientes-prev]');
  const next = clientControls.querySelector('[data-clientes-next]');
  const position = clientControls.querySelector('.carousel-position');
  const cards = Array.from(clientTrack.children);

  function updateCarousel() {
    const left = clientTrack.scrollLeft;
    const right = left + clientTrack.clientWidth;
    previous.disabled = left <= 2;
    next.disabled = right >= clientTrack.scrollWidth - 2;

    const visible = cards.filter((card) => (
      card.offsetLeft >= left - 2 && card.offsetLeft + card.offsetWidth <= right + 2
    ));
    if (!visible.length) return;
    const first = cards.indexOf(visible[0]) + 1;
    const last = cards.indexOf(visible.at(-1)) + 1;
    const range = first === last ? String(first) : `${first}–${last}`;
    const label = `${range} de ${cards.length}`;
    if (position.textContent !== label) position.textContent = label;
  }

  function moveCarousel(direction) {
    const step = cards[1].offsetLeft - cards[0].offsetLeft;
    const current = Math.round(clientTrack.scrollLeft / step);
    clientTrack.scrollTo({left: (current + direction) * step});
  }

  if (cards.length > 1) {
    clientControls.hidden = false;
    previous.addEventListener('click', () => moveCarousel(-1));
    next.addEventListener('click', () => moveCarousel(1));
    clientTrack.addEventListener('scroll', updateCarousel, {passive: true});
    window.addEventListener('resize', updateCarousel);
    updateCarousel();
  }
}
