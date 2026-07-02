// ===== Preloader =====
const preloader = document.getElementById('preloader');
let preloaderTimeout;

function hidePreloader() {
  if (preloader && !preloader.classList.contains('hidden')) {
    // Elegant minor shrink animation on logo during exit
    const logo = preloader.querySelector('.preloader-logo');
    if (logo) {
      logo.style.transform = 'scale(0.8)';
    }
    preloader.classList.add('hidden');
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500); // matching the css transition duration
  }
}

if (document.readyState === 'complete') {
  // Page is already fully loaded
  setTimeout(hidePreloader, 600);
} else {
  // Page is still loading, set fallback timeout (max 3 seconds)
  preloaderTimeout = setTimeout(hidePreloader, 3000);
  
  window.addEventListener('load', () => {
    if (preloaderTimeout) clearTimeout(preloaderTimeout);
    // Smooth branding showcase delay before fading out
    setTimeout(hidePreloader, 850);
  });
}

// ===== Navbar Scroll Effect =====
const navbar = document.getElementById('navbar');
const scrollTopBtn = document.getElementById('scrollTopBtn');

// ===== Scroll Progress Bar =====
const scrollProgressBar = document.getElementById('scrollProgress');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;

  // Navbar background
  if (scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  // Scroll to top button
  if (scrollY > 400) {
    scrollTopBtn.classList.add('visible');
  } else {
    scrollTopBtn.classList.remove('visible');
  }

  // Scroll progress bar
  if (scrollProgressBar) {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    scrollProgressBar.style.width = `${progress}%`;
  }

  // Active nav link
  updateActiveNavLink();
});

// ===== Scroll to Top =====
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== Mobile Menu =====
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const navOverlay = document.getElementById('navOverlay');

function toggleMenu() {
  menuToggle.classList.toggle('active');
  navLinks.classList.toggle('active');
  navOverlay.classList.toggle('active');
  document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
}

menuToggle.addEventListener('click', toggleMenu);
navOverlay.addEventListener('click', toggleMenu);

// Close menu on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    if (navLinks.classList.contains('active')) {
      toggleMenu();
    }
  });
});

// ===== Active Nav Link on Scroll =====
function updateActiveNavLink() {
  const navLinksAll = document.querySelectorAll('.nav-links a:not(.nav-cta)');
  const linkedSectionIds = Array.from(navLinksAll).map(link => {
    const href = link.getAttribute('href');
    return href.startsWith('#') ? href.substring(1) : null;
  }).filter(Boolean);

  const sections = Array.from(document.querySelectorAll('section[id]')).filter(section => 
    linkedSectionIds.includes(section.getAttribute('id'))
  );

  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 110;
    if (window.scrollY >= sectionTop) {
      current = section.getAttribute('id');
    }
  });

  // Handle edge case when at bottom of page
  if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 10) {
    if (sections.length > 0) {
      current = sections[sections.length - 1].getAttribute('id');
    }
  }

  navLinksAll.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

// ===== Scroll Animations (Intersection Observer) =====
const observerOptions = {
  root: null,
  rootMargin: '0px 0px -80px 0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Add stagger effect for grid children
      const children = entry.target.querySelectorAll('.service-card, .project-card, .blog-card, .contact-card');
      children.forEach((child, index) => {
        child.style.animationDelay = `${index * 0.1}s`;
        child.style.opacity = '0';
        child.style.transform = 'translateY(30px)';
        setTimeout(() => {
          child.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
          child.style.opacity = '1';
          child.style.transform = 'translateY(0)';
        }, index * 120);
      });
      // Stop observing once visible to prevent flickering on re-scroll
      obs.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
  observer.observe(el);
});

// ===== Audio & Haptic Feedback Helpers =====
function playSuccessSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    // Gentle chime: Note C5 (523Hz) slide to E5 (659Hz)
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);
    
    // Smooth volume fade envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (error) {
    console.warn("Audio playback context failed to initialize:", error);
  }
}

function triggerHapticFeedback() {
  if (navigator && typeof navigator.vibrate === 'function') {
    // Elegant quick double vibration
    navigator.vibrate([80, 50, 80]);
  }
}

