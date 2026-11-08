/* ============================================================
   Budge — core: icons, helpers, state, seed data
   ============================================================ */
'use strict';

const ICONS = {
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-5.5h5V20"/>',
  budget:'<rect x="2.5" y="6" width="19" height="13" rx="4"/><path d="M2.5 10h19"/><circle cx="17" cy="14.5" r="1.4"/>',
  insights:'<path d="M5 20v-6"/><path d="M12 20V5"/><path d="M19 20v-10"/>',
  wallet:'<rect x="2.5" y="5.5" width="19" height="13" rx="3"/><path d="M2.5 10h19"/><path d="M6.5 14.5h3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  bell:'<path d="M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8-2.5 8h17s-2.5-1.5-2.5-8"/><path d="M13.7 20.5a2 2 0 0 1-3.4 0"/>',
  'chevron-right':'<path d="M9.5 6l6 6-6 6"/>',
  'chevron-left':'<path d="M14.5 6l-6 6 6 6"/>',
  'chevron-down':'<path d="M6 9.5l6 6 6-6"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  check:'<path d="M4.5 12.5l4.5 4.5L19.5 6.5"/>',
  trash:'<path d="M4 6.5h16"/><path d="M9 6.5V4.5h6v2"/><path d="M6 6.5 7 20h10l1-13.5"/><path d="M10 10.5v6M14 10.5v6"/>',
  cart:'<circle cx="9.5" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3.5h2.2l2.4 11.2h11.3l2.1-8.2H6.2"/>',
  utensils:'<path d="M6.5 3v7.5a2.4 2.4 0 0 0 4.8 0V3"/><path d="M8.9 10.5V21"/><path d="M17.5 3c-1.7 1.6-2.6 3.5-2.6 5.6 0 2 1 3.4 2.6 4.4V21"/>',
  car:'<path d="M4 16v-4.2L6.2 7h11.6L20 11.8V16"/><path d="M2.8 16h18.4"/><circle cx="7.2" cy="17.6" r="1.5"/><circle cx="16.8" cy="17.6" r="1.5"/><path d="M4 12h16"/>',
  bag:'<path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 8V6.2a3 3 0 0 1 6 0V8"/>',
  receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  heart:'<path d="M12 20.2s-7.2-4.4-7.2-9.4A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.2 3.8c0 5-7.2 9.4-7.2 9.4Z"/>',
  film:'<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M7.5 4.5v15M16.5 4.5v15M3 9.5h4.5M3 14.5h4.5M16.5 9.5H21M16.5 14.5H21"/>',
  book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v14.5H6.5A2.5 2.5 0 0 0 4 20V5.5Z"/><path d="M4 18.6a2.2 2.2 0 0 1 2.2-2.1H20"/>',
  briefcase:'<rect x="3" y="7" width="18" height="12.5" rx="2.5"/><path d="M8.5 7V5.5a1.8 1.8 0 0 1 1.8-1.8h3.4a1.8 1.8 0 0 1 1.8 1.8V7"/><path d="M3 12.2h18"/>',
  laptop:'<rect x="4" y="5" width="16" height="10.5" rx="2"/><path d="M2.5 19h19"/>',
  gift:'<rect x="3.5" y="9" width="17" height="11" rx="2"/><path d="M2.5 9h19M12 9v11"/><path d="M12 9S9.9 3.7 7.7 4.5 8.5 9 12 9Zm0 0s2.1-5.3 4.3-4.5S15.5 9 12 9Z"/>',
  coffee:'<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"/><path d="M17 9.5h1.8a2.7 2.7 0 0 1 0 5.4H17"/><path d="M4 21.5h14"/>',
  fuel:'<path d="M5 21V5.2A2.2 2.2 0 0 1 7.2 3h4.6A2.2 2.2 0 0 1 14 5.2V21"/><path d="M5 11h9"/><path d="M14 8h2.3a2 2 0 0 1 2 2v6.6a1.9 1.9 0 0 0 3.7 0V9.4L19.4 6"/>',
  refund:'<path d="M3.5 4.5v5h5"/><path d="M4.3 9.5a8 8 0 1 1 1.4 6.6"/>',
  dots:'<circle cx="5" cy="12" r="1.25" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.25" fill="currentColor" stroke="none"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/>',
  moon:'<path d="M20.2 14.6A8.3 8.3 0 0 1 9.4 3.8a8.6 8.6 0 1 0 10.8 10.8Z"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4 21 21"/>',
  gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.6v2.1M12 19.3v2.1M2.6 12h2.1M19.3 12h2.1M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M18.7 5.3l-1.5 1.5M6.8 17.2l-1.5 1.5"/>',
  shield:'<path d="M12 3l7 2.8v5.7c0 4.4-3 7.4-7 9.5-4-2.1-7-5.1-7-9.5V5.8L12 3Z"/><path d="M9.2 12.2l2 2 3.6-3.9"/>',
  reset:'<path d="M20.5 5v5h-5"/><path d="M19.8 10a8 8 0 1 0-1.7 7"/>',
  'trending-up':'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  'trending-down':'<path d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
  target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  sparkles:'<path d="M12 3.2l1.7 4.6 4.6 1.7-4.6 1.7L12 15.8l-1.7-4.6L5.7 9.5l4.6-1.7L12 3.2Z"/><path d="M18.4 15.4l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1Z"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  'arrow-up-right':'<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
  'arrow-down-left':'<path d="M17 7 7 17"/><path d="M16.5 17H7V7.5"/>',
  lock:'<rect x="4.5" y="10" width="15" height="11" rx="3"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
  phone:'<path d="M6.6 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5.9 5.9l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z"/>',
  message:'<path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1-4.5A8.5 8.5 0 1 1 20.5 12Z"/>',
  bank:'<path d="M3 10.2 12 4l9 6.2"/><path d="M5.5 10.2v9M9.8 10.2v9M14.2 10.2v9M18.5 10.2v9M3 20.8h18"/>',
  cash:'<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>',
  download:'<path d="M12 3.5v10.5"/><path d="M7.5 10 12 14.5 16.5 10"/><path d="M4 19.5h16"/>',
  'arrow-right':'<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
  filter:'<path d="M3.5 5.5h17l-6.8 7.8V20l-3.4-1.7v-5L3.5 5.5Z"/>',
  pie:'<path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12V3.5Z"/><path d="M15 3.9A8.5 8.5 0 0 1 20.1 9H15V3.9Z"/>',
  dot:'<circle cx="12" cy="12" r="4"/>',
  repeat:'<path d="M17 2.5l3 3-3 3"/><path d="M4 11V9.5a4 4 0 0 1 4-4h12"/><path d="M7 21.5l-3-3 3-3"/><path d="M20 13v1.5a4 4 0 0 1-4 4H4"/>',
  mail:'<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M3.5 7.5 12 13.5l8.5-6"/>',
  zap:'<path d="M13.5 2.5 4.8 13.2h5.6l-.9 8.3 8.7-10.7h-5.6l.9-8.3Z"/>',
  refresh:'<path d="M20.5 11.5a8.5 8.5 0 1 1-2.6-6"/><path d="M20.8 3.5v5h-5"/>',
  pause:'<rect x="7" y="4.5" width="3.6" height="15" rx="1.4"/><rect x="13.4" y="4.5" width="3.6" height="15" rx="1.4"/>',
  play:'<path d="M8 5l11 7-11 7V5Z"/>',
  plug:'<path d="M9 3v5M15 3v5"/><path d="M6 8h12v2.5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8Z"/><path d="M12 16.5V21"/>',
  copy:'<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 5.5h-9a2 2 0 0 0-2 2v9"/>',
  alert:'<path d="M12 3.5 21 20H3l9-16.5Z"/><path d="M12 9.5v5"/><circle cx="12" cy="17.4" r=".9" fill="currentColor" stroke="none"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/>',
  card:'<rect x="2.5" y="5" width="19" height="13.5" rx="3"/><path d="M2.5 9.5h19"/><path d="M6 14.5h3.5"/>',
  inbox:'<path d="M3 12.5 5.4 5h13.2L21 12.5V19H3v-6.5Z"/><path d="M3 12.5h5l1.2 2.5h5.6L16 12.5h5"/>',
  pauseCircle:'<circle cx="12" cy="12" r="8.5"/><path d="M10 9v6M14 9v6"/>',
  people:'<circle cx="9" cy="8" r="3.2"/><path d="M3.2 20a5.8 5.8 0 0 1 11.6 0"/><path d="M16.2 5.2a3.2 3.2 0 0 1 0 5.9"/><path d="M17.4 14.6a5.8 5.8 0 0 1 3.4 5.4"/>',
  handCoins:'<path d="M3 13.5h3.2l3.1 3.1a2 2 0 0 0 2.8 0l5.4-5.4a1.9 1.9 0 0 0-2.7-2.7l-2.6 2.6"/><path d="M6.2 13.5V20h12.4a2 2 0 0 0 0-4h-4.5"/><circle cx="16.4" cy="6.4" r="3"/><path d="M16.4 4.6v3.6M14.9 5.3h2.4a.9.9 0 0 1 0 1.8h-1.8a.9.9 0 0 0 0 1.8h2.4"/>',
  split:'<path d="M4 5.5h5l4 6 4 -6h3"/><path d="M4 18.5h5l3.2-4.8"/><path d="M16 14h5"/><path d="M17.6 18.5H21"/><circle cx="4.4" cy="5.5" r="1.4"/><circle cx="4.4" cy="18.5" r="1.4"/>',
  send:'<path d="M21 3 10.5 13.5"/><path d="M21 3l-6.6 18-3.9-7.5L3 9.6 21 3Z"/>',
  settle:'<path d="M4.5 12.5l4.5 4.5L19.5 6.5"/>',
  user:'<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20.5a7.2 7.2 0 0 1 14.4 0"/>',
  users:'<circle cx="9.2" cy="8.4" r="3.2"/><path d="M3.4 20a5.8 5.8 0 0 1 11.6 0"/><path d="M16 5.6a3.2 3.2 0 0 1 0 5.8"/><path d="M17.2 14.8a5.8 5.8 0 0 1 3.4 5.2"/>',
  undo:'<path d="M4 10h10.5a4.8 4.8 0 0 1 0 9.6H9"/><path d="M7.5 6 3.5 10l4 4"/>',
  wand:'<path d="M4 20 16.5 7.5"/><path d="M14.5 5.5 18.5 9.5"/><path d="M18 3l.8 2.2L21 6l-2.2.8L18 9l-.8-2.2L15 6l2.2-.8L18 3Z"/><path d="M5.5 5l.6 1.6L7.7 7.2l-1.6.6L5.5 9.4l-.6-1.6L3.3 7.2l1.6-.6L5.5 5Z"/>'
};

