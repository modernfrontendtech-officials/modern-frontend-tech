(() => {
const STORAGE_PREFIX = 'mft_weekly_challenge_v1_';
const BANK = [
  { id: 'study-plan', level: 'Beginner', title: 'Study planner card', goal: 'Build a study planner card with a heading, a short paragraph, and an unordered list of 3 tasks.', checks: ['Use one section or article wrapper', 'Add one heading and one paragraph', 'Add a 3-item unordered list'], hint: 'Think in small blocks: wrapper, heading, paragraph, list.' },
  { id: 'profile-card', level: 'Beginner', title: 'Simple profile card', goal: 'Create a profile card with an image, a name, a short bio, and one external link.', checks: ['Use an img with alt text', 'Add a heading for the name', 'Add one working anchor link'], hint: 'A figure or article can work well here.' },
  { id: 'resource-links', level: 'Beginner', title: 'Learning resources box', goal: 'Create a box with a title and 3 learning links inside a nav or list.', checks: ['Add one heading', 'Include exactly 3 links', 'Keep the links grouped clearly'], hint: 'A nav with anchors or a ul with linked items both work.' },
  { id: 'quote-block', level: 'Beginner', title: 'Motivation quote layout', goal: 'Build a quote block with a blockquote, one citation, and a short description below it.', checks: ['Use blockquote for the quote', 'Use cite for the source', 'Add a paragraph below the quote'], hint: 'This challenge is about semantic quotation markup.' },
  { id: 'table-report', level: 'Intermediate', title: 'Weekly score table', goal: 'Create a table showing 3 students and their scores with a caption and table headers.', checks: ['Use caption', 'Use th for the header row', 'Add 3 body rows'], hint: 'Keep the table small but structurally complete.' },
  { id: 'feature-grid', level: 'Intermediate', title: 'Feature showcase', goal: 'Build a section with 3 feature cards. Each card should have a heading and a paragraph.', checks: ['Use one wrapper section', 'Create 3 repeated feature blocks', 'Give each block a heading and paragraph'], hint: 'Divs or articles both fit here.' },
  { id: 'form-contact', level: 'Intermediate', title: 'Contact form', goal: 'Create a contact form with labels, name input, email input, textarea, and submit button.', checks: ['Use a form wrapper', 'Match each label to an input id', 'Add a textarea and a submit button'], hint: 'Accessibility matters here: labels should connect properly.' },
  { id: 'media-card', level: 'Intermediate', title: 'Multimedia lesson card', goal: 'Create a lesson card with a video or audio element, title, and supporting text.', checks: ['Use a multimedia tag', 'Add controls', 'Add text that explains the media'], hint: 'If you do not want a real file path, use a placeholder source.' },
  { id: 'semantic-layout', level: 'Intermediate', title: 'Semantic article layout', goal: 'Create a page fragment using header, nav, main, article, and footer in the correct order.', checks: ['Use all 5 semantic elements', 'Keep main around the article content', 'Put nav near the top'], hint: 'This is a structure challenge more than a design challenge.' },
  { id: 'gallery-figure', level: 'Intermediate', title: 'Mini image gallery', goal: 'Build a gallery with 3 figures. Each figure needs an image and a figcaption.', checks: ['Use 3 figure elements', 'Give every image alt text', 'Add a figcaption for each image'], hint: 'A section wrapping 3 figures is enough.' },
  { id: 'embedded-panel', level: 'Intermediate', title: 'Embedded panel', goal: 'Create a panel with a heading, short intro, and an iframe below it.', checks: ['Add one heading', 'Use an iframe with title', 'Wrap everything in a clear container'], hint: 'Even simple embed layouts should stay semantic.' },
  { id: 'glossary-list', level: 'Intermediate', title: 'Glossary block', goal: 'Create a small glossary using a description list with 3 terms and definitions.', checks: ['Use dl', 'Add 3 dt elements', 'Add 3 matching dd elements'], hint: 'Description lists are great for definition-style content.' },
  { id: 'registration-form', level: 'Advanced', title: 'Registration form', goal: 'Build a registration form with fieldset, legend, required fields, a select dropdown, and a submit button.', checks: ['Use fieldset and legend', 'Mark key fields as required', 'Add one select element'], hint: 'This challenge combines form structure and attributes.' },
  { id: 'course-outline', level: 'Advanced', title: 'Course outline section', goal: 'Create a course outline with 3 modules, and under each module add a nested list of 2 lessons.', checks: ['Use nested lists', 'Create 3 top-level modules', 'Give each module 2 lesson items'], hint: 'Ordered or unordered lists both work if the structure is clear.' },
  { id: 'pricing-table', level: 'Advanced', title: 'Pricing comparison table', goal: 'Build a pricing table with plan names, prices, and one feature row for 3 plans.', checks: ['Use a header row', 'Include 3 plan columns', 'Add at least 2 body rows'], hint: 'Think of a simple SaaS pricing comparison.' },
  { id: 'code-reference', level: 'Advanced', title: 'Code reference card', goal: 'Create a reference card with a heading, a pre/code example, and a short explanation paragraph.', checks: ['Use pre and code together', 'Add one explanatory paragraph', 'Wrap the whole thing in a semantic container'], hint: 'This is a good place to show how a tag is used.' }
];

function byId(id) { return document.getElementById(id); }
function pageDoc(snippet) {
  const clean = (snippet || '').trim();
  if (!clean) {
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>body{margin:0;display:grid;place-items:center;min-height:100vh;font-family:Arial,sans-serif;color:#64748b;background:#f8fafc;padding:24px;text-align:center}</style></head><body><p>Write HTML in the editor to preview your weekly challenge.</p></body></html>';
  }
  if (/<!doctype/i.test(clean) || /<html[\s>]/i.test(clean)) return clean;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{margin:0;padding:18px;font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;background:#fff}table{border-collapse:collapse}td,th{border:1px solid #cbd5e1;padding:8px}</style></head><body>${clean}</body></html>`;
}

function mondayOf(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekToken() {
  const monday = mondayOf(new Date());
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

function weekRangeLabel() {
  const start = mondayOf(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}

function seedFrom(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash || 1;
}

function shuffle(items, seedText) {
  const copy = [...items];
  let seed = seedFrom(seedText);
  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function storageKey(token) { return `${STORAGE_PREFIX}${token}`; }
function readState(token) {
  try { return JSON.parse(localStorage.getItem(storageKey(token))) || { activeId: '', answers: {} }; }
  catch { return { activeId: '', answers: {} }; }
}
function saveState(token, state) { try { localStorage.setItem(storageKey(token), JSON.stringify(state)); } catch {} }

function init() {
  const list = byId('weekly-challenge-list');
  if (!list) return;

  const token = weekToken();
  const challenges = shuffle(BANK, token).slice(0, 4);
  const state = readState(token);
  if (!state.activeId || !challenges.some((item) => item.id === state.activeId)) state.activeId = challenges[0].id;

  const weekLabel = byId('weekly-week-label');
  const packRange = byId('weekly-pack-range');
  const startedCount = byId('weekly-started-count');
  const clearButton = byId('weekly-clear-button');
  const activeLevel = byId('weekly-active-level');
  const activeTitle = byId('weekly-active-title');
  const activeGoal = byId('weekly-active-goal');
  const activeChecks = byId('weekly-active-checks');
  const activeHint = byId('weekly-active-hint');
  const editor = byId('weekly-editor');
  const preview = byId('weekly-preview');
  const headline = byId('weekly-challenge-headline');
  const subtitle = byId('weekly-challenge-subtitle');

  weekLabel.textContent = `Challenge pack for ${weekRangeLabel()}`;
  packRange.textContent = `Week starting ${token}`;
  headline.textContent = `Weekly HTML challenge pack: ${weekRangeLabel()}`;
  subtitle.textContent = 'This pack rotates automatically from the challenge bank every Monday, so the set changes as the week changes.';

  function activeChallenge() {
    return challenges.find((item) => item.id === state.activeId) || challenges[0];
  }

  function answerFor(id) { return state.answers[id] || ''; }

  function renderList() {
    list.innerHTML = challenges.map((challenge, index) => {
      const started = answerFor(challenge.id).trim().length > 0;
      const active = challenge.id === state.activeId;
      return `<button type="button" class="weekly-challenge-list-button ${active ? 'is-active' : ''} ${started ? 'is-started' : ''}" data-id="${challenge.id}"><span>Challenge ${index + 1} · ${challenge.level}</span><strong>${challenge.title}</strong><p>${challenge.goal}</p></button>`;
    }).join('');
    list.querySelectorAll('[data-id]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeId = button.dataset.id;
        saveState(token, state);
        render();
      });
    });
  }

  function renderStatus() {
    const started = challenges.filter((challenge) => answerFor(challenge.id).trim().length > 0).length;
    startedCount.textContent = `${started} / ${challenges.length}`;
  }

  function render() {
    const challenge = activeChallenge();
    activeLevel.textContent = `${challenge.level} challenge`;
    activeTitle.textContent = challenge.title;
    activeGoal.textContent = challenge.goal;
    activeChecks.innerHTML = challenge.checks.map((item) => `<li>${item}</li>`).join('');
    activeHint.textContent = `Hint: ${challenge.hint}`;
    editor.value = answerFor(challenge.id);
    preview.srcdoc = pageDoc(editor.value);
    renderStatus();
    renderList();
  }

  editor.addEventListener('input', () => {
    const challenge = activeChallenge();
    state.answers[challenge.id] = editor.value;
    saveState(token, state);
    preview.srcdoc = pageDoc(editor.value);
    renderStatus();
    renderList();
  });

  clearButton.addEventListener('click', () => {
    const confirmed = window.confirm('Clear all saved weekly challenge answers for this week?');
    if (!confirmed) return;
    state.answers = {};
    state.activeId = challenges[0].id;
    saveState(token, state);
    render();
  });

  render();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
