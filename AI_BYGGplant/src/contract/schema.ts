// The JSON schema Claude answers in (structured output, strict). Mirrors types.ts; the contract
// tests check that every fixture passes both. Owner: WS1. Property order puts `reply` first so it streams first.

type Schema = Record<string, unknown>;

const str = { type: 'string' } as const;
const num = { type: 'number' } as const;
const int = { type: 'integer' } as const;
const nullable = (type: string) => ({ type: [type, 'null'] });
const strings = { type: 'array', items: str } as const;
const enumOf = (...values: string[]) => ({ type: 'string', enum: values });

/** A strict object: every property is required and nothing else is allowed. */
function obj(properties: Record<string, Schema>): Schema {
  return { type: 'object', additionalProperties: false, required: Object.keys(properties), properties };
}
const arrayOf = (items: Schema) => ({ type: 'array', items });
/** A section that may be null (= unchanged). */
const orNull = (s: Schema): Schema => ({ anyOf: [s, { type: 'null' }] });

export const SECTIONS = ['tomt', 'bygg', 'apninger', 'materialer', 'budsjett', 'fremdrift', 'risiko', 'annet'];

const opening = obj({
  id: str,
  kind: enumOf('dor', 'vindu', 'port', 'annet'),
  label: str,
  width_m: nullable('number'),
  height_m: nullable('number'),
  wall: enumOf('front', 'bak', 'venstre', 'hoyre'),
  floor: int,
  offset_m: nullable('number'),
  sill_m: nullable('number'),
});

const building = obj({
  length_m: nullable('number'),
  width_m: nullable('number'),
  floors: nullable('integer'),
  floor_height_m: nullable('number'),
  roof: orNull(
    obj({
      kind: enumOf('saltak', 'pulttak', 'valm', 'flatt', 'annet'),
      pitch_deg: nullable('number'),
      ridge_along: enumOf('lengde', 'bredde'),
      overhang_m: nullable('number'),
    }),
  ),
  exterior: orNull(
    obj({ cladding: nullable('string'), wall_color: nullable('string'), roof_color: nullable('string'), trim_color: nullable('string') }),
  ),
  terrain_slope_pct: nullable('number'),
  openings: arrayOf(opening),
});

export const TURN_SCHEMA: Schema = obj({
  reply: str,
  questions: arrayOf(obj({ text: str, options: strings })),
  phase: enumOf('oppstart', 'tomt', 'bygg', 'apninger', 'materialer', 'budsjett', 'detaljer'),
  changes: arrayOf(obj({ section: enumOf(...SECTIONS), text: str, ref_id: nullable('string') })),
  project: obj({
    name: str,
    type: str,
    summary: str,
    facts: orNull(arrayOf(obj({ category: str, label: str, value: str }))),
    building: orNull(building),
    budget: orNull(
      arrayOf(obj({ id: str, post: str, description: str, amount_nok: num, uncertainty_pct: num, sku: nullable('string') })),
    ),
    schedule: orNull(arrayOf(obj({ id: str, name: str, start_week: num, duration_weeks: num, depends_on: strings }))),
    risks: orNull(
      arrayOf(obj({ id: str, title: str, probability: enumOf('lav', 'middels', 'hoy'), consequence: str, measure: str, cost_nok: num })),
    ),
    assumptions: orNull(strings),
  }),
});
