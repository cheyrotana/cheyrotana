// Usage: node scripts/generate-svgs.js assets
// Generates the Persona-themed profile SVGs (day/night banners, footer, section signs, journey line),
// matching the Persona theme of the portfolio (cheyrotana/Portfolio). Edit the text or colours
// below, re-run, then commit the changed files in assets/.
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2] || 'assets';
fs.mkdirSync(path.join(OUT, 'stops'), { recursive: true });

// Portfolio Persona palette
const RED = '#e60012', BLACK = '#0b0b0b', WHITE = '#ffffff', MUTED = '#d9d2d2', WARM = '#fff3c4';
const F = {
  anton: "Anton, Impact, 'Arial Narrow Bold', sans-serif",
  archivo: "'Archivo Black', 'Arial Black', sans-serif",
  playfair: "'Playfair Display', Georgia, 'Times New Roman', serif",
  bebas: "'Bebas Neue', Impact, sans-serif",
  abril: "'Abril Fatface', Georgia, serif",
  alfa: "'Alfa Slab One', Rockwell, 'Courier New', serif",
  body: "Inter, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  mono: "'JetBrains Mono', Consolas, Menlo, monospace",
};
const r1 = n => Math.round(n * 10) / 10;
const esc = s => s.replace(/&/g, '&amp;');
const hash = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

// ---------- shared pieces ----------
const STAR = 'M10 0L12.2 7.8L20 10L12.2 12.2L10 20L7.8 12.2L0 10L7.8 7.8Z';
const star = (x, y, size, fill, inner = '') =>
  `<path d="${STAR}" transform="translate(${r1(x - size / 2)} ${r1(y - size / 2)}) scale(${r1(size / 20 * 100) / 100})" fill="${fill}"${inner ? `>${inner}</path>` : '/>'}`;

const BURST = Array.from({ length: 32 }, (_, i) => {
  const a = (i / 32) * Math.PI * 2;
  const r = i % 2 === 0 ? 50 : 33 + ((i * 37) % 10) * 0.9;
  return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
}).join(' ');

// Ransom-note tiles, same pattern as the portfolio's <Ransom> component
const TILTS = [-7, 4, -3, 6, -5, 2, 8, -2];
const VARIANTS = [
  [WHITE, BLACK, false], [BLACK, WHITE, true], [RED, WHITE, false],
  [WHITE, RED, false], [BLACK, RED, true], [RED, BLACK, false],
];
const FONTS = [
  [F.anton, 400, 1, 0.5], [F.archivo, 900, 0.86, 0.72], [F.playfair, 900, 1, 0.7],
  [F.bebas, 400, 1.08, 0.46], [F.abril, 400, 1, 0.68], [F.alfa, 400, 0.9, 0.72],
];
function ransomWord(word, x0, yMid, size, seed, startIdx, beginAt) {
  let s = '', x = x0, i = startIdx;
  for (const ch of word) {
    const [bg, fg, outline] = VARIANTS[(i * 5 + seed * 2) % 6];
    const [font, weight, fScale, wFactor] = FONTS[(i * 4 + seed) % 6];
    const sc = 0.86 + ((i * 7 + seed * 3) % 5) * 0.06;
    const fs_ = size * sc * fScale;
    const cf = 'MWHNOACQDGRUV'.includes(ch) ? 1.18 : 'IJ'.includes(ch) ? 0.6 : 1;
    const w = Math.max(fs_ * wFactor * cf + size * 0.26, size * 0.62), h = size * sc * 1.12;
    const dy = ((i * 13 + seed * 7) % 4) * 0.035 * size;
    const tilt = TILTS[(i + seed) % TILTS.length];
    const cx = x + w / 2, cy = yMid + dy;
    const t = r1((beginAt + i * 0.07) * 100) / 100;
    s += `  <g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${tilt})"><g opacity="0">`
      + `<rect x="${r1(-w / 2 + 5)}" y="${r1(-h / 2 + 6)}" width="${r1(w)}" height="${r1(h)}" fill="${BLACK}"/>`
      + `<rect x="${r1(-w / 2)}" y="${r1(-h / 2)}" width="${r1(w)}" height="${r1(h)}" fill="${bg}" stroke="${BLACK}" stroke-width="2"/>`
      + (outline ? `<rect x="${r1(-w / 2 + size * 0.06)}" y="${r1(-h / 2 + size * 0.06)}" width="${r1(w - size * 0.12)}" height="${r1(h - size * 0.12)}" fill="none" stroke="${WHITE}" stroke-width="${r1(size * 0.045)}"/>` : '')
      + `<text x="0" y="${r1(fs_ * 0.36)}" text-anchor="middle" font-family="${font}" font-weight="${weight}" font-size="${r1(fs_)}" fill="${fg}">${esc(ch)}</text>`
      + `<animate attributeName="opacity" from="0" to="1" begin="${t}s" dur="0.01s" fill="freeze"/>`
      + `<animateTransform attributeName="transform" type="scale" values="1.9;0.92;1" keyTimes="0;.7;1" begin="${t}s" dur="0.22s" fill="freeze"/>`
      + `</g></g>\n`;
    x += w + size * 0.05;
    i++;
  }
  return { svg: s, end: x, next: i };
}

