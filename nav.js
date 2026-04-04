// common navigation script
// handles opening/closing the full-screen nav panel and global top banner

const AUTH_STATE_KEY = 'mft_auth_state_v1';
const BANNER_DISMISSED_KEY = 'mft_banner_dismissed_v1';
const API_BASE_STORAGE_KEY = 'mft_api_base';
const NON_LESSON_PAGES = new Set([
    'index.html',
    'auth.html',
    'editor.html',
    'exam.html',
    'exam-focused.html',
    'weekly-challenge.html',
    'html-ai.html',
    'profile.html',
    'community.html'
]);

function readAuthState() {
    try {
        const raw = window.localStorage.getItem(AUTH_STATE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.signedIn) return null;
        return {
            signedIn: true,
            userId: parsed.userId || '',
            name: parsed.name || '',
            email: parsed.email || '',
            avatarUrl: parsed.avatarUrl || '',
            authToken: parsed.authToken || '',
            streak: parsed.streak && typeof parsed.streak === 'object' ? parsed.streak : null,
            updatedAt: parsed.updatedAt || ''
        };
    } catch {
        return null;
    }
}

function isAuthenticated() {
    return Boolean(readAuthState());
}

function setAuthenticated(user = {}) {
    try {
        const state = {
            signedIn: true,
            userId: user.id || user.userId || '',
            name: user.name || '',
            email: user.email || '',
            avatarUrl: user.avatarUrl || '',
            authToken: user.token || user.authToken || '',
            streak: user.streak && typeof user.streak === 'object' ? user.streak : null,
            updatedAt: new Date().toISOString()
        };
        window.localStorage.setItem(
            AUTH_STATE_KEY,
            JSON.stringify(state)
        );
        if (state.authToken) {
            window.localStorage.setItem('auth', state.authToken);
        }
    } catch {
        // Ignore storage failures and continue.
    }
}

function clearAuthenticated() {
    try {
        window.localStorage.removeItem(AUTH_STATE_KEY);
        window.localStorage.removeItem('auth');
    } catch {
        // Ignore storage failures and continue.
    }
}

function signOut(redirectTo = 'index.html') {
    clearAuthenticated();
    window.location.href = redirectTo;
}

function getAuthToken() {
    const state = readAuthState();
    if (state?.authToken) {
        return state.authToken;
    }

    try {
        const legacy = window.localStorage.getItem('auth') || '';
        return legacy.includes('.') ? legacy : '';
    } catch {
        return '';
    }
}

function normalizeApiBase(value) {
    if (!value) return '';
    try {
        return new URL(value).origin;
    } catch {
        return '';
    }
}

function getApiBase() {
    const isFile = window.location.protocol === 'file:';
    const isLocalPreviewHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const isLocalApiHost = isLocalPreviewHost && window.location.port === '3000';
    const isLocalPreview = isFile || (isLocalPreviewHost && !isLocalApiHost);

    if (!isLocalPreview) {
        return '';
    }

    try {
        const stored = normalizeApiBase(window.localStorage.getItem(API_BASE_STORAGE_KEY));
        return stored || `${window.location.protocol}//${window.location.hostname || 'localhost'}:3000`;
    } catch {
        return `${window.location.protocol}//${window.location.hostname || 'localhost'}:3000`;
    }
}

async function apiRequest(path, options = {}) {
    const authToken = getAuthToken();
    const headers = new Headers(options.headers || {});
    if (authToken) {
        headers.set('Authorization', `Bearer ${authToken}`);
    }

    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    return fetch(`${getApiBase()}${path}`, {
        ...options,
        headers
    });
}

