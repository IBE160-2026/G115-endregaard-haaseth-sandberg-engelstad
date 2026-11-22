// DOM helpers kept from v0.5 main.ts (AD-17): write HTML only when it changed,
// and one delegated click listener that maps data-action to a handler.

/** The parts of an element that setHtml needs. */
export interface HtmlTarget {
  innerHTML: string;
}

const shownHtml = new WeakMap<HtmlTarget, string>();

/**
 * Only touches the DOM when the HTML really changed (keeps focus, hover and animations).
 * It compares with the HTML it wrote last, so it must be the only writer of `el`'s innerHTML.
 */
export function setHtml(el: HtmlTarget, html: string): boolean {
  if (shownHtml.get(el) === html) return false;
  el.innerHTML = html;
  shownHtml.set(el, html);
  return true;
}

export type ActionHandlers = Record<string, (el: HTMLElement) => void>;

/** The parts of a root element that onAction needs. */
export interface ClickRoot {
  addEventListener(type: 'click', listener: (e: Event) => void): void;
}

/** One click listener on root: the nearest [data-action] decides which handler runs. */
export function onAction(root: ClickRoot, handlers: ActionHandlers): void {
  root.addEventListener('click', e => {
    const target = e.target as Element | null;
    const el = target?.closest?.<HTMLElement>('[data-action]');
    const action = el?.dataset.action;
    if (!el || !action || !Object.hasOwn(handlers, action)) return;
    handlers[action](el);
  });
}