// Phnom Penh skyline from the portfolio (Wat Phnom, Independence Monument, Royal Palace, Vattanac)
// win: how lit the windows are for the time of day (see PHASES below)
function skyline(win = { lit: 0.55, accent: 0.93, off: '#1e1e1e', glass: null }) {
  const W = 1440, G = 170;
  const BLOCKS = [
    [0, 46, 62], [44, 38, 92], [80, 52, 70], [232, 40, 84], [270, 58, 118], [326, 34, 76], [358, 48, 100],
    [404, 60, 66], [462, 40, 88], [650, 44, 96], [692, 36, 72], [726, 50, 110], [990, 46, 80], [1034, 58, 124],
    [1090, 40, 90], [1240, 44, 100], [1282, 52, 74], [1332, 40, 112], [1370, 70, 84],
  ];
  const LANDMARKS = [
    'M120 170 Q170 118 222 170 Z', 'M150 140 H194 V128 H150 Z', 'M156 128 Q172 76 188 128 Z', 'M169 92 L172 34 L175 92 Z',
    'M520 170 V150 H600 V170 Z', 'M528 150 L536 128 H584 L592 150 Z', 'M538 128 L544 106 H576 L582 128 Z',
    'M546 106 L550 86 H570 L574 106 Z', 'M552 86 L555 68 H565 L568 86 Z', 'M556 68 L560 40 L564 68 Z',
    'M808 170 V136 H952 V170 Z', 'M790 140 L812 136 L880 100 L948 136 L970 140 L948 132 L880 92 L812 132 Z',
    'M822 120 L880 84 L938 120 L930 120 L880 90 L830 120 Z', 'M826 136 L880 104 L934 136 Z',
    'M864 92 L868 70 H892 L896 92 Z', 'M872 70 L880 18 L888 70 Z',
    'M1150 170 L1152 40 Q1160 8 1206 2 Q1184 26 1190 60 L1192 170 Z', 'M1188 170 V96 H1226 V170 Z',
  ];
  const shapes = BLOCKS.map(([x, w, h]) => `M${x} ${G}V${G - h}H${x + w}V${G}Z`).join('') + LANDMARKS.join('');
  let wins = '';
  BLOCKS.forEach(([x, w, h], b) => {
    for (let y = G - h + 10; y < G - 10; y += 13)
      for (let wx = x + 7; wx < x + w - 9; wx += 11) {
        const on = hash(b * 97 + wx * 3 + y);
        const lit = on > win.lit;
        const fill = lit ? (on > win.accent ? RED : WARM) : win.glass && hash(wx * 5 + y) > 0.6 ? win.glass : win.off;
        const blink = lit && hash(wx + y * 7) > 0.85;
        wins += `<rect x="${wx}" y="${y}" width="5" height="7" fill="${fill}">${blink ? `<animate attributeName="opacity" values="1;.2;1" dur="${r1(3 + hash(wx) * 5)}s" begin="${r1(hash(y) * 4)}s" repeatCount="indefinite"/>` : ''}</rect>`;
      }
  });
  return `<path d="${shapes}" fill="none" stroke="${WHITE}" stroke-width="7" stroke-linejoin="round"/><path d="${shapes}" fill="${BLACK}"/><rect x="0" y="${G - 1}" width="${W}" height="60" fill="${BLACK}"/>${wins}`;
}

