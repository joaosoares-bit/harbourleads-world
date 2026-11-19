
(() => {
  const H = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const semMov = () => H.classList.contains("sem-movimento");
  const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const ler = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  H.classList.add("pronto");
  const TX = {
    en: { sem3d: "3D needs a newer browser. Book a demo to see it live.", sobreBuild: (b) => `About: a configurator like this · your build: ${b}`, sobre: (a) => `About: ${a}`,
      falta: "Please fill in your name, work email and company.", aEnviar: "Sending…", obrigado: (n) => `Thank you, ${n}. We will email you a time for the call.`,
      msg: "Hi Harbour Leads, I'd like to book a 15-minute demo.", build: "build", assunto: "15-minute demo", porWa: "Send it on WhatsApp", porEmail: "Send it by email",
      ocupado: "Our form is busy right now. One tap sends the same request: ", ensaio: "This preview is not connected yet, so nothing was sent.", falhou: "We could not send it right now. Please try again in a minute.",
      ola: ["Morning", "Afternoon", "Evening"], specs: ["8 guests · 4 cabins", "6 guests · 3 cabins", "10 guests · 5 cabins"] },
    es: { sem3d: "El 3D necesita un navegador más reciente. Reserve una demo para verlo en directo.", sobreBuild: (b) => `Sobre: un configurador como este · su yate: ${b}`, sobre: (a) => `Sobre: ${a}`,
      falta: "Indique su nombre, su email profesional y su empresa.", aEnviar: "Enviando…", obrigado: (n) => `Gracias, ${n}. Le enviaremos por email una hora para la llamada.`,
      msg: "Hola Harbour Leads, me gustaría reservar una demo de 15 minutos.", build: "yate", assunto: "Demo de 15 minutos", porWa: "Enviar por WhatsApp", porEmail: "Enviar por email",
      ocupado: "Nuestro formulario está ocupado ahora mismo. Un toque envía la misma solicitud: ", ensaio: "Esta vista previa aún no está conectada, así que no se ha enviado nada.", falhou: "No hemos podido enviarlo ahora. Inténtelo de nuevo en un minuto.",
      ola: ["Buenos días", "Buenas tardes", "Buenas noches"], specs: ["8 huéspedes · 4 camarotes", "6 huéspedes · 3 camarotes", "10 huéspedes · 5 camarotes"] },
    fr: { sem3d: "La 3D demande un navigateur plus récent. Réservez une démo pour la voir en direct.", sobreBuild: (b) => `Objet : un configurateur comme celui-ci · votre yacht : ${b}`, sobre: (a) => `Objet : ${a}`,
      falta: "Indiquez votre nom, votre email professionnel et votre société.", aEnviar: "Envoi…", obrigado: (n) => `Merci, ${n}. Nous vous enverrons par email un créneau pour l'appel.`,
      msg: "Bonjour Harbour Leads, je souhaite réserver une démo de 15 minutes.", build: "yacht", assunto: "Démo de 15 minutes", porWa: "Envoyer sur WhatsApp", porEmail: "Envoyer par email",
      ocupado: "Notre formulaire est saturé pour le moment. Un clic envoie la même demande : ", ensaio: "Cet aperçu n'est pas encore connecté, rien n'a été envoyé.", falhou: "L'envoi n'a pas abouti. Réessayez dans une minute.",
      ola: ["Bonjour", "Bon après-midi", "Bonsoir"], specs: ["8 invités · 4 cabines", "6 invités · 3 cabines", "10 invités · 5 cabines"] },
  }[["es", "fr"].find((l) => (H.lang || "").startsWith(l)) || "en"];
  let CFG = {};
  try { CFG = JSON.parse($("#cfg").textContent) || {}; } catch (e) {}
  
  const CHAVES = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const limpa = (v) => String(v || "").replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 40);
  const origem = (() => {
    const q = new URLSearchParams(location.search);
    const daqui = {};
    CHAVES.forEach((k) => { if (q.get(k)) daqui[k] = limpa(q.get(k)); });
    if (Object.keys(daqui).length) { guardar("hl-origem", JSON.stringify(daqui)); return daqui; }
    try { return JSON.parse(ler("hl-origem")) || {}; } catch (e) { return {}; }
  })();
  const seg = () => H.dataset.seg || "yard";
  
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  const evento = (nome, extra = {}) => window.gtag("event", nome, { ...origem, segment: seg(), ...extra });
  if (CFG.ga4) {
    window.gtag("js", new Date()); window.gtag("config", CFG.ga4);
    const carregarGa = () => { const s = document.createElement("script"); s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CFG.ga4); document.head.appendChild(s); };
    if (document.readyState === "complete") setTimeout(carregarGa, 1200); else addEventListener("load", () => setTimeout(carregarGa, 1200), { once: true });
  }
  
  const abrindo = H.classList.contains("abre");
  const T_RASGO = 1620;
  let rasgou = !abrindo;
  const fimSinal = "AbortController" in window ? new AbortController() : null;
  const fimAbertura = () => { if (fimSinal) fimSinal.abort(); H.classList.remove("abre"); rasgou = true; tocaHero(); };
  if (abrindo) {
    const voo = () => {
      const pares = [[".ab-h", ".marca-h", "h"], [".ab-nome", ".marca-nome", "n"]];
      pares.forEach(([de, para, k]) => {
        const a = $(de), b = $(para); if (!a || !b) return;
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        if (!ra.width || !rb.width) return;
        a.style.setProperty(`--${k}x`, `${Math.round(rb.left - ra.left)}px`);
        a.style.setProperty(`--${k}y`, `${Math.round(rb.top - ra.top)}px`);
        a.style.setProperty(`--${k}s`, (rb.width / ra.width).toFixed(4));
      });
    };
    voo();
    const op = fimSinal ? { signal: fimSinal.signal } : {};
    addEventListener("resize", () => fimAbertura(), op);
    const cc = $(".c-cima");
    if (cc) cc.addEventListener("animationstart", (e) => { if (e.animationName === "parte-cima") { rasgou = true; tocaHero(); } }, op);
    setTimeout(() => { rasgou = true; tocaHero(); }, T_RASGO + 400);
    setTimeout(fimAbertura, 4400);
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach((t) => addEventListener(t, () => setTimeout(fimAbertura, 0), { once: true, passive: true, ...op }));
  }
  
  const TIPO = { yard: "Shipyard", broker: "Broker", charter: "Charter fleet" };
  const ORDEM = ["yard", "broker", "charter"];
  const tipo = $("[data-campo-tipo]"); if (tipo && TIPO[seg()]) tipo.value = TIPO[seg()];
  const heroSec = $(".hero"), gancho = $(".gancho"), cartao = $(".pedido-voa");
  const palavras = (el) => { const t = el.textContent.trim().split(/\s+/); el.textContent = ""; t.forEach((w, i) => { const m = document.createElement("span"); m.className = "wm"; const sp = document.createElement("span"); sp.className = "w"; sp.style.setProperty("--i", i); sp.textContent = w; m.append(sp); el.append(m, i < t.length - 1 ? " " : ""); }); };
  const frase = (k) => { const g = document.createElement("span"); g.className = "li g"; g.dataset.g = k; g.textContent = gancho.dataset[k]; palavras(g); return g; };
  let gAtual = seg();
  if (gancho) {
    const primeiro = gancho.querySelector(".g");
    if (gancho.dataset[gAtual] && primeiro.textContent.replace(/\s+/g, " ").trim() !== gancho.dataset[gAtual]) primeiro.textContent = gancho.dataset[gAtual];
    primeiro.dataset.g = gAtual; heroSec.dataset.gancho = gAtual;
    if (!primeiro.querySelector(".wm")) palavras(primeiro);
    const mede = () => {
      const a = gancho.querySelector(".g.ativo"); if (!a) return;
      const ms = [...a.querySelectorAll(".wm")]; if (!ms.length) return;
      const topo = Math.max(...ms.map((m) => m.offsetTop));
      const dir = Math.max(...ms.filter((m) => m.offsetTop === topo).map((m) => m.offsetLeft + m.offsetWidth));
      gancho.style.setProperty("--gw", `${Math.round(dir)}px`);
    };
    mede();
    addEventListener("resize", mede);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(mede);
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", mede); // as letras chegam depois do logótipo
    let heroVisivel = true, tGancho = 0;
    const troca = () => {
      if (semMov() || !heroVisivel || document.hidden) { tGancho = setTimeout(troca, 1200); return; }
      const atual = gancho.querySelector(".g.ativo"), prox = ORDEM[(ORDEM.indexOf(gAtual) + 1) % 3];
      const novo = frase(prox);
      gancho.append(novo); void novo.offsetWidth;
      atual.classList.remove("ativo"); atual.classList.add("sai");
      novo.classList.add("ativo");
      setTimeout(() => atual.remove(), 1000);
      gAtual = prox;
      mede(); gancho.classList.remove("troca"); void gancho.offsetWidth; gancho.classList.add("troca");
      setTimeout(() => { heroSec.dataset.gancho = prox; if (cartao) { cartao.classList.remove("salta"); void cartao.offsetWidth; cartao.classList.add("salta"); } }, 620);
      tGancho = setTimeout(troca, 3800);
    };
    new IntersectionObserver(([e]) => { heroVisivel = e.isIntersecting; }, { threshold: 0.3 }).observe(heroSec);
    tGancho = setTimeout(troca, abrindo ? 6200 : 3800);
  }
  
  const topo = $(".topo") || document.createElement("i");
  const pinta = () => topo.classList.toggle("solido", scrollY > 40);
  addEventListener("scroll", pinta, { passive: true }); pinta();
  
  const hero = $("[data-hero]");
  const vertical = () => matchMedia("(max-width: 760px)").matches;
  const fonteHero = () => {
    if (vertical()) return "/harbourleads-world/filmes/hero-v.mp4";
    const c = navigator.connection || {};
    if (c.saveData || (c.effectiveType && c.effectiveType !== "4g")) return "/harbourleads-world/filmes/hero-720.mp4";
    const px = innerWidth * Math.min(devicePixelRatio || 1, 2);
    return px > 3200 ? "/harbourleads-world/filmes/hero-2160.mp4" : px > 1400 ? "/harbourleads-world/filmes/hero-1080.mp4" : "/harbourleads-world/filmes/hero-720.mp4";
  };
  let heroNoEcra = true;
  function tocaHero() {
    if (!hero || !hero.src || !heroNoEcra || semMov() || document.hidden) return;
    const p = hero.play(); if (p && p.catch) p.catch(() => {});
  }
  if (hero) {
    let lcp = !("PerformanceObserver" in window), carregou = document.readyState === "complete";
    const tenta = () => {
      if (!lcp || !carregou || hero.src || semMov()) return;
      const pede = () => { if (hero.src) return; hero.src = fonteHero(); hero.preload = "auto"; tocaHero(); };
      if (abrindo) setTimeout(pede, 800); else requestAnimationFrame(() => requestAnimationFrame(pede));
    };
    try { new PerformanceObserver((l) => { if (l.getEntries().length) { lcp = true; tenta(); } }).observe({ type: "largest-contentful-paint", buffered: true }); } catch (e) { lcp = true; }
    setTimeout(() => { lcp = true; tenta(); }, 2500);
    if (!carregou) addEventListener("load", () => { carregou = true; tenta(); }, { once: true }); else tenta();
    new IntersectionObserver(([e]) => { heroNoEcra = e.isIntersecting; if (!hero.src) return; if (heroNoEcra) tocaHero(); else hero.pause(); }).observe(hero);
    ["pause", "stalled", "suspend"].forEach((ev) => hero.addEventListener(ev, () => { if (heroNoEcra && !document.hidden) setTimeout(tocaHero, 250); }));
    document.addEventListener("visibilitychange", () => { if (!document.hidden) tocaHero(); });
    ["touchstart", "pointerdown", "scroll"].forEach((ev) => addEventListener(ev, tocaHero, { passive: true, once: true }));
    setInterval(() => { if (hero.src && hero.paused && heroNoEcra && !document.hidden && !semMov()) tocaHero(); }, 1500);
  }
  
  const filmes = $$("video[data-filme]");
  const fonteFilme = (v) => {
    if (v.dataset.filme === "demo-v") return "/harbourleads-world/filmes/demo-v.mp4";
    const px = v.getBoundingClientRect().width * Math.min(devicePixelRatio || 1, 2);
    return px > 1000 ? "/harbourleads-world/filmes/demo-1440.mp4" : "/harbourleads-world/filmes/demo-960.mp4";
  };
  const capa = (v) => { if (v.dataset.poster && !v.poster) v.poster = v.dataset.poster; };
  const ioPerto = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { capa(e.target); ioPerto.unobserve(e.target); } }), { rootMargin: "600px 0px" });
  const ioVer = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    const sl = v.closest(".slide");
    if (sl && !sl.classList.contains("ativo")) { v.pause(); return; }
    if (e.isIntersecting && !semMov() && !document.hidden) {
      capa(v); if (!v.src) v.src = fonteFilme(v);
      const p = v.play(); if (p && p.catch) p.catch(() => {});
    } else v.pause();
  }), { threshold: 0.25 });
  const soCapa = (v) => v.dataset.filme === "demo-v";
  filmes.forEach((v) => { if (soCapa(v)) { v.removeAttribute("loop"); ioPerto.observe(v); return; } ioPerto.observe(v); ioVer.observe(v); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) [...filmes, hero].forEach((v) => v && v.pause()); });
  
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add(e.target.tagName === "SECTION" ? "entrou" : "vista"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px" });
  $$(".revela, .h2, .aparelhos, .palco3d, main > section").forEach((el) => {
    if (semMov()) el.classList.add(el.tagName === "SECTION" ? "entrou" : "vista"); else io.observe(el);
  });
  
  const col = $(".aparelhos-col");
  if (col) {
    const DUR = 6400;
    const navB = $$("[data-ecra]", col);
    const ecras = $$(".ecra", col);
    const videoSite = $(".s-site video", col);
    const legendas = $$(".ecra-legenda [data-leg]", col);
    let idx = 0, tEcra = 0, visivel = false;
    const agenda = () => {
      clearTimeout(tEcra);
      if (!visivel || semMov() || document.hidden) return;
      const barra = navB[idx] && navB[idx].querySelector("i");
      const an = barra && barra.getAnimations ? barra.getAnimations()[0] : null;
      const resta = an && an.currentTime != null ? Math.max(200, DUR - an.currentTime) : DUR;
      tEcra = setTimeout(() => mostra(idx + 1), resta);
    };
    new IntersectionObserver(([e], ob) => { if (!e.isIntersecting) return; $$("img[data-src]", col).forEach((im) => { im.src = im.dataset.src; im.removeAttribute("data-src"); }); ob.disconnect(); }, { rootMargin: "700px 0px" }).observe(col);
    function mostra(i, doUtilizador) {
      const ant = idx; idx = (i + 3) % 3;
      ecras.forEach((ec) => {
        [...ec.children].forEach((sl, k) => {
          sl.classList.remove("sai");
          if (k === ant && ant !== idx) sl.classList.add("sai");
          sl.classList.toggle("ativo", k === idx);
          if (k === idx) { void sl.offsetWidth; }
        });
      });
      legendas.forEach((l, k) => { l.classList.remove("sai"); if (k === ant && ant !== idx) l.classList.add("sai"); l.classList.toggle("ativo", k === idx); l.setAttribute("aria-hidden", String(k !== idx)); });
      navB.forEach((b, k) => { b.setAttribute("aria-pressed", String(k === idx)); b.classList.remove("enche"); if (k === idx) { void b.offsetWidth; b.classList.add("enche"); } });
      if (videoSite && videoSite.src) { if (idx === 0 && visivel) videoSite.play().catch(() => {}); else videoSite.pause(); }
      if (doUtilizador) evento("screens_tab", { screen: ["website", "configurator", "crm"][idx] });
      agenda();
    }
    navB.forEach((b) => b.addEventListener("click", () => mostra(Number(b.dataset.ecra), true)));
    new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      col.classList.toggle("pausa", !visivel);
      if (visivel) { if (!col.dataset.comecou) { col.dataset.comecou = "1"; mostra(0); } else agenda(); } else clearTimeout(tEcra);
    }, { threshold: 0.35 }).observe(col);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) agenda(); else clearTimeout(tEcra); });
    document.addEventListener("harbour:movimento", agenda);
  }
  
  const apps = $(".apps");
  if (apps) {
    const tels = $("[data-apps]", apps);
    const IATES = [["Aurora 52", "img/cfg/iate-navy.webp"], ["Vela 44", "img/cfg/iate-pearl.webp"], ["Polar 60", "img/cfg/iate-champagne.webp"]];
    const base = ($("img.ta-iate", apps).dataset.src || "").replace(/img\/cfg\/.*$/, "");
    let iate = 0, mexeu = false, tDemo = [];
    const relogio = () => {
      const d = new Date(), h = d.getHours();
      $$("[data-hora]", apps).forEach((el) => { el.textContent = `${String(h).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; });
      const eq = $("[data-ola-equipa]", apps); if (eq) eq.textContent = `${TX.ola[h < 12 ? 0 : h < 19 ? 1 : 2]}, Marina`;
    };
    const escolhe = (grupo, botao) => $$("button", grupo).forEach((b) => { b.classList.toggle("ativo", b === botao); b.setAttribute("aria-pressed", String(b === botao)); });
    const mudaIate = (i) => {
      iate = i; const img = $(".ta-iate", apps);
      escolhe($(".t-tabs", apps), $(`[data-iate="${i}"]`, apps));
      $("[data-iate-nome]", apps).textContent = IATES[i][0]; $("[data-iate-specs]", apps).textContent = TX.specs[i];
      $(".tel-b .t-ola", apps).textContent = IATES[i][0];
      if (img.getAttribute("src")) { img.classList.add("troca"); setTimeout(() => { img.onload = () => img.classList.remove("troca"); img.src = base + IATES[i][1]; }, 250); }
      else img.dataset.src = base + IATES[i][1];
    };
    const pede = () => {
      const dia = $("[data-dia].ativo", apps), dest = $("[data-destino].ativo", apps), lista = $("[data-apps-lista]", apps);
      const quando = `${dia.querySelector("small").textContent} ${dia.lastChild.textContent.trim()} ${$(".tb-mes", apps).textContent}`;
      const li = document.createElement("li"); li.className = "nova";
      li.innerHTML = `<span><b></b><small></small></span><i class="tc-int"></i>`;
      li.querySelector("b").textContent = `Sofia · ${IATES[iate][0]}`; li.querySelector("small").textContent = `${quando} · ${dest.textContent}`;
      $$("li.nova", lista).forEach((x) => x.classList.remove("nova"));
      lista.prepend(li);
      while (lista.children.length > 3) lista.removeChild(lista.lastElementChild);
      const hoje = $("[data-hoje]", apps); hoje.style.setProperty("--v", Math.min(.95, parseFloat(getComputedStyle(hoje).getPropertyValue("--v")) + .14));
      const t = $("[data-apps-toast]", apps); t.classList.add("ve"); setTimeout(() => t.classList.remove("ve"), 2600);
      setTimeout(() => { const i = li.querySelector(".tc-int"); if (i) i.classList.add("on"); }, 1400);
      const r = apps.getBoundingClientRect();
      if (tels.scrollWidth > tels.clientWidth + 4 && r.top < innerHeight && r.bottom > 0) tels.scrollTo({ left: $(".tel-c", apps).offsetLeft - tels.offsetLeft - 16, behavior: semMov() ? "auto" : "smooth" });
      evento("apps_booking_demo", { yacht: IATES[iate][0], destination: dest.textContent });
    };
    const parar = () => { mexeu = true; tDemo.forEach(clearTimeout); tDemo = []; };
    apps.addEventListener("pointerdown", (e) => { if (e.target.closest(".tel")) parar(); });
    $$("[data-iate]", apps).forEach((b) => b.addEventListener("click", () => mudaIate(Number(b.dataset.iate))));
    $$("[data-dia]", apps).forEach((b) => b.addEventListener("click", () => escolhe(b.parentElement, b)));
    $$("[data-destino]", apps).forEach((b) => b.addEventListener("click", () => escolhe(b.parentElement, b)));
    $("[data-pedir]", apps).addEventListener("click", pede);
    const demo = () => {
      if (mexeu || semMov()) return;
      const passos = [() => mudaIate(1), () => escolhe($(".tb-dias", apps), $$("[data-dia]", apps)[2]), () => escolhe($(".tb-destinos", apps), $$("[data-destino]", apps)[1]),
        () => { const s = $("[data-pedir]", apps); s.classList.add("carrega"); setTimeout(() => s.classList.remove("carrega"), 260); pede(); }];
      passos.forEach((f, k) => tDemo.push(setTimeout(() => { if (!mexeu && !document.hidden) f(); }, 2200 + k * 1500)));
    };
    new IntersectionObserver(([e], ob) => { if (!e.isIntersecting) return; $$("img[data-src]", apps).forEach((im) => { im.src = im.dataset.src; im.removeAttribute("data-src"); }); ob.disconnect(); }, { rootMargin: "800px 0px" }).observe(apps);
    new IntersectionObserver(([e], ob) => { if (!e.isIntersecting) return; apps.classList.add("aberta"); relogio(); setInterval(relogio, 30000); ob.disconnect(); setTimeout(demo, 900); }, { threshold: 0, rootMargin: "0px 0px -35% 0px" }).observe(apps);
    if (semMov()) apps.classList.add("aberta");
  }
  
  const form = $("[data-form]");
  const sobre = $("[data-sobre]");
  let buildActual = "";
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-cta]");
    if (!a) return;
    const onde = a.dataset.cta, about = a.dataset.about || "";
    if (form) {
      $("[data-campo-cta]").value = onde;
      $("[data-campo-about]").value = about;
      const interesse = $("[data-campo-interesse]");
      if (about && interesse && [...interesse.options].some((o) => o.text === about)) interesse.value = about;
      if (sobre) {
        const txt = onde === "configurator" && buildActual ? TX.sobreBuild(buildActual) : about ? TX.sobre(about) : "";
        sobre.textContent = txt; sobre.hidden = !txt;
      }
    }
    evento("cta_click", { cta_location: onde, about });
  });
  
  const fixo = $(".cta-fixo");
  if (fixo) {
    const vistos = new Set();
    let passouHero = false;
    const actualiza = () => {
      const mostra = passouHero && vistos.size === 0;
      fixo.classList.toggle("fora", !mostra);
      fixo.setAttribute("aria-hidden", String(!mostra)); fixo.tabIndex = mostra ? 0 : -1;
    };
    const ioCta = new IntersectionObserver((es) => { es.forEach((e) => (e.isIntersecting ? vistos.add(e.target) : vistos.delete(e.target))); actualiza(); });
    $$(".btn, .form, .opcoes, .rodape-links, .ecras-nav").forEach((el) => { if (!el.closest(".cta-fixo")) ioCta.observe(el); });
    const heroSec = $(".hero");
    if (heroSec) new IntersectionObserver(([e]) => { passouHero = !e.isIntersecting; actualiza(); }, { rootMargin: "-40% 0px 0px 0px" }).observe(heroSec);
  }
  document.addEventListener("harbour:build", (e) => {
    buildActual = e.detail.texto;
    const campo = $("[data-campo-build]"); if (campo) campo.value = buildActual;
    evento("configurator_build_sent", { build: buildActual });
  });
  
  const palco = $(".palco3d");
  const estado = $("[data-p3-estado]");
  let pedido = false, ultimoScroll = 0;
  addEventListener("scroll", () => { ultimoScroll = performance.now(); }, { passive: true });
  const arranca = () => {
    if (pedido) return;
    if (performance.now() - ultimoScroll < 300) { setTimeout(arranca, 200); return; }
    pedido = true;
    const vai = () => import("./config3d.js").then((m) => m.iniciar(palco, $("[data-config]"))).catch((err) => {
      console.warn(err); if (estado) { estado.textContent = TX.sem3d; }
    });
    ("requestIdleCallback" in window) ? requestIdleCallback(vai, { timeout: 1500 }) : setTimeout(vai, 200);
  };
  if (palco) {
    const ioP = new IntersectionObserver(([e]) => { if (e.isIntersecting) { arranca(); ioP.disconnect(); } }, { rootMargin: "1400px 0px" });
    new IntersectionObserver(([e]) => { if (e.isIntersecting) { ultimoScroll = 0; arranca(); } }).observe(palco);
    if (document.readyState === "complete") ioP.observe(palco); else addEventListener("load", () => ioP.observe(palco), { once: true });
  }
  
  if (form) {
    const estadoF = $("[data-form-estado]", form);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      if (d.site_url) return;
      let primeiroErro = null;
      ["name", "email", "company"].forEach((k) => {
        const el = form.elements[k];
        const mau = k === "email" ? !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim()) : el.value.trim().length < 2;
        el.setAttribute("aria-invalid", String(mau));
        if (mau && !primeiroErro) primeiroErro = el;
      });
      if (primeiroErro) { estadoF.className = "form-estado erro"; estadoF.textContent = TX.falta; primeiroErro.focus(); return; }
      const corpo = { ...d, segment: seg(), origem, pagina: location.pathname, quando: new Date().toISOString() };
      delete corpo.site_url;
      const botao = form.querySelector("button[type=submit]");
      botao.disabled = true; estadoF.className = "form-estado"; estadoF.textContent = TX.aEnviar;
      let ok = false;
      if (CFG.form) {
        try {
          const r = await fetch(CFG.form, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corpo) });
          ok = r.ok;
        } catch (err) { ok = false; }
      }
      botao.disabled = false;
      if (ok) {
        estadoF.className = "form-estado ok";
        estadoF.textContent = TX.obrigado(d.name.trim().split(" ")[0]);
        form.reset(); if (tipo && TIPO[seg()]) tipo.value = TIPO[seg()];
        evento("form_submit", { form_result: "ok", cta_location: d.cta || "" });
      } else {
        const msg = `${TX.msg} ${d.name} · ${d.company} · ${d.email}${d.website ? " · " + d.website : ""} · ${d.type} · ${d.interest}${d.build ? ` · ${TX.build}: ` + d.build : ""}`;
        const wa = String(CFG.whatsapp || "").replace(/\D/g, "");
        const alt = wa ? { href: `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, txt: TX.porWa } : CFG.email ? { href: `mailto:${CFG.email}?subject=${encodeURIComponent(TX.assunto)}&body=${encodeURIComponent(msg)}`, txt: TX.porEmail } : null;
        estadoF.className = "form-estado erro";
        estadoF.textContent = alt ? TX.ocupado : !CFG.form ? TX.ensaio : TX.falhou;
        if (alt) { const a = document.createElement("a"); a.href = alt.href; a.textContent = alt.txt; a.dataset.cta = "form-fallback"; if (wa) { a.target = "_blank"; a.rel = "noopener"; } estadoF.appendChild(a); }
        evento("form_error", { cta_location: d.cta || "", fallback: alt ? (wa ? "whatsapp" : "email") : "none" });
      }
    });
  }
  
  const mov = $("[data-movimento]");
  if (mov) {
    mov.setAttribute("aria-pressed", String(semMov()));
    mov.addEventListener("click", () => {
      const liga = !semMov();
      H.classList.toggle("sem-movimento", liga); H.classList.remove("abre");
      guardar("hl-sem-movimento", liga ? "1" : "0");
      mov.setAttribute("aria-pressed", String(liga));
      if (liga) { [...filmes, hero].forEach((v) => v && v.pause()); $$(".revela, .h2, .aparelhos, .palco3d").forEach((el) => el.classList.add("vista")); H.classList.remove("abre"); $$("main > section").forEach((s) => s.classList.add("entrou")); }
      document.dispatchEvent(new CustomEvent("harbour:movimento", { detail: { sem: liga } }));
    });
  }
})();
