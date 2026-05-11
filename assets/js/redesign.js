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

  /* ---- 2. Smooth-instant nav clicks: short scroll, no jump ----- */
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

  /* ---- 3. Cursor follower — small snappy Mondrian block ------ */
  const mark = document.createElement('div');
  mark.className = 'cursor-mark';
  document.body.appendChild(mark);

  let mx = 0, my = 0, tx = 0, ty = 0;
  document.addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!mark.classList.contains('is-visible')) mark.classList.add('is-visible');
  }, { passive: true });
  document.addEventListener('pointerleave', () => mark.classList.remove('is-visible'));

  // Snappy follow — high lerp factor, no slow drift
  (function loop() {
    mx += (tx - mx) * 0.5;
    my += (ty - my) * 0.5;
    mark.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
    requestAnimationFrame(loop);
  })();

  // Context-aware color/shape: link / publication card / hero art
  const matchClass = (el) => {
    if (!el || !el.closest) return '';
    if (el.closest('.hero__art')) return 'on-art';
    if (el.closest('.pub'))       return 'on-pub';
    if (el.closest('a, button'))  return 'on-link';
    return '';
  };
  document.addEventListener('pointerover', (e) => {
    const cls = matchClass(e.target);
    mark.classList.remove('on-link', 'on-pub', 'on-art');
    if (cls) mark.classList.add(cls);
  });

  /* ---- 5. Brand glyph: click cycles accent rotation ----------- */
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

  /* ---- 6. Keyboard nav: press G then a digit to jump --------- */
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
