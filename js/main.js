/* =========================================================================
   合同会社MKT コーポレートサイト
   外部ライブラリ非依存（jQuery / Swiper 等なし）
   ========================================================================= */
(function () {
  'use strict';

  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     1. イントロ演出（同一セッション内は初回のみ）
     --------------------------------------------------------------------- */
  function initIntro() {
    var intro = document.getElementById('intro');
    if (!intro) return;

    var seen = false;
    try { seen = sessionStorage.getItem('mkt_intro') === '1'; } catch (e) { seen = false; }

    function finish() {
      intro.classList.add('is-done');
      body.classList.remove('is-intro');
      body.classList.add('is-ready');
    }

    if (seen || reduceMotion) {
      finish();
      return;
    }

    body.classList.add('is-intro');
    try { sessionStorage.setItem('mkt_intro', '1'); } catch (e) { /* noop */ }

    window.addEventListener('load', function () {
      // ロゴ・タグライン表示 → パネルが上へ開いて本編を見せる
      setTimeout(function () {
        intro.classList.add('is-open');
        body.classList.remove('is-intro');
        body.classList.add('is-ready');
      }, 1900);
      setTimeout(finish, 3200);
    });

    // 保険：load が来なくても 5 秒で解除する
    setTimeout(function () {
      if (!body.classList.contains('is-ready')) {
        intro.classList.add('is-open');
        body.classList.remove('is-intro');
        body.classList.add('is-ready');
        setTimeout(finish, 1300);
      }
    }, 5000);
  }

  /* ---------------------------------------------------------------------
     2. ヘッダー：スクロール量で状態を切り替え
     --------------------------------------------------------------------- */
  function initHeader() {
    var threshold = 200;
    var ticking = false;

    function update() {
      if (window.scrollY > threshold) body.classList.add('is-over');
      else body.classList.remove('is-over');
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------------------------------------------------------------------
     3. ハンバーガーメニュー
     --------------------------------------------------------------------- */
  function initNav() {
    var burger = document.getElementById('burger');
    var nav = document.getElementById('gnav');
    if (!burger || !nav) return;

    function close() {
      body.classList.remove('is-nav-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'メニューを開く');
    }
    function toggle() {
      var open = body.classList.toggle('is-nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    }

    burger.addEventListener('click', toggle);
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('is-nav-open')) close();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960) close();
    });
  }

  /* ---------------------------------------------------------------------
     4. スクロールリビール
     --------------------------------------------------------------------- */
  function initReveal() {
    var targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window) || reduceMotion) {
      Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-shown'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-shown');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------------
     5. キービジュアルのクロスフェード
     --------------------------------------------------------------------- */
  function initHero() {
    var pics = document.querySelectorAll('.hero__pic');
    if (pics.length < 2 || reduceMotion) return;

    var index = 0;
    setInterval(function () {
      pics[index].classList.remove('is-shown');
      index = (index + 1) % pics.length;
      // アニメーションを再生し直すためにクラスを付け直す
      var next = pics[index];
      next.style.animation = 'none';
      void next.offsetWidth;
      next.style.animation = '';
      next.classList.add('is-shown');
    }, 5000);
  }

  /* ---------------------------------------------------------------------
     6. 数字のカウントアップ
     --------------------------------------------------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll('.count');
    if (!counters.length) return;

    function run(el) {
      var goal = parseFloat(el.getAttribute('data-count'));
      if (isNaN(goal)) return;
      if (reduceMotion) { el.textContent = String(goal); return; }

      var duration = 1500;
      var start = null;

      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(goal * eased));
        if (p < 1) window.requestAnimationFrame(step);
        else el.textContent = String(goal);
      }
      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(counters, run);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    Array.prototype.forEach.call(counters, function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------------
     7. 多角化事業カルーセル（scroll-snap ＋ 進捗バー）
     --------------------------------------------------------------------- */
  function initCarousel() {
    var scroller = document.querySelector('.sub__scroller');
    var list = document.getElementById('subList');
    var prev = document.getElementById('subPrev');
    var next = document.getElementById('subNext');
    var bar = document.getElementById('subBar');
    if (!scroller || !list) return;

    function step() {
      var card = list.querySelector('.sub__card');
      if (!card) return 300;
      var styles = window.getComputedStyle(list);
      var gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
      return card.getBoundingClientRect().width + gap;
    }

    function updateBar() {
      if (!bar) return;
      var max = scroller.scrollWidth - scroller.clientWidth;
      var ratio = scroller.clientWidth / scroller.scrollWidth;
      bar.style.width = Math.max(ratio * 100, 12) + '%';
      var progress = max > 0 ? scroller.scrollLeft / max : 0;
      var travel = (100 / Math.max(ratio * 100, 12)) * 100 - 100;
      bar.style.transform = 'translateX(' + (progress * travel) + '%)';

      if (prev) prev.disabled = scroller.scrollLeft <= 1;
      if (next) next.disabled = scroller.scrollLeft >= max - 1;
    }

    if (prev) prev.addEventListener('click', function () {
      scroller.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    if (next) next.addEventListener('click', function () {
      scroller.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    scroller.addEventListener('scroll', function () {
      window.requestAnimationFrame(updateBar);
    }, { passive: true });
    window.addEventListener('resize', updateBar);
    updateBar();

    /* ドラッグ横スクロール（PC） */
    var isDown = false, startX = 0, startScroll = 0;
    scroller.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      isDown = true;
      startX = e.clientX;
      startScroll = scroller.scrollLeft;
      scroller.style.cursor = 'grabbing';
      scroller.style.scrollSnapType = 'none';
    });
    window.addEventListener('pointerup', function () {
      if (!isDown) return;
      isDown = false;
      scroller.style.cursor = '';
      scroller.style.scrollSnapType = '';
    });
    window.addEventListener('pointermove', function (e) {
      if (!isDown) return;
      scroller.scrollLeft = startScroll - (e.clientX - startX);
    });
  }

  /* ---------------------------------------------------------------------
     8. 経営方針アコーディオン（1つだけ開く）
     --------------------------------------------------------------------- */
  function initAccordion() {
    var list = document.getElementById('policyList');
    if (!list) return;
    var items = list.querySelectorAll('details');
    Array.prototype.forEach.call(items, function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        Array.prototype.forEach.call(items, function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     9. アンカーリンクの固定ヘッダー分オフセット
     --------------------------------------------------------------------- */
  function initAnchors() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();

      var headerH = document.querySelector('.l-header');
      var offset = headerH ? headerH.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - offset + 1;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  }

  /* ---------------------------------------------------------------------
     10. お問い合わせフォーム（送信先未設定のガード）
     --------------------------------------------------------------------- */
  function initForm() {
    var form = document.querySelector('.contact__form');
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

  /* --------------------------------------------------------------------- */
  function init() {
    initIntro();
    initHeader();
    initNav();
    initReveal();
    initHero();
    initCounters();
    initCarousel();
    initAccordion();
    initAnchors();
    initForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
