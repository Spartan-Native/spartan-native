// Spartan Native — project site behavior. No dependencies; every block runs only if its markup is on the page.

document.documentElement.classList.remove('no-js');

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ------------------------------------------------------------------ Nav

const nav = $('.nav');
$('.nav-toggle')?.addEventListener('click', () => {
  const open = nav.toggleAttribute('data-open');
  $('.nav-toggle').setAttribute('aria-expanded', String(open));
});

// ------------------------------------------------------------------ Reveal on scroll

const revealer = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealer.unobserve(e.target);
      }
    }
  },
  { rootMargin: '0px 0px -10% 0px' },
);
$$('.reveal, .shot.tilt').forEach((el) => revealer.observe(el));

// Sub nav: highlight the section in view
const subLinks = $$('.subnav a');
if (subLinks.length) {
  const byId = new Map(subLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          subLinks.forEach((a) => a.removeAttribute('data-active'));
          byId.get(e.target.id)?.setAttribute('data-active', '');
        }
      }
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );
  byId.forEach((_, id) => {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  });
}

// ------------------------------------------------------------------ Syntax highlighting

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const KEYWORDS =
  'import|from|export|const|let|var|return|new|interface|type|readonly|extends|await|async|function|if|else|true|false|null|undefined|satisfies|default|of|for|track';

