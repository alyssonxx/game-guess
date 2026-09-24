(() => {
  'use strict';
  const CORE = () => window.GameGuessCore;
  const FB = () => window.GameGuessFirebase;
  const $ = id => document.getElementById(id);

  const COSMETICS = {
    // Borders (decorative frame around profile/podium)
    border_cyan: {
      id: 'border_cyan',
      type: 'border',
      name: 'Borda Ciano',
      description: 'Borda neon ciano clássica',
      price: 0,
      rarity: 'common',
      css: 'border: 2px solid var(--cyan); box-shadow: 0 0 20px var(--cyan);'
    },
    border_gold: {
      id: 'border_gold',
      type: 'border',
      name: 'Borda Dourada',
      description: 'Borda dourada premium',
      price: 100,
      rarity: 'rare',
      css: 'border: 2px solid #ffc857; box-shadow: 0 0 20px #ffc857;'
    },
    border_rainbow: {
      id: 'border_rainbow',
      type: 'border',
      name: 'Borda Arco-íris',
      description: 'Borda com cores alternadas',
      price: 250,
      rarity: 'epic',
      css: 'border: 2px solid transparent; background: linear-gradient(45deg, var(--cyan), var(--pink), var(--green)) border-box; box-shadow: 0 0 30px rgba(66,232,255,.5);'
    },
    border_obsidian: {
      id: 'border_obsidian',
      type: 'border',
      name: 'Borda Obsidiana',
      description: 'Borda escura e elegante',
      price: 150,
      rarity: 'rare',
      css: 'border: 2px solid #1a1a2e; box-shadow: 0 0 25px rgba(0,0,0,.8), inset 0 0 20px rgba(66,232,255,.2);'
    },

    // Badges (profile cosmetics)
    badge_pro: {
      id: 'badge_pro',
      type: 'badge',
      name: 'Badge Pro',
      description: 'Demonstra experiência no jogo',
      price: 50,
      rarity: 'uncommon',
      icon: '⭐',
      style: 'gold'
    },
    badge_elite: {
      id: 'badge_elite',
      type: 'badge',
      name: 'Badge Elite',
      description: 'Reservado para top 100 players',
      price: 0,
      rarity: 'epic',
      icon: '👑',
      style: 'rainbow',
      requirementType: 'ranking',
      requirementValue: 100
    },
    badge_speedrunner: {
      id: 'badge_speedrunner',
      type: 'badge',
      name: 'Badge Velocista',
      description: 'Completou 10 speedruns',
      price: 0,
      rarity: 'rare',
      icon: '⚡',
      style: 'lightning',
      requirementType: 'achievement',
      requirementValue: 'speedRunner'
    },
    badge_combo_king: {
      id: 'badge_combo_king',
      type: 'badge',
      name: 'Rei do Combo',
      description: 'Atingiu 100+ combo',
      price: 0,
      rarity: 'epic',
      icon: '🔥',
      style: 'fire',
      requirementType: 'achievement',
      requirementValue: 'bestStreak'
    },

    // Particles (visual effects during gameplay)
    particle_stars: {
      id: 'particle_stars',
      type: 'particle',
      name: 'Estrelas',
      description: 'Efeito de estrelas ao acertar',
      price: 75,
      rarity: 'uncommon',
      animation: 'stars',
      effect: 'emit-stars-on-correct'
    },
    particle_flames: {
      id: 'particle_flames',
      type: 'particle',
      name: 'Chamas',
      description: 'Efeito de chamas no combo',
      price: 100,
      rarity: 'rare',
      animation: 'flames',
      effect: 'emit-flames-on-combo'
    },
    particle_rainbow_burst: {
      id: 'particle_rainbow_burst',
      type: 'particle',
      name: 'Explosão Arco-íris',
      description: 'Partículas coloridas em combos',
      price: 150,
      rarity: 'epic',
      animation: 'rainbow_burst',
      effect: 'emit-rainbow-on-combo'
    },
    particle_confetti: {
      id: 'particle_confetti',
      type: 'particle',
      name: 'Confete',
      description: 'Confete ao vencer partida',
      price: 50,
      rarity: 'common',
      animation: 'confetti',
      effect: 'emit-confetti-on-win'
    },

    // Frames (podium/rank display cosmetics)
    frame_gold: {
      id: 'frame_gold',
      type: 'frame',
      name: 'Moldura Dourada',
      description: 'Moldura de ouro para podium',
      price: 120,
      rarity: 'rare',
      background: 'linear-gradient(135deg, rgba(255,200,87,.15), rgba(255,200,87,.05))',
      borderColor: '#ffc857'
    },
    frame_diamond: {
      id: 'frame_diamond',
      type: 'frame',
      name: 'Moldura Diamante',
      description: 'Moldura luxuosa de diamante',
      price: 200,
      rarity: 'epic',
      background: 'linear-gradient(135deg, rgba(100,200,255,.2), rgba(150,230,255,.08))',
      borderColor: '#64c8ff',
      animation: 'shimmer'
    },
    frame_blood: {
      id: 'frame_blood',
      type: 'frame',
      name: 'Moldura Sangue',
      description: 'Moldura vermelha e escura',
      price: 150,
      rarity: 'rare',
      background: 'linear-gradient(135deg, rgba(255,98,122,.1), rgba(139,45,64,.08))',
      borderColor: '#ff6277'
    }
  };

  const RARITIES = {
    common: { color: '#aeb7d2', multiplier: 1 },
    uncommon: { color: '#56f39a', multiplier: 1.5 },
    rare: { color: '#42e8ff', multiplier: 2 },
    epic: { color: '#ff54e8', multiplier: 3 },
    legendary: { color: '#ffc857', multiplier: 5 }
  };

  function getOwnedCosmetics() {
    const profile = CORE()?.getProfile?.() || {};
    return profile.cosmetics || {};
  }

  function getActiveCosmetics() {
    const profile = CORE()?.getProfile?.() || {};
    return profile.activeCosmetics || {};
  }

  function purchaseCosmetic(cosmeticId) {
    const cosmetic = COSMETICS[cosmeticId];
    if (!cosmetic || cosmetic.price === 0) return false;

    const profile = CORE()?.getProfile?.() || {};
    const coins = profile.coins || 0;

    if (coins < cosmetic.price) {
      CORE()?.toast?.('❌ Moedas insuficientes', `Você precisa de ${cosmetic.price} 🪙`, 'error');
      return false;
    }

    const owned = getOwnedCosmetics();
    if (owned[cosmeticId]) {
      CORE()?.toast?.('ℹ️ Já possuído', 'Você já tem este cosmético', 'info');
      return false;
    }

    owned[cosmeticId] = { purchasedAt: Date.now() };
    CORE()?.replaceProfile?.({
      ...profile,
      coins: coins - cosmetic.price,
      cosmetics: owned
    });

    CORE()?.toast?.(
      `✨ ${cosmetic.name}`,
      `Adquirido por ${cosmetic.price} 🪙`,
      'achievement'
    );

    return true;
  }

  function equipCosmetic(type, cosmeticId) {
    const cosmetic = COSMETICS[cosmeticId];
    if (!cosmetic || cosmetic.type !== type) return false;

    const profile = CORE()?.getProfile?.() || {};
    const owned = getOwnedCosmetics();

    // Check if earned (free) or owned (purchased)
    const isFree = cosmetic.price === 0;
    const isOwned = owned[cosmeticId];

    if (!isFree && !isOwned) {
      CORE()?.toast?.('❌ Não possuído', 'Adquira este cosmético primeiro', 'error');
      return false;
    }

    const active = getActiveCosmetics();
    active[type] = cosmeticId;

    CORE()?.replaceProfile?.({
      ...profile,
      activeCosmetics: active
    });

    return true;
  }

  function renderCosmeticShop(containerId = 'cosmeticShop') {
    const container = $(containerId);
    if (!container) return;

    const owned = getOwnedCosmetics();
    const active = getActiveCosmetics();
    let html = '';

    for (const [type, cosmetics] of Object.entries(groupCosmeticsByType())) {
      html += `<div class="cosmetic-category"><h3 style="font:700 1rem 'Orbitron';color:#fff;margin:0 0 12px 0">${getTypeIcon(type)} ${type}</h3><div class="cosmetic-grid">`;

      for (const cosm of cosmetics) {
        const isOwned = owned[cosm.id] || cosm.price === 0;
        const isActive = active[type] === cosm.id;
        const rarity = RARITIES[cosm.rarity] || RARITIES.common;

        html += `
          <div class="cosmetic-card${isOwned ? ' owned' : ''}${isActive ? ' active' : ''}" data-cosmetic="${cosm.id}">
            <div class="cosmetic-preview" style="color: ${rarity.color}">
              ${type === 'badge' ? cosm.icon : '📦'}
            </div>
            <h4>${escapeHtml(cosm.name)}</h4>
            <p>${escapeHtml(cosm.description)}</p>
            <div class="cosmetic-footer">
              <span class="cosmetic-rarity" style="color: ${rarity.color}">◆ ${cosm.rarity}</span>
              ${isOwned ? '<button class="cosmetic-btn equipped" data-action="equip">Equipado</button>' : `<button class="cosmetic-btn purchase" data-action="purchase">${cosm.price} 🪙</button>`}
            </div>
          </div>
        `;
      }

      html += '</div></div>';
    }

    container.innerHTML = html;

    // Event listeners
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', e => {
        const cosmeticId = btn.closest('[data-cosmetic]').dataset.cosmetic;
        const action = btn.dataset.action;

        if (action === 'purchase') {
          purchaseCosmetic(cosmeticId);
          renderCosmeticShop(containerId);
        } else if (action === 'equip') {
          const cosm = COSMETICS[cosmeticId];
          equipCosmetic(cosm.type, cosmeticId);
          renderCosmeticShop(containerId);
        }
      });
    });
  }

  function groupCosmeticsByType() {
    const grouped = {};
    for (const [id, cosm] of Object.entries(COSMETICS)) {
      if (!grouped[cosm.type]) grouped[cosm.type] = [];
      grouped[cosm.type].push(cosm);
    }
    return grouped;
  }

  function getTypeIcon(type) {
    const icons = { border: '🖼️', badge: '🏅', particle: '✨', frame: '🎭' };
    return icons[type] || '📦';
  }

  function escapeHtml(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function applyActiveCosmeticsCSS() {
    const active = getActiveCosmetics();
    const profile = CORE()?.getProfile?.() || {};

    if (active.border) {
      const border = COSMETICS[active.border];
      if (border) {
        document.documentElement.style.setProperty('--user-border', border.css);
      }
    }

    if (active.frame) {
      const frame = COSMETICS[active.frame];
      if (frame) {
        document.documentElement.style.setProperty('--user-frame-bg', frame.background);
        document.documentElement.style.setProperty('--user-frame-border', frame.borderColor);
      }
    }
  }

  window.GameGuessCosmetics = {
    COSMETICS,
    RARITIES,
    getOwnedCosmetics,
    getActiveCosmetics,
    purchaseCosmetic,
    equipCosmetic,
    renderCosmeticShop,
    applyActiveCosmeticsCSS
  };

  // Apply cosmetics on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyActiveCosmeticsCSS);
  } else {
    applyActiveCosmeticsCSS();
  }
})();
