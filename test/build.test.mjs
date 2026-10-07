import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../scripts/build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function walk(dir) {
  const out = [];
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}

test('full build of the real repo', async (t) => {
  const out = await mkdtemp(path.join(tmpdir(), 'site-'));
  t.after(() => rm(out, { recursive: true, force: true }));
  const result = await build({ root, out });

  const source = JSON.parse(await readFile(path.join(root, 'posts/index.json'), 'utf8')).posts;
  const published = source.filter(p => p.published === true);
  assert.equal(result.posts, published.length);
  for (const p of published) assert.ok(existsSync(path.join(out, 'blog', p.slug, 'index.html')), `missing page ${p.slug}`);
  for (const p of source.filter(p => p.published !== true)) assert.ok(!existsSync(path.join(out, 'blog', p.slug)), `draft page ${p.slug}`);

  const deployedPosts = JSON.parse(await readFile(path.join(out, 'posts/index.json'), 'utf8')).posts;
  assert.ok(deployedPosts.every(p => p.published === true), 'draft leaked into deployed posts/index.json');
  assert.equal(deployedPosts.length, published.length);

  for (const f of ['index.html', 'resume.html', 'contact.html', '404.html', 'robots.txt', 'feed.xml', 'sitemap.xml',
    'blog/index.html', 'blog/post.css', 'admin/index.html', 'data/profile.json', 'data/build.json',
    'assets/js/post-rules.js', 'assets/js/skill-match.js']) {
    assert.ok(existsSync(path.join(out, f)), `missing ${f}`);
  }
  for (const f of ['docs', 'scripts', 'test', 'node_modules', 'package.json', 'package-lock.json', '.github', 'README.md']) {
    assert.ok(!existsSync(path.join(out, f)), `should not deploy ${f}`);
  }

  const resume = await readFile(path.join(out, 'resume.html'), 'utf8');
  assert.ok(resume.includes('Senior Production Services Engineer'));
  assert.ok(!resume.includes('build-placeholder'));

  const buildInfo = JSON.parse(await readFile(path.join(out, 'data/build.json'), 'utf8'));
  assert.ok(Array.isArray(buildInfo.commits));
  assert.ok(typeof buildInfo.builtAt === 'string');

  for (const f of await walk(out)) {
    const text = await readFile(f, 'utf8').catch(() => '');
    assert.ok(!/919\.491|424\.253|timothy\.tippens@gmail/i.test(text), `private contact info in ${f}`);
  }
});

test('invalid posts fail the build and name the slug', async (t) => {
  const tmpRoot = await mkdtemp(path.join(tmpdir(), 'root-'));
  const out = path.join(tmpRoot, '_site');
  t.after(() => rm(tmpRoot, { recursive: true, force: true }));
  await cp(path.join(root, 'data'), path.join(tmpRoot, 'data'), { recursive: true });
  await cp(path.join(root, 'resume.html'), path.join(tmpRoot, 'resume.html'));
  await cp(path.join(root, 'assets'), path.join(tmpRoot, 'assets'), { recursive: true });
  await mkdir(path.join(tmpRoot, 'posts'));
  const p = { slug: 'dupe', title: 'T', date: '2026-10-07', excerpt: '', tags: [], content: 'x', published: true, section: 'tech' };
  await writeFile(path.join(tmpRoot, 'posts/index.json'), JSON.stringify({ posts: [p, p] }));
  await assert.rejects(build({ root: tmpRoot, out }), /duplicate slug "dupe"/);
  assert.ok(!existsSync(path.join(out, 'index.html')), 'nothing should be written on validation failure');
});

test('malformed JSON names the file', async (t) => {
  const tmpRoot = await mkdtemp(path.join(tmpdir(), 'root-'));
  t.after(() => rm(tmpRoot, { recursive: true, force: true }));
  await mkdir(path.join(tmpRoot, 'data'));
  await mkdir(path.join(tmpRoot, 'posts'));
  await writeFile(path.join(tmpRoot, 'data/profile.json'), '{ nope');
  await writeFile(path.join(tmpRoot, 'posts/index.json'), '{"posts":[]}');
  await assert.rejects(build({ root: tmpRoot, out: path.join(tmpRoot, '_site') }), /data\/profile\.json/);
});
