/* Literal, word-boundary skill matching for the resume skill filter (window.SkillMatch; Node require in tests). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SkillMatch = api;
})(typeof self !== 'undefined' ? self : this, function () {
  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function pattern(skill, flags) {
    return new RegExp(`(?<![\\w])(${escapeRegExp(skill)})(?![\\w])`, flags);
  }

  function matches(text, skill) {
    return pattern(skill, 'i').test(String(text));
  }

  function highlightParts(text, skill) {
    return String(text).split(pattern(skill, 'gi'))
      .map((part, i) => ({ text: part, match: i % 2 === 1 }))
      .filter(part => part.text !== '');
  }

  return { escapeRegExp, matches, highlightParts };
});