function stars(n, W, H, seed, avoid = () => false, op = 0.9) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = hash(i * 3 + seed) * W, y = hash(i * 7 + seed + 2) * H;
    if (avoid(x, y)) continue;
    const size = i % 3 === 0 ? 10 + hash(i * 11 + seed) * 10 : 4 + hash(i * 11 + seed) * 5;
    const fill = hash(i * 17 + seed) > 0.82 ? RED : WHITE;
    s += '  ' + star(x, y, size, fill, `<animate attributeName="opacity" values="${op};${r1(op * 0.2)};${op}" dur="${r1(2.5 + hash(i + seed) * 3)}s" begin="${r1(hash(i * 5 + seed) * 4)}s" repeatCount="indefinite"/>`) + '\n';
  }
  return s;
}

const halftone = (id, x, y, w, h, angle = 135) => `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="1.8" fill="${BLACK}"/></pattern>`;

// ---------- banner ----------
// One scene per time of day in Phnom Penh. The README loads https://cheyrotana.vercel.app/api/banner,
// which serves the scene for the current Phnom Penh time (cheyrotana/Portfolio, my-app/api/banner.js).
const SUN = '#ffd400';
const PHASES = {
  dawn: {
    label: 'SUNRISE', sky: [[0, '#1c1646'], [0.45, '#8e1b5c'], [0.75, '#ff5a3c'], [1, '#ffb347']],
    stars: [18, 140, 0.5], body: 'sun', at: [900, 318], drift: 46, burst: '#ffb347',
    clouds: ['#ffd2c2', [[660, 96, 0.9, 24, 24], [1070, 150, 0.7, -18, 20]]],
    win: { lit: 0.8, accent: 0.96, off: '#1e1e1e' },
  },
  day: {
    label: 'DAYTIME', sky: [[0, '#1e88ff'], [1, '#9ad8ff']],
    stars: null, body: 'sun', at: [960, 130], drift: 0, burst: WHITE,
    clouds: [WHITE, [[650, 44, 1, 30, 22], [730, 196, 0.8, -24, 18], [1030, 214, 0.85, 26, 26], [1080, 24, 0.6, -18, 20]]],
    win: { lit: 2, accent: 2, off: '#1e1e1e', glass: '#9fd8ff' },
  },
  dusk: {
    label: 'SUNSET', sky: [[0, '#2a0f3d'], [0.45, '#7a1050'], [0.75, RED], [1, '#ff8a1f']],
    stars: [30, 160, 0.7], body: 'sun', at: [1000, 312], drift: -46, burst: '#ff8a1f',
    clouds: ['#ffb1a0', [[660, 110, 0.85, 22, 24], [760, 40, 0.6, -16, 20]]],
    win: { lit: 0.62, accent: 0.94, off: '#1e1e1e' },
  },
  night: {
    label: 'NIGHT', sky: [[0, BLACK], [1, BLACK]],
    stars: [70, 330, 0.9], body: 'moon', at: [960, 130], drift: 0, burst: BLACK,
    clouds: null,
    win: { lit: 0.55, accent: 0.93, off: '#1e1e1e' },
  },
};

const CLOUD = 'M22 62Q2 62 4 46Q8 30 26 34Q30 12 54 14Q72 0 90 18Q112 14 116 34Q134 36 132 52Q130 64 112 62Z';
const cloud = ([x, y, k, dx, dur], fill) =>
  `  <g transform="translate(${x} ${y}) scale(${k})"><g>`
  + `<path d="${CLOUD}" fill="${BLACK}" transform="translate(6 6)"/><path d="${CLOUD}" fill="${fill}" stroke="${BLACK}" stroke-width="3" stroke-linejoin="round"/>`
  + `<animateTransform attributeName="transform" type="translate" values="0 0;${dx} 0;0 0" dur="${dur}s" repeatCount="indefinite"/></g></g>\n`;

function skyBody(p) {
  const [x, y] = p.at;
  const rise = p.drift ? `<animateTransform attributeName="transform" type="translate" from="0 ${p.drift}" to="0 0" dur="6s" fill="freeze"/>` : '';
  const burst = `<g transform="scale(2.5) translate(-50 -50)"><polygon points="${BURST}" fill="${p.burst}" stroke="${p.body === 'moon' ? WHITE : BLACK}" stroke-width="2.5" stroke-linejoin="round"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="40s" repeatCount="indefinite"/></polygon></g>`;
  const disc = p.body === 'moon'
    ? `<g transform="scale(1.2) translate(-50 -50)"><path d="M62 8a44 44 0 1 0 30 62A36 36 0 0 1 62 8z" fill="${WHITE}" stroke="${BLACK}" stroke-width="3" stroke-linejoin="round"/><circle cx="40" cy="58" r="5" fill="${MUTED}"/><circle cx="30" cy="40" r="3" fill="${MUTED}"/><circle cx="52" cy="78" r="3.5" fill="${MUTED}"/></g>`
    : `<circle r="58" fill="${SUN}" stroke="${BLACK}" stroke-width="4"/><circle r="44" fill="none" stroke="${WHITE}" stroke-width="3" stroke-dasharray="14 10" opacity=".8"/><path d="M-30 -22A38 38 0 0 1 -6 -38" fill="none" stroke="${WHITE}" stroke-width="6" stroke-linecap="round"/>`;
  return `  <g transform="translate(${x} ${y})"><g>${burst}${disc}${rise}</g></g>\n`;
}