const GRAMMARS = {
  ts: [
    ['c', /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
    ['s', /'[^'\n]*'|"[^"\n]*"|`[^`]*`/y],
    ['k', new RegExp(`\\b(?:${KEYWORDS})\\b`, 'y')],
    ['n', /\b\d[\d.]*\b/y],
    ['f', /\b[A-Za-z_$][\w$]*(?=\s*[(<])/y],
    ['t', /\b[A-Z][\w]*\b/y],
  ],
  scss: [
    ['c', /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
    ['s', /'[^'\n]*'|"[^"\n]*"/y],
    ['k', /@[\w-]+/y],
    ['a', /--[\w-]+/y],
    ['n', /#[0-9a-fA-F]{3,8}\b|\b\d[\d.]*(?:px|rem|%)?/y],
    ['f', /\b[\w-]+(?=\()/y],
  ],
  html: [
    ['c', /<!--[\s\S]*?-->/y],
    ['s', /"[^"]*"/y],
    ['t', /<\/?[\w-]+|\/?>/y],
    ['a', /[\w\-[\]()*.#@]+(?==)/y],
    ['k', /@(?:for|if|else)\b/y],
  ],
  bash: [
    ['c', /#[^\n]*/y],
    ['s', /'[^'\n]*'|"[^"\n]*"/y],
    ['f', /(?<=^|\n|&& )(?:npm|npx|git|node)\b/y],
  ],
};
GRAMMARS.json = GRAMMARS.ts;

function highlight(code, lang) {
  const rules = GRAMMARS[lang];
  if (!rules) return esc(code);
  let out = '';
  let plain = '';
  let i = 0;
  outer: while (i < code.length) {
    for (const [cls, re] of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m && m[0].length) {
        out += esc(plain) + `<span class="tok-${cls}">${esc(m[0])}</span>`;
        plain = '';
        i += m[0].length;
        continue outer;
      }
    }
    plain += code[i++];
  }
  return out + esc(plain);
}

$$('pre code[data-lang]').forEach((el) => {
  el.innerHTML = highlight(el.textContent, el.dataset.lang);
});

// ------------------------------------------------------------------ Copy buttons

const COPY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
const DONE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';

$$('[data-copy]').forEach((btn) => {
  btn.innerHTML = COPY_ICON;
  btn.addEventListener('click', async () => {
    const target = btn.dataset.copy ? document.getElementById(btn.dataset.copy) : null;
    const text = target ? target.textContent : btn.closest('.code')?.querySelector('pre:not([hidden])')?.textContent;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text.trim());
      btn.innerHTML = DONE_ICON;
      btn.setAttribute('data-copied', '');
      setTimeout(() => {
        btn.innerHTML = COPY_ICON;
        btn.removeAttribute('data-copied');
      }, 1600);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  });
});

// ------------------------------------------------------------------ Tabs (code blocks)

$$('[role="tablist"]').forEach((list) => {
  const tabs = $$('[role="tab"]', list);
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      const next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus();
      select(next);
    });
  });
});

// ------------------------------------------------------------------ Colors

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Same rule as the theme: white text on the accent when it reaches 3:1, else near-black. */
const onAccent = (accent) => (contrast('#ffffff', accent) >= 3 ? '#ffffff' : '#111111');

function mix(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return (
    '#' +
    A.map((v, i) =>
      Math.round(v + (B[i] - v) * t)
        .toString(16)
        .padStart(2, '0'),
    ).join('')
  );
}

// The platform neutrals from derivePalette() in @spartan-native/theme.
const NEUTRALS = {
  win: { light: ['#f3f3f3', '#fbfbfb', '#1a1a1a'], dark: ['#202020', '#2b2b2b', '#ffffff'] },
  mac: { light: ['#f2f2f4', '#ffffff', '#1d1d1f'], dark: ['#1e1e21', '#2c2c2f', '#f5f5f7'] },
  gtk: { light: ['#fafafb', '#ffffff', '#2e2e32'], dark: ['#222226', '#36363a', '#ffffff'] },
  qt: { light: ['#eff0f1', '#ffffff', '#232629'], dark: ['#202326', '#141618', '#fcfcfc'] },
  cros: { light: ['#f8f9fc', '#ffffff', '#1f1f1f'], dark: ['#1b1c1f', '#2a2b2f', '#e3e3e8'] },
};
const FAMILY = { win: 'win', w10: 'win', mac: 'mac', macc: 'mac', gtk: 'gtk', qt: 'qt', cros: 'cros' };

// ------------------------------------------------------------------ Live demo: the mock window

const SKINS = {
  win: { label: 'Windows 11', design: 'Fluent · Mica and acrylic', accent: '#0078d4' },
  w10: { label: 'Windows 10', design: 'Flat Fluent · square corners', accent: '#0078d4' },
  mac: { label: 'macOS 26', design: 'Liquid Glass', accent: '#007aff' },
  macc: { label: 'macOS 13–15', design: 'Vibrancy', accent: '#007aff' },
  gtk: { label: 'GNOME', design: 'GTK 4 · Adwaita', accent: '#3584e4' },
  qt: { label: 'KDE Plasma', design: 'Qt 6 · Breeze', accent: '#3daee9' },
  cros: { label: 'ChromeOS', design: 'Material 3 · tonal palette', accent: '#0b57d0' },
};

const demo = $('#demo');
if (demo) {
  const win = $('.mw', demo);
  const frame = $('.stage-frame', demo);
  const caption = $('[data-caption]', demo);
  const autoplayEl = $('.autoplay', demo);
  const state = { skin: 'win', dark: false, accent: null, inactive: false, rt: false };
  const order = Object.keys(SKINS);
  let timer = null;

  const render = () => {
    const skin = SKINS[state.skin];
    const accent = state.accent ?? skin.accent;
    const [bg, surf, fg] = NEUTRALS[FAMILY[state.skin]][state.dark ? 'dark' : 'light'];
    win.dataset.skin = state.skin;
    win.classList.toggle('dark', state.dark);
    win.classList.toggle('inactive', state.inactive);
    win.classList.toggle('rt', state.rt);
    win.style.setProperty('--accent', accent);
    win.style.setProperty('--on-accent', onAccent(accent));
    win.style.setProperty('--bg-n', bg);
    win.style.setProperty('--surf-n', surf);
    win.style.setProperty('--fg-n', fg);
    const wallBase = state.dark ? '#0c0e14' : '#dfe6f2';
    frame.style.setProperty(
      '--wall',
      `radial-gradient(circle at 18% 10%, ${mix(accent, wallBase, 0.35)}, transparent 55%),
       radial-gradient(circle at 85% 90%, ${mix(accent, state.dark ? '#000000' : '#ffffff', 0.55)}, transparent 55%),
       ${wallBase}`,
    );
    caption.innerHTML = `<strong>${skin.label}</strong> · ${skin.design} · ${state.dark ? 'dark' : 'light'} · accent <code>${accent}</code>`;
    $$('[data-skin-btn]', demo).forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.skinBtn === state.skin)),
    );
    $$('[data-accent]', demo).forEach((b) =>
      b.setAttribute('aria-pressed', String((state.accent ?? '') === b.dataset.accent)),
    );
    $$('[data-scheme]', demo).forEach((b) =>
      b.setAttribute('aria-pressed', String((b.dataset.scheme === 'dark') === state.dark)),
    );
  };

  const stop = () => {
    clearInterval(timer);
    timer = null;
    autoplayEl?.setAttribute('data-paused', '');
    if (autoplayEl) $('span:last-child', autoplayEl).textContent = 'Paused — you are in control';
  };

  const start = () => {
    if (reduceMotion) return stop();
    timer = setInterval(() => {
      const i = order.indexOf(state.skin);
      state.skin = order[(i + 1) % order.length];
      if (state.skin === 'win') state.dark = !state.dark;
      render();
    }, 2600);
  };

  demo.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.skinBtn) state.skin = t.dataset.skinBtn;
    else if (t.dataset.scheme) state.dark = t.dataset.scheme === 'dark';
    else if ('accent' in t.dataset) state.accent = t.dataset.accent || null;
    else return;
    stop();
    render();
  });
  $('[data-accent-picker]', demo)?.addEventListener('input', (e) => {
    state.accent = e.target.value;
    stop();
    render();
  });
  $('[data-toggle="inactive"]', demo)?.addEventListener('change', (e) => {
    state.inactive = e.target.checked;
    stop();
    render();
  });
  $('[data-toggle="rt"]', demo)?.addEventListener('change', (e) => {
    state.rt = e.target.checked;
    stop();
    render();
  });

  render();
  // Start cycling once the demo is visible.
  new IntersectionObserver(
    ([e], o) => {
      if (e.isIntersecting) {
        start();
        o.disconnect();
      }
    },
    { threshold: 0.3 },
  ).observe(demo);
}