// ===== Contact Form - WhatsApp =====
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('clientName').value.trim();
  const serviceSelect = document.getElementById('serviceType');
  const service = serviceSelect.options[serviceSelect.selectedIndex].text;
  const description = document.getElementById('projectDesc').value.trim();

  if (!name || !service || !description) {
    const errorText = (translations[currentLang] && translations[currentLang]['notif-error']) || 'يرجى ملء جميع الحقول المطلوبة';
    showNotification(errorText, 'error');
    // Shake the submit button to alert user
    const submitBtn = contactForm.querySelector('.btn-whatsapp-send');
    submitBtn.classList.add('shake');
    setTimeout(() => submitBtn.classList.remove('shake'), 600);
    return;
  }

  // Compile message in selected language
  const template = (translations[currentLang] && translations[currentLang]['wa-msg-title']) || 'الاسم: {name}\nالخدمة: {service}\nالوصف: {description}';
  const message = template
    .replace('{name}', name)
    .replace('{service}', service)
    .replace('{description}', description);

  const encodedMessage = encodeURIComponent(message);
  const whatsappURL = `https://api.whatsapp.com/send/?phone=213657565256&text=${encodedMessage}`;

  // Open WhatsApp immediately (synchronous user gesture) to avoid popup blocker
  window.open(whatsappURL, '_blank');

  // Animation & Feedback on submit button
  const submitBtn = contactForm.querySelector('.btn-whatsapp-send');
  const originalBtnHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  const loadingText = (translations[currentLang] && translations[currentLang]['btn-submit-loading']) || 'جاري التحويل...';
  submitBtn.innerHTML = `<i class="fas fa-check-circle"></i> ${loadingText}`;

  // Show success notification
  const successText = (translations[currentLang] && translations[currentLang]['notif-success']) || 'جاري فتح الواتساب...';
  showNotification(successText, 'success');

  // Trigger audio and haptic feedback
  playSuccessSound();
  triggerHapticFeedback();

  // Restore button state after visual feedback
  setTimeout(() => {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHTML;
    contactForm.reset();
    // Reset character counter if present
    const charCounter = document.getElementById('charCounter');
    if (charCounter) charCounter.textContent = '0 / 500';
  }, 1500);
});

// ===== Notification System =====
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;

  // Determine direction
  const isLTR = document.documentElement.getAttribute('dir') === 'ltr';

  // Styles
  Object.assign(notification.style, {
    position: 'fixed',
    top: '24px',
    [isLTR ? 'right' : 'right']: isLTR ? 'auto' : '24px',
    [isLTR ? 'left' : 'left']: isLTR ? 'auto' : 'auto',
    zIndex: '10000',
    padding: '16px 24px',
    borderRadius: '12px',
    background: type === 'success' ? 'rgba(37, 211, 102, 0.15)' : type === 'error' ? 'rgba(230, 57, 70, 0.15)' : 'rgba(0, 136, 204, 0.15)',
    border: `1px solid ${type === 'success' ? 'rgba(37, 211, 102, 0.3)' : type === 'error' ? 'rgba(230, 57, 70, 0.3)' : 'rgba(0, 136, 204, 0.3)'}`,
    color: type === 'success' ? '#25d366' : type === 'error' ? '#ff4d5e' : '#0088cc',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    transform: isLTR ? 'translateX(-120%)' : 'translateX(120%)',
    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: isLTR ? "'Outfit', sans-serif" : "'Tajawal', sans-serif",
    fontSize: '0.95rem',
    fontWeight: '600',
    maxWidth: '380px',
    direction: isLTR ? 'ltr' : 'rtl'
  });

  // Position on correct side
  if (isLTR) {
    notification.style.left = '24px';
    notification.style.right = 'auto';
  } else {
    notification.style.right = '24px';
    notification.style.left = 'auto';
  }

  const notifContent = notification.querySelector('.notification-content');
  Object.assign(notifContent.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  });

  document.body.appendChild(notification);

  // Animate in
  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(0)';
  });

  // Auto remove
  setTimeout(() => {
    notification.style.transform = isLTR ? 'translateX(-120%)' : 'translateX(120%)';
    setTimeout(() => notification.remove(), 500);
  }, 4000);
}

