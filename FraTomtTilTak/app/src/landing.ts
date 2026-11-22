// Landing page for Fra tomt til tak while the app is built (concept "filmisk", 2026-11-22).
// The building rises through the six main parts as the visitor scrolls.
// Replaced when the first playable version is ready (story 1.6 onwards).

const NS = 'http://www.w3.org/2000/svg';

const CSS = `
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: #0f0e0c; color: #e9e2d6; font: 16px/1.55 Inter, 'Segoe UI', system-ui, sans-serif; }
a { color: inherit; }
.serif { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; }
.eyebrow { font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: #a7a197; }
.wrap { width: min(1280px, 100% - 48px); margin-inline: auto; }
.btn { display: inline-block; background: #c8a96a; color: #14120e; font-weight: 600; border-radius: 999px; padding: 13px 26px; text-decoration: none; }
.btn:hover { background: #d8bd84; }
.link { text-decoration: none; border-bottom: 1px solid #5a5246; padding: 6px 2px; }
.link:hover { border-color: #c8a96a; }
:focus-visible { outline: 2px solid #c8a96a; outline-offset: 3px; }

.nav { display: flex; align-items: center; gap: 28px; padding: 24px 0; font-size: 14px; }
.nav .brand { font-size: 22px; font-style: italic; margin-right: auto; }
.nav a { text-decoration: none; }
.nav a:hover { color: #c8a96a; }
.nav .pill { border: 1px solid #5a5246; border-radius: 999px; padding: 7px 16px; font-weight: 600; text-decoration: none; }

.hero { min-height: 100vh; background: radial-gradient(ellipse at 72% 60%, #2a241b 0%, #0f0e0c 62%); display: flex; flex-direction: column; }
.hero-grid { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); align-items: center; gap: 24px; padding-bottom: 48px; }
.hero h1 { margin: 20px 0 0; font-size: clamp(64px, 11vw, 150px); line-height: .9; letter-spacing: -.02em; }
.hero h1 em { display: block; color: #c8a96a; }
.hero p { margin: 24px 0 0; max-width: 480px; font-size: 18px; color: #cfc7b9; }
.hero .cta { margin-top: 28px; display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
.facts { margin-top: 24px; display: flex; gap: 24px; flex-wrap: wrap; font-size: 13px; color: #a7a197; font-variant-numeric: tabular-nums; }
.up { opacity: 0; transform: translateY(28px); animation: up .9s cubic-bezier(.2,.7,.2,1) forwards; }
@keyframes up { to { opacity: 1; transform: none; } }
.draw { opacity: 0; animation: fadein 1s ease forwards; }
@keyframes fadein { to { opacity: 1; } }

.build { height: 520vh; background: #17150f; position: relative; }
.build-sticky { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; justify-content: center; gap: 28px; }
.build h2, .stages h2 { margin: 8px 0 0; font-size: clamp(40px, 5.5vw, 68px); line-height: 1; }
.build h2 em { color: #c8a96a; }
.build-grid { display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 40px; align-items: stretch; }
.steps { list-style: none; margin: 0; padding: 0; }
.steps li { display: flex; gap: 18px; padding: 12px 0; border-top: 1px solid #2e2a22; color: #5e594f; transition: color .3s, border-color .3s; }
.steps li:last-child { border-bottom: 1px solid #2e2a22; }
.steps li .n { font-size: 20px; width: 32px; }
.steps li small { display: block; font-size: 12px; opacity: .8; }
.steps li.done { color: #a7a197; }
.steps li.on { color: #e9e2d6; border-top-color: #c8a96a; }
.steps li.on .n { color: #c8a96a; }
.stage { position: relative; border: 1px solid #2e2a22; border-radius: 4px; height: min(64vh, 620px); background: radial-gradient(ellipse at 50% 62%, #27221a 0%, #17150f 72%); }
.stage .numeral { position: absolute; top: 12px; right: 24px; font-size: clamp(56px, 7vw, 88px); line-height: 1; color: #c8a96a; font-style: italic; }
.stage .caption { position: absolute; left: 20px; bottom: 16px; font-size: 13px; color: #a7a197; }
.stage svg { position: absolute; inset: 40px 20px 36px; width: calc(100% - 40px); height: calc(100% - 76px); }

.stages { background: #ede6da; color: #14120e; padding: 120px 0; }
.stages .eyebrow { color: #6b6458; }
.stages h2 em { color: #8a6a2f; }
.cols { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px; margin-top: 64px; }
.cols > div { border-top: 1px solid #14120e; padding-top: 18px; opacity: 0; transform: translateY(32px); transition: opacity .8s, transform .8s; }
.cols > div:nth-child(2) { transition-delay: .15s; } .cols > div:nth-child(3) { transition-delay: .3s; }
.cols.in > div { opacity: 1; transform: none; }
.cols h3 { margin: 0; font-size: 44px; font-style: italic; }
.cols p { color: #3d3830; } .cols span { font-size: 13px; color: #6b6458; }

.stats { padding: 120px 0; }
.stats-row { display: flex; gap: 80px; flex-wrap: wrap; align-items: flex-end; }
.stats .big { font-size: clamp(88px, 12vw, 160px); line-height: 1; color: #c8a96a; font-variant-numeric: tabular-nums; }
.stats p.note { margin: 28px 0 0; font-size: clamp(22px, 2.4vw, 32px); font-style: italic; max-width: 760px; }
.end { margin-top: 96px; padding-top: 32px; border-top: 1px solid #2e2a22; display: flex; gap: 28px; align-items: center; flex-wrap: wrap; }
.end .serif { font-size: 40px; } .end em { color: #c8a96a; }
.end .status { font-size: 14px; color: #a7a197; }
footer { padding: 32px 0 48px; font-size: 13px; color: #7d776c; }

@media (max-width: 900px) {
  .hero-grid, .build-grid, .cols { grid-template-columns: 1fr; }
  .hero svg { max-height: 320px; }
  .build-grid .steps { display: none; }
  .stage { height: 52vh; }
  .nav a:not(.pill) { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .up, .draw { animation: none; opacity: 1; transform: none; }
  .cols > div { transition: none; }
}
`;

