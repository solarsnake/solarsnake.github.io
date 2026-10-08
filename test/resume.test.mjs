import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderResumeBlocks, injectBlocks, BLOCK_NAMES } from '../scripts/lib/resume.mjs';

const profile = JSON.parse(readFileSync(new URL('../data/profile.json', import.meta.url)));
const resumeHtml = readFileSync(new URL('../resume.html', import.meta.url), 'utf8');
const blocks = renderResumeBlocks(profile);

test('renders every block', () => {
  assert.deepEqual(Object.keys(blocks).sort(), [...BLOCK_NAMES].sort());
});

test('content reflects the current resume', () => {
  assert.ok(blocks.experience.includes('ServiceNow'));
  assert.ok(blocks.experience.includes('Senior Production Services Engineer'));
  assert.ok(blocks.experience.includes('2017 – 2025'));
  assert.ok(!blocks.experience.includes('2017 – Present'));
  assert.ok(blocks.experience.includes('NIST compliance'));
  assert.ok(blocks.about.includes('16+'));
  assert.ok(blocks.about.includes('Current DoD CAC holder'));
  assert.ok(blocks.ai.includes('kube-yaml-scrub'));
  assert.ok(blocks.ai.includes('href="https://github.com/solarsnake/kube-yaml-scrub"'));
  assert.ok(!/SageMaker|MLflow|Vertex|Pinecone|Weaviate/.test(Object.values(blocks).join('')));
  assert.ok(blocks.skills.includes('data-skill="Digital.ai"'));
  assert.match(blocks.skills, /<div class="skill-category ai-category"><div class="skill-category-name">AI Tooling<\/div>/);
  assert.equal((blocks.skills.match(/ai-category/g) || []).length, 1);
});

test('escapes profile values', () => {
  const p = structuredClone(profile);
  p.headline = '<img src=x onerror=alert(1)>';
  p.skills = { 'A&B': ['x"y'] };
  const b = renderResumeBlocks(p);
  assert.ok(b.about.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(b.skills.includes('A&amp;B'));
  assert.ok(b.skills.includes('data-skill="x&quot;y"'));
});

test('injectBlocks replaces between markers and keeps them', () => {
  const html = 'a<!-- build:about -->OLD<!-- /build:about -->b';
  assert.equal(injectBlocks(html, { about: 'NEW' }), 'a<!-- build:about -->NEW<!-- /build:about -->b');
  assert.throws(() => injectBlocks('nothing here', { about: 'x' }), /missing build marker: about/);
});

test('injectBlocks handles $ in content literally', () => {
  const html = '<!-- build:about -->x<!-- /build:about -->';
  assert.equal(injectBlocks(html, { about: 'cost $& $1' }), '<!-- build:about -->cost $& $1<!-- /build:about -->');
});

test('real resume.html has every marker and no placeholder after injection', () => {
  const out = injectBlocks(resumeHtml, blocks);
  for (const name of BLOCK_NAMES) assert.ok(out.includes(`<!-- build:${name} -->`));
  assert.ok(!out.includes('build-placeholder'));
  assert.ok(out.includes('id="ai"'));
});
