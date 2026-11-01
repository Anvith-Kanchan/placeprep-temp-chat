import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState, readState, writeState, toggleInList, getTrackProgress,
  searchTopics, filterQuestions, scoreAssessment, formatClock, escapeHTML,
} from './core.js';
import { tracks, topics, questions, assessmentQuestions } from '../content.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test('initial state has safe, predictable collections', () => {
  const state = createInitialState();
  assert.deepEqual(state.completedTopics, []);
  assert.deepEqual(state.completedProblems, []);
  assert.deepEqual(state.companies, []);
  assert.equal(state.dailyGoal, 3);
});

test('state persistence round-trips and malformed storage falls back safely', () => {
  const storage = memoryStorage();
  const state = { ...createInitialState(), completedTopics: ['os-process-thread'], dailyGoal: 4, theme: 'dark' };
  assert.equal(writeState(state, storage), true);
  assert.deepEqual(readState(storage), state);
  const broken = memoryStorage({ 'roundzero:v1': '{bad json' });
  assert.deepEqual(readState(broken), createInitialState());
  assert.equal(readState(memoryStorage({ 'roundzero:v1': JSON.stringify({ theme: 'unexpected' }) })).theme, 'light');
});

test('state reader repairs malformed collection fields', () => {
  const storage = memoryStorage({ 'roundzero:v1': JSON.stringify({ completedTopics: 'nope', companies: null, dailyGoal: 5 }) });
  const state = readState(storage);
  assert.deepEqual(state.completedTopics, []);
  assert.deepEqual(state.completedProblems, []);
  assert.deepEqual(state.companies, []);
  assert.equal(state.dailyGoal, 5);
  const repaired = readState(memoryStorage({ 'roundzero:v1': JSON.stringify({ revealedQuestions: 'bad', questionNotes: [], interviewNotes: null, dailyGoal: -3 }) }));
  assert.deepEqual(repaired.revealedQuestions, []);
  assert.deepEqual(readState(memoryStorage({ 'roundzero:v1': JSON.stringify({ completedProblems: 'bad' }) })).completedProblems, []);
  assert.deepEqual(repaired.questionNotes, {});
  assert.deepEqual(repaired.interviewNotes, {});
  assert.equal(repaired.dailyGoal, 3);
});

test('writeState safely reports unavailable or throwing storage', () => {
  assert.equal(writeState(createInitialState(), null), true);
  const blocked = { getItem() { return null; }, setItem() { throw new Error('storage blocked'); } };
  assert.equal(writeState(createInitialState(), blocked), false);
});

test('toggleInList adds and removes without mutating the original', () => {
  const source = ['a'];
  assert.deepEqual(toggleInList(source, 'b'), ['a', 'b']);
  assert.deepEqual(toggleInList(source, 'a'), []);
  assert.deepEqual(source, ['a']);
});

test('track progress counts only matching topics and rounds percentage', () => {
  const result = getTrackProgress('os', topics, ['os-process-thread', 'os-scheduling', 'dsa-arrays']);
  assert.equal(result.total, 7);
  assert.equal(result.completed, 2);
  assert.equal(result.percent, 29);
  assert.deepEqual(getTrackProgress('not-a-track', topics, []), { total: 0, completed: 0, percent: 0 });
});

test('topic search includes concept content and is case-insensitive', () => {
  const result = searchTopics('page fault', topics, tracks);
  assert.ok(result.some((topic) => topic.id === 'os-virtual-memory'));
  assert.equal(searchTopics('', topics, tracks).length, topics.length);
});

test('question filters compose subject, level and text constraints', () => {
  const result = filterQuestions(questions, { subject: 'cn', level: 'Standard', query: 'handshake' });
  assert.deepEqual(result.map((item) => item.id), ['q-cn-2', 'q-cn-4', 'q-cn-5']);
  assert.equal(filterQuestions(questions, { query: 'there is no such prompt' }).length, 0);
});

test('assessment scoring handles unanswered and incorrect answers', () => {
  const sample = assessmentQuestions.slice(0, 3);
  const score = scoreAssessment(sample, { a1: 1, a2: 0 });
  assert.equal(score.correct, 1);
  assert.equal(score.total, 3);
  assert.equal(score.percentage, 33);
  assert.equal(score.details[2].selected, null);
  assert.equal(score.details[0].isCorrect, true);
});

test('clock formatting handles boundaries and invalid values', () => {
  assert.equal(formatClock(0), '00:00');
  assert.equal(formatClock(65), '01:05');
  assert.equal(formatClock(3600), '60:00');
  assert.equal(formatClock(-1), '00:00');
  assert.equal(formatClock('invalid'), '00:00');
});

test('HTML escaping protects text inserted into templates', () => {
  assert.equal(escapeHTML(`<script title="x">'&</script>`), '&lt;script title=&quot;x&quot;&gt;&#39;&amp;&lt;/script&gt;');
});

test('curated curriculum covers every core subject plus DSA and aptitude', () => {
  const ids = new Set(tracks.map((track) => track.id));
  for (const expected of ['os', 'cn', 'dbms', 'oops', 'system-design', 'dsa', 'aptitude']) assert.ok(ids.has(expected));
  for (const track of tracks) assert.ok(topics.some((topic) => topic.trackId === track.id), `${track.id} should have lessons`);
  assert.ok(topics.length >= 48);
  assert.ok(questions.length >= 40);
  assert.ok(assessmentQuestions.length >= 12);
});