function banner(phase) {
  const p = PHASES[phase];
  const W = 1200, H = 460;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Chey Rotana, mobile and full-stack developer. ${p.label.toLowerCase()} in Phnom Penh">
  <defs>
    <clipPath id="frame"><rect width="${W}" height="${H}"/></clipPath>
    ${halftone('dots')}
    <pattern id="skyDots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.6" fill="${WHITE}"/></pattern>
    <linearGradient id="dotFade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="dotMask"><rect width="${W}" height="${H}" fill="url(#dotFade)"/></mask>
    <linearGradient id="sky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="400">${p.sky.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>
  </defs>
  <g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
${p.body === 'sun' ? `  <rect width="${W}" height="${H}" fill="url(#skyDots)" opacity=".14"/>\n` : ''}${p.stars ? stars(p.stars[0], W, p.stars[1], 11, (x) => x < 600, p.stars[2]) : ''}
  <!-- red slab with a white slash and halftone dots -->
  <path d="M0 0H600L440 ${H}H0Z" fill="${RED}"/>
  <path d="M600 0H624L464 ${H}H440Z" fill="${WHITE}"/>
  <path d="M0 0H600L440 ${H}H0Z" fill="url(#dots)" opacity=".45" mask="url(#dotMask)"/>
  <!-- sun or moon -->
${skyBody(p)}${p.clouds ? p.clouds[1].map(c => cloud(c, p.clouds[0])).join('') : ''}  <!-- Phnom Penh skyline -->
  <g transform="translate(0 ${H - 150}) scale(0.84)">${skyline(p.win)}</g>
`;
  // location tag, showing the time of day
  const tag = `PHNOM PENH · ${p.label}`, tw = Math.round(tag.length * 10.8 + 6);
  s += `  <g transform="translate(70 30) rotate(-3)"><rect x="5" y="5" width="${tw}" height="30" fill="${BLACK}"/><rect width="${tw}" height="30" fill="${WHITE}"/><text x="${tw / 2}" y="21" text-anchor="middle" font-family="${F.anton}" font-size="16" letter-spacing="3" fill="${BLACK}">${tag}</text></g>\n`;
  // name as ransom tiles
  const a = ransomWord('CHEY', 74, 122, 76, 0, 0, 0.3);
  const b = ransomWord('ROTANA', 104, 222, 76, 0, a.next, 0.3);
  s += a.svg + b.svg;

  // tagline strip with hard cuts between phrases
  const phrases = ['MOBILE & FULL-STACK DEVELOPER', 'FLUTTER · REACT · TYPESCRIPT', 'APPS THAT SOLVE REAL PROBLEMS', 'DEVELOPER INTERN AT MLMUPC', 'CS STUDENT AT CADT'];
  const T = 3, N = phrases.length, D = T * N;
  const bx = 84, by = 290, bw = 470, bh = 46;
  s += `  <g transform="translate(${bx} ${by}) skewX(-12)">
    <rect x="9" y="9" width="${bw}" height="${bh}" fill="${RED}"/>
    <rect width="${bw}" height="${bh}" fill="${BLACK}" stroke="${WHITE}" stroke-width="3"/>
  </g>\n`;
  phrases.forEach((p, i) => {
    const a0 = i / N, a1 = (i + 1) / N, e = 0.18 / D;
    const kt = i === 0 ? `0;${e.toFixed(4)};${(a1 - 0.0001).toFixed(4)};${a1.toFixed(4)};1` : `0;${a0.toFixed(4)};${(a0 + e).toFixed(4)};${a1.toFixed(4)};1`;
    const op = i === 0 ? '1;1;1;0;0' : '0;1;1;0;0';
    const xs = i === 0 ? `${bx - 10};${bx + 22};${bx + 22};${bx + 22};${bx + 22}` : `${bx + 22};${bx - 10};${bx + 22};${bx + 22};${bx + 22}`;
    s += `  <text x="${bx + 22}" y="${by + 32}" textLength="${r1(Math.min(p.length * 14.6, bw - 44))}" lengthAdjust="spacingAndGlyphs" font-family="${F.anton}" font-size="25" letter-spacing="2" fill="${WHITE}" opacity="${i === 0 ? 1 : 0}">${esc(p)}`
      + `<animate attributeName="opacity" values="${op}" keyTimes="${kt}" dur="${D}s" calcMode="discrete" repeatCount="indefinite"/>`
      + `<animate attributeName="x" values="${xs}" keyTimes="${kt}" dur="${D}s" repeatCount="indefinite"/></text>\n`;
  });
  s += `  <rect width="${W}" height="${H}" fill="none" stroke="${WHITE}" stroke-width="6"/>\n  </g>\n</svg>\n`;
  return s;
}

// ---------- footer ----------
function footer() {
  const W = 1200, H = 120;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Thanks for stopping by">
  <defs>${halftone('fdots')}</defs>
  <path d="M0 40L${W} 14V74L0 100Z" fill="${RED}"/>
  <path d="M0 40L${W} 14V74L0 100Z" fill="url(#fdots)" opacity=".35"/>
  <path d="M0 34L${W} 8V14L0 40Z" fill="${WHITE}"/>
  <path d="M0 100L${W} 74V80L0 106Z" fill="${WHITE}"/>
  <g transform="translate(600 58) rotate(-1.3)">
    <g transform="skewX(-12)"><rect x="-200" y="-22" width="400" height="44" fill="${WHITE}" transform="translate(7 7)"/><rect x="-200" y="-22" width="400" height="44" fill="${BLACK}" stroke="${WHITE}" stroke-width="3"/></g>
    <text x="0" y="10" text-anchor="middle" font-family="${F.anton}" font-size="26" letter-spacing="4" fill="${WHITE}">THANKS FOR STOPPING BY</text>
  </g>
  ${star(150, 56, 26, BLACK)}${star(1050, 36, 26, BLACK)}
  ${star(150, 56, 14, WHITE)}${star(1050, 36, 14, WHITE)}
</svg>\n`;
}

// ---------- section signs ----------
function sign(n, label) {
  const lw = Math.round(label.length * 17 + 20);
  const w = 78 + lw, h = 58;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w + 10} ${h + 10}" width="${w + 10}" height="${h + 10}" role="img" aria-label="${n}. ${label}">
  <path d="M${22 + 7} ${9 + 7}H${w + 4}L${w - 14 + 4} ${h + 5}H${7 + 4}Z" fill="${RED}"/>
  <path d="M22 9H${w - 3}L${w - 21} ${h - 2}H4Z" fill="${BLACK}" stroke="${WHITE}" stroke-width="3" stroke-linejoin="miter"/>
  <g transform="translate(38 33) rotate(-7)"><rect x="-17" y="-19" width="34" height="38" fill="${RED}" stroke="${WHITE}" stroke-width="2.5"/><text x="0" y="10" text-anchor="middle" font-family="${F.anton}" font-size="28" fill="${WHITE}">${n}</text></g>
  <text x="66" y="44" font-family="${F.anton}" font-size="30" letter-spacing="2" fill="${WHITE}">${esc(label.toUpperCase())}</text>
</svg>\n`;
}

// ---------- journey ----------
function journey() {
  const stops = [
    ['YEAR 1', 'Took off at CADT', 'B.Sc. Computer Science', 'study'],
    ['NOV 2025', 'Modula', 'CADT team project', 'project'],
    ['DEC 2025', 'Frost Guard', 'CADT team project', 'project'],
    ['DEC 2025', 'UniFinder', 'CADT team project', 'project'],
    ['APR 2026', 'Developer Intern', 'MLMUPC', 'work'],
    ['SEP 2026', 'Face Scan Connector', 'HRM · MLMUPC & NIS', 'work'],
    ['OCT 2026', 'PhumiYerng', 'LASED III communities', 'work'],
    ['NOW', 'Where to next?', 'Final year at CADT', 'next'],
  ];
  const W = 1200, H = 340, y = 168;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Journey: CADT, Modula, Frost Guard, UniFinder, developer intern at MLMUPC, Face Scan Connector, PhumiYerng, and next">
  <rect x="12" y="12" width="${W - 16}" height="${H - 16}" fill="${RED}"/>
  <rect x="3" y="3" width="${W - 16}" height="${H - 16}" fill="${BLACK}" stroke="${WHITE}" stroke-width="3"/>
  <path d="M50 ${y}L1080 ${y - 8}" stroke="${WHITE}" stroke-width="16" stroke-linecap="square"/>
  <path d="M50 ${y}L1080 ${y - 8}" stroke="${RED}" stroke-width="8"/>
  <path d="M1080 ${y - 8}L1150 ${y - 9}" stroke="${RED}" stroke-width="8" stroke-dasharray="10 8"><animate attributeName="stroke-dashoffset" values="18;0" dur="0.8s" repeatCount="indefinite"/></path>
`;
  const lineAt = x => y - 8 * (x - 50) / 1030;
  stops.forEach(([date, title, org, kind], i) => {
    const x = r1(162.5 + i * 125), ly = r1(lineAt(x)), up = i % 2 === 0;
    const ty = up ? 58 : 232;
    s += `  <path d="M${x} ${up ? ly - 18 : ly + 18}V${up ? ty + 62 : ty - 24}" stroke="${WHITE}" stroke-width="2" stroke-dasharray="4 4"/>\n`;
    if (kind === 'work') s += `  ${star(x, ly, 40, WHITE)}${star(x, ly, 28, RED)}\n`;
    else if (kind === 'study') s += `  <rect x="${x - 11}" y="${ly - 11}" width="22" height="22" transform="rotate(45 ${x} ${ly})" fill="${WHITE}" stroke="${BLACK}" stroke-width="3"/>\n`;
    else if (kind === 'next') s += `  <circle cx="${x}" cy="${ly}" r="11" fill="${BLACK}" stroke="${WHITE}" stroke-width="3"/><circle cx="${x}" cy="${ly}" r="11" fill="none" stroke="${RED}" stroke-width="3"><animate attributeName="r" values="11;26" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.6s" repeatCount="indefinite"/></circle>\n`;
    else s += `  <circle cx="${x}" cy="${ly}" r="11" fill="${WHITE}" stroke="${BLACK}" stroke-width="3"/><circle cx="${x}" cy="${ly}" r="4.5" fill="${RED}"/>\n`;
    s += `  <g text-anchor="middle"><g transform="translate(${x} ${ty - 6}) rotate(-3)"><rect x="${-(date.length * 6.5 + 14)}" y="-15" width="${date.length * 13 + 28}" height="22" fill="${RED}"/><text y="2" font-family="${F.anton}" font-size="16" letter-spacing="2" fill="${WHITE}">${date}</text></g>`
      + `<text x="${x}" y="${ty + 31}" font-family="${F.archivo}" font-weight="900" font-size="18" fill="${WHITE}">${esc(title)}</text>`
      + `<text x="${x}" y="${ty + 54}" font-family="${F.body}" font-size="15" fill="${MUTED}">${esc(org)}</text></g>\n`;
  });
  s += `  <g transform="translate(44 306)" font-family="${F.anton}" font-size="14" letter-spacing="2" fill="${MUTED}">
    <rect x="-7" y="-13" width="13" height="13" transform="rotate(45 0 -6)" fill="${WHITE}"/><text x="16" y="0">STUDY</text>
    <circle cx="96" cy="-6" r="7" fill="${WHITE}"/><circle cx="96" cy="-6" r="3" fill="${RED}"/><text x="110" y="0">PROJECT</text>
    ${star(210, -6, 20, RED)}<text x="224" y="0">WORK</text>
  </g>
</svg>\n`;
  return s;
}

fs.mkdirSync(path.join(OUT, 'banner'), { recursive: true });
Object.keys(PHASES).forEach(ph => fs.writeFileSync(path.join(OUT, 'banner', `${ph}.svg`), banner(ph)));
fs.writeFileSync(path.join(OUT, 'persona-footer.svg'), footer());
fs.writeFileSync(path.join(OUT, 'journey.svg'), journey());
['About', 'Journey', 'Skills', 'Work', 'Contact'].forEach((l, i) => fs.writeFileSync(path.join(OUT, 'stops', `${i + 1}-${l.toLowerCase()}.svg`), sign(i + 1, l)));
console.log('ok');
