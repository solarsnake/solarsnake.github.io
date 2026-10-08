import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function pngSize(rel) {
  const buf = readFileSync(new URL(`../${rel}`, import.meta.url));
  assert.equal(buf.toString('hex', 0, 8), '89504e470d0a1a0a', `${rel} is not a PNG`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

test('share card is a 1200x630 PNG', () => {
  assert.deepEqual(pngSize('assets/img/og-card.png'), { width: 1200, height: 630 });
});

test('favicon PNGs have the right sizes', () => {
  assert.deepEqual(pngSize('assets/img/favicon-48.png'), { width: 48, height: 48 });
  assert.deepEqual(pngSize('assets/img/apple-touch-icon.png'), { width: 180, height: 180 });
});

test('favicon.svg is a square SVG', () => {
  const svg = readFileSync(new URL('../assets/img/favicon.svg', import.meta.url), 'utf8');
  assert.match(svg, /^<svg[^>]+viewBox="0 0 64 64"/);
});

test('share card stays small enough for social crawlers', () => {
  assert.ok(readFileSync(new URL('../assets/img/og-card.png', import.meta.url)).length < 300_000);
});
