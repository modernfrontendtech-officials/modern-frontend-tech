
        const canUseExam = window.siteAuth?.requireAuth?.({
            title: "Sign in to take the HTML exam",
            message: "Students must sign in or create an account before starting the certification exam.",
            next: "exam.html"
        }) ?? true;

        if (!canUseExam) {
            // Prevent exam setup and timers from starting for signed-out visitors.
        } else {
        const EXAM_STORAGE_KEY = "mft_html_exam_state_v1";
        const EXAM_DURATION_MINUTES = 180;
        const EXAM_DURATION_MS = EXAM_DURATION_MINUTES * 60 * 1000;
        const VOID_ELEMENTS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

        const lessonGroups = [
            {
                lesson: "Lesson 1: HTML basics",
                problems: [
                    { prompt: "Repair this intro card so it contains one div with an h1, an h2, and one paragraph in that order.", broken: `<div><h1>HTML bootcamp<h2>Week 1</h3><pr>Build real pages fast.</pr></div>`, solution: `<div><h1>HTML bootcamp</h1><h2>Week 1</h2><p>Build real pages fast.</p></div>` },
                    { prompt: "Fix this lesson summary so it uses one section with one h1 and exactly two paragraphs.", broken: `<section><h1>Lesson summary</h1><p>Read the example<p><para>Practice after class.</para></section>`, solution: `<section><h1>Lesson summary</h1><p>Read the example.</p><p>Practice after class.</p></section>` },
                    { prompt: "Repair this page intro so it uses one div with one h1, one h2, and one paragraph, all closed correctly.", broken: `<div><h1>Main topic</h1><h2>Sub topic<h2><p>Start coding today</strong></div>`, solution: `<div><h1>Main topic</h1><h2>Sub topic</h2><p>Start coding today</p></div>` }
                ]
            },
            {
                lesson: "Lesson 2: First code",
                problems: [
                    { prompt: "Repair this starter document so html, head, title, and body are all correct.", broken: `<html><hed><title>Practice page</title></hed><body><h1>Practice page</h1><p>Write code daily.</p></boddy></html>`, solution: `<html><head><title>Practice page</title></head><body><h1>Practice page</h1><p>Write code daily.</p></body></html>` },
                    { prompt: "Fix this first file so the title closes, the body stays inside html, and the paragraph closes before the button.", broken: `<html><head><title>Starter file<title></head><body><h1>My first page</h1><p>Hello there<button>Run</button></body></html>`, solution: `<html><head><title>Starter file</title></head><body><h1>My first page</h1><p>Hello there</p><button>Run</button></body></html>` },
                    { prompt: "Repair this practice file so the article and both paragraphs stay inside the body.", broken: `<html><head><title>Daily practice</title></head><body><article><h1>Daily practice</h1><p>Write one page.</p><p>Review your tags.</body></html>`, solution: `<html><head><title>Daily practice</title></head><body><article><h1>Daily practice</h1><p>Write one page.</p><p>Review your tags.</p></article></body></html>` }
                ]
            },
            {
                lesson: "Lesson 3: Comments and text formatting",
                problems: [
                    { prompt: "Fix this study reminder so the HTML comment, strong tag, and em tag are all valid.", broken: `<!- study plan --><p><strong>Read</b> the <em>markup guide</p>`, solution: `<!-- study plan --><p><strong>Read</strong> the <em>markup guide</em></p>` },
                    { prompt: "Repair this science line so the subscript, superscript, and small text all close correctly.", broken: `<p>Water is H<sub>2<sub>O and area is cm<sup>2</sub> <small>approx<small></p>`, solution: `<p>Water is H<sub>2</sub>O and area is cm<sup>2</sup> <small>approx</small></p>` },
                    { prompt: "Fix the nested formatting so mark, strong, and em all close in the correct order.", broken: `<p><mark>Important <strong>practice</mark></strong> every <em>day</i></p>`, solution: `<p><mark>Important <strong>practice</strong></mark> every <em>day</em></p>` }
                ]
            },
            {
                lesson: "Lesson 4: HTML structure",
                problems: [
                    { prompt: "Repair this page shell so the head closes before body and the structure remains html > head + body.", broken: `<html lang="en"><head><meta charset="UTF-8"><title>Guide</title><body><header><h1>Guide</h1></header><main><section><p>Start here</p></section></main></body></html>`, solution: `<html lang="en"><head><meta charset="UTF-8"><title>Guide</title></head><body><header><h1>Guide</h1></header><main><section><p>Start here</p></section></main></body></html>` },
                    { prompt: "Fix this layout so article stays inside main and footer stays outside main.", broken: `<body><header><h1>Course</h1></header><main><article><h2>Intro</h2><p>Read first.</p></main><footer>End of page</footer></body>`, solution: `<body><header><h1>Course</h1></header><main><article><h2>Intro</h2><p>Read first.</p></article></main><footer>End of page</footer></body>` },
                    { prompt: "Repair this document so aside, section, and footer all stay inside body with every closing tag present.", broken: `<html><head><title>Layout</title></head><body><aside><p>Tips</p></aside><section><p>Lesson text</p></section><footer><p>Done</p></body></html>`, solution: `<html><head><title>Layout</title></head><body><aside><p>Tips</p></aside><section><p>Lesson text</p></section><footer><p>Done</p></footer></body></html>` }
                ]
            },
            {
                lesson: "Lesson 5: Quotation and citation",
                problems: [
                    { prompt: "Fix this blockquote so the paragraph and cite both stay inside the blockquote correctly.", broken: `<blockquote cite="https://example.com"><p>Practice every day<p><cite>Coach note</blockquote>`, solution: `<blockquote cite="https://example.com"><p>Practice every day</p><cite>Coach note</cite></blockquote>` },
                    { prompt: "Repair this figure so blockquote, figcaption, and cite are all closed in the right order.", broken: `<figure><blockquote><p>Keep learning</p></blockquote><figcaption><cite>Modern Front End Tech</figcaption></figure>`, solution: `<figure><blockquote><p>Keep learning</p></blockquote><figcaption><cite>Modern Front End Tech</cite></figcaption></figure>` },
                    { prompt: "Fix this sentence so the inline quote and citation both render as valid HTML.", broken: `<p>Teacher said <q>Build small projects</q and <cite>review code</cite></p>`, solution: `<p>Teacher said <q>Build small projects</q> and <cite>review code</cite></p>` }
                ]
            },
            {
                lesson: "Lesson 6: Links",
                problems: [
                    { prompt: "Repair this navigation so all three links use href and close before nav ends.", broken: `<nav><a herf="index.html">Home</a><a href="whatishtml.html">Course</a><a href="exam.html">Exam</nav>`, solution: `<nav><a href="index.html">Home</a><a href="whatishtml.html">Course</a><a href="exam.html">Exam</a></nav>` },
                    { prompt: "Fix this external call-to-action link so target, rel, and strong nesting are all correct.", broken: `<a href="https://frontendtech.com" target="blank"><strong>Visit builder</a></strong>`, solution: `<a href="https://frontendtech.com" target="_blank" rel="noopener noreferrer"><strong>Visit builder</strong></a>` },
                    { prompt: "Repair this paragraph so the fragment link and mailto link are both valid and closed correctly.", broken: `<p><a href="forms2.html#level">Jump to forms level<a> or <a hre="mailto:modernfrontendtech@gmail.com">email us</a></p>`, solution: `<p><a href="forms2.html#level">Jump to forms level</a> or <a href="mailto:modernfrontendtech@gmail.com">email us</a></p>` }
                ]
            },
            {
                lesson: "Lesson 7: Images",
                problems: [
                    { prompt: "Fix this figure so img uses src, alt, width, and height correctly and figcaption stays valid.", broken: `<figure><img scr="card.png" alt="Student card" width="320" heigth="180"><figcaption>Student card preview</figcaption></figure>`, solution: `<figure><img src="card.png" alt="Student card" width="320" height="180"><figcaption>Student card preview</figcaption></figure>` },
                    { prompt: "Repair this picture element by correcting srcset and the fallback img alt text.", broken: `<picture><source media="(min-width: 900px)" scrset="hero-large.jpg"><source media="(min-width: 500px)" srcset="hero-medium.jpg"><img src="hero-small.jpg" atl="Student workspace"></picture>`, solution: `<picture><source media="(min-width: 900px)" srcset="hero-large.jpg"><source media="(min-width: 500px)" srcset="hero-medium.jpg"><img src="hero-small.jpg" alt="Student workspace"></picture>` },
                    { prompt: "Fix this linked image card so the paragraph closes before the anchor closes.", broken: `<a href="gallery.html"><img src="thumb.jpg" alt="Gallery preview"><p>Open gallery</a>`, solution: `<a href="gallery.html"><img src="thumb.jpg" alt="Gallery preview"><p>Open gallery</p></a>` }
                ]
            },
            {
                lesson: "Lesson 8: Favicon",
                problems: [
                    { prompt: "Repair this favicon setup by correcting the relation and switching src to href.", broken: `<head><link rel="favion" type="image/x-icon" src="favicon.ico"><title>Site</title></head>`, solution: `<head><link rel="icon" type="image/x-icon" href="favicon.ico"><title>Site</title></head>` },
                    { prompt: "Fix this head block so both icon links are valid and the title remains inside head.", broken: `<head><link rel="icon" type="image/png" hre="favicon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="apple-touch.png"<title>Site</title></head>`, solution: `<head><link rel="icon" type="image/png" href="favicon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="apple-touch.png"><title>Site</title></head>` },
                    { prompt: "Repair this shortcut favicon line so the rel value is written correctly.", broken: `<head><link rel="shortcuticon" type="image/x-icon" href="favicon.ico"><meta charset="UTF-8"></head>`, solution: `<head><link rel="shortcut icon" type="image/x-icon" href="favicon.ico"><meta charset="UTF-8"></head>` }
                ]
            },
            {
                lesson: "Lesson 9: Title",
                problems: [
                    { prompt: "Fix this head block so the title closes before both meta tags continue.", broken: `<head><title>HTML Exam<title><meta charset="UTF-8"><meta name="description" content="Hard revision set"></head>`, solution: `<head><title>HTML Exam</title><meta charset="UTF-8"><meta name="description" content="Hard revision set"></head>` },
                    { prompt: "Repair this snippet so it uses one correct title tag and one description meta tag.", broken: `<head><titel>Student portal</titel><title>Student portal<title><meta name="description" content="Exam dashboard"></head>`, solution: `<head><title>Student portal</title><meta name="description" content="Exam dashboard"></head>` },
                    { prompt: "Fix this page shell so the title closes before body and the body closes before html.", broken: `<html><head><title>Revision board</head><body><h1>Revision board</h1><p>Stay focused.</p></html>`, solution: `<html><head><title>Revision board</title></head><body><h1>Revision board</h1><p>Stay focused.</p></body></html>` }
                ]
            },
            {
                lesson: "Lesson 10: Table",
                problems: [
                    { prompt: "Repair this weekly scores table so caption, thead, tbody, and both body rows are valid.", broken: `<table><caption>Weekly scores</caption><thead><tr><th>Name</th><th>Score</th></tr></thead><tbody><tr><td>Ana<td>91</td></tr><tr><td>Ben</td><td>84</td></tbody></table>`, solution: `<table><caption>Weekly scores</caption><thead><tr><th>Name</th><th>Score</th></tr></thead><tbody><tr><td>Ana</td><td>91</td></tr><tr><td>Ben</td><td>84</td></tr></tbody></table>` },
                    { prompt: "Fix this summary table so the colspan header stays valid and the last row closes correctly.", broken: `<table><tr><th colspan="2">Weekly scores</th></tr><tr><td>Ana</td><td>91</td></tr><tr><td>Ben<td>84</td></tr></table>`, solution: `<table><tr><th colspan="2">Weekly scores</th></tr><tr><td>Ana</td><td>91</td></tr><tr><td>Ben</td><td>84</td></tr></table>` },
                    { prompt: "Repair this table so the tfoot summary row closes every cell and row correctly.", broken: `<table><thead><tr><th>Topic</th><th>Level</th></tr></thead><tbody><tr><td>Forms</td><td>Advanced</td></tr></tbody><tfoot><tr><td colspan="2">1 topic</tfoot></table>`, solution: `<table><thead><tr><th>Topic</th><th>Level</th></tr></thead><tbody><tr><td>Forms</td><td>Advanced</td></tr></tbody><tfoot><tr><td colspan="2">1 topic</td></tr></tfoot></table>` }
                ]
            },
            {
                lesson: "Lesson 11: Lists",
                problems: [
                    { prompt: "Repair this nested unordered list so every list item and nested list closes correctly.", broken: `<ul><li>HTML<ul><li>Tags<li>Elements</ul></li><li>CSS</li></ul>`, solution: `<ul><li>HTML<ul><li>Tags</li><li>Elements</li></ul></li><li>CSS</li></ul>` },
                    { prompt: "Fix this ordered workflow so the nested unordered list and final review step remain valid.", broken: `<ol><li>Plan</li><li>Build<ul><li>Write HTML<li>Test page</ul></li><li>Review</ol>`, solution: `<ol><li>Plan</li><li>Build<ul><li>Write HTML</li><li>Test page</li></ul></li><li>Review</li></ol>` },
                    { prompt: "Repair this definition list so all three terms keep their matching descriptions.", broken: `<dl><dt>HTML<dd>Markup language<dt>Forms</dt><dd>User input</dd><dt>Canvas<dd>Drawing area</dl>`, solution: `<dl><dt>HTML</dt><dd>Markup language</dd><dt>Forms</dt><dd>User input</dd><dt>Canvas</dt><dd>Drawing area</dd></dl>` }
                ]
            },
            {
                lesson: "Lesson 12: Block and inline elements",
                problems: [
                    { prompt: "Fix this card line so span, strong, and code all stay inline and close correctly inside the div.", broken: `<div>Card title: <span><strong>HTML basics</span></strong> <code>&lt;h1&gt;</div>`, solution: `<div>Card title: <span><strong>HTML basics</strong></span> <code>&lt;h1&gt;</code></div>` },
                    { prompt: "Repair this instruction line so em, code, and span close in the right order.", broken: `<p>Read <em>carefully <code>&lt;section&gt;</em></code> before using a <span>layout helper</p>`, solution: `<p>Read <em>carefully <code>&lt;section&gt;</code></em> before using a <span>layout helper</span></p>` },
                    { prompt: "Fix this badge layout so the block wrapper and the bold paragraph both close correctly.", broken: `<div><span>Inline badge</div></span><p><strong>Below text</p></strong>`, solution: `<div><span>Inline badge</span></div><p><strong>Below text</strong></p>` }
                ]
            },
            {
                lesson: "Lesson 13: Divs, classes, and ids",
                problems: [
                    { prompt: "Repair this grid so the outer class name is correct and both card paragraphs stay closed.", broken: `<div classs="card-grid" id="lesson-grid"><div class="card"><h3>One</h3><p>Start here.</p></div><div class="card"><h3>Two</h3><p>Keep going.</div></div>`, solution: `<div class="card-grid" id="lesson-grid"><div class="card"><h3>One</h3><p>Start here.</p></div><div class="card"><h3>Two</h3><p>Keep going.</p></div></div>` },
                    { prompt: "Fix this dashboard panel so both class and id attributes are written correctly.", broken: `<section class="dashboard"><div clas="panel" idd="summary"><h2>Summary</h2><p>Track progress</p></div></section>`, solution: `<section class="dashboard"><div class="panel" id="summary"><h2>Summary</h2><p>Track progress</p></div></section>` },
                    { prompt: "Repair this layout so the second panel uses the correct class name and the outer wrapper closes.", broken: `<div class="layout"><div class="panel" id="overview"><p class="lead">Course map</p></div><div classs="panel" id="tasks"><p>Next step</p></div>`, solution: `<div class="layout"><div class="panel" id="overview"><p class="lead">Course map</p></div><div class="panel" id="tasks"><p>Next step</p></div></div>` }
                ]
            },
            {
                lesson: "Lesson 14: Buttons and iframes",
                problems: [
                    { prompt: "Fix this action area so the first button uses type=\"button\" and the inner span closes before the button closes.", broken: `<section><button type="buton"><span>Save draft</button><button type="submit">Publish</button></section>`, solution: `<section><button type="button"><span>Save draft</span></button><button type="submit">Publish</button></section>` },
                    { prompt: "Repair this iframe so src, title, loading, and the closing tag are all correct.", broken: `<iframe scr="https://example.com" titel="Example site" loading="lasy"><iframe>`, solution: `<iframe src="https://example.com" title="Example site" loading="lazy"></iframe>` },
                    { prompt: "Fix this preview bar so the reset button type is valid and the iframe closes correctly.", broken: `<div class="actions"><button type="submit"><span>Finish</span></button><button type="reseet">Clear</button><iframe src="preview.html" title="Preview panel"></frame></div>`, solution: `<div class="actions"><button type="submit"><span>Finish</span></button><button type="reset">Clear</button><iframe src="preview.html" title="Preview panel"></iframe></div>` }
                ]
            },
            {
                lesson: "Lesson 15: Everything in head",
                problems: [
                    { prompt: "Repair this head block by fixing the charset value and the viewport content syntax.", broken: `<head><meta charset="UTF=8"><meta name="viewport" content="width=device-width initial-scale=1.0"><title>Exam</title></head>`, solution: `<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Exam</title></head>` },
                    { prompt: "Fix this head block so the description meta stays valid and the stylesheet link uses rel and href correctly.", broken: `<head><meta name="description" content="Hard practice exam"><link ref="stylesheet" herf="styles.css"><title>Page</title></head>`, solution: `<head><meta name="description" content="Hard practice exam"><link rel="stylesheet" href="styles.css"><title>Page</title></head>` },
                    { prompt: "Repair this head so the external script tag and favicon link are both valid.", broken: `<head><script scr="nav.js" deffer></style><link rel="icon" type="image/x-icon" href="favicon.ico"></head>`, solution: `<head><script src="nav.js" defer><\/script><link rel="icon" type="image/x-icon" href="favicon.ico"></head>` }
                ]
            },
            {
                lesson: "Lesson 16: Computer code",
                problems: [
                    { prompt: "Fix this code sample so code stays inside pre and both tags close in the right order.", broken: `<pre><code>&lt;h1&gt;Hello&lt;/h1&gt;</pre></code>`, solution: `<pre><code>&lt;h1&gt;Hello&lt;/h1&gt;</code></pre>` },
                    { prompt: "Repair this shortcut hint so the paragraph and all three keyboard tags are valid.", broken: `<p>Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S<p>`, solution: `<p>Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd></p>` },
                    { prompt: "Fix this feedback line so samp and code both close correctly inside the paragraph.", broken: `<p><samp>Saved successfully</code> after running <code>npm start</samp></p>`, solution: `<p><samp>Saved successfully</samp> after running <code>npm start</code></p>` }
                ]
            },
            {
                lesson: "Lesson 17: Semantics",
                problems: [
                    { prompt: "Repair this semantic page so it uses header, nav, main, article, and footer correctly.", broken: `<heder><h1>Course</h1></heder><nav><a href="index.html">Home</a><a href="exam.html">Exam</nav><main><article><h2>Practice</h2><p>Fix tags</p></article><footer>End</footer>`, solution: `<header><h1>Course</h1></header><nav><a href="index.html">Home</a><a href="exam.html">Exam</a></nav><main><article><h2>Practice</h2><p>Fix tags</p></article></main><footer>End</footer>` },
                    { prompt: "Fix this semantic article so section, aside, and footer all close correctly inside article.", broken: `<article><header><h2>Lesson</h2></header><section><p>Practice now</section><aside>Extra tip</asid><footer>Keep going</footer></article>`, solution: `<article><header><h2>Lesson</h2></header><section><p>Practice now</p></section><aside>Extra tip</aside><footer>Keep going</footer></article>` },
                    { prompt: "Repair this roadmap so nav closes before section closes and everything stays inside main.", broken: `<main><section><h2>Roadmap</h2><nav><a href="whatishtml.html">Start</a><a href="forms3.html">Finish</a></section></main>`, solution: `<main><section><h2>Roadmap</h2><nav><a href="whatishtml.html">Start</a><a href="forms3.html">Finish</a></nav></section></main>` }
                ]
            },
            {
                lesson: "Lesson 18: HTML symbols",
                problems: [
                    { prompt: "Replace every unsafe symbol in this line with the correct entity reference.", broken: `<p>&copy 2026 Modern Front End Tech & 5 < 9</p>`, solution: `<p>&copy; 2026 Modern Front End Tech &amp; 5 &lt; 9</p>` },
                    { prompt: "Fix this sentence so the quote, section-tag text, and euro entity are all complete.", broken: `<p>&quotHard exam&quot uses &ltsection&gt and costs &euro 25</p>`, solution: `<p>&quot;Hard exam&quot; uses &lt;section&gt; and costs &euro; 25</p>` },
                    { prompt: "Repair this spacing line so both non-breaking spaces and the ampersand entity are valid.", broken: `<p>Use&nbsp spaces for names like Modern&nbspFront End Tech &amp learning</p>`, solution: `<p>Use&nbsp; spaces for names like Modern&nbsp;Front End Tech &amp; learning</p>` }
                ]
            },
            {
                lesson: "Lesson 19: Canvas",
                problems: [
                    { prompt: "Repair this canvas so the width, height, and closing tag are all correct while keeping the fallback text inside.", broken: `<canvas id="pad" width="30O" heigth="150">Practice board</canva>`, solution: `<canvas id="pad" width="300" height="150">Practice board</canvas>` },
                    { prompt: "Fix this section so the canvas closes correctly and the fallback text stays inside the canvas.", broken: `<section><canvas id="chart" width="400" height="200">Charts not supported<section>`, solution: `<section><canvas id="chart" width="400" height="200">Charts not supported</canvas></section>` },
                    { prompt: "Repair this figure so the canvas tag and figcaption both close correctly.", broken: `<figure><canvas id="game" width="500" height="250"></canavs><figcaption>Game area</figure>`, solution: `<figure><canvas id="game" width="500" height="250"></canvas><figcaption>Game area</figcaption></figure>` }
                ]
            },
            {
                lesson: "Lesson 20: Forms",
                problems: [
                    { prompt: "Fix this account form so legend, label, required, and fieldset structure are all correct.", broken: `<form><fieldset><legend>Account details<legend><label for="email">Email<label><input type="email" id="email" name="email" requierd></fieldset><button type="submit">Create account</button></form>`, solution: `<form><fieldset><legend>Account details</legend><label for="email">Email</label><input type="email" id="email" name="email" required></fieldset><button type="submit">Create account</button></form>` },
                    { prompt: "Repair this select form so the label and all three option tags close correctly.", broken: `<form><label for="level">Level</label><select id="level" name="level"><option>Beginner<option>Intermediate</option><option>Advanced</select></form>`, solution: `<form><label for="level">Level</label><select id="level" name="level"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></form>` },
                    { prompt: "Fix this form so the textarea closes correctly before the checkbox and submit button.", broken: `<form><label for="bio">Bio</label><textarea id="bio" name="bio">I love HTML<textarea><label><input type="checkbox" name="terms" checked>Accept terms</label><button type="submit">Send</button></form>`, solution: `<form><label for="bio">Bio</label><textarea id="bio" name="bio">I love HTML</textarea><label><input type="checkbox" name="terms" checked>Accept terms</label><button type="submit">Send</button></form>` }
                ]
            }
        ];

        const problems = lessonGroups.flatMap((group, groupIndex) =>
            group.problems.map((problem, problemIndex) => ({
                id: `problem-${groupIndex + 1}-${problemIndex + 1}`,
                lesson: group.lesson,
                number: groupIndex * 3 + problemIndex + 1,
                prompt: problem.prompt,
                broken: problem.broken,
                solution: problem.solution
            }))
        );

        if (problems.length !== 60) {
            throw new Error(`Expected 60 exam problems but found ${problems.length}.`);
        }

        const startCard = document.getElementById("exam-start-card");
        const examShell = document.getElementById("exam-shell");
        const resultsSection = document.getElementById("exam-results");
        const startForm = document.getElementById("exam-start-form");
        const studentNameInput = document.getElementById("student-name");
        const startStatus = document.getElementById("exam-start-status");
        const candidateNameDisplay = document.getElementById("candidate-name-display");
        const timerDisplay = document.getElementById("timer-display");
        const answeredDisplay = document.getElementById("answered-display");
        const currentProblemDisplay = document.getElementById("current-problem-display");
        const saveStatus = document.getElementById("save-status");
        const submitExamButton = document.getElementById("submit-exam-button");
        const restartExamButton = document.getElementById("restart-exam-button");
        const resetAttemptButton = document.getElementById("reset-attempt-button");
        const questionListContainer = document.getElementById("exam-question-list");
        const currentProblemNumber = document.getElementById("current-problem-number");
        const currentProblemLesson = document.getElementById("current-problem-lesson");
        const currentProblemHeading = document.getElementById("current-problem-heading");
        const currentProblemPrompt = document.getElementById("current-problem-prompt");
        const currentAnswerTextarea = document.getElementById("current-answer");
        const currentProblemFeedback = document.getElementById("current-problem-feedback");
        const previewFrame = document.getElementById("exam-preview-frame");
        const previousProblemButton = document.getElementById("previous-problem-button");
        const nextProblemButton = document.getElementById("next-problem-button");
        const resultHeading = document.getElementById("result-heading");
        const resultSummary = document.getElementById("result-summary");
        const resultScore = document.getElementById("result-score");
        const resultPercent = document.getElementById("result-percent");
        const resultStatus = document.getElementById("result-status");
        const resultCertificate = document.getElementById("result-certificate");
        const certificateCard = document.getElementById("certificate-card");
        const certificateTitle = document.getElementById("certificate-title");
        const certificateName = document.getElementById("certificate-name");
        const certificateScore = document.getElementById("certificate-score");
        const certificateLevel = document.getElementById("certificate-level");
        const certificateDate = document.getElementById("certificate-date");
        const certificateId = document.getElementById("certificate-id");
        const printCertificateButton = document.getElementById("print-certificate-button");
        const downloadCertificateButton = document.getElementById("download-certificate-button");

        let timerInterval = null;
        let examState = readState();

        function createEmptyState() {
            return {
                studentName: "",
                startedAt: null,
                deadlineAt: null,
                currentProblemId: problems[0]?.id || "",
                submittedAt: null,
                submitted: false,
                answers: {},
                grading: null,
                certificateId: ""
            };
        }

        function readState() {
            try {
                const raw = window.localStorage.getItem(EXAM_STORAGE_KEY);
                if (!raw) {
                    return createEmptyState();
                }

                const parsed = JSON.parse(raw);
                const normalizedAnswers = { ...createEmptyState().answers, ...(parsed.answers || {}) };

                problems.forEach((problem) => {
                    if (normalizedAnswers[problem.id] === problem.broken) {
                        normalizedAnswers[problem.id] = "";
                    }
                });

                return {
                    ...createEmptyState(),
                    ...parsed,
                    answers: normalizedAnswers,
                    grading: parsed.grading || null
                };
            } catch {
                return createEmptyState();
            }
        }

        function saveState(message) {
            try {
                window.localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(examState));
                if (message) {
                    saveStatus.textContent = message;
                }
            } catch {
                saveStatus.textContent = "Browser storage is unavailable, but the exam is still running in this tab.";
            }
        }

        function escapeHtml(value) {
            return value
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;");
        }

        function normalizeRaw(value) {
            return (value || "").replace(/\r\n/g, "\n").trim();
        }

        function formatTime(msRemaining) {
            const safeMs = Math.max(0, msRemaining);
            const totalSeconds = Math.floor(safeMs / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
        }

        function formatDate(dateInput) {
            return new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            }).format(new Date(dateInput));
        }

        function buildCertificateId() {
            const now = new Date();
            const datePart = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, "0"),
                String(now.getDate()).padStart(2, "0")
            ].join("");
            const randomPart = Math.floor(Math.random() * 900000 + 100000);
            return `MFT-HTML-${datePart}-${randomPart}`;
        }

        function escapeXml(value) {
            return String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&apos;");
        }

        function canonicalizeSnippet(snippet) {
            const template = document.createElement("template");
            template.innerHTML = normalizeRaw(snippet);
            return Array.from(template.content.childNodes)
                .map((node) => canonicalizeNode(node))
                .filter(Boolean)
                .join("");
        }

        function canonicalizeNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.replace(/\s+/g, " ").trim();
                return text ? `#text(${text})` : "";
            }

            if (node.nodeType === Node.COMMENT_NODE) {
                const comment = node.textContent.replace(/\s+/g, " ").trim();
                return `#comment(${comment})`;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) {
                return "";
            }

            const tag = node.tagName.toLowerCase();
            const attrs = Array.from(node.attributes)
                .sort((left, right) => left.name.localeCompare(right.name))
                .map((attribute) => `${attribute.name.toLowerCase()}="${attribute.value.replace(/\s+/g, " ").trim()}"`)
                .join(" ");
            const children = Array.from(node.childNodes)
                .map((childNode) => canonicalizeNode(childNode))
                .filter(Boolean)
                .join("");
            const openTag = attrs ? `<${tag} ${attrs}>` : `<${tag}>`;

            if (VOID_ELEMENTS.has(tag)) {
                return openTag;
            }

            return `${openTag}${children}</${tag}>`;
        }

        function getProblemById(problemId) {
            return problems.find((problem) => problem.id === problemId) || problems[0];
        }

        function getCurrentProblem() {
            const currentProblem = getProblemById(examState.currentProblemId);
            examState.currentProblemId = currentProblem.id;
            return currentProblem;
        }

        function getAnswer(problemId) {
            return examState.answers[problemId] || "";
        }

        function hasAnswer(problemId) {
            return normalizeRaw(getAnswer(problemId)).length > 0;
        }

        function getProblemDetail(problemId) {
            return examState.grading?.details?.find((detail) => detail.id === problemId) || null;
        }

        function buildPreviewDocument(answer) {
            const markup = normalizeRaw(answer);

            if (!markup) {
                return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>body{margin:0;font-family:Arial,sans-serif;background:#f8fafc;color:#64748b;display:grid;place-items:center;min-height:100vh;padding:24px;text-align:center;}p{max-width:280px;line-height:1.5;}</style></head><body><p>Preview will appear here when the student writes HTML for this question.</p></body></html>`;
            }

            if (/<!doctype/i.test(markup) || /<html[\s>]/i.test(markup)) {
                return markup;
            }

            return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head><body>${markup}</body></html>`;
        }

        function updatePreview(answer) {
            previewFrame.srcdoc = buildPreviewDocument(answer);
        }

        function selectProblem(problemId) {
            examState.currentProblemId = getProblemById(problemId).id;
            saveState();
            renderQuestionNavigator();
            renderCurrentProblem();
            updateDashboard();
        }

        function moveProblem(offset) {
            const currentProblem = getCurrentProblem();
            const targetIndex = currentProblem.number - 1 + offset;

            if (targetIndex < 0 || targetIndex >= problems.length) {
                return;
            }

            selectProblem(problems[targetIndex].id);
        }

        function clearSavedAttempt() {
            try {
                window.localStorage.removeItem(EXAM_STORAGE_KEY);
            } catch {
                // Ignore storage errors and continue clearing the in-memory attempt.
            }
            examState = createEmptyState();
            if (timerInterval) {
                window.clearInterval(timerInterval);
                timerInterval = null;
            }
            studentNameInput.value = "";
            renderView();
        }

        function gradeExam() {
            const details = problems.map((problem) => {
                const answer = getAnswer(problem.id);
                return {
                    id: problem.id,
                    correct: canonicalizeSnippet(answer) === canonicalizeSnippet(problem.solution)
                };
            });

            const correctCount = details.filter((detail) => detail.correct).length;
            const percentage = Number(((correctCount / problems.length) * 100).toFixed(2));
            let status = "Fail";
            let certificate = "None";

            if (percentage >= 80) {
                status = "Pass";
                certificate = "Professional";
            } else if (percentage >= 50) {
                status = "Pass";
                certificate = "Intermediate";
            }

            return { correctCount, percentage, status, certificate, details };
        }

        function renderQuestionNavigator() {
            const currentProblem = getCurrentProblem();

            questionListContainer.innerHTML = problems.map((problem) => {
                const detail = getProblemDetail(problem.id);
                const statusClass = detail
                    ? (detail.correct ? "is-correct" : "is-incorrect")
                    : (hasAnswer(problem.id) ? "is-answered" : "");

                return `
                    <button type="button" class="exam-question-button ${problem.id === currentProblem.id ? "is-active" : ""} ${statusClass}" data-problem-id="${problem.id}">
                        <span class="exam-question-button-number">${problem.number}</span>
                        <span class="exam-question-button-copy">${escapeHtml(problem.prompt)}</span>
                    </button>
                `;
            }).join("");

            questionListContainer.querySelectorAll("[data-problem-id]").forEach((button) => {
                button.addEventListener("click", () => {
                    selectProblem(button.dataset.problemId);
                });
            });
        }

        function renderCurrentProblem() {
            const currentProblem = getCurrentProblem();
            const answer = getAnswer(currentProblem.id);
            const detail = getProblemDetail(currentProblem.id);

            currentProblemNumber.textContent = `Problem ${currentProblem.number}`;
            currentProblemLesson.textContent = currentProblem.lesson;
            currentProblemHeading.textContent = `Instruction ${currentProblem.number} of ${problems.length}`;
            currentProblemPrompt.textContent = currentProblem.prompt;
            currentAnswerTextarea.value = answer;
            currentAnswerTextarea.disabled = Boolean(examState.submitted);
            previousProblemButton.disabled = currentProblem.number === 1;
            nextProblemButton.disabled = currentProblem.number === problems.length;
            updatePreview(answer);

            if (!detail) {
                currentProblemFeedback.classList.add("hidden");
                currentProblemFeedback.innerHTML = "";
                return;
            }

            currentProblemFeedback.classList.remove("hidden");
            currentProblemFeedback.innerHTML = detail.correct
                ? `<strong>Correct.</strong> This answer matches the expected HTML solution.`
                : `<strong>Needs correction.</strong> Expected answer:<pre><code>${escapeHtml(currentProblem.solution)}</code></pre>`;
        }

        function updateDashboard() {
            const answeredCount = problems.filter((problem) => hasAnswer(problem.id)).length;
            const currentProblem = getCurrentProblem();
            answeredDisplay.textContent = `${answeredCount} / 60`;
            currentProblemDisplay.textContent = `${currentProblem.number} / 60`;
            candidateNameDisplay.textContent = examState.studentName || "Unnamed student";
            timerDisplay.textContent = examState.deadlineAt ? formatTime(examState.deadlineAt - Date.now()) : "03:00:00";
        }

        function startTimer() {
            if (timerInterval) {
                window.clearInterval(timerInterval);
            }

            timerInterval = window.setInterval(() => {
                if (!examState.deadlineAt || examState.submitted) {
                    window.clearInterval(timerInterval);
                    timerInterval = null;
                    return;
                }

                const remaining = examState.deadlineAt - Date.now();
                timerDisplay.textContent = formatTime(remaining);

                if (remaining <= 0) {
                    submitExam(true);
                }
            }, 1000);
        }

        function updateResults() {
            if (!examState.grading) {
                return;
            }

            const grading = examState.grading;
            const passed = grading.status === "Pass";
            resultHeading.textContent = passed ? "Exam completed" : "Exam completed - not passed";
            resultSummary.textContent = passed
                ? `${examState.studentName} completed the HTML exam with ${grading.correctCount} correct answers out of 60.`
                : `${examState.studentName} completed the HTML exam with ${grading.correctCount} correct answers out of 60, which is below the 50% passing score.`;
            resultScore.textContent = `${grading.correctCount} / 60`;
            resultPercent.textContent = `${grading.percentage}%`;
            resultStatus.textContent = grading.status;
            resultCertificate.textContent = grading.certificate;

            if (grading.certificate === "None") {
                certificateCard.classList.add("hidden");
            } else {
                certificateCard.classList.remove("hidden");
                certificateTitle.textContent = `${grading.certificate} certificate`;
                certificateName.textContent = examState.studentName;
                certificateScore.textContent = `${grading.correctCount} / 60 (${grading.percentage}%)`;
                certificateLevel.textContent = grading.certificate;
                certificateDate.textContent = formatDate(examState.submittedAt);
                certificateId.textContent = examState.certificateId;
            }
        }

        function buildCertificateSvg() {
            const level = `${examState.grading.certificate} certificate`;
            const scoreLine = `${examState.grading.correctCount} / 60 (${examState.grading.percentage}%)`;
            const issuedDate = formatDate(examState.submittedAt);

            return `
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="990" viewBox="0 0 1400 990" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(level)}</title>
  <desc id="desc">Certificate awarded to ${escapeXml(examState.studentName)} for passing the Modern Front End Tech HTML exam.</desc>
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#122c44"/>
      <stop offset="58%" stop-color="#244666"/>
      <stop offset="100%" stop-color="#c2542d"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff3bf"/>
      <stop offset="45%" stop-color="#f6c65b"/>
      <stop offset="100%" stop-color="#d28d1b"/>
    </linearGradient>
    <linearGradient id="ribbonWarm" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef8d49"/>
      <stop offset="100%" stop-color="#b34723"/>
    </linearGradient>
    <linearGradient id="ribbonCool" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5aa9d8"/>
      <stop offset="100%" stop-color="#1f5c8a"/>
    </linearGradient>
  </defs>
  <rect width="1400" height="990" fill="url(#bg)"/>
  <rect x="36" y="36" width="1328" height="918" rx="38" fill="none" stroke="rgba(255,255,255,0.26)"/>
  <rect x="84" y="84" width="1232" height="822" rx="30" fill="rgba(255,248,239,0.06)" stroke="rgba(255,255,255,0.12)"/>
  <rect x="120" y="120" width="1160" height="750" rx="26" fill="none" stroke="rgba(255,255,255,0.14)"/>
  <g transform="translate(128 110)">
    <circle cx="72" cy="72" r="46" fill="url(#gold)"/>
    <circle cx="72" cy="72" r="29" fill="#fff7dc"/>
    <path d="M55 118 L42 170 L72 149 L102 170 L89 118 Z" fill="url(#ribbonWarm)"/>
    <path d="M72 47 L79 61 L95 63 L83 74 L86 91 L72 83 L58 91 L61 74 L49 63 L65 61 Z" fill="#cb7e12"/>
  </g>
  <g transform="translate(1120 110)">
    <circle cx="72" cy="72" r="46" fill="url(#gold)"/>
    <circle cx="72" cy="72" r="29" fill="#fff7dc"/>
    <path d="M55 118 L42 170 L72 149 L102 170 L89 118 Z" fill="url(#ribbonCool)"/>
    <path d="M72 47 L79 61 L95 63 L83 74 L86 91 L72 83 L58 91 L61 74 L49 63 L65 61 Z" fill="#cb7e12"/>
  </g>
  <g transform="translate(465 120)">
    <rect x="0" y="0" width="470" height="66" rx="33" fill="rgba(255,255,255,0.1)"/>
    <circle cx="235" cy="33" r="26" fill="url(#gold)"/>
    <circle cx="235" cy="33" r="16" fill="#fff7dc"/>
    <path d="M224 31 L232 39 L248 22" fill="none" stroke="#c2542d" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="700" y="180" text-anchor="middle" fill="#ffe6a8" font-size="24" font-family="Trebuchet MS, Gill Sans, sans-serif" letter-spacing="8">MODERN FRONT END TECH</text>
  <text x="700" y="300" text-anchor="middle" fill="#fffef8" font-size="70" font-weight="700" font-family="Georgia, Times New Roman, serif">${escapeXml(level)}</text>
  <text x="700" y="362" text-anchor="middle" fill="rgba(255,240,212,0.88)" font-size="24" font-family="Trebuchet MS, Gill Sans, sans-serif" letter-spacing="4">AWARDED FOR SUCCESSFULLY COMPLETING THE HTML REPAIR EXAMINATION</text>
  <text x="700" y="470" text-anchor="middle" fill="#ffffff" font-size="64" font-weight="700" font-family="Georgia, Times New Roman, serif">${escapeXml(examState.studentName)}</text>
  <text x="700" y="530" text-anchor="middle" fill="rgba(255,248,238,0.88)" font-size="28" font-family="Trebuchet MS, Gill Sans, sans-serif">This candidate attempted and passed the exam by fixing broken HTML under timed conditions.</text>
  <rect x="185" y="620" width="300" height="110" rx="22" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)"/>
  <rect x="550" y="620" width="300" height="110" rx="22" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)"/>
  <rect x="915" y="620" width="300" height="110" rx="22" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)"/>
  <text x="220" y="664" fill="#ffe6a8" font-size="22" font-family="Trebuchet MS, Gill Sans, sans-serif" letter-spacing="2">EXAM SCORE</text>
  <text x="220" y="707" fill="#ffffff" font-size="34" font-weight="700" font-family="Trebuchet MS, Gill Sans, sans-serif">${escapeXml(scoreLine)}</text>
  <text x="585" y="664" fill="#ffe6a8" font-size="22" font-family="Trebuchet MS, Gill Sans, sans-serif" letter-spacing="2">DATE</text>
  <text x="585" y="707" fill="#ffffff" font-size="34" font-weight="700" font-family="Trebuchet MS, Gill Sans, sans-serif">${escapeXml(issuedDate)}</text>
  <text x="950" y="664" fill="#ffe6a8" font-size="22" font-family="Trebuchet MS, Gill Sans, sans-serif" letter-spacing="2">CERTIFICATE ID</text>
  <text x="950" y="707" fill="#ffffff" font-size="28" font-weight="700" font-family="Trebuchet MS, Gill Sans, sans-serif">${escapeXml(examState.certificateId)}</text>
  <line x1="220" y1="830" x2="560" y2="830" stroke="rgba(255,255,255,0.42)" stroke-width="2"/>
  <text x="220" y="868" fill="rgba(255,248,238,0.78)" font-size="22" font-family="Trebuchet MS, Gill Sans, sans-serif">Certification authority</text>
  <text x="220" y="824" fill="#fffef8" font-size="34" font-weight="700" font-family="Georgia, Times New Roman, serif">Modern Front End Tech</text>
  <line x1="885" y1="830" x2="1185" y2="830" stroke="rgba(255,255,255,0.42)" stroke-width="2"/>
  <text x="885" y="810" fill="#fff7dd" font-size="54" font-family="Brush Script MT, Segoe Script, cursive">Divyansh</text>
  <text x="885" y="868" fill="rgba(255,248,238,0.78)" font-size="22" font-family="Trebuchet MS, Gill Sans, sans-serif">Owner signature</text>
