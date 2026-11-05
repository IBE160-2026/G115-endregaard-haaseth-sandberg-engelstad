// The API as a Vercel Function (the ai_byggplant_api service in ../../vercel.json).
// Vercel passes the full public path, e.g. /ai-byggplant/api/config, so the mount prefix is cut
// off before the shared handler (server/http.ts) matches its /api/... routes.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handlerFromEnv, type Handler } from './http.ts';

let handler: Handler | null = null;

export default function vercelApi(req: IncomingMessage, res: ServerResponse) {
  handler ??= handlerFromEnv(process.env);
  const url = req.url ?? '/';
  const at = url.indexOf('/api/');
  if (at > 0) req.url = url.slice(at);
  return handler(req, res, () => {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Fant ikke.' }));
  });
}
