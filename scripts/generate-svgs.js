// Usage: node scripts/generate-svgs.js assets
// Edit the colours, name, taglines, stops or journey below, re-run, then commit the changed files in assets/.
// Generates the Metro-themed profile SVGs: banner, footer, section signs, journey line.
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2];
fs.mkdirSync(path.join(OUT, 'stops'), { recursive: true });

// Portfolio "Metro" night palette
const C = {
  sky0: '#050a1c', sky1: '#0a1230', sky2: '#121a3a',
  bg: '#10131b', surface: '#1b1f2b', line: '#2e3445',
  fg: '#f1ede4', muted: '#aaa49a', orange: '#f06a1f', orange2: '#ff8a3d', amber: '#f5b82e', win: '#f5c35a',
  board: '#141414', tile: '#232323',
};
const MONO = "'JetBrains Mono', 'Fira Code', Consolas, Menlo, monospace";
const SANS = "Overpass, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const r1 = n => Math.round(n * 10) / 10;
const esc = s => s.replace(/&/g, '&amp;');
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ---------- transit line geometry ----------
const lineY = x => 330 + 10 * Math.sin(x / 170) + 6 * Math.sin(x / 63);
const linePath = (x0, x1, f = lineY) => {
  let d = `M${x0} ${r1(f(x0))}`;
  for (let x = x0 + 10; x <= x1; x += 10) d += `L${x} ${r1(f(x))}`;
  return d;
};

