import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateProfile, validatePosts } from '../scripts/lib/validate.mjs';

const profile = JSON.parse(readFileSync(new URL('../data/profile.json', import.meta.url)));
const posts = JSON.parse(readFileSync(new URL('../posts/index.json', import.meta.url)));
const good = { slug: 'ok-post', title: 'OK', date: '2026-10-07', excerpt: '', tags: [], content: 'x', published: true, section: 'tech' };

test('real data files are valid', () => {
  assert.deepEqual(validateProfile(profile), []);
  assert.deepEqual(validatePosts(posts), []);
});

test('profile: missing name, empty experience, bad link', () => {
  const p = structuredClone(profile);
  delete p.name; p.experience = []; p.ai.featured[0].link = 'http://insecure.example';
  const errs = validateProfile(p).join('\n');
  assert.match(errs, /name/);
  assert.match(errs, /experience/);
  assert.match(errs, /https:\/\//);
});

test('posts: top-level shape', () => {
  assert.match(validatePosts({}).join(), /posts/);
});

test('posts: each rule rejects and names the slug', () => {
  const cases = [
    [{ slug: 'Bad Slug' }, /slug/],
    [{ title: '  ' }, /title/],
    [{ date: '2026-02-30' }, /date/],
    [{ date: '10/07/2026' }, /date/],
    [{ section: 'blog' }, /section/],
    [{ published: 'yes' }, /published/],
    [{ tags: 'ai' }, /tags/],
    [{ tags: ['ok', 3] }, /tags/],
    [{ content: undefined }, /content/],
    [{ excerpt: 5 }, /excerpt/],
  ];
  for (const [patch, re] of cases) {
    const errs = validatePosts({ posts: [{ ...good, ...patch }] });
    assert.equal(errs.length, 1, `expected 1 error for ${JSON.stringify(patch)}, got ${errs}`);
    assert.match(errs[0], re);
  }
});

test('posts: duplicate slug across drafts is rejected', () => {
  const errs = validatePosts({ posts: [good, { ...good, published: false }] });
  assert.equal(errs.length, 1);
  assert.match(errs[0], /duplicate slug/);
  assert.match(errs[0], /ok-post/);
});
