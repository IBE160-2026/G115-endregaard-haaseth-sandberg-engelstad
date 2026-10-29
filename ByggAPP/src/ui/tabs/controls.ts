// Shared crew and mode controls for Disiplinene and the org chart. Events are wired in main.ts.
import { crewBounds } from '../../engine/game';
import type { Mode, Scenario } from '../../engine/scenario';
import { icon } from './context';

const MODES: [Mode, string, string][] = [
  ['normal', 'Normal', 'decisions/mode-normal.svg'],
  ['overtime', 'Overtid', 'decisions/mode-overtime.svg'],
  ['hire', 'Ekstra innleie', 'decisions/mode-hire.svg'],
];

export function modeControl(taskId: string, mode: Mode, locked: boolean): string {
  const seg = MODES.map(([m, label, ic]) =>
    `<button type="button" data-task="${taskId}" data-mode="${m}" aria-pressed="${mode === m}" title="${label}"${locked ? ' disabled' : ''}>${icon(ic, 16)}<span>${label}</span></button>`).join('');
  return `<div class="seg" role="group" aria-label="Arbeidsmodus ${taskId}">${seg}</div>`;
}

export function crewControl(s: Scenario, taskId: string, crew: number, locked: boolean): string {
  const task = s.tasks.find(t => t.id === taskId)!;
  const { min, max } = crewBounds(s, task);
  const share = Math.round((crew / task.crew) * 100);
  const cls = crew < task.crew ? 'under' : crew > task.crew ? 'over' : 'base';
  const dis = (cond: boolean) => (locked || cond ? ' disabled' : '');
  return `<div class="crew ${cls}" role="group" aria-label="Mannskap ${taskId}">
    <button type="button" data-crew-task="${taskId}" data-crew="${crew - 2}" title="2 færre"${dis(crew <= min)}>−</button>
    <span class="crew-value"><b>${crew}</b> <small>${share} %</small></span>
    <button type="button" data-crew-task="${taskId}" data-crew="${crew + 2}" title="2 flere"${dis(crew >= max)}>+</button>
    ${crew !== task.crew ? `<button type="button" class="link" data-crew-task="${taskId}" data-crew="${task.crew}" title="Tilbake til grunnbemanning"${dis(false)}>Grunn ${task.crew}</button>` : ''}
  </div>`;
}
