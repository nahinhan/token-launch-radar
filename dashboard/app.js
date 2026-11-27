// Token Radar's page: a static board over window.RADAR (written by main.ts
// from the same board.json, so the page and the board can never disagree).
//
// Views: board (every ranked row), watchlist (the snapshot's 40), early
// (the finds below the watchlist floor) and live (tokens that already trade,
// at the market's own values). A row opens its detail: the model's
// breakdown and the farm plan. Shot states for screenshots:
//   ?shot=board     the full board
//   ?shot=detail    the detail of the top-ranked protocol (?slug= picks another)
//   ?shot=filtered  the watchlist view, the filtered board

(function () {
  var R = window.RADAR;
  var tbody = document.getElementById('rows');
  if (!R || !Array.isArray(R.rows)) {
    tbody.textContent = 'No radar data.';
    return;
  }

  var WATCH = {};
  R.watchlist.forEach(function (s) { WATCH[s] = true; });

  function money(n) {
    if (n === null || n === undefined) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }
  function moneyFull(n) {
    if (n === null || n === undefined) return '—';
    return '$' + Math.round(n).toLocaleString('en-US');
  }
  function pct(n) {
    if (n === null || n === undefined) return '—';
    return (n > 0 ? '+' : '') + n.toFixed(1) + '%';
  }
  function ageText(days) {
    if (days === null || days === undefined) return '—';
    if (days >= 365) return (days / 365).toFixed(1) + 'y';
    return days + 'd';
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  var state = { view: 'board', q: '', cat: '', chain: '', sort: 'implied', sel: null };

  // ---- header numbers -------------------------------------------------
  document.getElementById('meta-asof').textContent = R.as_of;
  var stats = document.getElementById('stats');
  var earlyCount = R.rows.filter(function (r) { return !WATCH[r.slug]; }).length;
  [
    ['Watchlist', String(R.watchlist_size), 'no token · $50M+ TVL'],
    ['Board rows', String(R.board_size), 'ranked by implied value'],
    ['Early finds', String(earlyCount), 'below the watchlist floor'],
    ['Live tokens', String(R.live_size), 'already trading, apart'],
  ].forEach(function (s) {
    var d = el('div', 'stat');
    d.appendChild(el('div', 'k', s[0]));
    d.appendChild(el('div', 'v', s[1]));
    d.appendChild(el('div', 's', s[2]));
    stats.appendChild(d);
  });
  document.getElementById('count-watch').textContent = R.watchlist_size;
  document.getElementById('count-early').textContent = earlyCount;
  document.getElementById('count-live').textContent = R.live_size;

  // ---- filter options --------------------------------------------------
  function fillSelect(id, values) {
    var sel = document.getElementById(id);
    values.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
  }
  var cats = [];
  var chains = [];
  R.rows.concat(R.live).forEach(function (r) {
    if (r.category && cats.indexOf(r.category) < 0) cats.push(r.category);
    (r.chains || []).forEach(function (c) { if (chains.indexOf(c) < 0) chains.push(c); });
  });
  cats.sort();
  chains.sort();
  fillSelect('cat', cats);
  fillSelect('chain', chains);

  // ---- rows ------------------------------------------------------------
  function visibleRows() {
    var list;
    if (state.view === 'live') {
      list = R.live.map(function (r, i) {
        return {
          rank: i + 1, slug: r.slug, name: r.name, category: r.category,
          chains: r.chains, tvl_usd: r.tvl_usd, change_7d: r.change_7d,
          mcap_usd: r.mcap_usd, listed_at: null, age_days: null,
          implied_value_usd: r.mcap_usd, live: true, farm_steps: null,
        };
      });
    } else if (state.view === 'watchlist') {
      list = R.rows.filter(function (r) { return WATCH[r.slug]; });
    } else if (state.view === 'early') {
      list = R.rows.filter(function (r) { return !WATCH[r.slug]; });
    } else {
      list = R.rows.slice();
    }
    if (state.q) {
      var q = state.q.toLowerCase();
      list = list.filter(function (r) {
        return r.name.toLowerCase().indexOf(q) >= 0 || r.slug.toLowerCase().indexOf(q) >= 0;
      });
    }
    if (state.cat) list = list.filter(function (r) { return r.category === state.cat; });
    if (state.chain) list = list.filter(function (r) { return (r.chains || []).indexOf(state.chain) >= 0; });
    var sorters = {
      implied: function (a, b) { return (b.implied_value_usd || 0) - (a.implied_value_usd || 0); },
      tvl: function (a, b) { return b.tvl_usd - a.tvl_usd; },
      growth: function (a, b) { return (b.change_7d || 0) - (a.change_7d || 0); },
      age: function (a, b) { return (b.age_days || 0) - (a.age_days || 0); },
      rank: function (a, b) { return a.rank - b.rank; },
    };
    list.sort(sorters[state.sort] || sorters.implied);
    return list;
  }

  function render() {
    document.querySelectorAll('#tabs button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-view') === state.view);
    });
    var list = visibleRows();
    tbody.textContent = '';
    list.forEach(function (r) {
      var tr = document.createElement('tr');
      if (state.sel === r.slug) tr.className = 'sel';
      tr.appendChild(el('td', 'num rank', String(r.rank)));
      var nameTd = el('td');
      nameTd.appendChild(document.createTextNode(r.name + ' '));
      var slug = el('span', 'slug', r.slug);
      nameTd.appendChild(slug);
      if (!r.live) nameTd.appendChild(el('span', 'tag ' + (WATCH[r.slug] ? 'watch' : 'early'), WATCH[r.slug] ? 'Watchlist' : 'Early'));
      if (r.live) nameTd.appendChild(el('span', 'tag live', 'Live'));
      tr.appendChild(nameTd);
      tr.appendChild(el('td', null, r.category || '—'));
      tr.appendChild(el('td', null, (r.chains || []).slice(0, 3).join(', ') || '—'));
      tr.appendChild(el('td', 'num', money(r.tvl_usd)));
      var g = el('td', 'num ' + (r.change_7d === null ? '' : r.change_7d >= 0 ? 'up' : 'down'), pct(r.change_7d));
      tr.appendChild(g);
      tr.appendChild(el('td', 'num', ageText(r.age_days)));
      tr.appendChild(el('td', 'num', money(r.implied_value_usd)));
      tr.addEventListener('click', function () { select(r.slug); });
      tbody.appendChild(tr);
    });
    var total = state.view === 'live' ? R.live_size : state.view === 'watchlist' ? R.watchlist_size : state.view === 'early' ? earlyCount : R.board_size;
    document.getElementById('showing').textContent =
      'Showing ' + list.length + ' of ' + total + ' · ' +
      (state.view === 'live' ? 'market capitalisations, not implied values' : 'ranked by the radar-2 model');
  }

  // ---- detail ----------------------------------------------------------
  function barRow(label, value, frac, text) {
    var row = el('div', 'bar-row');
    row.appendChild(el('span', null, label));
    var bar = el('div', 'bar');
    var fill = document.createElement('i');
    fill.style.width = Math.max(2, Math.min(100, Math.round(frac * 100))) + '%';
    bar.appendChild(fill);
    row.appendChild(bar);
    row.appendChild(el('span', 'val', text));
    return row;
  }

  function select(slug) {
    state.sel = slug;
    var r = null;
    for (var i = 0; i < R.rows.length; i++) if (R.rows[i].slug === slug) r = R.rows[i];
    var live = null;
    if (!r) for (var j = 0; j < R.live.length; j++) if (R.live[j].slug === slug) live = R.live[j];
    var panel = document.getElementById('detail');
    if (!r && !live) { panel.hidden = true; render(); return; }
    panel.hidden = false;
    if (live) {
      document.getElementById('d-name').textContent = live.name;
      document.getElementById('d-sub').textContent = live.slug + ' · already trading — the market prices this one, so the radar does not rank it.';
      var facts = document.getElementById('d-facts');
      facts.textContent = '';
      [['Market cap', moneyFull(live.mcap_usd)], ['TVL', moneyFull(live.tvl_usd)], ['7-day TVL', pct(live.change_7d)], ['Category', live.category || '—'], ['Chains', (live.chains || []).join(', ') || '—']].forEach(function (f) {
        var d = el('div');
        d.appendChild(el('span', null, f[0]));
        d.appendChild(el('span', null, f[1]));
        facts.appendChild(d);
      });
      document.getElementById('d-breakdown').textContent = '';
      document.getElementById('d-math').textContent = 'No model applies: its token trades, so its value is the market capitalisation above.';
      document.getElementById('d-steps').textContent = '';
      render();
      return;
    }
    document.getElementById('d-name').textContent = '#' + r.rank + ' · ' + r.name;
    document.getElementById('d-sub').textContent =
      r.slug + ' · ' + (WATCH[r.slug] ? 'Watchlist' : 'Early find') + ' · ' + (r.category || 'uncategorised') + ' · ' + (r.chains || []).join(', ');
    var facts2 = document.getElementById('d-facts');
    facts2.textContent = '';
    [
      ['Implied value', moneyFull(r.implied_value_usd)],
      ['TVL', moneyFull(r.tvl_usd)],
      ['7-day TVL change', pct(r.change_7d)],
      ['Age', (r.age_days === null ? 'unknown' : r.age_days + ' days') + (r.listed_at ? ' · listed ' + r.listed_at : '')],
      ['Chains', (r.chains || []).join(', ') || '—'],
      ['Category', r.category || '—'],
    ].forEach(function (f) {
      var d = el('div');
      d.appendChild(el('span', null, f[0]));
      d.appendChild(el('span', null, f[1]));
      facts2.appendChild(d);
    });
    var bd = document.getElementById('d-breakdown');
    bd.textContent = '';
    var maxBase = 0;
    R.rows.forEach(function (x) { if (x.base_usd > maxBase) maxBase = x.base_usd; });
    bd.appendChild(barRow('Base · TVL × 0.30', 0, Math.log(1 + r.base_usd) / Math.log(1 + maxBase), money(r.base_usd)));
    bd.appendChild(barRow('Growth ×' + r.growth_multiplier.toFixed(2), 0, (r.growth_multiplier - 0.55) / 1.35, '7d ' + pct(r.change_7d)));
    bd.appendChild(barRow('Maturity ×' + r.maturity_multiplier.toFixed(2), 0, (r.maturity_multiplier - 0.55) / 0.45, ageText(r.age_days)));
    bd.appendChild(barRow('Breadth ×' + r.breadth_multiplier.toFixed(2), 0, (r.breadth_multiplier - 1) / 0.1, (r.chains || []).length + ' chains'));
    document.getElementById('d-math').textContent =
      money(r.base_usd) + ' × ' + r.growth_multiplier.toFixed(2) + ' × ' + r.maturity_multiplier.toFixed(2) + ' × ' + r.breadth_multiplier.toFixed(2) +
      ' = ' + moneyFull(r.implied_value_usd);
    var steps = document.getElementById('d-steps');
    steps.textContent = '';
    (r.farm_steps || []).forEach(function (s) {
      steps.appendChild(el('li', null, s));
    });
    render();
    document.getElementById('detail').scrollIntoView({ block: 'start' });
  }

  // ---- controls ----------------------------------------------------------
  document.querySelectorAll('#tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      state.view = b.getAttribute('data-view');
      state.sel = null;
      document.getElementById('detail').hidden = true;
      render();
    });
  });
  document.getElementById('q').addEventListener('input', function (e) { state.q = e.target.value; render(); });
  document.getElementById('cat').addEventListener('change', function (e) { state.cat = e.target.value; render(); });
  document.getElementById('chain').addEventListener('change', function (e) { state.chain = e.target.value; render(); });
  document.getElementById('sort').addEventListener('change', function (e) { state.sort = e.target.value; render(); });
  document.getElementById('d-close').addEventListener('click', function () {
    state.sel = null;
    document.getElementById('detail').hidden = true;
    render();
  });

  // ---- shot states -------------------------------------------------------
  var params = new URLSearchParams(window.location.search);
  var shot = params.get('shot');
  if (params.get('view')) state.view = params.get('view');
  if (params.get('sort')) { state.sort = params.get('sort'); document.getElementById('sort').value = state.sort; }
  if (params.get('cat')) { state.cat = params.get('cat'); document.getElementById('cat').value = state.cat; }
  if (shot === 'filtered') { state.view = 'watchlist'; }
  render();
  if (shot === 'detail') {
    var slug = params.get('slug');
    select(slug || (R.rows[0] ? R.rows[0].slug : null));
  }
})();
