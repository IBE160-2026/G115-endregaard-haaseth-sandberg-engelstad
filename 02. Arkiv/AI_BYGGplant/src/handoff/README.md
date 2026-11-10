# «Send til forhandler» – lead format and webhook

When the customer presses **Send til forhandler**, the app builds one *lead* and:

1. sends it as the body of `POST /api/lead` (`Content-Type: application/json`). The server forwards it to the dealer's webhook.
2. saves it locally as `lead-<prosjekt>.json`, so the customer or seller can attach it to an e-mail.
3. shows it in the «Forhandlerens innboks» panel. This panel is a demo of the dealer's side. In production the lead goes to your CRM by e-mail or webhook.

The PDF report (printed from the app) goes with the lead. It has the drawings, the budget with ranges, the schedule and the risks.

## Contract

- Schema id: `ai-byggplant.lead/1` (field `schema`). Breaking changes will bump the number.
- The TypeScript definition is `Lead` in `src/contract/brand.ts`, which is the source of truth.
- Encoding: UTF-8 JSON. Amounts are whole NOK including VAT. Lengths are in metres. Times are ISO 8601 UTC.
- A value the customer or the AI has not decided yet is `null`. It is never guessed.
- `id` is a UUID. Use it as an idempotency key, because the same lead may arrive twice if the customer retries.

| Field | Type | Meaning |
|---|---|---|
| `schema` | `"ai-byggplant.lead/1"` | Format version |
| `id` | string (UUID) | Unique per lead |
| `created` | ISO time | When the lead was made |
| `brand` | string | The white-label product the customer used |
| `customer.name/email/phone/note` | string or null | What the customer chose to give |
| `project.name/type/summary` | string | The project as the AI described it |
| `project.length_m/width_m` | number or null | The overall extent of the building on the site (all bygningskropper together), along the main front and front to back |
| `project.floors` | number or null | Storeys above ground of the tallest bygningskropp (a loft is not counted) |
| `project.roof` | string or null | The main (first) bygningskropp's roof, for example «Saltak 35°, møne langs lengden» |
| `budget.total_nok` | number | Sum of the budget lines |
| `budget.low_nok/high_nok` | number | Range from each line's ± uncertainty |
| `budget.lines[]` | `{id, post, amount_nok, sku}` | `sku` is your product number when the line came from your catalogue, else null |
| `schedule_weeks` | number | The week the last task ends (0 = no plan yet) |
| `risks[]` | `{title, probability: "lav"\|"middels"\|"hoy", cost_nok}` | Risks the AI pointed out |
| `transcript[]` | `{role: "user"\|"assistant", text}` | The whole dialog, so the seller can pick up where the customer left off |

## Response

Your endpoint (or our server, on your behalf) answers with:

```json
{ "delivered": true, "note": "Takk! Forhandleren tar kontakt innen to virkedager." }
```

`note` is shown to the customer as written, in Norwegian. If the server cannot be reached, the app shows «Kunne ikke nå serveren – leadet er lagret lokalt» and keeps the file.

## Example

```json
{
  "schema": "ai-byggplant.lead/1",
  "id": "6f1d2c1e-8a4b-4f7e-9b2a-0c5d3e7f9a10",
  "created": "2026-10-29T13:05:12.345Z",
  "brand": "Nordlys Garasjeplanlegger",
  "customer": {
    "name": "Kari Nordmann",
    "email": "kari@example.no",
    "phone": "+47 900 00 000",
    "note": "Ønsker befaring i november"
  },
  "project": {
    "name": "Dobbelgarasje med loft",
    "type": "Garasje",
    "summary": "Frittstående dobbelgarasje på 8 × 7 m med saltak og loft til lagring, innkjøring fra langsiden.",
    "length_m": 8,
    "width_m": 7,
    "floors": 2,
    "roof": "Saltak 35°, møne langs lengden"
  },
  "budget": {
    "total_nok": 412500,
    "low_nok": 351000,
    "high_nok": 474000,
    "lines": [
      { "id": "post-grunn", "post": "Grunnarbeid og såle", "amount_nok": 85000, "sku": null },
      { "id": "post-port", "post": "Leddport 5,0 × 2,25 m", "amount_nok": 32990, "sku": "NB-PORT-5022" }
    ]
  },
  "schedule_weeks": 9,
  "risks": [
    { "title": "Fjell i grunnen", "probability": "middels", "cost_nok": 40000 }
  ],
  "transcript": [
    { "role": "assistant", "text": "Hei, hva skal bygges?" },
    { "role": "user", "text": "Dobbelgarasje med loft" },
    { "role": "assistant", "text": "En dobbelgarasje med loft – flott prosjekt! …" }
  ]
}
```

The figures are a rough estimate made by AI. They must be checked by professionals before anything is ordered.
