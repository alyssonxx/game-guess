(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const data = () => window.GG_KOF_CATALOG || { roster: [] };
  let selected = '';

  function fighterInitials(name) {
    return String(name || '?').split(/\s+/).filter(Boolean).slice(0,2).map(w => w[0]).join('').toUpperCase();
  }
  function teamSlug(team) {
    let h = 0; for (const c of String(team || 'KOF')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return `h${h % 9}`;
  }
  function getFiltered() {
    const q = String($('kofCatalogSearch')?.value || '').trim().toLocaleLowerCase('pt-BR');
    const team = $('kofCatalogTeam')?.value || '';
    return data().roster.filter(f => (!team || f.team === team) && (!q || `${f.name} ${f.team} ${f.style}`.toLocaleLowerCase('pt-BR').includes(q)));
  }
  function renderTeams() {
    const select = $('kofCatalogTeam'); if (!select) return;
    const current = select.value;
    const teams = [...new Set(data().roster.map(f => f.team))];
    select.innerHTML = '<option value="">TODOS OS TIMES</option>' + teams.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    if (teams.includes(current)) select.value = current;
  }
  function renderGrid() {
    const grid = $('kofCatalogGrid'); if (!grid) return;
    const list = getFiltered();
    $('kofCatalogCount') && ($('kofCatalogCount').textContent = `${list.length} lutador${list.length === 1 ? '' : 'es'}`);
    grid.innerHTML = list.map(f => `<button class="kof-fighter-card ${selected === f.id ? 'selected' : ''}" data-kof-fighter="${esc(f.id)}" type="button"><span class="kof-fighter-avatar ${teamSlug(f.team)}">${esc(fighterInitials(f.name))}</span><span class="kof-fighter-copy"><b>${esc(f.name)}</b><small>${esc(f.team)}</small><em>${esc(f.style)}</em></span><span class="kof-fighter-arrow">›</span></button>`).join('') || '<div class="kof-catalog-empty">Nenhum lutador encontrado.</div>';
    grid.querySelectorAll('[data-kof-fighter]').forEach(btn => btn.addEventListener('click', () => selectFighter(btn.dataset.kofFighter)));
  }
  function selectFighter(id) {
    selected = id;
    const f = data().roster.find(x => x.id === id);
    const detail = $('kofCatalogDetail'); if (!detail || !f) return;
    const dmRows = f.dm ? `<div class="kof-sdm-card"><span>⚡ DM • MAGIC PLUS II</span><div class="kof-move-row"><div><b>${esc(f.dm.name)}</b>${f.dm.note ? `<small>${esc(f.dm.note)}</small>` : ''}</div><code>${esc(f.dm.command)}</code></div></div>` : '';
    const sdmRows = f.sdm ? `<div class="kof-sdm-card"><span>🔥 SDM/MAX • MAGIC PLUS II</span><div class="kof-move-row"><div><b>${esc(f.sdm.name)}</b>${f.sdm.note ? `<small>${esc(f.sdm.note)}</small>` : ''}</div><code>${esc(f.sdm.command)}</code></div></div>` : '';
    const hsdmRows = f.hsdm ? `<div class="kof-sdm-card"><span>💥 HSDM/MAX2 • MAGIC PLUS II</span><div class="kof-move-row"><div><b>${esc(f.hsdm.name)}</b>${f.hsdm.note ? `<small>${esc(f.hsdm.note)}</small>` : ''}</div><code>${esc(f.hsdm.command)}</code></div></div>` : '';
    detail.innerHTML = `<div class="kof-detail-hero"><div class="kof-detail-avatar ${teamSlug(f.team)}">${esc(fighterInitials(f.name))}</div><div><p class="eyebrow">${esc(f.team)}</p><h2>${esc(f.name)}</h2><span>${esc(f.style)}</span>${f.magicPlusPage ? `<small style="display:block;margin-top:5px">Command list Magic Plus II • pág. ${esc(f.magicPlusPage)}/51</small>` : ''}</div></div><div class="kof-move-list">${(f.moves || []).map(m => `<div class="kof-move-row"><div><b>${esc(m.name)}</b>${m.note ? `<small>${esc(m.note)}</small>` : ''}</div><code>${esc(m.command)}</code></div>`).join('')}</div>${dmRows}${sdmRows}${hsdmRows}<div class="kof-combo-card"><span>⚡ COMBO RÁPIDO</span><b>${esc(f.combo || '—')}</b></div><div class="kof-tip-card"><span>💡 COMO USAR</span><p>${esc(f.tip || 'Treine os especiais e confirme os golpes antes de gastar MAX.')}</p></div><div class="kof-notation-mini"><b>A</b> soco fraco • <b>B</b> chute fraco • <b>C</b> soco forte • <b>D</b> chute forte • <b>DM</b> super comum • <b>SDM/MAX</b> super avançado • <b>HSDM/MAX2</b> hidden especial</div><button class="kof-guide-pick" id="kofGuidePick" type="button">🔵 USAR ${esc(f.name)} NA GUIA AZUL + BOTÕES ESPECIAIS</button>`;
    $('kofGuidePick')?.addEventListener('click', () => {
      try { localStorage.setItem('gg_kof_quick_guide_character_v1', f.id); localStorage.setItem('gg_kof_quick_guide_enabled_v1', '1'); } catch {}
      const btn = $('kofGuidePick'); if (btn) { btn.textContent = '✅ GUIA AZUL ATIVADA'; btn.disabled = true; }
    });
    renderGrid();
    if (innerWidth < 760) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function open() {

    renderTeams(); renderGrid();
    if (!selected && data().roster[0]) selectFighter(data().roster[0].id);
    const overlay = $('kofCatalogOverlay'); if (!overlay) return;
    overlay.classList.add('active'); overlay.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('kofCatalogSearch')?.focus({ preventScroll: true }), 60);
  }
  function close() {
    const overlay = $('kofCatalogOverlay'); if (!overlay) return;
    overlay.classList.remove('active'); overlay.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  function bind() {
    $('kofCatalogButton')?.addEventListener('click', open);
    $('kofCatalogClose')?.addEventListener('click', close);
    $('kofCatalogSearch')?.addEventListener('input', renderGrid);
    $('kofCatalogTeam')?.addEventListener('change', renderGrid);
    $('kofCatalogOverlay')?.addEventListener('click', e => { if (e.target === $('kofCatalogOverlay')) close(); });
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && $('kofCatalogOverlay')?.classList.contains('active')) close(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
  window.GameGuessKofCatalog = { open, close, select: selectFighter };
})();
