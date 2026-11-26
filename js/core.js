'use strict';
/* =========================================================
   Núcleo: utilidades, iconos, almacenamiento, GitHub Sync y modales
   ========================================================= */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = (v, d = 0) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : d;
  let s = String(v ?? '').trim().replace(/[€$\s]/g, '');
  if (!s) return d;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : d;
};
const clone = (o) => JSON.parse(JSON.stringify(o));
const safeJSON = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };
const r1 = (v) => Math.round(v * 10) / 10;

function localISO(d = new Date()) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return localISO(d); }
function daysUntil(iso) {
  if (!iso) return null;
  const a = new Date(localISO() + 'T00:00');
  const b = new Date(iso + 'T00:00');
  return Math.round((b - a) / 86400000);
}
const fmtMoney = (n, decimals = 0) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n || 0);
const fmtMoney2 = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtNum = (n, d = 2) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n || 0);
function fmtDate(iso, long) {
  if (!iso) return '';
  const dt = new Date(iso + 'T00:00');
  if (isNaN(dt)) return iso;
  return dt.toLocaleDateString('es-ES', long ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short' });
}
function fmtDateTime(ts) {
  return new Date(ts).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function relDue(iso) {
  const d = daysUntil(iso);
  if (d === null) return '';
  if (d === 0) return 'Hoy';
  if (d === 1) return 'Mañana';
  if (d === -1) return 'Ayer';
  if (d < 0) return `Hace ${-d} días`;
  if (d < 7) return `En ${d} días`;
  return fmtDate(iso);
}

function toast(msg, type = 'info') {
  const host = $('#toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3000);
}
function download(name, data, mime = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

/* ---------- Modal ligero (móvil + escritorio) ---------- */
const Modal = (() => {
  let root, onCloseCb = null;
  function ensure() {
    if (root) return;
    root = $('#modalRoot');
    root.addEventListener('click', (e) => {
      if (e.target === root || e.target.closest('[data-modal-close]')) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root && root.classList.contains('open')) close();
    });
  }
  function open({ title = '', body = '', foot = '', wide = false, onOpen = null, onClose = null } = {}) {
    ensure();
    onCloseCb = onClose;
    root.innerHTML = `<div class="modal-card ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">
      <header class="modal-head"><h3>${title}</h3><button class="icon-btn sm" data-modal-close title="Cerrar">${icon('x', 18)}</button></header>
      <div class="modal-body">${body}</div>
      ${foot ? `<footer class="modal-foot">${foot}</footer>` : ''}
    </div>`;
    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
    if (onOpen) onOpen(root.querySelector('.modal-card'));
  }
  function close() {
    if (!root) return;
    root.classList.remove('open');
    root.setAttribute('aria-hidden', 'true');
    if (onCloseCb) { const cb = onCloseCb; onCloseCb = null; cb(); }
  }
  return { open, close };
})();

const CAT_PALETTE = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6', '#eab308', '#ec4899', '#6366f1', '#84cc16', '#06b6d4', '#a855f7', '#f43f5e'];
function catColor(name) {
  let h = 7;
  for (const c of String(name || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CAT_PALETTE[h % CAT_PALETTE.length];
}

/* ---------- Iconos (SVG en línea) ---------- */
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  tasks: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  plan: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 10h6v11"/><path d="M13 3v8h8"/><path d="M13 15h8"/>',
  settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  home: '<path d="M3 10.5L12 3l9 7.5V21H3z"/><path d="M9 21v-6h6v6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  board: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/>',
  euro: '<path d="M4 10h12M4 14h9M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/>',
  pointer: '<path d="M4 4l7 17 2.5-7.5L21 11z"/>',
  move: '<path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>',
  wall: '<rect x="2" y="9" width="20" height="6" rx="1" fill="currentColor" fill-opacity=".25"/><path d="M7 9v6M12 9v6M17 9v6"/>',
  wallrect: '<rect x="3" y="3" width="18" height="18" rx="1" fill="currentColor" fill-opacity=".25"/><rect x="7" y="7" width="10" height="10"/>',
  roomrect: '<rect x="4" y="4" width="16" height="16" rx="1" stroke-dasharray="3 2.5" fill="currentColor" fill-opacity=".12"/>',
  polygon: '<path d="M12 3l9 7-3 11H6L3 10z" fill="currentColor" fill-opacity=".12"/>',
  door: '<path d="M3 21h18"/><path d="M6 21V5"/><path d="M6 5a16 16 0 0 1 15 16" stroke-dasharray="2.5 2.5"/>',
  window: '<rect x="2" y="9" width="20" height="6"/><path d="M2 12h20"/>',
  dim: '<path d="M3 12h18M3 7v10M21 7v10M7 10l-4 2 4 2M17 10l4 2-4 2"/>',
  text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  sofa: '<path d="M4 18v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6"/><path d="M2 12v6h20v-6"/><path d="M6 10V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/><path d="M5 18v2M19 18v2"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  drop: '<path d="M12 2.7l5.7 5.6a8 8 0 1 1-11.4 0z"/>',
  ruler: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
  zoomin: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/>',
  zoomout: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/>',
  fit: '<path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
  layers: '<path d="M12 2l10 5-10 5L2 7z"/><path d="M2 12l10 5 10-5"/><path d="M2 17l10 5 10-5"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  rotate: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  flag: '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  grip: '<circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  checksq: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12l3 3 5-6"/>',
  alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  magnet: '<path d="M6 3v8a6 6 0 0 0 12 0V3"/><path d="M6 7h4M14 7h4"/>',
  ortho: '<path d="M4 4v16h16"/><path d="M4 14h6v6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
  split: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>',
  flip: '<path d="M12 3v18"/><path d="M8 7l-5 5 5 5zM16 7l5 5-5 5z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  hammer: '<path d="M15 12l-8.5 8.5a2.1 2.1 0 0 1-3-3L12 9"/><path d="M17.6 15L22 10.6 13.4 2 9 6.4z"/>',
  hint: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z"/>',
  cloudOk: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z"/><path d="M9 13.5l2 2 4-4"/>',
  cloudOff: '<path d="M2 2l20 20"/><path d="M17.5 19H9a7 7 0 0 1-1.3-13.9"/><path d="M12 5a7 7 0 0 1 3.7 5h1.8a4.5 4.5 0 0 1 3.7 7"/>',
  sync: '<path d="M21 12a9 9 0 0 0-15.5-6.4L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 15.5 6.4L21 16"/><path d="M21 21v-5h-5"/>',
  table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  tree: '<path d="M12 22v-7"/><path d="M12 3l6 7h-3l4 5H5l4-5H6z"/>',
  receipt: '<path d="M4 2v20l3-2 3 2 2-2 2 2 3-2 3 2V2l-3 2-3-2-2 2-2-2-3 2z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  scale: '<path d="M12 3v18M5 8h14M5 8l-2 7h4l-2-7zm14 0l-2 7h4l-2-7zM8 21h8"/>',
  gantt: '<path d="M3 6h10M7 12h12M5 18h8"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="7" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="18" r="1" fill="currentColor"/>',
  compare: '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="12" y1="2" x2="12" y2="22"/>',
  bank: '<path d="M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M2 18h20M12 3l9 5H3l9-5z"/>',
};
function icon(name, size = 18, cls = '') {
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* ---------- Modelo de datos ---------- */
const DEFAULT_CATS = ['General', 'Trámites', 'Demolición', 'Albañilería', 'Electricidad', 'Fontanería', 'Carpintería', 'Pintura', 'Suelos', 'Cocina', 'Baño', 'Climatización', 'Exterior', 'Mobiliario'];
const PLAN_LEVELS = ['Sótano', 'Planta baja', 'Planta 1', 'Planta 2', 'Buhardilla', 'Cubierta', 'Parcela / Exterior'];

function blankTask() {
  return {
    id: uid(), title: 'Nueva tarea', desc: '', status: 'pendiente', priority: 'media',
    category: 'General', zone: '', start: '', due: '', costEst: 0, costReal: 0, provider: '',
    tags: [], subtasks: [], comments: [], links: [], created: Date.now(), updated: Date.now(),
  };
}

function blankExpense() {
  return {
    id: uid(),
    date: localISO(),
    origin: '',
    category: 'General',
    concept: '',
    amount: 0,
    status: 'Pagado',
    invoice: '',
    remaining: null, // null = calculado automáticamente
    notes: '',
    created: Date.now(),
  };
}

function blankPlan(name = 'Planta baja', level = 'Planta baja', scope = 'interior') {
  return { id: uid(), name, level, scope, bgImage: null, elements: [] };
}

function defaultLoan() {
  return {
    capital: 130000,
    rateCarencia: 3.75,
    totalYears: 30,
    carenciaMonths: 18,
    rateFixed: 2.75,
    fixedMonths: 18,
    euribor: 2.10,
    differential: 0.69,
    dispositions: Array.from({ length: 8 }, (_, i) => ({
      id: uid(),
      name: `Disp. ${i + 1}`,
      date: '',
      milestone: '',
      amount: 0,
    })),
  };
}

function emptyState() {
  const p = blankPlan('Planta baja', 'Planta baja', 'interior');
  return {
    version: 3,
    updatedAt: Date.now(),
    project: { name: 'Mi reforma', address: '', start: '', end: '', budget: 0 },
    settings: { theme: 'auto', units: 'm', planTheme: 'paper' },
    categories: [...DEFAULT_CATS],
    tasks: [],
    expenses: [],
    loan: defaultLoan(),
    diary: [],
    contacts: [],
    materials: [],
    quotes: [],
    plans: [p],
    activePlan: p.id,
  };
}

function samplePlanInterior() {
  const W = (x1, y1, x2, y2, thick = 20, status = 'existente') => ({ id: uid(), type: 'wall', x1, y1, x2, y2, thick, status, height: 260, note: '' });
  const top = W(0, 0, 800, 0), right = W(800, 0, 800, 600), bottom = W(800, 600, 0, 600), left = W(0, 600, 0, 0);
  const mid = W(450, 0, 450, 600, 10), hz = W(450, 330, 800, 330, 10);
  const demo = W(0, 260, 250, 260, 10, 'demoler');
  const nuevo = W(250, 440, 250, 600, 10, 'nuevo');
  const els = [top, right, bottom, left, mid, hz, demo, nuevo];
  const R = (name, points, color, floor) => ({ id: uid(), type: 'room', name, points, color, floor, ceiling: 260, note: '' });
  els.push(R('Salón-cocina', [[10, 10], [445, 10], [445, 590], [10, 590]], '#fde68a', 'Porcelánico 60x60 gris'));
  els.push(R('Dormitorio', [[455, 10], [790, 10], [790, 325], [455, 325]], '#bfdbfe', 'Tarima flotante roble AC5'));
  els.push(R('Baño', [[455, 335], [790, 335], [790, 590], [455, 590]], '#a5f3fc', 'Porcelánico antideslizante C3'));
  const D = (wall, t, width, hinge, side, kind = 'abatible') => ({ id: uid(), type: 'door', wallId: wall.id, t, width, height: 210, kind, hinge, side, note: '' });
  const V = (wall, t, width, height, sill, kind = 'corredera') => ({ id: uid(), type: 'window', wallId: wall.id, t, width, height, sill, kind, note: '' });
  els.push(D(mid, 0.22, 80, 'left', -1), D(mid, 0.68, 70, 'right', -1, 'corredera'), D(bottom, 0.75, 90, 'right', 1));
  els.push(V(top, 0.28, 140, 120, 90), V(top, 0.78, 120, 120, 90, 'oscilobatiente'), V(right, 0.78, 60, 60, 140, 'abatible'));
  const F = (kind, name, w, h, x, y, angle = 0) => ({ id: uid(), type: 'furn', kind, name, w, h, x, y, angle, note: '' });
  els.push(
    F('sofa', 'Sofá', 210, 90, 220, 540, 180), F('mesa', 'Mesa', 160, 90, 230, 360),
    F('encimera', 'Encimera', 240, 60, 40, 135, 270), F('placa', 'Placa', 60, 60, 40, 70, 270), F('fregadero', 'Fregadero', 80, 60, 40, 190, 270),
    F('nevera', 'Frigorífico', 70, 65, 45, 300, 270),
    F('cama', 'Cama 150', 150, 200, 620, 110), F('mesita', 'Mesita', 45, 40, 515, 32), F('mesita', 'Mesita', 45, 40, 725, 32),
    F('armario', 'Armario', 180, 60, 760, 225, 90),
    F('inodoro', 'Inodoro', 40, 65, 520, 557, 180), F('lavabo', 'Lavabo', 60, 45, 620, 567, 180), F('ducha', 'Ducha', 120, 80, 725, 375)
  );
  const S = (kind, x, y, angle, height) => ({ id: uid(), type: 'sym', kind, x, y, angle, height, note: '' });
  els.push(
    S('luz', 228, 300, 0, 260), S('luz', 622, 168, 0, 260), S('luz', 622, 462, 0, 260),
    S('enchufe', 18, 450, 0, 30), S('tv', 300, 582, -90, 30), S('enchufe2', 340, 582, -90, 30),
    S('interruptor', 270, 582, -90, 110), S('cuadro', 120, 582, -90, 180),
    S('enchufe', 505, 18, 90, 30), S('enchufe', 690, 18, 90, 30), S('conmutador', 463, 190, 0, 110),
    S('aguaFria', 605, 582, -90, 55), S('aguaCaliente', 635, 582, -90, 55), S('desague', 725, 375, 0, 0), S('extractor', 560, 400, 0, 240)
  );
  els.push({ id: uid(), type: 'dim', x1: 0, y1: 0, x2: 800, y2: 0, offset: -60, text: '' });
  els.push({ id: uid(), type: 'dim', x1: 0, y1: 600, x2: 0, y2: 0, offset: -60, text: '' });
  els.push({ id: uid(), type: 'text', x: 125, y: 240, text: 'Tabique a demoler', size: 14, color: '' });
  return { id: uid(), name: 'Planta baja – Propuesta', level: 'Planta baja', scope: 'interior', elements: els };
}

function samplePlanExterior() {
  const W = (x1, y1, x2, y2, thick = 20, status = 'existente') => ({ id: uid(), type: 'wall', x1, y1, x2, y2, thick, status, height: 180, note: '' });
  const R = (name, points, color, floor) => ({ id: uid(), type: 'room', name, points, color, floor, ceiling: 0, note: '' });
  const F = (kind, name, w, h, x, y, angle = 0) => ({ id: uid(), type: 'furn', kind, name, w, h, x, y, angle, note: '' });
  const els = [
    W(0, 0, 1200, 0, 20), W(1200, 0, 1200, 800, 20), W(1200, 800, 0, 800, 20), W(0, 800, 0, 0, 20),
    R('Porche / Terraza', [[10, 10], [600, 10], [600, 320], [10, 320]], '#fed7aa', 'Porcelánico exterior C3'),
    R('Jardín', [[10, 325], [1190, 325], [1190, 790], [10, 790]], '#bbf7d0', 'Césped natural'),
    R('Acceso / Garaje', [[605, 10], [1190, 10], [1190, 320], [605, 320]], '#e5e7eb', 'Hormigón impreso'),
    F('piscina', 'Piscina 6×3', 600, 300, 800, 560, 0),
    F('pergola', 'Pérgola', 400, 260, 250, 165, 0),
    F('mesa', 'Mesa exterior', 200, 100, 250, 165, 0),
    F('coche', 'Plaza coche', 450, 200, 900, 165, 0),
    F('arbol', 'Árbol', 140, 140, 150, 620, 0),
    F('barbacoa', 'Barbacoa', 140, 70, 520, 60, 0),
    { id: uid(), type: 'dim', x1: 0, y1: 0, x2: 1200, y2: 0, offset: -65, text: '' },
    { id: uid(), type: 'dim', x1: 0, y1: 800, x2: 0, y2: 0, offset: -65, text: '' },
  ];
  return { id: uid(), name: 'Patio y jardín', level: 'Parcela / Exterior', scope: 'exterior', elements: els };
}

function sampleState() {
  const st = emptyState();
  st.project = { name: 'Reforma de la vivienda', address: 'C/ Ejemplo 12', start: addDays(-10), end: addDays(80), budget: 30000 };
  const T = (title, category, extra = {}) => Object.assign(blankTask(), { title, category }, extra);
  const sub = (text, done = false) => ({ id: uid(), text, done });
  const com = (text, daysAgo = 0) => ({ id: uid(), text, date: Date.now() - daysAgo * 86400000 });
  st.tasks = [
    T('Pedir 3 presupuestos de reforma integral', 'General', { priority: 'urgente', status: 'en_curso', due: addDays(3), subtasks: [sub('Empresa A – Reformas López', true), sub('Empresa B – Construcciones Sur'), sub('Empresa C – autónomo recomendado')], comments: [com('La empresa A viene el jueves a medir.', 1)], tags: ['presupuesto'] }),
    T('Solicitar licencia de obra menor', 'Trámites', { priority: 'alta', status: 'en_curso', due: addDays(7), costEst: 250, subtasks: [sub('Descargar formulario del ayuntamiento', true), sub('Presupuesto firmado por el contratista'), sub('Pagar tasa ICIO')], comments: [com('En el ayuntamiento me dicen que tarda unas 2-3 semanas.', 2)] }),
    T('Demoler tabique entre cocina y salón', 'Demolición', { priority: 'alta', zone: 'Salón-cocina', costEst: 600, start: addDays(20), due: addDays(22), desc: 'Comprobar antes que no es muro de carga.', subtasks: [sub('Confirmar con arquitecto que no es estructural'), sub('Contratar contenedor de escombros')] }),
    T('Nueva instalación eléctrica', 'Electricidad', { priority: 'alta', costEst: 3500, due: addDays(35), subtasks: [sub('Definir puntos de luz y enchufes en el plano', true), sub('Cuadro nuevo con diferenciales por zonas'), sub('Boletín eléctrico (CIE)')], comments: [com('El electricista recomienda 2 circuitos para cocina.', 0)], tags: ['boletín'] }),
    T('Cambiar tomas de agua y desagües del baño', 'Fontanería', { priority: 'media', zone: 'Baño', costEst: 1200, due: addDays(30) }),
    T('Elegir azulejo y plato de ducha', 'Baño', { zone: 'Baño', due: addDays(14), costEst: 900 }),
    T('Pintar toda la vivienda', 'Pintura', { priority: 'baja', costEst: 1500, due: addDays(70) }),
    T('Medir ventanas para presupuesto de carpintería', 'Carpintería', { status: 'hecho', subtasks: [sub('Ventana salón', true), sub('Ventana dormitorio', true), sub('Ventana baño', true)] }),
  ];
  const E = (date, origin, category, concept, amount, status, invoice) => Object.assign(blankExpense(), { date, origin, category, concept, amount, status, invoice });
  st.expenses = [
    E(addDays(-9), 'Disp. 1', 'Trámites', 'Ayuntamiento · Tasa licencia obra menor', 245.5, 'Pagado', 'LIC-2026-014'),
    E(addDays(-5), 'Disp. 1', 'Demolición', 'Contenedores Norte · Contenedor escombros 6m³', 320, 'Pagado', 'FAC-0891'),
    E(addDays(-2), 'Disp. 1', 'Albañilería', 'Reformas López · Señal inicio obra (30%)', 2800, 'Pagado', 'FAC-2026-102'),
    E(addDays(5), 'Disp. 2', 'Electricidad', 'Instalaciones Luz · Material cuadro y cableado', 1450, 'Pendiente', 'PRE-441'),
  ];
  st.loan.dispositions[0].date = addDays(-12);
  st.loan.dispositions[0].milestone = 'Primera disposición · Inicio de obra';
  st.loan.dispositions[0].amount = 15000;
  st.loan.dispositions[1].date = addDays(-1);
  st.loan.dispositions[1].milestone = 'Segunda disposición · Albañilería y carpintería';
  st.loan.dispositions[1].amount = 15000;
  st.contacts = [
    { id: uid(), name: 'Reformas López', role: 'Albañilería', phone: '+34 600 123 456', email: 'lopez@ejemplo.com', notes: 'Encargado de obra principal' },
    { id: uid(), name: 'Carlos (Electricista)', role: 'Electricidad', phone: '+34 611 222 333', email: '', notes: 'Lleva boletín CIE' },
  ];
  st.materials = [
    { id: uid(), name: 'Porcelánico 60×60 gris', zone: 'Salón-cocina', qty: 29.5, unit: 'm²', unitPrice: 28, store: 'Leroy Merlin', ref: 'REF-6060', status: 'Elegido', notes: 'Incluye +10% merma' },
    { id: uid(), name: 'Tarima flotante roble AC5', zone: 'Dormitorio', qty: 12.1, unit: 'm²', unitPrice: 24, store: 'Obramat', ref: 'AC5-ROB', status: 'Pedido', notes: '' },
  ];
  st.quotes = [
    { id: uid(), category: 'Carpintería', provider: 'Ventanas Norte', amount: 4200, days: 25, includes: 'PVC triple vidrio + persianas + instalación', excludes: 'Remates de albañilería', status: 'Elegido', notes: '' },
    { id: uid(), category: 'Carpintería', provider: 'Aluminios Sur', amount: 4850, days: 35, includes: 'Aluminio RPT + instalación', excludes: 'Retirada ventanas viejas', status: 'En estudio', notes: '' },
  ];
  const p1 = samplePlanInterior();
  const p2 = samplePlanExterior();
  st.plans = [p1, p2];
  st.activePlan = p1.id;
  return st;
}

/* ---------- Sincronización con GitHub (API REST Contents) ---------- */
const GitHubSync = (() => {
  const CFG_KEY = 'mi-reforma:gh:v1';
  let cfg = Object.assign({ owner: '', repo: '', branch: 'main', path: 'data/reforma.json', token: '', auto: true }, safeJSON(localStorage.getItem(CFG_KEY)) || {});
  // Autodetección si está publicado en *.github.io/<repo>
  if (!cfg.owner && /\.github\.io$/i.test(location.hostname)) {
    cfg.owner = location.hostname.split('.')[0];
    const seg = location.pathname.split('/').filter(Boolean)[0];
    if (seg && !cfg.repo) cfg.repo = seg;
  }
  let status = 'idle'; // idle | syncing | synced | error | offline
  let lastSync = null;
  let lastError = '';
  let remoteSha = null;
  let timer = null;
  let inFlight = false;
  let queued = false;
  const subs = [];

  const emit = () => subs.forEach((f) => { try { f(); } catch (e) { /* noop */ } });
  const isConfigured = () => !!(cfg.owner && cfg.repo && cfg.token && cfg.path);
  const saveCfg = (next) => {
    cfg = Object.assign({}, cfg, next);
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
    emit();
  };
  const b64Encode = (str) => {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  };
  const b64Decode = (b64) => {
    const bin = atob(b64.replace(/\s/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  };

  function apiUrl() {
    const path = cfg.path.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
    return `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${path}`;
  }
  function headers() {
    const h = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (cfg.token) h.Authorization = 'Bearer ' + cfg.token.trim();
    return h;
  }

  async function fetchRemote() {
    if (!cfg.owner || !cfg.repo || !cfg.path) return null;
    const url = `${apiUrl()}?ref=${encodeURIComponent(cfg.branch || 'main')}&_=${Date.now()}`;
    const res = await fetch(url, { headers: headers(), cache: 'no-store' });
    if (res.status === 404) { remoteSha = null; return { missing: true }; }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const json = await res.json();
    remoteSha = json.sha;
    const data = safeJSON(b64Decode(json.content || ''));
    return { sha: json.sha, data };
  }

  async function pull({ force = false, silent = false } = {}) {
    if (!isConfigured()) {
      // Modo solo lectura si existe ./data/reforma.json publicado en GitHub Pages y no hay datos locales guardados por el usuario
      try {
        const res = await fetch(`${cfg.path}?_=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.plans) && (!Store.hasUserLocal || (data.updatedAt || 0) > (Store.state.updatedAt || 0))) {
            Store.applyRemote(data);
            if (!silent) toast('Datos cargados desde GitHub Pages', 'success');
            return true;
          }
        }
      } catch (e) { /* sin archivo estático */ }
      return false;
    }
    status = 'syncing'; lastError = ''; emit();
    try {
      const r = await fetchRemote();
      if (r && r.missing) {
        status = 'idle'; emit();
        if (!silent) toast('Aún no existe el archivo en el repositorio. Se creará al guardar.', 'info');
        return false;
      }
      if (r && r.data) {
        const remTs = r.data.updatedAt || 0;
        const locTs = Store.state.updatedAt || 0;
        if (force || remTs > locTs) {
          Store.applyRemote(r.data);
          lastSync = Date.now(); status = 'synced'; emit();
          if (!silent) toast('Datos actualizados desde GitHub', 'success');
          return true;
        }
      }
      lastSync = Date.now(); status = 'synced'; emit();
      return false;
    } catch (e) {
      status = navigator.onLine ? 'error' : 'offline';
      lastError = e.message || 'Error de conexión';
      emit();
      if (!silent) toast('Error al leer GitHub: ' + esc(lastError), 'error');
      return false;
    }
  }

  async function push({ silent = false } = {}) {
    if (!isConfigured()) return false;
    if (inFlight) { queued = true; return false; }
    inFlight = true;
    status = 'syncing'; lastError = ''; emit();
    try {
      const attempt = async (retry) => {
        if (!remoteSha) {
          try { await fetchRemote(); } catch (e) { /* puede no existir */ }
        }
        const payload = {
          message: `Actualizar reforma (${new Date().toLocaleString('es-ES')})`,
          content: b64Encode(JSON.stringify(Store.state, null, 2)),
          branch: cfg.branch || 'main',
        };
        if (remoteSha) payload.sha = remoteSha;
        const res = await fetch(apiUrl(), {
          method: 'PUT',
          headers: Object.assign({ 'Content-Type': 'application/json' }, headers()),
          body: JSON.stringify(payload),
        });
        if (res.status === 409 && retry) {
          await fetchRemote();
          return attempt(false);
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || `HTTP ${res.status}`);
        }
        const out = await res.json();
        remoteSha = out.content ? out.content.sha : remoteSha;
      };
      await attempt(true);
      lastSync = Date.now(); status = 'synced'; lastError = '';
      if (!silent) toast('Guardado en GitHub', 'success');
      return true;
    } catch (e) {
      status = navigator.onLine ? 'error' : 'offline';
      lastError = e.message || 'Error al guardar';
      if (!silent) toast('No se pudo guardar en GitHub: ' + esc(lastError), 'error');
      return false;
    } finally {
      inFlight = false;
      emit();
      if (queued) { queued = false; schedulePush(); }
    }
  }

  function schedulePush() {
    if (!isConfigured() || !cfg.auto) return;
    clearTimeout(timer);
    timer = setTimeout(() => push({ silent: true }), 1400);
  }

  async function test() {
    if (!cfg.owner || !cfg.repo || !cfg.token) throw new Error('Rellena usuario, repositorio y token');
    const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`, { headers: headers(), cache: 'no-store' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const repo = await res.json();
    return { fullName: repo.full_name, priv: repo.private, push: !!(repo.permissions && repo.permissions.push) };
  }

  window.addEventListener('online', () => { if (status === 'offline' && isConfigured() && cfg.auto) push({ silent: true }); });

  return {
    get cfg() { return cfg; },
    get status() { return status; },
    get lastSync() { return lastSync; },
    get lastError() { return lastError; },
    isConfigured, saveCfg, pull, push, schedulePush, test,
    on(fn) { subs.push(fn); },
  };
})();

/* ---------- Almacenamiento ---------- */
const Store = {
  KEY: 'mi-reforma:data:v1',
  state: null,
  savedAt: null,
  hasUserLocal: false,
  _subs: [],
  _t: null,
  load() {
    const raw = localStorage.getItem(this.KEY);
    const d = raw ? safeJSON(raw) : null;
    this.hasUserLocal = !!d;
    this.state = this.migrate(d || sampleState());
    if (!d) this.saveNow({ sync: false });
  },
  migrate(d) {
    const base = emptyState();
    d = Object.assign({}, base, d || {});
    d.version = 3;
    d.updatedAt = d.updatedAt || Date.now();
    d.project = Object.assign({}, base.project, d.project || {});
    d.settings = Object.assign({}, base.settings, d.settings || {});
    if (!Array.isArray(d.categories) || !d.categories.length) d.categories = [...base.categories];
    d.tasks = (Array.isArray(d.tasks) ? d.tasks : []).map((t) => {
      const n = Object.assign(blankTask(), t);
      ['tags', 'subtasks', 'comments', 'links'].forEach((k) => { if (!Array.isArray(n[k])) n[k] = []; });
      if (n.category && !d.categories.includes(n.category)) d.categories.push(n.category);
      return n;
    });
    d.expenses = (Array.isArray(d.expenses) ? d.expenses : []).map((e) => {
      const n = Object.assign(blankExpense(), e);
      n.amount = num(n.amount, 0);
      n.remaining = (n.remaining === '' || n.remaining === null || n.remaining === undefined) ? null : num(n.remaining, null);
      return n;
    });
    d.loan = Object.assign({}, defaultLoan(), d.loan || {});
    if (!Array.isArray(d.loan.dispositions) || !d.loan.dispositions.length) d.loan.dispositions = defaultLoan().dispositions;
    d.loan.dispositions = d.loan.dispositions.map((x, i) => Object.assign({ id: uid(), name: `Disp. ${i + 1}`, date: '', milestone: '', amount: 0 }, x, { amount: num(x.amount, 0) }));
    ['diary', 'contacts', 'materials', 'quotes'].forEach((k) => { if (!Array.isArray(d[k])) d[k] = []; });
    if (!Array.isArray(d.plans) || !d.plans.length) d.plans = base.plans;
    d.plans.forEach((p) => {
      if (!Array.isArray(p.elements)) p.elements = [];
      if (!p.id) p.id = uid();
      if (!p.name) p.name = 'Planta';
      if (!p.scope) p.scope = /exterior|patio|jard[ií]n|parcela|terraza/i.test(p.name) ? 'exterior' : 'interior';
      if (!p.level) p.level = p.scope === 'exterior' ? 'Parcela / Exterior' : 'Planta baja';
      if (p.bgImage === undefined) p.bgImage = null;
    });
    if (!d.plans.find((p) => p.id === d.activePlan)) d.activePlan = d.plans[0].id;
    return d;
  },
  applyRemote(data) {
    this.state = this.migrate(data);
    try { localStorage.setItem(this.KEY, JSON.stringify(this.state)); } catch (e) { /* noop */ }
    this.savedAt = Date.now();
    this.emit(true);
  },
  saveNow({ sync = true } = {}) {
    clearTimeout(this._t);
    this._t = null;
    this.state.updatedAt = Date.now();
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.state));
      this.savedAt = Date.now();
      this.hasUserLocal = true;
    } catch (e) {
      toast('No se ha podido guardar: el almacenamiento del navegador está lleno.', 'error');
    }
    this.emit(false);
    if (sync) GitHubSync.schedulePush();
  },
  save() {
    clearTimeout(this._t);
    this._t = setTimeout(() => this.saveNow(), 220);
  },
  replace(data) {
    this.state = this.migrate(data);
    this.saveNow();
  },
  on(fn) { this._subs.push(fn); },
  emit(fromRemote = false) { this._subs.forEach((f) => { try { f(fromRemote); } catch (e) { console.error(e); } }); },
};
window.addEventListener('beforeunload', () => { if (Store._t) Store.saveNow({ sync: false }); });