// ---------- banner ----------
function banner() {
  const W = 1200, H = 440;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Chey Rotana, mobile and full-stack developer">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.sky0}"/><stop offset=".6" stop-color="${C.sky1}"/><stop offset="1" stop-color="${C.sky2}"/>
    </linearGradient>
    <radialGradient id="glow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="${C.orange}" stop-opacity=".22"/><stop offset="1" stop-color="${C.orange}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="tileG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2c2c2c"/><stop offset=".5" stop-color="${C.tile}"/><stop offset=".5" stop-color="#1b1b1b"/><stop offset="1" stop-color="#262626"/>
    </linearGradient>
    <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.sky0}" stop-opacity="0"/><stop offset="1" stop-color="${C.sky0}" stop-opacity=".85"/>
    </linearGradient>
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
`;
  // stars
  s += `  <g fill="${C.fg}">\n`;
  for (let i = 0; i < 70; i++) {
    const x = r1(rnd() * W), y = r1(rnd() * 230), rad = r1(0.5 + rnd() * 1.1), lo = r1(0.15 + rnd() * 0.3);
    s += `    <circle cx="${x}" cy="${y}" r="${rad}" opacity="${lo}"><animate attributeName="opacity" values="${lo};.9;${lo}" dur="${r1(2.5 + rnd() * 3.5)}s" begin="${r1(rnd() * 4)}s" repeatCount="indefinite"/></circle>\n`;
  }
  s += `  </g>\n  <ellipse cx="600" cy="330" rx="520" ry="120" fill="url(#glow)"/>\n`;

  // skyline: two rows of 2.5D blocks
  const row = (base, minH, maxH, cols, id) => {
    let g = '';
    let x = -30;
    while (x < W + 30) {
      const w = 36 + Math.floor(rnd() * 50), h = minH + Math.floor(rnd() * (maxH - minH)), d = 12 + Math.floor(rnd() * 8);
      const top = base - h;
      const brick = rnd() < 0.12;
      const [front, side, roof] = brick ? cols.brick : cols.slate;
      g += `    <path d="M${x + w} ${top}l${d} ${-d * 0.6}v${h}l${-d} ${d * 0.6}z" fill="${side}"/>`;
      g += `<path d="M${x} ${top}l${d} ${-d * 0.6}h${w}l${-d} ${d * 0.6}z" fill="${roof}"/>`;
      g += `<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${front}"/>\n`;
      for (let wy = top + 12; wy < base - 14; wy += 20)
        for (let wx = x + 8; wx < x + w - 10; wx += 15) {
          const p = rnd();
          if (p < cols.lit) {
            const tw = rnd() < 0.18;
            g += `    <rect x="${wx}" y="${wy}" width="6" height="8" fill="${C.win}" opacity="${cols.winOp}">${tw ? `<animate attributeName="opacity" values="${cols.winOp};.15;${cols.winOp}" dur="${r1(3 + rnd() * 6)}s" begin="${r1(rnd() * 5)}s" repeatCount="indefinite"/>` : ''}</rect>\n`;
          }
        }
      x += w + d + 2 + Math.floor(rnd() * 10);
    }
    return `  <g id="${id}">\n${g}  </g>\n`;
  };
  s += row(395, 70, 190, { slate: ['#1a2142', '#141a35', '#252e55'], brick: ['#2e1d24', '#24161c', '#3b252d'], lit: 0.22, winOp: 0.55 }, 'back');
  // elevated transit line (deck, pillars, orange line)
  let pillars = '';
  for (let x = 20; x < W; x += 75) pillars += `<rect x="${x - 4}" y="${r1(lineY(x) + 6)}" width="8" height="${r1(H - lineY(x))}" fill="#252c45"/>`;
  s += `  <g>${pillars}</g>\n`;
  s += `  <path d="${linePath(-20, W + 20, x => lineY(x) + 5)}" fill="none" stroke="#2a3150" stroke-width="16" stroke-linejoin="round"/>\n`;
  s += `  <path id="track" d="${linePath(-20, W + 20)}" fill="none" stroke="${C.orange}" stroke-width="5" stroke-linejoin="round" filter="url(#soft)"/>\n`;
  s += row(470, 40, 100, { slate: ['#2b3557', '#20284a', '#3d4870'], brick: ['#3a2329', '#2c1a20', '#4a2d35'], lit: 0.3, winOp: 0.8 }, 'front');
  s += `  <rect y="${H - 90}" width="${W}" height="90" fill="url(#haze)"/>\n`;

  // train running the line
  s += `  <g>
    <g transform="translate(0 -9)">
      ${[-44, -8, 28].map(o => `<rect x="${o}" y="-8" width="34" height="14" rx="4" fill="${C.fg}"/><rect x="${o}" y="2" width="34" height="3" fill="${C.orange}"/><rect x="${o + 4}" y="-5" width="7" height="5" rx="1" fill="#1b1f2b"/><rect x="${o + 14}" y="-5" width="7" height="5" rx="1" fill="#1b1f2b"/><rect x="${o + 24}" y="-5" width="6" height="5" rx="1" fill="#1b1f2b"/>`).join('')}
      <circle cx="62" cy="-1" r="2.4" fill="#fff6c8"/>
    </g>
    <animateMotion dur="18s" repeatCount="indefinite" rotate="auto"><mpath href="#track"/></animateMotion>
  </g>\n`;

  // station pins
  const stops = ['About', 'Journey', 'Skills', 'Work', 'Contact'];
  const xs = [130, 365, 600, 835, 1070];
  stops.forEach((name, i) => {
    const x = xs[i], y = r1(lineY(x));
    const w = 34 + name.length * 9.6;
    s += `  <g transform="translate(${x} ${y})"><rect x="-7" y="-4" width="14" height="10" rx="2" fill="#0d0f16"/><circle r="5" fill="${C.fg}" stroke="${C.orange}" stroke-width="3"/>
    <g transform="translate(${r1(-w / 2)} -44)"><rect width="${r1(w)}" height="26" rx="8" fill="#0d0f16" stroke="${C.line}"/><circle cx="13" cy="13" r="8" fill="${C.orange}"/><text x="13" y="17" text-anchor="middle" font-family="${SANS}" font-size="11" font-weight="800" fill="#fff">${i + 1}</text><text x="27" y="17.5" font-family="${SANS}" font-size="13" font-weight="700" fill="${C.fg}">${name}</text></g>
    <path d="M-4 -18h8l-4 5z" fill="#0d0f16"/></g>\n`;
  });

  // header strip
  s += `  <g transform="translate(28 26)"><circle cx="16" cy="16" r="16" fill="${C.orange}"/><text x="16" y="21.5" text-anchor="middle" font-family="${SANS}" font-size="16" font-weight="800" fill="#fff">R</text>
    <text x="42" y="13" font-family="${MONO}" font-size="10" letter-spacing="2" fill="${C.muted}">ROTANA LINE</text>
    <text x="42" y="30" font-family="${SANS}" font-size="16" font-weight="800" fill="${C.fg}">Rotana Central</text></g>
  <g transform="translate(1172 26)" text-anchor="end"><text y="13" font-family="${MONO}" font-size="10" letter-spacing="2" fill="${C.muted}">PHNOM PENH</text>
    <text y="31" font-family="${MONO}" font-size="16" font-weight="700" fill="${C.amber}">LINE 1 · KH</text></g>\n`;

  // departure board
  const name = 'CHEY ROTANA';
  const TW = 46, TH = 60, GAP = 6, SP = 22;
  let total = 0;
  for (const ch of name) total += ch === ' ' ? SP : TW + GAP;
  total -= GAP;
  const bx = 600 - total / 2, by = 132;
  s += `  <rect x="${r1(bx - 34)}" y="84" width="${r1(total + 68)}" height="172" rx="16" fill="${C.board}" fill-opacity=".94" stroke="#2a2a2a"/>
  <g transform="translate(${r1(bx)} 98)"><circle cx="9" cy="9" r="9" fill="${C.orange}"/><text x="9" y="13" text-anchor="middle" font-family="${SANS}" font-size="11" font-weight="800" fill="#fff">R</text><text x="26" y="13.5" font-family="${MONO}" font-size="12" letter-spacing="3" fill="${C.muted}">ROTANA CENTRAL · LINE 1</text></g>\n`;
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let x = bx, ti = 0;
  for (const ch of name) {
    if (ch === ' ') { x += SP; continue; }
    const cx = r1(x + TW / 2);
    s += `  <g><rect x="${r1(x)}" y="${by}" width="${TW}" height="${TH}" rx="5" fill="url(#tileG)"/>`;
    const flips = 8 + ti * 2, step = 0.055, start = 0.4;
    for (let k = 0; k < flips; k++) {
      const g = glyphs[Math.floor(rnd() * glyphs.length)];
      s += `<text x="${cx}" y="${by + 44}" text-anchor="middle" font-family="${MONO}" font-size="40" font-weight="700" fill="${C.fg}" visibility="hidden">${g}<set attributeName="visibility" to="visible" begin="${r1((start + k * step) * 1000) / 1000}s" dur="${step}s"/></text>`;
    }
    s += `<text x="${cx}" y="${by + 44}" text-anchor="middle" font-family="${MONO}" font-size="40" font-weight="700" fill="${C.fg}" visibility="hidden">${ch}<set attributeName="visibility" to="visible" begin="${r1((start + flips * step) * 1000) / 1000}s" fill="freeze"/></text>`;
    s += `<rect x="${r1(x)}" y="${by + TH / 2 - 0.75}" width="${TW}" height="1.5" fill="#0a0a0a"/></g>\n`;
    x += TW + GAP; ti++;
  }

  // typed tagline (amber, like the portfolio subtitle)
  const phrases = ['MOBILE & FULL-STACK DEVELOPER', 'FLUTTER, REACT AND TYPESCRIPT', 'APPS THAT SOLVE REAL PROBLEMS', 'DEVELOPER INTERN AT MLMUPC', 'CS STUDENT AT CADT'];
  const CW = 13.2, TYPE = 0.09, HOLD = 2.4, DEL = 0.035, PAUSE = 0.45, LEAD = 1.6;
  const frames = []; let t = 0;
  frames.push([0, -1, 0]); t = LEAD;
  phrases.forEach((p, i) => {
    const n = p.length;
    for (let c = 0; c <= n; c++) { frames.push([t, i, c]); if (c < n) t += TYPE; }
    t += HOLD;
    for (let c = n; c >= 0; c--) { frames.push([t, i, c]); if (c > 0) t += DEL; }
    t += PAUSE;
  });
  const dur = t; frames.push([dur, -1, 0]);
  const keyTimes = frames.map(f => (f[0] / dur).toFixed(4)).join(';');
  const anim = (attr, vals) => `<animate attributeName="${attr}" values="${vals.join(';')}" keyTimes="${keyTimes}" dur="${r1(dur * 100) / 100}s" calcMode="discrete" repeatCount="indefinite"/>`;
  const sx = p => r1(600 - p.length * CW / 2);
  const ty = 232;
  phrases.forEach((p, i) => {
    const widths = frames.map(f => f[1] === i ? r1(f[2] * CW) : 0);
    s += `  <clipPath id="type${i}"><rect x="${sx(p)}" y="${ty - 22}" height="30" width="0">${anim('width', widths)}</rect></clipPath>\n`;
    s += `  <text x="${sx(p)}" y="${ty}" textLength="${r1(p.length * CW)}" lengthAdjust="spacingAndGlyphs" font-family="${MONO}" font-size="18" font-weight="700" fill="${C.amber}" clip-path="url(#type${i})">${esc(p)}</text>\n`;
  });
  const cur = frames.map(f => f[1] < 0 ? sx(phrases[0]) + 2 : r1(sx(phrases[f[1]]) + 2 + f[2] * CW));
  s += `  <rect x="${cur[0]}" y="${ty - 17}" width="9" height="3" fill="${C.orange}" transform="translate(0 18)">${anim('x', cur)}<animate attributeName="opacity" values="1;0;1" dur="1s" calcMode="discrete" keyTimes="0;.5;1" repeatCount="indefinite"/></rect>\n`;
  s += `  </g>\n</svg>\n`;
  return s;
}

