/* ============================================================
   AVANZATO — shared behaviour (Editorial build)
   ============================================================ */
(function () {
  'use strict';

  // Публичный эндпоинт приёма заявок. Секрета здесь быть не может: весь этот файл
  // доступен любому посетителю. Защита от спама живёт на стороне функции —
  // rate-limit по IP и honeypot-поле.
  var SCRIPT_URL = 'https://functions.yandexcloud.net/d4e2uuvutkn0qcqevb9j?r=orders&source=github';

  var GAS_NOTIFY_URL = 'https://script.google.com/macros/s/AKfycbzfgLUTnQCVwIBflp8pacjSe2obRnGNoIkRybxVd-Yu0jKGib0DQ98yiGQHXtYVbX4Kow/exec';

  // Обезличенный пуш в Telegram: только тип заявки и источник.
  // Персональные данные остаются в Yandex Cloud (152-ФЗ).
  function notifyGAS(type, source) {
    try {
      fetch(GAS_NOTIFY_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ type: type, source: source })
      });
    } catch (e) {}
  }

  var PAGES = [
    { id: 'home',      label: 'Главная',   href: 'index.html' },
    { id: 'portfolio', label: 'Портфолио', href: 'portfolio.html' },
    { id: 'pricing',   label: 'Цены',      href: 'pricing.html' },
    { id: 'contacts',  label: 'Контакты',  href: 'contacts.html' }
  ];
  var current = document.body.getAttribute('data-page') || 'home';

  // caseUrl — если у работы есть страница-разбор, карточка ведёт на неё
  // (внутренний переход со шторкой), а живой сайт открывается уже с кейса.
  // Работы без caseUrl по-прежнему открывают сайт в новой вкладке.
  var PORTFOLIO = [
    { href:'https://velaatrips.com',     caseUrl:'case-velaa-trips.html',    title:'Velaa Trips',      desc:'туристическое агентство на Мальдивах', size:'tall',
      src:'images/velaa_trips.webp' },
    { href:'https://darialukianova.com', caseUrl:'case-daria-lukianova.html', title:'Дарья Лукьянова',  desc:'преподаватель из Казани',  size:'',
      src:'images/darialukianova.webp' },
    { href:'https://avanzato.ru',        caseUrl:'case-avanzato.html',        title:'Avanzato',         desc:'фотограф из Казани',     size:'',
      src:'images/avanzato.webp' },
    { href:'https://portanobile.com',    caseUrl:'case-porta-nobile.html', title:'Porta Nobile',     desc:'люксовая фурнитура в Москве',      size:'tall',
      src:'images/portanobile.webp' },
    { href:'https://medfitclub.ru',      caseUrl:'case-medical-fitness.html', title:'Medical Fitness',  desc:'центр реабилитации в Москве',      size:'',
      src:'images/medfit.webp' },
    { href:'https://alga-tour.com',      caseUrl:'case-alga.html', title:'ALGA',             desc:'туристическое агентство на Мальдивах', size:'',
      src:'images/alga_tour.webp' },
    { href:'https://maldives-elite.ru',  caseUrl:'case-maldives-elite.html', title:'Maldives Elite',   desc:'туристическое агентство на Мальдивах', size:'tall',
      src:'images/maldives_elite.webp' },
    { href:'https://yanapro.ru',         caseUrl:'case-yana-samoylova.html', title:'Яна Самойлова',    desc:'фитнес-тренер в Казани',           size:'',
      src:'images/yanapro.webp' }
  ];
  window.AVW_PORTFOLIO = PORTFOLIO;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- запрет зума на мобильных ---------- */
  // Safari на iOS игнорирует user-scalable=no в meta viewport, поэтому гасим
  // жесты масштабирования вручную: пинч и двойной тап.
  (function () {
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) {
      // и на window, и на document: Safari доставляет жест по-разному
      // в зависимости от того, на каком элементе он начался
      window.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false });
      document.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false });
      document.documentElement.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false });
    });
    document.addEventListener('touchstart', function (e) {
      if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
    // двойной тап: гасим только повторное касание в ту же точку —
    // быстрые тапы по разным кнопкам продолжают работать
    var lastTime = 0, lastX = 0, lastY = 0;
    document.addEventListener('touchend', function (e) {
      var t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      var now = Date.now();
      if (now - lastTime <= 350 && Math.abs(t.clientX - lastX) < 30 && Math.abs(t.clientY - lastY) < 30) {
        e.preventDefault();
      }
      lastTime = now; lastX = t.clientX; lastY = t.clientY;
    }, { passive: false });
    document.addEventListener('touchmove', function (e) {
      if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
  })();

  /* ---------- sliding nav indicator ---------- */
  function setupNavIndicator(navwrap) {
    var navLinks = navwrap.querySelector('.nav-links');
    if (!navLinks) return;
    var ind = document.createElement('span');
    ind.className = 'nav-ind';
    navLinks.insertBefore(ind, navLinks.firstChild);
    var linkEls = [].slice.call(navLinks.querySelectorAll('.link'));
    function activeEl() { return navLinks.querySelector('.link.active'); }
    function moveTo(el) {
      if (!el) { navLinks.classList.remove('ind-on'); return; }
      navLinks.classList.add('ind-on');
      ind.style.transform = 'translateX(' + el.offsetLeft + 'px)';
      ind.style.width = el.offsetWidth + 'px';
    }
    linkEls.forEach(function (el) {
      el.addEventListener('mouseenter', function () { moveTo(el); });
    });
    navLinks.addEventListener('mouseleave', function () { moveTo(activeEl()); });
    requestAnimationFrame(function () { moveTo(activeEl()); });
    window.addEventListener('resize', function () {
      moveTo(navLinks.matches(':hover') ? null : activeEl());
    });
  }

  /* ---------- chrome ---------- */
  function buildChrome() {
    var bar = document.createElement('div');
    bar.className = 'scrollbar';
    document.body.appendChild(bar);

    // Ссылка «к содержимому»: не видна, пока на неё не встанут табом.
    // Идёт первой в DOM, чтобы быть самым первым интерактивным элементом.
    var skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#main';
    skip.textContent = 'Перейти к содержимому';
    document.body.insertBefore(skip, document.body.firstChild);

    var navwrap = document.createElement('div');
    navwrap.className = 'navwrap';
    var links = PAGES.map(function (p) {
      return '<a class="link' + (p.id === current ? ' active' : '') + '" href="' + p.href + '">' + p.label + '</a>';
    }).join('');
    var mlinks = PAGES.map(function (p, i) {
      return '<a class="mlink' + (p.id === current ? ' active' : '') + '" style="--i:' + i + '" href="' + p.href + '">' +
        '<span class="mlink-t">' + p.label + '</span></a>';
    }).join('');
    navwrap.innerHTML = '<nav class="nav" aria-label="Навигация">' +
      '<div class="nav-links">' + links + '</div>' +
      '<button class="burger" aria-label="Меню" aria-expanded="false" aria-controls="mobnav">' +
      '<span></span><span></span><span></span></button>' +
      '</nav>';
    // Шапка визуально сверху, поэтому и в DOM она должна идти сверху:
    // раньше она добавлялась в конец body и порядок обхода табом расходился
    // с тем, что человек видит на экране.
    document.body.insertBefore(navwrap, skip.nextSibling);

    var mob = document.createElement('div');
    mob.className = 'mobnav';
    mob.id = 'mobnav';
    mob.setAttribute('tabindex', '-1');
    mob.innerHTML = '<div class="mobnav-inner">' +
      '<nav class="mobnav-links" aria-label="Мобильное меню">' + mlinks + '</nav>' +
      '</div>';
    document.body.appendChild(mob);

    var burger = navwrap.querySelector('.burger');
    function setNav(open) {
      document.body.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (open) {
        // фокус на контейнер, а не на первый пункт — иначе мобильные браузеры
        // рисуют свою рамку выделения поверх ссылки
        mob.focus({ preventScroll: true });
      } else if (document.activeElement && mob.contains(document.activeElement)) {
        burger.focus();
      }
    }
    burger.addEventListener('click', function () { setNav(!document.body.classList.contains('nav-open')); });
    mob.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 720) setNav(false); });

    return bar;
  }
  var scrollbar = buildChrome();
  var navwrapEl = document.querySelector('.navwrap');
  var ambientEl = document.querySelector('.ambient');

  function onScrollProgress() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    scrollbar.style.transform = 'scaleX(' + (max > 0 ? h.scrollTop / max : 0) + ')';
    if (navwrapEl) navwrapEl.classList.toggle('scrolled', h.scrollTop > 24);
    // мягкий параллакс фона: золотистые пятна смещаются медленнее скролла → ощущение глубины
    if (ambientEl && !reduceMotion) {
      ambientEl.style.transform = 'translate3d(0,' + (h.scrollTop * 0.08).toFixed(1) + 'px,0)';
    }
  }

  /* ---------- parallax ---------- */
  var parallaxEls = [];
  function applyParallax() {
    var vh = window.innerHeight;
    for (var i = 0; i < parallaxEls.length; i++) {
      var el = parallaxEls[i];
      var host = el.closest('.bg-photo') || el.parentElement;
      var rect = host.getBoundingClientRect();
      var delta = (rect.top + rect.height / 2 - vh / 2);
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.5;
      var base = el.getAttribute('data-base-scale') || '1.12';
      el.style.transform = 'translate3d(0,' + (-delta * speed * 0.12).toFixed(2) + 'px,0) scale(' + base + ')';
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScrollProgress(); applyParallax(); ticking = false; });
  }

  /* ---------- reveal ---------- */
  // короткий акцентный импульс правой полоски с точками — как будто
  // она «выпускает» блок, который влетает на место
  var _railTimer = null;
  function pulseRail() {
    if (reduceMotion) return;
    var rail = document.querySelector('.dot-rail');
    if (!rail) return;
    rail.classList.remove('emit');
    // reflow, чтобы анимация перезапускалась при частых появлениях
    void rail.offsetWidth;
    rail.classList.add('emit');
    clearTimeout(_railTimer);
    _railTimer = setTimeout(function () { rail.classList.remove('emit'); }, 620);
  }

  function setupReveal() {
    var els = [].slice.call(document.querySelectorAll('.reveal'));
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); pulseRail(); io.unobserve(en.target); } });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var firstScreen = [];
    els.forEach(function (e) {
      // контент первого экрана проявляем сразу, не дожидаясь IntersectionObserver,
      // чтобы заголовки не «зависали» невидимыми; остальное — по скроллу
      if (e.getBoundingClientRect().top < vh * 0.9) { firstScreen.push(e); }
      else { io.observe(e); }
    });
    if (firstScreen.length) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { firstScreen.forEach(function (e) { e.classList.add('in'); }); });
      });
    }
  }

  /* ---------- word-by-word reveal ---------- */
  function wrapWords(root) {
    var idx = { n: 0 };
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var parts = ch.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (p === '') return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var w = document.createElement('span'); w.className = 'w';
            var inner = document.createElement('span'); inner.textContent = p;
            inner.style.transitionDelay = (idx.n * 0.045).toFixed(3) + 's';
            idx.n++; w.appendChild(inner); frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') {
          walk(ch);
        }
      });
    })(root);
  }
  function setupWordReveal() {
    var els = [].slice.call(document.querySelectorAll('[data-anim="words"]'));
    if (!els.length) return;
    els.forEach(function (el) { if (!el._wr) { el._wr = true; wrapWords(el); } el.classList.add('words-ready'); });
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.2 });
    els.forEach(function (e) { io.observe(e); });
  }

    /* ---------- page transition ---------- */
  function setupPageTransition() {
    if (reduceMotion) return;
    // браузер умеет нативные переходы между страницами (@view-transition в CSS) —
    // JS-шторка не нужна, иначе получится двойная анимация
    if (window.PageRevealEvent) return;
    var curtain = document.createElement('div');
    curtain.className = 'page-curtain';
    document.body.appendChild(curtain);
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return;
      var href = a.getAttribute('href'); if (!href) return;
      if (a.target === '_blank') return;
      if (href.charAt(0) === '#') return;
      if (/^(https?:|mailto:|tel:)/i.test(href)) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      try { sessionStorage.setItem('nav-veil', '1'); } catch (err) {}
      curtain.classList.add('show');
      setTimeout(function () { window.location.href = href; }, 470);
    });
  }

  /* ---------- counters ---------- */
  function setupCounters() {
    var els = [].slice.call(document.querySelectorAll('[data-count]'));
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, to = parseFloat(el.getAttribute('data-count')), dur = 1400, start = null;
        var prefix = el.getAttribute('data-prefix') || '', suffix = el.getAttribute('data-suffix') || '';
        function step(ts) {
          if (!start) start = ts;
          var t = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - t, 3);
          el.textContent = prefix + Math.round(to * e).toLocaleString('ru-RU') + suffix;
          if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- accordion ---------- */
  function setupAccordion() {
    document.querySelectorAll('[data-acc]').forEach(function (item) {
      var btn = item.querySelector('.acc-q'), panel = item.querySelector('.acc-a');
      if (!btn || !panel) return;
      btn.addEventListener('click', function () {
        var open = !item.classList.contains('open');
        document.querySelectorAll('[data-acc].open').forEach(function (o) {
          if (o !== item) { o.classList.remove('open'); o.querySelector('.acc-q').setAttribute('aria-expanded', 'false');  }
        });
        item.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  /* ---------- contact form + Telegram ---------- */
  function setupForm() {
    var form = document.getElementById('leadForm');
    if (!form) return;

    // момент загрузки формы — для отсечения мгновенных отправок ботами
    var formReadyAt = Date.now();

    var pkgParam = (location.search.match(/[?&]pkg=([^&]+)/) || [])[1];
    if (pkgParam) {
      var sel = form.querySelector('#f-pkg');
      var map = { landing: 'Лендинг — одна страница', multi: 'Многостраничный сайт' };
      if (sel && map[pkgParam]) sel.value = map[pkgParam];
    }

    var consent = form.querySelector('#f-consent');
    var submitBtn = form.querySelector('.c-submit');
    function syncConsent() {
      if (!submitBtn) return;
      var ok = !consent || consent.checked;
      submitBtn.disabled = !ok;
      if (ok && consent) {
        var lbl = consent.closest('.c-consent');
        if (lbl) lbl.classList.remove('invalid');
      }
    }
    if (consent) consent.addEventListener('change', syncConsent);
    syncConsent();

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // honeypot: скрытое поле, которое заполняют только боты
      var trap = form.querySelector('#f-website');
      if (trap && trap.value) { form.classList.add('sent'); return; }
      // слишком быстрая отправка (< 2 с) — почти наверняка бот
      if (Date.now() - formReadyAt < 2000) { form.classList.add('sent'); return; }

      var ok = true;
      var firstBad = null;
      ['#f-name', '#f-contact'].forEach(function (sel) {
        var f = form.querySelector(sel);
        if (!f || !f.value.trim()) {
          if (f) { f.classList.add('invalid'); f.setAttribute('aria-invalid', 'true'); firstBad = firstBad || f; }
          ok = false;
        } else { f.classList.remove('invalid'); f.removeAttribute('aria-invalid'); }
      });

      if (consent && !consent.checked) {
        var lbl = consent.closest('.c-consent');
        if (lbl) lbl.classList.add('invalid');
        ok = false;
      }

      // переводим фокус на первое незаполненное поле — иначе на скринридере
      // и с клавиатуры непонятно, почему форма не отправилась
      if (!ok) { if (firstBad) firstBad.focus(); return; }

      var btn = form.querySelector('.c-submit');
      var lbl2 = btn && btn.querySelector('.lbl');
      if (lbl2) lbl2.textContent = 'Отправляю';
      if (btn) { btn.disabled = true; btn.classList.add('loading'); }

      var get = function (id) { var el = form.querySelector(id); return el ? el.value.trim() : ''; };

      var msg = get('#f-msg');
      var domain = get('#f-domain');
      if (domain) msg = (msg ? msg + '\n' : '') + 'Домен: ' + domain;

      var payload = {
        // honeypot: функция уже проверяет поле company и молча отбрасывает
        // заявку, если оно заполнено, — но сайт его до сих пор не отправлял,
        // и серверная проверка не срабатывала ни разу. Живой человек это поле
        // не видит, заполняют его только боты.
        company: (form.querySelector('#f-website') || {}).value || '',
        name:  get('#f-name'),
        phone: '',
        tg:    get('#f-contact'),
        // Поле date в HUB — это дата съёмки. У заявки на сайт её нет,
        // а момент отправки и так виден в карточке, поэтому шлём прочерк:
        // иначе заявка попадала в «Сегодня» и обещала несуществующий срок.
        date:  '—',
        city:  'Казань',
        type:  get('#f-pkg') || '—',
        msg:   msg || '—'
      };

            (function () {
        var attempt = 0, maxAttempts = 3;
        function tryOnce() {
          attempt++;
          var controller = ('AbortController' in window) ? new AbortController() : null;
          var timer = setTimeout(function () { if (controller) controller.abort(); }, 20000);
          fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: JSON.stringify(payload),
            signal: controller ? controller.signal : undefined
          }).then(function (res) {
            return res.text().then(function (t) {
              clearTimeout(timer);
              if (res.ok && t.trim() === 'ok') {
                form.classList.add('sent');
                // honeypot: сервер отвечает 'ok' и ботам, но заявку не пишет —
                // пуш в этом случае будить не надо
                if (!payload.company) notifyGAS(payload.type, 'github');
              }
              else { retryOrFail(); }
            });
          }).catch(function () {
            clearTimeout(timer);
            retryOrFail();
          });
        }
        function retryOrFail() {
          if (attempt < maxAttempts) { setTimeout(tryOnce, 1500); }
          else {
            if (lbl2) lbl2.textContent = 'Ошибка — напишите в Telegram';
            if (btn) { btn.disabled = false; btn.classList.remove('loading'); }
          }
        }
        tryOnce();
      })();
    });
  }

  /* ---------- magnetic buttons ---------- */
  function setupMagnetic() {
    if (reduceMotion) return;
    if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('.btn').forEach(function (btn) {
      var strength = 16;
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2;
        var my = e.clientY - r.top - r.height / 2;
        btn.style.transition = 'transform .1s linear';
        btn.style.transform = 'translate(' + (mx / r.width * strength).toFixed(1) + 'px,' + (my / r.height * strength).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
        btn.style.transform = '';
      });
    });
  }

  /* ---------- portfolio cards hover ----------
     Чистый редакторский hover — плавный zoom и переход ч/б→цвет,
     тонкая рамка-линия; всё на CSS. 3D-наклон убран намеренно. */
  function setupTilt() { /* no-op: hover полностью на CSS */ }

  /* ---------- portfolio render ---------- */
  function renderPortfolio() {
    var grid = document.getElementById('portfolio-grid');
    if (!grid) return;
    // если работы уже есть в разметке (SEO / no-JS) — не перерисовываем, только оживляем
    if (!grid.querySelector('.m-item')) {
      grid.innerHTML = PORTFOLIO.map(function (p, i) {
        var n = (i + 1 < 10 ? '0' : '') + (i + 1);
        // есть разбор → внутренняя ссылка (та же вкладка, стрелка «вперёд»);
        // нет → живой сайт в новой вкладке (диагональная стрелка «наружу»)
        var toCase = !!p.caseUrl;
        var href = toCase ? p.caseUrl : p.href;
        var attrs = toCase ? '' : ' target="_blank" rel="noopener noreferrer"';
        var aria = toCase ? p.title + ' — смотреть разбор проекта' : p.title + ' — открыть сайт';
        var arrow = toCase
          ? '<path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
          : '<path d="M7 17L17 7M9 7h8v8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>';
        return '<a class="m-item ' + (p.size || '') + ' reveal" data-d="' + (i % 3) + '" ' +
          'href="' + href + '"' + attrs + ' aria-label="' + aria + '">' +
          '<span class="m-frame"><img src="' + p.src + '" alt="Сайт ' + p.title + ' — работа Антона Аванзато" loading="lazy" decoding="async">' +
          '<span class="m-arr" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none">' + arrow + '</svg></span></span>' +
          '<span class="m-meta"><span class="m-num">' + n + '</span>' +
          '<span class="m-txt"><b>' + p.title + '</b><i>' + p.desc + '</i></span></span></a>';
      }).join('');
    }
    setupReveal();
    setupTilt();
  }

  /* ---------- hero grid: реакция на курсор / наклон ---------- */
  function setupHeroGrid() {
    if (reduceMotion) return;
    var grid = document.querySelector('.hero-grid');
    var hero = document.querySelector('.hero');
    if (!grid || !hero) return;
    function setOrigin(px, py) {
      // px,py в диапазоне -1..1 → лёгкий сдвиг точки схода
      var x = 50 + Math.max(-1, Math.min(1, px)) * 12;
      var y = Math.max(-1, Math.min(1, py)) * 6;
      grid.style.perspectiveOrigin = x + '% ' + y + '%';
    }
    if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        setOrigin((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
      });
      hero.addEventListener('mouseleave', function () { grid.style.perspectiveOrigin = '50% 0%'; });
    } else if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', function (e) {
        if (e.gamma == null) return;
        setOrigin(e.gamma / 45, 0); // наклон влево/вправо
      });
    }
  }

  /* ---------- init ---------- */
  function setYear() {
    var y = String(new Date().getFullYear());
    document.querySelectorAll('.js-year').forEach(function (el) { el.textContent = y; });
  }

  function init() {
    // встречная шторка (класс ставится инлайн-скриптом в <head>):
    // ждём первую отрисовку и мягко её растворяем
    if (document.documentElement.classList.contains('arriving')) {
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        document.documentElement.classList.add('arrived');
        setTimeout(function () {
          document.documentElement.classList.remove('arriving', 'arrived');
        }, 600);
      }); });
    }
    setupHeroGrid();
    setYear();
    renderPortfolio();
    parallaxEls = [].slice.call(document.querySelectorAll('[data-parallax]'));
    setupReveal(); setupWordReveal(); setupCounters(); setupAccordion(); setupForm();
    setupMagnetic(); setupPageTransition();
    onScrollProgress(); applyParallax();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      parallaxEls = [].slice.call(document.querySelectorAll('[data-parallax]'));
      onScroll();
    }, { passive: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ============================================================
   AVANZATO — глобальный дизайн-ключ (на всех страницах):
   пилюля-навигация с брендом, лента точек, маркиза ключевиков
   ============================================================ */
(function () {
  'use strict';

  /* бренд слева внутри пилюли */
  (function () {
    var nav = document.querySelector('.navwrap .nav');
    if (!nav || nav.querySelector('.nav-brand')) return;
    var brand = document.createElement('a');
    brand.className = 'nav-brand';
    brand.href = 'index.html';
    brand.setAttribute('translate', 'no');
    brand.setAttribute('aria-label', 'Avanzato — на главную');
    var logo = document.createElement('img');
    logo.src = 'images/avanzato-logo-nav.png';
    logo.alt = 'Avanzato';
    logo.width = 1401; logo.height = 161;
    brand.appendChild(logo);
    nav.insertBefore(brand, nav.firstChild);
  })();

  /* SEO-ключевики: дублируем для бесшовной бегущей ленты */
  (function () {
    var list = document.querySelector('.seo-marquee .seo-tags');
    if (!list) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    [].slice.call(list.children).forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.className = 'clone';
      // клон — визуальный дубль: убираем его ссылки из фокуса, чтобы не было
      // двойного таб-порядка и дублей во внутренней перелинковке
      [].slice.call(c.querySelectorAll('a')).forEach(function (a) { a.setAttribute('tabindex', '-1'); });
      list.appendChild(c);
    });
  })();

  /* правая «лента» из точек — мини-карта, едет при скролле */
  (function () {
    if (document.querySelector('.dot-rail')) return;
    var isMobile = window.matchMedia && window.matchMedia('(max-width:820px)').matches;
    var COLS = isMobile ? 3 : 5;
    var COLORS = [
      '#d8d3c6', '#c4bdac', '#b0a890', '#9a9176', '#807862', '#cfcabd',
      '#e3ded2', '#a8a294', '#736d5c', '#5a5446', '#bdb6a4', '#cac3b2',
      '#3b3a34', '#1f1e1a', '#8c8472', '#d2ccbe', '#9d9683', '#b8b1a0'
    ];
    var ACCENTS = ['#ff4d00', '#e0b341', '#5b7a8c', '#7d6f9c', '#9c5a4a', '#5f7a5a'];

    var rail = document.createElement('div');
    rail.className = 'dot-rail';
    rail.setAttribute('aria-hidden', 'true');
    var track = document.createElement('div');
    track.className = 'dot-rail-track';
    var ROWS = 120, frag = document.createDocumentFragment();
    for (var i = 0; i < ROWS * COLS; i++) {
      var d = document.createElement('span');
      d.className = 'dot-rail-dot';
      var c = Math.random() < 0.15
        ? ACCENTS[(Math.random() * ACCENTS.length) | 0]
        : COLORS[(Math.random() * COLORS.length) | 0];
      d.style.background = c;
      if (Math.random() < 0.18) d.style.opacity = '0.45';
      frag.appendChild(d);
    }
    track.appendChild(frag);
    rail.appendChild(track);
    var cursor = document.createElement('div');
    cursor.className = 'dot-rail-cursor';
    rail.appendChild(cursor);
    var glass = document.createElement('div');
    glass.className = 'dot-rail-glass';
    rail.appendChild(glass);
    document.body.appendChild(rail);

    // Размеры кэшируем: чтение scrollHeight/offsetHeight в каждом кадре
    // заставляет браузер пересчитывать layout — на телефоне это и давало рывки.
    var maxScroll = 0, trackRange = 0, cursorRange = 0;
    function measure() {
      var h = document.documentElement;
      maxScroll = h.scrollHeight - h.clientHeight;
      trackRange = Math.max(0, track.scrollHeight - rail.clientHeight);
      cursorRange = Math.max(0, rail.clientHeight - cursor.offsetHeight);
    }

    var shown = 0, raf = 0, idleFrames = 0;
    // Событий scroll на iOS во время инерции приходит мало и неравномерно, поэтому
    // позицию не ждём от события, а сами читаем pageYOffset каждый кадр —
    // это дешёвое чтение без пересчёта layout — и плавно подтягиваем ленту.
    var smooth = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    function progress() {
      if (maxScroll <= 0) return 0;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      return Math.min(1, Math.max(0, y / maxScroll));
    }

    function apply() {
      track.style.transform = 'translate3d(0,' + (-shown * trackRange).toFixed(2) + 'px,0)';
      cursor.style.transform = 'translate3d(0,' + (shown * cursorRange).toFixed(2) + 'px,0)';
    }

    function frame() {
      var target = progress();
      var diff = target - shown;
      if (!smooth || Math.abs(diff) < 0.0002) {
        shown = target;
        // не гасим цикл сразу: после остановки пальца ещё идёт инерция
        if (++idleFrames > 40) { raf = 0; apply(); return; }
      } else {
        shown += diff * 0.22;
        idleFrames = 0;
      }
      apply();
      raf = requestAnimationFrame(frame);
    }

    function onScroll() {
      idleFrames = 0;
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function onResize() { measure(); onScroll(); }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onScroll, { passive: true });
    window.addEventListener('touchmove', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });
    // высота документа меняется по мере загрузки картинок и появления секций
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { measure(); onScroll(); });
      ro.observe(document.body);
    }
    window.addEventListener('load', onResize);
    measure();
    shown = progress();
    apply();
  })();
})();

