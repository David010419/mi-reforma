'use strict';
/* =========================================================
   Editor de planos (SVG). Unidades del mundo: centímetros.
   ========================================================= */
const Plan = (() => {
  const THEMES = {
    paper: {
      label: 'Papel', bg: '#fbfaf7', grid: '#ece8df', gridMajor: '#d9d3c5', wall: '#22262d', wallFill: '#555c68', wallNew: '#e8590c', wallDemo: '#d4a000',
      text: '#1f2937', dim: '#0b6bcb', sel: '#f97316', furn: '#5b6170', furnFill: '#ffffff', opening: '#22262d', glass: '#dbeafe', roomOpacity: 0.45,
    },
    blueprint: {
      label: 'Blueprint', bg: '#0e2a4b', grid: '#15375f', gridMajor: '#1f4877', wall: '#e8f1ff', wallFill: '#9fc0ea', wallNew: '#ffb066', wallDemo: '#ffd75e',
      text: '#eaf3ff', dim: '#7fd6ff', sel: '#ffb020', furn: '#cfe2ff', furnFill: '#123660', opening: '#e8f1ff', glass: '#1f5a94', roomOpacity: 0.16,
    },
    dark: {
      label: 'Oscuro', bg: '#14171d', grid: '#1d2129', gridMajor: '#272c36', wall: '#e5e7eb', wallFill: '#8b93a3', wallNew: '#fb8c3c', wallDemo: '#eab308',
      text: '#e5e7eb', dim: '#60a5fa', sel: '#f97316', furn: '#aab2c0', furnFill: '#1c2029', opening: '#e5e7eb', glass: '#1e3a5f', roomOpacity: 0.18,
    },
  };
  const ROOM_COLORS = ['#fde68a', '#bfdbfe', '#bbf7d0', '#fbcfe8', '#ddd6fe', '#fed7aa', '#a5f3fc', '#e5e7eb', '#fecaca', '#d9f99d'];
  const SYM_GROUPS = {
    elec: { label: 'Electricidad', color: '#f59e0b' },
    fonta: { label: 'Fontanería y gas', color: '#0ea5e9' },
    clima: { label: 'Clima y ventilación', color: '#ef4444' },
  };
  const SYMBOLS = {
    enchufe: { label: 'Enchufe', group: 'elec', g: 'E', h: 30, wall: true },
    enchufe2: { label: 'Enchufe doble', group: 'elec', g: 'E2', h: 30, wall: true },
    enchufeEnc: { label: 'Enchufe encimera', group: 'elec', g: 'EC', h: 110, wall: true },
    enchufeUsb: { label: 'Enchufe con USB', group: 'elec', g: 'U', h: 30, wall: true },
    interruptor: { label: 'Interruptor', group: 'elec', g: 'I', h: 110, wall: true },
    conmutador: { label: 'Conmutador', group: 'elec', g: 'C', h: 110, wall: true },
    luz: { label: 'Punto de luz (techo)', group: 'elec', g: '', h: 260, wall: false },
    foco: { label: 'Foco empotrado', group: 'elec', g: '•', h: 260, wall: false },
    aplique: { label: 'Aplique de pared', group: 'elec', g: 'A', h: 180, wall: true },
    tv: { label: 'Toma TV', group: 'elec', g: 'TV', h: 30, wall: true },
    red: { label: 'Toma red / datos', group: 'elec', g: 'RJ', h: 30, wall: true },
    cuadro: { label: 'Cuadro eléctrico', group: 'elec', g: 'CE', h: 180, wall: true },
    timbre: { label: 'Timbre / portero', group: 'elec', g: 'P', h: 150, wall: true },
    aguaFria: { label: 'Toma agua fría', group: 'fonta', g: 'AF', h: 55, wall: true },
    aguaCaliente: { label: 'Toma agua caliente', group: 'fonta', g: 'AC', h: 55, wall: true },
    desague: { label: 'Desagüe', group: 'fonta', g: 'D', h: 0, wall: false },
    llave: { label: 'Llave de paso', group: 'fonta', g: 'LL', h: 40, wall: true },
    gas: { label: 'Toma de gas', group: 'fonta', g: 'G', h: 50, wall: true },
    calentador: { label: 'Termo / caldera', group: 'fonta', g: 'K', h: 150, wall: true },
    radiador: { label: 'Radiador', group: 'clima', g: 'R', h: 15, wall: true },
    termostato: { label: 'Termostato', group: 'clima', g: 'T', h: 150, wall: true },
    aire: { label: 'Aire acondicionado', group: 'clima', g: 'AA', h: 220, wall: true },
    extractor: { label: 'Extracción / ventilación', group: 'clima', g: 'V', h: 240, wall: false },
    detector: { label: 'Detector humo', group: 'clima', g: 'DH', h: 260, wall: false },
  };
  const FURN = [
    { kind: 'cama', name: 'Cama 150', w: 150, h: 200 }, { kind: 'cama', name: 'Cama 135', w: 135, h: 190 }, { kind: 'cama', name: 'Cama 90', w: 90, h: 190 },
    { kind: 'mesita', name: 'Mesita', w: 45, h: 40 }, { kind: 'armario', name: 'Armario', w: 180, h: 60 }, { kind: 'escritorio', name: 'Escritorio', w: 120, h: 60 },
    { kind: 'sofa', name: 'Sofá 3 plazas', w: 210, h: 90 }, { kind: 'sofa', name: 'Sillón', w: 85, h: 85 }, { kind: 'tv', name: 'Mueble TV', w: 180, h: 40 },
    { kind: 'mesa', name: 'Mesa comedor', w: 160, h: 90 }, { kind: 'mesaRedonda', name: 'Mesa redonda', w: 110, h: 110 }, { kind: 'silla', name: 'Silla', w: 45, h: 45 },
    { kind: 'encimera', name: 'Encimera', w: 240, h: 60 }, { kind: 'fregadero', name: 'Fregadero', w: 80, h: 60 }, { kind: 'placa', name: 'Placa cocción', w: 60, h: 60 },
    { kind: 'nevera', name: 'Frigorífico', w: 70, h: 65 }, { kind: 'lavadora', name: 'Lavadora', w: 60, h: 60 }, { kind: 'isla', name: 'Isla cocina', w: 180, h: 90 },
    { kind: 'inodoro', name: 'Inodoro', w: 40, h: 65 }, { kind: 'lavabo', name: 'Lavabo', w: 60, h: 45 }, { kind: 'ducha', name: 'Plato ducha', w: 120, h: 80 },
    { kind: 'banera', name: 'Bañera', w: 170, h: 75 }, { kind: 'bide', name: 'Bidé', w: 38, h: 55 }, { kind: 'generico', name: 'Mueble', w: 100, h: 50 },
    { kind: 'escalera', name: 'Escalera', w: 280, h: 100 }, { kind: 'pilar', name: 'Pilar', w: 35, h: 35 },
    { kind: 'bajante', name: 'Bajante', w: 20, h: 20 }, { kind: 'norte', name: 'Norte (N)', w: 70, h: 70 },
    { kind: 'piscina', name: 'Piscina', w: 600, h: 300, ext: true }, { kind: 'pergola', name: 'Pérgola', w: 400, h: 300, ext: true },
    { kind: 'coche', name: 'Coche / plaza', w: 450, h: 200, ext: true }, { kind: 'arbol', name: 'Árbol / planta', w: 140, h: 140, ext: true },
    { kind: 'barbacoa', name: 'Barbacoa', w: 140, h: 70, ext: true }, { kind: 'tumbona', name: 'Tumbona', w: 195, h: 70, ext: true },
    { kind: 'trastero', name: 'Caseta / trastero', w: 240, h: 200, ext: true },
  ];
  const WALL_STATUS = { existente: 'Existente', nuevo: 'Nuevo (a construir)', demoler: 'A demoler' };
  const DOOR_KINDS = { abatible: 'Abatible', corredera: 'Corredera', doble: 'Doble hoja', hueco: 'Hueco sin puerta' };
  const WIN_KINDS = { corredera: 'Corredera', abatible: 'Abatible', oscilobatiente: 'Oscilobatiente', fija: 'Fija' };
  const TOOLS = [
    { id: 'select', icon: 'pointer', label: 'Seleccionar y mover', key: 'V' },
    { id: 'pan', icon: 'move', label: 'Desplazar vista', key: 'H' },
    { sep: true },
    { id: 'wall', icon: 'wall', label: 'Muro', key: 'W' },
    { id: 'wallrect', icon: 'wallrect', label: 'Estancia con muros', key: 'B' },
    { id: 'room', icon: 'roomrect', label: 'Habitación rectangular', key: 'M' },
    { id: 'poly', icon: 'polygon', label: 'Habitación poligonal', key: 'P' },
    { sep: true },
    { id: 'door', icon: 'door', label: 'Puerta', key: 'D' },
    { id: 'window', icon: 'window', label: 'Ventana', key: 'N' },
    { sep: true },
    { id: 'furn', icon: 'sofa', label: 'Mobiliario', key: 'F' },
    { id: 'sym', icon: 'bolt', label: 'Electricidad, agua y clima', key: 'E' },
    { sep: true },
    { id: 'dim', icon: 'dim', label: 'Cota', key: 'C' },
    { id: 'text', icon: 'text', label: 'Texto', key: 'T' },
    { id: 'pin', icon: 'pin', label: 'Pin de tarea / incidencia', key: 'I' },
    { id: 'measure', icon: 'ruler', label: 'Medir distancia', key: 'L' },
  ];
  const HINTS = {
    select: 'Clic para seleccionar · arrastra para mover · arrastra el fondo para desplazar · rueda para zoom · Supr para borrar · Alt al arrastrar un muro lo despega',
    pan: 'Arrastra para desplazar la vista · rueda del ratón para zoom',
    wall: 'Clic para empezar y clic en cada esquina · escribe una longitud en cm y pulsa Enter · Shift alterna modo ortogonal · Esc o doble clic para terminar',
    wallrect: 'Arrastra para crear una estancia rectangular con sus 4 muros (se usa el grosor indicado en el panel)',
    room: 'Arrastra para dibujar una habitación rectangular (superficie sin muros)',
    poly: 'Clic en cada vértice · clic en el primer punto, doble clic o Enter para cerrar · Esc cancela',
    door: 'Acerca el cursor a un muro y haz clic para colocar la puerta · R gira la apertura tras colocarla',
    window: 'Acerca el cursor a un muro y haz clic para colocar la ventana',
    furn: 'Elige un mueble en el panel derecho y haz clic en el plano para colocarlo · R gira 90°',
    sym: 'Elige un elemento en el panel y haz clic · los de pared se pegan solos al muro más cercano',
    dim: 'Clic en el punto inicial, clic en el final y un tercer clic para separar la cota',
    text: 'Haz clic donde quieras añadir un texto',
    pin: 'Haz clic en el plano para colocar un pin de tarea o incidencia',
    measure: 'Arrastra para medir una distancia (no se guarda)',
  };
  const PUIKEY = 'mi-reforma:ui:plan';
  const DEF_LAYERS = { grid: true, rooms: true, walls: true, openings: true, furn: true, elec: true, fonta: true, clima: true, dims: true, text: true, pins: true };
  const savedPui = safeJSON(localStorage.getItem(PUIKEY)) || {};
  const pui = Object.assign({ grid: 5, snap: true, ortho: true, autoDims: true, wallThick: 15, wallStatus: 'existente' }, savedPui);
  pui.layers = Object.assign({}, DEF_LAYERS, savedPui.layers || {});
  const savePui = () => localStorage.setItem(PUIKEY, JSON.stringify(pui));

  let root, svg, world, defs, panel;
  let view = { x: 80, y: 80, s: 0.8 };
  let tool = 'select', sel = null, draft = null, placing = null, drag = null;
  let cursor = null, lastShift = false, snapInd = null, hoverOpen = null, spaceDown = false;
  let undoStack = [], redoStack = [], fitted = false, raf = 0, pinch = null;
  let compareId = null, compareOpacity = 0.35, calib = null;
  const pointers = new Map();
  const MIN_S = 0.04, MAX_S = 8;

  const S = () => Store.state;
  const plan = () => S().plans.find((p) => p.id === S().activePlan) || S().plans[0];
  const els = () => plan().elements;
  const byId = (id) => els().find((e) => e.id === id);
  const T = () => THEMES[S().settings.planTheme] || THEMES.paper;

  /* ---------- Geometría ---------- */
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const wlen = (w) => Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
  const deg = (r) => (r * 180) / Math.PI;
  function projT(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
    return L2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2 : 0;
  }
  function readable(a) { a = ((a % 360) + 360) % 360; return a > 90 && a <= 270 ? a - 180 : a; }
  function polyArea(pts) { let s = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; s += x1 * y2 - x2 * y1; } return Math.abs(s) / 2; }
  function polyPerim(pts) { let s = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; s += Math.hypot(x2 - x1, y2 - y1); } return s; }
  function centroid(pts) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      const f = x1 * y2 - x2 * y1; a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f;
    }
    if (Math.abs(a) < 1e-6) { const n = pts.length; return { x: pts.reduce((s, p) => s + p[0], 0) / n, y: pts.reduce((s, p) => s + p[1], 0) / n }; }
    a *= 0.5; return { x: cx / (6 * a), y: cy / (6 * a) };
  }
  function openingGeom(o, w) {
    return { x: w.x1 + (w.x2 - w.x1) * o.t, y: w.y1 + (w.y2 - w.y1) * o.t, a: deg(Math.atan2(w.y2 - w.y1, w.x2 - w.x1)), thick: w.thick, L: wlen(w) };
  }
  function rotPt(x, y, a) { const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r); return { x: x * c - y * s, y: x * s + y * c }; }

  function fmtLen(cm) {
    const u = S().settings.units;
    if (u === 'cm') return fmtNum(cm, Math.abs(cm - Math.round(cm)) > 0.05 ? 1 : 0);
    if (u === 'mm') return fmtNum(cm * 10, 0);
    return fmtNum(cm / 100, 2);
  }
  function fmtLenU(cm) { const u = S().settings.units; return fmtLen(cm) + ' ' + (u === 'm' ? 'm' : u); }

  /* ---------- Render de elementos (compartido editor / exportación / miniatura) ---------- */
  function furnShape(f, s, th, opts = {}) {
    const px = (v) => v / s, w = f.w, h = f.h, x0 = -w / 2, y0 = -h / 2, sw = px(1.2);
    const st = `stroke="${th.furn}" stroke-width="${sw}" fill="none"`;
    const base = `fill="${th.furnFill}" stroke="${th.furn}" stroke-width="${sw}"`;
    const R = (x, y, ww, hh, rx = 0, extra = st) => `<rect x="${x}" y="${y}" width="${Math.max(0, ww)}" height="${Math.max(0, hh)}" rx="${rx}" ${extra}/>`;
    let o = '';
    switch (f.kind) {
      case 'mesaRedonda': o += `<ellipse rx="${w / 2}" ry="${h / 2}" ${base}/><ellipse rx="${w / 2 - 6}" ry="${h / 2 - 6}" ${st}/>`; break;
      case 'bajante': o += `<circle r="${Math.min(w, h) / 2}" fill="#0ea5e9" fill-opacity=".28" stroke="#0284c7" stroke-width="${sw * 1.4}"/><path d="M${-w * 0.3} ${-h * 0.3} L${w * 0.3} ${h * 0.3} M${w * 0.3} ${-h * 0.3} L${-w * 0.3} ${h * 0.3}" stroke="#0284c7" stroke-width="${sw}"/>`; break;
      case 'norte': { const rr = Math.min(w, h) / 2; o += `<circle r="${rr * 0.85}" ${base}/><polygon points="0,${-rr * 0.85} ${rr * 0.32},${rr * 0.25} 0,0 ${-rr * 0.32},${rr * 0.25}" fill="${th.wall}"/><text y="${-rr * 0.96}" text-anchor="middle" font-size="${px(11)}" font-weight="800" fill="${th.text}">N</text>`; break; }
      case 'arbol': o += `<ellipse rx="${w / 2}" ry="${h / 2}" fill="#bbf7d0" fill-opacity=".45" stroke="#16a34a" stroke-width="${sw}"/><ellipse rx="${w * 0.34}" ry="${h * 0.34}" fill="none" stroke="#16a34a" stroke-width="${sw}" stroke-dasharray="${px(4)} ${px(3)}"/><circle r="${Math.min(w, h) * 0.08}" fill="#16a34a"/>`; break;
      case 'inodoro': { const tk = h * 0.28; o += R(x0, y0, w, tk, 3, base) + `<ellipse cx="0" cy="${y0 + tk + (h - tk) / 2}" rx="${w * 0.42}" ry="${(h - tk) / 2}" ${base}/><ellipse cx="0" cy="${y0 + tk + (h - tk) / 2 + 2}" rx="${w * 0.28}" ry="${(h - tk) / 2 - 7}" ${st}/>`; break; }
      case 'bide': o += `<ellipse rx="${w / 2}" ry="${h / 2}" ${base}/><ellipse rx="${w * 0.3}" ry="${h * 0.32}" ${st}/><circle cx="0" cy="${y0 + 6}" r="2" ${st}/>`; break;
      default: o += R(x0, y0, w, h, Math.min(w, h) * 0.04, base);
    }
    switch (f.kind) {
      case 'cama': {
        const n = w >= 120 ? 2 : 1, gap = 10, pw = (w - gap * (n + 1)) / n;
        for (let i = 0; i < n; i++) o += R(x0 + gap + i * (pw + gap), y0 + 8, pw, 24, 6);
        o += `<path d="M${x0} ${y0 + 42} H${-x0}" ${st}/><path d="M${x0} ${y0 + 42} L${x0 + w * 0.22} ${y0 + 62} H${-x0}" ${st} stroke-opacity=".5"/>`;
        break;
      }
      case 'sofa': {
        const a = Math.max(12, Math.min(22, w * 0.1)), b = Math.max(15, h * 0.25);
        o += R(x0, y0, w, b, 4) + R(x0, y0, a, h, 4) + R(-x0 - a, y0, a, h, 4);
        const n = w > 160 ? 3 : w > 110 ? 2 : 1, cw = (w - 2 * a) / n;
        for (let i = 1; i < n; i++) o += `<path d="M${x0 + a + i * cw} ${y0 + b} V${-y0}" ${st}/>`;
        break;
      }
      case 'silla': o += R(x0 + 3, y0, w - 6, h * 0.18, 3); break;
      case 'mesa': case 'isla': case 'escritorio': o += R(x0 + 5, y0 + 5, w - 10, h - 10, 2, `${st} stroke-opacity=".45"`); break;
      case 'mesita': o += `<circle r="${Math.min(w, h) * 0.22}" ${st} stroke-opacity=".6"/>`; break;
      case 'armario': o += `<path d="M${x0 + 4} 0 H${-x0 - 4}" ${st} stroke-dasharray="${px(5)} ${px(3)}"/>`; for (let i = 1; i < Math.max(2, Math.round(w / 50)); i++) { const xx = x0 + (w / Math.max(2, Math.round(w / 50))) * i; o += `<path d="M${xx} ${-y0} V${-y0 - 6}" ${st}/>`; } break;
      case 'encimera': o += `<path d="M${x0} ${-y0 - 4} H${-x0}" ${st}/>`; break;
      case 'fregadero': { const n = w >= 70 ? 2 : 1, bw = (w - 8 * (n + 1)) / n; for (let i = 0; i < n; i++) o += R(x0 + 8 + i * (bw + 8), y0 + 14, bw, h - 22, 6); o += `<circle cx="0" cy="${y0 + 7}" r="3" ${st}/>`; break; }
      case 'placa': { const r = Math.min(w, h) * 0.15; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { o += `<circle cx="${(a * w) / 4}" cy="${(b * h) / 4}" r="${r}" ${st}/>`; }); break; }
      case 'nevera': o += `<path d="M${x0} ${-y0 - 8} H${-x0}" ${st}/><path d="M${x0 + 6} ${y0 + 6} L${-x0 - 6} ${-y0 - 14}" ${st} stroke-opacity=".35"/>`; break;
      case 'lavadora': o += `<circle r="${Math.min(w, h) * 0.32}" ${st}/><circle r="${Math.min(w, h) * 0.2}" ${st}/>`; break;
      case 'lavabo': o += `<ellipse cx="0" cy="${h * 0.06}" rx="${w * 0.36}" ry="${h * 0.3}" ${st}/><circle cx="0" cy="${y0 + 6}" r="2.5" ${st}/>`; break;
      case 'ducha': o += `<path d="M${x0} ${y0} L${-x0} ${-y0} M${-x0} ${y0} L${x0} ${-y0}" ${st} stroke-opacity=".4"/><circle r="${Math.max(3, Math.min(w, h) * 0.06)}" ${st}/>`; break;
      case 'banera': o += R(x0 + 7, y0 + 7, w - 14, h - 14, Math.min(w, h) * 0.35) + `<circle cx="${x0 + 18}" cy="0" r="3" ${st}/>`; break;
      case 'tv': o += R(x0 + w * 0.15, y0 + 3, w * 0.7, 5, 1, `fill="${th.furn}"`); break;
      case 'piscina':
        o += R(x0, y0, w, h, 8, `fill="#38bdf8" fill-opacity=".28" stroke="#0284c7" stroke-width="${sw * 1.4}"`)
          + R(x0 + 12, y0 + 12, w - 24, h - 24, 4, `fill="none" stroke="#0284c7" stroke-width="${sw}" stroke-opacity=".55"`)
          + `<path d="M${x0 + 14} ${y0 + 26} H${x0 + 44} M${x0 + 14} ${y0 + 42} H${x0 + 44} M${x0 + 14} ${y0 + 58} H${x0 + 44}" stroke="#0284c7" stroke-width="${sw}"/>`;
        break;
      case 'pergola': {
        const n = Math.max(3, Math.round(w / 45));
        for (let i = 1; i < n; i++) { const xx = x0 + (w / n) * i; o += `<line x1="${xx}" y1="${y0}" x2="${xx}" y2="${-y0}" ${st} stroke-opacity=".55"/>`; }
        o += `<circle cx="${x0 + 6}" cy="${y0 + 6}" r="4" fill="${th.furn}"/><circle cx="${-x0 - 6}" cy="${y0 + 6}" r="4" fill="${th.furn}"/><circle cx="${x0 + 6}" cy="${-y0 - 6}" r="4" fill="${th.furn}"/><circle cx="${-x0 - 6}" cy="${-y0 - 6}" r="4" fill="${th.furn}"/>`;
        break;
      }
      case 'coche':
        o += R(x0 + w * 0.18, y0 + h * 0.12, w * 0.62, h * 0.76, 12, st)
          + `<line x1="${x0 + w * 0.3}" y1="${y0 + h * 0.12}" x2="${x0 + w * 0.3}" y2="${-y0 - h * 0.12}" ${st}/>`
          + `<line x1="${x0 + w * 0.66}" y1="${y0 + h * 0.12}" x2="${x0 + w * 0.66}" y2="${-y0 - h * 0.12}" ${st}/>`;
        break;
      case 'barbacoa':
        o += R(x0 + 8, y0 + 8, w * 0.55, h - 16, 4, st) + `<path d="M${x0 + 14} ${y0 + 14} H${x0 + w * 0.52} M${x0 + 14} 0 H${x0 + w * 0.52} M${x0 + 14} ${-y0 - 14} H${x0 + w * 0.52}" ${st}/>`;
        break;
      case 'tumbona': o += `<line x1="${x0 + w * 0.32}" y1="${y0}" x2="${x0 + w * 0.32}" y2="${-y0}" ${st}/>` + R(x0 + 8, y0 + 8, w * 0.2, h - 16, 4, st); break;
      case 'trastero': o += `<path d="M${x0} ${y0} L${-x0} ${-y0} M${-x0} ${y0} L${x0} ${-y0}" ${st} stroke-opacity=".35"/>`; break;
      case 'escalera': {
        const steps = Math.max(4, Math.round(w / 28));
        for (let i = 1; i < steps; i++) { const xx = x0 + (w / steps) * i; o += `<line x1="${xx}" y1="${y0}" x2="${xx}" y2="${-y0}" ${st}/>`; }
        o += `<path d="M${x0 + 10} 0 H${-x0 - 10} M${-x0 - 24} -12 L${-x0 - 10} 0 L${-x0 - 24} 12" stroke="${th.wall}" stroke-width="${sw * 1.4}" fill="none"/>`;
        break;
      }
      case 'pilar': o += R(x0, y0, w, h, 0, `fill="${th.wall}" stroke="${th.wall}" stroke-width="${sw}"`) + `<path d="M${x0} ${y0} L${-x0} ${-y0} M${-x0} ${y0} L${x0} ${-y0}" stroke="${th.bg}" stroke-width="${sw}"/>`; break;
    }
    if (!opts.noLabel && f.name && Math.min(w, h) * s > 22 && w * s > 46) {
      const a = f.angle || 0;
      o += `<text transform="rotate(${readable(a) - a})" text-anchor="middle" dominant-baseline="central" font-size="${px(10)}" fill="${th.furn}" font-weight="600" pointer-events="none">${esc(f.name)}</text>`;
    }
    return o;
  }

  function symShape(y, s, th) {
    const px = (v) => v / s, d = SYMBOLS[y.kind] || SYMBOLS.enchufe, col = SYM_GROUPS[d.group].color, r = px(9);
    let o = '';
    if (d.wall) { const a = ((y.angle || 0) * Math.PI) / 180; o += `<line x1="0" y1="0" x2="${-Math.cos(a) * 8}" y2="${-Math.sin(a) * 8}" stroke="${col}" stroke-width="${px(2)}"/>`; }
    if (y.kind === 'luz') {
      o += `<circle r="${r}" fill="${th.bg}" stroke="${col}" stroke-width="${px(2)}"/><path d="M${-r * 0.7} ${-r * 0.7} L${r * 0.7} ${r * 0.7} M${r * 0.7} ${-r * 0.7} L${-r * 0.7} ${r * 0.7}" stroke="${col}" stroke-width="${px(2)}"/>`;
    } else if (y.kind === 'foco') {
      o += `<circle r="${r * 0.75}" fill="${th.bg}" stroke="${col}" stroke-width="${px(2)}"/><circle r="${r * 0.3}" fill="${col}"/>`;
    } else {
      o += `<circle r="${r}" fill="${col}" stroke="${th.bg}" stroke-width="${px(1.5)}"/><text text-anchor="middle" dominant-baseline="central" font-size="${px(d.g.length > 1 ? 7.5 : 9.5)}" font-weight="800" fill="#fff" pointer-events="none">${esc(d.g)}</text>`;
    }
    if (s > 1.1) o += `<text y="${r + px(9)}" text-anchor="middle" font-size="${px(8.5)}" fill="${th.text}" opacity=".75" pointer-events="none" paint-order="stroke" stroke="${th.bg}" stroke-width="${px(3)}">h${Math.round(y.height || 0)}</text>`;
    return o;
  }

  function dimShape(d, s, th, label) {
    const px = (v) => v / s;
    const a = { x: d.x1, y: d.y1 }, b = { x: d.x2, y: d.y2 }, L = dist(a, b);
    if (L < 0.01) return '';
    const ux = (b.x - a.x) / L, uy = (b.y - a.y) / L, nx = -uy, ny = ux, off = d.offset || 0, sg = off >= 0 ? 1 : -1;
    const a2 = { x: a.x + nx * off, y: a.y + ny * off }, b2 = { x: b.x + nx * off, y: b.y + ny * off };
    const ext = px(6) * sg, gap = Math.abs(off) > px(4) ? px(3) * sg : 0;
    const tk = px(5), tx = (ux + nx) * tk / Math.SQRT2, ty = (uy + ny) * tk / Math.SQRT2;
    const ang = deg(Math.atan2(uy, ux)), ra = readable(ang), rr = (ra * Math.PI) / 180;
    const upx = Math.sin(rr), upy = -Math.cos(rr);
    const mx = (a2.x + b2.x) / 2 + upx * px(4), my = (a2.y + b2.y) / 2 + upy * px(4);
    const c = th.dim, w = px(1);
    return `<line x1="${a.x + nx * gap}" y1="${a.y + ny * gap}" x2="${a2.x + nx * ext}" y2="${a2.y + ny * ext}" stroke="${c}" stroke-width="${w}"/>
      <line x1="${b.x + nx * gap}" y1="${b.y + ny * gap}" x2="${b2.x + nx * ext}" y2="${b2.y + ny * ext}" stroke="${c}" stroke-width="${w}"/>
      <line x1="${a2.x}" y1="${a2.y}" x2="${b2.x}" y2="${b2.y}" stroke="${c}" stroke-width="${w}"/>
      <line x1="${a2.x - tx}" y1="${a2.y - ty}" x2="${a2.x + tx}" y2="${a2.y + ty}" stroke="${c}" stroke-width="${px(1.8)}"/>
      <line x1="${b2.x - tx}" y1="${b2.y - ty}" x2="${b2.x + tx}" y2="${b2.y + ty}" stroke="${c}" stroke-width="${px(1.8)}"/>
      <text x="${mx}" y="${my}" transform="rotate(${ra} ${mx} ${my})" text-anchor="middle" font-size="${px(11)}" font-weight="700" fill="${c}" paint-order="stroke" stroke="${th.bg}" stroke-width="${px(3)}" stroke-linejoin="round">${esc(label != null ? label : (d.text || fmtLen(L)))}</text>
      <line x1="${a2.x}" y1="${a2.y}" x2="${b2.x}" y2="${b2.y}" stroke="transparent" stroke-width="${px(12)}"/>`;
  }

  function openingShape(o, g, s, th) {
    const px = (v) => v / s, hw = o.width / 2, ht = g.thick / 2, c = th.opening;
    let inner = `<rect x="${-hw}" y="${-ht - px(2)}" width="${o.width}" height="${g.thick + px(4)}" fill="${th.bg}"/>`;
    const jamb = `<path d="M${-hw} ${-ht} V${ht} M${hw} ${-ht} V${ht}" stroke="${c}" stroke-width="${px(1.5)}"/>`;
    if (o.type === 'door') {
      inner += jamb;
      const sd = o.side || 1, y0 = sd * ht;
      const leaf = (hx, ox, len) => {
        const sweep = ((hx > ox) !== (sd < 0)) ? 1 : 0;
        return `<path d="M${hx} ${y0} L${hx} ${y0 + sd * len}" stroke="${c}" stroke-width="${px(2.2)}"/>
          <path d="M${hx} ${y0 + sd * len} A${len} ${len} 0 0 ${sweep} ${ox} ${y0}" fill="none" stroke="${c}" stroke-width="${px(1)}" stroke-dasharray="${px(4)} ${px(3)}"/>`;
      };
      if (o.kind === 'corredera') {
        const yy = sd > 0 ? ht + px(1) : -ht - px(1) - 4;
        inner += `<rect x="${o.hinge === 'right' ? -hw + o.width * 0.15 : -hw - o.width * 0.15}" y="${yy}" width="${o.width}" height="4" fill="${th.furnFill}" stroke="${c}" stroke-width="${px(1.5)}"/>`;
      } else if (o.kind === 'doble') {
        inner += leaf(-hw, 0, hw) + leaf(hw, 0, hw);
      } else if (o.kind !== 'hueco') {
        const hx = o.hinge === 'right' ? hw : -hw;
        inner += leaf(hx, -hx, o.width);
      }
    } else {
      inner += `<rect x="${-hw}" y="${-ht}" width="${o.width}" height="${g.thick}" fill="${th.glass}" stroke="${c}" stroke-width="${px(1.3)}"/>
        <line x1="${-hw}" y1="0" x2="${hw}" y2="0" stroke="${c}" stroke-width="${px(1)}"/>`;
      if (o.kind === 'corredera') inner += `<line x1="${-hw}" y1="${-ht / 3}" x2="${px(4)}" y2="${-ht / 3}" stroke="${c}" stroke-width="${px(1)}"/><line x1="${-px(4)}" y1="${ht / 3}" x2="${hw}" y2="${ht / 3}" stroke="${c}" stroke-width="${px(1)}"/>`;
    }
    inner += `<rect x="${-hw}" y="${-ht - px(5)}" width="${o.width}" height="${g.thick + px(10)}" fill="transparent"/>`;
    return inner;
  }

  function layerOn(e, L) {
    switch (e.type) {
      case 'room': return L.rooms; case 'wall': return L.walls; case 'door': case 'window': return L.openings;
      case 'furn': return L.furn; case 'sym': return L[(SYMBOLS[e.kind] || SYMBOLS.enchufe).group];
      case 'dim': return L.dims; case 'text': return L.text; case 'pin': return L.pins; default: return true;
    }
  }

  function renderElements(list, s, th, L, autoDims) {
    const px = (v) => v / s;
    const vis = list.filter((e) => layerOn(e, L));
    const wallMap = new Map(list.filter((e) => e.type === 'wall').map((w) => [w.id, w]));
    const walls = vis.filter((e) => e.type === 'wall');
    let out = '';
    // Habitaciones
    vis.filter((e) => e.type === 'room' && e.points.length >= 3).forEach((r) => {
      out += `<polygon data-id="${r.id}" points="${r.points.map((p) => p.join(',')).join(' ')}" fill="${r.color || ROOM_COLORS[0]}" fill-opacity="${th.roomOpacity}" stroke="${r.color || ROOM_COLORS[0]}" stroke-opacity=".9" stroke-width="${px(1)}"/>`;
    });
    // Muros: contorno + relleno (fusionados)
    const solid = walls.filter((w) => w.status !== 'demoler');
    out += solid.map((w) => `<line x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke="${th.wall}" stroke-width="${w.thick + px(2.5)}" stroke-linecap="square"/>`).join('');
    out += solid.map((w) => `<line x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke="${w.status === 'nuevo' ? th.wallNew : th.wallFill}" stroke-width="${w.thick}" stroke-linecap="square"/>`).join('');
    walls.filter((w) => w.status === 'demoler').forEach((w) => {
      const Lw = wlen(w); if (Lw < 0.01) return;
      const nx = (-(w.y2 - w.y1) / Lw) * (w.thick / 2), ny = ((w.x2 - w.x1) / Lw) * (w.thick / 2);
      out += `<polygon points="${w.x1 + nx},${w.y1 + ny} ${w.x2 + nx},${w.y2 + ny} ${w.x2 - nx},${w.y2 - ny} ${w.x1 - nx},${w.y1 - ny}" fill="${th.wallDemo}" fill-opacity=".22" stroke="${th.wallDemo}" stroke-width="${px(1.6)}" stroke-dasharray="${px(6)} ${px(4)}"/>`;
    });
    out += walls.map((w) => `<line data-id="${w.id}" x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke="transparent" stroke-width="${Math.max(w.thick, px(12))}"/>`).join('');
    // Huecos
    vis.filter((e) => e.type === 'door' || e.type === 'window').forEach((o) => {
      const w = wallMap.get(o.wallId); if (!w) return;
      const g = openingGeom(o, w);
      out += `<g data-id="${o.id}" transform="translate(${g.x} ${g.y}) rotate(${g.a})">${openingShape(o, g, s, th)}</g>`;
    });
    // Medidas automáticas de muros
    if (autoDims && L.dims) {
      walls.forEach((w) => {
        const Lw = wlen(w); if (Lw * s < 34) return;
        const ux = (w.x2 - w.x1) / Lw, uy = (w.y2 - w.y1) / Lw, nx = -uy, ny = ux;
        const off = w.thick / 2 + px(9);
        const mx = (w.x1 + w.x2) / 2 + nx * off, my = (w.y1 + w.y2) / 2 + ny * off;
        const ra = readable(deg(Math.atan2(uy, ux)));
        out += `<text x="${mx}" y="${my}" transform="rotate(${ra} ${mx} ${my})" text-anchor="middle" dominant-baseline="central" font-size="${px(10)}" font-weight="600" fill="${th.dim}" opacity=".9" paint-order="stroke" stroke="${th.bg}" stroke-width="${px(3)}" stroke-linejoin="round" pointer-events="none">${fmtLen(Lw)}</text>`;
      });
    }
    // Mobiliario
    vis.filter((e) => e.type === 'furn').forEach((f) => {
      out += `<g data-id="${f.id}" transform="translate(${f.x} ${f.y}) rotate(${f.angle || 0})">${furnShape(f, s, th)}</g>`;
    });
    // Etiquetas de habitaciones
    vis.filter((e) => e.type === 'room' && e.points.length >= 3).forEach((r) => {
      const c = centroid(r.points), area = polyArea(r.points) / 10000;
      const halo = `paint-order="stroke" stroke="${th.bg}" stroke-width="${px(3.5)}" stroke-linejoin="round" stroke-opacity=".85"`;
      out += `<g pointer-events="none" text-anchor="middle"><text x="${c.x}" y="${c.y - px(3)}" font-size="${px(13)}" font-weight="800" fill="${th.text}" ${halo}>${esc(r.name || '')}</text>
        <text x="${c.x}" y="${c.y + px(12)}" font-size="${px(11)}" font-weight="600" fill="${th.text}" opacity=".8" ${halo}>${fmtNum(area, 2)} m²</text></g>`;
    });
    // Instalaciones
    vis.filter((e) => e.type === 'sym').forEach((y) => { out += `<g data-id="${y.id}" transform="translate(${y.x} ${y.y})">${symShape(y, s, th)}</g>`; });
    // Cotas
    vis.filter((e) => e.type === 'dim').forEach((d) => { out += `<g data-id="${d.id}">${dimShape(d, s, th)}</g>`; });
    // Textos
    vis.filter((e) => e.type === 'text').forEach((t) => {
      out += `<text data-id="${t.id}" x="${t.x}" y="${t.y}" font-size="${t.size || 20}" font-weight="600" fill="${t.color || th.text}" text-anchor="middle" dominant-baseline="central" paint-order="stroke" stroke="${th.bg}" stroke-width="${(t.size || 20) * 0.18}" stroke-linejoin="round">${esc(t.text)}</text>`;
    });
    // Pines de tareas / incidencias
    vis.filter((e) => e.type === 'pin').forEach((p) => {
      const task = p.taskId ? S().tasks.find((x) => x.id === p.taskId) : null;
      const col = task ? Tasks.statusOf(task.status).color : (p.color || '#ef4444');
      const r = px(11), lbl = p.label || (task ? task.title : 'Incidencia');
      out += `<g data-id="${p.id}" transform="translate(${p.x} ${p.y})">
        <path d="M0 0 C${-r * 0.9} ${-r * 1.1} ${-r} ${-r * 1.9} 0 ${-r * 2.4} C${r} ${-r * 1.9} ${r * 0.9} ${-r * 1.1} 0 0 Z" fill="${col}" stroke="${th.bg}" stroke-width="${px(1.8)}"/>
        <circle cy="${-r * 1.5}" r="${r * 0.36}" fill="#fff"/>
        <text y="${px(11)}" text-anchor="middle" font-size="${px(9.5)}" font-weight="700" fill="${th.text}" paint-order="stroke" stroke="${th.bg}" stroke-width="${px(3)}" stroke-linejoin="round" pointer-events="none">${esc(lbl.length > 22 ? lbl.slice(0, 21) + '…' : lbl)}</text>
      </g>`;
    });
    return out;
  }

  function bbox(list) {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    const add = (x, y, m = 0) => { x1 = Math.min(x1, x - m); y1 = Math.min(y1, y - m); x2 = Math.max(x2, x + m); y2 = Math.max(y2, y + m); };
    list.forEach((e) => {
      switch (e.type) {
        case 'wall': add(e.x1, e.y1, e.thick / 2); add(e.x2, e.y2, e.thick / 2); break;
        case 'room': e.points.forEach((p) => add(p[0], p[1])); break;
        case 'furn': add(e.x, e.y, Math.hypot(e.w, e.h) / 2); break;
        case 'sym': case 'text': case 'pin': add(e.x, e.y, 15); break;
        case 'dim': { const L = Math.hypot(e.x2 - e.x1, e.y2 - e.y1) || 1, nx = -(e.y2 - e.y1) / L, ny = (e.x2 - e.x1) / L, o = (e.offset || 0) * 1.3; add(e.x1, e.y1); add(e.x2, e.y2); add(e.x1 + nx * o, e.y1 + ny * o); add(e.x2 + nx * o, e.y2 + ny * o); break; }
      }
    });
    return Number.isFinite(x1) ? { x1, y1, x2, y2 } : null;
  }

  function stats(p) {
    const list = p.elements;
    const rooms = list.filter((e) => e.type === 'room' && e.points.length >= 3).map((r) => ({
      id: r.id, name: r.name, color: r.color, floor: r.floor, ceiling: r.ceiling || 250,
      area: polyArea(r.points) / 10000, perim: polyPerim(r.points) / 100,
    }));
    const walls = {};
    list.filter((e) => e.type === 'wall').forEach((w) => {
      const k = w.status || 'existente';
      walls[k] = walls[k] || { len: 0, area: 0, n: 0 };
      walls[k].len += wlen(w) / 100; walls[k].area += (wlen(w) * (w.height || 250)) / 10000; walls[k].n++;
    });
    const syms = {};
    list.filter((e) => e.type === 'sym').forEach((y) => { syms[y.kind] = (syms[y.kind] || 0) + 1; });
    return {
      rooms, walls, syms,
      area: rooms.reduce((s, r) => s + r.area, 0),
      doors: list.filter((e) => e.type === 'door').length,
      windows: list.filter((e) => e.type === 'window').length,
      furn: list.filter((e) => e.type === 'furn').length,
    };
  }

  /* ---------- Editor: estructura ---------- */
  function init() {
    root = $('#view-plano');
    root.innerHTML = `
      <div class="plan-top">
        <div class="pt-group">
          <span class="pt-ic">${icon('layers', 16)}</span>
          <select id="pPlanSel" title="Planta / versión del plano"></select>
          <span class="scope-badge" id="pScopeBadge">Interior</span>
          <button class="icon-btn" data-pa="addPlan" title="Nuevo plano (planta o exterior)">${icon('plus', 17)}</button>
          <button class="icon-btn" data-pa="dupPlan" title="Duplicar plano (p. ej. Estado actual → Propuesta)">${icon('copy', 16)}</button>
          <button class="icon-btn" data-pa="delPlan" title="Eliminar plano">${icon('trash', 16)}</button>
        </div>
        <div class="pt-group">
          <button class="icon-btn" data-pa="undo" id="pUndo" title="Deshacer (Ctrl+Z)">${icon('undo', 17)}</button>
          <button class="icon-btn" data-pa="redo" id="pRedo" title="Rehacer (Ctrl+Y)">${icon('redo', 17)}</button>
        </div>
        <div class="pt-group">
          <button class="tgl" data-pt="snap" title="Imán: ajustar a rejilla y a puntos">${icon('magnet', 15)}<span>Imán</span></button>
          <select id="pGrid" title="Paso de la rejilla de ajuste">${[1, 2, 5, 10, 25, 50].map((g) => `<option value="${g}">${g} cm</option>`).join('')}</select>
          <button class="tgl" data-pt="ortho" title="Modo ortogonal (Shift lo alterna temporalmente)">${icon('ortho', 15)}<span>Orto</span></button>
          <button class="tgl" data-pt="autoDims" title="Mostrar la longitud de cada muro">${icon('dim', 15)}<span>Medidas</span></button>
          <details class="dropdown">
            <summary class="tgl">${icon('eye', 15)}<span>Capas</span></summary>
            <div class="dd-menu" id="pLayers"></div>
          </details>
        </div>
        <div class="pt-group">
          <button class="icon-btn" data-pa="zoomOut" title="Alejar (-)">${icon('zoomout', 17)}</button>
          <button class="zoom-lbl" data-pa="zoom100" id="pZoom" title="Zoom 1:1">100%</button>
          <button class="icon-btn" data-pa="zoomIn" title="Acercar (+)">${icon('zoomin', 17)}</button>
          <button class="icon-btn" data-pa="fit" title="Encuadrar todo (0)">${icon('fit', 17)}</button>
        </div>
        <div class="pt-group">
          <button class="tgl" id="pBgBtn" data-pa="bgModal" title="Imagen de fondo para calcar un plano real">${icon('image', 15)}<span>Calcar</span></button>
          <button class="tgl" id="pCmpBtn" data-pa="compareModal" title="Comparar con otro plano (Antes / Después)">${icon('compare', 15)}<span>Comparar</span></button>
          <select id="pTheme" title="Estilo del plano">${Object.entries(THEMES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select>
          <details class="dropdown right">
            <summary class="btn sm primary">${icon('download', 15)}<span>Exportar</span></summary>
            <div class="dd-menu">
              <button data-pa="exportPng">${icon('image', 15)} Imagen PNG (alta resolución)</button>
              <button data-pa="exportSvg">${icon('file', 15)} Vectorial SVG</button>
            </div>
          </details>
        </div>
      </div>
      <div class="plan-body">
        <div class="plan-tools" id="pTools">${TOOLS.map((t) => t.sep ? '<span class="tsep"></span>' : `<button data-tool="${t.id}" title="${t.label} (${t.key})">${icon(t.icon, 20)}<kbd>${t.key}</kbd></button>`).join('')}</div>
        <div class="plan-canvas">
          <svg id="planSvg" xmlns="http://www.w3.org/2000/svg"><defs id="planDefs"></defs><g id="planWorld"></g></svg>
          <div class="plan-hud">
            <div class="scale-bar" id="pScale"><i></i><span></span></div>
          </div>
          <div class="plan-fab-bar" id="pSelBar"></div>
          <button class="plan-panel-fab" id="pPanelToggle" data-pa="togglePanel">${icon('sliders', 17)}<span>Panel</span></button>
          <div class="plan-status"><span id="psCoords">X 0 · Y 0</span><span id="psHint"></span></div>
        </div>
        <aside class="plan-panel" id="planPanel"></aside>
      </div>`;
    svg = $('#planSvg'); world = $('#planWorld'); defs = $('#planDefs'); panel = $('#planPanel');
    bind();
    setTool('select', true);
  }

  function setMobilePanel(open) {
    if (!root) return;
    root.classList.toggle('panel-open', !!open);
  }

  function syncTop() {
    const cur = plan();
    const ints = S().plans.filter((p) => (p.scope || 'interior') !== 'exterior');
    const exts = S().plans.filter((p) => p.scope === 'exterior');
    const optHTML = (p) => `<option value="${p.id}" ${p.id === cur.id ? 'selected' : ''}>${esc((p.level ? p.level + ' · ' : '') + p.name)}</option>`;
    let html = '';
    if (ints.length) html += `<optgroup label="Interiores">${ints.map(optHTML).join('')}</optgroup>`;
    if (exts.length) html += `<optgroup label="Exteriores">${exts.map(optHTML).join('')}</optgroup>`;
    $('#pPlanSel').innerHTML = html;
    const sb = $('#pScopeBadge');
    if (sb) {
      const isExt = cur.scope === 'exterior';
      sb.textContent = isExt ? 'Exterior' : 'Interior';
      sb.classList.toggle('ext', isExt);
    }
    $$('[data-pt]', root).forEach((b) => b.classList.toggle('on', !!pui[b.dataset.pt]));
    $('#pGrid').value = String(pui.grid);
    $('#pTheme').value = S().settings.planTheme in THEMES ? S().settings.planTheme : 'paper';
    const names = { grid: 'Rejilla', rooms: 'Habitaciones', walls: 'Muros', openings: 'Puertas y ventanas', furn: 'Mobiliario', elec: 'Electricidad', fonta: 'Fontanería y gas', clima: 'Clima y ventilación', dims: 'Cotas y medidas', text: 'Textos', pins: 'Pines y tareas' };
    $('#pLayers').innerHTML = Object.keys(DEF_LAYERS).map((k) => `<label class="chk"><input type="checkbox" data-layer="${k}" ${pui.layers[k] ? 'checked' : ''}> ${names[k]}</label>`).join('');
    const bgB = $('#pBgBtn'); if (bgB) bgB.classList.toggle('on', !!cur.bgImage);
    const cmpB = $('#pCmpBtn'); if (cmpB) cmpB.classList.toggle('on', !!compareId);
    $('#pUndo').disabled = !undoStack.length; $('#pRedo').disabled = !redoStack.length;
    updateSelBar();
  }

  function updateSelBar() {
    const bar = $('#pSelBar');
    if (!bar) return;
    const el = sel && byId(sel);
    if (draft && (draft.type === 'wall' || draft.type === 'poly')) {
      bar.innerHTML = `<button class="btn sm primary" data-pa="finishDraft">${icon('check', 15)} Terminar</button><button class="btn sm" data-pa="cancelDraft">${icon('x', 15)} Cancelar</button>`;
      bar.classList.add('show');
      return;
    }
    if (placing) {
      bar.innerHTML = (placing.t === 'furn' ? `<button class="btn sm" data-pa="rotPlacing">${icon('rotate', 15)} Girar</button>` : '')
        + `<button class="btn sm" data-pa="togglePanel">${icon('layers', 15)} Cambiar</button>`
        + `<button class="btn sm" data-pa="cancelDraft">${icon('x', 15)} Listo</button>`;
      bar.classList.add('show');
      return;
    }
    if (!el) { bar.innerHTML = ''; bar.classList.remove('show'); return; }
    const canRot = el.type === 'furn' || el.type === 'sym' || el.type === 'door';
    bar.innerHTML = `
      <button class="btn sm primary" data-pa="openPanel">${icon('sliders', 15)} Editar</button>
      ${canRot ? `<button class="btn sm" data-pa="rotSel">${icon('rotate', 15)}</button>` : ''}
      <button class="btn sm" data-pa="dupSel">${icon('copy', 15)}</button>
      <button class="btn sm danger" data-pa="delSel">${icon('trash', 15)}</button>`;
    bar.classList.add('show');
  }

  function setTool(id, silent) {
    tool = id; draft = null; placing = null; hoverOpen = null; snapInd = null;
    if (id !== 'select') sel = null;
    if (!svg) return;
    $$('#pTools button').forEach((b) => b.classList.toggle('active', b.dataset.tool === id));
    svg.setAttribute('class', 'tool-' + id);
    $('#psHint').textContent = HINTS[id] || '';
    if (!silent) {
      renderPanel();
      requestRender();
      if (window.innerWidth <= 900 && (id === 'furn' || id === 'sym')) setMobilePanel(true);
    }
  }

  /* ---------- Historial ---------- */
  function pushUndo(snapshot) {
    undoStack.push(snapshot || JSON.stringify(els()));
    if (undoStack.length > 150) undoStack.shift();
    redoStack = [];
    syncUndo();
  }
  function syncUndo() { if (!root) return; $('#pUndo').disabled = !undoStack.length; $('#pRedo').disabled = !redoStack.length; }
  function doUndo() {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify(els()));
    plan().elements = JSON.parse(undoStack.pop());
    afterHistory();
  }
  function doRedo() {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(els()));
    plan().elements = JSON.parse(redoStack.pop());
    afterHistory();
  }
  function afterHistory() { if (sel && !byId(sel)) sel = null; draft = null; Store.save(); syncUndo(); renderPanel(); requestRender(); }
  function commit() { Store.save(); syncUndo(); renderPanel(); requestRender(); }

  /* ---------- Vista ---------- */
  function requestRender() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); }
  function toWorld(e) { const r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left - view.x) / view.s, y: (e.clientY - r.top - view.y) / view.s }; }
  function zoomAt(sx, sy, f) {
    const ns = clamp(view.s * f, MIN_S, MAX_S);
    const wx = (sx - view.x) / view.s, wy = (sy - view.y) / view.s;
    view.s = ns; view.x = sx - wx * ns; view.y = sy - wy * ns;
    requestRender();
  }
  function zoomBy(f) { const r = svg.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, f); }
  function fit() {
    const r = svg.getBoundingClientRect(); if (!r.width || !r.height) return;
    const b = bbox(els()) || { x1: -50, y1: -50, x2: 650, y2: 450 };
    const pad = 70, bw = Math.max(b.x2 - b.x1, 50), bh = Math.max(b.y2 - b.y1, 50);
    view.s = clamp(Math.min((r.width - pad * 2) / bw, (r.height - pad * 2) / bh), MIN_S, MAX_S);
    view.x = r.width / 2 - (b.x1 + bw / 2) * view.s;
    view.y = r.height / 2 - (b.y1 + bh / 2) * view.s;
    requestRender();
  }

  function render() {
    if (!svg || !svg.isConnected) return;
    const th = T(), s = view.s, r = svg.getBoundingClientRect();
    svg.style.background = th.bg;
    world.setAttribute('transform', `translate(${view.x} ${view.y}) scale(${s})`);
    let grid = '';
    if (pui.layers.grid) {
      let m = 10; if (m * s < 7) m = 50; if (m * s < 7) m = 0;
      let M = 100; if (M * s < 10) M = 500; if (M * s < 10) M = 1000;
      defs.innerHTML = (m ? `<pattern id="gMinor" width="${m}" height="${m}" patternUnits="userSpaceOnUse"><path d="M${m} 0H0V${m}" fill="none" stroke="${th.grid}" stroke-width="${2 / s}"/></pattern>` : '')
        + `<pattern id="gMajor" width="${M}" height="${M}" patternUnits="userSpaceOnUse"><path d="M${M} 0H0V${M}" fill="none" stroke="${th.gridMajor}" stroke-width="${2 / s}"/></pattern>`;
      const x0 = -view.x / s, y0 = -view.y / s, w = r.width / s, h = r.height / s;
      grid = (m ? `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#gMinor)" pointer-events="none"/>` : '') + `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#gMajor)" pointer-events="none"/>`;
    }
    let bg = '';
    const bgi = plan().bgImage;
    if (bgi && bgi.src) {
      bg = `<image href="${bgi.src}" x="${bgi.x || 0}" y="${bgi.y || 0}" width="${bgi.w || 1000}" height="${bgi.h || 800}" opacity="${bgi.opacity ?? 0.45}" preserveAspectRatio="none" pointer-events="none"/>`;
    }
    let cmp = '';
    if (compareId && compareId !== plan().id) {
      const cp = S().plans.find((x) => x.id === compareId);
      if (cp) cmp = `<g opacity="${compareOpacity}" pointer-events="none" style="filter:saturate(0.35)">${renderElements(cp.elements, s, th, pui.layers, false).replace(/ data-id="[^"]*"/g, '')}</g>`;
    }
    let calibSvg = '';
    if (calib && calib.a && cursor) {
      const px = (v) => v / s;
      calibSvg = `<line x1="${calib.a.x}" y1="${calib.a.y}" x2="${cursor.x}" y2="${cursor.y}" stroke="#ef4444" stroke-width="${px(2.5)}" stroke-dasharray="${px(6)} ${px(4)}" pointer-events="none"/><circle cx="${calib.a.x}" cy="${calib.a.y}" r="${px(5)}" fill="#ef4444"/>`;
    }
    world.innerHTML = grid + bg + cmp + renderElements(els(), s, th, pui.layers, pui.autoDims) + overlay(s, th) + calibSvg;
    $('#pZoom').textContent = Math.round(s * 100) + '%';
    // Escala gráfica
    const cands = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
    const len = cands.find((c) => c * s >= 70) || 5000;
    const sb = $('#pScale'); sb.querySelector('i').style.width = len * s + 'px'; sb.querySelector('span').textContent = len >= 100 ? `${len / 100} m` : `${len} cm`;
  }

  /* ---------- Superposición: selección y borradores ---------- */
  function overlay(s, th) {
    const px = (v) => v / s, sc = th.sel;
    let o = '';
    const handle = (x, y, h, sq) => sq
      ? `<rect class="handle" data-handle="${h}" x="${x - px(4.5)}" y="${y - px(4.5)}" width="${px(9)}" height="${px(9)}" fill="${sc}" stroke="#fff" stroke-width="${px(1.5)}"/>`
      : `<circle class="handle" data-handle="${h}" cx="${x}" cy="${y}" r="${px(6.5)}" fill="#fff" stroke="${sc}" stroke-width="${px(2.5)}"/>`;
    const label = (x, y, txt, ang = 0) => `<g transform="translate(${x} ${y}) rotate(${readable(ang)})" pointer-events="none"><rect x="${-px(txt.length * 3.6 + 8)}" y="${-px(10)}" width="${px(txt.length * 7.2 + 16)}" height="${px(20)}" rx="${px(6)}" fill="${sc}"/><text text-anchor="middle" dominant-baseline="central" font-size="${px(11.5)}" font-weight="700" fill="#fff">${esc(txt)}</text></g>`;
    const el = sel && byId(sel);
    if (el) {
      switch (el.type) {
        case 'wall':
          o += `<line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" stroke="${sc}" stroke-opacity=".35" stroke-width="${el.thick + px(8)}" stroke-linecap="square" pointer-events="none"/>`;
          o += label((el.x1 + el.x2) / 2, (el.y1 + el.y2) / 2, fmtLenU(wlen(el)), deg(Math.atan2(el.y2 - el.y1, el.x2 - el.x1)));
          o += handle(el.x1, el.y1, 'p1') + handle(el.x2, el.y2, 'p2');
          break;
        case 'room': {
          o += `<polygon points="${el.points.map((p) => p.join(',')).join(' ')}" fill="${sc}" fill-opacity=".06" stroke="${sc}" stroke-width="${px(2)}" stroke-dasharray="${px(6)} ${px(4)}" pointer-events="none"/>`;
          el.points.forEach((p, i) => {
            const q = el.points[(i + 1) % el.points.length];
            const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
            if (L * s > 60) o += label((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, fmtLen(L), deg(Math.atan2(q[1] - p[1], q[0] - p[0])));
            o += handle((p[0] + q[0]) / 2 + (L * s > 60 ? 0 : 0), (p[1] + q[1]) / 2, 'm' + i, true);
          });
          el.points.forEach((p, i) => { o += handle(p[0], p[1], 'v' + i); });
          break;
        }
        case 'door': case 'window': {
          const w = byId(el.wallId); if (!w) break;
          const g = openingGeom(el, w), hw = el.width / 2, ht = g.thick / 2;
          const left = el.t * g.L - hw, right = g.L - el.t * g.L - hw, ra = readable(g.a) - g.a;
          const yy = -(ht + px(16));
          o += `<g transform="translate(${g.x} ${g.y}) rotate(${g.a})" pointer-events="none">
            <rect x="${-hw - px(3)}" y="${-ht - px(3)}" width="${el.width + px(6)}" height="${g.thick + px(6)}" fill="none" stroke="${sc}" stroke-width="${px(2)}"/>
            <line x1="${-el.t * g.L}" y1="${yy}" x2="${-hw}" y2="${yy}" stroke="${sc}" stroke-width="${px(1)}" stroke-dasharray="${px(3)} ${px(2)}"/>
            <line x1="${hw}" y1="${yy}" x2="${g.L - el.t * g.L}" y2="${yy}" stroke="${sc}" stroke-width="${px(1)}" stroke-dasharray="${px(3)} ${px(2)}"/>
            ${left * s > 30 ? `<text transform="translate(${(-el.t * g.L - hw) / 2} ${yy - px(6)}) rotate(${ra})" text-anchor="middle" font-size="${px(10.5)}" font-weight="700" fill="${sc}">${fmtLen(left)}</text>` : ''}
            ${right * s > 30 ? `<text transform="translate(${(g.L - el.t * g.L + hw) / 2} ${yy - px(6)}) rotate(${ra})" text-anchor="middle" font-size="${px(10.5)}" font-weight="700" fill="${sc}">${fmtLen(right)}</text>` : ''}
            <text transform="translate(0 ${ht + px(16)}) rotate(${ra})" text-anchor="middle" font-size="${px(10.5)}" font-weight="700" fill="${sc}">${fmtLen(el.width)}</text>
          </g>`;
          break;
        }
        case 'furn': {
          const a = el.angle || 0, hw = el.w / 2, hh = el.h / 2;
          const rp = rotPt(0, -hh - px(24), a), rs = rotPt(hw, hh, a), top = rotPt(0, -hh, a);
          o += `<g transform="translate(${el.x} ${el.y}) rotate(${a})" pointer-events="none"><rect x="${-hw - px(3)}" y="${-hh - px(3)}" width="${el.w + px(6)}" height="${el.h + px(6)}" fill="none" stroke="${sc}" stroke-width="${px(2)}" stroke-dasharray="${px(5)} ${px(3)}"/></g>`;
          o += `<line x1="${el.x + top.x}" y1="${el.y + top.y}" x2="${el.x + rp.x}" y2="${el.y + rp.y}" stroke="${sc}" stroke-width="${px(1.5)}" pointer-events="none"/>`;
          o += handle(el.x + rp.x, el.y + rp.y, 'rot') + handle(el.x + rs.x, el.y + rs.y, 'rs', true);
          break;
        }
        case 'sym': o += `<circle cx="${el.x}" cy="${el.y}" r="${px(14)}" fill="none" stroke="${sc}" stroke-width="${px(2.5)}" pointer-events="none"/>`; break;
        case 'dim': {
          const L = dist({ x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 }) || 1, nx = -(el.y2 - el.y1) / L, ny = (el.x2 - el.x1) / L, off = el.offset || 0;
          o += handle(el.x1, el.y1, 'p1') + handle(el.x2, el.y2, 'p2') + handle((el.x1 + el.x2) / 2 + nx * off, (el.y1 + el.y2) / 2 + ny * off, 'off', true);
          break;
        }
        case 'text': {
          const fs = el.size || 20, w = Math.max(1, String(el.text).length) * fs * 0.58 + px(10), h = fs * 1.3;
          o += `<rect x="${el.x - w / 2}" y="${el.y - h / 2}" width="${w}" height="${h}" rx="${px(4)}" fill="none" stroke="${sc}" stroke-width="${px(2)}" stroke-dasharray="${px(5)} ${px(3)}" pointer-events="none"/>`;
          break;
        }
      }
    }
    // Borradores
    if (draft && cursor) {
      switch (draft.type) {
        case 'wall': {
          const b = draftWallEnd();
          const L = dist(draft.a, b);
          o += `<line x1="${draft.a.x}" y1="${draft.a.y}" x2="${b.x}" y2="${b.y}" stroke="${pui.wallStatus === 'nuevo' ? th.wallNew : th.wallFill}" stroke-opacity=".75" stroke-width="${pui.wallThick}" stroke-linecap="square" pointer-events="none"/>`;
          o += `<line x1="${draft.a.x}" y1="${draft.a.y}" x2="${b.x}" y2="${b.y}" stroke="${sc}" stroke-width="${px(1.5)}" stroke-dasharray="${px(6)} ${px(4)}" pointer-events="none"/>`;
          if (L > 0.5) {
            const ang = deg(Math.atan2(b.y - draft.a.y, b.x - draft.a.x));
            const txt = (draft.typed ? `⌨ ${draft.typed} cm` : fmtLenU(L)) + `  ·  ${Math.round(((-ang % 360) + 360) % 360)}°`;
            const nx = -(b.y - draft.a.y) / L, ny = (b.x - draft.a.x) / L;
            o += label((draft.a.x + b.x) / 2 + nx * (pui.wallThick / 2 + px(18)), (draft.a.y + b.y) / 2 + ny * (pui.wallThick / 2 + px(18)), txt, ang);
          }
          o += `<circle cx="${draft.a.x}" cy="${draft.a.y}" r="${px(4)}" fill="${sc}" pointer-events="none"/>`;
          break;
        }
        case 'room': case 'wallrect': {
          const a = draft.a, b = draft.b || a;
          const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y), w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
          if (draft.type === 'wallrect') o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${th.wallFill}" stroke-opacity=".7" stroke-width="${pui.wallThick}" stroke-linejoin="miter" pointer-events="none"/>`;
          o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${sc}" fill-opacity=".08" stroke="${sc}" stroke-width="${px(1.5)}" stroke-dasharray="${px(6)} ${px(4)}" pointer-events="none"/>`;
          if (w * s > 30) o += label(x + w / 2, y - px(16), fmtLenU(w));
          if (h * s > 30) o += label(x - px(16), y + h / 2, fmtLenU(h), -90);
          if (w * s > 80 && h * s > 40) o += label(x + w / 2, y + h / 2, fmtNum((w * h) / 10000, 2) + ' m²');
          break;
        }
        case 'poly': {
          const last = draft.pts[draft.pts.length - 1];
          let c = snap(cursor); if (orthoOn() && !c.snapped) c = ortho(last, c);
          const pts = [...draft.pts, c];
          o += `<polygon points="${pts.map((p) => p.x + ',' + p.y).join(' ')}" fill="${sc}" fill-opacity=".08" stroke="none" pointer-events="none"/>`;
          o += `<polyline points="${pts.map((p) => p.x + ',' + p.y).join(' ')}" fill="none" stroke="${sc}" stroke-width="${px(2)}" pointer-events="none"/>`;
          draft.pts.forEach((p, i) => { o += `<circle cx="${p.x}" cy="${p.y}" r="${px(i === 0 ? 6 : 4)}" fill="${i === 0 ? '#fff' : sc}" stroke="${sc}" stroke-width="${px(2)}" pointer-events="none"/>`; });
          const L = dist(last, c); if (L * s > 30) o += label((last.x + c.x) / 2, (last.y + c.y) / 2, fmtLenU(L), deg(Math.atan2(c.y - last.y, c.x - last.x)));
          break;
        }
        case 'dim': {
          if (!draft.b) {
            let c = snap(cursor); if (orthoOn()) c = ortho(draft.a, c);
            o += `<g pointer-events="none" opacity=".85">${dimShape({ x1: draft.a.x, y1: draft.a.y, x2: c.x, y2: c.y, offset: 0 }, s, th)}</g>`;
          } else {
            const off = dimOffset(draft.a, draft.b, cursor);
            o += `<g pointer-events="none" opacity=".85">${dimShape({ x1: draft.a.x, y1: draft.a.y, x2: draft.b.x, y2: draft.b.y, offset: off }, s, th)}</g>`;
          }
          break;
        }
        case 'measure': {
          const a = draft.a, b = draft.b || a, L = dist(a, b);
          o += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${sc}" stroke-width="${px(2)}" pointer-events="none"/>`;
          o += `<circle cx="${a.x}" cy="${a.y}" r="${px(4)}" fill="${sc}"/><circle cx="${b.x}" cy="${b.y}" r="${px(4)}" fill="${sc}"/>`;
          if (L > 0.5) o += label((a.x + b.x) / 2, (a.y + b.y) / 2 - px(16), fmtLenU(L) + `  ·  Δx ${fmtLen(Math.abs(b.x - a.x))}  Δy ${fmtLen(Math.abs(b.y - a.y))}`);
          break;
        }
      }
    }
    // Previsualización de huecos
    if ((tool === 'door' || tool === 'window') && hoverOpen) {
      const ghost = newOpening(hoverOpen);
      const g = openingGeom(ghost, hoverOpen.w);
      o += `<g transform="translate(${g.x} ${g.y}) rotate(${g.a})" opacity=".7" pointer-events="none">${openingShape(ghost, g, s, th)}<rect x="${-ghost.width / 2}" y="${-g.thick / 2}" width="${ghost.width}" height="${g.thick}" fill="none" stroke="${sc}" stroke-width="${px(2)}"/></g>`;
    }
    // Fantasma de colocación
    if (placing && cursor) {
      if (placing.t === 'furn') {
        const q = snap(cursor), d = placing.def;
        o += `<g transform="translate(${q.x} ${q.y}) rotate(${placing.angle || 0})" opacity=".65" pointer-events="none">${furnShape(Object.assign({}, d, { angle: placing.angle || 0 }), s, th)}</g>`;
      } else {
        const p = symPlacement(cursor);
        o += `<g transform="translate(${p.x} ${p.y})" opacity=".7" pointer-events="none">${symShape({ kind: placing.kind, angle: p.angle, height: SYMBOLS[placing.kind].h }, s, th)}</g>`;
      }
    }
    if (snapInd) {
      o += snapInd.kind === 'line'
        ? `<path d="M${snapInd.x - px(6)} ${snapInd.y - px(6)} L${snapInd.x + px(6)} ${snapInd.y + px(6)} M${snapInd.x + px(6)} ${snapInd.y - px(6)} L${snapInd.x - px(6)} ${snapInd.y + px(6)}" stroke="${sc}" stroke-width="${px(2)}" pointer-events="none"/>`
        : `<rect x="${snapInd.x - px(6)}" y="${snapInd.y - px(6)}" width="${px(12)}" height="${px(12)}" fill="none" stroke="${sc}" stroke-width="${px(2)}" pointer-events="none"/>`;
    }
    return o;
  }

  /* ---------- Ajustes (snap) ---------- */
  function snap(p, opt = {}) {
    if (!pui.snap) return { x: r1(p.x), y: r1(p.y), snapped: false };
    const R = 12 / view.s;
    let best = null, bd = R;
    const consider = (x, y) => { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = { x, y, snapped: true, kind: 'end' }; } };
    els().forEach((e) => {
      if (e.id === opt.exclude) return;
      if (e.type === 'wall') { consider(e.x1, e.y1); consider(e.x2, e.y2); }
      else if (e.type === 'room') e.points.forEach((q) => consider(q[0], q[1]));
    });
    if (draft && draft.type === 'poly') draft.pts.forEach((q) => consider(q.x, q.y));
    if (best) return best;
    const g = pui.grid;
    els().forEach((w) => {
      if (w.type !== 'wall' || w.id === opt.exclude) return;
      const a = { x: w.x1, y: w.y1 }, b = { x: w.x2, y: w.y2 }, t = projT(p, a, b);
      if (t < 0 || t > 1) return;
      const q = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      if (Math.abs(b.y - a.y) < 0.01) q.x = Math.round(q.x / g) * g;
      else if (Math.abs(b.x - a.x) < 0.01) q.y = Math.round(q.y / g) * g;
      const d = dist(p, q);
      if (d < bd) { bd = d; best = { x: q.x, y: q.y, snapped: true, kind: 'line' }; }
    });
    if (best) return best;
    return { x: Math.round(p.x / g) * g, y: Math.round(p.y / g) * g, snapped: false };
  }
  const orthoOn = (e) => pui.ortho !== !!(e ? e.shiftKey : lastShift);
  function ortho(from, q) { return Math.abs(q.x - from.x) >= Math.abs(q.y - from.y) ? Object.assign({}, q, { y: from.y }) : Object.assign({}, q, { x: from.x }); }
  function dimOffset(a, b, p) { const L = dist(a, b) || 1; const nx = -(b.y - a.y) / L, ny = (b.x - a.x) / L; return Math.round((p.x - a.x) * nx + (p.y - a.y) * ny); }
  function linksAt(pt, excludeId) {
    const res = [];
    els().forEach((w) => {
      if (w.type !== 'wall' || w.id === excludeId) return;
      if (Math.hypot(w.x1 - pt.x, w.y1 - pt.y) < 0.5) res.push({ id: w.id, end: 1, ox: w.x1, oy: w.y1 });
      if (Math.hypot(w.x2 - pt.x, w.y2 - pt.y) < 0.5) res.push({ id: w.id, end: 2, ox: w.x2, oy: w.y2 });
    });
    return res;
  }
  function findWallNear(p) {
    let best = null, bd = Infinity;
    els().forEach((w) => {
      if (w.type !== 'wall') return;
      const a = { x: w.x1, y: w.y1 }, b = { x: w.x2, y: w.y2 }, L = dist(a, b); if (L < 20) return;
      const t = clamp(projT(p, a, b), 0, 1), q = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, d = dist(p, q);
      if (d < w.thick / 2 + 30 / view.s && d < bd) {
        const nx = -(b.y - a.y) / L, ny = (b.x - a.x) / L;
        bd = d; best = { w, t, L, side: (p.x - q.x) * nx + (p.y - q.y) * ny >= 0 ? 1 : -1 };
      }
    });
    return best;
  }
  function newOpening(h) {
    const isDoor = tool === 'door';
    const width = Math.min(isDoor ? 80 : 120, h.L - 4);
    let along = h.t * h.L;
    if (pui.snap) along = Math.round(along / pui.grid) * pui.grid;
    along = clamp(along, width / 2, h.L - width / 2);
    return isDoor
      ? { type: 'door', wallId: h.w.id, t: along / h.L, width, height: 210, kind: 'abatible', hinge: 'left', side: h.side, note: '' }
      : { type: 'window', wallId: h.w.id, t: along / h.L, width, height: 120, sill: 90, kind: 'corredera', note: '' };
  }
  function wallFaceSnap(p) {
    let best = null, bd = Infinity;
    els().forEach((w) => {
      if (w.type !== 'wall') return;
      const a = { x: w.x1, y: w.y1 }, b = { x: w.x2, y: w.y2 }, L = dist(a, b); if (L < 1) return;
      const t = projT(p, a, b); if (t < 0 || t > 1) return;
      const q = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, d = dist(p, q);
      if (d < w.thick / 2 + 30 / view.s && d < bd) {
        const nx = -(b.y - a.y) / L, ny = (b.x - a.x) / L;
        const sd = (p.x - q.x) * nx + (p.y - q.y) * ny >= 0 ? 1 : -1, off = w.thick / 2 + 8;
        bd = d; best = { x: r1(q.x + nx * sd * off), y: r1(q.y + ny * sd * off), angle: Math.round(deg(Math.atan2(ny * sd, nx * sd))) };
      }
    });
    return best;
  }
  function symPlacement(p) {
    const d = SYMBOLS[placing ? placing.kind : 'enchufe'];
    if (d.wall) { const f = wallFaceSnap(p); if (f) return f; }
    const q = snap(p); return { x: q.x, y: q.y, angle: 0 };
  }
  function draftWallEnd() {
    if (draft.typed) return typedEnd();
    let q = snap(cursor);
    if (orthoOn()) q = ortho(draft.a, q);
    return q;
  }
  function typedEnd() {
    const len = num(draft.typed);
    let dir = { x: 1, y: 0 };
    if (cursor) {
      let q = snap(cursor); if (orthoOn()) q = ortho(draft.a, q);
      const L = dist(draft.a, q); if (L > 0.01) dir = { x: (q.x - draft.a.x) / L, y: (q.y - draft.a.y) / L };
    }
    return { x: r1(draft.a.x + dir.x * len), y: r1(draft.a.y + dir.y * len) };
  }

  /* ---------- Creación ---------- */
  function nextRoomName() { return 'Habitación ' + (els().filter((e) => e.type === 'room').length + 1); }
  function nextRoomColor() { return ROOM_COLORS[els().filter((e) => e.type === 'room').length % ROOM_COLORS.length]; }
  function addWall(a, b) {
    pushUndo();
    els().push({ id: uid(), type: 'wall', x1: r1(a.x), y1: r1(a.y), x2: r1(b.x), y2: r1(b.y), thick: pui.wallThick, status: pui.wallStatus, height: 250, note: '' });
    Store.save();
  }
  function closePoly() {
    if (!draft || draft.type !== 'poly' || draft.pts.length < 3) { draft = null; requestRender(); return; }
    pushUndo();
    const r = { id: uid(), type: 'room', name: nextRoomName(), points: draft.pts.map((p) => [r1(p.x), r1(p.y)]), color: nextRoomColor(), floor: '', ceiling: 250, note: '' };
    els().push(r); draft = null; sel = r.id; tool = 'select'; setTool('select', true); commit();
  }
  function finishRect(kind) {
    const a = draft.a, b = draft.b || a; draft = null;
    const x1 = Math.min(a.x, b.x), y1 = Math.min(a.y, b.y), x2 = Math.max(a.x, b.x), y2 = Math.max(a.y, b.y);
    if (x2 - x1 < 10 || y2 - y1 < 10) { requestRender(); return; }
    pushUndo();
    let inset = 0;
    if (kind === 'wallrect') {
      const t = pui.wallThick; inset = t / 2;
      const W = (ax, ay, bx, by) => ({ id: uid(), type: 'wall', x1: ax, y1: ay, x2: bx, y2: by, thick: t, status: pui.wallStatus, height: 250, note: '' });
      els().push(W(x1, y1, x2, y1), W(x2, y1, x2, y2), W(x2, y2, x1, y2), W(x1, y2, x1, y1));
    }
    const r = { id: uid(), type: 'room', name: nextRoomName(), points: [[x1 + inset, y1 + inset], [x2 - inset, y1 + inset], [x2 - inset, y2 - inset], [x1 + inset, y2 - inset]].map((p) => p.map(r1)), color: nextRoomColor(), floor: '', ceiling: 250, note: '' };
    els().push(r);
    sel = r.id; setTool('select', true); commit();
    toast(kind === 'wallrect' ? 'Estancia creada con sus muros' : 'Habitación creada', 'success');
  }

  /* ---------- Eventos de puntero ---------- */
  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button === 2) {
      e.preventDefault();
      if (draft && draft.type === 'poly') closePoly();
      else if (draft) draft = null;
      else if (placing) { placing = null; renderPanel(); }
      requestRender(); return;
    }
    svg.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, view: Object.assign({}, view) };
      if (drag && drag.pushed) { /* mantiene cambios */ }
      drag = null; return;
    }
    lastShift = e.shiftKey;
    const p = toWorld(e); cursor = p;
    if (calib) {
      if (!calib.a) { calib.a = p; toast('Ahora haz clic en el segundo punto de esa pared/medida', 'info'); requestRender(); return; }
      const dNow = dist(calib.a, p);
      calib = null;
      if (dNow > 1 && plan().bgImage) {
        const real = num(prompt('¿Cuánto mide realmente ese tramo en centímetros (ej. 420 para 4,20 m)?', '400'), 0);
        if (real > 0) {
          const factor = real / dNow;
          const bgi = plan().bgImage;
          bgi.w = r1(bgi.w * factor); bgi.h = r1(bgi.h * factor);
          bgi.x = r1(bgi.x * factor); bgi.y = r1(bgi.y * factor);
          Store.save(); fit(); toast('Escala del plano de fondo calibrada', 'success');
        }
      }
      requestRender(); return;
    }
    if (e.button === 1 || tool === 'pan' || spaceDown) { startPan(e); return; }
    switch (tool) {
      case 'select': selectDown(e, p); break;
      case 'wall': {
        let q = snap(p);
        if (draft && draft.type === 'wall') {
          if (draft.typed) q = typedEnd(); else if (orthoOn(e)) q = ortho(draft.a, q);
          if (dist(q, draft.a) < 1) break;
          addWall(draft.a, q);
          if (dist(q, draft.start) < 0.5) { draft = null; renderPanel(); }
          else { draft.a = { x: q.x, y: q.y }; draft.typed = ''; }
        } else draft = { type: 'wall', a: { x: q.x, y: q.y }, start: { x: q.x, y: q.y }, typed: '' };
        break;
      }
      case 'room': case 'wallrect': { const q = snap(p); draft = { type: tool, a: q, b: q }; drag = { mode: 'rect' }; break; }
      case 'poly': {
        let q = snap(p);
        if (!draft || draft.type !== 'poly') { draft = { type: 'poly', pts: [{ x: q.x, y: q.y }] }; break; }
        const last = draft.pts[draft.pts.length - 1];
        if (orthoOn(e) && !q.snapped) q = ortho(last, q);
        if (draft.pts.length >= 3 && dist(q, draft.pts[0]) < 0.5) { closePoly(); break; }
        if (dist(q, last) < 1) break;
        draft.pts.push({ x: q.x, y: q.y });
        break;
      }
      case 'door': case 'window': {
        const h = findWallNear(p);
        if (!h) { toast('Acerca el cursor a un muro para colocar la ' + (tool === 'door' ? 'puerta' : 'ventana'), 'warn'); break; }
        const o = Object.assign({ id: uid() }, newOpening(h));
        pushUndo(); els().push(o); sel = o.id; commit();
        break;
      }
      case 'dim': {
        let q = snap(p);
        if (!draft || draft.type !== 'dim') { draft = { type: 'dim', a: q, b: null }; break; }
        if (!draft.b) { if (orthoOn(e)) q = ortho(draft.a, q); if (dist(q, draft.a) < 1) break; draft.b = { x: q.x, y: q.y }; break; }
        pushUndo();
        els().push({ id: uid(), type: 'dim', x1: draft.a.x, y1: draft.a.y, x2: draft.b.x, y2: draft.b.y, offset: dimOffset(draft.a, draft.b, p), text: '' });
        draft = null; commit();
        break;
      }
      case 'text': {
        const q = snap(p);
        pushUndo();
        const t = { id: uid(), type: 'text', x: q.x, y: q.y, text: 'Texto', size: 20, color: '' };
        els().push(t); sel = t.id; setTool('select', true); commit();
        setTimeout(() => { const i = panel.querySelector('[data-p="text"]'); if (i) { i.focus(); i.select(); } }, 30);
        break;
      }
      case 'pin': {
        const q = snap(p);
        pushUndo();
        const pn = { id: uid(), type: 'pin', x: q.x, y: q.y, taskId: '', label: 'Incidencia', color: '#ef4444', note: '' };
        els().push(pn); sel = pn.id; setTool('select', true); commit();
        if (window.innerWidth <= 900) setMobilePanel(true);
        break;
      }
      case 'measure': { const q = snap(p); draft = { type: 'measure', a: q, b: q }; drag = { mode: 'measure' }; break; }
      case 'furn': case 'sym': {
        if (!placing) { toast('Elige primero un elemento en el panel de la derecha', 'warn'); break; }
        pushUndo();
        if (placing.t === 'furn') {
          const q = snap(p), d = placing.def;
          els().push({ id: uid(), type: 'furn', kind: d.kind, name: d.name, w: d.w, h: d.h, x: q.x, y: q.y, angle: placing.angle || 0, note: '' });
        } else {
          const q = symPlacement(p);
          els().push({ id: uid(), type: 'sym', kind: placing.kind, x: q.x, y: q.y, angle: q.angle, height: SYMBOLS[placing.kind].h, note: '' });
        }
        Store.save(); syncUndo(); requestRender();
        break;
      }
    }
    updateSelBar();
    requestRender();
  }

  function startPan(e) { drag = { mode: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y }; svg.classList.add('panning'); }

  function selectDown(e, p) {
    const hEl = e.target.closest('[data-handle]');
    const snapshot = JSON.stringify(els());
    if (hEl && sel) {
      const el = byId(sel);
      drag = { mode: 'handle', handle: hEl.dataset.handle, id: sel, start: p, orig: clone(el), snapshot, pushed: false, links: [] };
      if (el.type === 'wall' && !e.altKey) { const end = drag.handle === 'p1' ? 1 : 2; drag.links = linksAt({ x: el['x' + end], y: el['y' + end] }, el.id); }
      if (el.type === 'room' && drag.handle[0] === 'm') {
        pushUndo(snapshot);
        const i = +drag.handle.slice(1), a = el.points[i], b = el.points[(i + 1) % el.points.length];
        el.points.splice(i + 1, 0, [r1((a[0] + b[0]) / 2), r1((a[1] + b[1]) / 2)]);
        drag.handle = 'v' + (i + 1); drag.pushed = true;
      }
      return;
    }
    const t = e.target.closest('[data-id]');
    if (t) {
      const id = t.dataset.id, el = byId(id);
      if (!el) return;
      const wasSel = sel === id;
      if (!wasSel) { sel = id; renderPanel(); }
      if (el.type === 'room' && !wasSel) { startPan(e); drag.selectOnly = true; return; }
      drag = { mode: 'move', id, start: p, orig: clone(el), snapshot, pushed: false, links: [] };
      if (el.type === 'wall' && !e.altKey) drag.links = [...linksAt({ x: el.x1, y: el.y1 }, id), ...linksAt({ x: el.x2, y: el.y2 }, id)];
      return;
    }
    if (sel) { sel = null; renderPanel(); }
    startPan(e);
  }

  function onMove(e) {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()], r = svg.getBoundingClientRect();
      const ns = clamp(pinch.view.s * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d), MIN_S, MAX_S);
      const wx = (pinch.mx - r.left - pinch.view.x) / pinch.view.s, wy = (pinch.my - r.top - pinch.view.y) / pinch.view.s;
      view.s = ns; view.x = (a.x + b.x) / 2 - r.left - wx * ns; view.y = (a.y + b.y) / 2 - r.top - wy * ns;
      requestRender(); return;
    }
    lastShift = e.shiftKey;
    const p = toWorld(e); cursor = p;
    $('#psCoords').textContent = `X ${fmtLen(p.x)} · Y ${fmtLen(p.y)} ${S().settings.units === 'm' ? 'm' : S().settings.units}`;
    if (drag) { dragMove(e, p); requestRender(); return; }
    snapInd = null; hoverOpen = null;
    if (['wall', 'wallrect', 'room', 'poly', 'dim', 'measure', 'text', 'furn'].includes(tool)) { const q = snap(p); if (q.snapped) snapInd = q; }
    if (tool === 'door' || tool === 'window') hoverOpen = findWallNear(p);
    if (tool !== 'select' && tool !== 'pan') requestRender();
  }

  function dragMove(e, p) {
    if (drag.mode === 'pan') { view.x = drag.vx + e.clientX - drag.sx; view.y = drag.vy + e.clientY - drag.sy; return; }
    if (drag.mode === 'rect') { draft.b = snap(p); const q = draft.b; snapInd = q.snapped ? q : null; return; }
    if (drag.mode === 'measure') { let q = snap(p); if (orthoOn(e)) q = ortho(draft.a, q); draft.b = q; return; }
    const el = byId(drag.id); if (!el) return;
    const o = drag.orig, g = pui.snap ? pui.grid : 0;
    let dx = p.x - drag.start.x, dy = p.y - drag.start.y;
    if (!drag.pushed) {
      if (Math.hypot(dx, dy) * view.s < 3) return;
      pushUndo(drag.snapshot); drag.pushed = true;
    }
    if (g) { dx = Math.round(dx / g) * g; dy = Math.round(dy / g) * g; }
    snapInd = null;
    if (drag.mode === 'move') {
      switch (el.type) {
        case 'wall':
          el.x1 = o.x1 + dx; el.y1 = o.y1 + dy; el.x2 = o.x2 + dx; el.y2 = o.y2 + dy;
          drag.links.forEach((l) => { const w = byId(l.id); if (w) { w['x' + l.end] = l.ox + dx; w['y' + l.end] = l.oy + dy; } });
          break;
        case 'room': el.points = o.points.map(([x, y]) => [x + dx, y + dy]); break;
        case 'door': case 'window': {
          const w = byId(el.wallId); if (!w) break;
          const a = { x: w.x1, y: w.y1 }, b = { x: w.x2, y: w.y2 }, L = wlen(w);
          let along = o.t * L + (projT(p, a, b) - projT(drag.start, a, b)) * L;
          if (g) along = Math.round(along / g) * g;
          el.t = clamp(along, el.width / 2, L - el.width / 2) / L;
          break;
        }
        case 'dim': el.x1 = o.x1 + dx; el.y1 = o.y1 + dy; el.x2 = o.x2 + dx; el.y2 = o.y2 + dy; break;
        case 'sym': {
          const q = { x: o.x + (p.x - drag.start.x), y: o.y + (p.y - drag.start.y) };
          const d = SYMBOLS[el.kind] || {};
          const f = d.wall && !e.altKey ? wallFaceSnap(q) : null;
          if (f) { el.x = f.x; el.y = f.y; el.angle = f.angle; } else { el.x = o.x + dx; el.y = o.y + dy; }
          break;
        }
        default: el.x = o.x + dx; el.y = o.y + dy;
      }
      return;
    }
    // Tiradores
    const h = drag.handle;
    switch (el.type) {
      case 'wall': {
        const end = h === 'p1' ? 1 : 2, other = end === 1 ? { x: o.x2, y: o.y2 } : { x: o.x1, y: o.y1 };
        let q = snap(p, { exclude: el.id });
        if (orthoOn(e) && !q.snapped) q = ortho(other, q);
        el['x' + end] = q.x; el['y' + end] = q.y;
        drag.links.forEach((l) => { const w = byId(l.id); if (w) { w['x' + l.end] = q.x; w['y' + l.end] = q.y; } });
        snapInd = q.snapped ? q : null;
        break;
      }
      case 'room': if (h[0] === 'v') { const i = +h.slice(1), q = snap(p, { exclude: el.id }); el.points[i] = [q.x, q.y]; snapInd = q.snapped ? q : null; } break;
      case 'dim':
        if (h === 'p1' || h === 'p2') { const q = snap(p); el['x' + h[1]] = q.x; el['y' + h[1]] = q.y; }
        else if (h === 'off') el.offset = dimOffset({ x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 }, p);
        break;
      case 'furn':
        if (h === 'rot') { let a = deg(Math.atan2(p.y - el.y, p.x - el.x)) + 90; if (!e.shiftKey) a = Math.round(a / 15) * 15; el.angle = ((a % 360) + 360) % 360; }
        else if (h === 'rs') {
          const l = rotPt(p.x - el.x, p.y - el.y, -(el.angle || 0));
          let w = Math.abs(l.x) * 2, hh = Math.abs(l.y) * 2;
          if (g) { w = Math.round(w / g) * g; hh = Math.round(hh / g) * g; }
          el.w = Math.max(5, r1(w)); el.h = Math.max(5, r1(hh));
        }
        break;
    }
  }

  function onUp(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!drag) return;
    const d = drag; drag = null;
    svg.classList.remove('panning');
    if (d.mode === 'rect') finishRect(draft ? draft.type : tool);
    else if ((d.mode === 'move' || d.mode === 'handle') && d.pushed) {
      const el = byId(d.id);
      if (el && el.type === 'room') el.points = el.points.map((p) => p.map(r1));
      if (el && el.type === 'wall') ['x1', 'y1', 'x2', 'y2'].forEach((k) => { el[k] = r1(el[k]); });
      snapInd = null; commit(); return;
    }
    requestRender();
  }

  /* ---------- Acciones sobre la selección ---------- */
  function deleteSel() {
    const el = sel && byId(sel); if (!el) return;
    pushUndo();
    plan().elements = els().filter((x) => x.id !== el.id && !(el.type === 'wall' && x.wallId === el.id));
    sel = null; commit();
  }
  function duplicateSel() {
    const el = sel && byId(sel); if (!el) return;
    pushUndo();
    const c = clone(el); c.id = uid();
    const d = 30;
    switch (c.type) {
      case 'wall': case 'dim': c.x1 += d; c.y1 += d; c.x2 += d; c.y2 += d; break;
      case 'room': c.points = c.points.map(([x, y]) => [x + d, y + d]); c.name = (c.name || '') + ' (copia)'; break;
      case 'door': case 'window': { const w = byId(c.wallId); if (w) { const L = wlen(w); c.t = clamp(c.t * L + c.width + 20, c.width / 2, L - c.width / 2) / L; } break; }
      default: c.x += d; c.y += d;
    }
    els().push(c); sel = c.id; commit();
  }
  function rotateSel() {
    const el = sel && byId(sel); if (!el) return;
    pushUndo();
    if (el.type === 'furn' || el.type === 'sym') el.angle = (((el.angle || 0) + 90) % 360);
    else if (el.type === 'door') {
      const seq = [['left', 1], ['right', 1], ['right', -1], ['left', -1]];
      const i = seq.findIndex(([h, s]) => h === el.hinge && s === (el.side || 1));
      [el.hinge, el.side] = seq[(i + 1) % 4];
    } else { undoStack.pop(); return; }
    commit();
  }
  function nudge(dx, dy) {
    const el = sel && byId(sel); if (!el) return;
    pushUndo();
    switch (el.type) {
      case 'wall': case 'dim': el.x1 += dx; el.y1 += dy; el.x2 += dx; el.y2 += dy; break;
      case 'room': el.points = el.points.map(([x, y]) => [x + dx, y + dy]); break;
      case 'door': case 'window': { const w = byId(el.wallId); if (w) { const L = wlen(w); const step = (dx || dy); el.t = clamp(el.t * L + step, el.width / 2, L - el.width / 2) / L; } break; }
      default: el.x += dx; el.y += dy;
    }
    commit();
  }
  function splitWall(w) {
    pushUndo();
    const mx = r1((w.x1 + w.x2) / 2), my = r1((w.y1 + w.y2) / 2);
    const w2 = Object.assign(clone(w), { id: uid(), x1: mx, y1: my });
    w.x2 = mx; w.y2 = my;
    els().push(w2);
    els().forEach((o) => {
      if ((o.type === 'door' || o.type === 'window') && o.wallId === w.id) {
        if (o.t > 0.5) { o.wallId = w2.id; o.t = (o.t - 0.5) * 2; } else o.t = o.t * 2;
      }
    });
    commit(); toast('Muro dividido en dos', 'success');
  }
  function moveWallEnd(w, end, nx, ny) {
    const links = linksAt({ x: w['x' + end], y: w['y' + end] }, w.id);
    w['x' + end] = r1(nx); w['y' + end] = r1(ny);
    links.forEach((l) => { const o = byId(l.id); o['x' + l.end] = r1(nx); o['y' + l.end] = r1(ny); });
  }
  function setProp(el, k, v) {
    const n = num(v, NaN);
    switch (k) {
      case 'length': if (el.type === 'wall' && n > 0) { const a = Math.atan2(el.y2 - el.y1, el.x2 - el.x1); moveWallEnd(el, 2, el.x1 + Math.cos(a) * n, el.y1 + Math.sin(a) * n); } return;
      case 'wangle': if (el.type === 'wall' && Number.isFinite(n)) { const L = wlen(el), a = (-n * Math.PI) / 180; moveWallEnd(el, 2, el.x1 + Math.cos(a) * L, el.y1 + Math.sin(a) * L); } return;
      case 'pos': { const w = byId(el.wallId); if (w && Number.isFinite(n)) { const L = wlen(w); el.t = clamp(n + el.width / 2, el.width / 2, L - el.width / 2) / L; } return; }
      case 'width': if (n > 0) { el.width = n; const w = byId(el.wallId); if (w) { const L = wlen(w); el.width = Math.min(n, L); el.t = clamp(el.t * L, el.width / 2, L - el.width / 2) / L; } } return;
      case 'angle': if (Number.isFinite(n)) el.angle = ((n % 360) + 360) % 360; return;
      case 'thick': case 'height': case 'sill': case 'w': case 'h': case 'size': case 'ceiling':
        if (Number.isFinite(n) && n >= 0) el[k] = n; return;
      case 'x': case 'y': case 'offset': if (Number.isFinite(n)) el[k] = n; return;
      case 'kind':
        el.kind = v;
        if (el.type === 'sym' && SYMBOLS[v]) el.height = SYMBOLS[v].h;
        return;
      default: el[k] = v;
    }
  }

  /* ---------- Panel derecho ---------- */
  const F = {
    num: (label, p, v, suf = 'cm', step = 1) => `<label class="pf"><span>${label}</span><div class="inp-suf"><input type="number" data-p="${p}" value="${Number.isFinite(v) ? r1(v) : ''}" step="${step}"><em>${suf}</em></div></label>`,
    text: (label, p, v, ph = '') => `<label class="pf full"><span>${label}</span><input type="text" data-p="${p}" value="${esc(v || '')}" placeholder="${esc(ph)}"></label>`,
    area: (label, p, v, ph = '') => `<label class="pf full"><span>${label}</span><textarea data-p="${p}" rows="3" placeholder="${esc(ph)}">${esc(v || '')}</textarea></label>`,
    sel: (label, p, v, o, full) => `<label class="pf ${full ? 'full' : ''}"><span>${label}</span><select data-p="${p}">${Object.entries(o).map(([k, l]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`,
    info: (label, val) => `<div class="pinfo"><span>${label}</span><b>${val}</b></div>`,
  };
  const actions = (...btns) => `<div class="pactions">${btns.join('')}</div>`;
  const B = {
    dup: `<button class="btn sm" data-a="dup" title="Ctrl+D">${icon('copy', 14)} Duplicar</button>`,
    rot: `<button class="btn sm" data-a="rotate" title="R">${icon('rotate', 14)} Girar</button>`,
    del: `<button class="btn sm danger" data-a="del" title="Supr">${icon('trash', 14)} Eliminar</button>`,
  };

  function renderPanel() {
    if (!panel) return;
    const el = sel && byId(sel);
    let h = `<div class="panel-mobile-head"><span>${el ? 'Propiedades' : tool === 'furn' ? 'Mobiliario y exterior' : tool === 'sym' ? 'Instalaciones' : 'Resumen del plano'}</span><button class="icon-btn sm" data-a="closePanel" title="Cerrar panel">${icon('x', 18)}</button></div>`;
    if (el) h += propsFor(el);
    else if (tool === 'furn') h += furnLibrary();
    else if (tool === 'sym') h += symLibrary();
    else if (tool === 'wall' || tool === 'wallrect') h += wallToolOpts() + summary();
    else h += summary();
    panel.innerHTML = h;
    syncTop();
  }
  function renderPanelKeepFocus() {
    const a = document.activeElement, key = a && a.dataset ? a.dataset.p : null;
    renderPanel();
    if (key) { const n = panel.querySelector(`[data-p="${key}"]`); if (n) n.focus(); }
  }

  function wallToolOpts() {
    return `<div class="psec"><h4>${icon('wall', 16)} Opciones de muro</h4>
      <div class="chips">${[7, 10, 12, 15, 20, 25, 30].map((t) => `<button class="chip ${pui.wallThick === t ? 'on' : ''}" data-a="wthick" data-v="${t}">${t} cm</button>`).join('')}</div>
      <div class="pgrid">
        <label class="pf"><span>Grosor</span><div class="inp-suf"><input type="number" data-wo="wallThick" value="${pui.wallThick}" min="1"><em>cm</em></div></label>
        <label class="pf"><span>Estado</span><select data-wo="wallStatus">${Object.entries(WALL_STATUS).map(([k, l]) => `<option value="${k}" ${k === pui.wallStatus ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      </div>
      <p class="phint">${icon('hint', 14)} Mientras dibujas, teclea la longitud exacta (en cm) y pulsa <kbd>Enter</kbd>.</p>
    </div>`;
  }

  function furnLibrary() {
    const th = T();
    const isExt = plan().scope === 'exterior';
    const renderItems = (items) => `<div class="lib">${items.map(({ f, i }) => {
      const m = Math.max(f.w, f.h) * 1.15, s = 54 / m;
      return `<button class="lib-item ${placing && placing.t === 'furn' && placing.i === i ? 'active' : ''}" data-a="pickFurn" data-i="${i}">
        <svg viewBox="${-m / 2} ${-m / 2} ${m} ${m}" width="54" height="54">${furnShape(f, s, Object.assign({}, th, { furnFill: 'transparent' }), { noLabel: true })}</svg>
        <span>${esc(f.name)}</span><small>${f.w}×${f.h}</small></button>`;
    }).join('')}</div>`;
    const ints = FURN.map((f, i) => ({ f, i })).filter((x) => !x.f.ext);
    const exts = FURN.map((f, i) => ({ f, i })).filter((x) => x.f.ext);
    const groups = isExt ? [{ title: 'Exterior y parcela', ic: 'tree', list: exts }, { title: 'Mobiliario interior', ic: 'sofa', list: ints }]
      : [{ title: 'Mobiliario interior', ic: 'sofa', list: ints }, { title: 'Exterior y parcela', ic: 'tree', list: exts }];
    return `<div class="psec"><h4>${icon('sofa', 16)} Elementos y mobiliario</h4><p class="phint">Elige un elemento y toca el plano para colocarlo. Después puedes ajustar sus medidas exactas.</p></div>`
      + groups.map((g) => `<div class="psec"><h4>${icon(g.ic, 16)} ${g.title}</h4>${renderItems(g.list)}</div>`).join('');
  }

  function symLibrary() {
    const th = T();
    return `<div class="psec"><h4>${icon('bolt', 16)} Instalaciones</h4><p class="phint">Los elementos de pared se pegan automáticamente al muro más cercano. Cada punto guarda su altura desde el suelo.</p></div>
      ${Object.entries(SYM_GROUPS).map(([gk, g]) => `<div class="psec"><h5 style="--c:${g.color}"><i class="dot"></i>${g.label}</h5>
        <div class="sym-list">${Object.entries(SYMBOLS).filter(([, d]) => d.group === gk).map(([k, d]) => `
          <button class="sym-item ${placing && placing.kind === k ? 'active' : ''}" data-a="pickSym" data-k="${k}">
            <svg viewBox="-12 -12 24 24" width="26" height="26">${symShape({ kind: k, angle: 0, height: d.h }, 1, th).replace(/<line[^>]*\/>/, '')}</svg>
            <span>${d.label}</span><small>${d.h ? 'h ' + d.h : ''}</small></button>`).join('')}</div></div>`).join('')}`;
  }

  function propsFor(el) {
    const head = (ic, title, sub = '') => `<div class="psec phead"><div class="phead-ic">${icon(ic, 18)}</div><div><h4>${title}</h4>${sub ? `<small>${sub}</small>` : ''}</div><button class="icon-btn sm" data-a="deselect" title="Cerrar (Esc)">${icon('x', 16)}</button></div>`;
    switch (el.type) {
      case 'wall': {
        const L = wlen(el), ops = els().filter((o) => o.wallId === el.id);
        const huecos = ops.reduce((s, o) => s + (o.width * (o.height || 0)) / 10000, 0);
        return head('wall', 'Muro', WALL_STATUS[el.status || 'existente']) + `<div class="psec"><div class="pgrid">
          ${F.num('Longitud', 'length', L)}${F.num('Grosor', 'thick', el.thick)}
          ${F.num('Ángulo', 'wangle', Math.round((((-deg(Math.atan2(el.y2 - el.y1, el.x2 - el.x1))) % 360) + 360) % 360 * 10) / 10, '°')}${F.num('Altura', 'height', el.height || 250)}
          ${F.sel('Estado', 'status', el.status || 'existente', WALL_STATUS, true)}
        </div>
        <div class="pinfos">${F.info('Superficie por cara', fmtNum((L * (el.height || 250)) / 10000) + ' m²')}${F.info('Huecos en el muro', ops.length + (huecos ? ` (${fmtNum(huecos)} m²)` : ''))}${F.info('Superficie neta por cara', fmtNum((L * (el.height || 250)) / 10000 - huecos) + ' m²')}</div>
        ${F.area('Notas', 'note', el.note, 'Material, refuerzos, rozas…')}</div>
        ${actions(`<button class="btn sm" data-a="split">${icon('split', 14)} Dividir</button>`, B.dup, B.del)}`;
      }
      case 'room': {
        const a = polyArea(el.points) / 10000, pm = polyPerim(el.points) / 100, c = el.ceiling || 250;
        const linked = S().tasks.filter((t) => t.zone && el.name && t.zone.toLowerCase() === el.name.toLowerCase());
        return head('roomrect', esc(el.name || 'Habitación'), fmtNum(a) + ' m²') + `<div class="psec">
          ${F.text('Nombre', 'name', el.name, 'Ej. Cocina')}
          <div class="pf full"><span>Color</span><div class="swatches">${ROOM_COLORS.map((col) => `<button class="sw ${col === el.color ? 'on' : ''}" style="--c:${col}" data-a="color" data-c="${col}"></button>`).join('')}</div></div>
          <div class="pgrid">${F.num('Altura de techo', 'ceiling', c)}</div>
          ${F.text('Suelo / pavimento', 'floor', el.floor, 'Ej. Porcelánico 60x60')}
          ${F.text('Paredes / acabado', 'wallsFinish', el.wallsFinish, 'Ej. Pintura plástica blanca')}
          <div class="pinfos">
            ${F.info('Superficie útil', fmtNum(a) + ' m²')}${F.info('Perímetro (rodapié)', fmtNum(pm) + ' m')}
            ${F.info('Superficie de paredes', fmtNum(pm * (c / 100)) + ' m²')}${F.info('Volumen', fmtNum(a * (c / 100)) + ' m³')}
            ${F.info('Suelo + 10% merma', fmtNum(a * 1.1) + ' m²')}
          </div>
          ${F.area('Notas', 'note', el.note, 'Ideas, medidas especiales…')}
        </div>
        <div class="psec"><h4>${icon('tasks', 16)} Tareas de esta estancia</h4>
          ${linked.length ? `<div class="plinks">${linked.map((t) => `<button class="plink ${t.status === 'hecho' ? 'done' : ''}" data-a="openTask" data-t="${t.id}"><i style="--c:${Tasks.statusOf(t.status).color}"></i>${esc(t.title)}</button>`).join('')}</div>` : '<p class="phint">No hay tareas con la zona «' + esc(el.name || '') + '».</p>'}
          <button class="btn sm" data-a="addTask">${icon('plus', 14)} Añadir tarea para esta estancia</button>
        </div>
        ${actions(B.dup, B.del)}`;
      }
      case 'door': case 'window': {
        const w = byId(el.wallId), L = w ? wlen(w) : 0, pos = el.t * L - el.width / 2;
        const isDoor = el.type === 'door';
        return head(isDoor ? 'door' : 'window', isDoor ? 'Puerta' : 'Ventana', (isDoor ? DOOR_KINDS : WIN_KINDS)[el.kind] || '') + `<div class="psec"><div class="pgrid">
          ${F.sel('Tipo', 'kind', el.kind, isDoor ? DOOR_KINDS : WIN_KINDS, true)}
          ${F.num('Ancho', 'width', el.width)}${F.num('Alto', 'height', el.height)}
          ${isDoor ? '' : F.num('Antepecho (desde suelo)', 'sill', el.sill || 0)}
          ${F.num('Distancia al inicio', 'pos', pos)}
        </div>
        <div class="pinfos">${F.info('Distancia al final del muro', fmtLenU(L - pos - el.width))}${F.info('Longitud del muro', fmtLenU(L))}${isDoor ? '' : F.info('Altura del dintel', fmtLenU((el.sill || 0) + (el.height || 0)))}${F.info('Superficie del hueco', fmtNum((el.width * (el.height || 0)) / 10000) + ' m²')}</div>
        ${isDoor ? `<div class="pactions"><button class="btn sm" data-a="hinge">${icon('flip', 14)} Cambiar bisagra</button><button class="btn sm" data-a="flip">${icon('rotate', 14)} Abrir hacia el otro lado</button></div>` : ''}
        ${F.area('Notas', 'note', el.note, 'Modelo, color, manilla, persiana…')}</div>
        ${actions(B.dup, B.del)}`;
      }
      case 'furn':
        return head('sofa', esc(el.name || 'Mueble'), `${r1(el.w)} × ${r1(el.h)} cm`) + `<div class="psec">
          ${F.text('Nombre', 'name', el.name)}
          <div class="pgrid">${F.num('Ancho', 'w', el.w)}${F.num('Fondo', 'h', el.h)}${F.num('Ángulo', 'angle', el.angle || 0, '°', 15)}${F.num('X', 'x', el.x)}${F.num('Y', 'y', el.y)}</div>
          ${F.area('Notas', 'note', el.note, 'Modelo, enlace, precio…')}</div>
          ${actions(B.rot, B.dup, B.del)}`;
      case 'sym': {
        const d = SYMBOLS[el.kind] || SYMBOLS.enchufe;
        const opts = {}; Object.entries(SYMBOLS).forEach(([k, v]) => { opts[k] = `${SYM_GROUPS[v.group].label.split(' ')[0]} · ${v.label}`; });
        return head(d.group === 'fonta' ? 'drop' : 'bolt', d.label, SYM_GROUPS[d.group].label) + `<div class="psec">
          ${F.sel('Tipo', 'kind', el.kind, opts, true)}
          <div class="pgrid">${F.num('Altura desde el suelo', 'height', el.height || 0)}${F.num('Ángulo', 'angle', el.angle || 0, '°', 90)}${F.num('X', 'x', el.x)}${F.num('Y', 'y', el.y)}</div>
          ${F.area('Notas', 'note', el.note, 'Circuito, potencia, mecanismo…')}</div>
          ${actions(B.rot, B.dup, B.del)}`;
      }
      case 'dim': {
        const L = dist({ x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 });
        return head('dim', 'Cota', fmtLenU(L)) + `<div class="psec">
          <div class="pinfos">${F.info('Distancia medida', fmtLenU(L))}</div>
          <div class="pgrid">${F.num('Separación', 'offset', el.offset || 0)}</div>
          ${F.text('Texto personalizado', 'text', el.text, 'Vacío = medida automática')}</div>
          ${actions(B.dup, B.del)}`;
      }
      case 'text':
        return head('text', 'Texto') + `<div class="psec">${F.text('Texto', 'text', el.text)}
          <div class="pgrid">${F.num('Tamaño', 'size', el.size || 20)}<label class="pf"><span>Color</span><input type="color" data-p="color" value="${el.color || '#1f2937'}"></label></div></div>
          ${actions(B.dup, B.del)}`;
      case 'pin': {
        const taskOpts = { '': '— Sin vincular a tarea —' };
        S().tasks.forEach((t) => { taskOpts[t.id] = `${t.title} (${Tasks.statusOf(t.status).label})`; });
        const linked = el.taskId && S().tasks.find((t) => t.id === el.taskId);
        return head('pin', 'Pin de tarea / incidencia', linked ? Tasks.statusOf(linked.status).label : 'Libre') + `<div class="psec">
          ${F.text('Etiqueta en el plano', 'label', el.label, 'Ej. Humedad, mover radiador…')}
          ${F.sel('Tarea vinculada', 'taskId', el.taskId || '', taskOpts, true)}
          ${linked ? `<button class="btn sm primary" data-a="openTask" data-t="${linked.id}">${icon('tasks', 14)} Abrir tarea vinculada</button>` : `<label class="pf"><span>Color del pin</span><input type="color" data-p="color" value="${el.color || '#ef4444'}"></label>`}
          ${F.area('Notas', 'note', el.note, 'Detalles de este punto…')}</div>
          ${actions(B.dup, B.del)}`;
      }
    }
    return '';
  }

  function summary() {
    const st = stats(plan());
    const symGroups = Object.entries(SYM_GROUPS).map(([gk, g]) => {
      const rows = Object.entries(st.syms).filter(([k]) => (SYMBOLS[k] || {}).group === gk);
      if (!rows.length) return '';
      return `<h5 style="--c:${g.color}"><i class="dot"></i>${g.label}</h5>` + rows.map(([k, n]) => F.info(SYMBOLS[k].label, n)).join('');
    }).join('');
    return `<div class="psec">
        <h4>${icon('plan', 16)} Plano actual</h4>
        <label class="pf full"><span>Nombre</span><input type="text" data-pl="name" value="${esc(plan().name)}"></label>
        <div class="pgrid">
          <label class="pf"><span>Tipo</span><select data-pl="scope"><option value="interior" ${plan().scope !== 'exterior' ? 'selected' : ''}>Interior</option><option value="exterior" ${plan().scope === 'exterior' ? 'selected' : ''}>Exterior</option></select></label>
          <label class="pf"><span>Planta / zona</span><input type="text" data-pl="level" list="planLevelList" value="${esc(plan().level || '')}" placeholder="Ej. Planta 1"><datalist id="planLevelList">${PLAN_LEVELS.map((l) => `<option value="${esc(l)}">`).join('')}</datalist></label>
        </div>
        <div class="pstats"><div><b>${fmtNum(st.area)} m²</b><span>Superficie útil</span></div><div><b>${st.rooms.length}</b><span>Estancias</span></div></div>
      </div>
      <div class="psec"><h4>${icon('roomrect', 16)} Estancias</h4>
        ${st.rooms.length ? `<div class="rooms">${st.rooms.map((r) => `<button class="room-row" data-a="selectEl" data-id="${r.id}"><i style="--c:${r.color}"></i><span>${esc(r.name || 'Sin nombre')}</span><b>${fmtNum(r.area)} m²</b><small>${fmtNum(r.perim)} m</small></button>`).join('')}</div>` : '<p class="phint">Dibuja estancias con las herramientas de muro o habitación.</p>'}
      </div>
      <div class="psec"><h4>${icon('wall', 16)} Muros</h4>
        ${Object.keys(st.walls).length ? Object.entries(st.walls).map(([k, v]) => F.info(WALL_STATUS[k] || k, `${fmtNum(v.len)} m · ${fmtNum(v.area)} m²`)).join('') : '<p class="phint">Sin muros todavía.</p>'}
      </div>
      <div class="psec"><h4>${icon('door', 16)} Carpintería</h4>${F.info('Puertas', st.doors)}${F.info('Ventanas', st.windows)}${F.info('Muebles', st.furn)}</div>
      <div class="psec"><h4>${icon('bolt', 16)} Instalaciones</h4>${symGroups || '<p class="phint">Añade enchufes, puntos de luz, tomas de agua… con la herramienta <kbd>E</kbd>.</p>'}</div>
      <details class="psec shortcuts"><summary>${icon('info', 16)} Atajos de teclado</summary>
        <div class="kbd-list">
          ${TOOLS.filter((t) => !t.sep).map((t) => `<div><kbd>${t.key}</kbd><span>${t.label}</span></div>`).join('')}
          <div><kbd>Supr</kbd><span>Eliminar selección</span></div><div><kbd>Ctrl Z / Y</kbd><span>Deshacer / rehacer</span></div>
          <div><kbd>Ctrl D</kbd><span>Duplicar</span></div><div><kbd>R</kbd><span>Girar / cambiar apertura</span></div>
          <div><kbd>Flechas</kbd><span>Mover (Shift ×10)</span></div><div><kbd>Espacio</kbd><span>Mantener para desplazar</span></div>
          <div><kbd>+ / − / 0</kbd><span>Zoom / encuadrar</span></div><div><kbd>Shift</kbd><span>Alternar ortogonal</span></div>
          <div><kbd>Esc</kbd><span>Cancelar / soltar herramienta</span></div>
        </div>
      </details>`;
  }

  /* ---------- Exportación ---------- */
  function exportPlan(fmt) {
    const list = els(), b = bbox(list);
    if (!b) { toast('El plano está vacío', 'warn'); return; }
    const th = T(), bw = b.x2 - b.x1, bh = b.y2 - b.y1;
    const s = clamp((fmt === 'png' ? 2400 : 1400) / Math.max(bw, bh), 0.3, 6);
    const pad = 70, head = 80, W = Math.ceil(bw * s + pad * 2), H = Math.ceil(bh * s + pad * 2 + head);
    const st = stats(plan());
    const inner = renderElements(list, s, th, pui.layers, pui.autoDims).replace(/ data-id="[^"]*"/g, '');
    const cands = [50, 100, 200, 500, 1000], sbl = cands.find((c) => c * s >= 120) || 1000;
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif">
      <rect width="${W}" height="${H}" fill="${th.bg}"/>
      <text x="${pad}" y="44" font-size="24" font-weight="800" fill="${th.text}">${esc(S().project.name)} — ${esc(plan().name)}</text>
      <text x="${pad}" y="68" font-size="14" fill="${th.text}" opacity=".7">Superficie útil ${fmtNum(st.area)} m² · ${st.rooms.length} estancias · ${new Date().toLocaleDateString('es-ES')}</text>
      <g transform="translate(${W - pad - sbl * s} 40)"><rect width="${sbl * s}" height="8" fill="${th.text}"/><rect width="${(sbl * s) / 2}" height="8" fill="${th.bg}" stroke="${th.text}"/><text x="${(sbl * s) / 2}" y="28" font-size="13" text-anchor="middle" fill="${th.text}">${sbl / 100} m</text></g>
      <g transform="translate(${pad - b.x1 * s} ${pad + head - b.y1 * s}) scale(${s})">${inner}</g></svg>`;
    const fname = `${(S().project.name + '-' + plan().name).replace(/[^\w\-áéíóúñ ]+/gi, '').replace(/\s+/g, '_')}`;
    if (fmt === 'svg') { download(fname + '.svg', svgStr, 'image/svg+xml'); return; }
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      c.toBlob((blob) => { download(fname + '.png', blob); toast('Imagen exportada', 'success'); }, 'image/png');
    };
    img.onerror = () => toast('No se pudo generar la imagen', 'error');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
  }

  function thumb(p, W, H) {
    const b = bbox(p.elements), th = T();
    if (!b) return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%"><rect width="${W}" height="${H}" fill="${th.bg}"/><text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="13" fill="${th.text}" opacity=".5">Plano vacío</text></svg>`;
    const bw = b.x2 - b.x1, bh = b.y2 - b.y1, pad = 16;
    const s = Math.min((W - pad * 2) / bw, (H - pad * 2) / bh);
    const tx = (W - bw * s) / 2 - b.x1 * s, ty = (H - bh * s) / 2 - b.y1 * s;
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" font-family="Inter, sans-serif"><rect width="${W}" height="${H}" fill="${th.bg}"/><g transform="translate(${tx} ${ty}) scale(${s})">${renderElements(p.elements, s, th, DEF_LAYERS, false).replace(/ data-id="[^"]*"/g, '')}</g></svg>`;
  }

  /* ---------- Enlaces de eventos ---------- */
  function bind() {
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', onUp);
    svg.addEventListener('pointerleave', () => { if (!drag) { cursor = null; snapInd = null; hoverOpen = null; requestRender(); } });
    svg.addEventListener('contextmenu', (e) => e.preventDefault());
    svg.addEventListener('dblclick', (e) => {
      if (draft && draft.type === 'wall') { draft = null; requestRender(); }
      else if (draft && draft.type === 'poly') closePoly();
      else if (tool === 'select') { const t = e.target.closest('[data-id]'); if (t) setTimeout(() => { const i = panel.querySelector('[data-p="name"], [data-p="text"], [data-p="length"]'); if (i) { i.focus(); i.select && i.select(); } }, 20); }
    });
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
    }, { passive: false });
    window.addEventListener('resize', () => requestRender());

    $('#pTools').addEventListener('click', (e) => { const b = e.target.closest('[data-tool]'); if (b) setTool(b.dataset.tool); });

    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-pt]');
      if (t && t.tagName !== 'SUMMARY') { pui[t.dataset.pt] = !pui[t.dataset.pt]; savePui(); syncTop(); requestRender(); return; }
      const a = e.target.closest('[data-pa]'); if (!a) return;
      const dd = a.closest('details'); if (dd) dd.open = false;
      switch (a.dataset.pa) {
        case 'undo': doUndo(); break;
        case 'redo': doRedo(); break;
        case 'zoomIn': zoomBy(1.25); break;
        case 'zoomOut': zoomBy(0.8); break;
        case 'zoom100': { const r = svg.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, 1 / view.s); break; }
        case 'fit': fit(); break;
        case 'exportPng': exportPlan('png'); break;
        case 'exportSvg': exportPlan('svg'); break;
        case 'addPlan': openPlanModal(false); break;
        case 'dupPlan': openPlanModal(true); break;
        case 'bgModal': openBgModal(); break;
        case 'compareModal': openCompareModal(); break;
        case 'delPlan': {
          if (!confirm(`¿Eliminar el plano «${plan().name}» y todo su contenido?`)) break;
          if (S().plans.length === 1) { pushUndo(); plan().elements = []; commit(); break; }
          S().plans = S().plans.filter((p) => p.id !== plan().id); switchPlan(S().plans[0].id); break;
        }
        case 'togglePanel': setMobilePanel(!root.classList.contains('panel-open')); break;
        case 'openPanel': setMobilePanel(true); break;
        case 'finishDraft': if (draft && draft.type === 'poly') closePoly(); else { draft = null; updateSelBar(); requestRender(); } break;
        case 'cancelDraft': draft = null; placing = null; updateSelBar(); renderPanel(); requestRender(); break;
        case 'rotPlacing': if (placing && placing.t === 'furn') { placing.angle = ((placing.angle || 0) + 90) % 360; requestRender(); } break;
        case 'rotSel': rotateSel(); break;
        case 'dupSel': duplicateSel(); break;
        case 'delSel': deleteSel(); break;
      }
    });
    root.addEventListener('change', (e) => {
      const t = e.target;
      if (t.id === 'pPlanSel') switchPlan(t.value);
      else if (t.id === 'pGrid') { pui.grid = +t.value; savePui(); }
      else if (t.id === 'pTheme') { S().settings.planTheme = t.value; Store.save(); renderPanel(); requestRender(); }
      else if (t.dataset.layer) { pui.layers[t.dataset.layer] = t.checked; savePui(); requestRender(); }
    });
    document.addEventListener('click', (e) => { $$('details.dropdown[open]').forEach((d) => { if (!d.contains(e.target)) d.open = false; }); });

    // Panel
    let panelSnap = null;
    panel.addEventListener('focusin', (e) => { if (e.target.dataset.p) panelSnap = JSON.stringify(els()); });
    panel.addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.pl && t.tagName !== 'SELECT') { plan()[t.dataset.pl] = t.value; Store.save(); syncTop(); return; }
      if (!t.dataset.p || t.type === 'number' || t.tagName === 'SELECT') return;
      const el = sel && byId(sel); if (!el) return;
      if (panelSnap) { pushUndo(panelSnap); panelSnap = null; }
      setProp(el, t.dataset.p, t.value); Store.save(); requestRender();
    });
    panel.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.pl) { plan()[t.dataset.pl] = t.value; Store.save(); syncTop(); renderPanel(); return; }
      if (t.dataset.wo) { pui[t.dataset.wo] = t.dataset.wo === 'wallThick' ? Math.max(1, num(t.value, 15)) : t.value; savePui(); requestRender(); setTimeout(renderPanelKeepFocus, 0); return; }
      if (!t.dataset.p) return;
      const el = sel && byId(sel); if (!el) return;
      if (t.type === 'number' || t.tagName === 'SELECT') {
        if (panelSnap) { pushUndo(panelSnap); panelSnap = null; } else pushUndo();
        setProp(el, t.dataset.p, t.value);
      }
      Store.save(); requestRender(); setTimeout(renderPanelKeepFocus, 0);
      panelSnap = JSON.stringify(els());
    });
    panel.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const el = sel && byId(sel);
      switch (b.dataset.a) {
        case 'closePanel': setMobilePanel(false); break;
        case 'del': deleteSel(); setMobilePanel(false); break;
        case 'dup': duplicateSel(); break;
        case 'rotate': rotateSel(); break;
        case 'deselect': sel = null; setMobilePanel(false); renderPanel(); requestRender(); break;
        case 'split': if (el) splitWall(el); break;
        case 'hinge': if (el) { pushUndo(); el.hinge = el.hinge === 'right' ? 'left' : 'right'; commit(); } break;
        case 'flip': if (el) { pushUndo(); el.side = -(el.side || 1); commit(); } break;
        case 'color': if (el) { pushUndo(); el.color = b.dataset.c; commit(); } break;
        case 'selectEl': sel = b.dataset.id; setTool('select', true); renderPanel(); requestRender(); break;
        case 'wthick': pui.wallThick = +b.dataset.v; savePui(); renderPanel(); break;
        case 'pickFurn': { const i = +b.dataset.i; placing = { t: 'furn', i, def: FURN[i], angle: placing && placing.t === 'furn' ? placing.angle : 0 }; renderPanel(); if (window.innerWidth <= 900) setMobilePanel(false); break; }
        case 'pickSym': placing = { t: 'sym', kind: b.dataset.k }; renderPanel(); if (window.innerWidth <= 900) setMobilePanel(false); break;
        case 'openTask': App.openTask(b.dataset.t); break;
        case 'addTask': {
          if (!el) break;
          const title = (prompt(`Nueva tarea para «${el.name}»:`) || '').trim(); if (!title) break;
          const cat = Store.state.categories.find((c) => c.toLowerCase() === String(el.name).toLowerCase());
          Tasks.create(Object.assign({ title, zone: el.name }, cat ? { category: cat } : {}));
          renderPanel(); toast('Tarea creada', 'success'); break;
        }
      }
    });

    // Teclado
    document.addEventListener('keydown', (e) => {
      if (App.current !== 'plano' || $('#drawer').classList.contains('open')) return;
      const tg = e.target, typing = /INPUT|TEXTAREA|SELECT/.test(tg.tagName) || tg.isContentEditable;
      if (typing) { if (e.key === 'Escape') tg.blur(); return; }
      const k = e.key, mod = e.ctrlKey || e.metaKey;
      if (mod && k.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) doRedo(); else doUndo(); return; }
      if (mod && k.toLowerCase() === 'y') { e.preventDefault(); doRedo(); return; }
      if (mod && k.toLowerCase() === 'd') { e.preventDefault(); duplicateSel(); return; }
      if (mod || e.altKey) return;
      if (draft && draft.type === 'wall') {
        if (/^[0-9.,]$/.test(k)) { draft.typed += k; requestRender(); e.preventDefault(); return; }
        if (k === 'Backspace' && draft.typed) { draft.typed = draft.typed.slice(0, -1); requestRender(); e.preventDefault(); return; }
        if (k === 'Enter' && draft.typed) { const q = typedEnd(); if (dist(q, draft.a) >= 1) { addWall(draft.a, q); draft.a = q; } draft.typed = ''; requestRender(); return; }
      }
      if (k === 'Enter' && draft && draft.type === 'poly') { closePoly(); return; }
      if (k === 'Escape') {
        if (draft) draft = null;
        else if (placing) { placing = null; renderPanel(); }
        else if (sel) { sel = null; renderPanel(); }
        else if (tool !== 'select') setTool('select');
        requestRender(); return;
      }
      if (k === 'Delete' || k === 'Backspace') { if (sel) { e.preventDefault(); deleteSel(); } return; }
      if (k === ' ') { spaceDown = true; svg.classList.add('space'); e.preventDefault(); return; }
      if (k.startsWith('Arrow') && sel) {
        e.preventDefault();
        const st = (pui.grid || 1) * (e.shiftKey ? 10 : 1);
        nudge(k === 'ArrowLeft' ? -st : k === 'ArrowRight' ? st : 0, k === 'ArrowUp' ? -st : k === 'ArrowDown' ? st : 0);
        return;
      }
      if (k === 'r' || k === 'R') { if (placing && placing.t === 'furn') { placing.angle = ((placing.angle || 0) + 90) % 360; requestRender(); } else rotateSel(); return; }
      if (k === '+' || k === '=') { zoomBy(1.25); return; }
      if (k === '-') { zoomBy(0.8); return; }
      if (k === '0') { fit(); return; }
      const tl = TOOLS.find((x) => x.key && x.key.toLowerCase() === k.toLowerCase());
      if (tl) setTool(tl.id);
    });
    document.addEventListener('keyup', (e) => { if (e.key === ' ') { spaceDown = false; svg.classList.remove('space'); } });
  }

  function openBgModal() {
    const bgi = plan().bgImage;
    Modal.open({
      title: 'Imagen de fondo para calcar',
      body: `<div class="callout" style="margin-bottom:14px">${icon('image', 18)}
          <div>Sube una foto o captura de tu plano real. Luego pulsa <b>Calibrar con 2 puntos</b>, marca los dos extremos de una pared cuya medida conozcas y el plano se ajustará a escala real automáticamente.</div>
        </div>
        <div class="imp-drop" style="margin-bottom:14px">
          <input type="file" id="bgFile" accept="image/*" hidden>
          <button class="btn primary" id="bgPick">${icon('upload', 16)} ${bgi ? 'Cambiar imagen' : 'Subir foto / plano'}</button>
          ${bgi ? `<button class="btn" id="bgCalib">${icon('ruler', 16)} Calibrar con 2 puntos</button><button class="btn danger" id="bgRemove">${icon('trash', 15)} Quitar</button>` : ''}
        </div>
        ${bgi ? `<div class="grid2">
          <label class="field span2"><span>Opacidad (${Math.round((bgi.opacity ?? 0.45) * 100)}%)</span><input type="range" id="bgOp" min="0.05" max="1" step="0.05" value="${bgi.opacity ?? 0.45}"></label>
          <label class="field"><span>Ancho en el plano (cm)</span><input type="number" id="bgW" value="${Math.round(bgi.w || 1000)}"></label>
          <label class="field"><span>Alto en el plano (cm)</span><input type="number" id="bgH" value="${Math.round(bgi.h || 800)}"></label>
          <label class="field"><span>Posición X (cm)</span><input type="number" id="bgX" value="${Math.round(bgi.x || 0)}"></label>
          <label class="field"><span>Posición Y (cm)</span><input type="number" id="bgY" value="${Math.round(bgi.y || 0)}"></label>
        </div>` : '<p class="muted small">No hay ninguna imagen de fondo cargada en este plano.</p>'}`,
      foot: `<button class="btn" data-modal-close>Cerrar</button>`,
      onOpen(card) {
        const fileInp = $('#bgFile', card);
        $('#bgPick', card).addEventListener('click', () => fileInp.click());
        fileInp.addEventListener('change', () => {
          const f = fileInp.files[0]; if (!f) return;
          const img = new Image();
          const url = URL.createObjectURL(f);
          img.onload = () => {
            const maxDim = 1600;
            const sc = Math.min(1, maxDim / Math.max(img.width, img.height));
            const c = document.createElement('canvas');
            c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            URL.revokeObjectURL(url);
            const ratio = c.height / c.width;
            plan().bgImage = { src: c.toDataURL('image/jpeg', 0.78), x: 0, y: 0, w: 1000, h: Math.round(1000 * ratio), opacity: 0.45 };
            Store.save(); syncTop(); requestRender(); fit();
            Modal.close(); openBgModal();
            toast('Imagen cargada. Ahora puedes calibrarla con 2 puntos.', 'success');
          };
          img.src = url;
        });
        const calBtn = $('#bgCalib', card);
        if (calBtn) calBtn.addEventListener('click', () => {
          calib = { a: null };
          Modal.close();
          toast('Haz clic en el primer punto de una pared con medida conocida', 'info');
        });
        const remBtn = $('#bgRemove', card);
        if (remBtn) remBtn.addEventListener('click', () => {
          plan().bgImage = null; Store.save(); syncTop(); requestRender(); Modal.close(); toast('Imagen de fondo eliminada');
        });
        const upd = () => {
          if (!plan().bgImage) return;
          plan().bgImage.opacity = num($('#bgOp', card).value, 0.45);
          plan().bgImage.w = Math.max(50, num($('#bgW', card).value, 1000));
          plan().bgImage.h = Math.max(50, num($('#bgH', card).value, 800));
          plan().bgImage.x = num($('#bgX', card).value, 0);
          plan().bgImage.y = num($('#bgY', card).value, 0);
          Store.save(); requestRender();
        };
        ['bgOp', 'bgW', 'bgH', 'bgX', 'bgY'].forEach((id) => { const el = $('#' + id, card); if (el) el.addEventListener('input', upd); });
      },
    });
  }

  function openCompareModal() {
    const others = S().plans.filter((p) => p.id !== plan().id);
    Modal.open({
      title: 'Comparar Antes / Después',
      body: others.length ? `
        <p class="muted" style="margin-top:0">Superpone otro plano en semitransparencia debajo del plano actual para ver qué muros y distribuciones cambian.</p>
        <div class="grid2">
          <label class="field span2"><span>Plano de referencia</span><select id="cmpSel">
            <option value="">— Sin comparar (desactivado) —</option>
            ${others.map((p) => `<option value="${p.id}" ${p.id === compareId ? 'selected' : ''}>${esc((p.level ? p.level + ' · ' : '') + p.name)}</option>`).join('')}
          </select></label>
          <label class="field span2"><span>Opacidad del plano de referencia</span><input type="range" id="cmpOp" min="0.1" max="0.9" step="0.05" value="${compareOpacity}"></label>
        </div>`
        : '<p class="muted">Necesitas al menos 2 planos (p. ej. duplica el actual para crear <i>Estado actual</i> y <i>Propuesta</i>).</p>',
      foot: `<button class="btn primary" data-modal-close>Listo</button>`,
      onOpen(card) {
        const s = $('#cmpSel', card), op = $('#cmpOp', card);
        if (s) s.addEventListener('change', () => { compareId = s.value || null; syncTop(); requestRender(); });
        if (op) op.addEventListener('input', () => { compareOpacity = num(op.value, 0.35); requestRender(); });
      },
    });
  }

  function openPlanModal(duplicate) {
    const cur = plan();
    const defName = duplicate ? cur.name + ' (copia)' : 'Planta ' + (S().plans.length + 1);
    const defScope = duplicate ? (cur.scope || 'interior') : 'interior';
    const defLevel = duplicate ? (cur.level || 'Planta baja') : 'Planta 1';
    Modal.open({
      title: duplicate ? 'Duplicar plano' : 'Nuevo plano',
      body: `<form id="planForm" class="grid2">
        <label class="field span2"><span>Nombre del plano</span><input name="name" value="${esc(defName)}" placeholder="Ej. Planta 1 – Propuesta, Fachada, Jardín…" required></label>
        <label class="field"><span>Tipo de plano</span><select name="scope">
          <option value="interior" ${defScope !== 'exterior' ? 'selected' : ''}>Interior</option>
          <option value="exterior" ${defScope === 'exterior' ? 'selected' : ''}>Exterior</option>
        </select></label>
        <label class="field"><span>Planta / zona</span><input name="level" list="modalLevelList" value="${esc(defLevel)}" placeholder="Ej. Planta baja, Parcela…"><datalist id="modalLevelList">${PLAN_LEVELS.map((l) => `<option value="${esc(l)}">`).join('')}</datalist></label>
      </form>`,
      foot: `<button class="btn" data-modal-close>Cancelar</button><button class="btn primary" id="planCreateBtn">${icon('check', 16)} ${duplicate ? 'Duplicar' : 'Crear plano'}</button>`,
      onOpen(card) {
        const form = $('#planForm', card);
        const scopeSel = form.querySelector('[name="scope"]');
        const levelInp = form.querySelector('[name="level"]');
        scopeSel.addEventListener('change', () => {
          if (scopeSel.value === 'exterior' && /^Planta\b/i.test(levelInp.value)) levelInp.value = 'Parcela / Exterior';
          else if (scopeSel.value === 'interior' && /exterior|parcela/i.test(levelInp.value)) levelInp.value = 'Planta baja';
        });
        const submit = () => {
          if (!form.reportValidity()) return;
          const fd = new FormData(form);
          const p = {
            id: uid(),
            name: String(fd.get('name') || '').trim() || 'Plano',
            scope: String(fd.get('scope') || 'interior'),
            level: String(fd.get('level') || '').trim() || (fd.get('scope') === 'exterior' ? 'Parcela / Exterior' : 'Planta baja'),
            elements: duplicate ? clone(els()) : [],
          };
          S().plans.push(p);
          Modal.close();
          switchPlan(p.id);
          toast(duplicate ? 'Plano duplicado' : 'Plano creado', 'success');
        };
        $('#planCreateBtn', card).addEventListener('click', submit);
        form.addEventListener('submit', (ev) => { ev.preventDefault(); submit(); });
      },
    });
  }

  function switchPlan(id) {
    S().activePlan = id; sel = null; draft = null; undoStack = []; redoStack = [];
    Store.save(); syncTop(); renderPanel();
    requestAnimationFrame(fit);
  }

  function show() {
    syncTop(); renderPanel();
    requestAnimationFrame(() => { if (!fitted) { fit(); fitted = true; } else requestRender(); });
  }

  function roomNames() {
    const set = new Set();
    S().plans.forEach((p) => p.elements.forEach((e) => { if (e.type === 'room' && e.name) set.add(e.name); }));
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  return { init, show, switchPlan, thumb, stats, roomNames, fmtLen, SYMBOLS, SYM_GROUPS, refresh: () => { if (svg) { syncTop(); renderPanel(); requestRender(); } } };
})();
