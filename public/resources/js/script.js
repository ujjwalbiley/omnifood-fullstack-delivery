/* ==========================================================================
   OMNIFOOD - interactions (vanilla JS, no jQuery needed)
   1. Helpers            6. Cities tabs
   2. Theme + header     7. Testimonials
   3. Menu data + cart   8. Plans + billing toggle
   4. Cart drawer        9. Sign-up form
   5. How it works      10. Small things (hero ETA, scroll spy, image fallback)
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- 1. Helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode, ignore */ }
    }
  };

  const fmt = n => '$' + n.toFixed(2);
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  /* Count a number up/down inside an element */
  function tween(el, to, format = String, duration = 700) {
    const from = el._v ?? to;
    el._v = to;
    if (reduceMotion || from === to) { el.textContent = format(to); return; }
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(Math.round(from + (to - from) * eased));
      if (p < 1 && el._v === to) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* Accessible tablist: click + arrow keys + roving tabindex */
  function tabs(list, onSelect) {
    list.forEach((tab, i) => {
      tab.addEventListener('click', () => onSelect(tab, i, true));
      tab.addEventListener('keydown', e => {
        let n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % list.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + list.length) % list.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = list.length - 1;
        if (n !== null) { e.preventDefault(); list[n].focus(); onSelect(list[n], n, true); }
      });
    });
  }

  const toastEl = $('#toast');
  let toastTimer;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2400);
  }

  function goTo(selector) {
    const target = $(selector);
    if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- 2. Theme + header ---------- */
  const root = document.documentElement;
  const themeBtn = $('#themeBtn');

  function setTheme(theme) {
    root.dataset.theme = theme;
    store.set('of-theme', theme);
    themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
  themeBtn.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  const header = $('.site-header');
  const navToggle = $('#navToggle');
  const setNav = open => {
    header.dataset.open = String(open);
    navToggle.setAttribute('aria-expanded', String(open));
  };
  navToggle.addEventListener('click', () => setNav(header.dataset.open !== 'true'));
  $$('.nav-links a').forEach(a => a.addEventListener('click', () => setNav(false)));

  const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // "#" placeholder links should not jump to the top
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href="#"]');
    if (a) e.preventDefault();
  });

  /* ---------- 3. Menu data + cart ----------
     Edit this list to match your own food photos (resources/css/img/1.jpg ... 8.jpg).
     Filter tags (vegan / high-protein / low-carb / light) are worked out from the numbers. */
  const IMG = 'resources/css/img/';
  const MEALS = [
    { id: 'buddha-bowl',   name: 'Rainbow Buddha Bowl',     img: '1.jpg', price: 12, kcal: 480, protein: 18, carbs: 62, vegan: true },
    { id: 'salmon-greens', name: 'Grilled Salmon & Greens', img: '2.jpg', price: 16, kcal: 520, protein: 38, carbs: 14 },
    { id: 'harvest-salad', name: 'Harvest Grain Salad',     img: '3.jpg', price: 11, kcal: 410, protein: 14, carbs: 58, vegan: true },
    { id: 'chicken-quinoa',name: 'Chicken Quinoa Plate',    img: '4.jpg', price: 14, kcal: 560, protein: 42, carbs: 48 },
    { id: 'zoodles',       name: 'Zucchini Pesto Noodles',  img: '5.jpg', price: 13, kcal: 380, protein: 16, carbs: 18 },
    { id: 'berry-oats',    name: 'Berry Oat Jar',           img: '6.jpg', price: 8,  kcal: 320, protein: 10, carbs: 52, vegan: true },
    { id: 'steak-veg',     name: 'Steak & Roasted Veg',     img: '7.jpg', price: 18, kcal: 610, protein: 46, carbs: 22 },
    { id: 'med-wrap',      name: 'Mediterranean Wrap',      img: '8.jpg', price: 10, kcal: 440, protein: 20, carbs: 46 }
  ];
  const TAG_LABEL = { vegan: 'Vegan', 'high-protein': 'High protein', 'low-carb': 'Low carb', light: 'Light' };

  MEALS.forEach(m => {
    m.tags = [];
    if (m.vegan) m.tags.push('vegan');
    if (m.protein >= 35) m.tags.push('high-protein');
    if (m.carbs <= 25) m.tags.push('low-carb');
    if (m.kcal < 450) m.tags.push('light');
  });
  const mealById = Object.fromEntries(MEALS.map(m => [m.id, m]));

  const FREE_DELIVERY_AT = 30;
  const DELIVERY_FEE = 3.5;
  const MAX_QTY = 20;

  const cleanCart = raw => {
    const out = {};
    Object.entries(raw || {}).forEach(([id, q]) => {
      if (mealById[id] && Number.isInteger(q) && q > 0) out[id] = Math.min(q, MAX_QTY);
    });
    return out;
  };
  let cart = cleanCart(store.get('of-cart', {}));

  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const cartSubtotal = () => Object.entries(cart).reduce((s, [id, q]) => s + mealById[id].price * q, 0);

  const stepperHTML = (id, q) => `
    <div class="stepper" role="group" aria-label="Quantity">
      <button type="button" data-act="dec" data-id="${id}" aria-label="Remove one ${mealById[id].name}">${icon('minus')}</button>
      <output aria-live="polite">${q}</output>
      <button type="button" data-act="inc" data-id="${id}" aria-label="Add one ${mealById[id].name}">${icon('plus')}</button>
    </div>`;

  const controlHTML = id => {
    const q = cart[id] || 0;
    return q
      ? stepperHTML(id, q)
      : `<button class="btn btn-add" type="button" data-act="add" data-id="${id}" aria-label="Add ${mealById[id].name} to bag">${icon('plus')}Add</button>`;
  };

  const cardHTML = m => `
    <article class="card" data-meal="${m.id}">
      <div class="card-media"><img src="${IMG}${m.img}" alt="${m.name}" width="800" height="600" loading="lazy"></div>
      <div class="card-body">
        <h3>${m.name}</h3>
        <div class="macros">
          <span>${icon('flame')}${m.kcal} kcal</span>
          <span>${icon('dumbbell')}${m.protein} g protein</span>
        </div>
        <div class="tags">${m.tags.slice(0, 2).map(t => `<span class="tag">${TAG_LABEL[t]}</span>`).join('')}</div>
        <div class="card-foot">
          <span class="price">${fmt(m.price)}</span>
          <div class="card-actions">${controlHTML(m.id)}</div>
        </div>
      </div>
    </article>`;

  const menuGrid = $('#menuGrid');
  const menuStatus = $('#menuStatus');
  const filterBtns = $$('.filter');

  function renderMenu(filter = 'all', animate = false) {
    const list = MEALS.filter(m => filter === 'all' || m.tags.includes(filter));
    menuGrid.classList.toggle('is-filtering', animate);
    menuGrid.innerHTML = list.map(cardHTML).join('');
    menuStatus.textContent = `${list.length} meal${list.length === 1 ? '' : 's'}`;
    guardImages(menuGrid);
  }

  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    renderMenu(btn.dataset.filter, true);
  }));

  /* Update just one card's button/stepper, keeping keyboard focus */
  function syncCard(id) {
    const actions = $(`[data-meal="${id}"] .card-actions`, menuGrid);
    if (!actions) return;
    const hadFocus = actions.contains(document.activeElement);
    actions.innerHTML = controlHTML(id);
    if (hadFocus) (actions.querySelector('[data-act="inc"]') || actions.querySelector('button')).focus();
  }

  function setQty(id, qty) {
    qty = Math.max(0, Math.min(MAX_QTY, qty));
    if (qty) cart[id] = qty; else delete cart[id];
    store.set('of-cart', cart);
    syncCard(id);
    renderCart();
    renderOrderSummary();
  }

  function onQtyClick(e) {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const q = cart[id] || 0;
    if (btn.dataset.act === 'add') { setQty(id, 1); toast(`${mealById[id].name} added to your bag`); }
    else if (btn.dataset.act === 'inc') setQty(id, q + 1);
    else if (btn.dataset.act === 'dec') setQty(id, q - 1);
  }
  menuGrid.addEventListener('click', onQtyClick);

  /* ---------- 4. Cart drawer ---------- */
  const drawer = $('#drawer');
  const scrim = $('#scrim');
  const drawerBody = $('#drawerBody');
  const drawerFoot = $('#drawerFoot');
  const cartBtn = $('#cartBtn');
  const cartBadge = $('#cartBadge');
  const closeCartBtn = $('#closeCart');
  const checkoutBtn = $('#checkoutBtn');
  const pageParts = [$('.site-header'), $('main'), $('.footer')];

  function renderCart() {
    const n = cartCount();
    cartBadge.textContent = n;
    cartBadge.hidden = n === 0;
    cartBtn.setAttribute('aria-label', n ? `Open bag, ${n} item${n === 1 ? '' : 's'}` : 'Open bag');

    // remember which control had focus so re-rendering doesn't drop it
    const active = document.activeElement;
    const focusKey = active && drawerBody.contains(active) && active.dataset.act
      ? `[data-act="${active.dataset.act}"][data-id="${active.dataset.id}"]` : null;

    if (!n) {
      drawerFoot.hidden = true;
      drawerBody.innerHTML = `
        <div class="empty">
          <strong>Your bag is empty</strong>
          <p>Add a meal from this week's menu and it will show up here.</p>
          <button class="btn btn-primary" type="button" id="browseBtn">Browse the menu</button>
        </div>`;
    } else {
      drawerFoot.hidden = false;
      drawerBody.innerHTML = `<ul>${Object.entries(cart).map(([id, q]) => {
        const m = mealById[id];
        return `
          <li class="line">
            <img src="${IMG}${m.img}" alt="" width="72" height="72">
            <div>
              <h4>${m.name}</h4>
              <small>${fmt(m.price)} each</small>
              ${stepperHTML(id, q)}
            </div>
            <strong>${fmt(m.price * q)}</strong>
          </li>`;
      }).join('')}</ul>`;

      const sub = cartSubtotal();
      const fee = sub >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE;
      $('#tSub').textContent = fmt(sub);
      $('#tFee').textContent = fee ? fmt(fee) : 'Free';
      $('#tTotal').textContent = fmt(sub + fee);
      $('#shipMsg').textContent = fee
        ? `Add ${fmt(FREE_DELIVERY_AT - sub)} more for free delivery.`
        : 'You have unlocked free delivery.';
      $('#shipBar').style.width = Math.min(100, (sub / FREE_DELIVERY_AT) * 100) + '%';
    }
    guardImages(drawerBody);

    if (focusKey) {
      const next = $(focusKey, drawerBody) || $('.line button', drawerBody) || $('#browseBtn', drawerBody) || closeCartBtn;
      next.focus();
    }
  }

  function openCart() {
    drawer.inert = false;
    drawer.classList.add('is-open');
    scrim.classList.add('is-open');
    document.body.classList.add('no-scroll');
    pageParts.forEach(el => { el.inert = true; });
    closeCartBtn.focus();
  }
  function closeCart(returnFocus = true) {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    scrim.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    pageParts.forEach(el => { el.inert = false; });
    drawer.inert = true;
    if (returnFocus) cartBtn.focus();
  }

  cartBtn.addEventListener('click', openCart);
  closeCartBtn.addEventListener('click', () => closeCart());
  scrim.addEventListener('click', () => closeCart());
  drawerBody.addEventListener('click', e => {
    if (e.target.closest('#browseBtn')) { closeCart(false); goTo('#menu'); return; }
    onQtyClick(e);
  });
  checkoutBtn.addEventListener('click', () => {
    closeCart(false);
    $('#interest').value = 'order';
    goTo('#signup');
    setTimeout(() => $('#name').focus({ preventScroll: true }), reduceMotion ? 0 : 700);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeCart();
    setNav(false);
  });

  /* ---------- 5. How it works: steps light up as you scroll ---------- */
  const steps = $$('.step');
  if ('IntersectionObserver' in window) {
    const stepObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const i = steps.indexOf(entry.target);
        steps.forEach((s, k) => {
          s.classList.toggle('is-active', k === i);
          s.classList.toggle('is-done', k < i);
        });
      });
    }, { rootMargin: '-42% 0px -42% 0px' });
    steps.forEach(s => stepObserver.observe(s));
  } else {
    steps.forEach(s => s.classList.add('is-active'));
  }

  /* ---------- 6. Cities tabs ---------- */
  const cityTabs = $$('.city-tab');
  const cityImgs = $$('.city-images img');
  const cityPanel = $('#cityPanel');
  const eatersEl = $('#statEaters');
  const chefsEl = $('#statChefs');
  eatersEl._v = Number(cityTabs[0].dataset.eaters);
  chefsEl._v = Number(cityTabs[0].dataset.chefs);

  tabs(cityTabs, tab => {
    cityTabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    cityImgs.forEach(img => img.classList.toggle('is-active', img.dataset.city === tab.dataset.city));
    cityPanel.setAttribute('aria-labelledby', tab.id);
    tween(eatersEl, Number(tab.dataset.eaters), v => v.toLocaleString('en-US') + '+');
    tween(chefsEl, Number(tab.dataset.chefs), v => v + '+');
    $('#cityHandleText').textContent = tab.dataset.handle;
  });

  /* ---------- 7. Testimonials ---------- */
  const quotes = $$('.quote');
  const quoteTabs = $$('.quote-tab');
  let quoteIndex = 0;
  let autoplay = null;
  let hovering = false;

  function showQuote(i) {
    quoteIndex = (i + quotes.length) % quotes.length;
    quotes.forEach((q, k) => {
      q.classList.toggle('is-active', k === quoteIndex);
      q.setAttribute('aria-hidden', String(k !== quoteIndex));
    });
    quoteTabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === quoteIndex));
      t.tabIndex = k === quoteIndex ? 0 : -1;
    });
  }
  function stopAutoplay() { clearInterval(autoplay); autoplay = null; }

  tabs(quoteTabs, (tab, i) => { stopAutoplay(); showQuote(i); });
  $('#quotePrev').addEventListener('click', () => { stopAutoplay(); showQuote(quoteIndex - 1); });
  $('#quoteNext').addEventListener('click', () => { stopAutoplay(); showQuote(quoteIndex + 1); });

  const proof = $('.proof');
  proof.addEventListener('mouseenter', () => { hovering = true; });
  proof.addEventListener('mouseleave', () => { hovering = false; });
  proof.addEventListener('focusin', stopAutoplay);
  if (!reduceMotion) autoplay = setInterval(() => { if (!hovering) showQuote(quoteIndex + 1); }, 8000);

  /* ---------- 8. Plans + billing toggle ---------- */
  const planCards = $$('.plan[data-plan]');
  const billingBtns = $$('[data-billing]');
  let billing = 'monthly';
  const money0 = n => '$' + n.toLocaleString('en-US');

  function renderPlans() {
    const yearly = billing === 'yearly';
    planCards.forEach(card => {
      if (card.dataset.type !== 'sub') return;
      const monthly = Number(card.dataset.monthly);
      const meals = Number(card.dataset.meals);
      const price = yearly ? Math.round(monthly * 0.8) : monthly;
      tween($('.amt', card), price, String, 500);
      $('.per', card).textContent = '/ month';
      $('.plan-note', card).textContent = yearly
        ? `Billed ${money0(price * 12)} a year, about ${fmt(price / meals)} per meal.`
        : `About ${fmt(price / meals)} per meal.`;
    });
  }
  billingBtns.forEach(btn => btn.addEventListener('click', () => {
    billing = btn.dataset.billing;
    billingBtns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    renderPlans();
  }));
  planCards.forEach(card => { if (card.dataset.type === 'sub') $('.amt', card)._v = Number(card.dataset.monthly); });

  $$('[data-choose]').forEach(btn => btn.addEventListener('click', () => {
    const card = btn.closest('.plan');
    $('#interest').value = btn.dataset.choose;
    renderOrderSummary();
    toast(`${card.dataset.name} plan selected`);
    goTo('#signup');
  }));

  /* ---------- 9. Sign-up form ---------- */
  const form = $('#signupForm');
  const success = $('#formSuccess');
  const nameInput = $('#name');
  const emailInput = $('#email');
  const submitBtn = $('#submitBtn');
  const interest = $('#interest');
  const summary = $('#orderSummary');

  const INTEREST_LABEL = {
    unsure: 'not sure yet', pro: 'Pro plan', premium: 'Premium plan',
    basic: 'Basic plan', order: 'meal order', hello: 'a hello'
  }; 

  const rules = {
    name: v => v.trim().length >= 2 || 'Enter your name, at least 2 characters.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Enter a valid email, like name@example.com.'
  };

  function validate(input) {
    const result = rules[input.name](input.value);
    const error = $(`#err-${input.name}`);
    const ok = result === true;
    error.textContent = ok ? '' : result;
    input.setAttribute('aria-invalid', String(!ok));
    return ok;
  }
  [nameInput, emailInput].forEach(input => {
    input.addEventListener('blur', () => { if (input.value) validate(input); });
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validate(input); });
  });

  function renderOrderSummary() {
    const n = cartCount();
    if (!n) { summary.hidden = true; summary.innerHTML = ''; return; }
    const sub = cartSubtotal();
    const fee = sub >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE;
    summary.hidden = false;
    summary.innerHTML = `
      <h3>Your order</h3>
      <ul>${Object.entries(cart).map(([id, q]) =>
        `<li><span>${q} &times; ${mealById[id].name}</span><span>${fmt(mealById[id].price * q)}</span></li>`).join('')}</ul>
      <div class="sum-total"><span>Total${fee ? ' incl. delivery' : ', free delivery'}</span><span>${fmt(sub + fee)}</span></div>
      <button class="link-btn" type="button" id="editBag">Edit bag</button>`;
  }
  summary.addEventListener('click', e => { if (e.target.closest('#editBag')) openCart(); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const invalid = [nameInput, emailInput].filter(i => !validate(i));
    if (invalid.length) { invalid[0].focus(); return; }

    const data = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      interest: interest.value,
      billing,
      source: $('#find-us').value,
      message: $('#message').value.trim(),
      newsletter: form.elements.news.checked,
      order: { ...cart },
      orderTotal: cartCount() ? cartSubtotal() + (cartSubtotal() >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE) : 0,
      at: new Date().toISOString()
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    // Demo behaviour: the data is saved in this browser only.
    // TODO: replace with a real request, e.g.
    //   fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    try {
      // const response = await fetch('http://localhost:5000/api/signup', {
      const response = await fetch('https://omnifood-fullstack-delivery.onrender.com/api/signup', {  
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const resData = await response.json();

      if (resData.success) {
        const first = data.name.split(' ')[0];
         $('#successTitle').textContent = `Thanks, ${first}. You're in.`;
        const parts = [];
       if (data.orderTotal) parts.push(`Your order of ${cartCount()} meal${cartCount() === 1 ? '' : 's'} (${fmt(data.orderTotal)}) is on its way to the kitchen.`);
        else if (data.interest !== 'unsure' && data.interest !== 'hello') parts.push(`We've noted your interest in the ${INTEREST_LABEL[data.interest]}.`);
        parts.push(`We'll reply to ${data.email} within one working day.`);
        $('#successText').textContent = parts.join(' ');

        if (data.orderTotal) { 
          cart = {}; 
          store.set('of-cart', cart); 
          renderMenu($('.filter[aria-pressed="true"]').dataset.filter); 
          renderCart(); 
          renderOrderSummary(); 
        }

        form.hidden = true;
        success.hidden = false;
        success.focus();
      } else {
        alert(resData.message || 'Kuch error aayi hai.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Backend server se connect nahi ho paya!');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
    }
  });

  $('#againBtn').addEventListener('click', () => {
    form.reset();
    [nameInput, emailInput].forEach(i => { i.removeAttribute('aria-invalid'); $(`#err-${i.name}`).textContent = ''; });
    success.hidden = true;
    form.hidden = false;
    nameInput.focus();
  });

  /* ---------- 10. Small things ---------- */

  // Hero: live "eat by" time
  const etaEl = $('#etaTime');
  function updateEta() {
    const t = new Date(Date.now() + 20 * 60000);
    etaEl.textContent = t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    etaEl.dateTime = t.toISOString();
  }
  updateEta();
  setInterval(updateEta, 30000);

  // Scroll spy: mark the nav link of the section in view
  const navLinks = $$('.nav-links a[href^="#"]');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => a.removeAttribute('aria-current'));
        const link = navLinks.find(a => a.getAttribute('href') === '#' + entry.target.id);
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => spy.observe(s));

    // ring draws itself once when the tile scrolls into view
    const tileTime = $('#tileTime');
    const ringObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); obs.unobserve(en.target); } });
    }, { threshold: .4 });
    ringObserver.observe(tileTime);
  } else {
    $('#tileTime').classList.add('is-in');
  }

  // Missing image? Hide the broken icon and let the coloured background show
  function guardImages(scope = document) {
    $$('img', scope).forEach(img => {
      if (img.dataset.guarded) return;
      img.dataset.guarded = '1';
      const mark = () => img.classList.add('is-missing');
      if (img.complete && img.naturalWidth === 0 && img.currentSrc !== '') mark();
      else img.addEventListener('error', mark, { once: true });
    });
  }

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Boot ---------- */
  renderMenu();
  renderCart();
  renderOrderSummary();
  renderPlans();
  guardImages();
})();
