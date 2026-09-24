(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const CORE = () => window.GameGuessCore;
  const FB = () => window.GameGuessFirebase;

  function injectRankingV20() {
    const main = document.querySelector('main.shell');
    if (!main || $('rankingScreenV20')) return;

    main.insertAdjacentHTML('beforeend', `
    <section class="screen" id="rankingScreenV20">
      <div class="section-heading">
        <button class="back-link" id="rankingBackV20">← Voltar</button>
        <div>
          <p class="eyebrow">🏆 RANKING GLOBAL • V20.0</p>
          <h2>Melhores Jogadores</h2>
          <p>Compete globalmente e veja seu progresso no ranking unificado com estatísticas por modo.</p>
        </div>
      </div>

      <div class="ranking-layout-v20">
        <div class="ranking-main">
          <!-- Podium Top 3 -->
          <section class="ranking-podium-section">
            <h3 style="font:800 1.3rem 'Orbitron';margin-bottom:20px;text-align:center">🥇 Top 3 Jogadores</h3>
            <div class="podium-container" id="rankingPodium"></div>
          </section>

          <!-- Season Info -->
          <div class="season-info-bar" id="rankingSeasonInfo"></div>

          <!-- Filters -->
          <div class="ranking-filters" id="rankingFilters"></div>

          <!-- Full Leaderboard -->
          <section class="ranking-leaderboard-section">
            <div id="rankingList" style="display:grid;gap:8px"></div>
          </section>
        </div>

        <!-- Personal Stats Sidebar -->
        <aside class="ranking-sidebar">
          <div class="stat-card">
            <h3>Seu Ranking</h3>
            <div id="myRankDisplay" style="text-align:center">
              <p style="color:#7f89a8">Faça login para ver seu ranking</p>
            </div>
          </div>

          <div class="stat-card">
            <h3>Estatísticas</h3>
            <div id="myStatsDisplay" style="display:grid;gap:10px;margin-top:12px">
              <div style="border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:8px">
                <small style="color:#7f89a8">Vitórias</small>
                <b id="myWinsDisplay">—</b>
              </div>
              <div style="border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:8px">
                <small style="color:#7f89a8">Taxa de Vitória</small>
                <b id="myWinRateDisplay">—</b>
              </div>
              <div style="border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:8px">
                <small style="color:#7f89a8">Melhor Score</small>
                <b id="myBestScoreDisplay">—</b>
              </div>
              <div>
                <small style="color:#7f89a8">Sequência Atual</small>
                <b id="myStreakDisplay">—</b>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <h3>Por Modo</h3>
            <div id="myModeStatsDisplay" style="display:grid;gap:8px;margin-top:12px;font-size:.9rem"></div>
          </div>
        </aside>
      </div>
    </section>
    `);
  }

  function formatNumber(n) {
    return Number(n || 0).toLocaleString('pt-BR');
  }

  function renderPodium(rows) {
    if (rows.length === 0) return;
    const top3 = rows.slice(0, 3);
    const medals = ['🥇', '🥈', '🥉'];

    let html = '';
    for (let i = 0; i < top3.length; i++) {
      const p = top3[i];
      const place = i === 0 ? 'first' : i === 1 ? 'second' : 'third';
      html += `
        <div class="podium-place ${place}">
          <div class="podium-step">${medals[i]}</div>
          <div class="podium-player">
            <div class="podium-name">${escapeHtml(p.displayName)}</div>
            <div class="podium-rating">⭐ ${formatNumber(p.rating)}</div>
            <small style="color:#8a94b3">${formatNumber(p.bestScore)} pts</small>
          </div>
        </div>
      `;
    }
    $('rankingPodium').innerHTML = html;
  }

  function renderSeasonInfo() {
    const season = FB()?.getSeason?.() || {};
    $('rankingSeasonInfo').innerHTML = `
      <div class="season-info-item">
        <h4>Temporada</h4>
        <span>${escapeHtml(season.label || 'Temporada 1')}</span>
        <small>${escapeHtml(season.description || 'Ranking ativo')}</small>
      </div>
      <div class="season-info-item">
        <h4>Progresso</h4>
        <span>${formatNumber(Date.now())}</span>
        <small>Dados em tempo real</small>
      </div>
      <div class="season-info-item">
        <h4>Modo</h4>
        <span id="rankingModeLabel">Geral</span>
        <small>Classificação combinada</small>
      </div>
    `;
  }

  function renderFilters() {
    $('rankingFilters').innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="ranking-filter-btn active" data-rank-mode="rating" style="border:1px solid rgba(66,232,255,.3);background:rgba(66,232,255,.1);color:var(--cyan);border-radius:8px;padding:8px 14px;cursor:pointer;font:700 .8rem 'Orbitron';transition:var(--transition-normal)">🌍 Geral</button>
        <button class="ranking-filter-btn" data-rank-mode="bestScore" style="border:1px solid rgba(255,255,255,.1);background:transparent;color:#aeb7d2;border-radius:8px;padding:8px 14px;cursor:pointer;font:700 .8rem 'Orbitron';transition:var(--transition-normal)">⭐ Melhor Score</button>
        <button class="ranking-filter-btn" data-rank-mode="bestStreak" style="border:1px solid rgba(255,255,255,.1);background:transparent;color:#aeb7d2;border-radius:8px;padding:8px 14px;cursor:pointer;font:700 .8rem 'Orbitron';transition:var(--transition-normal)">🔥 Sequência</button>
      </div>
    `;
    $('rankingFilters').addEventListener('click', e => {
      const btn = e.target.closest('.ranking-filter-btn');
      if (!btn) return;
      $('rankingFilters').querySelectorAll('.ranking-filter-btn').forEach(b => {
        b.classList.toggle('active', b === btn);
        b.style.borderColor = b === btn ? 'rgba(66,232,255,.3)' : 'rgba(255,255,255,.1)';
        b.style.background = b === btn ? 'rgba(66,232,255,.1)' : 'transparent';
        b.style.color = b === btn ? 'var(--cyan)' : '#aeb7d2';
      });
      loadRankingV20(btn.dataset.rankMode);
    });
  }

  function renderLeaderboard(rows, sortBy = 'rating') {
    if (rows.length === 0) {
      $('rankingList').innerHTML = '<div style="padding:40px;text-align:center;color:#7f89a8">Nenhum jogador no ranking ainda.</div>';
      return;
    }

    const sorted = [...rows].sort((a, b) => Number(b[sortBy] || 0) - Number(a[sortBy] || 0));
    let html = '';

    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      const me = FB()?.getUser?.();
      const isMe = me && p.uid === me.uid;
      const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`;

      html += `
        <div class="leaderboard-row${isMe ? ' me' : ''}">
          <div class="leaderboard-medal">${medal}</div>
          <div class="leaderboard-player">
            <span>${escapeHtml(p.displayName)}</span>
            <small>${formatNumber(p.totalPlayed)} partidas • ${p.accuracy}% aproveitamento</small>
          </div>
          <div class="leaderboard-rating">${formatNumber(p[sortBy] || 0)}</div>
          <div class="leaderboard-stats">${p.duelWins || 0}V / ${p.kofWins || 0}K</div>
        </div>
      `;
    }

    $('rankingList').innerHTML = html;
  }

  function renderMyStats(profile) {
    if (!profile) {
      $('myRankDisplay').innerHTML = '<p style="color:#7f89a8">Faça login para ver seu ranking</p>';
      $('myStatsDisplay').style.display = 'none';
      $('myModeStatsDisplay').innerHTML = '';
      return;
    }

    const p = profile;
    const played = Number(p.gamesPlayed || 0) + Number(p.termPlayed || 0) + Number(p.duelPlayed || 0) + Number(p.kofPlayed || 0) + Number(p.geoPlayed || 0);
    const wins = Number(p.gamesWon || 0) + Number(p.termWins || 0) + Number(p.duelWins || 0) + Number(p.kofWins || 0) + Number(p.geoWins || 0);
    const winRate = played > 0 ? Math.round(wins / played * 100) : 0;

    $('myWinsDisplay').textContent = formatNumber(wins);
    $('myWinRateDisplay').textContent = `${winRate}%`;
    $('myBestScoreDisplay').textContent = formatNumber(p.highScore || 0);
    $('myStreakDisplay').textContent = `🔥 ${formatNumber(p.bestStreak || 0)}`;

    const modes = [
      { icon: '🎮', label: 'Game Guess', wins: p.gamesWon, played: p.gamesPlayed },
      { icon: '📚', label: 'Quiz', wins: 0, played: 0 },
      { icon: '∞', label: 'Termo', wins: p.termWins, played: p.termPlayed },
      { icon: '⚔️', label: 'Arena', wins: p.duelWins, played: p.duelPlayed },
      { icon: '🥊', label: 'KOF', wins: p.kofWins, played: p.kofPlayed },
      { icon: '🌍', label: 'GeoGuess', wins: p.geoWins, played: p.geoPlayed }
    ];

    let modesHtml = '';
    for (const m of modes) {
      if (m.played > 0) {
        const mWinRate = Math.round(m.wins / m.played * 100);
        modesHtml += `<div style="padding:8px;background:rgba(255,255,255,.04);border-radius:8px;display:flex;justify-content:space-between"><span>${m.icon} ${m.label}</span><b>${m.wins}/${m.played} (${mWinRate}%)</b></div>`;
      }
    }
    $('myModeStatsDisplay').innerHTML = modesHtml || '<small style="color:#7f89a8">Jogue em diferentes modos para ver estatísticas</small>';
  }

  function escapeHtml(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  let rankingUnsub = null;

  function subscribeToRanking(sortBy = 'rating') {
    if (rankingUnsub) rankingUnsub();
    const limit = 100;
    FB()?.listenToRanking?.(limit, (rows) => {
      if (!rows || rows.length === 0) {
        $('rankingList').innerHTML = '<div style="padding:40px;text-align:center;color:#7f89a8">Nenhum jogador no ranking ainda. Comece a jogar!</div>';
        return;
      }
      renderSeasonInfo();
      renderFilters();
      renderPodium(rows);
      renderLeaderboard(rows, sortBy);
      renderMyStats(CORE()?.getProfile?.());
      $('rankingModeLabel').textContent = sortBy === 'bestScore' ? 'Melhor Score' : sortBy === 'bestStreak' ? 'Sequência' : 'Geral';
    });
  }

  function loadRankingV20(sortBy = 'rating') {
    CORE()?.showScreen?.('rankingScreenV20');
    if (!FB()?.ready?.()) {
      $('rankingList').innerHTML = '<div style="padding:40px;text-align:center;color:#ff9eac">Configure o Firebase para ativar o ranking global.</div>';
      return;
    }

    const user = FB()?.getUser?.();
    if (!user) {
      $('rankingList').innerHTML = '<div style="padding:40px;text-align:center;color:#7f89a8">Entre na sua conta para ver o ranking.</div>';
      return;
    }

    $('rankingList').innerHTML = '<div style="padding:40px;text-align:center;color:#7f89a8">Carregando ranking...</div>';
    subscribeToRanking(sortBy);
  }

  function bind() {
    $('rankingBackV20')?.addEventListener('click', () => CORE()?.showScreen?.('homeScreen'));
    $('rankingButton')?.addEventListener('click', () => loadRankingV20('rating'));
    $('homeRankingButton')?.addEventListener('click', () => loadRankingV20('rating'));
  }

  window.GameGuessRankingV20 = { loadRankingV20, injectRankingV20 };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { injectRankingV20(); bind(); });
  else { injectRankingV20(); bind(); }
})();
