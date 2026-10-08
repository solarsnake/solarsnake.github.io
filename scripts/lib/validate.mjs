import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const { validatePosts } = require('../../assets/js/post-rules.js');

const nonEmpty = v => typeof v === 'string' && v.trim() !== '';

export function validateProfile(p) {
  if (!p || typeof p !== 'object') return ['data/profile.json: must be an object'];
  const errors = [];
  if (!nonEmpty(p.name)) errors.push('data/profile.json: name is required');
  if (!nonEmpty(p.headline)) errors.push('data/profile.json: headline is required');
  if (!nonEmpty(p.contact?.email)) errors.push('data/profile.json: contact.email is required');
  if (!Array.isArray(p.experience) || p.experience.length === 0) errors.push('data/profile.json: experience must be a non-empty array');
  if (!p.skills || typeof p.skills !== 'object' || Object.keys(p.skills).length === 0) errors.push('data/profile.json: skills must be a non-empty object');
  (p.ai?.featured || []).forEach((f, i) => {
    if (f.link !== undefined && !/^https:\/\//.test(f.link)) errors.push(`data/profile.json: ai.featured[${i}].link must start with https://`);
  });
  return errors;
}
