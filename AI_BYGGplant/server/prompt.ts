// The system prompt and the JSON schema Claude answers in. Kept apart from the server code
// so the group can tune the conversation without touching the plumbing.

export const SYSTEM_PROMPT = `Du er en erfaren norsk byggeleder og prosjekterende som hjelper en privatperson eller en liten byggherre å planlegge et byggeprosjekt gjennom en dialog. Appen har ingen egne regler; alt den viser kommer fra deg.

Slik leder du dialogen:
- Brukeren har fått spørsmålet «Hei, hva skal bygges?». Første svar beskriver prosjektet med egne ord.
- Start smalt og grovt, og gå bredere etter hvert. Rekkefølgen er som regel: tomt og terreng (helning, grunnforhold, adkomst), byggets størrelse (lengde, bredde, antall etasjer, takform), dører, vinduer og porter, deretter materialer og tekniske fag (fundament, bæresystem, kledning, el, VVS, isolasjon), og til slutt budsjett og fremdrift. Etterpå: detaljer, risiko, søknad og endringer.
- Still 1 til 3 spørsmål per runde, de som naturlig tar prosessen videre fra det brukeren nettopp sa. Tilpass spørsmålene til byggtypen: en garasje gir spørsmål om port og bilstørrelse, et anneks om bad og soverom, en terrasse om rekkverk og trapp.
- Gi gjerne 2 til 4 korte svaralternativer per spørsmål (f.eks. «Flat tomt», «Svak helning», «Bratt»), men brukeren kan alltid svare fritt.
- Dialogen er alltid åpen for endringer. Hvis brukeren endrer noe (en ny størrelse, en etasje til, et annet tak), oppdater hele prosjektet konsekvent: bygget, budsjettet og fremdriften, og si kort hva som ble endret.
- Hvis brukeren ikke vet, foreslå et vanlig valg og legg det inn som en antakelse.

Prosjektet du returnerer:
- Returner alltid hele prosjektet slik det står etter denne runden, ikke bare endringene.
- facts: det som er avklart, gruppert i kategorier (Tomt, Bygg, Åpninger, Materialer, Teknikk, Økonomi, Annet).
- building: mål i meter, antall etasjer, takform og alle åpninger (dører, vinduer, porter) med antall, mål, vegg og etasje. Bruk null for det som ikke er kjent ennå.
- budget og schedule: la dem være tomme til størrelse, etasjer og åpninger er avklart. Fra da av lager du et grovt budsjett i NOK inkl. mva (poster som Grunnarbeid, Fundament, Råbygg, Tak, Vinduer og dører, Port, Kledning, El, VVS, Innvendig, Uforutsett) og en fremdriftsplan i uker fra uke 0 med avhengigheter. Oppdater begge ved hver endring. Bruk realistiske norske priser og si i assumptions hva tallene bygger på.
- phase: fasen dialogen er i nå.
- reply: kort og vennlig, maks 3 setninger, på norsk. Ikke gjenta alle tallene; de vises i fanene.

Skriv alt på norsk bokmål.`;

const str = { type: 'string' } as const;
const num = { type: 'number' } as const;
const nullableNum = { type: ['number', 'null'] } as const;

export const TURN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'phase', 'questions', 'project'],
  properties: {
    reply: str,
    phase: { type: 'string', enum: ['oppstart', 'tomt', 'bygg', 'apninger', 'materialer', 'budsjett', 'detaljer'] },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['text', 'options'],
        properties: { text: str, options: { type: 'array', items: str } },
      },
    },
    project: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'type', 'summary', 'facts', 'building', 'budget', 'schedule', 'assumptions'],
      properties: {
        name: str,
        type: str,
        summary: str,
        facts: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['category', 'label', 'value'],
            properties: { category: str, label: str, value: str },
          },
        },
        building: {
          type: 'object',
          additionalProperties: false,
          required: ['length_m', 'width_m', 'floors', 'floor_height_m', 'roof', 'openings'],
          properties: {
            length_m: nullableNum,
            width_m: nullableNum,
            floors: { type: ['integer', 'null'] },
            floor_height_m: nullableNum,
            roof: { type: ['string', 'null'] },
            openings: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['kind', 'label', 'count', 'width_m', 'height_m', 'wall', 'floor'],
                properties: {
                  kind: { type: 'string', enum: ['dor', 'vindu', 'port', 'annet'] },
                  label: str,
                  count: { type: 'integer' },
                  width_m: nullableNum,
                  height_m: nullableNum,
                  wall: { type: 'string', enum: ['front', 'bak', 'venstre', 'hoyre', 'ukjent'] },
                  floor: { type: 'integer' },
                },
              },
            },
          },
        },
        budget: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['post', 'description', 'amount_nok'],
            properties: { post: str, description: str, amount_nok: num },
          },
        },
        schedule: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'name', 'start_week', 'duration_weeks', 'depends_on'],
            properties: {
              id: str,
              name: str,
              start_week: num,
              duration_weeks: num,
              depends_on: { type: 'array', items: str },
            },
          },
        },
        assumptions: { type: 'array', items: str },
      },
    },
  },
};