const PLOT = '<polygon points="300,170 508,290 326,395 118,275" fill="#22201a" stroke="#6f7d4f"></polygon>';
const FOOT = '<polygon points="300,230 404,290 326,335 222,275" fill="rgba(200,169,106,.08)" stroke="#c8a96a" stroke-dasharray="6 5" stroke-width="1.5"></polygon>';
const STAKES = '<g fill="#c8a96a"><circle cx="300" cy="230" r="3"></circle><circle cx="404" cy="290" r="3"></circle><circle cx="326" cy="335" r="3"></circle><circle cx="222" cy="275" r="3"></circle></g>';

const STEPS: { title: string; weeks: string; caption: string }[] = [
  { title: 'Prosjektering og tillatelse', weeks: '12 uker', caption: 'Uke 0–12 · tomta stikkes ut og tillatelsen kommer' },
  { title: 'Grunnarbeid', weeks: '13 uker', caption: 'Uke 12–25 · byggegropa graves og fundamentet støpes' },
  { title: 'Råbygg', weeks: '8 uker · stål', caption: 'Uke 25–33 · stålet reises, sju etasjer' },
  { title: 'Tett bygg', weeks: '10 uker', caption: 'Uke 33–43 · fasaden lukker bygget' },
  { title: 'Teknikk og innredning', weeks: '10 uker', caption: 'Uke 43–53 · teknikk og innredning, lyset tennes' },
  { title: 'Overlevering', weeks: '5 uker', caption: 'Uke 53–58 · overlevering, med hage og trær' },
];

const REPO = 'https://github.com/IBE160-2026/G115-endregaard-haaseth-sandberg-engelstad';

