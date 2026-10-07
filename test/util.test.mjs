import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, formatDate, rfc822, SITE_URL } from '../scripts/lib/util.mjs';

test('escapeHtml escapes all five characters and stringifies', () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(42), '42');
});

test('formatDate renders long US date without timezone drift', () => {
  assert.equal(formatDate('2026-10-07'), 'October 7, 2026');
  assert.equal(formatDate('2013-01-01'), 'January 1, 2013');
});

test('rfc822 produces a UTC date string', () => {
  assert.equal(rfc822('2026-10-07'), 'Wed, 07 Oct 2026 12:00:00 GMT');
});

test('SITE_URL has no trailing slash', () => {
  assert.equal(SITE_URL, 'https://justthetipp.com');
});
