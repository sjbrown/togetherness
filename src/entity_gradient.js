/**
 * FNV-1a 32-bit hash of a string.
 *
 * Produces a deterministic unsigned 32-bit integer from any string.
 * The >>> 0 after the multiply keeps the accumulator in unsigned 32-bit
 * integer range — without it JS lets the value grow into float territory,
 * corrupting all downstream modulo operations.
 *
 * @param {string} str
 * @returns {number} Unsigned 32-bit integer
 */
function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

/**
 * Derives a deterministic linear gradient from an entity name.
 *
 * Each gradient property is independently hashed by appending a unique
 * suffix to the name, so the two color stops don't correlate with each
 * other. All continuous parameters (hue, luminance, saturation) are
 * quantized to discrete steps and selected via modulo, keeping every
 * output value within the constrained ranges.
 *
 * @param {string} name        - Entity name (the hash seed)
 * @param {number} lumAnchor   - System-wide luminance anchor (0–100).
 *                               Each stop's L is drawn from the 5-point
 *                               steps within ±20 of this value, clamped
 *                               to [0, 100]. Defaults to 40.
 * @param {number} satAnchor   - System-wide saturation anchor (0–100).
 *                               Same ±20 / 5-point-step constraint as lum.
 *                               Defaults to 100 (maximum saturation).
 * @returns {{ grad: string, c1: string, c2: string,
 *             hue1: number, hue2: number,
 *             sat1: number, sat2: number,
 *             lum1: number, lum2: number,
 *             angle: number }}
 */
export function entityGradient(name, lumAnchor = 40, satAnchor = 100) {
  const h1 = hash32(name);
  const h2 = hash32(name + '__stop2');
  const h3 = hash32(name + '__lum1');
  const h4 = hash32(name + '__lum2');
  const h5 = hash32(name + '__sat1');
  const h6 = hash32(name + '__sat2');
  const h7 = hash32(name + '__angle');

  // Hue 1: uniform over full 360°
  const hue1 = h1 % 360;
  // Hue 2: offset from hue 1 by −40..+40, wrapped into [0, 360)
  const hueDelta = (h2 % 81) - 40;
  const hue2 = ((hue1 + hueDelta) % 360 + 360) % 360;

  // Build the set of valid luminance steps (5-point increments, clamped)
  const lumMin = Math.max(0, lumAnchor - 20);
  const lumMax = Math.min(100, lumAnchor + 20);
  const validLumSteps = [];
  for (let v = lumMin; v <= lumMax; v += 5) validLumSteps.push(v);

  const lum1 = validLumSteps[h3 % validLumSteps.length];
  const lum2 = validLumSteps[h4 % validLumSteps.length];

  // Same constraint for saturation
  const satMin = Math.max(0, satAnchor - 20);
  const satMax = Math.min(100, satAnchor + 20);
  const validSatSteps = [];
  for (let v = satMin; v <= satMax; v += 5) validSatSteps.push(v);

  const sat1 = validSatSteps[h5 % validSatSteps.length];
  const sat2 = validSatSteps[h6 % validSatSteps.length];

  // Angle: 90° (horizontal), 45° (diagonal up-right), 135° (diagonal down-right)
  const angles = [90, 45, 135];
  const angle = angles[h7 % 3];

  const c1 = `hsl(${hue1}, ${sat1}%, ${lum1}%)`;
  const c2 = `hsl(${hue2}, ${sat2}%, ${lum2}%)`;
  const grad = `linear-gradient(${angle}deg, ${c1}, ${c2})`;

  return { c1, c2, grad, hue1, hue2, sat1, sat2, lum1, lum2, angle };
}
