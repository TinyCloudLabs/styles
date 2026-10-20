import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const files = {
  tokens: join(root, "src/tokens.css"),
  base: join(root, "src/base.css"),
  patterns: join(root, "src/patterns.css"),
  index: join(root, "src/index.css"),
  specimen: join(root, "specimen/index.html"),
};

const contents = Object.fromEntries(
  await Promise.all(
    Object.entries(files).map(async ([name, path]) => [name, await readFile(path, "utf8")]),
  ),
);

for (const [name, content] of Object.entries(contents)) {
  const opens = [...content].filter((character) => character === "{").length;
  const closes = [...content].filter((character) => character === "}").length;
  assert.equal(opens, closes, `${name} has unbalanced braces`);
}

for (const cssFile of ["tokens", "base", "patterns"]) {
  assert.ok(!contents[cssFile].includes("background-clip: text"), `${cssFile} uses gradient text`);
  assert.ok(!contents[cssFile].includes("border-radius: 32px"), `${cssFile} over-rounds surfaces`);
  assert.ok(!contents[cssFile].includes("border-radius: 40px"), `${cssFile} over-rounds surfaces`);
}

for (const role of [
  "--tc-color-page",
  "--tc-color-surface",
  "--tc-color-text",
  "--tc-color-text-muted",
  "--tc-color-border",
  "--tc-color-accent",
  "--tc-color-focus",
  "--tc-color-status-success",
  "--tc-color-status-warning",
  "--tc-color-status-danger",
]) {
  assert.ok(contents.tokens.includes(role), `missing semantic role ${role}`);
}

for (const stylesheet of ["tokens.css", "base.css", "patterns.css"]) {
  assert.ok(contents.index.includes(stylesheet), `index.css does not import ${stylesheet}`);
}

for (const className of ["tc-button", "tc-input", "tc-panel", "tc-status", "tc-trace"]) {
  assert.ok(contents.specimen.includes(className), `specimen does not exercise ${className}`);
}

// .tc-prose: the rules must live in @layer tc.patterns, use semantic tokens
// only for color/space/radius, and the specimen must exercise every element.
const proseElements = ["h1", "h2", "h3", "h4", "ul", "ol", "blockquote", "pre", "code", "table", "hr", "img", "kbd", "summary"];
const proseRules = contents.patterns.match(/\.tc-prose[^{}]*\{[^{}]*\}/g) ?? [];
assert.ok(proseRules.length > 0, "patterns.css does not define .tc-prose");
const patternsLayerStart = contents.patterns.indexOf("@layer tc.patterns");
assert.ok(
  patternsLayerStart !== -1 && contents.patterns.indexOf(".tc-prose") > patternsLayerStart,
  ".tc-prose must be declared inside @layer tc.patterns",
);
const proseCss = proseRules.join("\n");
assert.ok(!/--tc-palette-/.test(proseCss), ".tc-prose reads raw palette tokens");
assert.ok(!/!important/i.test(proseCss), ".tc-prose must not use !important");
assert.ok(!/#[0-9a-f]{3,8}\b|\b(?:rgb|hsl|oklch|oklab)a?\(/i.test(proseCss), ".tc-prose uses a literal color");
for (const [, property, value] of proseCss.matchAll(/(?:^|[\s;{])((?:margin|padding)[\w-]*|gap|border-radius)\s*:\s*([^;}]+)/g)) {
  const literals = value.replace(/var\([^)]*\)/g, "").match(/-?[\d.]+[a-z%]+/g) ?? [];
  assert.deepEqual(literals, [], `.tc-prose ${property} uses a literal length (${value.trim()}); use --tc-space-*/--tc-radius-*`);
}
for (const element of proseElements) {
  const selector = new RegExp(`\\.tc-prose\\s+${element}\\b`);
  assert.ok(selector.test(proseCss), `.tc-prose has no rule for ${element}`);
}

const proseMarkup = contents.specimen.match(/<article class="tc-prose"[^>]*>([\s\S]*?)<\/article>/)?.[1];
assert.ok(proseMarkup, "specimen does not exercise tc-prose");
for (const element of [...proseElements, "li", "th", "td", "strong", "em", "a"]) {
  assert.ok(new RegExp(`<${element}[\\s>]`).test(proseMarkup), `specimen .tc-prose does not exercise <${element}>`);
}
assert.ok(/<pre[^>]*>\s*<code/.test(proseMarkup), "specimen .tc-prose needs a <pre><code> block");
assert.ok(
  /\.tc-prose\s+ul\.contains-task-list/.test(proseCss) && /\.tc-prose\s+li\.task-list-item/.test(proseCss),
  ".tc-prose has no task-list rules",
);
// Every rule that targets th/td (the grouped th, td rule and the separate th rule) must keep words intact.
const cellRules = proseRules.filter((rule) => /\bt[hd]\b/.test(rule.slice(0, rule.indexOf("{"))));
assert.ok(
  cellRules.some((rule) => /\.tc-prose\s+th\b/.test(rule)) && cellRules.some((rule) => /\.tc-prose\s+td\b/.test(rule)),
  ".tc-prose has no th/td rules to guard",
);
for (const rule of cellRules) {
  assert.ok(!/overflow-wrap\s*:\s*anywhere/.test(rule), `.tc-prose table cells must not break words mid-word (${rule.split("{")[0].trim()})`);
}

