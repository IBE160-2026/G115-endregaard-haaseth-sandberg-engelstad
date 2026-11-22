import { describe, expect, it, vi } from 'vitest';
import { onAction, setHtml, type ClickRoot } from './dom';

describe('setHtml', () => {
  it('writes new HTML and returns true', () => {
    const el = { innerHTML: '' };
    expect(setHtml(el, '<p>a</p>')).toBe(true);
    expect(el.innerHTML).toBe('<p>a</p>');
  });

  it('leaves the element alone when the HTML is the same', () => {
    let writes = 0;
    let html = '';
    const el = {
      get innerHTML() { return html; },
      set innerHTML(v: string) { writes++; html = v; },
    };
    setHtml(el, '<p>a</p>');
    expect(setHtml(el, '<p>a</p>')).toBe(false);
    expect(writes).toBe(1);
    expect(setHtml(el, '<p>b</p>')).toBe(true);
    expect(writes).toBe(2);
  });
});

/** A fake element whose closest() finds the given action holder only for the selector '[data-action]'. */
function fakeTarget(holder: { dataset: { action?: string } } | null) {
  return { closest: (selector: string) => (selector === '[data-action]' ? holder : null) };
}

function fakeRoot() {
  let listener: ((e: Event) => void) | undefined;
  const root: ClickRoot = { addEventListener: (_type, l) => { listener = l; } };
  const click = (target: unknown) => listener!({ target } as unknown as Event);
  return { root, click };
}

describe('onAction', () => {
  it('runs the handler for the nearest data-action once, with that element', () => {
    const { root, click } = fakeRoot();
    const start = vi.fn();
    onAction(root, { start });
    const holder = { dataset: { action: 'start' } };
    click(fakeTarget(holder));
    expect(start).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledWith(holder);
  });

  it('does nothing for an unknown action', () => {
    const { root, click } = fakeRoot();
    const start = vi.fn();
    onAction(root, { start });
    expect(() => click(fakeTarget({ dataset: { action: 'toString' } }))).not.toThrow();
    click(fakeTarget({ dataset: { action: 'stop' } }));
    expect(start).not.toHaveBeenCalled();
  });

  it('does nothing when no element has data-action', () => {
    const { root, click } = fakeRoot();
    const start = vi.fn();
    onAction(root, { start });
    click(fakeTarget(null));
    click(null);
    click({}); // a target without closest(), such as a text node
    click(fakeTarget({ dataset: { action: '' } }));
    expect(start).not.toHaveBeenCalled();
  });
});
