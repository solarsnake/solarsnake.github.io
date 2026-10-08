import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const BF = createRequire(import.meta.url)('../assets/js/blog-filter.js');
const posts = [
  { slug: 't1', title: 'Agents in Ops', date: '2026-09-01', excerpt: 'claude skills', content: 'body', tags: ['ai', 'devops'], section: 'tech', published: true },
  { slug: 't2', title: 'Terraform Tips', date: '2026-10-01', excerpt: 'iac', content: 'modules', tags: ['iac'], section: 'tech', published: true },
  { slug: 's1', title: 'Freedom', date: '2016-03-02', excerpt: 'poem', content: 'empty', tags: ['philosophy'], section: 'sheep', published: true },
  { slug: 'd1', title: 'Draft', date: '2026-10-05', excerpt: '', content: '', tags: ['ai'], section: 'tech', published: false },
];

test('parseListingParams defaults and validates', () => {
  assert.deepEqual(BF.parseListingParams(''), { section: 'tech', tag: 'all' });
  assert.deepEqual(BF.parseListingParams('?section=sheep&tag=philosophy'), { section: 'sheep', tag: 'philosophy' });
  assert.deepEqual(BF.parseListingParams('?section=bogus'), { section: 'tech', tag: 'all' });
});

test('filterPosts scopes to section, drops drafts, sorts newest first', () => {
  assert.deepEqual(BF.filterPosts(posts, { section: 'tech' }).map(p => p.slug), ['t2', 't1']);
  assert.deepEqual(BF.filterPosts(posts, { section: 'sheep' }).map(p => p.slug), ['s1']);
});

test('filterPosts by tag and case-insensitive query across fields', () => {
  assert.deepEqual(BF.filterPosts(posts, { section: 'tech', tag: 'ai' }).map(p => p.slug), ['t1']);
  assert.deepEqual(BF.filterPosts(posts, { section: 'tech', query: 'MODULES' }).map(p => p.slug), ['t2']);
  assert.deepEqual(BF.filterPosts(posts, { section: 'tech', query: 'devops' }).map(p => p.slug), ['t1']);
  assert.deepEqual(BF.filterPosts(posts, { section: 'tech', query: 'nothing-matches' }), []);
});

test('tagsFor only returns tags from published posts in the section', () => {
  assert.deepEqual(BF.tagsFor(posts, 'tech'), ['ai', 'devops', 'iac']);
  assert.deepEqual(BF.tagsFor(posts, 'sheep'), ['philosophy']);
});

test('hashRedirect maps legacy #slug links', () => {
  assert.equal(BF.hashRedirect('#s1', posts), '/blog/s1/');
  assert.equal(BF.hashRedirect('#d1', posts), null);
  assert.equal(BF.hashRedirect('#nope', posts), null);
  assert.equal(BF.hashRedirect('', posts), null);
});
