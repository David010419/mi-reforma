'use strict';
/* =========================================================
   Resumen (dashboard) y Ajustes (incluye sincronización GitHub)
   ========================================================= */
const Dashboard = (() => {
  let root;
  function init() {
    root = $('#view-resumen');
    root.addEventListener('click', (e) => {
      const p = e.target.closest('[data-plan-id]');
      if (p) {
        e.stopPropagation();
        Store.state.activePlan = p.dataset.planId;
        Store.save();
        if (p.dataset.openPlan) location.hash = '#plano';
        else render();
        return;
      }
      const a = e.target.closest('[data-open]'); if (a) { App.openTask(a.dataset.open); return; }
      const g = e.target.closest('[data-go]'); if (g) location.hash = g.dataset.go;
    });
  }

  function ring(p) {
    const r = 42, c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 100 100" class="ring"><circle cx="50" cy="50" r="${r}" class="ring-bg"/><circle cx="50" cy="50" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 50 50)"/><text x="50" y="50" text-anchor="middle" dominant-baseline="central">${Math.round(p * 100)}%</text></svg>`;
  }

  function render() {
    const s = Store.state, tasks = s.tasks, P = s.project;
    const done = tasks.filter((t) => t.status === 'hecho');
    const open = tasks.filter((t) => t.status !== 'hecho');
    const subT = tasks.reduce((a, t) => a + t.subtasks.length, 0), subD = tasks.reduce((a, t) => a + t.subtasks.filter((x) => x.done).length, 0);
    const prog = tasks.length ? done.length / tasks.length : 0;
    const inProg = tasks.filter((t) => t.status === 'en_curso').length;
    const blocked = tasks.filter((t) => t.status === 'bloqueada').length;
    const overdue = open.filter((t) => t.due && daysUntil(t.due) < 0);
    const week = open.filter((t) => t.due && daysUntil(t.due) >= 0 && daysUntil(t.due) <= 7);
    const upcoming = open.filter((t) => t.due).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 7);

    // Gastos reales desde el módulo de Gastos (o fallback a tareas si aún no hay gastos)
    const exp = Expenses.totals();
    const useExp = exp.count > 0;
    const est = useExp ? exp.total : tasks.reduce((a, t) => a + (+t.costEst || 0), 0);
    const real = useExp ? exp.paid : tasks.reduce((a, t) => a + (+t.costReal || 0), 0);
    const forecast = useExp ? exp.total : tasks.reduce((a, t) => a + (+t.costReal || +t.costEst || 0), 0);
    const budget = +P.budget || 0;
    const dEnd = P.end ? daysUntil(P.end) : null;
    const totalDays = P.start && P.end ? Math.max(1, daysUntil(P.end) - daysUntil(P.start)) : null;
    const elapsed = P.start && P.end ? clamp(-daysUntil(P.start) / totalDays, 0, 1) : null;

    const cats = {};
    tasks.forEach((t) => {
      const c = cats[t.category] = cats[t.category] || { n: 0, d: 0, est: 0, real: 0 };
      c.n++; if (t.status === 'hecho') c.d++; c.est += +t.costEst || 0; c.real += +t.costReal || 0;
    });
    if (useExp) {
      (s.expenses || []).forEach((e) => {
        if (String(e.status || '').toLowerCase() === 'cancelado') return;
        const cat = e.category || 'General';
        const c = cats[cat] = cats[cat] || { n: 0, d: 0, est: 0, real: 0 };
        c.real += num(e.amount, 0);
      });
    }
    const catRows = Object.entries(cats).sort((a, b) => (b[1].real || b[1].n) - (a[1].real || a[1].n));
    const comments = tasks.flatMap((t) => t.comments.map((c) => ({ t, c }))).sort((a, b) => b.c.date - a.c.date).slice(0, 5);
    const pl = s.plans.find((p) => p.id === s.activePlan) || s.plans[0];
    const ps = Plan.stats(pl);
    const elec = Object.entries(ps.syms).filter(([k]) => (Plan.SYMBOLS[k] || {}).group === 'elec').reduce((a, [, n]) => a + n, 0);
    const water = Object.entries(ps.syms).filter(([k]) => (Plan.SYMBOLS[k] || {}).group === 'fonta').reduce((a, [, n]) => a + n, 0);
    const budgetBase = Math.max(budget, forecast, 1);

    root.innerHTML = `
      <header class="view-head">
        <div>
          <h1>${esc(P.name || 'Mi reforma')}</h1>
          <p class="sub">${[P.address && `${icon('pin', 14)} ${esc(P.address)}`, P.start && `${icon('calendar', 14)} ${fmtDate(P.start, true)}${P.end ? ' → ' + fmtDate(P.end, true) : ''}`].filter(Boolean).join('<span class="sep">·</span>') || 'Configura los datos de tu obra en <a href="#ajustes">Ajustes</a>'}</p>
        </div>
        <div class="head-actions">
          <button class="btn" data-go="#gastos">${icon('euro', 16)}<span>Gastos</span></button>
          <button class="btn" data-go="#plano">${icon('plan', 16)}<span>Planos</span></button>
          <button class="btn primary" data-go="#tareas">${icon('tasks', 16)}<span>Tareas</span></button>
        </div>
      </header>

      <div class="kpis">
        <div class="card kpi hero">
          ${ring(prog)}
          <div>
            <div class="kpi-lbl">Progreso general</div>
            <div class="kpi-val">${done.length}<small> / ${tasks.length} tareas</small></div>
            <div class="kpi-sub">${subT ? `${subD} de ${subT} subtareas completadas` : 'Añade subtareas para más detalle'}</div>
          </div>
        </div>
        <div class="card kpi" data-go="#tareas"><div class="kpi-ic" style="--c:#3b82f6">${icon('trend', 20)}</div><div><div class="kpi-val">${inProg}</div><div class="kpi-lbl">En curso${blocked ? ` · <span class="danger-txt">${blocked} bloqueada${blocked > 1 ? 's' : ''}</span>` : ''}</div></div></div>
        <div class="card kpi" data-go="#tareas"><div class="kpi-ic" style="--c:#ef4444">${icon('alert', 20)}</div><div><div class="kpi-val">${overdue.length}</div><div class="kpi-lbl">Vencidas</div></div></div>
        <div class="card kpi" data-go="#tareas"><div class="kpi-ic" style="--c:#f59e0b">${icon('clock', 20)}</div><div><div class="kpi-val">${week.length}</div><div class="kpi-lbl">Vencen en 7 días</div></div></div>
        <div class="card kpi"><div class="kpi-ic" style="--c:#10b981">${icon('calendar', 20)}</div><div><div class="kpi-val">${dEnd === null ? '—' : dEnd}</div><div class="kpi-lbl">${dEnd === null ? 'Sin fecha de fin' : dEnd >= 0 ? 'Días para terminar' : 'Días de retraso'}</div>
          ${elapsed !== null ? `<div class="progress sm" title="Tiempo transcurrido"><i style="width:${elapsed * 100}%"></i></div>` : ''}</div></div>
      </div>

      <div class="dash-grid">
        <section class="card dcard budget">
          <header><h3>${icon('euro', 18)} Presupuesto y gastos</h3><a href="#gastos" class="muted small">Ver gastos →</a></header>
          <div class="money-row">
            <div><span>Presupuesto</span><b>${budget ? fmtMoney(budget) : '—'}</b></div>
            <div><span>${useExp ? 'Comprometido' : 'Estimado'}</span><b>${fmtMoney(est)}</b></div>
            <div><span>Pagado</span><b class="accent-txt">${fmtMoney(real)}</b></div>
            <div><span>${budget ? (budget - forecast >= 0 ? 'Restante' : 'Desvío') : 'Total'}</span><b class="${budget && budget - forecast < 0 ? 'danger-txt' : 'ok-txt'}">${budget ? fmtMoney(Math.abs(budget - forecast)) : fmtMoney(forecast)}</b></div>
          </div>
          <div class="stack-bar" title="Pagado / pendiente / presupuesto">
            <i class="sb-real" style="width:${(real / budgetBase) * 100}%"></i>
            <i class="sb-fore" style="width:${(Math.max(0, forecast - real) / budgetBase) * 100}%"></i>
            ${budget ? `<em class="sb-mark" style="left:${(budget / budgetBase) * 100}%"></em>` : ''}
          </div>
          <div class="legend"><span><i class="lg-real"></i>Pagado</span><span><i class="lg-fore"></i>Pendiente</span>${budget ? '<span><i class="lg-mark"></i>Presupuesto</span>' : ''}</div>
        </section>

        <section class="card dcard">
          <header><h3>${icon('calendar', 18)} Próximas fechas</h3></header>
          ${upcoming.length ? `<div class="up-list">${upcoming.map((t) => { const d = daysUntil(t.due); return `
            <button class="up-item" data-open="${t.id}">
              <span class="up-date ${d < 0 ? 'danger' : d <= 3 ? 'warn' : ''}"><b>${new Date(t.due + 'T00:00').getDate()}</b><small>${new Date(t.due + 'T00:00').toLocaleDateString('es-ES', { month: 'short' })}</small></span>
              <span class="up-main"><span class="up-title">${esc(t.title)}</span><span class="up-meta"><i style="--c:${catColor(t.category)}"></i>${esc(t.category)} · ${relDue(t.due)}</span></span>
            </button>`; }).join('')}</div>` : '<p class="muted empty-sm">No hay tareas con fecha límite pendientes.</p>'}
        </section>

        <section class="card dcard plan-card" data-go="#plano">
          <header>
            <h3>${icon('plan', 18)} ${esc(pl.name)}</h3>
            <span class="scope-badge ${pl.scope === 'exterior' ? 'ext' : ''}">${pl.scope === 'exterior' ? 'Exterior' : 'Interior'}</span>
          </header>
          ${s.plans.length > 1 ? `<div class="plan-pills">${s.plans.map((p) => `<button class="plan-pill ${p.id === pl.id ? 'on' : ''}" data-plan-id="${p.id}">${esc(p.level || p.name)}</button>`).join('')}</div>` : ''}
          <div class="thumb">${Plan.thumb(pl, 520, 300)}</div>
          <div class="mini-stats">
            <div><b>${fmtNum(ps.area)} m²</b><span>Superficie</span></div>
            <div><b>${ps.rooms.length}</b><span>Zonas</span></div>
            <div><b>${elec}</b><span>Eléctricos</span></div>
            <div><b>${water}</b><span>Agua</span></div>
          </div>
        </section>

        <section class="card dcard span2">
          <header><h3>${icon('layers', 18)} Avance y gasto por categoría</h3></header>
          ${catRows.length ? `<div class="cat-table">
            <div class="ct-head"><span>Categoría</span><span>Avance tareas</span><span>Estimado</span><span>Gastado</span></div>
            ${catRows.map(([k, c]) => `<div class="ct-row">
              <span class="ct-name"><i style="--c:${catColor(k)}"></i>${esc(k)}</span>
              <span class="ct-prog"><span class="progress sm"><i style="width:${c.n ? (c.d / c.n) * 100 : 0}%;background:${catColor(k)}"></i></span><small>${c.d}/${c.n}</small></span>
              <span>${c.est ? fmtMoney(c.est) : '—'}</span><span>${c.real ? fmtMoney(c.real) : '—'}</span>
            </div>`).join('')}
          </div>` : '<p class="muted empty-sm">Sin tareas ni gastos todavía.</p>'}
        </section>

        <section class="card dcard">
          <header><h3>${icon('message', 18)} Últimos comentarios</h3></header>
          ${comments.length ? `<div class="act-list">${comments.map(({ t, c }) => `
            <button class="act-item" data-open="${t.id}">
              <span class="act-title">${esc(t.title)}</span>
              <span class="act-text">${esc(c.text)}</span>
              <span class="act-date">${fmtDateTime(c.date)}</span>
            </button>`).join('')}</div>` : '<p class="muted empty-sm">Los comentarios de las tareas aparecerán aquí.</p>'}
        </section>
      </div>`;
  }
  return { init, show: render, render };
})();

const Settings = (() => {
  let root;
  const S = () => Store.state;

  function init() {
    root = $('#view-ajustes');
    root.addEventListener('input', (e) => {
      const gh = e.target.dataset.gh;
      if (gh) {
        GitHubSync.saveCfg({ [gh]: e.target.type === 'checkbox' ? e.target.checked : e.target.value.trim() });
        return;
      }
      const k = e.target.dataset.s; if (!k) return;
      const [a, b] = k.split('.');
      S()[a][b] = e.target.type === 'number' ? Math.max(0, num(e.target.value)) : e.target.value;
      Store.save();
      if (k === 'settings.theme') App.applyTheme();
    });
    root.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.gh === 'auto') { GitHubSync.saveCfg({ auto: t.checked }); return; }
      if (t.dataset.cat !== undefined) {
        const i = +t.dataset.cat, old = S().categories[i], nv = t.value.trim();
        if (!nv || (nv !== old && S().categories.includes(nv))) { t.value = old; toast('Nombre no válido o repetido', 'warn'); return; }
        S().categories[i] = nv;
        S().tasks.forEach((x) => { if (x.category === old) x.category = nv; });
        (S().expenses || []).forEach((x) => { if (x.category === old) x.category = nv; });
        Store.save(); render(); return;
      }
      if (t.id === 'importFile' && t.files[0]) {
        const fr = new FileReader();
        fr.onload = () => {
          const d = safeJSON(fr.result);
          if (!d || !Array.isArray(d.tasks) || !Array.isArray(d.plans)) { toast('El archivo no es una copia válida de Mi Reforma', 'error'); return; }
          if (!confirm('Se reemplazarán TODOS los datos actuales por los del archivo. ¿Continuar?')) return;
          Store.replace(d); location.reload();
        };
        fr.readAsText(t.files[0]);
        t.value = '';
      }
      if (t.dataset.s === 'settings.units' || t.dataset.s === 'settings.planTheme') Plan.refresh();
    });
    root.addEventListener('keydown', (e) => { if (e.target.id === 'newCat' && e.key === 'Enter') addCat(); });
    root.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      switch (b.dataset.a) {
        case 'ghTest': {
          b.disabled = true;
          try {
            const r = await GitHubSync.test();
            toast(`Conectado a <b>${esc(r.fullName)}</b>${r.push ? ' (lectura y escritura OK)' : ' (solo lectura)'}`, r.push ? 'success' : 'warn');
            const pulled = await GitHubSync.pull({ force: true, silent: true });
            if (pulled) {
              toast('Datos descargados automáticamente desde GitHub (evitando sobrescribir con el ejemplo)', 'success');
              render();
            }
          } catch (err) { toast('Error de conexión: ' + esc(err.message), 'error'); }
          b.disabled = false;
          break;
        }
        case 'ghPush': b.disabled = true; await GitHubSync.push({ silent: false }); b.disabled = false; render(); break;
        case 'ghPull': b.disabled = true; await GitHubSync.pull({ force: true, silent: false }); b.disabled = false; render(); break;
        case 'addCat': addCat(); break;
        case 'delCat': {
          const i = +b.dataset.i, c = S().categories[i];
          if (S().categories.length <= 1) { toast('Debe quedar al menos una categoría', 'warn'); return; }
          const n = S().tasks.filter((t) => t.category === c).length;
          const target = S().categories.find((x, j) => j !== i);
          if (n && !confirm(`Hay ${n} tarea(s) en «${c}». Se moverán a «${target}». ¿Continuar?`)) return;
          S().tasks.forEach((t) => { if (t.category === c) t.category = target; });
          S().categories.splice(i, 1); Store.save(); render(); break;
        }
        case 'catUp': { const i = +b.dataset.i; if (i > 0) { const c = S().categories; [c[i - 1], c[i]] = [c[i], c[i - 1]]; Store.save(); render(); } break; }
        case 'export': download(`mi-reforma-copia-${localISO()}.json`, JSON.stringify(S(), null, 2), 'application/json'); toast('Copia de seguridad descargada', 'success'); break;
        case 'import': $('#importFile').click(); break;
        case 'csv': exportCSV(); break;
        case 'pdfReport': Plan.openReportModal(); break;
        case 'sample': if (confirm('Se reemplazarán tus datos por el proyecto de ejemplo. ¿Continuar?')) { Store.replace(sampleState()); location.reload(); } break;
        case 'reset': if (confirm('¿Borrar TODOS los datos y empezar un proyecto vacío? Te recomendamos exportar una copia antes.')) { Store.replace(emptyState()); location.reload(); } break;
      }
    });
  }

  function addCat() {
    const i = $('#newCat'); const v = i.value.trim(); if (!v) return;
    if (S().categories.includes(v)) { toast('Esa categoría ya existe', 'warn'); return; }
    S().categories.push(v); Store.save(); render();
    setTimeout(() => { const n = $('#newCat'); if (n) n.focus(); }, 0);
  }

  function exportCSV() {
    const cols = ['Título', 'Estado', 'Prioridad', 'Categoría', 'Zona', 'Inicio', 'Fecha límite', 'Coste estimado', 'Coste real', 'Proveedor', 'Subtareas', 'Etiquetas', 'Descripción', 'Comentarios'];
    const q = (v) => '"' + String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
    const rows = S().tasks.map((t) => [t.title, Tasks.statusOf(t.status).label, Tasks.prioOf(t.priority).label, t.category, t.zone, t.start, t.due,
      String(t.costEst || 0).replace('.', ','), String(t.costReal || 0).replace('.', ','), t.provider,
      `${t.subtasks.filter((s) => s.done).length}/${t.subtasks.length}`, t.tags.join(', '), t.desc, t.comments.map((c) => c.text).join(' | ')].map(q).join(';'));
    download(`mi-reforma-tareas-${localISO()}.csv`, '\ufeff' + [cols.map(q).join(';'), ...rows].join('\r\n'), 'text/csv;charset=utf-8');
    toast('Tareas exportadas a CSV (Excel)', 'success');
  }

  function render() {
    const s = S(), P = s.project, gh = GitHubSync.cfg;
    const raw = localStorage.getItem(Store.KEY) || '';
    const kb = (raw.length * 2) / 1024;
    const ghOk = GitHubSync.isConfigured();
    root.innerHTML = `
      <header class="view-head"><div><h1>Ajustes</h1><p class="sub">Sincronización en GitHub Pages, datos de la obra, categorías y copias de seguridad</p></div></header>
      <div class="settings-grid">
        <section class="card scard span2">
          <h3>${icon('cloud', 18)} Guardado automático en GitHub (para GitHub Pages)</h3>
          <div class="callout">${icon('info', 18)}
            <div>Al configurar tu repositorio y un <b>Fine-grained Personal Access Token</b> (con permiso solo de <i>Contents: Read and write</i> sobre este repo), cada cambio en tareas, gastos o planos se guarda <b>al instante en <code>${esc(gh.path || 'data/reforma.json')}</code></b> y se sincroniza entre tu móvil y tu ordenador. El token solo se guarda en tu navegador, nunca en el repositorio.</div>
          </div>
          <div class="grid2">
            <label class="field"><span>Usuario / Organización de GitHub</span><input data-gh="owner" value="${esc(gh.owner)}" placeholder="Ej. tu-usuario"></label>
            <label class="field"><span>Nombre del repositorio</span><input data-gh="repo" value="${esc(gh.repo)}" placeholder="Ej. mi-reforma"></label>
            <label class="field"><span>Rama</span><input data-gh="branch" value="${esc(gh.branch)}" placeholder="main"></label>
            <label class="field"><span>Archivo de datos en el repo</span><input data-gh="path" value="${esc(gh.path)}" placeholder="data/reforma.json"></label>
            <label class="field span2"><span>Token de GitHub (Fine-grained PAT)</span><input type="password" data-gh="token" value="${esc(gh.token)}" placeholder="github_pat_…" autocomplete="off"></label>
          </div>
          <label class="chk"><input type="checkbox" data-gh="auto" ${gh.auto ? 'checked' : ''}> Guardar automáticamente en GitHub cada vez que edito</label>
          <div class="gh-actions">
            <button class="btn" data-a="ghTest">${icon('check', 16)} Probar conexión</button>
            <button class="btn primary" data-a="ghPush" ${ghOk ? '' : 'disabled'}>${icon('upload', 16)} Guardar ahora en GitHub</button>
            <button class="btn" data-a="ghPull" ${ghOk ? '' : 'disabled'}>${icon('download', 16)} Cargar desde GitHub</button>
          </div>
          ${GitHubSync.lastError ? `<div class="danger-txt small">Último error: ${esc(GitHubSync.lastError)}</div>` : ''}
          <details class="gh-help">
            <summary>${icon('hint', 15)} Cómo crear el token de GitHub en 1 minuto</summary>
            <ol>
              <li>Entra en <b>GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens</b>.</li>
              <li>Pulsa <b>Generate new token</b>, dale un nombre (p. ej. <i>Mi Reforma</i>) y elige una caducidad.</li>
              <li>En <b>Repository access</b> elige <b>Only select repositories</b> y selecciona únicamente el repositorio de tu reforma.</li>
              <li>En <b>Permissions → Repository permissions</b> busca <b>Contents</b> y ponlo en <b>Read and write</b>.</li>
              <li>Genera el token, cópialo y pégalo arriba (tanto en el ordenador como en el móvil).</li>
            </ol>
          </details>
        </section>

        <section class="card scard">
          <h3>${icon('home', 18)} Proyecto</h3>
          <div class="grid2">
            <label class="field span2"><span>Nombre de la obra</span><input data-s="project.name" value="${esc(P.name)}"></label>
            <label class="field span2"><span>Dirección</span><input data-s="project.address" value="${esc(P.address)}" placeholder="Calle, número, piso…"></label>
            <label class="field"><span>Fecha de inicio</span><input type="date" data-s="project.start" value="${P.start}"></label>
            <label class="field"><span>Fecha de fin prevista</span><input type="date" data-s="project.end" value="${P.end}"></label>
            <label class="field span2"><span>Presupuesto total (€)</span><input type="number" min="0" step="100" data-s="project.budget" value="${P.budget || ''}" placeholder="0"></label>
          </div>
        </section>

        <section class="card scard">
          <h3>${icon('sun', 18)} Apariencia y unidades</h3>
          <div class="grid2">
            <label class="field"><span>Tema de la aplicación</span><select data-s="settings.theme">
              <option value="auto" ${s.settings.theme === 'auto' ? 'selected' : ''}>Automático (sistema)</option>
              <option value="light" ${s.settings.theme === 'light' ? 'selected' : ''}>Claro</option>
              <option value="dark" ${s.settings.theme === 'dark' ? 'selected' : ''}>Oscuro</option></select></label>
            <label class="field"><span>Estilo del plano</span><select data-s="settings.planTheme">
              <option value="paper" ${s.settings.planTheme === 'paper' ? 'selected' : ''}>Papel</option>
              <option value="blueprint" ${s.settings.planTheme === 'blueprint' ? 'selected' : ''}>Blueprint</option>
              <option value="dark" ${s.settings.planTheme === 'dark' ? 'selected' : ''}>Oscuro</option></select></label>
            <label class="field span2"><span>Unidades de las cotas</span><select data-s="settings.units">
              <option value="m" ${s.settings.units === 'm' ? 'selected' : ''}>Metros (3,45)</option>
              <option value="cm" ${s.settings.units === 'cm' ? 'selected' : ''}>Centímetros (345)</option>
              <option value="mm" ${s.settings.units === 'mm' ? 'selected' : ''}>Milímetros (3450)</option></select></label>
          </div>
          <p class="muted small">Internamente todo se guarda en centímetros; las unidades solo cambian cómo se muestran las cotas.</p>
        </section>

        <section class="card scard">
          <h3>${icon('tag', 18)} Categorías / partidas</h3>
          <div class="cat-list">${s.categories.map((c, i) => {
            const n = s.tasks.filter((t) => t.category === c).length;
            return `<div class="cat-item"><i style="--c:${catColor(c)}"></i><input data-cat="${i}" value="${esc(c)}"><small>${n}</small>
              <button class="icon-btn sm" data-a="catUp" data-i="${i}" title="Subir" ${i === 0 ? 'disabled' : ''}>${icon('chevron', 15, 'up')}</button>
              <button class="icon-btn sm" data-a="delCat" data-i="${i}" title="Eliminar">${icon('trash', 14)}</button></div>`;
          }).join('')}</div>
          <div class="cat-new"><input class="input" id="newCat" placeholder="Nueva categoría…"><button class="btn sm" data-a="addCat">${icon('plus', 14)} Añadir</button></div>
        </section>

        <section class="card scard">
          <h3>${icon('download', 18)} Informes PDF y copias de seguridad</h3>
          <div class="btn-col">
            <button class="btn primary" data-a="pdfReport">${icon('file', 16)} Generar Memoria Técnica de Planos (PDF)…</button>
            <button class="btn" data-a="export">${icon('download', 16)} Exportar copia completa (.json)</button>
            <button class="btn" data-a="import">${icon('upload', 16)} Importar copia…</button>
            <button class="btn" data-a="csv">${icon('file', 16)} Exportar tareas a Excel (.csv)</button>
            <input type="file" id="importFile" accept=".json,application/json" hidden>
          </div>
          <div class="storage"><span>Espacio usado</span><div class="progress sm"><i style="width:${Math.min(100, (kb / 5000) * 100)}%"></i></div><small>${fmtNum(kb, 1)} KB de ~5 MB</small></div>
          <div class="danger-zone">
            <button class="btn ghost sm" data-a="sample">${icon('rotate', 14)} Cargar proyecto de ejemplo</button>
            <button class="btn danger sm" data-a="reset">${icon('trash', 14)} Borrar todo</button>
          </div>
        </section>
      </div>`;
  }
  return { init, show: render };
})();