// ------------------------------------------------------------------ Theme page: palette preview

const pal = $('#palette-demo');
if (pal) {
  const out = $('.palette', pal);
  const state = { accent: '#0078d4', skin: 'win', dark: false };
  const render = () => {
    const [bg, surf, fg] = NEUTRALS[FAMILY[state.skin]][state.dark ? 'dark' : 'light'];
    const a = state.accent;
    const muted = mix(fg, bg, 0.4);
    const tokens = [
      ['primary', a],
      ['primary-fg', onAccent(a)],
      ['bg', bg],
      ['surface', surf],
      ['fg', fg],
      ['muted-fg', muted],
      ['border', mix(fg, bg, 0.86)],
      ['accent-tint', mix(a, surf, 0.84)],
      ['ring', a],
      ['selection', mix(a, surf, 0.7)],
      ['danger', mix('#d13438', a, 0.12)],
      ['success', mix('#0f7b0f', a, 0.12)],
    ];
    out.innerHTML = tokens
      .map(([name, c]) => `<div><i style="--c:${c}"></i><span><b>--sn-color-${name}</b>${c}</span></div>`)
      .join('');
    const ratio = contrast(fg, bg).toFixed(1);
    $('[data-ratio]', pal).textContent =
      `fg on bg ${ratio}:1 · primary-fg on primary ${contrast(onAccent(a), a).toFixed(1)}:1`;
    $$('[data-pal-skin]', pal).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.palSkin === state.skin)));
    $$('[data-pal-scheme]', pal).forEach((b) =>
      b.setAttribute('aria-pressed', String((b.dataset.palScheme === 'dark') === state.dark)),
    );
    $$('[data-pal-accent]', pal).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.palAccent === a)));
  };
  pal.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.palSkin) state.skin = t.dataset.palSkin;
    if (t.dataset.palScheme) state.dark = t.dataset.palScheme === 'dark';
    if (t.dataset.palAccent) state.accent = t.dataset.palAccent;
    render();
  });
  $('input[type="color"]', pal)?.addEventListener('input', (e) => {
    state.accent = e.target.value;
    render();
  });
  render();
}

// ------------------------------------------------------------------ Helm page: selection model

const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
$$('[data-mod]').forEach((el) => (el.textContent = isMac ? '⌘' : 'Ctrl'));

