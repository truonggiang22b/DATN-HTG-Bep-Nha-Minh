/* =============================================
   MAIN JAVASCRIPT — WEB PROTOTYPE
   Tất cả logic UI được ghi chú rõ ràng
   để bạn dễ dàng tùy chỉnh.
   ============================================= */

// ---- 1. HEADER — sticky scroll effect ----
(function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
})();


// ---- 2. HAMBURGER MENU ----
(function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const isOpen = navLinks.classList.contains('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close menu khi click bên ngoài
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
    }
  });

  // Close menu khi click vào nav link
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
})();


// ---- 3. SCROLL TO TOP BUTTON ----
(function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


// ---- 4. ACTIVE NAV LINK — highlight khi scroll ----
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle(
            'active-link',
            link.getAttribute('href') === `#${id}`
          );
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(section => observer.observe(section));
})();


// ---- 5. COUNTER ANIMATION — stats section ----
(function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  const easeOutQuad = (t) => t * (2 - t);

  const animateCounter = (el) => {
    const target   = parseInt(el.getAttribute('data-target'), 10);
    const duration = 2000; // ms
    const start    = performance.now();

    const update = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutQuad(progress);
      const current  = Math.floor(eased * target);

      el.textContent = current.toLocaleString('vi-VN');

      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target.toLocaleString('vi-VN');
    };

    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
})();


// ---- 6. FADE-IN ON SCROLL (Intersection Observer) ----
(function initFadeIn() {
  // Thêm class fade-in vào các element muốn có animation
  const targets = [
    '.feature-card',
    '.pricing-card',
    '.hero-mockup',
    '.section-header',
    '.cta-card',
  ];

  const elements = document.querySelectorAll(targets.join(','));

  elements.forEach((el, i) => {
    el.classList.add('fade-in');
    // Stagger delay cho grid items
    el.style.transitionDelay = `${(i % 6) * 80}ms`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
})();


// ---- 7. SMOOTH SCROLL for anchor links ----
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const headerHeight = document.getElementById('header')?.offsetHeight || 80;

      window.scrollTo({
        top: target.offsetTop - headerHeight - 16,
        behavior: 'smooth',
      });
    });
  });
})();


// ---- 8. BUTTON CLICK HANDLERS (customize tại đây) ----
(function initButtonHandlers() {
  // Helper để gắn handler an toàn
  const on = (id, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  };

  on('btn-get-started', () => {
    // TODO: chuyển hướng đến trang đăng ký
    alert('👋 Chuyển đến trang đăng ký!');
  });

  on('btn-watch-demo', () => {
    // TODO: mở video demo (modal hoặc YouTube)
    alert('▶️ Mở video demo!');
  });

  on('btn-login', () => {
    // TODO: chuyển đến /login
    alert('🔐 Trang đăng nhập');
  });

  on('btn-signup', () => {
    // TODO: chuyển đến /register
    alert('📝 Trang đăng ký');
  });

  on('btn-free-plan', () => {
    alert('🆓 Đăng ký gói miễn phí!');
  });

  on('btn-pro-plan', () => {
    alert('⭐ Đăng ký gói Pro - dùng thử 14 ngày!');
  });

  on('btn-enterprise-plan', () => {
    alert('🏢 Liên hệ tư vấn Enterprise!');
  });

  on('btn-cta-start', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  on('btn-cta-contact', () => {
    alert('📧 Mở form liên hệ!');
  });
})();


// ---- 9. TOAST NOTIFICATION (utility function) ----
// Dùng: showToast('Thông báo của bạn', 'success')
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const colors = {
    success: '#10b981',
    error:   '#ef4444',
    info:    '#6366f1',
    warning: '#f59e0b',
  };

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  Object.assign(toast.style, {
    position:     'fixed',
    bottom:       '80px',
    right:        '32px',
    background:   colors[type] || colors.info,
    color:        '#fff',
    padding:      '14px 20px',
    borderRadius: '12px',
    fontFamily:   'Inter, sans-serif',
    fontWeight:   '500',
    fontSize:     '0.9375rem',
    boxShadow:    '0 8px 24px rgba(0,0,0,0.4)',
    zIndex:       '999',
    opacity:      '0',
    transform:    'translateX(20px)',
    transition:   'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
  });

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity   = '1';
    toast.style.transform = 'translateX(0)';
  });

  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Export để dùng trên nhiều trang
window.showToast = showToast;


// ---- 10. CONSOLE LOG (development info) ----
console.log(
  '%c🚀 Web Prototype Ready',
  'color: #6366f1; font-size: 14px; font-weight: bold;'
);
console.log(
  '%cChỉnh sửa js/main.js để tùy biến hành vi.',
  'color: #94a3b8; font-size: 12px;'
);
