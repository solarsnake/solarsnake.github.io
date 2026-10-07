import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { matches, highlightParts, escapeRegExp } = createRequire(import.meta.url)('../assets/js/skill-match.js');

test('metacharacters match literally', () => {
  assert.equal(matches('Released via Digital.ai pipelines', 'Digital.ai'), true);
  assert.equal(matches('Released via Digitalxai pipelines', 'Digital.ai'), false);
  assert.equal(matches('Wrote C++ services', 'C++'), true);
  assert.equal(escapeRegExp('a.b*c'), 'a\\.b\\*c');
});

test('no partial-word matches, case-insensitive', () => {
  assert.equal(matches('Ran Dockerd daemons', 'Docker'), false);
  assert.equal(matches('Ran docker containers', 'Docker'), true);
  assert.equal(matches('AWS Systems Manager', 'AWS'), true);
  assert.equal(matches('LAWSON', 'AWS'), false);
});

test('highlightParts splits around every match', () => {
  assert.deepEqual(highlightParts('Use AWS and aws.', 'AWS'), [
    { text: 'Use ', match: false },
    { text: 'AWS', match: true },
    { text: ' and ', match: false },
    { text: 'aws', match: true },
    { text: '.', match: false },
  ]);
});
