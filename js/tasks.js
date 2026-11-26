'use strict';
/* =========================================================
   Tareas: lista agrupada, tablero kanban, subtareas, comentarios
   ========================================================= */
const Tasks = (() => {
  const STATUS = [
    { id: 'pendiente', label: 'Pendiente', color: '#94a3b8' },
    { id: 'en_curso', label: 'En curso', color: '#3b82f6' },
    { id: 'bloqueada', label: 'Bloqueada', color: '#ef4444' },
    { id: 'hecho', label: 'Hecho', color: '#10b981' },
  ];
  const PRIORITY = [
    { id: 'baja', label: 'Baja', color: '#94a3b8', w: 1 },
    { id: 'media', label: 'Media', color: '#3b82f6', w: 2 },
    { id: 'alta', label: 'Alta', color: '#f59e0b', w: 3 },
    { id: 'urgente', label: 'Urgente', color: '#ef4444', w: 4 },
  ];
  const UIKEY = 'mi-reforma:ui:tasks';
  const ui = Object.assign({ view: 'list', q: '', cat: '', pri: '', status: '', hideDone: false, group: 'category', sort: 'manual', collapsed: {}, expanded: {} }, safeJSON(localStorage.getItem(UIKEY)) || {});
  ui.q = '';
  let root, content, drawer, openId = null, dragId = null, dragSub = null;
  const S = () => Store.state;
  const saveUI = () => localStorage.setItem(UIKEY, JSON.stringify(Object.assign({}, ui, { q: '' })));
  const statusOf = (id) => STATUS.find((s) => s.id === id) || STATUS[0];
  const prioOf = (id) => PRIORITY.find((p) => p.id === id) || PRIORITY[1];
  const byId = (id) => S().tasks.find((t) => t.id === id);
  const isDone = (t) => t.status === 'hecho';
  const scheduleRender = debounce(() => render(), 180);

  function create(data = {}) {
    const t = Object.assign(blankTask(), { category: ui.cat || S().categories[0] || 'General' }, data);
    S().tasks.unshift(t);
    Store.save();
    return t;
  }

  /* ---------- Estructura ---------- */
  function init() {
    root = $('#view-tareas');
    drawer = $('#drawer');
    root.innerHTML = `
      <header class="view-head">
        <div><h1>Tareas</h1><p class="sub" id="tSub"></p></div>
        <div class="head-actions">
          <div class="seg" id="tViewSeg">
            <button data-v="list">${icon('list', 16)}<span>Lista</span></button>
            <button data-v="board">${icon('board', 16)}<span>Tablero</span></button>
            <button data-v="gantt">${icon('gantt', 16)}<span>Cronograma</span></button>
          </div>
          <button class="btn primary" id="tNew">${icon('plus', 16)}<span>Nueva tarea</span></button>
        </div>
      </header>
      <div class="quick-add">
        ${icon('plus', 18)}
        <input id="tQuick" placeholder="Añade una tarea rápida y pulsa Enter…   Atajos: #categoría  !alta  @zona" autocomplete="off">
      </div>
      <div class="toolbar">
        <div class="search">${icon('search', 16)}<input id="tSearch" placeholder="Buscar en títulos, subtareas, comentarios…"></div>
        <select id="tCat" title="Categoría"></select>
        <select id="tPri" title="Prioridad"><option value="">Todas las prioridades</option>${PRIORITY.map((p) => `<option value="${p.id}">${p.label}</option>`).join('')}</select>
        <select id="tStatus" title="Estado"><option value="">Todos los estados</option>${STATUS.map((s) => `<option value="${s.id}">${s.label}</option>`).join('')}</select>
        <select id="tGroup" title="Agrupar">
          <option value="category">Agrupar: categoría</option><option value="zone">Agrupar: zona</option>
          <option value="status">Agrupar: estado</option><option value="priority">Agrupar: prioridad</option><option value="none">Sin agrupar</option>
        </select>
        <select id="tSort" title="Ordenar">
          <option value="manual">Orden: manual</option><option value="due">Orden: fecha límite</option>
          <option value="priority">Orden: prioridad</option><option value="created">Orden: más recientes</option>
        </select>
        <label class="chk"><input type="checkbox" id="tHide"> Ocultar hechas</label>
      </div>
      <div id="tContent"></div>`;
    content = $('#tContent');
    bind();
    bindDrawer();
  }

  function bind() {
    $('#tViewSeg').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      ui.view = b.dataset.v; saveUI(); render();
    });
    $('#tNew').addEventListener('click', () => { const t = create(); render(); open(t.id, true); });
    $('#tQuick').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const v = e.target.value.trim(); if (!v) return;
      const data = parseQuick(v);
      if (!data.title) return;
      create(data);
      e.target.value = '';
      render();
      toast(`Tarea añadida: <b>${esc(data.title)}</b>`, 'success');
    });
    $('#tSearch').addEventListener('input', debounce((e) => { ui.q = e.target.value; render(); }, 120));
    const sel = (id, key) => $(id).addEventListener('change', (e) => { ui[key] = e.target.value; saveUI(); render(); });
    sel('#tCat', 'cat'); sel('#tPri', 'pri'); sel('#tStatus', 'status'); sel('#tGroup', 'group'); sel('#tSort', 'sort');
    $('#tHide').addEventListener('change', (e) => { ui.hideDone = e.target.checked; saveUI(); render(); });

    content.addEventListener('click', onContentClick);
    content.addEventListener('change', (e) => {
      if (e.target.dataset.act === 'subtoggle') {
        const t = byId(e.target.closest('[data-id]').dataset.id);
        const s = t.subtasks.find((x) => x.id === e.target.dataset.sid);
        if (s) { s.done = e.target.checked; t.updated = Date.now(); Store.save(); render(); }
      }
    });
    content.addEventListener('keydown', (e) => {
      if (e.target.dataset.act === 'subadd' && e.key === 'Enter') {
        const v = e.target.value.trim(); if (!v) return;
        const t = byId(e.target.closest('[data-id]').dataset.id);
        t.subtasks.push({ id: uid(), text: v, done: false }); t.updated = Date.now();
        Store.save(); render();
        const inp = content.querySelector(`[data-id="${t.id}"] [data-act="subadd"]`); if (inp) inp.focus();
      }
    });
    // Arrastrar y soltar
    content.addEventListener('dragstart', (e) => {
      const el = e.target.closest('[data-drag]'); if (!el) return;
      dragId = el.closest('[data-id]').dataset.id;
      el.closest('[data-id]').classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', dragId); } catch (err) { /* noop */ }
    });
    content.addEventListener('dragend', () => { dragId = null; $$('.dragging, .drop-over', content).forEach((x) => x.classList.remove('dragging', 'drop-over')); });
    content.addEventListener('dragover', (e) => {
      if (!dragId) return;
      const tgt = e.target.closest('[data-id], [data-group]'); if (!tgt) return;
      e.preventDefault();
      $$('.drop-over', content).forEach((x) => x !== tgt && x.classList.remove('drop-over'));
      tgt.classList.add('drop-over');
    });
    content.addEventListener('drop', (e) => {
      if (!dragId) return;
      e.preventDefault();
      const t = byId(dragId); if (!t) return;
      const taskEl = e.target.closest('[data-id]');
      const grpEl = e.target.closest('[data-group]');
      if (grpEl) applyGroup(t, grpEl.dataset.group, grpEl.dataset.gmode);
      const arr = S().tasks;
      if (taskEl && taskEl.dataset.id !== dragId) {
        arr.splice(arr.indexOf(t), 1);
        const idx = arr.findIndex((x) => x.id === taskEl.dataset.id);
        const r = taskEl.getBoundingClientRect();
        const after = e.clientY > r.top + r.height / 2;
        arr.splice(idx + (after ? 1 : 0), 0, t);
      }
      t.updated = Date.now();
      Store.save(); dragId = null; render();
    });
  }

  function applyGroup(t, key, mode) {
    switch (mode) {
      case 'category': if (key !== '__none') t.category = key; break;
      case 'zone': t.zone = key === '__none' ? '' : key; break;
      case 'status': t.status = key; break;
      case 'priority': t.priority = key; break;
    }
  }

  function onContentClick(e) {
    const a = e.target.closest('[data-act]'); if (!a) return;
    const act = a.dataset.act;
    const host = a.closest('[data-id]');
    const t = host && byId(host.dataset.id);
    switch (act) {
      case 'toggle': if (t) { t.status = isDone(t) ? 'pendiente' : 'hecho'; t.updated = Date.now(); Store.save(); render(); if (isDone(t)) toast('¡Tarea completada! 🎉', 'success'); } break;
      case 'open': if (t) open(t.id); break;
      case 'expand': if (t) { ui.expanded[t.id] = !ui.expanded[t.id]; saveUI(); render(); } break;
      case 'collapse': { const g = a.dataset.key; ui.collapsed[g] = !ui.collapsed[g]; saveUI(); render(); break; }
      case 'coladd': { const nt = create({ status: a.dataset.status }); render(); open(nt.id, true); break; }
      case 'grpadd': { const data = {}; applyGroup(data, a.dataset.key, ui.group); const nt = create(data); render(); open(nt.id, true); break; }
    }
  }

  function parseQuick(str) {
    const data = {};
    let title = str;
    title = title.replace(/(^|\s)#([^\s#!@]+)/g, (m, sp, c) => {
      const q = c.replace(/_/g, ' ').toLowerCase();
      const found = S().categories.find((x) => x.toLowerCase().startsWith(q));
      data.category = found || c.replace(/_/g, ' ');
      if (!found) S().categories.push(data.category);
      return sp;
    });
    title = title.replace(/(^|\s)!(baja|media|alta|urgente)(?=\s|$)/gi, (m, sp, p) => { data.priority = p.toLowerCase(); return sp; });
    title = title.replace(/(^|\s)@([^\s#!@]+)/g, (m, sp, z) => {
      const q = z.replace(/_/g, ' ').toLowerCase();
      const found = Plan.roomNames().find((x) => x.toLowerCase().startsWith(q));
      data.zone = found || z.replace(/_/g, ' ');
      return sp;
    });
    data.title = title.trim().replace(/\s+/g, ' ');
    if (!data.category && ui.cat) data.category = ui.cat;
    return data;
  }

  /* ---------- Filtros y orden ---------- */
  function matches(t, q) {
    return [t.title, t.desc, t.zone, t.provider, t.category, ...t.tags, ...t.subtasks.map((s) => s.text), ...t.comments.map((c) => c.text)]
      .some((x) => String(x || '').toLowerCase().includes(q));
  }
  function filtered() {
    const q = ui.q.toLowerCase().trim();
    return S().tasks.filter((t) => (!ui.cat || t.category === ui.cat) && (!ui.pri || t.priority === ui.pri) && (!ui.status || t.status === ui.status)
      && (!ui.hideDone || !isDone(t)) && (!q || matches(t, q)));
  }
  function sorted(list) {
    const l = [...list];
    if (ui.sort === 'due') l.sort((a, b) => (a.due || '9999') .localeCompare(b.due || '9999'));
    else if (ui.sort === 'priority') l.sort((a, b) => prioOf(b.priority).w - prioOf(a.priority).w);
    else if (ui.sort === 'created') l.sort((a, b) => b.created - a.created);
    return l;
  }

  /* ---------- Render ---------- */
  function syncControls() {
    const cats = S().categories;
    if (ui.cat && !cats.includes(ui.cat)) ui.cat = '';
    $('#tCat').innerHTML = `<option value="">Todas las categorías</option>` + cats.map((c) => `<option ${c === ui.cat ? 'selected' : ''}>${esc(c)}</option>`).join('');
    $('#tPri').value = ui.pri; $('#tStatus').value = ui.status; $('#tGroup').value = ui.group; $('#tSort').value = ui.sort;
    $('#tHide').checked = ui.hideDone;
    $$('#tViewSeg button').forEach((b) => b.classList.toggle('active', b.dataset.v === ui.view));
    root.classList.toggle('board-mode', ui.view === 'board');
  }

  function render() {
    if (!root) return;
    syncControls();
    const all = S().tasks;
    const done = all.filter(isDone).length;
    const overdue = all.filter((t) => !isDone(t) && t.due && daysUntil(t.due) < 0).length;
    $('#tSub').innerHTML = `${done} de ${all.length} completadas${overdue ? ` · <span class="danger-txt">${overdue} vencida${overdue > 1 ? 's' : ''}</span>` : ''}`;
    const list = sorted(filtered());
    if (ui.view === 'board') renderBoard(list);
    else if (ui.view === 'gantt') renderGantt(list);
    else renderList(list);
    if (openId) refreshDrawerMeta();
  }

  function groupKey(t) {
    switch (ui.group) {
      case 'category': return t.category || '__none';
      case 'zone': return t.zone || '__none';
      case 'status': return t.status;
      case 'priority': return t.priority;
      default: return 'all';
    }
  }
  function groupsOrder(list) {
    const keys = [...new Set(list.map(groupKey))];
    switch (ui.group) {
      case 'category': return [...S().categories.filter((c) => keys.includes(c)), ...keys.filter((k) => !S().categories.includes(k))];
      case 'status': return STATUS.map((s) => s.id).filter((k) => keys.includes(k));
      case 'priority': return [...PRIORITY].reverse().map((p) => p.id).filter((k) => keys.includes(k));
      case 'zone': return keys.sort((a, b) => (a === '__none') - (b === '__none') || a.localeCompare(b));
      default: return keys;
    }
  }
  function groupLabel(k) {
    if (k === '__none') return ui.group === 'zone' ? 'Sin zona asignada' : 'Sin categoría';
    if (ui.group === 'status') return statusOf(k).label;
    if (ui.group === 'priority') return 'Prioridad ' + prioOf(k).label.toLowerCase();
    return k;
  }
  function groupColor(k) {
    if (ui.group === 'status') return statusOf(k).color;
    if (ui.group === 'priority') return prioOf(k).color;
    if (k === '__none') return '#94a3b8';
    return catColor(k);
  }

  function renderList(list) {
    if (!list.length) {
      content.innerHTML = emptyState();
      return;
    }
    const keys = groupsOrder(list);
    content.innerHTML = `<div class="groups">${keys.map((k) => {
      const items = list.filter((t) => groupKey(t) === k);
      const d = items.filter(isDone).length;
      const col = ui.collapsed[ui.group + ':' + k];
      const showHead = ui.group !== 'none';
      return `<section class="group card ${col ? 'collapsed' : ''}" data-group="${esc(k)}" data-gmode="${ui.group}" style="--gc:${groupColor(k)}">
        ${showHead ? `<header class="group-head">
          <button class="icon-btn sm" data-act="collapse" data-key="${esc(ui.group + ':' + k)}">${icon('chevron', 16, 'chev')}</button>
          <span class="g-dot"></span><h3>${esc(groupLabel(k))}</h3>
          <span class="g-count">${d}/${items.length}</span>
          <span class="g-bar"><i style="width:${items.length ? (d / items.length) * 100 : 0}%"></i></span>
          <button class="icon-btn sm g-add" data-act="grpadd" data-key="${esc(k)}" title="Añadir tarea aquí">${icon('plus', 16)}</button>
        </header>` : ''}
        <div class="group-body">${col ? '' : items.map(rowHTML).join('')}</div>
      </section>`;
    }).join('')}</div>`;
  }

  function emptyState() {
    const filteredOut = S().tasks.length > 0;
    return `<div class="empty card">${icon(filteredOut ? 'search' : 'tasks', 40)}
      <h3>${filteredOut ? 'Ninguna tarea coincide con los filtros' : 'Aún no hay tareas'}</h3>
      <p>${filteredOut ? 'Prueba a cambiar la búsqueda o los filtros.' : 'Usa el campo de arriba para añadir la primera tarea de tu reforma.'}</p></div>`;
  }

  function metaHTML(t, compact) {
    const done = isDone(t);
    const st = t.subtasks.length, sd = t.subtasks.filter((s) => s.done).length;
    const d = daysUntil(t.due);
    const overdue = !done && d !== null && d < 0;
    const soon = !done && d !== null && d >= 0 && d <= 3;
    const stt = statusOf(t.status);
    const out = [];
    if (!compact && ui.group !== 'status') out.push(`<span class="pill" style="--c:${stt.color}">${stt.label}</span>`);
    if (!compact && ui.group !== 'category') out.push(`<span class="tagc" style="--c:${catColor(t.category)}">${esc(t.category)}</span>`);
    if (t.zone && (compact || ui.group !== 'zone')) out.push(`<span class="meta">${icon('pin', 13)}${esc(t.zone)}</span>`);
    if (t.due) out.push(`<span class="meta ${overdue ? 'danger' : soon ? 'warn' : ''}">${icon('calendar', 13)}${relDue(t.due)}</span>`);
    if (st) out.push(`<span class="meta">${icon('checksq', 13)}${sd}/${st}<span class="mini-bar"><i style="width:${(sd / st) * 100}%"></i></span></span>`);
    if (t.comments.length) out.push(`<span class="meta">${icon('message', 13)}${t.comments.length}</span>`);
    if (t.links.length) out.push(`<span class="meta">${icon('link', 13)}${t.links.length}</span>`);
    if (t.costEst || t.costReal) out.push(`<span class="meta">${icon('euro', 13)}${fmtMoney(t.costReal || t.costEst)}${t.costReal ? '' : ' est.'}</span>`);
    if (t.provider && !compact) out.push(`<span class="meta">${icon('user', 13)}${esc(t.provider)}</span>`);
    t.tags.forEach((g) => out.push(`<span class="hash">#${esc(g)}</span>`));
    return out.join('');
  }

  function rowHTML(t) {
    const done = isDone(t);
    const pr = prioOf(t.priority);
    const exp = ui.expanded[t.id];
    return `<div class="task ${done ? 'done' : ''} ${exp ? 'expanded' : ''}" data-id="${t.id}">
      <div class="task-row" draggable="true" data-drag="1">
        <span class="grip" title="Arrastra para reordenar o cambiar de grupo">${icon('grip', 16)}</span>
        <button class="check ${done ? 'on' : ''}" data-act="toggle" title="${done ? 'Marcar como pendiente' : 'Marcar como hecha'}">${icon('check', 14)}</button>
        <div class="task-main" data-act="open">
          <div class="task-title"><span class="prio-dot" style="--c:${pr.color}" title="Prioridad ${pr.label}"></span><span class="tt">${esc(t.title)}</span></div>
          <div class="task-meta">${metaHTML(t)}</div>
        </div>
        <button class="icon-btn sm expander" data-act="expand" title="Ver subtareas">${icon('chevron', 16)}</button>
      </div>
      ${exp ? `<div class="subs">
        ${t.subtasks.map((s) => `<label class="sub ${s.done ? 'done' : ''}"><input type="checkbox" data-act="subtoggle" data-sid="${s.id}" ${s.done ? 'checked' : ''}><span>${esc(s.text)}</span></label>`).join('')}
        <input class="sub-add" data-act="subadd" placeholder="+ Añadir subtarea y pulsa Enter">
      </div>` : ''}
    </div>`;
  }

  function renderGantt(list) {
    const dated = list.filter((t) => t.start || t.due).map((t) => {
      const s = t.start || t.due;
      const e = t.due || t.start;
      const a = new Date((s <= e ? s : e) + 'T00:00').getTime();
      const b = new Date((s <= e ? e : s) + 'T00:00').getTime();
      return { t, a, b: Math.max(b, a + 86400000) };
    }).sort((x, y) => x.a - y.a);
    const undated = list.filter((t) => !t.start && !t.due);
    if (!dated.length) {
      content.innerHTML = `<div class="empty card">${icon('gantt', 40)}<h3>Sin fechas en el cronograma</h3><p>Añade una fecha de inicio o fecha límite a tus tareas para verlas en la línea temporal.</p></div>`;
      return;
    }
    const today = new Date(localISO() + 'T00:00').getTime();
    const minT = Math.min(today - 3 * 86400000, ...dated.map((x) => x.a)) - 2 * 86400000;
    const maxT = Math.max(today + 10 * 86400000, ...dated.map((x) => x.b)) + 4 * 86400000;
    const span = Math.max(86400000 * 14, maxT - minT);
    const pct = (ts) => clamp(((ts - minT) / span) * 100, 0, 100);
    const ticks = [];
    const stepDays = span / 86400000 > 90 ? 15 : span / 86400000 > 35 ? 7 : 3;
    for (let ts = minT; ts <= maxT; ts += stepDays * 86400000) {
      ticks.push({ p: pct(ts), label: new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) });
    }
    const todayP = pct(today);
    content.innerHTML = `<div class="card gantt-wrap">
      <div class="gantt-scroll">
        <div class="gantt-head">
          <div class="gantt-lbl">Tarea</div>
          <div class="gantt-axis">${ticks.map((k) => `<span style="left:${k.p}%">${k.label}</span>`).join('')}<em class="gantt-today-lbl" style="left:${todayP}%">Hoy</em></div>
        </div>
        <div class="gantt-rows">
          ${dated.map(({ t, a, b }) => {
            const left = pct(a), width = Math.max(1.8, pct(b) - left);
            const col = isDone(t) ? '#10b981' : catColor(t.category);
            return `<div class="gantt-row ${isDone(t) ? 'done' : ''}" data-id="${t.id}" data-act="open">
              <div class="gantt-lbl"><span class="g-dot" style="background:${col}"></span><b>${esc(t.title)}</b><small>${esc(t.category)}</small></div>
              <div class="gantt-track">
                <i class="gantt-today" style="left:${todayP}%"></i>
                <div class="gantt-bar" style="left:${left}%;width:${width}%;--c:${col}" title="${esc(t.title)} (${fmtDate(t.start || t.due)} → ${fmtDate(t.due || t.start)})"><span>${fmtDate(t.due || t.start)}</span></div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
    ${undated.length ? `<div class="card gantt-undated"><h4>Sin fecha asignada (${undated.length})</h4><div class="gu-list">${undated.map((t) => `<button class="plink ${isDone(t) ? 'done' : ''}" data-id="${t.id}" data-act="open"><i style="--c:${catColor(t.category)}"></i>${esc(t.title)}</button>`).join('')}</div></div>` : ''}`;
  }

  function renderBoard(list) {
    content.innerHTML = `<div class="board">${STATUS.map((s) => {
      const items = list.filter((t) => t.status === s.id);
      return `<section class="col" data-group="${s.id}" data-gmode="status" style="--c:${s.color}">
        <header class="col-head"><span class="dot"></span><h3>${s.label}</h3><span class="count">${items.length}</span></header>
        <div class="col-body">${items.map(cardHTML).join('') || '<div class="col-empty">Arrastra tareas aquí</div>'}</div>
        <button class="col-add" data-act="coladd" data-status="${s.id}">${icon('plus', 15)} Añadir tarea</button>
      </section>`;
    }).join('')}</div>`;
  }

  function cardHTML(t) {
    const pr = prioOf(t.priority);
    const st = t.subtasks.length, sd = t.subtasks.filter((x) => x.done).length;
    return `<article class="kcard ${isDone(t) ? 'done' : ''}" data-id="${t.id}" draggable="true" data-drag="1" data-act="open">
      <div class="kc-top">
        <span class="tagc" style="--c:${catColor(t.category)}">${esc(t.category)}</span>
        <span class="pill" style="--c:${pr.color}">${pr.label}</span>
      </div>
      <div class="kc-title">${esc(t.title)}</div>
      ${st ? `<div class="progress sm"><i style="width:${(sd / st) * 100}%"></i></div>` : ''}
      <div class="task-meta">${metaHTML(t, true)}</div>
    </article>`;
  }

  /* ---------- Panel lateral de detalle ---------- */
  function open(id, focusTitle) {
    openId = id;
    renderDrawer();
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    $('#drawerBackdrop').classList.add('show');
    if (focusTitle) setTimeout(() => { const ti = drawer.querySelector('[data-f="title"]'); if (ti) { ti.focus(); ti.select(); } }, 60);
  }
  function close() {
    openId = null;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    $('#drawerBackdrop').classList.remove('show');
    render();
  }

  function opts(list, val) { return list.map((o) => `<option value="${o.id}" ${o.id === val ? 'selected' : ''}>${o.label}</option>`).join(''); }

  function renderDrawer() {
    const t = byId(openId);
    if (!t) { close(); return; }
    const done = isDone(t);
    const zones = Plan.roomNames();
    const cats = S().categories.includes(t.category) ? S().categories : [...S().categories, t.category];
    drawer.innerHTML = `
      <div class="drawer-head">
        <button class="check big ${done ? 'on' : ''}" data-d="toggle" title="Marcar como hecha">${icon('check', 16)}</button>
        <textarea class="title-input" data-f="title" rows="1" placeholder="Título de la tarea">${esc(t.title)}</textarea>
        <button class="icon-btn" data-d="close" title="Cerrar (Esc)">${icon('x', 18)}</button>
      </div>
      <div class="drawer-body">
        <div class="grid2">
          <label class="field"><span>Estado</span><select data-f="status">${opts(STATUS, t.status)}</select></label>
          <label class="field"><span>Prioridad</span><select data-f="priority">${opts(PRIORITY, t.priority)}</select></label>
          <label class="field"><span>Categoría / gremio</span><select data-f="category">${cats.map((c) => `<option ${c === t.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}<option value="__new">+ Nueva categoría…</option></select></label>
          <label class="field"><span>Zona / estancia</span><input data-f="zone" list="zoneList" value="${esc(t.zone)}" placeholder="Ej. Baño"><datalist id="zoneList">${zones.map((z) => `<option value="${esc(z)}">`).join('')}</datalist></label>
          <label class="field"><span>Fecha de inicio</span><input type="date" data-f="start" value="${t.start}"></label>
          <label class="field"><span>Fecha límite</span><input type="date" data-f="due" value="${t.due}"></label>
          <label class="field"><span>Coste estimado (€)</span><input type="number" min="0" step="0.01" data-f="costEst" value="${t.costEst || ''}" placeholder="0"></label>
          <label class="field"><span>Coste real (€)</span><input type="number" min="0" step="0.01" data-f="costReal" value="${t.costReal || ''}" placeholder="0"></label>
          <label class="field span2"><span>Profesional / proveedor / contacto</span><input data-f="provider" value="${esc(t.provider)}" placeholder="Ej. Juan (electricista) · 600 000 000"></label>
          <label class="field span2"><span>Etiquetas (separadas por comas)</span><input data-f="tags" value="${esc(t.tags.join(', '))}" placeholder="presupuesto, urgente, comunidad"></label>
          <label class="field span2"><span>Descripción y notas</span><textarea data-f="desc" rows="4" placeholder="Detalles, medidas, materiales, decisiones…">${esc(t.desc)}</textarea></label>
        </div>

        <section class="dsec">
          <div class="dsec-head"><h3>${icon('checksq', 16)} Subtareas</h3><span class="muted" id="dSubCount"></span></div>
          <div class="progress" id="dSubBar"><i></i></div>
          <div class="sublist">${t.subtasks.map((s) => `
            <div class="subitem ${s.done ? 'done' : ''}" data-sid="${s.id}">
              <span class="grip" draggable="true" title="Arrastra para reordenar">${icon('grip', 14)}</span>
              <input type="checkbox" data-d="subtoggle" ${s.done ? 'checked' : ''}>
              <input class="subtext" data-d="subtext" value="${esc(s.text)}">
              <button class="icon-btn sm" data-d="subdel" title="Eliminar subtarea">${icon('x', 14)}</button>
            </div>`).join('')}</div>
          <input class="input" data-d="subadd" placeholder="+ Añadir subtarea y pulsa Enter">
        </section>

        <section class="dsec">
          <div class="dsec-head"><h3>${icon('link', 16)} Enlaces y referencias</h3></div>
          <div class="links">${t.links.map((l) => `
            <div class="linkitem" data-lid="${l.id}">${icon('link', 14)}<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label || l.url)}</a>
            <button class="icon-btn sm" data-d="ldel" title="Quitar">${icon('x', 14)}</button></div>`).join('') || '<p class="muted small">Guarda aquí enlaces a productos, presupuestos, catálogos…</p>'}</div>
          <div class="link-new">
            <input class="input" data-d="lurl" placeholder="https://…">
            <input class="input" data-d="llabel" placeholder="Descripción (opcional)">
            <button class="btn sm" data-d="ladd">${icon('plus', 14)} Añadir</button>
          </div>
        </section>

        <section class="dsec">
          <div class="dsec-head"><h3>${icon('message', 16)} Comentarios</h3><span class="muted">${t.comments.length}</span></div>
          <div class="comment-new">
            <textarea data-d="ctext" rows="2" placeholder="Escribe un comentario o actualización… (Ctrl+Enter)"></textarea>
            <button class="btn primary sm" data-d="cadd">Comentar</button>
          </div>
          <div class="comments">${[...t.comments].sort((a, b) => b.date - a.date).map((c) => `
            <div class="comment" data-cid="${c.id}">
              <div class="c-head"><span class="c-av">${icon('message', 12)}</span><span class="c-date">${fmtDateTime(c.date)}</span>
              <button class="icon-btn sm" data-d="cdel" title="Eliminar comentario">${icon('trash', 13)}</button></div>
              <div class="c-text">${esc(c.text).replace(/\n/g, '<br>')}</div>
            </div>`).join('')}</div>
        </section>

        <div class="drawer-foot">
          <span class="muted small">Creada ${fmtDateTime(t.created)}<br>Actualizada ${fmtDateTime(t.updated)}</span>
          <div class="df-actions">
            <button class="btn ghost sm" data-d="dup">${icon('copy', 14)} Duplicar</button>
            <button class="btn danger sm" data-d="del">${icon('trash', 14)} Eliminar</button>
          </div>
        </div>
      </div>`;
    autosize(drawer.querySelector('.title-input'));
    refreshDrawerMeta();
  }

  function refreshDrawerMeta() {
    const t = byId(openId); if (!t) return;
    const st = t.subtasks.length, sd = t.subtasks.filter((s) => s.done).length;
    const c = $('#dSubCount'); if (c) c.textContent = st ? `${sd}/${st} · ${Math.round((sd / st) * 100)}%` : '';
    const b = $('#dSubBar i'); if (b) b.style.width = st ? (sd / st) * 100 + '%' : '0%';
    const chk = drawer.querySelector('[data-d="toggle"]'); if (chk) chk.classList.toggle('on', isDone(t));
  }

  function autosize(el) { if (!el) return; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }

  function setField(t, f, v) {
    if (f === 'tags') t.tags = v.split(',').map((x) => x.trim().replace(/^#/, '')).filter(Boolean);
    else if (f === 'costEst' || f === 'costReal') t[f] = Math.max(0, num(v));
    else t[f] = v;
    t.updated = Date.now();
  }

  function bindDrawer() {
    $('#drawerBackdrop').addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && openId) close(); });
    drawer.addEventListener('input', (e) => {
      const f = e.target.dataset.f; if (!f) return;
      const t = byId(openId); if (!t) return;
      if (f === 'title') autosize(e.target);
      if (e.target.tagName === 'SELECT') return;
      setField(t, f, e.target.value);
      Store.save(); scheduleRender();
    });
    drawer.addEventListener('change', (e) => {
      const t = byId(openId); if (!t) return;
      const f = e.target.dataset.f;
      if (f && e.target.tagName === 'SELECT') {
        let v = e.target.value;
        if (f === 'category' && v === '__new') {
          const name = (prompt('Nombre de la nueva categoría:') || '').trim();
          if (!name) { e.target.value = t.category; return; }
          if (!S().categories.includes(name)) S().categories.push(name);
          v = name;
        }
        setField(t, f, v);
        Store.save(); render();
        if (f === 'category') renderDrawer();
        refreshDrawerMeta();
        return;
      }
      const d = e.target.dataset.d;
      const sid = e.target.closest('[data-sid]')?.dataset.sid;
      const s = sid && t.subtasks.find((x) => x.id === sid);
      if (d === 'subtoggle' && s) { s.done = e.target.checked; e.target.closest('.subitem').classList.toggle('done', s.done); }
      if (d === 'subtext' && s) { s.text = e.target.value.trim() || s.text; }
      if (d === 'subtoggle' || d === 'subtext') { t.updated = Date.now(); Store.save(); refreshDrawerMeta(); render(); }
    });
    drawer.addEventListener('keydown', (e) => {
      const d = e.target.dataset.d;
      if (d === 'subadd' && e.key === 'Enter') { e.preventDefault(); addSub(e.target.value); }
      if (d === 'ctext' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addComment(); }
      if ((d === 'lurl' || d === 'llabel') && e.key === 'Enter') { e.preventDefault(); addLink(); }
      if (e.target.dataset.f === 'title' && e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
    });
    drawer.addEventListener('click', (e) => {
      const b = e.target.closest('[data-d]'); if (!b || b.tagName === 'INPUT' || b.tagName === 'TEXTAREA') return;
      const t = byId(openId); if (!t) return;
      const d = b.dataset.d;
      if (d === 'close') return close();
      if (d === 'toggle') { t.status = isDone(t) ? 'pendiente' : 'hecho'; t.updated = Date.now(); Store.save(); renderDrawer(); render(); return; }
      if (d === 'subdel') { const sid = b.closest('[data-sid]').dataset.sid; t.subtasks = t.subtasks.filter((x) => x.id !== sid); Store.save(); renderDrawer(); render(); return; }
      if (d === 'cadd') return addComment();
      if (d === 'cdel') { if (!confirm('¿Eliminar este comentario?')) return; const cid = b.closest('[data-cid]').dataset.cid; t.comments = t.comments.filter((x) => x.id !== cid); Store.save(); renderDrawer(); render(); return; }
      if (d === 'ladd') return addLink();
      if (d === 'ldel') { const lid = b.closest('[data-lid]').dataset.lid; t.links = t.links.filter((x) => x.id !== lid); Store.save(); renderDrawer(); render(); return; }
      if (d === 'dup') {
        const c = clone(t); c.id = uid(); c.title = t.title + ' (copia)'; c.created = c.updated = Date.now();
        c.subtasks.forEach((s) => { s.id = uid(); }); c.comments = [];
        S().tasks.splice(S().tasks.indexOf(t) + 1, 0, c); Store.save(); render(); open(c.id); toast('Tarea duplicada', 'success'); return;
      }
      if (d === 'del') {
        if (!confirm(`¿Eliminar la tarea «${t.title}»? Esta acción no se puede deshacer.`)) return;
        S().tasks = S().tasks.filter((x) => x.id !== t.id); Store.save(); close(); toast('Tarea eliminada'); return;
      }
    });
    // Reordenar subtareas
    drawer.addEventListener('dragstart', (e) => { const it = e.target.closest('.subitem'); if (!it) return; dragSub = it.dataset.sid; it.classList.add('dragging'); try { e.dataTransfer.setData('text/plain', dragSub); } catch (err) { /* noop */ } });
    drawer.addEventListener('dragover', (e) => { if (!dragSub) return; const it = e.target.closest('.subitem'); if (it) { e.preventDefault(); $$('.subitem', drawer).forEach((x) => x.classList.toggle('drop-over', x === it)); } });
    drawer.addEventListener('dragend', () => { dragSub = null; $$('.subitem', drawer).forEach((x) => x.classList.remove('drop-over', 'dragging')); });
    drawer.addEventListener('drop', (e) => {
      if (!dragSub) return; e.preventDefault();
      const it = e.target.closest('.subitem'); const t = byId(openId); if (!it || !t) return;
      const from = t.subtasks.findIndex((x) => x.id === dragSub);
      const [m] = t.subtasks.splice(from, 1);
      const to = t.subtasks.findIndex((x) => x.id === it.dataset.sid);
      const r = it.getBoundingClientRect();
      t.subtasks.splice(to + (e.clientY > r.top + r.height / 2 ? 1 : 0), 0, m);
      dragSub = null; Store.save(); renderDrawer(); render();
    });
  }

  function addSub(text) {
    const t = byId(openId); const v = String(text || '').trim(); if (!t || !v) return;
    t.subtasks.push({ id: uid(), text: v, done: false }); t.updated = Date.now();
    Store.save(); renderDrawer(); render();
    const inp = drawer.querySelector('[data-d="subadd"]'); if (inp) inp.focus();
  }
  function addComment() {
    const t = byId(openId); const ta = drawer.querySelector('[data-d="ctext"]');
    const v = ta && ta.value.trim(); if (!t || !v) return;
    t.comments.push({ id: uid(), text: v, date: Date.now() }); t.updated = Date.now();
    Store.save(); renderDrawer(); render();
  }
  function addLink() {
    const t = byId(openId); let url = (drawer.querySelector('[data-d="lurl"]').value || '').trim();
    const label = (drawer.querySelector('[data-d="llabel"]').value || '').trim();
    if (!t || !url) return;
    if (!/^[a-z]+:\/\//i.test(url)) url = 'https://' + url;
    t.links.push({ id: uid(), url, label }); t.updated = Date.now();
    Store.save(); renderDrawer(); render();
  }

  function show() { render(); }

  return { init, show, render, open, create, STATUS, PRIORITY, statusOf, prioOf };
})();
