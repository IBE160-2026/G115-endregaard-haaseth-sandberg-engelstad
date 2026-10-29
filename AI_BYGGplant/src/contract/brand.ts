// White-label brand and the dealer lead (frozen with the contract, team meeting 2). Owner: WS1.
// brand.json (WS3) follows Brand; the lead file and the webhook body (WS4, server/ WS1) follow Lead.

export interface CatalogueItem {
  sku: string;
  name: string;
  unit: string;
  price_nok: number;
}

export interface Brand {
  /** The supplier's product name shown in the app, e.g. «Nordlys Garasjeplanlegger». */
  name: string;
  /** The supplier itself (fictional in the demo; never a real company's brand). */
  company: string;
  tagline: string;
  /** A path under assets/ (served from /), e.g. "brand/logo.svg". */
  logo: string;
  colors: { accent: string; accent_dark: string };
  dealer: { name: string; email: string; phone: string };
  /** At most 50 products the AI may price from (sent as data in the prompt, never as rules). */
  catalogue: CatalogueItem[];
}

export const LEAD_SCHEMA_ID = 'ai-byggplant.lead/1';

/** What «Send til forhandler» hands over: a JSON file, and the body of the webhook. */
export interface Lead {
  schema: typeof LEAD_SCHEMA_ID;
  id: string;
  created: string;
  brand: string;
  customer: { name: string | null; email: string | null; phone: string | null; note: string | null };
  project: {
    name: string;
    type: string;
    summary: string;
    length_m: number | null;
    width_m: number | null;
    floors: number | null;
    roof: string | null;
  };
  budget: {
    total_nok: number;
    low_nok: number;
    high_nok: number;
    lines: { id: string; post: string; amount_nok: number; sku: string | null }[];
  };
  schedule_weeks: number;
  risks: { title: string; probability: string; cost_nok: number }[];
  /** The whole dialog, so the seller can pick up where the customer left off. */
  transcript: { role: 'user' | 'assistant'; text: string }[];
}