const selDemo = $('#selection-demo');
if (selDemo) {
  const list = $('.sel-list', selDemo);
  const log = $('.sel-log', selDemo);
  const items = $$('.sel-item', list);
  const labels = items.map((el) => el.dataset.label.toLowerCase());
  let selected = new Set();
  let anchor = 0;
  let active = 0;
  let typed = '';
  let typedAt = 0;

  const render = () => {
    items.forEach((el, i) => {
      el.toggleAttribute('data-selected', selected.has(i));
      el.setAttribute('aria-selected', String(selected.has(i)));
      el.toggleAttribute('data-active', i === active);
    });
    list.setAttribute('aria-activedescendant', items[active].id);
    items[active].scrollIntoView({ block: 'nearest' });
    const names = [...selected].sort((a, b) => a - b).map((i) => items[i].dataset.label);
    log.innerHTML = `selection = [${names.map((n) => `'${n}'`).join(', ')}]`;
  };

  const range = (a, b) => {
    const [lo, hi] = a < b ? [a, b] : [b, a];
    return Array.from({ length: hi - lo + 1 }, (_, k) => lo + k);
  };

  const moveTo = (i, e) => {
    i = Math.max(0, Math.min(items.length - 1, i));
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (e.shiftKey) {
      selected = new Set(range(anchor, i));
    } else if (!mod) {
      selected = new Set([i]);
      anchor = i;
    }
    active = i;
    render();
  };

  items.forEach((el, i) =>
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      list.focus();
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (e.shiftKey) {
        const r = range(anchor, i);
        selected = mod ? new Set([...selected, ...r]) : new Set(r);
      } else if (mod) {
        selected.has(i) ? selected.delete(i) : selected.add(i);
        anchor = i;
      } else {
        selected = new Set([i]);
        anchor = i;
      }
      active = i;
      render();
    }),
  );
  items.forEach((el, i) =>
    el.addEventListener('dblclick', () => {
      log.innerHTML = `<b>activated</b> → '${items[i].dataset.label}'`;
    }),
  );

  list.addEventListener('keydown', (e) => {
    const mod = isMac ? e.metaKey : e.ctrlKey;
    const page = 4;
    switch (e.key) {
      case 'ArrowDown':
        return (e.preventDefault(), moveTo(isMac && e.metaKey ? items.length - 1 : active + 1, e));
      case 'ArrowUp':
        return (e.preventDefault(), moveTo(isMac && e.metaKey ? 0 : active - 1, e));
      case 'Home':
        return (e.preventDefault(), moveTo(0, e));
      case 'End':
        return (e.preventDefault(), moveTo(items.length - 1, e));
      case 'PageDown':
        return (e.preventDefault(), moveTo(active + page, e));
      case 'PageUp':
        return (e.preventDefault(), moveTo(active - page, e));
      case ' ':
        e.preventDefault();
        if (mod && selected.has(active)) selected.delete(active);
        else if (mod) selected.add(active);
        else selected = new Set([active]);
        anchor = active;
        return render();
      case 'Escape':
        selected = new Set();
        return render();
      case 'Enter':
        e.preventDefault();
        log.innerHTML = `<b>activated</b> → '${items[active].dataset.label}'`;
        return;
    }
    if (mod && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      selected = new Set(items.map((_, i) => i));
      return render();
    }
    if (e.key.length === 1 && !mod && !e.altKey) {
      const now = Date.now();
      typed = now - typedAt > 700 ? e.key.toLowerCase() : typed + e.key.toLowerCase();
      typedAt = now;
      const repeated = typed.length > 1 && [...typed].every((c) => c === typed[0]);
      const needle = repeated ? typed[0] : typed;
      const start = repeated || typed.length === 1 ? active + 1 : active;
      for (let k = 0; k < items.length; k++) {
        const idx = (start + k) % items.length;
        if (labels[idx].startsWith(needle)) {
          moveTo(idx, { shiftKey: false, metaKey: false, ctrlKey: false });
          break;
        }
      }
    }
  });
  render();
}

// Helm page: default (Enter) and cancel (Esc)
const actDemo = $('#actions-demo');
if (actDemo) {
  const form = $('form', actDemo);
  const out = $('.sel-log', actDemo);
  const def = $('.def', actDemo);
  const cancel = $('[data-cancel]', actDemo);
  const press = (btn, what) => {
    btn.classList.remove('flash');
    void btn.offsetWidth;
    btn.classList.add('flash');
    out.innerHTML = what;
  };
  form.addEventListener('submit', (e) => e.preventDefault());
  def.addEventListener('click', () => press(def, '<b>Save</b> pressed'));
  cancel.addEventListener('click', () => press(cancel, '<b>Cancel</b> pressed'));
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      press(cancel, '<b>Esc</b> → Cancel pressed');
    } else if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
      e.preventDefault();
      press(def, '<b>Enter</b> → Save pressed');
    } else if (e.key === 'Enter' && e.target.tagName === 'TEXTAREA') {
      out.innerHTML = 'Enter in multi-line text adds a new line; the default button is left alone';
    }
  });
}

// ------------------------------------------------------------------ Desktop UI page: shortcut formatter

const sc = $('#shortcut-demo');
if (sc) {
  const out = $('.out', sc);
  const MAC = { mod: '⌘', shift: '⇧', alt: '⌥', ctrl: '⌃', del: '⌫', enter: '↩' };
  const OTHER = { mod: 'Ctrl', shift: 'Shift', alt: 'Alt', ctrl: 'Ctrl', del: 'Del', enter: 'Enter' };
  const MAC_ORDER = ['ctrl', 'alt', 'shift', 'mod'];
  const state = { family: isMac ? 'macos' : 'windows', combo: 'mod+shift+s' };
  const format = (combo, family) => {
    const parts = combo.split('+');
    const key = parts.pop();
    const map = family === 'macos' ? MAC : OTHER;
    const keyLabel = map[key] ?? key.toUpperCase();
    if (family === 'macos') {
      const mods = MAC_ORDER.filter((m) => parts.includes(m)).map((m) => map[m]);
      return mods.join('') + keyLabel;
    }
    return [...parts.map((m) => map[m]), keyLabel].join('+');
  };
  const render = () => {
    out.textContent = format(state.combo, state.family);
    $$('[data-family]', sc).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.family === state.family)));
    $$('[data-combo]', sc).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.combo === state.combo)));
    $('[data-attr]', sc).textContent = state.combo;
  };
  sc.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.family) state.family = t.dataset.family;
    if (t.dataset.combo) state.combo = t.dataset.combo;
    render();
  });
  render();
}

// ------------------------------------------------------------------ Footer year

$$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
