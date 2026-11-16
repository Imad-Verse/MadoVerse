/* ==========================================================================
   تسهيل للعلوم الشرعية — Landing Page Script
   بدون أي مكتبات خارجية · يعمل بالكامل محلياً
   ========================================================================== */

(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const ICON = (id) =>
    `<svg class="icon" aria-hidden="true"><use href="#i-${id}"></use></svg>`;

  /* ── 1. Toast ──────────────────────────────────────────────────────────── */
  const toastRegion = $('#toast-region');

  function showToast(message, icon = 'check', duration = 3200) {
    if (!toastRegion) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `${ICON(icon)}<span></span>`;
    toast.querySelector('span').textContent = message;
    toastRegion.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('is-leaving');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
  }

  /* ── 2. Header scroll state + back-to-top ──────────────────────────────── */
  const header = $('#site-header');
  const toTop = $('#to-top');

  function onScroll() {
    const y = window.scrollY;
    header?.classList.toggle('is-scrolled', y > 24);
    toTop?.classList.toggle('is-visible', y > 600);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ── 3. Mobile drawer ──────────────────────────────────────────────────── */
  const drawer = $('#drawer');
  const menuToggle = $('#menu-toggle');

  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    menuToggle?.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('.drawer__close', drawer)?.focus();
  }

  menuToggle?.addEventListener('click', () => setDrawer(true));
  $$('[data-drawer-close]').forEach((el) => el.addEventListener('click', () => setDrawer(false)));
  $$('.drawer__link, .drawer .btn').forEach((el) => el.addEventListener('click', () => setDrawer(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer?.classList.contains('is-open')) {
      setDrawer(false);
      menuToggle?.focus();
    }
  });

  /* ── 4. Active nav link on scroll ──────────────────────────────────────── */
  const navLinks = $$('.nav__link');
  const sections = navLinks
    .map((link) => $(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) =>
            link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`)
          );
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((s) => navObserver.observe(s));
  }

  /* ── 5. Phone screen walkthrough (Hero) ────────────────────────────────── */
  const phoneScreen = $('[data-phone-slider]');
  if (phoneScreen) {
    const slides = $$('.phone__slide', phoneScreen);
    const tapEl = $('[data-phone-tap]', phoneScreen);

    // سيناريو التنقل بين شاشات التطبيق (screen1 -> screen15)
    const steps = [
      { duration: 1900, transition: 'fade', tap: null },                           // 1 -> 2 (فتح التطبيق للرئيسية)
      { duration: 1100, transition: 'hold', tap: null },                           // 2 -> 3 (ثبات الصفحة الرئيسية)
      { duration: 1500, transition: 'tab', tap: { x: '42%', y: '94%' } },          // 3 -> 4 (النقر على تبويب الشيوخ)
      { duration: 2400, transition: 'tab', tap: { x: '26%', y: '94%' } },          // 4 -> 5 (النقر على تبويب المحفوظات)
      { duration: 2400, transition: 'tab', tap: { x: '10%', y: '94%' } },          // 5 -> 6 (النقر على تبويب المزيد)
      { duration: 2400, transition: 'push', tap: { x: '71%', y: '94%' } },         // 6 -> 7 (الدخول لمتون العقيدة)
      { duration: 2400, transition: 'push', tap: { x: '50%', y: '26%' } },         // 7 -> 8 (اختيار متن الأصول الثلاثة)
      { duration: 2400, transition: 'push', tap: { x: '50%', y: '82%' } },         // 8 -> 9 (اختيار شرح الشيخ البدر)
      { duration: 2400, transition: 'push', tap: { x: '50%', y: '80%' } },         // 9 -> 10 (فتح الدرس الأول)
      { duration: 2400, transition: 'tab', tap: { x: '45%', y: '16%' } },          // 10 -> 11 (التبديل لمشاهدة الفيديو)
      { duration: 2400, transition: 'tab', tap: { x: '16%', y: '16%' } },          // 11 -> 12 (التبديل لكتاب المتن PDF)
      { duration: 2500, transition: 'pop', tap: { x: '90%', y: '7.5%' } },         // 12 -> 13 (الرجوع للمسارات التأصيلية)
      { duration: 2500, transition: 'push', tap: { x: '50%', y: '23%' } },         // 13 -> 14 (فتح الإحصائيات والإنجاز)
      { duration: 2400, transition: 'scroll', tap: { x: '50%', y: '68%', scroll: true } }, // 14 -> 15 (تمرير صفحة الإحصائيات للأسفل)
      { duration: 2600, transition: 'fade', tap: null },                           // 15 -> 1 (إعادة الجولة)
    ];

    let current = 0;
    let timer = null;
    let tapTimer = null;
    let cleanupTimer = null;
    let isAnimating = false;

    function preloadUpcoming(index) {
      for (let offset = 1; offset <= 2; offset++) {
        const target = slides[(index + offset) % slides.length];
        if (target && target.loading === 'lazy') {
          target.loading = 'eager';
        }
      }
    }

    function playTap(tapConfig, done) {
      if (!tapEl || !tapConfig) {
        done();
        return;
      }
      tapEl.classList.remove('is-tapping', 'is-scrolling');
      tapEl.style.setProperty('--tap-x', tapConfig.x);
      tapEl.style.setProperty('--tap-y', tapConfig.y);
      // إعادة تفعيل الحركة
      void tapEl.offsetWidth;
      tapEl.classList.add(tapConfig.scroll ? 'is-scrolling' : 'is-tapping');
      tapTimer = setTimeout(done, tapConfig.scroll ? 260 : 220);
    }

    function transitionTo(nextIndex, transitionType) {
      if (isAnimating || nextIndex === current) return;
      isAnimating = true;

      const prevSlide = slides[current];
      const nextSlide = slides[nextIndex];

      slides.forEach((s) => s.classList.remove('is-leaving', 'is-entering'));
      phoneScreen.dataset.transition = transitionType || 'push';

      prevSlide.classList.remove('is-active');
      prevSlide.classList.add('is-leaving');

      nextSlide.classList.add('is-active', 'is-entering');
      current = nextIndex;
      preloadUpcoming(current);

      clearTimeout(cleanupTimer);
      cleanupTimer = setTimeout(() => {
        prevSlide.classList.remove('is-leaving');
        nextSlide.classList.remove('is-entering');
        isAnimating = false;
      }, 740);
    }

    function scheduleNext() {
      clearTimeout(timer);
      if (slides.length < 2) return;
      const step = steps[current] || { duration: 2400, transition: 'push', tap: null };
      preloadUpcoming(current);

      timer = setTimeout(() => {
        if (document.hidden) {
          scheduleNext();
          return;
        }
        const nextIndex = (current + 1) % slides.length;
        playTap(step.tap, () => {
          transitionTo(nextIndex, step.transition);
          scheduleNext();
        });
      }, step.duration);
    }

    // السماح بالنقر على شاشة الهاتف للانتقال الفوري للصفحة التالية
    phoneScreen.addEventListener('click', () => {
      if (isAnimating) return;
      clearTimeout(timer);
      clearTimeout(tapTimer);
      // تخطي التكرار بين screen2 و screen3 عند النقر اليدوي
      const nextIndex = current === 1 ? 3 : (current + 1) % slides.length;
      const step = steps[current === 1 ? 2 : current] || { transition: 'push' };
      transitionTo(nextIndex, step.transition);
      scheduleNext();
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) scheduleNext();
    });

    scheduleNext();
  }

  /* ── 6. Reveal on scroll ───────────────────────────────────────────────── */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ── 6. Copy to clipboard ──────────────────────────────────────────────── */
  async function copyText(text, label) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      showToast(`تم نسخ ${label} بنجاح`);
    } catch (_) {
      showToast('تعذر النسخ التلقائي، يرجى النسخ يدوياً', 'info');
    }
  }

  $$('[data-copy]').forEach((btn) =>
    btn.addEventListener('click', () => copyText(btn.dataset.copy, btn.dataset.copyLabel || 'النص'))
  );

  /* ── 7. Download links & release manifest ──────────────────────────────── */
  function formatSize(bytes) {
    if (!bytes || bytes <= 0) return '—';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
  }

  function absoluteUrl(relative) {
    try {
      return new URL(relative, window.location.href).href;
    } catch (_) {
      return relative;
    }
  }

  function updateQr(apkUrl) {
    const qr = $('#apk-qr');
    if (!qr || !apkUrl || window.location.protocol === 'file:') return;
    qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&color=3E2723&data=${encodeURIComponent(
      absoluteUrl(apkUrl)
    )}`;
  }

  function setPlatform(platform, info) {
    const links = $$(`[data-dl="${platform}"]`);
    const available = Boolean(info && info.url);
    links.forEach((link) => {
      link.dataset.available = String(available);
      link.setAttribute('href', available ? info.url : '#download');
      if (available) link.setAttribute('download', info.file);
      else link.removeAttribute('download');
    });
    $$(`[data-size="${platform}"]`).forEach((el) => {
      el.textContent = available ? formatSize(info.size) : 'قريباً';
    });
    $$(`[data-file="${platform}"]`).forEach((el) => {
      el.textContent = available ? info.file : '—';
    });
  }

  // منع تنزيل غير متاح وعرض تنبيه «قريباً»
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-dl][data-available="false"]');
    if (!link) return;
    e.preventDefault();
    const name = link.dataset.dl === 'windows' ? 'ويندوز' : 'أندرويد';
    showToast(`نسخة ${name} قيد التجهيز وستتوفر قريباً بإذن الله`, 'info', 4200);
  });

  // تتبع بسيط للتنزيل (رسالة شكر)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-dl][data-available="true"]');
    if (!link) return;
    showToast('بدأ التنزيل… جزاك الله خيراً على نشر العلم', 'download', 3600);
  });

  async function probeCandidate(url) {
    try {
      const res = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
      if (!res.ok) return null;
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('text/html')) return null;
      const size = Number(res.headers.get('content-length') || 0);
      const file = decodeURIComponent(url.split('/').pop());
      return { file, url, size };
    } catch (_) {
      return null;
    }
  }

  async function loadManifest() {
    // القيم الافتراضية المضمّنة في الصفحة تعمل حتى دون هذا الملف
    const initialApk = $('[data-dl="android"]')?.getAttribute('href');
    updateQr(initialApk);

    if (window.location.protocol === 'file:') return;

    let currentVersion = '1.4.6';
    let hasWindows = false;

    try {
      const res = await fetch('download/version.json', { cache: 'no-cache' });
      if (res.ok) {
        const manifest = await res.json();
        if (manifest && manifest.version) {
          currentVersion = manifest.version;
          $$('[data-app-version]').forEach((el) => {
            el.textContent = `v${manifest.version}`;
          });

          if (manifest.android) {
            setPlatform('android', manifest.android);
            updateQr(manifest.android.url);
            if (manifest.android.updatedAt) {
              const date = new Date(manifest.android.updatedAt);
              const formatted = date.toLocaleDateString('ar', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              $$('[data-release-date]').forEach((el) => (el.textContent = formatted));
            }
          }

          if (manifest.windows && manifest.windows.url) {
            setPlatform('windows', manifest.windows);
            hasWindows = true;
          }
        }
      }
    } catch (err) {
      console.warn('[Tasheel] تعذر قراءة download/version.json — سيتم اعتماد القيم الافتراضية.', err);
    }

    // فحص تلقائي لملف ويندوز مضغوط (.zip) في مجلد download/ في حال إضافته مباشرة
    if (!hasWindows) {
      const zipCandidates = [
        `download/tasheel-v${currentVersion}-windows.zip`,
        `download/tasheel-windows-v${currentVersion}.zip`,
        `download/tasheel-v${currentVersion}.zip`,
        `download/tasheel-windows.zip`,
      ];
      for (const candidate of zipCandidates) {
        const found = await probeCandidate(candidate);
        if (found) {
          setPlatform('windows', found);
          break;
        }
      }
    }
  }

  loadManifest();

  /* ── 8. Footer year ────────────────────────────────────────────────────── */
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
