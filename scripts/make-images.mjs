// Regenerates the social share card and favicons from data/profile.json.
// Run locally with `npm run images` and commit the output; CI never runs this.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const root = new URL('../', import.meta.url);
const out = new URL('assets/img/', root);
mkdirSync(out, { recursive: true });
const profile = JSON.parse(readFileSync(new URL('data/profile.json', root), 'utf8'));

const x = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const MENLO = '/System/Library/Fonts/Menlo.ttc';
const font = {
  loadSystemFonts: true,
  defaultFontFamily: 'Menlo',
  ...(existsSync(MENLO) ? { fontFiles: [MENLO] } : {}),
};
const FAMILY = `Menlo, 'DejaVu Sans Mono', monospace`;

function png(svg, width) {
  return new Resvg(svg, { font, fitTo: { mode: 'width', value: width } }).render().asPng();
}

const credits = profile.experience.slice(0, 3).map(e => e.company.replace("NASA's Jet Propulsion Laboratory", 'NASA JPL')).join(' · ');

const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#000"/>
  <rect x="40" y="40" width="1120" height="550" rx="12" fill="#0d0d0d" stroke="#1a3a1a" stroke-width="2"/>
  <line x1="40" y1="96" x2="1160" y2="96" stroke="#1a3a1a" stroke-width="2"/>
  <circle cx="76" cy="68" r="9" fill="#ff5f56"/><circle cx="104" cy="68" r="9" fill="#ffbd2e"/><circle cx="132" cy="68" r="9" fill="#27c93f"/>
  <text x="600" y="76" fill="#008800" font-family="${FAMILY}" font-size="22" text-anchor="middle">tippens@portfolio: ~</text>
  <g font-family="${FAMILY}">
    <text x="90" y="170" fill="#00aa00" font-size="30">tippens@portfolio:~$ whoami</text>
    <text x="90" y="280" fill="#00ff00" font-size="84" font-weight="bold">${x(profile.name.replace(/ M\. /, ' '))}</text>
    <text x="90" y="350" fill="#00cc00" font-size="30">${x(profile.headline)}</text>
    <text x="90" y="410" fill="#008800" font-size="26">${x(profile.tagline)}</text>
    <text x="90" y="465" fill="#00cc00" font-size="26">${x(credits)}</text>
    <text x="90" y="545" fill="#00ffcc" font-size="30">justthetipp.com</text>
    <rect x="370" y="520" width="16" height="32" fill="#00ff00"/>
  </g>
</svg>`;

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="12" fill="#000"/>
  <rect x="2" y="2" width="60" height="60" rx="10" fill="none" stroke="#1a3a1a" stroke-width="2"/>
  <path d="M14 20 L28 32 L14 44" fill="none" stroke="#00ff00" stroke-width="6" stroke-linecap="square"/>
  <rect x="32" y="40" width="18" height="6" fill="#00ffcc"/>
</svg>`;

writeFileSync(new URL('og-card.png', out), png(card, 1200));
writeFileSync(new URL('favicon.svg', out), icon + '\n');
writeFileSync(new URL('favicon-48.png', out), png(icon, 48));
writeFileSync(new URL('apple-touch-icon.png', out), png(icon, 180));
console.log('wrote assets/img/{og-card.png,favicon.svg,favicon-48.png,apple-touch-icon.png}');
