(() => {
  'use strict';

  // Unified scoring framework v20.0
  const SCORING_BASE = {
    gameGuess: { base: 100, max: 600, formula: 'attemptBased' },
    quiz: { base: 50, max: 1000, formula: 'accuracyBased' },
    geoguess: { base: 100, max: 5000, formula: 'distanceBased' },
    termo: { base: 10, max: 100, formula: 'attemptsRemaining' },
    duel: { base: 200, max: 800, formula: 'competitiveBased' },
    kof: { base: 150, max: 500, formula: 'victoriesBased' }
  };

  const DIFFICULTIES = {
    easy: { title: 'Fácil', icon: '🌱', scoreMult: 0.85, coinBonus: 0 },
    normal: { title: 'Normal', icon: '🎯', scoreMult: 1, coinBonus: 10 },
    hard: { title: 'Difícil', icon: '🔥', scoreMult: 1.35, coinBonus: 25 },
    insane: { title: 'Insano', icon: '💀', scoreMult: 1.8, coinBonus: 45 }
  };

  // Unified coin reward calculation
  function pointsToCoinReward(points, difficulty = 'normal') {
    const baseCoins = Math.round(Math.max(0, points) / 1000);
    const diffBonus = DIFFICULTIES[difficulty]?.coinBonus || 0;
    return Math.max(1, Math.min(10, baseCoins + diffBonus));
  }

  // Calculate score based on mode and config
  function calculateScore(mode, config = {}) {
    const base = SCORING_BASE[mode]?.base || 100;
    const max = SCORING_BASE[mode]?.max || 600;

    let score = base;

    if (mode === 'gameGuess' || config.formula === 'attemptBased') {
      // Attempt-based: more attempts remaining = more points
      const attemptsLeft = config.attemptsRemaining || 0;
      score = base + (attemptsLeft * 75);
      score = Math.min(score, max);
    } else if (mode === 'geoguess' || config.formula === 'distanceBased') {
      // Distance-based: exponential decay
      const distance = config.distance || 0;
      if (distance <= 0.025) {
        score = max;
      } else {
        score = Math.max(0, Math.round(max * Math.exp(-distance / 1800)));
      }
    } else if (mode === 'quiz' || config.formula === 'accuracyBased') {
      // Quiz: speed + accuracy + streak
      const timeLeft = config.timeLeft || 0;
      const streak = config.streak || 0;
      score = base + (timeLeft * 18) + (streak * 25);
      score = Math.min(score, max);
    } else if (mode === 'termo' || config.formula === 'attemptsRemaining') {
      // Termo: attempts remaining
      const attempts = config.attemptsRemaining || 0;
      score = base + (attempts * 10);
      score = Math.min(score, max);
    } else if (mode === 'duel' || config.formula === 'competitiveBased') {
      // Duel: base minus penalties
      const hintsUsed = config.hintsUsed || 0;
      const wrongGuesses = config.wrongGuesses || 0;
      score = base - (hintsUsed * 90) - (wrongGuesses * 140);
      score = Math.max(0, Math.min(score, max));
    } else if (mode === 'kof' || config.formula === 'victoriesBased') {
      // KOF: simplified base (Elo handles ranking)
      score = base;
    }

    // Apply multipliers
    if (config.comboMultiplier) {
      score *= config.comboMultiplier;
    }
    if (config.difficultyMultiplier) {
      score *= config.difficultyMultiplier;
    }

    // Apply penalties
    if (config.hintsPenalty) {
      score -= config.hintsPenalty;
    }

    return Math.round(Math.max(0, score));
  }

  // Elo-like rating update for competitive modes
  function updateRating(currentRating = 1000, isWin = false, difficulty = 'normal', opponentRating = 1000) {
    const K = 32; // K-factor
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
    const actual = isWin ? 1 : 0;
    const diffMult = { easy: 0.5, normal: 1, hard: 1.5, insane: 2 }[difficulty] || 1;
    const delta = Math.round(K * (actual - expectedScore) * diffMult);
    return Math.max(800, Math.min(2400, currentRating + delta)); // Clamp between 800-2400
  }

  // Export for global access
  window.GameGuessScoring = {
    SCORING_BASE,
    DIFFICULTIES,
    pointsToCoinReward,
    calculateScore,
    updateRating
  };

})();
