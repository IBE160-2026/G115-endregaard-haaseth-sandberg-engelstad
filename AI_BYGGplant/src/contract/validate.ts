// A small validator for the JSON-schema subset TURN_SCHEMA uses (type, enum, anyOf, properties,
// required, additionalProperties: false, items). Used by the server on every AI turn and by the tests.
import { projectIds, type AiTurn, type Project } from './types';
import { TURN_SCHEMA } from './schema';

type Schema = Record<string, unknown>;

const typeOf = (v: unknown) =>
  v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v;

const matchesType = (v: unknown, t: string) => {
  const actual = typeOf(v);
  return actual === t || (t === 'number' && actual === 'integer');
};

/** Every place the value breaks the schema, as "path: problem". Empty means valid. */
export function schemaErrors(value: unknown, schema: Schema = TURN_SCHEMA, path = '$'): string[] {
  if (Array.isArray(schema.anyOf)) {
    const branches = (schema.anyOf as Schema[]).map((s) => schemaErrors(value, s, path));
    return branches.some((e) => e.length === 0) ? [] : branches.sort((a, b) => a.length - b.length)[0];
  }
  const types = schema.type === undefined ? [] : Array.isArray(schema.type) ? (schema.type as string[]) : [schema.type as string];
  if (types.length && !types.some((t) => matchesType(value, t))) return [`${path}: expected ${types.join('|')}, got ${typeOf(value)}`];
  if (Array.isArray(schema.enum) && !(schema.enum as unknown[]).includes(value)) return [`${path}: ${JSON.stringify(value)} not in enum`];
  if (typeOf(value) === 'number' && !Number.isFinite(value)) return [`${path}: not a finite number`];

  const errors: string[] = [];
  if (typeOf(value) === 'object' && schema.properties) {
    const props = schema.properties as Record<string, Schema>;
    const obj = value as Record<string, unknown>;
    for (const key of (schema.required as string[]) ?? []) if (!(key in obj)) errors.push(`${path}.${key}: missing`);
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(obj)) if (!(key in props)) errors.push(`${path}.${key}: not allowed`);
    }
    for (const [key, sub] of Object.entries(props)) if (key in obj) errors.push(...schemaErrors(obj[key], sub, `${path}.${key}`));
  }
  if (typeOf(value) === 'array' && schema.items) {
    (value as unknown[]).forEach((item, i) => errors.push(...schemaErrors(item, schema.items as Schema, `${path}[${i}]`)));
  }
  return errors;
}

/** Problems the schema cannot express: duplicate ids, and ref_ids that point at nothing. */
export function consistencyErrors(turn: AiTurn, merged: Project): string[] {
  const errors: string[] = [];
  const all = [
    ...merged.building.openings.map((o) => o.id),
    ...merged.budget.map((l) => l.id),
    ...merged.risks.map((r) => r.id),
    ...merged.schedule.map((t) => t.id),
  ];
  const seen = new Set<string>();
  for (const id of all) {
    if (seen.has(id)) errors.push(`duplicate id ${id}`);
    seen.add(id);
  }
  const ids = projectIds(merged);
  for (const c of turn.changes) if (c.ref_id !== null && !ids.has(c.ref_id)) errors.push(`ref_id ${c.ref_id} points at nothing`);
  const tasks = new Set(merged.schedule.map((t) => t.id));
  for (const t of merged.schedule) for (const d of t.depends_on) if (!tasks.has(d)) errors.push(`task ${t.id} depends on unknown ${d}`);
  return errors;
}

/** Parses and checks a turn; throws with the first problems if it does not match the contract. */
export function parseTurn(text: string): AiTurn {
  const value: unknown = JSON.parse(text);
  const errors = schemaErrors(value);
  if (errors.length) throw new Error(`Svaret fulgte ikke kontrakten: ${errors.slice(0, 3).join('; ')}`);
  return value as AiTurn;
}
