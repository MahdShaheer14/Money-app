/* ============================================================
   Budge — rendering
   ============================================================ */

/* ---------- formatting ---------- */
function fmtMoney(n, opts) {
  const v = Number(n) || 0;
  const sign = (opts && opts.signed && v > 0) ? '+' : (v < 0 ? '−' : '');
  const body = `${curSym()} ${money(v)}`;
  return sign ? `${sign}${body}` : body;
}
function fmtShort(n) {
  const v = Math.abs(Number(n) || 0);
  if (v >= 10000000) return (v / 10000000).toFixed(v % 10000000 === 0 ? 0 : 1) + ' crore';
  if (v >= 100000) return (v / 100000).toFixed(v % 100000 === 0 ? 0 : 1) + ' lac';
  if (v >= 1000) return (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'k';
  return String(Math.round(v));
}
function monthExpense(key) {
  return sum(state.txns.filter(t => t.type === 'out' && monthKeyOf(t.date) === key).map(t => t.amount));
}
function monthIncome(key) {
  return sum(state.txns.filter(t => t.type === 'in' && monthKeyOf(t.date) === key).map(t => t.amount));
}
function shiftMonthKey(offset) {
  const d = new Date();
  const x = new Date(d.getFullYear(), d.getMonth() + offset, 1);
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}`;
}
function monthLabelFromKey(key) {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}
function pctChange(now, before) {
  if (!before) return now > 0 ? 100 : 0;
  return ((now - before) / before) * 100;
}

/* ---------- primitives ---------- */
function ringSvg(percent, size, stroke, color, track) {
  const p = clamp(percent, 0, 100);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - p / 100);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track || 'var(--surface-3)'}" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"
      style="transition:stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)"/>
  </svg>`;
}

function txIcon(t) {
  const c = catById(t.categoryId);
  return `<span class="tx-ico" style="--c:${c.color}">${icon(c.icon, 19)}</span>`;
}

function txRow(t, delay) {
  const c = catById(t.categoryId);
  const acct = acctById(t.accountId);
  const isIn = t.type === 'in';
  return `<button class="tx-row" data-tx="${t.id}" style="animation:rise .4s cubic-bezier(.2,.8,.25,1) both;animation-delay:${(delay || 0) * 30}ms">
    ${txIcon(t)}
    <span class="tx-body">
      <strong>${esc(t.title)}</strong>
      <span>${esc(c.name)} · ${esc(acct.name)}</span>
    </span>
    <span class="tx-amt ${isIn ? 'in' : ''}">
      <span class="cur">${curSym()}</span>${isIn ? '+' : '−'}${money(t.amount)}
      <small>${timeLabel(t.date)}</small>
    </span>
  </button>`;
}

function pillDelta(pct, invert) {
  const good = invert ? pct <= 0 : pct >= 0;
  const cls = good ? 'up' : 'down';
  const arw = pct >= 0 ? 'trending-up' : 'trending-down';
  const val = Math.abs(pct) >= 100 ? Math.round(Math.abs(pct)) : Math.abs(pct).toFixed(1);
  return `<span class="pill ${cls}"><span class="arw">${icon(arw, 11)}</span>${val}%</span>`;
}

/* ============================================================
   HOME
   ============================================================ */
