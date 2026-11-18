// Demo script progress, shared by the demo provider (server) and «Neste demo-replikk» (browser).
// A scripted step counts as answered only when the user sent that step's own line and got an answer,
// so free text never moves the demo along. No imports: node loads this file as it is.

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?…]+$/, '');

/** True when the user's text is the scripted line (case, spacing and closing punctuation ignored). */
export const sameLine = (text: string, line: string) => normalize(text) === normalize(line);

export interface ScriptProgress {
  /** Scripted steps already answered. */
  answered: number;
  /** The newest user text that has no answer yet, or null. */
  pending: string | null;
}

/**
 * Walks the dialog (the user's own words, without the greeting). A stopped or failed turn leaves two
 * user lines in a row; only the newer one is pending.
 */
export function scriptProgress(dialog: { role: 'user' | 'assistant'; text: string }[], script: string[]): ScriptProgress {
  let answered = 0;
  let pending: string | null = null;
  for (const m of dialog) {
    if (m.role === 'user') pending = m.text;
    else {
      if (pending !== null && answered < script.length && sameLine(pending, script[answered])) answered++;
      pending = null;
    }
  }
  return { answered, pending };
}
