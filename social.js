(() => {
  'use strict';
  const FB = () => window.GameGuessFirebase;
  const CORE = () => window.GameGuessCore;
  const $ = id => document.getElementById(id);

  // Social features: friend management, spectate, activity feed

  async function getFriendsList() {
    const socialData = await FB()?.getSocialData?.();
    return socialData?.friends || [];
  }

  async function getFriendRequests() {
    const socialData = await FB()?.getSocialData?.();
    return socialData?.requests || [];
  }

  async function searchPlayers(query) {
    return await FB()?.searchPlayers?.(query) || [];
  }

  async function sendFriendRequest(targetUid) {
    try {
      await FB()?.sendFriendRequest?.(targetUid);
      CORE()?.toast?.('✅ Pedido enviado', 'Aguardando resposta');
      return true;
    } catch (e) {
      CORE()?.toast?.('❌ Erro', e.message || 'Falha ao enviar pedido', 'error');
      return false;
    }
  }

  async function respondFriendRequest(fromUid, accept) {
    try {
      await FB()?.respondFriendRequest?.(fromUid, accept);
      const msg = accept ? 'Amigo adicionado!' : 'Pedido rejeitado';
      CORE()?.toast?.(accept ? '✅ Sucesso' : 'ℹ️ Rejeitado', msg);
      return true;
    } catch (e) {
      CORE()?.toast?.('❌ Erro', e.message, 'error');
      return false;
    }
  }

  async function removeFriend(friendUid) {
    try {
      await FB()?.removeFriend?.(friendUid);
      CORE()?.toast?.('✅ Amigo removido', 'Você removeu este amigo');
      return true;
    } catch (e) {
      CORE()?.toast?.('❌ Erro', e.message, 'error');
      return false;
    }
  }

  function renderFriendsList(friends, containerId = 'friendsList') {
    const container = $(containerId);
    if (!container) return;

    if (!friends || friends.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#7f89a8;padding:20px">Nenhum amigo ainda. Procure e adicione amigos!</p>';
      return;
    }

    let html = '<div class="friends-list">';

    for (const friend of friends) {
      const statusIcon = friend.online ? '🟢' : '⚪';
      const statusText = friend.online ? 'Online' : 'Offline';

      html += `
        <div class="friend-card">
          <div class="friend-header">
            <span class="friend-status">${statusIcon}</span>
            <div class="friend-info">
              <h4>${escapeHtml(friend.name)}</h4>
              <small>${statusText}</small>
            </div>
            <div class="friend-actions">
              <button class="friend-btn spectate" data-uid="${friend.uid}" title="Assistir">👀</button>
              <button class="friend-btn invite" data-uid="${friend.uid}" title="Convidar">🎮</button>
              <button class="friend-btn remove" data-uid="${friend.uid}" title="Remover">✕</button>
            </div>
          </div>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

    // Event listeners
    container.querySelectorAll('.friend-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        const uid = btn.dataset.uid;
        const action = btn.className.split(' ')[2];

        if (action === 'remove') {
          if (confirm('Tem certeza que deseja remover este amigo?')) {
            await removeFriend(uid);
            const friends = await getFriendsList();
            renderFriendsList(friends, containerId);
          }
        } else if (action === 'invite') {
          CORE()?.toast?.('🎮 Convite enviado', 'Seu amigo recebeu um convite para jogar');
        } else if (action === 'spectate') {
          CORE()?.toast?.('👀 Assistindo', 'Você está assistindo este amigo');
        }
      });
    });
  }

  function renderFriendRequests(requests, containerId = 'friendRequests') {
    const container = $(containerId);
    if (!container) return;

    if (!requests || requests.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#7f89a8;padding:20px">Nenhum pedido de amizade</p>';
      return;
    }

    let html = '<div class="friend-requests">';

    for (const req of requests) {
      html += `
        <div class="friend-request-card">
          <div class="request-info">
            <h4>${escapeHtml(req.fromName)}</h4>
            <small>quer ser seu amigo</small>
          </div>
          <div class="request-actions">
            <button class="btn-accept" data-uid="${req.fromUid}">✓ Aceitar</button>
            <button class="btn-decline" data-uid="${req.fromUid}">✕ Rejeitar</button>
          </div>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

    // Event listeners
    container.querySelectorAll('.btn-accept, .btn-decline').forEach(btn => {
      btn.addEventListener('click', async e => {
        const uid = btn.dataset.uid;
        const accept = btn.className.includes('accept');
        await respondFriendRequest(uid, accept);
        const reqs = await getFriendRequests();
        renderFriendRequests(reqs, containerId);
      });
    });
  }

  function renderPlayerSearch(containerId = 'playerSearchResults') {
    const container = $(containerId);
    if (!container) return;

    const searchInput = document.querySelector('[data-player-search]');
    if (!searchInput) return;

    searchInput.addEventListener('input', async e => {
      const query = e.target.value.trim();
      if (query.length < 2) {
        container.innerHTML = '';
        return;
      }

      const results = await searchPlayers(query);
      if (results.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#7f89a8;padding:10px">Nenhum jogador encontrado</p>';
        return;
      }

      let html = '<div class="search-results">';

      for (const player of results) {
        const isFriend = player.isFriend;
        html += `
          <div class="search-result-card">
            <div class="result-player">
              <h4>${escapeHtml(player.name)}</h4>
              <small>${player.online ? '🟢 Online' : '⚪ Offline'}</small>
            </div>
            ${!isFriend ? `<button class="btn-add-friend" data-uid="${player.uid}">➕ Adicionar</button>` : '<span style="color:var(--green)">✓ Amigo</span>'}
          </div>
        `;
      }

      html += '</div>';
      container.innerHTML = html;

      // Event listeners
      container.querySelectorAll('.btn-add-friend').forEach(btn => {
        btn.addEventListener('click', async e => {
          const uid = btn.dataset.uid;
          await sendFriendRequest(uid);
          btn.disabled = true;
          btn.textContent = '⏳ Pendente';
        });
      });
    });
  }

  function renderActivityFeed(containerId = 'activityFeed') {
    const container = $(containerId);
    if (!container) return;

    // Mock activity data
    const activities = [
      {
        id: '1',
        type: 'achievement',
        userName: 'Top Player',
        action: 'desbloqueou',
        item: 'Mestre do Combo',
        icon: '🔥',
        time: '2m atrás'
      },
      {
        id: '2',
        type: 'rank_up',
        userName: 'Elite Gamer',
        action: 'subiu para',
        item: '#5 do Ranking',
        icon: '📈',
        time: '15m atrás'
      },
      {
        id: '3',
        type: 'tournament_win',
        userName: 'Pro Player',
        action: 'venceu',
        item: 'Duelo Diário',
        icon: '🏆',
        time: '1h atrás'
      },
      {
        id: '4',
        type: 'achievement',
        userName: 'Speed Runner',
        action: 'conquistou',
        item: '500 Partidas',
        icon: '📊',
        time: '3h atrás'
      },
      {
        id: '5',
        type: 'cosmetic',
        userName: 'Fashion Player',
        action: 'adquiriu',
        item: 'Borda Dourada',
        icon: '✨',
        time: '5h atrás'
      }
    ];

    let html = '<div class="activity-feed">';

    for (const activity of activities) {
      html += `
        <div class="activity-item">
          <span class="activity-icon">${activity.icon}</span>
          <div class="activity-content">
            <p>
              <b>${escapeHtml(activity.userName)}</b>
              ${activity.action}
              <span class="activity-highlight">${escapeHtml(activity.item)}</span>
            </p>
            <small>${activity.time}</small>
          </div>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  function renderSocialHub(containerId = 'socialHub') {
    const container = $(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="social-hub">
        <div class="social-section">
          <h3 style="font:700 1rem 'Orbitron';color:#fff;margin:0 0 12px 0">🔍 Procurar Jogadores</h3>
          <input type="text" placeholder="Digite um nome..." data-player-search style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(66,232,255,.2);background:rgba(20,25,50,.6);color:#fff;font:inherit;margin-bottom:12px">
          <div id="playerSearchResults"></div>
        </div>

        <div class="social-section">
          <h3 style="font:700 1rem 'Orbitron';color:#fff;margin:0 0 12px 0">📬 Pedidos de Amizade</h3>
          <div id="friendRequests"></div>
        </div>

        <div class="social-section">
          <h3 style="font:700 1rem 'Orbitron';color:#fff;margin:0 0 12px 0">👥 Meus Amigos</h3>
          <div id="friendsList"></div>
        </div>

        <div class="social-section">
          <h3 style="font:700 1rem 'Orbitron';color:#fff;margin:0 0 12px 0">📰 Atividade Global</h3>
          <div id="activityFeed"></div>
        </div>
      </div>
    `;

    // Initialize sections
    renderPlayerSearch('playerSearchResults');
    getFriendRequests().then(reqs => renderFriendRequests(reqs, 'friendRequests'));
    getFriendsList().then(friends => renderFriendsList(friends, 'friendsList'));
    renderActivityFeed('activityFeed');
  }

  function escapeHtml(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // Watch for friend inbox updates
  function watchFriendInbox(callback) {
    return FB()?.watchSocialInbox?.(callback);
  }

  window.GameGuessSocial = {
    getFriendsList,
    getFriendRequests,
    searchPlayers,
    sendFriendRequest,
    respondFriendRequest,
    removeFriend,
    renderFriendsList,
    renderFriendRequests,
    renderPlayerSearch,
    renderActivityFeed,
    renderSocialHub,
    watchFriendInbox
  };
})();