// ---------- footer ----------
function footer() {
  const W = 1200, H = 90, y = 46;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="">
  <defs><linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="60" x2="1140"><stop offset="0" stop-color="${C.orange}" stop-opacity="0"/><stop offset=".12" stop-color="${C.orange}"/><stop offset=".88" stop-color="${C.orange}"/><stop offset="1" stop-color="${C.orange}" stop-opacity="0"/></linearGradient></defs>
  <path id="ft" d="M60 ${y}H1140" stroke="url(#fade)" stroke-width="5" stroke-linecap="round"/>
`;
  [240, 420, 600, 780, 960].forEach((x, i) => {
    s += `  <circle cx="${x}" cy="${y}" r="7" fill="${C.fg}" stroke="${C.orange}" stroke-width="3.5"/><text x="${x}" y="${y + 30}" text-anchor="middle" font-family="${MONO}" font-size="11" letter-spacing="2" fill="${C.muted}">${['ABOUT', 'JOURNEY', 'SKILLS', 'WORK', 'CONTACT'][i]}</text>\n`;
  });
  s += `  <text x="600" y="${y - 20}" text-anchor="middle" font-family="${MONO}" font-size="11" letter-spacing="3" fill="${C.amber}">END OF THE LINE · THANKS FOR RIDING</text>
  <g><g transform="translate(-40 0)">${[0, 26].map(o => `<rect x="${o}" y="-7" width="24" height="12" rx="3" fill="${C.fg}"/><rect x="${o}" y="2" width="24" height="2.5" fill="${C.orange}"/>`).join('')}</g>
    <animateMotion path="M100 ${y - 8}H1100" dur="9s" repeatCount="indefinite" keyPoints="0;1;1;0;0" keyTimes="0;.45;.5;.95;1" calcMode="spline" keySplines=".45 0 .55 1;0 0 1 1;.45 0 .55 1;0 0 1 1"/></g>
</svg>\n`;
  return s;
}

// ---------- section signs ----------
function sign(n, label) {
  const w = Math.round(62 + label.length * 12.5);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 48" width="${w}" height="48" role="img" aria-label="${n}. ${label}">
  <rect x="1" y="1" width="${w - 2}" height="46" rx="12" fill="${C.bg}" stroke="${C.line}" stroke-width="1.5"/>
  <rect x="1" y="1" width="${w - 2}" height="5" rx="2" fill="${C.orange}"/>
  <circle cx="27" cy="26" r="13" fill="${C.orange}"/>
  <text x="27" y="31.5" text-anchor="middle" font-family="${SANS}" font-size="15" font-weight="800" fill="#fff">${n}</text>
  <text x="50" y="32" font-family="${SANS}" font-size="19" font-weight="800" fill="${C.fg}">${esc(label)}</text>
</svg>\n`;
}

