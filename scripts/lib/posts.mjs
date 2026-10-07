import { createRequire } from 'node:module';
import { marked } from 'marked';
import { SITE_URL, escapeHtml, formatDate, rfc822 } from './util.mjs';

const require = createRequire(import.meta.url);
const { SECTION_LABELS } = require('../../assets/js/post-rules.js');

const NAV_LINKS = [
  ['/', '~/terminal'],
  ['/resume.html', '~/resume'],
  ['/resume.html#ai', '~/ai'],
  ['/blog/', '~/blog'],
  ['/contact.html', '~/contact'],
];

export function publishedPosts(posts) {
  return posts
    .filter(p => p.published === true)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function postUrl(slug) {
  return `${SITE_URL}/blog/${slug}/`;
}

export function neighbors(published, post) {
  const same = published.filter(p => p.section === post.section);
  const i = same.findIndex(p => p.slug === post.slug);
  return {
    newer: i > 0 ? same[i - 1] : null,
    older: i >= 0 && i < same.length - 1 ? same[i + 1] : null,
  };
}

function navHtml() {
  const links = NAV_LINKS.map(([href, label]) =>
    `<li><a href="${href}"${href === '/blog/' ? ' class="active"' : ''}>${label}</a></li>`).join('\n        ');
  return `<nav class="site-nav">
    <div class="brand">tippens@portfolio<span>:/blog</span>$</div>
    <ul class="nav-links">
        ${links}
    </ul>
</nav>`;
}

export function renderPostPage(post, { newer = null, older = null } = {}) {
  const t = escapeHtml(post.title);
  const ex = escapeHtml(post.excerpt);
  const url = postUrl(post.slug);
  const label = escapeHtml(SECTION_LABELS[post.section]);
  const section = encodeURIComponent(post.section);
  const tags = (post.tags || []).map(tag =>
    `<a class="post-tag" href="/blog/?section=${section}&amp;tag=${encodeURIComponent(tag)}">#${escapeHtml(tag)}</a>`).join(' ');
  const pager = [
    newer ? `<a class="pager-newer" href="/blog/${escapeHtml(newer.slug)}/">← ${escapeHtml(newer.title)}</a>` : '<span></span>',
    older ? `<a class="pager-older" href="/blog/${escapeHtml(older.slug)}/">${escapeHtml(older.title)} →</a>` : '<span></span>',
  ].join('\n        ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t} — tippens@portfolio</title>
    <meta name="description" content="${ex}">
    <link rel="canonical" href="${url}">
    <link rel="alternate" type="application/rss+xml" title="tippens@portfolio — Tech &amp; AI" href="/feed.xml">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${t}">
    <meta property="og:description" content="${ex}">
    <meta property="og:url" content="${url}">
    <meta property="og:site_name" content="tippens@portfolio">
    <meta property="article:published_time" content="${escapeHtml(post.date)}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${t}">
    <meta name="twitter:description" content="${ex}">
    <link rel="stylesheet" href="/blog/post.css">
</head>
<body>
${navHtml()}
<main class="post-wrap">
    <a class="back-link" href="/blog/?section=${section}">← all posts</a>
    <header class="post-header">
        <div class="post-meta">${escapeHtml(formatDate(post.date))} · <span class="section-label">${label}</span></div>
        <h1 class="post-title">${t}</h1>
        <div class="post-tags">${tags}</div>
    </header>
    <article class="md-content">
${marked.parse(post.content || '')}
    </article>
    <nav class="post-pager">
        ${pager}
    </nav>
</main>
</body>
</html>
`;
}

function cdataSafe(s) {
  return s.replace(/]]>/g, ']]]]><![CDATA[>');
}

export function renderFeed(published) {
  const items = published.filter(p => p.section === 'tech').map(p => `    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${postUrl(p.slug)}</link>
      <guid isPermaLink="true">${postUrl(p.slug)}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <description>${escapeHtml(p.excerpt)}</description>
      <content:encoded><![CDATA[${cdataSafe(marked.parse(p.content || ''))}]]></content:encoded>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>tippens@portfolio — Tech &amp; AI</title>
    <link>${SITE_URL}/blog/</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Writing on cloud infrastructure, DevOps and AI by Timothy Tippens.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>
`;
}

export function renderSitemap(published) {
  const staticUrls = ['/', '/resume.html', '/blog/', '/contact.html']
    .map(u => `  <url><loc>${SITE_URL}${u}</loc></url>`);
  const postUrls = published.map(p => `  <url><loc>${postUrl(p.slug)}</loc><lastmod>${p.date}</lastmod></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...postUrls].join('\n')}
</urlset>
`;
}