function getAuthRedirectTarget() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (!next) return 'index.html';

    const trimmed = next.trim();
    if (!trimmed) return 'index.html';
    if (/^[a-z]+:/i.test(trimmed) || trimmed.startsWith('//')) return 'index.html';
    if (!/\.html($|[?#])/i.test(trimmed)) return 'index.html';

    return trimmed.replace(/^\.\//, '');
}

function buildAuthUrl(nextPath) {
    const fallback = 'index.html';
    const path = (nextPath || fallback).replace(/^\.\//, '');
    return `auth.html?next=${encodeURIComponent(path || fallback)}`;
}

function getCurrentPageTarget() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const search = window.location.search || '';
    const hash = window.location.hash || '';
    return `${path}${search}${hash}`;
}

function getCurrentPageFile() {
    return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
}

function isLessonPage() {
    const page = getCurrentPageFile();
    return page.endsWith('.html') && !NON_LESSON_PAGES.has(page);
}

function getPageHeading() {
    const heading = document.querySelector('main h1, article h1, header h1, main h2, article h2');
    return heading ? heading.textContent.trim() : document.title.trim();
}

function syncAuthStateFromProfile(profile) {
    const state = readAuthState();
    if (!state || !profile?.streak) return;
    setAuthenticated({
        ...state,
        token: state.authToken,
        streak: profile.streak
    });
    const existingProfileButton = document.querySelector('.site-floating-profile');
    if (existingProfileButton) {
        existingProfileButton.remove();
    }
    ensureFloatingAuthButton();
}

async function loadProfile() {
    const response = await apiRequest('/api/profile', {
        method: 'GET',
        cache: 'no-store'
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || 'Unable to load profile.');
    }

    if (data?.profile) {
        syncAuthStateFromProfile(data.profile);
    }

    return data;
}

async function trackProfileEvent(eventType, payload = {}) {
    if (!isAuthenticated() || !getAuthToken()) {
        return null;
    }

    try {
        const response = await apiRequest('/api/profile-activity', {
            method: 'POST',
            body: JSON.stringify({
                eventType,
                ...payload
            })
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data?.profile) {
            syncAuthStateFromProfile(data.profile);
        }
        return data;
    } catch {
        return null;
    }
}

function recordSignedInVisit() {
    if (!isAuthenticated()) return;

    trackProfileEvent('daily_visit', {
        page: getCurrentPageFile()
    });

    if (!isLessonPage()) return;

    trackProfileEvent('lesson_visit', {
        page: getCurrentPageFile(),
        title: document.title.trim(),
        heading: getPageHeading()
    });
}

function requireAuth(options = {}) {
    if (isAuthenticated()) {
        return true;
    }

    if (document.body) {
        document.body.classList.add('auth-required-page', 'is-auth-locked');
    }

    const existingGate = document.querySelector('.auth-gate-card');
    if (existingGate) {
        return false;
    }

    const main = document.querySelector('main');
    const gate = document.createElement('section');
    gate.className = 'auth-gate-card';

    const heading = document.createElement('h2');
    heading.textContent = options.title || 'Sign in to continue';

    const message = document.createElement('p');
    message.textContent = options.message || 'You need an account before you can use this page.';

    const actionRow = document.createElement('div');
    actionRow.className = 'auth-gate-actions';

    const signInLink = document.createElement('a');
    signInLink.href = buildAuthUrl(options.next || getCurrentPageTarget());
    signInLink.textContent = options.actionLabel || 'Sign In / Sign Up';

    const homeLink = document.createElement('a');
    homeLink.href = 'index.html';
    homeLink.className = 'secondary';
    homeLink.textContent = 'Back To Home';

    actionRow.appendChild(signInLink);
    actionRow.appendChild(homeLink);
    gate.appendChild(heading);
    gate.appendChild(message);
    gate.appendChild(actionRow);

    if (main && main.parentNode) {
        main.classList.add('hidden');
        main.parentNode.insertBefore(gate, main);
    } else if (document.body) {
        document.body.appendChild(gate);
    }

    return false;
}

function isBannerDismissed() {
    try {
        return window.localStorage.getItem(BANNER_DISMISSED_KEY) === 'true';
    } catch {
        return false;
    }
}

function dismissBanner() {
    try {
        window.localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    } catch {
        // Ignore storage failures and continue.
    }
}

function ensureGlobalBannerStyles() {
    if (document.head.querySelector('#site-banner-style')) return;

    const style = document.createElement('style');
    style.id = 'site-banner-style';
    style.textContent = `
        .site-top-banner {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1500;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding: 12px 56px 12px 16px;
            background: linear-gradient(90deg, #111827 0%, #1d4ed8 100%);
            color: #ffffff;
            box-shadow: 0 10px 24px rgba(17, 24, 39, 0.2);
            font-family: Arial, sans-serif;
        }

        .site-banner-copy {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 700;
        }

        .site-banner-link {
            color: #fef08a;
            text-decoration: none;
            font-weight: 700;
        }

        .site-banner-link:hover {
            text-decoration: underline;
        }

        .site-banner-close {
            position: absolute;
            top: 10px;
            right: 12px;
            width: 30px;
            height: 30px;
            border: none;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.14);
            color: #ffffff;
            cursor: pointer;
            font-size: 18px;
            font-weight: 700;
            line-height: 1;
        }

        .site-banner-close:hover {
            background: rgba(255, 255, 255, 0.28);
        }

        .site-floating-auth {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 1600;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 16px;
            border-radius: 999px;
            background: #ffffff;
            color: #0f172a;
            text-decoration: none;
            font-size: 13px;
            font-weight: 700;
            white-space: nowrap;
        }

        .site-floating-auth:hover {
            background: #dbeafe;
        }

        .site-floating-profile {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 1600;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 10px 14px 10px 10px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.96);
            color: #0f172a;
            text-decoration: none;
            box-shadow: 0 16px 32px rgba(15, 23, 42, 0.18);
            backdrop-filter: blur(10px);
        }

        .site-floating-profile:hover {
            background: #ffffff;
            transform: translateY(-2px);
        }

        .site-floating-profile-avatar {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            border-radius: 999px;
            background: linear-gradient(135deg, #ef6b3d, #f4c95d);
            color: #14213d;
            font-size: 15px;
            font-weight: 800;
            text-transform: uppercase;
        }

        .site-floating-profile-copy {
            display: grid;
            gap: 2px;
        }

        .site-floating-profile-copy strong {
            color: #0f172a;
            font-size: 13px;
            line-height: 1.1;
        }

        .site-floating-profile-copy span {
            color: #475569;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.1;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        nav {
            z-index: 2500 !important;
        }

        body.has-site-banner .site-floating-auth,
        body.has-site-banner .site-floating-profile {
            top: 72px;
        }

        body.nav-open .site-floating-auth,
        body.nav-open .site-floating-profile {
            opacity: 0;
            pointer-events: none;
        }

        @media (max-width: 700px) {
            .site-top-banner {
                padding-right: 52px;
            }
        }
    `;
    document.head.appendChild(style);
}

function syncBannerOffset() {
    const banner = document.querySelector('.site-top-banner');
    if (!document.body) return;

    if (!document.body.dataset.basePaddingTop) {
        document.body.dataset.basePaddingTop = window.getComputedStyle(document.body).paddingTop;
    }

    const basePaddingTop = parseFloat(document.body.dataset.basePaddingTop) || 0;
    if (banner) {
        document.body.classList.add('has-site-banner');
        document.body.style.paddingTop = `${basePaddingTop + banner.offsetHeight + 12}px`;
    } else {
        document.body.classList.remove('has-site-banner');
        document.body.style.paddingTop = `${basePaddingTop}px`;
    }
}

function ensureTopBanner() {
    if (document.querySelector('.site-top-banner')) return;
    if (isBannerDismissed()) {
        syncBannerOffset();
        return;
    }

    ensureGlobalBannerStyles();
    const banner = document.createElement('div');
    banner.className = 'site-top-banner';

    const copy = document.createElement('div');
    copy.className = 'site-banner-copy';
    copy.innerHTML = `
        <span>this is not frontendtech ui/ux builder instead it is a html teaching website, to visit ui/ux builder please click on this link</span>
        <a class="site-banner-link" href="https://frontendtech.com" target="_blank" rel="noopener noreferrer">frontendtech ui/ux builder</a>
    `;
    banner.appendChild(copy);

    const closeButton = document.createElement('button');
    closeButton.className = 'site-banner-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close banner');
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => {
        dismissBanner();
        banner.remove();
        syncBannerOffset();
    });
    banner.appendChild(closeButton);

    document.body.appendChild(banner);
    syncBannerOffset();
}

function ensureFloatingAuthButton() {
    const existingAuthButton = document.querySelector('.site-floating-auth');
    const existingProfileButton = document.querySelector('.site-floating-profile');
    ensureGlobalBannerStyles();

    if (isAuthenticated()) {
        if (existingAuthButton) {
            existingAuthButton.remove();
        }
        if (existingProfileButton) {
            return;
        }

        const state = readAuthState();
        const button = document.createElement('a');
        button.className = 'site-floating-profile';
        button.href = 'profile.html';
        button.setAttribute('aria-label', 'Open profile');
        button.innerHTML = `
            <span class="site-floating-profile-avatar">${(state?.name || state?.email || 'P').trim().charAt(0) || 'P'}</span>
            <span class="site-floating-profile-copy">
                <strong>Profile</strong>
                <span>${state?.streak?.current ? `${state.streak.current} day streak` : 'Learning hub'}</span>
            </span>
        `;
        document.body.appendChild(button);
        return;
    }

    if (existingProfileButton) {
        existingProfileButton.remove();
    }
    if (existingAuthButton) return;

    const path = window.location.pathname.toLowerCase();
    const isAuthPage = path.endsWith('/auth.html') || path.endsWith('auth.html');
    const button = document.createElement('a');
    button.className = 'site-floating-auth';
    button.href = isAuthPage ? 'index.html' : 'auth.html';
    button.textContent = isAuthPage ? 'Home' : 'Sign In / Sign Up';
    document.body.appendChild(button);
}

function protectNavigationLinks() {
    if (isAuthenticated()) return;

    const protectedPages = new Set(['editor.html', 'html-ai.html', 'exam.html']);
    document.querySelectorAll('a[href]').forEach((link) => {
        const href = (link.getAttribute('href') || '').trim();
        if (!protectedPages.has(href)) return;

        link.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = buildAuthUrl(href);
        });
    });
}

