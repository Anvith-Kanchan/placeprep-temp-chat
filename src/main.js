import {
  tracks, topics, resources, questions, codingProblems, assessmentQuestions, processStages, studyPlan,
} from './content.js';
import {
  readState, writeState, toggleInList, getTrackProgress, searchTopics,
  filterQuestions, scoreAssessment, formatClock, escapeHTML,
} from './lib/core.js';

const root = document.querySelector('#root');
const state = readState();
let currentView = 'overview';
let selectedTrack = null;
let selectedTopic = null;
let learnSearch = '';
let codingSearch = '';
let codingPattern = 'all';
let questionSearch = '';
let questionSubject = 'all';
let questionLevel = 'all';
let assessment = null;
let assessmentTimer = null;
let assessmentResult = null;
let interviewCategory = 'technical';
let interviewIndex = 0;
let interviewReveal = false;
let mobileMenuOpen = false;

const navGroups = [
  { label: 'Workspace', items: [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'learn', label: 'Learning paths', icon: 'book' },
    { id: 'coding', label: 'Coding drills', icon: 'braces', count: codingProblems.length },
    { id: 'questions', label: 'Question bank', icon: 'layers', count: questions.length },
    { id: 'assessment', label: 'Assessment lab', icon: 'timer' },
  ] },
  { label: 'Interview prep', items: [
    { id: 'interview', label: 'Interview room', icon: 'mic' },
    { id: 'applications', label: 'Hiring tracker', icon: 'briefcase' },
    { id: 'planner', label: 'Study plan', icon: 'calendar' },
    { id: 'revision', label: 'Revision desk', icon: 'bookmark' },
  ] },
  { label: 'Reference', items: [
    { id: 'resources', label: 'Resource shelf', icon: 'external' },
  ] },
];

const icons = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8M8 10h7"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M9 22h6"/>',
  briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 9h18M8 13h2M14 13h2M8 17h2"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  braces: '<path d="M8 4H5v16h3M16 4h3v16h-3M14 3l-4 18"/>',
  external: '<path d="M14 3h7v7M21 3l-9 9"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  spark: '<path d="m12 2 1.4 6.6L20 11l-6.6 1.4L12 19l-1.4-6.6L4 11l6.6-2.4z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z"/>',
  filter: '<path d="M4 5h16M7 12h10m-7 7h4"/>',
  edit: '<path d="m4 16-.8 4.8L8 20l11-11-3.8-3.8z"/><path d="m13.5 6.5 4 4"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 20h16"/>',
};

