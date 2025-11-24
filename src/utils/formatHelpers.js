/**
 * Converts file progress properties to percentage
 */
export function progressPercent({ current = 0, total = 0 } = {}) {
  if (!total) {return 0;}
  return Math.round((current / total) * 100);
}

/**
 * Formats date to locale date
 */
export function formatDate(datestring) {
  const d = new Date(datestring);
  return d.toLocaleString();
}

/**
 * Formats size to human-readable size
 */
export function formatSize(size, { base = 1024, unit = 'B' } = {}) {
  const num = Number(size);
  if (!Number.isFinite(num)) {return '0 B';}
  if (num < base) {return `${num} ${unit}`;}
  let i;
  let val = num;
  for (i = 0; val >= base && i < 4; i++) {val /= base;}
  return `${val.toFixed(2)} ${['','K','M','G','T'][i]}${unit}`;
}

/**
 * Formats girder user
 */
export function formatUsername(user) {
  return `${user.firstName} ${user.lastName} (${user.login})`;
}