// ===== Smooth Scroll for Anchor Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ===== Counter Animation for Stats =====
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number');
  counters.forEach(counter => {
    const target = counter.innerText;
    const hasPlus = target.includes('+');
    const hasPercent = target.includes('%');
    const numericValue = parseInt(target.replace(/[^0-9]/g, ''));

    if (isNaN(numericValue)) return;

    let current = 0;
    const duration = 2000;
    const step = Math.ceil(numericValue / (duration / 16));

    const updateCounter = () => {
      current += step;
      if (current >= numericValue) {
        current = numericValue;
        counter.innerText = (hasPlus ? '+' : '') + current + (hasPercent ? '%' : '');
        return;
      }
      counter.innerText = (hasPlus ? '+' : '') + current + (hasPercent ? '%' : '');
      requestAnimationFrame(updateCounter);
    };

    // Reset and start
    counter.innerText = (hasPlus ? '+' : '') + '0' + (hasPercent ? '%' : '');
    updateCounter();
  });
}

// Trigger counter animation when hero is visible
const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setTimeout(animateCounters, 500);
      heroObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  heroObserver.observe(heroStats);
}

// ===== Parallax Particles =====
document.addEventListener('mousemove', (e) => {
  const particles = document.querySelectorAll('.particle');
  const mouseX = e.clientX / window.innerWidth;
  const mouseY = e.clientY / window.innerHeight;

  particles.forEach((particle, index) => {
    const speed = (index + 1) * 0.5;
    const x = (mouseX - 0.5) * speed * 30;
    const y = (mouseY - 0.5) * speed * 30;
    particle.style.transform = `translate(${x}px, ${y}px)`;
  });
});

// ===== Image Error Handling =====
document.querySelectorAll('.project-image img').forEach(img => {
  // If the image already failed to load before JS executed
  if (img.complete && img.naturalWidth === 0) {
    handleImageError(img);
  } else {
    img.addEventListener('error', function() {
      handleImageError(this);
    });
  }
});

function handleImageError(img) {
  if (!img.dataset.errorHandled) {
    img.dataset.errorHandled = 'true';
    img.style.display = 'none';
    const parent = img.parentElement;
    const fallback = document.createElement('div');
    fallback.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;background:rgba(230,57,70,0.08);width:100%;height:100%;';
    fallback.innerHTML = '<i class="fas fa-laptop-code" style="font-size:3rem;color:var(--primary);opacity:0.5;"></i>';
    parent.insertBefore(fallback, img);
  }
}

// ===== Typing Effect for Hero Badge (subtle) =====
const heroBadge = document.querySelector('.hero-badge');
if (heroBadge) {
  setInterval(() => {
    heroBadge.style.borderColor = 'rgba(37, 211, 102, 0.4)';
    setTimeout(() => {
      heroBadge.style.borderColor = 'rgba(230, 57, 70, 0.2)';
    }, 1000);
  }, 3000);
}

// ===== Translation & Language Toggle =====
let currentLang = localStorage.getItem('madoverse_lang') || 'ar';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('madoverse_lang', lang);
  
  // Set HTML attributes
  const html = document.documentElement;
  html.setAttribute('lang', lang);
  html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  // Update Document title & description
  if (translations[lang]) {
    if (translations[lang]['doc-title']) {
      document.title = translations[lang]['doc-title'];
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && translations[lang]['doc-desc']) {
      metaDesc.setAttribute('content', translations[lang]['doc-desc']);
    }
  }
  
  // Update switcher text
  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.querySelector('span').innerText = lang === 'ar' ? 'EN' : 'عربي';
  }
  
  // Translate static text elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      if (translations[lang][key].includes('<strong') || translations[lang][key].includes('<span')) {
        el.innerHTML = translations[lang][key];
      } else {
        el.textContent = translations[lang][key];
      }
    }
  });
  
  // Translate form placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang] && translations[lang][key]) {
      el.setAttribute('placeholder', translations[lang][key]);
    }
  });

  // Translate tooltip titles
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (translations[lang] && translations[lang][key]) {
      el.setAttribute('title', translations[lang][key]);
      el.setAttribute('aria-label', translations[lang][key]);
    }
  });
}