function icon(name, size = 18) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] ?? icons.spark}</svg>`;
}

function persist() {
  writeState(state);
}

function navigate(view) {
  currentView = view;
  selectedTrack = null;
  selectedTopic = null;
  mobileMenuOpen = false;
  renderApp();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function activeNav() {
  return selectedTopic || selectedTrack ? 'learn' : currentView;
}

function navMarkup() {
  return navGroups.map((group) => `
    <div class="nav-group">
      <div class="nav-label">${group.label}</div>
      ${group.items.map((item) => `
        <button class="nav-item ${activeNav() === item.id ? 'active' : ''}" data-nav="${item.id}" type="button">
          ${icon(item.icon, 17)}<span>${item.label}</span>
          ${item.count ? `<small>${item.count}</small>` : ''}
        </button>`).join('')}
    </div>`).join('');
}

function shell(content) {
  const completed = state.completedTopics.length;
  const total = topics.length;
  const goalCount = state.studyPlanDone.length;
  return `
    <div class="app-shell ${mobileMenuOpen ? 'menu-open' : ''}">
      <aside class="sidebar">
        <div class="brand-lockup">
          <div class="brand-mark"><span>R</span><i></i></div>
          <div><div class="brand-name">roundzero<span>.</span></div><div class="brand-caption">THE PLACEMENT WORKSPACE</div></div>
        </div>
        <div class="sidebar-profile">
          <div class="avatar">AZ</div>
          <div class="profile-copy"><strong>Your prep desk</strong><span>Campus candidate</span></div>
          <span class="online-dot"></span>
        </div>
        <nav class="main-nav" aria-label="Main navigation">${navMarkup()}</nav>
        <div class="sidebar-bottom">
          <div class="streak-card">
            <div class="streak-top"><span>YOUR MOMENTUM</span>${icon('target', 16)}</div>
            <div class="streak-value">${completed}<span> / ${total}</span></div>
            <div class="streak-track"><span style="width:${Math.round((completed / total) * 100)}%"></span></div>
            <p>Lessons completed</p>
          </div>
          <div class="sidebar-foot"><span class="status-dot"></span> Your progress stays on this device</div>
        </div>
      </aside>
      <button class="mobile-scrim" data-action="close-menu" aria-label="Close navigation"></button>
      <main class="main-frame">
        <header class="topbar">
          <button class="mobile-menu-button" data-action="toggle-menu" aria-label="Toggle menu">${icon('menu', 20)}</button>
          <div class="breadcrumbs"><span>ROUNDZERO</span><b>/</b><strong>${escapeHTML(pageLabel())}</strong></div>
          <div class="topbar-actions">
            <label class="global-search">${icon('search', 16)}<input type="search" placeholder="Find a concept or question…" aria-label="Search the workspace" data-global-search><kbd>↵</kbd></label>
            <button class="topbar-date" title="Your local study workspace">${new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</button>
          </div>
        </header>
        <div class="page-content">${content}</div>
        <footer class="page-footer"><span>ROUNDZERO <b>©</b> 2026</span><span>Built for the work before the offer.</span><a href="#resources" data-nav="resources">Reading list ${icon('arrow', 13)}</a></footer>
      </main>
    </div>`;
}

function pageLabel() {
  if (selectedTopic) return selectedTopic.title;
  if (selectedTrack) return selectedTrack.name;
  const labels = { overview: 'Overview', learn: 'Learning paths', coding: 'Coding drills', questions: 'Question bank', assessment: 'Assessment lab', interview: 'Interview room', applications: 'Hiring tracker', planner: 'Study plan', revision: 'Revision desk', resources: 'Resource shelf' };
  return labels[currentView] ?? 'Workspace';
}

function progressBar(progress, colour = '') {
  return `<div class="progress-line ${colour}"><span style="width:${progress}%"></span></div>`;
}

function trackCard(track) {
  const progress = getTrackProgress(track.id, topics, state.completedTopics);
  const next = topics.find((topic) => topic.trackId === track.id && !state.completedTopics.includes(topic.id)) ?? topics.find((topic) => topic.trackId === track.id);
  return `
    <button class="track-card tone-${track.colour}" data-open-track="${track.id}" type="button">
      <div class="track-card-top"><span class="track-code">${track.short}</span><span class="track-focus">${track.focus}</span></div>
      <h3>${track.name}</h3><p>${track.description}</p>
      <div class="track-card-bottom"><span>${progress.completed} of ${progress.total} lessons</span><span class="track-arrow">${icon('arrow', 16)}</span></div>
      ${progressBar(progress.percent)}
      <small class="next-up">NEXT UP · ${next?.title ?? 'Complete'}</small>
    </button>`;
}

function overviewPage() {
  const totalDone = state.completedTopics.length;
  const allDone = topics.length;
  const doneTasks = studyPlan.filter((task) => state.studyPlanDone.includes(task.id)).length;
  const recent = state.assessmentHistory[0];
  const featured = tracks.filter((track) => ['os', 'cn', 'dbms', 'oops'].includes(track.id));
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
  return `
    <section class="welcome-row">
      <div><div class="eyebrow"><span class="eyebrow-line"></span>YOUR PREPARATION, IN ONE PLACE</div><h1>${greeting}.<br><em>Make the next round yours.</em></h1><p class="welcome-copy">A clearer route from fundamentals to interview-ready. Pick up where you left off, or choose one thing to get better at today.</p></div>
      <div class="welcome-graphic" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="orbit-center">R<span>0</span></div><div class="orbit-label label-a">LEARN</div><div class="orbit-label label-b">PRACTISE</div><div class="orbit-label label-c">REPEAT</div></div>
    </section>
    <section class="stats-grid">
      <article class="stat-card"><span class="stat-label">LEARNING PROGRESS</span><div class="stat-number">${totalDone}<small> / ${allDone}</small></div><div class="stat-foot">Lessons completed</div>${progressBar(Math.round(totalDone / allDone * 100))}</article>
      <article class="stat-card"><span class="stat-label">QUESTION BANK</span><div class="stat-number">${questions.length}<small> prompts</small></div><div class="stat-foot">Across ${tracks.length + 2} interview areas</div><div class="stat-spark">${[28, 42, 34, 63, 50, 76, 58, 88, 72, 96].map((height) => `<i style="height:${height}%"></i>`).join('')}</div></article>
      <article class="stat-card"><span class="stat-label">TODAY'S CHECKLIST</span><div class="stat-number">${doneTasks}<small> / ${studyPlan.length}</small></div><div class="stat-foot">Small sessions add up</div>${progressBar(Math.round(doneTasks / studyPlan.length * 100), 'progress-coral')}</article>
      <article class="stat-card"><span class="stat-label">LAST ASSESSMENT</span><div class="stat-number">${recent ? `${recent.percentage}%` : '—'}</div><div class="stat-foot">${recent ? `${recent.correct} correct · ${new Date(recent.date).toLocaleDateString('en-IN')}` : 'Take your first timed check'}</div><button class="text-link" data-nav="assessment">Open assessment lab ${icon('arrow', 13)}</button></article>
    </section>
    <section class="section-heading"><div><div class="eyebrow">START WITH THE ESSENTIALS</div><h2>Your core subjects</h2></div><button class="subtle-link" data-nav="learn">All learning paths ${icon('arrow', 15)}</button></section>
    <section class="track-grid compact-grid">${featured.map(trackCard).join('')}</section>
    <section class="dashboard-columns">
      <article class="panel today-panel"><div class="panel-heading"><div><div class="eyebrow">A LITTLE, EVERY DAY</div><h2>Today's plan</h2></div><span class="panel-count">${doneTasks}/${studyPlan.length}</span></div><div class="today-list">${studyPlan.map((task, index) => `<label class="today-item ${state.studyPlanDone.includes(task.id) ? 'is-done' : ''}"><input type="checkbox" data-plan-check="${task.id}" ${state.studyPlanDone.includes(task.id) ? 'checked' : ''}><span class="custom-check">${icon('check', 13)}</span><span class="today-item-copy"><strong>${task.title}</strong><small>${task.detail}</small></span><span class="task-number">0${index + 1}</span></label>`).join('')}</div><button class="panel-bottom-link" data-nav="planner">Open full study plan ${icon('arrow', 14)}</button></article>
      <article class="panel process-panel"><div class="panel-heading"><div><div class="eyebrow">FROM APPLICATION TO OFFER</div><h2>Know the process</h2></div>${icon('arrow', 18)}</div><div class="process-mini">${processStages.slice(0, 4).map((stage, index) => `<div class="process-mini-row"><span class="process-dot">0${index + 1}</span><div><strong>${stage.title}</strong><small>${stage.detail}</small></div></div>`).join('')}</div><button class="panel-bottom-link" data-nav="applications">Map your applications ${icon('arrow', 14)}</button></article>
    </section>
    <section class="closing-note"><span class="closing-quote">“</span><p>Don't measure preparation by how many tabs you've opened. Measure it by how clearly you can explain what you've learned.</p><span class="closing-byline">A BETTER WAY TO PREPARE</span></section>`;
}

function learnPage() {
  if (selectedTopic) return topicPage(selectedTopic);
  if (selectedTrack) return trackPage(selectedTrack);
  const list = learnSearch ? searchTopics(learnSearch, topics, tracks) : topics;
  const grouped = tracks.map((track) => ({ track, items: list.filter((topic) => topic.trackId === track.id) })).filter((entry) => entry.items.length);
  return `
    <section class="page-intro"><div class="eyebrow">THE KNOWLEDGE BASE</div><h1>Learn it properly.<br><em>Explain it simply.</em></h1><p>Structured paths for the concepts that show up in campus hiring. Start with the why, build the mental model, then practise the interview explanation.</p></section>
    <div class="learn-toolbar"><label class="search-field">${icon('search', 17)}<input type="search" placeholder="Search lessons, concepts, examples…" value="${escapeHTML(learnSearch)}" data-learn-search></label><span class="result-count">${list.length} LESSONS</span></div>
    ${grouped.length ? grouped.map(({ track, items }) => `<section class="track-section"><div class="track-section-heading"><div><span class="track-kicker">${track.focus.toUpperCase()}</span><h2>${track.name}</h2></div><span class="track-section-count">${items.length} lessons</span></div><div class="lesson-list">${items.map((topic, index) => lessonRow(topic, index)).join('')}</div></section>`).join('') : `<div class="empty-state">No lessons found. Try a broader search.</div>`}`;
}

