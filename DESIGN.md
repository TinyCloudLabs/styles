# TinyCloud design language

## Character

TinyCloud interfaces feel sovereign, rigorous, and open. They should resemble a
well-made instrument: precise enough for engineers, legible enough for a person
learning the system, and quiet until something requires attention.

The physical scene is an engineer inspecting authorization and data flow on a
workstation for an extended session. Ambient light may vary, information
density is high, and trust state must remain obvious without relying on color
alone.

## Principles

1. **Make trust inspectable.** Show identity, scope, expiry, verification, and
   failure state where decisions occur.
2. **Reveal depth progressively.** Begin with the useful summary. Put protocol
   detail and identifiers one interaction away.
3. **Use structure before decoration.** Alignment, dividers, type, and whitespace
   establish hierarchy. Color is reserved for action and state.
4. **Trace real work.** Technical diagrams and debuggers should foreground the
   active path. Secondary relationships appear on selection or focus.
5. **Preserve user control.** Every hover state has a keyboard and click
   equivalent. Motion respects reduced-motion preferences.

## Color

The palette is restrained: blue carries primary action, selection, links, and
verified state. Neutrals carry the interface. Red, amber, and green are reserved
for state and always paired with text or an icon.

Component code uses semantic `--tc-color-*` roles. Raw palette tokens beginning
with `--tc-palette-*` are for the theme layer, data visualization, and tooling.
This separation lets themes evolve without rewriting components.

Body text and placeholders meet WCAG 2.2 AA. Do not use subdued text tokens for
essential instructions or data.

## Typography

TinyCloud uses the native system sans stack for interface text and the native
monospace stack for identifiers, code, addresses, and protocol values. A
familiar UI typeface makes the product disappear into the task.

- Use the compact fixed scale; product typography does not resize fluidly.
- Keep prose between 45 and 72 characters per line.
- Use weight and spacing before introducing another size.
- Use monospace for machine values, not as a decorative “technical” accent.

## Shape and spacing

The 4px spacing base supports dense tools without becoming cramped. Most
controls use a 4px or 8px radius; 16px is reserved for large, independent
surfaces. Pills are limited to compact actions and tags.

Avoid nested cards. Prefer one containing surface with dividers, rows, or
sections inside it. Panels use a border or a compact shadow, never both as
decoration.

## Product states

Interactive components must cover:

- default
- hover
- focus-visible
- active or selected
- disabled
- loading
- error

Loading content uses skeletons that preserve layout. Empty states explain what
belongs in the space and offer the next useful action.

## Motion

Transitions last 150–220ms and communicate state: hover, focus, disclosure,
selection, or loading. Avoid decorative page-load choreography. Animate
opacity and transforms instead of layout properties. Every animation has a
reduced-motion alternative.

## Signature motifs

The dotted field and mixed solid/dotted boundaries are references to
verification, partial knowledge, and cryptographic proof. They are optional,
quiet, and never placed behind dense reading text. The interface should still
look distinctly TinyCloud with the motif removed.

## Contribution policy

Extract a token or pattern only when the same intent appears at least three
times. New semantic tokens describe purpose (`text-muted`, `status-danger`),
not a literal value (`gray-400`). Changes to shared tokens should include:

1. A specimen state in both themes.
2. Keyboard-visible focus behavior for interactive patterns.
3. Contrast verification for new text/background pairs.
4. Reduced-motion handling for new animation.
5. A migration note when an existing semantic role changes meaning.
