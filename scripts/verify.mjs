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

for (const [name, foreground, background, minimum] of requiredContrastPairs) {
  const ratio = contrast(foreground, background);
  assert.ok(ratio >= minimum, `${name} contrast ${ratio.toFixed(2)} is below ${minimum}:1`);
}

console.log(`Verified ${Object.keys(files).length} files and ${requiredContrastPairs.length} contrast pairs.`);
