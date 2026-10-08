import test from 'node:test';
import assert from 'node:assert/strict';
import { XMLValidator } from 'fast-xml-parser';
import { publishedPosts, neighbors, renderPostPage, renderFeed, renderSitemap, postUrl } from '../scripts/lib/posts.mjs';

const fixture = [
  { slug: 'old-tech', title: 'Old Tech', date: '2026-01-01', excerpt: 'old', tags: [], content: 'old body', published: true, section: 'tech' },
  { slug: 'essay', title: 'Essay', date: '2015-01-01', excerpt: 'essay', tags: ['philosophy'], content: 'essay body', published: true, section: 'sheep' },
  { slug: 'new-tech', title: 'New <script>alert(1)</script> & "Stuff"', date: '2026-10-01', excerpt: 'He said "hi" & <b>left</b>', tags: ['ai', '<x>'], content: '# Hello\n\n<div>a ]]> b</div>\n', published: true, section: 'tech' },
  { slug: 'secret-draft', title: 'Draft', date: '2026-10-05', excerpt: 'draft', tags: [], content: 'draft body', published: false, section: 'tech' },
];
const published = publishedPosts(fixture);
const newTech = published.find(p => p.slug === 'new-tech');

test('publishedPosts drops drafts and sorts newest first', () => {
  assert.deepEqual(published.map(p => p.slug), ['new-tech', 'old-tech', 'essay']);
});

test('neighbors stay within the section', () => {
  assert.deepEqual(neighbors(published, newTech), { newer: null, older: published[1] });
  const essay = published.find(p => p.slug === 'essay');
  assert.deepEqual(neighbors(published, essay), { newer: null, older: null });
});

test('postUrl is absolute with trailing slash', () => {
  assert.equal(postUrl('a-b'), 'https://justthetipp.com/blog/a-b/');
});

test('renderPostPage escapes metadata and renders markdown', () => {
  const html = renderPostPage(newTech, neighbors(published, newTech));
  assert.ok(!html.includes('<script>alert(1)</script>'), 'raw script tag leaked');
  assert.ok(html.includes('New &lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;Stuff&quot;'));
  assert.ok(html.includes('content="He said &quot;hi&quot; &amp; &lt;b&gt;left&lt;/b&gt;"'));
  assert.ok(html.includes('#&lt;x&gt;'));
  assert.ok(html.includes('<link rel="canonical" href="https://justthetipp.com/blog/new-tech/">'));
  assert.ok(html.includes('<meta property="og:type" content="article">'));
  assert.ok(html.includes('<meta property="og:url" content="https://justthetipp.com/blog/new-tech/">'));
  assert.ok(html.includes('<meta property="article:published_time" content="2026-10-01">'));
  assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image">'));
  assert.ok(html.includes('<meta property="og:image" content="https://justthetipp.com/assets/img/og-card.png">'));
  assert.ok(html.includes('<time datetime="2026-10-01">'));
  assert.ok(html.includes(' — Timothy Tippens</title>'));
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
  assert.equal(ld.length, 1, 'exactly one JSON-LD script');
  const parsed = JSON.parse(ld[0].replace(/^<script[^>]*>|<\/script>$/g, ''));
  assert.equal(parsed['@type'], 'BlogPosting');
  assert.equal(parsed.headline, newTech.title);
  assert.ok(html.includes('<link rel="stylesheet" href="/blog/post.css">'));
  assert.ok(html.includes('<link rel="stylesheet" href="/assets/css/focus.css">'));
  assert.ok(html.includes('<a class="skip-link" href="#main">skip to content</a>'));
  assert.ok(html.includes('<main class="post-wrap" id="main" tabindex="-1">'));
  assert.match(html, /<h1[^>]*>Hello<\/h1>/);
  assert.ok(html.includes('href="/blog/old-tech/"'), 'older link missing');
  assert.ok(html.includes('Tech &amp; AI'));
  assert.ok(html.includes('href="/resume.html#ai"'), 'shared nav missing ~/ai');
});

test('renderFeed is well-formed, tech-only, absolute links, survives ]]>', () => {
  const xml = renderFeed(published);
  assert.equal(XMLValidator.validate(xml), true);
  assert.ok(xml.includes('<link>https://justthetipp.com/blog/new-tech/</link>'));
  assert.ok(xml.includes('<link>https://justthetipp.com/blog/old-tech/</link>'));
  assert.ok(!xml.includes('/blog/essay/'));
  assert.ok(!xml.includes('secret-draft'));
  assert.ok(xml.includes('<pubDate>Thu, 01 Oct 2026 12:00:00 GMT</pubDate>'));
});

test('renderFeed with no posts is still valid', () => {
  assert.equal(XMLValidator.validate(renderFeed([])), true);
});

test('renderSitemap lists static pages and every published post', () => {
  const xml = renderSitemap(published);
  assert.equal(XMLValidator.validate(xml), true);
  for (const u of ['/', '/resume.html', '/blog/', '/contact.html']) assert.ok(xml.includes(`<loc>https://justthetipp.com${u}</loc>`));
  for (const p of published) assert.ok(xml.includes(`<loc>${postUrl(p.slug)}</loc>`));
  assert.ok(!xml.includes('secret-draft'));
});