function html(): string {
  const steps = STEPS.map((s, i) => `<li data-i="${i + 1}"><span class="n serif">0${i + 1}</span><span>${s.title}<small>${s.weeks}</small></span></li>`).join('');
  return `
<header class="hero">
  <nav class="nav wrap" aria-label="Hovedmeny">
    <span class="brand serif">fra tomt til tak</span>
    <a href="#slik">Slik fungerer det</a>
    <a href="#bygget">Bygget</a>
    <a class="pill" href="spill/">Spill</a>
  </nav>
  <div class="hero-grid wrap">
    <div>
      <div class="eyebrow up" style="animation-delay:.1s">En simulator i prosjektledelse · 20 minutter</div>
      <h1 class="serif"><span class="up" style="display:block;animation-delay:.3s">Fra tomt</span><em class="up" style="animation-delay:.7s">til tak.</em></h1>
      <p class="up" style="animation-delay:1.1s">Du er prosjektlederen for et kontorbygg i Oslo sentrum. Planlegg det, bygg det, og se hvorfor det gikk som det gikk.</p>
      <div class="cta up" style="animation-delay:1.4s"><a class="btn" href="spill/">Spill prototypen</a><a class="link" href="#slik">Se hvordan det virker</a></div>
      <div class="facts up" style="animation-delay:1.6s"><span>100 arbeidsplasser</span><span>Mål: uke 67</span><span>Budsjett: 171 MNOK</span></div>
    </div>
    <svg viewBox="100 90 430 320" role="img" aria-label="En tom tomt i skumring. Fotavtrykket til bygget er stukket ut, og et gjennomsiktig omriss viser bygget som skal reises.">
      ${PLOT}
      <g class="draw" style="animation-delay:2s" stroke="rgba(233,226,214,.3)" stroke-dasharray="4 4" fill="none">
        <polygon points="300,125 404,185 326,230 222,170"></polygon>
        <line x1="300" y1="230" x2="300" y2="125"></line><line x1="404" y1="290" x2="404" y2="185"></line><line x1="326" y1="335" x2="326" y2="230"></line><line x1="222" y1="275" x2="222" y2="170"></line>
      </g>
      <g class="draw" style="animation-delay:1s">${FOOT}${STAKES}</g>
    </svg>
  </div>
</header>

<main>
  <section id="bygget" class="build" aria-label="Bygget, del for del">
    <div class="build-sticky wrap">
      <div><div class="eyebrow">Seks hoveddeler · scroll for å bygge</div><h2 class="serif">Bygget, <em>del for del.</em></h2></div>
      <div class="build-grid">
        <ol class="steps">${steps}</ol>
        <div class="stage">
          <span class="numeral serif" aria-hidden="true">01.</span>
          <span class="caption" aria-live="polite">${STEPS[0].caption}</span>
          <svg viewBox="130 105 370 290" role="img" aria-label="Kontorbygget på sju etasjer reises del for del mens du scroller.">
            ${PLOT}
            <g id="b-foot">${FOOT}${STAKES}</g>
            <polygon id="b-pit" points="300,214 428,288 326,349 198,275" fill="#141209"></polygon>
            <g id="b-slab"><polygon points="222,275 326,335 326,329 222,269" fill="#8f8576"></polygon><polygon points="404,290 326,335 326,329 404,284" fill="#a89d8c"></polygon><polygon points="300,224 404,284 326,329 222,269" fill="#c9bda9"></polygon></g>
            <g id="b-cols" stroke="#c8a96a" stroke-width="2"></g>
            <g id="b-floors" fill="rgba(200,169,106,.10)" stroke="#c8a96a" stroke-width="1.5"></g>
            <g id="b-env">
              <polygon points="222,275 326,335 326,230 222,170" fill="#cdbfa6"></polygon>
              <polygon points="404,290 326,335 326,230 404,185" fill="#e2d6c0"></polygon>
              <polygon points="300,125 404,185 326,230 222,170" fill="#efe6d6"></polygon>
              <g id="b-win" stroke-width="5"></g>
            </g>
            <g id="b-trees"></g>
          </svg>
        </div>
      </div>
    </div>
  </section>

  <section id="slik" class="stages">
    <div class="wrap">
      <div class="eyebrow">Slik fungerer det</div>
      <h2 class="serif">Tre stadier. <em>Ett bygg.</em></h2>
      <div class="cols">
        <div><h3 class="serif">Planlegg</h3><p>Velg høyde og bæresystem, anslå tidsplanen og møt risikoene. Rådgiver foreslår og advarer, men du bestemmer.</p><span>Ca. 10 minutter</span></div>
        <div><h3 class="serif">Bygg</h3><p>Planen møter virkeligheten. Hendelser tvinger fram valg, og du ser din vei ved siden av KI-ens.</p><span>Ca. 6 minutter</span></div>
        <div><h3 class="serif">Lær</h3><p>Budsjettbroen viser hvor avviket kom fra, og hvilke av valgene dine som betydde mest.</p><span>Ca. 4 minutter</span></div>
      </div>
    </div>
  </section>

  <section class="stats" aria-label="Hvorfor">
    <div class="wrap">
      <div class="stats-row">
        <div><span class="big serif" data-to="32">0 %</span><div>over tidsplanen</div></div>
        <div><span class="big serif" data-to="62">0 %</span><div>over budsjettet</div></div>
      </div>
      <p class="note serif">I snitt, for byggeprosjekter. Finn ut hvorfor ved å gjøre det selv.</p>
      <div id="status" class="end">
        <span class="serif">Fra tomt <em>til tak.</em></span>
        <a class="btn" href="spill/">Spill prototypen</a>
        <a class="link" href="${REPO}">Følg utviklingen på GitHub</a>
        <span class="status">Prototypen har hele spillrunden, men ikke 3D og språkmodell ennå. Den ferdige appen bygges nå.</span>
      </div>
    </div>
  </section>
</main>
<footer class="wrap">Gruppe G115 · IBE160 Programmering med KI · Høgskolen i Molde · høsten 2026</footer>`;
}

