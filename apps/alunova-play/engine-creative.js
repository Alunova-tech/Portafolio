(function () {
  'use strict';
  const shuffle = list => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const levelOf = ctx => Math.min(3, Math.max(1, Number(ctx.level) || 1));
  const styles = `<style>
  .creative-surface{font:inherit;color:inherit}.creative-surface button{touch-action:manipulation}
  .creative-surface .c-title{font-size:19px;line-height:1.3;margin:0 0 14px}.creative-surface .c-note{font-size:12px;line-height:1.5;margin:10px 0;color:var(--muted,#756c82)}
  .creative-surface .c-card{background:var(--game-card,#fff);border:1px solid #ddd2e8;border-radius:13px;padding:16px;text-align:center;position:relative;overflow:hidden;color:var(--ink,#24133f)}
  .creative-surface .c-grid{display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr))}.creative-surface .c-symbol{display:block;font-size:37px;line-height:1.15;margin:5px 0 12px;color:var(--client,#602b9a)}
  .creative-surface .c-btn{display:block;min-height:51px;border:0;border-radius:10px;background:var(--client,#54208b);color:white;padding:13px 17px;font:inherit;font-size:14px;font-weight:650;width:100%;margin-top:14px}
  .creative-surface .c-option{border:2px solid #ded4e9;background:var(--game-card,#fff);border-radius:12px;padding:14px 10px;min-height:76px;color:var(--ink,#24133f);font:inherit;font-size:14px;text-align:center;position:relative;overflow:hidden}
  .creative-surface .c-option.is-active{border-color:var(--client,#54208b);background:#eee4fa}.creative-surface .c-option.is-correct{border-color:#4b9860;background:#e4f2e7}.creative-surface .c-option.is-wrong{border-color:#be6d60;background:#f9e5e1}
  .creative-surface .c-option:disabled{cursor:default}.creative-surface .c-label{display:block;font-size:12px;font-weight:650;line-height:1.35}.creative-surface .c-small{display:block;font-size:10px;line-height:1.35;margin-top:5px;color:#81718d}
  .creative-surface .c-stamps{display:flex;justify-content:center;gap:10px;margin:10px 0 20px}.creative-surface .c-stamps span{display:grid;place-items:center;border:1px dashed #c1afd4;width:56px;height:56px;border-radius:50%;color:#a997ba;font-size:23px}.creative-surface .c-stamps span.done{background:#eee3f9;border:2px solid #75449d;color:#54208b}
  .creative-surface .c-order{display:grid;gap:9px}.creative-surface .c-order-row{display:flex;align-items:center;gap:9px;border-radius:10px;background:#eee7f4;padding:10px}.creative-surface .c-order-row strong{flex:1;font-size:12px}.creative-surface .c-order-row button{height:42px;min-width:38px;border-radius:8px;background:white;color:#54208b;border:1px solid #e1d5ec;font-size:20px}.creative-surface .c-order-row button:disabled{opacity:.3}
  .creative-surface .c-mission{background:#ede5f6;padding:17px;border-radius:13px;margin-bottom:14px}.creative-surface .c-mission p{font-size:13px;margin:8px 0 0;line-height:1.45;color:#695576}.creative-surface .c-budget{font-size:12px;font-weight:650;margin:12px 0}.creative-surface .c-tag{display:inline-block;padding:3px 7px;background:#f0e9f6;border-radius:20px;margin:6px 2px 0;font-size:9px}
  .creative-surface .c-radar{position:relative;min-height:400px;border-radius:14px;overflow:hidden;background:linear-gradient(#f4edfb88,#f4edfb88),url('assets/radar-world.png') center/cover,#ece4f4}.creative-surface .c-radar-tile{position:absolute;width:27%;height:80px;padding:8px 3px;border:2px solid #fff9;border-radius:12px;background:#fffffff0;box-shadow:0 4px 12px #21103f15;color:#37164f}.creative-surface .c-radar-tile .c-symbol{font-size:24px;margin:0 0 2px}.creative-surface .c-radar-tile .c-label{font-size:9px}.creative-surface .c-radar-tile.found{background:#dff0e4;border-color:#509963;opacity:.55}.creative-surface .c-radar-clue{font-size:15px;line-height:1.45;font-weight:650;padding:15px;background:#eee5f7;border-radius:12px;margin-bottom:12px}
  .creative-surface .c-pipes{display:grid;gap:5px;margin:14px 0;grid-template-columns:repeat(3,minmax(0,1fr))}.creative-surface .c-pipe{position:relative;aspect-ratio:1;border:2px solid #e1d7eb;background:#fff;border-radius:10px;padding:0;overflow:hidden}.creative-surface .c-pipe svg{width:100%;height:100%;display:block}.creative-surface .c-pipe.connected{border-color:#ad8cc8;background:#f2ebf8}.creative-surface .c-pipe .c-end{position:absolute;top:5px;left:5px;font-size:12px;background:#ffedda;padding:2px 5px;border-radius:4px;font-weight:700}.creative-surface .c-pipe .g-tile-brand{position:absolute;bottom:2px;left:2px;right:2px;pointer-events:none;transform:scale(.7);transform-origin:center bottom;opacity:.5}
  .creative-surface .c-motion-grid{display:grid;gap:10px;grid-template-columns:repeat(3,minmax(0,1fr));position:relative}.creative-surface .c-motion-card{min-height:102px;border:2px solid #e1d4ee;background:white;border-radius:12px;padding:10px 5px;color:#54208b;position:relative;z-index:1}.creative-surface .c-motion-card.shuffling{z-index:3;box-shadow:0 8px 20px #21103f30}.creative-surface .c-motion-card .c-symbol{font-size:30px;margin:4px 0 8px}.creative-surface .c-target-banner{text-align:center;font-size:14px;margin-bottom:15px}.creative-surface .c-target-banner strong{font-size:27px;color:#7a3fa2;margin:0 7px}
  .creative-surface .c-clue-cards{display:flex;gap:8px;justify-content:center;margin:10px 0 20px}.creative-surface .c-digit{width:65px;min-height:75px;padding:10px;background:#eee4f7;border:1px solid #d8c6e8;border-radius:12px;text-align:center;font-size:30px;font-weight:750;color:#54208b}.creative-surface .c-digit small{font-size:8px;display:block;font-weight:500;letter-spacing:.7px}.creative-surface .c-keypad{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:18px}.creative-surface .c-keypad button{height:55px;border-radius:10px;border:1px solid #ded0e9;background:#fff;color:#54208b;font-size:23px}.creative-surface .c-code-input{font-size:32px;letter-spacing:12px;text-align:center;padding:18px;background:#ece3f6;border-radius:12px;min-height:80px}.creative-surface .c-visual-clue{font-size:31px;letter-spacing:8px;line-height:1.7;text-align:center;padding:17px;background:#eee5f7;border-radius:12px;overflow-wrap:anywhere}
  .creative-surface .c-pulse-stage{position:relative;height:275px;border:1px solid #dcd0e9;border-radius:14px;overflow:hidden;background:repeating-linear-gradient(90deg,#f0e8f7 0,#f0e8f7 calc(33.333% - 1px),#d8c9e6 calc(33.333% - 1px),#d8c9e6 33.333%)}.creative-surface .c-pulse-zone{position:absolute;left:0;right:0;top:70%;height:18%;background:#ddc5f077;border-top:2px dashed #8552a8;border-bottom:2px dashed #8552a8}.creative-surface .c-pulse-zone span{font-size:8px;position:absolute;bottom:0;left:5px;color:#80569c;letter-spacing:1px}.creative-surface .c-pulse-item{position:absolute;width:25%;height:47px;left:4%;top:0;text-align:center;border-radius:9px;background:#fff;box-shadow:0 3px 9px #21103f20;border:1px solid #ddcbea;color:#5a258e;line-height:1;font-size:26px;padding-top:4px}.creative-surface .c-pulse-item .g-tile-brand{transform:scale(.55);transform-origin:top center;height:12px;overflow:hidden}.creative-surface .c-pulse-buttons{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:13px}.creative-surface .c-pulse-buttons button{height:68px;background:#54208b;color:white;border:0;border-radius:10px;font-size:28px}.creative-surface .c-progress{height:7px;border-radius:10px;background:#e2d6ed;overflow:hidden;margin:10px 0}.creative-surface .c-progress span{display:block;height:100%;background:linear-gradient(90deg,#54208b,#bd1768,#ff5b1f);transition:width .2s}
  .creative-surface .c-mural{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;border:5px solid #ede4f6;border-radius:12px;overflow:hidden;margin:15px 0}.creative-surface .c-mural-piece{aspect-ratio:1;background:#dfd3e9;display:grid;place-items:center;font-size:22px;color:#b5a0c8;position:relative;overflow:hidden}.creative-surface .c-mural-piece.open{background-image:url('assets/puzzle-world.png');background-size:300% 300%;color:white}.creative-surface .c-mural-piece.new{animation:c-reveal .8s ease-out}.creative-surface .c-mural-piece .g-tile-brand{position:absolute;bottom:2px;left:1px;right:1px;transform:scale(.7);transform-origin:center bottom;background:#ffffffb0}.creative-surface .c-mural-puzzle{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:12px 0}.creative-surface .c-mural-puzzle button{aspect-ratio:1.4;background-image:url('assets/puzzle-world.png');background-size:200% 200%;border:2px solid transparent;border-radius:9px;position:relative;overflow:hidden}.creative-surface .c-mural-puzzle button.is-active{border-color:#ff5b1f}.creative-surface .c-mural-puzzle button span{position:absolute;top:5px;left:5px;background:#fff;border-radius:5px;padding:2px 8px;font-size:12px;color:#54208b}.creative-surface .c-mural-puzzle .g-tile-brand{position:absolute;bottom:3px;left:3px;right:3px;background:#ffffffc0}
  @keyframes c-reveal{from{transform:scale(.4);opacity:.1}to{transform:scale(1);opacity:1}}@media(prefers-reduced-motion:reduce){.creative-surface *{animation:none!important;transition:none!important}}
  @media(max-width:370px){.creative-surface .c-radar-tile{height:76px}.creative-surface .c-radar{min-height:380px}.creative-surface .c-motion-card{min-height:94px}.creative-surface .c-order-row{gap:6px;padding:8px}.creative-surface .c-order-row strong{font-size:11px}.creative-surface .c-option{font-size:12px;padding:12px 7px}}
  </style>`;
  function surface(ctx) {
    ctx.mount.innerHTML = styles + '<section class="creative-surface"></section>';
    return ctx.mount.querySelector('.creative-surface');
  }
  function guard(ctx) {
    let ended = false;
    ctx.onCleanup(() => { ended = true; });
    return {
      get alive() { return !ended; },
      finish(result) { if (!ended) { ended = true; ctx.finish(result); } }
    };
  }
  const brand = ctx => `<div class="g-tile-brand">${ctx.brand()}</div>`;
  const stat = (ctx, label, value, extra = []) => ctx.stats([{ label, value }, ...extra]);
  function nextButton(root, text, fn) {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'c-btn g-button'; el.textContent = text;
    el.addEventListener('click', fn, { once: true }); root.append(el);
  }

  function passport(ctx) {
    const root = surface(ctx), life = guard(ctx), level = levelOf(ctx);
    let stage = 0, errors = 0, stamps = 0;
    const maxErrors = level === 3 ? 3 : 4;
    const icons = ['☾', '✦', '◆', '●'];
    function header(title) {
      root.innerHTML = `<div class="c-stamps">${['◉', '↗', '✦'].map((s, i) => `<span class="${i < stamps ? 'done' : ''}">${i < stamps ? '✓' : s}</span>`).join('')}</div><h3 class="c-title">${title}</h3>`;
      stat(ctx, 'Estación', `${stage + 1} / 3`, [{ label: 'Sellos', value: `${stamps} / 3` }, { label: 'Intentos', value: maxErrors - errors }]);
    }
    function wrong(message) {
      errors++; ctx.feedback(message);
      stat(ctx, 'Estación', `${stage + 1} / 3`, [{ label: 'Sellos', value: `${stamps} / 3` }, { label: 'Intentos', value: maxErrors - errors }]);
      if (errors >= maxErrors) life.finish({ won: false, score: stamps * 100, maxScore: 300, detail: `Reuniste ${stamps} de 3 sellos. En una nueva visita puedes completar el pasaporte.` });
    }
    function pass() {
      stamps++; root.querySelectorAll('button').forEach(b => { b.disabled = true; });
      root.querySelectorAll('.c-stamps span').forEach((el, i) => { if (i < stamps) { el.classList.add('done'); el.textContent = '✓'; } });
      stat(ctx, 'Estación', `${stage + 1} / 3`, [{ label: 'Sellos', value: `${stamps} / 3` }, { label: 'Intentos', value: maxErrors - errors }]);
      ctx.feedback('¡Sello conseguido! Tu pasaporte ya tiene una nueva estación.');
      if (stamps === 3) ctx.later(() => life.finish({ won: true, score: Math.max(180, 300 - errors * 20), maxScore: 300, detail: 'Completaste observación, proceso y conocimiento. Tu pasaporte de marca está completo.', stats: [{ label: 'Sellos', value: '3 / 3' }, { label: 'Errores', value: errors }] }), 850);
      else nextButton(root, 'Ir a la siguiente estación →', () => { if (life.alive) { stage++; draw(); } });
    }
    function draw() {
      if (!life.alive) return;
      if (stage === 0) {
        header('1. Observa la colección');
        const target = shuffle(icons)[0], others = icons.filter(x => x !== target), set = shuffle([target, target, ...others]);
        root.insertAdjacentHTML('beforeend', `<p class="c-note">Recuerda qué símbolo aparece dos veces. Las tarjetas se ocultarán.</p><div class="c-grid">${set.map(s => `<div class="c-card"><span class="c-symbol">${s}</span>${brand(ctx)}</div>`).join('')}</div>`);
        ctx.feedback('Observa con atención antes de elegir.');
        ctx.later(() => {
          if (!life.alive) return;
          header('¿Qué símbolo apareció dos veces?');
          root.insertAdjacentHTML('beforeend', `<div class="c-grid">${shuffle(icons).map(s => `<button class="c-option" data-symbol="${s}"><span class="c-symbol">${s}</span>${brand(ctx)}</button>`).join('')}</div>`);
          root.querySelectorAll('[data-symbol]').forEach(el => el.onclick = () => {
            if (!life.alive || el.disabled) return;
            if (el.dataset.symbol === target) { el.classList.add('is-correct'); pass(); }
            else { el.disabled = true; el.classList.add('is-wrong'); wrong('Ese símbolo apareció una vez. Prueba otro.'); }
          });
          ctx.feedback('Toca el símbolo que recuerdas repetido.');
        }, 4400 - level * 500);
      } else if (stage === 1) {
        const correct = ['Definir el objetivo', 'Elegir el contenido', 'Personalizar la experiencia', 'Activar en el evento'];
        let order = shuffle(correct);
        if (order.every((x, i) => x === correct[i])) [order[0], order[1]] = [order[1], order[0]];
        const drawOrder = () => {
          header('2. Prepara la activación');
          root.insertAdjacentHTML('beforeend', `<p class="c-note">Ordena las etapas con las flechas.</p><div class="c-order">${order.map((s, i) => `<div class="c-order-row"><span>${i + 1}</span><strong>${s}</strong><button data-up="${i}" aria-label="Subir ${s}" ${i === 0 ? 'disabled' : ''}>↑</button><button data-down="${i}" aria-label="Bajar ${s}" ${i === 3 ? 'disabled' : ''}>↓</button></div>`).join('')}</div>${brand(ctx)}`);
          root.querySelectorAll('[data-up],[data-down]').forEach(el => el.onclick = () => {
            const up = el.hasAttribute('data-up'), i = Number(up ? el.dataset.up : el.dataset.down), j = i + (up ? -1 : 1);
            [order[i], order[j]] = [order[j], order[i]]; drawOrder();
          });
          nextButton(root, 'Sellar mi proceso →', () => {
            if (order.every((s, i) => s === correct[i])) pass();
            else { wrong('Primero se define el objetivo y al final se activa en el evento. Revisa las etapas.'); if (life.alive) drawOrder(); }
          });
        }; drawOrder();
      } else {
        header('3. Conecta el mensaje');
        const answers = shuffle([{ text: 'Participar y descubrir el contenido', good: true }, { text: 'Observar una pantalla sin tocarla', good: false }, { text: 'Elegir siempre la primera opción', good: false }]);
        root.insertAdjacentHTML('beforeend', `<p class="c-note">¿Qué hace interactiva una experiencia?</p>${answers.map((a, i) => `<button class="c-option" data-answer="${i}" style="width:100%;margin-bottom:10px"><span class="c-label">${a.text}</span>${brand(ctx)}</button>`).join('')}`);
        root.querySelectorAll('[data-answer]').forEach(el => el.onclick = () => {
          if (!life.alive || el.disabled) return;
          if (answers[Number(el.dataset.answer)].good) { el.classList.add('is-correct'); pass(); }
          else { el.disabled = true; el.classList.add('is-wrong'); wrong('La interacción ocurre cuando el visitante participa y toma decisiones.'); }
        });
      }
    }
    draw();
  }

  function builder(ctx) {
    const root = surface(ctx), life = guard(ctx), level = levelOf(ctx);
    const missions = [
      { title: 'Un stand que comunica y cuida sus recursos', needs: ['Información', 'Reutilización', 'Energía'], options: [['Catálogo táctil', 'Información', 3, '▤'], ['Envases retornables', 'Reutilización', 2, '♻'], ['Iluminación eficiente', 'Energía', 2, '☀'], ['Cartel de gran formato', 'Información', 5, '▣'], ['Mobiliario modular', 'Reutilización', 4, '⬡'], ['Pantalla decorativa', 'Decoración', 4, '✦']] },
      { title: 'Una bienvenida clara y accesible', needs: ['Orientación', 'Accesibilidad', 'Participación'], options: [['Mapa del recinto', 'Orientación', 2, '⌖'], ['Textos grandes', 'Accesibilidad', 2, 'Aa'], ['Reto interactivo', 'Participación', 3, '◎'], ['Animación decorativa', 'Decoración', 3, '✦'], ['Audio obligatorio', 'Sonido', 3, '♫'], ['Ruta de colores', 'Orientación', 4, '↗']] },
      { title: 'Una experiencia que enseña y se puede mejorar', needs: ['Contenido', 'Práctica', 'Evaluación'], options: [['Historia del producto', 'Contenido', 2, '▤'], ['Simulación guiada', 'Práctica', 3, '☷'], ['Preguntas de cierre', 'Evaluación', 2, '?'], ['Música ambiental', 'Sonido', 4, '♫'], ['Taller breve', 'Práctica', 4, '✚'], ['Panel informativo', 'Contenido', 4, '▣']] }
    ];
    let round = 0, totalScore = 0, allChecks = 0;
    function draw() {
      const m = missions[round], options = shuffle(m.options), selected = new Set(), budget = level === 3 ? 7 : level === 2 ? 8 : 9;
      let checks = 0;
      root.innerHTML = `<div class="c-mission"><h3 class="c-title">${m.title}</h3><p>Elige exactamente tres recursos: uno para cada necesidad.</p>${m.needs.map(n => `<span class="c-tag">${n}</span>`).join('')}</div><div class="c-budget">Créditos disponibles: ${budget} · <span data-budget>Seleccionados: 0 / 3</span></div><div class="c-grid">${options.map((o, i) => `<button class="c-option" data-resource="${i}" aria-pressed="false"><span class="c-symbol">${o[3]}</span><span class="c-label">${o[0]}</span><span class="c-small">${o[1]} · ${o[2]} créditos</span>${brand(ctx)}</button>`).join('')}</div><button class="c-btn" data-check>Construir solución →</button>`;
      stat(ctx, 'Misión', `${round + 1} / 3`, [{ label: 'Puntos', value: totalScore }]);
      ctx.feedback('Relaciona cada recurso con una necesidad y respeta el presupuesto de créditos del juego.');
      function update() {
        const cost = [...selected].reduce((s, i) => s + options[i][2], 0);
        root.querySelector('[data-budget]').textContent = `${selected.size} / 3 recursos · ${cost} créditos`;
        root.querySelectorAll('[data-resource]').forEach(el => { const on = selected.has(Number(el.dataset.resource)); el.classList.toggle('is-active', on); el.setAttribute('aria-pressed', String(on)); });
      }
      root.querySelectorAll('[data-resource]').forEach(el => el.onclick = () => {
        if (!life.alive) return; const i = Number(el.dataset.resource);
        if (selected.has(i)) selected.delete(i);
        else if (selected.size < 3) selected.add(i);
        else ctx.feedback('Ya elegiste tres. Toca un recurso seleccionado para cambiarlo.');
        update();
      });
      root.querySelector('[data-check]').onclick = () => {
        if (!life.alive) return;
        if (selected.size !== 3) { ctx.feedback('Selecciona tres recursos antes de comprobar.'); return; }
        checks++; allChecks++;
        const chosen = [...selected].map(i => options[i]), cost = chosen.reduce((s, o) => s + o[2], 0), covered = m.needs.filter(n => chosen.some(o => o[1] === n));
        if (cost <= budget && covered.length === 3) {
          totalScore += Math.max(40, 100 - (checks - 1) * 20);
          root.querySelectorAll('button').forEach(el => { el.disabled = true; });
          ctx.feedback(`¡Solución construida! Cubriste ${m.needs.join(', ').toLowerCase()} con ${cost} créditos.`);
          if (round === 2) nextButton(root, 'Ver mi resultado →', () => life.finish({ won: true, score: totalScore, maxScore: 300, detail: 'Resolviste tres misiones equilibrando recursos, objetivos y créditos.', stats: [{ label: 'Misiones', value: '3 / 3' }, { label: 'Comprobaciones', value: allChecks }] }));
          else nextButton(root, 'Siguiente misión →', () => { round++; draw(); });
        } else if (checks >= 3) life.finish({ won: false, score: totalScore, maxScore: 300, detail: `Completaste ${round} de tres misiones. Revisa las etiquetas y los créditos de cada recurso.` });
        else ctx.feedback(cost > budget ? `Tu solución usa ${cost} créditos. Tienes ${budget}; cambia algún recurso.` : `Cubres ${covered.length} de tres necesidades. Busca una opción para cada etiqueta.`);
      };
    }
    draw();
  }

  function radar(ctx) {
    const root = surface(ctx), life = guard(ctx), level = levelOf(ctx), perClue = level === 1 ? 2 : 3;
    const groups = [{ icon: '☾', label: 'Luna', clue: 'Encuentra todas las lunas.' }, { icon: '✦', label: 'Estrella', clue: 'Ahora localiza todas las estrellas.' }, { icon: '◆', label: 'Diamante', clue: 'Termina encontrando todos los diamantes.' }];
    let clue = 0, found = 0, errors = 0, remaining = 90 + (3 - level) * 15;
    const total = perClue * 3, limit = 5, set = shuffle(groups.flatMap((g, gi) => Array.from({ length: perClue }, () => ({ ...g, group: gi }))));
    while (set.length < 12) set.push({ icon: ['●', '⬡', '✚'][set.length % 3], label: 'Otro símbolo', group: -1 });
    const items = shuffle(set);
    root.innerHTML = `<div class="c-radar-clue" data-clue>${groups[0].clue} <span data-count>0 / ${perClue}</span></div><div class="c-radar">${items.map((item, i) => `<button class="c-radar-tile" data-object="${i}" aria-label="${item.label}, objeto ${i + 1}" style="left:${5 + (i % 3) * 32}%;top:${3 + Math.floor(i / 3) * 24}%"><span class="c-symbol">${item.icon}</span><span class="c-label">${item.label}</span>${brand(ctx)}</button>`).join('')}</div>`;
    function hud() { stat(ctx, 'Objetos', `${found} / ${total}`, [{ label: 'Tiempo', value: `${remaining} s` }, { label: 'Intentos', value: limit - errors }]); }
    function updateClue() { root.querySelector('[data-clue]').innerHTML = `${groups[clue].clue} <span data-count>0 / ${perClue}</span>`; }
    ctx.feedback('Observa las figuras. Las etiquetas también permiten distinguirlas sin depender del color.'); hud();
    const seen = new Set(); let inClue = 0;
    root.querySelectorAll('[data-object]').forEach(el => el.onclick = () => {
      if (!life.alive || el.disabled) return;
      const i = Number(el.dataset.object), item = items[i];
      if (item.group === clue && !seen.has(i)) {
        seen.add(i); el.disabled = true; el.classList.add('found'); found++; inClue++;
        ctx.feedback(`¡Detalle encontrado! ${inClue} de ${perClue} en esta pista.`);
        if (found === total) { life.finish({ won: true, score: Math.max(50, total * 100 - errors * 20), maxScore: total * 100, detail: 'Resolviste las tres pistas y encontraste todos los elementos de la escena.', stats: [{ label: 'Detalles', value: `${total} / ${total}` }, { label: 'Tiempo restante', value: `${remaining} s` }] }); return; }
        if (inClue === perClue) { clue++; inClue = 0; updateClue(); ctx.feedback('¡Pista completada! Lee la nueva figura que debes buscar.'); }
        else root.querySelector('[data-count]').textContent = `${inClue} / ${perClue}`;
      } else {
        errors++; el.classList.add('is-wrong'); ctx.later(() => el.classList.remove('is-wrong'), 400);
        ctx.feedback('Ese objeto no corresponde a la pista actual. Revisa la figura solicitada.');
        if (errors >= limit) life.finish({ won: false, score: found * 100, maxScore: total * 100, detail: `Encontraste ${found} de ${total} detalles. Puedes explorar la escena de nuevo.` });
      }
      if (life.alive) hud();
    });
    ctx.every(() => { if (!life.alive) return; remaining--; hud(); if (remaining <= 0) life.finish({ won: false, score: found * 100, maxScore: total * 100, detail: `Terminó el tiempo. Encontraste ${found} de ${total} detalles.` }); }, 1000);
  }

  const rotateMask = mask => ((mask << 1) & 15) | ((mask >> 3) & 1);
  const directions = [{ bit: 1, opposite: 4, dx: 0, dy: -1, x: 50, y: 0, name: 'arriba' }, { bit: 2, opposite: 8, dx: 1, dy: 0, x: 100, y: 50, name: 'derecha' }, { bit: 4, opposite: 1, dx: 0, dy: 1, x: 50, y: 100, name: 'abajo' }, { bit: 8, opposite: 2, dx: -1, dy: 0, x: 0, y: 50, name: 'izquierda' }];
  function makePipeTree(size) {
    const masks = Array(size * size).fill(0), visited = new Set();
    function walk(i) {
      visited.add(i);
      shuffle(directions).forEach(d => {
        const x = i % size + d.dx, y = Math.floor(i / size) + d.dy, j = y * size + x;
        if (x < 0 || x >= size || y < 0 || y >= size || visited.has(j)) return;
        masks[i] |= d.bit; masks[j] |= d.opposite; walk(j);
      });
    }
    walk(0); masks[0] |= 8; return masks;
  }
  function pipeReach(masks, size) {
    if (!(masks[0] & 8)) return new Set();
    const seen = new Set([0]), queue = [0];
    while (queue.length) {
      const i = queue.shift();
      directions.forEach(d => {
        const x = i % size + d.dx, y = Math.floor(i / size) + d.dy, j = y * size + x;
        if (!(masks[i] & d.bit) || x < 0 || x >= size || y < 0 || y >= size || !(masks[j] & d.opposite) || seen.has(j)) return;
        seen.add(j); queue.push(j);
      });
    }
    return seen;
  }
  function route(ctx) {
    const root = surface(ctx), life = guard(ctx), level = levelOf(ctx), size = 3;
    let round = 0, moves = 0, checks = 0, masks, targets;
    function generate() {
      masks = makePipeTree(size);
      masks = masks.map(m => { for (let j = 0, count = Math.floor(Math.random() * 4); j < count; j++) m = rotateMask(m); return m; });
      targets = [2, 8, 6].slice(0, Math.min(3, round + (level === 3 ? 2 : 1)));
      if (targets.every(t => pipeReach(masks, size).has(t))) {
        for (let i = 0; i < 4 && (masks[0] & 8); i++) masks[0] = rotateMask(masks[0]);
      }
      draw();
    }
    function draw() {
      const reached = pipeReach(masks, size), count = targets.filter(t => reached.has(t)).length;
      root.innerHTML = `<h3 class="c-title">Conecta el origen con ${targets.length} destino${targets.length > 1 ? 's' : ''}</h3><p class="c-note">Toca las piezas para girarlas. La entrada está en el lado izquierdo del origen. Las rutas conectadas se iluminan.</p><div class="c-pipes">${masks.map((m, i) => `<button class="c-pipe ${reached.has(i) ? 'connected' : ''}" data-pipe="${i}" aria-label="Pieza ${i + 1}${i === 0 ? ', origen' : targets.includes(i) ? ', destino' : ''}. Conexiones: ${directions.filter(d => m & d.bit).map(d => d.name).join(', ')}"><svg viewBox="0 0 100 100" aria-hidden="true">${directions.filter(d => m & d.bit).map(d => `<path d="M50 50 L${d.x} ${d.y}" stroke="${reached.has(i) ? '#8a54b0' : '#c7b3d7'}" stroke-width="12" stroke-linecap="round" fill="none"/>`).join('')}<circle cx="50" cy="50" r="9" fill="${i === 0 ? '#ff713d' : targets.includes(i) ? '#bd1768' : reached.has(i) ? '#8a54b0' : '#c7b3d7'}"/></svg>${i === 0 || targets.includes(i) ? `<span class="c-end">${i === 0 ? 'IN' : '✦'}</span>` : ''}${brand(ctx)}</button>`).join('')}</div><button class="c-btn" data-route-check>Enviar por la ruta →</button>`;
      stat(ctx, 'Red', `${round + 1} / 3`, [{ label: 'Destinos', value: `${count} / ${targets.length}` }, { label: 'Giros', value: moves }]);
      root.querySelectorAll('[data-pipe]').forEach(el => el.onclick = () => { if (!life.alive) return; const i = Number(el.dataset.pipe); masks[i] = rotateMask(masks[i]); moves++; draw(); });
      root.querySelector('[data-route-check]').onclick = () => {
        checks++;
        const all = pipeReach(masks, size);
        if (targets.every(t => all.has(t))) {
          root.querySelectorAll('button').forEach(b => { b.disabled = true; });
          ctx.feedback('¡La ruta funciona! Todos los destinos reciben la conexión.');
          if (round === 2) nextButton(root, 'Completar mi recorrido →', () => life.finish({ won: true, score: Math.max(100, 900 - moves * 3 - (checks - 3) * 10), maxScore: 900, detail: 'Conectaste tres redes con dificultad progresiva.', stats: [{ label: 'Redes', value: '3 / 3' }, { label: 'Giros', value: moves }] }));
          else nextButton(root, 'Construir siguiente red →', () => { round++; generate(); });
        } else ctx.feedback('Aún falta conexión. Comprueba la entrada del origen y las uniones que deben tocarse.');
      };
    }
    ctx.feedback('Construye una ruta continua: las piezas deben unirse por sus extremos.'); generate();
  }

  function motion(ctx) {
    const root = surface(ctx), life = guard(ctx), level = levelOf(ctx), rounds = level + 2;
    let round = 0, score = 0, errors = 0;
    const symbols = ['☾', '✦', '◆', '⬡', '✚', '●'];
    function drawRound() {
      const contents = shuffle(symbols), target = contents[Math.floor(Math.random() * contents.length)], swaps = level + 1 + round;
      let observing = true, hidden = false, moving = false;
      root.innerHTML = `<div class="c-target-banner">Sigue la tarjeta <strong>${target}</strong></div><div class="c-motion-grid">${contents.map((s, i) => `<button class="c-motion-card" data-motion="${i}" aria-label="Tarjeta ${i + 1}: ${s}" disabled><span class="c-symbol">${s}</span>${brand(ctx)}</button>`).join('')}</div><p class="c-note" data-phase>Memoriza dónde está el símbolo. Después sigue sus movimientos.</p>`;
      stat(ctx, 'Ronda', `${round + 1} / ${rounds}`, [{ label: 'Aciertos', value: score }, { label: 'Intentos', value: 3 - errors }]);
      const cells = [...root.querySelectorAll('[data-motion]')];
      function refresh() {
        cells.forEach((cell, i) => {
          cell.querySelector('.c-symbol').textContent = hidden ? '?' : contents[i];
          cell.setAttribute('aria-label', hidden ? `Posición ${i + 1}` : `Tarjeta ${i + 1}: ${contents[i]}`);
        });
      }
      function runSwap(left) {
        if (!life.alive) return;
        if (!left) {
          moving = false; observing = false;
          cells.forEach(c => { c.disabled = false; });
          root.querySelector('[data-phase]').textContent = 'Toca la posición final del símbolo que seguiste.';
          ctx.feedback('Tu turno. ¿Dónde terminó la tarjeta?'); return;
        }
        moving = true;
        const a = Math.floor(Math.random() * 6); let b = Math.floor(Math.random() * 5); if (b >= a) b++;
        const ar = cells[a].getBoundingClientRect(), br = cells[b].getBoundingClientRect();
        cells[a].classList.add('shuffling'); cells[b].classList.add('shuffling');
        const duration = Math.max(460, 850 - level * 70 - round * 45);
        cells[a].style.transition = `transform ${duration}ms ease-in-out`; cells[b].style.transition = `transform ${duration}ms ease-in-out`;
        cells[a].style.transform = `translate(${br.left - ar.left}px,${br.top - ar.top}px)`;
        cells[b].style.transform = `translate(${ar.left - br.left}px,${ar.top - br.top}px)`;
        ctx.later(() => {
          if (!life.alive) return;
          [contents[a], contents[b]] = [contents[b], contents[a]];
          [cells[a], cells[b]].forEach(c => { c.style.transition = 'none'; c.style.transform = ''; c.classList.remove('shuffling'); });
          refresh(); ctx.later(() => runSwap(left - 1), 240);
        }, duration + 30);
      }
      ctx.feedback('Observa las tarjetas y localiza el símbolo solicitado.');
      ctx.later(() => { if (!life.alive) return; hidden = true; refresh(); root.querySelector('[data-phase]').textContent = 'Sigue los intercambios de posición…'; ctx.later(() => runSwap(swaps), 550); }, 3500 - level * 350);
      cells.forEach((cell, i) => cell.onclick = () => {
        if (!life.alive || observing || moving || cell.disabled) return;
        cells.forEach(c => { c.disabled = true; }); hidden = false; refresh();
        const good = contents[i] === target;
        if (good) { score++; cell.style.borderColor = '#4b9860'; ctx.feedback('¡Seguiste bien la tarjeta!'); }
        else { errors++; cell.style.borderColor = '#be6d60'; ctx.feedback(`El símbolo estaba en la posición ${contents.indexOf(target) + 1}. Observa el resultado.`); }
        const complete = () => life.finish({ won: errors < 3 && score >= Math.ceil(rounds * .6), score: score * 100, maxScore: rounds * 100, detail: `Localizaste el símbolo en ${score} de ${rounds} rondas.`, stats: [{ label: 'Aciertos', value: `${score} / ${rounds}` }, { label: 'Errores', value: errors }] });
        if (errors >= 3 || round === rounds - 1) nextButton(root, 'Ver resultado →', complete);
        else nextButton(root, 'Siguiente movimiento →', () => { round++; drawRound(); });
      });
    }
    drawRound();
  }

  function code(ctx) {
    const root = surface(ctx), life = guard(ctx), level = levelOf(ctx);
    const starCount = 3 + level;
    const sequence = [[1, 2, 3], [2, 4, 6], [9, 7, 5]][level - 1];
    const digits = [starCount, [4, 8, 3][level - 1], 3];
    let stage = 0, errors = 0, collected = [];
    const stamps = () => `<div class="c-clue-cards">${digits.map((n, i) => `<div class="c-digit">${i < collected.length ? n : '?'}<small>CLAVE ${i + 1}</small></div>`).join('')}</div>`;
    function draw() {
      root.innerHTML = stamps();
      stat(ctx, 'Claves', `${collected.length} / 3`, [{ label: 'Intentos', value: 4 - errors }]);
      if (stage === 3) { unlock(); return; }
      let answer, options;
      if (stage === 0) {
        const shapes = shuffle([...Array(starCount).fill('✦'), ...Array(level + 1).fill('☾'), '◆']);
        root.insertAdjacentHTML('beforeend', `<h3 class="c-title">Primera clave: cuenta las estrellas</h3><div class="c-visual-clue">${shapes.join(' ')}</div>${brand(ctx)}`);
        answer = digits[0]; options = shuffle([answer, answer - 1, answer + 1]);
      } else if (stage === 1) {
        root.insertAdjacentHTML('beforeend', `<h3 class="c-title">Segunda clave: completa el patrón</h3><div class="c-visual-clue">${sequence.join(' · ')} · ?</div><p class="c-note">La secuencia ${level === 3 ? 'resta' : 'suma'} siempre la misma cantidad.</p>${brand(ctx)}`);
        answer = digits[1]; options = shuffle([answer, answer - 1, answer + 1]);
      } else {
        root.insertAdjacentHTML('beforeend', `<h3 class="c-title">Tercera clave: encuentra las etapas</h3><div class="c-card"><p>Preparar → Participar → Compartir</p>${brand(ctx)}</div><p class="c-note">¿Cuántas etapas tiene este recorrido?</p>`);
        answer = 3; options = shuffle([2, 3, 4]);
      }
      root.insertAdjacentHTML('beforeend', `<div class="c-grid" style="grid-template-columns:repeat(3,1fr);margin-top:16px">${options.map(n => `<button class="c-option" data-code-answer="${n}"><span class="c-symbol">${n}</span></button>`).join('')}</div>`);
      root.querySelectorAll('[data-code-answer]').forEach(el => el.onclick = () => {
        if (!life.alive || el.disabled) return;
        if (Number(el.dataset.codeAnswer) === answer) {
          collected.push(answer); stage++; root.querySelectorAll('button').forEach(b => { b.disabled = true; }); el.classList.add('is-correct');
          ctx.feedback(`¡Clave conseguida! El número es ${answer}.`);
          nextButton(root, stage === 3 ? 'Abrir la caja →' : 'Buscar siguiente clave →', draw);
        } else {
          errors++; el.disabled = true; el.classList.add('is-wrong');
          ctx.feedback('Revisa la pista y prueba otra respuesta.');
          stat(ctx, 'Claves', `${collected.length} / 3`, [{ label: 'Intentos', value: 4 - errors }]);
          if (errors >= 4) life.finish({ won: false, score: collected.length * 100, maxScore: 400, detail: `Reuniste ${collected.length} de tres claves. Puedes volver a explorar las pistas.` });
        }
      });
    }
    function unlock() {
      let input = '', attempts = 0;
      root.insertAdjacentHTML('beforeend', `<h3 class="c-title">Introduce las claves en el orden obtenido</h3><div class="c-code-input" data-input aria-live="polite">_ _ _</div><div class="c-keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map(k => `<button data-number="${k}" aria-label="${k === '⌫' ? 'Borrar' : k === '✓' ? 'Confirmar código' : k}">${k}</button>`).join('')}</div>${brand(ctx)}`);
      ctx.feedback('Tus tres claves siguen visibles arriba. Confirma con ✓.');
      root.querySelectorAll('[data-number]').forEach(el => el.onclick = () => {
        if (!life.alive) return;
        const k = el.dataset.number;
        if (k === '⌫') input = input.slice(0, -1);
        else if (k === '✓') {
          if (input.length !== 3) { ctx.feedback('Completa los tres números antes de confirmar.'); return; }
          if (input === digits.join('')) { life.finish({ won: true, score: Math.max(200, 400 - errors * 30 - attempts * 20), maxScore: 400, detail: 'Resolviste las tres pistas y desbloqueaste la caja de marca.', stats: [{ label: 'Claves', value: '3 / 3' }, { label: 'Código', value: digits.join('') }] }); return; }
          attempts++; input = ''; ctx.feedback('El orden no coincide. Introduce clave 1, clave 2 y clave 3.');
          if (attempts >= 3) { life.finish({ won: false, score: 300, maxScore: 400, detail: 'Encontraste las tres claves. El código debe seguir el orden de las tarjetas.' }); return; }
        } else if (input.length < 3) input += k;
        root.querySelector('[data-input]').textContent = (input + '_'.repeat(3 - input.length)).split('').join(' ');
      });
    }
    draw();
  }

  function pulse(ctx) {
    const root = surface(ctx), life = guard(ctx), level = levelOf(ctx), duration = 20 + level * 5, travel = 3200 - level * 300, interval = 1200 - level * 140;
    const symbols = ['☾', '✦', '◆'];
    let hits = 0, misses = 0, streak = 0, best = 0, started = false, startTime = 0, lastSpawn = 0, nextId = 0, items = [];
    root.innerHTML = `<h3 class="c-title">Toca cuando el símbolo cruce la franja</h3><p class="c-note">Cada botón corresponde a un carril. La zona de acierto está entre las líneas punteadas.</p><div class="c-pulse-stage"><div class="c-pulse-zone"><span>ZONA DE ACIERTO</span></div></div><div class="c-pulse-buttons">${symbols.map((s, i) => `<button data-lane="${i}" aria-label="Carril ${i + 1}, ${s}" disabled>${s}</button>`).join('')}</div><button class="c-btn" data-start>Comenzar ${duration} segundos →</button>`;
    const stage = root.querySelector('.c-pulse-stage');
    stat(ctx, 'Tiempo', `${duration} s`, [{ label: 'Aciertos', value: 0 }, { label: 'Racha', value: 0 }]);
    ctx.feedback('Practica la idea: espera a que un símbolo entre en la franja y toca su botón.');
    function hud(left) { const precision = hits + misses ? Math.round(hits / (hits + misses) * 100) : 0; stat(ctx, 'Tiempo', `${left} s`, [{ label: 'Aciertos', value: hits }, { label: 'Precisión', value: `${precision}%` }]); }
    function end() {
      const precision = hits + misses ? Math.round(hits / (hits + misses) * 100) : 0;
      life.finish({ won: hits >= 6 && precision >= 60, score: hits * 100 + best * 10, maxScore: Math.ceil(duration * 1000 / interval) * 110, detail: `Lograste ${hits} aciertos con ${precision}% de precisión. El objetivo es al menos 6 aciertos y 60% de precisión.`, stats: [{ label: 'Aciertos', value: hits }, { label: 'Mejor racha', value: best }, { label: 'Precisión', value: `${precision}%` }] });
    }
    root.querySelectorAll('[data-lane]').forEach(el => el.onclick = () => {
      if (!life.alive || !started) return;
      const lane = Number(el.dataset.lane), now = Date.now();
      const candidates = items.filter(item => !item.done && item.lane === lane && (now - item.born) / travel >= .66 && (now - item.born) / travel <= .87).sort((a, b) => a.born - b.born);
      if (candidates.length) {
        const item = candidates[0]; item.done = true; item.el.remove(); hits++; streak++; best = Math.max(best, streak);
        ctx.feedback(streak >= 3 ? `¡Racha de ${streak}! Mantén el pulso.` : '¡A tiempo!');
      } else { misses++; streak = 0; ctx.feedback('Fuera de la franja. Espera a que el símbolo cruce las líneas.'); }
      hud(Math.max(0, duration - Math.floor((now - startTime) / 1000)));
    });
    root.querySelector('[data-start]').onclick = () => {
      if (started || !life.alive) return; started = true; startTime = Date.now();
      root.querySelector('[data-start]').remove(); root.querySelectorAll('[data-lane]').forEach(el => { el.disabled = false; });
      ctx.feedback('Objetivo: 6 aciertos o más y al menos 60% de precisión.');
      ctx.every(() => {
        if (!life.alive || !started) return;
        const now = Date.now(), elapsed = now - startTime, left = Math.max(0, duration - Math.floor(elapsed / 1000));
        if (elapsed >= duration * 1000) { started = false; end(); return; }
        if (elapsed - lastSpawn >= interval && elapsed < duration * 1000 - travel) {
          lastSpawn = elapsed;
          const lane = Math.floor(Math.random() * 3), el = document.createElement('div');
          el.className = 'c-pulse-item'; el.style.left = `${4 + lane * 33.333}%`; el.innerHTML = `${symbols[lane]}${brand(ctx)}`; stage.append(el);
          items.push({ id: nextId++, lane, born: now, el, done: false });
        }
        items.forEach(item => {
          if (item.done) return;
          const p = (now - item.born) / travel;
          if (p >= 1) { item.done = true; item.el.remove(); misses++; streak = 0; }
          else item.el.style.top = `${p * 100}%`;
        });
        items = items.filter(item => !item.done); hud(left);
      }, 40);
    };
  }

  function mural(ctx) {
    const root = surface(ctx), life = guard(ctx), level = levelOf(ctx), key = 'alunova-mural-v2';
    let completed = [];
    try { const read = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(read)) completed = [...new Set(read.filter(n => Number.isInteger(n) && n >= 0 && n < 9))]; } catch (_) { /* Storage is optional. */ }
    let stage = 0, errors = 0;
    const viewMural = newIndex => `<div class="c-mural">${Array.from({ length: 9 }, (_, i) => `<div class="c-mural-piece ${completed.includes(i) ? 'open' : ''} ${newIndex === i ? 'new' : ''}" style="background-position:${i % 3 * 50}% ${Math.floor(i / 3) * 50}%">${completed.includes(i) ? brand(ctx) : '◇'}</div>`).join('')}</div>`;
    function save() { try { localStorage.setItem(key, JSON.stringify(completed)); } catch (_) { /* Continue in memory. */ } }
    function wrong() { errors++; ctx.feedback('Mira de nuevo la pista antes de elegir.'); if (errors >= 4) life.finish({ won: false, score: stage * 100, maxScore: 300, detail: 'El mural conserva las piezas anteriores. Vuelve a intentarlo para aportar una nueva pieza.' }); }
    function pass() {
      stage++; ctx.feedback('¡Reto completado! Estás construyendo tu aporte al mural.');
      if (stage === 3) {
        const available = Array.from({ length: 9 }, (_, i) => i).filter(i => !completed.includes(i)), index = available[0];
        if (index !== undefined) completed.push(index); save();
        root.innerHTML = `<h3 class="c-title">Tu pieza se une al mural</h3>${viewMural(index)}<p class="c-note">${completed.length} de 9 piezas reveladas en este equipo. Cada partida completada suma una pieza.</p>`;
        nextButton(root, 'Ver mi aporte →', () => life.finish({ won: true, score: Math.max(150, 300 - errors * 25), maxScore: 300, detail: completed.length === 9 ? '¡El mural colectivo está completo! Nueve participaciones construyeron la imagen de marca.' : `Superaste los tres retos y aportaste una pieza. El mural reúne ${completed.length} de nueve participaciones en este equipo.`, stats: [{ label: 'Retos', value: '3 / 3' }, { label: 'Mural local', value: `${completed.length} / 9` }] }));
      } else nextButton(root, 'Siguiente reto →', draw);
    }
    function draw() {
      if (!life.alive) return;
      stat(ctx, 'Reto', `${stage + 1} / 3`, [{ label: 'Mural', value: `${completed.length} / 9` }, { label: 'Intentos', value: 4 - errors }]);
      if (stage === 0) {
        const targets = [{ s: '☾', name: 'Luna' }, { s: '✦', name: 'Estrella' }, { s: '◆', name: 'Diamante' }], target = shuffle(targets)[0], options = shuffle(targets);
        root.innerHTML = `<h3 class="c-title">Reconoce la figura</h3><div class="c-card"><span class="c-symbol" style="font-size:75px;color:#21103f">${target.s}</span>${brand(ctx)}</div><div class="c-grid" style="margin-top:15px">${options.map((o, i) => `<button class="c-option" data-shape="${i}">${o.name}</button>`).join('')}</div>`;
        root.querySelectorAll('[data-shape]').forEach(el => el.onclick = () => { if (!life.alive || el.disabled) return; if (options[Number(el.dataset.shape)].s === target.s) { root.querySelectorAll('button').forEach(b => { b.disabled = true; }); el.classList.add('is-correct'); pass(); } else { el.disabled = true; el.classList.add('is-wrong'); wrong(); } });
      } else if (stage === 1) {
        const symbols = shuffle(['☾', '✦', '◆']), pattern = level === 3 ? [symbols[0], symbols[1], symbols[1], symbols[0], symbols[1], '?'] : [symbols[0], symbols[1], symbols[0], symbols[1], symbols[0], '?'];
        const answer = symbols[1], options = shuffle(symbols);
        root.innerHTML = `<h3 class="c-title">Completa el patrón</h3><div class="c-visual-clue">${pattern.join(' ')}</div><p class="c-note">${level === 3 ? 'El bloque de tres figuras se repite.' : 'Las dos figuras se alternan.'}</p><div class="c-grid">${options.map((s, i) => `<button class="c-option" data-pattern="${i}"><span class="c-symbol">${s}</span>${brand(ctx)}</button>`).join('')}</div>`;
        root.querySelectorAll('[data-pattern]').forEach(el => el.onclick = () => { if (!life.alive || el.disabled) return; if (options[Number(el.dataset.pattern)] === answer) { root.querySelectorAll('button').forEach(b => { b.disabled = true; }); el.classList.add('is-correct'); pass(); } else { el.disabled = true; el.classList.add('is-wrong'); wrong(); } });
      } else {
        let parts = shuffle([0, 1, 2, 3]), selected = null;
        if (parts.every((n, i) => n === i)) [parts[0], parts[1]] = [parts[1], parts[0]];
        function drawPieces() {
          root.innerHTML = `<h3 class="c-title">Une la composición</h3><p class="c-note">Toca dos piezas para intercambiarlas. Ordena los números del 1 al 4.</p><div class="c-mural-puzzle">${parts.map((n, i) => `<button data-part="${i}" aria-label="Pieza ${n + 1}, posición ${i + 1}" style="background-position:${n % 2 * 100}% ${Math.floor(n / 2) * 100}%"><span>${n + 1}</span>${brand(ctx)}</button>`).join('')}</div>`;
          root.querySelectorAll('[data-part]').forEach(el => el.onclick = () => {
            if (!life.alive) return; const i = Number(el.dataset.part);
            if (selected === null) { selected = i; el.classList.add('is-active'); return; }
            if (selected === i) { selected = null; el.classList.remove('is-active'); return; }
            [parts[selected], parts[i]] = [parts[i], parts[selected]]; selected = null; drawPieces();
            if (parts.every((n, j) => n === j)) { root.querySelectorAll('button').forEach(b => { b.disabled = true; }); pass(); }
          });
        }
        drawPieces();
      }
    }
    if (completed.length === 9) {
      root.innerHTML = `<h3 class="c-title">El mural de este equipo está completo</h3>${viewMural()}<p class="c-note">Puedes iniciar un nuevo mural para las siguientes participaciones. Solo se reinicia el progreso local de este juego.</p>`;
      nextButton(root, 'Comenzar un nuevo mural →', () => { completed = []; save(); draw(); });
      nextButton(root, 'Celebrar el mural completo →', () => life.finish({ won: true, score: 900, maxScore: 900, detail: 'Este equipo ha completado las nueve piezas del mural colectivo.', stats: [{ label: 'Mural local', value: '9 / 9' }] }));
    } else {
      ctx.feedback('Tres retos visuales te permiten aportar una pieza al mural colectivo del equipo.'); draw();
    }
  }

  window.ALUNOVA_GAMES = Object.assign(window.ALUNOVA_GAMES || {}, { passport, builder, radar, route, motion, code, pulse, mural });
}());