// Forced colors drops author backgrounds; the task-list checkbox needs a system-color override so checked != unchecked.
function mediaBlock(css, query) {
  const start = css.indexOf(query);
  if (start === -1) return "";
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}" && --depth === 0) return css.slice(open, index + 1);
  }
  return "";
}
const forcedColors = mediaBlock(contents.patterns, "@media (forced-colors: active)");
assert.ok(
  /li\.task-list-item\s*>\s*input\[type="checkbox"\]:checked\s*\{[^{}]*background-color\s*:\s*(?:CanvasText|Highlight)/.test(forcedColors),
  "patterns.css needs @media (forced-colors: active) giving the checked task-list checkbox a system-color fill",
);
assert.ok(
  /li\.task-list-item\s*>\s*input\[type="checkbox"\]\s*\{[^{}]*border-color\s*:\s*ButtonText/.test(forcedColors),
  "patterns.css forced-colors block needs a ButtonText outline on the task-list checkbox",
);
assert.ok(
  /<ul[^>]*contains-task-list[^>]*>[\s\S]*?<li[^>]*task-list-item[^>]*>\s*<input[^>]*type="checkbox"/.test(proseMarkup),
  "specimen .tc-prose needs a GFM task list",
);
for (const element of ["kbd", "details", "summary"]) {
  assert.ok(new RegExp(`<${element}[\\s>]`).test(proseMarkup), `specimen .tc-prose does not exercise <${element}>`);
}
assert.ok(/<li[\s>][\s\S]*?<(?:ul|ol)[\s>][\s\S]*?<\/li>/.test(proseMarkup), "specimen .tc-prose needs a nested list");

function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

const requiredContrastPairs = [
  ["light body", "#1a1c21", "#f8f9fb", 4.5],
  ["light muted", "#64748b", "#ffffff", 4.5],
  ["light primary button", "#ffffff", "#2a56f6", 4.5],
  ["dark body", "#e2e8f0", "#0b0e14", 4.5],
  ["dark muted", "#94a3b8", "#12151e", 4.5],
  ["dark primary button", "#0b0e14", "#6a9aff", 4.5],
];

// Role pairs are resolved from tokens.css so a token change cannot drift from the check.
function themeBlock(selector) {
  const start = contents.tokens.indexOf(selector);
  assert.notEqual(start, -1, `tokens.css has no ${selector} block`);
  return contents.tokens.slice(start, contents.tokens.indexOf("\n}", start));
}

function resolveColors(...blocks) {
  const values = new Map();
  for (const block of blocks) {
    for (const [, name, value] of block.matchAll(/(--tc-[\w-]+):\s*([^;]+);/g)) {
      values.set(name, value.trim());
    }
  }
  return (name) => {
    let value = values.get(name);
    while (value?.startsWith("var(")) value = values.get(value.slice(4, -1));
    assert.match(value ?? "", /^#[0-9a-f]{6}$/i, `${name} does not resolve to a hex color`);
    return value;
  };
}

const themes = {
  light: resolveColors(themeBlock(":root,")),
  dark: resolveColors(themeBlock(":root,"), themeBlock('[data-theme="dark"] {')),
};

// .tc-prose text sits on surface (panel), page (full-page frame), or subtle (code, table header).
const proseRolePairs = [
  ["body on surface", "text", "surface"],
  ["body on page", "text", "page"],
  ["code and table header", "text", "surface-subtle"],
  ["link on surface", "link", "surface"],
  ["link on page", "link", "page"],
  ["link on subtle", "link", "surface-subtle"],
];

for (const [theme, resolve] of Object.entries(themes)) {
  for (const [name, foreground, background] of proseRolePairs) {
    requiredContrastPairs.push([
      `${theme} prose ${name}`,
      resolve(`--tc-color-${foreground}`),
      resolve(`--tc-color-${background}`),
      4.5,
    ]);
  }
}

for (const [name, foreground, background, minimum] of requiredContrastPairs) {
  const ratio = contrast(foreground, background);
  assert.ok(ratio >= minimum, `${name} contrast ${ratio.toFixed(2)} is below ${minimum}:1`);
}

console.log(`Verified ${Object.keys(files).length} files and ${requiredContrastPairs.length} contrast pairs.`);
