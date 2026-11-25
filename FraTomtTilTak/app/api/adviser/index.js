// POST /api/adviser. Vercel's web handler signature: unexported methods get 405.
import { handleAdviser } from '../_lib/adviser.js';

export function POST(/** @type {Request} */ request) {
  return handleAdviser(request);
}