</svg>`.trim();
        }

        function downloadCertificate() {
            if (!examState.grading || examState.grading.certificate === "None") {
                return;
            }

            const svg = buildCertificateSvg();
            const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const safeName = (examState.studentName || "student").trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "student";
            link.href = url;
            link.download = `${safeName}-${examState.grading.certificate.toLowerCase()}-html-certificate.svg`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        }

        function renderView() {
            const hasStarted = Boolean(examState.startedAt && examState.deadlineAt);
            const hasSubmitted = Boolean(examState.submitted && examState.grading);

            studentNameInput.value = examState.studentName || "";

            if (!hasStarted) {
                startCard.classList.remove("hidden");
                examShell.classList.add("hidden");
                resultsSection.classList.add("hidden");
                startStatus.textContent = "No active attempt found.";
                return;
            }

            startCard.classList.add("hidden");
            examShell.classList.remove("hidden");
            renderQuestionNavigator();
            renderCurrentProblem();
            updateDashboard();

            if (!hasSubmitted && Date.now() >= examState.deadlineAt) {
                submitExam(true);
                return;
            }

            if (hasSubmitted) {
                resultsSection.classList.remove("hidden");
                updateResults();
                submitExamButton.disabled = true;
                saveStatus.textContent = "Submitted attempt restored from browser storage.";
                timerDisplay.textContent = "00:00:00";
                if (timerInterval) {
                    window.clearInterval(timerInterval);
                    timerInterval = null;
                }
                return;
            }

            resultsSection.classList.add("hidden");
            submitExamButton.disabled = false;
            saveStatus.textContent = "Your work is saved automatically in this browser.";
            startTimer();
        }

        function submitExam(fromTimer = false) {
            if (examState.submitted) {
                return;
            }

            if (!fromTimer) {
                const confirmed = window.confirm("Submit this exam now? The attempt will be graded immediately.");
                if (!confirmed) {
                    return;
                }
            }

            examState.submitted = true;
            examState.submittedAt = new Date().toISOString();
            examState.grading = gradeExam();
            examState.certificateId = examState.grading.certificate === "None" ? "" : buildCertificateId();
            saveState(fromTimer ? "Time ended. Exam submitted automatically." : "Exam submitted.");
            renderView();
            resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        startForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const studentName = studentNameInput.value.trim();

            if (!studentName) {
                startStatus.textContent = "Please enter the student name before starting.";
                return;
            }

            examState = createEmptyState();
            examState.studentName = studentName;
            examState.startedAt = new Date().toISOString();
            examState.deadlineAt = Date.now() + EXAM_DURATION_MS;
            examState.currentProblemId = problems[0].id;
            saveState("Exam started.");
            renderView();
        });

        currentAnswerTextarea.addEventListener("input", (event) => {
            const currentProblem = getCurrentProblem();
            examState.answers[currentProblem.id] = event.target.value;
            saveState("Progress saved.");
            updatePreview(event.target.value);
            updateDashboard();
            renderQuestionNavigator();
        });

        previousProblemButton.addEventListener("click", () => moveProblem(-1));
        nextProblemButton.addEventListener("click", () => moveProblem(1));

        submitExamButton.addEventListener("click", () => submitExam(false));

        restartExamButton.addEventListener("click", () => {
            const confirmed = window.confirm("Clear this saved exam attempt and start again?");
            if (!confirmed) {
                return;
            }

            clearSavedAttempt();
            startStatus.textContent = "Saved attempt cleared. You can start a new exam now.";
        });

        resetAttemptButton.addEventListener("click", () => {
            const confirmed = window.confirm("Remove any saved exam attempt from this browser?");
            if (!confirmed) {
                return;
            }

            clearSavedAttempt();
            startStatus.textContent = "Saved attempt cleared.";
        });

        printCertificateButton.addEventListener("click", () => {
            document.body.classList.add("print-certificate");
            window.print();
            window.setTimeout(() => {
                document.body.classList.remove("print-certificate");
            }, 300);
        });

        downloadCertificateButton.addEventListener("click", downloadCertificate);

        renderView();
        }
    
