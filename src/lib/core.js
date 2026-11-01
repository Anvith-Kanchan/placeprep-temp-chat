export const STORAGE_KEY = 'roundzero:v1';

export function createInitialState() {
  return {
    completedTopics: [],
    completedProblems: [],
    savedQuestions: [],
    savedTopics: [],
    revealedQuestions: [],
    studyPlanDone: [],
    questionNotes: {},
    companies: [],
    assessmentHistory: [],
    lastAssessment: null,
    interviewNotes: {},
    dailyGoal: 3,
    theme: 'light',
  };
}

export function readState(storage = globalThis.localStorage) {
  const fallback = createInitialState();
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback;
    const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
    const validCompanies = Array.isArray(parsed.companies)
      ? parsed.companies.filter((item) => isRecord(item) && typeof item.id === 'string' && typeof item.company === 'string' && typeof item.role === 'string')
      : [];
    const validHistory = Array.isArray(parsed.assessmentHistory)
      ? parsed.assessmentHistory.filter((item) => isRecord(item) && Number.isFinite(item.percentage) && Number.isFinite(item.correct) && Number.isFinite(item.total) && typeof item.date === 'string')
      : [];
    return {
      ...fallback,
      ...parsed,
      completedTopics: Array.isArray(parsed.completedTopics) ? parsed.completedTopics.filter((item) => typeof item === 'string') : [],
      completedProblems: Array.isArray(parsed.completedProblems) ? parsed.completedProblems.filter((item) => typeof item === 'string') : [],
      savedQuestions: Array.isArray(parsed.savedQuestions) ? parsed.savedQuestions.filter((item) => typeof item === 'string') : [],
      savedTopics: Array.isArray(parsed.savedTopics) ? parsed.savedTopics.filter((item) => typeof item === 'string') : [],
      revealedQuestions: Array.isArray(parsed.revealedQuestions) ? parsed.revealedQuestions.filter((item) => typeof item === 'string') : [],
      studyPlanDone: Array.isArray(parsed.studyPlanDone) ? parsed.studyPlanDone.filter((item) => typeof item === 'string') : [],
      companies: validCompanies,
      assessmentHistory: validHistory,
      questionNotes: isRecord(parsed.questionNotes) ? parsed.questionNotes : {},
      interviewNotes: isRecord(parsed.interviewNotes) ? parsed.interviewNotes : {},
      dailyGoal: Number.isInteger(parsed.dailyGoal) && parsed.dailyGoal > 0 ? parsed.dailyGoal : fallback.dailyGoal,
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
    };
  } catch {
    return fallback;
  }
}

export function writeState(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function toggleInList(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function getTrackProgress(trackId, topics, completedIds) {
  const trackTopics = topics.filter((topic) => topic.trackId === trackId);
  const completed = trackTopics.filter((topic) => completedIds.includes(topic.id)).length;
  return {
    total: trackTopics.length,
    completed,
    percent: trackTopics.length ? Math.round((completed / trackTopics.length) * 100) : 0,
  };
}

export function searchTopics(query, topics, tracks) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return topics;
  const trackNames = new Map(tracks.map((track) => [track.id, track.name.toLocaleLowerCase()]));
  return topics.filter((topic) => [topic.title, topic.concept, topic.example, topic.interview, topic.trackId, trackNames.get(topic.trackId)]
    .some((value) => value?.toLocaleLowerCase().includes(needle)));
}

export function filterQuestions(items, { query = '', subject = 'all', level = 'all' } = {}) {
  const needle = query.trim().toLocaleLowerCase();
  return items.filter((item) => {
    const matchesSubject = subject === 'all' || item.trackId === subject;
    const matchesLevel = level === 'all' || item.level === level;
    const haystack = [item.prompt, item.answer, item.topic, ...item.tags].join(' ').toLocaleLowerCase();
    return matchesSubject && matchesLevel && (!needle || haystack.includes(needle));
  });
}

export function scoreAssessment(questions, answers) {
  const details = questions.map((question) => ({
    id: question.id,
    selected: Number.isInteger(answers[question.id]) ? answers[question.id] : null,
    correct: question.correct,
    isCorrect: answers[question.id] === question.correct,
    explanation: question.explanation,
  }));
  const correct = details.filter((item) => item.isCorrect).length;
  return {
    correct,
    total: questions.length,
    percentage: questions.length ? Math.round((correct / questions.length) * 100) : 0,
    details,
  };
}

export function formatClock(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export function estimateCompletion(total, completed) {
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}