function lessonRow(topic, index) {
  const track = tracks.find((item) => item.id === topic.trackId);
  const isDone = state.completedTopics.includes(topic.id);
  return `<button class="lesson-row ${isDone ? 'lesson-done' : ''}" data-open-topic="${topic.id}" type="button"><span class="lesson-index">${String(index + 1).padStart(2, '0')}</span><span class="lesson-copy"><strong>${topic.title}</strong><small>${track?.short ?? ''} · ${topic.level}</small></span><span class="lesson-time">${topic.minutes} min</span><span class="lesson-state">${isDone ? icon('check', 16) : icon('chevron', 16)}</span></button>`;
}

function trackPage(track) {
  const trackTopics = topics.filter((topic) => topic.trackId === track.id);
  const progress = getTrackProgress(track.id, topics, state.completedTopics);
  const next = trackTopics.find((topic) => !state.completedTopics.includes(topic.id)) ?? trackTopics[0];
  return `<button class="back-link" data-action="back-tracks">${icon('arrow', 14)} All learning paths</button>
    <section class="track-detail-hero tone-${track.colour}"><div><div class="eyebrow">${track.focus.toUpperCase()} · ${track.short}</div><h1>${track.name}</h1><p>${track.description}</p><div class="track-outcomes">${track.outcomes.map((item) => `<span>${icon('check', 13)} ${item}</span>`).join('')}</div></div><div class="track-progress-box"><span>YOUR PROGRESS</span><strong>${progress.percent}<small>%</small></strong>${progressBar(progress.percent)}<small>${progress.completed} of ${progress.total} lessons complete</small><button class="button button-dark" data-open-topic="${next.id}">${progress.percent === 100 ? 'Review lessons' : 'Continue path'} ${icon('arrow', 14)}</button></div></section>
    <section class="track-section track-detail-list"><div class="track-section-heading"><div><span class="track-kicker">THE CURRICULUM</span><h2>From first principles to interviews</h2></div><span class="track-section-count">${trackTopics.length} modules</span></div><div class="lesson-list">${trackTopics.map((topic, index) => lessonRow(topic, index)).join('')}</div></section>`;
}

function topicPage(topic) {
  const track = tracks.find((item) => item.id === topic.trackId);
  const saved = state.savedTopics.includes(topic.id);
  const done = state.completedTopics.includes(topic.id);
  const sourceList = resources.filter((resource) => topic.resources.includes(resource.id));
  return `<button class="back-link" data-action="back-track">${icon('arrow', 14)} Back to ${track?.short ?? 'lessons'}</button>
    <article class="lesson-article"><div class="lesson-article-head"><div><div class="eyebrow">${track?.name.toUpperCase()} · ${topic.level.toUpperCase()}</div><h1>${topic.title}</h1><div class="lesson-meta">${icon('clock', 14)} ${topic.minutes} minute read <span>·</span> <span>${done ? 'Completed' : 'In progress'}</span></div></div><div class="lesson-actions"><button class="icon-button ${saved ? 'selected' : ''}" data-action="save-topic" title="Save for revision">${icon('bookmark', 17)}</button><button class="button ${done ? 'button-complete' : 'button-dark'}" data-action="complete-topic">${done ? icon('check', 15) + ' Completed' : 'Mark as complete'}</button></div></div>
      <div class="lesson-body"><section class="lesson-prose"><div class="eyebrow">01 — THE IDEA</div><p class="lead-paragraph">${topic.concept}</p><div class="example-block"><div class="example-label">MAKE IT CONCRETE</div><p>${topic.example}</p></div><div class="eyebrow section-eyebrow">02 — IN THE INTERVIEW</div><div class="interview-callout"><div class="callout-mark">Q</div><div><strong>How to explain it</strong><p>${topic.interview}</p></div></div><div class="eyebrow section-eyebrow">03 — WATCH OUT FOR</div><ul class="pitfall-list">${topic.pitfalls.map((item) => `<li><span>!</span>${item}</li>`).join('')}</ul>
      <div class="eyebrow section-eyebrow">04 — CHECK YOUR UNDERSTANDING</div><div class="knowledge-checks">${topic.checks.map((check, index) => `<details class="knowledge-check"><summary><span>0${index + 1}</span>${check.question}</summary><p>${check.answer}</p></details>`).join('')}</div>
      <div class="source-strip"><div class="eyebrow">READ FURTHER</div>${sourceList.map((source) => `<a href="${source.url}" target="_blank" rel="noopener noreferrer"><span>${source.name}</span>${icon('external', 13)}</a>`).join('')}</div></section>
      <aside class="lesson-aside"><div class="aside-card"><div class="aside-card-top">YOUR STUDY NOTE ${icon('edit', 15)}</div><textarea data-topic-note placeholder="Write a short note in your own words…">${escapeHTML(state.questionNotes[`topic:${topic.id}`] ?? '')}</textarea><button class="text-link" data-action="save-topic-note">Save note ${icon('arrow', 13)}</button></div><div class="aside-tip"><span class="tip-icon">↗</span><strong>Say it out loud.</strong><p>Close the page and explain this topic in two minutes. Clear recall beats another passive reread.</p></div></aside></div></article>`;
}

