'use strict';
/* =========================================================
   Aplicación: arranque, navegación, tema y estado de sincronización
   ========================================================= */
const App = {
  current: null,
  views: { resumen: () => Dashboard, tareas: () => Tasks, gastos: () => Expenses, plano: () => Plan, obra: () => Obra, ajustes: () => Settings },

  init() {
    Store.load();
    this.applyTheme();
    $('#logoIcon').innerHTML = icon('home', 22);
    const mbLogo = $('#mbLogoIcon'); if (mbLogo) mbLogo.innerHTML = icon('home', 16);
    const mbSet = $('#mbSettings'); if (mbSet) mbSet.innerHTML = icon('settings', 19);
    $$('[data-ic]').forEach((el) => { el.outerHTML = icon(el.dataset.ic, 20); });
    Tasks.init(); Expenses.init(); Plan.init(); Obra.init(); Dashboard.init(); Settings.init();

    const onSyncClick = () => {
      if (GitHubSync.isConfigured()) GitHubSync.push({ silent: false });
      else location.hash = '#ajustes';
    };
    $('#saveInd').addEventListener('click', onSyncClick);
    $('#mbSync').addEventListener('click', onSyncClick);

    window.addEventListener('hashchange', () => this.route());
    Store.on((fromRemote) => {
      this.updateChrome();
      if (fromRemote && this.current && this.views[this.current]) {
        this.applyTheme();
        this.views[this.current]().show();
      }
    });
    GitHubSync.on(() => this.updateSyncUI());
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => this.applyTheme());
    this.route();
    this.updateChrome();
    this.updateSyncUI();

    // Sincronización inicial prioritaria al abrir la app (bloquea cualquier auto-push hasta comprobar GitHub)
    GitHubSync.pull({ silent: true, isInitial: true });
  },

  route() {
    let v = location.hash.replace('#', '') || 'resumen';
    if (!this.views[v]) v = 'resumen';
    this.current = v;
    $$('.view').forEach((s) => s.classList.toggle('active', s.id === 'view-' + v));
    $$('#mainNav a').forEach((a) => a.classList.toggle('active', a.dataset.view === v));
    document.body.dataset.view = v;
    this.views[v]().show();
    window.scrollTo(0, 0);
    const mn = $('.main'); if (mn) mn.scrollTop = 0;
  },

  openTask(id) {
    if (this.current !== 'tareas') location.hash = '#tareas';
    setTimeout(() => Tasks.open(id), 40);
  },

  applyTheme() {
    const t = Store.state.settings.theme;
    const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  },

  updateSyncUI() {
    const desk = $('#saveInd'), mob = $('#mbSync');
    const st = GitHubSync.status;
    const cfg = GitHubSync.isConfigured();
    const hm = (ts) => new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    let txt = '', shortTxt = '', cls = '';
    if (cfg) {
      if (st === 'syncing') { txt = `${icon('sync', 13, 'spin')} Guardando en GitHub…`; shortTxt = `${icon('sync', 14, 'spin')} Guardando…`; cls = 'syncing'; }
      else if (st === 'error') { txt = `${icon('cloudOff', 13)} Error GitHub · Reintentar`; shortTxt = `${icon('cloudOff', 14)} Reintentar`; cls = 'error'; }
      else if (st === 'offline') { txt = `${icon('cloudOff', 13)} Sin conexión (local)`; shortTxt = `${icon('cloudOff', 14)} Offline`; cls = 'warn'; }
      else if (GitHubSync.lastSync) { txt = `${icon('cloudOk', 13)} GitHub ${hm(GitHubSync.lastSync)}`; shortTxt = `${icon('cloudOk', 14)} ${hm(GitHubSync.lastSync)}`; cls = 'ok'; }
      else { txt = `${icon('cloud', 13)} GitHub listo`; shortTxt = `${icon('cloud', 14)} GitHub`; cls = 'ok'; }
    } else {
      const t = Store.savedAt ? hm(Store.savedAt) : '';
      txt = `${icon('check', 13)} Local${t ? ' ' + t : ''} · Conectar GitHub`;
      shortTxt = `${icon('cloud', 14)} Conectar GitHub`;
    }
    if (desk) { desk.innerHTML = txt; desk.className = 'save-ind ' + cls; }
    if (mob) { mob.innerHTML = shortTxt; mob.className = 'mb-sync ' + cls; }
  },

  updateChrome() {
    const s = Store.state;
    const pending = s.tasks.filter((t) => t.status !== 'hecho').length;
    const pct = s.tasks.length ? Math.round((s.tasks.filter((t) => t.status === 'hecho').length / s.tasks.length) * 100) : 0;
    const name = s.project.name || 'Mi Reforma';
    $('#brandName').textContent = name;
    const mbt = $('#mbTitle'); if (mbt) mbt.textContent = name;
    document.title = name + ' · Gestor de obra';
    const nb = $('#navBadge'); nb.textContent = pending || ''; nb.style.display = pending ? '' : 'none';
    $('#sfPct').textContent = pct + '%';
    $('#sfBar').style.width = pct + '%';
    this.updateSyncUI();
  },
};

window.addEventListener('error', (e) => { console.error(e.error || e.message); toast('Error: ' + esc(e.message), 'error'); });
document.addEventListener('DOMContentLoaded', () => App.init());
