import test from 'node:test';
import assert from 'node:assert/strict';
import { tracks, topics, resources, questions, codingProblems, assessmentQuestions, processStages, studyPlan } from '../content.js';

test('every lesson has a valid subject, learning sections and source references', () => {
  const trackIds = new Set(tracks.map((item) => item.id));
  const resourceIds = new Set(resources.map((item) => item.id));
  const topicIds = new Set();
  for (const topic of topics) {
    assert.ok(!topicIds.has(topic.id), `duplicate lesson id: ${topic.id}`);
    topicIds.add(topic.id);
    assert.ok(trackIds.has(topic.trackId), `${topic.id} has an unknown track`);
    assert.ok(topic.title?.length > 5, `${topic.id} needs a useful title`);
    for (const field of ['concept', 'example', 'interview']) assert.ok(topic[field]?.length > 40, `${topic.id} needs ${field} content`);
    assert.ok(Array.isArray(topic.checks) && topic.checks.length >= 2, `${topic.id} needs quick checks`);
    assert.ok(Array.isArray(topic.pitfalls) && topic.pitfalls.length >= 2, `${topic.id} needs pitfalls`);
    for (const source of topic.resources) assert.ok(resourceIds.has(source), `${topic.id} references missing source ${source}`);
  }
});

test('all curated resource links are HTTPS and have editorial notes', () => {
  const ids = new Set();
  for (const resource of resources) {
    assert.ok(!ids.has(resource.id), `duplicate resource id: ${resource.id}`);
    ids.add(resource.id);
    assert.ok(resource.url.startsWith('https://'), `${resource.name} should use HTTPS`);
    assert.ok(resource.note.length > 30, `${resource.name} needs a useful note`);
  }
});

test('question bank and assessment records are structurally complete and unique', () => {
  for (const [label, items] of [['question', questions], ['assessment', assessmentQuestions]]) {
    const ids = new Set();
    for (const item of items) {
      assert.ok(!ids.has(item.id), `duplicate ${label} id: ${item.id}`);
      ids.add(item.id);
      assert.ok(item.prompt.length > 10);
      if (label === 'question') {
        assert.ok(item.answer.length > 30);
        assert.ok(item.followUp.length > 10);
        assert.ok(Array.isArray(item.tags) && item.tags.length > 0);
      } else {
        assert.equal(item.options.length, 4);
        assert.ok(Number.isInteger(item.correct) && item.correct >= 0 && item.correct < item.options.length);
        assert.ok(item.explanation.length > 30);
      }
    }
  }
});

test('all learning tracks and hiring stages are represented', () => {
  for (const track of tracks) assert.ok(topics.some((topic) => topic.trackId === track.id));
  assert.ok(processStages.length >= 5);
  assert.ok(studyPlan.length >= 4);
});


test('coding drill set has unique entries and direct practice links', () => {
  const ids = new Set();
  for (const problem of codingProblems) {
    assert.ok(!ids.has(problem.id), `duplicate coding problem id: ${problem.id}`);
    ids.add(problem.id);
    assert.ok(problem.title.length > 3);
    assert.ok(problem.signal.length > 30);
    assert.ok(['Easy', 'Medium', 'Hard'].includes(problem.difficulty));
    assert.ok(problem.url.startsWith('https://leetcode.com/problems/'));
  }
  assert.ok(codingProblems.length >= 20);
});
