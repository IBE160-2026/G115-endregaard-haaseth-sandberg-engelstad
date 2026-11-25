import { describe, expect, it } from 'vitest';
import { nearestPrepared, type PreparedAnswer } from './prepared';

const a = (id: string, step: string, question: string, keywords?: string[]): PreparedAnswer => ({
  id, step, question, keywords, render: () => id,
});
const answers = [
  a('reserve', 'risk', 'Hvor stor reserve trenger jeg?'),
  a('frame', 'estimate', 'Hvor lang tid tar råbygget?'),
  a('crew', 'estimate', 'Hjelper det med flere arbeidere?', ['mannskap', 'overtid']),
];

describe('nearestPrepared', () => {
  it('picks the answer with the most shared words', () => {
    expect(nearestPrepared('Hvorfor tar råbygget så lang tid?', 'estimate', answers)?.id).toBe('frame');
  });
  it('matches on keywords', () => {
    expect(nearestPrepared('Bør jeg bruke overtid?', 'estimate', answers)?.id).toBe('crew');
  });
  it('can pick an answer from another step when it matches better', () => {
    expect(nearestPrepared('Hvor stor reserve?', 'estimate', answers)?.id).toBe('reserve');
  });
  it("with no overlap, gives the current step's first answer", () => {
    expect(nearestPrepared('Hva er favorittfargen din?', 'estimate', answers)?.id).toBe('frame');
  });
  it('returns null when there are no answers', () => {
    expect(nearestPrepared('Hei', 'estimate', [])).toBeNull();
  });
});
