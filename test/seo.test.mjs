import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { OG_IMAGE, jsonLdScript, personJsonLd, blogPostingJsonLd } from '../scripts/lib/seo.mjs';

const profile = JSON.parse(readFileSync(new URL('../data/profile.json', import.meta.url)));

test('personJsonLd describes the profile without private data', () => {
  const p = personJsonLd(profile);
  assert.equal(p['@context'], 'https://schema.org');
  assert.equal(p['@type'], 'Person');
  assert.equal(p.name, 'Timothy M. Tippens');
  assert.equal(p.alternateName, 'Timothy Tippens');
  assert.equal(p.url, 'https://justthetipp.com/');
  assert.equal(p.image, OG_IMAGE);
  assert.equal(p.jobTitle, 'Senior Production Services Engineer');
  assert.deepEqual(p.worksFor, { '@type': 'Organization', name: 'ServiceNow' });
  assert.deepEqual(p.alumniOf, { '@type': 'CollegeOrUniversity', name: 'University of North Carolina at Chapel Hill' });
  assert.deepEqual(p.address, { '@type': 'PostalAddress', addressLocality: 'San Diego', addressRegion: 'CA', addressCountry: 'US' });
  assert.deepEqual(p.sameAs, ['https://github.com/solarsnake', 'https://linkedin.com/in/timothytippens']);
  assert.ok(p.knowsAbout.includes('Kubernetes'));
  assert.ok(!JSON.stringify(p).includes('@proton.me'), 'email must not be in structured data');
});

test('personJsonLd tolerates a minimal profile', () => {
  const p = personJsonLd({ name: 'A B', headline: 'h', contact: { email: 'x@y.z' }, experience: [], skills: { X: ['y'] } });
  assert.equal(p.name, 'A B');
  for (const k of ['worksFor', 'jobTitle', 'alumniOf', 'address', 'sameAs']) assert.ok(!(k in p), `${k} should be omitted`);
});

test('blogPostingJsonLd', () => {
  const post = { slug: 'a-b', title: 'T "q"', date: '2026-10-08', excerpt: 'e', tags: ['ai', 'ops'], content: '', published: true, section: 'tech' };
  const b = blogPostingJsonLd(post, 'Timothy M. Tippens');
  assert.equal(b['@type'], 'BlogPosting');
  assert.equal(b.headline, 'T "q"');
  assert.equal(b.datePublished, '2026-10-08');
  assert.equal(b.url, 'https://justthetipp.com/blog/a-b/');
  assert.equal(b.mainEntityOfPage, 'https://justthetipp.com/blog/a-b/');
  assert.deepEqual(b.author, { '@type': 'Person', name: 'Timothy M. Tippens', url: 'https://justthetipp.com/' });
  assert.equal(b.keywords, 'ai, ops');
  assert.equal(b.image, OG_IMAGE);
});

test('jsonLdScript cannot be broken out of', () => {
  const html = jsonLdScript({ headline: '</script><script>alert(1)</script>' });
  assert.equal((html.match(/<\/script>/g) || []).length, 1);
  assert.ok(html.startsWith('<script type="application/ld+json">'));
  const json = html.slice('<script type="application/ld+json">'.length, -'</script>'.length);
  assert.equal(JSON.parse(json).headline, '</script><script>alert(1)</script>');
});
