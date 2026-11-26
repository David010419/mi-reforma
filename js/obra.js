'use strict';
/* =========================================================
   Obra: Diario con fotos, Contactos/gremios, Materiales y
   Comparador de presupuestos
   ========================================================= */
const Obra = (() => {
  const ui = { tab: 'diary', phase: '', q: '' };
  const PHASES = ['Antes', 'Durante / Rozas', 'Después'];
  const MAT_STATUS = [
    { id: 'Elegido', color: '#3b82f6' },
    { id: 'Pedido', color: '#f59e0b' },
    { id: 'Entregado', color: '#10b981' },
    { id: 'Instalado', color: '#8b5cf6' },
  ];
  const QUOTE_STATUS = [
    { id: 'En estudio', color: '#3b82f6' },
    { id: 'Elegido', color: '#10b981' },
    { id: 'Descartado', color: '#94a3b8' },
  ];
  let root, content;
  const S = () => Store.state;

  function init() {
    root = $('#view-obra');
    root.innerHTML = `
      <header class="view-head">
        <div><h1>Obra</h1><p class="sub" id="oSub"></p></div>
        <div class="head-actions">
          <div class="seg" id="oTabSeg">
            <button data-tab="diary">${icon('camera', 16)}<span>Diario y fotos</span></button>
            <button data-tab="contacts">${icon('phone', 16)}<span>Contactos</span></button>
            <button data-tab="materials">${icon('box', 16)}<span>Materiales</span></button>
            <button data-tab="quotes">${icon('scale', 16)}<span>Presupuestos</span></button>
          </div>
          <button class="btn primary" id="oNew">${icon('plus', 16)}<span id="oNewLbl">Nueva entrada</span></button>
        </div>
      </header>
      <div id="oContent"></div>`;
    content = $('#oContent');
    bind();
  }

  function bind() {
    $('#oTabSeg').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-tab]'); if (!b) return;
      ui.tab = b.dataset.tab; ui.q = ''; render();
    });
    $('#oNew').addEventListener('click', () => {
      if (ui.tab === 'diary') openDiaryModal(null);
      else if (ui.tab === 'contacts') openContactModal(null);
      else if (ui.tab === 'materials') openMaterialModal(null);
      else if (ui.tab === 'quotes') openQuoteModal(null);
    });
    content.addEventListener('input', (e) => {
      if (e.target.id === 'oSearch') { ui.q = e.target.value; renderBody(); }
    });
    content.addEventListener('change', (e) => {
      if (e.target.id === 'oPhase') { ui.phase = e.target.value; renderBody(); }
    });
    content.addEventListener('click', (e) => {
      const b = e.target.closest('[data-oa]'); if (!b) return;
      const act = b.dataset.oa;
      const id = b.closest('[data-id]')?.dataset.id;
      if (act === 'viewPhoto') {
        const it = S().diary.find((x) => x.id === id);
        if (it && it.photo) {
          Modal.open({
            title: esc(it.title || it.zone || 'Foto de obra'),
            wide: true,
            body: `<img src="${it.photo}" alt="" style="width:100%;max-height:70vh;object-fit:contain;border-radius:10px;display:block">
              <p class="muted" style="margin:12px 0 0">${fmtDate(it.date, true)} · ${esc(it.phase || '')}${it.zone ? ' · ' + esc(it.zone) : ''}</p>
              ${it.notes ? `<p style="margin:8px 0 0">${esc(it.notes).replace(/\n/g, '<br>')}</p>` : ''}`,
            foot: `<button class="btn primary" data-modal-close>Cerrar</button>`,
          });
        }
      } else if (act === 'editDiary') { openDiaryModal(S().diary.find((x) => x.id === id)); }
      else if (act === 'delDiary') { if (confirm('¿Eliminar esta entrada del diario?')) { S().diary = S().diary.filter((x) => x.id !== id); Store.save(); render(); } }
      else if (act === 'editContact') { openContactModal(S().contacts.find((x) => x.id === id)); }
      else if (act === 'delContact') { if (confirm('¿Eliminar este contacto?')) { S().contacts = S().contacts.filter((x) => x.id !== id); Store.save(); render(); } }
      else if (act === 'editMat') { openMaterialModal(S().materials.find((x) => x.id === id)); }
      else if (act === 'delMat') { if (confirm('¿Eliminar este material?')) { S().materials = S().materials.filter((x) => x.id !== id); Store.save(); render(); } }
      else if (act === 'cycleMat') {
        const m = S().materials.find((x) => x.id === id); if (!m) return;
        const i = MAT_STATUS.findIndex((s) => s.id === m.status);
        m.status = MAT_STATUS[(i + 1) % MAT_STATUS.length].id;
        Store.save(); render();
      } else if (act === 'fromPlan') { openMaterialsFromPlan(); }
      else if (act === 'editQuote') { openQuoteModal(S().quotes.find((x) => x.id === id)); }
      else if (act === 'delQuote') { if (confirm('¿Eliminar este presupuesto?')) { S().quotes = S().quotes.filter((x) => x.id !== id); Store.save(); render(); } }
      else if (act === 'pickQuote') {
        const q = S().quotes.find((x) => x.id === id); if (!q) return;
        S().quotes.forEach((x) => { if (x.category === q.category) x.status = x.id === q.id ? 'Elegido' : 'Descartado'; });
        Store.save(); render(); toast(`Presupuesto de <b>${esc(q.provider)}</b> marcado como elegido`, 'success');
      }
    });
  }

  function render() {
    if (!root) return;
    $$('#oTabSeg button').forEach((b) => b.classList.toggle('active', b.dataset.tab === ui.tab));
    const labels = { diary: 'Nueva foto / nota', contacts: 'Nuevo contacto', materials: 'Nuevo material', quotes: 'Nuevo presupuesto' };
    const subs = {
      diary: `${S().diary.length} registros · Guarda fotos de rozas, tubos y avances antes de tapar`,
      contacts: `${S().contacts.length} profesionales · Llama o escribe por WhatsApp a un toque`,
      materials: `${S().materials.length} materiales · Total estimado ${fmtMoney2(S().materials.reduce((a, m) => a + num(m.qty) * num(m.unitPrice), 0))}`,
      quotes: `${S().quotes.length} presupuestos para comparar por partida`,
    };
    $('#oNewLbl').textContent = labels[ui.tab];
    $('#oSub').textContent = subs[ui.tab];
    renderBody();
  }

  function renderBody() {
    if (ui.tab === 'diary') renderDiary();
    else if (ui.tab === 'contacts') renderContacts();
    else if (ui.tab === 'materials') renderMaterials();
    else renderQuotes();
  }

  /* ---------- 1. Diario de obra y fotos ---------- */
  function renderDiary() {
    const q = ui.q.toLowerCase().trim();
    const list = [...S().diary].filter((d) => (!ui.phase || d.phase === ui.phase) && (!q || [d.title, d.zone, d.notes, d.phase].some((x) => String(x || '').toLowerCase().includes(q))))
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.created || 0) - (a.created || 0));
    content.innerHTML = `
      <div class="toolbar">
        <div class="search">${icon('search', 16)}<input id="oSearch" value="${esc(ui.q)}" placeholder="Buscar por estancia, título o nota…"></div>
        <select id="oPhase"><option value="">Todas las fases</option>${PHASES.map((p) => `<option ${p === ui.phase ? 'selected' : ''}>${p}</option>`).join('')}</select>
      </div>
      ${list.length ? `<div class="diary-grid">${list.map((d) => `
        <article class="card dentry" data-id="${d.id}">
          ${d.photo ? `<div class="de-photo" data-oa="viewPhoto"><img src="${d.photo}" alt="" loading="lazy"><span class="de-phase">${esc(d.phase || 'Durante')}</span></div>` : `<div class="de-nophoto"><span class="de-phase">${esc(d.phase || 'Nota')}</span></div>`}
          <div class="de-body">
            <div class="de-meta"><span>${fmtDate(d.date, true)}</span>${d.zone ? `<span class="tagc" style="--c:${catColor(d.zone)}">${esc(d.zone)}</span>` : ''}</div>
            <h4>${esc(d.title || 'Sin título')}</h4>
            ${d.notes ? `<p>${esc(d.notes)}</p>` : ''}
            <div class="de-foot">
              <button class="btn sm ghost" data-oa="editDiary">${icon('edit', 14)} Editar</button>
              <button class="btn sm ghost danger-txt" data-oa="delDiary">${icon('trash', 14)}</button>
            </div>
          </div>
        </article>`).join('')}</div>`
        : `<div class="empty card">${icon('camera', 42)}<h3>Diario de obra vacío</h3><p>Haz fotos desde el móvil de las rozas, tuberías, cables y avances antes de cerrar paredes.</p></div>`}`;
  }

  function compressImage(file, maxDim = 1200, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const sc = Math.min(1, maxDim / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => { URL.revokeObjectURL(url); reject(err); };
      img.src = url;
    });
  }

  function openDiaryModal(item) {
    const isNew = !item;
    const d = item ? clone(item) : { id: uid(), date: localISO(), phase: 'Durante / Rozas', zone: '', title: '', notes: '', photo: '', created: Date.now() };
    const zones = Plan.roomNames();
    let photoData = d.photo || '';
    Modal.open({
      title: isNew ? 'Nueva foto / entrada de obra' : 'Editar entrada',
      body: `<form id="diaryForm" class="grid2">
        <label class="field"><span>Fecha</span><input type="date" name="date" value="${esc(d.date)}" required></label>
        <label class="field"><span>Fase</span><select name="phase">${PHASES.map((p) => `<option ${p === d.phase ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
        <label class="field span2"><span>Título</span><input name="title" value="${esc(d.title)}" placeholder="Ej. Rozas electricidad pared TV" required></label>
        <label class="field span2"><span>Estancia / zona</span><input name="zone" list="diaryZones" value="${esc(d.zone)}" placeholder="Ej. Salón-cocina"><datalist id="diaryZones">${zones.map((z) => `<option value="${esc(z)}">`).join('')}</datalist></label>
        <div class="field span2"><span>Foto (cámara o galería)</span>
          <div class="imp-drop">
            <input type="file" id="dPhotoInp" accept="image/*" hidden>
            <button type="button" class="btn" id="dPhotoPick">${icon('camera', 16)} ${photoData ? 'Cambiar foto' : 'Hacer / elegir foto'}</button>
            ${photoData ? `<button type="button" class="btn danger sm" id="dPhotoClear">${icon('trash', 14)} Quitar</button>` : ''}
          </div>
          <div id="dPhotoPrev">${photoData ? `<img src="${photoData}" style="margin-top:8px;max-height:180px;border-radius:10px;display:block">` : ''}</div>
        </div>
        <label class="field span2"><span>Notas</span><textarea name="notes" rows="3" placeholder="Medidas de tubos, altura de cajas, incidencias…">${esc(d.notes)}</textarea></label>
      </form>`,
      foot: `<button class="btn" data-modal-close>Cancelar</button><button class="btn primary" id="dSave">${icon('check', 16)} Guardar</button>`,
      onOpen(card) {
        const inp = $('#dPhotoInp', card), prev = $('#dPhotoPrev', card);
        $('#dPhotoPick', card).addEventListener('click', () => inp.click());
        const clr = $('#dPhotoClear', card);
        if (clr) clr.addEventListener('click', () => { photoData = ''; prev.innerHTML = ''; });
        inp.addEventListener('change', async () => {
          const f = inp.files[0]; if (!f) return;
          try {
            photoData = await compressImage(f, 1200, 0.72);
            prev.innerHTML = `<img src="${photoData}" style="margin-top:8px;max-height:180px;border-radius:10px;display:block">`;
          } catch (e) { toast('No se pudo procesar la foto', 'error'); }
        });
        $('#dSave', card).addEventListener('click', () => {
          const form = $('#diaryForm', card); if (!form.reportValidity()) return;
          const fd = new FormData(form);
          const data = { date: fd.get('date'), phase: fd.get('phase'), title: String(fd.get('title')).trim(), zone: String(fd.get('zone')).trim(), notes: String(fd.get('notes')).trim(), photo: photoData };
          if (isNew) S().diary.unshift(Object.assign(d, data));
          else Object.assign(item, data);
          Store.save(); Modal.close(); render(); toast('Entrada guardada', 'success');
        });
      },
    });
  }

  /* ---------- 2. Contactos y gremios ---------- */
  function renderContacts() {
    const q = ui.q.toLowerCase().trim();
    const list = S().contacts.filter((c) => !q || [c.name, c.role, c.phone, c.email, c.notes].some((x) => String(x || '').toLowerCase().includes(q)));
    content.innerHTML = `
      <div class="toolbar"><div class="search">${icon('search', 16)}<input id="oSearch" value="${esc(ui.q)}" placeholder="Buscar profesional, gremio o teléfono…"></div></div>
      ${list.length ? `<div class="contact-grid">${list.map((c) => {
        const cleanPhone = String(c.phone || '').replace(/[^\d+]/g, '');
        const waPhone = cleanPhone.replace(/^\+/, '');
        return `<article class="card ccard" data-id="${c.id}">
          <div class="cc-head">
            <div><h4>${esc(c.name)}</h4><span class="tagc" style="--c:${catColor(c.role)}">${esc(c.role || 'General')}</span></div>
            <div class="cc-edit">
              <button class="icon-btn sm" data-oa="editContact" title="Editar">${icon('edit', 15)}</button>
              <button class="icon-btn sm" data-oa="delContact" title="Eliminar">${icon('trash', 15)}</button>
            </div>
          </div>
          ${c.phone ? `<div class="cc-info">${icon('phone', 14)} ${esc(c.phone)}</div>` : ''}
          ${c.email ? `<div class="cc-info muted">${esc(c.email)}</div>` : ''}
          ${c.notes ? `<p class="cc-notes">${esc(c.notes)}</p>` : ''}
          ${cleanPhone ? `<div class="cc-actions">
            <a class="btn sm primary" href="tel:${esc(cleanPhone)}">${icon('phone', 14)} Llamar</a>
            <a class="btn sm" href="https://wa.me/${esc(waPhone)}" target="_blank" rel="noopener">${icon('message', 14)} WhatsApp</a>
          </div>` : ''}
        </article>`;
      }).join('')}</div>`
        : `<div class="empty card">${icon('phone', 42)}<h3>Sin contactos todavía</h3><p>Guarda aquí tus gremios, tiendas y técnicos para llamarlos o escribirles por WhatsApp desde el móvil.</p></div>`}`;
  }

  function openContactModal(item) {
    const isNew = !item;
    const c = item ? clone(item) : { id: uid(), name: '', role: 'Albañilería', phone: '', email: '', notes: '' };
    Modal.open({
      title: isNew ? 'Nuevo contacto' : 'Editar contacto',
      body: `<form id="cForm" class="grid2">
        <label class="field"><span>Nombre / Empresa</span><input name="name" value="${esc(c.name)}" required placeholder="Ej. Juan (Fontanero)"></label>
        <label class="field"><span>Gremio / Especialidad</span><input name="role" list="cRoles" value="${esc(c.role)}" placeholder="Ej. Electricidad"><datalist id="cRoles">${S().categories.map((x) => `<option value="${esc(x)}">`).join('')}</datalist></label>
        <label class="field"><span>Teléfono</span><input name="phone" value="${esc(c.phone)}" placeholder="+34 600 000 000"></label>
        <label class="field"><span>Email</span><input name="email" value="${esc(c.email)}" placeholder="correo@ejemplo.com"></label>
        <label class="field span2"><span>Notas</span><textarea name="notes" rows="3" placeholder="Horarios, dirección tienda, condiciones…">${esc(c.notes)}</textarea></label>
      </form>`,
      foot: `<button class="btn" data-modal-close>Cancelar</button><button class="btn primary" id="cSave">${icon('check', 16)} Guardar</button>`,
      onOpen(card) {
        $('#cSave', card).addEventListener('click', () => {
          const form = $('#cForm', card); if (!form.reportValidity()) return;
          const fd = new FormData(form);
          const data = { name: String(fd.get('name')).trim(), role: String(fd.get('role')).trim(), phone: String(fd.get('phone')).trim(), email: String(fd.get('email')).trim(), notes: String(fd.get('notes')).trim() };
          if (isNew) S().contacts.unshift(Object.assign(c, data)); else Object.assign(item, data);
          Store.save(); Modal.close(); render(); toast('Contacto guardado', 'success');
        });
      },
    });
  }

  /* ---------- 3. Materiales y compras (con cálculo desde el plano) ---------- */
  function renderMaterials() {
    const q = ui.q.toLowerCase().trim();
    const list = S().materials.filter((m) => !q || [m.name, m.zone, m.store, m.ref, m.status].some((x) => String(x || '').toLowerCase().includes(q)));
    const stCol = (st) => (MAT_STATUS.find((x) => x.id === st) || MAT_STATUS[0]).color;
    content.innerHTML = `
      <div class="toolbar">
        <div class="search">${icon('search', 16)}<input id="oSearch" value="${esc(ui.q)}" placeholder="Buscar material, estancia, tienda o referencia…"></div>
        <button class="btn" data-oa="fromPlan">${icon('plan', 16)} Calcular desde el plano</button>
      </div>
      ${list.length ? `<div class="card exp-table-wrap"><table class="exp-table">
        <thead><tr><th>Material</th><th>Estancia</th><th class="num">Cantidad</th><th class="num">Precio/ud</th><th class="num">Total</th><th>Tienda / Ref</th><th>Estado</th><th></th></tr></thead>
        <tbody>${list.map((m) => {
          const tot = num(m.qty) * num(m.unitPrice);
          return `<tr data-id="${m.id}">
            <td><b>${esc(m.name)}</b>${m.notes ? `<small style="display:block;color:var(--muted)">${esc(m.notes)}</small>` : ''}</td>
            <td>${esc(m.zone || '—')}</td>
            <td class="num nowrap">${fmtNum(m.qty, 2)} ${esc(m.unit || 'uds')}</td>
            <td class="num nowrap">${fmtMoney2(m.unitPrice)}</td>
            <td class="num nowrap"><b>${fmtMoney2(tot)}</b></td>
            <td>${esc(m.store || '—')}${m.ref ? `<br><span class="mono muted">${esc(m.ref)}</span>` : ''}</td>
            <td><button class="pill pill-btn" data-oa="cycleMat" style="--c:${stCol(m.status)}" title="Pulsa para avanzar estado">${esc(m.status || 'Elegido')}</button></td>
            <td class="act"><button class="icon-btn sm" data-oa="editMat">${icon('edit', 15)}</button><button class="icon-btn sm" data-oa="delMat">${icon('trash', 15)}</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
      <div class="exp-cards">
        ${list.map((m) => {
          const tot = num(m.qty) * num(m.unitPrice);
          return `<article class="card ecard" data-id="${m.id}">
            <div class="ec-top">
              ${m.zone ? `<span class="tagc" style="--c:${catColor(m.zone)}">${esc(m.zone)}</span>` : '<span class="muted small">Sin estancia</span>'}
              <button class="pill pill-btn" data-oa="cycleMat" style="--c:${stCol(m.status)}">${esc(m.status || 'Elegido')}</button>
            </div>
            <div class="ec-main" data-oa="editMat">
              <div class="ec-title">${esc(m.name)}</div>
              <div class="ec-amount">${fmtMoney2(tot)}</div>
            </div>
            <div class="ec-grid">
              <div><span>Cantidad</span><b>${fmtNum(m.qty, 2)} ${esc(m.unit || 'uds')}</b></div>
              <div><span>Precio/ud</span><b>${fmtMoney2(m.unitPrice)}</b></div>
              <div><span>Tienda</span><b>${esc(m.store || '—')}</b></div>
              <div><span>Referencia</span><b class="mono">${esc(m.ref || '—')}</b></div>
            </div>
            <div class="ec-foot">
              <button class="btn sm ghost" data-oa="editMat">${icon('edit', 14)} Editar</button>
              <button class="btn sm ghost danger-txt" data-oa="delMat">${icon('trash', 14)} Eliminar</button>
            </div>
          </article>`;
        }).join('')}
      </div>`
        : `<div class="empty card">${icon('box', 42)}<h3>Sin materiales todavía</h3><p>Añade suelos, pintura, azulejos o sanitarios, o pulsa <b>Calcular desde el plano</b> para traer los m² automáticamente.</p></div>`}`;
  }

  function openMaterialsFromPlan() {
    const rooms = [];
    S().plans.forEach((p) => {
      const st = Plan.stats(p);
      st.rooms.forEach((r) => rooms.push({ planName: p.name, r }));
    });
    if (!rooms.length) { toast('Dibuja primero alguna estancia en el Plano', 'warn'); return; }
    Modal.open({
      title: 'Calcular materiales desde el plano',
      wide: true,
      body: `<p class="muted" style="margin-top:0">Selecciona qué mediciones quieres añadir a tu lista de materiales:</p>
        <div class="plan-calc-list">${rooms.map((x, idx) => `
          <div class="pcalc-row">
            <div><b>${esc(x.r.name || 'Estancia')}</b> <small class="muted">(${esc(x.planName)} · ${fmtNum(x.r.area)} m²)</small></div>
            <div class="pcalc-btns">
              <button class="btn sm" data-add-calc="floor" data-idx="${idx}">+ Suelo (${fmtNum(x.r.area * 1.1)} m² con 10%)</button>
              <button class="btn sm" data-add-calc="skirting" data-idx="${idx}">+ Rodapié (${fmtNum(x.r.perim * 1.1)} m)</button>
              <button class="btn sm" data-add-calc="paint" data-idx="${idx}">+ Paredes (${fmtNum(x.r.perim * (x.r.ceiling / 100))} m²)</button>
            </div>
          </div>`).join('')}</div>`,
      foot: `<button class="btn primary" data-modal-close>Listo</button>`,
      onOpen(card) {
        card.addEventListener('click', (e) => {
          const b = e.target.closest('[data-add-calc]'); if (!b) return;
          const x = rooms[+b.dataset.idx];
          const type = b.dataset.addCalc;
          let item;
          if (type === 'floor') item = { name: x.r.floor || `Suelo ${x.r.name}`, zone: x.r.name, qty: r1(x.r.area * 1.1), unit: 'm²', notes: 'Calculado desde plano (+10% merma)' };
          else if (type === 'skirting') item = { name: `Rodapié ${x.r.name}`, zone: x.r.name, qty: r1(x.r.perim * 1.1), unit: 'm', notes: 'Perímetro +10% merma' };
          else item = { name: `Pintura / revestimiento ${x.r.name}`, zone: x.r.name, qty: r1(x.r.perim * (x.r.ceiling / 100)), unit: 'm²', notes: `Altura techo ${x.r.ceiling} cm` };
          S().materials.unshift(Object.assign({ id: uid(), unitPrice: 0, store: '', ref: '', status: 'Elegido' }, item));
          Store.save(); render(); b.disabled = true; b.textContent = '✓ Añadido';
          toast(`Añadido: <b>${esc(item.name)}</b>`, 'success');
        });
      },
    });
  }

  function openMaterialModal(item) {
    const isNew = !item;
    const m = item ? clone(item) : { id: uid(), name: '', zone: '', qty: 1, unit: 'm²', unitPrice: 0, store: '', ref: '', status: 'Elegido', notes: '' };
    Modal.open({
      title: isNew ? 'Nuevo material' : 'Editar material',
      body: `<form id="mForm" class="grid2">
        <label class="field span2"><span>Material / Producto</span><input name="name" value="${esc(m.name)}" required placeholder="Ej. Porcelánico 60×60 gris"></label>
        <label class="field"><span>Estancia / zona</span><input name="zone" list="mZones" value="${esc(m.zone)}"><datalist id="mZones">${Plan.roomNames().map((z) => `<option value="${esc(z)}">`).join('')}</datalist></label>
        <label class="field"><span>Estado</span><select name="status">${MAT_STATUS.map((s) => `<option ${s.id === m.status ? 'selected' : ''}>${s.id}</option>`).join('')}</select></label>
        <label class="field"><span>Cantidad</span><input type="number" step="0.01" name="qty" value="${m.qty}"></label>
        <label class="field"><span>Unidad</span><input name="unit" value="${esc(m.unit)}" placeholder="m², m, uds, cajas…"></label>
        <label class="field"><span>Precio unitario (€)</span><input type="number" step="0.01" name="unitPrice" value="${m.unitPrice}"></label>
        <label class="field"><span>Tienda</span><input name="store" value="${esc(m.store)}" placeholder="Ej. Leroy Merlin, Obramat…"></label>
        <label class="field span2"><span>Referencia / enlace</span><input name="ref" value="${esc(m.ref)}"></label>
        <label class="field span2"><span>Notas</span><textarea name="notes" rows="2">${esc(m.notes)}</textarea></label>
      </form>`,
      foot: `<button class="btn" data-modal-close>Cancelar</button><button class="btn primary" id="mSave">${icon('check', 16)} Guardar</button>`,
      onOpen(card) {
        $('#mSave', card).addEventListener('click', () => {
          const form = $('#mForm', card); if (!form.reportValidity()) return;
          const fd = new FormData(form);
          const data = { name: String(fd.get('name')).trim(), zone: String(fd.get('zone')).trim(), status: fd.get('status'), qty: num(fd.get('qty'), 1), unit: String(fd.get('unit')).trim() || 'uds', unitPrice: num(fd.get('unitPrice'), 0), store: String(fd.get('store')).trim(), ref: String(fd.get('ref')).trim(), notes: String(fd.get('notes')).trim() };
          if (isNew) S().materials.unshift(Object.assign(m, data)); else Object.assign(item, data);
          Store.save(); Modal.close(); render(); toast('Material guardado', 'success');
        });
      },
    });
  }

  /* ---------- 4. Comparador de presupuestos ---------- */
  function renderQuotes() {
    const groups = new Map();
    S().quotes.forEach((q) => {
      const k = q.category || 'General';
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(q);
    });
    const stCol = (st) => (QUOTE_STATUS.find((x) => x.id === st) || QUOTE_STATUS[0]).color;
    content.innerHTML = groups.size ? [...groups.entries()].map(([cat, items]) => {
      const minAmt = Math.min(...items.map((x) => num(x.amount, Infinity)));
      return `<section class="card qgroup">
        <header class="qg-head"><span class="g-dot" style="background:${catColor(cat)}"></span><h3>${esc(cat)}</h3><span class="muted small">${items.length} presupuesto${items.length === 1 ? '' : 's'}</span></header>
        <div class="quote-grid">${items.map((q) => {
          const best = items.length > 1 && num(q.amount) === minAmt;
          return `<article class="qcard ${q.status === 'Elegido' ? 'chosen' : q.status === 'Descartado' ? 'discarded' : ''}" data-id="${q.id}">
            <div class="qc-top">
              <b>${esc(q.provider)}</b>
              <span class="pill" style="--c:${stCol(q.status)}">${esc(q.status || 'En estudio')}</span>
            </div>
            <div class="qc-price">${fmtMoney2(q.amount)} ${best ? '<span class="best-badge">Más económico</span>' : ''}</div>
            ${q.days ? `<div class="muted small">Plazo estimado: <b>${q.days} días</b></div>` : ''}
            ${q.includes ? `<div class="qc-det"><b>Incluye:</b> ${esc(q.includes)}</div>` : ''}
            ${q.excludes ? `<div class="qc-det warn-txt"><b>No incluye:</b> ${esc(q.excludes)}</div>` : ''}
            <div class="qc-foot">
              ${q.status !== 'Elegido' ? `<button class="btn sm primary" data-oa="pickQuote">${icon('check', 14)} Elegir</button>` : ''}
              <button class="btn sm" data-oa="editQuote">${icon('edit', 14)} Editar</button>
              <button class="icon-btn sm" data-oa="delQuote">${icon('trash', 14)}</button>
            </div>
          </article>`;
        }).join('')}</div>
      </section>`;
    }).join('') : `<div class="empty card">${icon('scale', 42)}<h3>Sin presupuestos para comparar</h3><p>Añade los presupuestos que pidas para cada partida (ventanas, cocina, electricidad…) y compáralos lado a lado.</p></div>`;
  }

  function openQuoteModal(item) {
    const isNew = !item;
    const q = item ? clone(item) : { id: uid(), category: S().categories[0] || 'General', provider: '', amount: 0, days: 0, includes: '', excludes: '', status: 'En estudio', notes: '' };
    Modal.open({
      title: isNew ? 'Nuevo presupuesto' : 'Editar presupuesto',
      body: `<form id="qForm" class="grid2">
        <label class="field"><span>Partida / Categoría</span><input name="category" list="qCats" value="${esc(q.category)}" required><datalist id="qCats">${S().categories.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label>
        <label class="field"><span>Proveedor / Empresa</span><input name="provider" value="${esc(q.provider)}" required placeholder="Ej. Ventanas Norte"></label>
        <label class="field"><span>Importe total (€)</span><input type="number" step="0.01" name="amount" value="${q.amount || ''}" required></label>
        <label class="field"><span>Plazo (días)</span><input type="number" name="days" value="${q.days || ''}"></label>
        <label class="field span2"><span>Estado</span><select name="status">${QUOTE_STATUS.map((s) => `<option ${s.id === q.status ? 'selected' : ''}>${s.id}</option>`).join('')}</select></label>
        <label class="field span2"><span>Qué incluye</span><textarea name="includes" rows="2" placeholder="Materiales, mano de obra, retirada de escombros…">${esc(q.includes)}</textarea></label>
        <label class="field span2"><span>Qué NO incluye</span><textarea name="excludes" rows="2" placeholder="IVA, remates, licencias…">${esc(q.excludes)}</textarea></label>
      </form>`,
      foot: `<button class="btn" data-modal-close>Cancelar</button><button class="btn primary" id="qSave">${icon('check', 16)} Guardar</button>`,
      onOpen(card) {
        $('#qSave', card).addEventListener('click', () => {
          const form = $('#qForm', card); if (!form.reportValidity()) return;
          const fd = new FormData(form);
          const data = { category: String(fd.get('category')).trim() || 'General', provider: String(fd.get('provider')).trim(), amount: num(fd.get('amount'), 0), days: num(fd.get('days'), 0), status: fd.get('status'), includes: String(fd.get('includes')).trim(), excludes: String(fd.get('excludes')).trim() };
          if (isNew) S().quotes.unshift(Object.assign(q, data)); else Object.assign(item, data);
          Store.save(); Modal.close(); render(); toast('Presupuesto guardado', 'success');
        });
      },
    });
  }

  return { init, show: render, render };
})();
