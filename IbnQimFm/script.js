/* ══════════════════════════════════════════════
   Ibn Qim FM — Islamic Radio JavaScript
   Audio Player, Navigation, Animations
   ══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── DOM Elements ──
  const audio = document.getElementById('radioAudio');
  const mainPlayBtn = document.getElementById('mainPlayBtn');
  const mainPlayIcon = document.getElementById('mainPlayIcon');
  const floatingPlayBtn = document.getElementById('floatingPlayBtn');
  const floatingPlayIcon = document.getElementById('floatingPlayIcon');
  const volumeSlider = document.getElementById('volumeSlider');
  const floatingVolumeSlider = document.getElementById('floatingVolumeSlider');
  const audioVisualizer = document.getElementById('audioVisualizer');
  const floatingPlayer = document.getElementById('floatingPlayer');
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');
  const backToTop = document.getElementById('backToTop');
  const playerStatus = document.getElementById('playerStatus');
  const playerStatusText = document.getElementById('playerStatusText');

  // ── SVG Icons ──
  const playIconSVG = `<path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>`;
  const pauseIconSVG = `<path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>`;

  let isPlaying = false;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;

  // ── Player Status Updates ──
  function setPlayerStatus(state, text) {
    playerStatus.classList.remove('loading', 'error');
    if (state === 'loading') {
      playerStatus.classList.add('loading');
    } else if (state === 'error') {
      playerStatus.classList.add('error');
    }
    playerStatusText.textContent = text;
  }

  // ── Audio Player Controls ──
  function togglePlay() {
    if (isPlaying) {
      audio.pause();
      updatePlayState(false);
      setPlayerStatus('default', 'بث مباشر على مدار الساعة');
    } else {
      setPlayerStatus('loading', 'جاري الاتصال بالبث...');
      reconnectAttempts = 0;
      audio.play().then(() => {
        updatePlayState(true);
        setPlayerStatus('live', 'بث مباشر على مدار الساعة');
      }).catch(err => {
        console.error('Error playing audio:', err);
        setPlayerStatus('error', 'تعذّر الاتصال بالبث');
      });
    }
  }

  function updatePlayState(playing) {
    isPlaying = playing;

    // Update main button icon
    mainPlayIcon.innerHTML = playing ? pauseIconSVG : playIconSVG;
    floatingPlayIcon.innerHTML = playing ? pauseIconSVG : playIconSVG;

    // Update visualizer
    if (playing) {
      audioVisualizer.classList.add('active');
    } else {
      audioVisualizer.classList.remove('active');
    }
  }

  mainPlayBtn.addEventListener('click', togglePlay);
  floatingPlayBtn.addEventListener('click', togglePlay);

  // ── Volume Control ──
  function setVolume(value) {
    const vol = value / 100;
    audio.volume = vol;
    volumeSlider.value = value;
    floatingVolumeSlider.value = value;

    // Update slider background fill
    updateSliderFill(volumeSlider, value);
    updateSliderFill(floatingVolumeSlider, value);
  }

  function updateSliderFill(slider, value) {
    const percentage = value;
    slider.style.background = `linear-gradient(to right, #c9a84c ${percentage}%, rgba(201, 168, 76, 0.2) ${percentage}%)`;
  }

  volumeSlider.addEventListener('input', (e) => setVolume(e.target.value));
  floatingVolumeSlider.addEventListener('input', (e) => setVolume(e.target.value));

  // Initialize volume
  setVolume(80);

  // ── Scroll Handler ──
  function handleScroll() {
    const currentScrollY = window.scrollY;

    // Navbar background
    if (currentScrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Floating player visibility
    const playerSection = document.getElementById('player');
    if (playerSection) {
      const playerRect = playerSection.getBoundingClientRect();
      if (playerRect.bottom < 0) {
        floatingPlayer.classList.add('show');
        document.body.classList.add('player-active');
      } else {
        floatingPlayer.classList.remove('show');
        document.body.classList.remove('player-active');
      }
    }

    // Back to top button
    if (currentScrollY > 600) {
      backToTop.classList.add('show');
    } else {
      backToTop.classList.remove('show');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });

  // ── Back to Top ──
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Mobile Navigation ──
  function openMobileNav() {
    navLinks.classList.add('open');
    navOverlay.classList.add('show');
    navToggle.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    navLinks.classList.remove('open');
    navOverlay.classList.remove('show');
    navToggle.classList.remove('active');
    document.body.style.overflow = '';
  }

  navToggle.addEventListener('click', () => {
    if (navLinks.classList.contains('open')) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  });

  navOverlay.addEventListener('click', closeMobileNav);

  // Close mobile nav on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });

  // Close mobile nav on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      closeMobileNav();
    }
  });

  // ── Scroll Reveal Animation ──
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ── Counter Animation ──
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target'), 10);
        animateCounter(el, target);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => counterObserver.observe(el));

  function animateCounter(el, target) {
    const duration = 1500;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(eased * target);
      el.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target;
      }
    }

    requestAnimationFrame(update);
  }

  // ── Smooth Scroll for Anchor Links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        const navHeight = navbar.offsetHeight;
        const targetPosition = targetEl.offsetTop - navHeight - 20;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ── Audio Error Handling with Retry ──
  audio.addEventListener('error', () => {
    if (isPlaying && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      setPlayerStatus('loading', `إعادة الاتصال... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
      setTimeout(() => {
        audio.load();
        audio.play().catch(() => {
          if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            updatePlayState(false);
            setPlayerStatus('error', 'تعذّر الاتصال — حاول مرة أخرى لاحقاً');
          }
        });
      }, 3000);
    } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      updatePlayState(false);
      setPlayerStatus('error', 'تعذّر الاتصال — حاول مرة أخرى لاحقاً');
    }
  });

  // Reset reconnect counter on successful play
  audio.addEventListener('playing', () => {
    reconnectAttempts = 0;
    setPlayerStatus('live', 'بث مباشر على مدار الساعة');
  });

  // ── Audio Events ──
  audio.addEventListener('pause', () => updatePlayState(false));
  audio.addEventListener('play', () => updatePlayState(true));

  // ── Dynamic Copyright Year ──
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

});

// ── Share Function ──
function shareRadio() {
  const shareData = {
    title: 'إذاعة ابن القيم السلفية',
    text: 'استمع إلى إذاعة ابن القيم السلفية — أثير واضح لسلفٍ صالح',
    url: window.location.href
  };

  if (navigator.share) {
    navigator.share(shareData).catch(err => {
      console.log('Share cancelled:', err);
    });
  } else {
    // Fallback: copy link to clipboard
    const copyToClipboard = () => {
      const btn = document.getElementById('shareBtn');
      const originalText = btn.innerHTML;
      btn.innerHTML = `
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
        </svg>
        تم نسخ الرابط!
      `;
      btn.style.background = '#2a8f5a';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
      }, 2500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(window.location.href).then(copyToClipboard).catch(() => {
        // Fallback for older browsers
        fallbackCopy();
      });
    } else {
      fallbackCopy();
    }
  }
}

function fallbackCopy() {
  const tempInput = document.createElement('input');
  tempInput.style.position = 'fixed';
  tempInput.style.opacity = '0';
  tempInput.value = window.location.href;
  document.body.appendChild(tempInput);
  tempInput.select();
  try {
    document.execCommand('copy');
    const btn = document.getElementById('shareBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = `
      <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
      </svg>
      تم نسخ الرابط!
    `;
    btn.style.background = '#2a8f5a';
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = '';
    }, 2500);
  } catch (e) {
    alert('تم نسخ رابط الإذاعة!');
  }
  document.body.removeChild(tempInput);
}
