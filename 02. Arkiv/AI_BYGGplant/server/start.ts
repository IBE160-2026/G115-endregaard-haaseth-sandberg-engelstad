// The production server: serves the built app from dist/ and the API (server/http.ts).
// Run `npm run build`, then `npm start` (PORT defaults to 8080). Node runs this .ts file directly.
// Without ANTHROPIC_API_KEY (or with DEMO=1) it serves the scripted, clearly labelled demo dialog.
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { handlerFromEnv, ROOT } from './http.ts';

const DIST = join(ROOT, 'dist');
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

if (existsSync(join(ROOT, '.env'))) process.loadEnvFile(join(ROOT, '.env'));
if (!existsSync(join(DIST, 'index.html'))) {
  console.error('Fant ikke dist/. Kjør npm run build først.');
  process.exit(1);
}

/** The file under dist/ for a URL path, or index.html; never a path outside dist/. */
function staticFile(urlPath: string): string {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^([/\\])+/, '');
  const file = join(DIST, clean);
  if (!file.startsWith(DIST) || !existsSync(file) || extname(file) === '') return join(DIST, 'index.html');
  return file;
}

const api = handlerFromEnv(process.env);
const port = Number(process.env.PORT || 8080);
const mode = process.env.ANTHROPIC_API_KEY && process.env.DEMO !== '1' ? 'Claude' : 'demo (forhåndsskrevet dialog, ikke live AI)';

createServer((req, res) => {
  void api(req, res, () => {
    try {
      const file = staticFile(req.url ?? '/');
      res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
      res.end(readFileSync(file));
    } catch {
      res.statusCode = 400;
      res.end();
    }
  });
}).listen(port, () => console.log(`AI Byggplan kjører på http://localhost:${port} – ${mode}`));
