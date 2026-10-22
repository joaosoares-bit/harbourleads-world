/* Configurador 3D da landing: um iate de conceito (52 pés, flybridge) desenhado em código.
   Não há ficheiro de modelo na página (nada para copiar). Regras do livro das falhas: desenho só quando mexe,
   compileAsync antes do primeiro fotograma, toque de lado roda e na vertical a página anda, nada preso. */
import * as THREE from "./vendor/three.module.min.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

const L = 15.6, B = 4.7, XA = -L / 2;
const YMIN = -0.9, YMAX = 4.9;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const tDe = (x) => clamp((x - XA) / L, 0, 1);

/* ── As linhas do casco ───────────────────────────────────────────────── */
const meiaBoca = (t) => {
  if (t < 0.48) return (B / 2) * (0.9 + 0.1 * Math.sin((t / 0.48) * Math.PI / 2));
  const s = (t - 0.48) / 0.52;
  return (B / 2) * Math.pow(Math.max(0, 1 - Math.pow(s, 2.25)), 0.6);
};
const yBorda = (t) => 1.55 + 0.52 * Math.pow(t, 2.3);
const yQuilha = (t) => -0.66 + (t > 0.6 ? 1.35 * Math.pow((t - 0.6) / 0.4, 2.3) : 0);
const lancamento = (t, f) => 1.05 * Math.pow(t, 7) * f; // a proa avança em cima (roda de proa inclinada)
function seccao(t, u) {
  const h = meiaBoca(t), yk = yQuilha(t), ys = yBorda(t);
  const yc = Math.min(yk + 0.4 * h * 0.86 + 0.25 * Math.pow(t, 3), ys - 0.25);
  let z, y;
  if (u < 0.42) { const a = u / 0.42; z = h * 0.86 * a; y = yk + (yc - yk) * Math.pow(a, 1.08); }
  else { const a = (u - 0.42) / 0.58; z = h * (0.86 + 0.14 * Math.sin(a * Math.PI / 2)); y = yc + (ys - yc) * a; }
  return [z, y, (y - yk) / Math.max(0.01, ys - yk)];
}

