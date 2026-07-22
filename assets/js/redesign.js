/* Snappy interactions for the redesign. No slow fade-ins. */
(function () {
  'use strict';

  const body = document.body;
  if (!body.classList.contains('redesign')) return;

  /* ---- 1. Active nav link based on scroll position (snappy) ---- */
  const navLinks = Array.from(document.querySelectorAll('.nav__links a[href^="#"]'));
  const sections = navLinks
    .map(a => {
      const id = a.getAttribute('href').slice(1);
      const el = id ? document.getElementById(id) : null;
      return el ? { link: a, el } : null;
    })
    .filter(Boolean);

  if (sections.length) {
    const setActive = () => {
      const y = window.scrollY + 120;
      let current = sections[0];
      for (const s of sections) {
        if (s.el.offsetTop <= y) current = s;
      }
      navLinks.forEach(l => l.classList.toggle('is-active', l === current.link));
    };
    // run on scroll without animating — just instant class swap
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { setActive(); ticking = false; });
    }, { passive: true });
    setActive();
  }

  /* ---- 2. Scroll-driven portrait dissolve -------------------- */
  const portrait = document.querySelector('[data-scroll-portrait]');
  if (portrait) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let transitionStart = 16;
    let transitionDistance = 240;
    let portraitTicking = false;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const smoothstep = value => value * value * (3 - (2 * value));

    const measurePortrait = () => {
      const rect = portrait.getBoundingClientRect();
      const portraitTop = rect.top + window.scrollY;
      const viewportHeight = window.innerHeight;

      transitionStart = portraitTop <= viewportHeight * 0.72
        ? 16
        : Math.max(16, portraitTop - (viewportHeight * 0.78));
      transitionDistance = clamp(viewportHeight * 0.32, 200, 320);
    };

    const updatePortrait = () => {
      const rawProgress = clamp((window.scrollY - transitionStart) / transitionDistance, 0, 1);
      const progress = smoothstep(rawProgress);
      const motion = prefersReducedMotion.matches ? 0 : 1;
      const midpointGlow = Math.sin(progress * Math.PI) * 0.32;

      portrait.style.setProperty('--portrait-primary-opacity', (1 - progress).toFixed(4));
      portrait.style.setProperty('--portrait-secondary-opacity', progress.toFixed(4));
      portrait.style.setProperty('--portrait-primary-scale', (1 + (progress * 0.035 * motion)).toFixed(4));
      portrait.style.setProperty('--portrait-secondary-scale', (1.055 - (progress * 0.035 * motion)).toFixed(4));
      portrait.style.setProperty('--portrait-primary-y', `${(-progress * 5 * motion).toFixed(3)}%`);
      portrait.style.setProperty('--portrait-secondary-y', `${((1 - progress) * 5 * motion).toFixed(3)}%`);
      portrait.style.setProperty('--portrait-wash-opacity', midpointGlow.toFixed(4));
      portraitTicking = false;
    };

    const requestPortraitUpdate = () => {
      if (portraitTicking) return;
      portraitTicking = true;
      requestAnimationFrame(updatePortrait);
    };

    const remeasurePortrait = () => {
      measurePortrait();
      requestPortraitUpdate();
    };

    window.addEventListener('scroll', requestPortraitUpdate, { passive: true });
    window.addEventListener('resize', remeasurePortrait, { passive: true });
    if (typeof prefersReducedMotion.addEventListener === 'function') {
      prefersReducedMotion.addEventListener('change', requestPortraitUpdate);
    } else {
      prefersReducedMotion.addListener(requestPortraitUpdate);
    }
    measurePortrait();
    updatePortrait();
  }

  /* ---- 3. Smooth-instant nav clicks: short scroll, no jump ----- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      const top = el.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top, behavior: 'smooth' });
      history.replaceState(null, '', '#' + id);
    });
  });

  /* ---- 4. Brand glyph: click cycles accent rotation ----------- */
  const brand = document.querySelector('.brand');
  if (brand) {
    let n = 0;
    brand.addEventListener('click', e => {
      e.preventDefault();
      n = (n + 1) % 4;
      const glyph = brand.querySelector('.brand__glyph');
      if (glyph) glyph.style.transform = `rotate(${n * 90}deg)`;
    });
  }

  /* ---- 5. Keyboard nav: press G then a digit to jump --------- */
  let armed = false, armedTimer = 0;
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    if (e.key.toLowerCase() === 'g') {
      armed = true;
      clearTimeout(armedTimer);
      armedTimer = setTimeout(() => { armed = false; }, 900);
      return;
    }
    if (!armed) return;
    const map = { '1': '#about-me', '2': '#news', '3': '#publications', '4': '#honors', '5': '#education' };
    const target = map[e.key];
    if (target) {
      const el = document.querySelector(target);
      if (el) {
        e.preventDefault();
        const top = el.getBoundingClientRect().top + window.scrollY - 60;
        window.scrollTo({ top, behavior: 'smooth' });
        history.replaceState(null, '', target);
      }
    }
    armed = false;
  });
})();
