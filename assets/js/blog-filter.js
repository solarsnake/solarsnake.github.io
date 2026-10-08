/* Blog listing filtering helpers (window.BlogFilter; Node require in tests). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BlogFilter = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const SECTIONS = ['tech', 'sheep'];

  function parseListingParams(search) {
    const q = new URLSearchParams(search || '');
    const section = q.get('section');
    return { section: SECTIONS.includes(section) ? section : 'tech', tag: q.get('tag') || 'all' };
  }

  function inSection(posts, section) {
    return posts.filter(p => p.published === true && p.section === section);
  }

  function tagsFor(posts, section) {
    const tags = new Set();
    inSection(posts, section).forEach(p => (p.tags || []).forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }

  function filterPosts(posts, { section, tag = 'all', query = '' }) {
    const q = query.trim().toLowerCase();
    return inSection(posts, section)
      .filter(p => tag === 'all' || (p.tags || []).includes(tag))
      .filter(p => !q || [p.title, p.excerpt, p.content, ...(p.tags || [])]
        .some(f => String(f || '').toLowerCase().includes(q)))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function hashRedirect(hash, posts) {
    const slug = String(hash || '').replace(/^#/, '');
    if (!slug) return null;
    return posts.some(p => p.slug === slug && p.published === true) ? `/blog/${slug}/` : null;
  }

  return { SECTIONS, parseListingParams, tagsFor, filterPosts, hashRedirect };
});