function codingPage() {
  const patterns = ['all', ...new Set(codingProblems.map((problem) => problem.pattern))];
  const needle = codingSearch.trim().toLocaleLowerCase();
  const filtered = codingProblems.filter((problem) => (codingPattern === 'all' || problem.pattern === codingPattern)
    && (!needle || [problem.title, problem.pattern, problem.difficulty, problem.signal].join(' ').toLocaleLowerCase().includes(needle)));
  const complete = state.completedProblems.length;
  return `<section class="page-intro compact-intro"><div class="eyebrow">THE CODING ROUND</div><h1>Patterns first.<br><em>Problems with a purpose.</em></h1><p>A curated problem ladder for common campus assessment patterns. Read the cue, solve on the linked platform, then mark it done only after you can explain the approach and complexity.</p></section>
    <section class="coding-progress"><div><span class="eyebrow">YOUR CODING PRACTICE</span><strong>${complete}<small> / ${codingProblems.length}</small></strong><p>Problems completed</p></div>${progressBar(Math.round(complete / codingProblems.length * 100))}<div class="coding-progress-copy">${Math.round(complete / codingProblems.length * 100)}% <span>of this starter set</span></div></section>
    <div class="question-toolbar coding-toolbar"><label class="search-field">${icon('search', 17)}<input type="search" placeholder="Find a problem or pattern…" value="${escapeHTML(codingSearch)}" data-coding-search></label><select data-coding-pattern aria-label="Filter coding problems by pattern">${patterns.map((pattern) => `<option value="${escapeHTML(pattern)}" ${codingPattern === pattern ? 'selected' : ''}>${pattern === 'all' ? 'All patterns' : escapeHTML(pattern)}</option>`).join('')}</select><span class="result-count">${filtered.length} PROBLEMS</span></div>
    <div class="coding-list">${filtered.length ? filtered.map((problem) => { const done = state.completedProblems.includes(problem.id); return `<article class="coding-card ${done ? 'coding-done' : ''}"><div class="coding-card-top"><span class="coding-number">${problem.number}</span><span class="difficulty difficulty-${problem.difficulty.toLowerCase()}">${problem.difficulty}</span><span class="coding-pattern">${problem.pattern}</span></div><h3>${problem.title}</h3><p>${problem.signal}</p><div class="coding-card-actions"><a href="${problem.url}" target="_blank" rel="noopener noreferrer">Solve on LeetCode ${icon('external', 13)}</a><button class="coding-toggle ${done ? 'selected' : ''}" data-complete-problem="${problem.id}" type="button">${done ? icon('check', 14) + ' Completed' : 'Mark complete'}</button></div></article>`; }).join('') : '<div class="empty-state">No problems match this filter. Try a different pattern or search.</div>'}</div>
    <div class="coding-note"><strong>What “complete” should mean</strong><p>You solved it without copying a solution, tested edge cases, and can explain the pattern and time/space complexity. The platform remains the execution environment; RoundZero tracks your learning progress.</p></div>`;
}

function questionsPage() {
  const filtered = filterQuestions(questions, { query: questionSearch, subject: questionSubject, level: questionLevel });
  const subjectOptions = [...tracks.map((track) => ({ id: track.id, name: track.short })), { id: 'hr', name: 'HR' }, { id: 'projects', name: 'Projects' }];
  return `<section class="page-intro compact-intro"><div class="eyebrow">PRACTISE THE CONVERSATION</div><h1>Questions worth<br><em>having an answer for.</em></h1><p>Concept checks, common interview prompts and the follow-up that tests whether you really understand the answer.</p></section>
    <div class="question-toolbar"><label class="search-field">${icon('search', 17)}<input type="search" placeholder="Search a question or topic…" value="${escapeHTML(questionSearch)}" data-question-search></label><select data-question-subject aria-label="Filter by subject"><option value="all">All subjects</option>${subjectOptions.map((item) => `<option value="${item.id}" ${questionSubject === item.id ? 'selected' : ''}>${item.name}</option>`).join('')}</select><select data-question-level aria-label="Filter by difficulty"><option value="all">All levels</option>${['Warm-up', 'Standard', 'Stretch'].map((level) => `<option ${questionLevel === level ? 'selected' : ''}>${level}</option>`).join('')}</select></div>
    <div class="question-results-head"><span>${filtered.length} QUESTIONS</span><span>${state.savedQuestions.length} SAVED FOR REVISION</span></div>
    <div class="question-list">${filtered.length ? filtered.map(questionCard).join('') : '<div class="empty-state">No questions match those filters. Try changing the subject or search term.</div>'}</div>`;
}

function questionCard(question) {
  const reveal = state.revealedQuestions.includes(question.id);
  const saved = state.savedQuestions.includes(question.id);
  const track = tracks.find((item) => item.id === question.trackId);
  return `<article class="question-card"><div class="question-card-top"><span class="question-subject">${track?.short ?? (question.trackId === 'hr' ? 'HR' : 'PROJECT')}</span><span class="difficulty difficulty-${question.level.toLowerCase().replace('-', '')}">${question.level}</span><button class="save-question ${saved ? 'selected' : ''}" data-save-question="${question.id}" title="Save for revision">${icon('bookmark', 16)}</button></div><div class="question-topic">${question.topic}</div><h3>${question.prompt}</h3>${reveal ? `<div class="answer-panel"><div class="answer-label">A GOOD STARTING POINT</div><p>${question.answer}</p><div class="follow-up"><span>THE FOLLOW-UP</span><p>${question.followUp}</p></div></div>` : ''}<div class="question-card-bottom"><button class="text-link" data-reveal-question="${question.id}">${reveal ? 'Hide answer' : 'Reveal answer'} ${icon('arrow', 13)}</button><span>${question.tags.slice(0, 3).map((tag) => `<i>#${tag}</i>`).join(' ')}</span></div></article>`;
}

function assessmentPage() {
  if (assessmentResult) return assessmentResultPage();
  if (assessment) return activeAssessmentPage();
  const previous = state.assessmentHistory[0];
  return `<section class="page-intro compact-intro"><div class="eyebrow">PRACTISE UNDER PRESSURE</div><h1>Assessment lab.<br><em>Think clearly. Move quickly.</em></h1><p>A mixed, timed check across core CS, problem solving and quantitative basics. Designed to help you find gaps before a real online assessment.</p></section>
    <section class="assessment-ready"><div class="assessment-ready-main"><div class="assessment-stamp">R0 <span>·</span> 01</div><div class="eyebrow">THE MIXED CAMPUS SCREEN</div><h2>One sitting.<br><em>A useful signal.</em></h2><p>${assessmentQuestions.length} multiple-choice questions sampled across the topics you need to know. No trick scoring: every answer has an explanation so you can learn from the result.</p><div class="assessment-facts"><div><strong>${assessmentQuestions.length}</strong><span>QUESTIONS</span></div><div><strong>24</strong><span>MINUTES</span></div><div><strong>7</strong><span>SUBJECT AREAS</span></div></div><button class="button button-lime" data-action="start-assessment">Start the assessment ${icon('arrow', 16)}</button></div><div class="assessment-ready-side"><div class="side-dial"><div class="dial-inner"><strong>24<span>m</span></strong><small>TIME BOX</small></div></div><div class="assessment-rules"><strong>Before you begin</strong><ul><li>Choose one answer per question.</li><li>Move between questions freely.</li><li>Your score is calculated on submission.</li><li>Review explanations after the timer ends.</li></ul></div></div></section>
    ${previous ? `<section class="last-result"><div><span class="eyebrow">YOUR LAST ATTEMPT</span><strong>${previous.percentage}%</strong><small>${previous.correct} / ${previous.total} correct · ${new Date(previous.date).toLocaleDateString('en-IN')}</small></div><div class="result-trend">${previous.percentage >= 70 ? 'Solid work. Keep tightening the gaps.' : 'Use the review to pick your next study session.'}</div></section>` : ''}`;
}

