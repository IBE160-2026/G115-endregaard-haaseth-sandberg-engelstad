// GET /api/adviser/status -> { live: boolean }. Says only whether a key is set, never the key.
import { handleStatus } from '../_lib/adviser.js';

export function GET() {
  return handleStatus();
}
