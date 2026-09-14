let TEAMS = [];
let CURRENT_MATCH = null;

// ---------- Session / tabs / logout ----------

async function requireSession() {
  try {
    const session = await api('/admin/session');
    if (!session.isAdmin) window.location.href = 'login.html';
  } catch (err) {
    window.location.href = 'login.html';
  }
}

document.getElementById('logout-btn').addEventListener('click', async () => {
  await api('/admin/logout', { method: 'POST' });
  window.location.href = 'login.html';
});

document.querySelectorAll('#admin-tabs a').forEach((tabLink) => {
  tabLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('#admin-tabs a').forEach((a) => a.classList.remove('active'));
    tabLink.classList.add('active');
    const tab = tabLink.dataset.tab;
    ['entry', 'schedule-edit', 'league', 'danger'].forEach((t) => {
      document.getElementById('tab-' + t).style.display = t === tab ? '' : 'none';
    });
    if (tab === 'schedule-edit') loadScheduleEditor();
    if (tab === 'league') loadLeagueTab();
  });
});

// ---------- Match result entry ----------

async function loadMatchOptions(preselectId) {
  const select = document.getElementById('match-select');
  const matches = await api('/matches');
  const league = matches.filter((m) => m.stage === 'league');
  const finals = matches.filter((m) => m.stage === 'finals');

  function optionLabel(m) {
    const label = m.stage === 'league' ? `Day ${m.day} · Match ${m.matchNumber}` : `Finals · Match ${m.matchNumber}`;
    const teams = m.teams.map((t) => t.teamName).join(' vs ');
    const status = m.status === 'completed' ? ' ✓' : '';
    return `${label} — ${teams}${status}`;
  }

  const leagueOpts = league.map((m) => `<option value="${m.id}">${escapeHtml(optionLabel(m))}</option>`).join('');
  const finalsOpts = finals.map((m) => `<option value="${m.id}">${escapeHtml(optionLabel(m))}</option>`).join('');

  select.innerHTML =
    `<optgroup label="League">${leagueOpts}</optgroup>` +
    (finals.length ? `<optgroup label="Finals">${finalsOpts}</optgroup>` : '');

  let target = preselectId;
  if (!target) {
    const nextUp = league.find((m) => m.status !== 'completed') || league[0];
    target = nextUp ? nextUp.id : null;
  }
  if (target) select.value = target;
  if (select.value) await renderEntryForm(Number(select.value));
}

document.getElementById('match-select').addEventListener('change', (e) => {
  renderEntryForm(Number(e.target.value));
});

