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
    elec: { label: 'Iluminación y electricidad', color: '#f59e0b' },
    fonta: { label: 'Fontanería y agua', color: '#0ea5e9' },
    clima: { label: 'Aire acondicionado y conductos', color: '#ef4444' },
    domo: { label: 'Domótica y control', color: '#8b5cf6' },
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
    tiraLed: { label: 'Tira LED / foseado', group: 'elec', g: 'LD', h: 255, wall: false },
    aplique: { label: 'Aplique de pared', group: 'elec', g: 'A', h: 180, wall: true },
    tv: { label: 'Toma TV', group: 'elec', g: 'TV', h: 30, wall: true },
    red: { label: 'Toma red / datos', group: 'elec', g: 'RJ', h: 30, wall: true },
    cuadro: { label: 'Cuadro eléctrico', group: 'elec', g: 'CE', h: 180, wall: true },
    montanteElec: { label: 'Montante vertical eléctrico / datos', group: 'elec', g: 'MV', h: 250, wall: false, riser: true },
    timbre: { label: 'Timbre / portero', group: 'elec', g: 'P', h: 150, wall: true },
    aguaFria: { label: 'Toma agua fría', group: 'fonta', g: 'AF', h: 55, wall: true },
    aguaCaliente: { label: 'Toma agua caliente', group: 'fonta', g: 'AC', h: 55, wall: true },
    desague: { label: 'Desagüe / bote sifónico', group: 'fonta', g: 'D', h: 0, wall: false },
    bajanteFecal: { label: 'Bajante vertical fecales (Ø110)', group: 'fonta', g: 'BF', h: 250, wall: false, riser: true },
    bajantePluv: { label: 'Bajante vertical pluviales (Ø110)', group: 'fonta', g: 'BP', h: 250, wall: false, riser: true },
    montanteAgua: { label: 'Montante vertical agua (AF/AC)', group: 'fonta', g: 'MA', h: 250, wall: false, riser: true },
    arqueta: { label: 'Arqueta de registro en suelo', group: 'fonta', g: 'AR', h: 10, wall: false, manhole: true },
    llave: { label: 'Llave de paso', group: 'fonta', g: 'LL', h: 40, wall: true },
    gas: { label: 'Toma de gas', group: 'fonta', g: 'G', h: 50, wall: true },
    calentador: { label: 'Termo / aerotermia', group: 'fonta', g: 'K', h: 150, wall: true },
    maqInt: { label: 'Máquina interior AA (conductos)', group: 'clima', g: 'MI', h: 245, wall: false },
    maqExt: { label: 'Máquina exterior AA (condensadora)', group: 'clima', g: 'ME', h: 100, wall: true },
    montanteClima: { label: 'Patinejo / subida vertical AA', group: 'clima', g: 'PA', h: 250, wall: false, riser: true },
    rejImp: { label: 'Rejilla de impulsión', group: 'clima', g: 'RI', h: 240, wall: true },
    rejRet: { label: 'Rejilla de retorno', group: 'clima', g: 'RR', h: 240, wall: false },
    compuerta: { label: 'Compuerta motorizada (Airzone)', group: 'clima', g: 'AZ', h: 245, wall: false },
    mandoCentral: { label: 'Mando centralizado AA', group: 'clima', g: 'MC', h: 150, wall: true },
    termostatoZona: { label: 'Termostato de zona', group: 'clima', g: 'TZ', h: 150, wall: true },
    aire: { label: 'Split AA pared', group: 'clima', g: 'AA', h: 220, wall: true },
    radiador: { label: 'Radiador', group: 'clima', g: 'R', h: 15, wall: true },
    termostato: { label: 'Termostato general', group: 'clima', g: 'T', h: 150, wall: true },
    extractor: { label: 'Extracción / ventilación', group: 'clima', g: 'V', h: 240, wall: false },
    detector: { label: 'Detector humo', group: 'clima', g: 'DH', h: 260, wall: false },
    domotica: { label: 'Central / Hub domótica', group: 'domo', g: 'DM', h: 150, wall: true },
    persiana: { label: 'Módulo / pulsador persiana eléc.', group: 'domo', g: 'PE', h: 110, wall: true },
    motorGaraje: { label: 'Motor puerta garaje', group: 'domo', g: 'MG', h: 240, wall: false },
    cargadorEV: { label: 'Cargador coche eléctrico', group: 'domo', g: 'EV', h: 120, wall: true },
    camara: { label: 'Cámara seguridad', group: 'domo', g: 'CM', h: 240, wall: true },
    sensorPres: { label: 'Sensor presencia / movimiento', group: 'domo', g: 'SP', h: 250, wall: false },
    videoportero: { label: 'Videoportero / pantalla control', group: 'domo', g: 'VP', h: 150, wall: true },
    wifi: { label: 'Punto acceso WiFi techo', group: 'domo', g: 'WF', h: 255, wall: false },
  };
  const DUCT_ROUTES = {
    techo: { label: 'Por techo / falso techo', short: 'Techo', z: 242 },
    suelo: { label: 'Por suelo / solera', short: 'Suelo', z: 5 },
    pared: { label: 'Por pared / roza', short: 'Pared', z: 110 },
  };
  const DUCT_VIS = {
    empotrado: 'Empotrado / oculto en obra (solo vista técnica)',
    visto: 'Visto / en superficie (visible en 3D)',
    oculto: 'No mostrar (ocultar en el plano)',
  };
  const DUCT_KINDS = {
    impulsion: { label: 'Conducto impulsión AA', group: 'clima', color: '#06b6d4', w: 26, h: 242, route: 'techo', dash: '' },
    retorno: { label: 'Conducto retorno AA', group: 'clima', color: '#10b981', w: 26, h: 242, route: 'techo', dash: '8 5' },
    tuboClima: { label: 'Línea frigorífica AA (cobre)', group: 'clima', color: '#0ea5e9', w: 6, h: 242, route: 'techo', dash: '6 3' },
    fria: { label: 'Tubería agua fría', group: 'fonta', color: '#0284c7', w: 5, h: 6, route: 'suelo', dash: '' },
    caliente: { label: 'Tubería agua caliente', group: 'fonta', color: '#ef4444', w: 5, h: 8, route: 'suelo', dash: '' },
    desague: { label: 'Tubería desagüe', group: 'fonta', color: '#64748b', w: 10, h: 4, route: 'suelo', dash: '6 4' },
    elec: { label: 'Línea iluminación / eléctrica', group: 'elec', color: '#f59e0b', w: 4, h: 245, route: 'techo', dash: '5 4' },
    domo: { label: 'Bus / cableado domótica', group: 'domo', color: '#8b5cf6', w: 4, h: 240, route: 'techo', dash: '3 4' },
    datos: { label: 'Cable red Ethernet / TV', group: 'domo', color: '#6366f1', w: 4, h: 6, route: 'suelo', dash: '2 4' },
  };
  const inferDuctRoute = (d) => d.route || ((d.height ?? (DUCT_KINDS[d.kind]?.h ?? 240)) <= 35 ? 'suelo' : (d.height ?? 240) >= 195 ? 'techo' : 'pared');
  const VIEW_PRESETS = {
    todo: { label: 'Vista: Todo', layers: { rooms: true, walls: true, openings: true, furn: true, elec: true, fonta: true, clima: true, domo: true, dims: true, text: true, pins: true } },
    distribucion: { label: 'Vista: Distribución y muebles', layers: { rooms: true, walls: true, openings: true, furn: true, elec: false, fonta: false, clima: false, domo: false, dims: true, text: true, pins: true } },
    clima: { label: 'Vista: Aire Acondicionado (conductos)', layers: { rooms: true, walls: true, openings: true, furn: false, elec: false, fonta: false, clima: true, domo: false, dims: true, text: true, pins: false } },
    elec: { label: 'Vista: Iluminación y Electricidad', layers: { rooms: true, walls: true, openings: true, furn: false, elec: true, fonta: false, clima: false, domo: false, dims: true, text: true, pins: false } },
    fonta: { label: 'Vista: Fontanería y Agua', layers: { rooms: true, walls: true, openings: true, furn: false, elec: false, fonta: true, clima: false, domo: false, dims: true, text: true, pins: false } },
    domo: { label: 'Vista: Domótica y Control', layers: { rooms: true, walls: true, openings: true, furn: false, elec: false, fonta: false, clima: false, domo: true, dims: true, text: true, pins: false } },
  };
  const FURN_CATS = [
    { id: 'all', label: 'Todos', ic: 'layers' },
    { id: 'salon', label: 'Salón y comedor', ic: 'sofa' },
    { id: 'dormitorio', label: 'Dormitorio', ic: 'home' },
    { id: 'cocina', label: 'Cocina', ic: 'layers' },
    { id: 'bano', label: 'Baño y ducha', ic: 'drop' },
    { id: 'estructura', label: 'Estructura', ic: 'wall' },
    { id: 'exterior', label: 'Exterior y garaje', ic: 'tree' },
  ];
  let furnCat = 'all', furnQuery = '';
  const FURN = [
    { kind: 'cama', name: 'Cama 180', w: 180, h: 200, cat: 'dormitorio' }, { kind: 'cama', name: 'Cama 150', w: 150, h: 200, cat: 'dormitorio' }, { kind: 'cama', name: 'Cama 135', w: 135, h: 190, cat: 'dormitorio' }, { kind: 'cama', name: 'Cama 90', w: 90, h: 190, cat: 'dormitorio' },
    { kind: 'cuna', name: 'Cuna', w: 70, h: 130, cat: 'dormitorio' }, { kind: 'mesita', name: 'Mesita', w: 45, h: 40, cat: 'dormitorio' }, { kind: 'comoda', name: 'Cómoda', w: 110, h: 48, cat: 'dormitorio' },
    { kind: 'armario', name: 'Armario', w: 180, h: 60, cat: 'dormitorio' }, { kind: 'vestidor', name: 'Vestidor', w: 240, h: 60, cat: 'dormitorio' }, { kind: 'escritorio', name: 'Escritorio', w: 120, h: 60, cat: 'dormitorio' }, { kind: 'sillaOficina', name: 'Silla oficina', w: 60, h: 60, cat: 'dormitorio' },
    { kind: 'sofa', name: 'Sofá 3 plazas', w: 210, h: 90, cat: 'salon' }, { kind: 'sofaL', name: 'Sofá chaise longue', w: 270, h: 165, cat: 'salon' }, { kind: 'sofa', name: 'Sillón', w: 85, h: 85, cat: 'salon' },
    { kind: 'mesaCentro', name: 'Mesa centro', w: 110, h: 60, cat: 'salon' }, { kind: 'alfombra', name: 'Alfombra', w: 240, h: 170, cat: 'salon' }, { kind: 'tv', name: 'Mueble TV', w: 180, h: 40, cat: 'salon' },
    { kind: 'estanteria', name: 'Estantería', w: 140, h: 35, cat: 'salon' }, { kind: 'chimenea', name: 'Chimenea', w: 110, h: 55, cat: 'salon' },
    { kind: 'mesa', name: 'Mesa comedor', w: 160, h: 90, cat: 'salon' }, { kind: 'mesaRedonda', name: 'Mesa redonda', w: 110, h: 110, cat: 'salon' }, { kind: 'silla', name: 'Silla', w: 45, h: 45, cat: 'salon' }, { kind: 'taburete', name: 'Taburete', w: 40, h: 40, cat: 'salon' },
    { kind: 'moduloCocina', name: 'Módulo cocina a medida', w: 80, h: 60, h3d: 85, z0: 0, plinth: 10, handleType: 'gola', frontColor: '#f1ede6', cat: 'cocina', sections: [{ id: 's1', kind: 'cacerolero', h: 35, anim: true, cutlery: false }, { id: 's2', kind: 'cajon', h: 25, anim: true, cutlery: false }, { id: 's3', kind: 'cubertero', h: 15, anim: true, cutlery: true }] },
    { kind: 'encimera', name: 'Encimera', w: 240, h: 60, cat: 'cocina' }, { kind: 'fregadero', name: 'Fregadero', w: 80, h: 60, cat: 'cocina' }, { kind: 'placa', name: 'Placa cocción', w: 60, h: 60, cat: 'cocina' },
    { kind: 'muebleBajo', name: 'Mueble bajo cocina', w: 60, h: 60, cat: 'cocina' }, { kind: 'muebleCajon', name: 'Cajonero cocina', w: 80, h: 60, cat: 'cocina' }, { kind: 'muebleRincon', name: 'Rincón cocina', w: 90, h: 90, cat: 'cocina' },
    { kind: 'muebleAlto', name: 'Mueble alto colgado', w: 80, h: 35, z0: 145, h3d: 70, cat: 'cocina' }, { kind: 'campana', name: 'Campana extractora', w: 90, h: 50, z0: 155, h3d: 45, cat: 'cocina' },
    { kind: 'nevera', name: 'Frigorífico', w: 70, h: 65, cat: 'cocina' }, { kind: 'horno', name: 'Columna horno', w: 60, h: 60, cat: 'cocina' }, { kind: 'microondas', name: 'Columna horno+micro', w: 60, h: 60, h3d: 215, cat: 'cocina' },
    { kind: 'despensa', name: 'Columna despensa', w: 60, h: 60, h3d: 215, cat: 'cocina' }, { kind: 'vinoteca', name: 'Vinoteca', w: 60, h: 60, cat: 'cocina' }, { kind: 'lavavajillas', name: 'Lavavajillas', w: 60, h: 60, cat: 'cocina' },
    { kind: 'lavadora', name: 'Lavadora', w: 60, h: 60, cat: 'cocina' }, { kind: 'secadora', name: 'Secadora', w: 60, h: 60, cat: 'cocina' }, { kind: 'isla', name: 'Isla cocina', w: 180, h: 90, cat: 'cocina' }, { kind: 'peninsula', name: 'Península / barra', w: 200, h: 90, cat: 'cocina' },
    { kind: 'inodoro', name: 'Inodoro', w: 40, h: 65, cat: 'bano' }, { kind: 'lavabo', name: 'Lavabo', w: 60, h: 45, cat: 'bano' }, { kind: 'lavabo2', name: 'Lavabo doble', w: 120, h: 48, cat: 'bano' },
    { kind: 'muebleBano', name: 'Mueble baño lavabo', w: 90, h: 48, h3d: 82, z0: 0, plinth: 0, handleType: 'unero', frontColor: '#e7dfd5', cat: 'bano', sections: [{ id: 'b1', kind: 'cajon', h: 40, anim: true }, { id: 'b2', kind: 'cajon', h: 40, anim: true }] },
    { kind: 'ducha', name: 'Plato ducha', w: 120, h: 80, cat: 'bano' }, { kind: 'mampara', name: 'Mampara fija cristal', w: 100, h: 6, h3d: 200, cat: 'bano' },
    { kind: 'mamparaCorredera', name: 'Mampara corredera', w: 120, h: 8, h3d: 200, cat: 'bano' }, { kind: 'mamparaAbatible', name: 'Mampara abatible', w: 80, h: 6, h3d: 200, cat: 'bano' },
    { kind: 'columnaDucha', name: 'Columna de ducha', w: 30, h: 35, h3d: 215, cat: 'bano' }, { kind: 'espejoLed', name: 'Espejo baño LED', w: 90, h: 5, h3d: 80, z0: 120, cat: 'bano' },
    { kind: 'hornacina', name: 'Hornacina ducha', w: 60, h: 15, h3d: 35, z0: 115, cat: 'bano' },
    { kind: 'banera', name: 'Bañera', w: 170, h: 75, cat: 'bano' }, { kind: 'baneraExenta', name: 'Bañera exenta', w: 170, h: 80, h3d: 58, cat: 'bano' }, { kind: 'bide', name: 'Bidé', w: 38, h: 55, cat: 'bano' },
    { kind: 'toallero', name: 'Toallero', w: 60, h: 12, cat: 'bano' },
    { kind: 'generico', name: 'Mueble genérico', w: 100, h: 50, cat: 'estructura' }, { kind: 'escalera', name: 'Escalera', w: 280, h: 100, cat: 'estructura' }, { kind: 'pilar', name: 'Pilar', w: 35, h: 35, cat: 'estructura' },
    { kind: 'bajante', name: 'Bajante', w: 20, h: 20, cat: 'estructura' }, { kind: 'norte', name: 'Norte (N)', w: 70, h: 70, cat: 'estructura' },
    { kind: 'piscina', name: 'Piscina', w: 600, h: 300, ext: true, cat: 'exterior' }, { kind: 'pergola', name: 'Pérgola', w: 400, h: 300, ext: true, cat: 'exterior' },
    { kind: 'coche', name: 'Coche / plaza', w: 450, h: 200, ext: true, cat: 'exterior' }, { kind: 'moto', name: 'Moto', w: 210, h: 85, ext: true, cat: 'exterior' }, { kind: 'bici', name: 'Bicicleta', w: 180, h: 60, ext: true, cat: 'exterior' },
    { kind: 'arbol', name: 'Árbol / planta', w: 140, h: 140, ext: true, cat: 'exterior' }, { kind: 'huerto', name: 'Huerto / jardinera', w: 200, h: 80, ext: true, cat: 'exterior' },
    { kind: 'barbacoa', name: 'Barbacoa', w: 140, h: 70, ext: true, cat: 'exterior' }, { kind: 'tumbona', name: 'Tumbona', w: 195, h: 70, ext: true, cat: 'exterior' },
    { kind: 'duchaExt', name: 'Ducha exterior', w: 90, h: 90, ext: true, cat: 'exterior' }, { kind: 'tendedero', name: 'Tendedero', w: 180, h: 70, ext: true, cat: 'exterior' },
    { kind: 'trastero', name: 'Caseta / trastero', w: 240, h: 200, ext: true, cat: 'exterior' },
  ];
  const WALL_STATUS = { existente: 'Existente', nuevo: 'Nuevo (a construir)', demoler: 'A demoler' };
  const DOOR_KINDS = {
    abatible: 'Abatible', corredera: 'Corredera', doble: 'Doble hoja',
    balconera: 'Balconera abatible (2 hojas)', correderaDoble: 'Balconera corredera doble',
    garaje: 'Puerta de garaje eléctrica', blindada: 'Puerta entrada / acorazada', hueco: 'Hueco sin puerta',
  };
  const WIN_KINDS = {
    corredera: 'Corredera', abatible: 'Abatible (1 hoja)', abatible2: 'Abatible (2 hojas)',
    oscilobatiente: 'Oscilobatiente', balconera: 'Balconera acristalada', fija: 'Fija',
  };
  const SHUTTER_KINDS = { none: 'Sin persiana', manual: 'Persiana manual', electric: 'Persiana eléctrica' };
  const HANDLE_KINDS = { gola: 'Perfil Gola', unero: 'Uñero fresado', push: 'Sistema Push (sin tirador)', tirador: 'Tirador exterior', abierto: 'Hueco abierto (sin frente)' };
  const SECTION_KINDS = {
    cajon: 'Cajón estándar', cacerolero: 'Cajón cacerolero', cubertero: 'Cajón con cubertero',
    cajonInt: 'Cajón interior oculto', puerta: 'Puerta abatible', puerta2: 'Doble puerta abatible',
    elevable: 'Puerta elevable (alto)', hueco: 'Hueco abierto / estante', horno: 'Hueco electrodoméstico',
  };
  const MODULAR_KITCHEN = new Set(['moduloCocina', 'muebleBajo', 'muebleCajon', 'muebleAlto', 'despensa', 'isla', 'peninsula', 'muebleBano']);
  const TEXTURES = {
    liso: 'Color liso',
    madera: 'Madera / Roble',
    marmol: 'Mármol / Silestone',
    azulejo: 'Azulejo / Porcelánico',
    metro: 'Azulejo Metro / Ladrillo',
    microcemento: 'Microcemento / Hormigón',
    piedra: 'Piedra natural',
    cesped: 'Césped / Jardín',
  };
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
    { id: 'sym', icon: 'bolt', label: 'AA, luz, agua y domótica', key: 'E' },
    { id: 'duct', icon: 'trend', label: 'Trazar conductos / tuberías', key: 'K' },
    { sep: true },
    { id: 'dim', icon: 'dim', label: 'Cota', key: 'C' },
    { id: 'text', icon: 'text', label: 'Texto', key: 'T' },
    { id: 'pin', icon: 'pin', label: 'Pin de tarea / incidencia', key: 'I' },
    { id: 'sketch', icon: 'edit', label: 'Boceto / nota a mano (Apple Pencil)', key: 'S' },
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
    sym: 'Elige un elemento (AA, luz, agua, domótica) y toca el plano para colocarlo',
    duct: 'Elige tipo de conducto/tubería en el panel y haz clic en inicio y cada esquina · Esc o Terminar para finalizar',
    dim: 'Clic en el punto inicial, clic en el final y un tercer clic para separar la cota',
    text: 'Haz clic donde quieras añadir un texto',
    pin: 'Haz clic en el plano para colocar un pin de tarea o incidencia',
    sketch: 'Dibuja a mano alzada con el Apple Pencil o ratón · en iPad: 2 dedos = deshacer, 3 dedos = rehacer',
    measure: 'Arrastra para medir una distancia (no se guarda)',
  };
  const PUIKEY = 'mi-reforma:ui:plan';
  const DEF_LAYERS = { grid: true, rooms: true, walls: true, openings: true, furn: true, elec: true, fonta: true, clima: true, domo: true, instTecho: true, instSuelo: true, instEmpotrado: true, dims: true, text: true, pins: true, sketch: true };
  const savedPui = safeJSON(localStorage.getItem(PUIKEY)) || {};
  const pui = Object.assign({ grid: 5, snap: true, ortho: true, autoDims: true, wallThick: 15, wallStatus: 'existente', viewPreset: 'todo', ductKind: 'impulsion', ductWidth: 26, ductHeight: 242, ductRoute: 'techo', ductVis: 'empotrado', pencilOnly: false, sketchColor: '#ef4444', sketchSize: 4, panelHidden: false }, savedPui);
  pui.layers = Object.assign({}, DEF_LAYERS, savedPui.layers || {});
  const savePui = () => localStorage.setItem(PUIKEY, JSON.stringify(pui));

  let root, svg, world, defs, panel;
  let view = { x: 80, y: 80, s: 0.8 };
  let tool = 'select', sel = null, draft = null, placing = null, drag = null;
  let cursor = null, lastShift = false, snapInd = null, hoverOpen = null, spaceDown = false;
  let undoStack = [], redoStack = [], fitted = false, raf = 0, pinch = null;
  let compareId = null, compareOpacity = 0.35, calib = null, tapGesture = null, pencilHintShown = false;
  let multiSel = new Set(), multiMode = false;
  let sim2d = { doors: 0, windows: 0, shutters: 0, kitchen: 0, lights: false };
  let inline3d = {
    active: false, transitioning: false, camMode: 'fp',
    yaw: -32, pitch: 42, zoom: 1, wallCut: 0.92, hideDemo: true,
    fpX: 0, fpY: 0, fpYaw: 0, fpPitch: -3, eyeZ: 165,
    nightMode: false, editable: true, sel3dId: null, _hitList: [],
  };
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
    const fillCol = f.frontColor || th.furnFill;
    const base = `fill="${fillCol}" stroke="${th.furn}" stroke-width="${sw}"`;
    const R = (x, y, ww, hh, rx = 0, extra = st) => `<rect x="${x}" y="${y}" width="${Math.max(0, ww)}" height="${Math.max(0, hh)}" rx="${rx}" ${extra}/>`;
    let o = '';
    switch (f.kind) {
      case 'mesaRedonda': o += `<ellipse rx="${w / 2}" ry="${h / 2}" ${base}/><ellipse rx="${w / 2 - 6}" ry="${h / 2 - 6}" ${st}/>`; break;
      case 'baneraExenta': o += `<ellipse rx="${w / 2}" ry="${h / 2}" ${base}/><ellipse rx="${w / 2 - 8}" ry="${h / 2 - 8}" ${st}/><circle cx="${x0 + 20}" cy="0" r="3" ${st}/>`; break;
      case 'mampara': o += R(x0, y0, w, h, 1, `fill="#38bdf8" fill-opacity=".45" stroke="#0284c7" stroke-width="${sw * 1.4}"`); break;
      case 'mamparaCorredera': o += R(x0, y0, w * 0.56, h * 0.5, 1, `fill="#38bdf8" fill-opacity=".45" stroke="#0284c7" stroke-width="${sw}"`) + R(x0 + w * 0.44, 0, w * 0.56, h * 0.5, 1, `fill="#38bdf8" fill-opacity=".45" stroke="#0284c7" stroke-width="${sw}"`); break;
      case 'mamparaAbatible': {
        const ang = (sim2d.doors || 0) * 75;
        o += `<g transform="translate(${x0} 0) rotate(${ang}) translate(${-x0} 0)">${R(x0, y0, w, h, 1, `fill="#38bdf8" fill-opacity=".48" stroke="#0284c7" stroke-width="${sw * 1.4}"`)}</g>
          <path d="M${-x0} 0 A${w} ${w} 0 0 1 ${x0} ${w}" fill="none" stroke="#0284c7" stroke-width="${sw}" stroke-dasharray="${px(4)} ${px(3)}" opacity=".6"/>`;
        break;
      }
      case 'taburete': o += `<circle r="${Math.min(w, h) / 2}" ${base}/><circle r="${Math.min(w, h) * 0.28}" ${st}/>`; break;
      case 'sofaL': {
        const d1 = Math.min(90, h * 0.55), d2 = Math.min(95, w * 0.36);
        o += `<path d="M${x0} ${y0} H${-x0} V${-y0} H${-x0 - d2} V${y0 + d1} H${x0} Z" ${base}/>`;
        o += `<path d="M${x0} ${y0 + 18} H${-x0} M${-x0 - d2} ${y0 + 18} V${-y0}" ${st}/>`;
        break;
      }
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
      case 'alfombra': o += R(x0 + 8, y0 + 8, w - 16, h - 16, 2, `${st} stroke-dasharray="${px(5)} ${px(3)}" stroke-opacity=".6"`); break;
      case 'mesaCentro': o += R(x0 + 6, y0 + 6, w - 12, h - 12, 4, `${st} stroke-opacity=".5"`); break;
      case 'estanteria': case 'comoda': case 'vestidor': { const n = Math.max(2, Math.round(w / 45)); for (let i = 1; i < n; i++) { const xx = x0 + (w / n) * i; o += `<line x1="${xx}" y1="${y0}" x2="${xx}" y2="${-y0}" ${st} stroke-opacity=".6"/>`; } break; }
      case 'chimenea': o += R(x0 + 12, y0 + 8, w - 24, h - 18, 3, `fill="#f97316" fill-opacity=".22" stroke="#ea580c" stroke-width="${sw}"`); break;
      case 'cuna': o += R(x0 + 6, y0 + 6, w - 12, h - 12, 6, st) + `<line x1="${x0 + 6}" y1="${y0 + 26}" x2="${-x0 - 6}" y2="${y0 + 26}" ${st}/>`; break;
      case 'sillaOficina': o += `<circle r="${Math.min(w, h) * 0.35}" ${st}/>` + R(x0 + 6, y0 + 2, w - 12, h * 0.2, 4, st); break;
      case 'lavavajillas': case 'secadora': o += `<circle r="${Math.min(w, h) * 0.25}" ${st}/><line x1="${x0 + 6}" y1="${y0 + 8}" x2="${-x0 - 6}" y2="${y0 + 8}" ${st}/>`; break;
      case 'horno': case 'microondas': o += R(x0 + 8, y0 + 10, w - 16, h - 20, 3, st) + `<line x1="${x0 + 10}" y1="${-y0 - 6}" x2="${-x0 - 10}" y2="${-y0 - 6}" ${st} stroke-width="${sw * 1.5}"/>`; break;
      case 'muebleBajo': case 'muebleRincon': case 'despensa': case 'vinoteca': o += `<line x1="${x0 + 6}" y1="${-y0 - 5}" x2="${-x0 - 6}" y2="${-y0 - 5}" ${st}/>`; break;
      case 'muebleCajon': case 'moduloCocina': o += `<line x1="${x0 + 6}" y1="${-y0 - 5}" x2="${-x0 - 6}" y2="${-y0 - 5}" ${st}/><line x1="${-w * 0.2}" y1="${-y0 - 9}" x2="${w * 0.2}" y2="${-y0 - 9}" ${st} stroke-width="${sw * 1.6}"/>`; break;
      case 'muebleAlto': o += R(x0 + 3, y0 + 3, w - 6, h - 6, 2, `${st} stroke-dasharray="${px(5)} ${px(3)}"`); break;
      case 'campana': o += `<path d="M${x0} ${y0} L${-x0} ${-y0} M${-x0} ${y0} L${x0} ${-y0}" ${st} stroke-dasharray="${px(4)} ${px(3)}"/><circle r="${Math.min(w, h) * 0.16}" ${st}/>`; break;
      case 'peninsula': o += `<line x1="${x0}" y1="0" x2="${-x0}" y2="0" ${st} stroke-dasharray="${px(5)} ${px(3)}"/>`; break;
      case 'lavabo2': o += `<ellipse cx="${-w * 0.25}" cy="2" rx="${w * 0.19}" ry="${h * 0.3}" ${st}/><ellipse cx="${w * 0.25}" cy="2" rx="${w * 0.19}" ry="${h * 0.3}" ${st}/>`; break;
      case 'muebleBano': o += `<ellipse cx="0" cy="2" rx="${Math.min(26, w * 0.32)}" ry="${h * 0.32}" ${st}/><circle cx="0" cy="${y0 + 7}" r="2.5" ${st}/>`; break;
      case 'columnaDucha': o += `<circle cx="0" cy="4" r="${Math.min(w, h) * 0.35}" fill="#bae6fd" stroke="#0284c7" stroke-width="${sw}"/><circle cx="0" cy="4" r="3" fill="#0284c7"/>`; break;
      case 'espejoLed': o += R(x0, y0, w, h, 1, `fill="#fef08a" fill-opacity=".7" stroke="#eab308" stroke-width="${sw * 1.4}"`); break;
      case 'hornacina': o += R(x0 + 3, y0 + 3, w - 6, h - 6, 1, `${st} stroke-dasharray="${px(3)} ${px(2)}"`); break;
      case 'toallero': o += `<line x1="${x0 + 6}" y1="0" x2="${-x0 - 6}" y2="0" stroke="#ef4444" stroke-width="${sw * 1.6}"/>`; break;
      case 'moto': case 'bici': o += `<ellipse cx="${-w * 0.3}" cy="0" rx="${w * 0.14}" ry="${h * 0.16}" ${st}/><ellipse cx="${w * 0.3}" cy="0" rx="${w * 0.14}" ry="${h * 0.16}" ${st}/><line x1="${-w * 0.3}" y1="0" x2="${w * 0.3}" y2="0" ${st} stroke-width="${sw * 1.5}"/>`; break;
      case 'huerto': o += R(x0 + 6, y0 + 6, w - 12, h - 12, 4, `fill="#86efac" fill-opacity=".35" stroke="#16a34a" stroke-width="${sw}"`); break;
      case 'duchaExt': o += `<path d="M${x0} ${y0} L${-x0} ${-y0} M${-x0} ${y0} L${x0} ${-y0}" stroke="#0284c7" stroke-width="${sw}" stroke-opacity=".5"/><circle r="5" stroke="#0284c7" stroke-width="${sw}" fill="none"/>`; break;
      case 'tendedero': for (let i = 1; i <= 4; i++) { const yy = y0 + (h / 5) * i; o += `<line x1="${x0 + 6}" y1="${yy}" x2="${-x0 - 6}" y2="${yy}" ${st} stroke-opacity=".65"/>`; } break;
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
    } else if (d.riser) {
      const rr = px(11.5);
      o += `<circle r="${rr}" fill="${th.bg}" stroke="${col}" stroke-width="${px(2.2)}"/><circle r="${rr * 0.68}" fill="${col}"/><text text-anchor="middle" dominant-baseline="central" font-size="${px(6.8)}" font-weight="800" fill="#fff" pointer-events="none">${esc(d.g)}</text>`;
    } else if (d.manhole) {
      const hs = px(10.5);
      o += `<rect x="${-hs}" y="${-hs}" width="${hs * 2}" height="${hs * 2}" rx="${px(2)}" fill="${th.bg}" stroke="${col}" stroke-width="${px(2.2)}"/><rect x="${-hs * 0.72}" y="${-hs * 0.72}" width="${hs * 1.44}" height="${hs * 1.44}" fill="${col}"/><text text-anchor="middle" dominant-baseline="central" font-size="${px(7)}" font-weight="800" fill="#fff" pointer-events="none">${esc(d.g)}</text>`;
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
      const aOpen = sim2d.doors || 0;
      const leaf = (hx, ox, len) => {
        const sweep = ((hx > ox) !== (sd < 0)) ? 1 : 0;
        const dir = ox > hx ? 1 : -1;
        // Ángulo animado en 2D: 0 = cerrada (a lo largo del hueco), 1 = abierta 90°
        const ang = (Math.PI / 2) * (0.15 + aOpen * 0.85);
        const ex = hx + Math.cos(ang) * len * dir, ey = y0 + Math.sin(ang) * len * sd;
        return `<path d="M${hx} ${y0} L${ex} ${ey}" stroke="${c}" stroke-width="${px(2.4)}"/>
          <path d="M${hx} ${y0 + sd * len} A${len} ${len} 0 0 ${sweep} ${ox} ${y0}" fill="none" stroke="${c}" stroke-width="${px(1)}" stroke-dasharray="${px(4)} ${px(3)}"/>`;
      };
      if (o.kind === 'corredera') {
        const yy = sd > 0 ? ht + px(1) : -ht - px(1) - 4;
        const shift = aOpen * o.width * 0.75 * (o.hinge === 'right' ? 1 : -1);
        inner += `<rect x="${(o.hinge === 'right' ? -hw + o.width * 0.15 : -hw - o.width * 0.15) + shift}" y="${yy}" width="${o.width}" height="4" fill="${th.furnFill}" stroke="${c}" stroke-width="${px(1.5)}"/>`;
      } else if (o.kind === 'correderaDoble') {
        inner += `<rect x="${-hw}" y="${-ht}" width="${o.width}" height="${g.thick}" fill="${th.glass}" stroke="${c}" stroke-width="${px(1.3)}"/>
          <line x1="${-hw + aOpen * hw * 0.6}" y1="${-ht / 3}" x2="${px(6) + aOpen * hw * 0.6}" y2="${-ht / 3}" stroke="${c}" stroke-width="${px(1.5)}"/>
          <line x1="${-px(6) - aOpen * hw * 0.6}" y1="${ht / 3}" x2="${hw - aOpen * hw * 0.6}" y2="${ht / 3}" stroke="${c}" stroke-width="${px(1.5)}"/>`;
      } else if (o.kind === 'doble') {
        inner += leaf(-hw, 0, hw) + leaf(hw, 0, hw);
      } else if (o.kind === 'balconera') {
        inner += `<rect x="${-hw}" y="${-ht}" width="${o.width}" height="${g.thick}" fill="${th.glass}" stroke="${c}" stroke-width="${px(1.2)}"/>` + leaf(-hw, 0, hw) + leaf(hw, 0, hw);
      } else if (o.kind === 'garaje') {
        inner += `<rect x="${-hw}" y="${-ht}" width="${o.width}" height="${g.thick}" fill="${aOpen > 0.5 ? 'transparent' : th.furnFill}" stroke="${c}" stroke-width="${px(1.8)}" ${aOpen > 0.5 ? `stroke-dasharray="${px(5)} ${px(4)}"` : ''}/>`;
        const segs = Math.max(4, Math.round(o.width / 45));
        if (aOpen < 0.5) for (let i = 1; i < segs; i++) { const xx = -hw + (o.width / segs) * i; inner += `<line x1="${xx}" y1="${-ht}" x2="${xx}" y2="${ht}" stroke="${c}" stroke-width="${px(1)}"/>`; }
        inner += `<line x1="${-hw}" y1="${sd * (ht + 12)}" x2="${hw}" y2="${sd * (ht + 12)}" stroke="${c}" stroke-width="${px(1)}" stroke-dasharray="${px(5)} ${px(3)}"/>
          <circle cx="0" cy="${sd * (ht + 12)}" r="${px(7)}" fill="${aOpen > 0.5 ? '#10b981' : '#f59e0b'}" stroke="${th.bg}" stroke-width="${px(1.2)}"/>
          <text x="0" y="${sd * (ht + 12)}" text-anchor="middle" dominant-baseline="central" font-size="${px(8)}" font-weight="800" fill="#fff">M</text>`;
      } else if (o.kind === 'blindada') {
        const hx = o.hinge === 'right' ? hw : -hw;
        const dir = hx < 0 ? 1 : -1, ang = (Math.PI / 2) * (0.15 + aOpen * 0.85);
        inner += `<path d="M${hx} ${y0} L${hx + Math.cos(ang) * o.width * dir} ${y0 + Math.sin(ang) * o.width * sd}" stroke="${c}" stroke-width="${px(4)}"/>
          <path d="M${hx} ${y0 + sd * o.width} A${o.width} ${o.width} 0 0 ${((hx > -hx) !== (sd < 0)) ? 1 : 0} ${-hx} ${y0}" fill="none" stroke="${c}" stroke-width="${px(1.1)}" stroke-dasharray="${px(4)} ${px(3)}"/>`;
      } else if (o.kind !== 'hueco') {
        const hx = o.hinge === 'right' ? hw : -hw;
        inner += leaf(hx, -hx, o.width);
      }
    } else {
      const aWin = sim2d.windows || 0, aShut = sim2d.shutters || 0;
      inner += `<rect x="${-hw}" y="${-ht}" width="${o.width}" height="${g.thick}" fill="${aShut > 0.5 && o.shutter && o.shutter !== 'none' ? '#64748b' : th.glass}" stroke="${c}" stroke-width="${px(1.3)}"/>
        <line x1="${-hw}" y1="0" x2="${hw}" y2="0" stroke="${c}" stroke-width="${px(1)}"/>`;
      const sd = o.side || 1, y0 = sd * ht;
      if (o.kind === 'corredera') {
        inner += `<line x1="${-hw}" y1="${-ht / 3}" x2="${px(4)}" y2="${-ht / 3}" stroke="${c}" stroke-width="${px(1)}"/><line x1="${-px(4)}" y1="${ht / 3}" x2="${hw}" y2="${ht / 3}" stroke="${c}" stroke-width="${px(1)}"/>`;
      } else if (o.kind === 'abatible' || o.kind === 'oscilobatiente') {
        const swing = Math.min(o.width * 0.55, 65), ang = (Math.PI / 2) * (0.2 + aWin * 0.8);
        inner += `<path d="M${-hw} ${y0} L${-hw + Math.cos(ang) * swing} ${y0 + Math.sin(ang) * swing * sd}" stroke="${c}" stroke-width="${px(1.6)}" ${aWin > 0.05 ? '' : `opacity=".4"`}/>
          <path d="M${-hw} ${y0 + sd * swing} A${swing} ${swing} 0 0 ${sd > 0 ? 0 : 1} ${-hw + swing} ${y0}" fill="none" stroke="${c}" stroke-width="${px(1)}" stroke-dasharray="${px(3)} ${px(2.5)}"/>`;
      } else if (o.kind === 'abatible2' || o.kind === 'balconera') {
        const swing = Math.min(hw * 0.85, 65), ang = (Math.PI / 2) * (0.2 + aWin * 0.8);
        inner += `<path d="M${-hw} ${y0} L${-hw + Math.cos(ang) * swing} ${y0 + Math.sin(ang) * swing * sd} M${hw} ${y0} L${hw - Math.cos(ang) * swing} ${y0 + Math.sin(ang) * swing * sd}" stroke="${c}" stroke-width="${px(1.6)}" ${aWin > 0.05 ? '' : `opacity=".4"`}/>
          <path d="M${-hw} ${y0 + sd * swing} A${swing} ${swing} 0 0 ${sd > 0 ? 0 : 1} ${-hw + swing} ${y0}" fill="none" stroke="${c}" stroke-width="${px(1)}" stroke-dasharray="${px(3)} ${px(2.5)}"/>
          <path d="M${hw} ${y0 + sd * swing} A${swing} ${swing} 0 0 ${sd > 0 ? 1 : 0} ${hw - swing} ${y0}" fill="none" stroke="${c}" stroke-width="${px(1)}" stroke-dasharray="${px(3)} ${px(2.5)}"/>`;
      }
      if (o.shutter === 'manual' || o.shutter === 'electric') {
        const sy = -sd * (ht + px(4));
        inner += `<rect x="${-hw}" y="${sy - px(2)}" width="${o.width}" height="${px(4)}" fill="${o.shutter === 'electric' ? '#f59e0b' : c}" opacity=".85"/>`;
        if (o.shutter === 'electric') inner += `<circle cx="${hw - px(6)}" cy="${sy}" r="${px(6)}" fill="#f59e0b" stroke="${th.bg}" stroke-width="${px(1)}"/><text x="${hw - px(6)}" y="${sy}" text-anchor="middle" dominant-baseline="central" font-size="${px(7.5)}" font-weight="800" fill="#fff">E</text>`;
      }
    }
    inner += `<rect x="${-hw}" y="${-ht - px(5)}" width="${o.width}" height="${g.thick + px(10)}" fill="transparent"/>`;
    return inner;
  }

  function layerOn(e, L) {
    if (e.installVis === 'oculto') return false;
    switch (e.type) {
      case 'room': return L.rooms; case 'wall': return L.walls; case 'door': case 'window': return L.openings;
      case 'furn': return L.furn;
      case 'sym': {
        const d = SYMBOLS[e.kind] || SYMBOLS.enchufe;
        if (L[d.group] === false) return false;
        const rt = e.route || ((e.height ?? d.h ?? 110) >= 195 ? 'techo' : 'suelo');
        if (rt === 'techo' && L.instTecho === false) return false;
        if (rt !== 'techo' && L.instSuelo === false) return false;
        if (e.installVis === 'empotrado' && L.instEmpotrado === false) return false;
        return true;
      }
      case 'duct': {
        const g = (DUCT_KINDS[e.kind] || DUCT_KINDS.impulsion).group;
        if (L[g] === false) return false;
        const rt = inferDuctRoute(e);
        if (rt === 'techo' && L.instTecho === false) return false;
        if (rt !== 'techo' && L.instSuelo === false) return false;
        if ((e.installVis || 'empotrado') === 'empotrado' && L.instEmpotrado === false) return false;
        return true;
      }
      case 'dim': return L.dims; case 'text': return L.text; case 'pin': return L.pins; case 'sketch': return L.sketch !== false; default: return true;
    }
  }

  function renderElements(list, s, th, L, autoDims) {
    const px = (v) => v / s;
    const vis = list.filter((e) => layerOn(e, L));
    const wallMap = new Map(list.filter((e) => e.type === 'wall').map((w) => [w.id, w]));
    const walls = vis.filter((e) => e.type === 'wall');
    let out = '';
    // Habitaciones (con textura opcional en 2D)
    vis.filter((e) => e.type === 'room' && e.points.length >= 3).forEach((r) => {
      const pts = r.points.map((p) => p.join(',')).join(' ');
      out += `<polygon data-id="${r.id}" points="${pts}" fill="${r.color || ROOM_COLORS[0]}" fill-opacity="${th.roomOpacity}" stroke="${r.color || ROOM_COLORS[0]}" stroke-opacity=".9" stroke-width="${px(1)}"/>`;
      if (r.floorTexture && r.floorTexture !== 'liso') {
        out += `<polygon points="${pts}" fill="url(#tex-${r.floorTexture})" pointer-events="none"/>`;
      }
    });
    // Muros: contorno arquitectónico fusionado + relleno/textura (sin filtros SVG pesados para 60fps en iPad)
    const solid = walls.filter((w) => w.status !== 'demoler');
    out += solid.map((w) => `<line x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke="${th.wall}" stroke-width="${w.thick + px(2.6)}" stroke-linecap="square"/>`).join('');
    out += solid.map((w) => {
      const fillC = w.status === 'nuevo' ? th.wallNew : (w.wallColor && w.wallColor !== '#e2e8f0' ? w.wallColor : th.wallFill);
      return `<line x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke="${fillC}" stroke-width="${w.thick}" stroke-linecap="square"/>`
        + (w.wallTexture && w.wallTexture !== 'liso' ? `<line x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke="url(#tex-${w.wallTexture})" stroke-width="${w.thick}" stroke-linecap="square" pointer-events="none"/>` : '');
    }).join('');
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
    // Mobiliario (con textura + animación de cajones/puertas de cocina en 2D)
    vis.filter((e) => e.type === 'furn').forEach((f) => {
      let extra = '';
      if (f.texture && f.texture !== 'liso') {
        extra += `<rect x="${-f.w / 2}" y="${-f.h / 2}" width="${f.w}" height="${f.h}" fill="url(#tex-${f.texture})" pointer-events="none"/>`;
      }
      if (sim2d.kitchen > 0.05 && (MODULAR_KITCHEN.has(f.kind) || ['horno', 'microondas', 'nevera', 'lavavajillas'].includes(f.kind))) {
        const pull = 34 * sim2d.kitchen;
        extra += `<rect x="${-f.w / 2 + 3}" y="${f.h / 2}" width="${f.w - 6}" height="${pull}" fill="#f97316" fill-opacity=".22" stroke="#ea580c" stroke-width="${px(1.3)}" stroke-dasharray="${px(4)} ${px(3)}" pointer-events="none"/>`;
      }
      if (sim2d.lights && f.kind === 'espejoLed' && Obra.isCircuitLive(Obra.inferCircuitId(f) || 'c1')) {
        extra += `<ellipse cx="0" cy="0" rx="${f.w * 0.7}" ry="${f.w * 0.45}" fill="url(#lightGlow2d)" pointer-events="none"/>`;
      }
      out += `<g data-id="${f.id}" transform="translate(${f.x} ${f.y}) rotate(${f.angle || 0})">${furnShape(f, s, th)}${extra}</g>`;
    });
    // Etiquetas de habitaciones
    vis.filter((e) => e.type === 'room' && e.points.length >= 3).forEach((r) => {
      const c = centroid(r.points), area = polyArea(r.points) / 10000;
      const halo = `paint-order="stroke" stroke="${th.bg}" stroke-width="${px(3.5)}" stroke-linejoin="round" stroke-opacity=".9"`;
      out += `<g pointer-events="none" text-anchor="middle"><text x="${c.x}" y="${c.y - px(4)}" font-size="${px(13)}" font-weight="800" fill="${th.text}" ${halo}>${esc(r.name || '')}</text>
        <text x="${c.x}" y="${c.y + px(11)}" font-size="${px(11)}" font-weight="700" fill="${th.text}" opacity=".82" ${halo}>${fmtNum(area, 2)} m²${r.floor ? ' · ' + esc(r.floor) : ''}</text></g>`;
    });
    // Conductos, tuberías y cableados (con distinción visual Techo/Suelo y Visto/Empotrado)
    vis.filter((e) => e.type === 'duct').forEach((d) => {
      const dk = DUCT_KINDS[d.kind] || DUCT_KINDS.impulsion;
      const w = Math.max(px(2.5), d.width || dk.w);
      const isBig = (d.width || dk.w) >= 14;
      const rt = inferDuctRoute(d);
      const isVisto = d.installVis === 'visto';
      const dashPat = isVisto ? '' : (dk.dash || (rt === 'techo' ? `${px(7)} ${px(4)}` : `${px(3)} ${px(3)}`));
      if (isBig) {
        out += `<line x1="${d.x1}" y1="${d.y1}" x2="${d.x2}" y2="${d.y2}" stroke="${dk.color}" stroke-opacity="${isVisto ? '.42' : '.22'}" stroke-width="${w}" stroke-linecap="butt" pointer-events="none"/>`;
        out += `<line x1="${d.x1}" y1="${d.y1}" x2="${d.x2}" y2="${d.y2}" stroke="${dk.color}" stroke-width="${px(isVisto ? 2.6 : 1.8)}" ${dashPat ? `stroke-dasharray="${dashPat}"` : ''} pointer-events="none"/>`;
      } else {
        if (isVisto) out += `<line x1="${d.x1}" y1="${d.y1}" x2="${d.x2}" y2="${d.y2}" stroke="#0f172a" stroke-opacity=".28" stroke-width="${px(5.2)}" stroke-linecap="round" pointer-events="none"/>`;
        out += `<line x1="${d.x1}" y1="${d.y1}" x2="${d.x2}" y2="${d.y2}" stroke="${dk.color}" stroke-width="${px(isVisto ? 3.4 : 2.6)}" stroke-linecap="round" ${dashPat ? `stroke-dasharray="${dashPat}"` : ''} pointer-events="none"/>`;
      }
      const Lw = wlen(d);
      if (Lw * s > 68) {
        const mx = (d.x1 + d.x2) / 2, my = (d.y1 + d.y2) / 2;
        const tag = (rt === 'techo' ? 'Techo' : rt === 'suelo' ? 'Suelo' : 'Pared') + (isVisto ? ' · Visto' : '');
        const ra = readable(deg(Math.atan2(d.y2 - d.y1, d.x2 - d.x1)));
        out += `<text x="${mx}" y="${my}" transform="rotate(${ra} ${mx} ${my})" text-anchor="middle" dominant-baseline="central" font-size="${px(9)}" font-weight="700" fill="${dk.color}" paint-order="stroke" stroke="${th.bg}" stroke-width="${px(3)}" stroke-linejoin="round" pointer-events="none">${tag}</text>`;
      }
      out += `<line data-id="${d.id}" x1="${d.x1}" y1="${d.y1}" x2="${d.x2}" y2="${d.y2}" stroke="transparent" stroke-width="${Math.max(w, px(12))}"/>`;
    });
    // Nudos de cambio de cota vertical (techo <-> suelo) entre tramos conectados
    const visDucts = vis.filter((e) => e.type === 'duct');
    for (let i = 0; i < visDucts.length; i++) {
      for (let j = i + 1; j < visDucts.length; j++) {
        const a = visDucts[i], b = visDucts[j];
        const za = a.height ?? (DUCT_KINDS[a.kind]?.h ?? 240), zb = b.height ?? (DUCT_KINDS[b.kind]?.h ?? 240);
        if (Math.abs(za - zb) < 25) continue;
        const ptsA = [[a.x1, a.y1], [a.x2, a.y2]], ptsB = [[b.x1, b.y1], [b.x2, b.y2]];
        ptsA.forEach(([ax, ay]) => ptsB.forEach(([bx, by]) => {
          if (Math.hypot(ax - bx, ay - by) < 5) {
            const col = (DUCT_KINDS[a.kind] || DUCT_KINDS.impulsion).color;
            out += `<g transform="translate(${ax} ${ay})" pointer-events="none"><circle r="${px(7)}" fill="${th.bg}" stroke="${col}" stroke-width="${px(2)}"/><circle r="${px(3)}" fill="${col}"/></g>`;
          }
        }));
      }
    }
    // Instalaciones (con simulación de halos de luz en 2D respetando el Cuadro Eléctrico)
    if (sim2d.lights) {
      vis.filter((e) => e.type === 'sym' && ['luz', 'foco', 'tiraLed', 'aplique'].includes(e.kind)).forEach((y) => {
        if (Obra.isCircuitLive(Obra.inferCircuitId(y))) {
          const rad = y.kind === 'foco' ? 95 : 155;
          out += `<circle cx="${y.x}" cy="${y.y}" r="${rad}" fill="url(#lightGlow2d)" pointer-events="none"/>`;
        }
      });
    }
    vis.filter((e) => e.type === 'sym').forEach((y) => { out += `<g data-id="${y.id}" transform="translate(${y.x} ${y.y})">${symShape(y, s, th)}</g>`; });
    // Cotas
    vis.filter((e) => e.type === 'dim').forEach((d) => { out += `<g data-id="${d.id}">${dimShape(d, s, th)}</g>`; });
    // Textos
    vis.filter((e) => e.type === 'text').forEach((t) => {
      out += `<text data-id="${t.id}" x="${t.x}" y="${t.y}" font-size="${t.size || 20}" font-weight="600" fill="${t.color || th.text}" text-anchor="middle" dominant-baseline="central" paint-order="stroke" stroke="${th.bg}" stroke-width="${(t.size || 20) * 0.18}" stroke-linejoin="round">${esc(t.text)}</text>`;
    });
    // Bocetos a mano alzada (Apple Pencil)
    vis.filter((e) => e.type === 'sketch' && Array.isArray(e.points) && e.points.length >= 2).forEach((k) => {
      const pts = k.points.map((p) => p[0] + ',' + p[1]).join(' ');
      out += `<polyline points="${pts}" fill="none" stroke="${k.color || '#ef4444'}" stroke-width="${Math.max(px(1.5), k.size || 4)}" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>`;
      out += `<polyline data-id="${k.id}" points="${pts}" fill="none" stroke="transparent" stroke-width="${Math.max(px(14), (k.size || 4) * 2.5)}"/>`;
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
        case 'duct': add(e.x1, e.y1, (e.width || 10) / 2); add(e.x2, e.y2, (e.width || 10) / 2); break;
        case 'room': case 'sketch': (e.points || []).forEach((p) => add(p[0], p[1])); break;
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
  let gridG, staticG, overG, lastDefsKey = '', lastStaticKey = '';
  function init() {
    root = $('#view-plano');
    root.innerHTML = `
      <div class="plan-top">
        <div class="pt-group">
          <span class="pt-ic">${icon('layers', 16)}</span>
          <select id="pPlanSel" title="Planta / versión del plano"></select>
          <span class="scope-badge" id="pScopeBadge">Interior</span>
          <button class="icon-btn" data-pa="addPlan" title="Nuevo plano (planta o exterior)">${icon('plus', 17)}</button>
          <button class="icon-btn" data-pa="undo" id="pUndo" title="Deshacer (Ctrl+Z / 2 dedos)">${icon('undo', 17)}</button>
          <button class="icon-btn" data-pa="redo" id="pRedo" title="Rehacer (Ctrl+Y / 3 dedos)">${icon('redo', 17)}</button>
        </div>
        <div class="pt-group pt-3d-grp">
          <button class="tgl pt-accent-tgl" id="pEdit3dBtn" data-pa="edit3d" title="Alternar entre plano 2D cenital y editor 3D interactivo">${icon('walk', 15)}<span>Editar 3D</span></button>
          <button class="btn sm" data-pa="render3d" title="Render 3D: visualizar, pasear, ver animaciones y generar informes">${icon('box', 15)}<span>Render 3D</span></button>
          <details class="dropdown">
            <summary class="tgl" id="pSimBtn" title="Animar puertas, ventanas, persianas, cocina y luces en 2D y 3D">${icon('bolt', 15)}<span>Simular</span></summary>
            <div class="dd-menu" id="pSimMenu">
              <button data-pa="sim2dDoors">${icon('door', 15)} Abrir / cerrar puertas y garaje</button>
              <button data-pa="sim2dWindows">${icon('window', 15)} Abrir / cerrar ventanas</button>
              <button data-pa="sim2dShutters">${icon('sliders', 15)} Bajar / subir persianas</button>
              <button data-pa="sim2dKitchen">${icon('layers', 15)} Abrir cajones y cocina</button>
              <button data-pa="sim2dLights">${icon('hint', 15)} Encender / apagar luces (Cuadro CGE)</button>
            </div>
          </details>
        </div>
        <div class="pt-group">
          <select id="pViewPreset" title="Vista por especialidad">${Object.entries(VIEW_PRESETS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}<option value="custom">Vista: Personalizada</option></select>
          <details class="dropdown">
            <summary class="tgl">${icon('eye', 15)}<span>Capas</span></summary>
            <div class="dd-menu" id="pLayers"></div>
          </details>
          <button class="tgl" data-pt="snap" title="Imán: ajustar a rejilla y esquinas">${icon('magnet', 15)}<span>Imán</span></button>
          <button class="tgl" data-pt="ortho" title="Modo ortogonal">${icon('ortho', 15)}<span>Orto</span></button>
          <button class="tgl" data-pt="autoDims" title="Mostrar medidas de muros">${icon('dim', 15)}<span>Cotas</span></button>
          <button class="tgl" id="pMultiBtn" data-pa="toggleMulti" title="Multiselección">${icon('checksq', 15)}<span>Multi</span></button>
          <button class="tgl" data-pt="pencilOnly" title="Modo Apple Pencil (evita toques con la palma)">${icon('edit', 15)}<span>Pencil</span></button>
        </div>
        <div class="pt-group">
          <button class="icon-btn" data-pa="zoomOut" title="Alejar (-)">${icon('zoomout', 16)}</button>
          <button class="zoom-lbl" data-pa="zoom100" id="pZoom" title="Zoom 1:1">100%</button>
          <button class="icon-btn" data-pa="zoomIn" title="Acercar (+)">${icon('zoomin', 16)}</button>
          <button class="icon-btn" data-pa="fit" title="Encuadrar todo (0)">${icon('fit', 16)}</button>
          <details class="dropdown right">
            <summary class="tgl" title="Más opciones del plano (calcar, comparar, rejilla, estilo)">${icon('settings', 15)}<span>Opciones</span></summary>
            <div class="dd-menu dd-opts">
              <button data-pa="copyRefsModal">${icon('layers', 15)} Copiar pilares y bajantes de otra planta…</button>
              <button data-pa="bgModal" id="pBgBtn">${icon('image', 15)} Calcar imagen de fondo…</button>
              <button data-pa="compareModal" id="pCmpBtn">${icon('compare', 15)} Comparar Antes / Después…</button>
              <button data-pa="dupPlan">${icon('copy', 15)} Duplicar este plano…</button>
              <button data-pa="delPlan">${icon('trash', 15)} Eliminar este plano…</button>
              <div class="dd-sep"></div>
              <label class="dd-row"><span>Paso rejilla</span><select id="pGrid">${[1, 2, 5, 10, 25, 50].map((g) => `<option value="${g}">${g} cm</option>`).join('')}</select></label>
              <label class="dd-row"><span>Estilo plano</span><select id="pTheme">${Object.entries(THEMES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></label>
            </div>
          </details>
          <button class="tgl" id="pDeskPanelBtn" data-pa="toggleDeskPanel" title="Mostrar u ocultar panel derecho">${icon('sliders', 15)}<span>Panel</span></button>
          <details class="dropdown right">
            <summary class="btn sm primary">${icon('download', 15)}<span>Exportar</span></summary>
            <div class="dd-menu">
              <button data-pa="exportPdf">${icon('receipt', 15)} Memoria Técnica (PDF)…</button>
              <button data-pa="exportPng">${icon('image', 15)} Imagen PNG (alta resolución)</button>
              <button data-pa="exportSvg">${icon('file', 15)} Vectorial SVG</button>
            </div>
          </details>
        </div>
      </div>
      <div class="plan-body">
        <div class="plan-tools" id="pTools">${TOOLS.map((t) => t.sep ? '<span class="tsep"></span>' : `<button data-tool="${t.id}" title="${t.label} (${t.key})">${icon(t.icon, 20)}<kbd>${t.key}</kbd></button>`).join('')}</div>
        <div class="plan-canvas">
          <svg id="planSvg" xmlns="http://www.w3.org/2000/svg"><defs id="planDefs"></defs><g id="planWorld"><g id="planGrid"></g><g id="planStatic"></g><g id="planOverlay"></g></g></svg>
          <div class="plan-3d-stage" id="plan3dStage" aria-hidden="true">
            <canvas id="plan3dCanvas"></canvas>
            <div class="p3d-mini-hud">
              <button class="btn xs" id="p3dCamToggle" title="Cambiar entre 1ª persona y Maqueta 3D">${icon('walk', 13)}<span>1ª persona</span></button>
              <button class="btn xs" id="p3dNightBtn" title="Encender o apagar luces del Cuadro Eléctrico">${icon('moon', 13)}<span>Luces</span></button>
            </div>
            <div class="r3d-dpad" id="p3dDpad" aria-label="Controles de desplazamiento">
              <button type="button" class="dp-btn dp-up" data-move="fwd" title="Avanzar (W / Flecha arriba)">▲</button>
              <button type="button" class="dp-btn dp-left" data-move="left" title="Izquierda (A / Flecha izquierda)">◀</button>
              <button type="button" class="dp-btn dp-down" data-move="back" title="Retroceder (S / Flecha abajo)">▼</button>
              <button type="button" class="dp-btn dp-right" data-move="right" title="Derecha (D / Flecha derecha)">▶</button>
            </div>
          </div>
          <div class="plan-hud">
            <div class="scale-bar" id="pScale"><i></i><span></span></div>
          </div>
          <div class="plan-fab-bar" id="pSelBar"></div>
          <button class="plan-panel-fab" id="pPanelToggle" data-pa="togglePanel">${icon('sliders', 17)}<span>Panel</span></button>
          <div class="plan-status"><span id="psCoords">X 0 · Y 0</span><span id="psHint"></span></div>
        </div>
        <aside class="plan-panel" id="planPanel"></aside>
      </div>`;
    svg = $('#planSvg'); world = $('#planWorld'); defs = $('#planDefs');
    gridG = $('#planGrid'); staticG = $('#planStatic'); overG = $('#planOverlay');
    panel = $('#planPanel');
    lastDefsKey = ''; lastStaticKey = '';
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
    const names = { grid: 'Rejilla', rooms: 'Habitaciones', walls: 'Muros', openings: 'Puertas y ventanas', furn: 'Mobiliario', elec: 'Iluminación y electricidad', fonta: 'Fontanería y agua', clima: 'Aire acondicionado y conductos', domo: 'Domótica y control', instTecho: 'Instalaciones por techo', instSuelo: 'Instalaciones por suelo / pared', instEmpotrado: 'Ver tramos empotrados (ocultos)', dims: 'Cotas y medidas', text: 'Textos', pins: 'Pines y tareas', sketch: 'Bocetos (Apple Pencil)' };
    $('#pLayers').innerHTML = Object.keys(DEF_LAYERS).map((k) => `<label class="chk"><input type="checkbox" data-layer="${k}" ${pui.layers[k] ? 'checked' : ''}> ${names[k]}</label>`).join('');
    const vp = $('#pViewPreset'); if (vp) vp.value = pui.viewPreset || 'todo';
    const bgB = $('#pBgBtn'); if (bgB) bgB.classList.toggle('on', !!cur.bgImage);
    const cmpB = $('#pCmpBtn'); if (cmpB) cmpB.classList.toggle('on', !!compareId);
    const dpb = $('#pDeskPanelBtn'); if (dpb) dpb.classList.toggle('on', !pui.panelHidden);
    const mb = $('#pMultiBtn'); if (mb) mb.classList.toggle('on', !!multiMode);
    const simB = $('#pSimBtn'); if (simB) simB.classList.toggle('on', !!(sim2d.doors > 0 || sim2d.windows > 0 || sim2d.shutters > 0 || sim2d.kitchen > 0 || sim2d.lights));
    const e3B = $('#pEdit3dBtn'); if (e3B) e3B.classList.toggle('on', !!inline3d.active);
    if (root) {
      root.classList.toggle('panel-hidden', !!pui.panelHidden);
      root.classList.toggle('mode-3d', !!inline3d.active);
    }
    $('#pUndo').disabled = !undoStack.length; $('#pRedo').disabled = !redoStack.length;
    updateSelBar();
  }

  function updateSelBar() {
    const bar = $('#pSelBar');
    if (!bar) return;
    const el = sel && byId(sel);
    if (draft && (draft.type === 'wall' || draft.type === 'poly' || draft.type === 'duct')) {
      bar.innerHTML = (draft.type === 'wall' ? `<button class="btn sm" data-pa="wallLenPrompt">${icon('ruler', 15)} Medida (cm)</button>` : '')
        + `<button class="btn sm primary" data-pa="finishDraft">${icon('check', 15)} Terminar</button><button class="btn sm" data-pa="cancelDraft">${icon('x', 15)} Cancelar</button>`;
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
    if (multiSel.size > 1) {
      bar.innerHTML = `<span class="small" style="font-weight:700;padding:0 6px">${multiSel.size} sel.</span>
        <button class="btn sm" data-pa="lockSel" title="Bloquear / desbloquear">${icon('lock', 15)}</button>
        <button class="btn sm" data-pa="dupSel">${icon('copy', 15)}</button>
        <button class="btn sm danger" data-pa="delSel">${icon('trash', 15)}</button>
        <button class="btn sm" data-pa="clearSel">${icon('x', 15)}</button>`;
      bar.classList.add('show');
      return;
    }
    if (!el) { bar.innerHTML = ''; bar.classList.remove('show'); return; }
    const canRot = el.type === 'furn' || el.type === 'sym' || el.type === 'door';
    bar.innerHTML = `
      <button class="btn sm primary" data-pa="openPanel">${icon('sliders', 15)} Editar</button>
      ${inline3d.active && el.type === 'furn' && !el.locked ? `<button class="btn sm" data-pa="zDown" title="Bajar 10 cm">Z-</button><button class="btn sm" data-pa="zUp" title="Subir 10 cm">Z+</button>` : ''}
      <button class="btn sm" data-pa="lockSel" title="${el.locked ? 'Desbloquear' : 'Bloquear'}">${icon(el.locked ? 'unlock' : 'lock', 15)}</button>
      ${canRot && !el.locked ? `<button class="btn sm" data-pa="rotSel">${icon('rotate', 15)}</button>` : ''}
      <button class="btn sm" data-pa="dupSel">${icon('copy', 15)}</button>
      ${!el.locked ? `<button class="btn sm danger" data-pa="delSel">${icon('trash', 15)}</button>` : ''}`;
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

  function drawInline3D() {
    if (!inline3d.active || !root) return;
    const c = $('#plan3dCanvas', root), wrap = $('#plan3dStage', root);
    if (!c || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const w = Math.max(320, Math.round(rect.width)), h = Math.max(240, Math.round(rect.height));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    inline3d.showFurn = pui.layers.furn !== false;
    inline3d.showClima = !!pui.layers.clima;
    inline3d.showElec = !!pui.layers.elec;
    inline3d.showFonta = !!pui.layers.fonta;
    inline3d.showDomo = !!pui.layers.domo;
    inline3d.showTecho = pui.layers.instTecho !== false;
    inline3d.showSuelo = pui.layers.instSuelo !== false;
    inline3d.showEmpotrado = pui.layers.instEmpotrado !== false;
    inline3d.showNotes = !!pui.layers.text || !!pui.layers.pins;
    inline3d.showLegend = false;
    inline3d.animDoors = sim2d.doors || 0;
    inline3d.animGarage = sim2d.doors || 0;
    inline3d.animWindows = sim2d.windows || 0;
    inline3d.animShutters = sim2d.shutters || 0;
    inline3d.animKitchen = sim2d.kitchen || 0;
    inline3d.nightMode = !!(inline3d.nightMode || sim2d.lights);
    inline3d.sel3dId = sel;
    render3DCanvas(c, inline3d);
  }

  function syncInline3DHud() {
    if (!root) return;
    const dpad = $('#p3dDpad', root);
    if (dpad) dpad.style.display = inline3d.camMode === 'fp' ? 'grid' : 'none';
    const camBtn = $('#p3dCamToggle', root);
    if (camBtn) {
      const isFP = inline3d.camMode === 'fp';
      camBtn.innerHTML = `${icon(isFP ? 'box' : 'walk', 13)}<span>${isFP ? 'Maqueta' : '1ª pers.'}</span>`;
      camBtn.title = isFP ? 'Cambiar a Maqueta 3D' : 'Cambiar a Primera persona';
    }
    const nb = $('#p3dNightBtn', root);
    if (nb) nb.classList.toggle('on', !!(inline3d.nightMode || sim2d.lights));
  }

  function toggleInline3D() {
    if (!root || inline3d.transitioning) return;
    const stage = $('#plan3dStage', root);
    if (!inline3d.active) {
      const list0 = els(), b0 = bbox(list0) || { x1: 0, y1: 0, x2: 800, y2: 600 };
      const rooms = list0.filter((e) => e.type === 'room' && e.points.length >= 3);
      const startPt = rooms.length ? centroid(rooms[0].points) : { x: (b0.x1 + b0.x2) / 2, y: (b0.y1 + b0.y2) / 2 };
      Object.assign(inline3d, {
        active: true, transitioning: true, camMode: 'orbit',
        yaw: 0, pitch: 86, zoom: 1, wallCut: 0.06,
        fpX: startPt.x, fpY: startPt.y, fpYaw: 0, fpPitch: -3, eyeZ: 165,
      });
      if (stage) stage.setAttribute('aria-hidden', 'false');
      syncTop(); syncInline3DHud();
      const t0 = performance.now(), dur = 460;
      const step = (now) => {
        const u = clamp((now - t0) / dur, 0, 1);
        const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        inline3d.pitch = 86 - 44 * e;
        inline3d.yaw = -32 * e;
        inline3d.wallCut = 0.06 + 0.88 * e;
        drawInline3D();
        if (u < 1) requestAnimationFrame(step);
        else {
          inline3d.camMode = 'fp';
          inline3d.transitioning = false;
          syncInline3DHud();
          drawInline3D();
        }
      };
      requestAnimationFrame(step);
    } else {
      inline3d.transitioning = true;
      inline3d.camMode = 'orbit';
      const p0 = inline3d.pitch || 42, y0 = inline3d.yaw || -32, w0 = inline3d.wallCut || 0.92;
      const t0 = performance.now(), dur = 260;
      const step = (now) => {
        const u = clamp((now - t0) / dur, 0, 1);
        const e = u * u;
        inline3d.pitch = p0 + (86 - p0) * e;
        inline3d.yaw = y0 * (1 - e);
        inline3d.wallCut = w0 * (1 - e) + 0.05 * e;
        drawInline3D();
        if (u < 1) requestAnimationFrame(step);
        else {
          inline3d.active = false;
          inline3d.transitioning = false;
          if (stage) stage.setAttribute('aria-hidden', 'true');
          syncTop();
          requestRender();
        }
      };
      requestAnimationFrame(step);
    }
  }

  function render() {
    if (!svg || !svg.isConnected) return;
    if (inline3d.active) { drawInline3D(); return; }
    const th = T(), s = view.s, r = svg.getBoundingClientRect();
    svg.style.background = th.bg;
    world.setAttribute('transform', `translate(${view.x} ${view.y}) scale(${s})`);

    // 1. Actualizar <defs> y rejilla solo cuando cambie escala/tema (evita recompilar patrones SVG en cada gesto en iPad)
    let m = 0, M = 100;
    if (pui.layers.grid) {
      m = 10; if (m * s < 7) m = 50; if (m * s < 7) m = 0;
      M = 100; if (M * s < 10) M = 500; if (M * s < 10) M = 1000;
    }
    const sBucket = Math.round(Math.log2(Math.max(0.02, s)) * 6);
    const defsKey = `${S().settings.planTheme}:${pui.layers.grid ? `${m}:${M}:${sBucket}` : '0'}`;
    if (defsKey !== lastDefsKey) {
      lastDefsKey = defsKey;
      const texDefs = `
        <radialGradient id="lightGlow2d"><stop offset="0%" stop-color="#fde047" stop-opacity=".75"/><stop offset="45%" stop-color="#fbbf24" stop-opacity=".28"/><stop offset="100%" stop-color="#fbbf24" stop-opacity="0"/></radialGradient>
        <pattern id="tex-madera" width="40" height="14" patternUnits="userSpaceOnUse"><path d="M0 7H40 M15 0V7 M35 7V14" stroke="rgba(120,72,24,0.22)" stroke-width="1" fill="none"/></pattern>
        <pattern id="tex-azulejo" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" stroke="rgba(15,23,42,0.2)" stroke-width="1" fill="none"/></pattern>
        <pattern id="tex-metro" width="30" height="15" patternUnits="userSpaceOnUse"><path d="M0 0H30 M0 7.5H30 M0 0V7.5 M15 7.5V15" stroke="rgba(15,23,42,0.2)" stroke-width="1" fill="none"/></pattern>
        <pattern id="tex-marmol" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M0 20 Q20 5 45 25 T60 40 M10 55 Q35 35 60 50" stroke="rgba(100,116,139,0.24)" stroke-width="1.2" fill="none"/></pattern>
        <pattern id="tex-microcemento" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="5" cy="7" r="1" fill="rgba(15,23,42,0.14)"/><circle cx="17" cy="15" r="1.2" fill="rgba(15,23,42,0.12)"/><circle cx="12" cy="21" r=".8" fill="rgba(15,23,42,0.14)"/></pattern>
        <pattern id="tex-piedra" width="40" height="30" patternUnits="userSpaceOnUse"><path d="M0 15L14 12L28 17L40 14 M14 0V12 M28 17V30" stroke="rgba(15,23,42,0.22)" stroke-width="1" fill="none"/></pattern>
        <pattern id="tex-cesped" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M4 10L6 6M14 16L16 12M10 18L11 14" stroke="rgba(22,163,74,0.35)" stroke-width="1.2" stroke-linecap="round"/></pattern>`;
      defs.innerHTML = texDefs + (pui.layers.grid
        ? (m ? `<pattern id="gMinor" width="${m}" height="${m}" patternUnits="userSpaceOnUse"><path d="M${m} 0H0V${m}" fill="none" stroke="${th.grid}" stroke-width="${1.6 / s}"/></pattern>` : '')
          + `<pattern id="gMajor" width="${M}" height="${M}" patternUnits="userSpaceOnUse"><path d="M${M} 0H0V${M}" fill="none" stroke="${th.gridMajor}" stroke-width="${1.8 / s}"/></pattern>`
        : '');
    }

    if (pui.layers.grid) {
      const x0 = -view.x / s, y0 = -view.y / s, w = r.width / s, h = r.height / s;
      gridG.innerHTML = (m ? `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#gMinor)" pointer-events="none"/>` : '')
        + `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#gMajor)" pointer-events="none"/>`;
    } else if (gridG.innerHTML) gridG.innerHTML = '';

    // 2. No regenerar los elementos estáticos del plano durante el paneo puro o movimiento de cursor (fluidez instantánea 120Hz)
    const isPurePan = !!(drag && drag.mode === 'pan');
    if (!isPurePan) {
      const bgi = plan().bgImage;
      const staticKey = `${plan().id}:${sBucket}:${S().settings.planTheme}:${pui.autoDims}:${compareId || ''}:${compareOpacity}:${JSON.stringify(pui.layers)}:${JSON.stringify(sim2d)}:${bgi ? `${bgi.x},${bgi.y},${bgi.w},${bgi.h},${bgi.opacity}` : ''}:${JSON.stringify(els())}`;
      if (staticKey !== lastStaticKey) {
        lastStaticKey = staticKey;
        let bg = '';
        if (bgi && bgi.src) {
          bg = `<image href="${bgi.src}" x="${bgi.x || 0}" y="${bgi.y || 0}" width="${bgi.w || 1000}" height="${bgi.h || 800}" opacity="${bgi.opacity ?? 0.45}" preserveAspectRatio="none" pointer-events="none"/>`;
        }
        let cmp = '';
        if (compareId && compareId !== plan().id) {
          const cp = S().plans.find((x) => x.id === compareId);
          if (cp) cmp = `<g opacity="${compareOpacity}" pointer-events="none">${renderElements(cp.elements, s, th, pui.layers, false).replace(/ data-id="[^"]*"/g, '')}</g>`;
        }
        staticG.innerHTML = bg + cmp + renderElements(els(), s, th, pui.layers, pui.autoDims);
      }
    }

    // 3. Superposición ligera (selección, cursores y borradores en vivo)
    let calibSvg = '';
    if (calib && calib.a && cursor) {
      const px = (v) => v / s;
      calibSvg = `<line x1="${calib.a.x}" y1="${calib.a.y}" x2="${cursor.x}" y2="${cursor.y}" stroke="#ef4444" stroke-width="${px(2.5)}" stroke-dasharray="${px(6)} ${px(4)}" pointer-events="none"/><circle cx="${calib.a.x}" cy="${calib.a.y}" r="${px(5)}" fill="#ef4444"/>`;
    }
    overG.innerHTML = overlay(s, th) + calibSvg;

    $('#pZoom').textContent = Math.round(s * 100) + '%';
    const cands = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
    const len = cands.find((c) => c * s >= 70) || 5000;
    const sb = $('#pScale'); sb.querySelector('i').style.width = len * s + 'px'; sb.querySelector('span').textContent = len >= 100 ? `${len / 100} m` : `${len} cm`;
  }

  /* ---------- Superposición: selección y borradores ---------- */
  function overlay(s, th) {
    const px = (v) => v / s, sc = th.sel;
    let o = '';
    const coarse = matchMedia('(pointer: coarse)').matches;
    const hr = coarse ? 9 : 6.5, hsq = coarse ? 12 : 9;
    const handle = (x, y, h, sq) => sq
      ? `<rect class="handle" data-handle="${h}" x="${x - px(hsq / 2)}" y="${y - px(hsq / 2)}" width="${px(hsq)}" height="${px(hsq)}" fill="${sc}" stroke="#fff" stroke-width="${px(1.8)}"/>`
      : `<circle class="handle" data-handle="${h}" cx="${x}" cy="${y}" r="${px(hr)}" fill="#fff" stroke="${sc}" stroke-width="${px(2.5)}"/>`;
    const label = (x, y, txt, ang = 0) => `<g transform="translate(${x} ${y}) rotate(${readable(ang)})" pointer-events="none"><rect x="${-px(txt.length * 3.6 + 8)}" y="${-px(10)}" width="${px(txt.length * 7.2 + 16)}" height="${px(20)}" rx="${px(6)}" fill="${sc}"/><text text-anchor="middle" dominant-baseline="central" font-size="${px(11.5)}" font-weight="700" fill="#fff">${esc(txt)}</text></g>`;
    const el = sel && byId(sel);
    // Resaltado de multiselección y recuadro de marquesina
    if (multiSel.size > 0) {
      multiSel.forEach((mid) => {
        const me = byId(mid); if (!me) return;
        const mb = bbox([me]); if (!mb) return;
        o += `<rect x="${mb.x1 - px(4)}" y="${mb.y1 - px(4)}" width="${mb.x2 - mb.x1 + px(8)}" height="${mb.y2 - mb.y1 + px(8)}" rx="${px(4)}" fill="${sc}" fill-opacity=".08" stroke="${sc}" stroke-width="${px(1.8)}" stroke-dasharray="${px(5)} ${px(3)}" pointer-events="none"/>`;
      });
    }
    if (drag && drag.mode === 'marquee' && drag.cur) {
      const mx = Math.min(drag.start.x, drag.cur.x), my = Math.min(drag.start.y, drag.cur.y);
      const mw = Math.abs(drag.cur.x - drag.start.x), mh = Math.abs(drag.cur.y - drag.start.y);
      o += `<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" fill="${sc}" fill-opacity=".12" stroke="${sc}" stroke-width="${px(1.6)}" stroke-dasharray="${px(6)} ${px(3)}" pointer-events="none"/>`;
    }
    if (el && multiSel.size <= 1) {
      if (el.locked) {
        const lb = bbox([el]);
        if (lb) o += label((lb.x1 + lb.x2) / 2, lb.y1 - px(14), 'Bloqueado');
      }
      switch (el.type) {
        case 'wall':
          o += `<line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" stroke="${sc}" stroke-opacity=".35" stroke-width="${el.thick + px(8)}" stroke-linecap="square" pointer-events="none"/>`;
          o += label((el.x1 + el.x2) / 2, (el.y1 + el.y2) / 2, fmtLenU(wlen(el)), deg(Math.atan2(el.y2 - el.y1, el.x2 - el.x1)));
          o += handle(el.x1, el.y1, 'p1') + handle(el.x2, el.y2, 'p2');
          break;
        case 'duct':
          o += `<line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" stroke="${sc}" stroke-opacity=".4" stroke-width="${Math.max(el.width || 10, px(8))}" pointer-events="none"/>`;
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
        case 'duct': {
          let b = snap(cursor); if (orthoOn()) b = ortho(draft.a, b);
          const dk = DUCT_KINDS[pui.ductKind] || DUCT_KINDS.impulsion, L = dist(draft.a, b);
          o += `<line x1="${draft.a.x}" y1="${draft.a.y}" x2="${b.x}" y2="${b.y}" stroke="${dk.color}" stroke-opacity=".45" stroke-width="${Math.max(pui.ductWidth || dk.w, px(4))}" pointer-events="none"/>`;
          o += `<line x1="${draft.a.x}" y1="${draft.a.y}" x2="${b.x}" y2="${b.y}" stroke="${dk.color}" stroke-width="${px(2)}" stroke-dasharray="${px(6)} ${px(4)}" pointer-events="none"/>`;
          if (L > 0.5) o += label((draft.a.x + b.x) / 2, (draft.a.y + b.y) / 2 - px(14), fmtLenU(L), deg(Math.atan2(b.y - draft.a.y, b.x - draft.a.x)));
          o += `<circle cx="${draft.a.x}" cy="${draft.a.y}" r="${px(4)}" fill="${dk.color}" pointer-events="none"/>`;
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
        case 'sketch': {
          if (draft.pts && draft.pts.length >= 2) {
            o += `<polyline points="${draft.pts.map((p) => p[0] + ',' + p[1]).join(' ')}" fill="none" stroke="${pui.sketchColor || '#ef4444'}" stroke-width="${Math.max(px(1.5), draft.size || pui.sketchSize || 4)}" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>`;
          }
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
      if (e.type === 'wall' || e.type === 'duct') { consider(e.x1, e.y1); consider(e.x2, e.y2); }
      else if (e.type === 'sym') consider(e.x, e.y);
      else if (e.type === 'furn' && (e.kind === 'bajante' || e.kind === 'pilar')) consider(e.x, e.y);
      else if (e.type === 'room') e.points.forEach((q) => consider(q[0], q[1]));
    });
    if (draft && draft.type === 'poly') draft.pts.forEach((q) => consider(q.x, q.y));
    if (best) return best;
    const g = pui.grid;
    els().forEach((w) => {
      if ((w.type !== 'wall' && w.type !== 'duct') || w.id === opt.exclude) return;
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
  function segIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    const rX = bx - ax, rY = by - ay, sX = dx - cx, sY = dy - cy;
    const denom = rX * sY - rY * sX;
    if (Math.abs(denom) < 1e-6) return null;
    const t = ((cx - ax) * sY - (cy - ay) * sX) / denom;
    const u = ((cx - ax) * rY - (cy - ay) * rX) / denom;
    return (t >= 0 && t <= 1 && u >= 0 && u <= 1) ? { t, u, x: ax + t * rX, y: ay + t * rY } : null;
  }

  function resolveWallCollision(f, refPt = null, opts = {}) {
    if (!f || f.type !== 'furn' || f.kind === 'hornacina' || f.kind === 'norte') return;
    const walls = els().filter((e) => e.type === 'wall' && e.status !== 'demoler');
    // 1. Evitar que el mueble cruce al otro lado de un muro respecto al punto de referencia (cámara o posición previa)
    if (refPt && (Math.hypot(f.x - refPt.x, f.y - refPt.y) > 0.5)) {
      let bestHit = null;
      for (const w of walls) {
        const hit = segIntersect(refPt.x, refPt.y, f.x, f.y, w.x1, w.y1, w.x2, w.y2);
        if (hit && (!bestHit || hit.t < bestHit.t)) bestHit = { t: hit.t, x: hit.x, y: hit.y, w };
      }
      if (bestHit) {
        const w = bestHit.w, L = wlen(w) || 1;
        const ux = (w.x2 - w.x1) / L, uy = (w.y2 - w.y1) / L, nx = -uy, ny = ux;
        const side = ((refPt.x - w.x1) * nx + (refPt.y - w.y1) * ny) >= 0 ? 1 : -1;
        if (opts.alignToWall) {
          // Orientar la trasera (-hh) apoyada contra el muro mirando hacia el interior
          f.angle = ((Math.round((deg(Math.atan2(ny * side, nx * side)) - 90) / 90) * 90) % 360 + 360) % 360;
        }
        const backDist = (w.thick || 15) / 2 + Math.max(f.w || 40, f.h || 40) / 2 + 1;
        f.x = r1(bestHit.x + nx * side * backDist);
        f.y = r1(bestHit.y + ny * side * backDist);
      }
    }
    // 2. Separar caja orientada (OBB) de todos los muros cercanos manteniendo siempre el lado interior
    const a = ((f.angle || 0) * Math.PI) / 180;
    const ca = Math.cos(a), sa = Math.sin(a);
    const hw = (f.w || 40) / 2, hh = (f.h || 40) / 2;
    for (let pass = 0; pass < 3; pass++) {
      for (const w of walls) {
        const L = wlen(w); if (L < 1) continue;
        const ux = (w.x2 - w.x1) / L, uy = (w.y2 - w.y1) / L;
        const nx = -uy, ny = ux;
        const dx = f.x - w.x1, dy = f.y - w.y1;
        const along = dx * ux + dy * uy;
        const perp = dx * nx + dy * ny;
        const projAlong = Math.abs(ux * ca + uy * sa) * hw + Math.abs(-ux * sa + uy * ca) * hh;
        if (along < -projAlong + 2 || along > L + projAlong - 2) continue;
        const projPerp = Math.abs(nx * ca + ny * sa) * hw + Math.abs(-nx * sa + ny * ca) * hh;
        const minDist = (w.thick || 15) / 2 + projPerp + 0.6;
        if (Math.abs(perp) < minDist) {
          const refPerp = refPt ? ((refPt.x - w.x1) * nx + (refPt.y - w.y1) * ny) : perp;
          const sign = refPerp >= 0 ? 1 : -1;
          f.x = r1(f.x + nx * (sign * minDist - perp));
          f.y = r1(f.y + ny * (sign * minDist - perp));
        }
      }
    }
  }

  function resolveWalkCollision(nx, ny, ox, oy) {
    const walls = els().filter((e) => e.type === 'wall' && e.status !== 'demoler');
    const doors = els().filter((e) => e.type === 'door');
    const R = 22;
    let x = nx, y = ny;
    for (const w of walls) {
      const L = wlen(w); if (L < 1) continue;
      const ux = (w.x2 - w.x1) / L, uy = (w.y2 - w.y1) / L;
      const wx = -uy, wy = ux;
      const along = (x - w.x1) * ux + (y - w.y1) * uy;
      if (along < -R || along > L + R) continue;
      // Permitir cruzar por huecos de puerta
      const inDoor = doors.some((d) => d.wallId === w.id && Math.abs(along - d.t * L) < Math.max(18, d.width / 2 - 8));
      if (inDoor) continue;
      const perp = (x - w.x1) * wx + (y - w.y1) * wy;
      const minD = (w.thick || 15) / 2 + R;
      if (Math.abs(perp) < minD) {
        const oPerp = (ox - w.x1) * wx + (oy - w.y1) * wy;
        const sign = oPerp >= 0 ? 1 : -1;
        x += wx * (sign * minD - perp);
        y += wy * (sign * minD - perp);
      }
    }
    return { x, y };
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
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
    // Auto-activar Modo Apple Pencil la primera vez que se usa el lápiz
    if (e.pointerType === 'pen' && !pui.pencilOnly && !pencilHintShown) {
      pencilHintShown = true;
      pui.pencilOnly = true; savePui(); syncTop();
      toast('Apple Pencil activo: el lápiz dibuja y el dedo mueve el plano', 'info');
    }
    // Detección de gestos multi-toque (2 dedos = Deshacer, 3 dedos = Rehacer, 2 dedos arrastre = Zoom)
    if (e.pointerType === 'touch') {
      const touchCount = [...pointers.values()].filter((pt) => pt.type === 'touch').length;
      if (touchCount >= 2) {
        if (!tapGesture) tapGesture = { t0: Date.now(), max: touchCount, moved: false, sx: e.clientX, sy: e.clientY };
        else tapGesture.max = Math.max(tapGesture.max, touchCount);
      }
    }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, view: Object.assign({}, view) };
      if (drag && drag.mode === 'sketch') draft = null;
      drag = null; return;
    }
    // Modo Apple Pencil (rechazo de palma): el dedo solo desplaza la vista
    if (pui.pencilOnly && e.pointerType === 'touch') {
      startPan(e);
      return;
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
      case 'duct': {
        let q = snap(p);
        if (draft && draft.type === 'duct') {
          if (orthoOn(e)) q = ortho(draft.a, q);
          if (dist(q, draft.a) < 1) break;
          const dk = DUCT_KINDS[pui.ductKind] || DUCT_KINDS.impulsion;
          pushUndo();
          els().push({ id: uid(), type: 'duct', kind: pui.ductKind, route: pui.ductRoute || dk.route || 'techo', installVis: pui.ductVis || 'empotrado', x1: r1(draft.a.x), y1: r1(draft.a.y), x2: r1(q.x), y2: r1(q.y), width: pui.ductWidth || dk.w, height: pui.ductHeight ?? dk.h, note: '' });
          Store.save(); syncUndo();
          draft.a = { x: q.x, y: q.y };
        } else draft = { type: 'duct', a: { x: q.x, y: q.y } };
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
      case 'sketch': {
        const pr = e.pointerType === 'pen' && e.pressure > 0 ? clamp(0.6 + e.pressure * 1.1, 0.5, 1.8) : 1;
        draft = { type: 'sketch', pts: [[r1(p.x), r1(p.y)]], size: r1((pui.sketchSize || 4) * pr) };
        drag = { mode: 'sketch' };
        break;
      }
      case 'furn': case 'sym': {
        if (!placing) { toast('Elige primero un elemento en el panel de la derecha', 'warn'); break; }
        pushUndo();
        if (placing.t === 'furn') {
          const q = snap(p), d = placing.def;
          const item = { id: uid(), type: 'furn', kind: d.kind, name: d.name, w: d.w, h: d.h, h3d: d.h3d || 0, z0: d.z0 || 0, x: q.x, y: q.y, angle: placing.angle || 0, note: '' };
          if (d.sections) { item.sections = clone(d.sections).map((s) => Object.assign(s, { id: uid() })); item.plinth = d.plinth ?? 10; item.handleType = d.handleType || 'gola'; item.frontColor = d.frontColor || '#f1ede6'; }
          resolveWallCollision(item);
          els().push(item);
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
      if (el && el.locked) { toast('Elemento bloqueado (desbloquéalo en el panel)', 'warn'); return; }
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
      if (e.shiftKey || multiMode) {
        if (multiSel.size === 0 && sel && sel !== id) multiSel.add(sel);
        if (multiSel.has(id)) multiSel.delete(id); else multiSel.add(id);
        sel = multiSel.size === 1 ? [...multiSel][0] : (multiSel.size > 1 ? id : null);
        renderPanel(); updateSelBar(); requestRender();
        return;
      }
      if (multiSel.size > 1 && multiSel.has(id)) {
        const movable = [...multiSel].map(byId).filter((x) => x && !x.locked);
        if (!movable.length) { toast('Todos los elementos seleccionados están bloqueados', 'warn'); return; }
        drag = { mode: 'multiMove', start: p, snapshot, pushed: false, items: movable.map((x) => ({ id: x.id, orig: clone(x) })) };
        return;
      }
      multiSel.clear();
      const wasSel = sel === id;
      if (!wasSel) { sel = id; renderPanel(); }
      if (el.locked) { startPan(e); drag.selectOnly = true; return; }
      if (el.type === 'room' && !wasSel) { startPan(e); drag.selectOnly = true; return; }
      drag = { mode: 'move', id, start: p, orig: clone(el), snapshot, pushed: false, links: [] };
      if (el.type === 'wall' && !e.altKey) drag.links = [...linksAt({ x: el.x1, y: el.y1 }, id), ...linksAt({ x: el.x2, y: el.y2 }, id)];
      return;
    }
    if (e.shiftKey || multiMode) {
      drag = { mode: 'marquee', start: p, cur: p };
      return;
    }
    if (sel || multiSel.size) { sel = null; multiSel.clear(); renderPanel(); }
    startPan(e);
  }

  function onMove(e) {
    if (pointers.has(e.pointerId)) {
      const prev = pointers.get(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
      if (tapGesture && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) > 8) tapGesture.moved = true;
    }
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
    if (drag.mode === 'marquee') { drag.cur = p; return; }
    if (drag.mode === 'multiMove') {
      const g = pui.snap ? pui.grid : 0;
      let dx = p.x - drag.start.x, dy = p.y - drag.start.y;
      if (!drag.pushed) { if (Math.hypot(dx, dy) * view.s < 3) return; pushUndo(drag.snapshot); drag.pushed = true; }
      if (g) { dx = Math.round(dx / g) * g; dy = Math.round(dy / g) * g; }
      drag.items.forEach(({ id, orig: o }) => {
        const it = byId(id); if (!it) return;
        if (it.type === 'wall' || it.type === 'dim' || it.type === 'duct') { it.x1 = o.x1 + dx; it.y1 = o.y1 + dy; it.x2 = o.x2 + dx; it.y2 = o.y2 + dy; }
        else if (it.type === 'room' || it.type === 'sketch') it.points = o.points.map(([x, y]) => [x + dx, y + dy]);
        else if (it.type !== 'door' && it.type !== 'window') { it.x = o.x + dx; it.y = o.y + dy; }
      });
      return;
    }
    if (drag.mode === 'rect') { draft.b = snap(p); const q = draft.b; snapInd = q.snapped ? q : null; return; }
    if (drag.mode === 'measure') { let q = snap(p); if (orthoOn(e)) q = ortho(draft.a, q); draft.b = q; return; }
    if (drag.mode === 'sketch') {
      const last = draft.pts[draft.pts.length - 1];
      if (!last || Math.hypot(p.x - last[0], p.y - last[1]) > 2 / view.s) draft.pts.push([r1(p.x), r1(p.y)]);
      return;
    }
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
        case 'room': case 'sketch': el.points = o.points.map(([x, y]) => [x + dx, y + dy]); break;
        case 'door': case 'window': {
          const w = byId(el.wallId); if (!w) break;
          const a = { x: w.x1, y: w.y1 }, b = { x: w.x2, y: w.y2 }, L = wlen(w);
          let along = o.t * L + (projT(p, a, b) - projT(drag.start, a, b)) * L;
          if (g) along = Math.round(along / g) * g;
          el.t = clamp(along, el.width / 2, L - el.width / 2) / L;
          break;
        }
        case 'dim': case 'duct': el.x1 = o.x1 + dx; el.y1 = o.y1 + dy; el.x2 = o.x2 + dx; el.y2 = o.y2 + dy; break;
        case 'sym': {
          const q = { x: o.x + (p.x - drag.start.x), y: o.y + (p.y - drag.start.y) };
          const d = SYMBOLS[el.kind] || {};
          const f = d.wall && !e.altKey ? wallFaceSnap(q) : null;
          if (f) { el.x = f.x; el.y = f.y; el.angle = f.angle; } else { el.x = o.x + dx; el.y = o.y + dy; }
          break;
        }
        case 'furn': {
          const prevPt = { x: el.x, y: el.y };
          el.x = o.x + dx; el.y = o.y + dy;
          if (!e.altKey) resolveWallCollision(el, prevPt);
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
      case 'dim': case 'duct':
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
    if (pointers.size === 0 && tapGesture) {
      const tg = tapGesture; tapGesture = null;
      if (!tg.moved && Date.now() - tg.t0 < 340) {
        if (tg.max === 2) { doUndo(); toast('Deshecho (2 dedos)', 'info'); return; }
        if (tg.max >= 3) { doRedo(); toast('Rehecho (3 dedos)', 'info'); return; }
      }
    }
    if (!drag) return;
    const d = drag; drag = null;
    svg.classList.remove('panning');
    if (d.mode === 'sketch') {
      if (draft && draft.pts.length >= 2) {
        pushUndo();
        els().push({ id: uid(), type: 'sketch', points: draft.pts, color: pui.sketchColor || '#ef4444', size: draft.size || pui.sketchSize || 4, note: '' });
        draft = null; commit(); return;
      }
      draft = null; requestRender(); return;
    }
    if (d.mode === 'marquee') {
      const x1 = Math.min(d.start.x, d.cur.x), y1 = Math.min(d.start.y, d.cur.y), x2 = Math.max(d.start.x, d.cur.x), y2 = Math.max(d.start.y, d.cur.y);
      if (x2 - x1 > 5 || y2 - y1 > 5) {
        multiSel.clear();
        els().forEach((el) => {
          if (el.locked || !layerOn(el, pui.layers)) return;
          const eb = bbox([el]);
          if (eb && eb.x1 >= x1 && eb.x2 <= x2 && eb.y1 >= y1 && eb.y2 <= y2) multiSel.add(el.id);
        });
        sel = multiSel.size === 1 ? [...multiSel][0] : (multiSel.size > 1 ? [...multiSel][0] : null);
        renderPanel(); updateSelBar();
      }
      requestRender(); return;
    }
    if (d.mode === 'multiMove' && d.pushed) { commit(); return; }
    if (d.mode === 'rect') finishRect(draft ? draft.type : tool);
    else if ((d.mode === 'move' || d.mode === 'handle') && d.pushed) {
      const el = byId(d.id);
      if (el && el.type === 'room') el.points = el.points.map((p) => p.map(r1));
      if (el && el.type === 'wall') ['x1', 'y1', 'x2', 'y2'].forEach((k) => { el[k] = r1(el[k]); });
      snapInd = null; commit(); return;
    }
    requestRender();
  }

  /* ---------- Acciones sobre la selección (simple y multiselección) ---------- */
  function selectedList() {
    if (multiSel.size > 0) return [...multiSel].map(byId).filter(Boolean);
    const el = sel && byId(sel);
    return el ? [el] : [];
  }
  function toggleLockSel(forceState) {
    const list = selectedList(); if (!list.length) return;
    pushUndo();
    const target = forceState !== undefined ? forceState : !list.every((x) => x.locked);
    list.forEach((x) => { x.locked = target; });
    commit();
    toast(target ? (list.length === 1 ? 'Elemento bloqueado' : `${list.length} elementos bloqueados`) : (list.length === 1 ? 'Elemento desbloqueado' : `${list.length} elementos desbloqueados`), 'info');
  }
  function deleteSel() {
    const list = selectedList(); if (!list.length) return;
    const removable = list.filter((x) => !x.locked);
    if (!removable.length) { toast('Los elementos seleccionados están bloqueados (desbloquéalos primero)', 'warn'); return; }
    const remIds = new Set(removable.map((x) => x.id));
    const wallIds = new Set(removable.filter((x) => x.type === 'wall').map((x) => x.id));
    pushUndo();
    plan().elements = els().filter((x) => !remIds.has(x.id) && !(x.wallId && wallIds.has(x.wallId)));
    sel = null; multiSel.clear(); commit();
    if (removable.length < list.length) toast(`Eliminados ${removable.length} (${list.length - removable.length} bloqueados conservados)`, 'info');
  }
  function duplicateSel() {
    const list = selectedList(); if (!list.length) return;
    pushUndo();
    const d = 30, newIds = [];
    list.forEach((el) => {
      const c = clone(el); c.id = uid(); c.locked = false;
      switch (c.type) {
        case 'wall': case 'dim': case 'duct': c.x1 += d; c.y1 += d; c.x2 += d; c.y2 += d; break;
        case 'room': case 'sketch': c.points = (c.points || []).map(([x, y]) => [x + d, y + d]); if (c.name) c.name += ' (copia)'; break;
        case 'door': case 'window': { const w = byId(c.wallId); if (w) { const L = wlen(w); c.t = clamp(c.t * L + c.width + 20, c.width / 2, L - c.width / 2) / L; } break; }
        default: c.x += d; c.y += d;
      }
      els().push(c); newIds.push(c.id);
    });
    if (newIds.length > 1) { multiSel = new Set(newIds); sel = newIds[0]; }
    else { multiSel.clear(); sel = newIds[0]; }
    commit();
  }
  function rotateSel() {
    const list = selectedList().filter((x) => !x.locked); if (!list.length) return;
    pushUndo();
    let changed = false;
    list.forEach((el) => {
      if (el.type === 'furn' || el.type === 'sym') { el.angle = (((el.angle || 0) + 90) % 360); changed = true; }
      else if (el.type === 'door') {
        const seq = [['left', 1], ['right', 1], ['right', -1], ['left', -1]];
        const i = seq.findIndex(([h, s]) => h === el.hinge && s === (el.side || 1));
        [el.hinge, el.side] = seq[(i + 1) % 4]; changed = true;
      }
    });
    if (!changed) { undoStack.pop(); return; }
    commit();
  }
  function nudge(dx, dy) {
    const list = selectedList().filter((x) => !x.locked); if (!list.length) return;
    pushUndo();
    list.forEach((el) => {
      switch (el.type) {
        case 'wall': case 'dim': case 'duct': el.x1 += dx; el.y1 += dy; el.x2 += dx; el.y2 += dy; break;
        case 'room': case 'sketch': el.points = (el.points || []).map(([x, y]) => [x + dx, y + dy]); break;
        case 'door': case 'window': { const w = byId(el.wallId); if (w) { const L = wlen(w); const step = (dx || dy); el.t = clamp(el.t * L + step, el.width / 2, L - el.width / 2) / L; } break; }
        default: el.x += dx; el.y += dy;
      }
    });
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
      case 'thick': case 'height': case 'sill': case 'w': case 'h': case 'h3d': case 'z0': case 'plinth': case 'watts': case 'size': case 'ceiling':
        if (Number.isFinite(n) && n >= 0) el[k] = k === 'w' && el.type === 'furn' ? clamp(n, 10, 600) : n; return;
      case 'x': case 'y': case 'offset': if (Number.isFinite(n)) el[k] = n; return;
      case 'kind':
        el.kind = v;
        if (el.type === 'sym' && SYMBOLS[v]) el.height = SYMBOLS[v].h;
        if (el.type === 'duct' && DUCT_KINDS[v]) {
          el.width = DUCT_KINDS[v].w;
          el.route = DUCT_KINDS[v].route || 'techo';
          el.height = DUCT_KINDS[v].h;
        }
        return;
      case 'route':
        el.route = v;
        if (DUCT_ROUTES[v]) el.height = DUCT_ROUTES[v].z;
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
    let h = `<div class="panel-mobile-head"><span>${multiSel.size > 1 ? `Multiselección (${multiSel.size})` : el ? 'Propiedades' : tool === 'furn' ? 'Mobiliario y cocina' : tool === 'sym' ? 'Instalaciones' : 'Resumen del plano'}</span><button class="icon-btn sm" data-a="closePanel" title="Cerrar panel">${icon('x', 18)}</button></div>`;
    if (multiSel.size > 1) h += multiProps();
    else if (el) h += propsFor(el);
    else if (tool === 'furn') h += furnLibrary();
    else if (tool === 'sym') h += symLibrary();
    else if (tool === 'duct') h += ductToolOpts() + summary();
    else if (tool === 'sketch') h += sketchToolOpts() + summary();
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

  function sketchToolOpts() {
    const cols = ['#ef4444', '#f97316', '#eab308', '#10b981', '#0ea5e9', '#8b5cf6', '#1e293b'];
    return `<div class="psec"><h4>${icon('edit', 16)} Boceto libre (Apple Pencil)</h4>
      <div class="swatches">${cols.map((c) => `<button class="sw ${pui.sketchColor === c ? 'on' : ''}" style="--c:${c}" data-a="pickSketchCol" data-c="${c}"></button>`).join('')}</div>
      <div class="chips">${[2, 4, 7, 12].map((sz) => `<button class="chip ${pui.sketchSize === sz ? 'on' : ''}" data-a="pickSketchSz" data-v="${sz}">${sz} px</button>`).join('')}</div>
      <p class="phint">${icon('hint', 14)} En iPad con <b>Modo Pencil</b> activo: el Apple Pencil dibuja, 1 dedo mueve el plano, 2 dedos tocan para Deshacer y 3 dedos para Rehacer.</p>
    </div>`;
  }

  function ductToolOpts() {
    const rt = pui.ductRoute || 'techo', vis = pui.ductVis || 'empotrado';
    return `<div class="psec"><h4>${icon('trend', 16)} Trazar conductos, tuberías y cables</h4>
      <div class="sym-list">${Object.entries(DUCT_KINDS).map(([k, d]) => `
        <button class="sym-item ${pui.ductKind === k ? 'active' : ''}" data-a="pickDuct" data-k="${k}">
          <span style="width:18px;height:6px;border-radius:3px;background:${d.color};display:block"></span>
          <span>${d.label}</span><small>${DUCT_ROUTES[d.route || 'techo'].short}</small>
        </button>`).join('')}</div>
      <div class="pgrid">
        <label class="pf full"><span>Por dónde discurre</span><select data-do="ductRoute">${Object.entries(DUCT_ROUTES).map(([k, r]) => `<option value="${k}" ${rt === k ? 'selected' : ''}>${r.label}</option>`).join('')}</select></label>
        <label class="pf full"><span>Visibilidad en obra / 3D</span><select data-do="ductVis"><option value="empotrado" ${vis === 'empotrado' ? 'selected' : ''}>Empotrado / oculto (falso techo o suelo)</option><option value="visto" ${vis === 'visto' ? 'selected' : ''}>Visto / en superficie (visible en 3D)</option></select></label>
        <label class="pf"><span>Ancho / Ø</span><div class="inp-suf"><input type="number" data-do="ductWidth" value="${pui.ductWidth}" min="2"><em>cm</em></div></label>
        <label class="pf"><span>Altura (Z)</span><div class="inp-suf"><input type="number" data-do="ductHeight" value="${pui.ductHeight}" min="0"><em>cm</em></div></label>
      </div>
      <p class="phint">${icon('hint', 14)} Toca inicio y cada esquina del recorrido (se imanta a bajantes, arquetas y otros tubos). Si unes un tramo de suelo con uno de techo en el mismo punto, se crea la subida vertical en 3D automáticamente.</p>
    </div>
    <div class="psec"><h4>${icon('drop', 16)} Bajantes, montantes y arquetas</h4>
      <div class="sym-list">${['bajanteFecal', 'bajantePluv', 'montanteAgua', 'arqueta', 'montanteElec', 'montanteClima'].map((k) => {
        const d = SYMBOLS[k];
        return `<button class="sym-item" data-a="pickRiserTool" data-k="${k}">
          <span style="width:18px;height:18px;border-radius:50%;border:2px solid ${SYM_GROUPS[d.group].color};display:grid;place-items:center;font-size:8px;font-weight:800;color:${SYM_GROUPS[d.group].color}">${d.g}</span>
          <span>${d.label}</span></button>`;
      }).join('')}</div>
    </div>`;
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
    const q = furnQuery.trim().toLowerCase();
    const renderItems = (items) => `<div class="lib">${items.map(({ f, i }) => {
      const m = Math.max(f.w, f.h) * 1.15, s = 54 / m;
      return `<button class="lib-item ${placing && placing.t === 'furn' && placing.i === i ? 'active' : ''}" data-a="pickFurn" data-i="${i}">
        <svg viewBox="${-m / 2} ${-m / 2} ${m} ${m}" width="54" height="54">${furnShape(f, s, Object.assign({}, th, { furnFill: 'transparent' }), { noLabel: true })}</svg>
        <span>${esc(f.name)}</span><small>${f.w}×${f.h}</small></button>`;
    }).join('')}</div>`;
    const allItems = FURN.map((f, i) => ({ f, i })).filter(({ f }) => !q || f.name.toLowerCase().includes(q) || (f.cat || '').includes(q));
    const orderedCats = isExt
      ? ['exterior', 'salon', 'cocina', 'bano', 'dormitorio', 'estructura']
      : ['cocina', 'bano', 'salon', 'dormitorio', 'estructura', 'exterior'];
    const catMap = Object.fromEntries(FURN_CATS.map((c) => [c.id, c]));
    let body = '';
    if (furnCat !== 'all') {
      const list = allItems.filter((x) => x.f.cat === furnCat);
      const c = catMap[furnCat] || { label: 'Mobiliario', ic: 'sofa' };
      body = `<div class="psec"><h4>${icon(c.ic, 16)} ${c.label} (${list.length})</h4>${list.length ? renderItems(list) : '<p class="phint">Sin resultados con ese filtro.</p>'}</div>`;
    } else {
      body = orderedCats.map((cid) => {
        const list = allItems.filter((x) => x.f.cat === cid);
        if (!list.length) return '';
        const c = catMap[cid];
        const openAttr = q || cid === (isExt ? 'exterior' : 'cocina') || cid === 'bano' ? 'open' : '';
        return `<details class="furn-group" ${openAttr}><summary><span class="fg-l">${icon(c.ic, 15)} ${c.label}</span><em>${list.length}</em></summary>${renderItems(list)}</details>`;
      }).join('') || '<div class="psec"><p class="phint">No hay muebles que coincidan con tu búsqueda.</p></div>';
    }
    return `<div class="psec"><h4>${icon('sofa', 16)} Catálogo de mobiliario</h4>
      <div class="furn-filter-bar">
        <input type="search" id="furnSearch" value="${esc(furnQuery)}" placeholder="Buscar mueble (ej. mampara, sofá, horno)…">
        <div class="furn-cats">${FURN_CATS.map((c) => `<button type="button" class="chip ${furnCat === c.id ? 'on' : ''}" data-a="setFurnCat" data-cat="${c.id}">${c.label}</button>`).join('')}</div>
      </div></div>` + body;
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

  function multiProps() {
    const list = selectedList();
    const lockedN = list.filter((x) => x.locked).length;
    return `<div class="psec phead"><div class="phead-ic">${icon('checksq', 18)}</div><div><h4>${list.length} elementos</h4><small>Arrastra cualquiera para mover en grupo</small></div><button class="icon-btn sm" data-a="deselect">${icon('x', 16)}</button></div>
      <div class="psec">
        <div class="btn-col">
          <button class="btn sm" data-a="dup">${icon('copy', 14)} Duplicar todos</button>
          <button class="btn sm" data-a="rotate">${icon('rotate', 14)} Girar muebles / puertas 90°</button>
          <button class="btn sm" data-a="lockAll">${icon('lock', 14)} Bloquear todos</button>
          ${lockedN ? `<button class="btn sm" data-a="unlockAllSel">${icon('unlock', 14)} Desbloquear seleccionados (${lockedN})</button>` : ''}
          <button class="btn sm danger" data-a="del">${icon('trash', 14)} Eliminar no bloqueados</button>
        </div>
      </div>`;
  }

  function propsFor(el) {
    const head = (ic, title, sub = '') => `<div class="psec phead"><div class="phead-ic">${icon(ic, 18)}</div><div><h4>${title}</h4>${sub ? `<small>${sub}</small>` : ''}</div>
      <button class="icon-btn sm ${el.locked ? 'active-lock' : ''}" data-a="toggleLock" title="${el.locked ? 'Desbloquear elemento' : 'Bloquear elemento para no moverlo por accidente'}">${icon(el.locked ? 'lock' : 'unlock', 15)}</button>
      <button class="icon-btn sm" data-a="deselect" title="Cerrar (Esc)">${icon('x', 16)}</button></div>`;
    switch (el.type) {
      case 'wall': {
        const L = wlen(el), ops = els().filter((o) => o.wallId === el.id);
        const huecos = ops.reduce((s, o) => s + (o.width * (o.height || 0)) / 10000, 0);
        return head('wall', 'Muro', WALL_STATUS[el.status || 'existente']) + `<div class="psec"><div class="pgrid">
          ${F.num('Longitud', 'length', L)}${F.num('Grosor', 'thick', el.thick)}
          ${F.num('Ángulo', 'wangle', Math.round((((-deg(Math.atan2(el.y2 - el.y1, el.x2 - el.x1))) % 360) + 360) % 360 * 10) / 10, '°')}${F.num('Altura', 'height', el.height || 250)}
          ${F.sel('Estado', 'status', el.status || 'existente', WALL_STATUS, true)}
          <label class="pf"><span>Color / pintura</span><input type="color" data-p="wallColor" value="${el.wallColor || '#e2e8f0'}"></label>
          ${F.sel('Textura / revestimiento', 'wallTexture', el.wallTexture || 'liso', TEXTURES, true)}
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
          <div class="pgrid">${F.num('Altura de techo', 'ceiling', c)}${F.sel('Textura suelo', 'floorTexture', el.floorTexture || 'liso', TEXTURES, true)}</div>
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
          ${isDoor ? '' : F.sel('Persiana', 'shutter', el.shutter || 'none', SHUTTER_KINDS, true)}
          ${F.num('Ancho', 'width', el.width)}${F.num('Alto', 'height', el.height)}
          ${isDoor ? '' : F.num('Antepecho (desde suelo)', 'sill', el.sill || 0)}
          ${F.num('Distancia al inicio', 'pos', pos)}
        </div>
        <div class="pinfos">${F.info('Distancia al final del muro', fmtLenU(L - pos - el.width))}${F.info('Longitud del muro', fmtLenU(L))}${isDoor ? '' : F.info('Altura del dintel', fmtLenU((el.sill || 0) + (el.height || 0)))}${F.info('Superficie del hueco', fmtNum((el.width * (el.height || 0)) / 10000) + ' m²')}</div>
        ${isDoor ? `<div class="pactions"><button class="btn sm" data-a="hinge">${icon('flip', 14)} Cambiar bisagra</button><button class="btn sm" data-a="flip">${icon('rotate', 14)} Abrir hacia el otro lado</button></div>`
          : `<div class="pactions"><button class="btn sm" data-a="flip">${icon('rotate', 14)} Invertir lado apertura / persiana</button></div>`}
        ${F.area('Notas', 'note', el.note, 'Modelo, color, manilla, persiana…')}</div>
        ${actions(B.dup, B.del)}`;
      }
      case 'furn': {
        const st3d = furn3DStyle(el.kind);
        const cirOpts = { '': 'Automático / Ninguno' };
        (S().electrical?.circuits || []).forEach((c) => { cirOpts[c.id] = `${c.code} · ${c.name} (${c.amps}A)`; });
        const isMod = MODULAR_KITCHEN.has(el.kind);
        const secs = Array.isArray(el.sections) ? el.sections : [];
        const modH = el.h3d || st3d.h, plinth = el.plinth ?? (el.z0 > 0 ? 0 : 10), usedH = secs.reduce((a, s) => a + num(s.h, 0), 0);
        const modHTML = isMod ? `<div class="psec">
          <h4>${icon('layers', 16)} Módulo configurable (10–300 cm)</h4>
          <div class="pgrid">
            ${F.sel('Tipo apertura / tirador', 'handleType', el.handleType || 'gola', HANDLE_KINDS, true)}
            ${F.num('Zócalo', 'plinth', plinth)}
          </div>
          <div class="pinfo" style="margin-top:4px"><span>Altura útil / ocupada</span><b class="${usedH > (modH - plinth) ? 'danger-txt' : ''}">${r1(usedH)} / ${r1(modH - plinth)} cm</b></div>
          <div class="mod-secs">${secs.map((s, idx) => `<div class="mod-sec" data-sidx="${idx}">
            <div class="ms-top">
              <select data-sf="kind">${Object.entries(SECTION_KINDS).map(([k, l]) => `<option value="${k}" ${k === s.kind ? 'selected' : ''}>${l}</option>`).join('')}</select>
              <div class="inp-suf ms-h"><input type="number" data-sf="h" value="${s.h}" min="5" max="240"><em>cm</em></div>
              <button class="icon-btn sm" data-a="delSec" data-sidx="${idx}" title="Quitar">${icon('x', 13)}</button>
            </div>
            <div class="ms-opts">
              <label class="chk small"><input type="checkbox" data-sf="anim" ${s.anim !== false ? 'checked' : ''}> Animar</label>
              <label class="chk small"><input type="checkbox" data-sf="cutlery" ${s.cutlery || s.kind === 'cubertero' ? 'checked' : ''}> Cubertero</label>
            </div>
          </div>`).join('') || '<p class="phint">Módulo hueco: añade cajones, puertas o estantes abajo.</p>'}</div>
          <button class="btn sm" data-a="addSec">${icon('plus', 14)} Añadir cajón / puerta / hueco</button>
        </div>` : '';
        return head('sofa', esc(el.name || 'Mueble'), `${r1(el.w)} × ${r1(el.h)} cm`) + `<div class="psec">
          ${F.text('Nombre', 'name', el.name)}
          <div class="pgrid">
            ${F.num('Ancho (10-300)', 'w', el.w)}${F.num('Fondo', 'h', el.h)}
            ${F.num('Altura 3D', 'h3d', el.h3d || st3d.h)}${F.num('Elevación suelo (Z)', 'z0', el.z0 ?? st3d.z0 ?? 0)}
            <label class="pf"><span>Color / acabado</span><input type="color" data-p="frontColor" value="${el.frontColor || st3d.c || '#f1ede6'}"></label>
            ${F.sel('Textura / material', 'texture', el.texture || 'liso', TEXTURES, true)}
            ${F.num('Ángulo', 'angle', el.angle || 0, '°', 15)}${F.num('Consumo (si elec.)', 'watts', el.watts ?? (Obra.DEFAULT_WATTS[el.kind] || 0), 'W')}
            ${F.sel('Circuito eléctrico', 'circuitId', el.circuitId || '', cirOpts, true)}
          </div>
          ${F.area('Notas', 'note', el.note, 'Modelo, medidas a medida, acabado…')}</div>
          ${modHTML}
          ${actions(B.rot, B.dup, B.del)}`;
      }
      case 'sym': {
        const d = SYMBOLS[el.kind] || SYMBOLS.enchufe;
        const opts = {}; Object.entries(SYMBOLS).forEach(([k, v]) => { opts[k] = `${SYM_GROUPS[v.group].label.split(' ')[0]} · ${v.label}`; });
        const cirOpts = { '': 'Automático según tipo' };
        (S().electrical?.circuits || []).forEach((c) => { cirOpts[c.id] = `${c.code} · ${c.name} (${c.amps}A)`; });
        const defW = Obra.DEFAULT_WATTS[el.kind] || 0;
        const live = Obra.isCircuitLive(Obra.inferCircuitId(el));
        const symRt = el.route || ((el.height ?? d.h ?? 110) >= 195 ? 'techo' : (el.height ?? d.h ?? 110) <= 35 ? 'suelo' : 'pared');
        const routeOpts = {}; Object.entries(DUCT_ROUTES).forEach(([k, r]) => { routeOpts[k] = r.label; });
        return head(d.group === 'fonta' ? 'drop' : 'bolt', d.label, SYM_GROUPS[d.group].label) + `<div class="psec">
          ${F.sel('Tipo', 'kind', el.kind, opts, true)}
          <div class="pgrid">
            ${F.sel('Ubicación (techo / suelo / pared)', 'route', symRt, routeOpts, true)}
            ${F.sel('Visibilidad', 'installVis', el.installVis || 'visto', DUCT_VIS, true)}
            ${F.num('Altura desde suelo', 'height', el.height ?? d.h ?? 0)}${F.num('Potencia', 'watts', el.watts ?? defW, 'W')}
            ${F.sel('Circuito (Cuadro CGE)', 'circuitId', el.circuitId || '', cirOpts, true)}
            ${F.num('Ángulo', 'angle', el.angle || 0, '°', 90)}
          </div>
          <div class="pinfos">${F.info('Estado en Cuadro Eléctrico', live ? '<span class="ok-txt">● Con tensión (ON)</span>' : '<span class="danger-txt">● Apagado (OFF)</span>')}</div>
          <button class="btn sm" data-a="openCge">${icon('bolt', 14)} Abrir Cuadro Eléctrico</button>
          ${F.area('Notas', 'note', el.note, 'Circuito, potencia, mecanismo…')}</div>
          ${actions(B.rot, B.dup, B.del)}`;
      }
      case 'duct': {
        const dk = DUCT_KINDS[el.kind] || DUCT_KINDS.impulsion, L = wlen(el);
        const opts = {}; Object.entries(DUCT_KINDS).forEach(([k, v]) => { opts[k] = v.label; });
        const routeOpts = {}; Object.entries(DUCT_ROUTES).forEach(([k, r]) => { routeOpts[k] = r.label; });
        const curRoute = inferDuctRoute(el);
        return head('trend', dk.label, `${DUCT_ROUTES[curRoute].short} · ${fmtLenU(L)}`) + `<div class="psec"><div class="pgrid">
          ${F.sel('Tipo de tubo / cable / conducto', 'kind', el.kind || 'impulsion', opts, true)}
          ${F.sel('Por dónde va (techo / suelo / pared)', 'route', curRoute, routeOpts, true)}
          ${F.sel('Visibilidad', 'installVis', el.installVis || 'empotrado', DUCT_VIS, true)}
          ${F.num('Ancho / diámetro', 'width', el.width || dk.w)}${F.num('Altura desde suelo (Z)', 'height', el.height ?? dk.h)}
        </div>
        <div class="pinfos">${F.info('Longitud tramo', fmtLenU(L))}${F.info('Trazado', DUCT_ROUTES[curRoute].label)}</div>
        <button class="btn sm" data-a="addRiserAtEnd">${icon('drop', 14)} Añadir bajante / montante vertical en extremo</button>
        ${F.area('Notas', 'note', el.note, 'Sección, aislamiento, circuito…')}</div>
        ${actions(B.dup, B.del)}`;
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
      case 'sketch':
        return head('edit', 'Trazo / Boceto') + `<div class="psec">
          <div class="pgrid">${F.num('Grosor', 'size', el.size || 4, 'px')}<label class="pf"><span>Color</span><input type="color" data-p="color" value="${el.color || '#ef4444'}"></label></div>
          ${F.area('Nota', 'note', el.note, 'Anotación opcional…')}</div>
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
        ${(() => { const n = els().filter((x) => x.locked).length; return n ? `<div class="pinfos" style="margin-top:4px"><div class="pinfo"><span>${icon('lock', 13)} Elementos bloqueados</span><button class="link-btn" data-a="unlockAll">Desbloquear todos (${n})</button></div></div>` : ''; })()}
      </div>
      <div class="psec"><h4>${icon('roomrect', 16)} Estancias</h4>
        ${st.rooms.length ? `<div class="rooms">${st.rooms.map((r) => `<button class="room-row" data-a="selectEl" data-id="${r.id}"><i style="--c:${r.color}"></i><span>${esc(r.name || 'Sin nombre')}</span><b>${fmtNum(r.area)} m²</b><small>${fmtNum(r.perim)} m</small></button>`).join('')}</div>` : '<p class="phint">Dibuja estancias con las herramientas de muro o habitación.</p>'}
      </div>
      <div class="psec"><h4>${icon('wall', 16)} Muros</h4>
        ${Object.keys(st.walls).length ? Object.entries(st.walls).map(([k, v]) => F.info(WALL_STATUS[k] || k, `${fmtNum(v.len)} m · ${fmtNum(v.area)} m²`)).join('') : '<p class="phint">Sin muros todavía.</p>'}
      </div>
      <div class="psec"><h4>${icon('door', 16)} Carpintería</h4>${F.info('Puertas', st.doors)}${F.info('Ventanas', st.windows)}${F.info('Muebles', st.furn)}</div>
      <div class="psec"><h4>${icon('bolt', 16)} Instalaciones</h4>${symGroups || '<p class="phint">Añade enchufes, puntos de luz, tomas de agua… con la herramienta <kbd>E</kbd> o traza tubos/cables con <kbd>K</kbd>.</p>'}
        ${(() => { const hN = els().filter((x) => x.installVis === 'oculto').length; return hN ? `<div class="pinfos" style="margin-top:6px"><div class="pinfo"><span>${icon('eye', 13)} Tramos ocultos (${hN})</span><button class="link-btn" data-a="unhideInstall">Mostrar todos</button></div></div>` : ''; })()}
      </div>
      ${(() => {
        const warns = planAudit(plan());
        return `<div class="psec"><h4>${icon('checksq', 16)} Revisión técnica rápida</h4>
          ${warns.length ? `<div class="pinfos">${warns.map((w) => `<div class="pinfo"><span style="color:var(--warning)">• ${esc(w)}</span></div>`).join('')}</div>`
            : `<p class="phint">${icon('check', 13)} Sin avisos pendientes en estancias ni instalaciones.</p>`}
        </div>`;
      })()}
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
        case 'exportPdf': openReportModal(); break;
        case 'addPlan': openPlanModal(false); break;
        case 'dupPlan': openPlanModal(true); break;
        case 'bgModal': openBgModal(); break;
        case 'copyRefsModal': openCopyRefsModal(); break;
        case 'compareModal': openCompareModal(); break;
        case 'edit3d': toggleInline3D(); break;
        case 'render3d': openRender3DModal(false); break;
        case 'delPlan': {
          if (!confirm(`¿Eliminar el plano «${plan().name}» y todo su contenido?`)) break;
          if (S().plans.length === 1) { pushUndo(); plan().elements = []; commit(); break; }
          S().plans = S().plans.filter((p) => p.id !== plan().id); switchPlan(S().plans[0].id); break;
        }
        case 'togglePanel': setMobilePanel(!root.classList.contains('panel-open')); break;
        case 'openPanel': setMobilePanel(true); break;
        case 'toggleDeskPanel': pui.panelHidden = !pui.panelHidden; savePui(); syncTop(); requestRender(); break;
        case 'wallLenPrompt': {
          if (!draft || draft.type !== 'wall') break;
          const v = num(prompt('Longitud exacta del muro en centímetros (ej. 350 para 3,50 m):', '300'), 0);
          if (v > 0) {
            draft.typed = String(v);
            const q = typedEnd();
            addWall(draft.a, q);
            draft.a = q; draft.typed = '';
            requestRender();
          }
          break;
        }
        case 'finishDraft': if (draft && draft.type === 'poly') closePoly(); else { draft = null; updateSelBar(); requestRender(); } break;
        case 'cancelDraft': draft = null; placing = null; updateSelBar(); renderPanel(); requestRender(); break;
        case 'rotPlacing': if (placing && placing.t === 'furn') { placing.angle = ((placing.angle || 0) + 90) % 360; requestRender(); } break;
        case 'rotSel': rotateSel(); break;
        case 'dupSel': duplicateSel(); break;
        case 'delSel': deleteSel(); break;
        case 'lockSel': toggleLockSel(); break;
        case 'clearSel': sel = null; multiSel.clear(); renderPanel(); requestRender(); break;
        case 'toggleMulti': multiMode = !multiMode; if (multiMode) setTool('select', true); syncTop(); toast(multiMode ? 'Multiselección activa: toca varios elementos o arrastra un recuadro' : 'Multiselección desactivada', 'info'); break;
        case 'sim2dDoors': case 'sim2dWindows': case 'sim2dShutters': case 'sim2dKitchen': {
          const map = { sim2dDoors: 'doors', sim2dWindows: 'windows', sim2dShutters: 'shutters', sim2dKitchen: 'kitchen' };
          const key = map[a.dataset.pa];
          const from = sim2d[key] || 0, to = from > 0.5 ? 0 : 1, t0 = performance.now();
          const step = (now) => {
            const p = Math.min(1, (now - t0) / 420);
            const e2 = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            sim2d[key] = from + (to - from) * e2;
            requestRender();
            if (p < 1) requestAnimationFrame(step);
            else syncTop();
          };
          requestAnimationFrame(step);
          break;
        }
        case 'zUp': case 'zDown': {
          const el = sel && byId(sel);
          if (el && el.type === 'furn' && !el.locked) {
            pushUndo();
            el.z0 = Math.max(0, (el.z0 ?? furn3DStyle(el.kind).z0 ?? 0) + (a.dataset.pa === 'zUp' ? 10 : -10));
            commit();
          }
          break;
        }
        case 'sim2dLights':
          sim2d.lights = !sim2d.lights;
          inline3d.nightMode = sim2d.lights;
          syncTop();
          syncInline3DHud();
          requestRender();
          toast(sim2d.lights ? 'Luces encendidas (según Cuadro Eléctrico)' : 'Luces apagadas', 'info');
          break;
      }
    });
    root.addEventListener('change', (e) => {
      const t = e.target;
      if (t.id === 'pPlanSel') switchPlan(t.value);
      else if (t.id === 'pViewPreset') {
        const pr = VIEW_PRESETS[t.value];
        pui.viewPreset = t.value;
        if (pr) Object.assign(pui.layers, pr.layers);
        savePui(); syncTop(); requestRender();
      }
      else if (t.id === 'pGrid') { pui.grid = +t.value; savePui(); }
      else if (t.id === 'pTheme') { S().settings.planTheme = t.value; Store.save(); renderPanel(); requestRender(); }
      else if (t.dataset.layer) { pui.layers[t.dataset.layer] = t.checked; pui.viewPreset = 'custom'; savePui(); syncTop(); requestRender(); }
    });
    // Controles del editor 3D integrado con Raycasting GPU exacto (Plan3D.pick + Plan3D.screenToFloor)
    const c3d = $('#plan3dCanvas', root), dpad3d = $('#p3dDpad', root);
    if (c3d) {
      let d3 = false, lx3 = 0, ly3 = 0, mv3 = false, dragEl3 = null, dragPushed3 = false, grabOff = { x: 0, y: 0 };
      c3d.addEventListener('pointerdown', (e) => {
        d3 = true; mv3 = false; dragPushed3 = false; lx3 = e.clientX; ly3 = e.clientY;
        const hit = window.Plan3D ? Plan3D.pick(c3d, e.clientX, e.clientY) : null;
        const curSel = sel && byId(sel);
        if (hit && curSel && hit.id === curSel.id && curSel.type === 'furn' && !curSel.locked) {
          dragEl3 = curSel;
          const fp = Plan3D.screenToFloor(c3d, e.clientX, e.clientY, curSel.z0 || 0);
          grabOff = fp ? { x: curSel.x - fp.x, y: curSel.y - fp.y } : { x: 0, y: 0 };
        } else dragEl3 = null;
        c3d.setPointerCapture(e.pointerId);
      });
      c3d.addEventListener('pointermove', (e) => {
        if (!d3 || !inline3d.active) return;
        const dx = e.clientX - lx3, dy = e.clientY - ly3;
        if (Math.hypot(dx, dy) > 4) mv3 = true;
        if (dragEl3 && mv3) {
          if (!dragPushed3) { pushUndo(); dragPushed3 = true; }
          const prevPt = { x: dragEl3.x, y: dragEl3.y };
          const fp = window.Plan3D ? Plan3D.screenToFloor(c3d, e.clientX, e.clientY, dragEl3.z0 || 0) : null;
          if (fp) {
            const g = pui.snap ? pui.grid : 0;
            let nx = fp.x + grabOff.x, ny = fp.y + grabOff.y;
            if (g) { nx = Math.round(nx / g) * g; ny = Math.round(ny / g) * g; }
            dragEl3.x = r1(nx); dragEl3.y = r1(ny);
          }
          resolveWallCollision(dragEl3, prevPt);
          lx3 = e.clientX; ly3 = e.clientY; drawInline3D();
          return;
        }
        if (inline3d.camMode === 'fp') {
          inline3d.fpYaw -= dx * 0.32;
          inline3d.fpPitch = clamp(inline3d.fpPitch - dy * 0.24, -48, 48);
        } else {
          inline3d.yaw += dx * 0.5;
          inline3d.pitch = clamp(inline3d.pitch + dy * 0.38, 14, 86);
        }
        lx3 = e.clientX; ly3 = e.clientY; drawInline3D();
      });
      c3d.addEventListener('pointerup', (e) => {
        d3 = false;
        if (dragEl3 && dragPushed3) { dragEl3 = null; commit(); return; }
        dragEl3 = null;
        if (!mv3 && inline3d.active) {
          const hit = window.Plan3D ? Plan3D.pick(c3d, e.clientX, e.clientY) : null;
          sel = hit ? hit.id : null;
          multiSel.clear();
          renderPanel(); updateSelBar(); drawInline3D();
        }
      });
      c3d.addEventListener('pointercancel', () => { d3 = false; dragEl3 = null; });
      c3d.addEventListener('wheel', (e) => {
        if (!inline3d.active) return;
        e.preventDefault();
        inline3d.zoom = clamp((inline3d.zoom || 1) * (e.deltaY > 0 ? 0.92 : 1.08), 0.5, 2.4);
        drawInline3D();
      }, { passive: false });
    }
    $('#p3dCamToggle', root)?.addEventListener('click', () => {
      inline3d.camMode = inline3d.camMode === 'fp' ? 'orbit' : 'fp';
      syncInline3DHud(); drawInline3D();
    });
    $('#p3dNightBtn', root)?.addEventListener('click', () => {
      inline3d.nightMode = !inline3d.nightMode;
      sim2d.lights = inline3d.nightMode;
      syncTop(); syncInline3DHud(); drawInline3D();
    });
    if (dpad3d) {
      const walkStep = (dir, speed = 10) => {
        const yr = (inline3d.fpYaw * Math.PI) / 180;
        const fx = Math.cos(yr), fy = Math.sin(yr), rx = -fy, ry = fx;
        const ox = inline3d.fpX, oy = inline3d.fpY;
        let nx = ox, ny = oy;
        if (dir === 'fwd') { nx += fx * speed; ny += fy * speed; }
        else if (dir === 'back') { nx -= fx * speed; ny -= fy * speed; }
        else if (dir === 'right') { nx += rx * speed; ny += ry * speed; }
        else if (dir === 'left') { nx -= rx * speed; ny -= ry * speed; }
        const safe = resolveWalkCollision(nx, ny, ox, oy);
        inline3d.fpX = safe.x; inline3d.fpY = safe.y;
        drawInline3D();
      };
      let hDir = null, hRaf = 0;
      const hLoop = () => { if (!hDir || !inline3d.active) { hRaf = 0; return; } walkStep(hDir, 9); hRaf = requestAnimationFrame(hLoop); };
      dpad3d.addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-move]'); if (!b) return; e.preventDefault(); hDir = b.dataset.move; if (!hRaf) hLoop(); });
      window.addEventListener('pointerup', () => { hDir = null; });
      window.addEventListener('pointercancel', () => { hDir = null; });
      window.addEventListener('keydown', (e) => {
        if (!inline3d.active || inline3d.camMode !== 'fp' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
        const k = e.key.toLowerCase();
        if (k === 'w' || k === 'arrowup') { e.preventDefault(); walkStep('fwd', 22); }
        else if (k === 's' || k === 'arrowdown') { e.preventDefault(); walkStep('back', 22); }
        else if (k === 'a' || k === 'arrowleft') { e.preventDefault(); walkStep('left', 22); }
        else if (k === 'd' || k === 'arrowright') { e.preventDefault(); walkStep('right', 22); }
      });
    }
    document.addEventListener('click', (e) => { $$('details.dropdown[open]').forEach((d) => { if (!d.contains(e.target)) d.open = false; }); });

    // Panel
    let panelSnap = null;
    panel.addEventListener('focusin', (e) => { if (e.target.dataset.p) panelSnap = JSON.stringify(els()); });
    panel.addEventListener('input', (e) => {
      const t = e.target;
      if (t.id === 'furnSearch') {
        furnQuery = t.value;
        const pos = t.selectionStart;
        renderPanel();
        const inp = $('#furnSearch', panel);
        if (inp) { inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (_) {} }
        return;
      }
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
      if (t.dataset.do) {
        if (t.dataset.do === 'ductRoute') {
          pui.ductRoute = t.value;
          if (DUCT_ROUTES[t.value]) pui.ductHeight = DUCT_ROUTES[t.value].z;
          savePui(); renderPanel(); requestRender(); return;
        }
        if (t.dataset.do === 'ductVis') { pui.ductVis = t.value; savePui(); requestRender(); return; }
        pui[t.dataset.do] = Math.max(0, num(t.value, 20)); savePui(); requestRender(); return;
      }
      if (t.dataset.sf) {
        const el = sel && byId(sel); if (!el || !Array.isArray(el.sections)) return;
        const idx = +t.closest('[data-sidx]').dataset.sidx;
        const s = el.sections[idx]; if (!s) return;
        pushUndo();
        if (t.type === 'checkbox') s[t.dataset.sf] = t.checked;
        else if (t.dataset.sf === 'h') s.h = Math.max(5, num(t.value, 20));
        else { s.kind = t.value; if (t.value === 'cubertero') s.cutlery = true; }
        commit(); return;
      }
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
        case 'deselect': sel = null; multiSel.clear(); setMobilePanel(false); renderPanel(); requestRender(); break;
        case 'toggleLock': toggleLockSel(); break;
        case 'lockAll': toggleLockSel(true); break;
        case 'unlockAllSel': toggleLockSel(false); break;
        case 'unlockAll': pushUndo(); els().forEach((x) => { x.locked = false; }); commit(); toast('Todos los elementos desbloqueados', 'success'); break;
        case 'split': if (el) splitWall(el); break;
        case 'hinge': if (el) { pushUndo(); el.hinge = el.hinge === 'right' ? 'left' : 'right'; commit(); } break;
        case 'flip': if (el) { pushUndo(); el.side = -(el.side || 1); commit(); } break;
        case 'color': if (el) { pushUndo(); el.color = b.dataset.c; commit(); } break;
        case 'selectEl': sel = b.dataset.id; setTool('select', true); renderPanel(); requestRender(); break;
        case 'wthick': pui.wallThick = +b.dataset.v; savePui(); renderPanel(); break;
        case 'pickSketchCol': pui.sketchColor = b.dataset.c; savePui(); renderPanel(); break;
        case 'pickSketchSz': pui.sketchSize = +b.dataset.v; savePui(); renderPanel(); break;
        case 'setFurnCat': furnCat = b.dataset.cat || 'all'; renderPanel(); break;
        case 'pickFurn': {
          const i = +b.dataset.i, d = FURN[i];
          if (inline3d.active && d) {
            pushUndo();
            let px0, py0, refPt = null;
            if (inline3d.camMode === 'fp') {
              const yr = (inline3d.fpYaw * Math.PI) / 180;
              refPt = { x: inline3d.fpX, y: inline3d.fpY };
              px0 = r1(inline3d.fpX + Math.cos(yr) * 145);
              py0 = r1(inline3d.fpY + Math.sin(yr) * 145);
            } else {
              const bb = bbox(els()) || { x1: 0, y1: 0, x2: 600, y2: 400 };
              px0 = r1((bb.x1 + bb.x2) / 2); py0 = r1((bb.y1 + bb.y2) / 2);
              refPt = { x: px0, y: py0 };
            }
            const item = { id: uid(), type: 'furn', kind: d.kind, name: d.name, w: d.w, h: d.h, h3d: d.h3d, z0: d.z0, plinth: d.plinth, handleType: d.handleType, frontColor: d.frontColor, sections: d.sections ? clone(d.sections) : undefined, x: px0, y: py0, angle: 0 };
            resolveWallCollision(item, refPt, { alignToWall: true });
            els().push(item);
            sel = item.id; multiSel.clear();
            commit(); updateSelBar(); drawInline3D();
            if (window.innerWidth <= 900) setMobilePanel(false);
            toast(`${d.name} añadido en 3D — arrástralo para moverlo`, 'success');
            break;
          }
          placing = { t: 'furn', i, def: d, angle: placing && placing.t === 'furn' ? placing.angle : 0 };
          renderPanel(); if (window.innerWidth <= 900) setMobilePanel(false);
          break;
        }
        case 'pickSym': placing = { t: 'sym', kind: b.dataset.k }; renderPanel(); if (window.innerWidth <= 900) setMobilePanel(false); break;
        case 'pickRiserTool':
          setTool('sym', true);
          placing = { t: 'sym', kind: b.dataset.k };
          renderPanel();
          if (window.innerWidth <= 900) setMobilePanel(false);
          break;
        case 'addRiserAtEnd':
          if (el && el.type === 'duct') {
            const g = (DUCT_KINDS[el.kind] || DUCT_KINDS.impulsion).group;
            const rk = g === 'elec' || g === 'domo' ? 'montanteElec' : g === 'clima' ? 'montanteClima' : el.kind === 'desague' ? 'bajanteFecal' : 'montanteAgua';
            pushUndo();
            const rItem = { id: uid(), type: 'sym', kind: rk, route: 'techo', installVis: el.installVis === 'visto' ? 'visto' : 'empotrado', x: el.x2, y: el.y2, angle: 0, height: 250, note: '' };
            els().push(rItem);
            sel = rItem.id;
            commit();
            toast(`${SYMBOLS[rk].label} colocada y unida al extremo`, 'success');
          }
          break;
        case 'unhideInstall':
          pushUndo();
          els().forEach((x) => { if (x.installVis === 'oculto') x.installVis = x.type === 'duct' ? 'empotrado' : 'visto'; });
          commit();
          toast('Tramos e instalaciones ocultos mostrados de nuevo', 'success');
          break;
        case 'pickDuct': {
          const dk = DUCT_KINDS[b.dataset.k] || DUCT_KINDS.impulsion;
          pui.ductKind = b.dataset.k; pui.ductWidth = dk.w; pui.ductRoute = dk.route || 'techo'; pui.ductHeight = dk.h;
          pui.layers[dk.group] = true;
          savePui(); renderPanel(); if (window.innerWidth <= 900) setMobilePanel(false); break;
        }
        case 'openTask': App.openTask(b.dataset.t); break;
        case 'openCge': Obra.openTab('electric'); break;
        case 'addSec': {
          if (!el) break;
          pushUndo();
          if (!Array.isArray(el.sections)) el.sections = [];
          el.sections.push({ id: uid(), kind: 'cajon', h: 20, anim: true, cutlery: false });
          commit(); break;
        }
        case 'delSec': {
          if (!el || !Array.isArray(el.sections)) break;
          pushUndo();
          el.sections.splice(+b.dataset.sidx, 1);
          commit(); break;
        }
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

  /* ---------- Vista 3D interactiva + Render fotorrealista con IA ---------- */
  function furn3DStyle(kind) {
    switch (kind) {
      case 'armario': case 'vestidor': case 'nevera': case 'horno': case 'microondas': case 'despensa': case 'trastero': return { h: 210, z0: 0, c: '#d6cfc4' };
      case 'muebleAlto': return { h: 70, z0: 145, c: '#ebe5dc' };
      case 'campana': return { h: 45, z0: 155, c: '#94a3b8' };
      case 'muebleBajo': case 'muebleCajon': case 'muebleRincon': case 'vinoteca': case 'peninsula': case 'moduloCocina': return { h: 85, z0: 0, c: '#e5dfd6' };
      case 'estanteria': return { h: 185, c: '#c8b8a2' };
      case 'pilar': return { h: 250, c: '#94a3b8' };
      case 'encimera': case 'fregadero': case 'placa': case 'isla': case 'lavadora': case 'secadora': case 'lavavajillas': case 'barbacoa': return { h: 90, c: '#e2ddd5' };
      case 'mesa': case 'mesaRedonda': case 'escritorio': case 'comoda': return { h: 76, c: '#c9a67d' };
      case 'sofa': case 'sofaL': return { h: 78, c: '#94a3b8' };
      case 'cama': return { h: 56, c: '#cbd5e1' };
      case 'cuna': return { h: 85, c: '#e2e8f0' };
      case 'silla': case 'sillaOficina': case 'taburete': case 'mesita': case 'tv': return { h: 52, c: '#b8a898' };
      case 'mesaCentro': case 'tumbona': return { h: 40, c: '#c9a67d' };
      case 'inodoro': case 'lavabo': case 'lavabo2': case 'bide': return { h: 75, c: '#f1f5f9' };
      case 'muebleBano': return { h: 82, z0: 0, c: '#e7dfd5' };
      case 'mampara': case 'mamparaCorredera': case 'mamparaAbatible': return { h: 200, z0: 0, c: '#38bdf8', glass: true };
      case 'columnaDucha': return { h: 215, z0: 0, c: '#cbd5e1' };
      case 'espejoLed': return { h: 80, z0: 120, c: '#e0f2fe' };
      case 'hornacina': return { h: 35, z0: 115, c: '#94a3b8' };
      case 'ducha': case 'duchaExt': case 'banera': case 'baneraExenta': return { h: 48, c: '#bae6fd' };
      case 'piscina': return { h: 6, c: '#38bdf8' };
      case 'alfombra': return { h: 2, c: '#e2d9c8' };
      case 'pergola': return { h: 235, c: '#a67c52' };
      case 'coche': return { h: 145, c: '#64748b' };
      case 'moto': case 'bici': return { h: 105, c: '#475569' };
      case 'arbol': return { h: 250, c: '#4ade80' };
      case 'huerto': return { h: 45, c: '#86efac' };
      case 'escalera': return { h: 140, c: '#cbd5e1' };
      default: return { h: 75, c: '#cbd5e1' };
    }
  }

  function shadeHex(hex, f) {
    const m = String(hex || '#cccccc').replace('#', '');
    if (m.length !== 6) return hex;
    const r = clamp(Math.round(parseInt(m.slice(0, 2), 16) * f), 0, 255);
    const g = clamp(Math.round(parseInt(m.slice(2, 4), 16) * f), 0, 255);
    const b = clamp(Math.round(parseInt(m.slice(4, 6), 16) * f), 0, 255);
    return `rgb(${r},${g},${b})`;
  }

  function render3DCanvas(canvas, state3d, targetPlan = null) {
    if (window.Plan3D) {
      Plan3D.render(canvas, state3d, targetPlan || plan(), {
        wlen, clamp, polyArea, bbox, centroid, furn3DStyle, num,
        SYMBOLS, SYM_GROUPS, DUCT_KINDS, Obra, S,
      });
    }
  }

  function buildRenderPrompt(style, viewMode, roomName) {
    const p = plan(), st = stats(p);
    const roomsDesc = st.rooms.map((r) => `${r.name} (${fmtNum(r.area, 1)} m²${r.floor ? ', suelo: ' + r.floor : ''})`).join('; ');
    const furnNames = [...new Set(els().filter((e) => e.type === 'furn' && e.name).map((e) => e.name))].slice(0, 20).join(', ');
    const winElec = els().filter((e) => e.type === 'window' && e.shutter === 'electric').length;
    const garaje = els().some((e) => e.type === 'door' && e.kind === 'garaje');
    const isExt = p.scope === 'exterior';
    const baseView = viewMode === 'interior' && roomName
      ? `Fotografía arquitectónica fotorrealista a altura de ojos dentro de la estancia "${roomName}"`
      : (isExt ? 'Render arquitectónico 3D fotorrealista aéreo de la parcela exterior y jardín' : 'Render arquitectónico 3D fotorrealista en perspectiva axonométrica cenital (tipo maqueta abierta sin techo)');
    return `${baseView}, basado fielmente en la distribución exacta de la imagen adjunta del plano "${p.name}".
Estilo de decoración: ${style}. Iluminación natural cálida, sombras realistas, materiales de alta calidad, fotografía de revista de arquitectura.
Estancias y superficies: ${roomsDesc || 'vivienda reformada'}.
Elementos y mobiliario presentes: ${furnNames || 'mobiliario acorde a cada estancia'}${winElec ? `. ${winElec} ventanas con persianas eléctricas empotradas` : ''}${garaje ? '. Puerta de garaje seccional eléctrica moderna' : ''}.
Respeta exactamente la posición de muros, puertas, ventanas y muebles del plano adjunto. Sin texto ni cotas sobre la imagen final.`;
  }

  function getSaved3DLayers() {
    return Object.assign({
      showFurn: pui.layers.furn !== false,
      showClima: pui.viewPreset === 'clima' || (!!pui.layers.clima && pui.viewPreset !== 'distribucion'),
      showElec: pui.viewPreset === 'elec',
      showFonta: pui.viewPreset === 'fonta',
      showDomo: pui.viewPreset === 'domo',
      showTecho: pui.layers.instTecho !== false,
      showSuelo: pui.layers.instSuelo !== false,
      showEmpotrado: true,
      showLegend: true,
      showNotes: true,
    }, pui.layers3d || {});
  }

  function openRender3DModal(editable = false) {
    const savedL = getSaved3DLayers();
    const list0 = plan().elements;
    const b0 = bbox(list0) || { x1: 0, y1: 0, x2: 800, y2: 600 };
    const roomsList = list0.filter((e) => e.type === 'room' && e.points.length >= 3);
    const startPt = roomsList.length ? centroid(roomsList[0].points) : { x: (b0.x1 + b0.x2) / 2, y: (b0.y1 + b0.y2) / 2 };
    const state3d = Object.assign({
      editable: !!editable,
      sel3dId: null,
      camMode: editable ? 'fp' : 'orbit',
      yaw: -35, pitch: 42, zoom: 1, wallCut: 0.78, hideDemo: true,
      fpX: startPt.x, fpY: startPt.y, fpYaw: 0, fpPitch: -3, eyeZ: 165,
      animDoors: 0, animGarage: 0, animWindows: 0, animShutters: 0, animKitchen: 0, nightMode: false,
    }, savedL);
    const GEM_KEY = 'mi-reforma:gemini:key';
    const st = stats(plan());
    Modal.open({
      title: editable ? `Editar en 3D · ${esc(plan().name)}` : `Render 3D · ${esc(plan().name)}`,
      wide: true,
      body: `
        ${editable ? '' : `<div class="seg" id="r3dSeg" style="margin-bottom:14px">
          <button class="active" data-rt="v3d">${icon('box', 15)}<span>Render 3D interactivo</span></button>
          <button data-rt="ai">${icon('image', 15)}<span>Render fotorrealista IA</span></button>
        </div>`}
        <div id="r3dPane">
          <div class="r3d-cam-bar">
            <div class="seg sm" id="r3dCamSeg">
              <button class="${state3d.camMode === 'fp' ? 'active' : ''}" data-cam="fp">${icon('walk', 14)}<span>Primera persona</span></button>
              <button class="${state3d.camMode === 'orbit' ? 'active' : ''}" data-cam="orbit">${icon('box', 14)}<span>Maqueta 3D</span></button>
            </div>
            <div id="r3dFpJumpWrap" style="display:${state3d.camMode === 'fp' ? 'flex' : 'none'};align-items:center;gap:8px;flex-wrap:wrap">
              ${roomsList.length ? `<label class="field inline-f"><span>Ir a:</span><select id="r3dFpRoom">${roomsList.map((r, i) => `<option value="${i}">${esc(r.name || 'Estancia ' + (i + 1))}</option>`).join('')}</select></label>` : ''}
              <label class="field inline-f"><span>Altura ojos</span><input type="range" id="r3dEyeZ" min="100" max="200" step="5" value="165" style="width:90px"><em id="r3dEyeLbl" class="small muted">165 cm</em></label>
            </div>
          </div>
          <div class="r3d-canvas-wrap">
            <canvas id="r3dCanvas" width="960" height="560"></canvas>
            <div class="r3d-dpad" id="r3dDpad" style="display:${state3d.camMode === 'fp' ? 'grid' : 'none'}" aria-label="Controles de desplazamiento">
              <button type="button" class="dp-btn dp-up" data-move="fwd" title="Avanzar (W / Flecha arriba)">▲</button>
              <button type="button" class="dp-btn dp-left" data-move="left" title="Izquierda (A / Flecha izquierda)">◀</button>
              <button type="button" class="dp-btn dp-down" data-move="back" title="Retroceder (S / Flecha abajo)">▼</button>
              <button type="button" class="dp-btn dp-right" data-move="right" title="Derecha (D / Flecha derecha)">▶</button>
            </div>
            <div class="r3d-hint" id="r3dHint">${editable
              ? 'Toca cualquier mueble para editarlo · Arrastra para mirar · Flechas o WASD para caminar'
              : 'Arrastra para rotar 360° e inclinar · Solo visualización'}</div>
          </div>
          <div class="r3d-anim-bar">
            <button class="chip" data-anim="animDoors">${icon('door', 13)} Puertas</button>
            <button class="chip" data-anim="animGarage">${icon('home', 13)} Garaje</button>
            <button class="chip" data-anim="animWindows">${icon('window', 13)} Ventanas</button>
            <button class="chip" data-anim="animShutters">${icon('sliders', 13)} Persianas</button>
            <button class="chip" data-anim="animKitchen">${icon('layers', 13)} Cocina</button>
            <button class="chip" id="r3dNightBtn">${icon('moon', 13)} Noche / Luces</button>
            <button class="btn sm ghost" id="r3dOpenCge">${icon('bolt', 13)} Cuadro Eléctrico</button>
          </div>
          ${editable ? `<div id="r3dEditBar" class="r3d-edit-bar"></div>` : ''}
          <div class="r3d-controls" id="r3dOrbitCtrls" style="display:${state3d.camMode === 'fp' ? 'none' : ''}">
            <label class="field"><span>Altura de muros</span><input type="range" id="r3dCut" min="0.2" max="1" step="0.05" value="0.78"></label>
            <label class="field"><span>Zoom</span><input type="range" id="r3dZoom" min="0.6" max="1.8" step="0.05" value="1"></label>
            <label class="chk"><input type="checkbox" id="r3dHideDemo" checked> Ocultar demoler</label>
          </div>
          <div class="r3d-layers">
            <label class="chk"><input type="checkbox" data-3dl="showFurn" ${state3d.showFurn ? 'checked' : ''}> Mobiliario</label>
            <label class="chk"><input type="checkbox" data-3dl="showClima" ${state3d.showClima ? 'checked' : ''}> AA / Conductos</label>
            <label class="chk"><input type="checkbox" data-3dl="showElec" ${state3d.showElec ? 'checked' : ''}> Electricidad</label>
            <label class="chk"><input type="checkbox" data-3dl="showFonta" ${state3d.showFonta ? 'checked' : ''}> Fontanería</label>
            <label class="chk"><input type="checkbox" data-3dl="showDomo" ${state3d.showDomo ? 'checked' : ''}> Domótica</label>
            <label class="chk"><input type="checkbox" data-3dl="showTecho" ${state3d.showTecho !== false ? 'checked' : ''}> Por techo</label>
            <label class="chk"><input type="checkbox" data-3dl="showSuelo" ${state3d.showSuelo !== false ? 'checked' : ''}> Por suelo / pared</label>
            <label class="chk"><input type="checkbox" data-3dl="showEmpotrado" ${state3d.showEmpotrado !== false ? 'checked' : ''}> Ver empotradas</label>
            <label class="chk"><input type="checkbox" data-3dl="showLegend" ${state3d.showLegend ? 'checked' : ''}> Leyenda</label>
            <label class="chk"><input type="checkbox" data-3dl="showNotes" ${state3d.showNotes ? 'checked' : ''}> Anotaciones</label>
          </div>
          <div class="r3d-actions">
            <button class="btn sm" id="r3dReset">${icon('rotate', 14)} Reiniciar cámara</button>
            ${editable ? '' : `
            <button class="btn sm" id="r3dSaveDiary">${icon('camera', 14)} Guardar en Diario</button>
            <button class="btn sm" id="r3dPdf">${icon('receipt', 14)} Memoria Técnica (PDF)</button>
            <button class="btn sm primary" id="r3dDownload">${icon('download', 14)} Descargar PNG</button>`}
          </div>
        </div>
        ${editable ? '' : `<div id="rAiPane" style="display:none">
          <div class="grid2" style="margin-bottom:12px">
            <label class="field"><span>Estilo visual</span><select id="aiStyle">
              <option>Moderno cálido (madera clara, tonos neutros, luz natural)</option>
              <option>Nórdico minimalista (blanco roto, roble natural, líneas limpias)</option>
              <option>Mediterráneo luminoso (cal, lino, piedra natural, madera)</option>
              <option>Industrial elegante (microcemento, hierro negro, madera cálida)</option>
              <option>Contemporáneo de lujo (mármol suave, iluminación indirecta LED)</option>
            </select></label>
            <label class="field"><span>Tipo de encuadre</span><select id="aiView">
              <option value="aerial">Vista 3D completa de toda la planta</option>
              <option value="interior">Foto interior de una estancia</option>
            </select></label>
            <label class="field span2" id="aiRoomWrap" style="display:none"><span>Estancia a fotografiar</span><select id="aiRoom">${st.rooms.map((r) => `<option value="${esc(r.name)}">${esc(r.name)}</option>`).join('') || '<option value="">General</option>'}</select></label>
            <label class="field span2"><span>Prompt generado automáticamente (puedes editarlo)</span><textarea id="aiPrompt" rows="4"></textarea></label>
          </div>
          <div class="callout" style="margin-bottom:12px">${icon('hint', 18)}
            <div><b>Opción gratis sin configurar nada:</b> pulsa <i>Descargar vista 3D + Copiar prompt</i> y pégalo directamente en Gemini o ChatGPT.<br>
            <b>Opción automática aquí mismo:</b> pega tu API Key gratuita de <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio (Gemini)</a> y genera el render directamente.</div>
          </div>
          <div class="r3d-actions" style="margin-bottom:14px">
            <button class="btn primary" id="aiCopyPack">${icon('copy', 15)} Descargar vista 3D + Copiar prompt</button>
          </div>
          <div class="ai-key-box">
            <label class="field" style="flex:1"><span>API Key de Google Gemini (opcional, solo se guarda en tu navegador)</span><input type="password" id="aiKey" value="${esc(localStorage.getItem(GEM_KEY) || '')}" placeholder="AIza…"></label>
            <button class="btn" id="aiGenBtn">${icon('image', 15)} Generar render aquí</button>
          </div>
          <div id="aiResult" class="ai-result"></div>
        </div>`}`,
      foot: `<button class="btn" data-modal-close>Cerrar</button>`,
      onOpen(card) {
        const canvas = $('#r3dCanvas', card);
        const draw = () => render3DCanvas(canvas, state3d);
        draw();

        // Barra de edición 3D (solo activa en el modo "Editar 3D")
        const editBar = $('#r3dEditBar', card);
        const renderEdit3dBar = () => {
          if (!editable || !editBar) return;
          const el = state3d.sel3dId ? byId(state3d.sel3dId) : null;
          if (!el) {
            editBar.innerHTML = `<span class="muted small">Toca cualquier mueble o módulo en el 3D para seleccionarlo y editar su posición, altura Z, medidas o color.</span>`;
            return;
          }
          const stf = furn3DStyle(el.kind);
          editBar.innerHTML = `<div class="r3de-head"><b>${esc(el.name || 'Mueble')}</b>${el.locked ? `<span class="muted small">${icon('lock', 12)} Bloqueado</span>` : ''}
              <div class="r3de-presets">
                <button class="chip" data-e3z="0">Suelo (0)</button>
                <button class="chip" data-e3z="90">Encimera (90)</button>
                <button class="chip" data-e3z="145">Colgado (145)</button>
                <button class="chip" data-e3rot="1">${icon('rotate', 12)} 90°</button>
                ${!el.locked ? `<button class="chip danger-txt" data-e3del="1">${icon('trash', 12)} Borrar</button>` : ''}
              </div>
            </div>
            <div class="r3de-grid">
              <label class="pf"><span>X (cm)</span><input type="number" step="5" data-e3f="x" value="${Math.round(el.x)}"></label>
              <label class="pf"><span>Y (cm)</span><input type="number" step="5" data-e3f="y" value="${Math.round(el.y)}"></label>
              <label class="pf"><span>Altura Z</span><input type="number" step="5" data-e3f="z0" value="${Math.round(el.z0 ?? stf.z0 ?? 0)}"></label>
              <label class="pf"><span>Ancho</span><input type="number" step="5" data-e3f="w" value="${Math.round(el.w)}"></label>
              <label class="pf"><span>Fondo</span><input type="number" step="5" data-e3f="h" value="${Math.round(el.h)}"></label>
              <label class="pf"><span>Alto 3D</span><input type="number" step="5" data-e3f="h3d" value="${Math.round(el.h3d || stf.h)}"></label>
              <label class="pf"><span>Color</span><input type="color" data-e3f="frontColor" value="${el.frontColor || stf.c || '#f1ede6'}"></label>
            </div>`;
        };
        if (editable && editBar) {
          renderEdit3dBar();
          editBar.addEventListener('input', (e) => {
            const k = e.target.dataset.e3f; if (!k || !state3d.sel3dId) return;
            const el = byId(state3d.sel3dId); if (!el || el.locked) return;
            el[k] = k === 'frontColor' ? e.target.value : num(e.target.value, el[k] || 0);
            Store.save(); draw(); requestRender();
          });
          editBar.addEventListener('click', (e) => {
            const el = state3d.sel3dId ? byId(state3d.sel3dId) : null; if (!el || el.locked) return;
            const zb = e.target.closest('[data-e3z]');
            if (zb) { el.z0 = +zb.dataset.e3z; Store.save(); renderEdit3dBar(); draw(); requestRender(); return; }
            if (e.target.closest('[data-e3rot]')) { el.angle = ((el.angle || 0) + 90) % 360; Store.save(); draw(); requestRender(); return; }
            if (e.target.closest('[data-e3del]')) {
              pushUndo();
              plan().elements = els().filter((x) => x.id !== el.id);
              state3d.sel3dId = null;
              Store.save(); renderEdit3dBar(); draw(); requestRender();
              toast('Elemento eliminado', 'info');
            }
          });
        }

        // Cambio entre Primera persona y Maqueta 3D (Órbita)
        const dpad = $('#r3dDpad', card);
        const fpJump = $('#r3dFpJumpWrap', card);
        const orbitCtrls = $('#r3dOrbitCtrls', card);
        const hintEl = $('#r3dHint', card);
        const syncCamUI = () => {
          const isFP = state3d.camMode === 'fp';
          dpad.style.display = isFP ? 'grid' : 'none';
          fpJump.style.display = isFP ? 'flex' : 'none';
          orbitCtrls.style.display = isFP ? 'none' : '';
          hintEl.textContent = isFP
            ? (editable ? 'Toca un mueble para editarlo · Arrastra para mirar · Flechas o WASD para caminar' : 'Arrastra para mirar alrededor · Usa las flechas o WASD para caminar')
            : (editable ? 'Toca un mueble para editarlo · Arrastra para rotar 360° e inclinar' : 'Arrastra para rotar 360° e inclinar · Solo visualización');
          draw();
        };
        $('#r3dCamSeg', card).addEventListener('click', (e) => {
          const b = e.target.closest('[data-cam]'); if (!b) return;
          $$('#r3dCamSeg button', card).forEach((x) => x.classList.toggle('active', x === b));
          state3d.camMode = b.dataset.cam;
          syncCamUI();
        });
        const fpRoomSel = $('#r3dFpRoom', card);
        if (fpRoomSel) fpRoomSel.addEventListener('change', (e) => {
          const r = roomsList[+e.target.value];
          if (r) { const c = centroid(r.points); state3d.fpX = c.x; state3d.fpY = c.y; draw(); }
        });
        $('#r3dEyeZ', card).addEventListener('input', (e) => {
          state3d.eyeZ = +e.target.value;
          $('#r3dEyeLbl', card).textContent = `${state3d.eyeZ} cm`;
          draw();
        });

        // Desplazamiento fluido en 1ª persona (mantener pulsado en iPad/táctil o teclas WASD / flechas)
        const moveStep = (dir, speed = 14) => {
          const yr = (state3d.fpYaw * Math.PI) / 180;
          const fx = Math.cos(yr), fy = Math.sin(yr), rx = -fy, ry = fx;
          const ox = state3d.fpX, oy = state3d.fpY;
          let nx = ox, ny = oy;
          if (dir === 'fwd') { nx += fx * speed; ny += fy * speed; }
          else if (dir === 'back') { nx -= fx * speed; ny -= fy * speed; }
          else if (dir === 'right') { nx += rx * speed; ny += ry * speed; }
          else if (dir === 'left') { nx -= rx * speed; ny -= ry * speed; }
          const safe = resolveWalkCollision(nx, ny, ox, oy);
          state3d.fpX = safe.x; state3d.fpY = safe.y;
          draw();
        };
        let holdDir = null, holdRaf = 0;
        const holdLoop = () => {
          if (!holdDir || !card.isConnected) { holdRaf = 0; return; }
          moveStep(holdDir, 8);
          holdRaf = requestAnimationFrame(holdLoop);
        };
        dpad.addEventListener('pointerdown', (e) => {
          const b = e.target.closest('[data-move]'); if (!b) return;
          e.preventDefault();
          holdDir = b.dataset.move;
          if (!holdRaf) holdLoop();
        });
        const stopHold = () => { holdDir = null; };
        window.addEventListener('pointerup', stopHold);
        window.addEventListener('pointercancel', stopHold);
        const onKeyWalk = (e) => {
          if (!card.isConnected) { window.removeEventListener('keydown', onKeyWalk); window.removeEventListener('pointerup', stopHold); window.removeEventListener('pointercancel', stopHold); return; }
          if (state3d.camMode !== 'fp' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
          const k = e.key.toLowerCase();
          if (k === 'w' || k === 'arrowup') { e.preventDefault(); moveStep('fwd', 22); }
          else if (k === 's' || k === 'arrowdown') { e.preventDefault(); moveStep('back', 22); }
          else if (k === 'a' || k === 'arrowleft') { e.preventDefault(); moveStep('left', 22); }
          else if (k === 'd' || k === 'arrowright') { e.preventDefault(); moveStep('right', 22); }
        };
        window.addEventListener('keydown', onKeyWalk);

        // Rotación táctil / ratón (+ toque para seleccionar mueble solo en modo Editar 3D)
        let dragging = false, lx = 0, ly = 0, moved = false;
        canvas.addEventListener('pointerdown', (e) => { dragging = true; moved = false; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
        canvas.addEventListener('pointermove', (e) => {
          if (!dragging) return;
          const dx = e.clientX - lx, dy = e.clientY - ly;
          if (Math.hypot(dx, dy) > 3) moved = true;
          if (state3d.camMode === 'fp') {
            state3d.fpYaw -= dx * 0.35;
            state3d.fpPitch = clamp(state3d.fpPitch - dy * 0.25, -45, 45);
          } else {
            state3d.yaw += dx * 0.55;
            state3d.pitch = clamp(state3d.pitch + dy * 0.4, 15, 85);
          }
          lx = e.clientX; ly = e.clientY; draw();
        });
        canvas.addEventListener('pointerup', (e) => {
          dragging = false;
          if (!moved && editable && state3d._hitList) {
            const rect = canvas.getBoundingClientRect();
            const cx = (e.clientX - rect.left) * (canvas.width / rect.width);
            const cy = (e.clientY - rect.top) * (canvas.height / rect.height);
            let best = null, bd = Infinity;
            state3d._hitList.forEach((h) => {
              const d = Math.hypot(cx - h.x, cy - h.y);
              if (d < h.r && d < bd) { bd = d; best = h; }
            });
            state3d.sel3dId = best ? best.id : null;
            renderEdit3dBar(); draw();
          }
        });
        canvas.addEventListener('pointercancel', () => { dragging = false; });

        $('#r3dCut', card).addEventListener('input', (e) => { state3d.wallCut = num(e.target.value, 0.78); draw(); });
        $('#r3dZoom', card).addEventListener('input', (e) => { state3d.zoom = num(e.target.value, 1); draw(); });
        $('#r3dHideDemo', card).addEventListener('change', (e) => { state3d.hideDemo = e.target.checked; draw(); });
        $$('[data-3dl]', card).forEach((chk) => chk.addEventListener('change', () => {
          const k = chk.dataset['3dl'];
          state3d[k] = chk.checked;
          pui.layers3d = Object.assign(getSaved3DLayers(), { [k]: chk.checked });
          savePui();
          draw();
        }));
        // Animaciones suaves para puertas, garaje, ventanas, persianas y cocina
        const animateProp = (key, target) => {
          const startVal = state3d[key] || 0, t0 = performance.now(), dur = 420;
          const step = (now) => {
            const u = clamp((now - t0) / dur, 0, 1);
            const ease = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
            state3d[key] = startVal + (target - startVal) * ease;
            draw();
            if (u < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        };
        $$('[data-anim]', card).forEach((btn) => btn.addEventListener('click', () => {
          const k = btn.dataset.anim;
          const next = (state3d[k] || 0) < 0.5 ? 1 : 0;
          btn.classList.toggle('on', next === 1);
          animateProp(k, next);
        }));
        $('#r3dNightBtn', card).addEventListener('click', (e) => {
          state3d.nightMode = !state3d.nightMode;
          e.currentTarget.classList.toggle('on', state3d.nightMode);
          draw();
        });
        $('#r3dOpenCge', card).addEventListener('click', () => { Modal.close(); Obra.openTab('electric'); });
        $('#r3dReset', card).addEventListener('click', () => {
          Object.assign(state3d, { yaw: -35, pitch: 42, zoom: 1, wallCut: 0.78, fpX: startPt.x, fpY: startPt.y, fpYaw: 0, fpPitch: -3, eyeZ: 165 });
          $('#r3dCut', card).value = 0.78; $('#r3dZoom', card).value = 1; $('#r3dEyeZ', card).value = 165; $('#r3dEyeLbl', card).textContent = '165 cm';
          draw();
        });
        if (!editable) {
          $('#r3dDownload', card).addEventListener('click', () => {
            canvas.toBlob((blob) => { download(`render-3d-${plan().name.replace(/\s+/g, '_')}.png`, blob); toast('Render 3D descargado', 'success'); }, 'image/png');
          });
          $('#r3dSaveDiary', card).addEventListener('click', () => {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            S().diary.unshift({ id: uid(), date: localISO(), phase: 'Render 3D', zone: plan().name, title: `Render 3D · ${plan().name}`, notes: 'Captura 3D generada desde el editor de planos.', photo: dataUrl, created: Date.now() });
            Store.save(); toast('Guardada en Obra → Diario y fotos', 'success');
          });
          $('#r3dPdf', card).addEventListener('click', () => { Modal.close(); openReportModal(); });
        }
        if (editable) return;

        // Tabs 3D / IA
        const refreshPrompt = () => {
          const v = $('#aiView', card).value;
          $('#aiRoomWrap', card).style.display = v === 'interior' ? '' : 'none';
          $('#aiPrompt', card).value = buildRenderPrompt($('#aiStyle', card).value, v, $('#aiRoom', card).value);
        };
        refreshPrompt();
        $('#aiStyle', card).addEventListener('change', refreshPrompt);
        $('#aiView', card).addEventListener('change', refreshPrompt);
        $('#aiRoom', card).addEventListener('change', refreshPrompt);

        $('#r3dSeg', card).addEventListener('click', (e) => {
          const b = e.target.closest('button[data-rt]'); if (!b) return;
          $$('#r3dSeg button', card).forEach((x) => x.classList.toggle('active', x === b));
          $('#r3dPane', card).style.display = b.dataset.rt === 'v3d' ? '' : 'none';
          $('#rAiPane', card).style.display = b.dataset.rt === 'ai' ? '' : 'none';
        });

        $('#aiCopyPack', card).addEventListener('click', async () => {
          draw();
          canvas.toBlob((blob) => download(`plano-3d-${plan().name.replace(/\s+/g, '_')}.png`, blob), 'image/png');
          try { await navigator.clipboard.writeText($('#aiPrompt', card).value); toast('Vista 3D descargada y prompt copiado al portapapeles', 'success'); }
          catch (err) { toast('Vista 3D descargada (copia el prompt del cuadro de texto)', 'info'); }
        });

        $('#aiKey', card).addEventListener('input', (e) => localStorage.setItem(GEM_KEY, e.target.value.trim()));
        $('#aiGenBtn', card).addEventListener('click', async () => {
          const key = ($('#aiKey', card).value || '').trim();
          if (!key) { toast('Introduce primero tu API Key de Google Gemini (o usa el botón de copiar prompt)', 'warn'); return; }
          const btn = $('#aiGenBtn', card), resBox = $('#aiResult', card);
          btn.disabled = true;
          resBox.innerHTML = `<div class="muted small" style="padding:14px 0">Generando render fotorrealista con Gemini… (puede tardar 10–20 segundos)</div>`;
          try {
            draw();
            const b64 = canvas.toDataURL('image/png').split(',')[1];
            const promptTxt = $('#aiPrompt', card).value;
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${encodeURIComponent(key)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptTxt }, { inlineData: { mimeType: 'image/png', data: b64 } }] }],
                generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
              }),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error?.message || `HTTP ${resp.status}`);
            const imgPart = (data.candidates?.[0]?.content?.parts || []).find((pt) => pt.inlineData?.data);
            if (!imgPart) throw new Error('El modelo no devolvió imagen. Prueba a usar el botón de descargar vista 3D + copiar prompt.');
            const src = `data:${imgPart.inlineData.mimeType || 'image/png'};base64,${imgPart.inlineData.data}`;
            resBox.innerHTML = `<img src="${src}" alt="Render IA" style="width:100%;border-radius:12px;margin-top:10px;display:block">
              <div class="r3d-actions" style="margin-top:10px">
                <a class="btn sm primary" href="${src}" download="render-ia-${esc(plan().name)}.png">${icon('download', 14)} Descargar render</a>
                <button class="btn sm" id="aiSaveDiary">${icon('camera', 14)} Guardar en Diario de Obra</button>
              </div>`;
            $('#aiSaveDiary', card).addEventListener('click', () => {
              S().diary.unshift({ id: uid(), date: localISO(), phase: 'Render IA', zone: plan().name, title: `Render IA · ${plan().name}`, notes: promptTxt, photo: src, created: Date.now() });
              Store.save(); toast('Render guardado en Obra → Diario y fotos', 'success');
            });
          } catch (err) {
            resBox.innerHTML = `<div class="danger-txt small" style="padding:10px 0">No se pudo generar el render: ${esc(err.message)}</div>`;
          } finally { btn.disabled = false; }
        });
      },
    });
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

  /* ---------- Memoria Técnica / Informe de Planos en PDF ---------- */
  function buildPlanSVGForReport(p, layerPreset, autoDims = true) {
    const list = p.elements || [], b = bbox(list);
    const th = THEMES.paper;
    if (!b) return `<div style="padding:40px;text-align:center;color:#64748b">Plano sin elementos</div>`;
    const bw = Math.max(b.x2 - b.x1, 100), bh = Math.max(b.y2 - b.y1, 100);
    const s = clamp(1200 / Math.max(bw, bh), 0.35, 4);
    const pad = 45, W = Math.ceil(bw * s + pad * 2), H = Math.ceil(bh * s + pad * 2);
    const L = Object.assign({}, DEF_LAYERS, layerPreset || {});
    const inner = renderElements(list, s, th, L, autoDims).replace(/ data-id="[^"]*"/g, '');
    const cands = [50, 100, 200, 500, 1000], sbl = cands.find((c) => c * s >= 100) || 500;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;height:100%;max-height:100%;display:block" font-family="Inter, Segoe UI, Arial, sans-serif">
      <rect width="${W}" height="${H}" fill="#ffffff"/>
      <g transform="translate(${pad - b.x1 * s} ${pad - b.y1 * s}) scale(${s})">${inner}</g>
      <g transform="translate(${W - pad - sbl * s} ${H - 24})"><rect width="${sbl * s}" height="6" fill="#1e293b"/><rect width="${(sbl * s) / 2}" height="6" fill="#fff" stroke="#1e293b"/><text x="${(sbl * s) / 2}" y="18" font-size="11" font-weight="700" text-anchor="middle" fill="#1e293b">Escala: ${sbl / 100} m</text></g>
    </svg>`;
  }

  function buildLegendForPlan(p, layers) {
    const items = [];
    const list = p.elements || [];
    if (layers.walls) {
      if (list.some((e) => e.type === 'wall' && (!e.status || e.status === 'existente'))) items.push(['#555c68', 'Muro existente']);
      if (list.some((e) => e.type === 'wall' && e.status === 'nuevo')) items.push(['#e8590c', 'Muro nuevo']);
      if (list.some((e) => e.type === 'wall' && e.status === 'demoler')) items.push(['#d4a000', 'Muro a demoler']);
    }
    const usedDucts = new Set(list.filter((e) => e.type === 'duct' && layerOn(e, layers)).map((e) => e.kind));
    usedDucts.forEach((k) => { const dk = DUCT_KINDS[k]; if (dk) items.push([dk.color, dk.label]); });
    const usedSyms = new Set(list.filter((e) => e.type === 'sym' && layerOn(e, layers)).map((e) => e.kind));
    usedSyms.forEach((k) => { const d = SYMBOLS[k]; if (d) items.push([SYM_GROUPS[d.group].color, `${d.g || '•'} · ${d.label}`]); });
    if (!items.length) return '';
    return `<div class="rep-legend">${items.map(([c, l]) => `<span><i style="background:${c}"></i>${esc(l)}</span>`).join('')}</div>`;
  }

  function openReportModal() {
    const plans = S().plans || [];
    Modal.open({
      title: 'Generar Memoria Técnica de Planos (PDF)',
      wide: true,
      body: `<div class="callout" style="margin-bottom:14px">${icon('file', 18)}
          <div>Genera un documento técnico multipágina listo para imprimir o guardar como <b>PDF</b> con portada, planos 2D acotados, vistas 3D, planos de instalaciones, leyendas y cuadro de mediciones.</div>
        </div>
        <div class="grid2" style="margin-bottom:14px">
          <label class="field"><span>Formato de página</span><select id="repSize">
            <option value="A4 landscape">A4 Horizontal (recomendado para planos)</option>
            <option value="A4 portrait">A4 Vertical (formato memoria)</option>
            <option value="A3 landscape">A3 Horizontal (plano grande)</option>
          </select></label>
          <label class="field"><span>Título de la memoria</span><input id="repTitle" value="${esc('Memoria Técnica · ' + (S().project.name || 'Mi Reforma'))}"></label>
        </div>
        <div class="rep-sec">
          <b>Planos a incluir</b>
          <div class="rep-chks">${plans.map((p) => `<label class="chk"><input type="checkbox" data-rp="${p.id}" checked> ${esc((p.level ? p.level + ' · ' : '') + p.name)} <small class="muted">(${p.scope === 'exterior' ? 'Exterior' : 'Interior'})</small></label>`).join('')}</div>
        </div>
        <div class="rep-sec">
          <b>Láminas por cada plano</b>
          <div class="rep-chks">
            <label class="chk"><input type="checkbox" id="rv2d" checked> Plano 2D acotado (Distribución y mobiliario)</label>
            <label class="chk"><input type="checkbox" id="rv3d" checked> Vista 3D isométrica (con escaleras y huecos)</label>
            <label class="chk"><input type="checkbox" id="rvClima" checked> Plano de Aire Acondicionado y conductos (si tiene elementos)</label>
            <label class="chk"><input type="checkbox" id="rvElec" checked> Plano de Iluminación y Electricidad (si tiene elementos)</label>
            <label class="chk"><input type="checkbox" id="rvFonta" checked> Plano de Fontanería y Agua (si tiene elementos)</label>
            <label class="chk"><input type="checkbox" id="rvDomo" checked> Plano de Domótica y Control (si tiene elementos)</label>
          </div>
        </div>
        <div class="rep-sec">
          <b>Detalles y anexos técnicos</b>
          <div class="rep-chks">
            <label class="chk"><input type="checkbox" id="raCover" checked> Portada e índice de planos</label>
            <label class="chk"><input type="checkbox" id="raLegend" checked> Leyenda técnica en cada plano</label>
            <label class="chk"><input type="checkbox" id="raMeasures" checked> Cuadro de superficies, mediciones (+10% merma) e instalaciones</label>
            <label class="chk"><input type="checkbox" id="raNotes" checked> Anotaciones y pines en la vista 3D</label>
          </div>
        </div>`,
      foot: `<button class="btn" data-modal-close>Cancelar</button><button class="btn primary" id="repGenBtn">${icon('download', 16)} Generar PDF / Imprimir</button>`,
      onOpen(card) {
        $('#repGenBtn', card).addEventListener('click', () => {
          const selIds = $$('[data-rp]:checked', card).map((c) => c.dataset.rp);
          if (!selIds.length) { toast('Selecciona al menos un plano', 'warn'); return; }
          const opts = {
            pageSize: $('#repSize', card).value,
            title: $('#repTitle', card).value.trim() || 'Memoria Técnica',
            planIds: selIds,
            v2d: $('#rv2d', card).checked,
            v3d: $('#rv3d', card).checked,
            vClima: $('#rvClima', card).checked,
            vElec: $('#rvElec', card).checked,
            vFonta: $('#rvFonta', card).checked,
            vDomo: $('#rvDomo', card).checked,
            cover: $('#raCover', card).checked,
            legend: $('#raLegend', card).checked,
            measures: $('#raMeasures', card).checked,
            notes3d: $('#raNotes', card).checked,
          };
          Modal.close();
          generateTechnicalReport(opts);
        });
      },
    });
  }

  function generateTechnicalReport(opts) {
    const P = S().project;
    const selPlans = S().plans.filter((p) => opts.planIds.includes(p.id));
    const sheets = [];
    const hasGroup = (p, g) => p.elements.some((e) => (e.type === 'sym' && (SYMBOLS[e.kind] || {}).group === g) || (e.type === 'duct' && (DUCT_KINDS[e.kind] || {}).group === g));

    selPlans.forEach((p) => {
      const st = stats(p);
      if (opts.v2d) {
        const layers = Object.assign({}, DEF_LAYERS, VIEW_PRESETS.distribucion.layers);
        sheets.push({ plan: p, st, spec: 'Distribución y mobiliario (2D acotado)', content: buildPlanSVGForReport(p, layers, true), legend: opts.legend ? buildLegendForPlan(p, layers) : '' });
      }
      if (opts.v3d) {
        const c = document.createElement('canvas'); c.width = 1400; c.height = 820;
        const savedL = getSaved3DLayers();
        render3DCanvas(c, Object.assign({ yaw: -35, pitch: 42, zoom: 1, wallCut: 0.78, hideDemo: true }, savedL, { showLegend: opts.legend, showNotes: opts.notes3d }), p);
        sheets.push({ plan: p, st, spec: 'Perspectiva 3D isométrica', content: `<img src="${c.toDataURL('image/png')}" style="width:100%;height:100%;object-fit:contain;display:block">`, legend: '' });
      }
      const specs = [
        [opts.vClima, 'clima', 'Aire Acondicionado y Conductos'],
        [opts.vElec, 'elec', 'Iluminación y Electricidad'],
        [opts.vFonta, 'fonta', 'Fontanería y Agua'],
        [opts.vDomo, 'domo', 'Domótica y Control'],
      ];
      specs.forEach(([on, key, label]) => {
        if (!on || !hasGroup(p, key)) return;
        const layers = Object.assign({}, DEF_LAYERS, VIEW_PRESETS[key].layers);
        sheets.push({ plan: p, st, spec: label, content: buildPlanSVGForReport(p, layers, true), legend: opts.legend ? buildLegendForPlan(p, layers) : '' });
      });
    });

    const totalArea = selPlans.reduce((a, p) => a + stats(p).area, 0);
    const todayStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    const coverHTML = opts.cover ? `<section class="page cover">
      <div class="cov-bar"></div>
      <div class="cov-top"><span>MEMORIA TÉCNICA Y PLANOS DE REFORMA</span><span>${todayStr}</span></div>
      <h1>${esc(opts.title)}</h1>
      <p class="cov-sub">${esc(P.address || 'Documentación gráfica y cuadro de mediciones')}</p>
      <div class="cov-kpis">
        <div><span>Superficie útil total</span><b>${fmtNum(totalArea)} m²</b></div>
        <div><span>Planos incluidos</span><b>${selPlans.length}</b></div>
        <div><span>Total láminas</span><b>${sheets.length}</b></div>
        <div><span>Presupuesto</span><b>${P.budget ? fmtMoney(P.budget) : '—'}</b></div>
      </div>
      <h3>Índice de láminas</h3>
      <table class="rep-tbl"><thead><tr><th>Nº</th><th>Planta / Plano</th><th>Tipo</th><th>Especialidad</th><th class="num">Sup. útil</th></tr></thead><tbody>
        ${sheets.map((sh, i) => `<tr><td><b>${String(i + 1).padStart(2, '0')}</b></td><td>${esc((sh.plan.level ? sh.plan.level + ' · ' : '') + sh.plan.name)}</td><td>${sh.plan.scope === 'exterior' ? 'Exterior' : 'Interior'}</td><td>${esc(sh.spec)}</td><td class="num">${fmtNum(sh.st.area)} m²</td></tr>`).join('')}
      </tbody></table>
    </section>` : '';

    const sheetsHTML = sheets.map((sh, i) => `<section class="page sheet">
      <div class="sheet-body">${sh.content}</div>
      ${sh.legend}
      <footer class="cajetin">
        <div><span>PROYECTO</span><b>${esc(P.name || 'Mi Reforma')}</b></div>
        <div><span>PLANO / PLANTA</span><b>${esc((sh.plan.level ? sh.plan.level + ' · ' : '') + sh.plan.name)}</b></div>
        <div><span>ESPECIALIDAD</span><b>${esc(sh.spec)}</b></div>
        <div><span>SUPERFICIE</span><b>${fmtNum(sh.st.area)} m²</b></div>
        <div><span>FECHA</span><b>${new Date().toLocaleDateString('es-ES')}</b></div>
        <div class="num-box"><span>LÁMINA</span><b>${String(i + 1).padStart(2, '0')} / ${String(sheets.length).padStart(2, '0')}</b></div>
      </footer>
    </section>`).join('');

    const measuresHTML = opts.measures ? `<section class="page measures">
      <h2>Anexo · Cuadro de superficies, mediciones e instalaciones</h2>
      ${selPlans.map((p) => {
        const st = stats(p);
        const ducts = {};
        p.elements.filter((e) => e.type === 'duct').forEach((d) => { const k = d.kind || 'impulsion'; ducts[k] = (ducts[k] || 0) + wlen(d) / 100; });
        return `<div class="mblock">
          <h3>${esc((p.level ? p.level + ' · ' : '') + p.name)} <small>(${p.scope === 'exterior' ? 'Exterior' : 'Interior'} · ${fmtNum(st.area)} m²)</small></h3>
          ${st.rooms.length ? `<table class="rep-tbl"><thead><tr><th>Estancia</th><th class="num">Útil (m²)</th><th class="num">+10% merma</th><th class="num">Rodapié (m)</th><th class="num">Paredes (m²)</th><th>Acabado suelo</th></tr></thead><tbody>
            ${st.rooms.map((r) => `<tr><td><b>${esc(r.name)}</b></td><td class="num">${fmtNum(r.area)}</td><td class="num">${fmtNum(r.area * 1.1)}</td><td class="num">${fmtNum(r.perim)}</td><td class="num">${fmtNum(r.perim * (r.ceiling / 100))}</td><td>${esc(r.floor || '—')}</td></tr>`).join('')}
          </tbody></table>` : ''}
          <div class="m-mini">
            <div><b>Muros:</b> ${Object.entries(st.walls).map(([k, v]) => `${WALL_STATUS[k] || k}: ${fmtNum(v.len)} m (${fmtNum(v.area)} m²)`).join(' · ') || '—'}</div>
            <div><b>Carpintería:</b> ${st.doors} puertas · ${st.windows} ventanas · ${st.furn} muebles/elementos</div>
            ${Object.keys(st.syms).length ? `<div><b>Instalaciones:</b> ${Object.entries(st.syms).map(([k, n]) => `${(SYMBOLS[k] || { label: k }).label}: ${n}`).join(' · ')}</div>` : ''}
            ${Object.keys(ducts).length ? `<div><b>Conductos / Tuberías:</b> ${Object.entries(ducts).map(([k, m]) => `${(DUCT_KINDS[k] || { label: k }).label}: ${fmtNum(m)} m`).join(' · ')}</div>` : ''}
          </div>
        </div>`;
      }).join('')}
    </section>` : '';

    const docHTML = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(opts.title)}</title>
      <style>
        @page { size: ${opts.pageSize}; margin: 10mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Inter, Segoe UI, Arial, sans-serif; color: #0f172a; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .page { page-break-after: always; break-after: page; display: flex; flex-direction: column; min-height: 94vh; }
        .page:last-child { page-break-after: auto; break-after: auto; }
        .cover { padding: 14mm 10mm; }
        .cov-bar { height: 6px; width: 90px; background: #f97316; border-radius: 3px; margin-bottom: 18px; }
        .cov-top { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; letter-spacing: .08em; color: #64748b; margin-bottom: 10px; }
        .cover h1 { font-size: 32px; margin: 0 0 8px; letter-spacing: -.02em; }
        .cov-sub { font-size: 15px; color: #475569; margin: 0 0 24px; }
        .cov-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .cov-kpis div { padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; }
        .cov-kpis span { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; }
        .cov-kpis b { font-size: 18px; }
        .sheet { border: 1.5px solid #1e293b; padding: 6mm; height: 95vh; }
        .sheet-body { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .rep-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; padding: 6px 8px; border-top: 1px solid #cbd5e1; font-size: 10.5px; color: #334155; }
        .rep-legend span { display: inline-flex; align-items: center; gap: 5px; }
        .rep-legend i { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
        .cajetin { display: grid; grid-template-columns: 1.3fr 1.5fr 1.4fr .8fr .8fr .7fr; border: 1.5px solid #1e293b; margin-top: 4px; background: #f8fafc; }
        .cajetin div { padding: 5px 8px; border-right: 1px solid #cbd5e1; }
        .cajetin div:last-child { border-right: 0; }
        .cajetin span { display: block; font-size: 8.5px; font-weight: 700; color: #64748b; letter-spacing: .04em; }
        .cajetin b { font-size: 11px; }
        .cajetin .num-box { background: #0f172a; color: #fff; text-align: center; }
        .cajetin .num-box span { color: #94a3b8; }
        .measures { padding: 4mm 2mm; }
        .measures h2 { margin: 0 0 12px; font-size: 18px; border-bottom: 2px solid #f97316; padding-bottom: 6px; }
        .mblock { margin-bottom: 16px; break-inside: avoid; }
        .mblock h3 { margin: 0 0 6px; font-size: 14px; }
        .mblock h3 small { color: #64748b; font-weight: 500; }
        .rep-tbl { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 8px; }
        .rep-tbl th, .rep-tbl td { padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left; }
        .rep-tbl th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; color: #475569; }
        .rep-tbl .num { text-align: right; font-variant-numeric: tabular-nums; }
        .m-mini { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #334155; padding: 8px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
        .noprint { position: fixed; top: 10px; right: 10px; z-index: 99; display: flex; gap: 8px; }
        .noprint button { padding: 8px 14px; border-radius: 8px; border: 0; background: #f97316; color: #fff; font-weight: 700; cursor: pointer; }
        @media print { .noprint { display: none !important; } }
      </style></head><body>
      <div class="noprint"><button onclick="window.print()">Guardar PDF / Imprimir</button></div>
      ${coverHTML}${sheetsHTML}${measuresHTML}
      <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 350); };<\/script>
      </body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.open(); win.document.write(docHTML); win.document.close();
    } else {
      // Fallback si el navegador móvil bloquea popups: descarga como HTML imprimible
      download(`memoria-tecnica-${localISO()}.html`, docHTML, 'text/html;charset=utf-8');
      toast('Popup bloqueado: se descargó el informe HTML (ábrelo e imprime como PDF)', 'info');
    }
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

  function pointInPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi)) inside = !inside;
    }
    return inside;
  }

  function planAudit(p) {
    const list = p.elements || [], warns = [];
    const rooms = list.filter((e) => e.type === 'room' && e.points.length >= 3);
    const lights = list.filter((e) => (e.type === 'sym' && ['luz', 'foco', 'tiraLed', 'aplique'].includes(e.kind)) || (e.type === 'furn' && e.kind === 'espejoLed'));
    const drains = list.filter((e) => (e.type === 'sym' && ['desague', 'bajanteFecal', 'arqueta'].includes(e.kind)) || (e.type === 'furn' && e.kind === 'bajante') || (e.type === 'duct' && e.kind === 'desague'));
    if (lights.length > 0) {
      rooms.forEach((r) => {
        if (!lights.some((l) => pointInPoly(l.x, l.y, r.points))) warns.push(`«${r.name || 'Estancia'}» no tiene ningún punto de luz dentro`);
      });
    }
    rooms.forEach((r) => {
      const nm = (r.name || '').toLowerCase();
      if ((nm.includes('baño') || nm.includes('aseo') || nm.includes('cocina')) && drains.length > 0) {
        const hasDrain = drains.some((d) => d.type === 'duct' ? (pointInPoly(d.x1, d.y1, r.points) || pointInPoly(d.x2, d.y2, r.points)) : pointInPoly(d.x, d.y, r.points));
        if (!hasDrain) warns.push(`«${r.name}» aún no tiene desagüe, arqueta o bajante`);
      }
    });
    return warns.slice(0, 5);
  }

  function openCopyRefsModal() {
    const cur = plan();
    const others = S().plans.filter((p) => p.id !== cur.id);
    if (!others.length) { toast('Crea primero otra planta para copiar sus referencias verticales', 'info'); return; }
    Modal.open({
      title: `Copiar pilares, bajantes y escaleras a «${esc(cur.name)}»`,
      body: `<p class="muted" style="margin-top:0">Proyecta en las <b>mismas coordenadas X, Y</b> los elementos verticales de otra planta (pilares, bajantes, montantes, arquetas y hueco de escalera) bloqueados para alinear plantas con precisión:</p>
        <label class="field" style="margin-bottom:12px"><span>Planta de origen</span>
          <select id="refSrcPlan">${others.map((p) => `<option value="${p.id}">${esc((p.level ? p.level + ' · ' : '') + p.name)}</option>`).join('')}</select>
        </label>
        <div style="display:flex;flex-direction:column;gap:8px">
          <label class="chk"><input type="checkbox" id="refCopyRisers" checked> Bajantes, montantes verticales y arquetas</label>
          <label class="chk"><input type="checkbox" id="refCopyStruct" checked> Pilares y escaleras</label>
          <label class="chk"><input type="checkbox" id="refCopyPerim"> Muros perimetrales (como referencia bloqueada)</label>
        </div>`,
      foot: `<button class="btn" data-modal-close>Cancelar</button><button class="btn primary" id="refDoCopy">${icon('copy', 15)} Proyectar en esta planta</button>`,
      onOpen(card) {
        $('#refDoCopy', card).addEventListener('click', () => {
          const src = S().plans.find((p) => p.id === $('#refSrcPlan', card).value);
          if (!src) return;
          const cRisers = $('#refCopyRisers', card).checked;
          const cStruct = $('#refCopyStruct', card).checked;
          const cWalls = $('#refCopyPerim', card).checked;
          const toCopy = src.elements.filter((e) => {
            if (cRisers && e.type === 'sym' && (SYMBOLS[e.kind]?.riser || SYMBOLS[e.kind]?.manhole)) return true;
            if (cRisers && e.type === 'furn' && e.kind === 'bajante') return true;
            if (cStruct && e.type === 'furn' && (e.kind === 'pilar' || e.kind === 'escalera')) return true;
            if (cWalls && e.type === 'wall' && e.status !== 'demoler') return true;
            return false;
          });
          if (!toCopy.length) { toast('Esa planta aún no tiene pilares, bajantes ni elementos seleccionados', 'warn'); return; }
          pushUndo();
          toCopy.forEach((e) => {
            const c = clone(e);
            c.id = uid();
            c.locked = true;
            els().push(c);
          });
          commit();
          Modal.close();
          toast(`Proyectados ${toCopy.length} elementos verticales desde «${src.name}» (bloqueados)`, 'success');
        });
      },
    });
  }

  function installationsTakeoff() {
    const res = [];
    S().plans.forEach((p) => {
      const byDuct = {}, bySym = {};
      p.elements.forEach((e) => {
        if (e.type === 'duct') {
          const k = e.kind || 'impulsion';
          byDuct[k] = (byDuct[k] || 0) + wlen(e) / 100;
        } else if (e.type === 'sym') {
          bySym[e.kind] = (bySym[e.kind] || 0) + 1;
        }
      });
      Object.entries(byDuct).forEach(([k, m]) => {
        const dk = DUCT_KINDS[k] || { label: k };
        res.push({ planName: p.name, name: `${dk.label} (${p.name})`, zone: p.name, qty: r1(m * 1.1), unit: 'm', notes: `Trazado en plano (${fmtNum(m, 1)} m + 10% merma)` });
      });
      Object.entries(bySym).forEach(([k, n]) => {
        const sd = SYMBOLS[k] || { label: k };
        res.push({ planName: p.name, name: `${sd.label} (${p.name})`, zone: p.name, qty: n, unit: 'ud', notes: 'Conteo automático desde el plano' });
      });
    });
    return res;
  }

  return { init, show, switchPlan, openReportModal, thumb, stats, roomNames, fmtLen, SYMBOLS, SYM_GROUPS, DUCT_KINDS, installationsTakeoff, refresh: () => { if (svg) { syncTop(); renderPanel(); requestRender(); } } };
})();
