(() => {
  'use strict';
  document.documentElement.classList.add('is-ready');
  const phone = '2349063211390';
  const key = 'tpss-order-v1';
  const money = value => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
  const $ = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  const catalogue = all('.dish').map(element => ({ id: element.dataset.id, category: element.dataset.category, name: element.querySelector('h3').textContent, portion: element.querySelector('.portion').textContent, price: Number(element.dataset.price), element }));
  const products = new Map(catalogue.map(product => [product.id, product]));
  const quantities = new Map();
  try {
    const saved = JSON.parse(sessionStorage.getItem(key));
    if (Array.isArray(saved)) saved.forEach(item => {
      if (item && products.has(item.id) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99) quantities.set(item.id, item.quantity);
    });
  } catch { /* In-memory order remains available when storage is blocked. */ }

  function icon(name) { const element = document.createElement('i'); element.dataset.lucide = name; return element; }
  function refreshIcons() { if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } }); }
  function persist() { try { sessionStorage.setItem(key, JSON.stringify([...quantities].map(([id, quantity]) => ({ id, quantity })))); } catch { /* Memory fallback. */ } }
  function requestText() {
    const items = [...quantities].map(([id, quantity]) => { const p = products.get(id); return `${quantity} x ${p.name} (${p.portion}) - ${money(p.price * quantity)}`; });
    const subtotal = [...quantities].reduce((sum, [id, quantity]) => sum + products.get(id).price * quantity, 0);
    return `Hello The Pepper Soup Shop,\nI'd like to request an order from Lekki Phase 1.\n\n${items.join('\n')}\n\nListed item subtotal: ${money(subtotal)}\nTax, packaging and delivery are excluded.\nPlease confirm portions, availability, additional charges and timing before payment.`;
  }
  function button(action, id, label, symbol) {
    const el = document.createElement('button'); el.type = 'button'; el.className = action === 'remove' ? 'remove' : 'icon-button'; el.dataset.action = action; el.dataset.id = id; el.setAttribute('aria-label', label); el.title = label; el.append(icon(symbol)); return el;
  }
  function render(focus) {
    const holder = $('#order-items'); holder.replaceChildren();
    let count = 0; let subtotal = 0;
    quantities.forEach((quantity, id) => {
      const product = products.get(id); count += quantity; subtotal += product.price * quantity;
      const row = document.createElement('div'); row.className = 'order-item';
      const top = document.createElement('div'); top.className = 'order-item-top';
      const copy = document.createElement('div');
      const name = document.createElement('p'); name.className = 'order-item-name'; name.textContent = product.name;
      const size = document.createElement('p'); size.className = 'order-item-size'; size.textContent = product.portion;
      const price = document.createElement('span'); price.textContent = money(product.price * quantity);
      copy.append(name, size); top.append(copy, price);
      const controls = document.createElement('div'); controls.className = 'order-item-controls';
      const stepper = document.createElement('div'); stepper.className = 'stepper';
      const output = document.createElement('output'); output.textContent = quantity; output.setAttribute('aria-label', `Quantity of ${product.name}`);
      const plus = button('increase', id, `Increase ${product.name}`, 'plus'); plus.disabled = quantity >= 99;
      stepper.append(button('decrease', id, `Decrease ${product.name}`, 'minus'), output, plus);
      controls.append(stepper, button('remove', id, `Remove ${product.name}`, 'trash-2'));
      row.append(top, controls); holder.append(row);
    });
    $('#empty-order').hidden = count > 0; $('#order-filled').hidden = count === 0; $('#mobile-order').hidden = count === 0;
    document.body.classList.toggle('has-order', count > 0);
    all('[data-count]').forEach(element => { element.textContent = count; });
    all('[data-subtotal]').forEach(element => { element.textContent = money(subtotal); });
    $('#order-send').href = `https://wa.me/${phone}?text=${encodeURIComponent(requestText())}`;
    catalogue.forEach(product => { const add = product.element.querySelector('[data-add]'); const quantity = quantities.get(product.id) || 0; add.classList.toggle('added', quantity > 0); add.disabled = quantity >= 99; add.setAttribute('aria-label', `Add ${product.name}; ${quantity} in your order`); });
    $('#copy-fallback').hidden = true; $('#copy-result').textContent = ''; refreshIcons();
    if (focus) { const next = all('#order-items button').find(el => el.dataset.id === focus.id && el.dataset.action === focus.action && !el.disabled); (next || $('#order-title')).focus(); }
  }
  function change(id, amount, remove = false, focus) {
    if (!products.has(id)) return;
    const quantity = remove ? 0 : Math.min(99, Math.max(0, (quantities.get(id) || 0) + amount));
    if (quantity) quantities.set(id, quantity); else quantities.delete(id); persist(); render(focus);
    $('#order-status').textContent = quantity ? `${products.get(id).name}: ${quantity} in your order.` : `${products.get(id).name} removed.`;
  }
  document.addEventListener('click', event => {
    const add = event.target.closest('[data-add]'); if (add) change(add.dataset.add, 1);
    const control = event.target.closest('[data-action]'); if (control) change(control.dataset.id, control.dataset.action === 'increase' ? 1 : -1, control.dataset.action === 'remove', { id: control.dataset.id, action: control.dataset.action });
  });

  let category = 'all';
  function filterMenu() {
    const query = $('#menu-search').value.toLowerCase().trim(); let visible = 0;
    catalogue.forEach(product => { const show = (category === 'all' || product.category === category) && `${product.name} ${product.portion}`.toLowerCase().includes(query); product.element.hidden = !show; if (show) visible++; });
    $('#no-results').hidden = visible > 0; $('#result-count').textContent = `${visible} ${visible === 1 ? 'dish' : 'dishes'}`;
  }
  function resetFilter() { category = 'all'; $('#menu-search').value = ''; all('[data-filter]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.filter === 'all'))); filterMenu(); $('#menu-search').focus(); }
  $('#menu-search').addEventListener('input', filterMenu);
  all('[data-filter]').forEach(el => el.addEventListener('click', () => { category = el.dataset.filter; all('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button === el))); filterMenu(); }));
  $('#clear-search').addEventListener('click', resetFilter); $('#empty-clear').addEventListener('click', resetFilter);
  $('#copy-order').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(requestText()); $('#copy-result').textContent = 'Order details copied.'; }
    catch { $('#copy-fallback').hidden = false; $('#copy-text').value = requestText(); $('#copy-text').focus(); $('#copy-text').select(); $('#copy-result').textContent = 'Select and copy your order details below.'; }
  });

  const nav = $('.mobile-nav'); all('.mobile-nav a').forEach(link => link.addEventListener('click', () => { nav.open = false; }));
  document.addEventListener('pointerdown', () => document.body.classList.add('pointer'));
  document.addEventListener('keydown', event => { document.body.classList.remove('pointer'); if (event.key === 'Escape' && nav.open) { nav.open = false; nav.querySelector('summary').focus(); } });
  document.addEventListener('click', event => { if (!nav.contains(event.target)) nav.open = false; });

  const form = $('#catering-form'); const now = new Date(); $('#event-date').min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  form.addEventListener('input', () => { $('#enquiry-ready').hidden = true; });
  form.addEventListener('submit', event => {
    event.preventDefault(); if (!form.reportValidity()) return;
    const data = new FormData(form); const location = String(data.get('location')).trim();
    const text = `Hello The Pepper Soup Shop,\nI'd like a catering quote.\n\nEvent date: ${data.get('date')}\nLocation: ${location}\nGuests: ${data.get('guests')}\nNotes: ${String(data.get('notes')).trim() || 'None'}\n\nPlease confirm availability and the next steps.`;
    $('#catering-send').href = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`; $('#enquiry-ready').hidden = false; $('#enquiry-title').focus();
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const bookPages = all('[data-book-page]');
  const previousPage = $('[data-book-prev]');
  const nextPage = $('[data-book-next]');
  let bookPage = 0;
  let pageTurning = false;

  function updateBook() {
    bookPages.forEach((page, index) => { page.hidden = index !== bookPage; });
    previousPage.disabled = bookPage === 0;
    nextPage.disabled = bookPage === bookPages.length - 1;
    $('[data-book-current]').textContent = bookPage + 1;
    $('[data-book-total]').textContent = bookPages.length;
    $('[data-book-bar]').style.transform = `scaleX(${(bookPage + 1) / bookPages.length})`;
  }

  async function turnBook(target, event) {
    if (pageTurning || target < 0 || target >= bookPages.length || target === bookPage) return;
    const outgoing = bookPages[bookPage];
    const incoming = bookPages[target];
    const forward = target > bookPage;
    const immediate = reducedMotion.matches || event.detail === 0 || !outgoing.animate;
    pageTurning = true;
    incoming.hidden = false;
    incoming.style.zIndex = '1';
    outgoing.style.zIndex = '2';

    if (!immediate) {
      const animation = outgoing.animate([
        { transform: 'perspective(1800px) rotateY(0deg)', opacity: 1, filter: 'brightness(1)' },
        { transform: `perspective(1800px) rotateY(${forward ? -94 : 94}deg)`, opacity: .2, filter: 'brightness(0.6)' }
      ], { duration: 850, easing: 'cubic-bezier(.65, 0, .05, 1)', fill: 'forwards' });
      await animation.finished.catch(() => {});
      animation.cancel();
    }

    outgoing.hidden = true;
    outgoing.style.zIndex = '';
    incoming.style.zIndex = '';
    bookPage = target;
    pageTurning = false;
    updateBook();
  }

  previousPage.addEventListener('click', event => turnBook(bookPage - 1, event));
  nextPage.addEventListener('click', event => turnBook(bookPage + 1, event));
  updateBook();

  function initScrollMotion() {
    if (!window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    const motion = window.gsap.matchMedia();
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      window.gsap.to('[data-ramen-visual] img', {
        scale: 1.15,
        ease: 'none',
        scrollTrigger: { trigger: '.ramen-feature', start: 'top bottom', end: 'bottom top', scrub: 1.2 }
      });
      window.gsap.to('.ramen-rings', {
        rotation: 45,
        ease: 'none',
        scrollTrigger: { trigger: '.ramen-feature', start: 'top bottom', end: 'bottom top', scrub: 1.5 }
      });
      window.gsap.fromTo('[data-founder-portrait]', { y: 40, autoAlpha: 0, scale: 0.97 }, {
        y: 0,
        autoAlpha: 1,
        scale: 1,
        duration: 1.2,
        ease: 'power4.out',
        scrollTrigger: { trigger: '.story', start: 'top 80%', once: true }
      });
      window.gsap.fromTo('[data-founder-copy]', { y: 30, autoAlpha: 0 }, {
        y: 0,
        autoAlpha: 1,
        duration: 1.2,
        delay: 0.2,
        ease: 'power4.out',
        scrollTrigger: { trigger: '.story', start: 'top 80%', once: true }
      });
    });
  }

  initScrollMotion();
  render(); filterMenu(); refreshIcons();
})();