function renderHome() {
  const T = totals();
  const PET = typeof peopleTotals === 'function' ? peopleTotals() : { receivable: 0, payable: 0, net: 0 };
  const lastKey = shiftMonthKey(-1);
  const incPrev = monthIncome(lastKey);
  const expPrev = monthExpense(lastKey);
  const incDelta = pctChange(T.income, incPrev);
  const expDelta = pctChange(T.expense, expPrev);
  const spendPct = T.budget ? Math.round((T.expense / T.budget) * 100) : 0;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const initials = state.profile.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const sparkIn = incomeSeriesLastDays(10);
  const sparkOut = spendSeriesLastDays(10);
  const barsOut = spendSeriesLastDays(7).map(d => d.value);
  const maxBar = Math.max.apply(null, barsOut.concat([1]));

  const latest = state.txns
    .slice()
    .sort((a, b) => parseDate(b.date) - parseDate(a.date))
    .slice(0, 7);

  const groups = [];
  latest.forEach(t => {
    const lbl = dayLabel(t.date);
    let g = groups.find(x => x.label === lbl);
    if (!g) { g = { label: lbl, items: [] }; groups.push(g); }
    g.items.push(t);
  });

  const goals = state.goals.map((g, i) => {
    const pct = clamp(Math.round((g.saved / Math.max(1, g.target)) * 100), 0, 100);
    return `<button class="goal" data-goal="${g.id}" style="animation:rise .45s cubic-bezier(.2,.8,.25,1) both;animation-delay:${i * 55}ms">
      <span class="ring">${ringSvg(pct, 52, 5, g.color)}<b>${pct}%</b></span>
      <span class="goal-info">
        <strong>${esc(g.name)}</strong>
        <span>${fmtMoney(g.saved)} of ${fmtMoney(g.target)}</span>
        <em>${pct >= 100 ? 'Goal reached 🎉' : `${fmtMoney(g.target - g.saved)} to go`}</em>
      </span>
    </button>`;
  }).join('');

  $('#screen-home').innerHTML = `
    <div class="s-head anim" style="--d:0">
      <div class="hello">
        <div class="avatar">${initials}</div>
        <div><span class="eyebrow">${greet},</span><strong>${esc(state.profile.name)}</strong></div>
      </div>
      <div class="head-actions">
        <button class="icon-btn" data-action="go-auto" aria-label="Autopilot">${icon('zap', 19)}${(state.detected || []).some(d => d.state === 'pending') ? '<span class="dot"></span>' : ''}</button>
        <button class="icon-btn" data-action="theme" aria-label="Toggle theme">${icon(state.theme === 'dark' ? 'sun' : 'moon', 19)}</button>
      </div>
    </div>

    <div class="hero anim" style="--d:1">
      <div class="label">Total balance</div>
      <div class="balance"><span class="cur">${curSym()}</span>${money(T.balance)}</div>
      <button class="hero-settle" data-action="go-people">
        <span class="hs-l"><b>${fmtMoney(T.balance + PET.net)}</b><em>after all settlements</em></span>
        <span class="hs-r">
          ${PET.receivable > 0 ? `<i class="in"><b>+${fmtMoney(PET.receivable)}</b><em>owe me</em></i>` : ''}
          ${PET.payable > 0 ? `<i class="out"><b>-${fmtMoney(PET.payable)}</b><em>i owe</em></i>` : ''}
        </span>
      </button>
      <div class="hero-meta">
        ${pillDelta(incDelta)}
        <span>income vs last month</span>
        <span class="sep"></span>
        <span>${state.accounts.length} accounts</span>
      </div>
    </div>

    <div class="stat-grid">
      <button class="stat lime anim" style="--d:2" data-action="go-insights">
        <div class="stat-top"><span>Income</span><span class="si">${icon('arrow-down-left', 14)}</span></div>
        <div class="stat-num">${fmtMoney(T.income)}</div>
        <div class="stat-foot" style="gap:4px">↑ ${Math.abs(incDelta) >= 100 ? Math.round(Math.abs(incDelta)) : Math.abs(incDelta).toFixed(1)}% vs last month</div>
        <div class="chart"><svg viewBox="0 0 160 46" preserveAspectRatio="none">
          <path d="${areaSpark(sparkIn, 160, 46, true)}" fill="rgba(10,16,2,.10)"/>
          <path d="${areaSpark(sparkIn, 160, 46, false)}" fill="none" stroke="#17220A" stroke-width="1.8" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        </svg></div>
      </button>

      <button class="stat anim" style="--d:3" data-action="go-budget">
        <div class="stat-top"><span>Spent</span><span class="si">${icon('arrow-up-right', 14)}</span></div>
        <div class="stat-num">${fmtMoney(T.expense)}</div>
        <div class="stat-foot" style="gap:4px">${T.budget - T.expense >= 0 ? fmtMoney(T.budget - T.expense) + ' left' : fmtMoney(T.expense - T.budget) + ' over'}</div>
        <div class="chart"><div class="mini-bars">
          ${barsOut.map((v, i) => `<i class="${v === maxBar && v > 0 ? 'hot' : ''}" style="--h:${Math.max(12, Math.round((v / maxBar) * 100))}%;--d:${0.35 + i * 0.05}s"></i>`).join('')}
        </div></div>
      </button>
    </div>

    <div class="sec-head anim" style="--d:4">
      <h2>Savings goals</h2>
      <button class="link" data-goal="new">Add goal ${icon('plus', 12)}</button>
    </div>
    <div class="hscroll">
      ${goals}
      <button class="goal new" data-goal="new">
        <span class="plus">${icon('plus', 18)}</span>
        <span>New goal</span>
      </button>
    </div>

    ${(() => {
      const RT = recurringTotals();
      const nextThree = RT.nextUp.slice(0, 3);
      return `<div class="sec-head anim" style="--d:5">
        <h2>Monthly commitments</h2>
        <button class="link" data-action="go-monthly">Manage ${icon('chevron-right', 12)}</button>
      </div>
      <button class="card anim" style="--d:5;display:block;width:100%;text-align:left;padding:15px;margin-bottom:22px" data-action="go-monthly">
        <div class="row between" style="margin-bottom:13px">
          <div>
            <div style="font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">Committed monthly</div>
            <div style="font-size:21px;font-weight:800;letter-spacing:-.04em;margin-top:4px">${fmtMoney(RT.monthlyTotal)}</div>
          </div>
          <span class="pill">${RT.count} active</span>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:12px">
          ${nextThree.map(r => `<span style="flex:1;height:5px;border-radius:99px;background:${r.color};opacity:.85"></span>`).join('')}
        </div>
        ${nextThree.map(r => `<div class="row between" style="padding:5px 0">
          <span class="row" style="gap:8px;font-size:11.5px;color:var(--muted);min-width:0">
            <span style="color:${r.color};display:grid;place-items:center">${icon(r.icon, 13)}</span>
            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.name)}</span>
          </span>
          <span style="display:flex;align-items:center;gap:8px;flex:none">
            <span style="font-size:9.5px;font-weight:700;color:var(--accent-text)">${daysUntil(nextDueDate(r)) === 0 ? 'today' : 'in ' + daysUntil(nextDueDate(r)) + 'd'}</span>
            <span style="font-size:11.5px;font-weight:700;font-variant-numeric:tabular-nums">${fmtMoney(r.amount)}</span>
          </span>
        </div>`).join('')}
      </button>`;
    })()}

    <div class="sec-head anim" style="--d:6">
      <h2>Recent activity</h2>
      <button class="link" data-action="all-txns">See all ${icon('chevron-right', 12)}</button>
    </div>

    ${latest.length ? `<div class="tx-card anim" style="--d:7">
      ${groups.map(g => `<div class="tx-day">${g.label}</div>${g.items.map((t, i) => txRow(t, i)).join('')}`).join('')}
      <button class="more-link" data-action="all-txns">View all transactions ${icon('arrow-right', 13)}</button>
    </div>` : `<div class="tx-card"><div class="empty">
        <div class="eic">${icon('receipt', 22)}</div>
        <strong>Nothing here yet</strong>
        <p>Add your first transaction with the + button.</p>
      </div></div>`}
  `;

  $('#screen-home').style.setProperty('--d', '0');
}

/* ============================================================
   BUDGET
   ============================================================ */
let budgetViewMonth = thisMonthKey();

function renderBudget() {
  const isCurrent = budgetViewMonth === thisMonthKey();
  const T = totals();
  const monthExpenseVal = monthExpense(budgetViewMonth);
  const monthBudget = sum(state.categories.filter(c => c.kind !== 'in').map(c => c.budget));
  const spent = monthExpenseVal;
  const pct = monthBudget ? (spent / monthBudget) * 100 : 0;
  const over = spent > monthBudget;
  const remaining = monthBudget - spent;

  const now = new Date();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = isCurrent ? Math.max(0, dim - now.getDate()) : 0;
  const daily = isCurrent && daysLeft > 0 ? Math.max(0, remaining) / daysLeft : 0;
  const elapsedPct = isCurrent ? Math.round((now.getDate() / dim) * 100) : 100;

  const cats = state.categories
    .filter(c => c.kind !== 'in')
    .map(c => ({ c, spent: sum(state.txns.filter(t => t.categoryId === c.id && t.type === 'out' && monthKeyOf(t.date) === budgetViewMonth).map(t => t.amount)) }))
    .sort((a, b) => (b.spent / Math.max(1, b.c.budget)) - (a.spent / Math.max(1, a.c.budget)));

  const size = 186, stroke = 15;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (Math.min(pct, 100) / 100);

  $('#screen-budget').innerHTML = `
    <div class="s-head anim" style="--d:0">
      <div>
        <h1>Budget</h1>
        <div class="sub">Plan every rupee</div>
      </div>
      <div class="head-actions">
        <button class="icon-btn" data-action="insights" aria-label="Insights">${icon('insights', 19)}</button>
        <button class="month-pill" data-action="pick-month">${monthLabelFromKey(budgetViewMonth)} ${icon('chevron-down', 13)}</button>
      </div>
    </div>

    <div class="gauge-card anim" style="--d:1">
      <div class="gauge">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" class="gauge-track" stroke-width="${stroke}"/>
          <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
            class="gauge-prog ${over ? 'over' : ''}" stroke-width="${stroke}" stroke-linecap="round"
            stroke-dasharray="${circ}" stroke-dashoffset="${circ - dash}"
            transform="rotate(-90 ${size / 2} ${size / 2})"/>
        </svg>
        <div class="gauge-center">
          <span class="k">${over ? 'Over budget' : 'Remaining'}</span>
          <span class="v" style="${over ? 'color:#FF7A66' : ''}">${fmtMoney(Math.abs(remaining))}</span>
          <span class="of">of ${fmtMoney(monthBudget)} plan</span>
        </div>
      </div>
      <div class="gauge-meta">
        <div><span>Spent so far</span><strong>${fmtMoney(spent)}</strong></div>
        <div><span>${isCurrent ? 'Safe to spend / day' : 'Daily average'}</span><strong>${fmtMoney(isCurrent ? daily : spent / Math.max(1, dim))}</strong></div>
      </div>
      ${isCurrent ? `<div class="b-note" style="display:flex;justify-content:space-between;margin-top:12px">
        <span>${daysLeft} days left in ${MONTHS_S[now.getMonth()]}</span>
        <span>${Math.round(pct)}% used · ${elapsedPct}% of month elapsed</span>
      </div>` : ''}
    </div>

    <div class="sec-head anim" style="--d:2">
      <h2>Category budgets</h2>
      <span class="count">${cats.length} categories</span>
    </div>
    <div class="cat-list">
      ${cats.map(({ c, spent }, i) => {
        const p = c.budget ? (spent / c.budget) * 100 : 0;
        const isOver = spent > c.budget && c.budget > 0;
        return `<button class="budget-row anim" style="--d:${3 + Math.min(i, 6)}" data-budget="${c.id}">
          ${txIcon({ categoryId: c.id })}
          <span class="b-main">
            <span class="b-top">
              <strong>${esc(c.name)}</strong>
              <span class="amt"><b>${money(spent)}</b> / ${money(c.budget)}</span>
            </span>
            <div class="progress ${isOver ? 'over' : ''}"><i style="--w:${clamp(p, 2, 100)}%;--c:${c.color}"></i></div>
            <span class="b-note ${isOver ? 'warn' : ''}">${isOver ? `${fmtMoney(spent - c.budget)} over limit` : `${fmtMoney(c.budget - spent)} left · ${Math.round(p)}% used`}</span>
          </span>
          <span class="b-pct ${isOver ? 'over' : ''}">${Math.round(p)}%</span>
        </button>`;
      }).join('')}
    </div>

    ${isCurrent ? `<button class="btn btn-ghost anim" style="--d:8;margin-top:16px" data-action="adjust-budgets">${icon('sparkles', 16)} Auto-balance my budgets</button>` : ''}
  `;
}

