// Placeholder for Fra tomt til tak while the new app is built.
// The v0.5 game code under src/ is no longer started from here and is removed in story 1.6;
// the v0.5 game itself is kept as the git tag `v0.5`.
// Colours and type follow DESIGN.md (direction "Prosjektverktøy").

const style = document.createElement('style');
style.textContent = `
  :root { color-scheme: light; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: #f3f3f3; color: #1b1b1b;
    font: 16px/1.5 "Segoe UI Variable", "Segoe UI", system-ui, sans-serif;
  }
  main {
    box-sizing: border-box; width: min(560px, calc(100vw - 32px)); padding: 32px;
    background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;
  }
  h1 { margin: 0 0 4px; font-size: 28px; line-height: 1.25; font-weight: 600; }
  .status { margin: 0 0 20px; color: #005fb8; font-weight: 600; }
  p { margin: 0 0 12px; }
  .muted { color: #5f5f5f; font-size: 14px; margin: 20px 0 0; }
`;
document.head.append(style);

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <main>
    <h1>Fra tomt til tak</h1>
    <p class="status">Under utvikling</p>
    <p>En simulator på 20 minutter der du er prosjektleder for et kontorbygg nær Oslo sentrum:
      du planlegger prosjektet med en KI-rådgiver ved siden av deg, ser planen bli satt på prøve,
      og får forklart hvorfor resultatet ble som det ble.</p>
    <p>Den nye appen bygges nå. Denne siden byttes ut når første versjon er klar.</p>
    <p class="muted">Gruppe G115, IBE160 Programmering med KI, Høgskolen i Molde, høsten 2026.</p>
  </main>
`;
