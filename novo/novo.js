/* Harbour Leads · site novo (19/11/2026): entrada da marca, filme do hero com voz, baralho de reels, filme do bento,
   relógio de resposta, desenho do iate ao scroll, títulos que sobem e o menu do telemóvel. O configurador, as apps,
   o formulário, o contacto fixo e o «Reduce motion» são do site.js do site atual. */
(function () {
  "use strict";
  var d = document, html = d.documentElement;
  var L = { en: ["Sound on", "Play with sound", "Turn the reel sound off", "Turn the reel sound on", "Open the menu", "Close the menu"],
    es: ["Sonido activado", "Ver con sonido", "Desactivar el sonido del reel", "Activar el sonido del reel", "Abrir el menú", "Cerrar el menú"],
    fr: ["Son activé", "Voir avec le son", "Couper le son du reel", "Activer le son du reel", "Ouvrir le menu", "Fermer le menu"] }[html.lang] || null;
  if (!L) L = ["Sound on", "Play with sound", "Turn the reel sound off", "Turn the reel sound on", "Open the menu", "Close the menu"];
  var semMov = function () { return html.classList.contains("sem-movimento"); };
  var vista = function (el, cb, opc) {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting, e); }); }, opc || { threshold: 0.35 }).observe(el);
  };
  var gestoFeito = false, aoGesto = [];
  function gesto() { if (gestoFeito) return; gestoFeito = true; aoGesto.forEach(function (f) { f(); }); }
  ["pointerdown", "keydown", "wheel", "touchstart", "scroll"].forEach(function (ev) { window.addEventListener(ev, gesto, { passive: true, once: true }); });

  /* ---------- 1 · o filme do hero ----------
     Arranca sozinho depois da maior pintura e do load. Tenta com som (o Chrome deixa a quem já visitou o site);
     se o browser recusar, toca mudo e «Play with sound» (ou o primeiro toque na página) liga o som e recomeça. */
  var filme = d.getElementById("dx-filme"), som = d.querySelector(".dx-som"), barra = d.querySelector(".dx-hero__progresso");
  var escolheuSom = false, heroVisivel = true;
  function desenharSom() {
    var on = !filme.muted && !filme.paused;
    som.setAttribute("aria-pressed", on ? "true" : "false");
    som.querySelector("span").textContent = on ? L[0] : L[1];
  }
  function ligarSom() {
    escolheuSom = true; filme.muted = false; filme.currentTime = 0;
    // o Safari do iPhone ignora o currentTime dado antes do play(): volta-se ao início também quando o play é aceite
    var p = filme.play(); if (p && p.then) p.then(function () { if (filme.currentTime > 0.5) filme.currentTime = 0; }, function () { filme.muted = true; desenharSom(); });
    desenharSom();
  }
  function arrancarFilme() {
    if (filme.dataset.pronto) return; filme.dataset.pronto = "1";
    var largo = window.matchMedia("(min-width: 700px)").matches && (window.devicePixelRatio || 1) * filme.clientWidth > 900;
    filme.src = largo ? "/harbourleads-world/novo/media/hero-1080.mp4" : "/harbourleads-world/novo/media/hero-720.mp4";
    filme.muted = false;
    var p = filme.play();
    if (p && p.catch) p.catch(function () { filme.muted = true; filme.play().catch(function () {}); desenharSom(); });
    desenharSom();
  }
  if (filme) {
    var lcpVisto = false, carregou = d.readyState === "complete";
    var talvez = function () { if (lcpVisto && carregou && !semMov() && !html.classList.contains("dx-abre")) arrancarFilme(); };
    window.__dxFilme = function () { lcpVisto = true; talvez(); };
    try { new PerformanceObserver(function () { lcpVisto = true; setTimeout(talvez, 300); }).observe({ type: "largest-contentful-paint", buffered: true }); } catch (e) { lcpVisto = true; }
    setTimeout(function () { lcpVisto = true; talvez(); }, 3000);
    if (!carregou) window.addEventListener("load", function () { carregou = true; talvez(); }); else talvez();
    aoGesto.push(function () { lcpVisto = true; carregou = true; if (!semMov() && !html.classList.contains("dx-abre")) arrancarFilme(); });
    som.addEventListener("click", function (e) {
      e.stopPropagation();
      if (!filme.dataset.pronto) arrancarFilme();
      if (filme.muted || filme.paused) ligarSom(); else { filme.muted = true; escolheuSom = true; desenharSom(); }
    });
    d.addEventListener("pointerdown", function (e) {
      if (escolheuSom || !heroVisivel || !filme.dataset.pronto || !filme.muted) return;
      if (e.target.closest("a,button,input,label,select,textarea,[data-baralho],[data-config],[data-apps],.palco3d")) return;
      ligarSom();
    });
    ["volumechange", "play", "pause"].forEach(function (ev) { filme.addEventListener(ev, desenharSom); });
    filme.addEventListener("timeupdate", function () { if (filme.duration) barra.style.setProperty("--p", (filme.currentTime / filme.duration).toFixed(4)); });
    filme.addEventListener("ended", function () { filme.muted = true; filme.currentTime = 0; filme.play().catch(function () {}); });
    vista(d.querySelector(".dx-hero"), function (dentro) {
      heroVisivel = dentro;
      if (!filme.dataset.pronto) return;
      if (dentro && !semMov()) filme.play().catch(function () {}); else filme.pause();
    }, { threshold: 0.2 });
    d.addEventListener("visibilitychange", function () { if (d.hidden) filme.pause(); else if (heroVisivel && filme.dataset.pronto && !semMov()) filme.play().catch(function () {}); });
  }

  /* ---------- a entrada da marca ----------
     O CSS faz o fio de ouro, o H a subir e o clarão (1,8 s). Aqui: o voo do H para a barra, como na Doxter, e o filme a
     rebentar do centro. Um toque ou uma tecla salta a entrada. Teto de 4 s para nunca prender ninguém. */
  var entrada = d.querySelector(".dx-entrada");
  if (entrada && html.classList.contains("dx-abre")) {
    var acabou = false;
    var fim = function () {
      if (acabou) return; acabou = true;
      var alvo = d.querySelector("[data-logo-topo]").getBoundingClientRect(), eu = entrada.querySelector(".dx-entrada__marca").getBoundingClientRect();
      var s = alvo.width / eu.width, dx = (alvo.left + alvo.width / 2) - (eu.left + eu.width / 2), dy = (alvo.top + alvo.height / 2) - (eu.top + eu.height / 2);
      entrada.style.setProperty("--voo", "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px) scale(" + s.toFixed(4) + ")");
      entrada.classList.add("voa");
      setTimeout(function () { html.classList.add("dx-rebenta"); }, 380);
      setTimeout(function () {
        html.classList.remove("dx-abre"); entrada.remove();
        setTimeout(function () { if (window.__dxFilme) window.__dxFilme(); }, 450);
      }, 700);
    };
    setTimeout(fim, 1600); setTimeout(fim, 3500);
    window.addEventListener("pointerdown", fim, { once: true });
    window.addEventListener("keydown", fim, { once: true });
  } else if (entrada) { entrada.remove(); }

  /* ---------- 2 · o baralho de reels ---------- */
  var baralho = d.querySelector("[data-baralho]");
  if (baralho) {
    var cartas = [].slice.call(baralho.querySelectorAll(".dx-baralho__carta")), atual = 0, comSom = false, perto = false, n = cartas.length;
    var conta = baralho.querySelector(".dx-baralho__conta b"), botaoSom = baralho.querySelector(".dx-baralho__som");
    var carregar = function (v) { if (!v.getAttribute("src") && v.dataset.src) v.src = v.dataset.src; };
    var desenharSomReel = function () { botaoSom.setAttribute("aria-pressed", comSom ? "true" : "false"); botaoSom.setAttribute("aria-label", comSom ? L[2] : L[3]); };
    var arrumar = function () {
      var estreito = window.innerWidth < 640;
      cartas.forEach(function (c, i) {
        var k = ((i - atual) % n + n) % n; if (k > n / 2) k -= n;
        var a = Math.abs(k);
        c.style.setProperty("--x", String(k * (estreito ? 34 : 46)));
        c.style.setProperty("--s", String(1 - a * 0.12));
        c.style.setProperty("--b", String(a ? 0.42 : 1));
        c.style.setProperty("--zi", String(10 - a));
        c.style.opacity = a > 1 ? "0" : "1"; c.style.visibility = a > 1 ? "hidden" : "visible";
        c.classList.toggle("ativa", k === 0); c.setAttribute("aria-hidden", k === 0 ? "false" : "true");
        var v = c.querySelector("video");
        if (perto && a <= 1) carregar(v);
        if (k === 0 && perto && !semMov()) { carregar(v); v.muted = !comSom; v.play().catch(function () { v.muted = true; comSom = false; desenharSomReel(); v.play().catch(function () {}); }); }
        else v.pause();
      });
      conta.textContent = String(atual + 1).padStart(2, "0");
    };
    var ir = function (dir) { atual = ((atual + dir) % n + n) % n; arrumar(); };
    baralho.querySelectorAll(".dx-baralho__seta").forEach(function (b) { b.addEventListener("click", function () { ir(+b.dataset.dir); }); });
    botaoSom.addEventListener("click", function () {
      comSom = !comSom; desenharSomReel();
      if (comSom && filme) { filme.muted = true; escolheuSom = true; }
      var v = cartas[atual].querySelector("video"); carregar(v); v.muted = !comSom; v.play().catch(function () {});
    });
    cartas.forEach(function (c, i) { c.addEventListener("click", function () { if (i !== atual) { atual = i; arrumar(); } }); });
    var x0 = null;
    baralho.querySelector(".dx-baralho__pista").addEventListener("pointerdown", function (e) { x0 = e.clientX; });
    window.addEventListener("pointerup", function (e) { if (x0 === null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) ir(dx < 0 ? 1 : -1); });
    baralho.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") ir(1); if (e.key === "ArrowLeft") ir(-1); });
    // um reel acaba e entra o seguinte (como na Pantiera)
    cartas.forEach(function (c, i) { var v = c.querySelector("video"); v.loop = false; v.addEventListener("ended", function () { if (i === atual) ir(1); }); });
    vista(baralho, function (dentro) { perto = dentro && gestoFeito; arrumar(); }, { threshold: 0.3 });
    aoGesto.push(function () { var r = baralho.getBoundingClientRect(); perto = r.top < innerHeight && r.bottom > 0; arrumar(); });
    arrumar();
  }

  /* ---------- 3 · o filme do bento, só quando está à vista ---------- */
  d.querySelectorAll(".dx-bloco video[data-src]").forEach(function (v) {
    vista(v, function (dentro) {
      if (dentro && gestoFeito && !semMov()) { if (!v.getAttribute("src")) v.src = v.dataset.src; v.play().catch(function () {}); }
      else v.pause();
    }, { threshold: 0.4 });
    aoGesto.push(function () { var r = v.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0 && !semMov()) { v.src = v.dataset.src; v.play().catch(function () {}); } });
  });

  /* ---------- o relógio de resposta: o pedido chega e o tempo corre ---------- */
  var pedido = d.querySelector(".dx-pedido");
  if (pedido && !semMov()) {
    var cartao = pedido.querySelector(".dx-pedido__cartao"), rel = pedido.querySelector("[data-relogio]"), relogio = pedido.querySelector(".dx-pedido__relogio");
    cartao.style.setProperty("--o", "0"); cartao.style.setProperty("--y", "12px"); relogio.style.setProperty("--arco", "4");
    var feito = false;
    vista(pedido, function (dentro) {
      if (!dentro || feito) return; feito = true;
      setTimeout(function () { cartao.style.setProperty("--o", "1"); cartao.style.setProperty("--y", "0px"); }, 300);
      var min = 112, fimMin = 72, t0 = null;
      var passo = function (t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 2600), m = Math.round(min - (min - fimMin) * p);
        rel.textContent = Math.floor(m / 60) + "h " + String(m % 60).padStart(2, "0") + "m"; relogio.style.setProperty("--arco", String(Math.round(4 + 58 * p)));
        if (p < 1) requestAnimationFrame(passo); };
      setTimeout(function () { requestAnimationFrame(passo); }, 900);
    }, { threshold: 0.5 });
  }

  /* ---------- o desenho do iate faz-se ao scroll ---------- */
  var planta = d.querySelector(".dx-planta__barco");
  if (planta) {
    var sec = d.querySelector(".dx-reels"), pedidoRaf = false;
    var traco = function () {
      pedidoRaf = false;
      var r = sec.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.9)));
      planta.style.setProperty("--traco", String(Math.round(2200 * (1 - p))));
    };
    window.addEventListener("scroll", function () { if (!pedidoRaf) { pedidoRaf = true; requestAnimationFrame(traco); } }, { passive: true });
    traco();
  }

  /* ---------- títulos das secções: sobem por linhas ao entrar ---------- */
  d.querySelectorAll("main section:not(.dx-hero) .dx-titulo, main .config .h2, main .apps .h2, .dx-forma__frase p").forEach(function (t) {
    t.classList.add("dx-revela");
    vista(t, function (dentro) { if (dentro) t.classList.add("dentro"); }, { threshold: 0.2 });
  });

  /* ---------- o contacto fixo sai quando o formulário está à vista ---------- */
  var fixo = d.querySelector(".dx-fixo"), contacto = d.getElementById("contact"), heroSec = d.querySelector(".dx-hero");
  if (fixo && contacto) {
    var noForm = false;
    var lig = fixo.querySelector("a"); var pinta = function () { var fora = noForm; fixo.classList.toggle("fora", fora); fixo.setAttribute("aria-hidden", fora ? "true" : "false"); lig.tabIndex = fora ? -1 : 0; };
    vista(contacto.querySelector(".dx-fecho__form") || contacto, function (dentro) { noForm = dentro; pinta(); }, { threshold: 0 });
    pinta();
  }

  /* ---------- menu do telemóvel ---------- */
  var abrir = d.querySelector(".dx-topo__abrir"), menu = d.getElementById("dx-menu-movel");
  if (abrir) {
    var fechar = function () { menu.hidden = true; abrir.setAttribute("aria-expanded", "false"); abrir.setAttribute("aria-label", L[4]); };
    abrir.addEventListener("click", function () { var a = menu.hidden; menu.hidden = !a; abrir.setAttribute("aria-expanded", String(a)); abrir.setAttribute("aria-label", a ? L[5] : L[4]); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) fechar(); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { fechar(); abrir.focus(); } });
  }

  /* o «Reduce motion» do rodapé (site.js) também pára os filmes daqui */
  var mov = d.querySelector("[data-movimento]");
  if (mov) mov.addEventListener("click", function () { setTimeout(function () { if (semMov()) d.querySelectorAll("video").forEach(function (v) { v.pause(); }); }, 0); });
})();
