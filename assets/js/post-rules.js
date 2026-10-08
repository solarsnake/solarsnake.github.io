/* Post validation rules shared by scripts/build.mjs (Node require) and admin/index.html (window.PostRules). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PostRules = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const SECTIONS = ['tech', 'sheep'];
  const SECTION_LABELS = { tech: 'Tech & AI', sheep: 'Learning to Count Sheep' };

  function isValidDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(s + 'T00:00:00Z');
    return !isNaN(d) && d.toISOString().slice(0, 10) === s;
  }

  function validatePosts(data) {
    if (!data || !Array.isArray(data.posts)) return ['posts/index.json: top-level "posts" array is required'];
    const errors = [];
    const seen = new Set();
    data.posts.forEach((p, i) => {
      p = p || {};
      const id = `post[${i}] (${typeof p.slug === 'string' ? p.slug : 'no slug'})`;
      if (typeof p.slug !== 'string' || !SLUG_RE.test(p.slug)) errors.push(`${id}: slug must be lowercase words joined by hyphens`);
      else if (seen.has(p.slug)) errors.push(`${id}: duplicate slug "${p.slug}"`);
      else seen.add(p.slug);
      if (typeof p.title !== 'string' || !p.title.trim()) errors.push(`${id}: title is required`);
      if (!isValidDate(p.date)) errors.push(`${id}: date must be a valid YYYY-MM-DD`);
      if (!SECTIONS.includes(p.section)) errors.push(`${id}: section must be one of ${SECTIONS.join(', ')}`);
      if (!Array.isArray(p.tags) || !p.tags.every(t => typeof t === 'string')) errors.push(`${id}: tags must be an array of strings`);
      if (typeof p.published !== 'boolean') errors.push(`${id}: published must be true or false`);
      if (typeof p.content !== 'string') errors.push(`${id}: content must be a string`);
      if (typeof p.excerpt !== 'string') errors.push(`${id}: excerpt must be a string`);
    });
    return errors;
  }

  return { SLUG_RE, SECTIONS, SECTION_LABELS, isValidDate, validatePosts };
});
