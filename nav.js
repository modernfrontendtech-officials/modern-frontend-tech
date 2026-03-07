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

document.addEventListener('DOMContentLoaded', () => {
    window.siteAuth = {
        clearAuthenticated,
        isAuthenticated,
        setAuthenticated
    };

    ensureTopBanner();
    ensureFloatingAuthButton();
    initNav();
    window.addEventListener('resize', syncBannerOffset);
});
