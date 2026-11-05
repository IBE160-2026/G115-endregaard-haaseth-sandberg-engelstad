// The demo dialogs (fixtures/<dialog>/NN.json) for tests and the browser. The server reads the same
// files from disk (server/providers). Each file is one user message and the AI turn that answers it.
import type { AiTurn } from './types';

export interface DemoStep {
  user: string;
  turn: AiTurn;
}

const files = import.meta.glob<{ default: DemoStep }>('../../fixtures/*/*.json', { eager: true });

/** Every demo dialog by name, steps in file order. */
export const DIALOGS: Record<string, DemoStep[]> = {};
for (const path of Object.keys(files).sort()) {
  const name = path.split('/').at(-2)!;
  (DIALOGS[name] ??= []).push(files[path].default);
}
