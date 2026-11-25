// Student-facing text for the adviser's free-text answers (AD-16). Norwegian.
import type { FallbackReason } from '../ai/ask';

export const PREPARED_CAPTION = 'Forberedt svar';

/** One line saying why a prepared answer is shown (FR-17). Never an error message. */
export const fallbackLine: Record<FallbackReason, string> = {
  offline: 'Rådgiveren svarer med forberedte svar i denne versjonen.',
  unavailable: 'Språkmodellen svarer ikke akkurat nå, så du får et forberedt svar.',
  timeout: 'Språkmodellen brukte for lang tid, så du får et forberedt svar.',
  limit: 'Du har brukt opp spørsmålene til språkmodellen i denne spillrunden, så du får forberedte svar.',
  guard: 'Svaret inneholdt et tall som ikke stemmer med prosjektet, så du får et forberedt svar.',
};

/** Shown when no prepared answer exists for the step at all. */
export const NO_PREPARED_ANSWER =
  'Det har jeg ikke et forberedt svar på. Se på tallene for dette steget, og prøv et av forslagene til spørsmål.';
