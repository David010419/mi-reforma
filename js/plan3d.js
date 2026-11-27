'use strict';
/* =========================================================
   Motor 3D Arquitectónico WebGL (Three.js local con Z-Buffer real,
   sombras suaves optimizadas para iPad, texturas y raycasting)
   ========================================================= */

const Plan3D = (() => {
  let glRenderer = null;
  const texCache = new Map();
  const canvasStates = new WeakMap();
  const isTouchDevice = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

  function ensureRenderer(w, h) {
    if (!window.THREE) return null;
    if (!glRenderer) {
      glRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      glRenderer.shadowMap.enabled = true;
      glRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if ('outputColorSpace' in glRenderer && THREE.SRGBColorSpace) {
        glRenderer.outputColorSpace = THREE.SRGBColorSpace;
      }
      glRenderer.toneMapping = THREE.ACESFilmicToneMapping;
      glRenderer.toneMappingExposure = 1.05;
    }
    const maxDpr = isTouchDevice() ? 1.5 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const tw = Math.max(64, Math.round(w * dpr)), th = Math.max(64, Math.round(h * dpr));
    if (glRenderer.domElement.width !== tw || glRenderer.domElement.height !== th) {
      glRenderer.setSize(w, h, false);
      glRenderer.setPixelRatio(dpr);
    }
    return glRenderer;
  }

  /* ---------- Texturas procedurales cacheadas en GPU ---------- */
  function getProceduralTexture(kind, baseHex = '#ffffff', repX = 1, repY = 1) {
    const rkx = Math.max(0.25, Math.round(repX * 4) / 4);
    const rky = Math.max(0.25, Math.round(repY * 4) / 4);
    const key = `${kind || 'liso'}:${baseHex}:${rkx}:${rky}`;
    if (texCache.has(key)) return texCache.get(key);

    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = baseHex;
    g.fillRect(0, 0, 256, 256);

    if (kind === 'madera') {
      for (let y = 0; y < 256; y += 32) {
        g.fillStyle = (y / 32) % 2 ? 'rgba(120,68,25,0.08)' : 'rgba(255,255,255,0.05)';
        g.fillRect(0, y, 256, 31);
        g.strokeStyle = 'rgba(70,38,12,0.24)';
        g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke();
        const jx = ((y * 3.7) % 220) + 18;
        g.beginPath(); g.moveTo(jx, y); g.lineTo(jx, y + 32); g.stroke();
      }
      g.strokeStyle = 'rgba(95,52,18,0.09)';
      g.lineWidth = 1;
      for (let i = 0; i < 40; i++) {
        const yy = (i * 6.4) % 256;
        g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(85, yy + 3, 170, yy - 3, 256, yy + 1); g.stroke();
      }
    } else if (kind === 'azulejo') {
      g.strokeStyle = 'rgba(15,23,42,0.22)';
      g.lineWidth = 3;
      for (let p = 0; p <= 256; p += 64) {
        g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 256); g.stroke();
        g.beginPath(); g.moveTo(0, p); g.lineTo(256, p); g.stroke();
      }
      g.fillStyle = 'rgba(255,255,255,0.08)';
      for (let x = 2; x < 256; x += 64) for (let y = 2; y < 256; y += 64) g.fillRect(x, y, 58, 8);
    } else if (kind === 'metro') {
      g.strokeStyle = 'rgba(15,23,42,0.24)';
      g.lineWidth = 2.5;
      for (let row = 0; row < 8; row++) {
        const y = row * 32, off = (row % 2) * 32;
        g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke();
        for (let x = off; x < 256; x += 64) {
          g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke();
        }
      }
    } else if (kind === 'marmol') {
      g.strokeStyle = 'rgba(100,116,139,0.22)';
      for (let i = 0; i < 9; i++) {
        g.lineWidth = i % 3 === 0 ? 2.2 : 1;
        g.beginPath();
        g.moveTo((i * 37) % 256, 0);
        g.bezierCurveTo(60 + i * 15, 90, 190 - i * 12, 165, ((i * 37) + 90) % 256, 256);
        g.stroke();
      }
    } else if (kind === 'microcemento') {
      for (let i = 0; i < 70; i++) {
        g.fillStyle = i % 2 ? 'rgba(15,23,42,0.03)' : 'rgba(255,255,255,0.04)';
        g.beginPath(); g.arc((i * 73) % 256, (i * 41) % 256, 18 + (i % 16), 0, Math.PI * 2); g.fill();
      }
    } else if (kind === 'piedra') {
      g.strokeStyle = 'rgba(30,41,59,0.28)';
      g.lineWidth = 3;
      for (let row = 0; row < 6; row++) {
        const y = row * 42.6, off = (row % 2) * 44;
        g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke();
        for (let x = off; x < 256; x += 86) {
          g.fillStyle = ((x + row) % 3 === 0) ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
          g.fillRect(x + 2, y + 2, 82, 38);
          g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 42.6); g.stroke();
        }
      }
    } else if (kind === 'cesped') {
      g.fillStyle = '#4ade80';
      g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 320; i++) {
        g.strokeStyle = i % 2 ? 'rgba(21,128,61,0.45)' : 'rgba(134,239,172,0.45)';
        const x = (i * 53) % 256, y = (i * 97) % 256;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y - 6); g.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(rkx, rky);
    if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    texCache.set(key, tex);
    return tex;
  }

  function makeMat(hex, texKind = 'liso', opts = {}) {
    const roughness = opts.roughness ?? (texKind === 'marmol' || texKind === 'azulejo' || texKind === 'metro' ? 0.25 : texKind === 'madera' ? 0.55 : 0.72);
    const metalness = opts.metalness ?? 0.04;
    const hasTex = texKind && texKind !== 'liso' && typeof document !== 'undefined';
    const params = {
      color: hasTex ? 0xffffff : new THREE.Color(hex || '#e2e8f0'),
      roughness,
      metalness,
    };
    if (hasTex) {
      params.map = getProceduralTexture(texKind, hex || '#e2e8f0', (opts.repX || 120) / 120, (opts.repY || 120) / 120);
    }
    if (opts.transparent) {
      params.transparent = true;
      params.opacity = opts.opacity ?? 0.4;
      params.depthWrite = opts.depthWrite ?? false;
    }
    if (opts.polygonOffset) {
      params.polygonOffset = true;
      params.polygonOffsetFactor = opts.polygonOffsetFactor ?? 1;
      params.polygonOffsetUnits = opts.polygonOffsetUnits ?? 1;
    }
    if (opts.side) params.side = opts.side;
    return new THREE.MeshStandardMaterial(params);
  }

  function addMesh(parent, geom, mat, x, y, z, cast = true, receive = true, pickId = null, pickPrio = 1) {
    const m = new THREE.Mesh(geom, mat);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = receive;
    if (pickId) { m.userData.pickId = pickId; m.userData.pickPrio = pickPrio; }
    parent.add(m);
    return m;
  }

  function boxMesh(parent, w, h, d, mat, x, y, z, opts = {}) {
    if (w <= 0.1 || h <= 0.1 || d <= 0.1) return null;
    const geom = new THREE.BoxGeometry(w, h, d);
    return addMesh(parent, geom, mat, x, y, z, opts.cast ?? true, opts.receive ?? true, opts.pickId || null, opts.pickPrio || 1);
  }

  /* ---------- Construcción de Mobiliario Detallado en 3D ---------- */
  function buildFurniture3D(f, helpers, animTargets) {
    const { furn3DStyle, num } = helpers;
    const st = furn3DStyle(f.kind);
    const fH = f.h3d || st.h || 75;
    const fZ0 = f.z0 ?? st.z0 ?? 0;
    const W = Math.max(6, f.w || 60), D = Math.max(4, f.h || 60);
    const hw = W / 2, hd = D / 2;
    const mainHex = f.frontColor || st.c || '#e5e0d8';
    const tex = f.texture || 'liso';

    const root = new THREE.Group();
    root.position.set(f.x, fZ0, f.y);
    root.rotation.y = -((f.angle || 0) * Math.PI) / 180;
    root.userData.elId = f.id;

    const tagPick = (obj) => {
      obj.traverse((ch) => { if (ch.isMesh) { ch.userData.pickId = f.id; ch.userData.pickPrio = 1; } });
    };

    const matMain = makeMat(mainHex, tex, { repX: W, repY: fH });
    const matDark = makeMat('#334155', 'liso', { roughness: 0.4, metalness: 0.35 });
    const matChrome = makeMat('#cbd5e1', 'liso', { roughness: 0.18, metalness: 0.82 });
    const matWhite = makeMat('#f8fafc', 'liso', { roughness: 0.25 });
    const matWood = makeMat('#c8a97e', 'madera', { repX: 80, repY: 80 });
    const matGlass = makeMat('#bae6fd', 'liso', { roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.34 });

    if (f.kind === 'escalera') {
      const steps = Math.max(6, Math.min(18, Math.round(W / 26)));
      const maxH = 250;
      const sw = W / steps, sh = maxH / steps;
      for (let i = 0; i < steps; i++) {
        const sx = -hw + (i + 0.5) * sw, curH = (i + 1) * sh;
        boxMesh(root, sw - 0.3, Math.max(3, sh * 0.95), D, makeMat('#e2e8f0', 'liso'), sx, curH - sh * 0.5, 0);
        boxMesh(root, sw + 1.5, 3.2, D + 1, f.frontColor ? matMain : matWood, sx, curH, 0);
      }
      for (let p = 0; p <= 3; p++) {
        const u = p / 3;
        boxMesh(root, 2.5, 90, 2.5, matDark, -hw + 6 + u * (W - 12), u * maxH + 45, hd - 2);
      }
      tagPick(root);
      return { group: root };
    }

    if (st.glass) {
      boxMesh(root, 2.8, fH, D, matDark, -hw + 1.4, fH / 2, 0);
      if (f.kind === 'mampara') {
        boxMesh(root, W - 3, fH - 2, Math.min(2, D * 0.4), matGlass, 1.5, fH / 2, 0, { cast: false });
        boxMesh(root, 2.2, 2.2, 45, matChrome, hw - 8, fH - 4, -22);
      } else if (f.kind === 'mamparaCorredera') {
        boxMesh(root, 2.8, fH, D, matDark, hw - 1.4, fH / 2, 0);
        boxMesh(root, W - 4, 3.5, D, matDark, 0, fH - 1.8, 0);
        boxMesh(root, hw + 2, fH - 5, 1.4, matGlass, -hw / 2 + 1, (fH - 3) / 2, -1.4, { cast: false });
        const leaf = new THREE.Group();
        boxMesh(leaf, hw + 2, fH - 5, 1.4, matGlass, hw / 2 - 1, (fH - 3) / 2, 1.4, { cast: false });
        boxMesh(leaf, 1.8, 22, 2.8, matDark, 4, fH * 0.48, 2.5);
        root.add(leaf);
        animTargets.push((s) => { leaf.position.x = -(s.animDoors || 0) * (hw - 8); });
      } else if (f.kind === 'mamparaAbatible') {
        const piv = new THREE.Group();
        piv.position.set(-hw + 2.8, 0, 0);
        boxMesh(piv, W - 4, fH - 2, 1.5, matGlass, (W - 4) / 2, fH / 2, 0, { cast: false });
        boxMesh(piv, 1.8, 20, 3, matDark, W - 10, fH * 0.48, 1.8);
        root.add(piv);
        animTargets.push((s) => { piv.rotation.y = -(s.animDoors || 0) * 1.25; });
      }
      tagPick(root);
      return { group: root };
    }

    if (Array.isArray(f.sections) && f.sections.length) {
      const plinth = f.plinth ?? (fZ0 > 0 ? 0 : 10);
      const bodyH = Math.max(12, fH - plinth);
      const bt = 1.8;
      const matCarcass = makeMat('#e2e8f0', 'liso', { roughness: 0.65 });
      if (plinth > 1) boxMesh(root, W - 3, plinth, Math.max(4, D - 6), matDark, 0, plinth / 2, -2);
      boxMesh(root, bt, bodyH, D - 2, matCarcass, -hw + bt / 2, plinth + bodyH / 2, -1);
      boxMesh(root, bt, bodyH, D - 2, matCarcass, hw - bt / 2, plinth + bodyH / 2, -1);
      boxMesh(root, W - bt * 2, bodyH, bt, matCarcass, 0, plinth + bodyH / 2, -hd + bt / 2);
      boxMesh(root, W - bt * 2, bt, D - 2, matCarcass, 0, plinth + bt / 2, -1);
      boxMesh(root, W - bt * 2, bt, D - 2, matCarcass, 0, plinth + bodyH - bt / 2, -1);
      if (fZ0 === 0 && f.kind !== 'despensa' && f.kind !== 'muebleAlto' && fH <= 105) {
        const topMat = f.kind === 'muebleBano' ? matWhite : makeMat('#f8fafc', 'marmol', { roughness: 0.22, repX: W, repY: D });
        boxMesh(root, W + 1.5, 2.8, D + 2, topMat, 0, fH + 1.4, 1);
      }

      let curY = plinth;
      const maxPull = Math.min(40, D * 0.72);
      f.sections.forEach((s) => {
        const sh = Math.max(5, num(s.h, 20));
        const yA = curY, yB = Math.min(fH, curY + sh);
        curY = yB;
        const secH = yB - yA - 0.8;
        if (secH < 2.5) return;
        const midY = (yA + yB) / 2;

        if (s.kind === 'hueco') {
          boxMesh(root, W - bt * 2, 1.6, D - 4, matCarcass, 0, yA + 1, -1);
        } else if (s.kind === 'horno') {
          boxMesh(root, W - 2, secH, 2.2, matDark, 0, midY, hd - 1.1);
          boxMesh(root, W - 12, Math.max(6, secH - 12), 0.8, makeMat('#0f172a', 'liso', { roughness: 0.1, metalness: 0.5 }), 0, midY - 2, hd + 0.2);
          boxMesh(root, W - 14, 1.6, 2.5, matChrome, 0, yB - 5, hd + 1.4);
        } else if (['cajon', 'cacerolero', 'cubertero', 'cajonInt'].includes(s.kind)) {
          const dGrp = new THREE.Group();
          const boxD = Math.max(10, D - 8), boxH = Math.min(secH - 3, 14);
          boxMesh(dGrp, W - 7, 1.4, boxD, matWood, 0, yA + 2, hd - 2 - boxD / 2);
          boxMesh(dGrp, 1.4, boxH, boxD, matCarcass, -hw + 4.2, yA + 2 + boxH / 2, hd - 2 - boxD / 2);
          boxMesh(dGrp, 1.4, boxH, boxD, matCarcass, hw - 4.2, yA + 2 + boxH / 2, hd - 2 - boxD / 2);
          boxMesh(dGrp, W - 7, boxH, 1.4, matCarcass, 0, yA + 2 + boxH / 2, hd - 2 - boxD);
          if (s.cutlery || s.kind === 'cubertero') {
            const cols = Math.max(3, Math.round(W / 15));
            for (let k = 1; k < cols; k++) {
              const cx = -hw + 5 + k * ((W - 10) / cols);
              boxMesh(dGrp, 1, Math.min(6, boxH - 1), boxD - 4, matChrome, cx, yA + 4.5, hd - 2 - boxD / 2);
            }
          }
          const fHgt = (f.handleType === 'gola' || f.handleType === 'unero') ? secH - 2.2 : secH;
          boxMesh(dGrp, W - 0.8, fHgt, 2, matMain, 0, yA + fHgt / 2 + 0.4, hd);
          if (f.handleType === 'gola' || f.handleType === 'unero') {
            boxMesh(root, W - 2, 2.2, 2.2, matChrome, 0, yB - 1.2, hd - 1.2);
          } else if (f.handleType === 'tirador') {
            boxMesh(dGrp, Math.min(20, W * 0.35), 1.4, 2.2, matDark, 0, yB - 4.5, hd + 1.8);
          }
          root.add(dGrp);
          if (s.anim !== false) animTargets.push((st3) => { dGrp.position.z = (st3.animKitchen || 0) * maxPull; });
        } else if (s.kind === 'elevable') {
          const piv = new THREE.Group();
          piv.position.set(0, yB, hd);
          boxMesh(piv, W - 0.8, secH, 2, matMain, 0, -secH / 2, 0);
          root.add(piv);
          if (s.anim !== false) animTargets.push((st3) => { piv.rotation.x = -(st3.animKitchen || 0) * 1.15; });
        } else if (s.kind === 'puerta2') {
          const pL = new THREE.Group(), pR = new THREE.Group();
          pL.position.set(-hw + 0.4, midY, hd);
          pR.position.set(hw - 0.4, midY, hd);
          boxMesh(pL, hw - 0.8, secH, 2, matMain, (hw - 0.8) / 2, 0, 0);
          boxMesh(pR, hw - 0.8, secH, 2, matMain, -(hw - 0.8) / 2, 0, 0);
          root.add(pL); root.add(pR);
          if (s.anim !== false) animTargets.push((st3) => {
            const ang = (st3.animKitchen || 0) * 1.25;
            pL.rotation.y = ang; pR.rotation.y = -ang;
          });
        } else {
          const piv = new THREE.Group();
          piv.position.set(-hw + 0.4, midY, hd);
          boxMesh(piv, W - 0.8, secH, 2, matMain, (W - 0.8) / 2, 0, 0);
          if (f.handleType === 'tirador') boxMesh(piv, 1.4, Math.min(16, secH * 0.35), 2.2, matDark, W - 5, 0, 1.8);
          root.add(piv);
          if (s.anim !== false) animTargets.push((st3) => { piv.rotation.y = (st3.animKitchen || 0) * 1.25; });
        }
      });
      tagPick(root);
      return { group: root };
    }

    switch (f.kind) {
      case 'sofa': case 'sofaL': {
        const seatH = fH * 0.46;
        boxMesh(root, W, seatH - 5, D, matMain, 0, 5 + (seatH - 5) / 2, 0);
        boxMesh(root, W - 14, fH - seatH, 18, matMain, 0, seatH + (fH - seatH) / 2, -hd + 9);
        boxMesh(root, 12, fH * 0.78, D, matMain, -hw + 6, (fH * 0.78) / 2 + 3, 0);
        boxMesh(root, 12, fH * 0.78, f.kind === 'sofaL' ? D * 0.55 : D, matMain, hw - 6, (fH * 0.78) / 2 + 3, f.kind === 'sofaL' ? -hd + D * 0.275 : 0);
        [[-hw + 8, -hd + 8], [hw - 8, -hd + 8], [-hw + 8, hd - 8], [hw - 8, hd - 8]].forEach(([lx, lz]) => boxMesh(root, 4, 5, 4, matWood, lx, 2.5, lz));
        break;
      }
      case 'cama': case 'cuna': {
        boxMesh(root, W, 22, D, matWood, 0, 14, 0);
        boxMesh(root, W + 4, 98, 8, matWood, 0, 49, -hd + 4);
        boxMesh(root, W - 6, 18, D - 12, matWhite, 0, 32, 4);
        boxMesh(root, W - 4, 8, D * 0.62, matMain, 0, 38, hd * 0.28);
        const pillows = W > 115 ? [-W * 0.23, W * 0.23] : [0];
        pillows.forEach((px) => boxMesh(root, Math.min(52, W * 0.4), 9, 30, matWhite, px, 43, -hd + 26));
        break;
      }
      case 'mesa': case 'escritorio': case 'mesaCentro': {
        boxMesh(root, W, 4, D, f.frontColor ? matMain : matWood, 0, fH - 2, 0);
        const inset = 6;
        [[-hw + inset, -hd + inset], [hw - inset, -hd + inset], [-hw + inset, hd - inset], [hw - inset, hd - inset]].forEach(([lx, lz]) => {
          boxMesh(root, 4.5, fH - 4, 4.5, matDark, lx, (fH - 4) / 2, lz);
        });
        break;
      }
      case 'mesaRedonda': {
        addMesh(root, new THREE.CylinderGeometry(hw, hw, 4, 28), f.frontColor ? matMain : matWood, 0, fH - 2, 0);
        addMesh(root, new THREE.CylinderGeometry(6, 18, fH - 4, 20), matDark, 0, (fH - 4) / 2, 0);
        break;
      }
      case 'silla': case 'sillaOficina': case 'taburete': {
        const sh = f.kind === 'taburete' ? fH : fH * 0.52;
        boxMesh(root, W, 4, D, matMain, 0, sh, 0);
        [[-hw + 4, -hd + 4], [hw - 4, -hd + 4], [-hw + 4, hd - 4], [hw - 4, hd - 4]].forEach(([lx, lz]) => boxMesh(root, 3, sh, 3, matDark, lx, sh / 2, lz));
        if (f.kind !== 'taburete') boxMesh(root, W, fH - sh, 4, matMain, 0, sh + (fH - sh) / 2, -hd + 2);
        break;
      }
      case 'tv': {
        boxMesh(root, W, fH, D, f.frontColor ? matMain : matWood, 0, fH / 2, 0);
        const tvW = Math.min(W * 0.78, 145), tvH = tvW * 0.56;
        boxMesh(root, tvW, tvH, 3.5, makeMat('#0f172a', 'liso', { roughness: 0.15, metalness: 0.4 }), 0, fH + tvH / 2 + 8, -2);
        boxMesh(root, 26, 8, 14, matDark, 0, fH + 4, -2);
        break;
      }
      case 'inodoro': case 'bide': {
        if (f.kind === 'inodoro') boxMesh(root, W * 0.92, fH, 18, matWhite, 0, fH / 2, -hd + 9);
        const bowlH = 42;
        addMesh(root, new THREE.CylinderGeometry(hw * 0.88, hw * 0.7, bowlH, 20), matWhite, 0, bowlH / 2, f.kind === 'inodoro' ? 8 : 0);
        boxMesh(root, W * 0.82, bowlH, D * 0.5, matWhite, 0, bowlH / 2, -hd * 0.25);
        if (f.kind === 'bide') boxMesh(root, 3, 10, 8, matChrome, 0, bowlH + 5, -hd + 8);
        break;
      }
      case 'ducha': case 'duchaExt': {
        boxMesh(root, W, 4.5, D, f.frontColor ? matMain : matWhite, 0, 2.25, 0);
        boxMesh(root, Math.min(50, W * 0.5), 0.6, 5, matChrome, 0, 4.6, -hd + 14);
        break;
      }
      case 'columnaDucha': {
        boxMesh(root, 2.5, fH * 0.85, 2.5, matChrome, 0, fH * 0.5, -hd + 3);
        boxMesh(root, 22, 4, 8, matChrome, 0, fH * 0.52, -hd + 6);
        addMesh(root, new THREE.CylinderGeometry(13, 13, 2, 20), matChrome, 0, fH - 4, 2);
        boxMesh(root, 2.5, 2.5, D * 0.75, matChrome, 0, fH - 2, -hd * 0.2);
        break;
      }
      case 'lavabo': case 'lavabo2': {
        boxMesh(root, W, 14, D, matWhite, 0, fH - 7, 0);
        const taps = f.kind === 'lavabo2' ? [-W * 0.25, W * 0.25] : [0];
        taps.forEach((tx) => {
          boxMesh(root, 3, 12, 3, matChrome, tx, fH + 6, -hd + 8);
          boxMesh(root, 3, 2.5, 10, matChrome, tx, fH + 11, -hd + 12);
        });
        break;
      }
      case 'banera': case 'baneraExenta': {
        boxMesh(root, W, fH, D, matWhite, 0, fH / 2, 0);
        boxMesh(root, W - 14, 3, D - 14, makeMat('#bae6fd', 'liso', { roughness: 0.1 }), 0, fH - 6, 0);
        boxMesh(root, 3.5, 16, 10, matChrome, 0, fH + 7, -hd + 7);
        break;
      }
      case 'espejoLed': {
        boxMesh(root, W, fH, 2.5, makeMat('#e2e8f0', 'liso', { roughness: 0.04, metalness: 0.88 }), 0, fH / 2, 0);
        boxMesh(root, W + 3, fH + 3, 1, makeMat('#fef08a', 'liso', { roughness: 0.3 }), 0, fH / 2, -1.4);
        break;
      }
      case 'fregadero': {
        boxMesh(root, W, fH - 3, D - 2, matMain, 0, (fH - 3) / 2, -1);
        boxMesh(root, W + 1, 3, D + 2, makeMat('#f8fafc', 'marmol'), 0, fH - 1.5, 1);
        boxMesh(root, W * 0.68, 2, D * 0.62, matChrome, 0, fH + 0.3, 2);
        boxMesh(root, 2.5, 24, 2.5, matChrome, 0, fH + 12, -hd + 10);
        boxMesh(root, 2.5, 2.5, 15, matChrome, 0, fH + 23, -hd + 16);
        break;
      }
      case 'placa': {
        boxMesh(root, W, fH - 3, D - 2, matMain, 0, (fH - 3) / 2, -1);
        boxMesh(root, W + 1, 3, D + 2, makeMat('#f8fafc', 'marmol'), 0, fH - 1.5, 1);
        boxMesh(root, W * 0.86, 1.2, D * 0.8, makeMat('#0f172a', 'liso', { roughness: 0.12, metalness: 0.35 }), 0, fH + 0.4, 1);
        break;
      }
      case 'nevera': {
        boxMesh(root, W, fH, D - 2, matChrome, 0, fH / 2, -1);
        const topPiv = new THREE.Group(), botPiv = new THREE.Group();
        topPiv.position.set(-hw + 1, fH * 0.68, hd);
        botPiv.position.set(-hw + 1, fH * 0.2, hd);
        boxMesh(topPiv, W - 2, fH * 0.58, 2.5, f.frontColor ? matMain : matChrome, (W - 2) / 2, 0, 0);
        boxMesh(botPiv, W - 2, fH * 0.36, 2.5, f.frontColor ? matMain : matChrome, (W - 2) / 2, 0, 0);
        root.add(topPiv); root.add(botPiv);
        animTargets.push((st3) => { const a = (st3.animKitchen || 0) * 1.2; topPiv.rotation.y = a; botPiv.rotation.y = a * 0.7; });
        break;
      }
      case 'alfombra': {
        boxMesh(root, W, 1.2, D, matMain, 0, 0.8, 0, { cast: false });
        break;
      }
      case 'piscina': {
        boxMesh(root, W + 24, 6, D + 24, makeMat('#e2e8f0', 'piedra'), 0, 3, 0);
        boxMesh(root, W, 5, D, makeMat('#38bdf8', 'liso', { roughness: 0.08, metalness: 0.15 }), 0, 3.8, 0);
        break;
      }
      default: {
        boxMesh(root, W, fH, D, matMain, 0, fH / 2, 0);
        if (['encimera', 'isla', 'peninsula', 'muebleBajo', 'muebleCajon'].includes(f.kind)) {
          boxMesh(root, W + 2, 3, D + 2, makeMat('#f8fafc', 'marmol', { roughness: 0.22 }), 0, fH + 1.5, 0);
        }
        if (['muebleBajo', 'muebleAlto', 'horno', 'microondas', 'despensa', 'lavavajillas', 'armario', 'vestidor'].includes(f.kind)) {
          const piv = new THREE.Group();
          piv.position.set(-hw + 1, fH / 2, hd + 0.2);
          boxMesh(piv, Math.min(W - 2, 60), fH - 4, 2, matMain, Math.min(W - 2, 60) / 2, 0, 0);
          boxMesh(piv, 1.5, 18, 2.2, matDark, Math.min(W - 2, 60) - 5, 0, 1.8);
          root.add(piv);
          animTargets.push((st3) => { piv.rotation.y = (st3.animKitchen || 0) * 1.2; });
        }
      }
    }

    tagPick(root);
    return { group: root };
  }

  /* ---------- Construcción completa de la escena 3D (sin reconstruir al animar wallCut) ---------- */
  function buildScene(list, state3d, helpers) {
    const { wlen, clamp: clp, polyArea, SYMBOLS, SYM_GROUPS, DUCT_KINDS, Obra } = helpers;
    const night = !!state3d.nightMode;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(night ? '#0f172a' : '#eaf0f8');

    const animTargets = [];
    const scalableRoot = new THREE.Group(); // escala en Y según wallCut en modo Maqueta (0 ms por fotograma)
    scene.add(scalableRoot);

    const hemi = new THREE.HemisphereLight(night ? 0x334155 : 0xffffff, night ? 0x0f172a : 0xcbd5e1, night ? 0.45 : 0.96);
    hemi.position.set(0, 800, 0);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(night ? 0x93c5fd : 0xfffaf0, night ? 0.28 : 1.12);
    sun.position.set(520, 980, 640);
    sun.castShadow = true;
    const smap = isTouchDevice() ? 1024 : 1536;
    sun.shadow.mapSize.set(smap, smap);
    sun.shadow.camera.near = 100;
    sun.shadow.camera.far = 3500;
    const dCam = 1400;
    sun.shadow.camera.left = -dCam; sun.shadow.camera.right = dCam;
    sun.shadow.camera.top = dCam; sun.shadow.camera.bottom = -dCam;
    sun.shadow.bias = -0.0006;
    scene.add(sun);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, night ? 0.14 : 0.38);
    fillLight.position.set(-600, 500, -450);
    scene.add(fillLight);

    const groundMat = new THREE.MeshStandardMaterial({ color: night ? 0x1e293b : 0xdde5ef, roughness: 0.95, metalness: 0 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.6;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(4000, 40, night ? 0x334155 : 0xc5d1e0, night ? 0x1e293b : 0xd5dfec);
    gridHelper.position.y = -0.3;
    scene.add(gridHelper);

    // 1. Suelos de habitaciones (con limpieza de vértices consecutivos duplicados)
    const rooms = list.filter((e) => e.type === 'room' && Array.isArray(e.points) && e.points.length >= 3)
      .slice()
      .sort((a, b) => polyArea(b.points) - polyArea(a.points));
    rooms.forEach((r, idx) => {
      try {
        const cleanPts = r.points.filter((p, i, arr) => {
          const prev = arr[(i + arr.length - 1) % arr.length];
          return Math.hypot(p[0] - prev[0], p[1] - prev[1]) > 0.5;
        });
        if (cleanPts.length < 3) return;
        const sh = new THREE.Shape();
        cleanPts.forEach(([x, y], i) => { if (i === 0) sh.moveTo(x, -y); else sh.lineTo(x, -y); });
        sh.closePath();
        const geom = new THREE.ShapeGeometry(sh);
        const uv = geom.attributes.uv;
        if (uv) for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 120, uv.getY(i) / 120);
        const rMat = makeMat(r.color || '#f3ead8', r.floorTexture || 'liso', {
          repX: 120, repY: 120,
          polygonOffset: true, polygonOffsetFactor: -1 - idx, polygonOffsetUnits: -1,
        });
        const rMesh = new THREE.Mesh(geom, rMat);
        rMesh.rotation.x = -Math.PI / 2;
        rMesh.position.y = 0.2 + idx * 0.15;
        rMesh.receiveShadow = true;
        scene.add(rMesh);
      } catch (_) {}
    });

    // 2. Muros y carpinterías en 3D
    const opsByWall = new Map();
    list.filter((e) => e.type === 'door' || e.type === 'window').forEach((o) => {
      if (!opsByWall.has(o.wallId)) opsByWall.set(o.wallId, []);
      opsByWall.get(o.wallId).push(o);
    });

    const matCapTop = makeMat('#475569', 'liso', { roughness: 0.85 });
    const matSkirt = makeMat('#f8fafc', 'liso', { roughness: 0.4 });
    const matFrameWood = makeMat('#7c583c', 'madera', { roughness: 0.45 });
    const matDoorWood = makeMat('#c49060', 'madera', { roughness: 0.42 });
    const matDoorSec = makeMat('#7c2d12', 'madera', { roughness: 0.38 });
    const matAlum = makeMat('#334155', 'liso', { roughness: 0.32, metalness: 0.55 });
    const matChrome = makeMat('#cbd5e1', 'liso', { roughness: 0.18, metalness: 0.82 });
    const matWinGlass = makeMat('#7dd3fc', 'liso', { roughness: 0.06, metalness: 0.18, transparent: true, opacity: 0.32 });

    const selBoxTarget = { box: null };
    const wallCapMeshes = [];

    list.filter((e) => e.type === 'wall').forEach((w) => {
      if (w.status === 'demoler' && state3d.hideDemo) return;
      const L = wlen(w); if (L < 1) return;
      const wh = w.height || 250;
      const thick = w.thick || 15;
      const angleY = -Math.atan2(w.y2 - w.y1, w.x2 - w.x1);
      const isDemo = w.status === 'demoler';
      const baseWallCol = w.status === 'nuevo' ? '#fed7aa' : isDemo ? '#fef08a' : (w.wallColor || '#f1f5f9');
      const wMat = makeMat(baseWallCol, w.wallTexture || 'liso', {
        repX: 140, repY: 140,
        transparent: isDemo, opacity: isDemo ? 0.45 : 1,
      });

      const wGrp = new THREE.Group();
      wGrp.position.set(w.x1, 0, w.y1);
      wGrp.rotation.y = angleY;
      scalableRoot.add(wGrp);

      if (!isDemo) {
        boxMesh(wGrp, thick - 0.2, wh - 0.2, thick - 0.2, wMat, 0, (wh - 0.2) / 2, 0, { pickId: w.id, pickPrio: 2 });
        boxMesh(wGrp, thick - 0.2, wh - 0.2, thick - 0.2, wMat, L, (wh - 0.2) / 2, 0, { pickId: w.id, pickPrio: 2 });
      }

      const addWallChunk = (s0, s1, y0, y1, withSkirt = false) => {
        const segL = s1 - s0, segH = y1 - y0;
        if (segL <= 0.5 || segH <= 0.5) return;
        const cx = (s0 + s1) / 2, cy = (y0 + y1) / 2;
        boxMesh(wGrp, segL, segH, thick, wMat, cx, cy, 0, { pickId: w.id, pickPrio: 2 });
        if (Math.abs(y1 - wh) < 0.5 && !isDemo) {
          const cap = boxMesh(wGrp, segL + 0.1, 1.2, thick + 0.2, matCapTop, cx, wh + 0.4, 0, { cast: false, pickId: w.id, pickPrio: 2 });
          if (cap) wallCapMeshes.push(cap);
        }
        if (withSkirt && !isDemo && wh > 18) {
          boxMesh(wGrp, segL, 7.5, thick + 1.4, matSkirt, cx, 3.8, 0, { cast: false, pickId: w.id, pickPrio: 2 });
        }
      };

      const ops = (opsByWall.get(w.id) || []).map((o) => {
        const a = clp(o.t * L - o.width / 2, 0, L);
        const b = clp(o.t * L + o.width / 2, a, L);
        return { o, a, b };
      }).sort((x, y) => x.a - y.a);

      let cur = 0;
      ops.forEach(({ o, a, b }) => {
        if (a - cur > 0.5) addWallChunk(cur, a, 0, wh, true);
        const isWin = o.type === 'window';
        const sill = isWin ? Math.min(wh, o.sill || 90) : 0;
        const zTop = Math.min(wh, isWin ? (o.sill || 90) + (o.height || 120) : (o.height || 210));
        if (sill > 0.5) {
          addWallChunk(a, b, 0, sill, true);
          boxMesh(wGrp, b - a + 2, 2.2, thick + 3, matSkirt, (a + b) / 2, sill, 0, { pickId: o.id, pickPrio: 1 });
        }
        if (wh - zTop > 0.5) addWallChunk(a, b, zTop, wh, false);

        const opW = b - a, opH = zTop - sill;
        if (opW > 3 && opH > 3 && o.kind !== 'hueco') {
          const midS = (a + b) / 2, side = o.side || 1;
          if (o.kind === 'garaje') {
            boxMesh(wGrp, 4, opH, thick * 0.9, matAlum, a + 2, sill + opH / 2, 0, { pickId: o.id });
            boxMesh(wGrp, 4, opH, thick * 0.9, matAlum, b - 2, sill + opH / 2, 0, { pickId: o.id });
            const slats = 5, sh = (opH - 2) / slats;
            const slatMeshes = [];
            for (let k = 0; k < slats; k++) {
              const sm = boxMesh(wGrp, opW - 8, sh - 1.2, 4.5, makeMat(k % 2 ? '#64748b' : '#475569', 'liso', { metalness: 0.4, roughness: 0.35 }), midS, sill + (k + 0.5) * sh, 0, { pickId: o.id });
              slatMeshes.push({ sm, k });
            }
            animTargets.push((st3) => {
              const lift = clp(st3.animGarage || 0, 0, 1);
              slatMeshes.forEach(({ sm, k }) => {
                const baseY = sill + (k + 0.5) * sh;
                const travel = lift * opH * 0.95;
                if (baseY + travel <= zTop - 4) {
                  sm.position.set(midS, baseY + travel, 0);
                  sm.rotation.x = 0;
                } else {
                  const over = (baseY + travel) - (zTop - 4);
                  sm.position.set(midS, zTop - 3, -side * over);
                  sm.rotation.x = Math.PI / 2;
                }
              });
            });
          } else if (isWin || o.kind === 'balconera' || o.kind === 'correderaDoble') {
            const fD = Math.min(8, thick * 0.65);
            boxMesh(wGrp, 3.5, opH, fD, matAlum, a + 1.8, sill + opH / 2, 0, { pickId: o.id });
            boxMesh(wGrp, 3.5, opH, fD, matAlum, b - 1.8, sill + opH / 2, 0, { pickId: o.id });
            boxMesh(wGrp, opW, 3.5, fD, matAlum, midS, sill + 1.8, 0, { pickId: o.id });
            boxMesh(wGrp, opW, 3.5, fD, matAlum, midS, zTop - 1.8, 0, { pickId: o.id });
            const inW = opW - 7, inH = opH - 7;
            if (o.kind === 'abatible' || o.kind === 'oscilobatiente') {
              const piv = new THREE.Group();
              piv.position.set(a + 3.5, sill + opH / 2, 0);
              boxMesh(piv, inW, inH, 2.2, matWinGlass, inW / 2, 0, 0, { cast: false, pickId: o.id });
              wGrp.add(piv);
              animTargets.push((st3) => { piv.rotation.y = -(isWin ? (st3.animWindows || 0) : (st3.animDoors || 0)) * side * 1.1; });
            } else if (o.kind === 'abatible2' || o.kind === 'balconera') {
              const pL = new THREE.Group(), pR = new THREE.Group();
              pL.position.set(a + 3.5, sill + opH / 2, 0);
              pR.position.set(b - 3.5, sill + opH / 2, 0);
              boxMesh(pL, inW / 2, inH, 2.2, matWinGlass, inW / 4, 0, 0, { cast: false, pickId: o.id });
              boxMesh(pR, inW / 2, inH, 2.2, matWinGlass, -inW / 4, 0, 0, { cast: false, pickId: o.id });
              wGrp.add(pL); wGrp.add(pR);
              animTargets.push((st3) => {
                const ang = (isWin ? (st3.animWindows || 0) : (st3.animDoors || 0)) * side * 1.1;
                pL.rotation.y = -ang; pR.rotation.y = ang;
              });
            } else {
              boxMesh(wGrp, inW / 2 + 2, inH, 1.8, matWinGlass, midS - inW / 4, sill + opH / 2, -1.2, { cast: false, pickId: o.id });
              const sl = boxMesh(wGrp, inW / 2 + 2, inH, 1.8, matWinGlass, midS + inW / 4, sill + opH / 2, 1.2, { cast: false, pickId: o.id });
              if (sl) animTargets.push((st3) => { sl.position.x = midS + inW / 4 - (isWin ? (st3.animWindows || 0) : (st3.animDoors || 0)) * (inW * 0.42); });
            }
            if (o.shutter === 'manual' || o.shutter === 'electric') {
              const boxH = Math.min(18, opH * 0.22);
              boxMesh(wGrp, opW, boxH, thick + 1.5, o.shutter === 'electric' ? makeMat('#475569', 'liso') : matAlum, midS, zTop - boxH / 2, 0, { pickId: o.id });
              const curtain = boxMesh(wGrp, opW - 4, opH - boxH, 2, makeMat('#94a3b8', 'madera'), midS, zTop - boxH - 1, -side * (fD / 2 + 1.2), { pickId: o.id });
              if (curtain) {
                curtain.scale.y = 0.01;
                animTargets.push((st3) => {
                  const u = Math.max(0.01, st3.animShutters || 0);
                  curtain.scale.y = u;
                  curtain.position.y = (zTop - boxH) - ((opH - boxH) * u) / 2;
                });
              }
            }
          } else {
            const dMat = o.kind === 'blindada' ? matDoorSec : matDoorWood;
            boxMesh(wGrp, 3.5, opH, thick + 2, matFrameWood, a + 1.75, sill + opH / 2, 0, { pickId: o.id });
            boxMesh(wGrp, 3.5, opH, thick + 2, matFrameWood, b - 1.75, sill + opH / 2, 0, { pickId: o.id });
            boxMesh(wGrp, opW + 2, 3.5, thick + 2, matFrameWood, midS, zTop - 1.75, 0, { pickId: o.id });
            const leafW = Math.max(6, opW - 7), leafH = Math.max(10, opH - 3.5);
            if (o.kind === 'corredera') {
              const sl = boxMesh(wGrp, leafW, leafH, 4, dMat, midS, sill + leafH / 2, 0, { pickId: o.id });
              if (sl) animTargets.push((st3) => { sl.position.x = midS + (o.hinge === 'right' ? 1 : -1) * (st3.animDoors || 0) * (leafW * 0.86); });
            } else if (o.kind === 'doble') {
              const pL = new THREE.Group(), pR = new THREE.Group();
              pL.position.set(a + 3.5, sill + leafH / 2, 0);
              pR.position.set(b - 3.5, sill + leafH / 2, 0);
              boxMesh(pL, leafW / 2, leafH, 4.2, dMat, leafW / 4, 0, 0, { pickId: o.id });
              boxMesh(pR, leafW / 2, leafH, 4.2, dMat, -leafW / 4, 0, 0, { pickId: o.id });
              wGrp.add(pL); wGrp.add(pR);
              animTargets.push((st3) => { const ang = (st3.animDoors || 0) * side * 1.32; pL.rotation.y = -ang; pR.rotation.y = ang; });
            } else {
              const isRight = o.hinge === 'right';
              const piv = new THREE.Group();
              piv.position.set(isRight ? b - 3.5 : a + 3.5, sill + leafH / 2, 0);
              const dir = isRight ? -1 : 1;
              boxMesh(piv, leafW, leafH, 4.2, dMat, (leafW / 2) * dir, 0, 0, { pickId: o.id });
              boxMesh(piv, 9, 1.8, 9, matChrome, (leafW - 8) * dir, -leafH * 0.04, 0, { pickId: o.id });
              wGrp.add(piv);
              animTargets.push((st3) => { piv.rotation.y = -(st3.animDoors || 0) * side * dir * 1.35; });
            }
          }
        }
        cur = Math.max(cur, b);
      });
      if (L - cur > 0.5) addWallChunk(cur, L, 0, wh, true);

      if (state3d.editable && state3d.sel3dId === w.id) selBoxTarget.box = wGrp;
    });

    // 3. Mobiliario detallado en 3D
    const furnRoot = new THREE.Group();
    scene.add(furnRoot);
    if (state3d.showFurn !== false) {
      list.filter((e) => e.type === 'furn' && e.kind !== 'norte').forEach((f) => {
        const { group } = buildFurniture3D(f, helpers, animTargets);
        furnRoot.add(group);
        if (state3d.editable && state3d.sel3dId === f.id) selBoxTarget.box = group;
      });
    }

    // 4. Instalaciones, conductos AA y puntos de luz reales en Modo Noche
    const grpVisible3d = (g) => (g === 'clima' && state3d.showClima) || (g === 'elec' && state3d.showElec) || (g === 'fonta' && state3d.showFonta) || (g === 'domo' && state3d.showDomo);
    list.filter((e) => e.type === 'duct').forEach((d) => {
      const dk = DUCT_KINDS[d.kind] || DUCT_KINDS.impulsion;
      if (!grpVisible3d(dk.group)) return;
      const L = wlen(d); if (L < 1) return;
      const w = Math.max(6, d.width || dk.w);
      const z1 = Math.max(10, d.height ?? dk.h), hD = w >= 14 ? 14 : 5;
      const grp = new THREE.Group();
      grp.position.set(d.x1, z1 - hD / 2, d.y1);
      grp.rotation.y = -Math.atan2(d.y2 - d.y1, d.x2 - d.x1);
      boxMesh(grp, L, hD, w, makeMat(dk.color, 'liso', { roughness: 0.35, metalness: 0.25, transparent: true, opacity: 0.88 }), L / 2, 0, 0);
      scalableRoot.add(grp);
    });

    list.filter((e) => e.type === 'sym').forEach((y) => {
      const d = SYMBOLS[y.kind] || SYMBOLS.enchufe;
      if (grpVisible3d(d.group)) {
        const col = SYM_GROUPS[d.group].color;
        const sz = y.kind === 'maqInt' ? [80, 26, 50] : y.kind === 'maqExt' ? [85, 65, 35] : (y.kind === 'rejImp' || y.kind === 'rejRet') ? [45, 14, 16] : [14, 14, 14];
        const zTop = Math.max(sz[1], y.height ?? d.h);
        const grp = new THREE.Group();
        grp.position.set(y.x, zTop - sz[1] / 2, y.y);
        grp.rotation.y = -((y.angle || 0) * Math.PI) / 180;
        boxMesh(grp, sz[0], sz[1], sz[2], makeMat(col, 'liso', { roughness: 0.35 }), 0, 0, 0, { pickId: y.id });
        scalableRoot.add(grp);
      }
      if (night && ['luz', 'foco', 'tiraLed', 'aplique'].includes(y.kind)) {
        const live = Obra.isCircuitLive(Obra.inferCircuitId(y));
        const zL = Math.max(45, (y.height || 245) - 8);
        const bulbMat = new THREE.MeshBasicMaterial({ color: live ? 0xfef08a : 0x475569 });
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(5.5, 10, 10), bulbMat);
        bulb.position.set(y.x, zL, y.y);
        scalableRoot.add(bulb);
        if (live) {
          const pl = new THREE.PointLight(0xffdca8, y.kind === 'foco' ? 1.5 : 2.4, 620, 1.3);
          pl.position.set(y.x, zL - 6, y.y);
          scalableRoot.add(pl);
        }
      }
    });

    if (night) {
      list.filter((e) => e.type === 'furn' && e.kind === 'espejoLed').forEach((f) => {
        if (Obra.isCircuitLive(Obra.inferCircuitId(f))) {
          const pl = new THREE.PointLight(0xfff1b8, 1.4, 380, 1.4);
          pl.position.set(f.x, (f.z0 ?? 120) + (f.h3d || 80) / 2, f.y);
          furnRoot.add(pl);
        }
      });
    }

    // Aplicar wallCut dinámicamente en cada fotograma sin reconstruir mallas (60 FPS garantizados)
    animTargets.push((st3) => {
      const fp = st3.camMode === 'fp';
      const hf = fp ? 1 : clp(st3.wallCut ?? 0.85, 0.05, 1);
      scalableRoot.scale.y = hf;
      furnRoot.scale.y = fp ? 1 : Math.max(0.45, hf);
      const showCaps = !fp && hf < 0.98;
      for (let i = 0; i < wallCapMeshes.length; i++) wallCapMeshes[i].visible = showCaps;
    });

    let boxHelper = null;
    if (selBoxTarget.box) {
      boxHelper = new THREE.BoxHelper(selBoxTarget.box, 0xf97316);
      scene.add(boxHelper);
      animTargets.push(() => { if (boxHelper) boxHelper.update(); });
    }

    return { scene, animTargets };
  }

  function disposeScene(scene) {
    if (!scene) return;
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => m.dispose());
      }
    });
  }

  function makeSceneKey(list, state3d, Obra) {
    const cirKey = (Obra && state3d.nightMode) ? JSON.stringify(window.Store?.state?.electrical || {}) : '';
    return JSON.stringify([
      list,
      !!state3d.hideDemo, !!state3d.showFurn, !!state3d.showClima, !!state3d.showElec, !!state3d.showFonta, !!state3d.showDomo,
      !!state3d.nightMode, state3d.editable ? (state3d.sel3dId || '') : '', cirKey,
    ]);
  }

  /* ---------- Render principal hacia cualquier <canvas> 2D + Overlays nítidos ---------- */
  function render(canvas, state3d, targetPlan, helpers) {
    if (!canvas) return false;
    const W = canvas.width, H = canvas.height;
    if (!W || !H) return false;
    const ctx = canvas.getContext('2d');
    if (!window.THREE) {
      if (ctx) {
        ctx.fillStyle = '#eaf0f8'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#334155'; ctx.font = '600 14px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Cargando motor 3D…', W / 2, H / 2);
      }
      return false;
    }

    let renderer;
    try { renderer = ensureRenderer(W, H); } catch (err) {
      if (ctx) {
        ctx.fillStyle = '#eaf0f8'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#dc2626'; ctx.font = '600 14px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('WebGL no disponible en este navegador', W / 2, H / 2);
      }
      return false;
    }

    const list = targetPlan.elements || [];
    const { bbox, centroid, clamp: clp, S } = helpers;
    const b = bbox(list) || { x1: 0, y1: 0, x2: 800, y2: 600 };
    const cx = (b.x1 + b.x2) / 2, cy = (b.y1 + b.y2) / 2;
    const span = Math.max(b.x2 - b.x1, b.y2 - b.y1, 260);

    let st = canvasStates.get(canvas);
    if (!st) {
      st = { key: '', scene: null, animTargets: [], camera: new THREE.PerspectiveCamera(58, W / H, 6, 9500) };
      canvasStates.set(canvas, st);
    }
    const newKey = makeSceneKey(list, state3d, helpers.Obra);
    if (st.key !== newKey || !st.scene) {
      disposeScene(st.scene);
      const built = buildScene(list, state3d, helpers);
      st.scene = built.scene;
      st.animTargets = built.animTargets;
      st.key = newKey;
    }

    st.animTargets.forEach((fn) => fn(state3d));

    const cam = st.camera;
    cam.aspect = W / H;
    const isFP = state3d.camMode === 'fp';
    if (isFP) {
      cam.fov = clp(68 / clp(state3d.zoom || 1, 0.7, 1.5), 45, 82);
      cam.near = 6; cam.far = 6500;
      const fx = state3d.fpX ?? cx, fy = state3d.fpY ?? cy, fz = state3d.eyeZ ?? 165;
      const yr = ((state3d.fpYaw ?? 0) * Math.PI) / 180;
      const pr = ((state3d.fpPitch ?? -3) * Math.PI) / 180;
      cam.position.set(fx, fz, fy);
      cam.up.set(0, 1, 0);
      cam.lookAt(
        fx + Math.cos(yr) * Math.cos(pr) * 200,
        fz + Math.sin(pr) * 200,
        fy + Math.sin(yr) * Math.cos(pr) * 200
      );
    } else {
      cam.fov = 42;
      cam.near = 15; cam.far = 12000;
      const yaw = ((state3d.yaw ?? -35) * Math.PI) / 180;
      const pitch = (clp(state3d.pitch ?? 42, 12, 88) * Math.PI) / 180;
      const dist = (span * 1.38) / clp(state3d.zoom || 1, 0.45, 2.6);
      const targetY = 55 * (state3d.wallCut ?? 0.85);
      const horiz = Math.cos(pitch) * dist;
      cam.position.set(
        cx - Math.sin(yaw) * horiz,
        targetY + Math.sin(pitch) * dist,
        cy + Math.cos(yaw) * horiz
      );
      cam.up.set(0, 1, 0);
      cam.lookAt(cx, targetY * 0.6, cy);
    }
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();

    renderer.render(st.scene, cam);

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(renderer.domElement, 0, 0, W, H);

    const proj2D = (wx, wy, wz) => {
      const v = new THREE.Vector3(wx, wz, wy).project(cam);
      if (v.z > 1 || v.z < -1) return null;
      return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
    };

    if (!isFP) {
      ctx.font = '700 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      list.filter((e) => e.type === 'room' && e.points.length >= 3 && e.name).forEach((r) => {
        const c = centroid(r.points);
        const p = proj2D(c.x, c.y, 12);
        if (!p) return;
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.strokeText(r.name, p.x, p.y);
        ctx.fillStyle = '#0f172a';
        ctx.fillText(r.name, p.x, p.y);
      });
    }

    if (state3d.showNotes) {
      ctx.font = '600 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      const hFactor = isFP ? 1 : (state3d.wallCut ?? 0.85);
      list.filter((e) => e.type === 'text' || e.type === 'pin').forEach((e) => {
        const txt = e.type === 'text' ? e.text : (e.label || (e.taskId ? (S().tasks.find((t) => t.id === e.taskId)?.title || 'Pin') : 'Incidencia'));
        if (!txt) return;
        const p = proj2D(e.x, e.y, e.type === 'pin' ? 140 * hFactor : 20);
        if (!p) return;
        const w = ctx.measureText(txt).width + 16;
        ctx.fillStyle = e.type === 'pin' ? 'rgba(239,68,68,0.92)' : 'rgba(15,23,42,0.84)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(p.x - w / 2, p.y - 12, w, 22, 6) : ctx.rect(p.x - w / 2, p.y - 12, w, 22);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(txt, p.x, p.y + 3);
      });
    }

    if (isFP) {
      const mw = 124, mh = 94, mx0 = 12, my0 = 12, pad = 9;
      const bw = Math.max(100, b.x2 - b.x1), bh = Math.max(100, b.y2 - b.y1);
      const ms = Math.min((mw - pad * 2) / bw, (mh - pad * 2) / bh);
      const ox = mx0 + (mw - bw * ms) / 2 - b.x1 * ms, oy = my0 + (mh - bh * ms) / 2 - b.y1 * ms;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeStyle = 'rgba(15,23,42,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(mx0, my0, mw, mh, 10) : ctx.rect(mx0, my0, mw, mh);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
      list.filter((e) => e.type === 'wall' && !(e.status === 'demoler' && state3d.hideDemo)).forEach((w) => {
        ctx.beginPath(); ctx.moveTo(ox + w.x1 * ms, oy + w.y1 * ms); ctx.lineTo(ox + w.x2 * ms, oy + w.y2 * ms); ctx.stroke();
      });
      const fpX = state3d.fpX ?? cx, fpY = state3d.fpY ?? cy, fpYr = ((state3d.fpYaw ?? 0) * Math.PI) / 180;
      const px0 = ox + fpX * ms, py0 = oy + fpY * ms;
      ctx.fillStyle = 'rgba(249,115,22,0.24)';
      ctx.beginPath(); ctx.moveTo(px0, py0); ctx.arc(px0, py0, 19, fpYr - 0.55, fpYr + 0.55); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ea580c';
      ctx.beginPath(); ctx.arc(px0, py0, 4, 0, Math.PI * 2); ctx.fill();
    }

    if (state3d.showLegend) {
      const items = [
        ['#f1f5f9', 'Muro existente'],
        ['#fed7aa', 'Muro nuevo'],
        ['#7dd3fc', 'Ventanas / cristal'],
        ['#c49060', 'Puertas'],
        ['#64748b', 'Puerta garaje'],
      ];
      if (!state3d.hideDemo) items.push(['#fef08a', 'A demoler']);
      if (state3d.showClima) items.push(['#06b6d4', 'AA / Conductos']);
      if (state3d.showElec) items.push(['#f59e0b', 'Iluminación / Elec.']);
      if (state3d.showFonta) items.push(['#0284c7', 'Fontanería / Agua']);
      if (state3d.showDomo) items.push(['#8b5cf6', 'Domótica']);
      const lh = 20, pad = 12, bw = 185, bh = items.length * lh + pad * 2 + 16;
      const x0 = 14, y0 = H - bh - 14;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.strokeStyle = 'rgba(15,23,42,0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x0, y0, bw, bh, 10) : ctx.rect(x0, y0, bw, bh);
      ctx.fill(); ctx.stroke();
      ctx.textAlign = 'left';
      ctx.font = '800 11px Inter, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('LEYENDA', x0 + pad, y0 + pad + 9);
      ctx.font = '600 11.5px Inter, sans-serif';
      items.forEach(([col, lbl], i) => {
        const yy = y0 + pad + 26 + i * lh;
        ctx.fillStyle = col;
        ctx.fillRect(x0 + pad, yy - 9, 12, 12);
        ctx.strokeStyle = 'rgba(15,23,42,0.25)';
        ctx.strokeRect(x0 + pad, yy - 9, 12, 12);
        ctx.fillStyle = '#334155';
        ctx.fillText(lbl, x0 + pad + 18, yy + 1);
      });
    }

    return true;
  }

  function pick(canvas, clientX, clientY) {
    const st = canvasStates.get(canvas);
    if (!st || !st.scene || !st.camera || !window.THREE) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    const rc = new THREE.Raycaster();
    rc.setFromCamera(ndc, st.camera);
    const hits = rc.intersectObjects(st.scene.children, true);
    for (const h of hits) {
      if (h.object?.visible && h.object?.userData?.pickId) {
        return { id: h.object.userData.pickId, point: { x: h.point.x, y: h.point.z, z: h.point.y }, dist: h.distance };
      }
    }
    return null;
  }

  function screenToFloor(canvas, clientX, clientY, elevationY = 0) {
    const st = canvasStates.get(canvas);
    if (!st || !st.camera || !window.THREE) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    const rc = new THREE.Raycaster();
    rc.setFromCamera(ndc, st.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -elevationY);
    const target = new THREE.Vector3();
    if (!rc.ray.intersectPlane(plane, target)) return null;
    return { x: target.x, y: target.z };
  }

  return { render, pick, screenToFloor, _buildScene: buildScene };
})();
