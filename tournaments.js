(() => {
  'use strict';
  const FB = () => window.GameGuessFirebase;
  const CORE = () => window.GameGuessCore;
  const $ = id => document.getElementById(id);

  const TOURNAMENT_TEMPLATES = {
    daily_duel_16: {
      id: 'daily_duel_16',
      name: 'Duelo Diário - 16 Players',
      description: 'Torneio diário com 16 jogadores em mata-mata',
      type: 'elimination',
      maxPlayers: 16,
      format: 'single_elimination',
      entryFee: 50,
      prizePool: 800,
      duration: 3600000, // 1 hour
      roundDuration: 300000, // 5 minutes per round
      schedule: 'daily',
      resetTime: 'every_6h',
      prizes: {
        1: 400,
        2: 200,
        3: 100,
        4: 50,
        participation: 50
      },
      rules: {
        minRating: 0,
        maxRating: 9999,
        bestOf: 1,
        tiebreaker: 'highest_score'
      }
    },

    weekly_grand_prix: {
      id: 'weekly_grand_prix',
      name: 'Grand Prix Semanal',
      description: 'Competição semanal com 32 players, prêmios premium',
      type: 'elimination',
      maxPlayers: 32,
      format: 'double_elimination',
      entryFee: 200,
      prizePool: 5000,
      duration: 14400000, // 4 hours
      roundDuration: 600000, // 10 minutes per round
      schedule: 'weekly',
      resetTime: 'sunday_8pm_utc',
      prizes: {
        1: 2500,
        2: 1250,
        3: 625,
        4: 312,
        5: 156,
        6: 157,
        participation: 200
      },
      rules: {
        minRating: 1200,
        maxRating: 9999,
        bestOf: 3,
        tiebreaker: 'head_to_head'
      }
    },

    monthly_championship: {
      id: 'monthly_championship',
      name: 'Campeonato Mensal',
      description: 'Torneio do mês com 64 players, maior prêmio',
      type: 'elimination',
      maxPlayers: 64,
      format: 'swiss_system',
      entryFee: 500,
      prizePool: 20000,
      duration: 86400000, // 24 hours (multiple rounds)
      roundDuration: 3600000, // 60 minutes per round
      schedule: 'monthly',
      resetTime: 'first_day_of_month',
      prizes: {
        1: 10000,
        2: 5000,
        3: 2500,
        4: 1250,
        5: 625,
        6: 625,
        7: 500,
        8: 500,
        participation: 500
      },
      rules: {
        minRating: 1500,
        maxRating: 9999,
        bestOf: 5,
        tiebreaker: 'strength_of_schedule'
      }
    },

    rank_ladder: {
      id: 'rank_ladder',
      name: 'Ladder de Ranking',
      description: 'Sistema de ladder permanente, sempre disponível',
      type: 'ladder',
      maxPlayers: -1, // unlimited
      format: 'ranked_ladder',
      entryFee: 0,
      prizePool: 0,
      duration: -1, // always active
      roundDuration: 0,
      schedule: 'always',
      resetTime: 'never',
      prizes: {
        seasonal_top1: 5000,
        seasonal_top10: 1000,
        seasonal_top50: 200,
        daily_top1: 500,
        daily_top10: 100
      },
      rules: {
        minRating: 0,
        maxRating: 9999,
        bestOf: 1,
        tiebreaker: 'rating_points'
      }
    }
  };

  class Tournament {
    constructor(templateId, startTime = null) {
      const template = TOURNAMENT_TEMPLATES[templateId];
      if (!template) throw new Error(`Template não encontrado: ${templateId}`);

      this.id = `${templateId}-${Date.now()}`;
      this.templateId = templateId;
      this.name = template.name;
      this.startTime = startTime || (FB()?.serverNow?.() || Date.now());
      this.endTime = template.duration > 0 ? this.startTime + template.duration : null;
      this.status = 'waiting'; // waiting, in_progress, completed
      this.participants = [];
      this.brackets = [];
      this.results = {};
      this.prizeDistribution = {};
      ...template
    }

    addPlayer(playerId, playerName, rating) {
      if (this.participants.length >= this.maxPlayers && this.maxPlayers > 0) {
        return { success: false, error: 'Torneio cheio' };
      }

      if (rating < this.rules.minRating || rating > this.rules.maxRating) {
        return { success: false, error: `Rating fora do range: ${this.rules.minRating}-${this.rules.maxRating}` };
      }

      const profile = CORE()?.getProfile?.() || {};
      const coins = profile.coins || 0;

      if (coins < this.entryFee) {
        return { success: false, error: `Moedas insuficientes. Necessário: ${this.entryFee}` };
      }

      this.participants.push({ playerId, playerName, rating, seed: this.participants.length + 1 });
      return { success: true, message: 'Jogador adicionado' };
    }

    generateBrackets() {
      if (this.format === 'single_elimination') {
        return this._generateSingleElimination();
      } else if (this.format === 'double_elimination') {
        return this._generateDoubleElimination();
      } else if (this.format === 'swiss_system') {
        return this._generateSwissRounds();
      } else if (this.format === 'ranked_ladder') {
        return this._generateLadder();
      }
    }

    _generateSingleElimination() {
      // Sort by seed (rating-based)
      const sorted = [...this.participants].sort((a, b) => b.rating - a.rating);
      const brackets = [];

      for (let i = 0; i < sorted.length; i += 2) {
        if (i + 1 < sorted.length) {
          brackets.push({
            round: 1,
            matchId: `m1-${i / 2}`,
            player1: sorted[i],
            player2: sorted[i + 1],
            winner: null,
            score1: null,
            score2: null
          });
        }
      }

      this.brackets = brackets;
      return brackets;
    }

    _generateDoubleElimination() {
      // Similar to single elimination but with winners/losers brackets
      const winners = this._generateSingleElimination();
      const losers = [...winners]; // Simplified: losers bracket mirrors winners
      return { winners, losers };
    }

    _generateSwissRounds() {
      // Swiss system: multiple rounds, players paired by rating
      const rounds = [];
      const sorted = [...this.participants].sort((a, b) => b.rating - a.rating);

      for (let round = 1; round <= 3; round++) {
        const roundMatches = [];
        for (let i = 0; i < sorted.length; i += 2) {
          if (i + 1 < sorted.length) {
            roundMatches.push({
              round,
              matchId: `r${round}-m${i / 2}`,
              player1: sorted[i],
              player2: sorted[i + 1],
              winner: null
            });
          }
        }
        rounds.push(roundMatches);
      }

      return rounds;
    }

    _generateLadder() {
      // Ladder: everyone starts at same level, climb by winning
      return this.participants.map((p, idx) => ({
        position: idx + 1,
        player: p,
        points: 0,
        wins: 0,
        losses: 0
      }));
    }

    recordMatch(matchId, winner, score1, score2) {
      const match = this.brackets.find(m => m.matchId === matchId);
      if (!match) return { success: false, error: 'Match não encontrado' };

      match.winner = winner;
      match.score1 = score1;
      match.score2 = score2;

      if (!this.results[winner.playerId]) {
        this.results[winner.playerId] = { wins: 0, losses: 0 };
      }
      this.results[winner.playerId].wins++;

      return { success: true, message: 'Match registrado' };
    }

    finalize() {
      this.status = 'completed';
      const sorted = Object.entries(this.results)
        .sort((a, b) => b[1].wins - a[1].wins)
        .slice(0, Object.keys(this.prizes).length);

      for (const [idx, [playerId, result]] of sorted.entries()) {
        const placement = idx + 1;
        const prize = this.prizes[placement] || 0;
        this.prizeDistribution[playerId] = prize;
      }

      return this.prizeDistribution;
    }
  }

  function createTournament(templateId) {
    try {
      const tournament = new Tournament(templateId);
      return tournament;
    } catch (e) {
      console.error('Erro ao criar torneio:', e);
      return null;
    }
  }

  function renderTournamentList(containerId = 'tournamentsContainer') {
    const container = $(containerId);
    if (!container) return;

    let html = '<div class="tournaments-grid">';

    for (const [id, template] of Object.entries(TOURNAMENT_TEMPLATES)) {
      const prizeTotal = Object.values(template.prizes).reduce((a, b) => a + b, 0);
      const nextStart = template.schedule === 'daily' ? 'A cada 6h' :
                        template.schedule === 'weekly' ? 'Toda semana' :
                        template.schedule === 'monthly' ? 'Todo mês' : 'Sempre';

      html += `
        <div class="tournament-card">
          <div class="tournament-header">
            <h3>${template.name}</h3>
            <span class="tournament-badge">${template.maxPlayers}👥</span>
          </div>
          <p class="tournament-desc">${template.description}</p>
          <div class="tournament-info">
            <div class="info-row">
              <span>💰 Prêmio</span>
              <b>${prizeTotal.toLocaleString('pt-BR')} 🪙</b>
            </div>
            <div class="info-row">
              <span>🎟️ Entrada</span>
              <b>${template.entryFee} 🪙</b>
            </div>
            <div class="info-row">
              <span>🕐 Frequência</span>
              <small>${nextStart}</small>
            </div>
            <div class="info-row">
              <span>⭐ Min Rating</span>
              <b>${template.rules.minRating}</b>
            </div>
          </div>
          <button class="btn-join-tournament" data-tournament="${id}" style="width:100%;margin-top:12px">
            🎮 Entrar no Torneio
          </button>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('.btn-join-tournament').forEach(btn => {
      btn.addEventListener('click', e => {
        const tourId = btn.dataset.tournament;
        const tournament = createTournament(tourId);
        if (tournament) {
          CORE()?.toast?.('✅ Torneio criado', `Você entrou em ${tournament.name}`);
        }
      });
    });
  }

  function renderTournamentBracket(tournament, containerId = 'bracketContainer') {
    const container = $(containerId);
    if (!container) return;

    if (!tournament.brackets || tournament.brackets.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#7f89a8">Gerando chaves do torneio...</p>';
      return;
    }

    let html = `<div class="bracket-container"><h3 style="font:700 1rem 'Orbitron';color:#fff;margin-bottom:16px">${tournament.name} - Chaves</h3>`;

    for (const match of tournament.brackets) {
      const isCompleted = match.winner !== null;
      html += `
        <div class="bracket-match${isCompleted ? ' completed' : ''}">
          <div class="bracket-player">
            <span>${escapeHtml(match.player1.playerName)}</span>
            <b>${match.score1 !== null ? match.score1 : '-'}</b>
          </div>
          <div class="bracket-divider">vs</div>
          <div class="bracket-player">
            <span>${escapeHtml(match.player2.playerName)}</span>
            <b>${match.score2 !== null ? match.score2 : '-'}</b>
          </div>
          ${isCompleted ? `<div class="bracket-winner">🏆 ${escapeHtml(match.winner.playerName)}</div>` : ''}
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  function escapeHtml(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  window.GameGuessTournaments = {
    TOURNAMENT_TEMPLATES,
    Tournament,
    createTournament,
    renderTournamentList,
    renderTournamentBracket
  };
})();