function el(tag: string, attrs: Record<string, string | number>, parent: Element): SVGElement {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent.appendChild(e);
  return e;
}

const clamp = (x: number): number => Math.max(0, Math.min(1, x));
const ss = (a: number, b: number, t: number): number => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const mix = (a: number, b: number, p: number): number => a + (b - a) * p;

export function mountLanding(root: HTMLElement): void {
  const fonts = document.createElement('link');
  fonts.rel = 'stylesheet';
  fonts.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap';
  document.head.append(fonts);
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);
  root.innerHTML = html();

  const q = <T extends Element>(sel: string): T => root.querySelector(sel) as T;
  const cols = [[300, 230], [404, 290], [326, 335], [222, 275], [365, 312], [274, 305]].map(([x, y]) => el('line', { x1: x, y1: y, x2: x, y2: y }, q('#b-cols')));
  const floors: SVGElement[] = [];
  for (let k = 1; k <= 7; k++) floors.push(el('polygon', { points: `300,${230 - 15 * k} 404,${290 - 15 * k} 326,${335 - 15 * k} 222,${275 - 15 * k}` }, q('#b-floors')));
  const wins: SVGElement[] = [];
  for (let k = 1; k <= 7; k++) {
    const o = 7.5 + 15 * (k - 1);
    wins.push(el('line', { x1: 398, y1: 293.5 - o, x2: 332, y2: 331.5 - o }, q('#b-win')));
    wins.push(el('line', { x1: 230, y1: 279.6 - o, x2: 318, y2: 330.4 - o }, q('#b-win')));
  }
  const trees = [[456, 290, 16], [170, 275, 13], [274, 362, 14], [470, 320, 11]].map(([x, y, r]) => {
    const g = el('g', {}, q('#b-trees'));
    el('line', { x1: 0, y1: 0, x2: 0, y2: -14, stroke: '#5a4a35', 'stroke-width': 3 }, g);
    el('circle', { cx: 0, cy: -14 - r * 0.8, r, fill: '#6f7d4f' }, g);
    return { g, x, y };
  });

  const build = q<HTMLElement>('.build');
  const numeral = q<HTMLElement>('.numeral');
  const caption = q<HTMLElement>('.caption');
  const items = Array.from(root.querySelectorAll<HTMLLIElement>('.steps li'));
  const opacity = (sel: string, v: number): void => { q<SVGElement>(sel).style.opacity = String(v); };
  let lastStage = 0;
  let view3d: { setU(u: number): void } | null = null;

  const draw = (u: number): void => {
    view3d?.setU(u);
    const p2 = ss(1.5, 3.0, u), p4 = ss(5.5, 7.0, u), p5 = ss(7.0, 8.5, u);
    opacity('#b-foot', ss(0, 1.2, u) * (1 - p2 * 0.7));
    opacity('#b-pit', p2);
    opacity('#b-slab', ss(2.0, 3.0, u));
    const rise = ss(3.0, 4.2, u);
    cols.forEach((c) => c.setAttribute('y2', String(Number(c.getAttribute('y1')) - 105 * rise)));
    floors.forEach((f, i) => { const v = ss(3.4 + i * 0.28, 3.8 + i * 0.28, u); f.style.opacity = String(v); f.setAttribute('transform', `translate(0 ${(1 - v) * -14})`); });
    opacity('#b-cols', 1 - p4 * 0.9);
    opacity('#b-floors', 1 - p4);
    opacity('#b-env', p4);
    const lit = `rgb(${Math.round(mix(58, 242, p5))},${Math.round(mix(58, 199, p5))},${Math.round(mix(51, 121, p5))})`;
    wins.forEach((w) => w.setAttribute('stroke', lit));
    trees.forEach((t, i) => { const v = ss(8.5 + i * 0.3, 9.3 + i * 0.3, u); t.g.setAttribute('transform', `translate(${t.x} ${t.y}) scale(${v})`); });
    const stage = u < 1.5 ? 1 : u < 3.0 ? 2 : u < 5.5 ? 3 : u < 7.0 ? 4 : u < 8.5 ? 5 : 6;
    if (stage !== lastStage) {
      lastStage = stage;
      numeral.textContent = `0${stage}.`;
      caption.textContent = STEPS[stage - 1].caption;
      items.forEach((li) => { const i = Number(li.dataset.i); li.classList.toggle('on', i === stage); li.classList.toggle('done', i < stage); });
    }
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticking = false;
  const onScroll = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const span = build.offsetHeight - window.innerHeight;
      const p = clamp((window.scrollY - build.offsetTop) / span);
      draw(reduced ? 10 : 0.3 + p * 9.9);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // The real-time 3D building replaces the flat drawing when WebGL is available.
  const canGL = ((): boolean => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') ?? c.getContext('webgl')); } catch { return false; }
  })();
  if (canGL && !reduced) {
    import('./landing3d').then(({ mountBuilding3D }) => {
      const stage = q<HTMLElement>('.stage');
      view3d = mountBuilding3D(stage);
      q<SVGElement>('.stage svg').style.display = 'none';
      lastStage = 0;
      onScroll();
    }).catch(() => { /* keep the flat drawing */ });
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      e.target.querySelectorAll<HTMLElement>('[data-to]').forEach((n) => {
        const to = Number(n.dataset.to);
        const start = performance.now();
        const step = (now: number): void => {
          const p = reduced ? 1 : ss(0, 1600, now - start);
          n.textContent = `${Math.round(to * p)} %`;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
      io.unobserve(e.target);
    }
  }, { threshold: 0.35 });
  io.observe(q('.cols'));
  io.observe(q('.stats-row'));
}
