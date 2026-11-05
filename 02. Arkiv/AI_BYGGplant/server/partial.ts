// Pulls the value of the "reply" string out of a JSON text that is still being written, so the
// browser can show the reply while the rest of the turn (the project) streams in behind it.
// Incremental: push() each text delta and get back only the new characters. Never throws.

const KEY = /"reply"\s*:\s*"/;
const HEX4 = /^[0-9a-fA-F]{4}$/;
const SIMPLE: Record<string, string> = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };

const isHigh = (c: number) => c >= 0xd800 && c <= 0xdbff;

export class ReplyExtractor {
  private buffer = '';
  /** Where the next undecoded character of the reply is, or -1 before the key is found. */
  private pos = -1;
  private done = false;
  private value = '';

  /** The reply decoded so far. */
  get reply(): string {
    return this.value;
  }

  /** True once the closing quote has been seen. */
  get complete(): boolean {
    return this.done;
  }

  /** Adds a chunk of the JSON text; returns the reply characters it completed (often ''). */
  push(chunk: string): string {
    if (this.done || !chunk) return '';
    this.buffer += chunk;
    if (this.pos < 0) {
      const m = KEY.exec(this.buffer);
      if (!m) return '';
      this.pos = m.index + m[0].length;
    }
    let out = '';
    const b = this.buffer;
    let i = this.pos;
    while (i < b.length) {
      const ch = b[i];
      if (ch === '"') {
        this.done = true;
        i++;
        break;
      }
      if (ch === '\\') {
        if (i + 1 >= b.length) break; // the escape is not complete yet
        const e = b[i + 1];
        if (e === 'u') {
          const hex = b.slice(i + 2, i + 6);
          if (hex.length < 4) break;
          if (!HEX4.test(hex)) {
            // Not valid JSON; keep the text rather than throw.
            out += '\\u';
            i += 2;
            continue;
          }
          const code = parseInt(hex, 16);
          if (isHigh(code)) {
            // Hold a high surrogate back until we know whether its low half follows.
            const next = b.slice(i + 6, i + 12);
            const mayBePair = next.length < 2 ? next === '' || next === '\\' : next.startsWith('\\u');
            if (mayBePair && next.length < 6) break;
            if (/^\\u[dD][c-fC-F][0-9a-fA-F]{2}$/.test(next)) {
              out += String.fromCharCode(code, parseInt(next.slice(2), 16));
              i += 12;
              continue;
            }
          }
          out += String.fromCharCode(code);
          i += 6;
          continue;
        }
        out += SIMPLE[e] ?? e;
        i += 2;
        continue;
      }
      // A raw high surrogate at the very end: wait for its other half.
      if (isHigh(ch.charCodeAt(0)) && i + 1 >= b.length) break;
      out += ch;
      i++;
    }
    // Keep the buffer small: drop what is decoded.
    this.buffer = b.slice(i);
    this.pos = 0;
    this.value += out;
    return out;
  }
}

/** The reply decoded from a prefix of a turn's JSON text ('' if it has not started). */
export function partialReply(prefix: string): string {
  const x = new ReplyExtractor();
  x.push(prefix);
  return x.reply;
}
