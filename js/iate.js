/* O iate de conceito da landing (52 pés, flybridge), desenhado só em código: nenhum ficheiro de modelo na página.
   Eixos: x para a proa, y para cima, z para estibordo; linha de água em y = 0.
   Tudo fechado (casco, convés, espelho de popa e casa com tampas trianguladas), cantos redondos em todas as peças,
   e nada atravessa nada (as almofadas ficam dentro dos varandins, os varandins dentro da borda). */

export async function construirIate(THREE, RoundedBoxGeometry, cede = () => Promise.resolve()) {
  const L = 15.4, XA = -7.6, B2 = 2.36;
  const YMIN = -0.9, YMAX = 5.6;
  const ss = (a) => (a <= 0 ? 0 : a >= 1 ? 1 : a * a * (3 - 2 * a));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const tDe = (x) => clamp((x - XA) / L, 0, 1);

  /* ── Linhas do casco ─────────────────────────────────────────────────── */
  const meiaBoca = (t) => (t < 0.42 ? B2 * (0.93 + 0.07 * Math.sin((t / 0.42) * Math.PI / 2)) : B2 * Math.pow(Math.max(0, 1 - Math.pow((t - 0.42) / 0.58, 2.05)), 0.56));
  const yBorda = (t) => 1.6 + 0.58 * Math.pow(t, 2.1);
  const yQuilha = (t) => -0.72 + 1.62 * Math.pow(ss((t - 0.5) / 0.5), 1.5);
  const lanca = (t, f) => 1.5 * Math.pow(ss((t - 0.72) / 0.28), 2) * Math.pow(clamp(f, 0, 1), 1.15);
  const CAMBER = 0.08;
  const yConves = (t, z) => { const hb = Math.max(0.05, meiaBoca(t)); return yBorda(t) + CAMBER * (1 - Math.pow(clamp(z / hb, 0, 1), 2)); };

  // meia secção, da quilha (z = 0) ao centro do convés (z = 0), no sentido anti-horário; devolve os pontos e onde muda o material
  function seccao(t, suave = 0) {
    const hb = meiaBoca(t), ys = yBorda(t), yk = yQuilha(t);
    const s = Math.min(1, hb / 0.45);
    const flare = 0.07 + 0.16 * Math.pow(t, 2.2);
    const hc = Math.max(0, hb * (1 - flare) - 0.075 * s);
    const dead = 0.27 + 0.62 * Math.pow(t, 2.4);
    const yc = Math.min(yk + dead * hc, ys - 0.45);
    const p = [];
    for (let i = 0; i <= 14; i++) { const a = i / 14; p.push([hc * a, yk + (yc - yk) * a - 0.05 * (yc - yk) * Math.sin(Math.PI * a)]); }
    const cf = 1 - suave; // na aresta do espelho a quina e o filete abrem-se, para o arredondamento nunca dobrar a superfície
    p.push([hc + 0.045 * s * cf, yc + 0.006 * s * cf], [hc + 0.07 * s * cf, yc + 0.02 * s], [hc + 0.078 * s * cf, yc + 0.05 * s]);
    const rg = (0.085 + 0.07 * suave) * s, z0 = hc + 0.078 * s * cf, y0 = yc + 0.05 * s, y1 = ys - rg;
    for (let i = 1; i <= 11; i++) { const a = i / 11; p.push([z0 + (hb - z0) * (1 - Math.pow(1 - a, 1.7)), y0 + (y1 - y0) * a]); }
    for (let i = 1; i <= 6; i++) { const th = (i / 6) * Math.PI / 2; p.push([hb - rg + rg * Math.cos(th), ys - rg + rg * Math.sin(th)]); }
    const iG = p.length - 1;
    const cob = 0.13 * s;
    p.push([Math.max(0, hb - rg - cob), ys + CAMBER * (1 - Math.pow(Math.max(0, hb - rg - cob) / Math.max(hb, 0.05), 2))]);
    const iC = p.length - 1;
    const zt = Math.max(0, hb - rg - cob);
    for (let i = 1; i <= 9; i++) { const z = zt * (1 - i / 9); p.push([z, ys + CAMBER * (1 - Math.pow(z / Math.max(hb, 0.05), 2))]); }
    return { p, iG, iC, yk, ys };
  }
  // normais para dentro (lado esquerdo do sentido anti-horário)
  function paraDentro(p) {
    return p.map((q, i) => {
      const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
      let tz = b[0] - a[0], ty = b[1] - a[1]; const n = Math.hypot(tz, ty) || 1; tz /= n; ty /= n;
      return [-ty, tz];
    });
  }

  // anéis do casco: o filete do espelho de popa (cantos redondos) e depois as balizas até à proa
  const R = 0.11, K = 6, N = 150;
  const aneis = [];
  for (let k = 0; k <= K; k++) {
    const th = (k / K) * Math.PI / 2, x = XA + R * (1 - Math.cos(th)), d = R * (1 - Math.sin(th));
    const sc = seccao(tDe(x), 1 - k / K), nd = paraDentro(sc.p);
    const p = sc.p.map(([z, y], i) => (z <= 1e-6 ? [0, y + Math.sign(nd[i][1]) * d] : [Math.max(0, z + nd[i][0] * d), y + nd[i][1] * d]));
    aneis.push({ x: () => x, p, iG: sc.iG, iC: sc.iC, yk: sc.yk, ys: sc.ys, t: tDe(x) });
  }
  for (let i = 1; i <= N; i++) {
    const t = (R / L) + (1 - R / L) * Math.pow(i / N, 0.92);
    const sc = seccao(t);
    aneis.push({ p: sc.p, iG: sc.iG, iC: sc.iC, yk: sc.yk, ys: sc.ys, t });
  }
  const posAnel = (an, j) => {
    const [z, y] = an.p[j];
    const f = (y - an.yk) / Math.max(0.01, an.ys - an.yk);
    const x = an.x ? an.x() : XA + an.t * L + lanca(an.t, f);
    return [x, y, z];
  };
  const uvCasco = (x, y) => [(x - XA + 1.4) / (L + 3), (y - YMIN) / (YMAX - YMIN)];

  // superfície entre anéis, num intervalo de pontos [j0, j1], com espelho para bombordo
  function faixa(j0, j1, uvf) {
    const pos = [], uv = [], idx = [];
    const larg = j1 - j0 + 1;
    for (const lado of [1, -1]) {
      const base = pos.length / 3;
      aneis.forEach((an) => { for (let j = j0; j <= j1; j++) { const [x, y, z] = posAnel(an, j); pos.push(x, y, lado * z); uv.push(...uvf(x, y, lado * z)); } });
      for (let i = 0; i < aneis.length - 1; i++) for (let j = 0; j < larg - 1; j++) {
        const a = base + i * larg + j, b = a + larg;
        if (lado > 0) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  await cede();
  const nP = aneis[0].p.length;
  const gCasco = faixa(0, aneis[0].iG, (x, y) => uvCasco(x, y));
  const gCobertura = faixa(aneis[0].iG, aneis[0].iC, (x, y, z) => [x / 2, z / 2]);
  const gConves = faixa(aneis[0].iC, nP - 1, (x, y, z) => [x / 1.1, z / 1.1]);

  // espelho de popa: o anel 0 inteiro, triangulado (sem leques nem buracos)
  function tampa(pontos2d, xConst, uvf, normalX) {
    const contorno = pontos2d.map(([z, y]) => new THREE.Vector2(z, y));
    const tri = THREE.ShapeUtils.triangulateShape(contorno, []);
    const pos = [], uv = [], idx = [];
    pontos2d.forEach(([z, y]) => { pos.push(xConst, y, z); uv.push(...uvf(z, y)); });
    tri.forEach(([a, b, c]) => {
      const [, ya, za] = [0, pontos2d[a][1], pontos2d[a][0]], [, yb, zb] = [0, pontos2d[b][1], pontos2d[b][0]], [, yc, zc] = [0, pontos2d[c][1], pontos2d[c][0]];
      const nx = (yb - ya) * (zc - za) - (zb - za) * (yc - ya);
      if (Math.sign(nx) === Math.sign(normalX)) idx.push(a, b, c); else idx.push(a, c, b);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  const a0 = aneis[0].p;
  const contornoPopa = [...a0.map(([z, y]) => [z, y]), ...a0.slice(1, -1).reverse().map(([z, y]) => [-z, y])];
  const gEspelho = tampa(contornoPopa, XA, (z, y) => uvCasco(XA - 1.2, y), -1);

  await cede();
  /* ── Casa (salão e timoneira): secções de cantos redondos, nariz redondo, popa com portas de vidro ── */
  const CX0 = -4.7, CX1 = 3.5, TECTO = 3.32, RRA = 0.42, RRF = 1.15;
  const tecto = (x) => { const y0 = yBorda(tDe(x)) + 0.02; return x < 0.2 ? TECTO : TECTO - (TECTO - (y0 + 0.5)) * ss((x - 0.2) / (CX1 - 0.2)); };
  const larguraBase = (x) => {
    let w = meiaBoca(tDe(x)) - 0.64;
    if (x < CX0 + RRA) { const a = (CX0 + RRA - x) / RRA; w = (w - RRA) + RRA * Math.sqrt(Math.max(0, 1 - a * a)); }
    if (x > CX1 - RRF) { const a = (x - (CX1 - RRF)) / RRF; w = w * Math.sqrt(Math.max(0, 1 - a * a)); }
    return Math.max(0, w);
  };
  function seccaoCasa(x) {
    const y0 = yBorda(tDe(x)) - 0.02, y1 = tecto(x), wb = larguraBase(x);
    const wt = Math.max(0, wb - 0.16 * Math.min(1, wb / 0.6));
    const r = Math.min(0.3, (y1 - y0) * 0.35, wt * 0.5);
    const p = [];
    for (let i = 0; i <= 4; i++) { const a = i / 4; p.push([wb + (wt - wb) * a, y0 + (y1 - r - y0) * a]); }
    for (let i = 1; i <= 8; i++) { const th = (i / 8) * Math.PI / 2; p.push([wt - r + r * Math.cos(th), y1 - r + r * Math.sin(th)]); }
    const zt = Math.max(0, wt - r);
    for (let i = 1; i <= 5; i++) { const z = zt * (1 - i / 5); p.push([z, y1 + 0.04 * (1 - Math.pow(z / Math.max(zt, 0.01), 2))]); }
    return p;
  }
  const NC = 90, xsCasa = [];
  for (let i = 0; i <= NC; i++) { const a = i / NC; xsCasa.push(CX0 + (CX1 - CX0) * (a < 0.5 ? 2 * a * a : 1 - Math.pow(-2 * a + 2, 2) / 2) ); }
  const uvCasa = (x, y) => uvCasco(x, y);
  function malhaCasa() {
    const secs = xsCasa.map((x) => ({ x, p: seccaoCasa(x) }));
    const n = secs[0].p.length, pos = [], uv = [], idx = [];
    for (const lado of [1, -1]) {
      const base = pos.length / 3;
      secs.forEach(({ x, p }) => p.forEach(([z, y]) => { pos.push(x, y, lado * z); uv.push(...uvCasa(x, y)); }));
      for (let i = 0; i < secs.length - 1; i++) for (let j = 0; j < n - 1; j++) {
        const a = base + i * n + j, b = a + n;
        if (lado > 0) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  const gCasa = malhaCasa();
  const p0 = seccaoCasa(CX0);
  const contornoRe = [...p0, ...p0.slice(0, -1).reverse().map(([z, y]) => [-z, y])];
  const wRe = p0[0][0], yRe0 = p0[0][1], yRe1 = TECTO;
  const gRe = tampa(contornoRe, CX0, (z, y) => [(z + wRe) / (2 * wRe), (y - yRe0) / (yRe1 + 0.05 - yRe0)], -1);

  await cede();
  /* ── Materiais e texturas pintadas em código ─────────────────────────── */
  const W = 2048, H = 640;
  const px = (x) => uvCasco(x, 0)[0] * W, py = (y) => H - ((y - YMIN) / (YMAX - YMIN)) * H;
  const cv = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  const cvCasco = cv(W, H), cvCasa = cv(W, H), cvRe = cv(512, 256), cvTeca = cv(1024, 1024);
  const tex = (c, rep) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const tCasco = tex(cvCasco), tCasa = tex(cvCasa), tRe = tex(cvRe), tTeca = tex(cvTeca, true), tTecaP = tex(cvTeca, true);
  tTecaP.repeat.set(1, 3);
  const GEL = 0xF2F0EA;
  const mat = {
    casco: new THREE.MeshPhysicalMaterial({ map: tCasco, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide }),
    gel: new THREE.MeshPhysicalMaterial({ color: GEL, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.1 }),
    casa: new THREE.MeshPhysicalMaterial({ map: tCasa, roughness: 0.24, clearcoat: 0.9, clearcoatRoughness: 0.06, side: THREE.DoubleSide }),
    re: new THREE.MeshPhysicalMaterial({ map: tRe, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide }),
    teca: new THREE.MeshStandardMaterial({ map: tTeca, roughness: 0.8, side: THREE.DoubleSide }),
    tecaP: new THREE.MeshStandardMaterial({ map: tTecaP, roughness: 0.8 }),
    inox: new THREE.MeshStandardMaterial({ color: 0xE6EAEE, roughness: 0.16, metalness: 1 }),
    vidro: new THREE.MeshPhysicalMaterial({ color: 0x0C1422, roughness: 0.04, metalness: 0.3, clearcoat: 1 }),
    topo: new THREE.MeshPhysicalMaterial({ color: 0xF4F2EC, roughness: 0.28, clearcoat: 0.8 }),
    estofo: new THREE.MeshStandardMaterial({ color: 0xEDE5D6, roughness: 0.95 }),
    escuro: new THREE.MeshStandardMaterial({ color: 0x1C2230, roughness: 0.5, metalness: 0.2 }),
    luz: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xFFE7B0, emissiveIntensity: 0 }),
  };

  function pintarCasco(cor, faixaCor) {
    const c = cvCasco.getContext("2d");
    c.fillStyle = cor; c.fillRect(0, 0, W, H);
    c.fillStyle = "#18202E"; c.fillRect(0, py(0), W, H - py(0));          // anti-incrustante
    c.fillStyle = faixaCor; c.fillRect(0, py(0.17), W, py(0) - py(0.17));  // faixa de flutuação
    c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(0, py(0.17), W, 1.5);
    // filete que acompanha a borda
    c.strokeStyle = faixaCor; c.lineWidth = 3.5; c.beginPath();
    for (let i = 0; i <= 200; i++) { const t = i / 200, x = XA - 1.4 + (L + 3) * t, yy = yBorda(tDe(x)) - 0.26; i ? c.lineTo(px(x), py(yy)) : c.moveTo(px(x), py(yy)); }
    c.stroke();
    // janelas do casco: três vigias compridas de cantos redondos, com aro e reflexo
    [[-2.2, -0.4], [0.0, 1.6], [2.1, 3.3]].forEach(([a, b]) => {
      const yb = 0.98 + 0.05 * (a + 2.2), alt = 0.22;
      const x0 = px(a), x1 = px(b), y0 = py(yb + alt), y1 = py(yb), r = (y1 - y0) / 2;
      c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.roundRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4, r + 2); c.fill();
      const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, "#2A3A55"); g.addColorStop(0.45, "#0B1220"); g.addColorStop(1, "#060A12");
      c.fillStyle = g; c.beginPath(); c.roundRect(x0, y0, x1 - x0, y1 - y0, r); c.fill();
    });
    tCasco.needsUpdate = true;
  }
  function pintarCasa(noite) {
    const c = cvCasa.getContext("2d");
    c.fillStyle = "#F2F0EA"; c.fillRect(0, 0, W, H);
    const g = c.createLinearGradient(0, py(3.4), 0, py(2.2));
    if (noite) { g.addColorStop(0, "#5A4120"); g.addColorStop(0.5, "#C9944E"); g.addColorStop(1, "#6B4A22"); }
    else { g.addColorStop(0, "#26354F"); g.addColorStop(0.32, "#0E1726"); g.addColorStop(1, "#070C16"); }
    c.fillStyle = g;
    // faixa de vidro, coluna a coluna, com pontas redondas e o para-brisas inteiro
    for (let xx = Math.floor(px(CX0 + 0.25)); xx <= Math.ceil(px(CX1)); xx++) {
      const x = XA - 1.4 + (xx / W) * (L + 3);
      const y0 = yBorda(tDe(x)), yT = tecto(x);
      const bl = ss((x + 0.2) / 0.8); // passagem suave do vidro lateral para o para-brisas
      let yb = y0 + 0.62 - 0.1 * bl, yt = yT - 0.26 + 0.19 * bl;
      const a = (x - (CX0 + 0.25)) / 0.3;
      if (a < 1) { const h = (yt - yb) / 2, enc = h * (1 - Math.sqrt(Math.max(0, 1 - Math.pow(1 - a, 2)))); yb += enc; yt -= enc; }
      if (yt > yb) c.fillRect(xx, py(yt), 1.2, py(yb) - py(yt));
    }
    // montantes e um friso de inox por cima do vidro
    c.fillStyle = "#F2F0EA";
    [-3.3, -1.9, -0.5].forEach((x) => c.fillRect(px(x), py(3.2), 5, py(1.9) - py(3.2)));
    c.fillStyle = "rgba(255,255,255,.65)";
    tCasa.needsUpdate = true;
  }
  function pintarRe(noite) {
    const c = cvRe.getContext("2d"), w = 512, h = 256;
    c.fillStyle = "#F2F0EA"; c.fillRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 30, 0, 230);
    if (noite) { g.addColorStop(0, "#6B4E26"); g.addColorStop(1, "#C9944E"); } else { g.addColorStop(0, "#22314A"); g.addColorStop(1, "#070C16"); }
    c.fillStyle = g; c.beginPath(); c.roundRect(48, 28, w - 96, 186, 10); c.fill();
    c.fillStyle = "#D9DEE4"; [w / 2 - 3, w / 2 - 92, w / 2 + 86].forEach((x) => c.fillRect(x, 28, 6, 186));
    c.fillStyle = "rgba(255,255,255,.12)"; c.beginPath(); c.moveTo(60, 214); c.lineTo(170, 28); c.lineTo(230, 28); c.lineTo(120, 214); c.fill();
    tRe.needsUpdate = true;
  }
  function pintarTeca(base, junta) {
    const c = cvTeca.getContext("2d"), S = 1024, tabuas = 16;
    for (let i = 0; i < tabuas; i++) {
      const y = (i * S) / tabuas, tom = (i * 37) % 7 - 3;
      c.fillStyle = base; c.fillRect(0, y, S, S / tabuas);
      c.fillStyle = `rgba(${tom > 0 ? "255,255,255" : "0,0,0"},${Math.abs(tom) * 0.012})`; c.fillRect(0, y, S, S / tabuas);
      for (let k = 0; k < 26; k++) { c.fillStyle = `rgba(0,0,0,${0.02 + ((k * 13 + i * 7) % 5) * 0.008})`; c.fillRect(((k * 97 + i * 211) % S), y + 3, 40 + ((k * 31) % 120), 1.2); }
    }
    c.fillStyle = junta; for (let i = 0; i < tabuas; i++) c.fillRect(0, (i * S) / tabuas, S, 3.2);
    tTeca.needsUpdate = true; tTecaP.needsUpdate = true;
  }

  /* ── Montagem ─────────────────────────────────────────────────────────── */
  const grupo = new THREE.Group();
  const mesh = (g, m, sombra = true) => { const o = new THREE.Mesh(g, m); o.castShadow = sombra; o.receiveShadow = true; grupo.add(o); return o; };
  mesh(gCasco, mat.casco); mesh(gEspelho, mat.casco);
  mesh(gCobertura, mat.gel); mesh(gConves, mat.teca);
  mesh(gCasa, mat.casa); mesh(gRe, mat.re);

  const caixa = (w, h, d, r, m, x, y, z, rz = 0, ry = 0) => {
    const o = mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), m);
    o.position.set(x, y, z); o.rotation.set(0, ry, rz); return o;
  };
  const tubo = (pts, r, m, seg = 120) => { const cu = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "centripetal"); const o = mesh(new THREE.TubeGeometry(cu, seg, r, 10), m); return o; };
  const ponta = (p, r, m) => { const o = mesh(new THREE.SphereGeometry(r, 12, 10), m); o.position.set(...p); };
  const haste = (a, b, r, m) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va);
    const o = mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), m);
    o.position.copy(va.clone().add(vb).multiplyScalar(0.5)); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o;
  };
  const perna = (a, b, w, d, m) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), dir = vb.clone().sub(va);
    const o = mesh(new RoundedBoxGeometry(w, dir.length(), d, 4, Math.min(w, d) * 0.45), m);
    o.position.copy(va.clone().add(vb).multiplyScalar(0.5)); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); return o;
  };
  const xBorda = (t) => XA + t * L + lanca(t, 1);

  await cede();
  // verdugo de inox ao longo do costado
  [1, -1].forEach((lado) => {
    const pts = [];
    for (let i = 0; i <= 80; i++) { const t = 0.015 + 0.955 * (i / 80), yy = yBorda(t) - 0.13; const f = (yy - yQuilha(t)) / (yBorda(t) - yQuilha(t)); pts.push([XA + t * L + lanca(t, f), yy, lado * (meiaBoca(t) * (1 - 0.0) + 0.012)]); }
    tubo(pts, 0.032, mat.inox, 200); ponta(pts[0], 0.032, mat.inox); ponta(pts[pts.length - 1], 0.032, mat.inox);
  });

  // varandim: corre pelos dois bordos e fecha na proa (púlpito), sempre por dentro da borda; dois tubos e balaústres
  const tA = tDe(CX0 + 0.35), DENTRO = 0.15;
  const linhaVarandim = (alt) => {
    const pts = [];
    for (let i = 0; i <= 40; i++) { const t = tA + (0.975 - tA) * (i / 40); pts.push([xBorda(t), yBorda(t) + alt, Math.max(0.02, meiaBoca(t) - DENTRO)]); }
    const tip = pts[pts.length - 1];
    const pulpito = [[tip[0] + 0.12, tip[1], tip[2] * 0.5], [tip[0] + 0.16, tip[1], 0]];
    const est = [...pts, ...pulpito];
    const bb = est.slice(0, -1).reverse().map(([x, y, z]) => [x, y, -z]);
    return [...est, ...bb];
  };
  tubo(linhaVarandim(0.68), 0.022, mat.inox, 300); tubo(linhaVarandim(0.36), 0.012, mat.inox, 300);
  [1, -1].forEach((lado) => {
    const ends = linhaVarandim(0.68); ponta(ends[0], 0.024, mat.inox); ponta(ends[ends.length - 1], 0.024, mat.inox);
    for (let i = 0; i <= 11; i++) {
      const t = tA + (0.96 - tA) * (i / 11), x = xBorda(t), z = lado * Math.max(0.02, meiaBoca(t) - DENTRO), y = yConves(t, Math.abs(z));
      haste([x, y - 0.02, z], [x, yBorda(t) + 0.68, z], 0.013, mat.inox);
    }
  });

  await cede();
  // cockpit: banco de popa com estofos e encosto, mesa
  const yPopa = yConves(0.02, 0);
  caixa(0.62, 0.42, 3.3, 0.06, mat.gel, XA + 0.52, yPopa + 0.15, 0);
  caixa(0.58, 0.13, 3.22, 0.06, mat.estofo, XA + 0.52, yPopa + 0.44, 0);
  caixa(0.16, 0.42, 3.22, 0.07, mat.estofo, XA + 0.3, yPopa + 0.68, 0, -0.18);
  caixa(1.05, 0.05, 0.72, 0.025, mat.tecaP, -6.0, yPopa + 0.74, 0);
  haste([-6.0, yPopa, 0], [-6.0, yPopa + 0.72, 0], 0.045, mat.inox);

  // plataforma de banho: base branca de cantos redondos com teca por cima, encostada ao espelho
  const hb0 = meiaBoca(0) * 0.92;
  caixa(1.16, 0.22, hb0 * 2, 0.06, mat.gel, XA - 0.56, 0.4, 0);
  caixa(1.06, 0.04, hb0 * 2 - 0.1, 0.02, mat.tecaP, XA - 0.56, 0.52, 0);
  // escada de banho em inox
  haste([XA - 1.05, 0.53, 0.55], [XA - 1.05, 0.05, 0.55], 0.015, mat.inox); haste([XA - 1.05, 0.53, 0.85], [XA - 1.05, 0.05, 0.85], 0.015, mat.inox);
  [0.38, 0.22].forEach((yy) => haste([XA - 1.05, yy, 0.55], [XA - 1.05, yy, 0.85], 0.013, mat.inox));

  // solário de proa: base e dois estofos, inclinados com o convés, longe dos varandins
  const xs = 4.75, ts = tDe(xs), ang = Math.atan2(yBorda(tDe(5.7)) - yBorda(tDe(3.8)), 1.9);
  caixa(1.95, 0.16, 1.5, 0.05, mat.gel, xs, yConves(ts, 0) + 0.03, 0, ang);
  caixa(0.95, 0.14, 1.44, 0.065, mat.estofo, xs - 0.49, yConves(ts, 0) + 0.15 - 0.03, 0, ang);
  caixa(0.95, 0.14, 1.44, 0.065, mat.estofo, xs + 0.49, yConves(ts, 0) + 0.15 + 0.03, 0, ang);
  // molinete e ferro
  caixa(0.32, 0.16, 0.28, 0.05, mat.inox, 6.55, yConves(tDe(6.55), 0) + 0.06, 0);
  caixa(0.5, 0.07, 0.14, 0.03, mat.inox, xBorda(0.995) - 0.1, yBorda(0.995) - 0.02, 0, -0.35);

  await cede();
  // flybridge: consola com para-brisas fumado, leme, banco do timoneiro, sofá em L, mesa, varandins
  const YF = TECTO - 0.01;
  caixa(1.3, 0.5, 2.9, 0.09, mat.gel, -0.36, YF + 0.24, 0);
  caixa(1.22, 0.04, 2.78, 0.02, mat.escuro, -0.4, YF + 0.5, 0);
  caixa(0.04, 0.3, 2.7, 0.015, mat.vidro, 0.2, YF + 0.62, 0, -0.62);
  caixa(0.62, 0.42, 0.95, 0.1, mat.gel, -1.32, YF + 0.21, 0.55);
  caixa(0.3, 0.05, 0.6, 0.02, mat.escuro, -1.2, YF + 0.46, 0.55, -0.6);
  const volante = mesh(new THREE.TorusGeometry(0.17, 0.016, 10, 32), mat.inox);
  volante.position.set(-1.72, YF + 0.6, 0.55); volante.rotation.set(0, Math.PI / 2, 0); volante.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -0.45);
  haste([-1.64, YF + 0.42, 0.55], [-1.72, YF + 0.6, 0.55], 0.018, mat.inox);
  caixa(0.58, 0.16, 1.1, 0.06, mat.estofo, -2.15, YF + 0.32, 0.5);
  caixa(0.14, 0.42, 1.1, 0.06, mat.estofo, -2.42, YF + 0.56, 0.5, 0.15);
  caixa(1.6, 0.36, 0.52, 0.08, mat.gel, -3.3, YF + 0.18, -0.75);
  caixa(1.54, 0.13, 0.48, 0.06, mat.estofo, -3.3, YF + 0.42, -0.75);
  caixa(0.52, 0.36, 1.2, 0.08, mat.gel, -3.85, YF + 0.18, -0.15);
  caixa(0.48, 0.13, 1.14, 0.06, mat.estofo, -3.85, YF + 0.42, -0.15);
  caixa(0.9, 0.05, 0.6, 0.025, mat.tecaP, -3.0, YF + 0.7, -0.15);
  haste([-3.0, YF, -0.15], [-3.0, YF + 0.68, -0.15], 0.04, mat.inox);
  [1, -1].forEach((lado) => {
    const zz = lado * 1.15;
    const pts = [[-4.2, YF + 0.85, zz], [-3.0, YF + 0.85, zz], [-1.8, YF + 0.85, zz], [-1.05, YF + 0.85, zz * 0.98]];
    tubo(pts, 0.02, mat.inox, 60); ponta(pts[0], 0.022, mat.inox); ponta(pts[pts.length - 1], 0.022, mat.inox);
    [-4.2, -3.2, -2.2, -1.2].forEach((x) => haste([x, YF - 0.02, zz], [x, YF + 0.85, zz], 0.012, mat.inox));
  });

  // hardtop sobre um arco: pernas de ré inclinadas, pernas de vante finas; radar, antena aberta e mastro
  const forma = new THREE.Shape();
  const hx0 = -4.05, hx1 = 0.85, hw = 1.72, r = 0.55;
  forma.moveTo(hx0 + r, -hw); forma.lineTo(hx1 - r, -hw); forma.quadraticCurveTo(hx1 + 0.45, -hw, hx1 + 0.45, 0);
  forma.quadraticCurveTo(hx1 + 0.45, hw, hx1 - r, hw); forma.lineTo(hx0 + r, hw); forma.quadraticCurveTo(hx0, hw, hx0, hw - r);
  forma.lineTo(hx0, -hw + r); forma.quadraticCurveTo(hx0, -hw, hx0 + r, -hw);
  const gTopo = new THREE.ExtrudeGeometry(forma, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.06, bevelSegments: 5, curveSegments: 24 });
  gTopo.rotateX(-Math.PI / 2);
  const YT = 4.5;
  const topo = mesh(gTopo, mat.topo); topo.position.y = YT;
  [1, -1].forEach((lado) => {
    perna([-3.75, YF - 0.02, lado * 1.26], [-3.3, YT + 0.02, lado * 1.4], 0.14, 0.34, mat.topo);
    perna([0.12, YF + 0.5, lado * 1.05], [0.55, YT + 0.02, lado * 1.15], 0.06, 0.08, mat.topo);
  });
  const radar = mesh(new THREE.SphereGeometry(0.34, 32, 20), mat.gel); radar.scale.y = 0.55; radar.position.set(-1.4, YT + 0.27, 0);
  caixa(0.12, 0.08, 1.3, 0.035, mat.gel, -2.75, YT + 0.36, 0);
  haste([-2.75, YT + 0.08, 0], [-2.75, YT + 0.32, 0], 0.05, mat.gel);
  haste([-3.55, YT + 0.08, 0], [-3.55, YT + 0.95, 0], 0.025, mat.inox);
  const lanterna = mesh(new THREE.SphereGeometry(0.045, 12, 10), mat.luz); lanterna.position.set(-3.55, YT + 0.98, 0);
  [[-3.35, 0.35], [-3.35, -0.35]].forEach(([x, z]) => haste([x, YT + 0.08, z], [x, YT + 1.25, z], 0.011, mat.gel));

  return {
    grupo, mat,
    medidas: { L, XA, comprimento: L + 1.16 + 1.5, quilha: yQuilha(0), topo: YT + 1.25 },
    pintar({ hull, stripe, deck, top, noite }) {
      pintarCasco(hull, stripe);
      pintarCasa(noite);
      pintarRe(noite);
      pintarTeca(deck[0], deck[1]);
      mat.topo.color.set(top);
      mat.luz.emissiveIntensity = noite ? 2.2 : 0;
    },
  };
}
