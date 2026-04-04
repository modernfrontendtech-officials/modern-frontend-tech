(() => {
  function byId(id) {
    return document.getElementById(id);
  }

  function formatDate(value) {
    if (!value) return 'Not recorded yet';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not recorded yet';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  function emptyState(message) {
    return `<div class="profile-empty">${message}</div>`;
  }

  function renderList(target, items, renderer, emptyMessage) {
    if (!target) return;
    if (!Array.isArray(items) || items.length === 0) {
      target.innerHTML = emptyState(emptyMessage);
      return;
    }

    target.innerHTML = items.map(renderer).join('');
  }

  async function init() {
    const auth = window.siteAuth;
    if (!auth?.requireAuth({
      title: 'Sign in to open your profile',
      message: 'Your saved lessons, streak, certificates, quizzes, and challenge progress are only available after you sign in.',
      next: 'profile.html'
    })) {
      return;
    }

    const signOutButton = byId('profile-signout-button');
    if (signOutButton) {
      signOutButton.addEventListener('click', () => auth.signOut('index.html'));
    }

    try {
      const data = await auth.loadProfile();
      const user = data.user || {};
      const profile = data.profile || {};
      const streak = profile.streak || {};
      const stats = profile.stats || {};

      byId('profile-avatar').textContent = (user.name || user.email || 'P').trim().charAt(0).toUpperCase() || 'P';
      byId('profile-name').textContent = user.name || 'HTML learner';
      byId('profile-email').textContent = user.email || 'Signed in account';
      byId('profile-current-streak').textContent = String(streak.current || 0);
      byId('profile-streak-copy').textContent = streak.lastActiveDay
        ? `Last active on ${streak.lastActiveDay}. Come back tomorrow to keep the streak going.`
        : 'Open the site daily while signed in to build your streak.';
      byId('profile-longest-streak').textContent = `Longest streak: ${streak.longest || 0} day${Number(streak.longest || 0) === 1 ? '' : 's'}`;

      byId('profile-lessons-count').textContent = String(stats.lessonsExplored || 0);
      byId('profile-quizzes-count').textContent = String(stats.quizzesCompleted || 0);
      byId('profile-challenges-count').textContent = String(stats.challengesTracked || 0);
      byId('profile-certificates-count').textContent = String(stats.certificatesEarned || 0);

      renderList(
        byId('profile-lessons-list'),
        profile.lessonsExplored,
        (lesson) => `
          <div class="profile-list-item">
            <strong>${lesson.title || lesson.page}</strong>
            <div class="profile-meta">Visited ${lesson.visitCount || 1} time${Number(lesson.visitCount || 1) === 1 ? '' : 's'} · last opened ${formatDate(lesson.lastVisitedAt)}</div>
          </div>
        `,
        'No lesson visits have been saved yet.'
      );

      renderList(
        byId('profile-quizzes-list'),
        profile.quizResults,
        (quiz) => `
          <div class="profile-list-item">
            <strong>${quiz.title || quiz.page}</strong>
            <div class="profile-meta">Latest score ${quiz.score}/${quiz.totalQuestions} · best ${quiz.bestScore || quiz.score}/${quiz.totalQuestions} · checked ${formatDate(quiz.checkedAt)}</div>
          </div>
        `,
        'Complete a lesson quiz to save the result here.'
      );

      renderList(
        byId('profile-challenges-list'),
        profile.challengeResults,
        (challenge) => `
          <div class="profile-list-item">
            <strong>${challenge.label || challenge.challengeKey}</strong>
            <div class="profile-meta">${challenge.startedCount || 0}/${challenge.totalCount || 0} started · updated ${formatDate(challenge.updatedAt)}</div>
          </div>
        `,
        'Challenge progress will appear here after you save work in the weekly challenge page.'
      );

      renderList(
        byId('profile-certificates-list'),
        profile.certificates,
        (certificate) => `
          <div class="profile-list-item">
            <strong>${certificate.level} certificate</strong>
            <div class="profile-meta">${certificate.score}/${certificate.total} (${certificate.percentage}%) · issued ${formatDate(certificate.issuedAt)} · ID ${certificate.certificateId}</div>
          </div>
        `,
        'Pass the HTML exam to earn a certificate.'
      );

      renderList(
        byId('profile-exams-list'),
        profile.examResults,
        (exam) => `
          <div class="profile-list-item">
            <strong>${exam.status}</strong>
            <div class="profile-meta">${exam.score}/${exam.total} (${exam.percentage}%) · certificate ${exam.certificate || 'None'} · submitted ${formatDate(exam.submittedAt)}</div>
          </div>
        `,
        'No exam attempts have been recorded yet.'
      );

      renderList(
        byId('profile-activity-list'),
        profile.recentActivity,
        (activity) => `
          <div class="profile-activity-item">
            <strong>${activity.label || activity.type}</strong>
            <div class="profile-meta">${formatDate(activity.at)}</div>
          </div>
        `,
        'Your recent activity feed is still empty.'
      );
    } catch (error) {
      byId('profile-name').textContent = 'Profile unavailable';
      byId('profile-email').textContent = error.message || 'Please sign in again.';

      const sections = [
        'profile-lessons-list',
        'profile-quizzes-list',
        'profile-challenges-list',
        'profile-certificates-list',
        'profile-exams-list',
        'profile-activity-list'
      ];
      sections.forEach((id) => {
        const element = byId(id);
        if (element) {
          element.innerHTML = emptyState('This profile could not be loaded. Signing out and back in usually fixes it.');
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
