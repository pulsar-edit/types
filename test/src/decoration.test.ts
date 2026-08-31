// Type-level tests for `src/decoration.d.ts`.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import type {
  Decoration,
  DecorationOptions,
  DecorationPropsChangedEvent,
  DisplayMarker,
  Disposable,
  TextEditor,
} from "../../index";

declare const editor: TextEditor;
declare const marker: DisplayMarker;
declare const element: HTMLElement;

// ---------------------------------------------------------------------------
// Construction
//
// Decorations are never constructed directly — they come from decorating a
// marker on an editor or on one of its gutters.
// ---------------------------------------------------------------------------

const decoration = editor.decorateMarker(marker, { type: "line", class: "my-line" });

decoration satisfies Decoration;
editor.getGutters()[0].decorateMarker(marker, { type: "gutter", class: "my-gutter" }) satisfies Decoration;

// ---------------------------------------------------------------------------
// Identity and lifecycle
// ---------------------------------------------------------------------------

decoration.id satisfies number;
decoration.getId() satisfies number;
decoration.getMarker() satisfies DisplayMarker;

// @ts-expect-error `id` is assigned once in the constructor
decoration.id = 3;

// `destroy` is idempotent — it early-returns once `destroyed` is set — and
// destroying the marker destroys the decoration with it.
decoration.destroy();
decoration.isDestroyed() satisfies boolean;

// ---------------------------------------------------------------------------
// Event subscription
// ---------------------------------------------------------------------------

decoration.onDidChangeProperties((event) => {
  event satisfies DecorationPropsChangedEvent;
  event.oldProperties satisfies DecorationOptions;
  event.newProperties satisfies DecorationOptions;
}) satisfies Disposable;

decoration.onDidDestroy(() => {}) satisfies Disposable;

// ---------------------------------------------------------------------------
// Type checks
//
// `isType` accepts one type or several. Note that `'line-number'` is a special
// case of `'gutter'`: a line-number decoration answers `true` to both.
// ---------------------------------------------------------------------------

decoration.isType("line") satisfies boolean;
decoration.isType(["line", "line-number"]) satisfies boolean;

// ---------------------------------------------------------------------------
// Properties
//
// `setProperties` runs its argument through `normalizeDecorationProperties`,
// which stamps on the decoration's `id`, defaults `order` to `Infinity`, and
// fills in `gutterName` for line-number decorations. `getProperties` hands
// back that normalized object, so `id` and `order` are always present on the
// way out even when they were absent on the way in.
// ---------------------------------------------------------------------------

const properties = decoration.getProperties();

properties satisfies DecorationOptions;
properties.id satisfies number;
properties.order satisfies number;

// `gutterName` is only filled in for line-number decorations, so it stays
// optional.
properties.gutterName satisfies string | undefined;

decoration.setProperties({ type: "line-number", class: "my-new-class" });

// ---------------------------------------------------------------------------
// The decoration option bag
// ---------------------------------------------------------------------------

({
  type: "highlight",
  class: "my-highlight",
  style: { color: "red" },
  item: element,
  onlyHead: true,
  onlyEmpty: false,
  onlyNonEmpty: true,
  omitEmptyLastRow: false,
  position: "head",
  order: 1,
  avoidOverflow: false,
  gutterName: "line-number",
}) satisfies DecorationOptions;

// Every key is optional — an empty bag is a legal (if useless) decoration.
({}) satisfies DecorationOptions;

// `item` takes an `HTMLElement` or any model object with a registered view.
({ type: "overlay", item: element }) satisfies DecorationOptions;
({ type: "block", item: { element } }) satisfies DecorationOptions;

// `position` spans both vocabularies: head/tail for overlays, before/after
// for blocks.
({ type: "overlay", position: "tail" }) satisfies DecorationOptions;
({ type: "block", position: "after" }) satisfies DecorationOptions;

// @ts-expect-error `middle` is not a decoration position
({ type: "block", position: "middle" }) satisfies DecorationOptions;

// @ts-expect-error `line-nunber` is not a decoration type
({ type: "line-nunber" }) satisfies DecorationOptions;

// @ts-expect-error unknown decoration property
({ type: "line", klass: "my-line" }) satisfies DecorationOptions;

// ---------------------------------------------------------------------------
// Layer decorations
//
// `decorateMarkerLayer` shares the option bag apart from two exclusions: a
// layer decoration cannot be an `overlay` or a `gutter`, and so has no
// `gutterName` either.
// ---------------------------------------------------------------------------

editor.decorateMarkerLayer(editor.getDefaultMarkerLayer(), {
  type: "highlight",
  class: "my-highlight",
});

// @ts-expect-error a layer decoration cannot be an overlay
editor.decorateMarkerLayer(editor.getDefaultMarkerLayer(), { type: "overlay" });

// @ts-expect-error a layer decoration cannot be a gutter decoration
editor.decorateMarkerLayer(editor.getDefaultMarkerLayer(), { type: "gutter" });

editor.decorateMarkerLayer(editor.getDefaultMarkerLayer(), {
  type: "line",
  // @ts-expect-error `gutterName` belongs to gutter decorations only
  gutterName: "line-number",
});
