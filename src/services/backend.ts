/**
 * Compatibility helper for services that need the
 * authoritative Monet backend origin.
 */

import { apiOrigin } from "./monet-config";

export function apiBase() {
  return apiOrigin();
}