function activeAssessmentPage() {
  const question = assessmentQuestions[assessment.index];
  const track = tracks.find((item) => item.id === question.trackId);
  const selected = assessment.answers[question.id];
  const progress = Math.round(((assessment.index + 1) / assessmentQuestions.length) * 100);
  return `<section class="assessment-active"><div class="assessment-topline"><button class="back-link" data-action="exit-assessment">${icon('arrow', 14)} Exit assessment</button><div class="timer-pill ${assessment.seconds < 120 ? 'timer-warning' : ''}">${icon('clock', 15)} <span id="time-left">${formatClock(assessment.seconds)}</span></div></div><div class="assessment-progress-head"><span>QUESTION ${String(assessment.index + 1).padStart(2, '0')} <i>OF ${assessmentQuestions.length}</i></span><span>${Object.keys(assessment.answers).length} ANSWERED</span></div>${progressBar(progress)}
    <article class="assessment-question"><div class="assessment-question-meta"><span>${track?.short ?? 'CORE CS'}</span><span>SELECT ONE ANSWER</span></div><h1>${question.prompt}</h1><div class="assessment-options">${question.options.map((option, index) => `<button class="assessment-option ${selected === index ? 'chosen' : ''}" data-answer="${index}" type="button"><span class="option-letter">${String.fromCharCode(65 + index)}</span><span>${option}</span>${selected === index ? icon('check', 17) : ''}</button>`).join('')}</div></article>
    <div class="assessment-controls"><button class="button button-quiet" data-action="prev-question" ${assessment.index === 0 ? 'disabled' : ''}>Previous</button><div class="assessment-dots">${assessmentQuestions.map((item, index) => `<button class="assessment-dot ${index === assessment.index ? 'current' : ''} ${Object.hasOwn(assessment.answers, item.id) ? 'answered' : ''}" data-jump-question="${index}" aria-label="Go to question ${index + 1}"></button>`).join('')}</div>${assessment.index === assessmentQuestions.length - 1 ? `<button class="button button-dark" data-action="submit-assessment">Submit assessment ${icon('arrow', 14)}</button>` : `<button class="button button-dark" data-action="next-question">Next question ${icon('arrow', 14)}</button>`}</div></section>`;
}

function assessmentResultPage() {
  const result = assessmentResult;
  const missed = result.details.filter((item) => !item.isCorrect).length;
  return `<section class="result-hero"><div class="eyebrow">ASSESSMENT COMPLETE · ${new Date(result.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div><div class="result-score"><strong>${result.percentage}<small>%</small></strong><div><h1>${result.percentage >= 80 ? 'Strong signal.' : result.percentage >= 60 ? 'Good foundation.' : 'Useful gap map.'}</h1><p>${result.correct} of ${result.total} answers correct. ${missed} ${missed === 1 ? 'question needs' : 'questions need'} another look.</p></div></div><div class="result-meter">${progressBar(result.percentage)}</div><div class="result-actions"><button class="button button-lime" data-action="retry-assessment">Try another set ${icon('arrow', 14)}</button><button class="button button-quiet" data-nav="learn">Review the learning paths</button></div></section>
    <section class="section-heading"><div><div class="eyebrow">LEARN FROM THE ATTEMPT</div><h2>Answer review</h2></div><span class="track-section-count">${result.details.length} questions</span></section><div class="review-list">${result.details.map((detail, index) => { const item = assessmentQuestions.find((q) => q.id === detail.id); return `<article class="review-row ${detail.isCorrect ? 'review-correct' : 'review-wrong'}"><div class="review-number">${String(index + 1).padStart(2, '0')}</div><div class="review-copy"><strong>${item.prompt}</strong><p>${detail.isCorrect ? 'Correct' : `Your answer: ${detail.selected === null ? 'Not answered' : item.options[detail.selected]}`}</p><small>Correct answer: ${item.options[detail.correct]}</small><div class="review-explanation">${detail.explanation}</div></div><span class="review-mark">${detail.isCorrect ? icon('check', 18) : '↺'}</span></article>`; }).join('')}</div>`;
}

function startAssessment() {
  clearInterval(assessmentTimer);
  assessmentResult = null;
  assessment = { index: 0, answers: {}, seconds: 24 * 60, startedAt: Date.now() };
  renderApp();
  assessmentTimer = setInterval(() => {
    if (!assessment) return;
    assessment.seconds -= 1;
    const timer = document.querySelector('#time-left');
    if (timer) timer.textContent = formatClock(assessment.seconds);
    if (assessment.seconds <= 0) finishAssessment();
  }, 1000);
}

