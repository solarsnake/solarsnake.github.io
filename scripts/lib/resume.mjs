import { escapeHtml as e } from './util.mjs';

export const BLOCK_NAMES = ['about', 'ai', 'skills', 'experience', 'education'];

function about(p) {
  const cards = (p.highlights || []).map(h =>
    `<div class="about-card"><h3>${e(h.title)}</h3><p>${e(h.text)}</p></div>`).join('\n');
  return `<p class="about-headline">${e(p.headline)}</p>
<p class="about-background">${e(p.background)}</p>
<p class="about-summary">${e(p.summary)}</p>
<div class="about-cards">
${cards}
</div>`;
}

function ai(p) {
  const cards = (p.ai?.featured || []).map(f => {
    const tags = (f.tags || []).map(t => `<span>#${e(t)}</span>`).join(' ');
    const link = f.link
      ? `<a class="ai-link" href="${e(f.link)}" target="_blank" rel="noopener">${e(f.link.replace(/^https:\/\//, ''))} ↗</a>`
      : '';
    return `<article class="ai-card">
  <div class="ai-context">${e(f.context)}</div>
  <h3>${e(f.title)}</h3>
  <p>${e(f.text)}</p>
  <div class="ai-tags">${tags}</div>
  ${link}
</article>`;
  }).join('\n');
  return `<p class="ai-intro">${e(p.ai?.intro)}</p>
<div class="ai-grid">
${cards}
</div>`;
}

function skills(p) {
  return Object.entries(p.skills).map(([cat, list]) => {
    const tags = list.map(s =>
      `<button class="skill-tag" type="button" data-skill="${e(s)}">${e(s)}</button>`).join('');
    return `<div class="skill-category"><div class="skill-category-name">${e(cat)}</div><div class="skill-tags">${tags}</div></div>`;
  }).join('\n');
}

function experience(p) {
  return p.experience.map(exp => {
    const roles = exp.roles.map(role => {
      const summary = role.summary ? `<li class="role-summary">${e(role.summary)}</li>` : '';
      const details = role.details.map(d => `<li class="experience-detail">${e(d)}</li>`).join('');
      const note = role.note ? `<div class="role-note">${e(role.note)}</div>` : '';
      return `<div class="role-item">
  <div class="role-header" role="button" tabindex="0" aria-expanded="false">
    <div><div class="role-title">${e(role.title)}</div><div class="role-duration">${e(role.duration)}</div>${note}</div>
    <span class="role-chevron">▾</span>
  </div>
  <div class="role-content"><ul class="role-details">${summary}${details}</ul></div>
</div>`;
    }).join('\n');
    return `<div class="timeline-company">
<div class="company-name">${e(exp.company)}</div>
<div class="company-meta">${e(exp.location)} · ${e(exp.duration)}</div>
${roles}
</div>`;
  }).join('\n');
}

function education(p) {
  const ed = p.education;
  return `<div class="education-card">
  <h3>${e(ed.school)}</h3>
  <p class="degree">${e(ed.degree)} · ${e(ed.year)}</p>
  <p class="award">${e(ed.award)}</p>
</div>`;
}

export function renderResumeBlocks(p) {
  return { about: about(p), ai: ai(p), skills: skills(p), experience: experience(p), education: education(p) };
}

export function injectBlocks(html, blocks) {
  let out = html;
  for (const [name, content] of Object.entries(blocks)) {
    const re = new RegExp(`(<!-- build:${name} -->)[\\s\\S]*?(<!-- /build:${name} -->)`);
    if (!re.test(out)) throw new Error(`missing build marker: ${name}`);
    out = out.replace(re, (_m, open, close) => `${open}${content}${close}`);
  }
  return out;
}
