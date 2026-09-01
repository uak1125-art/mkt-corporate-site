/* =========================================================================
   合同会社MKT コーポレートサイト
   外部ライブラリ非依存。スクロール連動処理は1本のrAFループに集約している。
   ========================================================================= */
(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  var vh = window.innerHeight;
  var vw = window.innerWidth;
  var scrollY = window.scrollY;
  var lastY = scrollY;
  var velocity = 0;

  /* =======================================================================
     1. ローダー（同一セッション初回のみ）
     ======================================================================= */
  function initLoader() {
    var loader = doc.getElementById('loader');
    var num = doc.getElementById('loaderNum');
    if (!loader) return;

    var seen = false;
    try { seen = sessionStorage.getItem('mkt_ld') === '1'; } catch (e) {}

    function done() {
      loader.classList.add('is-done');
      body.classList.add('is-ready');
    }
    if (seen || reduce) { done(); return; }

    try { sessionStorage.setItem('mkt_ld', '1'); } catch (e) {}
    body.classList.add('is-loading');

    var n = 0;
    var timer = setInterval(function () {
      n += Math.random() * 13 + 5;
      if (n >= 100) { n = 100; clearInterval(timer); open(); }
      if (num) num.textContent = String(Math.floor(n));
    }, 90);

    var opened = false;
    function open() {
      if (opened) return;
      opened = true;
      setTimeout(function () {
        loader.classList.add('is-open');
        body.classList.remove('is-loading');
        body.classList.add('is-ready');
      }, 380);
      setTimeout(done, 1900);
    }
    setTimeout(open, 5000); // 保険
  }

  /* =======================================================================
     2. リビール（data-anim）
     ======================================================================= */
  function initReveal() {
    var targets = doc.querySelectorAll('[data-anim]');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window) || reduce) {
      Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }

  /* =======================================================================
     3. 数字の桁ロール
     ======================================================================= */
  function initRoll() {
    var items = doc.querySelectorAll('[data-roll]');
    if (!items.length) return;

    Array.prototype.forEach.call(items, function (el) {
      var digits = el.getAttribute('data-roll').split('');
      var roll = doc.createElement('span');
      roll.className = 'roll';

      digits.forEach(function (d, i) {
        var col = doc.createElement('span');
        col.className = 'roll__col';
        for (var r = 0; r < 20; r++) {
          var b = doc.createElement('b');
          b.textContent = String(r % 10);
          col.appendChild(b);
        }
        col.setAttribute('data-d', d);
        col.style.transitionDelay = (i * 0.09) + 's';
        roll.appendChild(col);
      });
      el.insertBefore(roll, el.firstChild);
    });

    function run(el) {
      var cols = el.querySelectorAll('.roll__col');
      Array.prototype.forEach.call(cols, function (col) {
        var d = parseInt(col.getAttribute('data-d'), 10) || 0;
        col.style.transform = 'translateY(-' + ((10 + d) * 5) + '%)';
      });
    }

    if (!('IntersectionObserver' in window) || reduce) {
      Array.prototype.forEach.call(items, run);
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* =======================================================================
     4. ヒーローの写真クロスフェード
     ======================================================================= */
  function initHero() {
    var pics = doc.querySelectorAll('.hero__pic');
    if (pics.length < 2 || reduce) return;
    var i = 0;
    setInterval(function () {
      pics[i].classList.remove('is-on');
      i = (i + 1) % pics.length;
      var next = pics[i];
      next.style.animation = 'none';
      void next.offsetWidth;
      next.style.animation = '';
      next.classList.add('is-on');
    }, 5600);
  }

  /* =======================================================================
     5. 大分の現在時刻（JST）
     ======================================================================= */
  function initClock() {
    var el = doc.getElementById('clock');
    if (!el) return;
    function tick() {
      var t = new Date().toLocaleTimeString('ja-JP', {
        timeZone: 'Asia/Tokyo', hour12: false,
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      el.textContent = t + ' JST';
    }
    tick();
    setInterval(tick, 1000);
  }

  /* =======================================================================
     6. ナビゲーション
     ======================================================================= */
  function initNav() {
    var burger = doc.getElementById('burger');
    var nav = doc.getElementById('gnav');
    if (!burger || !nav) return;

    function close() {
      body.classList.remove('is-nav');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'メニューを開く');
    }
    burger.addEventListener('click', function () {
      var open = body.classList.toggle('is-nav');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('is-nav')) close();
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 960) close(); });
  }

  /* =======================================================================
     7. 経営方針アコーディオン（1つだけ開く）
     ======================================================================= */
  function initAccordion() {
    var items = doc.querySelectorAll('.pl__item');
    Array.prototype.forEach.call(items, function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        Array.prototype.forEach.call(items, function (o) { if (o !== item) o.open = false; });
      });
    });
  }

  /* =======================================================================
     8. カスタムカーソル（PCのみ）
     ======================================================================= */
  function initCursor() {
    var cur = doc.getElementById('cursor');
    if (!cur || !finePointer || vw <= 960 || reduce) return;

    var label = cur.querySelector('.cursor__label');
    var x = vw / 2, y = vh / 2, cx = x, cy = y;

    doc.addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY;
      cur.classList.add('is-on');
    });
    doc.addEventListener('mouseleave', function () { cur.classList.remove('is-on'); });

    var hoverSel = 'a, button, [data-cursor], summary, input, select, textarea';
    doc.addEventListener('mouseover', function (e) {
      var t = e.target.closest(hoverSel);
      if (!t) return;
      cur.classList.add('is-hover');
      if (label) label.textContent = t.getAttribute('data-cursor') || '';
    });
    doc.addEventListener('mouseout', function (e) {
      if (e.target.closest(hoverSel)) {
        cur.classList.remove('is-hover');
        if (label) label.textContent = '';
      }
    });

    (function loop() {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      cur.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }

  /* =======================================================================
     9. スクロール連動（1本のrAFループ）
        ヘッダー / パララックス / マーキー / 横スクロール / 理念の切り替え
     ======================================================================= */
  function initScroll() {
    var header = doc.querySelector('.hd');
    var parallax = Array.prototype.slice.call(doc.querySelectorAll('[data-parallax]'));
    var mqTrack = doc.getElementById('mqTrack');
    var hs = doc.querySelector('.hs');
    var hsTrack = doc.getElementById('hsTrack');
    var hsBar = doc.getElementById('hsBar');
    var ph = doc.querySelector('.ph');
    var phPanels = doc.querySelectorAll('.ph__panel');
    var phDots = doc.querySelectorAll('.ph__dots span');
    var bzItems = doc.querySelectorAll('.bz__item');
    var bzNum = doc.getElementById('bzNum');

    var mqX = 0;
    var isMobile = vw <= 960;
    var hsMax = 0;

    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

    /* 横スクロールセクション：実際の移動距離からセクションの高さを逆算する。
       高さを固定すると、画面幅によって「長いのに動かない」状態が起きるため。 */
    function layoutHs() {
      if (!hs || !hsTrack) return;
      if (isMobile || reduce) { hs.style.height = ''; hsTrack.style.transform = ''; return; }
      /* --pad は clamp() のまま返るため数値化できない。実際に適用済みの値を要素から読む */
      var pin = hs.querySelector('.hs__pin');
      var pad = pin ? (parseFloat(getComputedStyle(pin).paddingLeft) || 40) : 40;
      hsMax = Math.max(hsTrack.scrollWidth + pad * 2 - vw, 0);
      hs.style.height = (vh + hsMax * 1.25) + 'px';
    }
    layoutHs();

    function frame() {
      var y = window.scrollY;
      velocity = y - lastY;
      lastY = y;
      scrollY = y;

      /* ヘッダー */
      if (y > 60) body.classList.add('is-scrolled');
      else body.classList.remove('is-scrolled');

      if (!body.classList.contains('is-nav')) {
        if (velocity > 4 && y > 500) body.classList.add('is-hidden-hd');
        else if (velocity < -4) body.classList.remove('is-hidden-hd');
      }

      /* パララックス */
      if (!reduce) {
        for (var i = 0; i < parallax.length; i++) {
          var el = parallax[i];
          var r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) continue;
          var speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
          var offset = (r.top + r.height / 2 - vh / 2) * -speed;
          var isImg = el.tagName === 'IMG';
          el.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px,0)' + (isImg ? ' scale(1.16)' : '');
        }
      }

      /* マーキー（スクロール速度で加速） */
      if (mqTrack && !reduce) {
        mqX -= 0.55 + Math.min(Math.abs(velocity) * 0.09, 7);
        var unit = mqTrack.scrollWidth / 3;
        if (unit > 0 && Math.abs(mqX) >= unit) mqX += unit;
        mqTrack.style.transform = 'translate3d(' + mqX.toFixed(2) + 'px,0,0)';
      }

      /* 横スクロールセクション */
      if (hs && hsTrack && !isMobile && !reduce && hsMax > 0) {
        var hr = hs.getBoundingClientRect();
        var total = hs.offsetHeight - vh;
        var p = clamp((-hr.top) / (total || 1), 0, 1);
        hsTrack.style.transform = 'translate3d(' + (-p * hsMax).toFixed(2) + 'px,0,0)';
        if (hsBar) hsBar.style.width = (p * 100).toFixed(2) + '%';
      }

      /* 理念：進行度でパネル切り替え */
      if (ph && phPanels.length && !isMobile && !reduce) {
        var pr = ph.getBoundingClientRect();
        var ptotal = ph.offsetHeight - vh;
        var pp = clamp((-pr.top) / (ptotal || 1), 0, 1);
        var idx = pp < 0.45 ? 0 : 1;
        for (var k = 0; k < phPanels.length; k++) {
          phPanels[k].classList.toggle('is-on', k === idx);
          if (phDots[k]) phDots[k].classList.toggle('is-on', k === idx);
        }
      }

      /* 事業セクションの番号 */
      if (bzNum && bzItems.length) {
        var current = null;
        for (var m = 0; m < bzItems.length; m++) {
          var br = bzItems[m].getBoundingClientRect();
          if (br.top < vh * 0.6) current = bzItems[m].getAttribute('data-bz');
        }
        if (current && bzNum.textContent !== current) bzNum.textContent = current;
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    window.addEventListener('resize', function () {
      vh = window.innerHeight;
      vw = window.innerWidth;
      isMobile = vw <= 960;
      layoutHs();
    }, { passive: true });
    window.addEventListener('load', layoutHs);
  }

  /* =======================================================================
     10. アンカーリンク（固定ヘッダー分オフセット）
     ======================================================================= */
  function initAnchors() {
    doc.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = doc.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var hd = doc.querySelector('.hd');
      var top = target.getBoundingClientRect().top + window.scrollY - (hd ? hd.offsetHeight : 0) + 1;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  }

  /* =======================================================================
     11. フォーム（送信先未設定のガード）
     ======================================================================= */
  function initForm() {
    var form = doc.querySelector('.ct__form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      var action = form.getAttribute('action');
      if (!action || action === '#') {
        e.preventDefault();
        if (!form.reportValidity()) return;
        window.alert('現在フォームの送信先が未設定です。\nお手数ですが 097-594-4466 までお電話ください。');
      }
    });
  }

  /* ----------------------------------------------------------------------- */
  function init() {
    initLoader();
    initReveal();
    initRoll();
    initHero();
    initClock();
    initNav();
    initAccordion();
    initCursor();
    initScroll();
    initAnchors();
    initForm();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})();
