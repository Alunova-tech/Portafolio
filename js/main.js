(() => {
  const cards = Array.from(document.querySelectorAll('.service-card[data-service-id]'));
  const form = document.querySelector('#inquiry-form');
  const itemList = document.querySelector('#inquiry-items');
  const referenceList = document.querySelector('#inquiry-references');
  const serviceDialog = document.querySelector('#service-dialog');
  const inquiryDialog = document.querySelector('#inquiry-dialog');
  if (!cards.length || !form || !itemList || !referenceList ||
      !serviceDialog?.showModal || !inquiryDialog?.showModal) return;

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
  const fieldLimits = {nombre: 120, email: 180, lugar: 200, notas: 2000};
  const fieldNames = [...Object.keys(fieldLimits), 'fecha_inicio', 'fecha_fin', 'montaje'];
  const fields = Object.fromEntries(fieldNames.map((name) => [name, form.elements.namedItem(name)]));
  const storageKey = 'alunova-consulta-v1';
  const dialogs = [serviceDialog, inquiryDialog];
  const dialogOpeners = new WeakMap();
  const status = document.querySelector('#inquiry-status');
  const selectionStatus = document.querySelector('#selection-status');
  const preview = document.querySelector('#inquiry-preview');
  const state = {version: 1, items: [], references: [], fields: {}};
  let storageAvailable = true;

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
    for (const name of ['fecha_inicio', 'fecha_fin']) {
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
      if (state.items.some((item) => item.id === 'interaccion') && Array.isArray(saved.references)) {
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

  function buildMessage() {
    const values = state.fields;
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
    lines.push(`Fecha de inicio: ${formatDate(values.fecha_inicio)}`);
    lines.push(`Fecha de fin: ${formatDate(values.fecha_fin)}`);
    lines.push(`Lugar: ${values.lugar?.trim() || 'Por definir'}`);
    lines.push(`Montaje e instalación: ${{'por-definir': 'Por definir', si: 'Sí, necesito montaje', no: 'Solo equipos o servicio'}[values.montaje]}`);
    if (values.notas?.trim()) lines.push('', 'Notas', values.notas.trim());
    return lines.join('\n');
  }

  function updatePreview() {
    if (preview) preview.textContent = buildMessage();
  }

  function updateButtons() {
    document.querySelectorAll('[data-add-service]').forEach((button) => {
      const selected = state.items.some((item) => item.id === button.dataset.addService);
      const service = services.get(button.dataset.addService);
      button.setAttribute('aria-pressed', String(selected));
      button.textContent = selected ? 'Añadido a mi consulta' : 'Añadir a mi consulta';
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
  }

  function renderItems() {
    const items = state.items.map((item) => {
      const service = services.get(item.id);
      const row = document.createElement('li');
      row.className = 'inquiry-item';
      const title = document.createElement('strong');
      title.className = 'inquiry-item-title';
      title.textContent = service.title;
      row.append(title);
      if (service.hasQuantity) {
        const label = document.createElement('label');
        label.className = 'inquiry-quantity';
        const text = document.createElement('span');
        text.textContent = 'Cantidad';
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
        label.append(text, input);
        row.append(label);
      }
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'inquiry-remove';
      remove.dataset.removeService = item.id;
      remove.textContent = 'Quitar';
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
    updatePreview();
  }

  function changeService(id, forceAdd = false) {
    if (!services.has(id)) return;
    const selected = state.items.some((item) => item.id === id);
    if (selected && !forceAdd) {
      state.items = state.items.filter((item) => item.id !== id);
      if (id === 'interaccion') state.references = [];
    } else if (!selected) {
      state.items.push({id, quantity: 1});
    }
    renderItems();
    persist();
    if (selectionStatus) {
      const action = selected && !forceAdd ? 'quitado de' : 'añadido a';
      selectionStatus.textContent = `${services.get(id).title}, ${action} tu consulta.`;
    }
  }

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
  }

  function filterFromHash() {
    const service = services.get(window.location.hash.slice(1));
    if (!service) return;
    applyFilter(service.category);
    service.card.scrollIntoView({block: 'start'});
  }

  function updateDialogState() {
    document.body.classList.toggle('dialog-open', dialogs.some((dialog) => dialog.open));
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
    const target = neighbor?.querySelector('button') || heading;
    if (target === heading) heading?.setAttribute('tabindex', '-1');
    target?.focus({preventScroll: true});
  }

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest('[data-filter], [data-filter-link], [data-service-details], [data-add-service], [data-open-inquiry], [data-project-request], [data-close-dialog], [data-browse-services]');
    if (!target) return;
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
      changeService('interaccion', true);
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

  itemList.addEventListener('input', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.dataset.quantityService) return;
    const quantity = input.valueAsNumber;
    const valid = Number.isInteger(quantity) && quantity >= 1 && quantity <= 999;
    input.setCustomValidity(valid ? '' : 'Introduce una cantidad entera entre 1 y 999.');
    if (!valid) return;
    const item = state.items.find((current) => current.id === input.dataset.quantityService);
    if (!item) return;
    item.quantity = quantity;
    updatePreview();
    persist();
  });

  itemList.addEventListener('click', (event) => {
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
    state.references = state.references.filter((value) => value !== button.dataset.removeReference);
    renderItems();
    persist();
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

  form.addEventListener('input', () => {
    validateFields();
    readFields();
    updatePreview();
    persist();
  });
  form.addEventListener('change', () => {
    validateFields();
    readFields();
    updatePreview();
    persist();
  });
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
  const bar = document.querySelector('#inquiry-bar');
  if (bar) bar.hidden = false;
})();
