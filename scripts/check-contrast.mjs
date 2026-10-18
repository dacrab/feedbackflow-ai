// Verifies every semantic color token against WCAG contrast minimums.
// A hand-audited palette drifts; this fails CI instead.
//
//   node scripts/check-contrast.mjs
import { readFileSync } from "node:fs";

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

const rootCss = css.slice(css.indexOf("@theme"), css.indexOf(".dark {"));

/**
 * oklch(L C H) -> { l, c, h }, resolving as CSS would: a token defined in the
 * mode block wins, otherwise it inherits the @theme value.
 */
function token(scope, name) {
  const pattern = `--color-${name}:\\s*oklch\\(([\\d.]+)%\\s+([\\d.]+)\\s+([\\d.]+)\\)`;
  const m =
    new RegExp(pattern).exec(css.slice(css.indexOf(scope))) ?? new RegExp(pattern).exec(rootCss);
  if (!m) throw new Error(`token --color-${name} not found for ${scope}`);
  return { l: Number(m[1]) / 100, c: Number(m[2]), h: Number(m[3]) };
}

function linearRgb({ l, c, h }) {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = l + 0.396_337_777_4 * a + 0.215_803_757_3 * b;
  const m_ = l - 0.105_561_345_8 * a - 0.063_854_172_8 * b;
  const s_ = l - 0.089_484_177_5 * a - 1.291_485_548 * b;
  const [L, M, S] = [l_ ** 3, m_ ** 3, s_ ** 3];
  return [
    4.076_741_662_1 * L - 3.307_711_591_3 * M + 0.230_969_929_2 * S,
    -1.268_438_004_6 * L + 2.609_757_401_1 * M - 0.341_319_396_5 * S,
    -0.004_196_086_3 * L - 0.703_418_614_7 * M + 1.707_614_701 * S,
  ];
}

/** WCAG relative luminance, from linear sRGB. */
const luminance = (t) => {
  const [r, g, b] = linearRgb(t);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [hi, lo] = [a, b].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Text colors render on --color-card; the auth panel paints --color-foreground.
const MODES = [
  { scope: ".dark {", suffix: "dark", card: { l: 0.14, c: 0, h: 0 } },
  { scope: "@theme {", suffix: "light", card: { l: 1, c: 0, h: 0 } },
];

const TEXT = ["good", "warn", "danger", "info", "accent", "muted-foreground"];
const NON_TEXT = ["control"];
const CHART = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];

const failures = [];
const check = (label, fg, bg, min) => {
  const ratio = contrast(luminance(fg), luminance(bg));
  if (ratio < min) failures.push(`${label}: ${ratio.toFixed(2)}:1 < ${min}:1`);
};

for (const mode of MODES) {
  for (const name of TEXT)
    check(`${name} on card (${mode.suffix})`, token(mode.scope, name), mode.card, AA_TEXT);
  for (const name of NON_TEXT)
    check(`${name} (${mode.suffix})`, token(mode.scope, name), mode.card, AA_NON_TEXT);
  for (const name of CHART)
    check(`${name} fill (${mode.suffix})`, token(mode.scope, name), mode.card, AA_NON_TEXT);

  // The auth panel inverts per mode, so its text sits on --color-foreground.
  const panel = token(mode.scope, "foreground");
  for (const name of ["inverse-muted", "inverse-subtle", "inverse-accent"]) {
    check(`${name} on panel (${mode.suffix})`, token(mode.scope, name), panel, AA_TEXT);
  }
}

if (failures.length > 0) {
  const detail = failures.map((f) => `  ${f}`).join("\n");
  console.error(`Contrast below WCAG minimums:\n${detail}`);
  process.exit(1);
}
console.log("contrast: all tokens meet WCAG AA");
