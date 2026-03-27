// common navigation script
// handles opening/closing the full-screen nav panel and global top banner

const AUTH_STATE_KEY = 'mft_auth_state_v1';
const BANNER_DISMISSED_KEY = 'mft_banner_dismissed_v1';

function readAuthState() {
    try {
        const raw = window.localStorage.getItem(AUTH_STATE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && parsed.signedIn ? parsed : null;
    } catch {
        return null;
    }
}

function isAuthenticated() {
    return Boolean(readAuthState());
}

function setAuthenticated(user = {}) {
    try {
        window.localStorage.setItem(
            AUTH_STATE_KEY,
            JSON.stringify({
                signedIn: true,
                name: user.name || '',
                email: user.email || '',
                updatedAt: new Date().toISOString()
            })
        );
    } catch {
        // Ignore storage failures and continue.
    }
}

function clearAuthenticated() {
    try {
        window.localStorage.removeItem(AUTH_STATE_KEY);
    } catch {
        // Ignore storage failures and continue.
    }
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

        nav {
            z-index: 2500 !important;
        }

        body.has-site-banner .site-floating-auth {
            top: 72px;
        }

        body.nav-open .site-floating-auth {
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
    if (document.querySelector('.site-floating-auth')) return;
    if (isAuthenticated()) return;

    ensureGlobalBannerStyles();

    const path = window.location.pathname.toLowerCase();
    const isAuthPage = path.endsWith('/auth.html') || path.endsWith('auth.html');
    const button = document.createElement('a');
    button.className = 'site-floating-auth';
    button.href = isAuthPage ? 'index.html' : 'auth.html';
    button.textContent = isAuthPage ? 'Home' : 'Sign In / Sign Up';
    document.body.appendChild(button);
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

document.addEventListener('DOMContentLoaded', () => {
    window.siteAuth = {
        clearAuthenticated,
        isAuthenticated,
        setAuthenticated
    };

    ensureTopBanner();
    ensureFloatingAuthButton();
    initNav();
    enhanceCodeExamples();
    window.addEventListener('resize', syncBannerOffset);
});
