// npm run smoke: starts the API in demo mode on a free port, POSTs one /api/turn/stream and checks
// that reply deltas and exactly one valid turn arrive. Exit 0 = OK, 1 = broken. Node runs this .ts directly.
// With SMOKE_URL=http://host:port it tests a running server instead (e.g. the day we get an API key).
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { parseSse, type StreamEvent } from '../src/contract/stream.ts';
import { schemaErrors } from '../src/contract/validate.ts';
import { handlerFromEnv } from '../server/http.ts';

function fail(message: string): never {
  console.error(`SMOKE FEILET: ${message}`);
  process.exit(1);
}

async function main() {
  let base = process.env.SMOKE_URL;
  let close = () => {};
  if (!base) {
    const handler = handlerFromEnv({ ...process.env, DEMO: '1' });
    const server = createServer((req, res) =>
      void handler(req, res, () => {
        res.statusCode = 404;
        res.end();
      }),
    );
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    close = () => server.close();
  }

  const started = Date.now();
  const res = await fetch(`${base}/api/turn/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'Hei, hva skal bygges?\n\nDobbelgarasje med loft' }] }),
    signal: AbortSignal.timeout(120_000),
  });
  if (res.status !== 200 || !res.body) fail(`status ${res.status}: ${await res.text()}`);
  if (!res.headers.get('content-type')?.includes('text/event-stream')) fail('ikke text/event-stream');

  const events: StreamEvent[] = [];
  let buffer = '';
  const decoder = new TextDecoder();
  for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
    const parsed = parseSse(buffer + decoder.decode(chunk, { stream: true }));
    events.push(...parsed.events);
    buffer = parsed.rest;
  }
  close();

  const errors = events.filter((e) => e.event === 'error');
  if (errors.length) fail(`error-event: ${JSON.stringify(errors[0].data)}`);
  const deltas = events.filter((e) => e.event === 'reply');
  const turns = events.filter((e) => e.event === 'turn');
  if (deltas.length === 0) fail('ingen reply-deltaer');
  if (turns.length !== 1) fail(`${turns.length} turn-eventer, ventet 1`);
  const problems = schemaErrors(turns[0].data);
  if (problems.length) fail(`turen følger ikke kontrakten: ${problems.slice(0, 3).join('; ')}`);
  const text = deltas.map((e) => (e.data as { delta: string }).delta).join('');
  if (text !== (turns[0].data as { reply: string }).reply) fail('deltaene stemmer ikke med reply');

  console.log(`SMOKE OK: ${deltas.length} reply-deltaer og én gyldig tur på ${Date.now() - started} ms (${base}).`);
  console.log(`Svar: ${text}`);
  process.exit(0);
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