/* ============================================================
   INSIGHTS
   ============================================================ */
function renderInsights() {
  const T = totals();
  const key = thisMonthKey();
  const outTx = T.monthTx.filter(t => t.type === 'out');

  const byCat = state.categories
    .filter(c => c.kind !== 'in')
    .map(c => ({ ...c, spent: sum(outTx.filter(t => t.categoryId === c.id).map(t => t.amount)) }))
    .filter(c => c.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  const total = sum(byCat.map(c => c.spent));
  const top = byCat.slice(0, 5);
  const rest = byCat.slice(5);
  const restTotal = sum(rest.map(c => c.spent));
  const slices = top.map(c => ({ name: c.name, color: c.color, value: c.spent }));
  if (restTotal > 0) slices.push({ name: 'Other', color: '#3A3D46', value: restTotal });

  /* donut */
  const dsize = 132, dstroke = 17, dr = (dsize - dstroke) / 2, dc = 2 * Math.PI * dr;
  let acc = 0;
  const donut = slices.map(s => {
    const frac = total ? s.value / total : 0;
    const len = Math.max(0, frac * dc - 3);
    const seg = `<circle cx="${dsize / 2}" cy="${dsize / 2}" r="${dr}" fill="none" stroke="${s.color}"
      stroke-width="${dstroke}" stroke-linecap="round"
      stroke-dasharray="${len} ${dc - len}" stroke-dashoffset="${-acc * dc}"
      style="transition:stroke-dasharray .8s ease"/>`;
    acc += frac;
    return seg;
  }).join('');

  const series = historySeries(state.insightRange || 6);
  const maxHist = Math.max.apply(null, series.map(s => s.amount).concat([1]));

  const daysInMonth = new Date().getFullYear() + 0;
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daily = T.expense / Math.max(1, dayOfMonth);
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const safeDaily = Math.max(0, T.budget - T.expense) / Math.max(1, dim - dayOfMonth);

  const merchants = {};
  outTx.forEach(t => { merchants[t.title] = (merchants[t.title] || 0) + t.amount; });
  const topMerchants = Object.entries(merchants).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const biggestDay = spendSeriesLastDays(dayOfMonth).slice().sort((a, b) => b.value - a.value)[0];

  const overspent = byCat.filter(c => c.budget > 0 && c.spent > c.budget);
  const nearLimit = byCat.filter(c => c.budget > 0 && c.spent / c.budget >= 0.8 && c.spent <= c.budget);

  $('#screen-insights').innerHTML = `
    <div class="s-head anim" style="--d:0">
      <div>
        <h1>Insights</h1>
        <div class="sub">${MONTHS[now.getMonth()]} at a glance</div>
      </div>
      <div class="seg" id="rangeSeg">
        <button class="${state.insightRange === 3 ? 'on' : ''}" data-range="3">3M</button>
        <button class="${state.insightRange !== 3 ? 'on' : ''}" data-range="6">6M</button>
      </div>
    </div>

    <div class="card anim" style="--d:1">
      <div class="card-head"><h3>Where your money goes</h3><span>${fmtMoney(total)} spent</span></div>
      <div class="donut-wrap">
        <div class="donut">
          <svg width="${dsize}" height="${dsize}" viewBox="0 0 ${dsize} ${dsize}">${donut}</svg>
          <div class="mid"><b>${byCat.length}</b><span>categories</span></div>
        </div>
        <div class="legend">
          ${slices.map(s => `<div class="legend-row">
            <span class="dot" style="background:${s.color}"></span>
            <span class="nm">${esc(s.name)}</span>
            <span class="vl">${money(s.value)}</span>
            <span class="pc">${total ? Math.round((s.value / total) * 100) : 0}%</span>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="card anim" style="--d:2">
      <div class="card-head"><h3>Monthly spending</h3><span>last ${series.length} months</span></div>
      <div class="chart-bars">
        ${series.map((s, i) => {
          const isLast = i === series.length - 1;
          const h = Math.max(10, Math.round((s.amount / maxHist) * 94));
          return `<div class="cbar ${isLast ? 'hi' : ''}">
            <span class="tip">${fmtMoney(s.amount)}</span>
            <span class="val">${fmtShort(s.amount)}</span>
            <span class="track"><i style="height:${h}px;--d:${0.05 * i}s"></i></span>
            <span class="lb">${s.label}</span>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="insight-grid">
      <div class="insight accent anim" style="--d:3">
        <span class="badge-ic">${icon('trending-up', 16)}</span>
        <strong>${fmtMoney(Math.round(daily))}</strong>
        <span>Daily average spend across ${dayOfMonth} days</span>
      </div>
      <div class="insight anim" style="--d:4">
        <span class="badge-ic">${icon('target', 16)}</span>
        <strong>${fmtMoney(Math.round(safeDaily))}</strong>
        <span>Safe to spend per day for the rest of the month</span>
      </div>
    </div>

    <div class="card anim" style="--d:5">
      <div class="card-head"><h3>Top merchants</h3><span>this month</span></div>
      <div class="rank-list">
        ${topMerchants.map(([name, val], i) => `<div class="rank-row">
          <span class="num">${pad2(i + 1)}</span>
          <span class="nm">${esc(name)}</span>
          <span class="vl">${fmtMoney(val)}</span>
        </div>`).join('')}
      </div>
    </div>

    <div class="card anim" style="--d:6">
      <div class="card-head"><h3>Smart nudges</h3><span>${icon('sparkles', 14)}</span></div>
      <div class="rank-list">
        ${overspent.length ? `<div class="rank-row"><span style="color:#FF7A66">${icon('trending-up', 16)}</span><span class="nm"><b>${esc(overspent[0].name)}</b> is ${fmtMoney(overspent[0].spent - overspent[0].budget)} over budget — trim it next month.</span></div>` : ''}
        ${nearLimit.length ? `<div class="rank-row"><span style="color:#F2D06B">${icon('target', 16)}</span><span class="nm"><b>${esc(nearLimit[0].name)}</b> is at ${Math.round((nearLimit[0].spent / nearLimit[0].budget) * 100)}% of its limit.</span></div>` : ''}
        ${biggestDay && biggestDay.value > 0 ? `<div class="rank-row"><span style="color:#7EC8F2">${icon('calendar', 16)}</span><span class="nm">Your heaviest day was <b>${MONTHS_S[now.getMonth()]} ${biggestDay.day}</b> at ${fmtMoney(biggestDay.value)}.</span></div>` : ''}
        <div class="rank-row"><span style="color:#7EE7B9">${icon('shield', 16)}</span><span class="nm">You kept <b>${Math.max(0, 100 - Math.round((T.expense / Math.max(1, T.income)) * 100))}%</b> of this month's income unspent.</span></div>
      </div>
    </div>
  `;
}

/* ============================================================
   WALLET
   ============================================================ */
function renderWallet() {
  const T = totals();
  const goals = state.goals.map((g, i) => {
    const pct = clamp(Math.round((g.saved / Math.max(1, g.target)) * 100), 0, 100);
    return `<div class="card anim" style="--d:${3 + i}" data-goal="${g.id}">
      <div class="row between" style="margin-bottom:12px">
        <div class="row" style="gap:10px">
          <span class="tx-ico" style="--c:${g.color};width:38px;height:38px;border-radius:12px">${icon('target', 18)}</span>
          <div><strong style="display:block;font-size:13px;letter-spacing:-.02em">${esc(g.name)}</strong>
          <span style="font-size:10.5px;color:var(--muted)">Target ${fmtMoney(g.target)} · ${g.due}</span></div>
        </div>
        <span class="pill ${pct >= 100 ? 'up' : ''}">${pct}%</span>
      </div>
      <div class="progress" style="height:8px"><i style="--w:${Math.max(3, pct)}%;--c:${g.color}"></i></div>
      <div class="row between" style="margin-top:10px">
        <span style="font-size:11.5px;font-weight:700">${fmtMoney(g.saved)} <span style="color:var(--faint);font-weight:500">saved</span></span>
        <button class="link" data-goal="${g.id}" style="font-size:11.5px;font-weight:700;color:var(--accent-text)">Add money ${icon('plus', 12)}</button>
      </div>
    </div>`;
  }).join('');

  $('#screen-wallet').innerHTML = `
    <div class="s-head anim" style="--d:0">
      <div><h1>Wallet</h1><div class="sub">All your accounts in one place</div></div>
      <div class="head-actions">
        <button class="icon-btn" data-action="theme" aria-label="Toggle theme">${icon(state.theme === 'dark' ? 'sun' : 'moon', 19)}</button>
        <button class="icon-btn" data-action="settings" aria-label="Settings">${icon('gear', 19)}</button>
      </div>
    </div>

    <div class="acct-scroll">
      ${state.accounts.map((a, i) => `<button class="acct c${i % 4} anim" style="--d:${i + 1}" data-action="acct" data-acct="${a.id}">
        <div class="a-top"><span class="a-name">${esc(a.name)}</span><span class="a-type">${esc(a.type.replace(' account','').replace('Current','Current'))}</span></div>
        <div>
          <div class="a-bal">${curSym()} ${money(a.balance)}</div>
          <div class="a-num">•••• ${esc(a.last4)}</div>
        </div>
      </button>`).join('')}
      <button class="acct new anim" style="--d:${state.accounts.length + 1}" data-action="add-account">
        <span class="plus">${icon('plus', 18)}</span><span>Add account</span>
      </button>
    </div>

    <div class="wallet-sum anim" style="--d:4">
      <div class="wsum"><span>Income</span><strong class="g">${curSym()} ${money(T.income)}</strong></div>
      <div class="wsum"><span>Expenses</span><strong class="r">${curSym()} ${money(T.expense)}</strong></div>
      <div class="wsum"><span>Saved</span><strong>${curSym()} ${money(Math.max(0, T.net))}</strong></div>
    </div>

    <div class="sec-head anim" style="--d:5">
      <h2>Savings goals</h2>
      <button class="link" data-goal="new">${icon('plus', 12)} New goal</button>
    </div>
    ${goals}

    <div class="sec-head anim" style="--d:7"><h2>Manage</h2></div>
    <div class="settings anim" style="--d:8">
      <button class="set-row" data-action="settings">
        <span class="sic">${icon('gear', 16)}</span>
        <span class="stx"><strong>Settings & preferences</strong><span>Currency, theme, alerts</span></span>
        <span class="chev">${icon('chevron-right', 15)}</span>
      </button>
      <button class="set-row" data-action="all-txns">
        <span class="sic">${icon('receipt', 16)}</span>
        <span class="stx"><strong>All transactions</strong><span>Search and filter everything</span></span>
        <span class="chev">${icon('chevron-right', 15)}</span>
      </button>
      <button class="set-row" data-action="go-people">
        <span class="sic">${icon('people', 16)}</span>
        <span class="stx"><strong>People & splits</strong><span>Lend, borrow and settle up</span></span>
        <span class="chev">${icon('chevron-right', 15)}</span>
      </button>
      <button class="set-row" data-action="export">
        <span class="sic">${icon('download', 16)}</span>
        <span class="stx"><strong>Export data</strong><span>Download a JSON backup</span></span>
        <span class="chev">${icon('chevron-right', 15)}</span>
      </button>
    </div>
    <div class="app-ver anim" style="--d:9">Budge <b>1.0</b> · demo data stored locally<br>Made with care for calmer money</div>
  `;
}

/* ============================================================
   MONTHLY — subscriptions, bills & repeating items
   ============================================================ */
function recurringTile(r) {
  const d = nextDueDate(r);
  const n = daysUntil(d);
  const soon = n <= 3;
  const paused = r.status === 'paused';
  return `<button class="due-card" data-rec="${r.id}" style="--c:${r.color}">
    <div class="dc-top">
      <span class="dc-ic">${icon(r.icon, 15)}</span>
      <span class="dc-when ${soon ? 'soon' : ''}">${paused ? 'Paused' : daysUntil(d) === 0 ? 'Today' : `${n}d`}</span>
    </div>
    <strong>${esc(r.name)}</strong>
    <div class="dc-amt">${fmtMoney(r.amount)}</div>
  </button>`;
}

function recurringRow(r) {
  const d = nextDueDate(r);
  const n = daysUntil(d);
  const paused = r.status === 'paused';
  const cycleLabel = r.cycle === 'monthly' ? 'mo' : r.cycle === 'yearly' ? 'yr' : r.cycle === 'weekly' ? 'wk' : 'qtr';
  const tagged = r.source === 'sms';
  return `<button class="sub-row ${paused ? 'paused' : ''}" data-rec="${r.id}">
    <span class="tx-ico" style="--c:${r.color};width:38px;height:38px;border-radius:12px">${icon(r.icon, 17)}</span>
    <span class="sub-main">
      <strong>${esc(r.name)} ${tagged ? '<span class="auto-flag">auto</span>' : ''}</strong>
      <span>${esc(catById(r.categoryId).name)} <span class="cyc">${cycleLabel}</span> ${paused ? '· paused' : '· day ' + r.dueDay}</span>
    </span>
    <span class="sub-amt">
      ${fmtMoney(r.amount)}
      <small class="${paused ? '' : n <= 3 ? 'over' : 'due'}">${paused ? 'off' : daysUntil(d) === 0 ? 'today' : `in ${n}d`}</small>
    </span>
  </button>`;
}

function renderMonthly() {
  const RT = recurringTotals();
  const actives = activeRecurring();
  const subs  = state.recurrences.filter(r => r.kind === 'sub').slice().sort((a, b) => nextDueDate(a) - nextDueDate(b));
  const bills = state.recurrences.filter(r => r.kind === 'bill').slice().sort((a, b) => nextDueDate(a) - nextDueDate(b));
  const items = state.items.slice().sort((a, b) => nextDueDate(a) - nextDueDate(b));
  const shareOfBudget = (() => {
    const b = sum(state.categories.filter(c => c.kind !== 'in').map(c => c.budget));
    return b ? Math.round((RT.monthlyTotal / b) * 100) : 0;
  })();

  /* detected subscriptions that are not yet tracked */
  const suggestions = (state.detected || []).filter(d => d.state === 'pending' && d.recurring).slice(0, 2);

  $('#screen-monthly').innerHTML = `
    <div class="s-head anim" style="--d:0">
      <div><h1>Monthly</h1><div class="sub">Subscriptions, bills & repeats</div></div>
      <button class="icon-btn" data-rec="new" aria-label="Add recurring">${icon('plus', 19)}</button>
    </div>

    <div class="recap-card anim" style="--d:1">
      <div class="rc-k">Every month you commit</div>
      <div class="rc-v">${fmtMoney(RT.monthlyTotal)} <span class="per">/ mo</span></div>
      <div class="rc-sub">
        <span>${RT.count} active</span><span class="sep"></span>
        <span>${fmtMoney(RT.yearlyTotal)} a year</span><span class="sep"></span>
        <span>${shareOfBudget}% of budget</span>
      </div>
      <div class="rc-grid">
        <div class="rc-cell"><span>Subscriptions</span><b>${fmtMoney(RT.subTotal)}</b></div>
        <div class="rc-cell"><span>Bills</span><b>${fmtMoney(RT.billTotal)}</b></div>
        <div class="rc-cell"><span>Monthly items</span><b>${fmtMoney(RT.itemTotal)}</b></div>
      </div>
    </div>

    <div class="sec-head anim" style="--d:2">
      <h2>Coming up</h2>
      <span class="count">next 30 days · ${fmtMoney(RT.due30Total)}</span>
    </div>
    <div class="due-strip">
      ${actives.slice().sort((a, b) => nextDueDate(a) - nextDueDate(b)).map(recurringTile).join('')}
      <button class="due-card" data-rec="new" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;color:var(--muted);border-style:dashed;width:104px">
        <span class="dc-ic" style="background:var(--surface-2);color:var(--text)">${icon('plus', 15)}</span>
        <span style="font-size:10.5px;font-weight:600">Add</span>
      </button>
    </div>

    <div class="sec-head anim" style="--d:3">
      <h2>Subscriptions</h2>
      <span class="count">${RT.subsCount}</span>
    </div>
    <div class="anim" style="--d:3">${subs.map(recurringRow).join('') || '<div class="empty" style="padding:18px"><p>No subscriptions yet.</p></div>'}</div>

    <div class="sec-head anim" style="--d:4">
      <h2>Bills</h2>
      <span class="count">${RT.billsCount}</span>
    </div>
    <div class="anim" style="--d:4">${bills.map(recurringRow).join('') || '<div class="empty" style="padding:18px"><p>No bills yet.</p></div>'}</div>

    <div class="sec-head anim" style="--d:5">
      <h2>Monthly items</h2>
      <span class="count">${RT.itemsCount}</span>
    </div>
    <div class="anim" style="--d:5">${items.map(recurringRow).join('') || '<div class="empty" style="padding:18px"><p>Nothing repeating yet.</p></div>'}</div>

    ${suggestions.length ? `<div class="suggest-card anim" style="--d:6">
      <span class="sic2">${icon('wand', 17)}</span>
      <div style="flex:1">
        <strong>${suggestions.length} subscription${suggestions.length > 1 ? 's' : ''} detected in your SMS</strong>
        <p>${esc(suggestions[0].merchant)}${suggestions[1] ? ' and ' + esc(suggestions[1].merchant) : ''} look like recurring charges. Track them here so they show up before they hit.</p>
        <button class="btn btn-lime" data-action="review-detected">Review in Autopilot</button>
      </div>
    </div>` : ''}

    <button class="btn btn-ghost anim" style="--d:7;margin-top:14px" data-action="post-due">
      ${icon('zap', 16)} Log ${RT.nextUp.filter(r => daysUntil(nextDueDate(r)) <= 0).length || ''} due payment${RT.nextUp.filter(r => daysUntil(nextDueDate(r)) <= 0).length === 1 ? '' : 's'} now
    </button>
    <div class="app-ver" style="padding-top:12px">Recurring items reset on their due day each month</div>
  `;

}

/* ============================================================
   AUTOPILOT — SMS expense sync
   ============================================================ */
function renderAuto() {
  const g = state.autopilot || {};
  const det = state.detected || [];
  const pending = det.filter(d => d.state === 'pending');
  const pendingTotal = sum(pending.filter(d => d.type === 'out').map(d => d.amount));
  const approvedCount = det.filter(d => d.state === 'approved').length;
  const ignoredCount = det.filter(d => d.state === 'ignored').length;
  const last = g.lastSync ? timeAgo(g.lastSync) : null;

  const statusLabel = g.connected ? (g.provider === 'live' ? 'Live · connected' : 'Demo · simulated inbox') : 'Not connected';

  $('#screen-auto').innerHTML = `
    <div class="s-head anim" style="--d:0">
      <div>
        <h1>Autopilot</h1>
        <div class="sub">Cards, SMS & email — read for you</div>
      </div>
      <button class="icon-btn" data-action="auto-help" aria-label="How it works">${icon('shield', 19)}</button>
    </div>

    <div class="auto-hero anim" style="--d:1">
      <div class="auto-status ${g.connected ? '' : 'off'}"><span class="led"></span>${statusLabel}</div>
      <h3>${g.connected ? 'Autopilot is watching your messages' : 'Hands off your money tracking'}</h3>
      <p>${g.connected
        ? `Budge reads every bank message, works out the account, amount and merchant from your rules, then logs it — no typing.`
        : `Turn on SMS reading and every debit, credit and receipt turns into a transaction automatically.`}</p>

      ${g.connected ? `
        <div class="hero-stats">
          <div class="hs"><span>Reviews</span><b>${pending.length}</b></div>
          <div class="hs"><span>Logged</span><b>${approvedCount}</b></div>
          <div class="hs"><span>Ignored</span><b>${ignoredCount}</b></div>
        </div>
        <button class="btn btn-lime" data-action="sync-now">${icon('refresh', 16)} ${last ? 'Synced ' + last : 'Sync inbox now'}</button>
      ` : `
        <button class="btn btn-lime" data-action="enable-sms">${icon('message', 17)} Enable SMS reading</button>
        <div style="margin-top:9px;position:relative;z-index:1">
          <button class="btn btn-ghost" data-action="demo-sync" style="height:40px;font-size:11.5px">${icon('zap', 15)} Try it with a simulated inbox</button>
        </div>
      `}
    </div>

    ${(() => {
      const all = state.splitInbox || [];
      const tr = all.filter(x => x.state === 'pending');
      const autoDone = all.filter(x => x.state === 'approved' && x.auto);
      if (!tr.length && !autoDone.length) return '';
      return `<div class="card anim" style="--d:2;border-color:rgba(126,200,242,.3)">
        <div class="card-head">
          <div><h3>Transfers matched</h3><span>${tr.length ? `${tr.length} waiting on you` : 'All settled automatically'}</span></div>
          <span class="pill up">${icon('people', 11)} people</span>
        </div>
        ${tr.length ? tr.slice(0, 2).map(splitInboxRow).join('') : ''}
        ${autoDone.length ? `<div class="auto-log">
          <div class="auto-log-head">${icon('zap', 11)} Auto-settled from your inbox</div>
          ${autoDone.slice(0, 3).map(x => `<div class="auto-log-row">
              <span class="al-name">${esc(x.personName)}</span>
              <span class="al-amt ${x.type === 'in' ? 'pos' : 'neg'}">${x.type === 'in' ? '+' : '−'}${fmtMoney(x.amount)}</span>
            </div>`).join('')}
        </div>` : ''}
        <button class="more-link" data-action="review-split-inbox">${tr.length ? 'Review transfers' : 'See all transfers'} ${icon('arrow-right', 13)}</button>
      </div>`;
    })()}

    ${pending.length ? `<div class="card anim" style="--d:2;border-color:rgba(215,250,76,.28)">
      <div class="card-head">
        <div><h3>Ready to review</h3><span>${pending.length} new · ${fmtMoney(pendingTotal)}</span></div>
        <span class="pill up">${icon('zap', 11)} new</span>
      </div>
      ${pending.slice(0, 4).map(detectedCard).join('')}
      ${pending.length > 4 ? `<button class="more-link" data-action="review-detected">Review all ${pending.length} ${icon('arrow-right', 13)}</button>` : ''}
      <div class="review-actions" style="margin-top:12px">
        <button class="btn btn-lime" data-action="approve-all">${icon('check', 15)} Approve all</button>
        <button class="btn btn-ghost" data-action="review-detected">Review</button>
      </div>
    </div>` : ''}

    <div class="card anim" style="--d:2">
      <div class="card-head">
        <div><h3>Bank messages</h3><span>${(state.sms && state.sms.forwarded) ? `${state.sms.forwarded} read · ${relDay(state.sms.lastAt)}` : 'Paste, forward, or auto-forward'}</span></div>
        <span class="pill up">${icon('message', 11)} SMS</span>
      </div>
      <div class="inbox-channels">
        <div class="ic-row">
          <span class="ic-ic" style="color:#7EE7B9">${icon('message', 15)}</span>
          <span class="ic-tx"><strong>SMS</strong><span>${nativeSmsSupported()
            ? 'Reading SMS on this phone — automatic'
            : (isNativeApp()
                ? 'Tap to allow Budge to read bank SMS'
                : ((state.sms && state.sms.endpoint) ? 'Auto-forwarding to your relay' : 'Connect a relay or paste manually'))}</span></span>
          <span class="ic-ok ${(nativeSmsSupported() || (state.sms && state.sms.endpoint)) ? '' : 'off'}">${icon((nativeSmsSupported() || (state.sms && state.sms.endpoint)) ? 'check' : 'minus', 13)}</span>
        </div>
        <div class="ic-row">
          <span class="ic-ic" style="color:#C6A6FF">${icon('mail', 15)}</span>
          <span class="ic-tx"><strong>Email</strong><span>${g.connected ? esc(g.email || 'connected') : 'Not connected yet'}</span></span>
          <span class="ic-ok ${g.connected ? '' : 'off'}">${icon(g.connected ? 'check' : 'minus', 13)}</span>
        </div>
      </div>
      ${(state.sms && state.sms.endpoint && !isNativeApp()) ? `<div class="relay-live">
        <span class="rl-dot ${state.sms.live ? 'on' : ''}"></span>
        <span class="rl-tx"><strong>${state.sms.live ? 'Relay connected' : 'Relay offline'}</strong><span>${esc(state.sms.endpoint)}</span></span>
        <button class="chip-btn" data-action="poll-sms">${icon('refresh', 11)} Check</button>
      </div>` : ''}
      <div class="review-actions" style="margin-top:12px">
        ${nativeSmsSupported()
          ? `<button class="btn btn-lime" data-action="poll-native">${icon('refresh', 15)} Check now</button>
             <button class="btn btn-ghost" data-action="import-message">${icon('plus', 15)} Paste</button>`
          : (isNativeApp()
              ? `<button class="btn btn-lime" data-action="allow-sms">${icon('message', 15)} Allow SMS access</button>
                 <button class="btn btn-ghost" data-action="import-message">${icon('plus', 15)} Paste</button>`
              : `<button class="btn btn-lime" data-action="${(state.sms && state.sms.endpoint) ? 'poll-sms' : 'connect-sms'}">${icon('message', 15)} ${(state.sms && state.sms.endpoint) ? 'Check now' : 'Connect SMS'}</button>
                 <button class="btn btn-ghost" data-action="import-message">${icon('plus', 15)} Paste</button>`)}
      </div>
      <div class="review-actions" style="margin-top:9px">
        <button class="btn btn-ghost" data-action="sync-sms-demo" style="height:38px;font-size:11px">${icon('zap', 14)} Try sample SMS</button>
      </div>
      <button class="more-link" data-action="open-rules">Message rules · ${(state.rules || []).length} set ${icon('arrow-right', 13)}</button>
    </div>

    ${!g.connected ? `<div class="card anim" style="--d:3">
      <div class="card-head"><h3>How it works</h3><span>${icon('mail', 13)}</span></div>
      <div class="steps">
        <div class="step"><span class="num"></span><div class="stx2"><strong>Add a channel</strong><p>Let Budge read bank SMS on the phone. Everything stays on the device.</p></div></div>
        <div class="step"><span class="num"></span><div class="stx2"><strong>Your rules decide what it is</strong><p>"Messages from 8556 are JazzCash." "Rs 421 is Amazon Prime Video." Learned once, applied forever.</p></div></div>
        <div class="step"><span class="num"></span><div class="stx2"><strong>It posts itself</strong><p>Every card maps to an account and people are matched by name — spending and settlements land without you lifting a finger.</p></div></div>
      </div>
    </div>` : `<div class="card anim" style="--d:3">
      <div class="card-head"><h3>Sync settings</h3><span>${esc(g.email || 'demo@budge.app')}</span></div>
      <div class="settings" style="margin:0;border-radius:14px">
        <div class="set-row">
          <span class="sic">${icon('zap', 16)}</span>
          <span class="stx"><strong>Auto-post transactions</strong><span>Skip review for high-confidence matches</span></span>
          <button class="switch ${g.autoPost ? 'on' : ''}" data-action="toggle-autopost" aria-label="Auto-post"></button>
        </div>
        <div class="set-row">
          <span class="sic">${icon('clock', 16)}</span>
          <span class="stx"><strong>Lookback window</strong><span>How far back to scan on connect</span></span>
          <select data-action="lookback">
            ${[15, 30, 45, 90].map(d => `<option value="${d}" ${g.lookbackDays === d ? 'selected' : ''}>${d} days</option>`).join('')}
          </select>
        </div>
        <div class="set-row">
          <span class="sic">${icon('refresh', 16)}</span>
          <span class="stx"><strong>Last sync</strong><span>${last || 'never'}</span></span>
          <span class="pill ${g.provider === 'live' ? 'up' : ''}">${g.provider === 'live' ? 'LIVE' : 'DEMO'}</span>
        </div>
      </div>
      <button class="btn btn-ghost" style="margin-top:11px" data-action="sync-now">${icon('refresh', 16)} Sync now</button>
      <button class="btn btn-ghost" style="margin-top:9px;height:40px;font-size:11.5px" data-action="sync-transfers">${icon('people', 15)} Scan for money from people</button>
    </div>`}

    <div class="card anim" style="--d:4">
      <div class="card-head"><h3>Cards & accounts</h3><span>${(g.cards || []).length} mapped</span></div>
      ${(g.cards || []).map(c => `<div class="cardmap">
        <span class="cm-ic">${icon('card', 17)}</span>
        <span class="cm-tx">
          <strong>${esc(c.label)}</strong>
          <span class="cm-mask">•••• ${esc(c.mask)}</span>
        </span>
        <button class="chip-btn" data-card-map="${c.id}">${esc(acctById(c.accountId).name)} ${icon('chevron-down', 11)}</button>
      </div>`).join('')}
      <div class="hint" style="font-size:10px;color:var(--faint);margin-top:8px;line-height:1.5">
        When an email mentions a card, Budge posts to the mapped account so every balance stays accurate.
      </div>
      <button class="btn btn-ghost" style="margin-top:11px;height:40px;font-size:11.5px" data-action="add-card">${icon('plus', 15)} Add another card</button>
    </div>

    ${ignoredCount ? `<div class="card anim" style="--d:5">
      <div class="card-head"><h3>Ignored</h3><span>${ignoredCount} skipped</span></div>
      <p style="font-size:11px;color:var(--muted);line-height:1.5">
        OTP codes, statements and marketing emails are skipped automatically — they never create transactions.
      </p>
    </div>` : ''}

    <div class="card anim" style="--d:6">
      <div class="card-head"><h3>Safety</h3><span>${icon('shield', 13)}</span></div>
      <div class="sync-log">
        <b>Read-only.</b> Budge can only list message metadata and bodies — it cannot send, delete or modify mail.<br><br>
        <b>On your device.</b> Message bodies are parsed in memory; only the resulting transaction is stored. Nothing is shared.<br><br>
        <b>Revocable.</b> Disconnect anytime from Settings — access ends immediately.
      </div>
    </div>
  `;

}

function detectedCard(d) {
  const cat = catById(d.categoryId);
  const confTier = d.confidence >= 0.8 ? '' : d.confidence >= 0.55 ? 'mid' : 'low';
  const pct = Math.round(d.confidence * 100);
  return `<div class="review-card">
    <div class="review-top">
      <span class="tx-ico" style="--c:${d.color};width:38px;height:38px;border-radius:12px">${icon(d.icon || cat.icon, 17)}</span>
      <span class="review-meta">
        <strong>${esc(d.merchant)}</strong>
        <span>${esc(shortDate(d.date))}${d.cardMask ? ' · •••• ' + esc(d.cardMask) : ''} · ${esc(acctById(d.accountId).name)}</span>
      </span>
      <span class="review-amt" style="${d.type === 'in' ? 'color:var(--mint)' : ''}">${d.type === 'in' ? '+' : '−'}${fmtMoney(d.amount)}</span>
    </div>
    <div class="review-src">
      <span class="conf ${confTier}">${pct}% match</span>
      ${icon('message', 11)} ${esc(d.from || d.subject || 'SMS')}
    </div>
    <div class="review-actions">
      <button class="btn btn-lime" data-detect-ok="${d.id}">${icon('check', 14)} Approve</button>
      <button class="btn btn-ghost" data-detect-no="${d.id}">Ignore</button>
    </div>
  </div>`;
}

function timeAgo(iso) {
  const then = parseDate(iso).getTime();
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

/* ============================================================
   PEOPLE — lend, borrow, splits
   ============================================================ */
function avatarStyle(p) {
  return `background:linear-gradient(150deg,${p.color},color-mix(in srgb,${p.color} 65%,#0a0b0e));color:#0C1004;`;
}

function personCard(p) {
  const net = p.net;
  const label = net > 0 ? 'owes you' : net < 0 ? 'you owe' : 'settled up';
  const cls = net > 0 ? 'pos' : net < 0 ? 'neg' : '';
  const shares = personShares(p.id).filter(s => s.status === 'open');
  return `<div class="person-card" data-person-card="${p.id}">
    <div class="person-top" data-person="${p.id}">
      <span class="pi-avatar" style="${avatarStyle(p)}">${esc(p.initials)}</span>
      <span class="person-meta">
        <strong>${esc(p.name)}</strong>
        <span>${net === 0 ? 'All settled' : `${shares.length} open item${shares.length === 1 ? '' : 's'}`}</span>
      </span>
      <span class="person-amt ${cls}">${net === 0 ? '—' : fmtMoney(Math.abs(net))}<small>${label}</small></span>
    </div>
    ${net !== 0 ? `<div class="person-actions">
      <button class="btn btn-ghost" data-person="${p.id}">${icon('user', 13)} Profile</button>
      <button class="btn btn-lime" data-settle="${p.id}">${icon('settle', 13)} ${net > 0 ? 'Collect' : 'Settle'}</button>
      ${net > 0
        ? `<button class="btn btn-ghost" data-remind-person="${p.id}">${icon('send', 13)} Remind</button>`
        : `<button class="btn btn-ghost" data-lend="${p.id}">${icon('send', 13)} Send</button>`}
    </div>` : ''}
  </div>`;
}

function renderPeople() {
  const PT = peopleTotals();
  const people = peopleWithBalances().filter(p => Math.abs(p.net) > 0.5);
  const settledPeople = peopleWithBalances().filter(p => Math.abs(p.net) <= 0.5);
  const groups = state.groups.slice().sort((a, b) => parseDate(b.created) - parseDate(a.created));
  const recent = state.shares.slice().sort((a, b) => parseDate(b.date) - parseDate(a.date)).slice(0, 6);
  const inbox = (state.splitInbox || []).filter(x => x.state === 'pending');

  $('#screen-people').innerHTML = `
    <div class="s-head anim" style="--d:0">
      <div><h1>People</h1><div class="sub">Splits, loans & settling up</div></div>
      <div class="head-actions">
        <button class="icon-btn" data-action="new-split" aria-label="Split a bill">${icon('split', 19)}</button>
        <button class="icon-btn" data-action="add-person" aria-label="Add person">${icon('plus', 19)}</button>
      </div>
    </div>

    <div class="bal-grid anim" style="--d:1">
      <div class="bal-card">
        <span>People owe me</span>
        <strong class="pos">${fmtMoney(PT.receivable)}</strong>
        <em>${state.shares.filter(s => s.status === 'open' && s.direction === 'they_owe').length} open items</em>
      </div>
      <div class="bal-card">
        <span>I owe people</span>
        <strong class="neg">${fmtMoney(PT.payable)}</strong>
        <em>${state.shares.filter(s => s.status === 'open' && s.direction === 'i_owe').length} open items</em>
      </div>
    </div>

    <div class="anim" style="--d:1;margin-bottom:18px">
      <button class="btn btn-lime" data-action="new-split" style="height:46px">${icon('split', 17)} Split a bill</button>
    </div>

    ${inbox.length ? `<div class="card anim" style="--d:2;border-color:rgba(215,250,76,.3)">
      <div class="card-head">
        <div><h3>Found in SMS</h3><span>${inbox.length} settlement${inbox.length === 1 ? '' : 's'} detected</span></div>
        <span class="pill up">${icon('wand', 11)} auto</span>
      </div>
      ${inbox.slice(0, 3).map(s => splitInboxRow(s)).join('')}
      <button class="more-link" data-action="review-split-inbox">Review all ${inbox.length} ${icon('arrow-right', 13)}</button>
    </div>` : ''}

    <div class="sec-head anim" style="--d:3">
      <h2>Balances to settle</h2>
      <span class="count">${people.length}</span>
    </div>
    ${people.length ? people.map(personCard).join('')
      : `<div class="card"><div class="empty" style="padding:22px">
          <div class="eic">${icon('check', 22)}</div>
          <strong>Everyone's square</strong>
          <p>No open balances right now.</p>
        </div></div>`}

    ${settledPeople.length ? `<div class="sec-head anim" style="--d:4">
      <h2>Settled up</h2><span class="count">${settledPeople.length}</span>
    </div>
    <div class="anim" style="--d:4">${settledPeople.map(p => `<div class="person-card" style="padding:11px">
      <div class="person-top" data-person="${p.id}">
        <span class="pi-avatar" style="width:34px;height:34px;border-radius:11px;font-size:11px;${avatarStyle(p)}">${esc(p.initials)}</span>
        <span class="person-meta"><strong>${esc(p.name)}</strong><span>Nothing outstanding</span></span>
        <span class="pill up">${icon('check', 10)} clear</span>
      </div>
    </div>`).join('')}</div>` : ''}

    <div class="sec-head anim" style="--d:5">
      <h2>Groups</h2>
      <button class="link" data-action="new-group">New group ${icon('plus', 12)}</button>
    </div>
    <div class="group-strip">
      ${groups.map(g => {
        const net = groupNet(g.id);
        return `<button class="group-pill" data-group="${g.id}">
          <span class="gp-stack">${g.memberIds.slice(0, 3).map(mid => `<i style="background:${personById(mid).color}"></i>`).join('')}</span>
          <span>${esc(g.name)}<br><small>${net === 0 ? 'settled' : (net > 0 ? '+' : '−') + fmtMoney(Math.abs(net))}</small></span>
        </button>`;
      }).join('')}
      <button class="group-pill" data-action="new-group" style="border-style:dashed;color:var(--muted)">
        <span class="gp-stack"><i style="background:var(--surface-2)"></i></span><span>New group</span>
      </button>
    </div>

    <div class="sec-head anim" style="--d:6"><h2>Shared activity</h2></div>
    <div class="tx-card anim" style="--d:6">
      ${recent.length ? recent.map(s => {
        const p = personById(s.personId);
        const mine = s.direction === 'they_owe';
        const done = s.status === 'settled';
        return `<button class="shared-row" data-share="${s.id}">
          <span class="sh-ic" style="color:${p.color}">${icon(done ? 'settle' : (s.kind === 'lend' || s.kind === 'borrow') ? 'handCoins' : 'split', 16)}</span>
          <span class="sh-tx">
            <strong>${esc(s.note || (mine ? 'Lent to ' : 'Borrowed from ') + p.name)}</strong>
            <span>${esc(p.name)} · ${shortDate(s.date)}${done ? ' · settled' : ''}</span>
          </span>
          <span class="sh-amt ${done ? '' : mine ? 'pos' : 'neg'}">${done ? '' : mine ? '+' : '−'}${fmtMoney(s.amount)}</span>
        </button>`;
      }).join('') : `<div class="empty" style="padding:18px"><p>No shared records yet.</p></div>`}
      ${state.shares.length ? `<button class="more-link" data-action="all-shares">See all ${state.shares.length} ${icon('arrow-right', 13)}</button>` : ''}
    </div>

    <div class="app-ver" style="padding-top:10px">Settlements are matched from bank SMS automatically</div>
  `;
}

function splitInboxRow(s) {
  const p = personById(s.personId);
  const isIn = s.type === 'in';
  return `<div class="review-card" style="margin-bottom:8px">
    <div class="review-top">
      <span class="pi-avatar" style="${avatarStyle(p)};width:38px;height:38px;border-radius:12px;font-size:12px">${esc(p.initials)}</span>
      <span class="review-meta">
        <strong>${esc(s.personName || p.name)} ${isIn ? 'sent you' : 'was paid by you'}</strong>
        <span>${esc(shortDate(s.date))} · ${esc(s.bankLabel || 'bank transfer')}</span>
      </span>
      <span class="review-amt" style="${isIn ? 'color:var(--mint)' : ''}">${isIn ? '+' : '−'}${fmtMoney(s.amount)}</span>
    </div>
    <div class="review-src"><span class="conf ${s.confidence >= 0.8 ? '' : 'mid'}">${Math.round(s.confidence * 100)}% match</span>${icon('message', 11)} ${esc(s.from || 'SMS')}</div>
    <div class="review-actions">
      <button class="btn btn-lime" data-split-ok="${s.id}">${icon('check', 14)} Settle ${fmtMoney(s.amount)}</button>
      <button class="btn btn-ghost" data-split-no="${s.id}">Ignore</button>
    </div>
  </div>`;
}
