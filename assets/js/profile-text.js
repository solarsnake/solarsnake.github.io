/* Terminal text built from data/profile.json, posts and build info (window.ProfileText; Node require in tests). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ProfileText = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const RULE = '─';

  function escapeBrackets(s) {
    return String(s ?? '').replace(/\[/g, '&#91;').replace(/\]/g, '&#93;');
  }

  function aboutText(p) {
    return [
      `${p.name} — ${p.headline}`,
      RULE.repeat(55),
      '',
      p.summary,
      '',
      p.background,
      '',
      'Highlights',
      ...(p.highlights || []).map(h => `  • ${h.title} — ${h.text}`),
      '',
      "Type 'skills' for the full skill matrix.",
      "Type 'ai'     for AI work.",
      "Type 'resume' to open the interactive resume.",
    ].join('\n');
  }

  function resumeMarkdown(p) {
    const roles = p.experience.flatMap(exp =>
      exp.roles.map(r => `- **${exp.company}** — ${r.title} (${r.duration})`));
    return [
      `# ${p.name} — Resume`,
      '',
      "> Type 'resume' for the full interactive resume.",
      '',
      '## Summary',
      p.summary,
      '',
      '## Experience',
      ...roles,
      '',
      '## Background',
      p.background,
      '',
    ].join('\n');
  }

  function contactText(p) {
    return [
      'Contact',
      RULE.repeat(30),
      `Email     ${p.contact.email}`,
      `GitHub    ${p.contact.github.replace(/^https:\/\//, '')}`,
      `LinkedIn  ${p.contact.linkedin.replace(/^https:\/\//, '')}`,
      '',
      'Open to opportunities, collaboration, or just connecting.',
    ].join('\n');
  }

  function skillsLines(p) {
    const lines = [`[[b;#00FF00;]${escapeBrackets(p.name)} — Skill Matrix]`, `[[;#555;]${RULE.repeat(40)}]`];
    Object.entries(p.skills).forEach(([cat, items]) => {
      lines.push('', `  [[b;#00FFCC;]${escapeBrackets(cat)}]`);
      lines.push(`    ${items.map(escapeBrackets).join(' [[;#006600;]·] ')}`);
    });
    lines.push('');
    return lines;
  }

  function aiLines(p) {
    const lines = [`[[b;#00FF00;]AI work]`, `[[;#555;]${RULE.repeat(40)}]`, escapeBrackets(p.ai.intro)];
    p.ai.featured.forEach(f => {
      lines.push('', `  [[b;#00FFCC;]${escapeBrackets(f.title)}]  [[;#008800;]${escapeBrackets(f.context)}]`);
      lines.push(`  ${escapeBrackets(f.text)}`);
      if (f.tags && f.tags.length) lines.push(`  [[;#006600;]${f.tags.map(t => '#' + escapeBrackets(t)).join(' ')}]`);
      if (f.link) lines.push(`  [[!;;;;${f.link}]${escapeBrackets(f.link)}]`);
    });
    lines.push('', `  More: [[!;;;;/resume.html#ai]/resume.html#ai]`, '');
    return lines;
  }

  function neofetchInfo(p, { host, uptime }) {
    const kv = (k, v) => `[[b;#00FF00;]${k}][[;#aaa;]:] ${escapeBrackets(v)}`;
    return [
      `[[b;#00FF00;]tippens][[;#AAAAAA;]@][[b;#00FF00;]portfolio]`,
      `[[;#444;]${RULE.repeat(22)}]`,
      kv('OS', 'Cloud Native Linux'),
      kv('Host', host),
      kv('Role', p.headline),
      kv('Shell', 'jQuery Terminal 2.44.1'),
      kv('Stack', (p.featuredSkills || []).slice(0, 5).join(' · ')),
      kv('AI', (p.skills['AI Tooling'] || []).join(' · ')),
      kv('Languages', (p.skills.Languages || []).join(' · ')),
      kv('Uptime', uptime),
      '',
      `[[b;#000;#00FF00;]   ][[b;#000;#00CC00;]   ][[b;#000;#009900;]   ][[b;#000;#006600;]   ][[b;#000;#003300;]   ]`,
    ];
  }

  function latestPosts(data, n = 3) {
    if (!data || !Array.isArray(data.posts)) return [];
    const pub = data.posts.filter(x => x.published === true)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const tech = pub.filter(x => x.section === 'tech');
    return (tech.length ? tech : pub).slice(0, n).map(({ title, date, slug }) => ({ title, date, slug }));
  }

  function gitLogLines(build) {
    if (!build || !Array.isArray(build.commits) || build.commits.length === 0) return ['git log: history unavailable'];
    return build.commits.map(c => `commit ${escapeBrackets(c.sha)}  [[;#008800;]${escapeBrackets(c.subject)}]`);
  }

  const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  // Resolve `read <n|slug>`: n indexes the last `posts` listing; a slug must be a published post.
  function resolveRead(data, listing, arg) {
    const a = String(arg ?? '').trim();
    if (!a) return { error: "usage: read <n|slug> — run 'posts' to list posts" };
    if (/^\d+$/.test(a)) {
      if (!listing || !listing.length) return { error: "read: run 'posts' first, then read <n>" };
      const n = Number(a);
      if (n < 1 || n > listing.length) return { error: `read: no post #${n} (choose 1–${listing.length})` };
      return { slug: listing[n - 1].slug };
    }
    const slug = a.toLowerCase();
    const known = !!data && Array.isArray(data.posts) && data.posts.some(p => p.published === true && p.slug === slug);
    if (!SLUG_RE.test(slug) || !known) return { error: `read: no post named '${a}'` };
    return { slug };
  }

  return { resolveRead, escapeBrackets, aboutText, resumeMarkdown, contactText, skillsLines, aiLines, neofetchInfo, latestPosts, gitLogLines };
});
