(() => {
  const cards = Array.from(document.querySelectorAll('.service-card[data-service-id]'));
  const form = document.querySelector('#inquiry-form');
  const itemList = document.querySelector('#inquiry-items');
  const referenceList = document.querySelector('#inquiry-references');
  const serviceDialog = document.querySelector('#service-dialog');
  const inquiryDialog = document.querySelector('#inquiry-dialog');
  if (!cards.length || !form || !itemList || !referenceList ||
      !serviceDialog?.showModal || !inquiryDialog?.showModal) return;
  // Expand a hidden selection before reporting errors in its quantity inputs.
  form.noValidate = true;

  const services = new Map(cards.map((card) => [card.dataset.serviceId, {
    card,
    title: card.querySelector('h3')?.textContent.trim() || card.dataset.serviceId,
    category: card.dataset.category,
    hasQuantity: card.dataset.quantity === 'true',
  }]));
  const filters = ['todos', 'alquilar', 'crear', 'comprar'];
  const allowedReferences = new Set(Array.from(
    document.querySelectorAll('[data-project-request]'),
    (button) => button.dataset.projectRequest,
  ));
  const referenceServices = new Map(Array.from(document.querySelectorAll('[data-project-request]'), (button) => [
    button.dataset.projectRequest,
    (button.dataset.projectServices || 'interaccion').split(',').map((id) => id.trim()).filter((id) => services.has(id)),
  ]));
  const fieldLimits = {
    nombre: 120, email: 180, lugar: 200, notas: 2000, alquiler_uso: 400,
    crear_objetivo: 800, crear_publico: 200, crear_funcionamiento: 1000, crear_contenidos: 800,
    compra_equipos: 400, compra_caracteristicas: 1000, compra_entrega: 400,
  };
  const dateFields = ['fecha_inicio', 'fecha_fin', 'instalacion_fecha'];
  const fieldNames = [...Object.keys(fieldLimits), ...dateFields, 'montaje'];
  const fields = Object.fromEntries(fieldNames.map((name) => [name, form.elements.namedItem(name)]));
  const storageKey = 'alunova-consulta-v1';
  const dialogs = [serviceDialog, inquiryDialog];
  const dialogOpeners = new WeakMap();
  const status = document.querySelector('#inquiry-status');
  const selectionStatus = document.querySelector('#selection-status');
  const preview = document.querySelector('#inquiry-preview');
  const selectionBody = document.querySelector('#inquiry-selection-body');
  const selectionToggle = document.querySelector('#selection-toggle');
  const compactSelection = window.matchMedia('(max-width: 599px)');
  const bar = document.querySelector('#inquiry-bar');
  const hero = document.querySelector('#hero');
  const contact = document.querySelector('#contacto');
  const header = document.querySelector('.mega-header');
  const undoNotice = document.querySelector('#selection-undo');
  const undoMessage = document.querySelector('#selection-undo-message');
  const undoButton = document.querySelector('#selection-undo-button');
  let undoRecord = null;
  let undoTimer = null;
  let selectionExpanded = false;
  const state = {version: 1, items: [], references: [], fields: {}};
  let storageAvailable = true;
  let barUpdateScheduled = false;

  function updateBarVisibility() {
    if (!bar) return;
    const heroVisible = hero && hero.getBoundingClientRect().bottom > (header?.offsetHeight || 0);
    const contactReached = contact && contact.getBoundingClientRect().top < window.innerHeight;
    const visible = state.items.length > 0 && !heroVisible && !contactReached;
    bar.hidden = !visible;
    document.body.classList.toggle('has-inquiry-bar', visible);
    barUpdateScheduled = false;
  }

  function scheduleBarUpdate() {
    if (barUpdateScheduled) return;
    barUpdateScheduled = true;
    requestAnimationFrame(updateBarVisibility);
  }
  window.addEventListener('scroll', scheduleBarUpdate, {passive: true});
  window.addEventListener('resize', scheduleBarUpdate);

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function isDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function normalizeFields(values) {
    const result = {};
    for (const name of Object.keys(fieldLimits)) {
      result[name] = typeof values?.[name] === 'string' ? values[name].slice(0, fieldLimits[name]) : '';
    }
    for (const name of dateFields) {
      result[name] = typeof values?.[name] === 'string' && isDate(values[name]) ? values[name] : '';
    }
    result.montaje = ['por-definir', 'si', 'no'].includes(values?.montaje) ? values.montaje : 'por-definir';
    return result;
  }

  function restoreState() {
    let savedText;
    try {
      savedText = localStorage.getItem(storageKey);
    } catch {
      storageAvailable = false;
      return;
    }
    if (!savedText || savedText.length > 50000) return;
    try {
      const saved = JSON.parse(savedText);
      if (saved?.version !== 1 || !Array.isArray(saved.items)) return;
      for (const item of saved.items.slice(0, 30)) {
        const service = services.get(item?.id);
        if (!service || state.items.some((current) => current.id === item.id)) continue;
        const quantity = service.hasQuantity ? item.quantity : 1;
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) continue;
        state.items.push({id: item.id, quantity});
      }
      if (Array.isArray(saved.references)) {
        state.references = [...new Set(saved.references.filter((value) => (
          typeof value === 'string' && value.length <= 120 && allowedReferences.has(value)
        )))].slice(0, 12);
      }
      state.fields = normalizeFields(saved.fields);
    } catch {
      // Un registro incompleto se reemplaza al guardar la siguiente edición.
    }
  }

  function readFields() {
    state.fields = normalizeFields(Object.fromEntries(fieldNames.map((name) => [name, fields[name]?.value || ''])));
  }

  function persist() {
    if (!storageAvailable) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      storageAvailable = false;
      setStatus('Tu navegador no permitió guardar la consulta. Puedes continuar en esta ventana.');
    }
  }

  function formatDate(value) {
    return value ? value.split('-').reverse().join('/') : 'Por definir';
  }

  function selectedCategories() {
    return new Set(state.items.map((item) => services.get(item.id).category));
  }

  function needsInstallation() {
    return selectedCategories().has('alquilar') || state.items.some((item) => item.id === 'stands');
  }

  function updateAdaptiveFields() {
    const categories = selectedCategories();
    const installation = needsInstallation();
    for (const group of form.querySelectorAll('[data-inquiry-category]')) {
      const active = group.dataset.inquiryCategory === 'montaje' ? installation : categories.has(group.dataset.inquiryCategory);
      group.hidden = !active;
      group.disabled = !active;
    }
    const installationDetails = document.querySelector('#consulta-instalacion-detalles');
    const showInstallationDate = installation && fields.montaje?.value !== 'no';
    if (installationDetails) installationDetails.hidden = !showInstallationDate;
    if (fields.instalacion_fecha) fields.instalacion_fecha.disabled = !showInstallationDate;
    const names = [...categories].map((category) => ({alquilar: 'alquiler', crear: 'diseño y desarrollo', comprar: 'compra de equipos'}[category]));
    const context = document.querySelector('#inquiry-context');
    const message = names.length ? `Detalles para ${names.join(' + ')}. Puedes dejar lo que aún no esté definido.` : 'Añade servicios para ver las preguntas de tu proyecto, o cuéntanos tu idea en las notas.';
    if (context && context.textContent !== message) context.textContent = message;
    const only = categories.size === 1 ? [...categories][0] : null;
    const startLabel = document.querySelector('#consulta-inicio-etiqueta');
    const endLabel = document.querySelector('#consulta-fin-etiqueta');
    if (startLabel) startLabel.textContent = only === 'alquilar' ? 'Primer día de uso' : only === 'comprar' ? 'Entrega deseada' : only === 'crear' ? 'Fecha requerida' : 'Inicio o fecha requerida';
    if (endLabel) endLabel.textContent = only === 'alquilar' ? 'Último día de uso' : 'Fecha de fin (si corresponde)';
  }

  function buildMessage() {
    const values = state.fields;
    const categories = selectedCategories();
    const lines = ['Hola ALUNOVA, quisiera solicitar una cotización.', '', 'Servicios'];
    if (!state.items.length) lines.push('Por definir');
    for (const item of state.items) {
      const service = services.get(item.id);
      const quantity = service.hasQuantity ? ` · Cantidad: ${item.quantity}` : '';
      const category = {alquilar: 'Alquiler', crear: 'Diseño y desarrollo', comprar: 'Venta'}[service.category];
      lines.push(`- ${service.title} (${category})${quantity}`);
    }
    if (state.references.length) lines.push('', 'Proyectos de referencia', ...state.references.map((value) => `- ${value}`));
    lines.push('', `Nombre: ${values.nombre?.trim() || 'Por completar'}`);
    if (values.email?.trim()) lines.push(`Correo: ${values.email.trim()}`);
    const startTitle = categories.size === 1 && categories.has('comprar') ? 'Entrega deseada' : categories.size === 1 && categories.has('alquilar') ? 'Primer día de uso' : 'Inicio o fecha requerida';
    lines.push(`${startTitle}: ${formatDate(values.fecha_inicio)}`);
    lines.push(`Fecha de fin: ${formatDate(values.fecha_fin)}`);
    lines.push(`Lugar: ${values.lugar?.trim() || 'Por definir'}`);
    if (categories.has('alquilar')) {
      lines.push('', 'Alquiler de equipos');
      lines.push(`Uso o actividad: ${values.alquiler_uso?.trim() || 'Por definir'}`);
    }
    if (categories.has('crear')) {
      lines.push('', 'Diseño y desarrollo');
      for (const [name, label] of [['crear_objetivo', 'Objetivo'], ['crear_publico', 'Público'], ['crear_funcionamiento', 'Funcionamiento o espacio esperado'], ['crear_contenidos', 'Materiales disponibles']]) {
        lines.push(`${label}: ${values[name]?.trim() || 'Por definir'}`);
      }
    }
    if (categories.has('comprar')) {
      lines.push('', 'Compra de equipos');
      for (const [name, label] of [['compra_equipos', 'Equipos solicitados'], ['compra_caracteristicas', 'Características y uso'], ['compra_entrega', 'Condiciones de entrega']]) {
        lines.push(`${label}: ${values[name]?.trim() || 'Por definir'}`);
      }
    }
    if (needsInstallation()) {
      lines.push('', 'Instalación y montaje');
      lines.push(`Montaje: ${{'por-definir': 'Por definir', si: 'Sí, necesito montaje', no: 'Solo equipos o servicio'}[values.montaje]}`);
      if (values.montaje !== 'no') {
        lines.push(`Fecha tentativa de instalación: ${formatDate(values.instalacion_fecha)}`);
        lines.push('Instalación pendiente de coordinación y disponibilidad del equipo.');
      }
    }
    if (values.notas?.trim()) lines.push('', 'Notas', values.notas.trim());
    return lines.join('\n');
  }

  function updatePreview() {
    if (preview) preview.textContent = buildMessage();
  }

  function updateSelectionLayout() {
    if (!selectionBody || !selectionToggle) return;
    const canCollapse = compactSelection.matches && state.items.length > 0;
    const expanded = !canCollapse || selectionExpanded;
    selectionBody.hidden = !expanded;
    selectionToggle.hidden = !canCollapse;
    selectionToggle.setAttribute('aria-expanded', String(expanded));
    selectionToggle.textContent = expanded ? 'Ocultar' : 'Ver servicios';
  }

  selectionToggle?.addEventListener('click', () => {
    selectionExpanded = !selectionExpanded;
    updateSelectionLayout();
  });
  compactSelection.addEventListener('change', () => {
    selectionExpanded = false;
    updateSelectionLayout();
  });

  function updateButtons() {
    for (const service of services.values()) {
      service.card.classList.toggle('is-selected', state.items.some((item) => services.get(item.id) === service));
    }
    document.querySelectorAll('[data-add-service]').forEach((button) => {
      const selected = state.items.some((item) => item.id === button.dataset.addService);
      const service = services.get(button.dataset.addService);
      button.setAttribute('aria-pressed', String(selected));
      button.textContent = button.closest('.service-card')
        ? (selected ? 'En tu consulta' : 'Añadir a consulta')
        : (selected ? 'Añadido a mi consulta' : 'Añadir a mi consulta');
      if (service) button.setAttribute('aria-label', `${selected ? 'Quitar' : 'Añadir'} ${service.title} ${selected ? 'de' : 'a'} mi consulta`);
    });
    document.querySelectorAll('[data-inquiry-count]').forEach((counter) => {
      counter.textContent = String(state.items.length);
    });
    const summary = document.querySelector('#inquiry-bar-summary');
    if (summary) {
      const count = state.items.length;
      summary.textContent = count ? `${count} ${count === 1 ? 'servicio' : 'servicios'} en tu consulta` : 'Elige los servicios que necesitas';
    }
    updateBarVisibility();
  }

  function renderItems() {
    const items = state.items.map((item) => {
      const service = services.get(item.id);
      const row = document.createElement('li');
      row.className = 'inquiry-item';
      const source = service.card.querySelector('img.service-media');
      if (source) {
        const image = document.createElement('img');
        image.className = 'inquiry-item-image';
        image.src = source.src;
        image.alt = '';
        image.width = 48;
        image.height = 48;
        row.append(image);
      }
      const info = document.createElement('div');
      info.className = 'inquiry-item-info';
      const title = document.createElement('strong');
      title.className = 'inquiry-item-title';
      title.textContent = service.title;
      const category = document.createElement('span');
      category.className = 'inquiry-item-category';
      category.textContent = {alquilar: 'Alquiler', crear: 'Diseño y desarrollo', comprar: 'Venta'}[service.category];
      info.append(title, category);
      row.append(info);
      if (service.hasQuantity) {
        const quantity = document.createElement('div');
        quantity.className = 'inquiry-quantity';
        const text = document.createElement('span');
        text.textContent = 'Cantidad';
        const stepper = document.createElement('div');
        stepper.className = 'quantity-stepper';
        const decrease = document.createElement('button');
        decrease.type = 'button';
        decrease.dataset.quantityStep = '-1';
        decrease.dataset.quantityTarget = item.id;
        decrease.textContent = '−';
        decrease.setAttribute('aria-label', `Reducir cantidad de ${service.title}`);
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.max = '999';
        input.step = '1';
        input.required = true;
        input.inputMode = 'numeric';
        input.value = String(item.quantity);
        input.dataset.quantityService = item.id;
        input.setAttribute('aria-label', `Cantidad de ${service.title}`);
        const increase = document.createElement('button');
        increase.type = 'button';
        increase.dataset.quantityStep = '1';
        increase.dataset.quantityTarget = item.id;
        increase.textContent = '+';
        increase.setAttribute('aria-label', `Aumentar cantidad de ${service.title}`);
        stepper.append(decrease, input, increase);
        quantity.append(text, stepper);
        row.append(quantity);
        updateQuantityControls(input);
      }
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'inquiry-remove';
      remove.dataset.removeService = item.id;
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Quitar ${service.title} de la consulta`);
      row.append(remove);
      return row;
    });
    itemList.replaceChildren(...items);
    const empty = document.querySelector('#inquiry-empty');
    if (empty) empty.hidden = state.items.length > 0;
    const references = state.references.map((value) => {
      const row = document.createElement('li');
      row.className = 'inquiry-reference';
      const title = document.createElement('span');
      title.textContent = value;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'inquiry-remove';
      remove.dataset.removeReference = value;
      remove.textContent = 'Quitar';
      remove.setAttribute('aria-label', `Quitar referencia ${value}`);
      row.append(title, remove);
      return row;
    });
    referenceList.replaceChildren(...references);
    referenceList.hidden = !references.length;
    updateButtons();
    updateAdaptiveFields();
    updatePreview();
    updateSelectionLayout();
  }

  function changeService(id, forceAdd = false) {
    if (!services.has(id)) return;
    const index = state.items.findIndex((item) => item.id === id);
    const selected = index !== -1;
    let removed = null;
    if (selected && !forceAdd) {
      removed = {type: 'service', item: {...state.items[index]}, index, references: [...state.references]};
      state.items.splice(index, 1);
      state.references = state.references.filter((reference) => (
        !referenceServices.get(reference)?.includes(id) || referenceServices.get(reference).some((relatedId) => state.items.some((item) => item.id === relatedId))
      ));
      removed.references = removed.references.map((reference, position) => ({reference, position})).filter(({reference}) => !state.references.includes(reference));
    } else if (!selected) {
      if (undoRecord?.type === 'service' && undoRecord.item.id === id) clearUndo();
      state.items.push({id, quantity: 1});
    }
    renderItems();
    persist();
    if (removed) showUndo(removed, `${services.get(id).title}: servicio retirado.`);
    document.dispatchEvent(new CustomEvent('servicechanged', {detail: {id, selected: !selected || forceAdd}}));
    if (selectionStatus) {
      const action = selected && !forceAdd ? 'quitado de' : 'añadido a';
      selectionStatus.textContent = `${services.get(id).title}, ${action} tu consulta.`;
    }
  }

  function mountUndo() {
    if (!undoNotice || !undoRecord) return;
    const dialog = [...document.querySelectorAll('dialog[open]')].at(-1);
    const container = dialog?.querySelector('.inquiry-selection') || dialog || document.body;
    if (undoNotice.parentElement !== container) container.append(undoNotice);
  }

  function clearUndo() {
    clearTimeout(undoTimer);
    undoTimer = null;
    undoRecord = null;
    if (undoNotice) undoNotice.hidden = true;
  }

  function scheduleUndoExpiry() {
    clearTimeout(undoTimer);
    if (!undoRecord || undoNotice?.matches(':focus-within, :hover')) return;
    undoTimer = setTimeout(clearUndo, 10000);
  }

  function showUndo(record, message) {
    if (!undoNotice || !undoMessage || !undoButton) return;
    clearTimeout(undoTimer);
    undoRecord = record;
    undoMessage.textContent = message;
    undoNotice.hidden = false;
    mountUndo();
    scheduleUndoExpiry();
  }

  undoNotice?.addEventListener('pointerenter', () => clearTimeout(undoTimer));
  undoNotice?.addEventListener('pointerleave', scheduleUndoExpiry);
  undoNotice?.addEventListener('focusin', () => clearTimeout(undoTimer));
  undoNotice?.addEventListener('focusout', () => requestAnimationFrame(scheduleUndoExpiry));
  undoButton?.addEventListener('click', () => {
    const record = undoRecord;
    if (!record) return;
    if (record.type === 'service' && !state.items.some((item) => item.id === record.item.id)) {
      state.items.splice(Math.min(record.index, state.items.length), 0, record.item);
      for (const {reference, position} of record.references) {
        if (!state.references.includes(reference)) state.references.splice(Math.min(position, state.references.length), 0, reference);
      }
    } else if (record.type === 'reference' && !state.references.includes(record.reference)) {
      state.references.splice(Math.min(record.index, state.references.length), 0, record.reference);
    }
    clearUndo();
    selectionExpanded = true;
    renderItems();
    persist();
    if (selectionStatus) selectionStatus.textContent = 'Selección recuperada.';
    const target = record.type === 'service' ? itemList.querySelector(`[data-remove-service="${record.item.id}"]`) : referenceList.querySelectorAll('[data-remove-reference]')[record.index];
    const heading = document.querySelector('#selection-title');
    heading?.setAttribute('tabindex', '-1');
    const candidates = inquiryDialog.open ? [target, heading] : serviceDialog.open ? [document.querySelector('#service-dialog-add')] : [document.querySelector(`[data-add-service="${record.item?.id || ''}"]`), document.querySelector('.header-contact[data-open-inquiry]')];
    const focusTarget = candidates.find((element) => element?.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
    focusTarget?.focus({preventScroll: true});
  });

  function applyFilter(filter) {
    if (!filters.includes(filter)) return;
    let visible = 0;
    for (const service of services.values()) {
      service.card.hidden = filter !== 'todos' && service.category !== filter;
      if (!service.card.hidden) visible++;
    }
    document.querySelectorAll('[data-filter]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
    });
    const results = document.querySelector('#service-results');
    const labels = {todos: 'en total', alquilar: 'de alquiler', crear: 'de diseño y desarrollo', comprar: 'de venta'};
    if (results) results.textContent = `${visible} ${visible === 1 ? 'servicio' : 'servicios'} ${labels[filter]}`;
    document.querySelector('.service-grid')?.dispatchEvent(new CustomEvent('servicesfiltered'));
  }

  function filterFromHash() {
    const service = services.get(window.location.hash.slice(1));
    if (!service) return;
    applyFilter(service.category);
    service.card.scrollIntoView({block: 'start'});
  }

  function updateDialogState() {
    document.body.classList.toggle('dialog-open', dialogs.some((dialog) => dialog.open));
    mountUndo();
  }

  function openDialog(dialog, opener) {
    if (dialog.open) return;
    const sourceDialog = opener?.closest('dialog');
    dialogOpeners.set(dialog, sourceDialog ? dialogOpeners.get(sourceDialog) : opener);
    for (const current of dialogs) {
      if (current !== dialog && current.open) current.close();
    }
    dialog.showModal();
    dialog.scrollTop = 0;
    const content = dialog.querySelector('.inquiry-content');
    if (content) content.scrollTop = 0;
    if (dialog === inquiryDialog) {
      selectionExpanded = Array.from(itemList.querySelectorAll('input')).some((input) => !input.validity.valid);
      updateSelectionLayout();
    }
    updateDialogState();
  }

  function openServiceDetails(id, opener) {
    const service = services.get(id);
    const title = document.querySelector('#service-dialog-title');
    const image = document.querySelector('#service-dialog-image');
    const body = document.querySelector('#service-dialog-body');
    const add = document.querySelector('#service-dialog-add');
    if (!service || !title || !body || !add) return;
    title.textContent = service.title;
    const source = service.card.querySelector('img.service-media');
    if (image) {
      image.hidden = !source;
      if (source) {
        image.src = source.src;
        image.alt = source.alt;
      }
    }
    const template = service.card.querySelector('template.service-details');
    body.replaceChildren();
    if (template) {
      body.append(template.content.cloneNode(true));
    } else {
      const description = document.createElement('p');
      description.textContent = service.card.querySelector('.service-description')?.textContent || '';
      body.append(description);
    }
    add.dataset.addService = id;
    updateButtons();
    openDialog(serviceDialog, opener);
  }

  function validateFields() {
    const start = fields.fecha_inicio?.value;
    const end = fields.fecha_fin?.value;
    if (fields.fecha_fin) fields.fecha_fin.min = start || '';
    fields.fecha_fin?.setCustomValidity(start && end && end < start ? 'La fecha de fin debe ser igual o posterior a la fecha de inicio.' : '');
    fields.nombre?.setCustomValidity(fields.nombre.value.trim() ? '' : 'Escribe tu nombre para preparar la consulta.');
  }

  function validateInquiry() {
    validateFields();
    for (const input of itemList.querySelectorAll('input[type="number"]')) {
      if (!input.validity.valid) {
        selectionExpanded = true;
        updateSelectionLayout();
      }
      if (!input.reportValidity()) return false;
    }
    if (!form.reportValidity()) return false;
    readFields();
    updatePreview();
    persist();
    return true;
  }

  function focusAfterRemoval(list, index) {
    const neighbor = list.children[Math.min(index, list.children.length - 1)];
    const heading = document.querySelector('#selection-title');
    const target = neighbor?.querySelector('[data-remove-service], [data-remove-reference]') || heading;
    if (target === heading) heading?.setAttribute('tabindex', '-1');
    target?.focus({preventScroll: true});
  }

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest('[data-filter], [data-filter-link], [data-service-details], [data-add-service], [data-open-inquiry], [data-project-request], [data-close-dialog], [data-browse-services], [data-service-case-link]');
    if (!target) return;
    if (target.hasAttribute('data-service-case-link')) {
      target.closest('dialog')?.close();
      updateDialogState();
      return;
    }
    if (target.hasAttribute('data-filter-link')) {
      applyFilter(target.dataset.filterLink);
      return;
    }
    event.preventDefault();
    if (target.hasAttribute('data-filter')) {
      applyFilter(target.dataset.filter);
    } else if (target.hasAttribute('data-service-details')) {
      openServiceDetails(target.dataset.serviceDetails, target);
    } else if (target.hasAttribute('data-add-service')) {
      changeService(target.dataset.addService);
    } else if (target.hasAttribute('data-project-request')) {
      const reference = target.dataset.projectRequest;
      const related = referenceServices.get(reference) || ['interaccion'];
      for (const id of related) changeService(id, true);
      if (allowedReferences.has(reference) && !state.references.includes(reference) && state.references.length < 12) {
        state.references.push(reference);
        renderItems();
        persist();
      }
      openDialog(inquiryDialog, target);
    } else if (target.hasAttribute('data-open-inquiry')) {
      if (!storageAvailable) setStatus('Tu navegador no permitió guardar la consulta. Puedes continuar en esta ventana.');
      openDialog(inquiryDialog, target);
    } else if (target.hasAttribute('data-close-dialog')) {
      target.closest('dialog')?.close();
      updateDialogState();
    } else if (target.hasAttribute('data-browse-services')) {
      inquiryDialog.close();
      updateDialogState();
      applyFilter('alquilar');
      window.location.hash = 'servicios';
      document.querySelector('#servicios')?.scrollIntoView({block: 'start'});
    }
  });

  function updateQuantityControls(input) {
    const quantity = input.valueAsNumber;
    const valid = Number.isInteger(quantity) && quantity >= 1 && quantity <= 999;
    input.setCustomValidity(valid ? '' : 'Introduce una cantidad entera entre 1 y 999.');
    for (const button of input.closest('.quantity-stepper').querySelectorAll('[data-quantity-step]')) {
      const nextQuantity = quantity + Number(button.dataset.quantityStep);
      button.disabled = !valid || nextQuantity < 1 || nextQuantity > 999;
    }
    return valid;
  }

  itemList.addEventListener('input', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.dataset.quantityService) return;
    if (!updateQuantityControls(input)) return;
    const item = state.items.find((current) => current.id === input.dataset.quantityService);
    if (!item) return;
    item.quantity = input.valueAsNumber;
    updatePreview();
    persist();
  });

  itemList.addEventListener('click', (event) => {
    const step = event.target.closest('[data-quantity-step]');
    if (step) {
      const input = step.closest('.quantity-stepper')?.querySelector('input[data-quantity-service]');
      if (!input || input.dataset.quantityService !== step.dataset.quantityTarget || !updateQuantityControls(input)) return;
      const direction = Number(step.dataset.quantityStep);
      const quantity = input.valueAsNumber + direction;
      if (![-1, 1].includes(direction) || quantity < 1 || quantity > 999) return;
      input.value = String(quantity);
      input.dispatchEvent(new Event('input', {bubbles: true}));
      return;
    }
    const button = event.target.closest('[data-remove-service]');
    if (!button) return;
    const index = Array.from(itemList.children).indexOf(button.closest('li'));
    changeService(button.dataset.removeService);
    focusAfterRemoval(itemList, index);
  });

  referenceList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-reference]');
    if (!button) return;
    const index = Array.from(referenceList.children).indexOf(button.closest('li'));
    const reference = button.dataset.removeReference;
    state.references = state.references.filter((value) => value !== reference);
    renderItems();
    persist();
    showUndo({type: 'reference', reference, index}, 'Referencia retirada de tu consulta.');
    focusAfterRemoval(referenceList, index);
  });

  for (const dialog of dialogs) {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      updateDialogState();
      if (dialogs.some((current) => current.open)) return;
      const opener = dialogOpeners.get(dialog);
      if (opener?.isConnected && opener.getClientRects().length && getComputedStyle(opener).visibility !== 'hidden') opener.focus({preventScroll: true});
    });
  }

  function handleFieldChange() {
    readFields();
    updateAdaptiveFields();
    validateFields();
    updatePreview();
    persist();
  }
  form.addEventListener('input', handleFieldChange);
  form.addEventListener('change', handleFieldChange);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateInquiry()) return;
    setStatus('Revisa tu solicitud en WhatsApp y envíala cuando esté lista.');
    window.location.href = `https://wa.me/59179532669?text=${encodeURIComponent(buildMessage())}`;
  });
  document.querySelector('#inquiry-email')?.addEventListener('click', (event) => {
    event.preventDefault();
    if (!validateInquiry()) return;
    setStatus('Revisa el borrador en tu aplicación de correo y envíalo desde allí.');
    window.location.href = `mailto:alunova.ventas@outlook.com?subject=${encodeURIComponent('Solicitud de cotización · ALUNOVA')}&body=${encodeURIComponent(buildMessage())}`;
  });
  window.addEventListener('hashchange', filterFromHash);

  restoreState();
  for (const name of fieldNames) {
    if (fields[name] && state.fields[name] !== undefined) fields[name].value = state.fields[name];
  }
  for (const name of Object.keys(fieldLimits)) {
    if (fields[name]) fields[name].maxLength = fieldLimits[name];
  }
  readFields();
  validateFields();
  renderItems();
  applyFilter(document.querySelector('[data-filter][aria-pressed="true"]')?.dataset.filter || 'alquilar');
  filterFromHash();
  updateBarVisibility();
})();