async function renderEntryForm(matchId) {
  const wrap = document.getElementById('entry-form-wrap');
  wrap.innerHTML = '<p class="muted">Loading…</p>';
  const match = await api(`/matches/${matchId}`);
  CURRENT_MATCH = match;

  const teamBlocks = match.teams
    .map((mt) => {
      const team = TEAMS.find((t) => t.id === mt.teamId);
      const existingPlacement = mt.placement || '';
      const playerRows = (team ? team.players : [])
        .map((p) => {
          const existingStat = match.players.find((ps) => ps.playerId === p.id);
          const kills = existingStat ? existingStat.kills : 0;
          const deaths = existingStat ? existingStat.deaths : 1;
          return `<div class="player-row">
            <span class="pname">${escapeHtml(p.name)}</span>
            <input type="number" min="0" step="1" data-player="${p.id}" data-field="kills" value="${kills}" placeholder="Kills" />
            <input type="number" min="0" step="1" data-player="${p.id}" data-field="deaths" value="${deaths}" placeholder="Deaths" />
          </div>`;
        })
        .join('');

      return `<div class="card" style="background:var(--panel-2);margin-bottom:10px">
        <div class="row between">
          ${teamBadge(team, { size: 'lg' })}
          <select data-team="${mt.teamId}" class="team-placement-select" style="width:130px">
            <option value="">Placement</option>
            <option value="1" ${existingPlacement === 1 ? 'selected' : ''}>1st (10 pts)</option>
            <option value="2" ${existingPlacement === 2 ? 'selected' : ''}>2nd (5 pts)</option>
            <option value="3" ${existingPlacement === 3 ? 'selected' : ''}>3rd (3 pts)</option>
          </select>
        </div>
        <div class="player-row" style="margin-top:10px"><span class="muted small">Player</span><span class="muted small">Kills</span><span class="muted small">Deaths</span></div>
        ${playerRows}
      </div>`;
    })
    .join('');

  wrap.innerHTML = `
    <div style="margin-top:6px">${teamBlocks}</div>
    <label for="match-date">Date</label>
    <input type="date" id="match-date" value="${match.date || ''}" />
    <label for="match-notes">Notes (optional)</label>
    <textarea id="match-notes" rows="2">${escapeHtml(match.notes || '')}</textarea>
    <div class="row" style="margin-top:14px">
      <button id="submit-result-btn">Save Result &amp; Calculate Points</button>
      ${match.status === 'completed' ? '<button type="button" class="secondary" id="view-history-btn">View Edit History</button>' : ''}
    </div>
    <div id="entry-msg" class="status-msg"></div>
    <div id="history-box"></div>
  `;

  document.getElementById('submit-result-btn').addEventListener('click', () => submitResult(matchId));
  const historyBtn = document.getElementById('view-history-btn');
  if (historyBtn) historyBtn.addEventListener('click', () => loadHistory(matchId));

  // Enforce unique placements across the 3 selects.
  const selects = wrap.querySelectorAll('.team-placement-select');
  selects.forEach((sel) => {
    sel.addEventListener('change', () => {
      const chosen = [...selects].map((s) => s.value).filter(Boolean);
      selects.forEach((s) => {
        [...s.options].forEach((opt) => {
          if (!opt.value) return;
          opt.disabled = chosen.includes(opt.value) && s.value !== opt.value;
        });
      });
    });
    sel.dispatchEvent(new Event('change'));
  });
}

async function submitResult(matchId) {
  const msg = document.getElementById('entry-msg');
  msg.textContent = '';
  msg.className = 'status-msg';

  const wrap = document.getElementById('entry-form-wrap');
  const teamSelects = [...wrap.querySelectorAll('.team-placement-select')];
  const teams = teamSelects.map((s) => ({ teamId: Number(s.dataset.team), placement: Number(s.value) }));
  if (teams.some((t) => !t.placement)) {
    msg.textContent = 'Please set a placement (1st/2nd/3rd) for all 3 teams.';
    msg.className = 'status-msg error';
    return;
  }

  const players = [...wrap.querySelectorAll('input[data-player]')].reduce((acc, input) => {
    const playerId = Number(input.dataset.player);
    let entry = acc.find((p) => p.playerId === playerId);
    if (!entry) {
      entry = { playerId };
      acc.push(entry);
    }
    entry[input.dataset.field] = Number(input.value) || 0;
    return acc;
  }, []);

  const date = document.getElementById('match-date').value || null;
  const notes = document.getElementById('match-notes').value;

  try {
    await api(`/admin/matches/${matchId}/result`, {
      method: 'POST',
      body: JSON.stringify({ teams, players, date, notes }),
    });
    msg.textContent = 'Saved. Points table and leaderboards updated.';
    msg.className = 'status-msg ok';
    await loadMatchOptions(matchId);
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'status-msg error';
  }
}

async function loadHistory(matchId) {
  const box = document.getElementById('history-box');
  box.innerHTML = '<p class="muted">Loading history…</p>';
  const history = await api(`/admin/matches/${matchId}/audit`);
  if (!history.length) {
    box.innerHTML = '<p class="muted">No prior edits recorded.</p>';
    return;
  }
  box.innerHTML = history
    .slice()
    .reverse()
    .map((h) => `<div class="card" style="background:var(--panel-2)"><div class="muted small">${new Date(h.timestamp).toLocaleString()}</div>
      <div class="small">${h.after.teams.map((t) => `${t.teamName || t.teamId}: ${ordinal(t.placement)}, ${t.kills}k, ${t.points}pts`).join(' · ')}</div>
    </div>`)
    .join('');
}

