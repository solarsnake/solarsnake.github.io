import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const PT = createRequire(import.meta.url)('../assets/js/profile-text.js');
const profile = JSON.parse(readFileSync(new URL('../data/profile.json', import.meta.url)));

test('escapeBrackets neutralizes jQuery Terminal formatting', () => {
  assert.equal(PT.escapeBrackets('[[b;red;]x]'), '&#91;&#91;b;red;&#93;x&#93;');
  assert.equal(PT.escapeBrackets(null), '');
});

test('aboutText reflects current profile', () => {
  const t = PT.aboutText(profile);
  assert.ok(t.includes(profile.headline));
  assert.ok(t.includes('16+'));
  assert.ok(t.includes('Current DoD CAC holder'));
  assert.ok(t.includes("Type 'ai'"));
});

test('skillsLines lists every category and no banned skills', () => {
  const t = PT.skillsLines(profile).join('\n');
  for (const cat of Object.keys(profile.skills)) assert.ok(t.includes(PT.escapeBrackets(cat)));
  assert.ok(!/SageMaker|MLflow|Vertex|Pinecone|Weaviate/.test(t));
});

test('aiLines includes featured items with links', () => {
  const t = PT.aiLines(profile).join('\n');
  assert.ok(t.includes('kube-yaml-scrub'));
  assert.ok(t.includes('[[!;;;;https://github.com/solarsnake/kube-yaml-scrub]'));
  assert.ok(t.includes('/resume.html#ai'));
});

test('neofetchInfo uses headline and AI tooling', () => {
  const t = PT.neofetchInfo(profile, { host: 'justthetipp.com', uptime: '5s' }).join('\n');
  assert.ok(t.includes(profile.headline));
  assert.ok(t.includes('Claude Code'));
  assert.ok(t.includes('justthetipp.com'));
  assert.ok(t.includes('5s'));
});

test('resumeMarkdown and contactText', () => {
  assert.ok(PT.resumeMarkdown(profile).includes('ServiceNow'));
  assert.ok(PT.contactText(profile).includes('solarsnake88@proton.me'));
});

test('latestPosts prefers tech, falls back, skips drafts, handles bad input', () => {
  const posts = { posts: [
    { slug: 'a', title: 'A', date: '2015-01-01', section: 'sheep', published: true },
    { slug: 'b', title: 'B', date: '2026-01-01', section: 'tech', published: true },
    { slug: 'c', title: 'C', date: '2026-02-01', section: 'tech', published: false },
  ] };
  assert.deepEqual(PT.latestPosts(posts), [{ title: 'B', date: '2026-01-01', slug: 'b' }]);
  const sheepOnly = { posts: [posts.posts[0]] };
  assert.deepEqual(PT.latestPosts(sheepOnly).map(p => p.slug), ['a']);
  assert.deepEqual(PT.latestPosts(null), []);
  assert.deepEqual(PT.latestPosts({}), []);
});

test('gitLogLines formats commits and degrades gracefully', () => {
  assert.deepEqual(PT.gitLogLines({ commits: [{ sha: 'abc1234', subject: 'fix [thing]' }] }),
    ['commit abc1234  [[;#008800;]fix &#91;thing&#93;]']);
  assert.deepEqual(PT.gitLogLines(null), ['git log: history unavailable']);
  assert.deepEqual(PT.gitLogLines({ commits: [] }), ['git log: history unavailable']);
});