// ===== Working Hours Live Indicator =====
function updateWorkingStatus() {
  const now = new Date();
  
  // Calculate UTC+1 time (Algeria timezone, constant offset)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const algeriaTime = new Date(utc + (3600000 * 1)); 
  
  const day = algeriaTime.getDay(); // 0 is Sunday, 5 is Friday
  const hour = algeriaTime.getHours();
  
  // Check if open: Sunday to Thursday, Saturday (0, 1, 2, 3, 4, 6) from 8:00 AM to 4:00 PM (16:00)
  const isFriday = (day === 5);
  const isOpen = !isFriday && (hour >= 8 && hour < 16);

  // Get elements
  const heroBadgeDot = document.getElementById('heroBadgeDot');
  const heroBadgeText = document.getElementById('heroBadgeText');
  const hoursLiveBadge = document.getElementById('hoursLiveBadge');

  if (isOpen) {
    if (heroBadgeDot) {
      heroBadgeDot.style.color = '#25d366';
      heroBadgeDot.style.textShadow = '0 0 10px rgba(37, 211, 102, 0.6)';
    }
    if (heroBadgeText) {
      heroBadgeText.setAttribute('data-i18n', 'hero-badge-open');
      const text = translations[currentLang] && translations[currentLang]['hero-badge-open'];
      if (text) heroBadgeText.textContent = text;
    }
    if (hoursLiveBadge) {
      hoursLiveBadge.className = 'live-badge open';
      hoursLiveBadge.setAttribute('data-i18n', 'badge-open');
      const text = translations[currentLang] && translations[currentLang]['badge-open'];
      if (text) hoursLiveBadge.textContent = text;
    }
  } else {
    if (heroBadgeDot) {
      heroBadgeDot.style.color = '#ff4d5e';
      heroBadgeDot.style.textShadow = '0 0 10px rgba(230, 57, 70, 0.6)';
    }
    if (heroBadgeText) {
      heroBadgeText.setAttribute('data-i18n', 'hero-badge-closed');
      const text = translations[currentLang] && translations[currentLang]['hero-badge-closed'];
      if (text) heroBadgeText.textContent = text;
    }
    if (hoursLiveBadge) {
      hoursLiveBadge.className = 'live-badge closed';
      hoursLiveBadge.setAttribute('data-i18n', 'badge-closed');
      const text = translations[currentLang] && translations[currentLang]['badge-closed'];
      if (text) hoursLiveBadge.textContent = text;
    }
  }
}

// Setup Switcher Event Listeners
updateWorkingStatus();
setLanguage(currentLang);

// Run status check every minute — only update working status, NOT full re-translation
setInterval(() => {
  updateWorkingStatus();
}, 60000);

const langToggle = document.getElementById('langToggle');
if (langToggle) {
  langToggle.addEventListener('click', () => {
    const nextLang = currentLang === 'ar' ? 'en' : 'ar';
    setLanguage(nextLang);
  });
}

// ===== FAQ Accordion =====
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      // Close all other open items
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          other.querySelector('.faq-answer').style.maxHeight = null;
        }
      });
      // Toggle current item
      if (isActive) {
        item.classList.remove('active');
        item.querySelector('.faq-answer').style.maxHeight = null;
      } else {
        item.classList.add('active');
        const answer = item.querySelector('.faq-answer');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}
initFAQ();

// ===== Form Validation UX =====
function initFormValidation() {
  const nameInput = document.getElementById('clientName');
  const serviceSelect = document.getElementById('serviceType');
  const descTextarea = document.getElementById('projectDesc');
  const charCounter = document.getElementById('charCounter');
  const maxChars = 500;

  // Real-time visual validation
  function validateField(field) {
    if (field.value.trim().length > 0) {
      field.classList.add('valid');
      field.classList.remove('invalid');
    } else if (field.dataset.touched) {
      field.classList.add('invalid');
      field.classList.remove('valid');
    }
  }

  [nameInput, serviceSelect, descTextarea].forEach(field => {
    if (!field) return;
    field.addEventListener('blur', () => {
      field.dataset.touched = 'true';
      validateField(field);
    });
    field.addEventListener('input', () => {
      if (field.dataset.touched) validateField(field);
    });
  });

  // Character counter for project description
  if (descTextarea && charCounter) {
    descTextarea.setAttribute('maxlength', maxChars);
    descTextarea.addEventListener('input', () => {
      const count = descTextarea.value.length;
      charCounter.textContent = `${count} / ${maxChars}`;
      if (count >= maxChars * 0.9) {
        charCounter.classList.add('warning');
      } else {
        charCounter.classList.remove('warning');
      }
    });
  }
}
initFormValidation();

// ===== 3D Tilt Effect on Cards =====
function initTiltEffect() {
  const cards = document.querySelectorAll('.service-card, .project-card, .blog-card');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
      card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.15s ease-out';
    });
  });
}
initTiltEffect();
