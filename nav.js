// common navigation script
// handles opening/closing the full-screen nav panel

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

document.addEventListener('DOMContentLoaded', initNav);