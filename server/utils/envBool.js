/** True for "true", "1", "yes" (case-insensitive, trimmed). */
export function envBool(name) {
  const v = String(process.env[name] ?? '').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}