const CURRENCIES = {
  PKR:{sym:'Rs', code:'PKR'},
  USD:{sym:'$',  code:'USD'},
  EUR:{sym:'€',  code:'EUR'},
  GBP:{sym:'£',  code:'GBP'},
  INR:{sym:'₹',  code:'INR'},
  AED:{sym:'AED',code:'AED'}
};

const COLORS = ['#7ED9A0','#F5A65B','#7EC8F2','#C6A6FF','#F2D06B','#FF8BA0','#7EE7E0','#A8C7FF','#C9CFDA','#9EE8FF'];

/* ---------- tiny helpers ---------- */
const $  = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const pad2 = n => String(n).padStart(2, '0');
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sum = arr => arr.reduce((a, b) => a + b, 0);

function esc(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function icon(name, size, cls) {
  const p = ICONS[name] || ICONS.dot;
  return `<svg class="${cls || ''}" width="${size || 20}" height="${size || 20}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

const numFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const money  = n => numFmt.format(Math.round(Math.abs(Number(n) || 0)));
const curSym = () => (CURRENCIES[state.currency] || CURRENCIES.PKR).sym;

function isoLocal(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function parseDate(s) {
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_S = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function catLabel(name, isIncome) {
  const map = {
    'Bills & utilities': 'Bills',
    'Dining out': 'Dining',
    'Entertainment': 'Fun',
    'Education': 'Learning',
    'Freelance': 'Freelance',
    'Current account': 'Current'
  };
  if (map[name]) return map[name];
  const first = String(name).split(' ')[0];
  return first.length > 8 ? first.slice(0, 7) + '…' : first;
}

function dayLabel(dateStr) {
  const d = parseDate(dateStr);
  const t = new Date();
  const same = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const y = new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1);
  if (same(d, t)) return 'Today';
  if (same(d, y)) return 'Yesterday';
  return `${MONTHS_S[d.getMonth()]} ${d.getDate()} · ${DAYS_S[d.getDay()]}`;
}
/* "just now" / "2 days ago" — used for reminder history. */
function relDay(dateStr) {
  if (!dateStr) return 'never';
  const then = parseDate(dateStr);
  if (!then || isNaN(then)) return 'never';
  const mins = Math.floor((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const mo = Math.floor(days / 30);
  return `${mo} month${mo === 1 ? '' : 's'} ago`;
}

function shortDate(dateStr) {
  const d = parseDate(dateStr);
  const t = new Date();
  if (d.getFullYear() === t.getFullYear()) return `${MONTHS_S[d.getMonth()]} ${d.getDate()}`;
  return `${MONTHS_S[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function timeLabel(dateStr) {
  const d = parseDate(dateStr);
  let h = d.getHours();
  const m = pad2(d.getMinutes());
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}
function monthKeyOf(dateInput) {
  const d = typeof dateInput === 'string' ? parseDate(dateInput) : dateInput;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}
const thisMonthKey = () => monthKeyOf(new Date());

function mDaysAgo(n, hh) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hh == null ? 20 : hh, 30, 0, 0);
  return isoLocal(d);
}

/* ---------- state ---------- */
const STORE_KEY = 'budge.state.v1';
let state = null;

function defaultState() {
  const now = new Date();
  const Y = now.getFullYear(), M = now.getMonth(), today = now.getDate();

  const mk = (monthOffset, day, hh, mm) => {
    const base = new Date(Y, M + monthOffset, 1, hh || 12, mm || 0);
    const dim = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    let d = clamp(day, 1, dim);
    if (monthOffset === 0) d = clamp(d, 1, today);
    base.setDate(d);
    return isoLocal(base);
  };

  const accounts = [
    { id:'a1', name:'Askari Bank',  type:'Current account', last4:'4417', balance:286300, color:'#D7FA4C' },
    { id:'a2', name:'HBL Bank',     type:'Savings',         last4:'9082', balance:212850, color:'#7EC8F2' },
    { id:'a4', name:'JazzCash',     type:'Mobile wallet',   last4:'8556', balance:18400,  color:'#FF8BA0' },
    { id:'a5', name:'Easypaisa',    type:'Mobile wallet',   last4:'3737', balance:9200,   color:'#7EE7B9' },
    { id:'a6', name:'NayaPay',      type:'Card',            last4:'5521', balance:31500,  color:'#C6A6FF' },
    { id:'a7', name:'SadaPay',      type:'Card',            last4:'7788', balance:12750,  color:'#F2D06B' },
    { id:'a3', name:'Cash wallet',  type:'Cash',            last4:'—',    balance:24600,  color:'#F5A65B' }
  ];

  const categories = [
    { id:'rent',       name:'Rent',          icon:'home',      color:'#8FA3FF', budget:90000, kind:'out' },
    { id:'groceries',  name:'Groceries',     icon:'cart',      color:'#7ED9A0', budget:35000, kind:'out' },
    { id:'dining',     name:'Dining out',    icon:'utensils',  color:'#F5A65B', budget:16000, kind:'out' },
    { id:'transport',  name:'Transport',     icon:'car',       color:'#7EC8F2', budget:15000, kind:'out' },
    { id:'shopping',   name:'Shopping',      icon:'bag',       color:'#C6A6FF', budget:20000, kind:'out' },
    { id:'bills',      name:'Bills & utilities', icon:'receipt', color:'#F2D06B', budget:30000, kind:'out' },
    { id:'health',     name:'Health',        icon:'heart',     color:'#FF8BA0', budget:12000, kind:'out' },
    { id:'fun',        name:'Entertainment', icon:'film',      color:'#7EE7E0', budget:10000, kind:'out' },
    { id:'education',  name:'Education',     icon:'book',      color:'#A8C7FF', budget:15000, kind:'out' },
    { id:'salary',     name:'Salary',        icon:'briefcase', color:'#7EE7B9', budget:0, kind:'in' },
    { id:'freelance',  name:'Freelance',     icon:'laptop',    color:'#B9F27C', budget:0, kind:'in' },
    { id:'refunds',    name:'Refunds',       icon:'refund',    color:'#9EE8FF', budget:0, kind:'in' }
  ];

  const txns = [
    /* --- current month --- */
    { t:'Monthly salary',            c:'salary',      a:'a1', amt:285000, type:'in',  d:mk(0,1,9,10),  note:'Ayesha Khan · payroll' },
    { t:'Apartment rent',            c:'rent',        a:'a1', amt:90000,  type:'out', d:mk(0,1,10,30), note:'Flat 4B · monthly' },
    { t:'Fiverr payout',             c:'freelance',   a:'a2', amt:42000,  type:'in',  d:mk(0,5,16,5),  note:'Brand identity project' },
    { t:'Daraz refund',              c:'refunds',     a:'a2', amt:3500,   type:'in',  d:mk(0,7,13,20), note:'Order #4471 returned' },
    { t:'Imtiaz Super Market',       c:'groceries',   a:'a2', amt:9840,   type:'out', d:mk(0,2,19,42), note:'Weekly grocery run' },
    { t:'Agha\'s Super Store',       c:'groceries',   a:'a2', amt:6420,   type:'out', d:mk(0,4,20,10), note:'Fruit, dairy & pantry' },
    { t:'Sabzi Mandi',               c:'groceries',   a:'a3', amt:2380,   type:'out', d:mk(0,5,11,15), note:'Vegetables' },
    { t:'Imtiaz Super Market',       c:'groceries',   a:'a2', amt:9760,   type:'out', d:mk(0,7,18,55), note:'Monthly bulk buy' },
    { t:'Kolachi Restaurant',        c:'dining',      a:'a2', amt:4850,   type:'out', d:mk(0,2,21,20), note:'Dinner with family' },
    { t:'Espresso Lab',              c:'dining',      a:'a3', amt:1240,   type:'out', d:mk(0,3,9,40),  note:'Flat white & croissant' },
    { t:'Foodpanda',                 c:'dining',      a:'a2', amt:2150,   type:'out', d:mk(0,4,13,5),  note:'Lunch at work' },
    { t:'Burger King',               c:'dining',      a:'a2', amt:1680,   type:'out', d:mk(0,6,20,30), note:'Late night snack' },
    { t:'Chaaye Khana',              c:'dining',      a:'a3', amt:1950,   type:'out', d:mk(0,7,17,15), note:'Chai with friends' },
    { t:'Coco Chan',                 c:'dining',      a:'a2', amt:2330,   type:'out', d:mk(0,8,20,0),  note:'Dinner out' },
    { t:'Careem ride',               c:'transport',   a:'a3', amt:640,    type:'out', d:mk(0,2,8,30),  note:'Home to office' },
    { t:'Shell fuel',                c:'transport',   a:'a1', amt:5200,   type:'out', d:mk(0,3,18,0),  note:'Full tank' },
    { t:'Careem ride',               c:'transport',   a:'a3', amt:520,    type:'out', d:mk(0,5,19,10), note:'Evening errand' },
    { t:'Parking',                   c:'transport',   a:'a3', amt:300,    type:'out', d:mk(0,6,12,0),  note:'Clifton lot' },
    { t:'Khaadi',                    c:'shopping',    a:'a2', amt:12400,  type:'out', d:mk(0,4,16,45), note:'Winter kurta set' },
    { t:'Daraz',                     c:'shopping',    a:'a2', amt:4280,   type:'out', d:mk(0,6,15,20), note:'Desk lamp & cables' },
    { t:'Al-Fatah Home',             c:'shopping',    a:'a2', amt:6900,   type:'out', d:mk(0,7,21,5),  note:'Bedding & towels' },
    { t:'K-Electric',                c:'bills',       a:'a1', amt:14800,  type:'out', d:mk(0,5,10,0),  note:'Electricity · October' },
    { t:'StormFiber Internet',       c:'bills',       a:'a1', amt:4800,   type:'out', d:mk(0,3,9,0),   note:'100 Mbps plan' },
    { t:'Zong Postpaid',             c:'bills',       a:'a1', amt:3600,   type:'out', d:mk(0,6,11,30), note:'Monthly mobile bill' },
    { t:'Aga Khan Pharmacy',         c:'health',      a:'a3', amt:2150,   type:'out', d:mk(0,5,17,40), note:'Prescription refill' },
    { t:'Dental checkup',            c:'health',      a:'a1', amt:3500,   type:'out', d:mk(0,8,16,0),  note:'Routine cleaning' },
    { t:'Cinepax tickets',           c:'fun',         a:'a2', amt:3200,   type:'out', d:mk(0,6,19,30), note:'Two evening show seats' },
    { t:'Spotify Premium',           c:'fun',         a:'a2', amt:1190,   type:'out', d:mk(0,4,7,0),   note:'Individual plan' },
    { t:'Coursera',                  c:'education',   a:'a2', amt:4900,   type:'out', d:mk(0,2,22,10), note:'UX specialisation' },
    { t:'Readings',                  c:'education',   a:'a2', amt:3750,   type:'out', d:mk(0,6,15,50), note:'Two paperbacks' },
    /* --- last month (sample for context) --- */
    { t:'Monthly salary',            c:'salary',      a:'a1', amt:285000, type:'in',  d:mk(-1,1,9,10),  note:'Ayesha Khan · payroll' },
    { t:'Imtiaz Super Market',       c:'groceries',   a:'a2', amt:8940,   type:'out', d:mk(-1,24,19,0), note:'Weekly grocery run' },
    { t:'Kolachi Restaurant',        c:'dining',      a:'a2', amt:6120,   type:'out', d:mk(-1,20,21,0), note:'Birthday dinner' },
    { t:'Khaadi',                    c:'shopping',    a:'a2', amt:9800,   type:'out', d:mk(-1,18,17,30),note:'Eid shopping' },
    { t:'K-Electric',                c:'bills',       a:'a1', amt:13200,  type:'out', d:mk(-1,12,10,0), note:'Electricity · September' },
    { t:'Shell fuel',                c:'transport',   a:'a1', amt:5600,   type:'out', d:mk(-1,15,18,0), note:'Full tank' }
  ].map(x => ({
    id: uid(), title: x.t, categoryId: x.c, accountId: x.a,
    amount: x.amt, type: x.type, date: x.d, note: x.note || ''
  }));

  const goals = [
    { id:'g1', name:'Emergency fund', target:600000,  saved:385000, color:'#7EE7B9', due:'Jun 2027' },
    { id:'g2', name:'Japan trip',     target:450000,  saved:152500, color:'#7EC8F2', due:'Mar 2027' },
    { id:'g3', name:'New MacBook',    target:380000,  saved:214000, color:'#C6A6FF', due:'Jan 2027' },
    { id:'g4', name:'Home down payment', target:2500000, saved:640000, color:'#F5A65B', due:'Dec 2028' }
  ];

  const histFactors = [0.42, 0.67, 0.50, 0.93, 0.72, 1];
  const history = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Y, M - i, 1);
    history.push({ key: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`, label: MONTHS_S[d.getMonth()], amount: Math.round(205000 * histFactors[5 - i]) });
  }

  /* ---------- recurring subscriptions & monthly items ---------- */
  const acctA = 'a1', acctH = 'a2', acctC = 'a3';
  const recurrences = [
    { id:'s1',  name:'Apartment rent',        amount:90000, dueDay:1,  cycle:'monthly', categoryId:'rent',      accountId:acctA, icon:'home',      color:'#8FA3FF', status:'active', kind:'bill' },
    { id:'s2',  name:'Helper salary',         amount:25000, dueDay:1,  cycle:'monthly', categoryId:'bills',     accountId:acctC, icon:'briefcase', color:'#F2D06B', status:'active', kind:'bill' },
    { id:'s3',  name:'Netflix Premium',       amount:1150,  dueDay:3,  cycle:'monthly', categoryId:'fun',       accountId:acctH, icon:'film',      color:'#FF8BA0', status:'active', kind:'sub'  },
    { id:'s4',  name:'StormFiber Internet',   amount:4800,  dueDay:3,  cycle:'monthly', categoryId:'bills',     accountId:acctA, icon:'receipt',   color:'#7EC8F2', status:'active', kind:'bill' },
    { id:'s5',  name:'Spotify Premium',       amount:1190,  dueDay:4,  cycle:'monthly', categoryId:'fun',       accountId:acctH, icon:'coffee',    color:'#7EE7B9', status:'active', kind:'sub'  },
    { id:'s6',  name:'K-Electric bill',       amount:14800, dueDay:5,  cycle:'monthly', categoryId:'bills',     accountId:acctA, icon:'zap',       color:'#F2D06B', status:'active', kind:'bill' },
    { id:'s7',  name:'Zong postpaid',         amount:3600,  dueDay:6,  cycle:'monthly', categoryId:'bills',     accountId:acctA, icon:'receipt',   color:'#C6A6FF', status:'active', kind:'bill' },
    { id:'s8',  name:'School fees',           amount:32000, dueDay:7,  cycle:'monthly', categoryId:'education', accountId:acctA, icon:'book',      color:'#A8C7FF', status:'active', kind:'bill' },
    { id:'s9',  name:'Careem Plus',           amount:499,   dueDay:11, cycle:'monthly', categoryId:'transport', accountId:acctH, icon:'car',       color:'#7EC8F2', status:'active', kind:'sub'  },
    { id:'s10', name:'iCloud+ 200GB',         amount:999,   dueDay:12, cycle:'monthly', categoryId:'fun',       accountId:acctH, icon:'mail',      color:'#7EE7E0', status:'active', kind:'sub'  },
    { id:'s11', name:'Gym membership',        amount:6500,  dueDay:15, cycle:'monthly', categoryId:'health',    accountId:acctA, icon:'heart',     color:'#FF8BA0', status:'paused', kind:'sub'  },
    { id:'s12', name:'Adobe Creative Cloud',  amount:2450,  dueDay:18, cycle:'monthly', categoryId:'fun',       accountId:acctH, icon:'laptop',    color:'#C6A6FF', status:'active', kind:'sub'  }
  ].map(r => ({ ...r, lastPaid: null, autoPost: true, source: 'manual' }));

  const items = [
    { id:'m1', name:'Fuel top-up',           amount:5200, dueDay:3,  cycle:'monthly', categoryId:'transport', accountId:acctA, icon:'fuel',      color:'#7EC8F2', status:'active', kind:'item' },
    { id:'m2', name:'Bulk grocery run',      amount:9760, dueDay:7,  cycle:'monthly', categoryId:'groceries', accountId:acctH, icon:'cart',      color:'#7ED9A0', status:'active', kind:'item' },
    { id:'m3', name:'Water delivery (cans)', amount:2400,  dueDay:14, cycle:'monthly', categoryId:'bills',     accountId:acctC, icon:'coffee',    color:'#7EE7E0', status:'active', kind:'item' },
    { id:'m4', name:'Household supplies',    amount:4800,  dueDay:21, cycle:'monthly', categoryId:'groceries', accountId:acctH, icon:'bag',       color:'#F5A65B', status:'active', kind:'item' }
  ].map(r => ({ ...r, lastPaid: null, autoPost: true, source: 'manual' }));

  const rules = defaultRules(accounts);


  /* ---------- people, groups & split shares ---------- */
  const people = [
    { id:'p1', name:'Abdul Rehman', initials:'AR', color:'#7EC8F2', email:'abdul.rehman@gmail.com', phone:'0300 1234567' },
    { id:'p2', name:'Hamza Sheikh', initials:'HS', color:'#F5A65B', email:'hamza.sheikh@gmail.com', phone:'0321 9988776' },
    { id:'p3', name:'Sana Malik',   initials:'SM', color:'#C6A6FF', email:'sana.malik@gmail.com',  phone:'0333 4455667' },
    { id:'p4', name:'Bilal Ahmed',  initials:'BA', color:'#7EE7B9', email:'bilal.ahmed@gmail.com', phone:'0345 1122334' },
    { id:'p5', name:'Zara Iqbal',   initials:'ZI', color:'#FF8BA0', email:'zara.iqbal@gmail.com',  phone:'0301 7654321' }
  ];

  const groups = [
    { id:'gr1', name:'Friday dinner', icon:'utensils', color:'#F5A65B', memberIds:['p1','p2','p3','p5'], created:mDaysAgo(6) },
    { id:'gr2', name:'Office lunch',  icon:'briefcase', color:'#7EC8F2', memberIds:['p2','p4'], created:mDaysAgo(20) },
    { id:'gr3', name:'Trip to Murree', icon:'car',       color:'#C6A6FF', memberIds:['p1','p2','p3','p4','p5'], created:mDaysAgo(38) }
  ];

  const shares = [
    /* I paid, they owe me */
    { id:'sh1', personId:'p2', direction:'they_owe', amount:2400, note:'Friday dinner · my card', date:mDaysAgo(6),  status:'open',      groupId:'gr1', source:'manual' },
    { id:'sh2', personId:'p3', direction:'they_owe', amount:1200, note:'Friday dinner · my card', date:mDaysAgo(6),  status:'open',      groupId:'gr1', source:'manual' },
    { id:'sh3', personId:'p4', direction:'they_owe', amount:1850, note:'Office lunch Friday',     date:mDaysAgo(20), status:'settled',   groupId:'gr2', source:'manual' },
    /* they paid, I owe them */
    { id:'sh4', personId:'p1', direction:'i_owe',    amount:1400, note:'Friday dinner · his card', date:mDaysAgo(6),  status:'open',      groupId:'gr1', source:'manual' },
    { id:'sh5', personId:'p5', direction:'i_owe',    amount:950,  note:'Murree fuel split',        date:mDaysAgo(38), status:'settled',   groupId:'gr3', source:'manual' },
    /* a loan, not a split */
    { id:'sh6', personId:'p2', direction:'they_owe', amount:5000, note:'Lent for bike repair',      date:mDaysAgo(14), status:'open',      kind:'lend', source:'manual' },
    { id:'sh7', personId:'p3', direction:'i_owe',    amount:3000, note:'Borrowed for textbooks',     date:mDaysAgo(30), status:'open',      kind:'borrow', source:'manual' }
  ];

  return {
    profile: { name: 'Ayesha Khan', email: 'ayesha@example.com', phone: '0300 0000000' },
    currency: 'PKR',
    theme: 'dark',
    notify: true,
    accounts,
    categories,
    txns,
    goals,
    history,
    insightRange: 6,
    recurrences,
    items,
    rules, sms:{ forwarded:0, lastAt:null },
    detected: [],
    people,
    groups,
    shares,
    splitInbox: [],
    settleRequests: [],
    created: Date.now()
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.txns && parsed.categories && parsed.accounts) {
        const base = defaultState();
        if (!parsed.recurrences) parsed.recurrences = base.recurrences;
        if (!parsed.items) parsed.items = base.items;
        if (!parsed.detected) parsed.detected = [];
        if (!parsed.people) parsed.people = base.people;
        if (!parsed.groups) parsed.groups = base.groups;
        if (!parsed.shares) parsed.shares = base.shares;
        if (!parsed.splitInbox) parsed.splitInbox = [];
        if (!parsed.settleRequests) parsed.settleRequests = [];
        if (!parsed.rules) parsed.rules = base.rules;
        if (!parsed.sms) parsed.sms = { forwarded: 0, lastAt: null };
        if (!parsed.reminders) parsed.reminders = [];
        return parsed;
      }
    }
  } catch (e) { /* private mode / sandbox */ }
  return defaultState();
}

let saveTimer = null;
function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }, 120);
}

/* ---------- derived ---------- */
function catById(id) { return state.categories.find(c => c.id === id) || { id:'other', name:'Uncategorised', icon:'dots', color:'#8E919D', kind:'out', budget:0 }; }
function acctById(id) { return state.accounts.find(a => a.id === id) || state.accounts[0] || { name:'Account', last4:'—' }; }

function totals() {
  const key = thisMonthKey();
  const monthTx = state.txns.filter(t => monthKeyOf(t.date) === key);
  const expense = sum(monthTx.filter(t => t.type === 'out').map(t => t.amount));
  const income  = sum(monthTx.filter(t => t.type === 'in').map(t => t.amount));
  const balance = sum(state.accounts.map(a => a.balance));
  const budget  = sum(state.categories.filter(c => c.kind !== 'in').map(c => c.budget));
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(0, daysInMonth - now.getDate());
  return { key, monthTx, expense, income, balance, budget, daysLeft, daysInMonth, net: income - expense };
}

function spentByCat(catId, monthKey) {
  const key = monthKey || thisMonthKey();
  return sum(state.txns.filter(t => t.categoryId === catId && t.type === 'out' && monthKeyOf(t.date) === key).map(t => t.amount));
}

function spendSeriesLastDays(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const v = sum(state.txns.filter(t => t.type === 'out' && t.date.slice(0, 10) === key).map(t => t.amount));
    out.push({ day: d.getDate(), value: v, label: DAYS_S[d.getDay()] });
  }
  return out;
}

function incomeSeriesLastDays(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const v = sum(state.txns.filter(t => t.type === 'in' && t.date.slice(0, 10) === key).map(t => t.amount));
    out.push(v);
  }
  return out;
}

function historySeries(range) {
  const live = totals().expense;
  const arr = state.history.map(h => ({ label: h.label, amount: h.amount }));
  arr[arr.length - 1] = { label: MONTHS_S[new Date().getMonth()], amount: live };
  return arr.slice(-(range || 6));
}

/* ============================================================
   Recurring helpers
   ============================================================ */
function isoDateOnly(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function nextDueDate(rec) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = clamp(Number(rec.dueDay) || 1, 1, 31);
  const dim = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  let due = new Date(today.getFullYear(), today.getMonth(), Math.min(day, dim));
  if (due < today) {
    const nd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const ndim = new Date(nd.getFullYear(), nd.getMonth() + 1, 0).getDate();
    due = new Date(nd.getFullYear(), nd.getMonth(), Math.min(day, ndim));
  }
  return due;
}
function daysUntil(d) {
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((b - a) / 86400000);
}
function dueLabel(rec) {
  const d = nextDueDate(rec);
  const n = daysUntil(d);
  if (n === 0) return 'Due today';
  if (n === 1) return 'Due tomorrow';
  if (n <= 7) return `In ${n} days`;
  return `In ${n} days`;
}
function monthlyEquivalent(amount, cycle) {
  if (cycle === 'weekly') return amount * 52 / 12;
  if (cycle === 'yearly') return amount / 12;
  if (cycle === 'quarterly') return amount / 3;
  return amount;
}
function allRecurring() {
  return state.recurrences.concat(state.items);
}
function activeRecurring() {
  return allRecurring().filter(r => r.status !== 'paused');
}
function allRecurringSorted() {
  return allRecurring().filter(r => r.kind !== 'item').slice().sort((a, b) => nextDueDate(a) - nextDueDate(b));
}
function recurringTotals() {
  const act = activeRecurring();
  /* kind decides the bucket: subs vs bills (both live in recurrences), items in their own list */
  const subs   = act.filter(r => r.kind === 'sub');
  const bills  = act.filter(r => r.kind === 'bill');
  const items  = act.filter(r => r.kind === 'item');
  const eq = r => monthlyEquivalent(r.amount, r.cycle);
  const monthlyTotal = sum(act.map(eq));
  const sorted = act.slice().sort((a, b) => nextDueDate(a) - nextDueDate(b));
  const due7 = act.filter(r => daysUntil(nextDueDate(r)) <= 7);
  return {
    monthlyTotal,
    subTotal: sum(subs.map(eq)),
    billTotal: sum(bills.map(eq)),
    itemTotal: sum(items.map(eq)),
    due7Total: sum(due7.map(eq)),
    due30Total: monthlyTotal,
    nextUp: sorted.slice(0, 5),
    count: act.length,
    subsCount: subs.length,
    billsCount: bills.length,
    itemsCount: items.length,
    yearlyTotal: monthlyTotal * 12
  };
}

/* ============================================================
   People — balances, splits, settlements
   ============================================================ */
function personById(id) {
  return state.people.find(p => p.id === id) || { id, name:'Unknown', initials:'?', color:'#8E919D' };
}

/* net per person: positive = they owe me, negative = I owe them */
function personNet(personId) {
  const open = state.shares.filter(s => s.personId === personId && s.status === 'open');
  return sum(open.map(s => s.direction === 'they_owe' ? s.amount : -s.amount));
}
function peopleTotals() {
  const open = state.shares.filter(s => s.status === 'open');
  const receivable = sum(open.filter(s => s.direction === 'they_owe').map(s => s.amount));
  const payable = sum(open.filter(s => s.direction === 'i_owe').map(s => s.amount));
  const settled = state.shares.filter(s => s.status === 'settled');
  return {
    receivable, payable, net: receivable - payable,
    openCount: open.length,
    settledCount: settled.length,
    settledTotal: sum(settled.map(s => s.amount))
  };
}
/* Anything matched this confidently from a known contact settles on arrival. */
const AUTO_SETTLE_CONFIDENCE = 0.85;

function peopleWithBalances() {
  return state.people.map(p => ({ ...p, net: personNet(p.id) }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}
function personShares(personId) {
  return state.shares.filter(s => s.personId === personId)
    .sort((a, b) => parseDate(b.date) - parseDate(a.date));
}
function groupNet(groupId) {
  return sum(state.shares.filter(s => s.groupId === groupId && s.status === 'open')
    .map(s => s.direction === 'they_owe' ? s.amount : -s.amount));
}

/* equal split with paisa rounding — the payer absorbs the remainder */
function splitEven(total, payerCount, otherCount) {
  const others = Math.floor((total / payerCount) * 100) / 100;
  const mine = Math.round((total - others * otherCount) * 100) / 100;
  return { each: others, mine };
}

/* ============================================================
   Message parsing — SMS is the only channel
   ============================================================ */
const TX_HINTS = /(debit|debited|charged|charge|payment|paid|purchase|transaction|spent|withdraw|pos\s|invoice|bill|receipt|subscription|renewal)/i;
const CREDIT_HINTS = /(credit(ed)?|refund(ed)?|reversal|cashback|deposit|reimburs)/i;
const NOISE = /(otp|one[- ]time|verification code|password|login alert|security alert|do not share|statement is ready|e-?statement|promo|offer|sale ends|congratulations)/i;

const SENDER_CATALOG = {
  'netflix.com':        { merchant: 'Netflix',        categoryId: 'fun',       icon: 'film',   color: '#FF8BA0' },
  'spotify.com':        { merchant: 'Spotify',        categoryId: 'fun',       icon: 'coffee', color: '#7EE7B9' },
  'icloud.com':         { merchant: 'iCloud+',        categoryId: 'fun',       icon: 'mail',   color: '#7EE7E0' },
  'adobe.com':          { merchant: 'Adobe',          categoryId: 'fun',       icon: 'laptop', color: '#C6A6FF' },
  'careem.com':         { merchant: 'Careem',         categoryId: 'transport', icon: 'car',    color: '#7EC8F2' },
  'foodpanda.pk':       { merchant: 'Foodpanda',      categoryId: 'dining',    icon: 'utensils', color: '#F5A65B' },
  'daraz.pk':           { merchant: 'Daraz',          categoryId: 'shopping',  icon: 'bag',    color: '#C6A6FF' },
  'imtiaz.com.pk':      { merchant: 'Imtiaz',         categoryId: 'groceries', icon: 'cart',   color: '#7ED9A0' },
  'ke.com.pk':          { merchant: 'K-Electric',     categoryId: 'bills',     icon: 'zap',    color: '#F2D06B' },
  'stormfiber.com':     { merchant: 'StormFiber',     categoryId: 'bills',     icon: 'receipt', color: '#7EC8F2' },
  'zong.com.pk':        { merchant: 'Zong',           categoryId: 'bills',     icon: 'receipt', color: '#C6A6FF' },
  'uber.com':           { merchant: 'Uber',           categoryId: 'transport', icon: 'car',    color: '#7EC8F2' },
  'aws.amazon.com':     { merchant: 'Amazon',         categoryId: 'shopping',  icon: 'bag',    color: '#F5A65B' },
  'google.com':         { merchant: 'Google',         categoryId: 'fun',       icon: 'mail',   color: '#7EC8F2' }
};

/* merchant keywords → category, so a "KHAADI" debit lands in Shopping and "SHELL" in Transport */
const MERCHANT_KEYWORDS = [
  { re: /(khaadi|outfitters|daraz|amazon|alfatah|al-fatah|hyperstar|metro|shop|store|mall|brand)/i, categoryId: 'shopping', icon: 'bag', color: '#C6A6FF' },
  { re: /(imtiaz|sabzi|mandi|grocery|groceries|carrefour|mart|super|vegetable|bakery)/i, categoryId: 'groceries', icon: 'cart', color: '#7ED9A0' },
  { re: /(shell|psO|total|fuel|petrol|cng|caltex|hascol|parking|careem|uber|indrive|bykea|taxi)/i, categoryId: 'transport', icon: 'car', color: '#7EC8F2' },
  { re: /(restaurant|kolachi|foodpanda|pizza|burger|kfc|mcdonald|domino|coffee|espresso|chai|cafe|bakery|bbq|grill|dining)/i, categoryId: 'dining', icon: 'utensils', color: '#F5A65B' },
  { re: /(k-electric|kelectric|electric|wapda|sui gas|ssgc|sngpl|water|internet|stormfiber|ptcl|nayatel|zong|jazz|telenor|ufone|bill|utility)/i, categoryId: 'bills', icon: 'receipt', color: '#F2D06B' },
  { re: /(pharmacy|clinic|hospital|aga khan|doctor|medical|dental|health|chemist)/i, categoryId: 'health', icon: 'heart', color: '#FF8BA0' },
  { re: /(netflix|spotify|youtube|adobe|icloud|apple|google|microsoft|disney|prime|gym|cinema|cinepax|game)/i, categoryId: 'fun', icon: 'film', color: '#7EE7E0' },
  { re: /(school|college|university|coursera|udemy|book|readings|tuition|academy)/i, categoryId: 'education', icon: 'book', color: '#A8C7FF' }
];

function categorizeMerchant(name) {
  for (const k of MERCHANT_KEYWORDS) {
    if (k.re.test(name)) return { categoryId: k.categoryId, icon: k.icon, color: k.color };
  }
  return { categoryId: 'shopping', icon: 'bag', color: '#C6A6FF' };
}

/* generic bank subjects that are not merchant names */
const GENERIC_SUBJECT = /^(debit alert|credit alert|transaction alert|pos transaction|you made a purchase|alert|transaction|payment|receipt|your (order|receipt|invoice|statement)|.*alert|.*notification|.*summary)$/i;

/* Brand names as they actually appear in bank SMS: ALL CAPS, sometimes
   truncated by the bank, sometimes with a store code attached. */
const SMS_BRANDS = [
  { re:/amazon\s*prime(\s*video)?|prime\s*video|\bamzn\b|amazon/i,    merchant:'Amazon Prime Video', categoryId:'fun',       icon:'film',   color:'#7EC8F2' },
  { re:/\bamazon\b/i,                                                  merchant:'Amazon',            categoryId:'shopping',  icon:'bag',    color:'#F5A65B' },
  { re:/netflix/i,                                                     merchant:'Netflix',           categoryId:'fun',       icon:'film',   color:'#FF8BA0' },
  { re:/spotify/i,                                                     merchant:'Spotify',           categoryId:'fun',       icon:'coffee', color:'#7EE7B9' },
  { re:/foodpanda|food\s*panda/i,                                      merchant:'Foodpanda',         categoryId:'dining',    icon:'utensils', color:'#F5A65B' },
  { re:/daraz/i,                                                       merchant:'Daraz',             categoryId:'shopping',  icon:'bag',    color:'#C6A6FF' },
  { re:/careem/i,                                                      merchant:'Careem',            categoryId:'transport', icon:'car',    color:'#7EC8F2' },
  { re:/\b uber\b|uber\b/i,                                            merchant:'Uber',              categoryId:'transport', icon:'car',    color:'#7EC8F2' },
  { re:/imtiaz/i,                                                      merchant:'Imtiaz',            categoryId:'groceries', icon:'cart',   color:'#7ED9A0' },
  { re:/\bke\s*electric|k-electric/i,                                  merchant:'K-Electric',        categoryId:'bills',     icon:'zap',    color:'#F2D06B' },
  { re:/stormfiber/i,                                                  merchant:'StormFiber',        categoryId:'bills',     icon:'receipt',color:'#7EC8F2' },
  { re:/\bzong\b/i,                                                    merchant:'Zong',              categoryId:'bills',     icon:'receipt',color:'#C6A6FF' },
  { re:/\bjazz\b(?!cash)/i,                                            merchant:'Jazz',              categoryId:'bills',     icon:'receipt',color:'#FF8BA0' },
  { re:/\bptcl\b/i,                                                    merchant:'PTCL',              categoryId:'bills',     icon:'receipt',color:'#7EE7B9' },
  { re:/shell|total\s*parco|psо|hascol|attock\s*petroleum/i,           merchant:'Fuel station',      categoryId:'transport', icon:'car',    color:'#F2D06B' },
  { re:/mcdonald|kfc|pizza\s*hut|domino|burger\s*king|hardee|subway|gloria|broadway|kolachi|bar\s*b\s*q/i, merchant:'Restaurant', categoryId:'dining', icon:'utensils', color:'#F5A65B' },
  { re:/naheed|metro|hyperstar|carrefour|al\s*fatah|chase\s*up|utility/i, merchant:'Supermarket',    categoryId:'groceries', icon:'cart',   color:'#7ED9A0' },
  { re:/steam|playstation|xbox|epic\s*game/i,                          merchant:'Gaming',            categoryId:'fun',       icon:'laptop', color:'#C6A6FF' },
  { re:/google|apple\.com|itunes|icloud/i,                             merchant:'Digital services',  categoryId:'fun',       icon:'mail',   color:'#7EC8F2' }
];

/* Bank SMS almost always say "... at MERCHANT." or "... to MERCHANT."
   The name sits in caps, then ends at a full stop or a known tail word. */
const SMS_TAIL = /\b(avail(able)?|bal(ance)?|remaining|new\s+bal|txn|tid|ref|on|dated|from|at|for|card|a\/c|acct|thank|thanks|info|call)\b/i;

function merchantFromSms(text) {
  const t = String(text || '');

  /* person-to-person first: "received from SANA MALIK" / "sent to ABDUL REHMAN" */
  const p2p = t.match(/\b(?:received\s+from|sent\s+to|paid\s+to|transferred\s+to|credited\s+from)\s+([A-Z][A-Za-z']*(?:\s+[A-Z][A-Za-z']*){0,3})/i);
  if (p2p) {
    const nm = p2p[1].replace(/\s+(your|the|txn|tid|balance|avail).*$/i, '').trim();
    if (nm.length >= 3) return { merchant: titleCase(nm), categoryId: 'other', icon: 'send', color: '#7EC8F2' };
  }

  /* salary / income wording, before the brand list catches a stray word */
  if (/salary|payroll|credited|deposit/i.test(t) && !/debited|withdrawn|purchase/i.test(t)) {
    if (!/amazon|netflix|spotify|foodpanda|daraz|careem/i.test(t)) {
      return { merchant: /salary|payroll/i.test(t) ? 'Salary' : 'Money in', categoryId: 'salary', icon: 'arrow-down-left', color: '#7EE7B9' };
    }
  }

  /* 1 · brand catalogue — covers the truncated ALL-CAPS forms banks use */
  for (const b of SMS_BRANDS) {
    if (b.re.test(t)) return { merchant: b.merchant, categoryId: b.categoryId, icon: b.icon, color: b.color };
  }

  /* 2 · "at MERCHANT." capttured greedily, then trimmed of bank boilerplate */
  const atMatch = t.match(/\b(?:at|to|@)\s+([A-Za-z0-9][A-Za-z0-9&'.\-\s]{1,42}?)(?:\.|,|\s{2,}|$)/);
  if (atMatch) {
    let name = atMatch[1].replace(SMS_TAIL, '').trim().replace(/[.,;:]+$/, '').trim();
    /* drop trailing single letters and bank junk */
    name = name.replace(/\b(card|a\/c|acct|pkr|rs)\b.*$/i, '').trim();
    if (name.length >= 3 && name.split(/\s+/).length <= 5 && !/^(your|the|a|an|card|account)$/i.test(name)) {
      const cat = categorizeMerchant(name);
      return { merchant: titleCase(name), ...cat };
    }
  }
  return null;
}

function guessMerchant(sender, subject, body, cardMask) {
  const s = String(sender || '').toLowerCase();
  const domain = (s.split('@')[1] || '').split('>')[0].trim();
  const hay = `${subject || ''} ${body || ''}`;

  /* 1 · known brand sender */
  for (const key of Object.keys(SENDER_CATALOG)) {
    if (domain.endsWith(key) || s.includes(key)) return { ...SENDER_CATALOG[key], domain };
  }

  /* 2 · "… at MERCHANT" / "… to MERCHANT" in the body — the usual bank-alert shape */
  const atMatch = hay.match(/\b(?:at|to|from|merchant[: ])\s+([A-Z0-9][A-Za-z0-9&'.\-]*(?:\s+[A-Z0-9][A-Za-z0-9&'.\-]*){0,3})/);
  if (atMatch) {
    const name = atMatch[1]
      .replace(/[.!,;:]+$/, '')
      .replace(/\b(on|for|using|with|via|dt|the)$/i, '')
      .replace(/[.!,;:]+$/, '')
      .trim();
    if (name.length >= 3 && !/^(your|the|a|an|card|account|rs|pkr|usd)$/i.test(name)) {
      const cat = categorizeMerchant(name);
      return { merchant: titleCase(name), ...cat, domain };
    }
  }

  /* 3 · subscription / renewal subject */
  if (/subscription|renewal|renewed/i.test(hay)) {
    const name = (subject || '').split(/[-–|:]/)[0].replace(/your /i, '').replace(/ (subscription|plan|renewal).*$/i, '').trim();
    if (name.length >= 3) {
      const cat = categorizeMerchant(name);
      return { merchant: titleCase(name), ...cat, domain };
    }
  }

  /* 4 · honest fallback: the card it came from */
  const subjectClean = String(subject || '').trim();
  if (subjectClean && !GENERIC_SUBJECT.test(subjectClean)) {
    return { merchant: subjectClean.slice(0, 28), ...categorizeMerchant(subjectClean), domain };
  }
  return {
    merchant: cardMask ? `Card •••• ${cardMask}` : 'Card transaction',
    ...categorizeMerchant(hay), domain
  };
}

function titleCase(str) {
  return String(str).toLowerCase().replace(/\b[a-z]/g, ch => ch.toUpperCase()).replace(/\b(Pos|Ubl|Hbl|Mcb|Kfc|Pso|Atm|Cng)\b/g, m => m.toUpperCase());
}

function parseAmount(text) {
  const t = String(text || '');
  const patterns = [
    /(?:rs\.?|pkr)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:usd|\$)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:aed|eur|gbp|inr)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:amount|total|charged|paid)(?:\s*(?:of|is|:|-))*\s*([\d,]+(?:\.\d{1,2})?)/i,
    /\b([\d]{1,3}(?:,[\d]{3})+(?:\.\d{1,2})?)\b/
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const v = Number(m[1].replace(/,/g, ''));
      if (v > 0 && v < 100000000) return v;
    }
  }
  return 0;
}

function parseCardLast4(text) {
  const t = String(text || '');
  const m = t.match(/(?:ending(?:\s*in)?|ending|xx+|\*{2,}|•{2,}|card)\D{0,6}(\d{4})\b/i);
  if (m) return m[1];
  const m2 = t.match(/\b(\d{4})\s*(?:was|has been|is)\s*(?:debited|charged)/i);
  return m2 ? m2[1] : '';
}

/* Turn one bank SMS into a candidate transaction */

/* ==================================================================
   MESSAGE RULES  —  "if it comes from THIS number it's JazzCash",
   "if it debits Rs 421 it's Amazon Prime".
   Works for SMS and email alike: a message is just {from, text}.
   ================================================================== */

/* The institutions this app knows about out of the box. Every one of
   them can be edited, and new ones can be added from the UI later. */
const SOURCE_PRESETS = [
  { key:'askari',    name:'Askari Bank',  short:'Askari',    color:'#7EC8F2',
    match:['askaribank','askari bank','askari'],              kind:'bank' },
  { key:'hbl',       name:'HBL Bank',     short:'HBL',       color:'#F5A65B',
    match:['hbl','habib bank'],                               kind:'bank' },
  { key:'jazzcash',  name:'JazzCash',     short:'JazzCash',  color:'#FF8BA0',
    match:['jazzcash','jazz cash','8556'],                    kind:'wallet' },
  { key:'easypaisa', name:'Easypaisa',    short:'Easypaisa', color:'#7EE7B9',
    match:['easypaisa','easy paisa','3737'],                  kind:'wallet' },
  { key:'nayapay',   name:'NayaPay',      short:'NayaPay',   color:'#C6A6FF',
    match:['nayapay','naya pay'],                             kind:'wallet' },
  { key:'sadapay',   name:'SadaPay',      short:'SadaPay',   color:'#F2D06B',
    match:['sadapay','sada pay'],                             kind:'wallet' },
  { key:'meezan',    name:'Meezan Bank',  short:'Meezan',    color:'#A8C7FF',
    match:['meezan'],                                         kind:'bank' },
  { key:'ubl',       name:'UBL',          short:'UBL',       color:'#8FA3FF',
    match:['ubl','united bank'],                              kind:'bank' }
];

function sourcePreset(key) {
  return SOURCE_PRESETS.find(p => p.key === key) || null;
}

/* Default rules seeded on first run — one per institution, mapped to an
   account. The user can re-point any of them in two taps. */
function defaultRules(accounts) {
  const pick = (name) => (accounts.find(a => a.name.toLowerCase().includes(name)) || {}).id;
  const askari = pick('askari'), hbl = pick('hbl'), cash = pick('cash');
  return [
    { id:'r1', kind:'sender', enabled:true, source:'askari',    accountId: askari || (accounts[0] || {}).id,
      match:'Askari alerts · "ASKARI BANK"', note:'All Askari debits & credits' },
    { id:'r2', kind:'sender', enabled:true, source:'hbl',       accountId: hbl || (accounts[0] || {}).id,
      match:'HBL alerts · "HBL"', note:'All HBL debits & credits' },
    { id:'r3', kind:'sender', enabled:true, source:'jazzcash',  accountId: pick('jazzcash') || cash,
      match:'8556 · JazzCash', note:'JazzCash wallet messages' },
    { id:'r4', kind:'sender', enabled:true, source:'easypaisa', accountId: pick('easypaisa') || cash,
      match:'3737 · Easypaisa', note:'Easypaisa wallet messages' },
    { id:'r5', kind:'sender', enabled:true, source:'nayapay',   accountId: pick('nayapay') || cash,
      match:'NayaPay', note:'NayaPay card & wallet' },
    { id:'r6', kind:'sender', enabled:true, source:'sadapay',   accountId: pick('sadapay') || cash,
      match:'SadaPay', note:'SadaPay card & wallet' }
  ];
}

/* --- 1. which institution is this message from? --- */
function matchSourceRule(msg) {
  const hay = ((msg.from || '') + ' ' + (msg.subject || '') + ' ' + (msg.text || '')).toLowerCase();
  const from = String(msg.from || '').toLowerCase();
  const rules = state.rules || [];

  /* explicit user rules win, and a `from` hit beats a body mention */
  const sorted = rules.filter(r => r.kind === 'sender' && r.enabled !== false);
  for (const pass of ['from', 'any']) {
    for (const r of sorted) {
      const preset = sourcePreset(r.source);
      const needles = (preset ? preset.match : []).concat(String(r.match || '').toLowerCase().split(/[·,]/).map(x => x.trim())).filter(Boolean);
      for (const needle of needles) {
        if (!needle) continue;
        if (pass === 'from' ? from.includes(needle) : hay.includes(needle)) {
          return { rule: r, preset, accountId: r.accountId, via: pass };
        }
      }
    }
  }

  /* fall back to the built-in catalogue */
  for (const p of SOURCE_PRESETS) {
    if (p.match.some(m => from.includes(m))) return { rule: null, preset: p, accountId: null, via: 'preset' };
  }
  return null;
}

/* --- 2. which merchant does this message represent? --- */
function matchMerchantRule(msg, amount, sourceKey) {
  const hay = ((msg.subject || '') + ' ' + (msg.text || '')).toLowerCase();
  const rules = (state.rules || []).filter(r => r.kind === 'merchant' && r.enabled !== false);

  for (const r of rules) {
    if (r.source && sourceKey && r.source !== sourceKey) continue;
    const hasAmount = r.amount != null && Number(r.amount) > 0;
    const amountHit = hasAmount ? Math.abs(Number(amount) - Number(r.amount)) < 0.5 : true;
    const kw = String(r.keyword || '').trim().toLowerCase();
    const keywordHit = kw ? hay.includes(kw) : true;
    if (!amountHit || !keywordHit) continue;
    if (r.fromSource && sourceKey && r.fromSource !== sourceKey) continue;
    return r;
  }
  return null;
}

/* --- 3. one message in, one transaction out --- */
function applyMessageRules(msg) {
  const text = ((msg.subject || '') + ' ' + (msg.text || '')).replace(/\s+/g, ' ').trim();
  const amount = parseAmount(text);
  const src = matchSourceRule(msg);
  const sourceKey = src && src.preset ? src.preset.key : null;

  /* direction: an SMS says "debited"/"withdrawn" or "credited"/"received" */
  const credit = /\b(credited|received|deposit(ed)?|refund(ed)?|cash in|money in|added to)\b/i.test(text)
                 && !/\bdebited|withdrawn|paid|sent|purchase\b/i.test(text);
  const debit = /\b(debited|withdrawn|paid|purchase[d]?|sent|transferred out|spent)\b/i.test(text);

  const mRule = matchMerchantRule(msg, amount, sourceKey);

  let merchant = null, categoryId = null, icon = null, color = null;
  if (mRule) {
    merchant = mRule.merchant;
    categoryId = mRule.categoryId || 'shopping';
    const cat = catById(categoryId);
    icon = cat.icon; color = cat.color;
  } else {
    /* SMS first — bank alert wording is different from email wording */
    const smsGuess = msg.channel === 'sms' ? merchantFromSms(text) : null;
    if (smsGuess) {
      merchant = smsGuess.merchant;
      /* a refund is a refund; salary stays salary; a person paying you back
         is "other" rather than a fake expense category */
      categoryId = credit
        ? (/refund|reversal|chargeback/i.test(text) ? 'refunds' : (smsGuess.categoryId || 'other'))
        : (smsGuess.categoryId || 'shopping');
      icon = smsGuess.icon; color = smsGuess.color;
    } else {
      const guess = guessMerchant(msg.from || '', msg.subject || '', msg.text || '', parseCardLast4(text));
      merchant = guess.merchant;
      categoryId = credit ? 'refunds' : (guess.categoryId || 'shopping');
      icon = guess.icon; color = guess.color;
    }
  }

  /* confidence: a matched sender rule and a matched merchant rule are
     exactly what the user asked the app to trust. */
  let conf = 0.5;
  if (amount > 0) conf += 0.15;
  if (src) conf += 0.18;
  if (mRule) conf += 0.2;
  if (debit || credit) conf += 0.06;
  if (NOISE.test(text)) conf -= 0.45;

  return {
    id: uid(),
    channel: msg.channel || 'sms',
    merchant,
    subject: (msg.subject || '').slice(0, 90),
    from: (msg.from || '').slice(0, 90),
    amount: amount < 1000 ? Math.round(amount * 100) / 100 : Math.round(amount),
    type: credit ? 'in' : (debit ? 'out' : 'out'),
    categoryId,
    icon: icon || 'bag',
    color: color || '#C6A6FF',
    sourceKey,
    sourceName: src && src.preset ? src.preset.name : null,
    accountId: (mRule && mRule.accountId) ||
               (src && src.accountId) ||
               (src && src.preset ? pickAccountForSource(src.preset.key) : null) ||
               state.accounts[0].id,
    date: msg.date || isoLocal(new Date()),
    confidence: Math.max(0.1, Math.min(0.99, conf)),
    matchedRules: [src && src.rule ? src.rule.id : null, mRule ? mRule.id : null].filter(Boolean),
    recurring: /subscription|renewal|monthly|recurring|autopay|auto-pay/i.test(text),
    state: 'pending'
  };
}

/* Find the account that belongs to an institution, so a JazzCash SMS
   never lands in the wrong bank balance. */
function pickAccountForSource(key) {
  const preset = sourcePreset(key);
  if (!preset) return null;
  const hit = (state.accounts || []).find(a =>
    a.name.toLowerCase().includes(preset.short.toLowerCase()) ||
    a.name.toLowerCase().includes(preset.name.toLowerCase().split(' ')[0]));
  return hit ? hit.id : null;
}

function parseEmailMessage(msg, fallback) {
  const from = msg.from || '';
  const subject = msg.subject || '';
  const body = msg.text || msg.snippet || '';
  const hay = subject + ' ' + body;
  const maskEarly = parseCardLast4(hay);
  const guess = guessMerchant(from, subject, body, maskEarly);
  const amount = parseAmount(hay);
  const isCredit = CREDIT_HINTS.test(subject) && !/debit/i.test(subject);
  const mask = maskEarly;
  let conf = 0.45;
  if (amount > 0) conf += 0.22;
  if (mask) conf += 0.15;
  if (TX_HINTS.test(hay)) conf += 0.1;
  if (guess.domain && SENDER_CATALOG[guess.domain]) conf += 0.08;
  if (NOISE.test(hay)) conf -= 0.35;
  const card = { accountId: null };
  return {
    id: uid(),
    merchant: guess.merchant,
    subject: subject.slice(0, 90),
    from: from.slice(0, 90),
    amount: amount < 1000 ? Math.round(amount * 100) / 100 : Math.round(amount),
    type: isCredit ? 'in' : 'out',
    categoryId: isCredit ? 'refunds' : (guess.categoryId || 'shopping'),
    icon: guess.icon || 'bag',
    color: guess.color || '#C6A6FF',
    cardMask: mask,
    accountId: card ? card.accountId : (fallback && fallback.accountId) || state.accounts[0].id,
    date: msg.date || isoLocal(new Date()),
    confidence: Math.max(0.1, Math.min(0.99, conf)),
    messageId: msg.id || uid(),
    recurring: /subscription|renewal|monthly|recurring|autopay|auto-pay/i.test(hay),
    state: 'pending'
  };
}

/* ============================================================
   Demo inbox — realistic email fixtures for the simulation
   ============================================================ */
/* Realistic Pakistani bank / wallet SMS, used by the demo and by tests.
   Deliberately inconsistent, the way real ones are. */
function demoSmsInbox() {
  const now = new Date();
  const at = (d, h, m) => isoLocal(new Date(now.getFullYear(), now.getMonth(), now.getDate() - d, h || 12, m || 0));
  return [
    { id:'sms-1', channel:'sms', from:'8556', date:at(0, 19, 42),
      text:'JazzCash: Rs 3,000.00 debited from your account on 08-11-25. Txn: Restaurant payment. Balance: Rs 15,400.00' },
    { id:'sms-2', channel:'sms', from:'ASKARI', date:at(0, 14, 10),
      text:'Askari Bank: PKR 421.00 debited from A/C **4417 on 08-11-25 at AMAZON PRIME VIDEO. Avail Bal: PKR 285,879.00' },
    { id:'sms-3', channel:'sms', from:'HBL', date:at(1, 9, 5),
      text:'HBL: Your A/C 9082 has been debited with PKR 1,850.00 on 07-11-25 at FOODPANDA. Available balance PKR 211,000.00' },
    { id:'sms-4', channel:'sms', from:'3737', date:at(1, 20, 30),
      text:'Easypaisa: Rs 500 sent to ABDUL REHMAN. Your new balance is Rs 8,700.00. TID 9021011.' },
    { id:'sms-5', channel:'sms', from:'NayaPay', date:at(2, 11, 18),
      text:'NayaPay: Rs 2,340.00 debited at DARAZ. Card ending 5521. Bal Rs 29,160.00' },
    { id:'sms-6', channel:'sms', from:'SadaPay', date:at(2, 16, 44),
      text:'SadaPay: You spent Rs 685.00 at CAREEM. Available balance: Rs 12,065.00' },
    { id:'sms-7', channel:'sms', from:'ASKARI', date:at(3, 10, 0),
      text:'Askari Bank: PKR 95,000.00 credited to A/C **4417 on 05-11-25. Salary credit. Avail Bal: PKR 381,000.00' },
    { id:'sms-8', channel:'sms', from:'HBL', date:at(3, 18, 25),
      text:'HBL: PKR 421.00 debited from A/C 9082 on 05-11-25 at AMAZON PRIME VIDEO. Available balance PKR 212,850.00' },
    { id:'sms-9', channel:'sms', from:'8556', date:at(4, 13, 2),
      text:'JazzCash: Rs 3,000.00 received from SANA MALIK. Txn ID 8811234. Balance: Rs 18,400.00' },
    { id:'sms-10', channel:'sms', from:'VERIFY', date:at(0, 21, 0),
      text:'Your verification code is 481920. Do not share this OTP with anyone, not even bank staff.' }
  ];
}

/* Add parsed SMS to the detection queue, auto-post the confident ones. */
/* Forwarding apps retry, and the same SMS can arrive twice. Fingerprint the
   content so a retry never becomes a second transaction. */
function messageFingerprint(msg) {
  const norm = m => String(m || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 220);
  const raw = norm(msg.from) + '|' + norm(msg.text) + '|' + String(msg.date || '').slice(0, 16);
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) | 0;
  return 'fp' + (h >>> 0).toString(36);
}

function ingestMessages(msgs, opts) {
  const options = opts || {};
  const seen = new Set((state.detected || []).map(d => d.messageId));
  const seenFp = new Set((state.detected || []).map(d => d.fingerprint).filter(Boolean));
  const fresh = [];
  (msgs || []).forEach(msg => {
    if (seen.has(msg.id)) return;
    const fp = messageFingerprint(msg);
    if (seenFp.has(fp)) return;
    const parsed = applyMessageRules(msg);
    if (parsed.confidence < 0.55) return;
    parsed.messageId = msg.id;
    parsed.fingerprint = fp;
    seenFp.add(fp);
    state.detected = (state.detected || []).concat(parsed);
    fresh.push(parsed);
  });

  let posted = 0;
  fresh.forEach(d => {
    if (d.state === 'pending' && d.confidence >= 0.72) { approveDetected(d, true); posted++; }
  });
  if (options.channel === 'sms' && fresh.length) {
    state.sms = state.sms || { forwarded: 0, lastAt: null };
    state.sms.forwarded = (state.sms.forwarded || 0) + fresh.length;
    state.sms.lastAt = isoLocal(new Date());
  }
  saveState();
  return { fresh: fresh.length, posted };
}

function demoInbox() {
  const now = new Date();
  const at = (d, h, m) => {
    const x = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d, h || 11, m || 0);
    return isoLocal(x);
  };
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const day = n => Math.min(n, Math.max(1, now.getDate()));
  return [
    { id:'demo-1', from:'no-reply@netflix.com', subject:'Your Netflix subscription renewed', date:at(0, 7, 12),
      text:'Hi Ayesha, your Premium plan has been renewed. Amount: Rs 1,150.00 charged to your card ending 9082. Your next renewal is next month.' },
    { id:'demo-2', from:'alerts@foodpanda.pk', subject:'Payment confirmed for your order', date:at(0, 13, 45),
      text:'Thanks for ordering! Total amount Rs 2,340 has been charged to your card ending 2210. Order #PK-88214 from Burger King.' },
    { id:'demo-3', from:'no-reply@careem.com', subject:'Your Careem ride receipt', date:at(1, 8, 30),
      text:'Ride completed. Total charged: Rs 685 to your card ending 4417. Captain Imran, Toyota Corolla.' },
    { id:'demo-4', from:'service@icloud.com', subject:'Your iCloud+ subscription receipt', date:at(1, 6, 5),
      text:'Your iCloud+ 200GB plan renewed. Rs 999.00 was charged to your card ending 9082.' },
    { id:'demo-5', from:'notifications@daraz.pk', subject:'Order delivered — payment summary', date:at(2, 19, 20),
      text:'Your order has been delivered. Total paid Rs 4,280 via card ending 4417. Order #DRZ-55190.' },
    { id:'demo-6', from:'billing@stormfiber.com', subject:'Invoice for your internet plan', date:at(2, 10, 0),
      text:'Dear customer, your monthly invoice of Rs 4,800 is now available. Amount will be debited from card ending 4417 on the 3rd.' },
    { id:'demo-7', from:'no-reply@spotify.com', subject:'Spotify Premium — payment received', date:at(3, 7, 40),
      text:'Payment received. Rs 1,190.00 charged to card ending 9082 for your individual Premium plan.' },
    { id:'demo-8', from:'security@meezanbank.com', subject:'Your verification code', date:at(0, 11, 2),
      text:'Your one time password (OTP) is 481920. Do not share this code with anyone.' },
    { id:'demo-9', from:'alerts@uber.com', subject:'Your trip with Uber', date:at(4, 22, 15),
      text:'Trip total: Rs 1,120. Charged to your card ending 2210. Thanks for riding.' },
    { id:'demo-10', from:'orders@adobe.com', subject:'Your Adobe Creative Cloud renewal', date:at(5, 9, 25),
      text:'Your Creative Cloud plan renewed. Amount USD 8.99 has been charged to your card ending 9082.' },
    { id:'demo-11', from:'care@imtiaz.com.pk', subject:'Your Imtiaz invoice', date:at(0, 17, 50),
      text:'Invoice total Rs 8,640 paid at counter. Card ending 9082. Thank you for shopping.' },
    { id:'demo-12', from:'no-reply@daraz.pk', subject:'Refund processed for order #DRZ-44120', date:at(1, 12, 10),
      text:'A refund of Rs 3,500 has been credited back to your card ending 9082.' }
  ];
}

/* seeded smooth area path */
function areaSpark(values, w, h, close) {
  const max = Math.max.apply(null, values.concat([1]));
  const min = Math.min.apply(null, values.concat([0]));
  const span = Math.max(1, max - min);
  const pts = values.map((v, i) => [
    (i / Math.max(1, values.length - 1)) * w,
    h - 4 - ((v - min) / span) * (h - 10)
  ]);
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i], p1 = pts[i + 1];
    const cx = (p0[0] + p1[0]) / 2;
    d += ` C ${cx.toFixed(2)} ${p0[1].toFixed(2)}, ${cx.toFixed(2)} ${p1[1].toFixed(2)}, ${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`;
  }
  if (close) d += ` L ${w} ${h} L 0 ${h} Z`;
  return d;
}
