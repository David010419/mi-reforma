'use strict';
/* =========================================================
   Gastos del proyecto + Control Hipoteca Autopromotor (Disposiciones,
   Carencia, Distribución por Partida y Simulador Post-Carencia / Euríbor)
   ========================================================= */
const Expenses = (() => {
  const STATUS = [
    { id: 'Pagado', color: '#10b981' },
    { id: 'Pendiente', color: '#f59e0b' },
    { id: 'Parcial', color: '#3b82f6' },
    { id: 'Previsto', color: '#94a3b8' },
    { id: 'Cancelado', color: '#ef4444' },
  ];
  const HEADERS = [
    'Fecha', 'Disposición / Origen', 'Categoría / Partida',
    'Proveedor / Concepto', 'Importe', 'Estado',
    'Nº Factura / Justificante', 'Restante',
  ];
  const ui = { tab: 'control', q: '', cat: '', origin: '', status: '', sort: 'date_desc' };
  let root, content;
  const S = () => Store.state;
  const L = () => S().loan;
  const statusColor = (st) => (STATUS.find((x) => x.id.toLowerCase() === String(st || '').toLowerCase()) || { color: '#64748b' }).color;
  const fmtPct = (n, d = 1) => fmtNum(n, d) + '%';

  /* ---------- Fórmulas financieras (sistema francés) ---------- */
  function pmt(annualPct, months, principal) {
    if (principal <= 0 || months <= 0) return 0;
    const r = (annualPct / 100) / 12;
    if (r === 0) return principal / months;
    return principal * (r / (1 - Math.pow(1 + r, -months)));
  }
  function remainingBalance(annualPct, totalMonths, paidMonths, principal) {
    if (principal <= 0 || totalMonths <= 0) return 0;
    const n = Math.min(paidMonths, totalMonths);
    const r = (annualPct / 100) / 12;
    if (r === 0) return Math.max(0, principal * (1 - n / totalMonths));
    const q = pmt(annualPct, totalMonths, principal);
    const f = Math.pow(1 + r, n);
    return Math.max(0, principal * f - q * ((f - 1) / r));
  }

  /* Normaliza nombres de disposición para cruzar "Disp. 1", "Disp 1", "Disposición 1" */
  function normDisp(s) {
    const k = String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const m = k.match(/disp(?:osicion|\.)?\s*(\d+)/);
    return m ? 'disp:' + m[1] : k;
  }

  function totals() {
    const list = S().expenses || [];
    let paid = 0, pending = 0, total = 0;
    list.forEach((e) => {
      const a = num(e.amount, 0);
      const st = String(e.status || '').toLowerCase();
      if (st === 'cancelado' || st === 'anulado') return;
      total += a;
      if (st === 'pagado' || st === 'abonado' || st === 'liquidado') paid += a;
      else pending += a;
    });
    const loan = L();
    const dispensed = (loan?.dispositions || []).reduce((a, d) => a + num(d.amount, 0), 0);
    const budget = num(S().project.budget, 0) || num(loan?.capital, 0);
    return { paid, pending, total, budget, dispensed, remaining: budget - paid, remainingAll: budget - total, liquidity: dispensed - paid, count: list.length };
  }

  function withComputedRemaining(list) {
    const budget = num(S().project.budget, 0) || num(L()?.capital, 0);
    const chrono = [...list].sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.created || 0) - (b.created || 0));
    let running = budget;
    const map = new Map();
    chrono.forEach((e) => {
      const st = String(e.status || '').toLowerCase();
      if (st !== 'cancelado' && st !== 'anulado') running -= num(e.amount, 0);
      map.set(e.id, e.remaining !== null && e.remaining !== undefined && e.remaining !== '' ? num(e.remaining, running) : running);
    });
    return map;
  }

  function init() {
    root = $('#view-gastos');
    root.innerHTML = `
      <header class="view-head">
        <div><h1>Gastos e Hipoteca</h1><p class="sub" id="eSub"></p></div>
        <div class="head-actions">
          <div class="seg" id="eTabSeg">
            <button data-tab="control">${icon('bank', 16)}<span>Control Hipoteca</span></button>
            <button data-tab="registro">${icon('receipt', 16)}<span>Registro de Gastos</span></button>
          </div>
          <button class="btn" id="eImport">${icon('upload', 16)}<span>Importar Excel</span></button>
          <button class="btn" id="eExport">${icon('download', 16)}<span>Exportar</span></button>
          <button class="btn primary" id="eNew">${icon('plus', 16)}<span>Nuevo gasto</span></button>
        </div>
      </header>
      <div id="eContent"></div>`;
    content = $('#eContent');
    bind();
  }

  function bind() {
    $('#eTabSeg').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-tab]'); if (!b) return;
      ui.tab = b.dataset.tab; render();
    });
    $('#eNew').addEventListener('click', () => openForm(null));
    $('#eImport').addEventListener('click', openImportModal);
    $('#eExport').addEventListener('click', exportExcel);

    content.addEventListener('input', (e) => {
      const t = e.target;
      if (t.id === 'eSearch') { ui.q = t.value; renderRegistryBody(); return; }
      if (t.dataset.lf) {
        const k = t.dataset.lf;
        L()[k] = Math.max(0, num(t.value, 0));
        if (t.type === 'range') {
          const other = content.querySelector(`input[type="number"][data-lf="${k}"]`);
          if (other) other.value = L()[k];
        } else if (k === 'euribor') {
          const sl = content.querySelector(`input[type="range"][data-lf="euribor"]`);
          if (sl) sl.value = clamp(L()[k], 0, 6);
        }
        Store.save();
        updateControlLive();
        return;
      }
      if (t.dataset.df) {
        const d = L().dispositions.find((x) => x.id === t.closest('[data-did]').dataset.did);
        if (!d) return;
        d[t.dataset.df] = t.dataset.df === 'amount' ? Math.max(0, num(t.value, 0)) : t.value;
        Store.save();
        updateControlLive();
      }
    });

    content.addEventListener('change', (e) => {
      const t = e.target;
      if (t.id === 'eCat') { ui.cat = t.value; render(); }
      else if (t.id === 'eOrigin') { ui.origin = t.value; render(); }
      else if (t.id === 'eStatus') { ui.status = t.value; render(); }
      else if (t.id === 'eSort') { ui.sort = t.value; render(); }
      else if (t.dataset.lf || t.dataset.df) render();
    });

    content.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ea]'); if (!b) return;
      const act = b.dataset.ea;
      const id = b.closest('[data-id]')?.dataset.id;
      const item = (S().expenses || []).find((x) => x.id === id);
      if (act === 'edit' && item) openForm(item);
      else if (act === 'del' && item) {
        if (!confirm(`¿Eliminar el gasto «${item.concept || item.category}» (${fmtMoney2(item.amount)})?`)) return;
        S().expenses = S().expenses.filter((x) => x.id !== id);
        Store.save(); render(); toast('Gasto eliminado');
      } else if (act === 'toggleStatus' && item) {
        item.status = String(item.status).toLowerCase() === 'pagado' ? 'Pendiente' : 'Pagado';
        Store.save(); render();
      } else if (act === 'import') openImportModal();
      else if (act === 'new') openForm(null);
      else if (act === 'addDisp') {
        L().dispositions.push({ id: uid(), name: `Disp. ${L().dispositions.length + 1}`, date: '', milestone: '', amount: 0 });
        Store.save(); render();
      } else if (act === 'delDisp') {
        const did = b.closest('[data-did]').dataset.did;
        if (L().dispositions.length <= 1) return;
        if (!confirm('¿Eliminar esta fila de disposición?')) return;
        L().dispositions = L().dispositions.filter((x) => x.id !== did);
        Store.save(); render();
      } else if (act === 'filterOrigin') {
        ui.origin = b.dataset.val || ''; ui.cat = ''; ui.tab = 'registro'; render();
      } else if (act === 'filterCat') {
        ui.cat = b.dataset.val || ''; ui.origin = ''; ui.tab = 'registro'; render();
      } else if (act === 'goRegistry') {
        ui.tab = 'registro'; render();
      }
    });
  }

  function render() {
    if (!root) return;
    $$('#eTabSeg button').forEach((b) => b.classList.toggle('active', b.dataset.tab === ui.tab));
    const t = totals();
    $('#eSub').innerHTML = `${t.count} gastos · Pagado <b>${fmtMoney2(t.paid)}</b>${t.dispensed ? ` · Dispuesto <b>${fmtMoney2(t.dispensed)}</b>` : ''}`;
    if (ui.tab === 'control') renderControl();
    else renderRegistry();
  }

  /* ---------- Pestaña 1: Control Hipoteca y Disposiciones ---------- */
  function computeLoan() {
    const loan = L();
    const list = (S().expenses || []).filter((e) => !/^(cancelado|anulado)$/i.test(String(e.status || '')));
    const paidTotal = list.filter((e) => /^(pagado|abonado|liquidado)$/i.test(String(e.status || ''))).reduce((a, e) => a + num(e.amount), 0);
    const totalSpent = list.reduce((a, e) => a + num(e.amount), 0);

    // Gastos agrupados por disposición normalizada
    const spentByDisp = new Map();
    list.forEach((e) => {
      const k = normDisp(e.origin);
      spentByDisp.set(k, (spentByDisp.get(k) || 0) + num(e.amount));
    });

    const totalMonths = Math.max(1, Math.round(num(loan.totalYears, 30) * 12));
    const carenciaM = clamp(Math.round(num(loan.carenciaMonths, 18)), 0, totalMonths - 1);
    const amortM = Math.max(1, totalMonths - carenciaM);
    const fixedM = clamp(Math.round(num(loan.fixedMonths, 18)), 0, amortM);
    const varM = Math.max(1, amortM - fixedM);
    const rateCar = num(loan.rateCarencia, 3.75);
    const rateFix = num(loan.rateFixed, 2.75);
    const euribor = num(loan.euribor, 2.10);
    const diff = num(loan.differential, 0.69);
    const rateVar = euribor + diff;
    const capital = num(loan.capital, 0);

    let acc = 0, totalDispSpent = 0;
    const rows = loan.dispositions.map((d) => {
      const amt = num(d.amount, 0);
      acc += amt;
      const spent = spentByDisp.get(normDisp(d.name)) || 0;
      if (amt > 0 || spent > 0) totalDispSpent += spent;
      const cuotaCar = acc * (rateCar / 100) / 12;
      const cuotaFix = pmt(rateFix, amortM, acc);
      const capVivo = remainingBalance(rateFix, amortM, fixedM, acc);
      const cuotaVar = pmt(rateVar, varM, capVivo);
      return {
        d, amt, acc, spent,
        restante: amt - spent,
        cuotaCar, cuotaFix, capVivo, cuotaVar,
        incVar: cuotaVar - cuotaCar,
      };
    });

    const dispensed = acc;
    const currentCarencia = dispensed * (rateCar / 100) / 12;
    const currentFixed = pmt(rateFix, amortM, dispensed);
    const currentCapVivo = remainingBalance(rateFix, amortM, fixedM, dispensed);
    const currentVar = pmt(rateVar, varM, currentCapVivo);
    const pendingBank = Math.max(0, capital - dispensed);
    const liquidity = dispensed - paidTotal;

    // Distribución por partida
    const byCat = new Map();
    list.forEach((e) => {
      const c = e.category || 'General / Sin partida';
      byCat.set(c, (byCat.get(c) || 0) + num(e.amount));
    });
    const parts = [...byCat.entries()].map(([name, amount]) => ({
      name, amount,
      pctSpent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
      pctDisp: dispensed > 0 ? (amount / dispensed) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);

    return {
      loan, capital, dispensed, pendingBank, liquidity, paidTotal, totalSpent, totalDispSpent,
      rateCar, rateFix, euribor, diff, rateVar,
      totalMonths, carenciaM, amortM, fixedM, varM,
      currentCarencia, currentFixed, currentCapVivo, currentVar,
      rows, parts,
    };
  }

  function renderControl() {
    const c = computeLoan();
    const l = c.loan;
    const pctDisp = c.capital > 0 ? (c.dispensed / c.capital) * 100 : 0;
    const pctPend = c.capital > 0 ? (c.pendingBank / c.capital) * 100 : 0;

    content.innerHTML = `
      <div class="loan-top">
        <div class="card loan-params-card">
          <div class="lp-row">
            <label class="field"><span>Capital Concedido (€)</span><input type="number" step="1000" data-lf="capital" value="${c.capital}"></label>
            <label class="field"><span>Tipo Interés Anual Carencia (%)</span><input type="number" step="0.05" data-lf="rateCarencia" value="${c.rateCarencia}"></label>
            <div class="field"><span>Tipo Interés Mensual</span><div class="stat-box" id="lcMonthly">${fmtPct(c.rateCarencia / 12, 4)}</div></div>
          </div>
        </div>
        <div class="exp-kpis" id="lcKpis">
          ${controlKpisHTML(c, pctDisp, pctPend)}
        </div>
      </div>

      <div class="loan-grid">
        <section class="card lcard span-wide">
          <header class="lcard-head">
            <h3>${icon('calendar', 18)} 1. Calendario de disposiciones y evolución de cuota mensual</h3>
            <button class="btn sm" data-ea="addDisp">${icon('plus', 14)} Añadir disposición</button>
          </header>
          <div class="exp-table-wrap">
            <table class="exp-table loan-table">
              <thead>
                <tr>
                  <th>Disposición</th>
                  <th>Fecha</th>
                  <th>Hito / Certificación de Obra</th>
                  <th class="num">Importe Dispuesto</th>
                  <th class="num">Saldo Acumulado</th>
                  <th class="num">Cuota Mensual (${fmtPct(c.rateCar, 2)})</th>
                  <th class="num">Total Gastado</th>
                  <th class="num">Saldo Restante</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="lcDispBody">${dispRowsHTML(c)}</tbody>
              <tfoot id="lcDispFoot">${dispFootHTML(c)}</tfoot>
            </table>
          </div>
          <div class="mob-cards" id="lcDispCards">${dispCardsHTML(c)}</div>
          <p class="muted small lcard-note">${icon('hint', 14)} Los gastos con columna <i>Disposición / Origen</i> igual a <b>Disp. 1</b>, <b>Disp. 2</b>, etc. se suman automáticamente aquí. Pulsa en el gasto para filtrarlos en <button class="link-btn" data-ea="goRegistry">Registro de Gastos</button>.</p>
        </section>

        <section class="card lcard">
          <header class="lcard-head">
            <h3>${icon('layers', 18)} 2. Distribución de gastos por partida</h3>
          </header>
          ${c.parts.length ? `<div class="exp-table-wrap">
            <table class="exp-table mini-part">
              <thead><tr><th>Categoría / Partida</th><th class="num">Total Gastado</th><th class="num">% s/ Gastos</th><th class="num">% s/ Dispuesto</th></tr></thead>
              <tbody>
                ${c.parts.map((p) => `<tr class="clickable-row" data-ea="filterCat" data-val="${esc(p.name)}">
                  <td><div class="part-name"><i style="--c:${catColor(p.name)}"></i><span>${esc(p.name)}</span></div><div class="part-bar"><i style="width:${Math.min(100, p.pctSpent)}%;background:${catColor(p.name)}"></i></div></td>
                  <td class="num nowrap"><b>${fmtMoney2(p.amount)}</b></td>
                  <td class="num nowrap">${fmtPct(p.pctSpent, 1)}</td>
                  <td class="num nowrap">${fmtPct(p.pctDisp, 1)}</td>
                </tr>`).join('')}
              </tbody>
              <tfoot>
                <tr><td><b>TOTAL EJECUTADO</b></td><td class="num nowrap"><b>${fmtMoney2(c.totalSpent)}</b></td><td class="num"><b>100,0%</b></td><td class="num"><b>${fmtPct(c.dispensed > 0 ? (c.totalSpent / c.dispensed) * 100 : 0, 1)}</b></td></tr>
              </tfoot>
            </table>
          </div>
          <div class="mob-cards part-cards">
            ${c.parts.map((p) => `<button class="part-mob-row" data-ea="filterCat" data-val="${esc(p.name)}">
              <div class="pm-top"><div class="part-name"><i style="--c:${catColor(p.name)}"></i><span>${esc(p.name)}</span></div><b>${fmtMoney2(p.amount)}</b></div>
              <div class="part-bar"><i style="width:${Math.min(100, p.pctSpent)}%;background:${catColor(p.name)}"></i></div>
              <div class="pm-sub"><span>${fmtPct(p.pctSpent, 1)} s/ gastos</span><span>${fmtPct(p.pctDisp, 1)} s/ dispuesto</span></div>
            </button>`).join('')}
            <div class="part-mob-tot"><span>TOTAL EJECUTADO</span><b>${fmtMoney2(c.totalSpent)}</b></div>
          </div>` : '<p class="muted empty-sm">Aún no hay gastos registrados.</p>'}
        </section>
      </div>

      <section class="card lcard" style="margin-top:16px">
        <header class="lcard-head">
          <h3>${icon('sliders', 18)} 3. Parámetros de amortización post-carencia y Euríbor</h3>
        </header>
        <div class="amort-grid">
          <label class="field"><span>Plazo Total (años)</span><input type="number" step="1" min="1" max="50" data-lf="totalYears" value="${l.totalYears}"></label>
          <label class="field"><span>Periodo Carencia (meses)</span><input type="number" step="1" min="0" max="60" data-lf="carenciaMonths" value="${l.carenciaMonths}"></label>
          <label class="field"><span>Tipo Fijo Post-Carencia (%)</span><input type="number" step="0.05" data-lf="rateFixed" value="${l.rateFixed}"></label>
          <label class="field"><span>Duración Tipo Fijo (meses)</span><input type="number" step="1" min="0" max="360" data-lf="fixedMonths" value="${l.fixedMonths}"></label>
          <label class="field euribor-field">
            <span>Euríbor Estimado (%) · Simulador</span>
            <div class="eur-ctrl">
              <input type="number" step="0.05" data-lf="euribor" value="${l.euribor}">
              <input type="range" min="0" max="6" step="0.05" data-lf="euribor" value="${clamp(l.euribor, 0, 6)}">
            </div>
          </label>
          <label class="field"><span>Diferencial Hipoteca (%)</span><input type="number" step="0.01" data-lf="differential" value="${l.differential}"></label>
        </div>
        <div class="amort-pills" id="lcAmortPills">${amortPillsHTML(c)}</div>
      </section>

      <section class="card lcard" style="margin-top:16px">
        <header class="lcard-head">
          <h3>${icon('trend', 18)} 4. Simulación de cuotas según capital dispuesto (post-carencia y periodo variable)</h3>
        </header>
        <div class="exp-table-wrap">
          <table class="exp-table">
            <thead>
              <tr>
                <th>Disposición</th>
                <th class="num">Capital Acumulado</th>
                <th class="num">Carencia (${fmtPct(c.rateCar, 2)})<br><small>Meses 1 a ${c.carenciaM}</small></th>
                <th class="num">Periodo Fijo (${fmtPct(c.rateFix, 2)})<br><small>Meses ${c.carenciaM + 1} a ${c.carenciaM + c.fixedM}</small></th>
                <th class="num">Capital Vivo<br><small>Tras tramo fijo</small></th>
                <th class="num">Tipo Variable<br><small>Euríbor + ${fmtPct(c.diff, 2)}</small></th>
                <th class="num">Periodo Variable (${fmtNum(c.varM / 12, 0)} años)<br><small>Meses ${c.carenciaM + c.fixedM + 1} a ${c.totalMonths}</small></th>
                <th class="num">Incremento vs Carencia<br><small>€/mes</small></th>
              </tr>
            </thead>
            <tbody id="lcSimBody">${simBodyHTML(c)}</tbody>
            <tfoot id="lcSimFoot">${simFootHTML(c)}</tfoot>
          </table>
        </div>
        <div class="mob-cards" id="lcSimCards">${simCardsHTML(c)}</div>
      </section>`;
  }

  function controlKpisHTML(c, pctDisp, pctPend) {
    return `
      <div class="card ekpi"><span>TOTAL DISPUESTO</span><b>${fmtMoney2(c.dispensed)}</b><small>Dispuesto: ${fmtPct(pctDisp, 1)} del total</small></div>
      <div class="card ekpi"><span>CUOTA MENSUAL (CARENCIA)</span><b class="accent-txt">${fmtMoney2(c.currentCarencia)}</b><small>Intereses s/ dispuesto (${fmtPct(c.rateCar, 2)})</small></div>
      <div class="card ekpi"><span>CAPITAL PENDIENTE</span><b>${fmtMoney2(c.pendingBank)}</b><small>Disponible banco: ${fmtPct(pctPend, 1)}</small></div>
      <div class="card ekpi"><span>LIQUIDEZ DISPONIBLE</span><b class="${c.liquidity < 0 ? 'danger-txt' : 'ok-txt'}">${fmtMoney2(c.liquidity)}</b><small>Dispuesto − Gastos pagados (${fmtMoney2(c.paidTotal)})</small></div>`;
  }

  function dispRowsHTML(c) {
    return c.rows.map((r) => `<tr data-did="${r.d.id}">
      <td><input class="cell-inp sm-w" data-df="name" value="${esc(r.d.name)}"></td>
      <td><input class="cell-inp date-w" type="date" data-df="date" value="${esc(r.d.date || '')}"></td>
      <td><input class="cell-inp wide-w" data-df="milestone" value="${esc(r.d.milestone || '')}" placeholder="Hito / certificación…"></td>
      <td class="num"><input class="cell-inp num-w" type="number" step="100" data-df="amount" value="${r.amt || ''}" placeholder="0"></td>
      <td class="num nowrap">${r.amt > 0 ? fmtMoney2(r.acc) : '—'}</td>
      <td class="num nowrap">${r.amt > 0 ? fmtMoney2(r.cuotaCar) : '—'}</td>
      <td class="num nowrap">${r.spent > 0 ? `<button class="link-btn" data-ea="filterOrigin" data-val="${esc(r.d.name)}" title="Ver gastos de ${esc(r.d.name)}">${fmtMoney2(r.spent)}</button>` : (r.amt > 0 ? fmtMoney2(0) : '—')}</td>
      <td class="num nowrap ${r.restante < 0 ? 'danger-txt' : ''}">${(r.amt > 0 || r.spent > 0) ? fmtMoney2(r.restante) : '—'}</td>
      <td class="act"><button class="icon-btn sm" data-ea="delDisp" title="Eliminar fila">${icon('x', 14)}</button></td>
    </tr>`).join('');
  }

  function dispFootHTML(c) {
    const rest = c.dispensed - c.totalDispSpent;
    return `<tr>
      <td colspan="3"><b>TOTAL DISPUESTO / CUOTA ACTUAL</b></td>
      <td class="num nowrap"><b>${fmtMoney2(c.dispensed)}</b></td>
      <td class="num nowrap"><b>${fmtMoney2(c.dispensed)}</b></td>
      <td class="num nowrap"><b class="accent-txt">${fmtMoney2(c.currentCarencia)}</b></td>
      <td class="num nowrap"><b>${fmtMoney2(c.totalDispSpent)}</b></td>
      <td class="num nowrap"><b class="${rest < 0 ? 'danger-txt' : 'ok-txt'}">${fmtMoney2(rest)}</b></td>
      <td></td>
    </tr>`;
  }

  function amortPillsHTML(c) {
    return `
      <div><span>Plazo Amortización</span><b>${c.amortM} meses</b></div>
      <div><span>Plazo Variable</span><b>${c.varM} meses (${fmtNum(c.varM / 12, 1)} años)</b></div>
      <div><span>Tipo Variable Estimado</span><b class="accent-txt">${fmtPct(c.rateVar, 2)}</b></div>
      <div><span>Cuota Actual Carencia</span><b>${fmtMoney2(c.currentCarencia)}</b></div>
      <div><span>Diferencial Tipo Fijo</span><b>${fmtPct(c.rateCar - c.rateFix, 2)}</b></div>`;
  }

  function simBodyHTML(c) {
    return c.rows.map((r) => `<tr>
      <td><b>${esc(r.d.name)}</b></td>
      <td class="num nowrap">${r.amt > 0 ? fmtMoney2(r.acc) : '—'}</td>
      <td class="num nowrap">${r.amt > 0 ? fmtMoney2(r.cuotaCar) : '—'}</td>
      <td class="num nowrap">${r.amt > 0 ? fmtMoney2(r.cuotaFix) : '—'}</td>
      <td class="num nowrap">${r.amt > 0 ? fmtMoney2(r.capVivo) : '—'}</td>
      <td class="num nowrap">${r.amt > 0 ? fmtPct(c.rateVar, 2) : '—'}</td>
      <td class="num nowrap"><b>${r.amt > 0 ? fmtMoney2(r.cuotaVar) : '—'}</b></td>
      <td class="num nowrap ${r.incVar > 0 ? 'warn-txt' : 'ok-txt'}">${r.amt > 0 ? (r.incVar >= 0 ? '+' : '') + fmtMoney2(r.incVar) : '—'}</td>
    </tr>`).join('');
  }

  function simFootHTML(c) {
    const inc = c.currentVar - c.currentCarencia;
    return `<tr>
      <td><b>CUOTA ACTUAL</b></td>
      <td class="num nowrap"><b>${fmtMoney2(c.dispensed)}</b></td>
      <td class="num nowrap"><b>${fmtMoney2(c.currentCarencia)}</b></td>
      <td class="num nowrap"><b>${fmtMoney2(c.currentFixed)}</b></td>
      <td class="num nowrap"><b>${fmtMoney2(c.currentCapVivo)}</b></td>
      <td class="num nowrap"><b>${fmtPct(c.rateVar, 2)}</b></td>
      <td class="num nowrap"><b class="accent-txt">${fmtMoney2(c.currentVar)}</b></td>
      <td class="num nowrap"><b class="${inc > 0 ? 'warn-txt' : 'ok-txt'}">${inc >= 0 ? '+' : ''}${fmtMoney2(inc)}</b></td>
    </tr>`;
  }

  function dispCardsHTML(c) {
    const restTot = c.dispensed - c.totalDispSpent;
    return c.rows.map((r) => `<article class="mob-card" data-did="${r.d.id}">
      <div class="mc-row-top">
        <input class="mc-name" data-df="name" value="${esc(r.d.name)}">
        <input class="mc-date" type="date" data-df="date" value="${esc(r.d.date || '')}">
        <button class="icon-btn sm" data-ea="delDisp" title="Eliminar">${icon('x', 15)}</button>
      </div>
      <input class="mc-mile" data-df="milestone" value="${esc(r.d.milestone || '')}" placeholder="Hito / certificación de obra…">
      <label class="mc-amt-wrap"><span>Importe dispuesto (€)</span><input type="number" step="100" data-df="amount" value="${r.amt || ''}" placeholder="0"></label>
      <div class="ec-grid">
        <div><span>Acumulado</span><b data-mc="acc">${r.amt > 0 ? fmtMoney2(r.acc) : '—'}</b></div>
        <div><span>Cuota carencia</span><b data-mc="car" class="accent-txt">${r.amt > 0 ? fmtMoney2(r.cuotaCar) : '—'}</b></div>
        <div><span>Gastado</span><b>${r.spent > 0 ? `<button class="link-btn" data-ea="filterOrigin" data-val="${esc(r.d.name)}">${fmtMoney2(r.spent)}</button>` : (r.amt > 0 ? fmtMoney2(0) : '—')}</b></div>
        <div><span>Saldo restante</span><b data-mc="rest" class="${r.restante < 0 ? 'danger-txt' : ''}">${(r.amt > 0 || r.spent > 0) ? fmtMoney2(r.restante) : '—'}</b></div>
      </div>
    </article>`).join('') + `
    <div class="mob-card tot" id="lcDispTotCard">
      <div class="mc-tot-head"><b>TOTAL DISPUESTO</b><b class="accent-txt">${fmtMoney2(c.dispensed)}</b></div>
      <div class="ec-grid">
        <div><span>Cuota actual</span><b class="accent-txt">${fmtMoney2(c.currentCarencia)}</b></div>
        <div><span>Total gastado</span><b>${fmtMoney2(c.totalDispSpent)}</b></div>
        <div><span>Saldo restante</span><b class="${restTot < 0 ? 'danger-txt' : 'ok-txt'}">${fmtMoney2(restTot)}</b></div>
      </div>
    </div>`;
  }

  function simCardsHTML(c) {
    const active = c.rows.filter((r) => r.amt > 0);
    const incTot = c.currentVar - c.currentCarencia;
    return active.map((r) => `<article class="mob-card">
      <div class="mc-tot-head"><b>${esc(r.d.name)}</b><b>${fmtMoney2(r.acc)}</b></div>
      <div class="ec-grid">
        <div><span>Carencia (${fmtPct(c.rateCar, 2)})</span><b>${fmtMoney2(r.cuotaCar)}/mes</b></div>
        <div><span>Periodo fijo (${fmtPct(c.rateFix, 2)})</span><b>${fmtMoney2(r.cuotaFix)}/mes</b></div>
        <div><span>Capital vivo</span><b>${fmtMoney2(r.capVivo)}</b></div>
        <div><span>Variable (${fmtPct(c.rateVar, 2)})</span><b class="accent-txt">${fmtMoney2(r.cuotaVar)}/mes</b></div>
        <div><span>Incremento vs carencia</span><b class="${r.incVar > 0 ? 'warn-txt' : 'ok-txt'}">${r.incVar >= 0 ? '+' : ''}${fmtMoney2(r.incVar)}/mes</b></div>
      </div>
    </article>`).join('') + `
    <div class="mob-card tot">
      <div class="mc-tot-head"><b>CUOTA ACTUAL</b><b>${fmtMoney2(c.dispensed)}</b></div>
      <div class="ec-grid">
        <div><span>Carencia</span><b>${fmtMoney2(c.currentCarencia)}/mes</b></div>
        <div><span>Periodo fijo</span><b>${fmtMoney2(c.currentFixed)}/mes</b></div>
        <div><span>Capital vivo</span><b>${fmtMoney2(c.currentCapVivo)}</b></div>
        <div><span>Variable (${fmtPct(c.rateVar, 2)})</span><b class="accent-txt">${fmtMoney2(c.currentVar)}/mes</b></div>
        <div><span>Incremento</span><b class="${incTot > 0 ? 'warn-txt' : 'ok-txt'}">${incTot >= 0 ? '+' : ''}${fmtMoney2(incTot)}/mes</b></div>
      </div>
    </div>`;
  }

  function updateControlLive() {
    if (ui.tab !== 'control') return;
    const c = computeLoan();
    const pctDisp = c.capital > 0 ? (c.dispensed / c.capital) * 100 : 0;
    const pctPend = c.capital > 0 ? (c.pendingBank / c.capital) * 100 : 0;
    const m = $('#lcMonthly'); if (m) m.textContent = fmtPct(c.rateCarencia / 12, 4);
    const k = $('#lcKpis'); if (k) k.innerHTML = controlKpisHTML(c, pctDisp, pctPend);
    const df = $('#lcDispFoot'); if (df) df.innerHTML = dispFootHTML(c);
    const ap = $('#lcAmortPills'); if (ap) ap.innerHTML = amortPillsHTML(c);
    const sb = $('#lcSimBody'); if (sb) sb.innerHTML = simBodyHTML(c);
    const sf = $('#lcSimFoot'); if (sf) sf.innerHTML = simFootHTML(c);
    const sc = $('#lcSimCards'); if (sc) sc.innerHTML = simCardsHTML(c);
    const dtc = $('#lcDispTotCard');
    if (dtc) {
      const restTot = c.dispensed - c.totalDispSpent;
      dtc.innerHTML = `<div class="mc-tot-head"><b>TOTAL DISPUESTO</b><b class="accent-txt">${fmtMoney2(c.dispensed)}</b></div>
        <div class="ec-grid">
          <div><span>Cuota actual</span><b class="accent-txt">${fmtMoney2(c.currentCarencia)}</b></div>
          <div><span>Total gastado</span><b>${fmtMoney2(c.totalDispSpent)}</b></div>
          <div><span>Saldo restante</span><b class="${restTot < 0 ? 'danger-txt' : 'ok-txt'}">${fmtMoney2(restTot)}</b></div>
        </div>`;
    }
    // Actualizar columnas calculadas en filas y tarjetas sin perder el foco
    c.rows.forEach((r) => {
      const tr = content.querySelector(`tr[data-did="${r.d.id}"]`);
      if (tr) {
        const tds = tr.querySelectorAll('td');
        if (tds[4]) tds[4].textContent = r.amt > 0 ? fmtMoney2(r.acc) : '—';
        if (tds[5]) tds[5].textContent = r.amt > 0 ? fmtMoney2(r.cuotaCar) : '—';
        if (tds[7]) { tds[7].textContent = (r.amt > 0 || r.spent > 0) ? fmtMoney2(r.restante) : '—'; tds[7].className = 'num nowrap ' + (r.restante < 0 ? 'danger-txt' : ''); }
      }
      const mc = content.querySelector(`article[data-did="${r.d.id}"]`);
      if (mc) {
        const a = mc.querySelector('[data-mc="acc"]'), cr = mc.querySelector('[data-mc="car"]'), rs = mc.querySelector('[data-mc="rest"]');
        if (a) a.textContent = r.amt > 0 ? fmtMoney2(r.acc) : '—';
        if (cr) cr.textContent = r.amt > 0 ? fmtMoney2(r.cuotaCar) : '—';
        if (rs) { rs.textContent = (r.amt > 0 || r.spent > 0) ? fmtMoney2(r.restante) : '—'; rs.className = r.restante < 0 ? 'danger-txt' : ''; }
      }
    });
  }

  /* ---------- Pestaña 2: Registro de Gastos ---------- */
  function filtered() {
    const q = ui.q.toLowerCase().trim();
    const list = (S().expenses || []).filter((e) => {
      if (ui.cat && e.category !== ui.cat) return false;
      if (ui.origin && normDisp(e.origin) !== normDisp(ui.origin)) return false;
      if (ui.status && (e.status || '') !== ui.status) return false;
      if (q && ![e.date, e.origin, e.category, e.concept, e.status, e.invoice, e.notes].some((x) => String(x || '').toLowerCase().includes(q))) return false;
      return true;
    });
    if (ui.sort === 'date_desc') list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.created || 0) - (a.created || 0));
    else if (ui.sort === 'date_asc') list.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.created || 0) - (b.created || 0));
    else if (ui.sort === 'amt_desc') list.sort((a, b) => num(b.amount) - num(a.amount));
    else if (ui.sort === 'amt_asc') list.sort((a, b) => num(a.amount) - num(b.amount));
    return list;
  }

  function renderRegistry() {
    const all = S().expenses || [];
    const t = totals();
    const cats = [...new Set([...S().categories, ...all.map((e) => e.category).filter(Boolean)])];
    const origins = [...new Set([...(L().dispositions || []).map((d) => d.name), ...all.map((e) => e.origin).filter(Boolean)])];
    const statuses = [...new Set([...STATUS.map((s) => s.id), ...all.map((e) => e.status).filter(Boolean)])];

    content.innerHTML = `
      <div class="exp-kpis">
        <div class="card ekpi"><span>Presupuesto / Capital</span><b>${t.budget ? fmtMoney2(t.budget) : 'Sin definir'}</b><small><a href="#ajustes">Configurar en Ajustes</a></small></div>
        <div class="card ekpi"><span>Pagado</span><b class="accent-txt">${fmtMoney2(t.paid)}</b><small>${t.budget ? Math.round((t.paid / t.budget) * 100) + '% del total' : 'Gastos Pagados'}</small></div>
        <div class="card ekpi"><span>Pendiente / Previsto</span><b class="warn-txt">${fmtMoney2(t.pending)}</b><small>Comprometido sin pagar</small></div>
        <div class="card ekpi"><span>Restante disponible</span><b class="${t.budget && t.remainingAll < 0 ? 'danger-txt' : 'ok-txt'}">${t.budget ? fmtMoney2(t.remainingAll) : '—'}</b><small>${t.dispensed ? `Liquidez dispuesta: ${fmtMoney2(t.liquidity)}` : 'Sobre presupuesto'}</small></div>
      </div>
      <div class="toolbar">
        <div class="search">${icon('search', 16)}<input id="eSearch" value="${esc(ui.q)}" placeholder="Buscar proveedor, concepto, factura, origen…"></div>
        <select id="eCat" title="Categoría / Partida"><option value="">Todas las partidas</option>${cats.map((c) => `<option ${c === ui.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
        <select id="eOrigin" title="Disposición / Origen"><option value="">Todos los orígenes</option>${origins.map((o) => `<option ${normDisp(o) === normDisp(ui.origin) && ui.origin ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>
        <select id="eStatus" title="Estado"><option value="">Todos los estados</option>${statuses.map((s) => `<option ${s === ui.status ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
        <select id="eSort" title="Ordenar">
          <option value="date_desc" ${ui.sort === 'date_desc' ? 'selected' : ''}>Fecha (recientes primero)</option>
          <option value="date_asc" ${ui.sort === 'date_asc' ? 'selected' : ''}>Fecha (antiguos primero)</option>
          <option value="amt_desc" ${ui.sort === 'amt_desc' ? 'selected' : ''}>Importe (mayor a menor)</option>
          <option value="amt_asc" ${ui.sort === 'amt_asc' ? 'selected' : ''}>Importe (menor a mayor)</option>
        </select>
      </div>
      <div id="eRegBody"></div>`;
    renderRegistryBody();
  }

  function renderRegistryBody() {
    const host = $('#eRegBody'); if (!host) return;
    const all = S().expenses || [];
    const t = totals();
    const list = filtered();
    if (!list.length) {
      host.innerHTML = `<div class="empty card">${icon('receipt', 42)}
        <h3>${all.length ? 'Ningún gasto coincide con los filtros' : 'Aún no hay gastos registrados'}</h3>
        <p>${all.length ? 'Prueba a limpiar los filtros de búsqueda.' : 'Añade un gasto manualmente o importa tu hoja de Excel (.xlsx, .csv o pegando celdas).'}</p>
        ${!all.length ? `<div class="empty-actions"><button class="btn primary" data-ea="import">${icon('upload', 16)} Importar Excel</button><button class="btn" data-ea="new">${icon('plus', 16)} Añadir gasto</button></div>` : ''}
      </div>`;
      return;
    }
    const remMap = withComputedRemaining(all);
    const sumFiltered = list.reduce((a, e) => a + num(e.amount, 0), 0);

    host.innerHTML = `
      <div class="card exp-table-wrap">
        <table class="exp-table">
          <thead>
            <tr>
              <th>Fecha</th><th>Disposición / Origen</th><th>Categoría / Partida</th><th>Proveedor / Concepto</th>
              <th class="num">Importe</th><th>Estado</th><th>Nº Factura / Justificante</th><th class="num">Restante</th><th class="act"></th>
            </tr>
          </thead>
          <tbody>
            ${list.map((e) => {
              const rem = remMap.get(e.id);
              const isManualRem = e.remaining !== null && e.remaining !== undefined && e.remaining !== '';
              const col = statusColor(e.status);
              return `<tr data-id="${e.id}">
                <td class="nowrap">${esc(fmtDate(e.date) || e.date || '—')}</td>
                <td>${esc(e.origin || '—')}</td>
                <td><span class="tagc" style="--c:${catColor(e.category)}">${esc(e.category || 'General')}</span></td>
                <td class="exp-concept"><b>${esc(e.concept || '—')}</b>${e.notes ? `<small>${esc(e.notes)}</small>` : ''}</td>
                <td class="num nowrap"><b>${fmtMoney2(e.amount)}</b></td>
                <td><button class="pill pill-btn" data-ea="toggleStatus" style="--c:${col}" title="Pulsa para alternar Pagado / Pendiente">${esc(e.status || 'Pagado')}</button></td>
                <td class="mono">${esc(e.invoice || '—')}</td>
                <td class="num nowrap ${rem < 0 ? 'danger-txt' : ''}" title="${isManualRem ? 'Valor manual / importado' : 'Calculado automáticamente'}">${t.budget || isManualRem ? fmtMoney2(rem) : '—'}</td>
                <td class="act">
                  <button class="icon-btn sm" data-ea="edit" title="Editar">${icon('edit', 15)}</button>
                  <button class="icon-btn sm" data-ea="del" title="Eliminar">${icon('trash', 15)}</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
          <tfoot>
            <tr><td colspan="4"><b>Total mostrado (${list.length})</b></td><td class="num nowrap"><b>${fmtMoney2(sumFiltered)}</b></td><td colspan="4"></td></tr>
          </tfoot>
        </table>
      </div>
      <div class="exp-cards">
        ${list.map((e) => {
          const rem = remMap.get(e.id);
          const isManualRem = e.remaining !== null && e.remaining !== undefined && e.remaining !== '';
          const col = statusColor(e.status);
          return `<article class="card ecard" data-id="${e.id}">
            <div class="ec-top">
              <span class="tagc" style="--c:${catColor(e.category)}">${esc(e.category || 'General')}</span>
              <button class="pill pill-btn" data-ea="toggleStatus" style="--c:${col}">${esc(e.status || 'Pagado')}</button>
            </div>
            <div class="ec-main" data-ea="edit">
              <div class="ec-title">${esc(e.concept || 'Sin concepto')}</div>
              <div class="ec-amount">${fmtMoney2(e.amount)}</div>
            </div>
            <div class="ec-grid">
              <div><span>Fecha</span><b>${esc(fmtDate(e.date) || e.date || '—')}</b></div>
              <div><span>Origen</span><b>${esc(e.origin || '—')}</b></div>
              <div><span>Factura</span><b class="mono">${esc(e.invoice || '—')}</b></div>
              <div><span>Restante</span><b class="${rem < 0 ? 'danger-txt' : ''}">${t.budget || isManualRem ? fmtMoney2(rem) : '—'}</b></div>
            </div>
            <div class="ec-foot">
              <button class="btn sm ghost" data-ea="edit">${icon('edit', 14)} Editar</button>
              <button class="btn sm ghost danger-txt" data-ea="del">${icon('trash', 14)} Eliminar</button>
            </div>
          </article>`;
        }).join('')}
      </div>`;
  }

  /* ---------- Formulario de alta / edición ---------- */
  function openForm(item) {
    const isNew = !item;
    const e = item ? clone(item) : blankExpense();
    const origins = [...new Set([...(L().dispositions || []).map((d) => d.name), ...(S().expenses || []).map((x) => x.origin).filter(Boolean)])];
    const cats = [...new Set([...S().categories, e.category].filter(Boolean))];
    Modal.open({
      title: isNew ? 'Nuevo gasto' : 'Editar gasto',
      body: `<form id="expForm" class="grid2">
        <label class="field"><span>Fecha</span><input type="date" name="date" value="${esc(e.date || localISO())}" required></label>
        <label class="field"><span>Importe (€)</span><input type="number" name="amount" step="0.01" value="${e.amount || ''}" placeholder="0,00" required></label>
        <label class="field"><span>Disposición / Origen</span><input name="origin" list="originList" value="${esc(e.origin)}" placeholder="Ej. Disp. 1, Cuenta obra…"><datalist id="originList">${origins.map((o) => `<option value="${esc(o)}">`).join('')}</datalist></label>
        <label class="field"><span>Categoría / Partida</span><input name="category" list="expCatList" value="${esc(e.category)}" placeholder="Ej. Albañilería"><datalist id="expCatList">${cats.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label>
        <label class="field span2"><span>Proveedor / Concepto</span><input name="concept" value="${esc(e.concept)}" placeholder="Ej. Reformas López · Certificación 1" required></label>
        <label class="field"><span>Estado</span><select name="status">${STATUS.map((s) => `<option value="${s.id}" ${s.id.toLowerCase() === String(e.status).toLowerCase() ? 'selected' : ''}>${s.id}</option>`).join('')}</select></label>
        <label class="field"><span>Nº Factura / Justificante</span><input name="invoice" value="${esc(e.invoice)}" placeholder="Ej. FAC-2026-001"></label>
        <label class="field span2"><span>Restante manual (€, opcional)</span><input type="number" name="remaining" step="0.01" value="${e.remaining !== null && e.remaining !== undefined ? e.remaining : ''}" placeholder="Dejar vacío para calcular automáticamente"></label>
        <label class="field span2"><span>Notas</span><textarea name="notes" rows="2" placeholder="Observaciones opcionales…">${esc(e.notes || '')}</textarea></label>
      </form>`,
      foot: `<button class="btn" data-modal-close>Cancelar</button><button class="btn primary" id="expSaveBtn">${icon('check', 16)} Guardar</button>`,
      onOpen(card) {
        const form = $('#expForm', card);
        const save = () => {
          if (!form.reportValidity()) return;
          const fd = new FormData(form);
          const remRaw = String(fd.get('remaining') || '').trim();
          const data = {
            date: String(fd.get('date') || localISO()),
            origin: String(fd.get('origin') || '').trim(),
            category: String(fd.get('category') || 'General').trim() || 'General',
            concept: String(fd.get('concept') || '').trim(),
            amount: num(fd.get('amount'), 0),
            status: String(fd.get('status') || 'Pagado').trim(),
            invoice: String(fd.get('invoice') || '').trim(),
            remaining: remRaw === '' ? null : num(remRaw, null),
            notes: String(fd.get('notes') || '').trim(),
          };
          if (!S().categories.includes(data.category)) S().categories.push(data.category);
          if (isNew) { S().expenses.unshift(Object.assign(blankExpense(), data)); toast('Gasto añadido', 'success'); }
          else { Object.assign(item, data); toast('Gasto actualizado', 'success'); }
          Store.save(); Modal.close(); render();
        };
        $('#expSaveBtn', card).addEventListener('click', save);
        form.addEventListener('submit', (ev) => { ev.preventDefault(); save(); });
      },
    });
  }

  /* ---------- Importación desde Excel (.xlsx / .xls / .csv / pegar) ---------- */
  function normHeader(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function matchCol(h) {
    const k = normHeader(h);
    if (!k) return null;
    if (/^(fecha|date|dia)$/.test(k) || k.includes('fecha')) return 'date';
    if (k.includes('disposicion') || k.includes('origen') || k.includes('cuenta') || k.includes('pago') || k.includes('banco')) return 'origin';
    if (k.includes('categoria') || k.includes('partida') || k.includes('gremio')) return 'category';
    if (k.includes('proveedor') || k.includes('concepto') || k.includes('descripcion') || k.includes('detalle')) return 'concept';
    if (k.includes('importe') || k.includes('cantidad') || k.includes('coste') || k.includes('precio') || k.includes('total') || k.includes('monto')) return 'amount';
    if (k.includes('estado') || k.includes('situacion') || k.includes('status')) return 'status';
    if (k.includes('factura') || k.includes('justificante') || k.includes('recibo') || k.includes('documento')) return 'invoice';
    if (k.includes('restante') || k.includes('saldo') || k.includes('pendiente')) return 'remaining';
    return null;
  }
  function parseExcelDate(v) {
    if (v === null || v === undefined || v === '') return '';
    if (v instanceof Date && !isNaN(v)) return localISO(v);
    if (typeof v === 'number' && v > 20000 && v < 80000) return localISO(new Date(Math.round((v - 25569) * 86400 * 1000)));
    const s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (m) {
      let y = +m[3]; if (y < 100) y += 2000;
      return `${String(y).padStart(4, '0')}-${String(+m[2]).padStart(2, '0')}-${String(+m[1]).padStart(2, '0')}`;
    }
    return s;
  }
  function parseDelimited(text) {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim() !== '');
    if (!lines.length) return [];
    const first = lines[0];
    const delim = first.includes('\t') ? '\t' : (first.split(';').length >= first.split(',').length ? ';' : ',');
    return lines.map((line) => {
      const cells = []; let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
        else if (ch === delim && !inQ) { cells.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      cells.push(cur.trim());
      return cells;
    });
  }
  function rowsToExpenses(rows) {
    if (!rows || !rows.length) return [];
    let headerIdx = -1, map = null;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const cols = rows[i].map(matchCol);
      if (cols.filter(Boolean).length >= 3) { headerIdx = i; map = cols; break; }
    }
    const cols = map || ['date', 'origin', 'category', 'concept', 'amount', 'status', 'invoice', 'remaining'];
    const out = [];
    for (let i = headerIdx >= 0 ? headerIdx + 1 : 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r.some((c) => String(c ?? '').trim() !== '')) continue;
      const item = blankExpense(); item.date = ''; item.status = 'Pagado';
      let hasData = false;
      cols.forEach((field, idx) => {
        if (!field || idx >= r.length) return;
        const val = r[idx];
        if (val === undefined || val === null || String(val).trim() === '') return;
        hasData = true;
        if (field === 'date') item.date = parseExcelDate(val);
        else if (field === 'amount') item.amount = num(val, 0);
        else if (field === 'remaining') item.remaining = num(val, null);
        else item[field] = String(val).trim();
      });
      if (/^total\b/i.test(item.concept) || /^total\b/i.test(item.origin) || /^total\b/i.test(item.category)) continue;
      if (!hasData || (!item.concept && !item.amount && !item.category)) continue;
      if (!item.category) item.category = 'General';
      out.push(item);
    }
    return out;
  }

  function openImportModal() {
    let parsed = [];
    Modal.open({
      title: 'Importar gastos desde Excel',
      wide: true,
      body: `
        <div class="callout" style="margin-bottom:14px">${icon('table', 18)}
          <div>Columnas esperadas: <b>${HEADERS.join(' · ')}</b>.<br>
          Si tu archivo Excel tiene varias pestañas (p. ej. <i>Registro de Gastos</i>), podrás elegir qué hoja importar. También puedes pegar celdas directamente.</div>
        </div>
        <div class="imp-drop">
          <input type="file" id="impFile" accept=".xlsx,.xls,.csv,.tsv,.txt" hidden>
          <button class="btn" id="impPick">${icon('upload', 16)} Seleccionar archivo Excel / CSV</button>
          <select id="impSheet" style="display:none;width:auto"></select>
          <span class="muted small" id="impFileName">O pega directamente tus celdas de Excel abajo:</span>
        </div>
        <textarea id="impPaste" rows="5" placeholder="Pega aquí (Ctrl+V) las filas copiadas desde Excel o Google Sheets…" style="margin-top:10px"></textarea>
        <div id="impPreview" class="imp-preview"></div>
        <div class="imp-opts">
          <label class="chk"><input type="radio" name="impMode" value="append" checked> Añadir a los gastos actuales</label>
          <label class="chk"><input type="radio" name="impMode" value="replace"> Reemplazar todos los gastos</label>
        </div>`,
      foot: `<button class="btn" data-modal-close>Cancelar</button><button class="btn primary" id="impConfirm" disabled>${icon('check', 16)} Importar 0 gastos</button>`,
      onOpen(card) {
        const fileInp = $('#impFile', card), sheetSel = $('#impSheet', card), paste = $('#impPaste', card);
        const preview = $('#impPreview', card), confirmBtn = $('#impConfirm', card), fileName = $('#impFileName', card);
        let workbook = null;

        const updatePreview = (items) => {
          parsed = items;
          confirmBtn.disabled = !items.length;
          confirmBtn.innerHTML = `${icon('check', 16)} Importar ${items.length} gasto${items.length === 1 ? '' : 's'}`;
          if (!items.length) { preview.innerHTML = ''; return; }
          const sum = items.reduce((a, x) => a + num(x.amount), 0);
          preview.innerHTML = `<div class="imp-sum">Detectados <b>${items.length}</b> gastos · Suma de importes: <b>${fmtMoney2(sum)}</b></div>
            <div class="imp-mini-wrap"><table class="exp-table mini">
              <thead><tr><th>Fecha</th><th>Origen</th><th>Categoría</th><th>Proveedor / Concepto</th><th class="num">Importe</th><th>Estado</th><th>Factura</th><th class="num">Restante</th></tr></thead>
              <tbody>${items.slice(0, 6).map((x) => `<tr><td>${esc(x.date)}</td><td>${esc(x.origin)}</td><td>${esc(x.category)}</td><td>${esc(x.concept)}</td><td class="num">${fmtMoney2(x.amount)}</td><td>${esc(x.status)}</td><td>${esc(x.invoice)}</td><td class="num">${x.remaining !== null ? fmtMoney2(x.remaining) : 'auto'}</td></tr>`).join('')}</tbody>
            </table>${items.length > 6 ? `<div class="muted small" style="padding:6px 10px">…y ${items.length - 6} filas más.</div>` : ''}</div>`;
        };
        const readSheet = (name) => {
          if (!workbook || !window.XLSX) return;
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, raw: true, defval: '' });
          updatePreview(rowsToExpenses(rows));
        };

        $('#impPick', card).addEventListener('click', () => fileInp.click());
        sheetSel.addEventListener('change', () => readSheet(sheetSel.value));
        fileInp.addEventListener('change', () => {
          const f = fileInp.files[0]; if (!f) return;
          fileName.textContent = f.name;
          if (/\.(xlsx|xls)$/i.test(f.name)) {
            if (!window.XLSX) { toast('Lector .xlsx no disponible sin conexión. Guarda como .csv o pega las celdas.', 'warn'); return; }
            const fr = new FileReader();
            fr.onload = (ev) => {
              try {
                workbook = XLSX.read(new Uint8Array(ev.target.result), { type: 'array', cellDates: true });
                const pref = workbook.SheetNames.find((n) => /gasto|registro|factura/i.test(n)) || workbook.SheetNames[0];
                if (workbook.SheetNames.length > 1) {
                  sheetSel.innerHTML = workbook.SheetNames.map((n) => `<option value="${esc(n)}" ${n === pref ? 'selected' : ''}>Hoja: ${esc(n)}</option>`).join('');
                  sheetSel.style.display = '';
                } else sheetSel.style.display = 'none';
                readSheet(pref);
              } catch (err) { toast('Error al leer Excel: ' + esc(err.message), 'error'); }
            };
            fr.readAsArrayBuffer(f);
          } else {
            sheetSel.style.display = 'none';
            const fr = new FileReader();
            fr.onload = (ev) => updatePreview(rowsToExpenses(parseDelimited(String(ev.target.result || ''))));
            fr.readAsText(f);
          }
        });

        paste.addEventListener('input', debounce(() => {
          const txt = paste.value.trim();
          if (!txt) { updatePreview([]); return; }
          updatePreview(rowsToExpenses(parseDelimited(txt)));
        }, 180));

        confirmBtn.addEventListener('click', () => {
          if (!parsed.length) return;
          const mode = card.querySelector('input[name="impMode"]:checked').value;
          if (mode === 'replace' && S().expenses.length && !confirm(`Se reemplazarán los ${S().expenses.length} gastos actuales por los ${parsed.length} importados. ¿Continuar?`)) return;
          parsed.forEach((x) => { if (x.category && !S().categories.includes(x.category)) S().categories.push(x.category); });
          if (mode === 'replace') S().expenses = parsed;
          else S().expenses = [...parsed, ...S().expenses];
          Store.save(); Modal.close(); render();
          toast(`Importados ${parsed.length} gastos correctamente`, 'success');
        });
      },
    });
  }

  function exportExcel() {
    const all = S().expenses || [];
    const remMap = withComputedRemaining(all);
    const data = [HEADERS, ...all.map((e) => [
      e.date || '', e.origin || '', e.category || '', e.concept || '',
      num(e.amount, 0), e.status || '', e.invoice || '',
      remMap.has(e.id) ? Math.round(remMap.get(e.id) * 100) / 100 : '',
    ])];
    if (window.XLSX) {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'Registro de Gastos');
      const c = computeLoan();
      const dispData = [
        ['Disposición', 'Fecha', 'Hito', 'Importe Dispuesto', 'Saldo Acumulado', 'Cuota Carencia', 'Total Gastado', 'Saldo Restante'],
        ...c.rows.map((r) => [r.d.name, r.d.date, r.d.milestone, r.amt, r.acc, r.cuotaCar, r.spent, r.restante]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dispData), 'Control Hipoteca');
      XLSX.writeFile(wb, `mi-reforma-gastos-${localISO()}.xlsx`);
      toast('Exportado a Excel (.xlsx) con 2 hojas', 'success');
      return;
    }
    const q = (v) => '"' + String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
    const csv = '\ufeff' + data.map((r) => r.map((v) => typeof v === 'number' ? String(v).replace('.', ',') : v).map(q).join(';')).join('\r\n');
    download(`mi-reforma-gastos-${localISO()}.csv`, csv, 'text/csv;charset=utf-8');
    toast('Gastos exportados a CSV', 'success');
  }

  return { init, show: render, render, totals, openForm };
})();
