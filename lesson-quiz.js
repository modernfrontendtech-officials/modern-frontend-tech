(() => {
const BANK = {
  'whatishtml.html': ['Lesson Quiz: What Is HTML?', [
    ['What is HTML mainly used for?', ['Structuring webpage content', 'Styling colors only', 'Running database queries'], 0, 'HTML structures page content.'],
    ['What are the bracketed parts like <p> called?', ['Tags', 'Loops', 'Variables'], 0, 'HTML elements are made with tags.'],
    ['Where is HTML interpreted for the user?', ['In the browser', 'Only in Excel', 'Only in Photoshop'], 0, 'Browsers read HTML and render the page.']
  ]],
  'firstcode.html': ['Lesson Quiz: First Code', [
    ['Which section holds visible content?', ['<body>', '<head>', '<title>'], 0, 'Visible content belongs in the body.'],
    ['Where does the page title belong?', ['Inside <head>', 'Inside <footer>', 'Inside <article>'], 0, 'The title element belongs in the head.'],
    ['Which example closes an h1 correctly?', ['<h1>Heading</h1>', '<h1>Heading<h1>', '<heading1>Heading</heading1>'], 0, 'Opening and closing tags should match.']
  ]],
  'movingforward.html': ['Lesson Quiz: Comments and Formatting', [
    ['Which syntax makes an HTML comment?', ['<!-- comment -->', '// comment', '/* comment */'], 0, 'HTML comments use <!-- and -->.'],
    ['Which tag creates a hyperlink?', ['<a>', '<jump>', '<connect>'], 0, 'The anchor tag creates links.'],
    ['Which tag usually marks important text?', ['<strong>', '<fade>', '<line>'], 0, 'Strong is used for strong importance.']
  ]],
  'htmlstructure.html': ['Lesson Quiz: HTML Structure', [
    ['Which layout is normal for an HTML file?', ['html > head + body', 'body > html + head', 'head > footer + body'], 0, 'The normal root layout is html with head and body inside.'],
    ['What usually belongs in the head?', ['Metadata and setup', 'Visible lesson paragraphs', 'Footer links only'], 0, 'The head is for metadata and setup.'],
    ['What usually belongs in the body?', ['Visible page content', 'Only the title tag', 'Only charset meta tags'], 0, 'The body contains the visible content.']
  ]],
  'quotationandcitiation.html': ['Lesson Quiz: Quotation and Citation', [
    ['Which tag is best for a longer quoted block?', ['<blockquote>', '<q>', '<cite>'], 0, 'Blockquote is for longer quoted sections.'],
    ['Which tag is best for a short inline quote?', ['<q>', '<blockquote>', '<sup>'], 0, 'Q is for inline quotations.'],
    ['Which tag is commonly used for the source title?', ['<cite>', '<source>', '<mark>'], 0, 'Cite is used for cited works or titles.']
  ]],
  'links.html': ['Lesson Quiz: Links', [
    ['Which attribute tells a link where to go?', ['href', 'src', 'alt'], 0, 'Href stores the destination.'],
    ['Which target value opens a new tab?', ['_blank', '_top', '_next'], 0, 'target="_blank" opens a new browsing context.'],
    ['How do you link to id="about" on the same page?', ['href="#about"', 'href="@about"', 'href="about."'], 0, 'Fragment links use # plus the id.']
  ]],
  'images.html': ['Lesson Quiz: Images', [
    ['Which attribute gives the image file path?', ['src', 'href', 'title'], 0, 'The src attribute points to the image file.'],
    ['Which attribute describes the image for accessibility?', ['alt', 'style', 'method'], 0, 'Alt text helps accessibility and fallback.'],
    ['Which tag places an image on a page?', ['<img>', '<picturetext>', '<graphic>'], 0, 'Img is the standard image element.']
  ]],
  'favicon.html': ['Lesson Quiz: Favicon', [
    ['Which element is commonly used for a favicon?', ['<link rel="icon">', '<img rel="icon">', '<meta icon="true">'], 0, 'Favicons are usually added with a link element.'],
    ['Where does the favicon link usually go?', ['Inside <head>', 'Inside <footer>', 'Inside <section>'], 0, 'The favicon setup belongs in the head.'],
    ['What does a favicon mainly affect?', ['The browser tab icon', 'The paragraph font size', 'The page background color'], 0, 'A favicon is the small browser tab icon.']
  ]],
  'title.html': ['Lesson Quiz: Title', [
    ['What does the title element mainly control?', ['The browser tab text', 'The first page heading', 'The body background image'], 0, 'The title is shown in the browser tab.'],
    ['Where should the title element be placed?', ['Inside <head>', 'Inside <main>', 'Inside <nav>'], 0, 'Title belongs in the head section.'],
    ['Is the title usually visible in the page body?', ['No, it usually appears in the tab instead', 'Yes, it becomes a paragraph', 'Yes, it replaces the footer'], 0, 'The title is not normal body content.']
  ]],
  'table.html': ['Lesson Quiz: Tables', [
    ['Which element creates a table row?', ['<tr>', '<td>', '<th>'], 0, 'Tr creates a row.'],
    ['Which element is commonly used for a header cell?', ['<th>', '<td>', '<captionline>'], 0, 'Th is for header cells.'],
    ['Which element can name the whole table?', ['<caption>', '<label>', '<summary>'], 0, 'Caption gives the table a title.']
  ]],
  'lists.html': ['Lesson Quiz: Lists', [
    ['Which element creates an unordered list?', ['<ul>', '<ol>', '<li>'], 0, 'Ul creates a bulleted list.'],
    ['Which element creates an ordered list?', ['<ol>', '<ul>', '<dl>'], 0, 'Ol creates a numbered list.'],
    ['Which element represents each item?', ['<li>', '<item>', '<point>'], 0, 'Li is the standard list item element.']
  ]],
  'block&inline.html': ['Lesson Quiz: Block and Inline', [
    ['What is true about block elements?', ['They usually start on a new line', 'They can never hold text', 'They only work in tables'], 0, 'Block elements typically start on a new line.'],
    ['Which element is commonly inline by default?', ['<span>', '<div>', '<section>'], 0, 'Span is commonly inline.'],
    ['Which element is commonly block-level by default?', ['<div>', '<span>', '<strong>'], 0, 'Div is commonly block-level.']
  ]],
  'divs,classes,ids.html': ['Lesson Quiz: Divs, Classes, and IDs', [
    ['Which attribute can be reused on many elements?', ['class', 'id', 'unique'], 0, 'Classes can be shared across many elements.'],
    ['Which attribute should normally be unique on a page?', ['id', 'class', 'style'], 0, 'Ids are normally unique.'],
    ['Which element is often a generic container?', ['<div>', '<ruby>', '<meta>'], 0, 'Div is a generic block container.']
  ]],
  'buttons,iframes.html': ['Lesson Quiz: Buttons and Iframes', [
    ['Which tag creates a clickable button?', ['<button>', '<press>', '<click>'], 0, 'Button creates a clickable button.'],
    ['Which tag embeds another page area?', ['<iframe>', '<framebox>', '<embedpage>'], 0, 'Iframe embeds another browsing context.'],
    ['Which attribute on an iframe loads the page URL?', ['src', 'alt', 'method'], 0, 'Iframe uses src for its URL.']
  ]],
  'everythinginhead.html': ['Lesson Quiz: Everything in Head', [
    ['Which meta tag commonly sets character encoding?', ['<meta charset="UTF-8">', '<meta font="UTF-8">', '<meta body="UTF-8">'], 0, 'Charset metadata tells the browser how to read text.'],
    ['Which element commonly connects an external CSS file?', ['<link>', '<style href="">', '<css>'], 0, 'A link element is used for external stylesheets.'],
    ['Where are metadata and setup links often placed?', ['Inside <head>', 'Inside each paragraph', 'Only in <footer>'], 0, 'Many setup resources live in the head section.']
  ]],
  'computercode.html': ['Lesson Quiz: Computer Code', [
    ['Which element is best for short inline code?', ['<code>', '<kbd>', '<aside>'], 0, 'Code is for inline code snippets.'],
    ['Which element preserves line breaks and spacing?', ['<pre>', '<small>', '<em>'], 0, 'Pre preserves whitespace.'],
    ['Which element usually marks keyboard input?', ['<kbd>', '<mark>', '<cite>'], 0, 'Kbd is used for keyboard input.']
  ]],
  'senmantics.html': ['Lesson Quiz: Semantics', [
    ['Which semantic element usually wraps main navigation?', ['<nav>', '<code>', '<strong>'], 0, 'Nav is for major navigation links.'],
    ['Which element should contain the main page content?', ['<main>', '<title>', '<meta>'], 0, 'Main holds the primary content.'],
    ['Which element suits a standalone blog post or lesson card?', ['<article>', '<track>', '<wbr>'], 0, 'Article is for self-contained content.']
  ]],
  'htmlsymbols.html': ['Lesson Quiz: HTML Symbols', [
    ['Which entity shows a literal less-than sign?', ['&lt;', '&copy;', '&nbsp;'], 0, 'Use &lt; to show the < character.'],
    ['Which entity commonly creates a copyright symbol?', ['&copy;', '&reg;', '&gt;'], 0, 'The copy entity renders the copyright symbol.'],
    ['Which entity creates a non-breaking space?', ['&nbsp;', '&ensp;', '&tag;'], 0, 'Nbsp creates a space that does not collapse normally.']
  ]],
  'canvas.html': ['Lesson Quiz: Canvas', [
    ['Which element creates a drawing area?', ['<canvas>', '<draw>', '<svgbox>'], 0, 'Canvas creates a drawable area.'],
    ['What is usually needed to draw on canvas?', ['JavaScript', 'Only a title tag', 'Only a footer'], 0, 'Canvas is usually controlled with JavaScript.'],
    ['Why might fallback text go inside canvas?', ['To show something if canvas is unsupported', 'To add CSS variables', 'To replace the head section'], 0, 'Fallback text can appear if canvas is unavailable.']
  ]],
  'fromspart1.html': ['Lesson Quiz: Forms Part 1', [
    ['Which element wraps form controls together?', ['<form>', '<option>', '<table>'], 0, 'Form groups inputs and controls.'],
    ['Which attribute on label connects it to an input id?', ['for', 'src', 'alt'], 0, 'A label uses for to point to the input id.'],
    ['Which attribute often controls where form data is sent?', ['action', 'poster', 'rows'], 0, 'Action points to the submission destination.']
  ]],
  'forms2.html': ['Lesson Quiz: Forms Part 2', [
    ['Which element groups related form controls?', ['<fieldset>', '<legendonly>', '<group>'], 0, 'Fieldset groups related controls.'],
    ['Which element gives a title to a fieldset?', ['<legend>', '<caption>', '<label>'], 0, 'Legend labels the fieldset.'],
    ['Which element can provide suggestion options for an input?', ['<datalist>', '<summary>', '<canvas>'], 0, 'Datalist offers predefined suggestions.']
  ]],
  'forms3.html': ['Lesson Quiz: Forms Part 3', [
    ['Which attribute makes a field mandatory?', ['required', 'optional', 'checked'], 0, 'Required means the field must be filled in.'],
    ['Which attribute shows hint text before typing?', ['placeholder', 'method', 'valueonly'], 0, 'Placeholder shows a temporary hint.'],
    ['Which attribute prevents editing while showing the value?', ['readonly', 'hidden', 'target'], 0, 'Readonly keeps the value visible but not editable.']
  ]],
  'multimedia.html': ['Lesson Quiz: Multimedia', [
    ['Which element is commonly used for sound?', ['<audio>', '<music>', '<sound>'], 0, 'Audio is the standard sound element.'],
    ['Which element is commonly used for video playback?', ['<video>', '<movie>', '<screen>'], 0, 'Video is the standard video element.'],
    ['Which attribute commonly shows playback controls?', ['controls', 'poster', 'inline'], 0, 'Controls tells the browser to show playback controls.']
  ]],
  'word.html': ['Lesson Quiz: Word and Ruby', [
    ['Which element suggests a safe line-break point in a long word?', ['<wbr>', '<br>', '<rb>'], 0, 'Wbr marks a possible word-break location.'],
    ['Which element is used for ruby annotation text?', ['<rt>', '<rp>', '<ul>'], 0, 'Rt contains ruby annotation text.'],
    ['Which element wraps the full ruby structure?', ['<ruby>', '<mark>', '<aside>'], 0, 'Ruby wraps annotated East Asian text.']
  ]]
};

function page() { return (location.pathname.split('/').pop() || 'index.html').toLowerCase(); }
function key(p) { return `mft_lesson_quiz_v1_${p}`; }
function state(p) { try { return JSON.parse(localStorage.getItem(key(p))) || { answers: {}, checked: false }; } catch { return { answers: {}, checked: false }; } }
function save(p, v) { try { localStorage.setItem(key(p), JSON.stringify(v)); } catch {} }

function ensureStyle() {
  if (document.getElementById('lesson-quiz-style')) return;
  const style = document.createElement('style');
  style.id = 'lesson-quiz-style';
  style.textContent = '.lesson-quiz-shell{margin:24px auto;padding:24px;border:1px solid rgba(20,33,61,.12);border-radius:24px;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(245,240,231,.96));box-shadow:0 16px 34px rgba(20,33,61,.08);color:#14213d}.lesson-quiz-shell h2,.lesson-quiz-shell h3,.lesson-quiz-shell p,.lesson-quiz-shell label{color:#14213d}.lesson-quiz-head{display:grid;gap:8px;margin-bottom:18px}.lesson-quiz-kicker{display:inline-flex;width:fit-content;padding:6px 10px;border-radius:999px;background:rgba(37,99,235,.12);color:#1d4ed8;font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.lesson-quiz-grid{display:grid;gap:16px}.lesson-quiz-question{padding:18px;border-radius:18px;border:1px solid rgba(20,33,61,.12);background:#fffdf8}.lesson-quiz-question h3{margin:0 0 12px;font-size:1.04rem}.lesson-quiz-options{display:grid;gap:10px}.lesson-quiz-option{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:14px;border:1px solid rgba(20,33,61,.1);background:#fff;cursor:pointer}.lesson-quiz-option input{margin-top:4px}.lesson-quiz-option.is-correct{border-color:rgba(29,122,76,.34);background:rgba(29,122,76,.08)}.lesson-quiz-option.is-incorrect{border-color:rgba(180,56,46,.34);background:rgba(180,56,46,.08)}.lesson-quiz-feedback{margin-top:12px;padding:12px 14px;border-radius:14px;background:rgba(20,33,61,.05);border:1px solid rgba(20,33,61,.08)}.lesson-quiz-actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:18px}.lesson-quiz-button,.lesson-quiz-reset{border:none;border-radius:999px;padding:12px 18px;font-weight:700;cursor:pointer}.lesson-quiz-button{background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#fff}.lesson-quiz-reset{background:#e5e7eb;color:#14213d}.lesson-quiz-score{font-weight:700;color:#14213d}@media (max-width:700px){.lesson-quiz-shell{padding:18px;border-radius:20px}.lesson-quiz-actions{flex-direction:column;align-items:stretch}}';
  document.head.appendChild(style);
}

function where() {
  const footer = document.querySelector('footer');
  if (footer && footer.parentNode) return [footer.parentNode, footer];
  const main = document.querySelector('main');
  if (main) return [main, null];
  return [document.body, null];
}

function init() {
  const p = page();
  const quiz = BANK[p];
  if (!quiz || document.querySelector('.lesson-quiz-shell')) return;
  ensureStyle();
  const s = state(p);
  const [title, questions] = quiz;
  const section = document.createElement('section');
  section.className = 'lesson-quiz-shell';
  section.innerHTML = `<div class="lesson-quiz-head"><span class="lesson-quiz-kicker">Lesson Quiz</span><h2>${title}</h2><p>Answer these 3 quick questions before moving to the next lesson.</p></div><div class="lesson-quiz-grid"></div><div class="lesson-quiz-actions"><button type="button" class="lesson-quiz-button">Check Answers</button><button type="button" class="lesson-quiz-reset">Reset Quiz</button><p class="lesson-quiz-score" aria-live="polite"></p></div>`;
  const grid = section.querySelector('.lesson-quiz-grid');
  const score = section.querySelector('.lesson-quiz-score');
  const check = section.querySelector('.lesson-quiz-button');
  const reset = section.querySelector('.lesson-quiz-reset');

  questions.forEach((question, i) => {
    const card = document.createElement('article');
    card.className = 'lesson-quiz-question';
    card.innerHTML = `<h3>Question ${i + 1}: ${question[0]}</h3><div class="lesson-quiz-options"></div><div class="lesson-quiz-feedback" hidden></div>`;
    const options = card.querySelector('.lesson-quiz-options');
    question[1].forEach((choice, choiceIndex) => {
      const id = `${p}-q${i}-c${choiceIndex}`;
      const label = document.createElement('label');
      label.className = 'lesson-quiz-option';
      label.htmlFor = id;
      label.innerHTML = `<input type="radio" id="${id}" name="${p}-q${i}" value="${choiceIndex}"><span>${choice}</span>`;
      const input = label.querySelector('input');
      if (String(s.answers[i]) === String(choiceIndex)) input.checked = true;
      input.addEventListener('change', () => {
        s.answers[i] = choiceIndex;
        s.checked = false;
        save(p, s);
        paint();
      });
      options.appendChild(label);
    });
    grid.appendChild(card);
  });

  function paint() {
    let total = 0;
    grid.querySelectorAll('.lesson-quiz-question').forEach((card, i) => {
      const answer = questions[i][2];
      const note = questions[i][3];
      const selected = Number(s.answers[i]);
      const hasAnswer = Number.isInteger(selected);
      const feedback = card.querySelector('.lesson-quiz-feedback');
      card.querySelectorAll('.lesson-quiz-option').forEach((label, choiceIndex) => {
        label.classList.remove('is-correct', 'is-incorrect');
        if (!s.checked) return;
        if (choiceIndex === answer) label.classList.add('is-correct');
        else if (hasAnswer && choiceIndex === selected) label.classList.add('is-incorrect');
      });

      if (!s.checked) {
        feedback.hidden = true;
        feedback.textContent = '';
        return;
      }

      const correct = hasAnswer && selected === answer;
      if (correct) total += 1;
      feedback.hidden = false;
      feedback.innerHTML = correct ? `<strong>Correct.</strong> ${note}` : `<strong>Answer:</strong> ${questions[i][1][answer]}. ${note}`;
    });
    score.textContent = s.checked ? `Score: ${total} / ${questions.length}` : '';
  }

  check.addEventListener('click', () => {
    s.checked = true;
    save(p, s);
    paint();
  });

  reset.addEventListener('click', () => {
    s.answers = {};
    s.checked = false;
    save(p, s);
    section.querySelectorAll('input[type="radio"]').forEach((input) => { input.checked = false; });
    paint();
  });

  const [parent, before] = where();
  if (before) parent.insertBefore(section, before); else parent.appendChild(section);
  paint();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
