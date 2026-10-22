/* Configurador 3D da landing: um iate de conceito (52 pés, flybridge) desenhado em código.
   Não há ficheiro de modelo na página (nada para copiar). Regras do livro das falhas: desenho só quando mexe,
   compileAsync antes do primeiro fotograma, toque de lado roda e na vertical a página anda, nada preso. */
import * as THREE from "./vendor/three.module.min.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";
import { RoundedBoxGeometry } from "./vendor/RoundedBoxGeometry.js";
import { construirIate } from "./iate.js";

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
  // o arranque devolve a vez ao browser entre etapas (antes era uma tarefa só de 0,3 a 0,5 s)
  const cede = () => new Promise((r) => setTimeout(r, 0));
  const marca = (n) => { try { performance.mark("hl3d:" + n); } catch (e) {} };
  marca("inicio");
  const canvas = palco.querySelector("canvas");
  const estado = palco.querySelector("[data-p3-estado]");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const cena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  await cede();
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  await cede();
  const camara = new THREE.PerspectiveCamera(28, 1, 0.5, 200);
  const sol = new THREE.DirectionalLight(0xffffff, 1.6); sol.position.set(9, 16, 11); cena.add(sol);
  const ceu = new THREE.HemisphereLight(0xffffff, 0x445066, 0.4); cena.add(ceu);
  const iate = new THREE.Group(); cena.add(iate);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -11, right: 11, top: 8, bottom: -8, near: 1, far: 60 });
  sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02; sol.shadow.radius = 4;

  await cede();
  const modelo = await construirIate(THREE, RoundedBoxGeometry, cede);
  marca("modelo");
  iate.add(modelo.grupo);
  await cede();

  // chão: só a sombra (o fundo é o do palco) e uma mancha suave de contacto por baixo do casco
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.22 }));
  chao.rotation.x = -Math.PI / 2; chao.position.y = modelo.medidas.quilha - 0.02; chao.receiveShadow = true; cena.add(chao);
  const cvS = document.createElement("canvas"); cvS.width = cvS.height = 256;
  const cs = cvS.getContext("2d"); const gr = cs.createRadialGradient(128, 128, 8, 128, 128, 128);
  gr.addColorStop(0, "rgba(0,0,0,.42)"); gr.addColorStop(1, "rgba(0,0,0,0)"); cs.fillStyle = gr; cs.fillRect(0, 0, 256, 256);
  const mancha = new THREE.Mesh(new THREE.PlaneGeometry(18, 6.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cvS), transparent: true, depthWrite: false }));
  mancha.rotation.x = -Math.PI / 2; mancha.position.set(0.6, modelo.medidas.quilha - 0.01, 0); cena.add(mancha);
  iate.position.x = -0.3;

  /* ── Escolhas ───────────────────────────────────────────────────────── */
  const esc = () => Object.fromEntries([...form.querySelectorAll("input:checked")].map((i) => [i.name, i.value]));
  let pede = true;
  function aplicar() {
    const e = esc();
    const noite = e.scene === "night";
    modelo.pintar({ hull: CORES.hull[e.hull], stripe: CORES.stripe[e.stripe], deck: CORES.deck[e.deck], top: CORES.top[e.top], noite });
    palco.dataset.cena = e.scene;
    if (e.scene === "sunset") { sol.color.set(0xFFC48A); sol.intensity = 2.2; sol.position.set(-14, 9, 8); ceu.color.set(0xFFB37A); ceu.groundColor.set(0x3A2A40); renderer.toneMappingExposure = 0.95; cena.environmentIntensity = 0.7; }
    else if (noite) { sol.color.set(0x9DB4FF); sol.intensity = 0.55; sol.position.set(6, 14, -8); ceu.color.set(0x5A78B8); ceu.groundColor.set(0x0A0F1C); renderer.toneMappingExposure = 0.8; cena.environmentIntensity = 0.35; }
    else { sol.color.set(0xffffff); sol.intensity = 1.6; sol.position.set(9, 16, 11); ceu.color.set(0xffffff); ceu.groundColor.set(0x445066); renderer.toneMappingExposure = 1.0; cena.environmentIntensity = 1; }
    const curto = `${NOMES.hull[e.hull].replace(" hull", "")}, ${NOMES.deck[e.deck]}`;
    const texto = `${NOMES.hull[e.hull]} · ${NOMES.stripe[e.stripe]} · ${NOMES.deck[e.deck]} · ${NOMES.top[e.top]}`;
    const res = form.querySelector("[data-resumo]"); if (res) res.textContent = texto;
    renderer.shadowMap.needsUpdate = true;
    pede = true;
    return { e, curto: curto.charAt(0).toUpperCase() + curto.slice(1).toLowerCase(), texto };
  }
  form.addEventListener("change", () => { aplicar(); const t = form.querySelector("[data-toast-build]"); if (t) t.hidden = true; });
  aplicar();

  form.querySelector("[data-enviar-build]").addEventListener("click", () => {
    const { curto, texto } = aplicar();
    document.dispatchEvent(new CustomEvent("harbour:build", { detail: { curto, texto } }));
    const t = form.querySelector("[data-toast-build]");
    if (t) { t.hidden = false; t.textContent = "Sent. Your sales team gets it as a hot enquiry, with this build attached."; }
  });

  /* ── Câmara, rotação com inércia, desenho só quando mexe ───────────── */
  const ALVO = new THREE.Vector3(0, 2.2, 0);
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
    const d = Math.max(29, 22 / (2 * Math.tan((camara.fov * Math.PI) / 360) * camara.aspect)) + 18 * (1 - voo);
    const alt = 4.6 + 3 * (1 - voo);
    camara.position.set(-Math.sin(ang) * d, alt, Math.cos(ang) * d);
    camara.lookAt(ALVO);
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

  await cede();
  await renderer.compileAsync(cena, camara);
  marca("compilado");
  await cede();
  posCamara();
  renderer.render(cena, camara);
  marca("primeiro");
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
  // para os testes: fixar um ângulo de câmara e desenhar já
  window.__hl3d = { renderer, cena, camara, iate, modelo, info: () => ({ ang, voo, visivel }),
    vista(a, alt, dist) { auto = false; vel = 0; voo = 1; ang = a; posCamara(); if (alt != null) { camara.position.y = alt; } if (dist != null) { camara.position.setLength(dist); camara.position.y = alt ?? camara.position.y; } camara.lookAt(ALVO); renderer.render(cena, camara); } };
}