// ---------- journey line ----------
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
  const W = 1200, H = 330, y = 165;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Journey: CADT, Modula, Frost Guard, UniFinder, developer intern at MLMUPC, Face Scan Connector, PhumiYerng, and next">
  <rect width="${W}" height="${H}" rx="18" fill="${C.bg}"/>
  <path d="M50 ${y + 4}H1150" stroke="#232838" stroke-width="16" stroke-linecap="round"/>
  <path id="jl" d="M50 ${y}H1080" stroke="${C.orange}" stroke-width="6" stroke-linecap="round"/>
  <path d="M1080 ${y}H1150" stroke="${C.orange}" stroke-width="6" stroke-dasharray="8 8" stroke-linecap="round"><animate attributeName="stroke-dashoffset" values="16;0" dur="1s" repeatCount="indefinite"/></path>
`;
  stops.forEach(([date, title, org, kind], i) => {
    const x = r1(162.5 + i * 125), up = i % 2 === 0;
    const ty = up ? 62 : 222;
    s += `  <path d="M${x} ${up ? y - 14 : y + 14}V${up ? ty + 58 : ty - 22}" stroke="${C.line}" stroke-width="2"/>\n`;
    if (kind === 'work') s += `  <circle cx="${x}" cy="${y}" r="11" fill="${C.orange}" stroke="${C.fg}" stroke-width="3.5"/>\n`;
    else if (kind === 'study') s += `  <circle cx="${x}" cy="${y}" r="10" fill="${C.amber}" stroke="${C.bg}" stroke-width="3"/>\n`;
    else if (kind === 'next') s += `  <circle cx="${x}" cy="${y}" r="10" fill="${C.bg}" stroke="${C.orange2}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="10" fill="none" stroke="${C.orange2}" stroke-width="2"><animate attributeName="r" values="10;22" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;0" dur="1.8s" repeatCount="indefinite"/></circle>\n`;
    else s += `  <circle cx="${x}" cy="${y}" r="9" fill="${C.fg}" stroke="${C.orange}" stroke-width="4"/>\n`;
    s += `  <g text-anchor="middle"><text x="${x}" y="${ty}" font-family="${MONO}" font-size="13" font-weight="700" letter-spacing="2" fill="${C.amber}">${date}</text><text x="${x}" y="${ty + 27}" font-family="${SANS}" font-size="19" font-weight="800" fill="${C.fg}">${esc(title)}</text><text x="${x}" y="${ty + 50}" font-family="${SANS}" font-size="15" fill="${C.muted}">${esc(org)}</text></g>\n`;
  });
  s += `  <g transform="translate(40 300)" font-family="${MONO}" font-size="12" fill="${C.muted}" letter-spacing="1">
    <circle cx="6" cy="-4" r="6" fill="${C.amber}"/><text x="18" y="0">STUDY</text>
    <circle cx="96" cy="-4" r="6" fill="${C.fg}" stroke="${C.orange}" stroke-width="3"/><text x="108" y="0">PROJECT</text>
    <circle cx="204" cy="-4" r="6" fill="${C.orange}" stroke="${C.fg}" stroke-width="2.5"/><text x="216" y="0">WORK</text>
  </g>
</svg>\n`;
  return s;
}

fs.writeFileSync(path.join(OUT, 'metro-banner.svg'), banner());
fs.writeFileSync(path.join(OUT, 'metro-footer.svg'), footer());
fs.writeFileSync(path.join(OUT, 'journey.svg'), journey());
[['About'], ['Journey'], ['Skills'], ['Work'], ['Contact']].forEach(([l], i) => fs.writeFileSync(path.join(OUT, 'stops', `${i + 1}-${l.toLowerCase()}.svg`), sign(i + 1, l)));
console.log('ok');
