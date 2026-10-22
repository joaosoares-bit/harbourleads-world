
(() => {
  const H = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const semMov = () => H.classList.contains("sem-movimento");
  const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const ler = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  H.classList.add("pronto");
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
  
  const fimAbertura = () => H.classList.remove("abre");
  if (H.classList.contains("abre")) {
    setTimeout(fimAbertura, 3700);
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach((t) => addEventListener(t, () => setTimeout(fimAbertura, 0), { once: true, passive: true }));
  }
  
  const TIPO = { yard: "Shipyard", broker: "Broker", charter: "Charter fleet" };
  function aplicarSeg(s, doUtilizador) {
    H.dataset.seg = s;
    $$(".segmento [data-seg]").forEach((b) => { const on = b.dataset.seg === s; b.setAttribute("aria-checked", String(on)); b.tabIndex = on ? 0 : -1; });
    const li = $(".titulo .li[data-txt-yard]");
    if (li) {
      const novo = li.dataset["txt" + s[0].toUpperCase() + s.slice(1)];
      if (novo && li.textContent !== novo) { li.textContent = novo; if (doUtilizador && !semMov()) { li.classList.remove("troca"); void li.offsetWidth; li.classList.add("troca"); } }
    }
    const tipo = $("[data-campo-tipo]"); if (tipo) tipo.value = TIPO[s];
    if (doUtilizador) { guardar("hl-seg", s); evento("segment_chosen", { segment_choice: s }); }
  }
  $$(".segmento [data-seg]").forEach((b) => b.addEventListener("click", () => { if (seg() !== b.dataset.seg) aplicarSeg(b.dataset.seg, true); }));
  const grupo = $(".segmento");
  if (grupo) grupo.addEventListener("keydown", (e) => {
    const ordem = ["yard", "broker", "charter"];
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return;
    e.preventDefault(); const s = ordem[(ordem.indexOf(seg()) + d + 3) % 3]; aplicarSeg(s, true); $(`.segmento [data-seg="${s}"]`).focus();
  });
  aplicarSeg(seg(), false);
  
  const topo = $(".topo");
  const pinta = () => topo.classList.toggle("solido", scrollY > 40);
  addEventListener("scroll", pinta, { passive: true }); pinta();
  
  const hero = $("[data-hero]");
  const vertical = () => matchMedia("(max-width: 760px)").matches;
  const fonteHero = () => {
    if (vertical()) return "filmes/hero-v.mp4";
    const px = innerWidth * Math.min(devicePixelRatio || 1, 2);
    return px > 2600 ? "filmes/hero-2160.mp4" : px > 1400 ? "filmes/hero-1080.mp4" : "filmes/hero-720.mp4";
  };
  if (hero) {
    hero.poster = vertical() ? "filmes/hero-v-480.webp" : "filmes/hero-1080.webp";
    let lcp = !("PerformanceObserver" in window), carregou = document.readyState === "complete";
    const tenta = () => {
      if (!lcp || !carregou || hero.src || semMov()) return;
      requestAnimationFrame(() => requestAnimationFrame(() => { hero.src = fonteHero(); const p = hero.play(); if (p && p.catch) p.catch(() => {}); }));
    };
    try { new PerformanceObserver((l) => { if (l.getEntries().length) { lcp = true; tenta(); } }).observe({ type: "largest-contentful-paint", buffered: true }); } catch (e) { lcp = true; }
    setTimeout(() => { lcp = true; tenta(); }, 2500);
    if (!carregou) addEventListener("load", () => { carregou = true; tenta(); }, { once: true }); else tenta();
    new IntersectionObserver(([e]) => { if (!hero.src) return; if (e.isIntersecting && !semMov() && !document.hidden) hero.play().catch(() => {}); else hero.pause(); }).observe(hero);
  }
  
  const filmes = $$("video[data-filme]");
  const fonteFilme = (v) => {
    if (v.dataset.filme === "demo-v") return "filmes/demo-v.mp4";
    const px = v.getBoundingClientRect().width * Math.min(devicePixelRatio || 1, 2);
    return px > 1000 ? "filmes/demo-1440.mp4" : "filmes/demo-960.mp4";
  };
  const capa = (v) => { if (v.dataset.poster && !v.poster) v.poster = v.dataset.poster; };
  const ioPerto = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { capa(e.target); ioPerto.unobserve(e.target); } }), { rootMargin: "600px 0px" });
  const ioVer = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting && !semMov() && !document.hidden) {
      capa(v); if (!v.src) v.src = fonteFilme(v);
      const p = v.play(); if (p && p.catch) p.catch(() => {});
    } else v.pause();
  }), { threshold: 0.25 });
  filmes.forEach((v) => { ioPerto.observe(v); ioVer.observe(v); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) [...filmes, hero].forEach((v) => v && v.pause()); });
  
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add(e.target.tagName === "SECTION" ? "entrou" : "vista"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px" });
  $$(".revela, .h2, .aparelhos, .palco3d, main > section").forEach((el) => {
    if (semMov()) el.classList.add(el.tagName === "SECTION" ? "entrou" : "vista"); else io.observe(el);
  });
  const ap = $(".aparelhos");
  if (ap) new IntersectionObserver(([e]) => ap.classList.toggle("vista", e.isIntersecting)).observe(ap);
  
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
        const txt = onde === "configurator" && buildActual ? `About: a configurator like this · your build: ${buildActual}` : about ? `About: ${about}` : "";
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
    $$(".btn, .topo-cta, .form, .opcoes, .rodape-links").forEach((el) => { if (!el.closest(".cta-fixo")) ioCta.observe(el); });
    const heroSec = $(".hero");
    if (heroSec) new IntersectionObserver(([e]) => { passouHero = !e.isIntersecting; actualiza(); }, { rootMargin: "-40% 0px 0px 0px" }).observe(heroSec);
  }
  
  const colNova = $("[data-col-new]");
  const conta = $("[data-conta-new]");
  const kpi = $("[data-kpi-novos]");
  let relogioFim = 0, relogioEl = null, relogioTimer = 0;
  const fmt = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
  const tique = () => { if (relogioEl) relogioEl.textContent = `Reply clock ${fmt(relogioFim - Date.now())}`; };
  function aterra(descricao, origemTxt) {
    if (!colNova) return;
    const antigo = colNova.querySelector(".cartao.novo");
    if (antigo) antigo.classList.remove("novo");
    const c = document.createElement("div");
    c.className = "cartao novo";
    c.innerHTML = `<b>Client A.</b><span></span><span class="relogio-resposta"></span><span class="tags"><em class="t-hot">Hot</em><em class="t-src"></em></span>`;
    c.children[1].textContent = descricao;
    c.querySelector(".t-src").textContent = origemTxt;
    colNova.querySelector("h4").after(c);
    if (antigo) antigo.remove();
    const n = colNova.querySelectorAll(".cartao").length;
    if (conta) conta.textContent = n;
    if (kpi) kpi.textContent = 18 + (n - 2);
    relogioEl = c.querySelector(".relogio-resposta"); relogioFim = Date.now() + 2 * 3600 * 1000; tique();
    clearInterval(relogioTimer); relogioTimer = setInterval(tique, 1000);
  }
  const crm = $(".crm");
  if (crm) {
    let primeira = true;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && primeira && !colNova.querySelector(".cartao.novo")) { primeira = false; aterra("Configured in midnight navy, teak deck", "Configurator"); }
    }, { threshold: 0.3 }).observe(crm);
  }
  document.addEventListener("harbour:build", (e) => {
    buildActual = e.detail.texto;
    const campo = $("[data-campo-build]"); if (campo) campo.value = buildActual;
    aterra(`Configured: ${e.detail.curto}`, "Configurator");
    evento("configurator_build_sent", { build: buildActual });
  });
  
  const palco = $(".palco3d");
  const estado = $("[data-p3-estado]");
  let pedido = false;
  const arranca = () => {
    if (pedido) return; pedido = true;
    const vai = () => import("./config3d.js").then((m) => m.iniciar(palco, $("[data-config]"))).catch((err) => {
      console.warn(err); if (estado) { estado.textContent = "3D needs a newer browser. Book a demo to see it live."; }
    });
    ("requestIdleCallback" in window) ? requestIdleCallback(vai, { timeout: 1500 }) : setTimeout(vai, 200);
  };
  if (palco) {
    const ioP = new IntersectionObserver(([e]) => { if (e.isIntersecting) { arranca(); ioP.disconnect(); } }, { rootMargin: "1400px 0px" });
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
      if (primeiroErro) { estadoF.className = "form-estado erro"; estadoF.textContent = "Please fill in your name, work email and company."; primeiroErro.focus(); return; }
      const corpo = { ...d, segment: seg(), origem, pagina: location.pathname, quando: new Date().toISOString() };
      delete corpo.site_url;
      const botao = form.querySelector("button[type=submit]");
      botao.disabled = true; estadoF.className = "form-estado"; estadoF.textContent = "Sending…";
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
        estadoF.textContent = `Thank you, ${d.name.trim().split(" ")[0]}. We will email you a time for the call.`;
        form.reset(); aplicarSeg(seg(), false);
        evento("form_submit", { form_result: "ok", cta_location: d.cta || "" });
      } else {
        const msg = `Hi Harbour Leads, I'd like to book a 15-minute demo. ${d.name} · ${d.company} · ${d.email}${d.website ? " · " + d.website : ""} · ${d.type} · ${d.interest}${d.build ? " · build: " + d.build : ""}`;
        const wa = String(CFG.whatsapp || "").replace(/\D/g, "");
        const alt = wa ? { href: `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, txt: "Send it on WhatsApp" } : CFG.email ? { href: `mailto:${CFG.email}?subject=${encodeURIComponent("15-minute demo")}&body=${encodeURIComponent(msg)}`, txt: "Send it by email" } : null;
        estadoF.className = "form-estado erro";
        estadoF.textContent = alt ? "Our form is busy right now. One tap sends the same request: " : !CFG.form ? "This preview is not connected yet, so nothing was sent." : "We could not send it right now. Please try again in a minute.";
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
      if (liga) { [...filmes, hero].forEach((v) => v && v.pause()); $$(".revela, .h2, .aparelhos, .palco3d").forEach((el) => el.classList.add("vista")); $$("main > section").forEach((s) => s.classList.add("entrou")); }
      document.dispatchEvent(new CustomEvent("harbour:movimento", { detail: { sem: liga } }));
    });
  }
})();
