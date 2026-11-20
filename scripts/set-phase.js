// Usage: node scripts/set-phase.js [dawn|day|dusk|night]
// Points the README banner at the scene for the current time of day in Phnom Penh
// (or the phase given as an argument) and prints the phase.
const fs = require('fs');
const path = require('path');

// Phnom Penh is UTC+7 all year; the sun rises around 6:00 and sets around 18:00.
const PHASES = [
  ['night', 0], ['dawn', 5], ['day', 7], ['dusk', 17], ['night', 19],
];
const LABELS = { dawn: 'sunrise', day: 'daytime', dusk: 'sunset', night: 'night' };

const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Phnom_Penh' }).format(new Date()));
const phase = process.argv[2] || PHASES.filter(([, h]) => hour >= h).pop()[0];
if (!LABELS[phase]) throw new Error(`Unknown phase "${phase}". Use one of: ${Object.keys(LABELS).join(', ')}`);

const file = path.join(__dirname, '..', 'README.md');
const readme = fs.readFileSync(file, 'utf8');
const banner = /<img src="assets\/banner\/(?:dawn|day|dusk|night)\.svg"[^>]*\/>/;
if (!banner.test(readme)) throw new Error('Banner <img> not found in README.md');
const next = readme.replace(banner,
  `<img src="assets/banner/${phase}.svg" width="100%" alt="Hey, I'm Chey Rotana. Mobile and full-stack developer. It's ${LABELS[phase]} in Phnom Penh" />`);
if (next !== readme) fs.writeFileSync(file, next);
console.log(phase);
