/* Art-directed outcomes: the host owns score, rewards, replay and lifecycle. */
(function () {
  'use strict';
  const logo = '<span class="outcome-brand"><img src="assets/alunova-symbol.png" alt=""><b>Your Logo</b></span>';
  const boardImage = 'assets/puzzle-world.png';
  const titles = {
    pairs: ['¡Todas las parejas conectadas!', 'La próxima pareja te espera.'],
    quiz: ['¡Conocimiento que conecta!', 'Cada respuesta deja una idea.'],
    puzzle: ['¡Tu imagen está completa!', 'La imagen se construye paso a paso.'],
    classify: ['¡Cada idea en su lugar!', 'Sigue encontrando las conexiones.'],
    reaction: ['¡Un reflejo extraordinario!', 'Encuentra tu mejor ritmo.'],
    sequence: ['¡Una secuencia memorable!', 'Observa de nuevo y supérate.'],
    wheel: ['¡Desafíos superados!', 'Una nueva vuelta, otro desafío.'],
    words: ['¡Encontraste las palabras clave!', 'Todavía hay palabras por descubrir.'],
    guess: ['¡Descubriste el mensaje!', 'Una pista puede cambiarlo todo.'],
    tic: ['¡Una buena jugada!', 'Cada partida abre otra estrategia.'],
    maze: ['¡Llegaste a tu destino!', 'Hay otro camino por descubrir.'],
    order: ['¡El proceso tiene sentido!', 'Revisa los pasos y vuelve a intentar.'],
    passport: ['¡Tu pasaporte está completo!', 'Tu recorrido todavía tiene historias.'],
    builder: ['¡Construiste una solución!', 'Las mejores ideas se ajustan.'],
    radar: ['¡Nada escapó a tu radar!', 'Una nueva mirada descubre más.'],
    route: ['¡La red está viva!', 'Cada giro abre una conexión.'],
    motion: ['¡No perdiste de vista el objetivo!', 'Observa, sigue y vuelve a encontrar.'],
    code: ['¡El código abrió la experiencia!', 'La próxima pista está por descubrir.'],
    pulse: ['¡Conectaste con el pulso!', 'Encuentra el momento exacto.'],
    mural: ['¡Tu pieza ya es parte del mural!', 'Tu próxima pieza está por crear.']
  };
  const eyebrows = {
    pairs:'MEMORIA ENCONTRADA',quiz:'IDEAS QUE SE QUEDAN',puzzle:'PIEZA A PIEZA',classify:'CONEXIONES CON SENTIDO',reaction:'ATENCIÓN EN ACCIÓN',sequence:'UN ORDEN PARA RECORDAR',wheel:'UNA VUELTA AL CONOCIMIENTO',words:'PALABRAS QUE CONECTAN',guess:'EL MENSAJE DESCUBIERTO',tic:'ESTRATEGIA COMPARTIDA',maze:'EL DESTINO ESTÁ AQUÍ',order:'CADA ETAPA CUENTA',passport:'TRES ESTACIONES / UNA MISIÓN',builder:'DE LA IDEA A LA SOLUCIÓN',radar:'LOS DETALLES CUENTAN',route:'LAS POSIBILIDADES SE CONECTAN',motion:'LA MIRADA EN MOVIMIENTO',code:'TU SIGUIENTE DESCUBRIMIENTO',pulse:'PRECISIÓN EN CADA MOMENTO',mural:'UNA PIEZA / MUCHAS PERSONAS'
  };
  const check = won => won ? '✓' : '↻';
  function imageTiles(won, type='puzzle') {
    return '<div class="outcome-image '+type+'">'+Array.from({length:9},(_,i)=>`<span class="${won||i<4?'revealed':''}" style="--piece:${i};background-position:${i%3*50}% ${Math.floor(i/3)*50}%;--tile-image:url('${boardImage}')"></span>`).join('')+'</div>';
  }
  function scene(id, won, ratio) {
    const mark=check(won);
    switch(id) {
      case 'pairs': return `<div class="outcome-match"><span>☾${logo}</span><b>${mark}</b><span>☾${logo}</span></div>`;
      case 'quiz': return `<div class="outcome-quiz"><span class="outcome-ring" style="--ratio:${ratio}"><b>${Math.round(ratio)}<small>%</small></b></span><div><span>Pregunta</span><b>${won?'Ideas conectadas':'Sigue descubriendo'}</b><i>${mark}</i></div></div>`;
      case 'puzzle': return imageTiles(won);
      case 'classify': return `<div class="outcome-sort">${['Agua','Energía','Reciclaje'].map((v,i)=>`<span><b>${['◉','✦','⬡'][i]}</b><small>${v}</small><i>${mark}</i></span>`).join('')}</div>`;
      case 'reaction': return `<div class="outcome-targets">${Array.from({length:9},(_,i)=>`<span class="${i===4?'lit':''}">${i===4?mark:'·'}</span>`).join('')}</div>`;
      case 'sequence': return `<div class="outcome-sequence">${['☾','✦','◆','◉'].map((v,i)=>`<span style="--step:${i}"><b>${v}</b><small>${i+1}</small></span>`).join('')}<i>${mark}</i></div>`;
      case 'wheel': return `<div class="outcome-wheel"><span></span><div><small>TU DESAFÍO</small><b>${won?'Completado':'Nueva oportunidad'}</b><i>${mark}</i></div></div>`;
      case 'words': return `<div class="outcome-words">${['MARCA','IDEAS','EQUIPO'].map((v,i)=>`<span style="--step:${i}">${[...v].map(c=>`<b>${c}</b>`).join('')}<i>${won?'✓':'·'}</i></span>`).join('')}</div>`;
      case 'guess': return `<div class="outcome-word">${[...'ALUNOVA'].map((c,i)=>`<b style="--step:${i}">${won||i%2===0?c:'_'}</b>`).join('')}</div>`;
      case 'tic': return `<div class="outcome-tic">${['✦','✦',won?'✦':'','☾','','☾','','',''].map((v,i)=>`<span class="${won&&i<3?'line':''}">${v}</span>`).join('')}</div>`;
      case 'maze': return `<div class="outcome-route maze"><svg viewBox="0 0 240 100" aria-hidden="true"><path class="map-line" d="M10 20H70V70H125V30H175V75H225"/><path class="moving-line" d="M10 20H70V70H125V30H175V75H225"/><circle cx="10" cy="20" r="8"/><circle cx="225" cy="75" r="10"/></svg><b>${mark}</b></div>`;
      case 'order': return `<div class="outcome-order">${['Preparar','Participar','Compartir'].map((v,i)=>`<span style="--step:${i}"><b>${i+1}</b><strong>${v}</strong><i>${mark}</i></span>`).join('')}</div>`;
      case 'passport': return `<div class="outcome-passport"><span class="passport-line"></span>${['OBSERVA','CONECTA','DESCUBRE'].map((v,i)=>`<span class="passport-stamp" style="--step:${i}"><b>${won?'✓':['◉','↗','✦'][i]}</b><small>${v}</small></span>`).join('')}</div>`;
      case 'builder': return `<div class="outcome-builder"><span class="solution-target">${won?'✓':'?'}</span><div>${['☾','✚','⬡'].map((v,i)=>`<span style="--step:${i}">${v}${logo}</span>`).join('')}</div><small>LA COMBINACIÓN HACE LA DIFERENCIA</small></div>`;
      case 'radar': return `<div class="outcome-radar"><span class="radar-scan"></span>${[0,1,2].map(i=>`<b style="--step:${i}">${won?'✓':'⌕'}</b>`).join('')}</div>`;
      case 'route': return `<div class="outcome-route"><svg viewBox="0 0 240 100" aria-hidden="true"><path class="map-line" d="M15 50H75V20H155V50H225M75 50V80H155V50"/><path class="moving-line" d="M15 50H75V20H155V50H225M75 50V80H155V50"/><circle cx="15" cy="50" r="8"/><circle cx="225" cy="50" r="8"/><circle cx="155" cy="80" r="8"/></svg><b>${mark}</b></div>`;
      case 'motion': return `<div class="outcome-motion"><span>☾${logo}</span><i>⇄</i><span>◆${logo}</span><b>${mark}</b></div>`;
      case 'code': return `<div class="outcome-code"><div class="code-digits"><span>•</span><span>•</span><span>•</span></div><div class="code-box ${won?'is-open':''}"><span class="box-top"></span><span class="box-body">${logo}</span><b>${mark}</b></div></div>`;
      case 'pulse': return `<div class="outcome-pulse"><span class="arrival-line"></span>${['☾','✦','◆'].map((v,i)=>`<span class="pulse-note" style="--step:${i}">${v}</span>`).join('')}<b>${mark}</b></div>`;
      case 'mural': return imageTiles(won,'mural');
      default: return `<div class="outcome-match"><span>✦${logo}</span><b>${mark}</b></div>`;
    }
  }
  window.ALUNOVA_RESULT=function(game,result){
    const id=game&&game.id||'',won=!!(result&&result.won),pair=titles[id]||['¡Reto superado!','Tu siguiente intento te espera.'];
    const score=Number(result&&result.score)||0,max=Number(result&&result.maxScore)||100,ratio=Math.round(Math.max(0,Math.min(100,score/max*100)));
    return {title:pair[won?0:1],eyebrow:won?(eyebrows[id]||'RETO SUPERADO'):'UN NUEVO INTENTO / UNA NUEVA POSIBILIDAD',visual:`<div class="win-art ${won?'is-win':'is-retry'} result-${id}" aria-hidden="true">${scene(id,won,ratio)}</div>`};
  };
})();