/* ---------- Cookie notice ---------- */
(function () {
  var KEY = 'cookie-notice-ack';
  try { if (localStorage.getItem(KEY)) return; } catch (e) { return; }
  var note = document.createElement('div');
  note.className = 'cookie-note';
  note.setAttribute('role', 'region');
  note.setAttribute('aria-label', 'Уведомление об использовании cookie');
  note.innerHTML =
    '<div class="cookie-text">' +
      '<span class="cookie-eyebrow">Файлы cookie</span>' +
      '<p class="cookie-title">Немного заботы <em>о качестве.</em></p>' +
      '<p>Сайт использует cookie и аналитику, чтобы становиться удобнее. Оставаясь здесь, ' +
      'вы соглашаетесь с <a class="cookie-link" href="legal-privacy.html">политикой конфиденциальности</a>.</p>' +
    '</div>' +
    '<div class="cookie-actions">' +
      '<button type="button" class="btn btn-primary">Хорошо</button>' +
      '<a class="cookie-more" href="legal-privacy.html">Подробнее</a>' +
    '</div>';
  note.querySelector('button').addEventListener('click', function () {
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
    note.classList.remove('is-in');
    setTimeout(function () { note.remove(); }, 500);
  });
  document.body.appendChild(note);
  // ждём, пока отыграет вступительная анимация первого экрана,
  // чтобы баннер не добавлял движения в момент загрузки
  setTimeout(function () { note.classList.add('is-in'); }, 1800);
})();

