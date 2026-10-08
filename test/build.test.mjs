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
  const keyboardPages = ['resume.html', 'contact.html', '404.html', 'blog/index.html',
    ...published.map(p => `blog/${p.slug}/index.html`)];
  for (const f of keyboardPages) {
    const html = await readFile(path.join(out, f), 'utf8');
    assert.ok(html.includes('/assets/css/focus.css'), `${f} missing focus.css`);
    assert.ok(html.includes('class="skip-link" href="#main"'), `${f} missing skip link`);
    assert.ok(/id="main"/.test(html), `${f} missing #main target`);
  }
  assert.ok((await readFile(path.join(out, 'admin/index.html'), 'utf8')).includes('/assets/css/focus.css'));
  assert.ok(existsSync(path.join(out, 'assets/css/focus.css')));

  const buildInfo = JSON.parse(await readFile(path.join(out, 'data/build.json'), 'utf8'));
  assert.ok(Array.isArray(buildInfo.commits));
  assert.ok(typeof buildInfo.builtAt === 'string');

  for (const f of await walk(out)) {
    const text = await readFile(f, 'utf8').catch(() => '');
    assert.ok(!/919\.491|424\.253|timothy\.tippens@gmail/i.test(text), `private contact info in ${f}`);
  }
});

test('SEO head tags, canonicals, JSON-LD and images', async (t) => {
  const out = await mkdtemp(path.join(tmpdir(), 'site-'));
  t.after(() => rm(out, { recursive: true, force: true }));
  await build({ root, out });

  const pages = {
    'index.html':      'https://justthetipp.com/',
    'resume.html':     'https://justthetipp.com/resume.html',
    'blog/index.html': 'https://justthetipp.com/blog/',
    'contact.html':    'https://justthetipp.com/contact.html',
  };
  const count = (html, re) => (html.match(re) || []).length;
  for (const [f, canonical] of Object.entries(pages)) {
    const html = await readFile(path.join(out, f), 'utf8');
    assert.match(html, /<title>[^<]*Timothy Tippens[^<]*<\/title>/, `${f} title`);
    const desc = html.match(/<meta name="description" content="([^"]*)">/);
    assert.ok(desc && desc[1].length >= 100 && desc[1].length <= 170, `${f} description length`);
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `${f} canonical`);
    for (const re of [/property="og:title"/g, /property="og:description"/g, /property="og:image"/g, /rel="canonical"/g, /name="description"/g, /name="twitter:card"/g]) {
      assert.equal(count(html, re), 1, `${f} has duplicate/missing ${re}`);
    }
    assert.ok(html.includes('<meta property="og:image" content="https://justthetipp.com/assets/img/og-card.png">'), `${f} og:image`);
    assert.ok(html.includes('content="summary_large_image"'), `${f} twitter card`);
    assert.ok(html.includes('href="/assets/img/favicon.svg"'), `${f} favicon`);
  }
  for (const f of ['index.html', 'resume.html']) {
    const html = await readFile(path.join(out, f), 'utf8');
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(m, `${f} JSON-LD`);
    assert.equal(JSON.parse(m[1])['@type'], 'Person');
  }
  const notFound = await readFile(path.join(out, '404.html'), 'utf8');
  assert.ok(notFound.includes('<meta name="robots" content="noindex">'));
  assert.ok(!notFound.includes('rel="canonical"'));
  for (const img of ['og-card.png', 'favicon.svg', 'favicon-48.png', 'apple-touch-icon.png']) {
    assert.ok(existsSync(path.join(out, 'assets/img', img)), `missing ${img} in _site`);
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
