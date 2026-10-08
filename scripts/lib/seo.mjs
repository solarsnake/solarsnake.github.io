import { SITE_URL, postUrl } from './util.mjs';

export const OG_IMAGE = `${SITE_URL}/assets/img/og-card.png`;

export function jsonLdScript(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
}

export function personJsonLd(p) {
  const out = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    alternateName: p.name.replace(/ [A-Z]\. /, ' '),
    url: `${SITE_URL}/`,
    image: OG_IMAGE,
    description: p.headline,
  };
  const current = p.experience?.[0];
  if (current?.roles?.[0]?.title) out.jobTitle = current.roles[0].title;
  if (current?.company) out.worksFor = { '@type': 'Organization', name: current.company };
  if (p.education?.school) out.alumniOf = { '@type': 'CollegeOrUniversity', name: p.education.school };
  const [city, region] = String(p.location || '').split(',').map(s => s.trim());
  if (city && region) out.address = { '@type': 'PostalAddress', addressLocality: city, addressRegion: region, addressCountry: 'US' };
  const sameAs = [p.contact?.github, p.contact?.linkedin].filter(Boolean);
  if (sameAs.length) out.sameAs = sameAs;
  out.knowsAbout = p.featuredSkills || Object.values(p.skills || {}).flat().slice(0, 9);
  return out;
}

export function blogPostingJsonLd(post, authorName) {
  const url = postUrl(post.slug);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    url,
    mainEntityOfPage: url,
    author: { '@type': 'Person', name: authorName, url: `${SITE_URL}/` },
    image: OG_IMAGE,
    keywords: (post.tags || []).join(', '),
    inLanguage: 'en-US',
  };
}
