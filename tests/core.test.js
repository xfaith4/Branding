import test from 'node:test';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { likability, scoreIdea } from '../src/scoring.js';
import { DEFAULT_WEIGHTS, DEFAULT_OBJECTIVE, initialIdeas } from '../src/defaults.js';
import { parseSession, loadSession, saveSession } from '../src/session.js';
import { checkDomain, checkGitHubUser, checkGitHubRepos, runAvailability } from '../src/lookups.js';
import { hasLocalPath, auditPublicFiles } from '../scripts/public-files.mjs';

const session = () => structuredClone({ version: 1, ideas: initialIdeas, weights: DEFAULT_WEIGHTS, objective: DEFAULT_OBJECTIVE });
const response = (status, data) => async () => ({ status, ok: status >= 200 && status < 300, json: async () => data });

test('heuristic is deterministic, ignores case, and handles names without English letters', () => {
  assert.deepEqual(likability('Daylight'), likability('DAYLIGHT'));
  assert.equal(likability('123!').total, 0);
  for (const value of ['a', 'Bright Harbor', 'qzxqzx', 'a'.repeat(120)]) {
    assert.ok(likability(value).total >= 0 && likability(value).total <= 10);
  }
});

test('weights can isolate a criterion and zero weights yield zero', () => {
  const weights = Object.fromEntries(Object.keys(DEFAULT_WEIGHTS).map(key => [key, 0]));
  assert.equal(scoreIdea(initialIdeas[0], weights), 0);
  weights.clarity = 1;
  assert.equal(scoreIdea(initialIdeas[0], weights), 80);
  assert.equal(scoreIdea({ ...initialIdeas[0], grades: { ...initialIdeas[0].grades, clarity: 3 } }, weights), 30);
});

test('session export/import round trip preserves user work including empty boards', () => {
  assert.deepEqual(parseSession(JSON.stringify(session())), session());
  const empty = session(); empty.ideas = [];
  assert.deepEqual(parseSession(JSON.stringify(empty)), empty);
});

test('import rejects corrupt, duplicate, missing, oversized, and out-of-range data', () => {
  assert.throws(() => parseSession('{'));
  for (const change of [
    data => { data.version = 2; },
    data => { data.ideas.push(data.ideas[0]); },
    data => { data.weights.clarity = -1; },
    data => { data.ideas[0].grades.clarity = 11; },
    data => { data.ideas[0].name = ' '; },
    data => { data.ideas[0].notes = 'a'.repeat(5001); },
    data => { delete data.ideas[0].grades; },
    data => { data.ideas = Array(201).fill(data.ideas[0]); },
  ]) {
    const data = session(); change(data);
    assert.throws(() => parseSession(JSON.stringify(data)), /Invalid Naming Lab session/);
  }
});

test('import projects known fields and preserves category strings as data', () => {
  const data = session(); data.token = 'not imported'; data.ideas[0].category = '__proto__';
  const imported = parseSession(JSON.stringify(data));
  assert.equal(imported.token, undefined);
  assert.equal(imported.ideas[0].category, '__proto__');
});

test('unavailable storage reports a recoverable message', () => {
  assert.equal(loadSession().session, null);
  assert.match(saveSession(session()), /Export your session/);
});

test('DNS distinguishes A records, no records, NXDOMAIN, and failures', async () => {
  assert.equal((await checkDomain('sample', 'com', response(200, { Status: 0, Answer: [{ type: 1, data: '192.0.2.1' }] }))).resolves, true);
  assert.equal((await checkDomain('sample', 'com', response(200, { Status: 0 }))).label, 'no A record');
  assert.equal((await checkDomain('sample', 'com', response(200, { Status: 3 }))).label, 'NXDOMAIN');
  for (const fetcher of [response(500, {}), response(200, { Status: 2 }), response(200, {}), async () => { throw new Error('offline'); }]) {
    assert.equal((await checkDomain('sample', 'com', fetcher)).resolves, null);
  }
});

test('GitHub missing users, rate limits, and incomplete searches remain distinct', async () => {
  assert.equal((await checkGitHubUser('sample', response(404, {}))).exists, false);
  assert.equal((await checkGitHubUser('sample', response(200, { login: 'sample', type: 'User' }))).exists, true);
  assert.deepEqual(await checkGitHubUser('sample', response(429, {})), { exists: null, rateLimited: true });
  assert.equal((await checkGitHubUser('sample', response(200, {}))).exists, null);
  assert.equal((await checkGitHubRepos('sample', response(200, { total_count: 7, items: [{ name: 'Sample' }, { name: 'sample-app' }] }))).exactMatches, 1);
  assert.equal((await checkGitHubRepos('sample', response(200, { incomplete_results: true, total_count: 0, items: [] }))).count, null);
});

test('invalid slugs never issue network requests', async () => {
  for (const name of ['!?', 'a'.repeat(64)]) {
    const result = await runAvailability(name, () => { assert.fail('network must not be called'); });
    assert.match(result.error, /1–63/);
  }
});

test('path audit catches machine paths and permits relative paths', () => {
  assert.equal(hasLocalPath(['C:', 'Users', 'someone', 'project'].join(String.fromCharCode(92))), true);
  assert.equal(hasLocalPath(['', 'mnt', 'disk', 'project'].join('/')), true);
  assert.equal(hasLocalPath('src/App.jsx https://example.com/path'), false);
});

test('public source and standalone build contain no machine-specific paths', async () => {
  const files = await auditPublicFiles(fileURLToPath(new URL('..', import.meta.url)));
  assert.ok(files.includes('index.html'));
});