function initNav() {
    const nav = document.getElementById('site-nav');
    const openBtn = document.getElementById('open');
    const closeBtn = document.getElementById('close');
    if (!nav || !openBtn || !closeBtn) return;

    openBtn.addEventListener('click', () => {
        nav.classList.add('open');
        document.body.classList.add('nav-open');
        openBtn.style.display = 'none';
    });

    closeBtn.addEventListener('click', () => {
        nav.classList.remove('open');
        document.body.classList.remove('nav-open');
        openBtn.style.display = '';
    });
}

function ensureWeeklyChallengeNavLink() {
    const nav = document.getElementById('site-nav');
    if (!nav) return;
    if (nav.querySelector('a[href="weekly-challenge.html"]')) return;

    const link = document.createElement('a');
    link.href = 'weekly-challenge.html';
    link.className = 'nav-link';
    link.textContent = 'weekly challenge';
    nav.appendChild(link);
}

function ensureProfileNavLink() {
    const nav = document.getElementById('site-nav');
    if (!nav || !isAuthenticated()) return;
    if (nav.querySelector('a[href="profile.html"]')) return;

    const link = document.createElement('a');
    link.href = 'profile.html';
    link.className = 'nav-link';
    link.textContent = 'my profile';
    nav.appendChild(link);
}

