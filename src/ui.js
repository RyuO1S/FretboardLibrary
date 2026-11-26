(function () {
  const $ = (id) => document.getElementById(id);

  /* ---------- shared-password gate (browser-only convenience, not real security) ---------- */
  const gate = $('siteGate');
  const gateForm = $('gateForm');
  const gatePassword = $('gatePassword');
  const gateError = $('gateError');
  if (gate && gateForm && gatePassword) {
    let unlocked = false;
    try { unlocked = sessionStorage.getItem('fretboard-site-gate') === 'unlocked'; } catch (e) {}
    if (unlocked) gate.hidden = true;
    else { gate.hidden = false; setTimeout(() => gatePassword.focus(), 50); }
    gateForm.onsubmit = (e) => {
      e.preventDefault();
      if (gatePassword.value === 'SR567432') {
        try { sessionStorage.setItem('fretboard-site-gate', 'unlocked'); } catch (e) {}
        gate.hidden = true;
        gateError.textContent = '';
      } else {
        gateError.textContent = 'Incorrect password.';
        gatePassword.select();
      }
    };
  }

  /* ---------- theme: follows the system until the button is pressed, then remembers the choice ---------- */
  const root = document.documentElement;
  try {
    const savedTheme = localStorage.getItem('fretboard-theme');
    if ((savedTheme === 'dark' || savedTheme === 'light') && root) root.setAttribute('data-theme', savedTheme);
  } catch (e) {}
  function isDark() {
    const t = root && root.getAttribute ? root.getAttribute('data-theme') : null;
    if (t === 'dark') return true;
    if (t === 'light') return false;
    try { return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); } catch (e) { return false; }
  }
  // Drawn pictograms in the current text colour (black in light theme, white in dark theme), no emoji
  const SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/></svg>';
  const PLAY_HTML = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 4l14 8-14 8z" fill="currentColor"/></svg> Play';
  const STOP_HTML = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg> Stop';
  // small line icons in the current text colour
  const ln = (d) => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON = {
    plus: ln('M12 5v14M5 12h14'),
    minus: ln('M5 12h14'),
    edit: ln('M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4'),
    mic: ln('M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3'),
    upload: ln('M12 16V4M7 9l5-5 5 5M5 20h14'),
    playf: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
    stopf: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>',
    x: ln('M6 6l12 12M18 6L6 18'),
    prev: ln('M15 5l-7 7 7 7'),
    next: ln('M9 5l7 7-7 7'),
    earlier: ln('M19 12H5M11 6l-6 6 6 6'),
    later: ln('M5 12h14M13 6l6 6-6 6'),
    copy: ln('M9 9h10v10H9zM5 15V5h10'),
    speaker: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 9c1.4 1.6 1.4 4.4 0 6M18.6 6.4c3 3.3 3 7.9 0 11.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };
  function paintThemeBtn() {
    const b = $('themeBtn');
    if (!b) return;
    const d = isDark();
    b.innerHTML = d ? SUN : MOON;
    b.setAttribute('aria-label', d ? 'Switch to light theme' : 'Switch to dark theme');
    b.setAttribute('title', d ? 'Switch to light theme' : 'Switch to dark theme');
  }
  function setTheme(t) {
    if (root && root.setAttribute) root.setAttribute('data-theme', t);
    try { localStorage.setItem('fretboard-theme', t); } catch (e) {}
    paintThemeBtn();
  }

  /* ---------- pixel effects: squares burst out of whatever you press ---------- */
  const fxCanvas = document.getElementById('fx');
  const fxCtx = fxCanvas && fxCanvas.getContext ? fxCanvas.getContext('2d') : null;
  const fxParts = [];
  let fxRaf = 0, fxLast = 0;
  const calmMotion = () => {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  };
  function fxSize() {
    if (!fxCtx) return;
    const d = Math.min(window.devicePixelRatio || 1, 2);
    fxCanvas.width = Math.round(window.innerWidth * d);
    fxCanvas.height = Math.round(window.innerHeight * d);
    fxCtx.setTransform(d, 0, 0, d, 0, 0);
  }
  function fxTick(t) {
    const dt = Math.min(0.05, (t - fxLast) / 1000) || 0.016;
    fxLast = t;
    fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = fxParts.length - 1; i >= 0; i--) {
      const p = fxParts[i];
      p.wait -= dt;
      if (p.wait > 0) continue; // they trickle out one after another instead of all at once
      p.age += dt;
      if (p.age >= p.life) { fxParts.splice(i, 1); continue; }
      const k = p.age / p.life;
      if (p.radial) {
        // soft round spark: shoots out from the touch point and eases to a stop as it fades
        const e = 1 - Math.pow(1 - k, 3);
        const x = p.ox + p.dx * p.dist * e, y = p.oy + p.dy * p.dist * e;
        const a = Math.min(1, k / 0.08) * Math.pow(1 - k, 1.6);
        fxCtx.fillStyle = p.c;
        if (p.shape === 'star') {
          // a four-point star that twinkles and turns as it flies
          const tw = 0.75 + 0.25 * Math.sin(p.age * 30 + p.ph);
          const R = p.r * 2.4 * (1 - 0.4 * k) * tw, rr = R * 0.28, rot = p.ph + k * 2.2;
          fxCtx.globalAlpha = a;
          fxCtx.beginPath();
          for (let j = 0; j < 8; j++) {
            const ang = rot + (j * Math.PI) / 4, rad = j % 2 ? rr : R;
            const px = x + Math.cos(ang) * rad, py = y + Math.sin(ang) * rad;
            if (j) fxCtx.lineTo(px, py); else fxCtx.moveTo(px, py);
          }
          fxCtx.closePath();
          fxCtx.fill();
        } else {
          // crisp pixels snapped to their own grid, like an old game
          const s = p.s, gx = Math.round(x / s) * s, gy = Math.round(y / s) * s;
          fxCtx.globalAlpha = a;
          if (p.shape === 'plus') { fxCtx.fillRect(gx - s, gy, s * 3, s); fxCtx.fillRect(gx, gy - s, s, s * 3); }
          else fxCtx.fillRect(gx, gy, s, s);
          // a fading pixel trail behind it
          fxCtx.globalAlpha = a * 0.35;
          const t2 = e * 0.8;
          fxCtx.fillRect(Math.round((p.ox + p.dx * p.dist * t2) / s) * s, Math.round((p.oy + p.dy * p.dist * t2) / s) * s, s, s);
        }
        continue;
      }
      p.vx *= 1 - Math.min(1, 1.2 * dt);
      p.vy *= 1 - Math.min(1, 0.8 * dt);
      p.x0 += p.vx * dt;
      p.y += p.vy * dt;
      const x = p.x0 + Math.sin(p.age * p.fr + p.ph) * p.sw; // gentle sway while rising
      // fade in quickly, float, fade out slowly, with a soft twinkle
      const a = Math.min(1, k / 0.14) * (1 - Math.pow(k, 1.5)) * (0.65 + 0.35 * Math.sin(p.age * 8 + p.ph));
      fxCtx.globalAlpha = Math.max(0, a * 0.9);
      fxCtx.fillStyle = p.c;
      // snapped to a grid the size of the pixel, so it still reads as pixel art
      const s = p.s, gx = Math.round(x / s) * s, gy = Math.round(p.y / s) * s;
      if (p.plus) { fxCtx.fillRect(gx - s, gy, s * 3, s); fxCtx.fillRect(gx, gy - s, s, s * 3); }
      else fxCtx.fillRect(gx, gy, s, s);
    }
    fxCtx.globalAlpha = 1;
    if (fxParts.length) fxRaf = requestAnimationFrame(fxTick);
    else { fxRaf = 0; fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
  }
  // Button effects: 'subtle' (a clean ripple, the default), 'pixel' (floating pixel sparkles) or 'off'
  let FX = 'subtle';
  try { const f = localStorage.getItem('fretboard-fx'); if (f === 'subtle' || f === 'pixel' || f === 'off') FX = f; } catch (e) {}
  // Subtle mode: a neat ring of sparks from the touch point out past the button's edge
  function fxRadial(el, e) {
    if (!fxCtx || !window.requestAnimationFrame || calmMotion() || !el.getBoundingClientRect) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const ox = e && e.clientX ? e.clientX : r.left + r.width / 2, oy = e && e.clientY ? e.clientY : r.top + r.height / 2;
    const cs = getComputedStyle(document.documentElement);
    const cols = ['--accent', '--root-dot', '--lit-glow', '--dot'].map((n) => cs.getPropertyValue(n).trim() || '#0e7490');
    const n = Math.max(8, Math.min(14, Math.round((r.width + r.height) / 14)));
    const start = Math.random() * Math.PI * 2;
    for (let i = 0; i < n && fxParts.length < 220; i++) {
      const ang = start + (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      // distance from the touch point to the button edge in this direction, then a little beyond
      const tx = dx > 0 ? (r.right - ox) / dx : dx < 0 ? (r.left - ox) / dx : Infinity;
      const ty = dy > 0 ? (r.bottom - oy) / dy : dy < 0 ? (r.top - oy) / dy : Infinity;
      const edge = Math.min(tx, ty);
      const roll = Math.random();
      const shape = roll < 0.22 ? 'star' : roll < 0.45 ? 'plus' : 'px';
      fxParts.push({ radial: true, shape, ox, oy, dx, dy, dist: edge + 14 + Math.random() * 18, r: 1.6 + Math.random() * 1.2, s: shape === 'plus' ? 2 : Math.random() < 0.5 ? 3 : 4,
        ph: Math.random() * 6.28, c: shape === 'star' ? cols[1 + (i % 2)] : cols[i % cols.length], age: 0, wait: Math.random() * 0.04, life: 0.55 + Math.random() * 0.25 });
    }
    if (!fxRaf) { fxLast = performance.now(); fxRaf = requestAnimationFrame(fxTick); }
  }
  function fxBurst(x, y, o) {
    if (FX !== 'pixel') return;
    if (!fxCtx || !window.requestAnimationFrame || calmMotion()) return;
    o = o || {};
    const cs = getComputedStyle(document.documentElement);
    const cols = (o.colors || ['--root-dot', '--dot', '--lit-glow']).map((n) => cs.getPropertyValue(n).trim() || '#888');
    const n = o.n || 10;
    const spread = o.spread == null ? 14 : o.spread;
    const trickle = o.trickle == null ? 0.35 : o.trickle;
    for (let i = 0; i < n && fxParts.length < 160; i++) {
      const plus = Math.random() < 0.22; // a few little plus-shaped sparkles
      fxParts.push({
        x0: x + (Math.random() - 0.5) * spread * 2,
        y: y + (Math.random() - 0.5) * spread,
        vx: (Math.random() - 0.5) * 22,
        vy: -(18 + Math.random() * 34),
        sw: 4 + Math.random() * 9,
        fr: 2 + Math.random() * 2.5,
        ph: Math.random() * 6.28,
        wait: Math.random() * trickle,
        age: 0,
        life: 1.1 + Math.random() * 0.9,
        s: plus ? 2 : [3, 3, 4][(Math.random() * 3) | 0],
        plus,
        c: cols[(Math.random() * cols.length) | 0],
      });
    }
    if (!fxRaf) { fxLast = performance.now(); fxRaf = requestAnimationFrame(fxTick); }
  }
  function sparks(el) {
    if (!el || !el.getBoundingClientRect) return;
    const r = el.getBoundingClientRect();
    fxBurst(r.left + r.width / 2, r.top + r.height / 2, { n: 5, spread: 5, trickle: 0.5, colors: ['--lit-glow', '--dot', '--root-dot'] });
  }
  // Pixels rise from the outline of the pressed button, like a glow lifting off it
  function edgePoints(el) {
    const r = el.getBoundingClientRect();
    const w = r.width, h = r.height, per = 2 * (w + h);
    const n = Math.max(10, Math.min(26, Math.round(per / 16)));
    const out = [];
    for (let i = 0; i < n; i++) {
      let d = Math.random() * per, x, y, nx = 0, ny = 0;
      if (d < w) { x = r.left + d; y = r.top; ny = -1; }
      else if ((d -= w) < h) { x = r.right; y = r.top + d; nx = 1; }
      else if ((d -= h) < w) { x = r.right - d; y = r.bottom; ny = 1; }
      else { d -= w; x = r.left; y = r.bottom - d; nx = -1; }
      out.push({ x: x + nx * 2, y: y + ny * 2, nx, ny });
    }
    return out;
  }
  function pathPoints(el) {
    const path = el.querySelector ? el.querySelector('path.cseg') : null;
    if (!path || !path.getTotalLength || !path.getScreenCTM) return edgePoints(el);
    const len = path.getTotalLength();
    const m = path.getScreenCTM();
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const out = [];
    for (let i = 0; i < 18; i++) {
      const pt = path.getPointAtLength(Math.random() * len);
      const x = m.a * pt.x + m.c * pt.y + m.e, y = m.b * pt.x + m.d * pt.y + m.f;
      const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1;
      out.push({ x: x + (dx / l) * 2, y: y + (dy / l) * 2, nx: dx / l, ny: dy / l });
    }
    return out;
  }
  function fxEmit(points, o) {
    if (FX !== 'pixel') return;
    if (!fxCtx || !window.requestAnimationFrame || calmMotion() || !points.length) return;
    o = o || {};
    const cs = getComputedStyle(document.documentElement);
    const cols = (o.colors || ['--root-dot', '--dot', '--lit-glow']).map((n) => cs.getPropertyValue(n).trim() || '#888');
    points.forEach((p) => {
      if (fxParts.length >= 220) return;
      const plus = Math.random() < 0.2;
      const out = 12 + Math.random() * 22;
      fxParts.push({
        x0: p.x, y: p.y,
        vx: p.nx * out + (Math.random() - 0.5) * 10,
        vy: p.ny * out - (10 + Math.random() * 26),
        sw: 3 + Math.random() * 7, fr: 2 + Math.random() * 2.5, ph: Math.random() * 6.28,
        wait: Math.random() * 0.4, age: 0, life: 1.0 + Math.random() * 0.9,
        s: plus ? 2 : [3, 3, 4][(Math.random() * 3) | 0], plus,
        c: cols[(Math.random() * cols.length) | 0],
      });
    });
    if (!fxRaf) { fxLast = performance.now(); fxRaf = requestAnimationFrame(fxTick); }
  }
  // After the page redraws, the pressed button is a new element: find it again and play the press animation on it
  const PRESS_ATTRS = ['data-circ', 'data-h', 'data-nh', 'data-nxview', 'data-gokey', 'data-sc', 'data-rk', 'data-shape', 'data-addshape', 'data-add', 'data-pq', 'data-cs', 'data-ls', 'data-lsalt', 'data-le', 'data-lefret', 'data-leopen', 'data-leq', 'data-sl', 'data-sl-show', 'data-sl-hear', 'data-ana', 'data-ana-add', 'data-ana-scale', 'data-cpg', 'data-pk', 'data-lseg', 'data-lscap', 'data-lscapdel', 'data-lsegdel', 'data-libload', 'data-libdel', 'data-acct', 'data-c', 'data-k', 'data-id'];
  function pressSelector(el) {
    if (!el.getAttribute) return '';
    if (el.id) return '#' + el.id;
    if (el.getAttribute('data-seg') !== null) return '[data-seg="' + el.getAttribute('data-seg') + '"][data-v="' + el.getAttribute('data-v') + '"]';
    if (el.getAttribute('data-act') !== null) return '[data-act="' + el.getAttribute('data-act') + '"][data-i="' + el.getAttribute('data-i') + '"]';
    // the chord picker and the chord shape panel use the same attributes, so tell them apart
    const src = el.getAttribute('data-src');
    for (let i = 0; i < PRESS_ATTRS.length; i++) {
      const v = el.getAttribute(PRESS_ATTRS[i]);
      if (v !== null) return '[' + PRESS_ATTRS[i] + '="' + v + '"]' + (src ? '[data-src="' + src + '"]' : '');
    }
    return '';
  }
  function pressAnim(sel) {
    if (!sel || calmMotion() || FX === 'off') return;
    const n = document.querySelector(sel);
    if (!n || !n.classList) return;
    n.classList.remove('pressfx');
    void n.getBoundingClientRect(); // restart the animation if it is already running
    n.classList.add('pressfx');
    setTimeout(() => n.classList.remove('pressfx'), 450);
  }
  // a soft light that spreads from where the button was pressed, clipped to the button's shape
  function ripple(el, e) {
    if (calmMotion() || !el.getBoundingClientRect || !document.createElement) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const cs = getComputedStyle(el);
    const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(cs.backgroundColor || '');
    const solid = m && (m[4] === undefined || +m[4] > 0.5);
    const lum = solid ? (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) / 255 : 1;
    const color = solid && lum < 0.55 ? 'rgba(255,255,255,0.38)' : (getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#0e7490');
    const box = document.createElement('span');
    box.className = 'ripplebox';
    box.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${cs.borderRadius};`;
    const x = e && e.clientX ? e.clientX - r.left : r.width / 2, y = e && e.clientY ? e.clientY - r.top : r.height / 2;
    const size = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y)) * 2;
    const dot = document.createElement('i');
    dot.style.cssText = `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;background:${color};`;
    if (!solid || lum >= 0.55) dot.style.opacity = '0.22';
    box.appendChild(dot);
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 650);
  }
  fxSize();
  if (window.addEventListener) window.addEventListener('resize', fxSize);
  // runs first (capture), before the page re-draws the element that was pressed
  document.addEventListener('click', (e) => {
    const t = e.target;
    const el = t && t.closest ? t.closest('button, [data-circ]') : null;
    if (!el) return;
    const sel = pressSelector(el);
    const circ = el.getAttribute && el.getAttribute('data-circ') !== null;
    if (FX === 'pixel') {
      if (el.id === 'themeBtn') setTimeout(() => fxEmit(edgePoints(el), { colors: ['--icon'] }), 40);
      else fxEmit(circ ? pathPoints(el) : edgePoints(el));
    } else if (FX === 'subtle') { if (!circ) ripple(el, e); fxRadial(el, e); }
    setTimeout(() => pressAnim(sel), 0);
  }, true);
  const S = { key: 0, flats: true, id: ENTRIES[0].id, labels: 'note', from: 0, to: MAX_FRET, ghost: false, set: 0, inv: 0, pos: 'all', pat: 'all', zoom: true, chord: 'none', chordType: 'triad', chordOnly: false, cx: null, hk: 0, hm: 'major', q: '', nxView: 'chords' };
  try {
    const sv = JSON.parse(localStorage.getItem('fretboard-theory') || 'null');
    // a chord picked in the Key explorer is a passing choice: it is not brought back on the next visit
    if (sv && ENTRIES.some((e) => e.id === sv.id)) Object.assign(S, sv, { q: '', cx: null });
  } catch (e) {}
  const save = () => {
    try { localStorage.setItem('fretboard-theory', JSON.stringify(S)); } catch (e) {}
  };

  /* ---------- geometry ---------- */
  const VBW = 1400, nutX = 70, endX = 1376, top = 38, gap = 34, VBH = top + 5 * gap + 64;
  const SCALE = (endX - nutX) / (1 - Math.pow(2, -MAX_FRET / 12));
  const fx = (n) => nutX + SCALE * (1 - Math.pow(2, -n / 12));
  const mid = (n) => (fx(n - 1) + fx(n)) / 2;
  const sy = (s) => top + (5 - s) * gap;
  const dotX = (f) => (f === 0 ? nutX - 28 : mid(f));
  const R = 13;
  const STRING_W = [3.2, 2.7, 2.2, 1.8, 1.4, 1.1];

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function boardSvg(dots, ghostDots) {
    let g = '';
    g += `<rect x="${nutX}" y="${top - 16}" width="${endX - nutX}" height="${5 * gap + 32}" rx="3" fill="var(--board)"/>`;
    for (const n of [3, 5, 7, 9, 15, 17, 19, 21]) {
      g += `<circle cx="${mid(n).toFixed(1)}" cy="${top + 2.5 * gap}" r="7" fill="var(--inlay)" opacity="0.35"/>`;
    }
    g += `<circle cx="${mid(12).toFixed(1)}" cy="${top + 1.5 * gap}" r="7" fill="var(--inlay)" opacity="0.35"/>`;
    g += `<circle cx="${mid(12).toFixed(1)}" cy="${top + 3.5 * gap}" r="7" fill="var(--inlay)" opacity="0.35"/>`;
    for (let n = 1; n <= MAX_FRET; n++) {
      g += `<line x1="${fx(n).toFixed(1)}" x2="${fx(n).toFixed(1)}" y1="${top - 16}" y2="${top + 5 * gap + 16}" stroke="var(--fret)" stroke-width="2.2"/>`;
    }
    g += `<rect x="${nutX - 6}" y="${top - 16}" width="6" height="${5 * gap + 32}" fill="var(--nut)"/>`;
    for (let s = 0; s < 6; s++) {
      g += `<line x1="${nutX}" x2="${endX}" y1="${sy(s)}" y2="${sy(s)}" stroke="var(--string)" stroke-width="${STRING_W[s]}" opacity="0.9"/>`;
      g += `<text x="14" y="${sy(s) + 4}" text-anchor="middle" font-size="11" fill="var(--muted)">${STRING_NAMES[s]}</text>`;
    }
    for (let n = 1; n <= MAX_FRET; n++) {
      const bold = [3, 5, 7, 9, 12, 15, 17, 19, 21].includes(n);
      g += `<text x="${mid(n).toFixed(1)}" y="${top + 5 * gap + 38}" text-anchor="middle" font-size="12" font-weight="${bold ? 600 : 400}" fill="var(--muted)">${n}</text>`;
    }
    for (const d of ghostDots) {
      g += `<circle cx="${dotX(d.f).toFixed(1)}" cy="${sy(d.s)}" r="3.5" fill="var(--ghost)"/>`;
    }
    for (const d of dots.slice().sort((a, b) => (b.dim ? 1 : 0) - (a.dim ? 1 : 0))) {
      const root = d.chordRoot !== undefined ? d.chordRoot : d.note.label === '1';
      const dim = !!d.dim;
      const text = S.labels === 'note' ? d.note.name : S.labels === 'interval' ? fmtLabel(d.note.label) : '';
      const fs = text.length >= 3 ? 9 : text.length === 2 ? 11 : 12.5;
      g += `<g class="dot" data-midi="${midiFor(d.s, d.f)}" data-pc="${d.note.pc}" data-s="${d.s}" data-f="${d.f}">`;
      g += `<circle cx="${dotX(d.f).toFixed(1)}" cy="${sy(d.s)}" r="${dim ? 9 : R}" fill="${root ? 'var(--root-dot)' : 'var(--dot)'}" opacity="${dim ? 0.3 : 1}" stroke="var(--board)" stroke-width="2"/>`;
      if (text) {
        g += `<text x="${dotX(d.f).toFixed(1)}" y="${sy(d.s) + fs * 0.35}" text-anchor="middle" font-size="${dim ? Math.min(fs, 9) : fs}" font-weight="600" fill="${dim ? 'var(--string)' : root ? 'var(--root-fg)' : 'var(--dot-fg)'}" pointer-events="none">${esc(text)}</text>`;
      }
      g += `</g>`;
    }
    return g;
  }

  /* ---------- audio ---------- */
  let ac = null, bus = null;
  // play through the iPhone's Silent switch (Safari 17+); older phones need the switch off
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  function audio() {
    if (!ac || ac.state === 'closed') {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { ac = new C({ latencyHint: 'interactive' }); } catch (e) { ac = new C(); }
      bus = null;
      if (ac.addEventListener) ac.addEventListener('statechange', soundStatus);
    }
    // 'suspended' before the first tap, 'interrupted' on iPhone after a call or switching apps
    if (ac.state !== 'running' && ac.resume) {
      try { const p = ac.resume(); if (p && p.then) p.then(soundStatus, soundStatus); } catch (e) {}
    }
    return ac;
  }
  // Unlock sound on the very first touch or key press anywhere, with a silent blip (needed by iPhone Safari)
  let unlocked = false;
  // On iPhones the Silent switch mutes web audio. A looping silent <audio> element moves the page to
  // "media playback", which plays through the switch, the same way a video does.
  const SILENT_WAV = 'data:audio/wav;base64,UklGRvQHAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YdAHAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
  let keepAlive = null;
  function mediaSession() {
    try {
      if (!keepAlive) {
        keepAlive = document.createElement('audio');
        keepAlive.src = SILENT_WAV;
        keepAlive.loop = true;
        keepAlive.setAttribute('playsinline', '');
        keepAlive.preload = 'auto';
      }
      if (keepAlive.paused) { const p = keepAlive.play(); if (p && p.catch) p.catch(() => {}); }
    } catch (e) {}
  }
  function unlockSound() {
    mediaSession();
    const c = audio();
    if (!c) return;
    if (!unlocked) warmUp();
    if (!unlocked) {
      try {
        const b = c.createBuffer(1, 1, 22050);
        const s = c.createBufferSource();
        s.buffer = b;
        s.connect(c.destination);
        s.start(0);
        unlocked = true;
      } catch (e) {}
    }
    setTimeout(soundStatus, 400);
  }
  ['pointerdown', 'touchend', 'keydown'].forEach((ev) => document.addEventListener(ev, unlockSound, true));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && unlocked) setTimeout(soundStatus, 300);
    // hidden tab: release the microphone (an open microphone can make some computers turn other sound down or switch headphones to call quality)
    if (document.hidden) { try { if (typeof LS !== 'undefined' && LS.live) lsStop(); if (typeof SL !== 'undefined' && SL.live) slStop(); if (typeof GTR !== 'undefined' && GTR.on) gtrStop(false); } catch (e) {} }
  });
  // a small bar that says when the browser is holding the sound back, with a button to turn it on
  function soundStatus() {
    const bar = $('soundBar');
    if (!bar) return;
    const off = !!(ac && ac.state !== 'running' && unlocked);
    bar.hidden = !off;
  }
  // one shared output with a gentle compressor, so a six-string chord or a busy strum does not clip
  function busNode(c) {
    if (!bus) {
      bus = c.createGain();
      bus.gain.value = 0.9;
      if (c.createDynamicsCompressor) {
        const comp = c.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.knee.value = 18;
        comp.ratio.value = 5;
        comp.attack.value = 0.004;
        comp.release.value = 0.25;
        bus.connect(comp);
        comp.connect(c.destination);
      } else bus.connect(c.destination);
    }
    return bus;
  }
  // when = audio-clock time. o.sustain keeps the chord ringing longer (used by the progression player).
  /* ---------- guitar sounds: modelled strings through a body or amp for each guitar ---------- */
  // recorded guitars (Musyng Kite soundfont), one packed file per guitar next to the page
  const SAMPLED = { steel: 'Acoustic (steel)', nylon: 'Classical (nylon)', clean: 'Electric clean', jazz: 'Electric jazz', overdrive: 'Electric overdrive', distortion: 'Electric distortion' };
  const SAMPLE_GAIN = { steel: 1, nylon: 1.4, clean: 1.3, jazz: 0.85, overdrive: 0.45, distortion: 0.75, muted: 1.2 };
  const MODEL_FOR = { steel: 'steel', nylon: 'nylon', clean: 'clean', jazz: 'jazz', overdrive: 'crunch', distortion: 'crunch', muted: 'clean' };
  const INSTS = Object.keys(SAMPLED).concat(['synth']);
  let INST = 'steel';
  try { const v = localStorage.getItem('fretboard-inst'); if (INSTS.indexOf(v) >= 0) INST = v; } catch (e) {}
  const noteCache = new Map();
  function noteBuffer(c, inst, midi) {
    const key = inst + ':' + midi + ':' + c.sampleRate;
    let b = noteCache.get(key);
    if (b) { noteCache.delete(key); noteCache.set(key, b); return b; }
    const data = ksRender(c.sampleRate, 440 * Math.pow(2, (midi - 69) / 12), GUITARS[inst], midi * 7 + 3);
    b = c.createBuffer(1, data.length, c.sampleRate);
    b.getChannelData(0).set(data);
    noteCache.set(key, b);
    if (noteCache.size > 120) noteCache.delete(noteCache.keys().next().value);
    return b;
  }
  // the sound of the guitar's body (acoustic) or amp (electric), one chain per output
  const chains = new WeakMap();
  function bodyChain(c, inst, dest) {
    let byInst = chains.get(dest);
    if (!byInst) { byInst = {}; chains.set(dest, byInst); }
    if (byInst[inst]) return byInst[inst];
    const nodes = [];
    const bq = (type, f, gain, q) => { const n = c.createBiquadFilter(); n.type = type; n.frequency.value = f; if (gain !== undefined) n.gain.value = gain; if (q) n.Q.value = q; nodes.push(n); };
    const gn = (v) => { const n = c.createGain(); n.gain.value = v; nodes.push(n); };
    if (inst === 'steel') { bq('highpass', 70); bq('peaking', 110, 5, 1.2); bq('peaking', 230, 3, 1.4); bq('peaking', 3000, 2.5, 0.9); bq('highshelf', 8000, 2); gn(0.9); }
    else if (inst === 'nylon') { bq('highpass', 70); bq('peaking', 100, 5, 1.1); bq('peaking', 250, 2, 1.3); bq('lowpass', 5200); gn(1); }
    else if (inst === 'clean') { bq('highpass', 85); bq('peaking', 1800, 3, 0.7); bq('lowpass', 7000); gn(0.9); }
    else if (inst === 'jazz') { bq('highpass', 80); bq('peaking', 250, 3, 0.8); bq('lowpass', 2800); gn(1.1); }
    else {
      bq('highpass', 90); gn(5);
      const ws = c.createWaveShaper();
      const curve = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; curve[i] = Math.tanh(3 * x) / Math.tanh(3); }
      ws.curve = curve;
      ws.oversample = '2x';
      nodes.push(ws);
      bq('peaking', 800, -3, 0.8); bq('lowpass', 4200); gn(0.3);
    }
    for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
    nodes[nodes.length - 1].connect(dest);
    byInst[inst] = nodes[0];
    return nodes[0];
  }
  const PACKS = {};
  function loadPack(inst) {
    if (!SAMPLED[inst] && inst !== 'muted') return null;
    if (PACKS[inst]) return PACKS[inst];
    const pk = (PACKS[inst] = { state: 'loading', index: null, data: null, decoded: new Map(), onset: new Map(), pending: new Set() });
    if (typeof fetch === 'undefined') { pk.state = 'error'; return pk; }
    // snd/<guitar>.json says where each note sits inside snd/<guitar>.mp3 (the notes' MP3s one after another)
    const get = (ext, kind) => fetch('snd/' + inst + ext).then((r) => { if (!r.ok) throw new Error('http ' + r.status); return r[kind](); });
    Promise.all([get('.json', 'json'), get('.mp3', 'arrayBuffer')]).then(([idx, ab]) => {
      pk.index = idx.notes;
      pk.data = ab;
      pk.base = id3Size(ab);   // a copied file can gain an ID3 tag at the front; the note offsets count from after it
      pk.state = 'ready';
      syncInstStatus();
      decodeAll(inst);
    }).catch(() => { pk.state = 'error'; syncInstStatus(); });
    syncInstStatus();
    return pk;
  }
  function id3Size(ab) {
    try {
      const b = new Uint8Array(ab, 0, Math.min(10, ab.byteLength));
      if (b.length < 10 || b[0] !== 0x49 || b[1] !== 0x44 || b[2] !== 0x33) return 0;   // "ID3"
      const size = ((b[6] & 0x7f) << 21) | ((b[7] & 0x7f) << 14) | ((b[8] & 0x7f) << 7) | (b[9] & 0x7f);
      return 10 + size + (b[5] & 0x10 ? 10 : 0);
    } catch (e) { return 0; }
  }
  function decodeNote(inst, midi) {
    const pk = PACKS[inst], c = ac;
    if (!pk || pk.state !== 'ready' || !c) return Promise.resolve(null);
    const m = String(midi);
    if (pk.decoded.has(m)) return Promise.resolve(pk.decoded.get(m));
    const ent = pk.index[m];
    if (!ent || pk.pending.has(m)) return Promise.resolve(null);
    pk.pending.add(m);
    const slice = pk.data.slice(pk.base + ent[0], pk.base + ent[0] + ent[1]);
    return new Promise((res) => {
      const done = (b) => { pk.pending.delete(m); if (b) { pk.onset.set(m, onsetOf(b)); pk.decoded.set(m, b); } res(b || null); };
      try { const p = c.decodeAudioData(slice, done, () => done(null)); if (p && p.then) p.then(done, () => done(null)); } catch (e) { done(null); }
    });
  }
  // the recorded notes start with up to ~0.2 s of silence (MP3 padding and the recording's lead-in): find where the pluck really starts, so playback can skip straight to it
  function onsetOf(b) {
    try {
      const d = b.getChannelData(0), sr = b.sampleRate, n = Math.min(d.length, Math.floor(sr * 0.6));
      let mx = 0;
      for (let i = 0; i < n; i++) { const a = Math.abs(d[i]); if (a > mx) mx = a; }
      if (!mx) return 0;
      let i = 0;
      while (i < n && Math.abs(d[i]) < mx * 0.08) i++;
      return Math.max(0, i / sr - 0.003);
    } catch (e) { return 0; }
  }
  // decode every note of a guitar in the background, a few at a time, low strings first
  function decodeAll(inst) {
    const list = [];
    for (let m = 40; m <= 88; m++) list.push(m);
    const next = () => { const batch = list.splice(0, 4); if (!batch.length) { syncInstStatus(); return; } Promise.all(batch.map((m) => decodeNote(inst, m))).then(() => setTimeout(next, 10)); };
    next();
  }
  function syncInstStatus() {
    const lab = document.querySelector && document.querySelector('.instsel');
    if (!lab || !lab.classList) return;
    const pk = PACKS[INST];
    lab.classList.toggle('loading', !!(pk && pk.state === 'loading'));
    lab.setAttribute('title', pk && pk.state === 'error' ? 'Recorded sound could not load; using the built-in sound' : 'Guitar sound');
  }
  function guitarNote(c, midi, t, dur, o) {
    // muted strokes on an electric use the recorded palm-muted guitar
    let inst = INST;
    if (o.cut && (inst === 'clean' || inst === 'jazz' || inst === 'overdrive' || inst === 'distortion')) { loadPack('muted'); if (PACKS.muted && PACKS.muted.decoded.has(String(midi))) inst = 'muted'; }
    loadPack(inst);
    const pk = PACKS[inst];
    const rec = pk && pk.decoded.get(String(midi));
    if (!rec) decodeNote(inst, midi);
    const model = MODEL_FOR[inst] || 'steel';
    const buf = rec || noteBuffer(c, model, midi);
    const off = rec ? Math.min(0.4, pk.onset.get(String(midi)) || 0) : 0;
    const left = buf.duration - off;
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    const v = (o.vol || 0.2) * (rec ? 10 * (SAMPLE_GAIN[inst] || 1) : 1.7 * GUITARS[model].gain);
    g.gain.setValueAtTime(v, t);
    // short notes (muted strums, chops) are damped by the hand: a quick fade after `dur`
    const ringFor = Math.min(dur, left);
    g.gain.setTargetAtTime(0, t + ringFor, dur < 0.3 ? 0.012 : 0.06);
    let head = src;
    if (o.cut) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.cut; src.connect(lp); head = lp; }
    head.connect(g);
    g.connect(rec ? o.dest || busNode(c) : bodyChain(c, model, o.dest || busNode(c)));
    src.start(t, off);
    src.stop(Math.min(t + left, t + ringFor + (dur < 0.3 ? 0.12 : 0.5)));
  }
  // build the notes ahead of time, a few at a time while the page is idle, so the first strum is instant
  let warmJob = 0;
  function warmUp() {
    const c = ac;
    if (!c || INST === 'synth') return;
    loadPack(INST);
    if (PACKS[INST] && PACKS[INST].state === 'ready') decodeAll(INST);
    if (SAMPLED[INST]) return;
    const job = ++warmJob;
    const list = [];
    for (let m = 40; m <= 81; m++) list.push(m);
    const step = () => {
      if (job !== warmJob) return;
      const t0 = performance.now();
      while (list.length && performance.now() - t0 < 12) noteBuffer(c, INST, list.shift());
      if (list.length) setTimeout(step, 30);
    };
    setTimeout(step, 200);
  }
  // The microphone gets its own audio context, closed again when listening stops. Opening a microphone inside the
  // context that plays the guitar can leave its sound choppy on some computers (Windows, Bluetooth headsets), even after stopping.
  function micContext() {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try { return new C({ latencyHint: 'playback' }); } catch (e) { try { return new C(); } catch (e2) { return null; } }
  }
  function closeMic(mc) { try { if (mc && mc.state !== 'closed') mc.close(); } catch (e) {} }
  // Playing anything (a scale, a chord, the progression) switches the microphone off first, so the sound plays cleanly.
  // "Hear it to compare" in the chord listener is the one exception: it only pauses listening for a moment.
  let keepListening = false;
  function stopListeningForSound() {
    try {
      const msg = 'Stopped listening so the sound plays cleanly. Press Listen live to listen again.';
      let any = false;
      if (LS.live) { lsStop(); lsSay(msg); any = true; }
      if (SL.live) { slStop(); slSay(msg); any = true; }
      if (GTR.on) { gtrStop(false); txSay(msg); any = true; }
      if (any) flash('Listening stopped');
    } catch (e) {}
  }
  // while the site itself is making sound, the listeners skip it (so they never hear the site instead of your guitar)
  let selfSoundUntil = 0;
  function pluckAt(midi, when, dur, o) {
    const c = audio();
    if (!c) return;
    o = o || {};
    const t = Math.max(when, c.currentTime);
    if (!keepListening) stopListeningForSound();
    selfSoundUntil = Math.max(selfSoundUntil, Date.now() + (t - c.currentTime + Math.min(dur, 2) + 0.25) * 1000);
    if (INST !== 'synth') { guitarNote(c, midi, t, dur, o); return; }
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const v = o.vol || 0.2;
    const out = c.createGain();
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = o.cut || 2600;
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(v, t + 0.01);
    if (o.sustain) out.gain.exponentialRampToValueAtTime(v * 0.3, t + dur * 0.5);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(lp);
    lp.connect(o.dest || busNode(c));
    [['triangle', 1, 1], ['sine', 2, 0.25]].forEach(([type, mult, vol]) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type;
      osc.frequency.value = f * mult;
      g.gain.value = vol;
      osc.connect(g);
      g.connect(out);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });
  }
  function pluck(midi, delay, dur) {
    const c = audio();
    if (!c) return;
    pluckAt(midi, c.currentTime + delay, dur);
  }

  /* ---------- note highlight ---------- */
  let timers = [];
  let lastVM = null;
  const attr = (el, k) => +el.getAttribute(k);
  const dotEls = () => Array.prototype.slice.call($('neck').querySelectorAll('.dot'));
  function schedule(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearLit() {
    dotEls().forEach((el) => el.setAttribute('class', 'dot'));
    $('now').style.visibility = 'hidden';
  }
  function showNow(name, label) {
    $('now').innerHTML = '<span>♪</span> <b>' + esc(name) + '</b> <small>' + esc(label) + '</small>';
    $('now').style.visibility = 'visible';
  }
  // After `delay` ms, light the dots that `pick` accepts ('lit' or 'echo'), keep them lit for `hold` ms.
  function light(delay, hold, pick, name, label) {
    schedule(() => {
      const hit = dotEls().filter((el) => pick(el));
      hit.forEach((el) => {
        if (pick(el) === 'lit' && el.parentNode) el.parentNode.appendChild(el);
        el.setAttribute('class', 'dot ' + pick(el));
        if (pick(el) === 'lit') sparks(el);
      });
      showNow(name, label);
      schedule(() => hit.forEach((el) => el.setAttribute('class', 'dot')), hold);
    }, delay);
  }

  /* ---------- state -> view model ---------- */
  function current() {
    const entry = ENTRIES.find((e) => e.id === S.id) || ENTRIES[0];
    const pat = buildPattern(entry, S.key, S.flats);
    const vm = { entry, pat, dots: [], voicings: [], shown: [], inv: null, set: null, empty: false };
    if (entry.kind === 'drop') {
      const sets = SETS[entry.drop];
      if (S.set >= sets.length) S.set = 0;
      if (S.inv >= INV[entry.drop].length) S.inv = 0;
      vm.inv = INV[entry.drop][S.inv];
      vm.set = sets[S.set];
      const all = findVoicings(pat.notes, vm.inv[1], vm.set);
      vm.voicings = all.filter((v) => v.frets.every((f) => f >= S.from && f <= S.to));
      if (S.pos !== 'all' && !vm.voicings[+S.pos]) S.pos = 'all';
      vm.shown = S.pos === 'all' ? vm.voicings : [vm.voicings[+S.pos]];
      vm.dots = vm.shown.flatMap((v) => v.strings.map((s, i) => ({ s, f: v.frets[i], note: v.tones[i] })));
      vm.empty = vm.voicings.length === 0;
    } else {
      vm.pats = patternsFor(entry, pat.notes);
      if (S.pat !== 'all' && !(vm.pats[+S.pat] && vm.pats[+S.pat].occurrences.length)) S.pat = 'all';
      if (S.pat !== 'all') {
        const p = vm.pats[+S.pat];
        vm.sel = p;
        vm.dots = p.occurrences.flatMap((o) => o.dots);
        vm.patDots = p.occurrences[0].dots;
        // zoom frames the shape that Play plays (the lowest one, when the pattern repeats 12 frets higher)
        vm.range = S.zoom ? [p.occurrences[0].min, p.occurrences[0].max] : [Math.min(...p.occurrences.map((o) => o.min)), Math.max(...p.occurrences.map((o) => o.max))];
      } else {
        vm.dots = dotsFor(pat.notes).filter((d) => d.f >= S.from && d.f <= S.to);
      }
      vm.harm = harmonize(pat.notes, entry);
      if (vm.harm && S.chord !== 'none') {
        const list = S.chordType === 'seventh' ? vm.harm.sevenths : vm.harm.triads;
        if (list[+S.chord]) vm.chord = list[+S.chord];
        else S.chord = 'none';
      }
      if (S.cx && S.cx.tones) vm.chord = S.cx;
      if (vm.chord) {
        const byPc = new Map(vm.chord.tones.map((t) => [t.pc, t]));
        const scalePcs = new Set(pat.notes.map((n) => n.pc));
        const have = new Set(vm.dots.map((d) => d.s + ':' + d.f));
        const mapped = vm.dots.map((d) => {
          const t = byPc.get((OPEN[d.s] + d.f) % 12);
          return t ? { s: d.s, f: d.f, note: t, chordRoot: t.label === '1' } : { s: d.s, f: d.f, note: d.note, dim: true };
        });
        // chord tones that are not in the scale (secondary dominants, borrowed chords) still get drawn
        const lo = vm.sel ? vm.range[0] : S.from;
        const hi = vm.sel ? vm.range[1] : S.to;
        for (let s = 0; s < 6; s++) {
          for (let f = lo; f <= hi; f++) {
            const t = byPc.get((OPEN[s] + f) % 12);
            if (t && !scalePcs.has(t.pc) && !have.has(s + ':' + f)) mapped.push({ s, f, note: t, chordRoot: t.label === '1' });
          }
        }
        vm.dots = S.chordOnly ? mapped.filter((d) => !d.dim) : mapped;
      }
    }
    return vm;
  }

  /* ---------- rendering ---------- */
  function renderLibrary() {
    const q = S.q.trim().toLowerCase();
    const groups = new Map();
    for (const e of ENTRIES) {
      if (q && !(e.name + ' ' + e.group + ' ' + e.sym + ' ' + e.f).toLowerCase().includes(q)) continue;
      if (!groups.has(e.group)) groups.set(e.group, []);
      groups.get(e.group).push(e);
    }
    let html = '';
    groups.forEach((items, name) => {
      html += `<div class="grp"><h3>${esc(name)}</h3>`;
      for (const e of items) {
        const toks = e.f.split(' ');
        const small = toks.length <= 5 ? toks.map(fmtLabel).join(' ') : toks.length + ' notes';
        html += `<div class="itemrow"><button type="button" class="item" data-id="${e.id}" aria-current="${e.id === S.id}"><span>${esc(e.name)}</span><small>${esc(small)}</small></button>`
          + (e.kind === 'scale' ? `<button type="button" class="info itemi" data-info="scale:${e.id}" aria-label="What is the ${esc(e.name)} scale?">i</button>` : '') + `</div>`;
      }
      html += `</div>`;
    });
    const list = $('libList');
    const st = list.scrollTop;
    list.innerHTML = html || '<div class="empty">Nothing matches that search.</div>';
    list.scrollTop = st;
  }

  function seg(id, name, opts, cur) {
    $(id).innerHTML = opts.map(([v, label]) => `<button type="button" data-seg="${name}" data-v="${v}" aria-pressed="${v === cur}">${label}</button>`).join('');
  }

  function options(items, cur) {
    return items.map(([v, label]) => `<option value="${v}"${String(v) === String(cur) ? ' selected' : ''}>${esc(label)}</option>`).join('');
  }

  /* ---------- Chord shapes (diagrams and tab) ---------- */
  const tabText = (sh) => sh.frets.map((f) => (f < 0 ? 'x' : f)).join(' ');
  function shapeLabel(sh) {
    const open = sh.frets.indexOf(0) >= 0;
    return (open ? 'Open position' : 'Fret ' + sh.min + (sh.barre ? ' barre' : '')) + (sh.inversion ? ' (inversion)' : '');
  }
  function shapeSvg(sh, tones, label) {
    const rootPc = tones[0].pc;
    const base = sh.max <= 5 ? 1 : sh.min;
    const sx = (s) => 22 + s * 11;
    const top = 28, rh = 14, rows = 5;
    let g = `<svg viewBox="0 0 90 106" role="img" aria-label="${esc(label)} shape, tab ${esc(tabText(sh))}">`;
    for (let i = 0; i <= rows; i++) {
      g += `<line x1="22" x2="77" y1="${top + i * rh}" y2="${top + i * rh}" stroke="var(--muted)" stroke-width="${i === 0 && base === 1 ? 4 : 1}"/>`;
    }
    for (let s = 0; s < 6; s++) g += `<line x1="${sx(s)}" x2="${sx(s)}" y1="${top}" y2="${top + rows * rh}" stroke="var(--muted)" stroke-width="1"/>`;
    if (base > 1) g += `<text x="1" y="${top + rh * 0.5 + 3.5}" font-size="9.5" font-weight="600" fill="var(--fg)">${base}fr</text>`;
    sh.frets.forEach((f, s) => {
      if (f < 0) g += `<text x="${sx(s)}" y="18" text-anchor="middle" font-size="12" fill="var(--muted)">×</text>`;
      else if (f === 0) g += `<circle cx="${sx(s)}" cy="14" r="3.6" fill="none" stroke="var(--fg)" stroke-width="1.4"/>`;
    });
    if (sh.barre) {
      const y = top + (sh.barre.fret - base + 0.5) * rh;
      g += `<rect x="${sx(sh.barre.from) - 5.5}" y="${y - 5}" width="${sx(sh.barre.to) - sx(sh.barre.from) + 11}" height="10" rx="5" fill="var(--accent)"/>`;
    }
    sh.frets.forEach((f, s) => {
      if (f > 0) {
        const root = (OPEN[s] + f) % 12 === rootPc;
        g += `<circle cx="${sx(s)}" cy="${top + (f - base + 0.5) * rh}" r="5.2" fill="${root ? 'var(--root-dot)' : 'var(--accent)'}"/>`;
      }
    });
    return g + '</svg>';
  }
  // A chord button (tap = hear it and show it on the neck) with a + beside it (add it to the progression)
  function chipHtml(c, attrs, on, extra, addKey) {
    const sh = chordShapes(c.tones, 4).best;
    const shape = sh ? `<span class="mini">${shapeSvg(sh, c.tones, c.name)}</span><span class="tabtxt">${esc(tabText(sh))}</span>` : '';
    return `<div class="cw"><button type="button" class="chordbtn${extra}" ${attrs} aria-pressed="${!!on}"><small>${esc(c.roman)}</small><b>${esc(c.name)}</b><span>${esc(c.tones.map((t) => t.name).join(' '))}</span>${shape}</button>`
      + `<button type="button" class="addbtn" data-add="${addKey}" aria-label="Add ${esc(c.name)} to the progression" title="Add to progression">${ICON.plus}</button></div>`;
  }
  // The forms of one chord, each with Hear (tap the diagram) and Add. src says which list they belong to.
  function shapeCards(ch, list, src) {
    if (!list.length) return '<p class="empty">No simple shape found for this chord. Use the notes on the neck above.</p>';
    return list.map((sh, i) => `<div class="shapecard"><button type="button" class="shapebtn" data-shape="${i}" data-src="${src}" aria-label="Hear ${esc(ch.name)}, ${esc(shapeLabel(sh))}, tab ${esc(tabText(sh))}">${shapeSvg(sh, ch.tones, ch.name)}<small>${esc(shapeLabel(sh))}</small><span class="tabtxt">${esc(tabText(sh))}</span><span class="hearlbl">${ICON.speaker} Hear</span></button>`
      + `<button type="button" class="shapeadd" data-addshape="${i}" data-src="${src}" aria-label="Add this ${esc(ch.name)} shape to the progression">${ICON.plus} Add</button></div>`).join('');
  }
  let shapeList = [];
  function renderShapes(vm) {
    $('shapePanel').hidden = !vm.chord;
    if (!vm.chord) return;
    const res = chordShapes(vm.chord.tones, 4);
    shapeList = res.list;
    $('shapeTitle').textContent = vm.chord.name + ' chord shapes';
    $('shapeGrid').innerHTML = shapeCards(vm.chord, res.list, 'panel');
  }
  // the chord and shape list behind a Hear/Add button: the shape panel or the chord picker
  function trayHtml(ch, src) {
    return `<div class="tray"><div class="tray-head"><b>${esc(ch.name)} shapes</b><span>Tap a shape to hear it, press Add to put it in your progression.</span></div><div class="shapes-grid">${shapeCards(ch, chordShapes(ch.tones, 4).list, src)}</div></div>`;
  }
  function shapeSource(src) {
    return src === 'picker' ? { chord: PK.chord, list: PK.list } : { chord: lastVM && lastVM.chord, list: shapeList };
  }
  function playShape(i, src) {
    const s = shapeSource(src);
    strumShape(s.list[i], s.chord && s.chord.tones);
  }
  // hear a chord (its best-known shape) before choosing a form
  function audition(ch) {
    if (ch && ch.tones) strumShape(chordShapes(ch.tones, 4).best, ch.tones);
  }
  const STRUM_GAP = 0.03;   // seconds between strings in a strum: quick, like a real down-stroke
  // strum a chord shape and light each note on the neck as it sounds
  function strumShape(sh, tones) {
    if (!sh || busy) return;
    const notes = [];
    sh.frets.forEach((f, s) => { if (f >= 0) notes.push([s, f]); });
    notes.forEach(([s, f], k) => {
      pluck(midiFor(s, f), k * STRUM_GAP, 2.0);
      const tone = tones && tones.find((t) => t.pc === (OPEN[s] + f) % 12);
      light(k * STRUM_GAP * 1000, 1500, (el) => (attr(el, 'data-s') === s && attr(el, 'data-f') === f ? 'lit' : ''), tone ? tone.name : '', tone ? fmtLabel(tone.label) : '');
    });
    schedule(() => { if (!busy && !PL.on) $('now').style.visibility = 'hidden'; }, 1700);
  }
  function showBoard() {
    wantJump = true;
    if (LAYOUT === 'tabs') setTab('fretboard');
    const b = $('boardPanel');
    if (!b || !b.scrollIntoView) return;
    let calm = false;
    try { calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}
    b.scrollIntoView({ block: 'nearest', behavior: calm ? 'auto' : 'smooth' });
  }

  /* ---------- Key explorer: circle of fifths, chords, scales, related keys ---------- */
  const CIRC_MAJ = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯/G♭', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];
  const CIRC_MIN = ['Am', 'Em', 'Bm', 'F♯m', 'C♯m', 'G♯m', 'D♯m/E♭m', 'B♭m', 'Fm', 'Cm', 'Gm', 'Dm'];
  const byName = (g, n) => ENTRIES.find((e) => e.group === g && e.name === n);
  let hubList = [], hubScales = [], hubKeys = [];

  function setHome(pc, mode) {
    S.hk = pc;
    S.hm = mode;
    S.key = pc;
    const maj = mode === 'major' ? pc : (pc + 3) % 12;
    if ([7, 2, 9, 4, 11].indexOf(maj) >= 0) S.flats = false;
    else if ([5, 10, 3, 8, 1].indexOf(maj) >= 0) S.flats = true;
    S.id = (mode === 'major' ? byName('Scales', 'Major (Ionian)') : byName('Scales', 'Natural minor (Aeolian)')).id;
    S.pat = 'all';
    S.pos = 'all';
    S.chord = 'none';
    S.cx = null;
    render();
  }
  function circleGo(v) {
    const parts = v.split(':');
    const i = +parts[1];
    if (parts[0] === 'maj') setHome((i * 7) % 12, 'major');
    else setHome((i * 7 + 9) % 12, 'minor');
    playHome();
  }
  // the circle keys sound their own chord: C major for C, A minor for Am, and so on
  function playHome() {
    const ch = lastVM && lastVM.harm && lastVM.harm.triads[0];
    if (!ch) return;
    strumShape(chordShapes(ch.tones, 4).best, ch.tones);
  }
  function polar(r, deg) {
    const a = (deg * Math.PI) / 180;
    return [150 + r * Math.cos(a), 150 + r * Math.sin(a)];
  }
  function arcPath(i, rin, rout) {
    const a = polar(rout, i * 30 - 105), b = polar(rout, i * 30 - 75), c = polar(rin, i * 30 - 75), d = polar(rin, i * 30 - 105);
    const f = (p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    return 'M' + f(a) + 'A' + rout + ' ' + rout + ' 0 0 1 ' + f(b) + 'L' + f(c) + 'A' + rin + ' ' + rin + ' 0 0 0 ' + f(d) + 'Z';
  }

  function renderKey() {
    const mode = S.hm === 'minor' ? 'minor' : 'major';
    const names = S.flats ? FLAT_NAMES : SHARP_NAMES;
    const majE = byName('Scales', 'Major (Ionian)');
    const minE = byName('Scales', 'Natural minor (Aeolian)');
    const hk = ((S.hk % 12) + 12) % 12;
    const home = buildPattern(mode === 'major' ? majE : minE, hk, S.flats).notes;
    const majPc = mode === 'major' ? hk : (hk + 3) % 12;
    const majNotes = mode === 'major' ? home : buildPattern(majE, majPc, S.flats).notes;
    const p = (majPc * 7) % 12;
    const sig = p === 0 ? 'no sharps or flats'
      : p <= 5 ? p + (p === 1 ? ' sharp' : ' sharps')
      : p >= 7 ? 12 - p + (12 - p === 1 ? ' flat' : ' flats')
      : (S.flats ? '6 flats' : '6 sharps');
    const keyName = names[hk] + ' ' + mode;

    // circle
    const ROM = mode === 'major'
      ? [{ 11: 'IV', 0: 'I', 1: 'V' }, { 11: 'ii', 0: 'vi', 1: 'iii' }]
      : [{ 11: '♭VI', 0: '♭III', 1: '♭VII' }, { 11: 'iv', 0: 'i', 1: 'v' }];
    let c = '';
    for (let ring = 0; ring < 2; ring++) {
      const isMaj = ring === 0;
      for (let i = 0; i < 12; i++) {
        const dd = (i - p + 12) % 12;
        const near = dd === 0 || dd === 1 || dd === 11;
        const sel = dd === 0 && isMaj === (mode === 'major');
        const label = isMaj ? CIRC_MAJ[i] : CIRC_MIN[i];
        const roman = near ? ROM[ring][dd] : '';
        const pt = polar(isMaj ? 122 : 81, i * 30 - 90);
        const fsz = isMaj ? (label.length > 3 ? 10.5 : 15) : (label.length > 3 ? 8.5 : 12.5);
        const aria = isMaj ? label + ' major' : label.replace(/m/g, '') + ' minor';
        c += `<g class="cg${near ? ' near' : ''}${sel ? ' sel' : ''}" data-circ="${isMaj ? 'maj' : 'min'}:${i}" role="button" tabindex="0" aria-label="${esc(aria)}" aria-pressed="${sel}">`;
        c += `<path class="cseg" d="${arcPath(i, isMaj ? 100 : 64, isMaj ? 144 : 98)}"/>`;
        c += `<text x="${pt[0].toFixed(1)}" y="${(pt[1] + (roman ? -1 : 4)).toFixed(1)}" text-anchor="middle" font-size="${fsz}" font-weight="600">${esc(label)}</text>`;
        if (roman) c += `<text class="rn" x="${pt[0].toFixed(1)}" y="${(pt[1] + 11).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="600">${esc(roman)}</text>`;
        c += `</g>`;
      }
    }
    c += `<circle cx="150" cy="150" r="58" fill="var(--panel)" stroke="var(--line)"/>`;
    c += `<text class="cn" x="150" y="150" text-anchor="middle" font-size="24" font-weight="700">${esc(names[hk])}</text>`;
    c += `<text class="cm" x="150" y="168" text-anchor="middle" font-size="12">${mode}</text>`;
    c += `<text class="cm" x="150" y="184" text-anchor="middle" font-size="10">${esc(sig)}</text>`;
    $('circle').innerHTML = c;

    seg('hmSeg', 'hm', [['major', 'Major'], ['minor', 'Minor']], mode);
    const type = S.chordType === 'seventh' ? 'seventh' : 'triad';
    seg('hubTypeSeg', 'ctype', [['triad', 'Triads'], ['seventh', '7th chords']], type);
    $('keyHint').textContent = keyName + ' · ' + sig + '. Everything below belongs to this key.';

    // chords
    hubList = []; hubScales = []; hubKeys = [];
    const chordBtns = (list) => list.map((ch) => {
      const i = hubList.push(ch) - 1;
      const on = S.cx && S.cx.name === ch.name && S.cx.roman === ch.roman;
      return chipHtml(ch, 'data-h="' + i + '"', on, ' hubbtn', 'h:' + i);
    }).join('');
    const harm = harmonize(home, mode === 'major' ? majE : minE);
    // the tapped chord's shapes open right under its own list, so there is no scrolling to find them
    const tray = (list) => (S.cx && list.some((ch) => ch.name === S.cx.name && ch.roman === S.cx.roman)
      ? trayHtml(S.cx, 'hub') : '');
    const diaList = type === 'seventh' ? harm.sevenths : harm.triads;
    let h = `<div><h3>Chords in ${esc(keyName)} <button type="button" class="info" data-info="keychords" aria-label="About chords in a key">i</button></h3><p class="hint">Every chord built from the notes of the key, with a playable shape under each. Tap one to hear it and see its shapes. Press + to add it to your progression.</p><div class="chordlist">${chordBtns(diaList)}</div>${tray(diaList)}</div>`;
    relatedChords(home, mode, type).forEach((g) => {
      const gk = /Secondary/.test(g.title) ? 'secondary' : /Borrowed/.test(g.title) ? 'borrowed' : /Substitutes/.test(g.title) ? 'subs' : 'secondary';
      h += `<div><h3>${esc(g.title)} <button type="button" class="info" data-info="${gk}" aria-label="About ${esc(g.title)}">i</button></h3><p class="hint">${esc(g.hint)}</p><div class="chordlist">${chordBtns(g.chords)}</div>${tray(g.chords)}</div>`;
    });

    // ---- what comes next: suggestions under the heading, and highlights on the circle ----
    const findHub = (base) => hubList.findIndex((c) => romanBase(c.roman) === base);
    const selIdx = S.cx ? hubList.findIndex((c) => c.name === S.cx.name && c.roman === S.cx.roman) : -1;
    const picked = selIdx >= 0 ? hubList[selIdx] : null;
    // with no chord chosen, the panel starts from the home chord (I or i); "Related keys" shows how this key connects to others
    const keysView = !picked && S.nxView === 'keys';
    const sel = keysView ? null : picked || hubList[0];
    const KIND = { strong: 'Strong pull', common: 'Common', colour: 'Colour' };
    const viewSeg = `<div class="seg nxview" role="group" aria-label="What the circle shows"><button type="button" data-nxview="chords" aria-pressed="${!keysView}">Next chords</button><button type="button" data-nxview="keys" aria-pressed="${keysView}">Related keys</button></div>`;
    let nx;
    let moves = [];
    if (sel) {
      moves = nextMoves(sel.roman, mode).map((m) => Object.assign({}, m, { i: findHub(m.to) })).filter((m) => m.i >= 0);
      nx = `<div class="nextbox"><div class="nxhead"><h3>What comes next after ${picked ? '' : 'the home chord '}${esc(sel.name)} <span class="nxr">${esc(sel.roman)}</span> <button type="button" class="info" data-info="next" aria-label="About what comes next">i</button></h3>${viewSeg}</div>`
        + `<p class="hint">${picked ? '' : 'Most songs start and end on ' + esc(sel.name) + '. Tap any chord in the key to see its moves instead. '}The circle highlights the same chords: orange is the strongest pull, blue is common, grey adds colour. Tap a chord to hear it and keep going; press + to add it to your progression.</p>`
        + ['strong', 'common', 'colour'].map((k) => {
          const list = moves.filter((m) => m.kind === k);
          if (!list.length) return '';
          return `<div class="nxrow"><span class="nxk ${k}">${KIND[k]}</span><div class="nxlist">` + list.map((m) => {
            const c = hubList[m.i];
            return `<div class="nxitem"><button type="button" class="nxbtn ${k}" data-nh="${m.i}"><b>${esc(c.name)}</b><small>${esc(c.roman)}</small></button>`
              + `<button type="button" class="addbtn nxadd" data-add="h:${m.i}" aria-label="Add ${esc(c.name)} to the progression" title="Add to progression">${ICON.plus}</button><span class="nxwhy">${esc(m.why)}</span></div>`;
          }).join('') + `</div></div>`;
        }).join('') + `</div>`;
    } else {
      // related keys: where a song in this key can move, and why
      const mj = mode === 'major';
      const kn = (pc, m) => names[((pc % 12) + 12) % 12] + ' ' + m;
      const rel = [
        [mj ? (S.hk + 7) % 12 : (S.hk + 7) % 12, mode, 'V', 'strong', 'Dominant: one step clockwise. One sharp more (or one flat less), so it shares 6 of 7 notes. The most common key change.'],
        [(S.hk + 5) % 12, mode, 'IV', 'common', 'Subdominant: one step anticlockwise. One flat more (or one sharp less). Feels like moving away, gently.'],
        [mj ? (S.hk + 9) % 12 : (S.hk + 3) % 12, mj ? 'minor' : 'major', 'rel', 'common', 'Relative ' + (mj ? 'minor' : 'major') + ': exactly the same notes, a different home. Same spot on the circle, ' + (mj ? 'inner' : 'outer') + ' ring.'],
        [S.hk, mj ? 'minor' : 'major', 'par', 'colour', 'Parallel ' + (mj ? 'minor' : 'major') + ': same root, other mood. Its chords are the "borrowed" chords, for a darker or brighter colour.'],
      ];
      nx = `<div class="nextbox"><div class="nxhead"><h3>Keys related to ${esc(keyName)} <button type="button" class="info" data-info="related" aria-label="About related keys">i</button></h3>${viewSeg}</div>`
        + `<p class="hint">Keys that sit close to this one, so songs often move between them. They are marked on the circle. Tap one to move there.</p>`
        + rel.map(([pc, m, tag, k, why]) => `<div class="nxrow"><span class="nxk ${k}">${tag === 'rel' ? 'Relative' : tag === 'par' ? 'Parallel' : tag === 'V' ? 'Dominant' : 'Subdominant'}</span><div class="nxlist"><div class="nxitem"><button type="button" class="nxbtn ${k}" data-gokey="${pc}:${m}"><b>${esc(kn(pc, m))}</b><small>${esc(tag)}</small></button><span class="nxwhy">${esc(why)}</span></div></div></div>`).join('')
        + `</div>`;
    }
    h = nx + h;
    // harmony highlights (like a colour wheel's harmony marks): tint the related spots instead of drawing arrows
    const spotOf = (ch) => {
      const pc = ch.tones[0].pc;
      const minor = !!ch.tones[1] && ((ch.tones[1].pc - pc + 12) % 12) === 3;
      return { ring: minor ? 'min' : 'maj', i: minor ? ((pc + 3) * 7) % 12 : (pc * 7) % 12 };
    };
    const marks = {};
    const mark = (ring, i, cls, tag) => { const k = ring + ':' + (((i % 12) + 12) % 12); if (!marks[k]) marks[k] = { cls, tag }; };
    if (sel) {
      const s0 = spotOf(sel);
      mark(s0.ring, s0.i, 'hsrc', '');
      moves.forEach((m) => { const sp = spotOf(hubList[m.i]); mark(sp.ring, sp.i, 'hl-' + m.kind, ''); });
    } else {
      const ring = mode === 'major' ? 'maj' : 'min', otherRing = mode === 'major' ? 'min' : 'maj';
      mark(ring, p, 'hsrc', '');
      mark(ring, p + 1, 'hl-key', 'V');
      mark(ring, p + 11, 'hl-key', 'IV');
      mark(otherRing, p, 'hl-key', 'rel');
      mark(otherRing, mode === 'major' ? ((hk + 3) * 7) % 12 : (hk * 7) % 12, 'hl-key', 'par');
    }
    let dots = '<g class="hdots">';
    let rings = '<g class="hrings">';
    c = c.replace(/class="(cg[^"]*)" data-circ="(maj|min):(\d+)"/g, (all, cls, ring, i) => {
      const m = marks[ring + ':' + i];
      if (!m) return all;
      const maj = ring === 'maj';
      const pt = polar(maj ? 144 : 98, +i * 30 - 90);
      rings += `<path class="hring ${m.cls}" d="${arcPath(+i, maj ? 100 : 64, maj ? 144 : 98)}"/>`;
      if (m.cls !== 'hsrc') dots += `<circle class="hdot ${m.cls}" cx="${pt[0].toFixed(1)}" cy="${pt[1].toFixed(1)}" r="${maj ? 3.6 : 3}"/>`;
      if (m.tag === 'par') {
        const tp = polar(maj ? 122 : 81, +i * 30 - 90);
        dots += `<text class="htag" x="${tp[0].toFixed(1)}" y="${(tp[1] + (maj ? 16 : 14)).toFixed(1)}" text-anchor="middle">par</text>`;
      }
      return `class="${cls} ${m.cls}" data-circ="${ring}:${i}"`;
    });
    dots += '</g>';
    rings += '</g>';
    const cut = c.indexOf('<circle cx="150" cy="150" r="58"');
    $('circle').innerHTML = `<g class="hfocus ${sel ? 'chordfocus' : 'keyfocus'}">` + c.slice(0, cut) + rings + c.slice(cut) + dots + '</g>';
    const note = $('circNote');
    if (note) note.textContent = sel ? 'Highlighted: where ' + sel.name + ' usually goes next. Orange outline: the strongest pull. Blue: common. Grey dashed: adds colour. Faded chords are less likely next.' : 'Lit up: the keys that go with ' + keyName + '. V and IV are its neighbours, rel is the relative key (same notes), par is the parallel key (same root).';
    const chordsHtml = h;
    renderListen();
    renderScaleListen();
    h = '';
    // scales
    const sBtn = (group, name, note, label, small) => {
      const entry = byName(group, name);
      const i = hubScales.push({ id: entry.id, pc: note.pc }) - 1;
      const on = S.id === entry.id && S.key === note.pc;
      return `<button type="button" class="chordbtn hubbtn" data-sc="${i}" aria-pressed="${on}"><small>${esc(small)}</small><b>${esc(note.name + ' ' + label)}</b></button>`;
    };
    const modeNames = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];
    const homeMode = mode === 'major' ? 0 : 5;
    const modes = modeNames.map((n, k) => sBtn('Modes', n, majNotes[k], n, k === homeMode ? 'Home scale' : 'Mode on degree ' + (k + 1))).join('');
    const rel = majNotes[5];
    const T0 = home[0];
    const pent = mode === 'major'
      ? [sBtn('Scales', 'Major pentatonic', majNotes[0], 'major pentatonic', 'On the tonic'), sBtn('Scales', 'Minor pentatonic', rel, 'minor pentatonic', 'Relative minor'), sBtn('Scales', 'Blues', rel, 'blues', 'Relative minor')]
      : [sBtn('Scales', 'Minor pentatonic', T0, 'minor pentatonic', 'On the tonic'), sBtn('Scales', 'Blues', T0, 'blues', 'On the tonic'), sBtn('Scales', 'Major pentatonic', majNotes[0], 'major pentatonic', 'Relative major')];
    const colour = mode === 'major'
      ? [sBtn('Scales', 'Natural minor (Aeolian)', T0, 'natural minor', 'Parallel minor'), sBtn('Scales', 'Harmonic minor', T0, 'harmonic minor', 'Parallel minor'), sBtn('Scales', 'Melodic minor', T0, 'melodic minor', 'Parallel minor')]
      : [sBtn('Scales', 'Harmonic minor', T0, 'harmonic minor', 'Raised 7th'), sBtn('Scales', 'Melodic minor', T0, 'melodic minor', 'Raised 6th and 7th'), sBtn('Modes', 'Dorian', T0, 'Dorian', 'Raised 6th'), sBtn('Dominant scales', 'Phrygian dominant', home[4], 'Phrygian dominant', 'Over the V chord')];
    h += `<div><h3>Scales for this key <button type="button" class="info" data-info="scales" aria-label="About scales for this key">i</button></h3><p class="hint">Tap a scale to see it on the neck. The modes use the same notes as the key, so they fit the same chords.</p>`
      + `<div class="label sub">Modes with the same notes</div><div class="chordlist">${modes}</div>`
      + `<div class="label sub">Pentatonic and blues</div><div class="chordlist">${pent.join('')}</div>`
      + `<div class="label sub">${mode === 'major' ? 'From the parallel minor' : 'Minor-key colours'}</div><div class="chordlist">${colour.join('')}</div></div>`;

    // related keys
    const rk = mode === 'major'
      ? [['Dominant (V)', (hk + 7) % 12, 'major'], ['Subdominant (IV)', (hk + 5) % 12, 'major'], ['Relative minor', (hk + 9) % 12, 'minor'], ['Parallel minor', hk, 'minor']]
      : [['Dominant (v)', (hk + 7) % 12, 'minor'], ['Subdominant (iv)', (hk + 5) % 12, 'minor'], ['Relative major', (hk + 3) % 12, 'major'], ['Parallel major', hk, 'major']];
    h += `<div><h3>Related keys <button type="button" class="info" data-info="related" aria-label="About related keys">i</button></h3><p class="hint">The dominant, subdominant and relative keys share six of their seven notes with this key. Tap one to move there.</p><div class="chordlist">`
      + rk.map((k) => {
        const i = hubKeys.push({ pc: k[1], mode: k[2] }) - 1;
        return `<button type="button" class="chordbtn hubbtn" data-rk="${i}" aria-pressed="false"><small>${esc(k[0])}</small><b>${esc(names[k[1]] + ' ' + k[2])}</b></button>`;
      }).join('') + `</div></div>`;
    $('keyInfo').innerHTML = chordsHtml;
    $('keyScales').innerHTML = h;
  }

  function renderChords(vm) {
    $('chordPanel').hidden = !vm.harm;
    if (!vm.harm) return;
    const list = S.chordType === 'seventh' ? vm.harm.sevenths : vm.harm.triads;
    seg('chordTypeSeg', 'ctype', [['triad', 'Triads'], ['seventh', '7th chords']], S.chordType);
    $('chordList').innerHTML = list
      .map((c, i) => chipHtml(c, 'data-c="' + i + '"', String(i) === String(S.chord) && !S.cx, '', 'c:' + i))
      .join('');
    $('chordTray').innerHTML = vm.chord && !S.cx ? trayHtml(vm.chord, 'scale') : '';
    $('chordOnly').checked = S.chordOnly;
    $('chordHint').textContent = vm.chord
      ? vm.chord.name + ' is showing on the neck. Tap it again to clear it. Press + to add a chord to your progression.'
      : 'Tap a chord to hear it and show it on the neck, inside the scale. Press + to add it to your progression.';
  }

  function render() {
    const vm = current();
    lastVM = vm;
    const { entry, pat } = vm;

    // keys
    const names = S.flats ? FLAT_NAMES : SHARP_NAMES;
    $('keys').innerHTML = names.map((n, i) => `<button type="button" class="key" data-k="${i}" aria-pressed="${i === S.key}">${n}</button>`).join('');
    seg('labelSeg', 'labels', [['note', 'Notes'], ['interval', 'Intervals'], ['none', 'None']], S.labels);
    seg('accSeg', 'acc', [['flat', '♭ Flats'], ['sharp', '♯ Sharps']], S.flats ? 'flat' : 'sharp');
    $('ghost').checked = S.ghost;

    // fret range selects (always a valid range)
    const fromItems = [];
    for (let i = 0; i < S.to; i++) fromItems.push([i, i === 0 ? 'Open (0)' : String(i)]);
    const toItems = [];
    for (let i = S.from + 1; i <= MAX_FRET; i++) toItems.push([i, String(i)]);
    $('from').innerHTML = options(fromItems, S.from);
    $('to').innerHTML = options(toItems, S.to);
    $('from').disabled = !!vm.sel;
    $('to').disabled = !!vm.sel;

    // pattern selector (scales use real patterns, arpeggios use neck sections)
    const isDropEntry = entry.kind === 'drop';
    $('patField').hidden = isDropEntry;
    $('zoomField').hidden = isDropEntry || !vm.sel;
    $('zoom').checked = S.zoom;
    if (!isDropEntry) {
      const isPattern = vm.pats[0].label.indexOf('Pattern') === 0;
      $('patLbl').textContent = isPattern ? 'Pattern' : 'Neck section';
      $('pat').innerHTML = options([['all', isPattern ? 'All patterns' : 'Whole neck']].concat(vm.pats.map((p, i) => [i, p.label])), S.pat);
    }

    // voicing controls
    const isDrop = entry.kind === 'drop';
    $('dropCtl').hidden = !isDrop;
    if (isDrop) {
      $('dSet').innerHTML = options(SETS[entry.drop].map((s, i) => [i, 'Strings ' + setLabel(s)]), S.set);
      $('dInv').innerHTML = options(INV[entry.drop].map(([n, order], i) => [i, n + ' (bass ' + pat.notes[order[0]].name + ')']), S.inv);
      const posItems = [['all', 'All positions']];
      vm.voicings.forEach((v, i) => posItems.push([i, 'Position ' + (i + 1) + ' (frets ' + (v.min === v.max ? v.min : v.min + '–' + v.max) + ')']));
      $('dPos').innerHTML = options(posItems, S.pos);
    }

    // title and meta
    let title, meta;
    const formula = entry.f.split(' ').map(fmtLabel).join(' ');
    if (entry.kind === 'scale') {
      title = pat.rootName + ' ' + entry.name;
      meta = pat.notes.length + ' notes · ' + formula;
    } else if (entry.kind === 'arp') {
      title = pat.rootName + entry.sym + ' · ' + entry.name + ' arpeggio';
      meta = pat.notes.length + ' notes · ' + formula;
    } else if (entry.kind === 'diatonic') {
      const keyType = entry.group.includes('minor') ? 'minor' : 'major';
      title = pat.rootName + entry.sym + ' arpeggio';
      meta = entry.roman + ' chord in ' + pat.keyName + ' ' + keyType + ' · ' + formula;
    } else {
      title = pat.rootName + entry.sym + ' · Drop ' + entry.drop;
      meta = vm.inv[0] + ' · strings ' + setLabel(vm.set) + ' · ' + formula;
    }
    if (vm.chord) {
      title = vm.chord.name + ' in ' + title;
      meta = (vm.chord.roman ? vm.chord.roman + ' chord' : 'Chord') + ': ' + vm.chord.tones.map((t) => t.name).join(' – ') + ' · ' + meta;
    }
    renderChords(vm);
    renderShapes(vm);
    renderKey();
    renderPickerRoots();
    renderCommon();
    $('patTitle').textContent = title;
    if (vm.sel) meta += ' · ' + vm.sel.label;
    $('patMeta').textContent = meta;

    // fretboard
    let rf = S.from;
    let rt = S.to;
    if (vm.sel) {
      rf = S.zoom ? Math.max(0, vm.range[0] - 1) : 0;
      rt = S.zoom ? Math.min(MAX_FRET, vm.range[1] + 1) : MAX_FRET;
    }
    const shownKey = new Set(vm.dots.map((d) => d.s + ':' + d.f));
    let ghostDots = [];
    if (S.ghost) {
      for (let s = 0; s < 6; s++) {
        for (let f = rf; f <= rt; f++) if (!shownKey.has(s + ':' + f)) ghostDots.push({ s, f });
      }
    }
    const svg = $('neck');
    const x0 = rf <= 0 ? 0 : Math.max(0, fx(rf - 1) - 6);
    const x1 = rt >= MAX_FRET ? VBW : fx(rt) + 8;
    svg.setAttribute('viewBox', x0.toFixed(1) + ' 0 ' + (x1 - x0).toFixed(1) + ' ' + VBH);
    svg.style.minWidth = Math.round((x1 - x0) * 0.72) + 'px';
    svg.innerHTML = boardSvg(vm.dots, ghostDots);
    pkPaint();
    const bn = $('boardNote');
    bn.hidden = !vm.empty;
    if (vm.empty) bn.textContent = 'No ' + title + ' voicing fits between fret ' + S.from + ' and fret ' + S.to + '. Widen the range or choose another string set or inversion.';

    // chips
    $('chips').innerHTML = pat.notes.map((n) => `<li class="chip${n.label === '1' ? ' root' : ''}"><b>${esc(n.name)}</b><small>${esc(fmtLabel(n.label))}</small></li>`).join('');

    // detail
    let d = '';
    if (entry.kind === 'scale') {
      const semis = pat.notes.map((n) => n.semis).concat([12]);
      const steps = semis.slice(1).map((v, i) => v - semis[i]).join(' ');
      d += `<div class="label">Step pattern (semitones)</div><p class="mono">${steps}</p>`;
      d += vm.chord
        ? `<p>Amber is the chord root, blue are the other chord tones, and the faint dots are the rest of the scale.</p>`
        : `<p>Every ${esc(pat.rootName)} on the neck is amber. All other scale notes are blue.</p>`;
    } else if (entry.kind === 'arp') {
      d += `<div class="label">Chord tones</div><p>${pat.notes.map((n) => esc(n.name)).join(' – ')}</p>`;
      d += `<p>Every ${esc(pat.rootName)} on the neck is amber, the other chord tones are blue.</p>`;
    } else if (entry.kind === 'diatonic') {
      d += `<div class="label">Chord tones</div><p>${pat.notes.map((n) => esc(n.name)).join(' – ')}</p>`;
    } else {
      const bottom = vm.inv[1].map((i) => pat.notes[i]);
      d += `<div class="label">Notes, bottom to top</div><p>${bottom.map((n) => esc(n.name)).join(' – ')}</p>`;
      d += `<div class="label" style="margin-top:10px">Fret numbers by string (${esc(setLabel(vm.set))})</div>`;
      d += vm.voicings.length
        ? '<ul class="shapes">' + vm.voicings.map((v, i) => `<li>Position ${i + 1}: ${v.frets.join(' · ')}</li>`).join('') + '</ul>'
        : '<p>None in the chosen fret range.</p>';
    }
    if (vm.sel && entry.kind !== 'drop') {
      const where = vm.sel.occurrences.map((o) => 'frets ' + o.min + '–' + o.max).join(' and ');
      d += `<div class="label" style="margin-top:10px">Where it sits</div><p>${esc(vm.sel.label)}: ${where}.</p>`;
    }
    $('detail').innerHTML = d;
    save();
  }

  /* ---------- playback ---------- */
  let busy = false;
  let busyTimer = 0;
  // a list played up, then back down to where it started (the top note once)
  const upDown = (list) => list.concat(list.slice(0, -1).reverse());
  function playCurrent() {
    if (busy || PL.on) return;
    const vm = current();
    let end = 0;
    if (vm.entry.kind === 'drop') {
      const v = vm.shown[0];
      if (!v) return;
      const midis = v.strings.map((s, i) => midiFor(s, v.frets[i]));
      // strum it, then play it note by note, up and back down
      const order = upDown(midis.map((m, i) => i));
      midis.forEach((m, i) => pluck(m, i * 0.07, 2.2));
      order.forEach((i, k) => pluck(midis[i], 2.0 + k * 0.3, 1.0));
      end = 2.0 + order.length * 0.3 + 1;
      const same = (i) => (el) => (attr(el, 'data-s') === v.strings[i] && attr(el, 'data-f') === v.frets[i] ? 'lit' : '');
      v.tones.forEach((tone, i) => light(i * 70, 1900 - i * 70, same(i), tone.name, fmtLabel(tone.label)));
      order.forEach((i, k) => light(2000 + k * 300, 280, same(i), v.tones[i].name, fmtLabel(v.tones[i].label)));
    } else if (vm.sel) {
      // a chosen pattern plays as a sequence: lowest note to highest and back down, even when a chord is highlighted on it
      const seen = new Set();
      const up = vm.patDots
        .slice()
        .sort((a, b) => midiFor(a.s, a.f) - midiFor(b.s, b.f) || a.s - b.s)
        .filter((d) => {
          const m = midiFor(d.s, d.f);
          if (seen.has(m)) return false;
          seen.add(m);
          return true;
        });
      const seq = upDown(up);
      seq.forEach((d, i) => {
        pluck(midiFor(d.s, d.f), i * 0.2, 0.7);
        const pick = (el) => (attr(el, 'data-s') === d.s && attr(el, 'data-f') === d.f ? 'lit' : attr(el, 'data-pc') === d.note.pc ? 'echo' : '');
        light(i * 200, 180, pick, d.note.name, fmtLabel(d.note.label));
      });
      end = seq.length * 0.2 + 0.8;
    } else if (vm.chord) {
      let prev = 48 + ((((vm.chord.tones[0].pc - 48) % 12) + 12) % 12) - 1;
      const midis = vm.chord.tones.map((t) => {
        let m = prev + 1;
        while (m % 12 !== t.pc) m++;
        prev = m;
        return m;
      });
      // strum the chord, then its notes one by one: up to the octave and back down
      const tones = vm.chord.tones.slice();
      const oct = midis[0] + 12;
      const upList = midis.map((m, i) => ({ m, t: tones[i] })).concat(oct > midis[midis.length - 1] ? [{ m: oct, t: tones[0] }] : []);
      const seq = upDown(upList);
      midis.forEach((m, i) => pluck(m, i * 0.07, 2.2));
      seq.forEach((n, k) => pluck(n.m, 2.0 + k * 0.3, 1.0));
      end = 2.0 + seq.length * 0.3 + 1;
      const pickFor = (m, pc) => (el) => (attr(el, 'data-midi') === m ? 'lit' : attr(el, 'data-pc') === pc ? 'echo' : '');
      tones.forEach((t, i) => light(i * 70, 1900 - i * 70, pickFor(midis[i], t.pc), t.name, fmtLabel(t.label)));
      seq.forEach((n, k) => light(2000 + k * 300, 280, pickFor(n.m, n.t.pc), n.t.name, fmtLabel(n.t.label)));
    } else {
      const rootPc = vm.pat.notes[0].pc;
      const base = 48 + ((((rootPc - 48) % 12) + 12) % 12);
      const up = vm.pat.notes.map((n) => base + n.semis).sort((a, b) => a - b);
      up.push(base + 12);
      const seq = upDown(up);
      seq.forEach((m, i) => pluck(m, i * 0.28, 0.9));
      end = seq.length * 0.28 + 0.8;
      seq.forEach((m, i) => {
        const note = vm.pat.notes.find((n) => n.pc === m % 12);
        const pick = (el) => (attr(el, 'data-midi') === m ? 'lit' : attr(el, 'data-pc') === m % 12 ? 'echo' : '');
        light(i * 280, 250, pick, note.name, fmtLabel(note.label));
      });
    }
    busy = true;
    $('playBtn').innerHTML = 'Playing…';
    syncTransport();
    setTimeout(() => {
      busy = false;
      clearLit();
      $('playBtn').innerHTML = PLAY_HTML;
      syncTransport();
    }, end * 1000);
  }

  /* ---------- Progression workspace: arrange chords, set tempo and speed, play ---------- */
  const P = cleanProg((() => {
    try { return JSON.parse(localStorage.getItem('fretboard-prog') || 'null'); } catch (e) { return null; }
  })());
  const saveProg = () => {
    try { localStorage.setItem('fretboard-prog', JSON.stringify(P)); } catch (e) {}
  };
  // playback state (not saved)
  const PL = { on: false, idx: 0, next: 0, beat: 0, events: [], steps: [], active: -1, timer: 0, ended: false, endAt: 0, out: null };
  // the "add any chord" picker
  const ARPS = ENTRIES.filter((e) => e.kind === 'arp');
  const PK = { root: 0, q: 0, chord: null, list: [], forced: undefined, bass: -1 };
  let progVisible = false, flashTimer = 0, flashText = '', clearArmed = 0;
  const taps = [];
  const SPEED_LABEL = { 0.5: '½×', 0.75: '¾×', 1: '1×', 1.5: '1.5×', 2: '2×' };

  const beatSec = () => 60 / (P.bpm * P.speed);
  const slotName = (sl) => sl.name + (sl.roman ? ' (' + sl.roman + ')' : '');
  function say(msg) {
    const m = $('progMsg');
    if (m) m.textContent = msg;
  }
  function shapeOf(sl) {
    if (!sl.frets) return null;
    const k = sl.frets.join(',');
    const hit = chordShapes(sl.tones, 4, sl.bass).all.find((c) => c.frets.join(',') === k);
    if (hit) return hit;
    const fr = sl.frets.filter((f) => f > 0);
    return { frets: sl.frets, min: fr.length ? Math.min.apply(null, fr) : 0, max: fr.length ? Math.max.apply(null, fr) : 0, barre: null, inversion: false };
  }
  function clickAt(when, accent) {
    const c = audio();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = accent ? 1500 : 1000;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(accent ? 0.14 : 0.09, when + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
    o.connect(g);
    g.connect(PL.out || busNode(c));
    o.start(when);
    o.stop(when + 0.08);
  }
  // hear one chord of the progression, once, as a strum
  function auditionSlot(sl) {
    if (sl.frets) strumShape({ frets: sl.frets }, sl.tones);
    else slotMidis(sl).forEach((m, k) => pluck(m, k * STRUM_GAP, 2.0));
  }
  function lightSlot(sl, dur) {
    if (!sl.frets) return;
    let k = 0;
    sl.frets.forEach((f, s) => {
      if (f < 0) return;
      light(k++ * 45, Math.max(250, Math.min(1400, dur * 900)), (el) => (attr(el, 'data-s') === s && attr(el, 'data-f') === f ? 'lit' : ''), sl.name, sl.roman ? fmtLabel(sl.roman) : '');
    });
  }

  function syncTransport() {
    const b = $('progPlay');
    if (b) {
      b.innerHTML = PL.on ? STOP_HTML : PLAY_HTML;
      b.disabled = !PL.on && (!P.slots.length || busy);
      b.setAttribute('aria-pressed', String(PL.on));
    }
    const pb = $('playBtn');
    if (pb) pb.disabled = busy || PL.on;
    syncDock();
  }
  function syncDock() {
    const d = $('dock');
    if (!d) return;
    const n = P.slots.length;
    const one = typeof LAYOUT !== 'undefined' && LAYOUT === 'one';
    const show = (one || n > 0) && !progVisible;
    d.hidden = !show;
    if (root && root.classList) root.classList.toggle('hasdock', show);
    const act = PL.on && PL.active >= 0 ? P.slots[PL.active] : null;
    const tc = $('tabProgCount');
    if (tc) tc.textContent = n ? String(n) : '';
    $('dockGo').textContent = flashText || (act ? 'Playing ' + act.name : 'Progression · ' + n + (n === 1 ? ' chord' : ' chords'));
    const strip = $('dockStrip');
    if (strip) {
      strip.hidden = !one;
      if (one) {
        const key = 'k:' + P.slots.map((s, i) => s.name + s.beats + (i === PL.active && PL.on ? '*' : '')).join('|');
        if (strip.getAttribute('data-key') !== key) {
          strip.setAttribute('data-key', key);
          strip.innerHTML = n
            ? P.slots.map((s, i) => `<button type="button" class="dchip${i === PL.active && PL.on ? ' playing' : ''}" data-dhear="${i}" title="Hear ${esc(s.name)}"><b>${esc(s.name)}</b><small>${s.beats}</small></button>`).join('')
            : '<span class="dempty">Press + on any chord to add it here</span>';
          strip.scrollLeft = strip.scrollWidth;
        }
      }
    }
    const dp = $('dockPlay');
    dp.innerHTML = PL.on ? STOP_HTML : PLAY_HTML;
    dp.disabled = !PL.on && busy;
  }
  function flash(text) {
    flashText = text;
    syncDock();
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { flashText = ''; syncDock(); }, 1800);
  }

  function slotHtml(sl, i) {
    const sh = shapeOf(sl);
    const forms = chordShapes(sl.tones, 4, sl.bass).list;
    const fi = sl.frets ? forms.findIndex((f) => f.frets.join(',') === sl.frets.join(',')) : -1;
    const form = sh ? shapeLabel(sh) : 'No simple shape';
    const formTxt = forms.length > 1 && fi >= 0 ? (fi + 1) + '/' + forms.length + ' · ' + form : form;
    const last = i === P.slots.length - 1;
    const ib = (act, icon, label, dis) => `<button type="button" class="ib" data-act="${act}" data-i="${i}" aria-label="${esc(label)}"${dis ? ' disabled' : ''}>${icon}</button>`;
    return `<div class="slot${i === PL.active && PL.on ? ' playing' : ''}" data-slot="${i}" draggable="true" role="group" aria-label="Chord ${i + 1} of ${P.slots.length}: ${esc(slotName(sl))}, ${sl.beats} beats">`
      + `<div class="slot-top"><span class="num">${i + 1}</span><span class="slot-tools">${ib('edit', ICON.edit, 'Edit ' + sl.name)}${ib('del', ICON.x, 'Remove ' + sl.name + ' from the progression')}</span></div>`
      + `<button type="button" class="slot-hear" data-act="hear" data-i="${i}" aria-label="Hear ${esc(sl.name)}"><small>${esc((AN && AN.chords[i] ? AN.chords[i].label : sl.roman) + (AN && AN.chords[i] && Number.isInteger(sl.bass) && sl.name.indexOf('/') > 0 ? '/' + sl.name.split('/')[1] : '')) || '&nbsp;'}</small><b>${esc(sl.name)}</b>`
      + (sh ? `<span class="mini">${shapeSvg(sh, sl.tones, sl.name)}</span><span class="tabtxt">${esc(tabText(sh))}</span>` : '<span class="tabtxt">notes only</span>')
      + `</button>`
      + `<div class="slot-row">${ib('fprev', ICON.prev, 'Previous shape for ' + sl.name, forms.length < 2)}<span class="slot-lbl" title="Shape">${esc(formTxt)}</span>${ib('fnext', ICON.next, 'Next shape for ' + sl.name, forms.length < 2)}</div>`
      + `<div class="slot-row">${ib('bminus', ICON.minus, 'Fewer beats for ' + sl.name, sl.beats <= 1)}<span class="slot-lbl">${sl.beats} ${sl.beats === 1 ? 'beat' : 'beats'}</span>${ib('bplus', ICON.plus, 'More beats for ' + sl.name, sl.beats >= 8)}</div>`
      + `<div class="slot-row">${ib('left', ICON.earlier, 'Move ' + sl.name + ' earlier', i === 0)}${ib('dup', ICON.copy, 'Duplicate ' + sl.name)}${ib('right', ICON.later, 'Move ' + sl.name + ' later', last)}</div>`
      + `<label class="slot-style"><span class="sr">Pattern for ${esc(sl.name)}</span><select data-slotstyle="${i}">`
      + `<option value=""${sl.style ? '' : ' selected'}>Pattern: same as all</option>`
      + allRhythms().map((r) => `<option value="${r.id}"${sl.style === r.id ? ' selected' : ''}>${esc(r.name)}</option>`).join('')
      + `</select></label>`
      + `<span class="bar"></span></div>`;
  }

  /* ---------- Analysis of your progression: key, each chord's type, number and job, cadences, and what kind of progression it is ---------- */
  let AN = null;
  const FN_NAME = { T: 'Home', PD: 'Away', D: 'Tension' };
  const KIND_NAME = { diatonic: 'In the key', secondary: 'Secondary dominant', borrowed: 'Borrowed', chromatic: 'Outside the key' };
  const typeName = (sym, c) => { const e = ARP_ENTRIES.find((x) => x.sym === sym); return (e ? e.name.replace(' triad', '') : 'Custom chord') + (c && Number.isInteger(c.bass) && c.name.indexOf('/') > 0 ? ', ' + c.name.split('/')[1] + ' in the bass' : ''); };
  function renderAnalysis() {
    const box = $('progAna');
    if (!box) return;
    const sum = $('secAnaSum');
    if (!AN || P.slots.length < 2) {
      box.innerHTML = '<p class="hint">Add at least two chords and the analysis appears here: the key, what kind of progression it is (a 2–5–1, a pop loop…), each chord\u2019s job, and what to play next.</p>';
      if (sum) sum.textContent = '';
      return;
    }
    const names = S.flats ? FLAT_NAMES : SHARP_NAMES;
    const k = AN.key;
    const keyName = names[k.tonic] + ' ' + k.mode;
    const formula = AN.chords.map((c) => c.label + (Number.isInteger(c.bass) && c.name.indexOf('/') > 0 ? '/' + c.name.split('/')[1] : '')).join(' – ');
    const norm = (s) => s.replace(/[°ø+]/g, '');
    const types = AN.matches.length
      ? AN.matches.map((m) => `<div class="anmatch"><b>${esc(m.name)}</b> <span class="anf">${esc(m.alt)}</span>${m.sameKey === false ? ` <span class="anf">counted in ${esc((S.flats ? FLAT_NAMES : SHARP_NAMES)[m.tonic])} ${m.mode}</span>` : ''}<p>${esc(m.hint)}</p></div>`).join('')
      : `<div class="anmatch"><b>Your own progression</b><p>It is not one of the well-known loops, so it is all yours. The notes below show how it moves.</p></div>`;
    const has251 = AN.notes.some((x) => x.kind === '251') || AN.matches.some((m) => m.id === '251' || m.id === 'm251');
    const cards = AN.chords.map((c, i) => `<div class="anchord ${c.kind}"><small>${i + 1}</small><b>${esc(c.name)}</b><span class="antype">${esc(typeName(c.sym, c))}</span><span class="anroman">${esc(c.label + (Number.isInteger(c.bass) && c.name.indexOf('/') > 0 ? '/' + c.name.split('/')[1] : ''))}</span>`
      + (c.fn ? `<span class="anfn fn-${c.fn}">${esc(FN_NAME[c.fn])}</span>` : '') + `<span class="ankind">${esc(KIND_NAME[c.kind])}</span></div>`).join('');
    const last = AN.chords[AN.chords.length - 1];
    const nexts = nextMoves(last.base, k.mode).slice(0, 4).map((m) => {
      const r = chordFromRoman(m.to, k.tonic);
      if (!r) return '';
      const qi = ARP_ENTRIES.findIndex((e) => e.sym === r.sym);
      const ch = pickerChord(qi < 0 ? 0 : qi, r.root, S.flats);
      return `<button type="button" class="nxbtn ${m.kind}" data-ana-add="${r.root}:${esc(r.sym)}" title="${esc(m.why)}"><b>${esc(ch.name)}</b><small>${esc(m.to)}</small></button>`;
    }).join('');
    const sc = k.mode === 'major' ? [['e0', 'major scale'], ['e4', 'major pentatonic']] : [['e1', 'natural minor scale'], ['e5', 'minor pentatonic'], ['e6', 'blues scale']];
    box.innerHTML = `<div class="anhead"><div><span class="ankey">Key: <b>${esc(keyName)}</b></span> <span class="hint">${k.fit}% of the chords are in the key${k.alt && k.alt[0] ? ' · could also be ' + esc(names[k.alt[0].tonic] + ' ' + k.alt[0].mode) : ''}</span></div>`
      + `<button type="button" class="tapbtn" data-ana="key">Open ${esc(keyName)} in the Key explorer</button></div>`
      + `<div class="anrow"><h4>What kind of progression</h4>${types}<p class="anformula">In numbers: <b>${esc(formula)}</b>${has251 ? ' · <span class="an251">contains a 2–5–1</span>' : ' · no 2–5–1 in it'}</p></div>`
      + `<div class="anrow"><h4>Each chord</h4><div class="anchords">${cards}</div><p class="hint"><span class="anfn fn-T">Home</span> rests, <span class="anfn fn-PD">Away</span> moves off, <span class="anfn fn-D">Tension</span> wants to resolve.</p></div>`
      + (AN.notes.length ? `<div class="anrow"><h4>What is happening</h4><ul class="annotes">${AN.notes.map((x) => `<li>${esc(x.text)}</li>`).join('')}</ul></div>` : '')
      + (nexts ? `<div class="anrow"><h4>Try next, after ${esc(last.name)}</h4><div class="annext">${nexts}</div><p class="hint">Tap one to add it.</p></div>` : '')
      + `<div class="anrow"><h4>Solo or write a melody with</h4><div class="annext">${sc.map(([id, nm]) => `<button type="button" class="tapbtn" data-ana-scale="${id}:${k.tonic}">${esc(names[k.tonic] + ' ' + nm)}</button>`).join('')}</div></div>`;
    if (sum) sum.textContent = keyName + (AN.matches[0] ? ' · ' + AN.matches[0].name : '') + (has251 ? ' · 2–5–1' : '');
  }
  function anaClick(t) {
    const add = t.closest('[data-ana-add]');
    if (add) {
      const [root, sym] = add.dataset.anaAdd.split(':');
      const qi = ARP_ENTRIES.findIndex((e) => e.sym === sym);
      addToProg(pickerChord(qi < 0 ? 0 : qi, +root, S.flats));
      return true;
    }
    const scb = t.closest('[data-ana-scale]');
    if (scb) {
      const [id, root] = scb.dataset.anaScale.split(':');
      S.key = +root; S.id = id; S.pat = 'all'; S.pos = 'all'; S.chord = 'none'; S.cx = null;
      render();
      if (LAYOUT === 'tabs') setTab('fretboard'); else showBoard();
      return true;
    }
    const kb = t.closest('[data-ana="key"]');
    if (kb && AN) { setHome(AN.key.tonic, AN.key.mode); setTab('keys'); return true; }
    return false;
  }

  function renderProg() {
    const n = P.slots.length;
    try { AN = n ? analyzeProg(P.slots, { hk: S.hk, hm: S.hm }) : null; } catch (e) { AN = null; }
    $('progSlots').innerHTML = n
      ? P.slots.map(slotHtml).join('')
      : '<p class="slots-empty">Nothing here yet. Press <b>+</b> on any chord, or <b>Add</b> under any chord shape, to put it here.</p>';
    const beats = P.slots.reduce((a, s) => a + s.beats, 0);
    const eff = P.bpm * P.speed;
    const secs = Math.round((beats * 60) / eff);
    $('progSum').textContent = n
      ? n + (n === 1 ? ' chord' : ' chords') + ' · ' + beats + ' beats · ' + (beats % 4 === 0 ? beats / 4 + (beats === 4 ? ' bar' : ' bars') : 'about ' + (beats / 4).toFixed(1) + ' bars') + ' · ' + secs + ' s at ' + Math.round(eff) + ' BPM'
      : '';
    $('bpm').value = P.bpm;
    $('bpmOut').textContent = P.bpm + ' BPM';
    $('effOut').textContent = P.speed === 1 ? '' : SPEED_LABEL[P.speed] + ' speed = ' + Math.round(eff) + ' BPM';
    seg('speedSeg', 'speed', SPEEDS.map((v) => [v, SPEED_LABEL[v]]), P.speed);
    renderPatterns();
    if (!PL.on) renderRhythm(P.style, -1);
    $('loop').checked = P.loop;
    $('click').checked = P.click;
    $('progClear').disabled = !n;
    $('progClear').textContent = clearArmed ? 'Click again to clear' : 'Clear all';
    // one-line summaries on the folded section headings
    $('secChordsSum').textContent = n ? n + (n === 1 ? ' chord' : ' chords') + ' · ' + P.slots.map((s) => s.name).slice(0, 8).join(' ') + (n > 8 ? ' …' : '') : 'empty';
    $('secPlaySum').textContent = P.bpm + ' BPM · ' + SPEED_LABEL[P.speed] + (P.loop ? ' · loop' : '') + (P.click ? ' · click' : '');
    $('secRhythmSum').textContent = rhythmOf(P.style).name;
    if (typeof LIB !== 'undefined' && LIB.mode !== 'loading') renderLib();
    renderAnalysis();
    syncTransport();
  }

  /* ---------- pattern list, your own patterns, and the on/off switches ---------- */
  const VIEW = { sugg: true, chart: true, tips: true };
  try { Object.assign(VIEW, JSON.parse(localStorage.getItem('fretboard-view') || '{}')); } catch (e) {}
  const saveView = () => { try { localStorage.setItem('fretboard-view', JSON.stringify(VIEW)); } catch (e) {} };
  function syncCustoms() {
    CUSTOM_RHYTHMS.length = 0;
    P.customs.forEach((r) => CUSTOM_RHYTHMS.push(r));
  }
  syncCustoms();
  const allRhythms = () => RHYTHMS.concat(CUSTOM_RHYTHMS);
  function renderPatterns() {
    const btn = (r) => `<button type="button" class="qbtn${r.custom ? ' mine' : ''}" data-seg="pstyle" data-v="${r.id}" aria-pressed="${r.id === P.style}" title="${esc(r.hint)}">${esc(r.name)}</button>`;
    const groups = [];
    if (CUSTOM_RHYTHMS.length) groups.push({ name: 'My patterns', items: CUSTOM_RHYTHMS.slice() });
    if (VIEW.sugg) RHYTHMS.forEach((r) => { let g = groups.find((x) => x.name === r.group); if (!g) groups.push(g = { name: r.group, items: [] }); g.items.push(r); });
    else {
      const cur = RHYTHMS.find((r) => r.id === P.style);
      if (cur) groups.push({ name: 'Current', items: [cur] });
    }
    let h = groups.map((g) => `<div class="rgroup"><small>${esc(g.name)}</small><div class="qbtns">${g.items.map(btn).join('')}</div></div>`).join('');
    if (!VIEW.sugg && !CUSTOM_RHYTHMS.length) h += '<p class="hint2">Suggested patterns are hidden. Press New pattern to make your own.</p>';
    $('styleSeg').innerHTML = h;
    qsa($('progPanel'), '[data-view]').forEach((c) => { c.checked = !!VIEW[c.getAttribute('data-view')]; });
    const pp = $('progPanel');
    if (pp && pp.classList) pp.classList.toggle('notips', !VIEW.tips);
    $('rhythmView').hidden = !VIEW.chart;
    renderEditor();
  }

  /* pattern editor: pick a stroke, tap the boxes */
  const TOOLS = [['D', '↓', 'Down'], ['U', '↑', 'Up'], ['d', '↓', 'Soft down'], ['u', '↑', 'Soft up'], ['x', '×', 'Muted'], ['C', '↓', 'Top strings'], ['K', '↑', 'Short chop'],
    ['B', 'B', 'Bass'], ['A', 'b', 'Other bass'], ['P', '•', 'Pluck top 3'], ['T', 'B•', 'Bass + pluck'], ['1', '1', '1st string'], ['2', '2', '2nd string'], ['3', '3', '3rd string'], ['M', 'PM', 'Palm mute'], ['.', '', 'Erase']];
  const ED = { open: false, id: null, name: '', grid: 2, beats: 4, steps: [], picks: [], mode: 'strum', swing: false, short: false, tool: 'D', armedDel: null, tx: null, txDir: 'beat', txAuto: true, txMsg: '', metro: false, take: null, takeGrid: 0, takeX: 1, fit: 0, padSlot: 0 };
  const STR_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];
  const COUNT_NAMES = { 2: ['', '&'], 3: ['', 'trip', 'let'], 4: ['', 'e', '&', 'a'] };
  function openEditor(from, quiet) {
    if (!quiet) { try { localStorage.removeItem('fretboard-ed-closed'); } catch (e) {} }
    const r = from ? rhythmOf(from) : null;
    let steps = '', grid = 2, beats = 4;
    if (r && r.steps) { steps = r.steps; grid = r.grid; beats = r.beats || Math.round(r.steps.length / r.grid); }
    else if (r && r.id === 'hold') steps = 'D.......';
    else if (r && r.id === 'arp') steps = 'B321A123';
    else steps = '........';
    if (beats > GROOVE_MAX_BEATS) { steps = steps.slice(0, grid * GROOVE_MAX_BEATS); beats = GROOVE_MAX_BEATS; }
    const picks = r && r.picks ? r.picks.slice(0, grid * beats) : new Array(grid * beats).fill(0);
    Object.assign(ED, { open: true, id: r && r.custom ? r.id : null, name: r ? (r.custom ? r.name : 'My ' + r.name) : 'My pattern', grid, beats, steps: steps.split(''), picks, mode: r && r.picks ? 'pick' : 'strum', swing: !!(r && r.swing), short: !!(r && r.short), tool: 'D' });
    renderEditor();
    const box = $('rhythmEdit');
    if (!quiet && box && box.scrollIntoView) { wantJump = true; box.scrollIntoView({ block: 'nearest', behavior: calmMotion() ? 'auto' : 'smooth' }); }
  }
  function focusIn(sel) {
    const el = document.querySelector && document.querySelector(sel);
    if (el && el.scrollIntoView) { wantJump = true; el.scrollIntoView({ block: 'center', behavior: calmMotion() ? 'auto' : 'smooth' }); }
  }
  const draftOf = (id) => cleanRhythm(Object.assign({ id, name: ED.name, grid: ED.grid, beats: ED.beats, steps: ED.steps.join(''), swing: ED.swing, short: ED.short }, ED.mode === 'pick' ? { picks: ED.picks } : {}));
  const draft = () => draftOf(ED.id || 'cdraft');
  const edEmpty = () => (ED.mode === 'pick' ? ED.picks.every((m) => !m) : ED.steps.every((c) => c === '.'));
  function renderEditor() {
    const box = $('rhythmEdit');
    if (!box) return;
    box.hidden = !ED.open;
    if (!ED.open) { box.innerHTML = ''; return; }
    const segb = (key, v, label, on) => `<button type="button" data-ed="${key}" data-v="${v}" aria-pressed="${on}">${label}</button>`;
    const names = COUNT_NAMES[ED.grid];
    const cnt = (i) => (i % ED.grid === 0 ? String((Math.floor(i / ED.grid) % 4) + 1) : names[i % ED.grid]);
    const barc = (i) => (i && i % (ED.grid * 4) === 0 ? ' bar' : '');
    const pick = ED.mode === 'pick';
    let h = `<div class="rv-head"><b>${ED.id ? 'Edit pattern' : 'New pattern'}</b><span>${pick ? 'Tap the boxes to choose which strings to pick on each step. Tap again to clear.' : 'Pick a stroke below, then tap the boxes. Tap a box again to clear it.'} Or record it: strum the pad below, use the buttons, or the keyboard.</span></div>`
      + `<div class="row ed-row">`
      + `<label class="field"><span>Name</span><input type="text" id="edName" maxlength="40" value="${esc(ED.name).replace(/"/g, '&quot;')}" autocomplete="off"></label>`
      + `<div class="field"><span>Type</span><div class="seg">${segb('mode', 'strum', 'Strumming', !pick)}${segb('mode', 'pick', 'Picking (per string)', pick)}</div></div>`
      + `<label class="field"><span>Length</span><select id="edBeats">${[1, 2, 3, 4, 5, 6, 7, 8, 12, 16].map((b) => `<option value="${b}"${b === ED.beats ? ' selected' : ''}>${b} ${b === 1 ? 'beat' : 'beats'}</option>`).join('')}</select></label>`
      + `<div class="field"><span>Subdivision</span><div class="seg">${segb('grid', 2, '8ths', ED.grid === 2)}${segb('grid', 3, 'Triplets', ED.grid === 3)}${segb('grid', 4, '16ths', ED.grid === 4)}</div></div>`
      + (ED.grid === 2 ? `<div class="field"><span>Feel</span><div class="seg">${segb('swing', 0, 'Straight', !ED.swing)}${segb('swing', 1, 'Swing', ED.swing)}</div></div>` : '')
      + `<div class="field"><span>Notes</span><div class="seg">${segb('short', 0, 'Let ring', !ED.short)}${segb('short', 1, 'Short', ED.short)}</div></div>`
      + `</div>`;
    if (!pick) {
      h += `<div class="field" style="margin:10px 0"><span>Stroke</span><div class="qbtns tools">`
        + TOOLS.map(([c, s, label]) => `<button type="button" class="qbtn tool" data-tool="${c === '.' ? 'erase' : c}" aria-pressed="${ED.tool === c}"><b>${s || '⌫'}</b> ${esc(label)}</button>`).join('')
        + `</div></div><div class="rv-grid edgrid">`
        + ED.steps.map((c, i) => `<button type="button" class="rv-cell${i % ED.grid === 0 ? ' beat' : ''}${barc(i)}${RCLASS[c] ? ' ' + RCLASS[c] : ''}" data-cell="${i}" aria-label="Step ${i + 1}: ${c === '.' ? 'rest' : esc((TOOLS.find((x) => x[0] === c) || ['', '', c])[2])}"><b>${RSYM[c] || ''}</b><small>${cnt(i)}</small></button>`).join('')
        + `</div>`;
    } else {
      // tab layout: high e on top
      h += `<div class="pgrid" role="group" aria-label="Picking grid">`;
      for (let s = 5; s >= 0; s--) {
        h += `<div class="prow"><span class="plbl">${STR_NAMES[s]}</span>`
          + ED.picks.map((m, i) => `<button type="button" class="pcell${i % ED.grid === 0 ? ' beat' : ''}${barc(i)}${m & (1 << s) ? ' on' : ''}" data-pcell="${s}:${i}" aria-pressed="${!!(m & (1 << s))}" aria-label="${STR_NAMES[s]} string, step ${i + 1}"></button>`).join('')
          + `</div>`;
      }
      h += `<div class="prow counts"><span class="plbl"></span>${ED.picks.map((m, i) => `<span class="pcount${i % ED.grid === 0 ? ' beat' : ''}${barc(i)}" data-pc="${i}">${cnt(i)}</span>`).join('')}</div></div>`;
    }
    const pc = practiceChord();
    const chordOpts = P.slots.length ? `<label class="field padchord"><span>Chord on the pad</span><select id="padSlot">${P.slots.map((s, i) => `<option value="${i}"${i === Math.min(ED.padSlot, P.slots.length - 1) ? ' selected' : ''}>${i + 1}. ${esc(s.name)}</option>`).join('')}</select></label>` : '';
    h += `<div class="recbox"><div class="recbar"><button type="button" class="tapbtn rec${REC.on ? ' live' : ''}" id="recBtn">${REC.on ? '■ Stop' : '● Record a take'}</button>`
      + `<label class="check"><input type="checkbox" id="recMetro"${ED.metro ? ' checked' : ''}${REC.on ? ' disabled' : ''}> Play to a click (${Math.round(P.bpm * P.speed)} BPM, 4-beat count-in)</label>`
      + `<label class="check"><input type="checkbox" id="txAuto"${ED.txAuto ? ' checked' : ''}> Set the tempo from my playing</label></div>`
      + `<p class="recstate" id="recState" role="status">${REC.on ? '' : esc(REC.msg || 'Record like into a DAW: press Record, then strum the pad below (or use the buttons or keyboard) as long as you like, at your own speed, pauses and all. Stop, or just stop playing for 3 seconds. The site finds the tempo, the beat, the subdivision and the part that repeats, and writes the pattern.')}</p>`
      + `<canvas class="takelane" id="takeLane" height="64"${REC.on || ED.take ? '' : ' hidden'} aria-label="Your take: every hit, with the beats and bars found in it"></canvas>`
      + takeCard() + `</div>`
      + `<div class="padwrap"><div class="padhead"><b>Strum pad</b><span>Drag down or up across the strings to strum, tap one string to pick it. Low E is at the top, as when you look down at your guitar. Plays ${esc(pc.name)}.</span>${chordOpts}</div>`
      + `<div class="strumpad${REC.on ? ' live' : ''}" id="strumPad">${[0, 1, 2, 3, 4, 5].map((s) => `<span class="pstr" data-pstr="${s}" style="top:${((s + 0.5) / 6 * 100).toFixed(2)}%"><i>${STR_NAMES[s]}</i></span>`).join('')}</div>`
      + `<div class="padbtns">${[['D', '↓ Down'], ['U', '↑ Up'], ['d', '↓ Soft'], ['u', '↑ Soft'], ['x', '× Mute']].map(([k, l]) => `<button type="button" class="tapbtn" data-padhit="${k}">${l}</button>`).join('')}</div>`
      + `<p class="hint2">Keyboard: ↓ and ↑ arrows strum (hold Shift for soft), X mutes, keys 1–6 pick strings (1 = high e, 6 = low E).</p></div>`
      + `<div class="padwrap txwrap" id="txBlock"><div class="padhead"><b>From your guitar</b><span>Play the pattern on your real guitar and the site writes it down. Press <b>Listen to my guitar</b> and strum it live, or choose a recording. Start on beat 1 and play it once or twice. Each hit becomes a box: muted hits become ×, quieter ones become soft strums, and the tempo follows your playing. In Picking mode it works out which string each note was on, from the shape of ${esc(pc.name)}.</span></div>`
      + `<div class="txrow"><button type="button" class="tapbtn strong gtrbtn${GTR.on ? ' live' : ''}" id="gtrBtn" aria-pressed="${GTR.on}">${GTR.on ? ICON.stopf + ' Stop and write it down' : ICON.mic + ' Listen to my guitar'}</button>`
      + `<label class="tapbtn filebtn">Choose a recording<input type="file" id="txFile" accept="audio/*,video/*,.m4a,.mp3,.wav,.aac,.ogg,.webm,.caf"></label>`
      + `<div class="field"><span>Up or down strokes</span><div class="seg">${segb('txdir', 'beat', 'By beat (down on the beat)', ED.txDir === 'beat')}${segb('txdir', 'sound', 'From the sound', ED.txDir === 'sound')}</div></div>`
      + (ED.tx ? `<button type="button" class="tapbtn" id="txAgain">Read it again with these settings</button>` : '') + `</div>`
      + (ED.tx ? `<canvas class="txwave" id="txWave" height="90" aria-label="The recording, with each hit marked"></canvas><p class="txkey"><i class="k hit"></i> strum or note <i class="k ghost"></i> soft <i class="k mute"></i> muted</p>` : '')
      + `<div class="gtrlive" id="gtrLive"${GTR.on ? '' : ' hidden'}><div class="gtrmain"><div class="gtrmeter"><i id="gtrLevel"></i></div><div class="gtrdots" id="gtrDots"></div><p class="gtrinfo" id="gtrInfo">Listening… start strumming on beat 1.</p><p class="gtrchord" id="gtrChord"></p></div><button type="button" class="lsmini gtrmini" id="gtrMini" data-ls="circle" title="Open in the Key explorer"></button></div>`
      + `<p class="recstate" id="txState" role="status">${esc(ED.txMsg)}</p>`
      + `<p class="hint2">The sound never leaves your device. Pages shown inside the Claude app cannot use the microphone; there, choose a recording instead.</p></div>`
      + `<div class="ed-actions"><button type="button" class="tapbtn" id="edHear">Hear it</button><button type="button" class="tapbtn" id="edClear">Clear boxes</button>`
      + `<button type="button" class="tapbtn strong" id="edSave">${ED.id ? 'Save changes' : 'Save pattern'}</button><button type="button" class="tapbtn" id="edCancel">Close</button></div>`;
    box.innerHTML = h;
    drawTx();
    drawTake();
  }

  /* ---------- reading a recording of a real guitar ---------- */
  function drawTx() {
    const cv = $('txWave');
    if (!cv || !ED.tx || !cv.getContext) return;
    const w = Math.max(200, Math.round(cv.clientWidth || 600));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = w * dpr;
    cv.height = 90 * dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    const cs = getComputedStyle(document.documentElement);
    const col = (n) => cs.getPropertyValue(n).trim() || '#888';
    const wave = ED.tx.wave;
    g.fillStyle = col('--muted');
    g.globalAlpha = 0.45;
    for (let i = 0; i < w; i++) { const v = wave[Math.floor((i / w) * wave.length)] || 0; const hgt = Math.max(1, v * 80); g.fillRect(i, 45 - hgt / 2, 1, hgt); }
    g.globalAlpha = 1;
    ED.tx.hits.forEach((h) => {
      const x = (h.t / ED.tx.dur) * w;
      g.fillStyle = h.kind === 'mute' ? col('--muted') : h.kind === 'ghost' ? col('--dot') : col('--root-dot');
      g.fillRect(x - 1, 4, 3, 82);
    });
  }
  const txSay = (m) => { ED.txMsg = m; const st = $('txState'); if (st) st.textContent = m; };
  // turn a recording (mono samples) into hits, and the hits into a pattern
  function transcribeSamples(x, sr, name) {
    const len = x.length;
    let mx = 0;
    for (let i = 0; i < len; i++) mx = Math.max(mx, Math.abs(x[i]));
    if (mx > 0) for (let i = 0; i < len; i++) x[i] /= mx;
    const hits = classifyHits(analyzeHits(x, sr).hits);
    if (!hits.length) { txSay('No clear hits were found. Play a little closer to the microphone, with less background noise, and try again.'); return false; }
    const sl = practiceChord();
    hits.forEach((h) => { h.string = stringForHit(x, sr, h.t, sl); });
    const wave = new Float32Array(600);
    const per = Math.max(1, Math.floor(len / 600));
    for (let i = 0; i < 600; i++) { let m = 0; for (let k = i * per; k < Math.min(len, (i + 1) * per); k++) m = Math.max(m, Math.abs(x[k])); wave[i] = m; }
    ED.tx = { hits, dur: len / sr, wave, step: estimateStep(hits), name };
    applyTx();
    return true;
  }

  /* live: listen to the guitar through the microphone while you strum, then write the pattern down */
  const GTR = { on: false, stream: null, src: null, node: null, sink: null, chunks: [], n: 0, sr: 44100, t0: 0, hits: [], avg: 0, floor: 0, last: -1, quiet: 0, peak: 0, timer: 0, ui: 0 };
  const GTR_MAX_SEC = 30;
  async function gtrStart() {
    if (!(window.AudioContext || window.webkitAudioContext) || GTR.on) return;
    if (REC.on) stopRec();
    if (PL.on) stopProg();
    if (LS.live) lsStop();
    if (SL.live) slStop();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { gtrBlocked(); return; }
    txSay('Asking to use the microphone…');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch (e) { gtrBlocked(); return; }
    const c = micContext();
    if (!c) { stream.getTracks().forEach((t) => t.stop()); gtrBlocked(); return; }
    GTR.mc = c;
    if (c.state !== 'running') { try { await c.resume(); } catch (e) {} }
    const src = c.createMediaStreamSource(stream);
    const node = c.createScriptProcessor ? c.createScriptProcessor(2048, 1, 1) : null;
    if (!node) { stream.getTracks().forEach((t) => t.stop()); txSay('This browser cannot record from the microphone here. Choose a recording instead.'); return; }
    const sink = c.createGain();
    sink.gain.value = 0;                     // runs the recorder without sending the guitar back out of the speakers
    src.connect(node); node.connect(sink); sink.connect(c.destination);
    Object.assign(GTR, { on: true, stream, src, node, sink, chunks: [], n: 0, sr: c.sampleRate, hits: [], avg: 0, floor: 0.002, bfloor: 0.001, last: -1, peak: 0, lastLoud: 0, heard: false, autoStop: false, prevSample: 0, level: 0 });
    node.onaudioprocess = (ev) => gtrBlock(ev.inputBuffer.getChannelData(0));
    GTR.tail = new Float32Array(16384);
    LS.ema = null; LS.cand = null; LS.candN = 0; LS.quietN = 0;
    txSay('');
    renderEditor();
    miniCircle();
    GTR.ui = setInterval(gtrUi, 120);
  }
  function gtrBlocked() {
    txSay('The microphone is not available here. Pages shown inside the Claude app cannot use it; on your own hosted site (or localhost) it works. For now, record yourself and choose the file.');
  }
  // every ~45 ms of sound: keep it, and spot new strums (a sudden jump in loudness) for the live view
  function gtrBlock(d) {
    if (!GTR.on) return;
    GTR.chunks.push(new Float32Array(d));
    const F = 256;
    for (let i = 0; i + F <= d.length; i += F) {
      // loudness, and the loudness of the bright part of the sound (a pick or strum attack is bright, a ringing chord is not)
      let e = 0, b = 0, prev = i ? d[i - 1] : GTR.prevSample || 0;
      for (let k = i; k < i + F; k++) { e += d[k] * d[k]; const df = d[k] - prev; b += df * df; prev = d[k]; }
      e = Math.sqrt(e / F); b = Math.sqrt(b / F);
      const t = (GTR.n + i) / GTR.sr;
      if (t < 0.3) { GTR.floor = Math.max(GTR.floor, e * 2.5); GTR.bfloor = Math.max(GTR.bfloor || 0.001, b * 2.5); GTR.avg = b; continue; }   // the first moment sets the room's noise level
      if (e > GTR.peak) GTR.peak = e;
      if (e > Math.max(GTR.floor, GTR.peak * 0.08)) { GTR.lastLoud = t; GTR.heard = true; }
      if (b > GTR.bfloor && b > GTR.avg * 1.7 && t - GTR.last > 0.09) {
        GTR.last = t;
        GTR.hits.push({ t, e });
      }
      GTR.avg = 0.7 * GTR.avg + 0.3 * b;
      GTR.level = e;
    }
    GTR.prevSample = d[d.length - 1];
    // the last ~0.35 s, for naming the chord you are strumming
    if (GTR.tail) { const T = GTR.tail; if (d.length >= T.length) T.set(d.subarray(d.length - T.length)); else { T.copyWithin(0, d.length); T.set(d, T.length - d.length); } }
    GTR.n += d.length;
    const now = GTR.n / GTR.sr;
    if (GTR.heard && now - GTR.lastLoud > 2.2) GTR.autoStop = true;   // you stopped playing
    if (now > GTR_MAX_SEC) GTR.autoStop = true;
  }
  function gtrUi() {
    if (!GTR.on) return;
    if (GTR.autoStop) { gtrStop(true); return; }
    if (GTR.tail) lsHear(GTR.tail, GTR.sr);   // name the chord too: it lights up on the circles
    const lv = $('gtrLevel');
    if (lv && lv.style) lv.style.width = Math.min(100, Math.round(((GTR.level || 0) / Math.max(0.02, GTR.peak || 0.02)) * 100)) + '%';
    const dots = $('gtrDots');
    if (dots && dots.children && dots.children.length !== GTR.hits.length) {
      const span = Math.max(4, GTR.n / GTR.sr);
      dots.innerHTML = GTR.hits.slice(-64).map((h) => `<i style="left:${((h.t / span) * 100).toFixed(1)}%"></i>`).join('');
    }
    const info = $('gtrInfo');
    if (info) {
      const secs = (GTR.n / GTR.sr).toFixed(1);
      const step = GTR.hits.length >= 4 ? estimateStep(GTR.hits) : null;
      const bpm = step ? Math.round(60 / (step * ED.grid)) : 0;
      info.textContent = GTR.hits.length
        ? GTR.hits.length + ' hits · ' + secs + ' s' + (bpm >= 40 && bpm <= 240 ? ' · about ' + bpm + ' BPM' : '') + ' · stop playing for a moment, or press Stop, to write it down'
        : 'Listening… start strumming on beat 1. (' + secs + ' s)';
    }
  }
  function gtrStop(write) {
    if (!GTR.on) return;
    GTR.on = false;
    GTR.autoStop = false;
    clearInterval(GTR.ui);
    try { GTR.node.onaudioprocess = null; GTR.src.disconnect(); GTR.node.disconnect(); GTR.sink.disconnect(); } catch (e) {}
    try { GTR.stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
    closeMic(GTR.mc); GTR.mc = null;
    const total = GTR.chunks.reduce((a, b) => a + b.length, 0);
    const x = new Float32Array(total);
    let o = 0;
    GTR.chunks.forEach((ch) => { x.set(ch, o); o += ch.length; });
    GTR.chunks = [];
    renderEditor();
    if (write === false) { txSay('Stopped.'); return; }
    if (total < GTR.sr * 0.5) { txSay('That was too short. Press Listen to my guitar and play the pattern once or twice.'); return; }
    txSay('Writing down what you played…');
    setTimeout(() => transcribeSamples(x, GTR.sr, 'live recording'), 20);
  }

  async function transcribeFile(file) {
    const say2 = txSay;
    const c = audio();
    if (!c || !file) return;
    if (REC.on) stopRec();
    say2('Reading the recording…');
    try {
      const buf = file.arrayBuffer ? await file.arrayBuffer() : await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsArrayBuffer(file); });
      const ab = await new Promise((res, rej) => { const p = c.decodeAudioData(buf, res, rej); if (p && p.then) p.then(res, rej); });
      const sr = ab.sampleRate, len = Math.min(ab.length, Math.floor(sr * 40));
      const x = new Float32Array(len);
      for (let ch = 0; ch < ab.numberOfChannels; ch++) { const d = ab.getChannelData(ch); for (let i = 0; i < len; i++) x[i] += d[i] / ab.numberOfChannels; }
      transcribeSamples(x, sr, file.name || 'recording');
    } catch (e) {
      say2('This file could not be read. Try a different format (m4a, mp3 or wav) or record it again.');
    }
  }
  function applyTx() {
    const tx = ED.tx;
    if (!tx) return;
    ED.take = { src: 'mic', hits: tx.hits.map((h) => Object.assign({}, h)), clicked: null };
    ED.takeGrid = 0; ED.takeX = 1;
    applyTake();
  }

  /* ---------- playing it yourself: the strum pad, buttons, keyboard, and recording ---------- */
  const C_MAJOR = { name: 'C', tones: [{ name: 'C', pc: 0, label: '1' }, { name: 'E', pc: 4, label: '3' }, { name: 'G', pc: 7, label: '5' }], frets: [-1, 3, 2, 0, 1, 0], beats: 4 };
  const practiceChord = () => P.slots[Math.min(ED.padSlot, P.slots.length - 1)] || C_MAJOR;
  function padString(s, vol, when) {
    const c = audio();
    if (!c) return;
    const sl = practiceChord();
    const midis = slotMidis(sl);
    const bass = midis.find((m) => m % 12 === sl.tones[0].pc) || midis[0];
    // like a real guitar: a string the shape mutes just thunks
    const m = sl.frets && sl.frets[s] < 0 ? null : stringNote(sl, s, midis, bass);
    if (m === null) pluckAt(OPEN[s], when || c.currentTime, 0.05, { vol: 0.08, cut: 500 }); // muted string: a dead thunk
    else pluckAt(m, when || c.currentTime, 2.2, { vol: vol || 0.17, sustain: true });
    const el = document.querySelector && document.querySelector('[data-pstr="' + s + '"]');
    if (el && el.classList) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
  }
  // one stroke of any kind on the practice chord, now
  function strike(kind) {
    const c = audio();
    if (!c || kind === '.') return;
    const plan = slotPlan(Object.assign({}, practiceChord(), { beats: 1 }), { grid: 2, beats: 1, steps: kind + '.', short: ED.short }, beatSec(), 0);
    const t0 = c.currentTime + 0.005;
    plan.notes.forEach((n) => pluckAt(n.midi, t0 + n.t, n.dur, { vol: n.vol, sustain: true, cut: n.cut }));
  }
  /* recording a take, like recording into a DAW: no fixed length, no snapping while you play.
     Every hit is kept with its exact time; when you stop, the groove engine finds the tempo, beat, subdivision,
     bar and repeating part (rests included) and writes the pattern. */
  const REC = { on: false, t0: 0, metro: false, hits: [], timer: 0, nextClick: 0, bs: 0, last: 0, msg: '' };
  const REC_IDLE = 3, REC_MAX = 120;
  function startRec() {
    const c = audio();
    if (!c || REC.on) return;
    if (PL.on) stopProg();
    if (GTR.on) gtrStop(false);
    const bs = beatSec();
    const now = c.currentTime + 0.15;
    Object.assign(REC, { on: true, hits: [], metro: ED.metro, bs, last: 0, msg: '', started: now });
    if (REC.metro) {
      for (let b = 0; b < 4; b++) clickAt(now + b * bs, b === 0);
      REC.t0 = now + 4 * bs;
      REC.nextClick = REC.t0;
    } else REC.t0 = null;
    renderEditor();
    REC.timer = setInterval(recTick, 50);
    recTick();
  }
  function stopRec(msg) {
    if (!REC.on) return;
    clearInterval(REC.timer);
    REC.on = false;
    const hits = REC.hits.slice();
    if (hits.length < 3) { REC.msg = msg || 'Only ' + hits.length + (hits.length === 1 ? ' hit was' : ' hits were') + ' recorded. Press Record a take and play a few bars.'; renderEditor(); say(REC.msg); return; }
    ED.take = { src: 'pad', hits, clicked: REC.metro ? { bpm: 60 / REC.bs, t0: REC.t0 } : null };
    ED.tx = null;
    ED.takeGrid = 0; ED.takeX = 1;
    applyTake();
  }
  function recTick() {
    const c = ac;
    if (!c || !REC.on) return;
    const now = c.currentTime;
    if (REC.metro) { let k = Math.round((REC.nextClick - REC.t0) / REC.bs); while (REC.nextClick < now + 0.25) { clickAt(REC.nextClick, k % 4 === 0); REC.nextClick += REC.bs; k++; } }
    const st = $('recState');
    if (REC.metro && now < REC.t0) {
      const left = Math.ceil((REC.t0 - now) / REC.bs);
      if (st) st.textContent = 'Count-in… ' + Math.min(4, Math.max(1, 5 - left)) + ' of 4. Start on the next "1".';
      drawTake();
      return;
    }
    const from = REC.metro ? REC.t0 : REC.started;
    const secs = Math.max(0, now - from);
    if (REC.hits.length >= 3 && now - REC.last > REC_IDLE) { stopRec(); return; }
    if (secs > REC_MAX) { stopRec(); return; }
    if (st) st.textContent = REC.hits.length
      ? '● Recording · ' + REC.hits.length + ' hits · ' + secs.toFixed(1) + ' s. Keep playing, or stop for 3 seconds to finish.'
      : '● Recording. Start whenever you are ready' + (REC.metro ? ', on the beat.' : ': your first strum is where the take begins.');
    drawTake();
  }
  // every hit you play while recording: the exact time, which way, how hard, and (for picking) which strings
  const STROKE_DIR = { D: 'down', d: 'down', C: 'down', M: 'down', U: 'up', u: 'up', K: 'up' };
  function recPush(h) {
    if (!REC.on || !ac) return;
    const t = h.t || ac.currentTime;
    if (REC.metro && t < REC.t0 - REC.bs * 0.5) return;   // still counting in
    REC.hits.push(Object.assign(h, { t }));
    REC.last = t;
  }
  function recordStroke(kind, when, vel) {
    if (kind === '.') return;
    const sl = practiceChord();
    let mask = 0;
    for (let s = 0; s < 6; s++) if (!sl.frets || sl.frets[s] >= 0) mask |= 1 << s;
    const soft = kind === 'd' || kind === 'u';
    recPush({ t: when, ch: kind, dir: STROKE_DIR[kind], kind: kind === 'x' ? 'mute' : soft ? 'ghost' : 'hit', peak: vel || (soft ? 0.5 : kind === 'x' ? 0.6 : 1), mask: kind === 'x' ? 0 : mask });
  }
  // one string on its own: in picking it is that string, in strumming a bass note or one of the top strings
  function recordString(s, when) {
    recPush({ t: when, mask: 1 << s, ch: s >= 3 ? ['3', '2', '1'][s - 3] : 'B', kind: 'hit', peak: 0.8 });
  }
  function paintPickCell(s, i) {
    const el = document.querySelector('[data-pcell="' + s + ':' + i + '"]');
    if (el) { const on = !!(ED.picks[i] & (1 << s)); el.classList.toggle('on', on); el.setAttribute('aria-pressed', String(on)); }
  }
  // turn the take into a pattern (again, when a setting changes)
  function applyTake() {
    const tk = ED.take;
    if (!tk) return;
    const o = { mode: ED.mode, dirMode: ED.txDir, grid: ED.takeGrid || 0, tempoX: ED.takeX || 1 };
    if (tk.clicked) Object.assign(o, tk.clicked);
    const hits = tk.src === 'mic' && ED.txDir !== 'sound' ? tk.hits.map((h) => Object.assign({}, h, { dir: undefined })) : tk.hits;
    const g = grooveFromHits(hits, o);
    tk.res = g;
    if (!g) { REC.msg = 'The hits did not line up into a steady groove. Try again with a few more bars, or play to a click.'; renderEditor(); return; }
    ED.grid = g.grid; ED.beats = g.beats; ED.swing = g.swing;
    const n = g.grid * g.beats;
    if (ED.mode === 'pick') { ED.picks = g.picks ? g.picks.slice(0, n) : new Array(n).fill(0); ED.steps = new Array(n).fill('.'); }
    else { ED.steps = g.steps.split(''); ED.picks = new Array(n).fill(0); }
    let tempoNote = '';
    if (ED.txAuto && !tk.clicked) {
      P.bpm = Math.max(40, Math.min(220, Math.round(g.bpm / P.speed)));
      saveProg();
      tempoNote = ' Tempo set to ' + g.bpm + ' BPM.';
    }
    const gridName = g.grid === 4 ? '16ths' : g.grid === 3 ? 'triplets' : g.swing ? 'swung 8ths' : '8ths';
    REC.msg = 'Found ' + tk.hits.length + ' hits at about ' + g.bpm + ' BPM, in ' + gridName + '. '
      + (g.reps > 1 ? 'The ' + g.beats + '-beat groove repeats ' + g.reps + ' times; each box is what you played most often there.' : 'Kept all ' + g.beats + ' beats as one pattern.')
      + (g.truncated ? ' The take was long and did not repeat, so the first ' + g.beats + ' beats were kept.' : '')
      + (g.restBeats.length ? ' Rests on beat' + (g.restBeats.length > 1 ? 's ' : ' ') + g.restBeats.join(', ') + '.' : '')
      + tempoNote;
    ED.txMsg = tk.src === 'mic' ? REC.msg : '';
    if (tk.src === 'mic') REC.msg = '';
    if (tempoNote) renderProg(); else renderEditor();
    say(ED.txMsg || REC.msg);
  }
  function takeCard() {
    const tk = ED.take, g = tk && tk.res;
    if (!g || REC.on) return '';
    const b = (k, v, label, on) => `<button type="button" data-take="${k}" data-v="${v}" aria-pressed="${on}">${label}</button>`;
    const fits = [[0, 'Keep as they are'], [4, '1 bar each'], [8, '2 bars each']];
    return `<div class="takecard"><div class="takerow"><div class="field"><span>Tempo</span><div class="seg">${b('x', 0.5, '½ ×', ED.takeX === 0.5)}${b('x', 1, 'As found (' + g.bpm + ')', ED.takeX === 1)}${b('x', 2, '2 ×', ED.takeX === 2)}</div></div>`
      + `<div class="field"><span>Grid</span><div class="seg">${b('g', 0, 'Auto', !ED.takeGrid)}${b('g', 2, '8ths', ED.takeGrid === 2)}${b('g', 3, 'Triplets', ED.takeGrid === 3)}${b('g', 4, '16ths', ED.takeGrid === 4)}</div></div></div>`
      + `<div class="takerow"><div class="field"><span>Then each chord lasts</span><div class="seg">${fits.map(([v, l]) => b('fit', v, l, ED.fit === v)).join('')}</div></div>`
      + `<button type="button" class="tapbtn strong" id="takeApply">Use for my whole progression</button></div>`
      + `<p class="hint2">That saves the pattern, plays it on every chord at ${Math.round(P.bpm * P.speed)} BPM, with your rests. Patterns longer than a chord keep going across the chord changes.</p></div>`;
  }
  // the take on a timeline: hits (down, up, soft, muted) over the beats and bars that were found
  function drawTake() {
    const cv = $('takeLane');
    if (!cv || !cv.getContext) return;
    const live = REC.on;
    const hits = live ? REC.hits : ED.take ? ED.take.hits : [];
    cv.hidden = !live && !ED.take;
    if (cv.hidden) return;
    const w = Math.max(200, Math.round(cv.clientWidth || 600)), H = 64;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = w * dpr; cv.height = H * dpr;
    const gx = cv.getContext('2d');
    gx.scale(dpr, dpr);
    const cs = getComputedStyle(document.documentElement);
    const col = (n) => cs.getPropertyValue(n).trim() || '#888';
    const now = ac ? ac.currentTime : 0;
    const g = !live && ED.take && ED.take.res;
    let a, z;
    if (live) { a = REC.metro ? REC.t0 - REC.bs : (hits.length ? hits[0].t - 0.3 : REC.started); z = Math.max(a + 6, now + 0.5); }
    else { a = Math.min(hits[0].t, g ? g.startT : hits[0].t) - 0.3; z = hits[hits.length - 1].t + 0.5; }
    const X = (t) => ((t - a) / (z - a)) * w;
    const beatT = live ? (REC.metro ? REC.bs : 0) : g ? g.beatT : 0;
    const t0 = live ? REC.t0 : g ? g.startT : 0;
    if (beatT) {
      if (g) { gx.fillStyle = col('--accent'); gx.globalAlpha = 0.1; gx.fillRect(X(t0), 0, X(t0 + g.beats * beatT) - X(t0), H); gx.globalAlpha = 1; }
      for (let k = Math.ceil((a - t0) / beatT); t0 + k * beatT < z; k++) {
        const x = X(t0 + k * beatT);
        gx.fillStyle = k % 4 === 0 ? col('--fg') : col('--line');
        gx.globalAlpha = k % 4 === 0 ? 0.55 : 0.9;
        gx.fillRect(Math.round(x), 0, k % 4 === 0 ? 2 : 1, H);
        if (k % 4 === 0 && k >= 0) { gx.globalAlpha = 0.7; gx.fillStyle = col('--muted'); gx.font = '10px system-ui, sans-serif'; gx.fillText(String(k / 4 + 1), x + 3, 10); }
      }
      gx.globalAlpha = 1;
    }
    hits.forEach((h) => {
      const x = X(h.t);
      const up = h.dir === 'up';
      gx.fillStyle = h.kind === 'mute' ? col('--muted') : h.kind === 'ghost' ? col('--dot') : col('--root-dot');
      const s = h.kind === 'ghost' ? 5 : 7;
      gx.beginPath();
      if (h.dir) { const y = 36; gx.moveTo(x - s, up ? y + s : y - s); gx.lineTo(x + s, up ? y + s : y - s); gx.lineTo(x, up ? y - s : y + s); }
      else gx.rect(x - 1.5, 22, 3, 28);
      gx.fill();
    });
    if (live) { gx.fillStyle = col('--live'); gx.fillRect(Math.round(X(now)), 0, 2, H); }
  }
  // the pad: crossing string lines while dragging plays them in order
  let PAD = null;
  function padY(e) { const r = $('strumPad').getBoundingClientRect(); return { y: e.clientY - r.top, h: r.height }; }
  const lineY = (s, h) => ((s + 0.5) / 6) * h;
  document.addEventListener('pointerdown', (e) => {
    const pad = e.target && e.target.closest ? e.target.closest('#strumPad') : null;
    if (!pad) return;
    e.preventDefault();
    try { pad.setPointerCapture(e.pointerId); } catch (err) {}
    const { y, h } = padY(e);
    PAD = { y0: y, lastY: y, crossed: [], times: [], tapped: null, h };
    let near = 0;
    for (let s = 1; s < 6; s++) if (Math.abs(lineY(s, h) - y) < Math.abs(lineY(near, h) - y)) near = s;
    if (Math.abs(lineY(near, h) - y) < h / 14) {
      PAD.tapped = near;
      PAD.tapT = ac ? ac.currentTime : 0;
      padString(near, 0.18);
      if (ED.mode === 'pick') recordString(near, PAD.tapT);
    }
  });
  document.addEventListener('pointermove', (e) => {
    if (!PAD) return;
    const { y, h } = padY(e);
    const lo = Math.min(PAD.lastY, y), hi = Math.max(PAD.lastY, y);
    const list = [];
    for (let s = 0; s < 6; s++) { const ly = lineY(s, h); if (ly > lo && ly <= hi) list.push(s); }
    if (y < PAD.lastY) list.reverse();
    list.forEach((s) => {
      if (s === PAD.tapped && !PAD.crossed.length) return;
      const now = ac ? ac.currentTime : 0;
      const dt = PAD.times.length ? (now - PAD.times[PAD.times.length - 1]) * 1000 : 10;
      padString(s, dt < 15 ? 0.19 : dt < 40 ? 0.15 : 0.09);
      PAD.crossed.push(s);
      PAD.times.push(now);
      if (ED.mode === 'pick') recordString(s, now);
    });
    PAD.lastY = y;
  });
  document.addEventListener('pointerup', () => {
    if (!PAD) return;
    const p = PAD;
    PAD = null;
    if (ED.mode === 'pick') return;
    if (p.crossed.length >= 2 || (p.crossed.length === 1 && p.tapped === null)) {
      // a quick flick over even one string is a stroke; slow, spread-out strums are soft ones
      const down = p.crossed.length >= 2 ? p.crossed[p.crossed.length - 1] > p.crossed[0] : p.lastY > p.y0;
      const per = p.crossed.length >= 2 ? ((p.times[p.times.length - 1] - p.times[0]) * 1000) / (p.crossed.length - 1) : 0;
      const soft = per > 30;
      recordStroke(down ? (soft ? 'd' : 'D') : (soft ? 'u' : 'U'), p.times[0], soft ? 0.5 : Math.min(1.3, 1 + (12 - Math.min(12, per)) / 30));
    } else if (p.tapped !== null) recordString(p.tapped, p.tapT);
  });
  document.addEventListener('pointercancel', () => { PAD = null; });
  document.addEventListener('keydown', (e) => {
    if (TOUR.name) {
      if (e.key === 'Escape') endTour();
      else if (e.key === 'ArrowRight') showStep(TOUR.i + 1, 1);
      else if (e.key === 'ArrowLeft') showStep(TOUR.i - 1, -1);
      else return;
      e.preventDefault();
      return;
    }
    if (e.key === 'Escape') { if (infoOpen) closeInfo(); const gp = $('guidePanel'); if (gp && !gp.hidden) openGuide(false); }
    if (!ED.open || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    let kind = null;
    if (e.key === 'ArrowDown') kind = e.shiftKey ? 'd' : 'D';
    else if (e.key === 'ArrowUp') kind = e.shiftKey ? 'u' : 'U';
    else if (e.key === 'x' || e.key === 'X') kind = 'x';
    if (kind) {
      e.preventDefault();
      strike(kind);
      recordStroke(kind);
      return;
    }
    if (/^[1-6]$/.test(e.key)) {
      e.preventDefault();
      const s = 6 - +e.key;
      padString(s, 0.18);
      recordString(s);
    }
  });

  function savePattern(all) {
    if (REC.on) stopRec();
    if (edEmpty()) { say('Put at least one stroke in the pattern first.'); return false; }
    const id = ED.id || 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const r = draftOf(id);
    const at = P.customs.findIndex((x) => x.id === id);
    if (at >= 0) P.customs[at] = r;
    else if (P.customs.length >= 40) { say('You have 40 patterns already. Delete one to make room.'); return false; }
    else P.customs.push(r);
    P.style = id;
    ED.id = id;
    if (all) {
      P.slots.forEach((s) => { s.style = ''; if (ED.fit) s.beats = ED.fit; });
    }
    syncCustoms();
    ED.open = false;
    saveProg();
    renderProg();
    say(all
      ? 'Your progression now plays “' + r.name + '” on every chord at ' + Math.round(P.bpm * P.speed) + ' BPM' + (ED.fit ? ', ' + (ED.fit / 4) + (ED.fit === 4 ? ' bar' : ' bars') + ' per chord' : '') + '. Press Play to hear it.'
      : 'Saved the pattern “' + r.name + '”. It is selected for the whole progression.');
    return true;
  }
  function takeToProgression() {
    if (!ED.name || /^My pattern$/.test(ED.name)) ED.name = 'My take ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (savePattern(true)) flash('Applied to your progression');
  }
  function edPlayStroke(c) {
    if (c === '.') return;
    const r = cleanRhythm({ id: 'cstroke', grid: 2, beats: 1, steps: c + '.', short: ED.short });
    previewRhythm(r, () => {});
  }
  function edClick(t) {
    const tool = t.closest('[data-tool]');
    if (tool) { const v = tool.getAttribute('data-tool'); ED.tool = v === 'erase' ? '.' : v; renderEditor(); edPlayStroke(ED.tool); return true; }
    const cell = t.closest('[data-cell]');
    if (cell) {
      const i = +cell.getAttribute('data-cell');
      ED.steps[i] = ED.steps[i] === ED.tool ? '.' : ED.tool;
      renderEditor();
      edPlayStroke(ED.steps[i]);
      return true;
    }
    const pcell = t.closest('[data-pcell]');
    if (pcell) {
      const [s, i] = pcell.getAttribute('data-pcell').split(':').map(Number);
      ED.picks[i] ^= 1 << s;
      paintPickCell(s, i);
      if (ED.picks[i] & (1 << s)) padString(s, 0.17);
      return true;
    }
    const ph = t.closest('[data-padhit]');
    if (ph) {
      const k = ph.getAttribute('data-padhit');
      strike(k);
      recordStroke(k);
      return true;
    }
    if (t.closest('#txAgain')) { applyTx(); return true; }
    if (t.closest('#gtrBtn')) { if (GTR.on) gtrStop(true); else gtrStart(); return true; }
    if (t.closest('#rPad')) { if (!ED.open) openEditor(null); focusIn('#strumPad'); return true; }
    if (t.closest('#rFile')) { if (!ED.open) openEditor(null); focusIn('#txBlock'); return true; }
    if (t.closest('#recBtn')) { if (REC.on) stopRec(); else startRec(); return true; }
    const tb = t.closest('[data-take]');
    if (tb) {
      const k = tb.getAttribute('data-take'), v = +tb.getAttribute('data-v');
      if (k === 'x') ED.takeX = v;
      if (k === 'g') ED.takeGrid = v;
      if (k === 'fit') { ED.fit = v; renderEditor(); return true; }
      applyTake();
      return true;
    }
    if (t.closest('#takeApply')) { takeToProgression(); return true; }
    const e = t.closest('[data-ed]');
    if (e) {
      const k = e.getAttribute('data-ed'), v = +e.getAttribute('data-v');
      if (REC.on) stopRec();
      if (k === 'mode') ED.mode = e.getAttribute('data-v') === 'pick' ? 'pick' : 'strum';
      if (k === 'txdir') { ED.txDir = e.getAttribute('data-v') === 'sound' ? 'sound' : 'beat'; if (ED.tx) { applyTx(); return true; } }
      if (k === 'grid' && v !== ED.grid) { ED.steps = regridSteps(ED.steps.join(''), ED.grid, ED.beats, v, ED.beats).split(''); ED.picks = regridPicks(ED.picks, ED.grid, ED.beats, v, ED.beats); ED.grid = v; if (v !== 2) ED.swing = false; }
      if (k === 'swing') ED.swing = !!v;
      if (k === 'short') ED.short = !!v;
      renderEditor();
      return true;
    }
    if (t.closest('#edHear')) {
      if (REC.on) stopRec();
      previewRhythm(draft(), (pos) => qsa($('rhythmEdit'), '[data-cell],[data-pc]').forEach((el) => el.classList.toggle('stepon', +(el.getAttribute('data-cell') || el.getAttribute('data-pc')) === pos)));
      return true;
    }
    if (t.closest('#edClear')) { if (REC.on) stopRec(); if (ED.mode === 'pick') ED.picks = ED.picks.map(() => 0); else ED.steps = ED.steps.map(() => '.'); renderEditor(); return true; }
    if (t.closest('#edCancel')) { if (REC.on) stopRec(); if (GTR.on) gtrStop(false); ED.open = false; try { localStorage.setItem('fretboard-ed-closed', '1'); } catch (e) {} renderEditor(); return true; }
    if (t.closest('#edSave')) { savePattern(false); return true; }
    if (t.closest('#rNew')) { openEditor(null); return true; }
    if (t.closest('#rvCopy') || t.closest('#rvEdit')) { openEditor(rhythmShown || P.style); return true; }
    const del = t.closest('#rvDel');
    if (del) {
      const id = rhythmShown;
      if (ED.armedDel !== id) { ED.armedDel = id; del.textContent = 'Delete?'; del.classList.add('danger'); setTimeout(() => { if (ED.armedDel === id) { ED.armedDel = null; renderRhythm(rhythmShown, -1); } }, 3000); return true; }
      ED.armedDel = null;
      P.customs = P.customs.filter((x) => x.id !== id);
      P.slots.forEach((s) => { if (s.style === id) s.style = ''; });
      if (P.style === id) P.style = 'hold';
      if (ED.id === id) ED.open = false;
      syncCustoms();
      saveProg();
      renderProg();
      say('Deleted the pattern.');
      return true;
    }
    return false;
  }

  /* strum chart: one cell per step, arrows for strums, letters for picked notes; the sounding step lights up */
  const RSYM = { D: '↓', d: '↓', U: '↑', u: '↑', x: '×', C: '↓', K: '↑', B: 'B', A: 'b', P: '•', T: 'B•', 1: '1', 2: '2', 3: '3', M: 'PM', '.': '' };
  const RCLASS = { d: 'ghost', u: 'ghost', x: 'mute', C: 'chick', K: 'chop', B: 'bass', A: 'bass', T: 'bass', P: 'pluck', 1: 'pluck', 2: 'pluck', 3: 'pluck', M: 'mute' };
  let rhythmShown = '';
  function renderRhythm(id, onPos) {
    const r = rhythmOf(id);
    const box = $('rhythmView');
    if (!box) return;
    rhythmShown = id;
    const own = r.custom
      ? `<button type="button" class="tapbtn" id="rvEdit">Edit</button><button type="button" class="tapbtn" id="rvDel">Delete</button>`
      : `<button type="button" class="tapbtn" id="rvCopy" title="Open this pattern in the editor as your own copy">Make my own from this</button>`;
    let h = `<div class="rv-head"><b>${esc(r.name)}</b><span>${esc(r.hint)}</span><button type="button" class="tapbtn" id="rvHear" ${PL.on ? 'disabled' : ''}>Hear 1 bar</button>${own}</div>`;
    if (r.picks) {
      const names = COUNT_NAMES[r.grid] || ['', '&'];
      h += '<div class="pgrid view" role="img" aria-label="' + esc(r.name) + ' picking pattern">';
      for (let s = 5; s >= 0; s--) h += `<div class="prow"><span class="plbl">${STR_NAMES[s]}</span>` + r.picks.map((m, i) => `<span class="pcell${i % r.grid === 0 ? ' beat' : ''}${m & (1 << s) ? ' on' : ''}" data-rv="${i}"></span>`).join('') + '</div>';
      h += `<div class="prow counts"><span class="plbl"></span>${r.picks.map((m, i) => `<span class="pcount${i % r.grid === 0 ? ' beat' : ''}" data-rv="${i}">${i % r.grid === 0 ? Math.floor(i / r.grid) % (r.beats || 4) + 1 : names[i % r.grid]}</span>`).join('')}</div></div>`;
    } else if (r.steps) {
      const names = COUNT_NAMES[r.grid] || ['', '&'];
      h += '<div class="rv-grid" role="img" aria-label="' + esc(r.name + ' pattern: ' + r.steps.split('').map((c) => c === '.' ? 'rest' : c).join(' ')) + '">';
      r.steps.split('').forEach((c, i) => {
        const beat = Math.floor(i / r.grid) % (r.beats || 4) + 1;
        const cnt = i % r.grid === 0 ? String(beat) : names[i % r.grid];
        h += `<span class="rv-cell${i % r.grid === 0 ? ' beat' : ''}${RCLASS[c] ? ' ' + RCLASS[c] : ''}${i === onPos ? ' on' : ''}" data-rv="${i}"><b>${RSYM[c] || ''}</b><small>${cnt}</small></span>`;
      });
      h += '</div><p class="rv-key">↓ down · ↑ up · faint = soft · × muted · B bass · b other bass · • pluck · 1–3 top strings · PM palm mute</p>';
    }
    box.innerHTML = h;
  }
  function lightStep(style, pos) {
    if (rhythmShown !== style) renderRhythm(style, pos);
    const box = $('rhythmView');
    if (!box || !box.querySelectorAll) return;
    Array.prototype.forEach.call(box.querySelectorAll('[data-rv]'), (el) => el.classList.toggle('stepon', +el.getAttribute('data-rv') === pos));
  }
  // hear one bar of a pattern on the first chord of the progression (or C major)
  let preview = null;
  function previewRhythm(id, onStep) {
    const c = audio();
    if (!c || PL.on) return;
    if (preview) { try { preview.gain.setTargetAtTime(0.0001, c.currentTime, 0.02); } catch (e) {} }
    const out = c.createGain();
    out.connect(busNode(c));
    preview = out;
    const C = { name: 'C', tones: [{ name: 'C', pc: 0, label: '1' }, { name: 'E', pc: 4, label: '3' }, { name: 'G', pc: 7, label: '5' }], frets: [-1, 3, 2, 0, 1, 0] };
    const base = P.slots[0] || C;
    const r = rhythmOf(id);
    const sl = Object.assign({}, base, { beats: r.beats || (r.steps ? Math.round(r.steps.length / r.grid) : 4) });
    const bs = beatSec();
    const plan = slotPlan(sl, id, bs, 0);
    const t0 = c.currentTime + 0.05;
    plan.notes.forEach((n) => pluckAt(n.midi, t0 + n.t, n.dur, { vol: n.vol, sustain: true, dest: out, cut: n.cut }));
    const step = onStep || ((pos) => lightStep(id, pos));
    if (!onStep) renderRhythm(id, -1);
    (plan.hits || []).forEach((h) => setTimeout(() => { if (!PL.on && preview === out) step(h.pos); }, (h.t + 0.05) * 1000));
    setTimeout(() => { if (!PL.on && preview === out) step(-1); }, (plan.dur + 0.1) * 1000);
  }

  function addToProg(ch, sh, opts) {
    if (P.slots.length >= PROG_MAX) {
      say('The progression is full (' + PROG_MAX + ' chords). Remove one to add another.');
      flash('Progression is full');
      return false;
    }
    const slash = Number.isInteger(ch.bass) && ch.bass !== ch.tones[0].pc ? ch.bass : undefined;
    const shape = sh || chordShapes(ch.tones, 4, slash).best;
    const slot = {
      name: ch.name,
      roman: ch.roman || '',
      tones: ch.tones.map((t) => ({ name: t.name, pc: t.pc, label: t.label, semis: t.semis || 0 })),
      frets: shape ? shape.frets.slice() : null,
      beats: 4,
    };
    if (slash !== undefined) slot.bass = slash;
    P.slots.push(slot);
    saveProg();
    renderProg();
    if (opts && opts.quiet) return true;
    say('Added ' + ch.name + ' as chord ' + P.slots.length + '.');
    flash('Added ' + ch.name + ' · ' + P.slots.length + (P.slots.length === 1 ? ' chord' : ' chords'));
    auditionSlot(P.slots[P.slots.length - 1]);
    return true;
  }
  /* ---------- Chord listener: play a chord on a real guitar, see its name and where it sits in the key, add it ---------- */
  const LS = { follow: true, live: false, stream: null, src: null, an: null, timer: 0, ema: null, emaB: null, cand: null, candN: 0, quietN: 0, cur: null, auto: false, cap: [], held: 0, track: null, buf: null, sel: -1, player: null, raf: 0, name: '' };
  const LS_MAX_SEC = 360;
  const lsSay = (m) => { const el = $('lsMsg'); if (el) el.textContent = m || ''; };
  const pcName = (pc) => (S.flats ? FLAT_NAMES : SHARP_NAMES)[((pc % 12) + 12) % 12];
  // a heard chord ({root, sym}) as a chord the rest of the site understands, named and numbered as in the current key when it belongs there
  const INT_LABELS = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♯5', '6', '♭7', '7'];
  // a chord made of any notes you picked, when it has no standard name
  function customChord(root, pcs) {
    const names = S.flats ? FLAT_NAMES : SHARP_NAMES;
    const list = Array.from(new Set(pcs.map((p) => ((p % 12) + 12) % 12))).sort((a, b) => ((a - root + 12) % 12) - ((b - root + 12) % 12));
    const tones = list.map((pc) => { const s = (pc - root + 12) % 12; return { name: names[pc], pc, label: INT_LABELS[s], semis: s }; });
    return { name: names[root] + ' (custom)', roman: '', tones, custom: true };
  }
  // which standard chord a set of notes makes (the chosen root first, then any other note as the root)
  function nameNotes(pcs, root) {
    const set = Array.from(new Set(pcs)).sort((a, b) => a - b).join();
    const tryRoot = (r) => {
      for (let qi = 0; qi < ARP_ENTRIES.length; qi++) {
        const t = buildPattern(ARP_ENTRIES[qi], r, S.flats).notes.map((n) => n.pc);
        if (Array.from(new Set(t)).sort((a, b) => a - b).join() === set) return { root: r, sym: ARP_ENTRIES[qi].sym };
      }
      return null;
    };
    if (root !== undefined && pcs.indexOf(root) >= 0) { const hit = tryRoot(root); if (hit) return hit; }
    for (const r of pcs) { const hit = tryRoot(r); if (hit) return hit; }
    const r = root !== undefined && pcs.indexOf(root) >= 0 ? root : pcs[0];
    return { root: r, pcs: pcs.slice(), custom: true };
  }
  const chordPcs = (h) => { const c = lsChord(h); return c ? c.tones.map((t) => t.pc) : []; };
  const chordMinor = (h) => { const p = chordPcs(h); return p.indexOf((h.root + 3) % 12) >= 0 && p.indexOf((h.root + 4) % 12) < 0; };
  function lsChord(h) {
    if (!h) return null;
    if (h.custom) {
      const ch = customChord(h.root, h.pcs || [h.root]);
      const key = ch.tones.map((t) => t.pc).sort((a, b) => a - b).join();
      const hub = hubList.find((c) => c.tones.map((t) => t.pc).sort((a, b) => a - b).join() === key);
      return Object.assign(ch, hub ? { inKey: true, roman: hub.roman } : { inKey: false });
    }
    const qi = ARP_ENTRIES.findIndex((e) => e.sym === h.sym);
    if (qi < 0) return null;
    const ch = pickerChord(qi, h.root, S.flats);
    const key = ch.tones.map((t) => t.pc).sort((a, b) => a - b).join();
    const hub = hubList.find((c) => c.tones.map((t) => t.pc).sort((a, b) => a - b).join() === key);
    if (hub) return Object.assign({}, hub, { inKey: true });
    // a richer or plainer version of a chord in the key (G7 when the key shows G, or G when it shows Gmaj7) still belongs: same root, one set of notes inside the other
    const pcs = new Set(ch.tones.map((t) => t.pc));
    const near = hubList.find((c) => c.tones[0].pc === h.root && (c.tones.every((t) => pcs.has(t.pc)) || ch.tones.every((t) => c.tones.some((u) => u.pc === t.pc))));
    // ...but only when its extra notes are in the key too (G7 in C is V7; C7 in C is not I7), or it is the V7 of a minor key
    const scale = (S.hm === 'minor' ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]).map((s) => (S.hk + s) % 12);
    const fits = near && (ch.tones.every((t) => scale.indexOf(t.pc) >= 0) || (h.sym === '7' && romanBase(near.roman) === 'V'));
    if (near && fits) {
      const extra = h.sym === 'maj7' ? 'maj7' : /7/.test(h.sym) ? '7' : '';
      const base = romanBase(near.roman);
      return Object.assign(ch, { inKey: true, roman: extra && !/7/.test(near.roman) ? base + extra : (extra ? near.roman : base), hub: near });
    }
    return Object.assign(ch, { inKey: false });
  }
  const lsFresh = (h) => {
    let c = h && lsChord(h);
    if (!c) return null;
    if (Number.isInteger(h.bass) && h.bass >= 0 && h.bass !== h.root) c = withBass(c, h.bass, S.flats);
    return Object.assign(c, { root: h.root, sym: h.sym, custom: !!h.custom, pcs: h.pcs });
  };
  const chordRef = (h) => { if (!h) return null; const r = h.custom ? { root: h.root, custom: true, pcs: (h.pcs || []).slice() } : { root: h.root, sym: h.sym }; if (Number.isInteger(h.bass) && h.bass >= 0 && h.bass !== h.root) r.bass = h.bass; return r; };
  const refId = (h) => (h ? h.root + ':' + (h.custom ? 'c' + (h.pcs || []).slice().sort((a, b) => a - b).join('.') : h.sym) + (Number.isInteger(h.bass) ? '/' + h.bass : '') : '');
  const homeName = () => pcName(S.hk) + ' ' + (S.hm === 'minor' ? 'minor' : 'major');
  function lsWhere(ch) {
    if (!ch) return '';
    return ch.inKey ? `<b>${esc(ch.roman)}</b> in ${esc(homeName())}` : `Not in ${esc(homeName())}`;
  }
  function renderListen() {
    const now = $('lsNow');
    if (!now) return;
    $('lsLive').innerHTML = (LS.live ? ICON.stopf : ICON.mic) + (LS.live ? ' Stop listening' : ' Listen live');
    $('lsLive').setAttribute('aria-pressed', String(LS.live));
    const upi = document.querySelector && document.querySelector('.lsupi');
    if (upi && !upi.firstChild) upi.innerHTML = ICON.upload;
    const show = true;
    now.hidden = !show;
    if (show) {
      const ch = lsFresh(LS.cur);
      $('lsName').textContent = ch ? ch.name : (LS.live || GTR.on ? 'Listening…' : 'Ready');
      $('lsSub').innerHTML = ch ? esc(ch.tones.map((t) => t.name).join(' ')) + ' · ' + lsWhere(ch) : (LS.live || GTR.on ? 'Listening… strum a chord and let it ring.' : 'Press <b>Listen live</b> and play a chord. It lights up on the circle.');
      $('lsCircle').hidden = !ch;
      $('lsCircle').textContent = ch && !ch.inKey ? 'Show in its own key' : 'Show on the circle';
      $('lsAdd').hidden = !ch;
      $('lsEditBtn').hidden = !ch;
      lsSure();
      $('lsAuto').setAttribute('aria-pressed', String(LS.auto));
      $('lsAuto').hidden = !LS.live;
      $('lsFollow').setAttribute('aria-pressed', String(LS.follow));
      $('lsCapBox').hidden = !LS.cap.length;
      $('lsCap').innerHTML = LS.cap.map(lsFresh).map((c, i) => `<span class="lsw"><button type="button" class="lscap" data-lscap="${i}"><b>${esc(c.name)}</b><small>${esc(c.inKey ? c.roman : '·')}</small></button><button type="button" class="lsx" data-lscapdel="${i}" aria-label="Remove ${esc(c.name)}" title="Remove this chord">${ICON.x}</button></span>`).join('');
    }
    const tr = $('lsTrack');
    tr.hidden = !LS.track;
    if (LS.track) {
      const t = LS.track;
      const total = Math.max(0.1, t.dur);
      $('lsTrackHead').innerHTML = `<b>${t.segs.length} chord${t.segs.length === 1 ? '' : 's'}</b> in ${esc(LS.name || 'your clip')} (${Math.round(t.dur)} s)`
        + (t.key ? ` · sounds like <b>${esc(pcName(t.key.root) + ' ' + t.key.mode)}</b> <button type="button" class="tapbtn lssmall" data-ls="key">Use this key</button>` : '')
        + (Math.abs(t.tune || 0) > 0.12 ? `<span class="hint"> · the guitar is about ${Math.round(Math.abs(t.tune) * 100)} cents ${t.tune > 0 ? 'sharp' : 'flat'} (allowed for)</span>` : '')
        + (t.segs.some((g) => g.confidence !== undefined && g.confidence < 0.8) ? `<span class="hint"> · chords marked <b>?</b> were hard to hear: tap one to check it, then ✎ Edit chord</span>` : '');
      $('lsStrip').innerHTML = t.segs.map((g, i) => {
        const w = Math.max(4, ((g.end - g.start) / total) * 100);
        const ch = lsFresh(g) || g.ch;
        const unsure = g.confidence !== undefined && g.confidence < 0.8;
        return `<span class="lsw lssegw" style="flex-grow:${w.toFixed(2)}"><button type="button" class="lsseg${i === LS.sel ? ' on' : ''}${ch.inKey ? '' : ' out'}${unsure ? ' unsure' : ''}" data-lseg="${i}" title="${esc(ch.name)} at ${g.start.toFixed(1)} s${unsure ? ' (not sure: check it)' : ''}"><b>${esc(ch.name)}${unsure ? '?' : ''}</b><small>${esc(ch.inKey ? ch.roman : 'out of key')}</small></button><button type="button" class="lsx" data-lsegdel="${i}" aria-label="Remove ${esc(ch.name)} at ${g.start.toFixed(1)} seconds" title="Remove this chord">${ICON.x}</button></span>`;
      }).join('');
      $('lsPlay').innerHTML = (LS.player ? ICON.stopf : ICON.playf) + (LS.player ? ' Stop' : ' Play clip');
    }
    heardMark();
    if (LE.open) renderLsEdit();
    // the note bars are always there, flat until sound comes in
    const bb = $('lsBars');
    if (bb && (!bb.firstChild || bb.dataset.flats !== String(S.flats))) lsBars(LS.ema || new Float64Array(12), LS.ema ? 1 : 0);
  }
  // mark the chord being heard on the circle of fifths (a green outline on its spot, major or minor ring)
  // a small circle of fifths inside the listener, so the chord you play shows on it wherever you are on the page
  function miniCircleSvg(h) {
    const mode = S.hm === 'minor' ? 'minor' : 'major';
    const p = mode === 'major' ? (S.hk * 7) % 12 : (((S.hk + 3) % 12) * 7) % 12;   // the key's spot (its relative major's index)
    let hi = -1, hMinor = false;
    if (h) {
      hMinor = chordMinor(h);
      hi = hMinor ? ((h.root + 3) * 7) % 12 : (h.root * 7) % 12;
    }
    let s = '';
    for (let ring = 0; ring < 2; ring++) {
      const maj = ring === 0;
      for (let i = 0; i < 12; i++) {
        const dd = (i - p + 12) % 12;
        const near = dd === 0 || dd === 1 || dd === 11;
        const home = dd === 0 && maj === (mode === 'major');
        const heard = i === hi && maj === !hMinor;
        const pt = polar(maj ? 122 : 81, i * 30 - 90);
        const label = maj ? CIRC_MAJ[i] : CIRC_MIN[i];
        s += `<path class="mseg${near ? ' near' : ''}${home ? ' home' : ''}${heard ? ' heard' : ''}" d="${arcPath(i, maj ? 100 : 64, maj ? 144 : 98)}"/>`;
        s += `<text class="mlab${heard ? ' heard' : ''}" x="${pt[0].toFixed(1)}" y="${(pt[1] + 5).toFixed(1)}" text-anchor="middle" font-size="${label.length > 3 ? (maj ? 15 : 12) : (maj ? 22 : 17)}">${esc(label.split('/')[0])}</text>`;
      }
    }
    const nm = (S.flats ? FLAT_NAMES : SHARP_NAMES)[S.hk];
    s += `<text class="mkey" x="150" y="152" text-anchor="middle" font-size="34">${esc(nm)}</text><text class="mkey2" x="150" y="176" text-anchor="middle" font-size="16">${mode}</text>`;
    return `<svg viewBox="4 4 292 292" role="img" aria-label="Circle of fifths${h ? ', showing the chord you are playing' : ''}">${s}</svg>`;
  }
  // the listener's own circle, and one inside the pattern editor while it listens to your strumming
  function miniCircle() {
    const svg = miniCircleSvg(LS.cur);
    ['lsMini', 'gtrMini'].forEach((id) => { const box = $(id); if (box) { box.hidden = false; box.innerHTML = svg; } });
    const gn = $('gtrChord');
    if (gn) { const ch = lsFresh(LS.cur); gn.innerHTML = ch ? `<b>${esc(ch.name)}</b> <small>${ch.inKey ? esc(ch.roman) + ' in ' + esc(homeName()) : 'not in ' + esc(homeName())}</small>` : '<small>Chord: listening…</small>'; }
  }
  function heardMark() {
    miniCircle();
    const svg = $('circle');
    if (!svg || !svg.querySelector) return;
    const old = svg.querySelector('.heard');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    const note = $('circHeard');
    const h = LS.cur;
    if (note) note.hidden = !h;
    if (!h) return;
    const minor = chordMinor(h);
    const i = minor ? ((h.root + 3) * 7) % 12 : (h.root * 7) % 12;
    const tip = polar(minor ? 98 : 144, i * 30 - 90);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'heard');
    g.innerHTML = `<path d="${arcPath(i, minor ? 64 : 100, minor ? 98 : 144)}"/><circle cx="${tip[0].toFixed(1)}" cy="${tip[1].toFixed(1)}" r="7"/><text x="${tip[0].toFixed(1)}" y="${(tip[1] + 3.2).toFixed(1)}" text-anchor="middle">♪</text>`;
    const host = svg.querySelector('.hfocus') || svg;
    host.appendChild(g);
    // when the heard chord is also the chosen one, let the green mark speak alone
    const d = arcPath(i, minor ? 64 : 100, minor ? 98 : 144);
    (svg.querySelectorAll ? Array.prototype.slice.call(svg.querySelectorAll('.hring.hsrc')) : []).forEach((r) => { if (r.getAttribute('d') === d) r.setAttribute('class', 'hring hsrc undercover'); });
  }
  // follow mode: the chord you play becomes the chosen chord in the Key explorer, so "what comes next" follows your playing (silently: no sound back into the microphone)
  function lsFollow() {
    if (!LS.follow || !LS.cur) return;
    const ch = lsFresh(LS.cur);
    const hc = ch && ch.inKey ? ch.hub || ch : null;
    const want = hc ? { name: hc.name, roman: hc.roman, tones: hc.tones } : null;
    const same = (a, b) => (!a && !b) || (a && b && a.name === b.name && a.roman === b.roman);
    if (same(S.cx, want)) return;
    S.cx = want;
    S.chord = 'none';
    render();
  }
  // how sure the listener is, what else it could be, and a way to compare by ear
  function lsSure() {
    const box = $('lsSure');
    if (!box) return;
    const ch = lsFresh(LS.cur);
    if (!ch || LS.focus && LS.focus.kind !== 'cur' || !(LS.conf > 0)) {
      box.innerHTML = ch ? `<button type="button" class="tapbtn lssmall" data-ls="compare">Hear ${esc(ch.name)} to compare</button>` : '';
      return;
    }
    const c = Math.round((LS.conf || 0) * 100);
    const word = c >= 70 ? 'Sure' : c >= 40 ? 'Fairly sure' : 'Not sure';
    const alts = (LS.alts || []).map(lsFresh).filter(Boolean);
    const tune = LS.tune || 0;
    box.innerHTML = `<div class="sure ${c >= 70 ? 'hi' : c >= 40 ? 'mid' : 'lo'}"><span class="surebar"><i style="width:${Math.max(6, c)}%"></i></span><b>${word}</b> <small>${c}%</small></div>`
      + (alts.length && c < 85 ? `<div class="alts"><span>Could also be:</span>${alts.map((a, i) => `<button type="button" class="tapbtn lssmall" data-lsalt="${i}">${esc(a.name)}</button>`).join('')}<span class="hint">Tap the right one if it is wrong.</span></div>` : '')
      + `<div class="alts"><button type="button" class="tapbtn lssmall" data-ls="compare">Hear ${esc(ch.name)} to compare</button>`
      + (Math.abs(tune) > 0.12 ? `<span class="hint">Your guitar sounds about ${Math.round(Math.abs(tune) * 100)} cents ${tune > 0 ? 'sharp' : 'flat'}. The listener allows for it, but tuning up helps.</span>` : '') + `</div>`;
  }
  function lsShowNow(h, quiet) {
    LS.cur = chordRef(h);
    renderListen();
    lsFollow();
    const ch = lsFresh(LS.cur);
    if (!quiet && ch) audition(ch);
  }
  // live listening (only where the page is allowed to use the microphone)
  async function lsStart() {
    if (!(window.AudioContext || window.webkitAudioContext)) { lsSay('This browser cannot listen to sound.'); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { lsBlocked(); return; }
    if (GTR.on) gtrStop(false);
    if (SL.live) slStop();
    lsSay('Asking to use the microphone…');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const c = micContext();
      if (!c) { stream.getTracks().forEach((t) => t.stop()); lsBlocked(); return; }
      LS.mc = c;
      if (c.state !== 'running') { try { await c.resume(); } catch (e) {} }
      LS.stream = stream;
      LS.src = c.createMediaStreamSource(stream);
      LS.an = c.createAnalyser();
      LS.an.fftSize = 16384;
      LS.src.connect(LS.an);              // not to the speakers: no feedback
      LS.live = true;
      LS.ema = null; LS.cand = null; LS.candN = 0; LS.quietN = 0; LS.lastSoundAt = Date.now(); LS.tS = 0; LS.tC = 0; LS.tune = 0; LS.conf = 0; LS.alts = [];
      lsSay('Listening. Strum a chord and let it ring for a moment.');
      const buf = new Float32Array(LS.an.fftSize);
      LS.timer = setInterval(() => lsTick(buf, c.sampleRate), 90);
      renderListen();
    } catch (e) {
      lsBlocked();
    }
  }
  function lsBlocked() {
    LS.live = false;
    lsSay('The microphone is not available here. Pages shown inside the Claude app cannot use it; live listening works once the site is hosted on its own (for example on GitHub Pages). For now, record a short clip and upload it: on a phone, “Upload a clip” also lets you take a video, and its sound is used.');
    renderListen();
  }
  function lsStop() {
    clearInterval(LS.timer);
    try { if (LS.src) LS.src.disconnect(); } catch (e) {}
    try { if (LS.stream) LS.stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
    closeMic(LS.mc); LS.mc = null;
    LS.stream = LS.src = LS.an = null;
    LS.live = false;
    lsSay(LS.cap.length ? 'Stopped. Your captured chords are below.' : '');
    renderListen();
  }
  function lsTick(buf, sr) {
    if (!LS.an) return;
    LS.an.getFloatTimeDomainData(buf);
    lsHear(buf, sr);
  }
  // chords that belong to the key in use get a small head start when two chords sound almost alike
  let priorFor = '', priorSet = new Set();
  function keyPrior() {
    const k = S.hk + ':' + S.hm + ':' + hubList.length;
    if (k !== priorFor) {
      priorFor = k;
      priorSet = new Set(hubList.map((c) => { const p = c.tones.map((t) => t.pc); const s = chordSym(p[0], p); return p[0] + ':' + (s === null ? '?' : s); }));
    }
    return (root, sym) => (priorSet.has(root + ':' + sym) ? 0.02 : 0);
  }
  function lsHear(buf, sr) {
    if (LS.live) { LS.lastSoundAt = LS.lastSoundAt || Date.now(); if (Date.now() - LS.lastSoundAt > 90000) { lsStop(); lsSay('Stopped listening after a while without chords. Press Listen live to start again.'); return; } }
    if ((LS.pauseUntil && Date.now() < LS.pauseUntil) || Date.now() < selfSoundUntil) return;   // the site is playing: do not listen to itself
    const d = downTo11k(buf, sr);
    const f = chromaFrame(d.x, d.sr, Math.max(0, d.x.length - CHROMA_N), LS.tune || 0);
    // keep a running estimate of how the guitar is tuned, and read notes relative to it
    if (f.rms > 0.01) { LS.tS = 0.92 * (LS.tS || 0) + f.ts; LS.tC = 0.92 * (LS.tC || 0) + f.tc; LS.tune = tuneFrom(LS.tS, LS.tC); }
    if (!LS.ema) { LS.ema = new Float64Array(12); LS.emaB = new Float64Array(12); }
    for (let i = 0; i < 12; i++) { LS.ema[i] = 0.55 * LS.ema[i] + 0.45 * f.chroma[i]; LS.emaB[i] = 0.55 * LS.emaB[i] + 0.45 * f.bass[i]; }
    lsBars(LS.ema, f.rms);
    let h = hearChord(LS.ema, LS.emaB, f.rms, keyPrior());
    if (h) LS.conf = 0.7 * (LS.conf || 0) + 0.3 * h.conf;
    if (!h || h.score < 0.72) {
      if (++LS.quietN > 8 && LS.cur) { LS.cur = null; LS.held = 0; renderListen(); }
      LS.cand = null; LS.candN = 0;
      return;
    }
    LS.quietN = 0;
    // you corrected this sound before: show your chord instead
    const fix = LS.fixes && LS.fixes[h.root + ':' + h.sym];
    if (fix) { h = Object.assign({}, h, fix, { conf: 1, others: [] }); LS.conf = 1; }
    const id = refId(h.custom ? h : { root: h.root, sym: h.sym });
    if (LS.cand === id) LS.candN++; else { LS.cand = id; LS.candN = 1; }
    const curId = refId(LS.cur);
    if (LS.candN >= 3 && id !== curId) {
      const ch = lsChord(h);
      LS.lastSoundAt = Date.now();
      if (ch) {
        LS.cur = chordRef(h.custom ? h : { root: h.root, sym: h.sym });
        LS.heardId = h.heard || h.root + ':' + h.sym;
        LS.alts = h.others.filter((o) => !(o.root === h.root && o.sym === h.sym)).slice(0, 3).map((o) => ({ root: o.root, sym: o.sym }));
        LS.focus = { kind: 'cur' }; LS.held = 0; renderListen(); lsFollow();
      }
    } else if (id === curId) {
      LS.held++;
      if (LS.held % 4 === 0) lsSure();
      // auto-capture: once a chord has rung for about half a second, add it to the captured row (if it is a new chord)
      const last = LS.cap[LS.cap.length - 1];
      if (LS.auto && LS.held === 5 && (!last || refId(last) !== curId) && LS.cap.length < PROG_MAX) { LS.cap.push(LS.cur); renderListen(); }
    }
  }
  function lsBars(chroma, rms) {
    const box = $('lsBars');
    if (!box) return;
    let mx = 0;
    for (let i = 0; i < 12; i++) mx = Math.max(mx, chroma[i]);
    const cc = lsFresh(LS.cur);
    const on = cc ? cc.tones.map((t) => t.pc) : [];
    if (!box.firstChild || box.dataset.flats !== String(S.flats)) {
      box.dataset.flats = String(S.flats);
      box.innerHTML = Array.from({ length: 12 }, (_, i) => `<span class="lsbar"><i></i><em>${esc(pcName(i))}</em></span>`).join('');
    }
    const bars = box.children || [];
    for (let i = 0; i < 12 && bars[i]; i++) {
      const v = mx > 0 && rms > 0.003 ? chroma[i] / mx : 0;
      const bar = bars[i].firstChild;
      if (bar && bar.style) bar.style.height = Math.round(6 + v * 94) + '%';
      if (bars[i].classList) bars[i].classList.toggle('on', on.indexOf(i) >= 0);
    }
  }
  // a recording: find the chords over time
  async function lsFile(file) {
    const c = audio();
    if (!c || !file) return;
    if (LS.live) lsStop();
    lsStopClip();
    lsSay('Reading the recording…');
    try {
      const raw = file.arrayBuffer ? await file.arrayBuffer() : await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsArrayBuffer(file); });
      const ab = await new Promise((res, rej) => { const p = c.decodeAudioData(raw, res, rej); if (p && p.then) p.then(res, rej); });
      lsSay('Listening for chords…');
      await new Promise((r) => setTimeout(r, 30));
      const sr = ab.sampleRate, len = Math.min(ab.length, Math.floor(sr * LS_MAX_SEC));
      const x = new Float32Array(len);
      for (let ch = 0; ch < ab.numberOfChannels; ch++) { const d = ab.getChannelData(ch); for (let i = 0; i < len; i++) x[i] += d[i] / ab.numberOfChannels; }
      let mx = 0;
      for (let i = 0; i < len; i++) mx = Math.max(mx, Math.abs(x[i]));
      if (mx > 0) for (let i = 0; i < len; i++) x[i] /= mx;
      const tr = chordTrack(x, sr);
      LS.buf = ab;
      LS.name = file.name || 'your clip';
      const segs = tr.segments.map((g) => Object.assign({}, g, { ch: Object.assign(lsChord(g) || {}, { root: g.root, sym: g.sym }) })).filter((g) => g.ch.name);
      LS.track = { segs, dur: len / sr, key: tr.key, tune: tr.tune || 0 };
      LS.sel = -1;
      lsSay(segs.length ? 'Tap a chord in the strip to hear it and see where it sits; add them one by one or all at once.' + (ab.length > len ? ' Only the first ' + Math.round(LS_MAX_SEC / 60) + ' minutes were read.' : '') : 'No clear chords were found. Strum each chord a few times and let it ring, close to the phone, with little background noise.');
      renderListen();
    } catch (e) {
      lsSay('This file could not be read. Try a different format (m4a, mp3, wav or a phone video) or record it again.');
    }
  }
  // play the uploaded clip and light up each chord as it goes past
  function lsPlayClip() {
    const c = audio();
    if (!c || !LS.buf) return;
    if (LS.player) { lsStopClip(); return; }
    const s = c.createBufferSource();
    s.buffer = LS.buf;
    const g = c.createGain();
    g.gain.value = 0.9;
    s.connect(g); g.connect(busNode(c));
    const from = LS.sel >= 0 && LS.track.segs[LS.sel] ? LS.track.segs[LS.sel].start : 0;
    const t0 = c.currentTime - from;
    s.start(0, from);
    s.onended = () => { if (LS.player === s) { LS.player = null; renderListen(); } };
    LS.player = s;
    renderListen();
    const step = () => {
      if (LS.player !== s) return;
      const now = c.currentTime - t0;
      const i = LS.track.segs.findIndex((g2) => now >= g2.start && now < g2.end);
      qsa($('lsStrip'), '[data-lseg]').forEach((b) => b.classList.toggle('playing', +b.getAttribute('data-lseg') === i));
      LS.raf = requestAnimationFrame(step);
    };
    if (window.requestAnimationFrame) LS.raf = requestAnimationFrame(step);
  }
  function lsStopClip() {
    if (LS.player) { try { LS.player.stop(); } catch (e) {} }
    LS.player = null;
    if (window.cancelAnimationFrame) cancelAnimationFrame(LS.raf);
    qsa($('lsStrip'), '.playing').forEach((b) => b.classList.remove('playing'));
  }
  function lsAddAll(list, lengths) {
    let n = 0;
    for (const g of list) {
      const ch = (g.end !== undefined ? lsFresh(g) : g) || g.ch || g;
      if (!addToProg(ch, null, { quiet: true })) break;
      if (lengths && g.end) P.slots[P.slots.length - 1].beats = Math.max(1, Math.min(8, Math.round((g.end - g.start) / beatSec())));
      n++;
    }
    saveProg();
    renderProg();
    if (n) { say('Added ' + n + ' chord' + (n === 1 ? '' : 's') + ' to the progression.'); flash('Added ' + n + (n === 1 ? ' chord' : ' chords')); }
  }
  // show a heard chord in the Key explorer (in this key, or in its own key when it does not belong here)
  function lsToCircle(ch) {
    if (!ch) return;
    if (!ch.inKey) setHome(ch.root, /^m|°/.test(ch.sym) && ch.sym !== 'maj7' ? 'minor' : 'major');
    const fresh = lsChord({ root: ch.root, sym: ch.sym });
    if (fresh && fresh.inKey) { S.cx = { name: fresh.name, roman: fresh.roman, tones: fresh.tones }; S.chord = 'none'; render(); }
    if (LAYOUT === 'one' || TAB !== 'keys') setTab('keys');
  }
  /* ---------- Scale listener: play notes one at a time, it names them and finds the scales that fit ---------- */
  const SL = { live: false, stream: null, src: null, an: null, timer: 0, w: new Array(12).fill(0), seq: [], first: -1, last: -1, low: 999, cand: -1, candN: 0, cur: -1, curF: 0, res: [], dirty: false, lastRender: 0 };
  const slSay = (m) => { const el = $('slMsg'); if (el) el.textContent = m || ''; };
  function slReset() { Object.assign(SL, { w: new Array(12).fill(0), seq: [], first: -1, last: -1, low: 999, cand: -1, candN: 0, cur: -1, res: [] }); renderScaleListen(); }
  function slNote(midi, dt) {
    const pc = ((midi % 12) + 12) % 12;
    SL.w[pc] += dt;
    if (SL.first < 0) SL.first = pc;
    SL.last = pc;
    if (midi < SL.low) SL.low = midi;
    if (SL.seq[SL.seq.length - 1] !== midi) { SL.seq.push(midi); if (SL.seq.length > 40) SL.seq.shift(); SL.dirty = true; }
  }
  function slMatch() {
    SL.res = scaleMatches(SL.w, { first: SL.first, last: SL.last, lowest: SL.low < 999 ? SL.low % 12 : undefined });
  }
  async function slStart() {
    if (!(window.AudioContext || window.webkitAudioContext)) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { slBlocked(); return; }
    if (LS.live) lsStop();
    if (GTR.on) gtrStop(false);
    slSay('Asking to use the microphone…');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const c = micContext();
      if (!c) { stream.getTracks().forEach((t) => t.stop()); slBlocked(); return; }
      SL.mc = c;
      if (c.state !== 'running') { try { await c.resume(); } catch (e) {} }
      SL.stream = stream;
      SL.src = c.createMediaStreamSource(stream);
      SL.an = c.createAnalyser();
      SL.an.fftSize = 4096;
      SL.src.connect(SL.an);
      SL.live = true;
      SL.floor = undefined; SL.peak = 0; SL.ticks = 0;
      const buf = new Float32Array(SL.an.fftSize);
      slSay('Listening. Play the notes one at a time and let each one ring a moment.');
      SL.timer = setInterval(() => slTick(buf, c.sampleRate), 80);
      SL.lastNoteAt = Date.now();
      renderScaleListen();
    } catch (e) { slBlocked(); }
  }
  function slBlocked() {
    SL.live = false;
    slSay('The microphone is not available here. Pages shown inside the Claude app cannot use it; on your own hosted site (or localhost) it works. For now, record yourself playing the scale and upload the clip.');
    renderScaleListen();
  }
  function slStop() {
    clearInterval(SL.timer);
    try { if (SL.src) SL.src.disconnect(); } catch (e) {}
    try { if (SL.stream) SL.stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
    closeMic(SL.mc); SL.mc = null;
    SL.stream = SL.src = SL.an = null;
    SL.live = false;
    slSay(SL.seq.length ? 'Stopped. The scales that fit what you played are below.' : '');
    renderScaleListen();
  }
  // one moment of sound: the note being played, if it is clear
  function pitchOf(x, sr, from, len, gate) {
    let e = 0;
    for (let i = from; i < from + len && i < x.length; i++) e += x[i] * x[i];
    const rms = Math.sqrt(e / len);
    if (rms < (gate || 0.006)) return { rms, midi: null };
    // a quarter-rate copy is plenty for guitar notes and about 16 times less work, so the page (and its sound) stays smooth
    const d = downTo11k(x.subarray ? x.subarray(from, Math.min(x.length, from + len)) : x.slice(from, from + len), sr);
    const f = detectPitch(d.x, d.sr, 0, d.x.length / d.sr);
    if (!(f > 70 && f < 1200)) return { rms, midi: null };
    return { rms, midi: Math.round(69 + 12 * Math.log2(f / 440)), f };
  }
  function slTick(buf, sr) {
    if (!SL.an) return;
    if (Date.now() - (SL.lastNoteAt || Date.now()) > 60000) { slStop(); slSay('Stopped listening after a minute without notes. Press Listen live to start again.'); return; }
    if (Date.now() < selfSoundUntil) return;
    SL.an.getFloatTimeDomainData(buf);
    // quiet microphones: learn the room's noise level and listen to anything clearly above it
    let e = 0;
    for (let i = 0; i < buf.length; i++) e += buf[i] * buf[i];
    const rms = Math.sqrt(e / buf.length);
    SL.floor = SL.floor === undefined ? rms : Math.min(rms, SL.floor * 1.002 + 0.00001);
    SL.peak = Math.max(rms, (SL.peak || 0) * 0.995);
    SL.level = rms;
    SL.ticks = (SL.ticks || 0) + 1;
    const lv = $('slLevel');
    if (lv && lv.style) lv.style.width = Math.min(100, Math.round((rms / Math.max(0.01, SL.peak)) * 100)) + '%';
    if (SL.ticks === 90 && !SL.seq.length && SL.peak < 0.003) slSay('I can hardly hear anything. Check that the right microphone is chosen in your browser, and play closer to it.');
    const p = pitchOf(buf, sr, 0, buf.length, Math.max(0.0012, SL.floor * 3));
    if (p.midi === null) { SL.candN = 0; SL.cand = -1; if (SL.cur >= 0 && rms < Math.max(0.001, SL.floor * 2)) { SL.cur = -1; renderScaleListen(); } return; }
    // octave slips are common in pitch reading: a steady note is the same note name, in any octave
    if (SL.cand >= 0 && (p.midi - SL.cand) % 12 === 0) { if (p.midi !== SL.cand && Math.abs(p.midi - SL.cand) === 12) p.midi = Math.min(p.midi, SL.cand); SL.candN++; SL.cand = p.midi; } else { SL.cand = p.midi; SL.candN = 1; }
    if (SL.candN >= 2) {
      SL.lastNoteAt = Date.now();
      slNote(p.midi, 0.08);
      if (SL.cur !== p.midi) { SL.cur = p.midi; SL.curF = p.f; }
    }
    const now = Date.now();
    if (SL.dirty || now - SL.lastRender > 400) { SL.dirty = false; SL.lastRender = now; slMatch(); renderScaleListen(); }
  }
  async function slFile(file) {
    const c = audio();
    if (!c || !file) return;
    if (SL.live) slStop();
    slSay('Reading the recording…');
    try {
      const raw = file.arrayBuffer ? await file.arrayBuffer() : await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsArrayBuffer(file); });
      const ab = await new Promise((res, rej) => { const p = c.decodeAudioData(raw, res, rej); if (p && p.then) p.then(res, rej); });
      const sr = ab.sampleRate, len = Math.min(ab.length, Math.floor(sr * 120));
      const x = new Float32Array(len);
      for (let ch = 0; ch < ab.numberOfChannels; ch++) { const d = ab.getChannelData(ch); for (let i = 0; i < len; i++) x[i] += d[i] / ab.numberOfChannels; }
      let mx = 0;
      for (let i = 0; i < len; i++) mx = Math.max(mx, Math.abs(x[i]));
      if (mx > 0) for (let i = 0; i < len; i++) x[i] = (x[i] / mx) * 0.5;
      slReset();
      const hop = Math.floor(sr * 0.04), win = 2048;
      let prev = null;
      for (let s = 0; s + win < len; s += hop) {
        const p = pitchOf(x, sr, s, win);
        if (p.midi !== null && p.midi === prev) slNote(p.midi, hop / sr);
        prev = p.midi;
      }
      slMatch();
      slSay(SL.seq.length ? 'Read ' + (file.name || 'the clip') + '. The scales that fit it are below.' : 'No clear single notes were found. Play one note at a time, close to the microphone.');
      renderScaleListen();
    } catch (e) {
      slSay('This file could not be read. Try a different format (m4a, mp3, wav or a phone video) or record it again.');
    }
  }
  function renderScaleListen() {
    const box = $('slBody');
    if (!box) return;
    const names = S.flats ? FLAT_NAMES : SHARP_NAMES;
    $('slLive').innerHTML = (SL.live ? ICON.stopf : ICON.mic) + (SL.live ? ' Stop listening' : ' Listen live');
    $('slLive').setAttribute('aria-pressed', String(SL.live));
    const mx = Math.max.apply(null, SL.w) || 1;
    const nowNote = SL.cur >= 0 ? names[SL.cur % 12] + (Math.floor(SL.cur / 12) - 1) : (SL.live ? '…' : '');
    $('slNow').innerHTML = SL.cur >= 0 ? `<b>${esc(names[SL.cur % 12])}</b><small>${esc(nowNote)}${SL.curF ? ' · ' + Math.round(SL.curF) + ' Hz' : ''}</small>` : `<b>${SL.live ? 'Listening…' : 'Ready'}</b><small>${SL.live ? 'play a note' : SL.seq.length ? SL.seq.length + ' notes heard' : 'press Listen live and play'}</small>`;
    $('slNotes').innerHTML = names.map((n, pc) => { const v = SL.w[pc] / mx; const on = v > 0.08; return `<span class="slnote${on ? ' on' : ''}${pc === (SL.cur % 12) && SL.cur >= 0 ? ' now' : ''}"><i style="height:${Math.round(on ? 20 + v * 80 : 6)}%"></i><em>${esc(n)}</em></span>`; }).join('');
    $('slTrail').textContent = SL.seq.length ? 'Played: ' + SL.seq.slice(-24).map((m) => names[m % 12]).join(' ') : '';
    const res = SL.res.slice(0, 5);
    $('slResults').innerHTML = res.length
      ? `<h4>Scales that fit</h4>` + res.map((r, i) => {
        const fits = r.extra.length ? 'misses ' + r.extra.map((p) => names[p]).join(', ') : r.missing.length ? 'fits every note you played · not played yet: ' + r.missing.map((p) => names[p]).join(', ') : 'fits every note, and you played all of them';
        return `<div class="slres${i === 0 ? ' best' : ''}"><div><b>${esc(names[r.root] + ' ' + r.name)} <button type="button" class="info" data-info="scale:${r.id}" aria-label="About the ${esc(r.name)} scale">i</button></b><small>${esc(fits)}</small></div><button type="button" class="tapbtn" data-sl-show="${r.id}:${r.root}">Show on fretboard</button><button type="button" class="tapbtn" data-sl-hear="${r.id}:${r.root}">Hear it</button></div>`;
      }).join('') + `<p class="hint">The first one is the best guess. The home note matters: the same notes make C major and A minor, so play the note you hear as "home" first and last.</p>`
      : `<p class="hint">Play a scale or a melody, one note at a time. The notes light up here and the scales that fit appear.</p>`;
  }
  function slClick(t) {
    if (t.closest('#slLive')) { if (SL.live) slStop(); else slStart(); return true; }
    if (t.closest('[data-sl="clear"]')) { slReset(); slSay(''); return true; }
    const sh = t.closest('[data-sl-show]');
    if (sh) {
      const [id, root] = sh.dataset.slShow.split(':');
      S.key = +root; S.id = id; S.pat = 'all'; S.pos = 'all'; S.chord = 'none'; S.cx = null;
      render();
      if (LAYOUT === 'tabs') setTab('fretboard'); else showBoard();
      return true;
    }
    const hr = t.closest('[data-sl-hear]');
    if (hr) {
      const [id, root] = hr.dataset.slHear.split(':');
      const e = ENTRIES.find((x) => x.id === id);
      if (e) {
        const notes = buildPattern(e, +root, S.flats).notes;
        const base = 48 + +root;
        const up = notes.map((n) => base + n.semis).sort((a, b) => a - b).concat([base + 12]);
        up.concat(up.slice(0, -1).reverse()).forEach((m, k) => pluck(m, k * 0.22, 0.8));
      }
      return true;
    }
    return false;
  }

  /* ---------- Pick notes on the scale and send them to the chord creator ---------- */
  const NP = { on: false, picks: [] };   // picks: {s, f, midi, pc} in the order tapped
  function pkPaint() {
    const neck = $('neck');
    if (neck && neck.querySelectorAll) qsa(neck, '.dot').forEach((el) => el.classList.toggle('picked', NP.on && NP.picks.some((p) => String(p.s) === el.getAttribute('data-s') && String(p.f) === el.getAttribute('data-f'))));
    const btn = $('pickBtn');
    if (btn) { btn.setAttribute('aria-pressed', String(NP.on)); btn.textContent = NP.on ? 'Picking notes…' : 'Pick notes'; }
    const bar = $('pickBar');
    if (!bar) return;
    bar.hidden = !NP.on;
    if (!NP.on) { bar.innerHTML = ''; return; }
    const names = S.flats ? FLAT_NAMES : SHARP_NAMES;
    const r = pkResult();
    const ch = r ? lsFresh(r) : null;
    const sorted = NP.picks.slice().sort((a, b) => a.midi - b.midi);
    bar.innerHTML = `<div class="pkhead">${ch ? `<b>${esc(ch.name)}</b><span>${esc(ch.inKey ? ch.roman + ' in ' + homeName() : 'not in ' + homeName())}</span>` : '<b>Pick notes</b>'}`
      + `<span>${NP.picks.length ? 'Tap more notes on the neck, or tap a picked one again to drop it.' : 'Tap notes on the neck to pick them. Pick two or more to make a chord.'}</span></div>`
      + (sorted.length ? `<div class="pknotes">${sorted.map((p) => `<button type="button" class="pknote" data-pk="drop:${p.s}:${p.f}" title="Remove this note">${esc(names[p.pc])}<small>${esc(STRING_NAMES[p.s])} string, ${p.f === 0 ? 'open' : 'fret ' + p.f} ×</small></button>`).join('')}</div>` : '')
      + `<div class="lsbtns"><button type="button" class="tapbtn" data-pk="hear"${NP.picks.length ? '' : ' disabled'}>Hear them</button>`
      + `<button type="button" class="shapeadd" data-pk="send"${NP.picks.length ? '' : ' disabled'}>Open in chord creator</button>`
      + `<button type="button" class="tapbtn" data-pk="add"${ch ? '' : ' disabled'}>+ Add to progression</button>`
      + `<button type="button" class="tapbtn" data-pk="clear"${NP.picks.length ? '' : ' disabled'}>Clear</button>`
      + `<button type="button" class="tapbtn" data-pk="done">Done</button></div>`;
  }
  // the lowest picked note is the bass; the chord is named from it when the notes make a known chord on it
  function pkResult() {
    if (!NP.picks.length) return null;
    const sorted = NP.picks.slice().sort((a, b) => a.midi - b.midi);
    const pcs = Array.from(new Set(sorted.map((p) => p.pc)));
    const r = nameNotes(pcs, sorted[0].pc);
    if (r && sorted[0].pc !== r.root) r.bass = sorted[0].pc;
    return r;
  }
  // one finger per string, like a real guitar: when a string has two picks, the later one wins
  function pkFrets() {
    const fr = [-1, -1, -1, -1, -1, -1];
    NP.picks.forEach((p) => { fr[p.s] = p.f; });
    return fr;
  }
  const pkOnePerString = () => new Set(NP.picks.map((p) => p.s)).size === NP.picks.length;
  function pkToggle(s, f, midi, pc) {
    const at = NP.picks.findIndex((p) => p.s === s && p.f === f);
    if (at >= 0) NP.picks.splice(at, 1);
    else { NP.picks.push({ s, f, midi, pc }); pluck(midi, 0, 1.2); }
    pkPaint();
  }
  function pkClick(t) {
    if (t.closest('#pickBtn')) { NP.on = !NP.on; pkPaint(); return true; }
    const b = t.closest('[data-pk]');
    if (!b) return false;
    const a = b.getAttribute('data-pk');
    if (a.indexOf('drop:') === 0) { const [s, f] = a.slice(5).split(':').map(Number); NP.picks = NP.picks.filter((p) => !(p.s === s && p.f === f)); pkPaint(); return true; }
    if (a === 'clear') { NP.picks = []; pkPaint(); return true; }
    if (a === 'done') { NP.on = false; pkPaint(); return true; }
    if (a === 'hear') {
      NP.picks.slice().sort((x, y) => x.midi - y.midi).forEach((p, k) => pluck(p.midi, k * STRUM_GAP, 2.0));
      return true;
    }
    const r = pkResult();
    if (!r) return true;
    if (a === 'add') { const ch = lsFresh(r); if (ch) addToProg(ch, pkOnePerString() ? { frets: pkFrets() } : null); return true; }
    if (a === 'send') {
      leOpen(null, 'pwEdit', true);
      try { localStorage.removeItem('fretboard-pw-closed'); } catch (e) {}
      const pcs = Array.from(new Set(NP.picks.slice().sort((x, y) => x.midi - y.midi).map((p) => p.pc)));
      const one = pkOnePerString();   // two picks on one string can't both be fingered: let the creator find a playable shape
      Object.assign(LE, { pcs, root: r.root, bass: Number.isInteger(r.bass) ? r.bass : -1, frets: one ? pkFrets() : null, stale: !one });
      if (one) lePlace();
      renderLsEdit();
      setTab('progression');
      focusIn('#pwEdit');
      say('Sent ' + pcs.length + ' note' + (pcs.length === 1 ? '' : 's') + ' to the chord creator' + (lsFresh(r) ? ': ' + lsFresh(r).name : '') + '.');
      return true;
    }
    return false;
  }

  /* ---------- Chord editor / creator: fix a heard chord, or build one note by note ---------- */
  const LE = { open: false, target: null, root: 0, pcs: [], host: 'lsEdit', bass: -1, frets: null, pos: 1, stale: true, ghost: false };
  try { LE.ghost = localStorage.getItem('fretboard-le-ghost') === '1'; } catch (e) {}
  function leOpen(target, host, quiet) {
    if ((host || 'lsEdit') === 'pwEdit' && !quiet) { try { localStorage.removeItem('fretboard-pw-closed'); } catch (e) {} }
    let src = null;
    let bass = -1;
    if (target && target.kind === 'slot') { const sl = P.slots[target.i]; if (sl) { const pcs = sl.tones.map((t) => t.pc); src = nameNotes(pcs, pcs[0]); if (Number.isInteger(sl.bass)) bass = sl.bass; } }
    if (target && target.kind === 'cap') src = LS.cap[target.i];
    else if (target && target.kind === 'seg') src = LS.track && LS.track.segs[target.i];
    else if (target && target.kind === 'cur') src = LS.cur;
    if (!src) src = LS.cur || { root: S.hk, sym: S.hm === 'minor' ? 'm' : '' };
    if (LE.open && LE.host !== (host || 'lsEdit')) { const old = $(LE.host); if (old) { old.hidden = true; old.innerHTML = ''; } }
    if (bass < 0 && src && Number.isInteger(src.bass)) bass = src.bass;
    Object.assign(LE, { open: true, target: target || null, root: src.root, pcs: chordPcs(src), host: host || 'lsEdit', bass, frets: null, stale: true });
    if (target && target.kind === 'slot' && P.slots[target.i] && P.slots[target.i].frets) { LE.frets = P.slots[target.i].frets.slice(); LE.stale = false; lePlace(); }
    renderLsEdit();
    if (!quiet) focusIn('#' + LE.host);
  }
  function leResult() { const r = nameNotes(LE.pcs, LE.root); if (r && LE.bass >= 0 && LE.bass !== r.root) r.bass = LE.bass; return r; }
  function renderLsEdit() {
    ['lsEdit', 'pwEdit'].forEach((id) => { if (id !== LE.host) { const o = $(id); if (o) { o.hidden = true; o.innerHTML = ''; } } });
    const box = $(LE.host);
    if (!box) return;
    box.hidden = !LE.open;
    if (!LE.open) { box.innerHTML = ''; return; }
    const names = S.flats ? FLAT_NAMES : SHARP_NAMES;
    if (LE.stale) leSyncShape();
    const r = LE.pcs.length ? leResult() : null;
    const ch = r ? lsFresh(r) : null;
    const tgt = LE.target ? (LE.target.kind === 'cap' ? 'captured chord ' + (LE.target.i + 1) : LE.target.kind === 'seg' ? 'chord ' + (LE.target.i + 1) + ' of the clip' : LE.target.kind === 'slot' ? 'chord ' + (LE.target.i + 1) + ' of your progression' : 'the heard chord') : '';
    const qi = r && !r.custom ? ARP_ENTRIES.findIndex((e) => e.sym === r.sym) : -1;
    box.innerHTML = `<div class="lehead"><b>${LE.target ? 'Edit ' + esc(tgt) : 'Chord creator'}</b><span>Pick a root and type, or tap notes to build any chord.</span></div>`
      + `<div class="lequick"><label class="field"><span>Root</span><select id="leRoot">${names.map((n, i) => `<option value="${i}"${i === LE.root ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>`
      + `<label class="field"><span>Bass note</span><select id="leBass"><option value="-1"${LE.bass < 0 ? ' selected' : ''}>Root (normal)</option>${names.map((n, i) => `<option value="${i}"${i === LE.bass ? ' selected' : ''}>/${esc(n)}</option>`).join('')}</select></label>`
      + `</div><div class="field"><span>Type${r && r.custom ? ' (now: custom notes)' : ''}</span><div class="leqbtns" role="group" aria-label="Chord type">${ARP_ENTRIES.map((e, i) => `<button type="button" class="qbtn" data-leq="${i}" aria-pressed="${i === qi}" title="${esc(e.name)}">${esc(QUAL[e.sym].short)}</button>`).join('')}</div></div>`
      + `<div class="lenotes" role="group" aria-label="Notes in the chord">${names.map((n, pc) => { const on = LE.pcs.indexOf(pc) >= 0; const root = on && pc === (r ? r.root : LE.root); return `<button type="button" class="lenote${on ? ' on' : ''}${root ? ' root' : ''}" data-le="note:${pc}" aria-pressed="${on}"><b>${esc(n)}</b><small>${on ? (root ? 'root' : INT_LABELS[(pc - (r ? r.root : LE.root) + 12) % 12]) : ''}</small></button>`; }).join('')}</div>`
      + leBoard(ch)
      + `<p class="leout">${ch ? `<b>${esc(ch.name)}</b> <span>${esc(ch.tones.map((t) => t.name).join(' '))} · ${ch.inKey ? '<b>' + esc(ch.roman) + '</b> in ' + esc(homeName()) : 'not in ' + esc(homeName())}</span>` : '<span>Tap at least one note.</span>'}</p>`
      + `<div class="lsbtns"><button type="button" class="tapbtn" data-le="hear"${ch ? '' : ' disabled'}>Hear it</button>`
      + (LE.target ? `<button type="button" class="tapbtn strong" data-le="apply"${ch ? '' : ' disabled'}>Use this chord</button>` : '')
      + `<button type="button" class="shapeadd" data-le="add"${ch ? '' : ' disabled'}>+ Add to progression</button>`
      + (LE.target || LE.host !== 'lsEdit' ? '' : `<button type="button" class="tapbtn" data-le="cap"${ch ? '' : ' disabled'}>Add to captured</button>`)
      + `<button type="button" class="tapbtn" data-le="close">Close</button></div>`;
  }
  /* the editor's live chord diagram: tap the board to place notes, slide it up and down the neck */
  const LE_ROWS = 5;
  function lePlace() {
    const fr = (LE.frets || []).filter((f) => f > 0);
    if (!fr.length) { LE.pos = 1; return; }
    const lo = Math.min.apply(null, fr), hi = Math.max.apply(null, fr);
    if (hi <= LE_ROWS) LE.pos = 1; else LE.pos = Math.max(1, Math.min(MAX_FRET - LE_ROWS + 1, lo));
  }
  // notes (or root/type) changed: show the most playable shape for them
  function leSyncShape() {
    LE.stale = false;
    const r = LE.pcs.length ? leResult() : null;
    const ch = r && lsFresh(r);
    let sh = null;
    if (ch) { try { sh = chordShapes(ch.tones, 4, ch.bass).best; } catch (e) { sh = null; } }
    LE.frets = sh ? sh.frets.slice() : [-1, -1, -1, -1, -1, -1];
    lePlace();
  }
  // the board changed: the notes follow it (one note per string, like a real guitar)
  function leFromFrets() {
    const sounding = [];
    LE.frets.forEach((f, s) => { if (f >= 0) sounding.push((OPEN[s] + f) % 12); });
    const pcs = Array.from(new Set(sounding));
    LE.pcs = pcs;
    if (!pcs.length) return;
    const lowest = sounding[0];
    if (pcs.indexOf(LE.root) < 0) LE.root = lowest;
    LE.bass = -1;
    const r = nameNotes(pcs, LE.root);
    LE.root = r.root;
    if (lowest !== r.root) { LE.bass = lowest; LE.bassAuto = true; }   // a different lowest note makes a slash chord (C/E)
  }
  // where the shape sits: its lowest fret (0 when it uses open strings), and how far it may move
  function leBase() { const fr = (LE.frets || []).filter((f) => f >= 0); return fr.length ? Math.min.apply(null, fr) : -1; }
  function leSpan() { const fr = (LE.frets || []).filter((f) => f >= 0); return fr.length ? Math.max.apply(null, fr) - Math.min.apply(null, fr) : 0; }
  // move the whole shape along the neck (open strings become a barre, like turning an E shape into F)
  function leShift(to, sound) {
    const base = leBase();
    if (base < 0) return false;
    const target = Math.max(0, Math.min(MAX_FRET - leSpan(), to));
    const d = target - base;
    if (!d) return false;
    LE.frets = LE.frets.map((f) => (f < 0 ? -1 : f + d));
    LE.root = (((LE.root + d) % 12) + 12) % 12;
    if (LE.bass >= 0) LE.bass = (((LE.bass + d) % 12) + 12) % 12;
    leFromFrets();
    lePlace();
    if (sound) { const r = leResult(), ch = r && lsFresh(r); if (ch) strumShape({ frets: LE.frets.slice() }, ch.tones); }
    return true;
  }
  function leBoard(ch) {
    const names = S.flats ? FLAT_NAMES : SHARP_NAMES;
    const fr = LE.frets || [-1, -1, -1, -1, -1, -1];
    const X = (s) => 34 + s * 32, top = 46, rowH = 40, W = 34 + 5 * 32 + 26;
    const chordPcs = ch ? ch.tones.map((t) => t.pc) : [];
    const rootPc = ch ? ch.tones[0].pc : -1;
    let g = `<svg viewBox="0 0 ${W} ${top + LE_ROWS * rowH + 12}" class="lesvg" role="group" aria-label="Chord diagram: tap a fret to place a note">`;
    // open / muted markers above the nut
    for (let s = 0; s < 6; s++) {
      const f = fr[s];
      g += `<g class="leopen" data-leopen="${s}"><rect x="${X(s) - 15}" y="2" width="30" height="${top - 8}" fill="transparent"/>`
        + (f === 0 ? `<circle cx="${X(s)}" cy="${top - 18}" r="8" class="lo-open${(OPEN[s] % 12) === rootPc ? ' root' : ''}"/>` : f < 0 ? `<text x="${X(s)}" y="${top - 13}" text-anchor="middle" class="lo-mute">×</text>` : '')
        + (LE.ghost && f !== 0 ? `<text x="${X(s)}" y="${top - 30}" text-anchor="middle" class="lghost">${esc(names[OPEN[s] % 12])}</text>` : '')
        + `</g>`;
    }
    // frets and strings
    for (let k = 0; k <= LE_ROWS; k++) g += `<line x1="${X(0)}" x2="${X(5)}" y1="${top + k * rowH}" y2="${top + k * rowH}" class="${k === 0 && LE.pos === 1 ? 'lnut' : 'lfret'}"/>`;
    for (let s = 0; s < 6; s++) g += `<line x1="${X(s)}" x2="${X(s)}" y1="${top}" y2="${top + LE_ROWS * rowH}" class="lstr"/>`;
    if (LE.pos > 1) g += `<text x="6" y="${top + rowH / 2 + 4}" class="lpos">${LE.pos}fr</text>`;
    // tap targets, faint note names, and the placed notes
    for (let k = 0; k < LE_ROWS; k++) {
      const f = LE.pos + k, y = top + k * rowH + rowH / 2;
      for (let s = 0; s < 6; s++) {
        const pc = (OPEN[s] + f) % 12;
        const on = fr[s] === f;
        g += `<g class="lcell" data-lefret="${s}:${f}"><rect x="${X(s) - 16}" y="${top + k * rowH}" width="32" height="${rowH}" fill="transparent"/>`;
        if (on) g += `<circle cx="${X(s)}" cy="${y}" r="13" class="ldot${pc === rootPc ? ' root' : ''}"/><text x="${X(s)}" y="${y + 4}" text-anchor="middle" class="ldotl">${esc(names[pc])}</text>`;
        else if (LE.ghost) g += `<text x="${X(s)}" y="${y + 4}" text-anchor="middle" class="lghost${chordPcs.indexOf(pc) >= 0 ? ' intone' : ''}">${esc(names[pc])}</text>`;
        g += `</g>`;
      }
    }
    g += `</svg>`;
    const tab = fr.map((f) => (f < 0 ? 'x' : f)).join(' ');
    return `<div class="leboard"><div class="lefretwrap"><div class="lesvgbox">${g}</div>`
      + `<div class="leslide" title="Slide the whole chord up or down the neck"><button type="button" class="ib" data-le="pos:-1" aria-label="Move the chord one fret toward the nut"${leBase() <= 0 ? ' disabled' : ''}>▲</button>`
      + `<input type="range" id="lePos" min="0" max="${MAX_FRET - leSpan()}" value="${Math.max(0, leBase())}" aria-label="Fret the chord starts on"${leBase() < 0 ? ' disabled' : ''}>`
      + `<button type="button" class="ib" data-le="pos:1" aria-label="Move the chord one fret up the neck"${leBase() < 0 || leBase() >= MAX_FRET - leSpan() ? ' disabled' : ''}>▼</button></div></div>`
      + `<div class="leside"><label class="field"><span>Chord starts on</span><select id="leFret"${leBase() < 0 ? ' disabled' : ''}>${Array.from({ length: MAX_FRET - leSpan() + 1 }, (_, f) => `<option value="${f}"${f === leBase() ? ' selected' : ''}>${f === 0 ? 'Open position (fret 0)' : 'Fret ' + f}</option>`).join('')}</select></label><p class="letab">Tab: <b>${esc(tab)}</b></p>`
      + `<label class="check"><input type="checkbox" id="leGhost"${LE.ghost ? ' checked' : ''}> Show note names</label>`
      + `<div class="lsbtns"><button type="button" class="tapbtn lssmall" data-le="shp:-1">◀ Other shape</button><button type="button" class="tapbtn lssmall" data-le="shp:1">Other shape ▶</button><button type="button" class="tapbtn lssmall" data-le="clearb">Clear board</button></div>`
      + `<p class="hint">Tap a fret to put a finger there (one note per string), tap it again to lift it. Tap above the nut for an open string ○ or a muted one ×.</p></div></div>`;
  }
  function leHear(ch) {
    if (LE.open && LE.frets && LE.frets.some((f) => f >= 0)) { strumShape({ frets: LE.frets.slice() }, ch.tones); return; }
    let sh = null;
    try { sh = chordShapes(ch.tones, 4, ch.bass).best; } catch (e) { sh = null; }
    if (sh) { strumShape(sh, ch.tones); return; }
    // no playable shape for these notes: play them stacked from the root
    let prev = 48 + ch.tones[0].pc - 1;
    ch.tones.forEach((t, k) => { let m = prev + 1; while (m % 12 !== t.pc) m++; prev = m; pluck(m, k * STRUM_GAP, 2.0); });
  }
  function leClick(t) {
    const cell = t.closest('[data-lefret]');
    if (cell && LE.open) {
      const [s, f] = cell.dataset.lefret.split(':').map(Number);
      if (!LE.frets) LE.frets = [-1, -1, -1, -1, -1, -1];
      LE.frets[s] = LE.frets[s] === f ? -1 : f;
      if (LE.frets[s] >= 0) pluck(OPEN[s] + f, 0, 1.4);
      leFromFrets();
      renderLsEdit();
      return true;
    }
    const op = t.closest('[data-leopen]');
    if (op && LE.open) {
      const s = +op.dataset.leopen;
      if (!LE.frets) LE.frets = [-1, -1, -1, -1, -1, -1];
      LE.frets[s] = LE.frets[s] === 0 ? -1 : 0;
      if (LE.frets[s] === 0) pluck(OPEN[s], 0, 1.4);
      leFromFrets();
      renderLsEdit();
      return true;
    }
    const qb = t.closest('[data-leq]');
    if (qb) {
      LE.pcs = pickerChord(+qb.dataset.leq, LE.root, S.flats).tones.map((x) => x.pc);
      if (LE.bassAuto) { LE.bass = -1; LE.bassAuto = false; }   // a bass that only came from the old shape goes with it
      LE.stale = true;
      renderLsEdit();
      const r = leResult(), ch = r && lsFresh(r);
      if (ch) leHear(ch);
      return true;
    }
    const b = t.closest('[data-le]');
    if (!b) return false;
    const a = b.dataset.le;
    if (a.indexOf('note:') === 0) {
      const pc = +a.slice(5);
      const at = LE.pcs.indexOf(pc);
      if (at >= 0) LE.pcs.splice(at, 1); else LE.pcs.push(pc);
      if (LE.pcs.indexOf(LE.root) < 0 && LE.pcs.length) LE.root = LE.pcs[0];
      if (at < 0) pluck(60 + ((pc - 0 + 12) % 12), 0, 0.9);
      LE.stale = true;
      renderLsEdit();
      return true;
    }
    if (a === 'close') {
      const wasPw = LE.host === 'pwEdit';
      LE.open = false;
      renderLsEdit();
      if (wasPw) { try { localStorage.setItem('fretboard-pw-closed', '1'); } catch (e) {} }
      else pwDefault();   // the workspace's chord creator comes back after editing a heard chord
      return true;
    }
    if (a.indexOf('pos:') === 0) { if (leShift(leBase() + +a.slice(4), true)) renderLsEdit(); return true; }
    if (a === 'clearb') { LE.frets = [-1, -1, -1, -1, -1, -1]; LE.pcs = []; LE.bass = -1; renderLsEdit(); return true; }
    if (a.indexOf('shp:') === 0) {
      const r0 = LE.pcs.length ? leResult() : null, c0 = r0 && lsFresh(r0);
      if (c0) {
        let list = [];
        try { list = chordShapes(c0.tones, 4, c0.bass).list; } catch (e) { list = []; }
        if (list.length) {
          const cur = LE.frets ? list.findIndex((x) => x.frets.join() === LE.frets.join()) : -1;
          const nx = cur < 0 ? 0 : (cur + +a.slice(4) + list.length) % list.length;
          LE.frets = list[nx].frets.slice();
          lePlace();
          renderLsEdit();
          strumShape({ frets: LE.frets.slice() }, c0.tones);
        }
      }
      return true;
    }
    const r = LE.pcs.length ? leResult() : null;
    const ch = r && lsFresh(r);
    if (!ch) return true;
    if (a === 'hear') leHear(ch);
    else if (a === 'add') addToProg(ch, LE.frets && LE.frets.some((f) => f >= 0) ? { frets: LE.frets.slice() } : null);
    else if (a === 'cap') { if (LS.cap.length < PROG_MAX) { LS.cap.push(chordRef(r)); renderListen(); say('Added ' + ch.name + ' to the captured chords.'); } }
    else if (a === 'apply' && LE.target && LE.target.kind === 'slot') {
      const i = LE.target.i, old = P.slots[i];
      if (old) {
        let sh = null;
        if (LE.frets && LE.frets.some((f) => f >= 0)) sh = { frets: LE.frets.slice() };
        else { try { sh = chordShapes(ch.tones, 4, ch.bass).best; } catch (e) { sh = null; } }
        P.slots[i] = Object.assign({}, old, { name: ch.name, roman: ch.inKey ? ch.roman : '', tones: ch.tones.map((t) => ({ name: t.name, pc: t.pc, label: t.label, semis: t.semis || 0 })), frets: sh ? sh.frets.slice() : null });
        if (Number.isInteger(ch.bass) && ch.bass !== ch.tones[0].pc) P.slots[i].bass = ch.bass; else delete P.slots[i].bass;
        saveProg();
        LE.open = false;
        renderLsEdit();
        renderProg();
        say('Chord ' + (i + 1) + ' is now ' + ch.name + '.');
      }
    }
    else if (a === 'apply' && LE.target) {
      const ref = chordRef(r);
      const T = LE.target;
      if (T.kind === 'cap' && LS.cap[T.i]) LS.cap[T.i] = ref;
      else if (T.kind === 'seg' && LS.track && LS.track.segs[T.i]) { const g = LS.track.segs[T.i]; delete g.sym; delete g.pcs; delete g.custom; Object.assign(g, ref); }
      LS.cur = ref;
      LE.open = false;
      renderLsEdit();
      renderListen();
      lsFollow();
      say('Changed it to ' + ch.name + '.');
    }
    return true;
  }
  // sliding the diagram: redraw just the board so the slider keeps working while you drag it
  function leSlide(v) {
    if (!leShift(+v, false)) return;
    const host = document.querySelector && document.querySelector('#' + LE.host);
    if (!host) return;
    const r = LE.pcs.length ? leResult() : null;
    const ch = r ? lsFresh(r) : null;
    const html = leBoard(ch);
    const box = host.querySelector('.lesvgbox');
    if (box) box.innerHTML = html.slice(html.indexOf('<svg'), html.indexOf('</svg>') + 6);
    const tab = host.querySelector('.letab b');
    if (tab) tab.textContent = LE.frets.map((f) => (f < 0 ? 'x' : f)).join(' ');
    const fs = host.querySelector('#leFret');
    if (fs) fs.value = String(leBase());
    const out = host.querySelector('.leout');
    if (out && ch) out.innerHTML = `<b>${esc(ch.name)}</b> <span>${esc(ch.tones.map((t) => t.name).join(' '))} · ${ch.inKey ? '<b>' + esc(ch.roman) + '</b> in ' + esc(homeName()) : 'not in ' + esc(homeName())}</span>`;
  }
  function leChange(id, v) {
    if (id === 'lePos' || id === 'leFret') { leShift(+v, true); renderLsEdit(); return true; }
    if (id === 'leRoot') {
      const root = +v;
      if (LE.bassAuto) { LE.bass = -1; LE.bassAuto = false; }
      const r = LE.pcs.length ? leResult() : null;
      if (r && !r.custom) { const qi = ARP_ENTRIES.findIndex((e) => e.sym === r.sym); LE.pcs = pickerChord(qi, root, S.flats).tones.map((t) => t.pc); }
      else { const shift = root - LE.root; LE.pcs = LE.pcs.map((p) => (((p + shift) % 12) + 12) % 12); }
      LE.root = root;
    } else if (id === 'leBass') {
      LE.bass = +v;
      LE.bassAuto = false;
    } else if (id === 'leQual' && +v >= 0) {
      LE.pcs = pickerChord(+v, LE.root, S.flats).tones.map((t) => t.pc);
    } else return false;
    LE.stale = true;
    renderLsEdit();
    return true;
  }
  // the chord creator and the pattern editor start open in the workspace (so new visitors find them), until closed
  function pwDefault() {
    let closed = false;
    try { closed = localStorage.getItem('fretboard-pw-closed') === '1'; } catch (e) {}
    if (!closed && !LE.open) leOpen(null, 'pwEdit', true);
  }
  function edDefault() {
    let closed = false;
    try { closed = localStorage.getItem('fretboard-ed-closed') === '1'; } catch (e) {}
    if (!closed && !ED.open) openEditor(P.style, true);
  }
  function lsClick(t) {
    if (leClick(t)) return true;
    if (t.closest('#pwCreate')) { leOpen(null, 'pwEdit'); return true; }
    // remove a wrongly heard chord (from the captured row, or from a clip's chord strip)
    const cd = t.closest('[data-lscapdel]');
    if (cd) {
      const i = +cd.dataset.lscapdel;
      const gone = LS.cap.splice(i, 1)[0];
      if (gone) say('Removed ' + ((lsFresh(gone) || {}).name || 'the chord') + ' from the captured chords.');
      renderListen();
      return true;
    }
    const sd = t.closest('[data-lsegdel]');
    if (sd && LS.track) {
      const i = +sd.dataset.lsegdel;
      const gone = LS.track.segs.splice(i, 1)[0];
      if (LS.sel === i) LS.sel = -1; else if (LS.sel > i) LS.sel--;
      if (gone) say('Removed ' + ((lsFresh(gone) || {}).name || 'the chord') + ' from the chord strip.');
      renderListen();
      return true;
    }
    const b = t.closest('[data-ls]');
    const seg = t.closest('[data-lseg]');
    const cap = t.closest('[data-lscap]');
    if (seg) {
      const i = +seg.dataset.lseg;
      LS.sel = LS.sel === i ? -1 : i;
      const g = LS.track && LS.track.segs[i];
      if (g && LS.sel === i) { LS.focus = { kind: 'seg', i }; lsShowNow(g); }
      else renderListen();
      return true;
    }
    const alt = t.closest('[data-lsalt]');
    if (alt) {
      const a = (LS.alts || [])[+alt.dataset.lsalt];
      if (a) {
        // you said it was this chord: swap it in (and in the captured row, if it was just captured)
        const old = LS.cur, lastCap = LS.cap[LS.cap.length - 1];
        LS.fixes = LS.fixes || {};
        if (LS.heardId) LS.fixes[LS.heardId] = Object.assign(chordRef(a), { heard: LS.heardId });
        if (lastCap && old && refId(lastCap) === refId(old)) LS.cap[LS.cap.length - 1] = chordRef(a);
        LS.alts = old ? [old].concat((LS.alts || []).filter((x) => x !== a)) : LS.alts;
        LS.cur = chordRef(a);
        LS.conf = 1;
        renderListen();
        lsFollow();
        say('Changed it to ' + (lsFresh(a) || {}).name + '.');
        lsSay('Got it: when it hears that sound again it will show ' + (lsFresh(a) || {}).name + '. (Until you reload the page.)');
      }
      return true;
    }
    if (cap) { const c = LS.cap[+cap.dataset.lscap]; if (c) { LS.focus = { kind: 'cap', i: +cap.dataset.lscap }; lsShowNow(c); } return true; }
    if (t.closest('#lsLive')) { if (LS.live) lsStop(); else lsStart(); return true; }
    if (!b) return false;
    const a = b.dataset.ls;
    if (a === 'add' && LS.cur) addToProg(lsFresh(LS.cur));
    else if (a === 'circle') lsToCircle(lsFresh(LS.cur));
    else if (a === 'auto') { LS.auto = !LS.auto; renderListen(); }
    else if (a === 'compare') {
      const ch = lsFresh(LS.cur);
      if (ch) { LS.pauseUntil = Date.now() + 2600; keepListening = true; try { audition(ch); } finally { keepListening = false; } }
    }
    else if (a === 'edit') leOpen(LS.focus && (LS.focus.kind !== 'cur' || LS.cur) ? LS.focus : (LS.cur ? { kind: 'cur' } : null));
    else if (a === 'create') leOpen(null);
    else if (a === 'strum') {
      // go to the pattern editor and start listening to the strumming hand
      if (LS.live) lsStop();
      if (!ED.open) openEditor(null);
      if (LAYOUT === 'tabs' && TAB !== 'progression') setTab('progression');
      focusIn('#txBlock');
      gtrStart();
    }
    else if (a === 'follow') { LS.follow = !LS.follow; renderListen(); lsFollow(); }
    else if (a === 'addcap') lsAddAll(LS.cap.map(lsFresh), false);
    else if (a === 'clearcap') { LS.cap = []; renderListen(); }
    else if (a === 'addall' && LS.track) lsAddAll(LS.track.segs, false);
    else if (a === 'addlen' && LS.track) lsAddAll(LS.track.segs, true);
    else if (a === 'play') lsPlayClip();
    else if (a === 'key' && LS.track && LS.track.key) {
      setHome(LS.track.key.root, LS.track.key.mode);
      renderListen();
      say('Key set to ' + homeName() + '.');
    } else if (a === 'clear') { lsStopClip(); LS.track = null; LS.buf = null; LS.sel = -1; LS.cur = null; lsSay(''); renderListen(); }
    return true;
  }
  function addFromList(key) {
    const parts = String(key).split(':');
    let ch = null;
    if (parts[0] === 'h') ch = hubList[+parts[1]];
    else if (lastVM && lastVM.harm) ch = (S.chordType === 'seventh' ? lastVM.harm.sevenths : lastVM.harm.triads)[+parts[1]];
    if (ch) addToProg(ch);
  }
  function addFromShape(i, src) {
    const s = shapeSource(src);
    if (s.chord && s.list[i]) addToProg(s.chord, s.list[i]);
  }
  function slotAction(a, i) {
    const sl = P.slots[i];
    if (!sl) return;
    if (a === 'hear') { auditionSlot(sl); return; }
    if (a === 'edit') { leOpen({ kind: 'slot', i }, 'pwEdit'); return; }
    if (a === 'del') {
      P.slots.splice(i, 1);
      say('Removed ' + sl.name + '.');
    } else if (a === 'dup') {
      if (P.slots.length >= PROG_MAX) { say('The progression is full (' + PROG_MAX + ' chords).'); return; }
      P.slots.splice(i + 1, 0, JSON.parse(JSON.stringify(sl)));
    } else if (a === 'left') P.slots = moveItem(P.slots, i, i - 1);
    else if (a === 'right') P.slots = moveItem(P.slots, i, i + 1);
    else if (a === 'bminus') sl.beats = Math.max(1, sl.beats - 1);
    else if (a === 'bplus') sl.beats = Math.min(8, sl.beats + 1);
    else if (a === 'fprev' || a === 'fnext') {
      const forms = chordShapes(sl.tones, 4, sl.bass).list;
      if (forms.length < 2) return;
      const cur = sl.frets ? forms.findIndex((f) => f.frets.join(',') === sl.frets.join(',')) : -1;
      const d = a === 'fnext' ? 1 : -1;
      const next = cur < 0 ? (d > 0 ? 0 : forms.length - 1) : (cur + d + forms.length) % forms.length;
      sl.frets = forms[next].frets.slice();
      saveProg();
      renderProg();
      auditionSlot(sl); // hear the new shape right away
      return;
    }
    saveProg();
    renderProg();
  }
  function setBpm(v) {
    P.bpm = Math.max(40, Math.min(220, Math.round(v)));
    saveProg();
    renderProg();
  }

  /* player: schedules a little ahead on the audio clock so the timing stays steady, and a timer lights the chord that is sounding */
  function startProg() {
    if (PL.on || !P.slots.length || busy) return;
    const c = audio();
    if (!c) { say('Sound is not available in this browser.'); return; }
    PL.out = c.createGain();
    PL.out.gain.value = 1;
    PL.out.connect(busNode(c));
    Object.assign(PL, { on: true, idx: 0, next: c.currentTime + 0.1, beat: 0, events: [], steps: [], active: -1, ended: false, endAt: 0 });
    renderRhythm(P.style, -1);
    PL.timer = setInterval(progTick, 30);
    syncTransport();
    progTick();
  }
  function stopProg(natural) {
    if (!PL.on) return;
    clearInterval(PL.timer);
    PL.timer = 0;
    PL.on = false;
    const c = ac;
    if (PL.out && c && !natural) {
      // cut the ringing and anything already queued
      const t = c.currentTime;
      const out = PL.out;
      out.gain.cancelScheduledValues(t);
      out.gain.setTargetAtTime(0.0001, t, 0.025);
      setTimeout(() => { try { out.disconnect(); } catch (e) {} }, 500);
    }
    PL.out = null;
    PL.events = [];
    PL.steps = [];
    PL.active = -1;
    renderRhythm(P.style, -1);
    Array.prototype.forEach.call($('progSlots').querySelectorAll('.slot'), (el) => {
      el.classList.remove('playing');
      const b = el.querySelector('.bar');
      if (b) { b.style.transition = 'none'; b.style.transform = 'scaleX(0)'; }
    });
    if (!busy) clearLit();
    syncTransport();
  }
  function progTick() {
    const c = ac;
    if (!c || !PL.on) return;
    if (!P.slots.length) { stopProg(); return; }
    while (!PL.ended && PL.next < c.currentTime + 0.4) {
      if (PL.idx >= P.slots.length) PL.idx = 0;
      const sl = P.slots[PL.idx];
      const bs = beatSec();
      const style = sl.style || P.style;
      const plan = slotPlan(sl, style, bs, PL.beat);
      plan.notes.forEach((n) => pluckAt(n.midi, PL.next + n.t, n.dur, { vol: n.vol, sustain: true, dest: PL.out, cut: n.cut }));
      (plan.hits || []).forEach((h) => PL.steps.push({ t: PL.next + h.t, pos: h.pos, style }));
      if (P.click) for (let b = 0; b < sl.beats; b++) clickAt(PL.next + b * bs, (PL.beat + b) % 4 === 0);
      PL.events.push({ t: PL.next, idx: PL.idx, dur: plan.dur });
      PL.next += plan.dur;
      PL.beat += sl.beats;
      PL.idx++;
      if (PL.idx >= P.slots.length) {
        if (P.loop) { PL.idx = 0; PL.beat = 0; } else { PL.ended = true; PL.endAt = PL.next; }
      }
    }
    while (PL.events.length && PL.events[0].t <= c.currentTime + 0.01) showActive(PL.events.shift());
    let st = null;
    while (PL.steps.length && PL.steps[0].t <= c.currentTime + 0.01) st = PL.steps.shift();
    if (st) lightStep(st.style, st.pos);
    if (PL.ended && !PL.events.length && c.currentTime >= PL.endAt) stopProg(true);
  }
  function showActive(ev) {
    PL.active = ev.idx;
    const cards = $('progSlots').querySelectorAll('.slot');
    Array.prototype.forEach.call(cards, (el, i) => {
      el.classList.toggle('playing', i === ev.idx);
      const b = i === ev.idx ? null : el.querySelector('.bar');
      if (b) { b.style.transition = 'none'; b.style.transform = 'scaleX(0)'; }
    });
    const card = cards[ev.idx];
    if (card) {
      const bar = card.querySelector('.bar');
      if (bar) {
        bar.style.transition = 'none';
        bar.style.transform = 'scaleX(0)';
        void bar.offsetWidth;
        if (!calmMotion()) bar.style.transition = 'transform ' + ev.dur.toFixed(3) + 's linear';
        bar.style.transform = 'scaleX(1)';
      }
      fxEmit(edgePoints(card).slice(0, 8), { colors: ['--root-dot', '--lit-glow'] });
    }
    const sl = P.slots[ev.idx];
    if (sl) lightSlot(sl, ev.dur);
    syncDock();
  }

  /* chord picker: any root and any chord type, hear it, then hear each shape before adding */
  function renderPickerRoots() {
    const names = S.flats ? FLAT_NAMES : SHARP_NAMES;
    $('pcRoot').innerHTML = options(names.map((n, i) => [i, n]), PK.root);
    const pb = $('pcBass');
    if (pb) pb.innerHTML = options([[-1, 'Root (normal)']].concat(names.map((n, i) => [i, '/' + n])), PK.bass);
    // every chord type as a button, so diminished and the rest are always in sight
    $('pcQual').innerHTML = ARP_ENTRIES.map((e, i) => `<button type="button" class="qbtn" data-pq="${i}" aria-pressed="${i === PK.q}" title="${esc(e.name)}">${esc(QUAL[e.sym].short)}</button>`).join('');
    renderPicker(false);
  }
  function renderPicker(sound) {
    // spelled with the fewest accidentals (F♯m7, not G♭m7), unless the search asked for a spelling
    let ch = pickerChord(PK.q, PK.root, S.flats, PK.forced);
    if (PK.bass >= 0 && PK.bass !== PK.root) ch = withBass(ch, PK.bass);
    const res = chordShapes(ch.tones, 4, ch.bass);
    PK.chord = ch;
    PK.list = res.list;
    qsa($('pcQual'), '[data-pq]').forEach( (b) => b.setAttribute('aria-pressed', String(+b.getAttribute('data-pq') === PK.q)));
    if ($('pcRoot').value !== undefined) $('pcRoot').value = String(PK.root);
    if ($('pcBass') && $('pcBass').value !== undefined) $('pcBass').value = String(PK.bass);
    $('pcTitle').textContent = ch.name + ' (' + ARP_ENTRIES[PK.q].name + (ch.bass !== undefined ? ', ' + ch.bassName + ' in the bass' : '') + ') · ' + (ch.bass !== undefined ? ch.bassName + ' + ' : '') + ch.tones.map((t) => t.name).join(' ');
    $('pcShapes').innerHTML = shapeCards(ch, res.list, 'picker');
    if (sound) strumShape(res.best, ch.tones);
  }
  const qsa = (el, sel) => (el && el.querySelectorAll ? Array.prototype.slice.call(el.querySelectorAll(sel)) : []);
  let searchHits = [];
  function renderSearch(text) {
    searchHits = chordSearch(text, S.flats);
    const box = $('csResults');
    if (!String(text || '').trim()) { box.innerHTML = ''; return; }
    box.innerHTML = searchHits.length
      ? searchHits.map((c, i) => `<button type="button" class="csbtn" data-cs="${i}" title="${esc(ARP_ENTRIES[c.q].name)}"><b>${esc(c.name)}</b><small>${esc(c.tones.map((t) => t.name).join(' '))}</small></button>`).join('')
      : '<p class="cs-none">No chord matches that. Try a name like Cm7, F#dim, Bbmaj7 or G7.</p>';
    // the best match is ready below straight away, without sound
    if (searchHits[0]) pickHit(0, false);
  }
  function pickHit(i, sound) {
    const c = searchHits[i];
    if (!c) return;
    PK.root = c.root;
    PK.q = c.q;
    PK.forced = c.flats;
    PK.bass = Number.isInteger(c.bass) ? c.bass : -1;
    renderPicker(sound);
    qsa($('csResults'), '[data-cs]').forEach( (b) => b.setAttribute('aria-pressed', String(+b.getAttribute('data-cs') === i)));
  }


  /* ---------- My progressions: saved to the viewer's Claude account (private to them), or to this browser ---------- */
  const LIB = { mode: 'loading', db: null, uid: null, who: '', items: [], current: null, armed: null, unsub: null };
  const LIB_KEY = 'fretboard-library';
  const libCol = () => LIB.db.collection('data/users/' + LIB.uid);
  function libSay(msg) { const m = $('libMsg'); if (m) m.textContent = msg; }
  function cleanItem(id, d) {
    if (!d || typeof d !== 'object' || typeof d.name !== 'string') return null;
    const c = cleanProg(d);
    if (!c.slots.length) return null;
    return Object.assign(c, { id: String(id), name: d.name.slice(0, 60), updatedAt: Number(d.updatedAt) || 0 });
  }
  function loadLocal() {
    try {
      const raw = JSON.parse(localStorage.getItem(LIB_KEY) || '[]');
      return Array.isArray(raw) ? raw.map((d) => cleanItem(d && d.id, d)).filter(Boolean) : [];
    } catch (e) { return []; }
  }
  function saveLocal() {
    try { localStorage.setItem(LIB_KEY, JSON.stringify(LIB.items)); return true; } catch (e) { return false; }
  }
  function useBrowser(why) {
    LIB.mode = 'browser';
    LIB.items = loadLocal();
    if (why) libSay(why);
    renderLib();
  }
  /* Accounts on the site's own hosting: Supabase sign-in (an emailed link, or Google), with each person's progressions in a table only they can read.
     Turned on by config.js (supabaseUrl + supabaseAnonKey); inside Claude the Claude account is used instead. */
  const CLOUD = { sb: null, user: null, cfg: null, sent: '', busy: false };
  const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => res(); s.onerror = () => rej(new Error('script'));
      document.head.appendChild(s);
    });
  }
  async function initCloud(cfg) {
    CLOUD.cfg = cfg;
    LIB.mode = 'loading';
    renderLib();
    try {
      if (!window.supabase || !window.supabase.createClient) await loadScript(SUPABASE_JS);
      // PKCE: the sign-in link comes back as ?code=…, which leaves the page's #tab address alone
      CLOUD.sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    } catch (e) {
      useBrowser('Accounts cannot be reached right now, so progressions are saved in this browser only.');
      return;
    }
    CLOUD.sb.auth.onAuthStateChange((ev, session) => { setTimeout(() => cloudSession(session), 0); });
    try {
      const r = await CLOUD.sb.auth.getSession();
      await cloudSession(r && r.data && r.data.session);
    } catch (e) { await cloudSession(null); }
  }
  async function cloudSession(session) {
    const u = session && session.user ? session.user : null;
    if (u && CLOUD.user && CLOUD.user.id === u.id && LIB.mode === 'cloud') return;
    CLOUD.user = u;
    if (!u) {
      LIB.mode = 'signedout';
      LIB.who = '';
      LIB.items = loadLocal();
      renderLib();
      return;
    }
    CLOUD.sent = '';
    LIB.who = u.email || '';
    LIB.mode = 'loading';
    renderLib();
    await cloudFetch();
  }
  async function cloudFetch() {
    try {
      const r = await CLOUD.sb.from('progressions').select('id,name,data,updated_at').order('updated_at', { ascending: false });
      if (r.error) throw r.error;
      LIB.mode = 'cloud';
      LIB.items = (r.data || []).map((row) => cleanItem(row.id, Object.assign({}, row.data, { name: row.name, updatedAt: Date.parse(row.updated_at) || 0 }))).filter(Boolean);
      renderLib();
    } catch (e) {
      LIB.mode = 'signedout';
      LIB.items = loadLocal();
      libSay('Signed in, but your saved progressions could not be loaded' + (e && e.message ? ' (' + e.message + ')' : '') + '. Saving in this browser for now.');
      renderLib();
    }
  }
  const cloudRow = (id, rec) => ({ user_id: CLOUD.user.id, id, name: rec.name, data: rec, updated_at: new Date(rec.updatedAt || Date.now()).toISOString() });
  async function cloudSignIn(kind) {
    if (!CLOUD.sb || CLOUD.busy) return;
    const back = location.origin + location.pathname + '#progression';
    if (kind === 'google') {
      try { await CLOUD.sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: back } }); } catch (e) { libSay('Google sign-in could not start. Try the email link instead.'); }
      return;
    }
    const inp = $('libEmail');
    const email = inp ? String(inp.value || '').trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { libSay('Type your email address first.'); if (inp && inp.focus) inp.focus(); return; }
    CLOUD.busy = true;
    libSay('Sending…');
    try {
      const r = await CLOUD.sb.auth.signInWithOtp({ email, options: { emailRedirectTo: back } });
      if (r && r.error) throw r.error;
      CLOUD.sent = email;
      libSay('');
    } catch (e) {
      libSay('The sign-in email could not be sent' + (e && e.message ? ' (' + e.message + ')' : '') + '. Wait a minute and try again.');
    }
    CLOUD.busy = false;
    renderLib();
  }
  async function cloudSignOut() {
    if (!CLOUD.sb) return;
    try { await CLOUD.sb.auth.signOut(); } catch (e) {}
    await cloudSession(null);
    libSay('Signed out. Your progressions stay safe in your account.');
  }
  // progressions saved in this browser before signing in can be copied into the account
  async function cloudCopyLocal() {
    const local = loadLocal().filter((x) => !LIB.items.some((y) => y.id === x.id));
    if (!local.length) return;
    try {
      const r = await CLOUD.sb.from('progressions').upsert(local.map((it) => cloudRow(it.id, it)), { onConflict: 'user_id,id' });
      if (r && r.error) throw r.error;
      libSay('Copied ' + local.length + ' progression' + (local.length === 1 ? '' : 's') + ' from this browser to your account.');
      await cloudFetch();
    } catch (e) {
      libSay('They could not be copied' + (e && e.message ? ' (' + e.message + ')' : '') + '. Nothing was changed.');
    }
  }
  function renderAcct() {
    const box = $('libAcct');
    if (!box) return;
    box.hidden = !CLOUD.cfg;
    if (!CLOUD.cfg) return;
    if (LIB.mode === 'cloud' && CLOUD.user) {
      const extra = loadLocal().filter((x) => !LIB.items.some((y) => y.id === x.id)).length;
      box.innerHTML = `<div class="acctrow"><span class="acctwho">Signed in as <b>${esc(CLOUD.user.email || 'you')}</b></span><button type="button" class="tapbtn" data-acct="out">Sign out</button></div>`
        + (extra ? `<div class="acctrow"><span>${extra} progression${extra === 1 ? ' is' : 's are'} saved only in this browser.</span><button type="button" class="tapbtn strong" data-acct="copy">Copy to my account</button></div>` : '');
    } else if (CLOUD.sent) {
      box.innerHTML = `<div class="acctrow"><span>Check your email: we sent a sign-in link to <b>${esc(CLOUD.sent)}</b>. Open it on this device to finish signing in.</span><button type="button" class="tapbtn" data-acct="again">Use another email</button></div>`;
    } else if (LIB.mode !== 'loading') {
      box.innerHTML = `<div class="acctrow acctform"><input type="email" id="libEmail" placeholder="you@example.com" aria-label="Email address" autocomplete="email"><button type="button" class="tapbtn strong" data-acct="email">Email me a sign-in link</button>`
        + (CLOUD.cfg.google ? `<button type="button" class="tapbtn" data-acct="google">Sign in with Google</button>` : '') + `</div>`
        + `<p class="hint">Sign in to keep your progressions in your account and open them on any device. No password: we email you a link.</p>`;
      const inp = $('libEmail');
      if (inp && inp.addEventListener) inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); cloudSignIn('email'); } });
    } else box.innerHTML = '';
  }
  function acctClick(t) {
    const b = t.closest('[data-acct]');
    if (!b) return false;
    const a = b.dataset.acct;
    if (a === 'email') cloudSignIn('email');
    else if (a === 'google') cloudSignIn('google');
    else if (a === 'out') cloudSignOut();
    else if (a === 'copy') cloudCopyLocal();
    else if (a === 'again') { CLOUD.sent = ''; renderLib(); }
    return true;
  }
  async function initLib() {
    const cfg = window.FRETBOARD_CONFIG || {};
    const inClaude = !!(window.claude && window.claude.use);
    if (!inClaude && cfg.supabaseUrl && cfg.supabaseAnonKey) { initCloud(cfg); return; }
    let db = null, user = null;
    try {
      if (window.claude && window.claude.use) [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    } catch (e) {}
    let uid = null;
    try { uid = user ? await user.id() : null; } catch (e) {}
    if (!db || !uid) { useBrowser(''); return; }
    LIB.db = db;
    LIB.uid = uid;
    try { LIB.who = (await user.me()).name || ''; } catch (e) {}
    // wait at most 10 s for the first answer, then fall back to this browser
    const timer = setTimeout(() => { if (LIB.mode === 'loading') useBrowser('Your saved progressions could not be loaded right now, so this list uses this browser only.'); }, 10000);
    try {
      LIB.unsub = libCol().onSnapshot((snap) => {
        clearTimeout(timer);
        LIB.mode = 'account';
        LIB.items = snap.docs.map((d) => cleanItem(d.id, d.data())).filter(Boolean);
        renderLib();
      }, () => { clearTimeout(timer); useBrowser('Your account storage is not available here, so progressions are saved in this browser only.'); });
    } catch (e) {
      clearTimeout(timer);
      useBrowser('Your account storage is not available here, so progressions are saved in this browser only.');
    }
  }
  function libSummary(it) {
    const names = it.slots.map((s) => s.name);
    return (names.length > 8 ? names.slice(0, 8).join(' · ') + ' …' : names.join(' · ')) + ' · ' + it.bpm + ' BPM';
  }
  function renderLib() {
    const st = $('libStatus');
    if (!st) return;
    st.textContent = LIB.mode === 'loading' ? 'Loading your saved progressions…'
      : LIB.mode === 'account' ? 'Saved to your Claude account' + (LIB.who ? ' (' + LIB.who + ')' : '') + '. Only you can see them, on any device.'
      : LIB.mode === 'cloud' ? 'Saved to your account. Only you can see them, on any device.'
      : LIB.mode === 'signedout' ? 'Saved in this browser for now. Sign in to keep them in your account.'
      : CLOUD.cfg ? 'Saved in this browser only.' : 'Saved in this browser only. Open this page while signed in to Claude to keep them in your account.';
    st.className = 'libstatus ' + (LIB.mode === 'cloud' ? 'account' : LIB.mode);
    renderAcct();
    const cur = LIB.items.find((x) => x.id === LIB.current);
    if (!cur) LIB.current = null;
    $('libSave').textContent = cur ? 'Save changes' : 'Save';
    $('libSaveNew').hidden = !cur;
    $('libSave').disabled = !P.slots.length || LIB.mode === 'loading';
    $('libSaveNew').disabled = !P.slots.length || LIB.mode === 'loading';
    const items = LIB.items.slice().sort((a, b) => b.updatedAt - a.updatedAt);
    $('secSavedSum').textContent = LIB.mode === 'loading' ? '' : items.length + ' saved' + (LIB.mode === 'account' || LIB.mode === 'cloud' ? ' in your account' : ' in this browser');
    $('myProgList').innerHTML = items.length
      ? items.map((it) => `<li class="libitem${it.id === LIB.current ? ' cur' : ''}"><div class="libinfo"><b>${esc(it.name)}</b><small>${esc(libSummary(it))}</small></div>`
        + `<button type="button" class="tapbtn" data-libload="${esc(it.id)}">${it.id === LIB.current ? 'Reload' : 'Open'}</button>`
        + `<button type="button" class="tapbtn${LIB.armed === it.id ? ' danger' : ''}" data-libdel="${esc(it.id)}">${LIB.armed === it.id ? 'Delete?' : 'Delete'}</button></li>`).join('')
      : (LIB.mode === 'loading' ? '' : '<li class="libempty">No saved progressions yet. Build one below, give it a name and press Save.</li>');
  }
  async function libSave(asNew) {
    if (!P.slots.length) { libSay('Add some chords first.'); return; }
    const typed = $('libName').value.trim();
    const name = (typed || P.slots.map((s) => s.name).join(' – ')).slice(0, 60);
    const id = (!asNew && LIB.current) || 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const rec = { name, slots: JSON.parse(JSON.stringify(P.slots)), bpm: P.bpm, speed: P.speed, style: P.style, loop: P.loop, click: P.click, customs: JSON.parse(JSON.stringify(P.customs)), updatedAt: Date.now() };
    if (LIB.mode === 'cloud') {
      $('libSave').disabled = true;
      try {
        const r = await CLOUD.sb.from('progressions').upsert(cloudRow(id, rec), { onConflict: 'user_id,id' });
        if (r && r.error) throw r.error;
        const it = cleanItem(id, rec);
        if (it) LIB.items = LIB.items.filter((x) => x.id !== id).concat([it]);
        LIB.current = id;
        $('libName').value = name;
        libSay('Saved “' + name + '” to your account.');
      } catch (e) {
        libSay('Could not save to your account' + (e && e.message ? ' (' + e.message + ')' : '') + '. Nothing was changed; try again in a moment.');
      }
      renderLib();
      return;
    }
    if (LIB.mode === 'account') {
      $('libSave').disabled = true;
      try {
        await libCol().doc(id).set(rec);
        // show it right away; the live list confirms it a moment later
        const it = cleanItem(id, rec);
        if (it) LIB.items = LIB.items.filter((x) => x.id !== id).concat([it]);
        LIB.current = id;
        $('libName').value = name;
        libSay('Saved “' + name + '” to your account.');
      } catch (e) {
        libSay('Could not save to your account' + (e && e.code ? ' (' + e.code + ')' : '') + '. Nothing was changed; try again in a moment.');
      }
      renderLib();
      return;
    }
    const it = cleanItem(id, rec);
    LIB.items = LIB.items.filter((x) => x.id !== id).concat([it]);
    if (!saveLocal()) { libSay('This browser would not store it (private window or blocked storage).'); return; }
    LIB.current = id;
    $('libName').value = name;
    libSay('Saved “' + name + '” in this browser.');
    renderLib();
  }
  function libLoad(id) {
    const it = LIB.items.find((x) => x.id === id);
    if (!it) return;
    stopProg();
    // bring along the patterns it uses, keeping the ones already here
    (it.customs || []).forEach((r) => { const at = P.customs.findIndex((x) => x.id === r.id); if (at >= 0) P.customs[at] = r; else if (P.customs.length < 40) P.customs.push(r); });
    syncCustoms();
    P.slots = it.slots.map((s) => JSON.parse(JSON.stringify(s)));
    Object.assign(P, { bpm: it.bpm, speed: it.speed, style: it.style, loop: it.loop, click: it.click });
    LIB.current = id;
    LIB.armed = null;
    $('libName').value = it.name;
    saveProg();
    renderProg();
    renderLib();
    libSay('Opened “' + it.name + '”. Changes are not kept until you press Save changes.');
  }
  async function libDelete(id) {
    const it = LIB.items.find((x) => x.id === id);
    if (!it) return;
    if (LIB.armed !== id) {
      // no pop-up dialogs here, so the button asks a second time
      LIB.armed = id;
      renderLib();
      setTimeout(() => { if (LIB.armed === id) { LIB.armed = null; renderLib(); } }, 3000);
      return;
    }
    LIB.armed = null;
    if (LIB.mode === 'cloud') {
      try {
        const r = await CLOUD.sb.from('progressions').delete().eq('id', id);
        if (r && r.error) throw r.error;
        LIB.items = LIB.items.filter((x) => x.id !== id);
        libSay('Deleted “' + it.name + '”.');
      } catch (e) { libSay('Could not delete it' + (e && e.message ? ' (' + e.message + ')' : '') + '.'); }
    } else if (LIB.mode === 'account') {
      try { await libCol().doc(id).delete(); libSay('Deleted “' + it.name + '”.'); } catch (e) { libSay('Could not delete it' + (e && e.code ? ' (' + e.code + ')' : '') + '.'); }
    } else {
      LIB.items = LIB.items.filter((x) => x.id !== id);
      saveLocal();
      libSay('Deleted “' + it.name + '”.');
    }
    if (LIB.current === id) LIB.current = null;
    renderLib();
  }


  /* ---------- Guide: (i) notes, step-by-step tours, Learning mode, and the effects setting ---------- */
  const INFO = {
    library: { t: 'The library', tour: 'fretboard', b: '<p>Everything you can show on the neck, in groups:</p><ul><li><b>Scales</b>: the set of notes a song is built from. Major sounds bright, minor sounds sad.</li><li><b>Modes</b>: the major scale started from a different note, each with its own mood.</li><li><b>Dominant scales</b>: scales that fit 7th chords such as G7.</li><li><b>Arpeggios</b>: the notes of one chord played one at a time.</li><li><b>Diatonic arpeggios</b>: the chords of a key, as arpeggios.</li><li><b>Drop 2 and Drop 3</b>: jazz-style four-note chord shapes.</li></ul><p>Type in the search box to find one fast.</p>' },
    keyopts: { t: 'Key and display', tour: 'fretboard', b: '<p>The <b>key</b> is the home note. Pick C and the scale starts on C.</p><p><b>Labels</b>: Notes shows letter names. Intervals shows each note’s job: 1 is the root (home), 3 gives major or minor colour, 5 is the strong partner, and so on.</p><p><b>Flats or sharps</b>: the same notes can be named two ways (D♯ = E♭). Keys usually use one or the other.</p><p><b>Pattern</b> shows one hand position at a time, the way guitarists learn scales.</p>' },
    board: { t: 'Reading the fretboard', tour: 'fretboard', b: '<p>The six lines are the strings: low E at the bottom, high e at the top, like looking at your guitar from the front. Each box is a fret, and every fret is one semitone, the smallest step in music.</p><p><b>Amber dots</b> are the root (home note). <b>Blue dots</b> are the other notes. Tap any dot to hear it; press <b>Play</b> to hear the whole pattern while the notes light up.</p><p>At the 12th fret everything repeats an octave higher.</p><p><b>Pick notes</b> turns the neck into a note picker: tap any notes (as many as you like), hear them together, then send them to the <b>chord creator</b> with the exact frets you tapped, or add them straight to your progression. The lowest note you pick becomes the bass, so picking E under C–E–G gives C/E.</p>' },
    shapes: { t: 'Reading chord diagrams', b: '<p>A chord diagram is the neck standing up: strings run top to bottom, low E on the left. Dots show where your fingers go. <b>○</b> means play the string open, <b>×</b> means don’t play it. A bar across several strings is a <b>barre</b>: one finger presses them all. "5fr" means the diagram starts at the 5th fret.</p><p>The numbers under it are <b>tab</b>: the fret on each string, low E to high e.</p>' },
    chordsScale: { t: 'Chords from a scale', b: '<p>Every scale contains chords. Start on any note of the scale, skip one, take the next, skip one, take the next: that stack of notes is a chord.</p><p>The <b>Roman numerals</b> show where each chord sits in the key. Capital (I, IV, V) means major, small (ii, iii, vi) means minor, ° means diminished. Songs talk in numbers so they work in any key: "I–IV–V" is C–F–G in C and G–C–D in G.</p>' + romanLink() },
    circle: { t: 'The circle of fifths', tour: 'keys', b: '<p>The 12 keys arranged like a clock. Each step clockwise goes up five notes (a fifth) and adds one sharp; anticlockwise adds a flat.</p><p>Keys next to each other share six of their seven notes, so they sound related. The inner ring holds the <b>relative minor</b>: A minor uses the same notes as C major.</p><p>The shaded slice around your key holds its most-used chords: I, IV and V on the outside, ii, iii and vi inside. Tap any key to move there and hear its chord.</p>' + romanLink() },
    keychords: { t: 'Chords in a key', tour: 'keys', b: '<p>These seven chords use only the notes of the key, so they always fit together. Most songs use mainly these.</p><p><b>I</b> feels like home. <b>V</b> feels like it wants to go home. <b>IV</b> moves away. <b>vi</b> is the sad cousin of I. <b>ii</b> often leads to V.</p><p>Tap a chord to hear it and see its shapes; press <b>+</b> to add it to your progression.</p>' },
    secondary: { t: 'Secondary dominants', b: '<p>A dominant (V) chord pulls strongly to the chord a fifth below. A <b>secondary dominant</b> borrows that pull to point at another chord in the key: "V/vi" is the V chord of vi. In C, that is E or E7, which leads to Am.</p><p>Use one just before the chord it points to for a strong, surprising pull.</p>' },
    borrowed: { t: 'Borrowed chords', b: '<p>Chords taken from the key with the same tonic but the other mood (C minor inside C major). They add a darker or more dramatic colour. iv (Fm in C) and ♭VII (B♭ in C) are rock and pop favourites.</p>' },
    subs: { t: 'Substitutes', b: '<p>Chords that can stand in for others. The <b>Neapolitan</b> (♭II) and the <b>tritone substitute</b> (♭II7 for V7) are jazz colours; the leading-tone diminished chord (vii°) can replace V.</p>' },
    scales: { t: 'Scales for this key', tour: 'keys', b: '<p>Scales you can improvise or write melodies with over the chords of this key.</p><p>The <b>modes</b> use exactly the same notes, so they all fit; what changes is which note feels like home. <b>Pentatonic</b> scales have five notes and are the easiest to solo with. The <b>blues</b> scale adds the "blue note" for grit.</p>' },
    related: { t: 'Related keys', b: '<p>Keys that are close to this one, so songs often move between them: the <b>dominant</b> (one step clockwise on the circle), the <b>subdominant</b> (one step anticlockwise), and the <b>relative</b> major or minor (same notes, different home).</p>' },
    workspace: { t: 'The progression workspace', tour: 'progression', b: '<p>A <b>chord progression</b> is the order of chords in a song. Build one here: add chords with <b>+</b> anywhere, drag cards to reorder, set how many beats each chord lasts, choose a strumming pattern and press <b>Play</b> to hear it loop.</p><p>Not sure where to start? Pick one of the <b>Common progressions</b>.</p>' },
    next: { t: 'What comes next', tour: 'keys', b: '<p>Chords have jobs. <b>I</b> is home and feels at rest. <b>IV</b> and <b>ii</b> move away. <b>V</b> builds tension that wants to resolve back to I.</p><p>Many strong moves <b>fall a fifth</b>: one step anticlockwise on the circle (vi → ii → V → I). That is why the highlights so often sit right next to the chord you chose.</p><ul><li><b>Strong pull</b>: the move the ear expects, like V → I.</li><li><b>Common</b>: used all the time, like IV → I (the "amen" ending).</li><li><b>Colour</b>: a surprise or a borrowed flavour, like V → vi (the "deceptive" ending) or IV → iv.</li></ul><p>These are guides, not rules. If it sounds good, it is good.</p>' },
    listen: { t: 'Chord listener', b: '<p>Strum a chord on your guitar and the listener names it. The bars show how loudly each of the 12 notes is sounding; the lit ones are the notes of the chord it hears.</p><p>It also tells you the chord\u2019s number in your key (like <b>V</b> in C major), or that it is outside the key. <b>Show on the circle</b> opens it in the Key explorer with its next moves.</p><p><b>Upload a clip</b> reads a whole recording, like the chord track in a DAW or the Moises app, and guesses its key. Tap a chord to hear it, play the clip to follow along, then add the chords to your progression.</p><p>Tips: let each chord ring, keep the phone close, and keep background music and talking down. It knows major, minor, 7, maj7, m7, sus2, sus4 and dim chords.</p><p><b>Live listening</b> needs the microphone, which pages inside the Claude app cannot use. It works once the site is hosted on its own.</p>' + romanLink() },
    analysis: { t: 'Progression analysis', wide: true, b: () => '<p>The site works out which <b>key</b> your chords belong to, then gives each chord its number (I, ii, V…) and its job: <b>Home</b> (I, vi, iii) rests, <b>Away</b> (IV, ii) moves off, <b>Tension</b> (V, vii°) wants to resolve.</p>' + svgJobs() + '<p>It names the <b>kind of progression</b> (a 2–5–1, the pop loop I–V–vi–IV, the Andalusian cadence…), points out <b>cadences</b> (how phrases end) and chords from outside the key, and suggests what could come next and which scales to solo with.</p>' + romanLink() },
    scalelisten: { t: 'Scale listener', b: '<p>Play a scale, a riff or a melody one note at a time. The listener hears each note, keeps count of which of the 12 notes you used, and lists the scales that contain them, best first.</p><p>The same notes can make different scales (C major and A minor share every note). What decides it is the <b>home note</b>, so start and end on the note that sounds like home.</p><p>Tap <b>Show on fretboard</b> to see the scale on the neck. Live listening needs the microphone, which pages inside the Claude app cannot use; upload a clip there instead.</p>' },
    common: { t: 'Common progressions', tour: 'progression', wide: true, b: () => '<p>Chord orders used in thousands of songs, written in Roman numerals so they work in any key. Pick your key and chord type above them, press <b>Hear</b>, then <b>Add</b> them to your chords or <b>Use</b> one to replace your chords.</p><p><b>2–5–1 (ii–V–I)</b> is the most important: in C it is Dm → G → C. The ii chord sets up the V, and V pulls you home to I. In 7th chords (Dm7 → G7 → Cmaj7) it is the sound of jazz.</p>' + svg251() + '<p>Use the style chips to narrow the list. <b>J-pop and anime</b> lean on the <b>Royal road (王道進行, IV–V–iii–vi)</b>, which starts away from home and leans toward the sad vi, and on <b>丸サ (IVmaj7–III7–vi7)</b>, where the borrowed III7 pulls hard into vi. <b>C-pop</b> ballads love <b>4536251</b> and the Canon’s bass walking down. <b>K-pop</b> often lifts into a chorus with ii–iii–IV–V. <b>Gospel</b> turns IV minor (iv) for a sigh before home, and <b>rock</b> borrows ♭VII from Mixolydian.</p>' + romanLink() },
    playback: { t: 'Tempo and playback', b: '<p><b>Tempo</b> is speed in beats per minute (BPM). 60 BPM is one beat a second; most pop songs sit between 80 and 130. <b>Tap</b> the button in time to set it.</p><p><b>Speed</b> plays everything slower or faster while keeping your tempo setting: great for practising at half speed.</p><p><b>Click track</b> adds a metronome tick on each beat; the first beat of each bar is higher.</p>' },
    patterns: { t: 'Strumming and picking patterns', tour: 'patterns', b: '<p>The rhythm your strumming hand plays. Each box is a step in time: <b>1 & 2 &</b> are eighth notes, <b>1 e & a</b> are sixteenths.</p><p><b>↓</b> is a down-strum, <b>↑</b> an up-strum. <b>Faint arrows</b> are ghost (soft) strums. <b>×</b> is a muted strum: rest your fretting hand on the strings so they click instead of ringing. B and b are bass notes; • and 1–3 are single picked strings.</p><p>Make your own with <b>New pattern</b>, the strum pad, or your real guitar: press <b>Listen to my guitar</b> and strum, and the site writes down your pattern and takes your tempo.</p>' },
    find: { t: 'Chord names', b: '<p>How chord names work: the letter is the root. Nothing after it means <b>major</b> (happy). <b>m</b> is minor (sad). <b>7</b> adds a bluesy 7th. <b>maj7</b> is soft and jazzy. <b>m7</b> is mellow minor. <b>dim</b> (°) is tense, <b>aug</b> (+) is dreamy and unstable. <b>sus2</b> and <b>sus4</b> swap the 3rd for a more open sound. <b>m7♭5</b> (ø) is half-diminished, the ii chord of a minor key.</p>' },
    saved: { t: 'Saving progressions', b: '<p>Give your progression a name and press <b>Save</b>. When you are signed in, it goes to your account: only you can see it, and it is there on any device you sign in on. Otherwise it stays in this browser, and you can copy it to your account after signing in.</p><p>Signing in needs no password: type your email and open the link we send you.</p>' },
    details: { t: 'Pattern details', b: '<p>The notes of what is on the neck, with their intervals. The <b>step pattern</b> shows the gaps between scale notes in semitones: the major scale is 2 2 1 2 2 2 1 (whole, whole, half, whole, whole, whole, half).</p>' },
    drop: { t: 'Drop 2 and Drop 3 voicings', b: '<p>Four-note chords spread across the strings the way jazz players use them. Take the chord’s notes stacked closely, then drop the 2nd (or 3rd) highest note down an octave: the shape becomes easy to finger. Choose a string set and an inversion (which note is in the bass).</p>' },
  };
  /* ---------- pictures for the theory notes: they follow the key you have chosen ---------- */
  const homeKeyNames = () => {
    const names = S.flats ? FLAT_NAMES : SHARP_NAMES;
    const T = ((S.hk % 12) + 12) % 12, minor = S.hm === 'minor';
    const pcs = keyScale(T, minor ? 'minor' : 'major');
    const q = minor ? ['m', '°', '', 'm', 'm', '', ''] : ['', 'm', 'm', '', '', 'm', '°'];
    const num = minor ? ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'] : ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
    return { key: names[T] + (minor ? ' minor' : ' major'), minor, chords: pcs.map((pc, k) => ({ name: names[pc] + q[k], q: q[k], num: num[k], step: k + 1, note: names[pc] })) };
  };
  const QFILL = { '': 'var(--root-dot)', m: 'var(--dot)', '°': 'var(--muted)' };
  const QTEXT = { '': 'var(--root-fg)', m: 'var(--dot-fg)', '°': 'var(--panel)' };
  // the scale as a staircase: each step is a note of the key and the chord built on it
  function svgStair() {
    const k = homeKeyNames();
    let g = '';
    k.chords.forEach((c, i) => {
      const x = 4 + i * 47, h = 34 + i * 7, y = 120 - h;
      g += `<text x="${x + 21.5}" y="${y - 8}" text-anchor="middle" style="fill:var(--fg);font:700 15px var(--font-head, sans-serif)">${esc(c.num)}</text>`
        + `<rect x="${x}" y="${y}" width="43" height="${h}" rx="6" style="fill:${QFILL[c.q]}"/>`
        + `<text x="${x + 21.5}" y="${y + 20}" text-anchor="middle" style="fill:${QTEXT[c.q]};font:700 12.5px sans-serif">${esc(c.name)}</text>`
        + `<text x="${x + 21.5}" y="136" text-anchor="middle" style="fill:var(--muted);font:600 11px sans-serif">${c.step}</text>`;
    });
    const lg = [['', 'major: I IV V'], ['m', 'minor: ii iii vi'], ['°', 'diminished: vii°']];
    lg.forEach(([q, l], i) => { g += `<rect x="${4 + i * 112}" y="148" width="11" height="11" rx="2" style="fill:${QFILL[q]}"/><text x="${19 + i * 112}" y="158" style="fill:var(--muted);font:11px sans-serif">${l}</text>`; });
    return `<figure class="ipfig"><svg viewBox="0 0 334 166" role="img" aria-label="The seven chords of ${esc(k.key)} as a staircase">${g}</svg><figcaption>The 7 chords of ${esc(k.key)}. The step number below, the Roman numeral above.</figcaption></figure>`;
  }
  // 2 -> 5 -> 1: away, tension, home, with the tension drawn as a line
  function svg251() {
    const k = homeKeyNames();
    const c = [k.chords[1], k.chords[4], k.chords[0]];
    const five = k.minor ? Object.assign({}, c[1], { name: c[1].note, q: '', num: 'V' }) : c[1];   // minor keys use a major V for a stronger pull
    const nodes = [c[0], five, c[2]];
    const xs = [52, 167, 282], lbl = ['away', 'tension', 'home'], ty = [62, 30, 92];
    let g = `<polyline points="${xs.map((x, i) => x + ',' + ty[i]).join(' ')}" style="fill:none;stroke:var(--accent);stroke-width:2.5;stroke-dasharray:5 4"/>`;
    g += `<text x="6" y="16" style="fill:var(--accent);font:600 10.5px sans-serif">tension</text>`;
    nodes.forEach((n, i) => {
      g += `<circle cx="${xs[i]}" cy="${ty[i]}" r="4.5" style="fill:var(--accent)"/>`
        + `<rect x="${xs[i] - 38}" y="108" width="76" height="40" rx="9" style="fill:${QFILL[n.q]}"/>`
        + `<text x="${xs[i]}" y="127" text-anchor="middle" style="fill:${QTEXT[n.q]};font:700 15px sans-serif">${esc(n.name)}</text>`
        + `<text x="${xs[i]}" y="142" text-anchor="middle" style="fill:${QTEXT[n.q]};font:600 11px sans-serif">${esc(n.num)}</text>`
        + `<text x="${xs[i]}" y="166" text-anchor="middle" style="fill:var(--muted);font:600 11px sans-serif">${['2', '5', '1'][i]} · ${lbl[i]}</text>`;
      if (i < 2) g += `<path d="M${xs[i] + 40} 128 L${xs[i + 1] - 46} 128" style="stroke:var(--fg);stroke-width:2;fill:none" marker-end="url(#ipArr)"/>`;
    });
    return `<figure class="ipfig"><svg viewBox="0 0 334 172" role="img" aria-label="2–5–1 in ${esc(k.key)}: ${nodes.map((n) => n.name).join(', ')}"><defs><marker id="ipArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" style="fill:var(--fg)"/></marker></defs>${g}</svg><figcaption>2–5–1 in ${esc(k.key)}: tension builds on the 5 and is released on the 1.</figcaption></figure>`;
  }
  // the three jobs a chord can have, and the loop most songs travel
  function svgJobs() {
    const k = homeKeyNames();
    const by = (ix) => ix.map((i) => k.chords[i]);
    const zones = [
      { t: 'HOME', s: 'rest, feels finished', x: 167, y: 40, ch: by(k.minor ? [0, 2, 5] : [0, 5, 2]), f: 'var(--root-dot)', fg: 'var(--root-fg)' },
      { t: 'AWAY', s: 'moves off', x: 270, y: 150, ch: by(k.minor ? [3, 1] : [3, 1]), f: 'var(--dot)', fg: 'var(--dot-fg)' },
      { t: 'TENSION', s: 'wants to go home', x: 64, y: 150, ch: by(k.minor ? [4, 6] : [4, 6]), f: 'var(--panel)', fg: 'var(--fg)', line: true },
    ];
    let g = '';
    const arr = (x1, y1, x2, y2, bend) => `<path d="M${x1} ${y1} Q${(x1 + x2) / 2 + bend[0]} ${(y1 + y2) / 2 + bend[1]} ${x2} ${y2}" style="stroke:var(--fg);stroke-width:2;fill:none;opacity:0.75" marker-end="url(#ipArr2)"/>`;
    g += arr(222, 52, 268, 112, [22, -14]) + arr(212, 160, 120, 160, [0, 22]) + arr(60, 112, 110, 52, [-24, -12]);
    zones.forEach((z) => {
      g += `<rect x="${z.x - 60}" y="${z.y - 30}" width="120" height="62" rx="12" style="fill:${z.f}${z.line ? ';stroke:var(--fg);stroke-width:2.5;stroke-dasharray:6 4' : ''}"/>`
        + `<text x="${z.x}" y="${z.y - 12}" text-anchor="middle" style="fill:${z.fg};font:800 12px sans-serif;letter-spacing:0.08em">${z.t}</text>`
        + `<text x="${z.x}" y="${z.y + 7}" text-anchor="middle" style="fill:${z.fg};font:700 13.5px sans-serif">${z.ch.map((c) => esc(c.num)).join('  ')}</text>`
        + `<text x="${z.x}" y="${z.y + 24}" text-anchor="middle" style="fill:${z.fg};font:600 10.5px sans-serif;opacity:0.9">${esc(z.ch.map((c) => c.name).join(' '))}</text>`
        + `<text x="${z.x}" y="${z.y + 46}" text-anchor="middle" style="fill:var(--muted);font:600 10.5px sans-serif">${z.s}</text>`;
    });
    return `<figure class="ipfig"><svg viewBox="0 0 334 206" role="img" aria-label="Home, away and tension chords in ${esc(k.key)}"><defs><marker id="ipArr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" style="fill:var(--fg)"/></marker></defs>${g}</svg><figcaption>Most songs go round this loop: home → away → tension → home.</figcaption></figure>`;
  }
  // the same numbers in two keys: why musicians count instead of naming chords
  function svgTwoKeys() {
    const names = S.flats ? FLAT_NAMES : SHARP_NAMES;
    const rows = [0, 7].map((T) => { const p = keyScale(T, 'major'); return { key: names[T], ch: [[0, ''], [4, ''], [5, 'm'], [3, '']].map(([i, q]) => names[p[i]] + q) }; });
    const nums = ['I', 'V', 'vi', 'IV'];
    let g = '';
    nums.forEach((n, i) => { g += `<text x="${96 + i * 62}" y="14" text-anchor="middle" style="fill:var(--fg);font:700 14px sans-serif">${n}</text>`; });
    rows.forEach((r, j) => {
      const y = 26 + j * 40;
      g += `<text x="4" y="${y + 21}" style="fill:var(--muted);font:600 11px sans-serif">in ${esc(r.key)}</text>`;
      r.ch.forEach((c, i) => { const q = i === 2 ? 'm' : ''; g += `<rect x="${70 + i * 62}" y="${y}" width="52" height="30" rx="7" style="fill:${QFILL[q]}"/><text x="${96 + i * 62}" y="${y + 20}" text-anchor="middle" style="fill:${QTEXT[q]};font:700 13px sans-serif">${esc(c)}</text>`; });
    });
    return `<figure class="ipfig"><svg viewBox="0 0 334 110" role="img" aria-label="I–V–vi–IV in C and in G"><text x="4" y="14" style="fill:var(--muted);font:600 11px sans-serif">numbers</text>${g}</svg><figcaption>Same numbers, different key: the progression sounds the same, just higher or lower.</figcaption></figure>`;
  }
  function romanLink(label) { return `<button type="button" class="ip-link" data-info="roman">${label || 'What do I, IV, V and 2–5–1 mean?'}</button>`; }
  INFO.roman = {
    t: 'Chord numbers: I, IV, V and 2–5–1',
    wide: true,
    b: () => {
      const k = homeKeyNames();
      return `<p>Musicians name chords by <b>number</b> instead of by letter. Number the notes of the key 1 to 7; the chord built on each note gets that number, written as a <b>Roman numeral</b>.</p>`
        + svgStair()
        + `<ul><li><b>UPPERCASE</b> (I, IV, V) = a <b>major</b> chord: bright.</li><li><b>lowercase</b> (ii, iii, vi) = a <b>minor</b> chord: darker.</li><li><b>°</b> (vii°) = <b>diminished</b>: tense and unstable.</li></ul>`
        + `<p><b>Why numbers?</b> They work in every key. Learn a progression once and play it anywhere.</p>`
        + svgTwoKeys()
        + `<p><b>Saying it out loud:</b> "2–5–1" means ii → V → I. "1–4–5" is I → IV → V (three-chord rock). "4536251" and "6451" are just the steps in order.</p>`
        + svg251()
        + `<p><b>Every chord has a job.</b> Home chords feel like rest, away chords move off, tension chords want to go home. That pull is what makes a progression feel like it is going somewhere.</p>`
        + svgJobs()
        + `<p><b>Other signs you will see</b></p><ul>`
        + `<li><b>7</b> adds a fourth note: V7 (${esc(k.chords[4].note)}7) pulls home even harder; <b>maj7</b> sounds soft and dreamy.</li>`
        + `<li><b>♭VII, ♭VI, ♭III</b>: a chord <b>borrowed</b> from the minor key, one fret lower than normal (in C: B♭, A♭, E♭). Rock and film music love them.</li>`
        + `<li><b>III7</b> or <b>VI7</b>: a major chord where a minor one would be; it acts as a "V of" the next chord and pulls into it (the 丸サ / Just the Two of Us move).</li>`
        + `<li><b>ø</b> (half-diminished, m7♭5) is the ii in a minor 2–5–1.</li>`
        + `<li><b>/</b> a slash shows the bass note: I/3 or C/E is C with E in the bass.</li></ul>`
        + `<p>The pictures use your current key, ${esc(k.key)}. Change the key and they change with it.</p>`;
    },
  };
  const TOURS = {
    welcome: [
      { t: 'Welcome!', b: 'This site helps you see music theory on the guitar: scales, chords, keys and progressions, all on a real fretboard you can hear. This tour takes about a minute. You can skip it any time.' },
      { sel: '.tabs', tab: 'fretboard', t: 'Three areas', b: '<b>Fretboard</b> shows scales and arpeggios. <b>Keys and chords</b> shows the circle of fifths and the chords of a key. <b>Progression</b> is where you build and play chord progressions. The Layout switch puts them all on one page.' },
      { sel: '#keys', tab: 'fretboard', t: 'Pick a key', b: 'The key is the home note. Everything on the neck starts from it.' },
      { sel: '.lib', tab: 'fretboard', t: 'Pick what to see', b: 'Scales, modes, arpeggios and chord voicings. The neck shows only the one you choose.' },
      { sel: '#boardPanel', tab: 'fretboard', t: 'The fretboard', b: 'Amber dots are the root, blue dots are the other notes. Tap any dot to hear it, or press <b>Play</b> to hear the whole thing light up.' },
      { sel: '#circle', tab: 'keys', t: 'The circle of fifths', b: 'Tap a key to move there and hear its chord. Neighbours share almost all their notes, so they sound related.' },
      { sel: '#keyInfo', tab: 'keys', t: 'Chords that fit', b: 'Every chord in the key, with a shape to play. Roman numerals (I, ii, V) show its job in the key. Tap to hear, press <b>+</b> to add it to your progression.' },
      { sel: 'details[data-sec="common"]', tab: 'progression', t: 'Start from a classic', b: 'Common progressions like the <b>2–5–1</b>, the pop anthem and the 12-bar blues, ready in your key. Hear them, then add one with a tap.' },
      { sel: 'details[data-sec="chords"]', tab: 'progression', t: 'Your progression', b: 'Your chords in order. Drag to reorder, change the shape or the number of beats, or tap a chord to hear it.' },
      { sel: '#progPlay', tab: 'progression', t: 'Play it', b: 'Plays your progression on a loop. Change the tempo and speed below.' },
      { sel: 'details[data-sec="rhythm"]', tab: 'progression', t: 'Strumming patterns', b: 'Choose how the chords are played: pop, funk, bossa nova, picking and more, or make your own.' },
      { sel: '#guideBtn', t: 'Help is always here', b: 'Open the Guide for tours of each part. Look for the <b>i</b> buttons too: they explain each part and the theory behind it.' },
    ],
    fretboard: [
      { sel: '.lib', tab: 'fretboard', t: 'The library', b: 'Scales are the notes a song uses. Arpeggios are the notes of a single chord. Start with <b>Major (Ionian)</b> or <b>Minor pentatonic</b>.' },
      { sel: '#keys', tab: 'fretboard', t: 'The key', b: 'Choose the home note. Try C, then G: the same pattern moves up the neck.' },
      { sel: '#labelSeg', tab: 'fretboard', t: 'Notes or intervals', b: '<b>Intervals</b> shows each note’s job: 1 is the root, 3 makes it major or minor, 5 is the strong partner. Thinking in intervals is how you play in any key.' },
      { sel: '#pat', tab: 'fretboard', t: 'One position at a time', b: 'Guitarists learn scales as patterns in one hand position. Choose Pattern 1, learn it, then link it to Pattern 2.' },
      { sel: '#boardPanel', tab: 'fretboard', t: 'Play and listen', b: 'Press <b>Play</b> and watch each note light up as it sounds. Tap any dot to hear that note.' },
      { sel: '#chordPanel', tab: 'fretboard', t: 'Chords inside the scale', b: 'Every 7-note scale contains seven chords. Tap one to see where its notes sit inside the scale.' },
    ],
    keys: [
      { sel: '#circle', tab: 'keys', t: 'The circle of fifths', b: 'Clockwise adds a sharp, anticlockwise adds a flat. The inner ring holds each key’s relative minor. The shaded slice holds the key’s main chords.' },
      { sel: '#hmSeg', tab: 'keys', t: 'Major or minor', b: 'Switch the same home note between major (bright) and minor (dark).' },
      { sel: '#keyInfo', tab: 'keys', t: 'Chords in the key', b: 'I, IV and V are the main chords; vi, ii and iii are their minor cousins. Tap a chord and its shapes open right below it.' },
      { sel: '.nextbox', tab: 'keys', t: 'What comes next', b: 'Tap a chord and this shows the chords that usually follow it, from strong pulls to colourful surprises, highlighted on the circle. Tap one to keep going and build a progression step by step.' },
      { sel: '#keyScales', tab: 'keys', t: 'Scales to play over them', b: 'Any of these fits the chords of the key. Pentatonic is the easiest place to start soloing.' },
    ],
    progression: [
      { sel: 'details[data-sec="common"]', tab: 'progression', t: 'Common progressions', b: 'Try the <b>2–5–1</b>: in C it is Dm → G → C. ii sets up V, V pulls home to I. Press Hear, then Use.' },
      { sel: 'details[data-sec="chords"]', tab: 'progression', t: 'Your chords', b: 'Each card is one chord. The arrows change the shape, − and + change how many beats it lasts, and you can drag cards to reorder.' },
      { sel: 'details[data-sec="playback"]', tab: 'progression', t: 'Tempo', b: 'Slow it down to practise (try ½× speed), then bring it back up. The click track keeps you in time.' },
      { sel: 'details[data-sec="rhythm"]', tab: 'progression', t: 'Strumming', b: 'Pick a pattern and watch the strum chart light up as it plays. Strum along on your guitar.' },
      { sel: 'details[data-sec="find"]', tab: 'progression', t: 'Find any chord', b: 'Type a name like Cm7 or F#dim, hear each shape, and add the one you like.' },
      { sel: 'details[data-sec="saved"]', tab: 'progression', t: 'Save it', b: 'Name your progression and save it to come back to later.' },
    ],
    patterns: [
      { sel: '#styleSeg', tab: 'progression', t: 'Pick a pattern', b: 'Tap one to hear a bar of it. Pop and Rock are great first patterns.' },
      { sel: '#rhythmView', tab: 'progression', t: 'Read the strum chart', b: '↓ down, ↑ up, faint arrows are soft ghost strums, × is a muted strum. Count along: 1 & 2 & 3 & 4 &.' },
      { sel: '#rNew', tab: 'progression', t: 'Make your own', b: 'Build a pattern box by box, play it on the strum pad, or load a recording of your own guitar.' },
    ],
  };
  const GUIDE = { learn: false, seen: {}, intro: false, firstVisit: false };
  // first visit: the Guide opens by itself once. Closing it (or starting a tour) means it never opens by itself again.
  try { GUIDE.firstVisit = !localStorage.getItem('fretboard-guide-seen') && !localStorage.getItem('fretboard-tab') && !localStorage.getItem('fretboard-tours'); } catch (e) {}
  const markGuideSeen = () => { GUIDE.intro = false; try { localStorage.setItem('fretboard-guide-seen', '1'); } catch (e) {} };
  try {
    GUIDE.learn = localStorage.getItem('fretboard-learn') === '1';
    GUIDE.seen = JSON.parse(localStorage.getItem('fretboard-tours') || '{}') || {};
  } catch (e) {}
  const saveGuide = () => { try { localStorage.setItem('fretboard-learn', GUIDE.learn ? '1' : '0'); localStorage.setItem('fretboard-tours', JSON.stringify(GUIDE.seen)); } catch (e) {} };
  function syncLearn() {
    if (root && root.classList) root.classList.toggle('learning', GUIDE.learn);
  }
  function renderGuide() {
    const p = $('guidePanel');
    if (!p) return;
    const fxb = (v, l) => `<button type="button" data-fx="${v}" aria-pressed="${FX === v}">${l}</button>`;
    p.innerHTML = `<div class="gp-head"><b>Guide</b><button type="button" class="ib" id="guideClose" aria-label="Close the guide">${ICON.x}</button></div>`
      + (GUIDE.intro ? `<p class="gp-text gp-welcome"><b>Welcome!</b> This guide opens by itself only on your first visit. Close it and it stays closed; the <b>Guide</b> button brings it back whenever you want.</p>` : '')
      + `<p class="gp-text">New to the site or to music theory? Take a short tour, or read <button type="button" class="ip-link inl" data-info="roman">what chord numbers (I, IV, V, 2–5–1) mean</button>. Already know your way around? Just close this.</p>`
      + `<button type="button" class="tapbtn strong gp-main" data-tour="welcome">Take the tour of the site</button>`
      + `<div class="gp-label">Tours of each part</div><div class="gp-tours">`
      + [['fretboard', 'Fretboard and scales'], ['keys', 'Keys and the circle of fifths'], ['progression', 'Building a progression'], ['patterns', 'Strumming patterns']].map(([k, l]) => `<button type="button" class="tapbtn" data-tour="${k}">${l}${GUIDE.seen[k] ? ' <span class="gp-done">✓</span>' : ''}</button>`).join('')
      + `</div>`
      + `<label class="check gp-learn"><input type="checkbox" id="learnToggle"${GUIDE.learn ? ' checked' : ''}> <span><b>Learning mode</b><br><small>Shows a short tour the first time you open each part, and makes the <i>i</i> buttons glow so they are easy to find.</small></span></label>`
      + `<div class="gp-label">Button effects</div><div class="seg">${fxb('subtle', 'Subtle')}${fxb('pixel', 'Pixel sparkles')}${fxb('off', 'Off')}</div>`;
  }
  function openGuide(open) {
    const p = $('guidePanel');
    if (!p) return;
    if (!open && !p.hidden) markGuideSeen();
    p.hidden = !open;
    $('guideBtn').setAttribute('aria-expanded', String(!!open));
    if (open) { closeInfo(); renderGuide(); }
  }

  // (i) notes
  let infoOpen = null, infoAnchor = null;
  function closeInfo() {
    const pop = $('infoPop');
    if (pop) pop.hidden = true;
    infoOpen = null;
  }
  /* ---------- What each scale is: shown by the (i) next to the fretboard title, and next to scales elsewhere ---------- */
  // mood: how it sounds; what: how it is built; use: where you hear it and what to play it over
  const SCALE_INFO = {
    'Major (Ionian)': { mood: 'Bright, happy, settled.', what: 'The scale everything else is measured against: seven notes in the step pattern whole, whole, half, whole, whole, whole, half. Do–re–mi is the major scale. Its other name, <b>Ionian</b>, is its name as the 1st of the seven modes.', use: 'Pop, folk, rock, country, classical, nursery songs. Play it over the major chord on the same root (C major scale over C), or over any chord in that key.' },
    'Natural minor (Aeolian)': { mood: 'Sad, serious, dark.', what: 'The major scale started from its 6th note: A minor uses the same notes as C major, with A as home. Compared with major it lowers the 3rd, 6th and 7th. As a mode it is called <b>Aeolian</b>.', use: 'Rock ballads, metal, pop, film music. Play it over minor chords (A natural minor over Am) and minor-key songs.' },
    'Harmonic minor': { mood: 'Dramatic, exotic, classical.', what: 'Natural minor with the 7th raised a half step. That makes the big jump between ♭6 and 7 (a step and a half) that gives it its Middle-Eastern sound, and it turns the V chord major (E in A minor), so it pulls home strongly.', use: 'Classical, neoclassical metal, flamenco, Middle-Eastern flavours. Great over the V7 chord of a minor key (over E7 when you are in A minor).' },
    'Melodic minor': { mood: 'Smooth, jazzy, bittersweet.', what: 'Natural minor with both the 6th and 7th raised: a minor scale whose top half is major. Jazz players use it going both up and down; in classical music it goes back to natural minor on the way down.', use: 'Jazz over minor chords such as m6 and m(maj7). Its modes give jazz sounds like Lydian dominant and the altered scale.' },
    'Major pentatonic': { mood: 'Open, sunny, can’t-go-wrong.', what: 'Five notes: the major scale without its 4th and 7th, the two notes that clash most easily. With no half steps, every note sounds good over the key’s chords.', use: 'Country, folk, pop, Southern rock, happy blues solos. The easiest scale to improvise with over a major key.' },
    'Minor pentatonic': { mood: 'Bluesy, cool, rock.', what: 'Five notes: the natural minor scale without its 2nd and 6th. It uses the same notes as the major pentatonic three notes higher (A minor pentatonic = C major pentatonic).', use: 'The guitar solo scale: blues, rock, funk, metal. Works over minor chords, and over blues progressions in the same key even when the chords are major.' },
    'Blues': { mood: 'Gritty, soulful, crying.', what: 'Minor pentatonic plus one extra note: the ♭5, the "blue note". Slide through it on the way between 4 and 5 rather than resting on it.', use: 'Blues, rock, jazz. Over a 12-bar blues or any dominant 7th chord on the same root.' },
    'Whole tone': { mood: 'Dreamy, floating, unresolved.', what: 'Six notes, every one a whole step apart. With no half steps there is no clear home note, so it sounds like a dream sequence. There are only two different whole-tone scales.', use: 'Impressionist music (Debussy), film dream scenes, jazz over augmented chords and 7♯5 chords.' },
    'Diminished (whole-half)': { mood: 'Tense, mysterious, symmetrical.', what: 'Eight notes alternating whole step, half step. It repeats every minor 3rd, so it only exists in three versions.', use: 'Jazz and metal over diminished 7th chords (C°7 with C whole-half). Horror and suspense moods.' },
    'Chromatic': { mood: 'Every note there is.', what: 'All twelve notes, each a half step apart. It is not a key: it is the full set of notes music is made from.', use: 'Passing notes that slide between scale notes, finger exercises, and learning where every note sits on the neck.' },
    'Ionian': { mood: 'Bright and happy: the plain major sound.', what: 'Mode 1: the major scale itself, from the 1st note. In C: C D E F G A B.', use: 'Anywhere a major key is home. Over maj7 chords (Cmaj7).' },
    'Dorian': { mood: 'Minor, but cool and hopeful.', what: 'Mode 2: the major scale played from its 2nd note (D to D using C major’s notes). It is natural minor with a raised 6th, which brightens it.', use: 'Funk, jazz, Santana-style rock, Celtic music. Over m7 chords, especially in vamps that stay on one minor chord.' },
    'Phrygian': { mood: 'Dark, Spanish, heavy.', what: 'Mode 3: the major scale from its 3rd note (E to E with C major’s notes). The ♭2 right above home gives it a tense, Spanish sound.', use: 'Flamenco, metal riffs, film tension. Over minor chords where the ♭2 adds menace.' },
    'Lydian': { mood: 'Floating, magical, wonder.', what: 'Mode 4: the major scale from its 4th note (F to F with C major’s notes). The raised 4th (♯4) gives it a dreamy lift.', use: 'Film scores (flying, magic, space), dream pop, jazz. Over maj7 chords, especially maj7♯11.' },
    'Mixolydian': { mood: 'Major and bluesy, laid-back.', what: 'Mode 5: the major scale from its 5th note (G to G with C major’s notes). Major with a ♭7, so it fits dominant 7th chords exactly.', use: 'Rock, blues, funk, Celtic folk, jam bands. Over dominant 7th chords (G7) and I–♭VII rock progressions.' },
    'Aeolian': { mood: 'Sad and serious: the plain minor sound.', what: 'Mode 6: the major scale from its 6th note (A to A with C major’s notes). The same as the natural minor scale.', use: 'Minor-key rock, pop and ballads. Over minor chords, especially i–♭VI–♭VII progressions.' },
    'Locrian': { mood: 'Unstable, dark, unsettled.', what: 'Mode 7: the major scale from its 7th note (B to B with C major’s notes). Its ♭5 makes the home chord diminished, so it never feels at rest.', use: 'Rarely a home key; used in metal and jazz over half-diminished chords (Bm7♭5, the ii of a minor key).' },
    'Dominant (Mixolydian)': { mood: 'Bluesy major.', what: 'The Mixolydian mode used for what it fits best: dominant 7th chords. Major scale with a ♭7.', use: 'Over any 7th chord that is not resolving dramatically: blues, funk, rock vamps.' },
    'Lydian dominant': { mood: 'Bright, quirky, jazzy.', what: 'Mixolydian with a raised 4th (♯4), or Lydian with a ♭7. It is the 4th mode of melodic minor. Also called the "acoustic" or "Simpsons" scale.', use: 'Jazz over 7♯11 chords and over dominant chords that do not resolve down a fifth (like ♭VII7 or a tritone substitute).' },
    'Altered': { mood: 'Maximum tension.', what: 'Every note that can be altered is: ♭9, ♯9, ♭5, ♯5 around the 3rd and ♭7. It is the 7th mode of melodic minor.', use: 'Jazz over the V7 chord right before it resolves (G7alt → C), for the strongest pull home.' },
    'Phrygian dominant': { mood: 'Spanish, Middle-Eastern, intense.', what: 'The 5th mode of harmonic minor: Phrygian with a major 3rd. Its ♭2 and major 3rd make the famous flamenco and klezmer sound.', use: 'Flamenco, metal, Middle-Eastern music. Over the V7 chord of a minor key (E7 in A minor).' },
    'Diminished (half-whole)': { mood: 'Tense, slippery, jazzy.', what: 'Eight notes alternating half step, whole step: the whole-half scale started one note later. It holds ♭9, ♯9, ♯11 and 13 together.', use: 'Jazz over dominant 7♭9 and 13♭9 chords.' },
    'Bebop dominant': { mood: 'Swinging, flowing jazz lines.', what: 'Mixolydian with an extra passing note: the major 7th between ♭7 and the root. With eight notes, chord tones land on the beat when you run it in steady eighth notes.', use: 'Bebop and swing solos over dominant 7th chords.' },
  };
  const KIND_INFO = {
    arp: (e) => `<p>An <b>arpeggio</b> is a chord played one note at a time: here the ${esc(e.name.toLowerCase())}. Instead of strumming, you pick its notes in order, up and down.</p><p>Soloists play arpeggios over the matching chord, because every note is a chord tone and sounds strong. It is also the best way to learn which notes make each chord, all over the neck.</p>`,
    diatonic: (e) => `<p>One of the chords that belong to the key, shown as an arpeggio. <b>${esc(e.name)}</b> tells you which step of the scale it is built on (the Roman numeral) and its type.</p><p>Diatonic chords all use only the notes of one key, so they fit together. Learning them as arpeggios shows you the chord tones to aim for when you solo over each chord.</p>`,
    drop: (e) => `<p>A <b>${esc(e.name)}</b> chord as a drop voicing: the four notes spread across the strings the way jazz guitarists play them, by dropping one note of a close stack down an octave. Pick a string set and an inversion (which note is lowest).</p>`,
  };
  function entryInfo(e) {
    if (!e) return null;
    const f = String(e.f || '').replace(/b/g, '♭').replace(/#/g, '♯');
    if (e.kind === 'scale') {
      const s = SCALE_INFO[e.name];
      if (!s) return { t: e.name, b: `<p>Notes, counted from the root: <b>${esc(f)}</b>.</p>` };
      return { t: e.name, b: `<p class="ip-mood">${s.mood}</p><p>${s.what}</p><p><b>Notes from the root:</b> ${esc(f)}</p><p><b>Where you hear it:</b> ${s.use}</p><p class="ip-tip">Tip: press Play to hear it go up and down, and choose a <b>Pattern</b> to learn one hand position at a time.</p>` };
    }
    const k = KIND_INFO[e.kind];
    return { t: e.name, b: (k ? k(e) : '') + (f ? `<p><b>Notes from the root:</b> ${esc(f)}</p>` : '') };
  }

  function showInfo(key, btn) {
    // "entry" = whatever is on the fretboard now; "scale:<id>" = one library entry
    const it = key === 'entry' ? entryInfo(ENTRIES.find((e) => e.id === S.id)) : key.indexOf('scale:') === 0 ? entryInfo(ENTRIES.find((e) => e.id === key.slice(6))) : INFO[key];
    const pop = $('infoPop');
    if (!it || !pop) return;
    if (infoOpen === key) { closeInfo(); return; }
    infoOpen = key;
    const fromNote = !!(btn && pop.contains && pop.contains(btn));
    const body = typeof it.b === 'function' ? it.b() : it.b;
    pop.innerHTML = `<div class="ip-head"><span class="ip-i">i</span><b>${it.t}</b><button type="button" class="ib" id="infoClose" aria-label="Close">${ICON.x}</button></div><div class="ip-body">${body}</div>`
      + (it.tour ? `<button type="button" class="tapbtn ip-tour" data-tour="${it.tour}">Show me around this part</button>` : '');
    pop.hidden = false;
    if (fromNote) btn = infoAnchor || btn; else infoAnchor = btn;
    const r = btn.getBoundingClientRect();
    const w = Math.min(it.wide ? 440 : 360, window.innerWidth - 24);
    pop.style.width = w + 'px';
    if (window.innerWidth < 600) { pop.classList.add('sheet'); pop.style.left = ''; pop.style.top = ''; return; }
    pop.classList.remove('sheet');
    const left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2));
    pop.style.left = left + 'px';
    const below = r.bottom + 10;
    const h = pop.offsetHeight;
    pop.style.top = (below + h < window.innerHeight - 10 ? below : Math.max(10, r.top - h - 10)) + 'px';
  }

  // step-by-step tour: a spotlight on one part of the page, with a card that explains it
  const TOUR = { name: null, i: 0, raf: 0 };
  function startTour(name) {
    if (!TOURS[name]) return;
    openGuide(false);
    closeInfo();
    TOUR.name = name;
    TOUR.i = 0;
    let lay = $('tourLayer');
    if (!lay) return;
    lay.hidden = false;
    showStep(0, 1);
  }
  function endTour() {
    if (TOUR.name) { GUIDE.seen[TOUR.name] = true; saveGuide(); }
    TOUR.name = null;
    cancelAnimationFrame(TOUR.raf);
    const lay = $('tourLayer');
    if (lay) lay.hidden = true;
  }
  const visibleEl = (sel) => { const el = document.querySelector(sel); if (!el || !el.getBoundingClientRect) return null; const r = el.getBoundingClientRect(); return r.width || r.height ? el : null; };
  function showStep(i, dir) {
    const steps = TOURS[TOUR.name];
    if (!steps) return;
    // skip parts that are not on the page right now (for example the chord list of a 5-note scale)
    while (i >= 0 && i < steps.length) {
      const s = steps[i];
      if (s.tab && LAYOUT === 'tabs' && TAB !== s.tab) setTab(s.tab);
      if (s.sel) { const el = document.querySelector(s.sel); const d = el && el.closest ? el.closest('details') : null; if (d && !d.open) d.open = true; }
      if (!s.sel || visibleEl(s.sel)) break;
      i += dir || 1;
    }
    if (i < 0) i = 0;
    if (i >= steps.length) { endTour(); return; }
    TOUR.i = i;
    const s = steps[i];
    const el = s.sel ? visibleEl(s.sel) : null;
    if (el && el.scrollIntoView) { wantJump = true; el.scrollIntoView({ block: 'center', behavior: calmMotion() ? 'auto' : 'smooth' }); }
    const card = $('tourCard');
    const dots = steps.map((x, k) => `<i class="${k === i ? 'on' : k < i ? 'done' : ''}"></i>`).join('');
    card.innerHTML = `<div class="tc-top"><span class="tc-count">${i + 1} / ${steps.length}</span><span class="tc-dots">${dots}</span></div>`
      + `<h3 id="tourTitle">${s.t}</h3><p>${s.b}</p>`
      + `<div class="tc-acts"><button type="button" class="tc-skip" id="tourSkip">Skip tour</button><span></span>`
      + (i > 0 ? `<button type="button" class="tapbtn" id="tourBack">Back</button>` : '')
      + `<button type="button" class="tapbtn strong" id="tourNext">${i === steps.length - 1 ? 'Finish' : 'Next'}</button></div>`;
    card.classList.remove('enter');
    void card.offsetWidth;
    card.classList.add('enter');
    cancelAnimationFrame(TOUR.raf);
    const follow = () => { placeTour(el); TOUR.raf = requestAnimationFrame(follow); };
    follow();
    const nx = $('tourNext');
    if (nx && nx.focus) nx.focus({ preventScroll: true });
  }
  function placeTour(el) {
    const spot = $('tourSpot'), card = $('tourCard');
    if (!spot || !card) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = Math.min(380, vw - 24);
    card.style.width = w + 'px';
    if (!el) {
      spot.style.cssText = 'left:50%;top:50%;width:0;height:0;';
      card.style.left = (vw - w) / 2 + 'px';
      card.style.top = Math.max(12, (vh - card.offsetHeight) / 2) + 'px';
      return;
    }
    const r = el.getBoundingClientRect();
    const pad = 8;
    const top = Math.max(4, r.top - pad), bottom = Math.min(vh - 4, r.bottom + pad);
    spot.style.cssText = `left:${Math.max(4, r.left - pad)}px;top:${top}px;width:${Math.min(vw - 8, r.width + pad * 2)}px;height:${Math.max(0, bottom - top)}px;`;
    const ch = card.offsetHeight;
    let y;
    if (vw < 600) y = vh - ch - 12;
    else if (bottom + 12 + ch < vh) y = bottom + 12;
    else if (top - 12 - ch > 0) y = top - 12 - ch;
    else y = vh - ch - 12;
    card.style.top = y + 'px';
    card.style.left = Math.max(12, Math.min(vw - w - 12, (vw < 600 ? (vw - w) / 2 : r.left))) + 'px';
  }
  function guideClick(t) {
    if (t.closest('#guideBtn')) { openGuide($('guidePanel').hidden); return true; }
    if (t.closest('#guideClose')) { openGuide(false); return true; }
    const tb = t.closest('[data-tour]');
    if (tb) { startTour(tb.getAttribute('data-tour')); return true; }
    const fxb = t.closest('[data-fx]');
    if (fxb) { FX = fxb.getAttribute('data-fx'); try { localStorage.setItem('fretboard-fx', FX); } catch (e) {} renderGuide(); return true; }
    if (t.closest('#tourNext')) { showStep(TOUR.i + 1, 1); return true; }
    if (t.closest('#tourBack')) { showStep(TOUR.i - 1, -1); return true; }
    if (t.closest('#tourSkip')) { endTour(); return true; }
    if (t.closest('#tourLayer')) return true; // the dimmed page waits while the tour is open
    const ib = t.closest('[data-info]');
    if (ib) { showInfo(ib.getAttribute('data-info'), ib); return true; }
    if (t.closest('#infoClose')) { closeInfo(); return true; }
    if (infoOpen && !t.closest('#infoPop')) closeInfo();
    const gp = $('guidePanel');
    if (gp && !gp.hidden && !t.closest('#guidePanel')) openGuide(false);
    return false;
  }
  // Learning mode: the first visit to each part starts its tour
  function maybeLearnTour(tab) {
    if (!GUIDE.learn || TOUR.name) return;
    const name = !GUIDE.seen.welcome ? 'welcome' : tab;
    if (TOURS[name] && !GUIDE.seen[name]) setTimeout(() => { if (!TOUR.name) startTour(name); }, 400);
  }

  /* ---------- Common progressions ---------- */
  let cpArmed = null, cpPlay = 0;
  let cpGenre = 'all';
  try { cpGenre = localStorage.getItem('fretboard-cp-genre') || 'all'; } catch (e) { /* ignore */ }
  const CP_GENRES = (() => { const seen = []; COMMON_PROGS.forEach((d) => (d.genres || []).forEach((g) => { if (seen.indexOf(g) < 0) seen.push(g); })); const ORDER = ['Pop', 'J-pop', 'Anime', 'C-pop', 'K-pop', 'City pop', 'Ballad', 'R&B / soul', 'Neo-soul', 'Gospel', 'Jazz', 'Bossa nova', 'Rock', 'Folk', 'Country', 'Blues', 'Oldies', 'Classical', 'Film', 'Flamenco']; const at = (g) => (ORDER.indexOf(g) < 0 ? 99 : ORDER.indexOf(g)); return seen.sort((a, b) => at(a) - at(b)); })();
  function renderCommon() {
    const grid = $('cpGrid');
    if (!grid) return;
    const names = S.flats ? FLAT_NAMES : SHARP_NAMES;
    const mode = S.hm === 'minor' ? 'minor' : 'major';
    const seventh = S.chordType === 'seventh';
    const tonic = names[((S.hk % 12) + 12) % 12];
    $('cpRoot').innerHTML = options(names.map((n, i) => [i, n]), ((S.hk % 12) + 12) % 12);
    seg('cpMode', 'hm', [['major', 'Major'], ['minor', 'Minor']], mode);
    seg('cpType', 'ctype', [['triad', 'Triads'], ['seventh', '7th chords']], seventh ? 'seventh' : 'triad');
    $('secCommonSum').textContent = 'in ' + tonic + ' ' + mode;
    if (cpGenre !== 'all' && CP_GENRES.indexOf(cpGenre) < 0) cpGenre = 'all';
    const inMode = COMMON_PROGS.filter((d) => d.mode === mode);
    const count = (g) => inMode.filter((d) => (d.genres || []).indexOf(g) >= 0).length;
    $('cpGenres').innerHTML = [['all', 'All', inMode.length]].concat(CP_GENRES.map((g) => [g, g, count(g)]))
      .map(([v, label, c]) => `<button type="button" class="cpg${c ? '' : ' empty'}" data-cpg="${esc(v)}" aria-pressed="${v === cpGenre}">${esc(label)}<small>${c}</small></button>`).join('');
    const shown = cpGenre === 'all' ? inMode : inMode.filter((d) => (d.genres || []).indexOf(cpGenre) >= 0);
    const other = mode === 'major' ? 'minor' : 'major';
    const otherN = cpGenre === 'all' ? 0 : COMMON_PROGS.filter((d) => d.mode === other && (d.genres || []).indexOf(cpGenre) >= 0).length;
    $('cpNote').innerHTML = cpGenre === 'all' ? '' : (shown.length ? shown.length + ' ' + esc(cpGenre) + ' progression' + (shown.length === 1 ? '' : 's') + ' in ' + mode + '.' : 'No ' + esc(cpGenre) + ' progressions in ' + mode + '.')
      + (otherN ? ` <button type="button" class="linkbtn" data-seg="hm" data-v="${other}">${otherN} more in ${other} →</button>` : '');
    grid.innerHTML = shown.map((d) => {
      const chords = progChords(d, tonic, seventh);
      const armed = cpArmed === d.id;
      return `<div class="cpcard" data-cpcard="${d.id}"><div class="cp-top"><b>${esc(d.name)}</b></div>`
        + `<div class="cp-gen">${(d.genres || []).map((g) => `<span>${esc(g)}</span>`).join('')}</div>`
        + `<div class="cp-roman">${esc(chords.map((c) => c.roman).join(' – '))}</div>`
        + `<div class="cp-chords">${chords.map((c, k) => `<span class="cp-ch" data-cpk="${k}">${esc(c.name)}</span>`).join('')}</div>`
        + `<p class="cp-hint">${esc(d.hint)}</p>`
        + `<div class="cp-acts"><button type="button" class="tapbtn" data-cp="${d.id}" data-cpact="hear">${ICON.speaker} Hear</button>`
        + `<button type="button" class="tapbtn" data-cp="${d.id}" data-cpact="add">${ICON.plus} Add</button>`
        + `<button type="button" class="tapbtn strong${armed ? ' danger' : ''}" data-cp="${d.id}" data-cpact="use">${armed ? 'Replace your ' + P.slots.length + ' chords?' : 'Use this'}</button></div></div>`;
    }).join('');
  }
  function cpChords(id) {
    const d = COMMON_PROGS.find((x) => x.id === id);
    if (!d) return null;
    const names = S.flats ? FLAT_NAMES : SHARP_NAMES;
    return { d, chords: progChords(d, names[((S.hk % 12) + 12) % 12], S.chordType === 'seventh') };
  }
  function cpAction(id, act) {
    const r = cpChords(id);
    if (!r) return;
    if (act === 'hear') {
      // each chord for two beats, its name lighting up as it sounds
      const token = ++cpPlay;
      const gap = Math.max(0.45, beatSec() * 2) * 1000;
      r.chords.forEach((c, k) => setTimeout(() => {
        if (token !== cpPlay) return;
        audition(c);
        qsa(document, '[data-cpcard="' + id + '"] .cp-ch').forEach((el) => el.classList.toggle('on', +el.getAttribute('data-cpk') === k));
      }, k * gap));
      setTimeout(() => { if (token === cpPlay) qsa(document, '.cp-ch.on').forEach((el) => el.classList.remove('on')); }, r.chords.length * gap + 300);
      return;
    }
    if (act === 'use' && P.slots.length && cpArmed !== id) {
      cpArmed = id;
      renderCommon();
      setTimeout(() => { if (cpArmed === id) { cpArmed = null; renderCommon(); } }, 3500);
      return;
    }
    if (act === 'use') { stopProg(); P.slots = []; }
    cpArmed = null;
    const room = PROG_MAX - P.slots.length;
    const take = r.chords.slice(0, Math.max(0, room));
    take.forEach((c) => addToProg(c, null, { quiet: true }));
    renderCommon();
    const msg = take.length < r.chords.length ? 'Added ' + take.length + ' of ' + r.chords.length + ' chords (the progression holds ' + PROG_MAX + ').' : (act === 'use' ? 'Your progression is now ' : 'Added ') + r.d.name + ': ' + take.map((c) => c.name).join(' – ') + '.';
    say(msg);
    flash((act === 'use' ? 'Now: ' : 'Added ') + r.d.name);
  }

  /* ---------- events ---------- */
  // Whatever you press stays where it is on screen, even when lists above it grow or redraw
  let wantJump = false;
  function keepPlace(e) {
    const t = e.target;
    const el = t && t.closest ? t.closest('button, [data-circ]') : null;
    const sel = el ? pressSelector(el) : '';
    const top = el && el.getBoundingClientRect ? el.getBoundingClientRect().top : null;
    wantJump = false;
    handleClick(e);
    if (top === null || wantJump || !sel || !window.scrollBy) return;
    const now = el.isConnected ? el : document.querySelector(sel);
    if (!now || !now.getBoundingClientRect) return;
    const d = now.getBoundingClientRect().top - top;
    if (Math.abs(d) > 1) window.scrollBy(0, d);
  }
  document.addEventListener('click', keepPlace);

  function handleClick(e) {
    const t = e.target;
    if (!t || !t.closest) return;
    if (TOUR.name || t.closest('[data-info]') || t.closest('#guideBtn') || t.closest('#guidePanel') || t.closest('#infoPop') || infoOpen) {
      if (guideClick(t)) { if (t.closest('summary')) e.preventDefault(); return; }
    }
    if (t.closest('#soundOn')) {
      if (keepAlive) { try { keepAlive.pause(); } catch (err) {} }
      mediaSession();
      const c = audio();
      if (c) pluckAt(64, c.currentTime + 0.05, 1.2, { vol: 0.2 });
      setTimeout(soundStatus, 500);
      return;
    }
    const dh = t.closest('[data-dhear]');
    if (dh) { const sl = P.slots[+dh.getAttribute('data-dhear')]; if (sl) auditionSlot(sl); return; }
    if (guideClick(t)) { if (t.closest('summary')) e.preventDefault(); return; }
    if (pkClick(t)) return;
    const cpg = t.closest('[data-cpg]');
    if (cpg) { cpGenre = cpg.getAttribute('data-cpg'); try { localStorage.setItem('fretboard-cp-genre', cpGenre); } catch (e) { /* ignore */ } renderCommon(); return; }
    const cpb = t.closest('[data-cpact]');
    if (cpb) { cpAction(cpb.getAttribute('data-cp'), cpb.getAttribute('data-cpact')); return; }
    const go = t.closest('[data-go]');
    if (go) { setTab(go.getAttribute('data-go')); return; }
    const lay = t.closest('[data-layout]');
    if (lay) {
      setLayout(lay.getAttribute('data-layout'));
      if (LAYOUT === 'tabs') setTab(TAB);
      return;
    }
    const addb = t.closest('[data-add]');
    if (addb) {
      addFromList(addb.dataset.add);
      return;
    }
    const adds = t.closest('[data-addshape]');
    if (adds) {
      addFromShape(+adds.dataset.addshape, adds.dataset.src);
      return;
    }
    if (t.closest('#rvHear')) { previewRhythm(rhythmShown || P.style); return; }
    if (edClick(t)) return;
    if (lsClick(t)) return;
    if (slClick(t)) return;
    if (anaClick(t)) return;
    if (acctClick(t)) return;
    const ll = t.closest('[data-libload]');
    if (ll) { libLoad(ll.dataset.libload); return; }
    const ld = t.closest('[data-libdel]');
    if (ld) { libDelete(ld.dataset.libdel); return; }
    const pq = t.closest('[data-pq]');
    if (pq) {
      PK.q = +pq.dataset.pq;
      PK.forced = undefined;
      renderPicker(true);
      return;
    }
    const cs = t.closest('[data-cs]');
    if (cs) {
      pickHit(+cs.dataset.cs, true);
      return;
    }
    const act = t.closest('[data-act]');
    if (act) {
      slotAction(act.dataset.act, +act.dataset.i);
      return;
    }
    const item = t.closest('.item');
    if (item) {
      S.id = item.dataset.id;
      S.pos = 'all';
      S.pat = 'all';
      S.chord = 'none';
      render();
      renderLibrary();
      return;
    }
    const key = t.closest('.key');
    if (key) {
      S.key = +key.dataset.k;
      S.hk = S.key;
      S.cx = null;
      S.pos = 'all';
      render();
      return;
    }
    const nv = t.closest('[data-nxview]');
    if (nv) {
      S.nxView = nv.dataset.nxview === 'keys' ? 'keys' : 'chords';
      if (S.nxView === 'keys') S.cx = null;
      render();
      return;
    }
    const gk = t.closest('[data-gokey]');
    if (gk) {
      const [pc, m] = gk.dataset.gokey.split(':');
      setHome(+pc, m === 'minor' ? 'minor' : 'major');
      playHome();
      return;
    }
    const hb = t.closest('[data-h]') || t.closest('[data-nh]');
    if (hb) {
      const ch = hubList[+(hb.dataset.h !== undefined ? hb.dataset.h : hb.dataset.nh)];
      if (ch) {
        const on = S.cx && S.cx.name === ch.name && S.cx.roman === ch.roman;
        S.cx = on ? null : { name: ch.name, roman: ch.roman, tones: ch.tones };
        S.nxView = 'chords';
        S.chord = 'none';
        const cur = ENTRIES.find((e) => e.id === S.id);
        if (!on && cur && cur.kind === 'drop') S.id = (S.hm === 'minor' ? byName('Scales', 'Natural minor (Aeolian)') : byName('Scales', 'Major (Ionian)')).id;
        render();
        if (!on) audition(ch); // hear it; its shapes open right under the chord list, so the page stays put
      }
      return;
    }
    const sb = t.closest('[data-sc]');
    if (sb) {
      const sc = hubScales[+sb.dataset.sc];
      if (sc) {
        S.key = sc.pc;
        S.id = sc.id;
        S.pat = 'all';
        S.chord = 'none';
        render();
        showBoard();
      }
      return;
    }
    const rb = t.closest('[data-rk]');
    if (rb) {
      const k = hubKeys[+rb.dataset.rk];
      if (k) setHome(k.pc, k.mode);
      return;
    }
    const cg = t.closest('[data-circ]');
    if (cg) {
      circleGo(cg.dataset.circ);
      return;
    }
    const shb = t.closest('[data-shape]');
    if (shb) {
      playShape(+shb.dataset.shape, shb.dataset.src);
      return;
    }
    const cb = t.closest('.chordbtn');
    if (cb) {
      const turnOn = String(S.chord) !== cb.dataset.c;
      S.chord = turnOn ? cb.dataset.c : 'none';
      S.cx = null;
      render();
      if (turnOn && lastVM && lastVM.chord) audition(lastVM.chord); // hear it before choosing a shape
      return;
    }
    const sg = t.closest('[data-seg]');
    if (sg) {
      if (sg.dataset.seg === 'speed') { P.speed = +sg.dataset.v; saveProg(); renderProg(); return; }
      if (sg.dataset.seg === 'pstyle') { P.style = sg.dataset.v; saveProg(); renderProg(); previewRhythm(P.style); return; }
      if (sg.dataset.seg === 'labels') S.labels = sg.dataset.v;
      else if (sg.dataset.seg === 'hm') { setHome(S.hk, sg.dataset.v); return; }
      else if (sg.dataset.seg === 'ctype') { S.chordType = sg.dataset.v; S.chord = 'none'; S.cx = null; }
      else S.flats = sg.dataset.v === 'flat';
      render();
      return;
    }
    const dot = t.closest('[data-midi]');
    if (dot && NP.on && dot.closest && dot.closest('#neck')) {
      pkToggle(+dot.getAttribute('data-s'), +dot.getAttribute('data-f'), +dot.getAttribute('data-midi'), +attr(dot, 'data-pc'));
      return;
    }
    if (dot) {
      pluck(+dot.getAttribute('data-midi'), 0, 1.4);
      const pc = attr(dot, 'data-pc');
      const note = lastVM && lastVM.pat.notes.find((n) => n.pc === pc);
      if (note) {
        const s = dot.getAttribute('data-s');
        const f = dot.getAttribute('data-f');
        const pick = (el) => (el.getAttribute('data-s') === s && el.getAttribute('data-f') === f ? 'lit' : attr(el, 'data-pc') === pc ? 'echo' : '');
        light(0, 700, pick, note.name, fmtLabel(note.label));
        if (!busy) schedule(() => { if (!busy) $('now').style.visibility = 'hidden'; }, 750);
      }
    }
  }
  $('q').addEventListener('input', (e) => {
    S.q = e.target.value;
    renderLibrary();
  });
  $('from').addEventListener('change', (e) => { S.from = +e.target.value; S.pos = 'all'; render(); });
  $('to').addEventListener('change', (e) => { S.to = +e.target.value; S.pos = 'all'; render(); });
  $('ghost').addEventListener('change', (e) => { S.ghost = e.target.checked; render(); });
  $('pat').addEventListener('change', (e) => { S.pat = e.target.value; render(); });
  $('chordOnly').addEventListener('change', (e) => { S.chordOnly = e.target.checked; render(); });
  $('themeBtn').addEventListener('click', () => setTheme(isDark() ? 'light' : 'dark'));
  try {
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paintThemeBtn);
  } catch (e) {}
  paintThemeBtn();
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const cg = e.target && e.target.closest && e.target.closest('[data-circ]');
    if (cg) {
      e.preventDefault();
      circleGo(cg.dataset.circ);
    }
  });
  $('zoom').addEventListener('change', (e) => { S.zoom = e.target.checked; render(); });
  $('dSet').addEventListener('change', (e) => { S.set = +e.target.value; S.pos = 'all'; render(); });
  $('dInv').addEventListener('change', (e) => { S.inv = +e.target.value; S.pos = 'all'; render(); });
  $('dPos').addEventListener('change', (e) => { S.pos = e.target.value; render(); });
  $('playBtn').addEventListener('click', playCurrent);

  /* progression controls */
  const toggleProg = () => (PL.on ? stopProg() : startProg());
  $('progPlay').addEventListener('click', toggleProg);
  $('dockPlay').addEventListener('click', toggleProg);
  $('dockGo').addEventListener('click', () => {
    if (LAYOUT === 'tabs') setTab('progression');
    const p = $('progPanel');
    if (p && p.scrollIntoView) p.scrollIntoView({ block: 'start', behavior: calmMotion() ? 'auto' : 'smooth' });
  });
  $('bpm').addEventListener('input', (e) => {
    P.bpm = Math.max(40, Math.min(220, +e.target.value || 96));
    saveProg();
    $('bpmOut').textContent = P.bpm + ' BPM';
    const eff = P.bpm * P.speed;
    $('effOut').textContent = P.speed === 1 ? '' : SPEED_LABEL[P.speed] + ' speed = ' + Math.round(eff) + ' BPM';
  });
  $('bpm').addEventListener('change', renderProg);
  $('bpmDown').addEventListener('click', () => setBpm(P.bpm - 1));
  $('bpmUp').addEventListener('click', () => setBpm(P.bpm + 1));
  $('tapBtn').addEventListener('click', () => {
    taps.push(Date.now());
    if (taps.length > 8) taps.shift();
    const v = tempoFromTaps(taps);
    if (v) setBpm(v);
  });
  $('loop').addEventListener('change', (e) => { P.loop = e.target.checked; saveProg(); });
  $('click').addEventListener('change', (e) => { P.click = e.target.checked; saveProg(); });
  $('progClear').addEventListener('click', () => {
    if (!P.slots.length) return;
    if (!clearArmed) {
      // no pop-up dialogs here, so the button asks a second time
      clearArmed = 1;
      renderProg();
      setTimeout(() => { clearArmed = 0; renderProg(); }, 3000);
      return;
    }
    clearArmed = 0;
    stopProg();
    P.slots = [];
    saveProg();
    renderProg();
    say('The progression is empty.');
  });
  $('pcRoot').addEventListener('change', (e) => { PK.root = +e.target.value; PK.forced = undefined; renderPicker(true); });
  if ($('pcBass') && $('pcBass').addEventListener) $('pcBass').addEventListener('change', (e) => { PK.bass = +e.target.value; renderPicker(true); });
  $('chordSearch').addEventListener('input', (e) => renderSearch(e.target.value));
  $('chordSearch').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); pickHit(0, true); }
  });
  $('pcHear').addEventListener('click', () => renderPicker(true));
  $('pcAdd').addEventListener('click', () => { if (PK.chord) addToProg(PK.chord); });

  // drag a chord card onto another to move it (mouse); the arrow buttons do the same by touch or keyboard
  let dragFrom = -1;
  const slotOf = (e) => (e.target && e.target.closest ? e.target.closest('.slot') : null);
  const clearOver = () => Array.prototype.forEach.call($('progSlots').querySelectorAll('.slot'), (el) => el.classList.remove('over', 'drag'));
  document.addEventListener('dragstart', (e) => {
    const s = slotOf(e);
    if (!s) return;
    dragFrom = +s.dataset.slot;
    s.classList.add('drag');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', String(dragFrom)); } catch (err) {}
    }
  });
  document.addEventListener('dragover', (e) => {
    const s = slotOf(e);
    if (!s || dragFrom < 0) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    Array.prototype.forEach.call($('progSlots').querySelectorAll('.slot'), (el) => el.classList.toggle('over', el === s && +s.dataset.slot !== dragFrom));
  });
  document.addEventListener('drop', (e) => {
    const s = slotOf(e);
    if (!s || dragFrom < 0) return;
    e.preventDefault();
    const to = +s.dataset.slot;
    const from = dragFrom;
    dragFrom = -1;
    if (to !== from) {
      P.slots = moveItem(P.slots, from, to);
      saveProg();
      say('Moved chord ' + (from + 1) + ' to position ' + (to + 1) + '.');
    }
    renderProg();
  });
  document.addEventListener('dragend', () => {
    dragFrom = -1;
    clearOver();
  });

  // keep a small player at the bottom of the page while the workspace is out of view
  try {
    if (window.IntersectionObserver && $('progPanel')) {
      new window.IntersectionObserver((en) => {
        progVisible = !!(en[0] && en[0].isIntersecting);
        syncDock();
      }, { threshold: 0.1 }).observe($('progPanel'));
    }
  } catch (e) {}

  document.addEventListener('input', (e) => { if (e.target && e.target.id === 'lePos') leSlide(e.target.value); });
  document.addEventListener('change', (e) => {
    const v = e.target && e.target.getAttribute ? e.target.getAttribute('data-view') : null;
    if (v) { VIEW[v] = !!e.target.checked; saveView(); renderPatterns(); if (!PL.on) renderRhythm(P.style, -1); return; }
    if (e.target && e.target.id === 'edBeats') {
      const nb = +e.target.value;
      if (REC.on) stopRec();
      ED.steps = regridSteps(ED.steps.join(''), ED.grid, ED.beats, ED.grid, nb).split('');
      ED.picks = regridPicks(ED.picks, ED.grid, ED.beats, ED.grid, nb);
      ED.beats = nb;
      renderEditor();
      return;
    }
  });
  document.addEventListener('input', (e) => { if (e.target && e.target.id === 'edName') ED.name = e.target.value; });
  document.addEventListener('change', (e) => {
    const id = e.target && e.target.id;
    if (id === 'recMetro') ED.metro = !!e.target.checked;
    if (id === 'padSlot') { ED.padSlot = +e.target.value || 0; renderEditor(); }
    if (id === 'instSel') {
      INST = INSTS.indexOf(e.target.value) >= 0 ? e.target.value : 'steel';
      try { localStorage.setItem('fretboard-inst', INST); } catch (err) {}
      warmUp();
      const ch = P.slots[0] || C_MAJOR_TRIAD;
      const tries = (n) => { const pk = PACKS[INST]; if (!pk || pk.state !== 'loading' || n > 40) { setTimeout(() => audition(ch), pk && pk.state === 'ready' ? 350 : 0); return; } setTimeout(() => tries(n + 1), 100); };
      tries(0);
    }
    if (id === 'learnToggle') { GUIDE.learn = !!e.target.checked; saveGuide(); syncLearn(); if (GUIDE.learn) maybeLearnTour(TAB); }
    if (id === 'cpRoot') setHome(+e.target.value, S.hm === 'minor' ? 'minor' : 'major');
    if (id === 'txAuto') { ED.txAuto = !!e.target.checked; if (ED.take) applyTake(); }
    if (id === 'txFile' && e.target.files && e.target.files[0]) transcribeFile(e.target.files[0]);
    if (id === 'lsFile' && e.target.files && e.target.files[0]) { lsFile(e.target.files[0]); e.target.value = ''; }
    if (id === 'leRoot' || id === 'leQual' || id === 'leBass' || id === 'lePos' || id === 'leFret') leChange(id, e.target.value);
    if (id === 'leGhost') { LE.ghost = !!e.target.checked; try { localStorage.setItem('fretboard-le-ghost', LE.ghost ? '1' : '0'); } catch (err) {} renderLsEdit(); }
    if (id === 'slFile' && e.target.files && e.target.files[0]) { slFile(e.target.files[0]); e.target.value = ''; }
  });
  if (window.addEventListener) window.addEventListener('resize', () => { if (ED.tx) drawTx(); drawTake(); });
  document.addEventListener('change', (e) => {
    const s = e.target && e.target.closest ? e.target.closest('[data-slotstyle]') : null;
    if (!s) return;
    const sl = P.slots[+s.getAttribute('data-slotstyle')];
    if (!sl) return;
    sl.style = s.value;
    saveProg();
    renderProg();
    if (sl.style) previewRhythm(sl.style);
  });
  $('libSave').addEventListener('click', () => libSave(false));
  $('libSaveNew').addEventListener('click', () => libSave(true));
  $('libName').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); libSave(false); } });

  const C_MAJOR_TRIAD = { name: 'C', tones: [{ name: 'C', pc: 0, label: '1' }, { name: 'E', pc: 4, label: '3' }, { name: 'G', pc: 7, label: '5' }] };
  (function () {
    const sel = $('instSel');
    if (!sel) return;
    sel.innerHTML = Object.keys(SAMPLED).map((k) => `<option value="${k}">${esc(SAMPLED[k])}</option>`).join('') + '<option value="synth">Simple synth (original)</option>';
    sel.value = INST;
  })();
  /* tabs: Fretboard, Keys and chords, Progression, Listen (the link remembers which one: #fretboard, #keys, #progression, #listen) */
  const TABS = ['fretboard', 'keys', 'progression', 'listen'];
  let TAB = 'fretboard';
  let LAYOUT = root && root.classList && root.classList.contains('alltabs') ? 'one' : 'tabs';
  try { const l = localStorage.getItem('fretboard-layout'); if (l === 'one' || l === 'tabs') LAYOUT = l; } catch (e) {}
  // Tabs: one area at a time. One page: everything together; the tab buttons jump to each part.
  function setLayout(l) {
    LAYOUT = l === 'one' ? 'one' : 'tabs';
    const st = $('dockStrip');
    if (st && st.setAttribute) st.setAttribute('data-key', '');
    if (root && root.classList) root.classList.toggle('alltabs', LAYOUT === 'one');
    qsa(document, '[data-layout]').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-layout') === LAYOUT)));
    try { localStorage.setItem('fretboard-layout', LAYOUT); } catch (e) {}
    syncDock();
  }
  const TAB_TARGET = { fretboard: 'boardPanel', keys: 'keyPanel', progression: 'progPanel', listen: 'listenPanel' };
  function setTab(t) {
    if (TABS.indexOf(t) < 0) t = 'fretboard';
    if (LAYOUT === 'one') {
      TAB = t;
      qsa(document, '[data-go]').forEach((b) => b.setAttribute('aria-selected', String(b.getAttribute('data-go') === t)));
      try { localStorage.setItem('fretboard-tab', t); } catch (e) {}
      try { if (location.hash !== '#' + t) history.replaceState(null, '', '#' + t); } catch (e) {}
      const el = $(TAB_TARGET[t]);
      const nav = document.querySelector && document.querySelector('.tabs');
      if (el && el.getBoundingClientRect && window.scrollTo) {
        wantJump = true;
        const off = nav ? nav.getBoundingClientRect().height + 8 : 8;
        window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - off, behavior: calmMotion() ? 'auto' : 'smooth' });
      }
      syncDock();
      return;
    }
    const changed = t !== TAB;
    TAB = t;
    const app = $('app');
    if (app && app.setAttribute) app.setAttribute('data-tab', t);
    qsa(document, '[data-go]').forEach((b) => b.setAttribute('aria-selected', String(b.getAttribute('data-go') === t)));
    try { localStorage.setItem('fretboard-tab', t); } catch (e) {}
    try { if (location.hash !== '#' + t) history.replaceState(null, '', '#' + t); } catch (e) {}
    if (changed) {
      maybeLearnTour(t);
      wantJump = true;
      const nav = document.querySelector && document.querySelector('.tabs');
      if (nav && window.scrollTo && nav.getBoundingClientRect().top < 0) window.scrollTo(0, window.scrollY + nav.getBoundingClientRect().top - 2);
    }
    syncDock();
  }
  if (window.addEventListener) window.addEventListener('hashchange', () => { const h = (location.hash || '').slice(1); if (TABS.indexOf(h) >= 0) setTab(h); });
  // folded sections stay folded next time
  try {
    const open = JSON.parse(localStorage.getItem('fretboard-secs') || '{}');
    qsa(document, 'details[data-sec]').forEach((d) => { if (open[d.getAttribute('data-sec')] === false) d.open = false; });
  } catch (e) {}
  document.addEventListener('toggle', (e) => {
    const d = e.target;
    if (!d || !d.getAttribute || !d.getAttribute('data-sec')) return;
    try {
      const open = JSON.parse(localStorage.getItem('fretboard-secs') || '{}');
      open[d.getAttribute('data-sec')] = d.open;
      localStorage.setItem('fretboard-secs', JSON.stringify(open));
    } catch (err) {}
  }, true);

  renderLibrary();
  render();
  renderProg();
  renderLib();
  initLib();
  try { pwDefault(); edDefault(); } catch (e) {}
  let startTab = 'fretboard';
  try {
    const h = (location.hash || '').slice(1);
    startTab = TABS.indexOf(h) >= 0 ? h : localStorage.getItem('fretboard-tab') || 'fretboard';
  } catch (e) {}
  syncLearn();
  setLayout(LAYOUT);
  if (LAYOUT === 'tabs') setTab(startTab);
  else { TAB = startTab; qsa(document, '[data-go]').forEach((b) => b.setAttribute('aria-selected', String(b.getAttribute('data-go') === TAB))); }
  if (GUIDE.firstVisit) setTimeout(() => { const gp = $('guidePanel'); if (gp && gp.hidden && !TOUR.name) { GUIDE.intro = true; openGuide(true); } }, 700);
})();