// ---------- Schedule editor ----------

async function loadScheduleEditor() {
  const list = document.getElementById('schedule-editor-list');
  list.innerHTML = '<p class="muted">Loading…</p>';
  const matches = (await api('/matches?stage=league')).sort((a, b) => a.day - b.day || a.matchNumber - b.matchNumber);

  const teamOptions = TEAMS.map((t) => `<option value="${t.id}">${t.emoji} ${escapeHtml(t.name)}</option>`).join('');

  list.innerHTML = matches
    .map((m) => {
      const teamSelects = [0, 1, 2]
        .map((i) => {
          const sel = m.teams[i] ? m.teams[i].teamId : '';
          return `<select data-slot="${i}" style="margin-top:4px">${teamOptions}</select>`;
        })
        .join('');
      return `<div class="card" style="background:var(--panel-2)" data-match-id="${m.id}">
        <div class="row">
          <div style="flex:1"><label>Day</label><input type="number" min="1" class="f-day" value="${m.day}" /></div>
          <div style="flex:1"><label>Match #</label><input type="number" min="1" class="f-matchnum" value="${m.matchNumber}" /></div>
        </div>
        <label>Teams</label>
        <div class="grid-2 f-teams">${teamSelects}</div>
        <label>Date</label>
        <input type="date" class="f-date" value="${m.date || ''}" />
        <label>Notes</label>
        <input type="text" class="f-notes" value="${escapeHtml(m.notes || '')}" />
        <div class="row" style="margin-top:10px">
          <button class="secondary save-schedule-btn">Save Changes</button>
        </div>
        <div class="status-msg sched-msg"></div>
      </div>`;
    })
    .join('');

  // Set each select's current value now that options are in the DOM.
  list.querySelectorAll('[data-match-id]').forEach((card) => {
    const matchId = Number(card.dataset.matchId);
    const match = matches.find((m) => m.id === matchId);
    card.querySelectorAll('.f-teams select').forEach((sel, i) => {
      if (match.teams[i]) sel.value = match.teams[i].teamId;
    });
    card.querySelector('.save-schedule-btn').addEventListener('click', () => saveScheduleRow(card, matchId));
  });
}

async function saveScheduleRow(card, matchId) {
  const msg = card.querySelector('.sched-msg');
  const day = Number(card.querySelector('.f-day').value);
  const matchNumber = Number(card.querySelector('.f-matchnum').value);
  const teamIds = [...card.querySelectorAll('.f-teams select')].map((s) => Number(s.value));
  const date = card.querySelector('.f-date').value || null;
  const notes = card.querySelector('.f-notes').value;

  if (new Set(teamIds).size !== 3) {
    msg.textContent = 'Please select 3 different teams.';
    msg.className = 'status-msg error';
    return;
  }

  try {
    await api(`/admin/matches/${matchId}/schedule`, {
      method: 'PUT',
      body: JSON.stringify({ day, matchNumber, teamIds, date, notes }),
    });
    msg.textContent = 'Saved.';
    msg.className = 'status-msg ok';
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'status-msg error';
  }
}

// ---------- League & Finals ----------