function ensureLessonQuizScript() {
    if (document.querySelector('script[data-lesson-quiz="true"]')) return;

    const script = document.createElement('script');
    script.src = 'lesson-quiz.js';
    script.dataset.lessonQuiz = 'true';
    document.body.appendChild(script);
}

function normalizeText(value) {
    return (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function isResultLead(element) {
    if (!element || element.tagName !== 'P') return false;
    const text = normalizeText(element.textContent);
    return text.includes('this will render as') || text === 'result:' || text === 'result' || text === 'output:' || text === 'output';
}

function isBoundaryElement(element) {
    if (!element) return true;
    return ['PRE', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'SCRIPT', 'NAV', 'H1', 'H2', 'H3', 'H4'].includes(element.tagName);
}

function isRenderableOutput(element) {
    if (!element) return false;
    return [
        'P', 'DIV', 'SPAN', 'UL', 'OL', 'DL', 'TABLE', 'FORM', 'BUTTON', 'INPUT',
        'SELECT', 'TEXTAREA', 'IMG', 'IFRAME', 'VIDEO', 'AUDIO', 'CANVAS', 'BLOCKQUOTE',
        'SVG'
    ].includes(element.tagName);
}

function getCodeAnchor(pre) {
    if (pre && pre.parentElement && pre.parentElement.classList && pre.parentElement.classList.contains('lesson-code')) {
        return pre.parentElement;
    }

    return pre;
}

function createResultPanel() {
    const panel = document.createElement('div');
    panel.className = 'lesson-result';

    const label = document.createElement('div');
    label.className = 'lesson-result-label';
    label.textContent = 'Result';
    panel.appendChild(label);

    return panel;
}

function wrapCodeBlock(pre) {
    if (!pre || (pre.parentElement && pre.parentElement.classList && pre.parentElement.classList.contains('lesson-code'))) {
        return pre && pre.parentElement ? pre.parentElement : null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'lesson-code';

    const label = document.createElement('div');
    label.className = 'lesson-code-label';
    label.textContent = 'Code';

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(label);
    wrapper.appendChild(pre);
    return wrapper;
}

function buildPreviewDocument(snippet) {
    const trimmed = snippet.trim();
    if (/<!doctype/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) {
        return trimmed;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {
    margin: 0;
    padding: 18px;
    font-family: Arial, sans-serif;
    line-height: 1.5;
    color: #0f172a;
    background: #ffffff;
}
table {
    border-collapse: collapse;
}
</style>
</head>
<body>
${trimmed}
</body>
</html>`;
}

function snippetHasVisibleResult(snippet) {
    const visibleTagPattern = /<(h1|h2|h3|h4|h5|h6|p|button|a|img|ul|ol|li|table|tr|td|th|form|label|input|select|textarea|iframe|video|audio|canvas|svg|blockquote|pre|code)\b/i;
    const textPattern = />\s*[^<\s][^<]*</;
    return visibleTagPattern.test(snippet) || textPattern.test(snippet);
}

function wrapExistingResult(pre) {
    const anchor = getCodeAnchor(pre);
    const lead = anchor.nextElementSibling;
    if (!isResultLead(lead)) return false;

    const output = lead.nextElementSibling;
    if (!output || isBoundaryElement(output)) return false;

    const panel = createResultPanel();
    anchor.insertAdjacentElement('afterend', panel);
    lead.remove();

    let cursor = output;
    let movedAny = false;

    while (cursor && !isBoundaryElement(cursor)) {
        const next = cursor.nextElementSibling;
        panel.appendChild(cursor);
        movedAny = true;

        if (!isRenderableOutput(cursor) || (next && next.tagName === 'P')) {
            break;
        }

        cursor = next;
    }

    if (!movedAny) {
        panel.remove();
        return false;
    }

    return true;
}

function insertGeneratedResult(pre) {
    const anchor = getCodeAnchor(pre);
    const code = pre.querySelector('code');
    const snippet = (code ? code.textContent : pre.textContent || '')
        .replace(/---\s*IGNORE\s*---/gi, '')
        .trim();

    if (!snippet || !snippet.includes('<')) return;

    const panel = createResultPanel();

    if (snippetHasVisibleResult(snippet)) {
        const frame = document.createElement('iframe');
        frame.className = 'lesson-preview-frame';
        frame.setAttribute('loading', 'lazy');
        frame.setAttribute('sandbox', 'allow-scripts');
        frame.setAttribute('title', 'Code result preview');
        frame.srcdoc = buildPreviewDocument(snippet);
        panel.appendChild(frame);
    } else {
        const empty = document.createElement('div');
        empty.className = 'lesson-result-empty';
        empty.textContent = 'This code does not create visible page content on its own.';
        panel.appendChild(empty);
    }

    anchor.insertAdjacentElement('afterend', panel);
}

function enhanceCodeExamples() {
    const preBlocks = document.querySelectorAll('main pre, article pre, section pre');
    preBlocks.forEach((pre) => {
        wrapCodeBlock(pre);

        const nextElement = pre.parentElement && pre.parentElement.nextElementSibling
            ? pre.parentElement.nextElementSibling
            : pre.nextElementSibling;

        if (nextElement && nextElement.classList && nextElement.classList.contains('lesson-result')) {
            return;
        }

        if (wrapExistingResult(pre)) {
            return;
        }

        insertGeneratedResult(pre);
    });
}

window.siteAuth = {
    apiRequest,
    buildAuthUrl,
    clearAuthenticated,
    getApiBase,
    getAuthToken,
    getAuthRedirectTarget,
    getCurrentPageTarget,
    isAuthenticated,
    loadProfile,
    requireAuth,
    signOut,
    setAuthenticated,
    trackProfileEvent
};

document.addEventListener('DOMContentLoaded', () => {
    ensureTopBanner();
    ensureFloatingAuthButton();
    protectNavigationLinks();
    initNav();
    ensureWeeklyChallengeNavLink();
    ensureProfileNavLink();
    enhanceCodeExamples();
    ensureLessonQuizScript();
    recordSignedInVisit();
    window.addEventListener('resize', syncBannerOffset);
});
