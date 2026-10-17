# TinyCloud styles

The shared visual foundation for TinyCloud product interfaces. It extracts the
proven design language used by OpenCredentials into a small, framework-agnostic
CSS package.

The system is sovereign, rigorous, and open: security state is legible, dense
technical information remains calm, and detail appears when it becomes useful.

## What is included

- Primitive and semantic design tokens
- Accessible light and dark themes
- Base typography, focus, form, and motion behavior
- Reusable product patterns for buttons, fields, badges, panels, status,
  toolbars, data rows, traces, and skeletons
- A zero-build specimen showing the system in context

This is intentionally not a React component library. Product repositories keep
control of behavior and markup while sharing a stable visual vocabulary.

## Use

Install from the GitHub repository:

```sh
npm install git+https://github.com/TinyCloudLabs/styles.git
# or
bun add git+https://github.com/TinyCloudLabs/styles.git
```

Import the complete layer:

```css
@import "@tinycloud/styles";
```

Or import only the layers you need:

```css
@import "@tinycloud/styles/tokens.css";
@import "@tinycloud/styles/base.css";
@import "@tinycloud/styles/patterns.css";
```

Light is the default. Set `data-theme="dark"` on the document root for dark
mode, or `data-theme="system"` to follow the operating-system preference.

```html
<html data-theme="dark">
```

Use semantic tokens in product code:

```css
.service {
  color: var(--tc-color-text);
  background: var(--tc-color-surface);
  border: 1px solid var(--tc-color-border);
  border-radius: var(--tc-radius-md);
}
```

Primitive palette tokens are exposed for visualizations and token tooling, but
components should not read them directly.

## Develop

```sh
npm test
npm run specimen
```

Then open `http://localhost:4173/specimen/`.

See [DESIGN.md](./DESIGN.md) for principles, token policy, and contribution
guidance.

## Licence

Licensed under the TinyCloud Ecosystem General Public License (EGPL) v1.5.
See [LICENSE.md](LICENSE.md).
