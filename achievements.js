(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const CORE = () => window.GameGuessCore;
  const FB = () => window.GameGuessFirebase;

  const ACHIEVEMENTS = {
    // Combo & Streak
    combo5: { id: 'combo5', icon: '🔥', title: 'Combo 5x', desc: 'Acerte 5 perguntas seguidas', category: 'combo', threshold: 5, type: 'streak' },
    combo10: { id: 'combo10', icon: '🌪️', title: 'Combo 10x', desc: 'Acerte 10 perguntas seguidas', category: 'combo', threshold: 10, type: 'streak' },
    combo20: { id: 'combo20', icon: '💫', title: 'Combo 20x', desc: 'Acerte 20 perguntas seguidas', category: 'combo', threshold: 20, type: 'streak' },
    bestStreak: { id: 'bestStreak', icon: '⭐', title: 'Mestre da Sequência', desc: 'Atinja 50+ de sequência', category: 'combo', threshold: 50, type: 'bestStreak' },

    // Speed & Time
    speedRunner: { id: 'speedRunner', icon: '⚡', title: 'Velocista', desc: 'Complete um Game Guess em menos de 2 minutos', category: 'speed', threshold: 120000, type: 'time' },
    blitzKing: { id: 'blitzKing', icon: '🏃', title: 'Rei do Blitz', desc: 'Ganhe 5 partidas no modo Blitz', category: 'speed', threshold: 5, type: 'modeWins', mode: 'blitz' },

    // Accuracy & Precision
    perfectGuess: { id: 'perfectGuess', icon: '🎯', title: 'Palpite Perfeito', desc: 'Acerte na primeira tentativa', category: 'accuracy', threshold: 1, type: 'attempts' },
    firstTry5: { id: 'firstTry5', icon: '💯', title: '5 Acertos na Primeira', desc: 'Acerte 5 vezes na primeira tentativa', category: 'accuracy', threshold: 5, type: 'firstTry' },
    accuracy90: { id: 'accuracy90', icon: '🔬', title: 'Precisão 90%', desc: 'Atinja 90% de taxa de acerto', category: 'accuracy', threshold: 90, type: 'accuracy' },

    // Difficulty Mastery
    insaneMaster: { id: 'insaneMaster', icon: '💀', title: 'Mestre do Insano', desc: 'Ganhe 10 partidas no modo Insano', category: 'difficulty', threshold: 10, type: 'difficultyWins', difficulty: 'insane' },
    hardMaster: { id: 'hardMaster', icon: '🔥', title: 'Especialista em Difícil', desc: 'Ganhe 20 partidas no modo Difícil', category: 'difficulty', threshold: 20, type: 'difficultyWins', difficulty: 'hard' },
    noHints: { id: 'noHints', icon: '🚫', title: 'Sem Ajuda', desc: 'Ganhe uma partida sem usar dicas', category: 'difficulty', threshold: 1, type: 'noHints' },

    // Game Mode Exploration
    geoMaster: { id: 'geoMaster', icon: '🌍', title: 'Geógrafo', desc: 'Ganhe 10 partidas de GeoGuess', category: 'modes', threshold: 10, type: 'modeWins', mode: 'geoguess' },
    termoMaster: { id: 'termoMaster', icon: '∞', title: 'Mestre do Termo', desc: 'Ganhe 10 partidas de Termo', category: 'modes', threshold: 10, type: 'modeWins', mode: 'termo' },
    quizMaster: { id: 'quizMaster', icon: '🧠', title: 'Trivialista', desc: 'Ganhe 10 partidas de Quiz', category: 'modes', threshold: 10, type: 'modeWins', mode: 'quiz' },

    // PvP & Competitive
    duelChampion: { id: 'duelChampion', icon: '⚔️', title: 'Campeão de Duelos', desc: 'Ganhe 20 duelos 1x1', category: 'pvp', threshold: 20, type: 'modeWins', mode: 'duel' },
    kofChampion: { id: 'kofChampion', icon: '🥊', title: 'Campeão KOF', desc: 'Ganhe 15 partidas de KOF', category: 'pvp', threshold: 15, type: 'modeWins', mode: 'kof' },
    ratingMilestone: { id: 'ratingMilestone', icon: '👑', title: 'Mil de Rating', desc: 'Atinja 1500+ de rating', category: 'pvp', threshold: 1500, type: 'rating' },

    // Volume & Dedication
    playCount50: { id: 'playCount50', icon: '📊', title: '50 Partidas', desc: 'Jogue 50 partidas', category: 'volume', threshold: 50, type: 'playCount' },
    playCount200: { id: 'playCount200', icon: '📈', title: '200 Partidas', desc: 'Jogue 200 partidas', category: 'volume', threshold: 200, type: 'playCount' },
    playCount500: { id: 'playCount500', icon: '📉', title: '500 Partidas', desc: 'Jogue 500 partidas', category: 'volume', threshold: 500, type: 'playCount' },

    // Rare Conditions
    comeback: { id: 'comeback', icon: '🔄', title: 'Volta Triunfal', desc: 'Ganhe após estar perdendo por 3+ acertos', category: 'rare', threshold: 1, type: 'comeback' },
    allModes: { id: 'allModes', icon: '🎮', title: 'Polivalente', desc: 'Ganhe em todos os 6 modos de jogo', category: 'rare', threshold: 6, type: 'allModes' }
  };

  const CATEGORIES = {
    combo: { icon: '🔥', name: 'Combo & Sequência', color: '#ff6277' },
    speed: { icon: '⚡', name: 'Velocidade', color: '#ffc857' },
    accuracy: { icon: '🎯', name: 'Precisão', color: '#56f39a' },
    difficulty: { icon: '💀', name: 'Dificuldade', color: '#ff54e8' },
    modes: { icon: '🎮', name: 'Modos de Jogo', color: '#42e8ff' },
    pvp: { icon: '⚔️', name: 'PvP & Competitivo', color: '#a97cff' },
    volume: { icon: '📊', name: 'Dedicação', color: '#ff9f5c' },
    rare: { icon: '⭐', name: 'Condições Raras', color: '#d6ae5b' }
  };

  function getUnlockedAchievements() {
    const profile = CORE()?.getProfile?.() || {};
    return profile.achievements || {};
  }

  function checkAchievement(achievementId, stats = {}) {
    const ach = ACHIEVEMENTS[achievementId];
    if (!ach) return false;

    const profile = CORE()?.getProfile?.() || {};
    const alreadyUnlocked = profile.achievements?.[achievementId];
    if (alreadyUnlocked) return false;

    const threshold = ach.threshold;
    const type = ach.type;

    switch (type) {
      case 'streak':
        return (stats.combo || profile.combo || 0) >= threshold;
      case 'bestStreak':
        return (stats.bestStreak || profile.bestStreak || 0) >= threshold;
      case 'time':
        return (stats.timeMs || 0) > 0 && (stats.timeMs || 0) <= threshold;
      case 'modeWins':
        const modeKey = `${ach.mode}Wins`;
        return (stats[modeKey] || profile[modeKey] || 0) >= threshold;
      case 'attempts':
        return (stats.attempts || 0) <= threshold;
      case 'firstTry':
        return (stats.firstTryCount || 0) >= threshold;
      case 'accuracy':
        const played = Object.values(profile.rankedStats?.modes || {}).reduce((sum, m) => sum + (m.played || 0), 0);
        const wins = Object.values(profile.rankedStats?.modes || {}).reduce((sum, m) => sum + (m.wins || 0), 0);
        return played > 0 && (wins / played * 100) >= threshold;
      case 'difficultyWins':
        const diffKey = `${ach.difficulty}Wins`;
        return (stats[diffKey] || profile[diffKey] || 0) >= threshold;
      case 'noHints':
        return (stats.hintsUsed || 0) === 0;
      case 'playCount':
        const totalPlayed = Object.values(profile.rankedStats?.modes || {}).reduce((sum, m) => sum + (m.played || 0), 0);
        return totalPlayed >= threshold;
      case 'rating':
        return (profile.rating || profile.overallRating || 0) >= threshold;
      case 'comeback':
        return (stats.isComeback || false);
      case 'allModes':
        const modesWon = Object.values(profile.rankedStats?.modes || {}).filter(m => (m.wins || 0) > 0).length;
        return modesWon >= threshold;
      default:
        return false;
    }
  }

  function unlockAchievement(achievementId) {
    const ach = ACHIEVEMENTS[achievementId];
    if (!ach) return;

    const profile = CORE()?.getProfile?.() || {};
    if (profile.achievements?.[achievementId]) return;

    const achievements = profile.achievements || {};
    achievements[achievementId] = {
      unlockedAt: Date.now(),
      title: ach.title,
      icon: ach.icon
    };

    CORE()?.replaceProfile?.({ ...profile, achievements });

    CORE()?.toast?.(
      `🏆 ${ach.title}`,
      ach.desc,
      'achievement'
    );
  }

  function renderAchievementBadges(containerId = 'achievementGrid') {
    const container = $(containerId);
    if (!container) return;

    const unlocked = getUnlockedAchievements();
    let html = '';

    for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
      const isUnlocked = Boolean(unlocked[id]);
      const category = CATEGORIES[ach.category];

      html += `
        <div class="achievement-card${isUnlocked ? ' unlocked' : ''}">
          <div class="achievement-icon">${ach.icon}</div>
          <h4>${ach.title}</h4>
          <p>${ach.desc}</p>
          <small>${category?.name || 'Desafio'}</small>
          ${isUnlocked ? `<span class="unlock-time">${new Date(unlocked[id].unlockedAt).toLocaleDateString('pt-BR')}</span>` : ''}
        </div>
      `;
    }

    container.innerHTML = html;
  }

  function renderAchievementsByCategory() {
    const container = document.querySelector('[data-achievement-container]');
    if (!container) return;

    const unlocked = getUnlockedAchievements();
    let html = '';

    for (const [catKey, cat] of Object.entries(CATEGORIES)) {
      const achievements = Object.entries(ACHIEVEMENTS).filter(([_, a]) => a.category === catKey);
      const unlockedCount = achievements.filter(([id]) => unlocked[id]).length;

      html += `
        <div class="achievement-category">
          <div class="category-header">
            <span class="category-icon">${cat.icon}</span>
            <h3>${cat.name}</h3>
            <span class="category-progress">${unlockedCount}/${achievements.length}</span>
          </div>
          <div class="achievement-list">
      `;

      for (const [id, ach] of achievements) {
        const isUnlocked = Boolean(unlocked[id]);
        html += `
          <div class="achievement-item${isUnlocked ? ' unlocked' : ''}">
            <span class="ach-icon">${ach.icon}</span>
            <div class="ach-info">
              <b>${ach.title}</b>
              <small>${ach.desc}</small>
            </div>
            ${isUnlocked ? `<span class="ach-date">${new Date(unlocked[id].unlockedAt).toLocaleDateString('pt-BR')}</span>` : ''}
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  function getAchievementStats() {
    const unlocked = getUnlockedAchievements();
    const totalCount = Object.keys(ACHIEVEMENTS).length;
    const unlockedCount = Object.keys(unlocked).length;
    const percentage = totalCount > 0 ? Math.round(unlockedCount / totalCount * 100) : 0;

    const byCategory = {};
    for (const [catKey, cat] of Object.entries(CATEGORIES)) {
      const achievements = Object.entries(ACHIEVEMENTS).filter(([_, a]) => a.category === catKey);
      const unlockedInCat = achievements.filter(([id]) => unlocked[id]).length;
      byCategory[catKey] = {
        total: achievements.length,
        unlocked: unlockedInCat,
        percentage: achievements.length > 0 ? Math.round(unlockedInCat / achievements.length * 100) : 0
      };
    }

    return { totalCount, unlockedCount, percentage, byCategory };
  }

  window.GameGuessAchievements = {
    ACHIEVEMENTS,
    CATEGORIES,
    checkAchievement,
    unlockAchievement,
    getUnlockedAchievements,
    renderAchievementBadges,
    renderAchievementsByCategory,
    getAchievementStats
  };
})();
