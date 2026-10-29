import { describe, expect, it } from 'vitest';
import { addUser, newSession } from '../session';
import {
  addChip,
  canRetry,
  chatReducer,
  idleChat,
  isBusy,
  isSendKey,
  MSG_ABORTED,
  nextDemoLine,
  renderDemoNext,
  renderLog,
  type ChatAction,
  type ChatState,
} from './chat';

const run = (...actions: ChatAction[]) => actions.reduce<ChatState>(chatReducer, idleChat());

describe('chatReducer', () => {
  it('waiting → streaming → done', () => {
    const waiting = run({ type: 'send', projectId: 'p1' });
    expect(waiting.status).toBe('waiting');
    expect(isBusy(waiting)).toBe(true);
    const streaming = chatReducer(chatReducer(waiting, { type: 'delta', delta: 'Hei' }), { type: 'delta', delta: ' du' });
    expect(streaming).toMatchObject({ status: 'streaming', draft: 'Hei du', projectId: 'p1' });
    const done = chatReducer(streaming, { type: 'turn' });
    expect(done).toEqual({ status: 'idle', projectId: 'p1', draft: '', error: '' });
  });
  it('error keeps the draft and the message', () => {
    const s = run({ type: 'send', projectId: 'p1' }, { type: 'delta', delta: 'Ha' }, { type: 'error', message: 'Feil' });
    expect(s).toMatchObject({ status: 'error', error: 'Feil', draft: 'Ha' });
    expect(isBusy(s)).toBe(false);
  });
  it('abort says «Avbrutt»', () => {
    expect(run({ type: 'send', projectId: 'p1' }, { type: 'abort' })).toMatchObject({ status: 'aborted', error: MSG_ABORTED });
  });
  it('ignores a second send while busy and late events when idle', () => {
    const s = run({ type: 'send', projectId: 'p1' }, { type: 'send', projectId: 'p2' });
    expect(s.projectId).toBe('p1');
    expect(run({ type: 'delta', delta: 'x' })).toEqual(idleChat());
    expect(run({ type: 'turn' })).toEqual(idleChat());
    // An abort that lands after the turn changes nothing.
    expect(run({ type: 'send', projectId: 'p1' }, { type: 'turn' }, { type: 'abort' }).status).toBe('idle');
  });
  it('a new send clears an old error', () => {
    const s = run({ type: 'send', projectId: 'p1' }, { type: 'error', message: 'x' }, { type: 'send', projectId: 'p1' });
    expect(s).toMatchObject({ status: 'waiting', error: '' });
  });
});

describe('demo script', () => {
  const script = ['Dobbelgarasje med loft', 'Flat, langsiden', 'En meter lengre'];
  it('offers the line after the user messages so far', () => {
    let s = newSession();
    expect(nextDemoLine(s, script)).toBe(script[0]);
    s = addUser(s, 'noe');
    expect(nextDemoLine(s, script)).toBe(script[1]);
    s = addUser(addUser(s, 'a'), 'b');
    expect(nextDemoLine(s, script)).toBeNull();
    expect(nextDemoLine(newSession(), [])).toBeNull();
  });
  it('renders the button or the end note', () => {
    expect(renderDemoNext('Hei "du"', false)).toContain('title="Hei &quot;du&quot;"');
    expect(renderDemoNext('x', true)).toContain('disabled');
    expect(renderDemoNext(null, false)).toContain('Demoen er ferdig');
  });
});

describe('composer helpers', () => {
  it('adds a chip as its own line', () => {
    expect(addChip('', 'Tomt?', 'Flat')).toBe('Tomt? Flat');
    expect(addChip('Lengde 8 m  ', 'Tomt?', 'Flat')).toBe('Lengde 8 m\nTomt? Flat');
  });
  it('Enter sends, Shift+Enter does not', () => {
    expect(isSendKey({ key: 'Enter', shiftKey: false })).toBe(true);
    expect(isSendKey({ key: 'Enter', shiftKey: true })).toBe(false);
    expect(isSendKey({ key: 'Enter', shiftKey: false, isComposing: true })).toBe(false);
    expect(isSendKey({ key: 'a', shiftKey: false })).toBe(false);
  });
  it('retry only when the last message has no answer', () => {
    expect(canRetry(newSession())).toBe(false);
    expect(canRetry(addUser(newSession(), 'x'))).toBe(true);
  });
});

describe('renderLog', () => {
  const s = {
    ...addUser(newSession(), 'Garasje <b>'),
    entries: [
      ...addUser(newSession(), 'Garasje <b>').entries,
      { role: 'assistant' as const, text: 'Ok', questions: [{ text: 'Tomt?', options: ['Flat', 'Bratt'] }] },
    ],
  };
  it('shows the greeting, escapes text and offers chips on the newest turn', () => {
    const html = renderLog(s, idleChat(), { mine: true, demo: false });
    expect(html).toContain('Hei, hva skal bygges?');
    expect(html).toContain('Garasje &lt;b&gt;');
    expect(html).toContain('data-a="Flat"');
  });
  it('hides chips and shows «tenker…» while waiting', () => {
    const html = renderLog(s, run({ type: 'send', projectId: 'p' }), { mine: true, demo: false });
    expect(html).not.toContain('chip-btn');
    expect(html).toContain('tenker…');
  });
  it('streams the draft with a caret', () => {
    const html = renderLog(s, run({ type: 'send', projectId: 'p' }, { type: 'delta', delta: 'Bygger <nå>' }), { mine: true, demo: false });
    expect(html).toContain('Bygger &lt;nå&gt;');
    expect(html).toContain('class="caret"');
  });
  it('shows the error with a retry button when the last message is unanswered', () => {
    const u = addUser(newSession(), 'x');
    const html = renderLog(u, run({ type: 'send', projectId: 'p' }, { type: 'error', message: 'Nettfeil' }), { mine: true, demo: false });
    expect(html).toContain('Nettfeil');
    expect(html).toContain('data-action="retry"');
  });
  it('shows nothing of a stream that belongs to another project', () => {
    const html = renderLog(s, run({ type: 'send', projectId: 'other' }), { mine: false, demo: false });
    expect(html).not.toContain('tenker');
    expect(html).toContain('chip-btn');
  });
});