async function loadLeagueTab() {
  const statusEl = document.getElementById('league-status');
  const qualifiedEl = document.getElementById('qualified-teams');
  const finalsList = document.getElementById('finals-list');

  const [league, matches] = await Promise.all([api('/league-state'), api('/matches')]);
  const leagueMatches = matches.filter((m) => m.stage === 'league');
  const completedCount = leagueMatches.filter((m) => m.status === 'completed').length;

  statusEl.textContent = league.complete
    ? `League stage is COMPLETE. ${completedCount}/${leagueMatches.length} matches recorded.`
    : `League stage in progress: ${completedCount}/${leagueMatches.length} matches completed.`;

  document.getElementById('add-finals-match-btn').disabled = !league.complete;

  if (league.complete) {
    const rows = league.qualifiedTeamIds.map((id, i) => {
      const t = TEAMS.find((tm) => tm.id === id);
      return `<div class="row" style="margin-bottom:6px">${teamBadge(t)} <span class="muted small">Qualified ${ordinal(i + 1)}</span></div>`;
    });
    qualifiedEl.innerHTML = rows.join('');
  } else {
    qualifiedEl.innerHTML = '<span class="muted">League stage not complete yet.</span>';
  }

  const finalsMatches = matches.filter((m) => m.stage === 'finals');
  finalsList.innerHTML = finalsMatches.length
    ? finalsMatches
        .map((m) => {
          const teamsStr = m.teams.map((t) => t.teamName).join(' vs ');
          const canDelete = m.status !== 'completed';
          return `<div class="row between" style="margin-bottom:6px">
            <span class="small">Finals Match ${m.matchNumber}: ${escapeHtml(teamsStr)} ${m.status === 'completed' ? '✓' : ''}</span>
            ${canDelete ? `<button class="secondary" data-delete-finals="${m.id}" style="padding:4px 10px;font-size:11px">Remove</button>` : ''}
          </div>`;
        })
        .join('')
    : '<p class="muted">No Finals matches yet.</p>';

  finalsList.querySelectorAll('[data-delete-finals]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await api(`/admin/finals/matches/${btn.dataset.deleteFinals}`, { method: 'DELETE' });
      loadLeagueTab();
    });
  });
}

document.getElementById('complete-league-btn').addEventListener('click', async () => {
  const msg = document.getElementById('league-msg');
  try {
    await api('/admin/league/complete', { method: 'POST', body: JSON.stringify({}) });
    msg.textContent = 'League marked complete. Top 3 teams qualified for Finals.';
    msg.className = 'status-msg ok';
    loadLeagueTab();
  } catch (err) {
    if (err.message.includes('Not all league')) {
      if (confirm('Not all league matches are completed yet. Mark complete anyway?')) {
        await api('/admin/league/complete', { method: 'POST', body: JSON.stringify({ force: true }) });
        msg.textContent = 'League marked complete (forced). Top 3 teams qualified for Finals.';
        msg.className = 'status-msg ok';
        loadLeagueTab();
        return;
      }
    }
    msg.textContent = err.message;
    msg.className = 'status-msg error';
  }
});

document.getElementById('reopen-league-btn').addEventListener('click', async () => {
  if (!confirm('Reopen the league stage? Finals qualification will be cleared.')) return;
  await api('/admin/league/reopen', { method: 'POST' });
  loadLeagueTab();
});

document.getElementById('add-finals-match-btn').addEventListener('click', async () => {
  const msg = document.getElementById('finals-msg');
  try {
    await api('/admin/finals/matches', { method: 'POST', body: JSON.stringify({}) });
    msg.textContent = 'Finals match added.';
    msg.className = 'status-msg ok';
    loadLeagueTab();
    loadMatchOptions();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'status-msg error';
  }
});

// ---------- Danger zone ----------

document.getElementById('reset-btn').addEventListener('click', async () => {
  const msg = document.getElementById('reset-msg');
  const confirmVal = document.getElementById('reset-confirm').value;
  if (confirmVal !== 'RESET') {
    msg.textContent = 'Type RESET exactly to confirm.';
    msg.className = 'status-msg error';
    return;
  }
  if (!confirm('This will permanently erase all match results and regenerate the schedule. Continue?')) return;
  try {
    await api('/admin/reset', { method: 'POST', body: JSON.stringify({ confirm: 'RESET' }) });
    msg.textContent = 'Tournament data reset. Reloading…';
    msg.className = 'status-msg ok';
    setTimeout(() => window.location.reload(), 1000);
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'status-msg error';
  }
});

// ---------- Init ----------

(async function init() {
  await requireSession();
  TEAMS = await api('/teams');
  await loadMatchOptions();
})();
