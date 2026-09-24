(() => {
  'use strict';
  const FB = () => window.GameGuessFirebase;
  const CORE = () => window.GameGuessCore;

  // Seasons: month-based rotation (3 months each)
  const SEASONS = {
    S1: {
      id: 'S1',
      label: 'Temporada 1 - Conquistas',
      description: 'Temporada inaugural focada em conquistas e recordes',
      startsAt: new Date(2026, 8, 1).getTime(), // Sept 1
      endsAt: new Date(2026, 11, 1).getTime(),   // Dec 1
      theme: 'conquest',
      rewards: { top10: 100, top50: 50, top100: 25, participated: 10 }
    },
    S2: {
      id: 'S2',
      label: 'Temporada 2 - Velocidade',
      description: 'Desafio de velocidade - complete no menor tempo',
      startsAt: new Date(2026, 11, 1).getTime(), // Dec 1
      endsAt: new Date(2027, 2, 1).getTime(),    // Mar 1
      theme: 'speed',
      rewards: { top10: 120, top50: 60, top100: 30, participated: 15 }
    },
    S3: {
      id: 'S3',
      label: 'Temporada 3 - Precisão',
      description: 'Foco em acurácia - quanto mais acertos, melhor',
      startsAt: new Date(2027, 2, 1).getTime(),  // Mar 1
      endsAt: new Date(2027, 5, 1).getTime(),    // Jun 1
      theme: 'accuracy',
      rewards: { top10: 140, top50: 70, top100: 35, participated: 20 }
    }
  };

  function getCurrentSeason() {
    const now = FB()?.serverNow?.() || Date.now();
    for (const [key, season] of Object.entries(SEASONS)) {
      if (now >= season.startsAt && now < season.endsAt) {
        return season;
      }
    }
    return SEASONS.S1;
  }

  function getNextSeason() {
    const current = getCurrentSeason();
    const seasons = Object.values(SEASONS).sort((a, b) => a.startsAt - b.startsAt);
    const idx = seasons.findIndex(s => s.id === current.id);
    return idx >= 0 && idx < seasons.length - 1 ? seasons[idx + 1] : seasons[0];
  }

  function getSeasonProgress() {
    const current = getCurrentSeason();
    const now = FB()?.serverNow?.() || Date.now();
    const duration = current.endsAt - current.startsAt;
    const elapsed = Math.max(0, now - current.startsAt);
    const percentComplete = Math.round(elapsed / duration * 100);
    return { percentComplete, daysRemaining: Math.ceil((current.endsAt - now) / 86400000) };
  }

  function formatSeasonTime(ms) {
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  }

  function getSeasonRewards(placement) {
    const season = getCurrentSeason();
    if (placement <= 10) return season.rewards.top10;
    if (placement <= 50) return season.rewards.top50;
    if (placement <= 100) return season.rewards.top100;
    return season.rewards.participated;
  }

  function renderSeasonCountdown(containerId = 'seasonCountdown') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const current = getCurrentSeason();
    const { daysRemaining, percentComplete } = getSeasonProgress();

    container.innerHTML = `
      <div style="padding:16px;border:1px solid rgba(66,232,255,.2);border-radius:var(--radius-md);background:linear-gradient(135deg,rgba(32,75,90,.15),rgba(18,33,54,.1))">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div>
            <h3 style="font:700 1rem 'Orbitron';color:#fff;margin:0">${current.label}</h3>
            <p style="margin:4px 0 0;font-size:.85rem;color:#7f89a8">${current.description}</p>
          </div>
          <div style="text-align:right">
            <b style="font:700 1.2rem 'Orbitron';color:var(--cyan);display:block">${daysRemaining}d</b>
            <small style="color:#7f89a8">restantes</small>
          </div>
        </div>
        <div style="width:100%;height:6px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;margin-bottom:10px">
          <div style="height:100%;width:${percentComplete}%;background:var(--gradient-cyan);transition:.4s ease"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:.8rem;color:#9fa8c4">
          <span>Progresso: ${percentComplete}%</span>
          <span>🏆 Recompensa: Moedas ${getSeasonRewards(50)}+</span>
        </div>
      </div>
    `;
  }

  function renderSeasonLeaderboard(leaderboardData = [], containerId = 'seasonLeaderboard') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const current = getCurrentSeason();
    let html = `<div style="padding:16px;border:1px solid rgba(66,232,255,.15);border-radius:var(--radius-md);background:rgba(18,25,45,.6)">
      <h3 style="font:700 1rem 'Orbitron';color:#fff;margin:0 0 12px 0">${current.label} - Ranking</h3>
      <div style="display:grid;gap:8px">
    `;

    const top10 = leaderboardData.slice(0, 10);
    for (let i = 0; i < top10.length; i++) {
      const p = top10[i];
      const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][i];
      const reward = getSeasonRewards(i + 1);

      html += `
        <div style="display:flex;gap:10px;align-items:center;padding:10px;background:rgba(66,232,255,.08);border-radius:10px;border-left:3px solid var(--cyan)">
          <span style="font-size:1.4rem">${medal}</span>
          <div style="flex:1;min-width:0">
            <b style="font:700 .9rem 'Orbitron';color:#fff;display:block">${escapeHtml(p.displayName)}</b>
            <small style="color:#7f89a8">${formatNumber(p.rating)} ⭐ • ${p.totalPlayed} partidas</small>
          </div>
          <div style="text-align:right;flex:none">
            <b style="font:700 .85rem 'Orbitron';color:#ffc857">${reward} 🪙</b>
          </div>
        </div>
      `;
    }

    html += '</div></div>';
    container.innerHTML = html;
  }

  function renderNextSeasonPreview(containerId = 'nextSeasonPreview') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const next = getNextSeason();
    const current = getCurrentSeason();
    const daysUntilNext = Math.ceil((next.startsAt - (FB()?.serverNow?.() || Date.now())) / 86400000);

    container.innerHTML = `
      <div style="padding:14px;border:1px dashed rgba(66,232,255,.3);border-radius:var(--radius-md);background:rgba(66,232,255,.05);text-align:center">
        <p style="margin:0;font-size:.85rem;color:#7f89a8">Próxima temporada em ${daysUntilNext} dias</p>
        <h4 style="font:700 1rem 'Orbitron';color:var(--cyan);margin:6px 0">${next.label}</h4>
        <small style="color:#9fa8c4">${next.description}</small>
      </div>
    `;
  }

  function escapeHtml(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function formatNumber(n) {
    return Number(n || 0).toLocaleString('pt-BR');
  }

  window.GameGuessSeasons = {
    SEASONS,
    getCurrentSeason,
    getNextSeason,
    getSeasonProgress,
    formatSeasonTime,
    getSeasonRewards,
    renderSeasonCountdown,
    renderSeasonLeaderboard,
    renderNextSeasonPreview
  };
})();
