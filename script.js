/* global script.js */

// ── Helpers ──────────────────────────────────────────────────────────────────
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ── Year ─────────────────────────────────────────────────────────────────────
qs('#year').textContent = new Date().getFullYear();

// ── Sticky header ─────────────────────────────────────────────────────────────
const header = qs('#site-header');
const onScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ── Mobile nav ────────────────────────────────────────────────────────────────
const navToggle = qs('#nav-toggle');
const mainNav   = qs('#main-nav');

navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

// Close nav when a link is clicked
qsa('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// Close nav on outside click
document.addEventListener('click', (e) => {
  if (mainNav.classList.contains('open') &&
      !mainNav.contains(e.target) &&
      !navToggle.contains(e.target)) {
    mainNav.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
});

// ── Active nav link (scroll spy) ──────────────────────────────────────────────
const sections  = qsa('section[id]');
const navLinks  = qsa('.nav-link');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);

sections.forEach(sec => sectionObserver.observe(sec));

// ── Reveal on scroll ──────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

qsa('.reveal').forEach(el => revealObserver.observe(el));

// ── Animated counters ─────────────────────────────────────────────────────────
const statNums = qsa('.stat-num[data-target]');

const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

function animateCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const duration = 1600;
  const start    = performance.now();

  const tick = (now) => {
    const elapsed  = Math.min(now - start, duration);
    const progress = easeOutQuart(elapsed / duration);
    el.textContent = Math.round(progress * target);
    if (elapsed < duration) requestAnimationFrame(tick);
    else el.textContent = target;
  };

  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

statNums.forEach(el => counterObserver.observe(el));

// ── Project filter ─────────────────────────────────────────────────────────────
const filterBtns   = qsa('.filter-btn');
const projectCards = qsa('.project-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;

    projectCards.forEach(card => {
      const match = filter === 'all' || card.dataset.category === filter;
      if (match) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

// ── Contact form validation & fake submit ─────────────────────────────────────
const form       = qs('#contact-form');
const submitBtn  = qs('#submit-btn');
const successMsg = qs('#form-success');

const validators = {
  name:    v => v.trim().length >= 2   ? null : 'Please enter your name (at least 2 characters).',
  email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Please enter a valid email address.',
  subject: v => v.trim().length >= 3   ? null : 'Please enter a subject (at least 3 characters).',
  message: v => v.trim().length >= 10  ? null : 'Please enter a message (at least 10 characters).',
};

function validateField(input) {
  const name    = input.name;
  const error   = validators[name]?.(input.value) ?? null;
  const errSpan = input.closest('.field').querySelector('.field-error');
  if (error) {
    input.classList.add('invalid');
    if (errSpan) errSpan.textContent = error;
    return false;
  } else {
    input.classList.remove('invalid');
    if (errSpan) errSpan.textContent = '';
    return true;
  }
}

// Live validation on blur
qsa('#contact-form input, #contact-form textarea').forEach(input => {
  input.addEventListener('blur', () => validateField(input));
  input.addEventListener('input', () => {
    if (input.classList.contains('invalid')) validateField(input);
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const inputs  = qsa('input, textarea', form);
  const allOk   = inputs.map(validateField).every(Boolean);
  if (!allOk) {
    const firstInvalid = qs('.invalid', form);
    firstInvalid?.focus();
    return;
  }

  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  await new Promise(resolve => setTimeout(resolve, 1200));

  submitBtn.classList.remove('loading');
  submitBtn.disabled = false;
  form.reset();
  inputs.forEach(i => i.classList.remove('invalid'));

  successMsg.hidden = false;
  successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  setTimeout(() => {
    successMsg.hidden = true;
  }, 6000);
});

// ── Smooth scroll for hash links ──────────────────────────────────────────────
qsa('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = qs(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const headerH = header.offsetHeight;
    const top     = target.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ── Stagger reveal for skill/project cards ────────────────────────────────────
const staggerObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const parent = entry.target;
      const cards  = qsa('.skill-card.reveal, .project-card.reveal', parent);
      cards.forEach((card, i) => {
        setTimeout(() => card.classList.add('visible'), i * 80);
      });
      staggerObserver.unobserve(parent);
    });
  },
  { threshold: 0.05 }
);

[qs('.skills-grid'), qs('#projects-grid')].forEach(el => {
  if (el) staggerObserver.observe(el);
});