/* ============================================================
   Яндекс.Метрика — цели (события конверсии)
   Без reachGoal счётчик пишет только визиты, а раздел
   «Конверсии» остаётся пустым. Ниже — базовый набор целей.
   Идентификаторы должны совпадать с целями типа «JavaScript-
   событие», созданными в интерфейсе Метрики.
   ============================================================ */
(function () {
  var COUNTER = 110095373;

  function goal(id, params) {
    if (typeof window.ym !== 'function') return;
    try { window.ym(COUNTER, 'reachGoal', id, params || {}); } catch (e) {}
  }
  // доступ снаружи — на случай ручных вызовов из разметки
  window.avGoal = goal;

  // --- клики по контактам и целевым кнопкам -----------------
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
    if (!a) return;
    var href = (a.getAttribute('href') || '').trim();
    var page = location.pathname.split('/').pop() || 'index.html';

    if (/^(tg:|https?:\/\/(t\.me|telegram\.me)\/)/i.test(href)) {
      goal('tg_click', { page: page });
    } else if (/^mailto:/i.test(href)) {
      goal('email_click', { page: page });
    } else if (/^tel:/i.test(href)) {
      goal('phone_click', { page: page });
    } else if (/(^|\/)contacts\.html/i.test(href)) {
      goal('cta_contacts', { page: page });
    } else if (/(^|\/)pricing\.html/i.test(href)) {
      goal('view_pricing', { page: page });
    } else if (/(^|\/)case-[a-z0-9-]+\.html/i.test(href)) {
      goal('open_case', { page: page });
    }
  }, true);

  // --- вовлечённость: глубокий скролл и время на странице ----
  var fired = {};
  function once(id) { if (fired[id]) return; fired[id] = 1; goal(id); }

  window.addEventListener('scroll', function () {
    var doc = document.documentElement;
    var total = doc.scrollHeight - window.innerHeight;
    if (total <= 0) return;
    var pct = (window.pageYOffset || doc.scrollTop) / total * 100;
    if (pct >= 50) once('scroll_50');
    if (pct >= 90) once('scroll_90');
  }, { passive: true });

  setTimeout(function () { once('time_60s'); }, 60000);
})();