function finishAssessment() {
  if (!assessment) return;
  clearInterval(assessmentTimer);
  const score = scoreAssessment(assessmentQuestions, assessment.answers);
  assessmentResult = { ...score, date: new Date().toISOString() };
  state.lastAssessment = assessmentResult;
  state.assessmentHistory.unshift({ correct: score.correct, total: score.total, percentage: score.percentage, date: assessmentResult.date });
  state.assessmentHistory = state.assessmentHistory.slice(0, 12);
  persist();
  assessment = null;
  renderApp();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function interviewPool() {
  if (interviewCategory === 'behavioral') return questions.filter((item) => item.trackId === 'hr');
  if (interviewCategory === 'project') return questions.filter((item) => item.trackId === 'projects');
  if (interviewCategory === 'design') return questions.filter((item) => item.trackId === 'system-design');
  return questions.filter((item) => ['os', 'cn', 'dbms', 'oops', 'dsa'].includes(item.trackId));
}

function interviewPage() {
  const pool = interviewPool();
  const item = pool[interviewIndex % pool.length];
  const savedNote = state.interviewNotes[item.id] ?? '';
  const categories = [
    { id: 'technical', label: 'Technical' }, { id: 'design', label: 'System design' }, { id: 'project', label: 'Project deep dive' }, { id: 'behavioral', label: 'Behavioural' },
  ];
  return `<section class="page-intro compact-intro"><div class="eyebrow">PRACTISE THE WAY YOU SPEAK</div><h1>Interview room.<br><em>Think out loud.</em></h1><p>Pick a round, take one question at a time and practise a clear answer. The best preparation sounds like you, not a memorised script.</p></section>
    <div class="interview-layout"><aside class="interview-side"><div class="eyebrow">CHOOSE A ROUND</div>${categories.map((category, index) => `<button class="interview-category ${interviewCategory === category.id ? 'active' : ''}" data-interview-category="${category.id}"><span>0${index + 1}</span>${category.label}${icon('chevron', 14)}</button>`).join('')}<div class="interview-side-note"><strong>A useful rule</strong><p>Answer the question first. Add context and examples only when they make the answer stronger.</p></div></aside>
      <section class="interview-card"><div class="interview-card-top"><span class="live-chip"><i></i> PRACTICE MODE</span><span>${interviewIndex + 1} / ${pool.length}</span></div><div class="interview-q-meta">${item.topic.toUpperCase()} · ${item.level.toUpperCase()}</div><h2>${item.prompt}</h2><div class="interview-prompt-hint">Take 30 seconds to organise your thoughts, then answer in your own words.</div><div class="interview-self-check"><span>BEFORE YOU FINISH, CHECK:</span><div><i></i> Did I answer the actual question?</div><div><i></i> Did I give a concrete example?</div><div><i></i> Did I explain the trade-off or result?</div></div>${interviewReveal ? `<div class="answer-panel interview-answer"><div class="answer-label">ONE WAY TO STRUCTURE IT</div><p>${item.answer}</p><div class="follow-up"><span>THE INTERVIEWER MAY ASK</span><p>${item.followUp}</p></div></div>` : ''}<div class="interview-card-controls"><button class="button button-quiet" data-action="reveal-interview">${interviewReveal ? 'Hide guidance' : 'Show answer framework'}</button><button class="button button-dark" data-action="next-interview">Next question ${icon('arrow', 14)}</button></div><div class="interview-notes"><label for="interview-note">YOUR PRACTICE NOTES</label><textarea id="interview-note" data-interview-note placeholder="What did you say well? What would you improve on the next attempt?">${escapeHTML(savedNote)}</textarea><div class="notes-bottom"><span>Saved on this device</span><button class="text-link" data-action="save-interview-note">Save notes ${icon('arrow', 13)}</button></div></div></section></div>`;
}

function applicationsPage() {
  const companies = state.companies;
  return `<section class="page-intro compact-intro"><div class="eyebrow">KEEP THE PROCESS VISIBLE</div><h1>Every application.<br><em>One clear next step.</em></h1><p>Track companies and rounds in one place. The hiring process varies by company, but the preparation loop stays familiar.</p></section>
    <form class="add-company-form" data-form="add-company"><div class="add-company-title"><span class="plus-square">${icon('plus', 17)}</span><div><strong>Add an application</strong><small>Start with the company and role. Update the stage as you move forward.</small></div></div><div class="add-company-fields"><input name="company" required maxlength="70" placeholder="Company name"><input name="role" required maxlength="70" placeholder="Role (e.g. SDE I)"><button class="button button-dark" type="submit">Add to tracker ${icon('arrow', 14)}</button></div></form>
    <div class="application-summary"><span>${companies.length} ACTIVE ${companies.length === 1 ? 'APPLICATION' : 'APPLICATIONS'}</span><span>${companies.filter((company) => company.stage === 'hr').length} AT FINAL STAGE</span></div>
    ${companies.length ? `<div class="application-list">${companies.map((company) => { const stageIndex = processStages.findIndex((stage) => stage.id === company.stage); return `<article class="application-card"><div class="company-avatar">${escapeHTML(company.company.slice(0, 2).toUpperCase())}</div><div class="company-main"><div class="company-main-top"><h3>${escapeHTML(company.company)}</h3><span>ADDED ${new Date(company.createdAt).toLocaleDateString('en-IN')}</span></div><p>${escapeHTML(company.role)}</p><div class="application-steps">${processStages.map((stage, index) => `<span class="application-step ${index <= stageIndex ? 'step-done' : ''}" title="${stage.title}"></span>`).join('')}</div><div class="application-stage-label"><span>${processStages[stageIndex]?.title ?? 'Resume & shortlist'}</span><span>STAGE ${Math.max(1, stageIndex + 1)} / ${processStages.length}</span></div></div><div class="company-actions"><select data-company-stage="${company.id}" aria-label="Update stage for ${escapeHTML(company.company)}">${processStages.map((stage) => `<option value="${stage.id}" ${company.stage === stage.id ? 'selected' : ''}>${stage.title}</option>`).join('')}</select><button class="icon-button danger" data-delete-company="${company.id}" title="Remove application">${icon('close', 16)}</button></div></article>`; }).join('')}</div>` : `<div class="empty-state application-empty"><div class="empty-doodle">R<span>0</span></div><h3>Your tracker starts here.</h3><p>Add the first company you are preparing for. Keep the stage current and write down the next action outside your head.</p></div>`}
    <section class="process-reference"><div class="eyebrow">A TYPICAL CAMPUS HIRING FLOW</div><div class="process-reference-grid">${processStages.map((stage, index) => `<div><span>0${index + 1}</span><strong>${stage.title}</strong><p>${stage.detail}</p></div>`).join('')}</div></section>`;
}

function plannerPage() {
  const completed = state.studyPlanDone.length;
  return `<section class="page-intro compact-intro"><div class="eyebrow">CONSISTENCY BEATS CRAMMING</div><h1>Make a plan.<br><em>Keep it human.</em></h1><p>A small, repeatable session is more useful than a perfect timetable you never follow. Check off what you actually finish.</p></section>
    <section class="planner-overview"><div><span class="eyebrow">TODAY'S PROGRESS</span><strong>${completed}<small> / ${studyPlan.length}</small></strong><p>${completed === studyPlan.length ? 'You showed up for every task today.' : 'A focused session is enough to move forward.'}</p></div><div class="planner-ring" style="--progress:${Math.round(completed / studyPlan.length * 100)}%"><div><strong>${Math.round(completed / studyPlan.length * 100)}%</strong><small>DONE</small></div></div></section>
    <div class="planner-task-list">${studyPlan.map((task, index) => `<label class="planner-task ${state.studyPlanDone.includes(task.id) ? 'is-done' : ''}"><input type="checkbox" data-plan-check="${task.id}" ${state.studyPlanDone.includes(task.id) ? 'checked' : ''}><span class="planner-check">${icon('check', 15)}</span><span class="planner-task-number">0${index + 1}</span><span class="planner-task-copy"><strong>${task.title}</strong><small>${task.detail}</small></span><span class="planner-task-status">${state.studyPlanDone.includes(task.id) ? 'COMPLETE' : 'TO DO'}</span></label>`).join('')}</div>
    <div class="planner-tip"><strong>Reset tomorrow, not right now.</strong><p>This checklist is a daily prompt. Your completed lessons, saved questions and assessment history stay in your revision record.</p><button class="text-link" data-action="reset-plan">Reset today's checklist ${icon('arrow', 13)}</button></div>`;
}

function revisionPage() {
  const savedTopics = topics.filter((topic) => state.savedTopics.includes(topic.id));
  const savedQuestions = questions.filter((question) => state.savedQuestions.includes(question.id));
  const history = state.assessmentHistory;
  return `<section class="page-intro compact-intro"><div class="eyebrow">YOUR PERSONAL REVIEW SHELF</div><h1>Keep the things<br><em>you need to revisit.</em></h1><p>Saved concepts, interview prompts and assessment history live here. Use it as a focused revision list before a round.</p></section>
    <section class="revision-section"><div class="section-heading"><div><div class="eyebrow">BOOKMARKED CONCEPTS</div><h2>Lessons to revisit</h2></div><span class="track-section-count">${savedTopics.length}</span></div>${savedTopics.length ? `<div class="lesson-list">${savedTopics.map((topic, index) => lessonRow(topic, index)).join('')}</div>` : '<div class="empty-inline">No saved lessons yet. Bookmark a concept when it deserves another look.</div>'}</section>
    <section class="revision-section"><div class="section-heading"><div><div class="eyebrow">INTERVIEW PROMPTS</div><h2>Questions to practise again</h2></div><span class="track-section-count">${savedQuestions.length}</span></div>${savedQuestions.length ? `<div class="question-list">${savedQuestions.map(questionCard).join('')}</div>` : '<div class="empty-inline">Save a question from the question bank to build your own revision set.</div>'}</section>
    <section class="revision-section"><div class="section-heading"><div><div class="eyebrow">YOUR RECENT ATTEMPTS</div><h2>Assessment history</h2></div><button class="subtle-link" data-nav="assessment">Take another ${icon('arrow', 13)}</button></div>${history.length ? `<div class="history-list">${history.map((item, index) => `<div class="history-row"><span>0${index + 1}</span><strong>${item.percentage}%</strong><small>${item.correct} of ${item.total} correct</small><time>${new Date(item.date).toLocaleDateString('en-IN')}</time></div>`).join('')}</div>` : '<div class="empty-inline">Your first assessment will appear here once you finish it.</div>'}</section>`;
}

function resourcesPage() {
  return `<section class="page-intro compact-intro"><div class="eyebrow">GOOD SOURCES, LESS TAB-HOPPING</div><h1>Resource shelf.<br><em>Go deeper when you need to.</em></h1><p>The lessons here are original summaries and study prompts. These external references provide the deeper explanations, interactive exercises and primary documentation behind the curriculum.</p></section>
    <div class="resource-note"><span>READING NOTE</span><p>Use one primary explanation, then test your understanding with a problem or interview question. Do not collect resources as a substitute for practice.</p></div>
    <div class="resource-grid">${resources.map((resource, index) => `<article class="resource-card"><div class="resource-card-top"><span>0${index + 1}</span><small>${resource.kind}</small></div><h3>${resource.name}</h3><p>${resource.note}</p><div class="resource-tags">${resource.subjects.map((id) => `<i>${tracks.find((track) => track.id === id)?.short ?? id}</i>`).join('')}</div><a href="${resource.url}" target="_blank" rel="noopener noreferrer" class="resource-link">Open source ${icon('external', 14)}</a></article>`).join('')}</div>
    <div class="source-ethics"><strong>How the content is assembled</strong><p>RoundZero uses short, independently written explanations and interview prompts informed by public learning resources. It does not reproduce paid course material or copy third-party question banks wholesale. External links remain with their original publishers.</p></div>`;
}

function renderApp() {
  const pages = {
    overview: overviewPage, learn: learnPage, coding: codingPage, questions: questionsPage, assessment: assessmentPage,
    interview: interviewPage, applications: applicationsPage, planner: plannerPage,
    revision: revisionPage, resources: resourcesPage,
  };
  root.innerHTML = shell((pages[currentView] ?? overviewPage)());
}

function randomiseInterview() {
  const pool = interviewPool();
  if (pool.length > 1) {
    const current = interviewIndex % pool.length;
    interviewIndex = (current + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length;
  }
  interviewReveal = false;
  renderApp();
}

root.addEventListener('click', (event) => {
  const target = event.target.closest('button, a');
  if (!target) return;
  if (target.dataset.nav) { navigate(target.dataset.nav); return; }
  if (target.dataset.openTrack) {
    selectedTrack = tracks.find((track) => track.id === target.dataset.openTrack);
    selectedTopic = null;
    currentView = 'learn';
    renderApp();
    window.scrollTo({ top: 0, behavior: 'instant' });
    return;
  }
  if (target.dataset.openTopic) {
    selectedTopic = topics.find((topic) => topic.id === target.dataset.openTopic);
    selectedTrack = tracks.find((track) => track.id === selectedTopic?.trackId);
    currentView = 'learn';
    renderApp();
    window.scrollTo({ top: 0, behavior: 'instant' });
    return;
  }
  if (target.dataset.completeProblem) {
    state.completedProblems = toggleInList(state.completedProblems, target.dataset.completeProblem);
    persist(); renderApp(); return;
  }
  if (target.dataset.revealQuestion) {
    state.revealedQuestions = toggleInList(state.revealedQuestions, target.dataset.revealQuestion);
    persist(); renderApp(); return;
  }
  if (target.dataset.saveQuestion) {
    state.savedQuestions = toggleInList(state.savedQuestions, target.dataset.saveQuestion);
    persist(); renderApp(); return;
  }
  if (target.dataset.answer !== undefined) {
    if (assessment) {
      const item = assessmentQuestions[assessment.index];
      assessment.answers[item.id] = Number(target.dataset.answer);
      renderApp();
    }
    return;
  }
  if (target.dataset.jumpQuestion !== undefined) {
    if (assessment) { assessment.index = Number(target.dataset.jumpQuestion); renderApp(); }
    return;
  }
  if (target.dataset.interviewCategory) {
    interviewCategory = target.dataset.interviewCategory;
    interviewIndex = 0;
    interviewReveal = false;
    renderApp(); return;
  }
  if (target.dataset.action) {
    const action = target.dataset.action;
    if (action === 'toggle-menu') { mobileMenuOpen = !mobileMenuOpen; renderApp(); }
    if (action === 'close-menu') { mobileMenuOpen = false; renderApp(); }
    if (action === 'back-tracks') { selectedTrack = null; selectedTopic = null; renderApp(); }
    if (action === 'back-track') { selectedTopic = null; renderApp(); }
    if (action === 'complete-topic' && selectedTopic) {
      state.completedTopics = toggleInList(state.completedTopics, selectedTopic.id); persist(); renderApp();
    }
    if (action === 'save-topic' && selectedTopic) {
      state.savedTopics = toggleInList(state.savedTopics, selectedTopic.id); persist(); renderApp();
    }
    if (action === 'save-topic-note' && selectedTopic) {
      const value = document.querySelector('[data-topic-note]')?.value ?? '';
      state.questionNotes[`topic:${selectedTopic.id}`] = value; persist(); toast('Study note saved');
    }
    if (action === 'start-assessment') startAssessment();
    if (action === 'exit-assessment') { clearInterval(assessmentTimer); assessment = null; renderApp(); }
    if (action === 'next-question' && assessment) { assessment.index = Math.min(assessment.index + 1, assessmentQuestions.length - 1); renderApp(); }
    if (action === 'prev-question' && assessment) { assessment.index = Math.max(0, assessment.index - 1); renderApp(); }
    if (action === 'submit-assessment') finishAssessment();
    if (action === 'retry-assessment') { assessmentResult = null; startAssessment(); }
    if (action === 'reveal-interview') { interviewReveal = !interviewReveal; renderApp(); }
    if (action === 'next-interview') randomiseInterview();
    if (action === 'save-interview-note') {
      const item = interviewPool()[interviewIndex % interviewPool().length];
      state.interviewNotes[item.id] = document.querySelector('[data-interview-note]')?.value ?? '';
      persist(); toast('Practice notes saved');
    }
    if (action === 'reset-plan') { state.studyPlanDone = []; persist(); renderApp(); }
  }
});

root.addEventListener('input', (event) => {
  const target = event.target;
  if (target.matches('[data-learn-search]')) {
    learnSearch = target.value;
    const cursor = target.selectionStart;
    renderApp();
    const input = document.querySelector('[data-learn-search]');
    input?.focus(); input?.setSelectionRange(cursor, cursor);
  }
  if (target.matches('[data-coding-search]')) {
    codingSearch = target.value;
    const cursor = target.selectionStart;
    renderApp();
    const input = document.querySelector('[data-coding-search]');
    input?.focus(); input?.setSelectionRange(cursor, cursor);
  }
  if (target.matches('[data-question-search]')) {
    questionSearch = target.value;
    const cursor = target.selectionStart;
    renderApp();
    const input = document.querySelector('[data-question-search]');
    input?.focus(); input?.setSelectionRange(cursor, cursor);
  }
});

root.addEventListener('change', (event) => {
  const target = event.target;
  if (target.matches('[data-plan-check]')) {
    state.studyPlanDone = target.checked ? [...state.studyPlanDone, target.dataset.planCheck] : state.studyPlanDone.filter((id) => id !== target.dataset.planCheck);
    persist(); renderApp();
  }
  if (target.matches('[data-coding-pattern]')) { codingPattern = target.value; renderApp(); }
  if (target.matches('[data-question-subject]')) { questionSubject = target.value; renderApp(); }
  if (target.matches('[data-question-level]')) { questionLevel = target.value; renderApp(); }
  if (target.matches('[data-company-stage]')) {
    const company = state.companies.find((item) => item.id === target.dataset.companyStage);
    if (company) { company.stage = target.value; persist(); renderApp(); }
  }
});

root.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-form="add-company"]');
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  const company = String(data.get('company') ?? '').trim();
  const role = String(data.get('role') ?? '').trim();
  if (!company || !role) return;
  state.companies.unshift({ id: `company-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, company, role, stage: 'screen', createdAt: new Date().toISOString() });
  persist(); renderApp(); toast(`${company} added to your tracker`);
});

root.addEventListener('click', (event) => {
  const target = event.target.closest('[data-delete-company]');
  if (!target) return;
  state.companies = state.companies.filter((company) => company.id !== target.dataset.deleteCompany);
  persist(); renderApp();
});

root.addEventListener('keydown', (event) => {
  if (!event.target.matches('[data-global-search]') || event.key !== 'Enter') return;
  const term = event.target.value.trim();
  if (!term) return;
  const foundTopic = searchTopics(term, topics, tracks)[0];
  const foundQuestion = filterQuestions(questions, { query: term })[0];
  if (foundTopic) {
    selectedTrack = tracks.find((track) => track.id === foundTopic.trackId);
    selectedTopic = foundTopic;
    currentView = 'learn';
  } else if (codingProblems.some((problem) => [problem.title, problem.pattern, problem.signal].join(' ').toLocaleLowerCase().includes(term.toLocaleLowerCase()))) {
    codingSearch = term;
    currentView = 'coding';
  } else if (foundQuestion) {
    questionSearch = term;
    currentView = 'questions';
  } else {
    learnSearch = term;
    currentView = 'learn';
  }
  renderApp();
});

function toast(message) {
  const existing = document.querySelector('.toast');
  existing?.remove();
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  document.body.append(node);
  requestAnimationFrame(() => node.classList.add('visible'));
  setTimeout(() => { node.classList.remove('visible'); setTimeout(() => node.remove(), 240); }, 2300);
}

window.addEventListener('beforeunload', () => clearInterval(assessmentTimer));
renderApp();