function casco() {
  const N = 72, M = 22, pos = [], uv = [], idx = [];
  const larg = 2 * M + 1;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    for (let j = -M; j <= M; j++) {
      const [z, y, f] = seccao(t, Math.abs(j) / M);
      const x = XA + t * L + lancamento(t, f);
      pos.push(x, y, Math.sign(j) * z);
      uv.push((x - XA) / (L + 1.2), (y - YMIN) / (YMAX - YMIN));
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < larg - 1; j++) {
    const a = i * larg + j, b = a + larg;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function espelho() { // painel de popa: leque a partir do centro da secção 0
  const M = 22, pos = [], uv = [], idx = [];
  const yk = yQuilha(0), ys = yBorda(0);
  pos.push(XA, (yk + ys) / 2, 0); uv.push(0, ((yk + ys) / 2 - YMIN) / (YMAX - YMIN));
  for (let j = -M; j <= M; j++) { const [z, y] = seccao(0, Math.abs(j) / M); pos.push(XA, y, Math.sign(j) * z); uv.push(0.001, (y - YMIN) / (YMAX - YMIN)); }
  for (let j = 1; j < 2 * M + 1; j++) idx.push(0, j + 1, j);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function convés() { // superfície entre as duas bordas, com abaulamento ao centro
  const N = 72, K = 10, pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, h = meiaBoca(t) * 0.995, ys = yBorda(t), x = XA + t * L + lancamento(t, 1);
    for (let k = -K; k <= K; k++) {
      const z = (k / K) * h;
      pos.push(x, ys + 0.07 * (1 - Math.pow(k / K, 2)), z);
      uv.push(x / 1.6, z / 1.6);
    }
  }
  const larg = 2 * K + 1;
  for (let i = 0; i < N; i++) for (let k = 0; k < larg - 1; k++) { const a = i * larg + k, b = a + larg; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/* casa: secções arredondadas da popa à proa, tecto que desce no para-brisas */
const CX0 = -5.7, CX1 = 3.7;
function casa() {
  const N = 48, pos = [], uv = [], idx = [];
  const perfil = (x) => {
    const t = tDe(x), y0 = yBorda(t) + 0.02;
    const w = Math.max(0.25, meiaBoca(t) - 0.5);
    const tecto = 3.25;
    const y1 = x < 0.6 ? tecto : tecto - (tecto - y0 - 0.25) * Math.pow((x - 0.6) / (CX1 - 0.6), 1.15);
    return { y0, y1, w };
  };
  const meio = (x) => {
    const { y0, y1, w } = perfil(x), alt = y1 - y0, r = Math.min(0.24, alt * 0.4);
    return [[w, y0], [w * 0.985, y0 + alt * 0.45], [w * 0.92, y1 - r], [w * 0.92 - r * 0.3, y1 - r * 0.3], [w * 0.92 - r, y1], [w * 0.45, y1 + 0.03], [0, y1 + 0.04]];
  };
  const P = 7, larg = 2 * P - 1;
  for (let i = 0; i <= N; i++) {
    const x = CX0 + (i / N) * (CX1 - CX0), m = meio(x);
    const anel = [...m.map(([z, y]) => [z, y]), ...m.slice(0, -1).reverse().map(([z, y]) => [-z, y])];
    anel.forEach(([z, y]) => { pos.push(x, y, z); uv.push((x - XA) / (L + 1.2), (y - YMIN) / (YMAX - YMIN)); });
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < larg - 1; j++) { const a = i * larg + j, b = a + larg; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  // anteparo de ré: vidro do salão
  const m0 = meio(CX0), anel0 = [...m0, ...m0.slice(0, -1).reverse().map(([z, y]) => [-z, y])];
  const pa = [CX0 - 0.001, (m0[0][1] + m0[6][1]) / 2, 0];
  anel0.forEach(([z, y]) => pa.push(CX0 - 0.001, y, z));
  const ia = []; for (let j = 1; j < anel0.length; j++) ia.push(0, j, j + 1);
  const ga = new THREE.BufferGeometry();
  ga.setAttribute("position", new THREE.Float32BufferAttribute(pa, 3)); ga.setIndex(ia); ga.computeVertexNormals();
  const m1 = meio(CX1), anel1 = [...m1, ...m1.slice(0, -1).reverse().map(([z, y]) => [-z, y])];
  const pf = [CX1 + 0.001, (m1[0][1] + m1[6][1]) / 2, 0], uf = [(CX1 - XA) / (L + 1.2), ((m1[0][1] + m1[6][1]) / 2 - YMIN) / (YMAX - YMIN)];
  anel1.forEach(([z, y]) => { pf.push(CX1 + 0.001, y, z); uf.push((CX1 - XA) / (L + 1.2), (y - YMIN) / (YMAX - YMIN)); });
  const ifr = []; for (let j = 1; j < anel1.length; j++) ifr.push(0, j + 1, j);
  const gf = new THREE.BufferGeometry();
  gf.setAttribute("position", new THREE.Float32BufferAttribute(pf, 3)); gf.setAttribute("uv", new THREE.Float32BufferAttribute(uf, 2)); gf.setIndex(ifr); gf.computeVertexNormals();
  return { g, ga, gf, perfil };
}

/* ── Texturas pintadas em código: casco, casa e teca ────────────────────── */
const W = 2048, Hh = 512;
const px = (x) => ((x - XA) / (L + 1.2)) * W;
const py = (y) => Hh - ((y - YMIN) / (YMAX - YMIN)) * Hh;
function texCasco(cv, cor, faixa) {
  const c = cv.getContext("2d");
  c.fillStyle = cor; c.fillRect(0, 0, W, Hh);
  c.fillStyle = "#1A2130"; c.fillRect(0, py(0.0), W, Hh); // anti-incrustante
  c.fillStyle = faixa; c.fillRect(0, py(0.2), W, py(0.0) - py(0.2)); // faixa de flutuação
  // filete fino que segue a borda
  c.strokeStyle = faixa; c.lineWidth = 3; c.beginPath();
  for (let i = 0; i <= 100; i++) { const t = i / 100, x = XA + t * L; const y = yBorda(t) - 0.2; i ? c.lineTo(px(x), py(y)) : c.moveTo(px(x), py(y)); }
  c.stroke();
  // janelas do casco: três vigias compridas a meio
  c.fillStyle = "#0B1220";
  [[-1.6, 0.0], [0.5, 1.9], [2.3, 3.4]].forEach(([a, b]) => {
    const ya = 1.02 + 0.03 * (a + 2), alt = 0.2;
    const r = 10, x0 = px(a), x1 = px(b), y0 = py(ya + alt), y1 = py(ya);
    c.beginPath(); c.roundRect(x0, y0, x1 - x0, y1 - y0, r); c.fill();
  });
  return cv;
}
function texCasa(cv, cor, noite) {
  const c = cv.getContext("2d");
  c.fillStyle = cor; c.fillRect(0, 0, W, Hh);
  const g = c.createLinearGradient(0, py(3.0), 0, py(2.2));
  if (noite) { g.addColorStop(0, "#3A2B16"); g.addColorStop(0.5, "#8A6332"); g.addColorStop(1, "#4A3218"); }
  else { g.addColorStop(0, "#0A111D"); g.addColorStop(0.55, "#1E2C44"); g.addColorStop(1, "#0A111D"); }
  c.fillStyle = g; c.fillRect(px(CX0 - 0.2), py(3.0), px(CX1 + 0.5) - px(CX0 - 0.2), py(2.2) - py(3.0));
  c.fillStyle = cor; // montantes
  [-4.2, -2.6, -1.0, 0.7].forEach((x) => c.fillRect(px(x), py(3.0), 7, py(2.2) - py(3.0)));
  return cv;
}
function texTeca(cv, base, junta) {
  const c = cv.getContext("2d"), S = cv.width;
  c.fillStyle = base; c.fillRect(0, 0, S, S);
  for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(${Math.random() < 0.5 ? "255,255,255" : "0,0,0"},${0.025 + Math.random() * 0.03})`; c.fillRect(Math.random() * S, 0, 1 + Math.random() * 3, S); }
  c.fillStyle = junta;
  for (let y = 0; y < S; y += S / 12) c.fillRect(0, y, S, 2.2);
  return cv;
}

const CORES = {
  hull: { pearl: "#EEEAE1", navy: "#152541", graphite: "#3B4048", champagne: "#C9B48A" },
  stripe: { gold: "#C9A45C", silver: "#BFC6CF", black: "#16181C", red: "#8E1E22" },
  deck: { teak: ["#A0703F", "#2B1D12"], grey: ["#8D8C86", "#3A3A38"], ivory: ["#E3DCCB", "#BDB4A0"] },
  top: { white: "#F4F2EC", black: "#1A1C20" },
};
const NOMES = {
  hull: { pearl: "Pearl white hull", navy: "Midnight navy hull", graphite: "Graphite hull", champagne: "Champagne hull" },
  stripe: { gold: "gold stripe", silver: "silver stripe", black: "black stripe", red: "regatta red stripe" },
  deck: { teak: "teak deck", grey: "grey teak deck", ivory: "ivory deck" },
  top: { white: "white hardtop", black: "black hardtop" },
  scene: { studio: "studio", sunset: "sunset", night: "night" },
};

export async function iniciar(palco, form) {
  const canvas = palco.querySelector("canvas");
  const estado = palco.querySelector("[data-p3-estado]");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const cena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camara = new THREE.PerspectiveCamera(28, 1, 0.5, 200);
  const sol = new THREE.DirectionalLight(0xffffff, 1.6); sol.position.set(8, 14, 10); cena.add(sol);
  const ceu = new THREE.HemisphereLight(0xffffff, 0x445066, 0.4); cena.add(ceu);
  const iate = new THREE.Group(); cena.add(iate);

  // materiais
  const cvCasco = document.createElement("canvas"); cvCasco.width = W; cvCasco.height = Hh;
  const cvCasa = document.createElement("canvas"); cvCasa.width = W; cvCasa.height = Hh;
  const cvTeca = document.createElement("canvas"); cvTeca.width = cvTeca.height = 512;
  const tCasco = new THREE.CanvasTexture(cvCasco), tCasa = new THREE.CanvasTexture(cvCasa), tTeca = new THREE.CanvasTexture(cvTeca);
  [tCasco, tCasa, tTeca].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });
  tTeca.wrapS = tTeca.wrapT = THREE.RepeatWrapping;
  const mCasco = new THREE.MeshPhysicalMaterial({ map: tCasco, roughness: 0.28, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide });
  const mCasa = new THREE.MeshPhysicalMaterial({ map: tCasa, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.12, side: THREE.DoubleSide });
  const mTeca = new THREE.MeshStandardMaterial({ map: tTeca, roughness: 0.75 });
  const mVidro = new THREE.MeshPhysicalMaterial({ color: 0x0B1220, roughness: 0.05, metalness: 0.2, clearcoat: 1, side: THREE.DoubleSide });
  const mInox = new THREE.MeshStandardMaterial({ color: 0xE8ECF0, roughness: 0.18, metalness: 1 });
  const mTopo = new THREE.MeshPhysicalMaterial({ color: 0xF4F2EC, roughness: 0.3, clearcoat: 0.8 });
  const mBranco = new THREE.MeshPhysicalMaterial({ color: 0xF1EEE7, roughness: 0.35, clearcoat: 0.5 });

  iate.add(new THREE.Mesh(casco(), mCasco));
  iate.add(new THREE.Mesh(espelho(), mCasco));
  iate.add(new THREE.Mesh(convés(), mTeca));
  const { g: gCasa, ga: gRe, gf: gFrente } = casa();
  iate.add(new THREE.Mesh(gCasa, mCasa));
  iate.add(new THREE.Mesh(gFrente, mCasa));
  iate.add(new THREE.Mesh(gRe, mVidro));

  // plataforma de banho na popa
  const hb0 = meiaBoca(0);
  const plat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.14, hb0 * 1.8), mTeca);
  plat.position.set(XA - 0.5, 0.42, 0); iate.add(plat);
  const platBase = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.18, hb0 * 1.8), mBranco);
  platBase.position.set(XA - 0.5, 0.27, 0); iate.add(platBase);

  // capa de borda em inox ao longo das duas bordas
  const borda = (lado, t0 = 0, t1 = 1, alt = 0, dentro = 0) => {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const t = t0 + (t1 - t0) * (i / 60), h = meiaBoca(t);
      pts.push(new THREE.Vector3(XA + t * L + lancamento(t, 1), yBorda(t) + alt, lado * Math.max(0, h - dentro)));
    }
    return new THREE.CatmullRomCurve3(pts);
  };
  [1, -1].forEach((lado) => iate.add(new THREE.Mesh(new THREE.TubeGeometry(borda(lado), 120, 0.035, 8), mInox)));
  // varandim de proa: tubo a 0,62 m, por dentro da borda, e balaústres
  [1, -1].forEach((lado) => {
    const curva = borda(lado, 0.56, 0.985, 0.62, 0.14);
    iate.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 80, 0.022, 8), mInox));
    for (let i = 0; i <= 6; i++) {
      const t = 0.56 + (0.985 - 0.56) * (i / 6), h = Math.max(0, meiaBoca(t) - 0.14);
      const x = XA + t * L + lancamento(t, 1);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.62, 6), mInox);
      b.position.set(x, yBorda(t) + 0.31, lado * h); iate.add(b);
    }
  });

  // flybridge: hardtop sobre quatro pilares, para-brisas baixo, radar
  const forma = new THREE.Shape();
  const hx0 = -4.6, hx1 = 0.9, hw = 1.62, r = 0.6;
  forma.moveTo(hx0 + r, -hw); forma.lineTo(hx1 - r, -hw); forma.quadraticCurveTo(hx1 + 0.4, -hw, hx1 + 0.4, 0);
  forma.quadraticCurveTo(hx1 + 0.4, hw, hx1 - r, hw); forma.lineTo(hx0 + r, hw); forma.quadraticCurveTo(hx0, hw, hx0, hw - r);
  forma.lineTo(hx0, -hw + r); forma.quadraticCurveTo(hx0, -hw, hx0 + r, -hw);
  const gTopo = new THREE.ExtrudeGeometry(forma, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.05, bevelSegments: 3, curveSegments: 16 });
  gTopo.rotateX(-Math.PI / 2);
  const topo = new THREE.Mesh(gTopo, mTopo); topo.position.y = 4.42; iate.add(topo);
  [[-4.1, 1.35], [-4.1, -1.35], [0.2, 1.35], [0.2, -1.35]].forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.16, 10), mInox);
    p.position.set(x, 3.86, z); iate.add(p);
  });
  // borda do flybridge: um anel baixo à volta do convés de cima
  const bord = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 0.36, bevelEnabled: false, curveSegments: 16 }), mBranco);
  bord.geometry.rotateX(-Math.PI / 2); bord.scale.set(1, 1, 1.02); bord.position.y = 3.27; iate.add(bord);
  const pb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 2.6), mVidro);
  pb.position.set(1.05, 3.82, 0); pb.rotation.z = -0.5; iate.add(pb);
  const radar = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 16), mBranco);
  radar.scale.y = 0.6; radar.position.set(-1.6, 4.7, 0); iate.add(radar);
  const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), mInox);
  mastro.position.set(-3.2, 4.95, 0); iate.add(mastro);

  // sombra de contacto: um gradiente radial debaixo do casco
  const cvS = document.createElement("canvas"); cvS.width = cvS.height = 256;
  const cs = cvS.getContext("2d"); const gr = cs.createRadialGradient(128, 128, 10, 128, 128, 128);
  gr.addColorStop(0, "rgba(0,0,0,.55)"); gr.addColorStop(1, "rgba(0,0,0,0)"); cs.fillStyle = gr; cs.fillRect(0, 0, 256, 256);
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(L * 1.35, B * 2.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cvS), transparent: true, depthWrite: false }));
  sombra.rotation.x = -Math.PI / 2; sombra.position.y = -0.95; cena.add(sombra);

  iate.position.y = -0.2;
  iate.position.x = -0.4;

  /* ── Escolhas ───────────────────────────────────────────────────────── */
  const esc = () => Object.fromEntries([...form.querySelectorAll("input:checked")].map((i) => [i.name, i.value]));
  let pede = true;
  function aplicar() {
    const e = esc();
    texCasco(cvCasco, CORES.hull[e.hull], CORES.stripe[e.stripe]); tCasco.needsUpdate = true;
    const noite = e.scene === "night";
    texCasa(cvCasa, "#F1EEE7", noite); tCasa.needsUpdate = true;
    texTeca(cvTeca, ...CORES.deck[e.deck]); tTeca.needsUpdate = true;
    mTopo.color.set(CORES.top[e.top]);
    palco.dataset.cena = e.scene;
    if (e.scene === "sunset") { sol.color.set(0xFFC48A); sol.intensity = 2.2; sol.position.set(-12, 6, 6); ceu.color.set(0xFFB37A); ceu.groundColor.set(0x3A2A40); renderer.toneMappingExposure = 0.95; cena.environmentIntensity = 0.7; }
    else if (noite) { sol.color.set(0x9DB4FF); sol.intensity = 0.55; sol.position.set(6, 12, -8); ceu.color.set(0x5A78B8); ceu.groundColor.set(0x0A0F1C); renderer.toneMappingExposure = 0.8; cena.environmentIntensity = 0.35; }
    else { sol.color.set(0xffffff); sol.intensity = 1.6; sol.position.set(8, 14, 10); ceu.color.set(0xffffff); ceu.groundColor.set(0x445066); renderer.toneMappingExposure = 1.0; cena.environmentIntensity = 1; }
    const curto = `${NOMES.hull[e.hull].replace(" hull", "")}, ${NOMES.deck[e.deck]}`;
    const texto = `${NOMES.hull[e.hull]} · ${NOMES.stripe[e.stripe]} · ${NOMES.deck[e.deck]} · ${NOMES.top[e.top]}`;
    const res = form.querySelector("[data-resumo]"); if (res) res.textContent = texto;
    pede = true;
    return { e, curto: curto.charAt(0).toUpperCase() + curto.slice(1).toLowerCase(), texto };
  }
  form.addEventListener("change", () => { aplicar(); const t = form.querySelector("[data-toast-build]"); if (t) t.hidden = true; });
  aplicar();

  form.querySelector("[data-enviar-build]").addEventListener("click", () => {
    const { curto, texto } = aplicar();
    document.dispatchEvent(new CustomEvent("harbour:build", { detail: { curto, texto } }));
    const t = form.querySelector("[data-toast-build]");
    if (t) { t.hidden = false; t.innerHTML = 'Sent. It just landed in the CRM. <a href="#crm">See it arrive</a>'; }
  });

  /* ── Câmara, rotação com inércia, desenho só quando mexe ───────────── */
  const ALVO = new THREE.Vector3(0, 2.3, 0);
  let ang = -0.62, vel = 0, auto = true, voo = 0, ultimo = 0, visivel = false, aCorrer = false;
  const semMov = () => document.documentElement.classList.contains("sem-movimento");
  const tamanho = () => {
    const r = palco.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camara.aspect = r.width / r.height;
    camara.fov = camara.aspect < 1 ? 30 : 28;
    camara.updateProjectionMatrix(); pede = true;
  };
  const posCamara = () => {
    const d = Math.max(25.5, 19.5 / (2 * Math.tan((camara.fov * Math.PI) / 360) * camara.aspect)) + 18 * (1 - voo);
    const alt = 4.6 + 3 * (1 - voo);
    camara.position.set(Math.sin(0.0) * d, alt, d);
    camara.lookAt(ALVO);
    iate.rotation.y = ang;
  };
  new ResizeObserver(tamanho).observe(palco); tamanho();

  // gesto: rato arrasta sempre; dedo decide nos primeiros 8 px (de lado roda, na vertical a página anda)
  let arrasto = null;
  canvas.addEventListener("pointerdown", (e) => {
    auto = false;
    arrasto = { x: e.clientX, y: e.clientY, decidido: e.pointerType === "mouse", roda: e.pointerType === "mouse", t: performance.now() };
    if (e.pointerType === "mouse") canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!arrasto) return;
    const dx = e.clientX - arrasto.x, dy = e.clientY - arrasto.y;
    if (!arrasto.decidido) {
      if (Math.hypot(dx, dy) < 8) return;
      arrasto.decidido = true; arrasto.roda = Math.abs(dx) > Math.abs(dy);
      if (arrasto.roda) canvas.setPointerCapture(e.pointerId);
    }
    if (!arrasto.roda) return;
    const agora = performance.now(), dt = Math.max(8, agora - arrasto.t);
    const d = dx * 0.0085;
    ang += d; vel = d / dt * 16; arrasto.x = e.clientX; arrasto.y = e.clientY; arrasto.t = agora; pede = true;
  });
  const solta = () => { arrasto = null; };
  canvas.addEventListener("pointerup", solta); canvas.addEventListener("pointercancel", solta);
  const vista = palco.querySelector("[data-p3-vista]");
  const LADOS = ["the bow", "the starboard side", "the stern", "the port side"];
  palco.querySelectorAll("[data-rodar]").forEach((b) => b.addEventListener("click", () => {
    auto = false; vel = Number(b.dataset.rodar) * 0.09; pede = true;
    const fim = ang + vel / (1 - 0.92);
    const q = ((Math.round((fim + Math.PI / 2) / (Math.PI / 2)) % 4) + 4) % 4;
    if (vista) vista.textContent = `Turned ${b.dataset.rodar > 0 ? "right" : "left"}: now showing ${LADOS[q]}.`;
  }));

  let autoAte = 0, ultimoScroll = 0;
  addEventListener("scroll", () => { ultimoScroll = performance.now(); }, { passive: true });
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; if (visivel) { if (!autoAte) autoAte = performance.now() + 9000; laco(); } }, { threshold: 0.05 }).observe(palco);

  await renderer.compileAsync(cena, camara);
  posCamara();
  renderer.render(cena, camara);
  if (estado) estado.hidden = true;
  if (semMov()) voo = 1;

  function laco() {
    if (aCorrer) return; aCorrer = true;
    ultimo = performance.now();
    requestAnimationFrame(passo);
  }
  function passo(agora) {
    const dt = Math.min(50, agora - ultimo); ultimo = agora;
    let mexeu = pede; pede = false;
    if (voo < 1) { voo = Math.min(1, voo + dt / 1700); mexeu = true; }
    if (Math.abs(vel) > 0.0004) { ang += vel; vel *= 0.92; mexeu = true; }
    else if (auto && !semMov() && !document.hidden && agora < autoAte && agora - ultimoScroll > 220) { ang += dt * 0.00014; mexeu = true; }
    else if (auto && agora < autoAte) mexeu = mexeu || false;
    if (mexeu) { const e = 1 - Math.pow(1 - voo, 3); const v = voo; voo = e; posCamara(); voo = v; renderer.render(cena, camara); }
    if (visivel && (mexeu || arrasto || (auto && agora < autoAte))) requestAnimationFrame(passo);
    else aCorrer = false;
  }
  form.addEventListener("change", laco);
  palco.querySelectorAll("[data-rodar]").forEach((b) => b.addEventListener("click", laco));
  canvas.addEventListener("pointerdown", laco);
  document.addEventListener("harbour:movimento", () => { pede = true; laco(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) laco(); });
  laco();
  window.__hl3d = { renderer, cena, camara, iate, info: () => ({ ang, voo, visivel }) };
}
