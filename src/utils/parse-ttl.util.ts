const UNIT_MS: Record<string, number> = {
  s: 1_000,
  m: 60 * 1_000,
  h: 60 * 60 * 1_000,
  d: 24 * 60 * 60 * 1_000,
};

/**
 * Parses a TTL string (e.g. "15m", "30d", "1h") into milliseconds.
 * Throws if the format is unrecognised.
 */
export function parseTtlMs(ttl: string): number {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid TTL format: "${ttl}". Expected e.g. "15m", "30d".`);
  const [, value, unit] = match;
  return parseInt(value, 10) * UNIT_MS[unit];
}

/**
 * Returns a Date offset from now by the given TTL string.
 */
export function parseTtlDate(ttl: string): Date {
  return new Date(Date.now() + parseTtlMs(ttl));
}
