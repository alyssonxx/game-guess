(() => {
  'use strict';
  const FB = () => window.GameGuessFirebase;
  const CORE = () => window.GameGuessCore;
  const $ = id => document.getElementById(id);

  const CHALLENGES = {
    // Daily Challenges (reset every 24h)
    daily_combo5: {
      id: 'daily_combo5',
      type: 'daily',
      category: 'combo',
      icon: '🔥',
      title: 'Combo Ardente',
      description: 'Faça um combo de 5 acertos',
      requirement: { stat: 'combo', threshold: 5, mode: 'any' },
      reward: { coins: 50, xp: 100 },
      difficulty: 'easy',
      resetAt: 'daily'
    },
    daily_games_5: {
      id: 'daily_games_5',
      type: 'daily',
      category: 'volume',
      icon: '🎮',
      title: '5 Partidas',
      description: 'Jogue 5 partidas de qualquer modo',
      requirement: { stat: 'playCount', threshold: 5, mode: 'any' },
      reward: { coins: 75, xp: 150 },
      difficulty: 'normal',
      resetAt: 'daily'
    },
    daily_insane: {
      id: 'daily_insane',
      type: 'daily',
      category: 'difficulty',
      icon: '💀',
      title: 'Desafio Insano',
      description: 'Ganhe 1 partida no modo Insano',
      requirement: { stat: 'difficultyWins', threshold: 1, difficulty: 'insane' },
      reward: { coins: 100, xp: 200 },
      difficulty: 'hard',
      resetAt: 'daily'
    },
    daily_accuracy: {
      id: 'daily_accuracy',
      type: 'daily',
      category: 'accuracy',
      icon: '🎯',
      title: 'Precisão Diária',
      description: 'Complete 3 acertos na primeira tentativa',
      requirement: { stat: 'firstTry', threshold: 3, mode: 'any' },
      reward: { coins: 80, xp: 160 },
      difficulty: 'normal',
      resetAt: 'daily'
    },
    daily_speed: {
      id: 'daily_speed',
      type: 'daily',
      category: 'speed',
      icon: '⚡',
      title: 'Velocista',
      description: 'Complete uma partida em menos de 2 minutos',
      requirement: { stat: 'time', threshold: 120, unit: 'seconds' },
      reward: { coins: 60, xp: 120 },
      difficulty: 'easy',
      resetAt: 'daily'
    },

    // Weekly Challenges (reset every 7 days)
    weekly_wins_20: {
      id: 'weekly_wins_20',
      type: 'weekly',
      category: 'pvp',
      icon: '⚔️',
      title: 'Semana Vitoriosa',
      description: 'Ganhe 20 partidas competitivas (Duel ou KOF)',
      requirement: { stat: 'competitiveWins', threshold: 20, modes: ['duel', 'kof'] },
      reward: { coins: 300, xp: 500 },
      difficulty: 'hard',
      resetAt: 'weekly'
    },
    weekly_modes_4: {
      id: 'weekly_modes_4',
      type: 'weekly',
      category: 'exploration',
      icon: '🌍',
      title: 'Explorador',
      description: 'Ganhe em 4 modos diferentes',
      requirement: { stat: 'modesWon', threshold: 4, modes: 'all' },
      reward: { coins: 250, xp: 400 },
      difficulty: 'normal',
      resetAt: 'weekly'
    },
    weekly_streak_100: {
      id: 'weekly_streak_100',
      type: 'weekly',
      category: 'combo',
      icon: '💫',
      title: 'Mestre Supremo',
      description: 'Atinja 100 pontos de combo acumulado na semana',
      requirement: { stat: 'comboSum', threshold: 100, accumulated: true },
      reward: { coins: 400, xp: 600 },
      difficulty: 'insane',
      resetAt: 'weekly'
    },
    weekly_geo_10: {
      id: 'weekly_geo_10',
      type: 'weekly',
      category: 'exploration',
      icon: '🌏',
      title: 'Geógrafo da Semana',
      description: 'Ganhe 10 partidas de GeoGuess',
      requirement: { stat: 'modeWins', threshold: 10, mode: 'geoguess' },
      reward: { coins: 280, xp: 450 },
      difficulty: 'normal',
      resetAt: 'weekly'
    },
    weekly_accuracy_90: {
      id: 'weekly_accuracy_90',
      type: 'weekly',
      category: 'accuracy',
      icon: '🏆',
      title: 'Semana Perfeita',
      description: 'Mantenha 90%+ de taxa de acerto na semana',
      requirement: { stat: 'weeklyAccuracy', threshold: 90, unit: 'percentage' },
      reward: { coins: 350, xp: 550 },
      difficulty: 'hard',
      resetAt: 'weekly'
    }
  };

  const CHALLENGE_CATEGORIES = {
    combo: { icon: '🔥', name: 'Combo & Sequência', color: '#ff6277' },
    volume: { icon: '📊', name: 'Volume', color: '#ffc857' },
    difficulty: { icon: '💀', name: 'Dificuldade', color: '#ff54e8' },
    accuracy: { icon: '🎯', name: 'Precisão', color: '#56f39a' },
    speed: { icon: '⚡', name: 'Velocidade', color: '#ffc857' },
    pvp: { icon: '⚔️', name: 'PvP', color: '#a97cff' },
    exploration: { icon: '🌍', name: 'Exploração', color: '#42e8ff' }
  };

  function getDailyChallenge(index = 0) {
    const daily = Object.values(CHALLENGES).filter(c => c.type === 'daily');
    const dayOfYear = Math.floor((FB()?.serverNow?.() || Date.now()) / 86400000) % daily.length;
    return daily[(dayOfYear + index) % daily.length];
  }

  function getWeeklyChallenges() {
    const weekly = Object.values(CHALLENGES).filter(c => c.type === 'weekly');
    const weekOfYear = Math.floor((FB()?.serverNow?.() || Date.now()) / (86400000 * 7)) % weekly.length;
    return weekly.slice(weekOfYear, weekOfYear + 3);
  }

  function getChallengeProgress(challengeId) {
    const profile = CORE()?.getProfile?.() || {};
    const challenge = CHALLENGES[challengeId];
    if (!challenge) return { current: 0, required: challenge?.requirement?.threshold || 0, completed: false };

    const req = challenge.requirement;
    let current = 0;

    switch (req.stat) {
      case 'combo':
        current = profile.combo || 0;
        break;
      case 'playCount':
        const played = Object.values(profile.rankedStats?.modes || {}).reduce((sum, m) => sum + (m.played || 0), 0);
        current = played;
        break;
      case 'difficultyWins':
        const diffKey = `${req.difficulty}Wins`;
        current = profile[diffKey] || 0;
        break;
      case 'firstTry':
        current = profile.firstTryCount || 0;
        break;
      case 'time':
        current = profile.lastGameTime ? Math.round(profile.lastGameTime / 1000) : 0;
        break;
      case 'competitiveWins':
        const duelWins = profile.duelWins || 0;
        const kofWins = profile.kofWins || 0;
        current = duelWins + kofWins;
        break;
      case 'modesWon':
        current = Object.values(profile.rankedStats?.modes || {}).filter(m => (m.wins || 0) > 0).length;
        break;
      case 'comboSum':
        current = profile.weeklyComboSum || profile.combo || 0;
        break;
      case 'modeWins':
        const modeKey = `${req.mode}Wins`;
        current = profile[modeKey] || 0;
        break;
      case 'weeklyAccuracy':
        const totalPlayed = Object.values(profile.rankedStats?.modes || {}).reduce((sum, m) => sum + (m.played || 0), 0);
        const totalWins = Object.values(profile.rankedStats?.modes || {}).reduce((sum, m) => sum + (m.wins || 0), 0);
        current = totalPlayed > 0 ? Math.round(totalWins / totalPlayed * 100) : 0;
        break;
    }

    const completed = current >= req.threshold;
    return { current, required: req.threshold, completed, percentage: Math.min(100, Math.round(current / req.threshold * 100)) };
  }

  function completedChallenge(challengeId) {
    const profile = CORE()?.getProfile?.() || {};
    const challenge = CHALLENGES[challengeId];
    if (!challenge) return;

    const completed = profile.completedChallenges || {};
    const today = Math.floor((FB()?.serverNow?.() || Date.now()) / 86400000);

    completed[challengeId] = { completedAt: Date.now(), day: today };
    CORE()?.replaceProfile?.({ ...profile, completedChallenges: completed });

    CORE()?.toast?.(
      `✅ ${challenge.title}`,
      `+${challenge.reward.coins} 🪙 +${challenge.reward.xp} XP`,
      'achievement'
    );
  }

  function renderChallengeCard(challengeId) {
    const challenge = CHALLENGES[challengeId];
    if (!challenge) return '';

    const progress = getChallengeProgress(challengeId);
    const category = CHALLENGE_CATEGORIES[challenge.category];
    const isCompleted = progress.completed;

    return `
      <div class="challenge-card${isCompleted ? ' completed' : ''}">
        <div class="challenge-header">
          <span class="challenge-icon">${challenge.icon}</span>
          <div class="challenge-meta">
            <h4>${challenge.title}</h4>
            <small>${category?.name}</small>
          </div>
          <span class="challenge-reward">${challenge.reward.coins}🪙</span>
        </div>
        <p class="challenge-desc">${challenge.description}</p>
        <div class="challenge-progress">
          <div class="progress-bar" style="--progress: ${progress.percentage}%">
            <div class="progress-fill"></div>
          </div>
          <span class="progress-text">${progress.current}/${progress.required}</span>
        </div>
        ${isCompleted ? '<div class="challenge-badge">✓ Concluído</div>' : ''}
      </div>
    `;
  }

  function renderDailyChallenges(containerId = 'dailyChallengesContainer') {
    const container = $(containerId);
    if (!container) return;

    const dailies = [getDailyChallenge(0), getDailyChallenge(1)];
    let html = `
      <div class="challenges-section">
        <h3 style="font:700 1rem 'Orbitron';color:#fff;margin:0 0 12px 0">⭐ Desafios Diários</h3>
        <div class="challenges-grid">
    `;

    for (const challenge of dailies) {
      html += renderChallengeCard(challenge.id);
    }

    html += '</div></div>';
    container.innerHTML = html;
  }

  function renderWeeklyChallenges(containerId = 'weeklyChallengesContainer') {
    const container = $(containerId);
    if (!container) return;

    const weeklies = getWeeklyChallenges();
    let html = `
      <div class="challenges-section">
        <h3 style="font:700 1rem 'Orbitron';color:#fff;margin:0 0 12px 0">🏆 Desafios Semanais</h3>
        <div class="challenges-grid">
    `;

    for (const challenge of weeklies) {
      html += renderChallengeCard(challenge.id);
    }

    html += '</div></div>';
    container.innerHTML = html;
  }

  function getChallengeStats() {
    const profile = CORE()?.getProfile?.() || {};
    const completed = profile.completedChallenges || {};

    const today = Math.floor((FB()?.serverNow?.() || Date.now()) / 86400000);
    const dailiesCompleted = Object.entries(completed)
      .filter(([id]) => CHALLENGES[id]?.type === 'daily' && completed[id]?.day === today)
      .length;

    const weekStart = Math.floor((FB()?.serverNow?.() || Date.now()) / (86400000 * 7)) * 7;
    const weekliesCompleted = Object.entries(completed)
      .filter(([id]) => CHALLENGES[id]?.type === 'weekly' && completed[id].completedAt >= weekStart)
      .length;

    const totalRewards = Object.entries(completed)
      .filter(([id]) => completed[id]?.day === today)
      .reduce((sum, [id]) => sum + (CHALLENGES[id]?.reward?.coins || 0), 0);

    return { dailiesCompleted, weekliesCompleted, totalRewards, today };
  }

  function escapeHtml(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  window.GameGuessChallenges = {
    CHALLENGES,
    CHALLENGE_CATEGORIES,
    getDailyChallenge,
    getWeeklyChallenges,
    getChallengeProgress,
    completedChallenge,
    renderChallengeCard,
    renderDailyChallenges,
    renderWeeklyChallenges,
    getChallengeStats
  };
})();
