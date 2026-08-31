// Type-level tests for `dependencies/text-buffer/src/marker-layer.d.ts`.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import type { Disposable, Marker, MarkerLayer } from "../../../index";

declare const layer: MarkerLayer;

// ---------------------------------------------------------------------------
// Identity and lifecycle
//
// Layer ids are strings — the buffer stringifies its counter — while the
// marker ids within a layer are numbers.
// ---------------------------------------------------------------------------

layer.id satisfies string;
layer.copy() satisfies MarkerLayer;
layer.clear();
layer.isDestroyed() satisfies boolean;
layer.getRole() satisfies string | undefined;

// Destroying a layer reports nothing.
layer.destroy() satisfies void;

// @ts-expect-error `id` is readonly
layer.id = "1";

// @ts-expect-error a layer without a role reports `undefined`
layer.getRole() satisfies string;

// ---------------------------------------------------------------------------
// Querying
// ---------------------------------------------------------------------------

layer.getMarkers() satisfies Marker[];
layer.getMarkerCount() satisfies number;

// A marker id may not be present in the layer.
layer.getMarker(1) satisfies Marker | undefined;

// @ts-expect-error the marker may not exist
layer.getMarker(1) satisfies Marker;

// @ts-expect-error marker ids are numbers, layer ids are strings
layer.getMarker("1");

// ---------------------------------------------------------------------------
// Finding markers
//
// Every filter is optional, and they combine.
// ---------------------------------------------------------------------------

layer.findMarkers({}) satisfies Marker[];
layer.findMarkers({
  startPosition: [0, 0],
  endPosition: { row: 1, column: 0 },
  startsInRange: [[0, 0], [1, 0]],
  endsInRange: { start: [0, 0], end: [1, 0] },
  containsPoint: [0, 2],
  containsPosition: [0, 2],
  containsRange: [[0, 0], [1, 0]],
  intersectsRange: [[0, 0], [1, 0]],
  startRow: 0,
  endRow: 4,
  intersectsRow: 2,
  intersectsRowRange: [0, 4],
  containedInRange: [[0, 0], [9, 0]],
}) satisfies Marker[];

// @ts-expect-error a row range is a pair of rows
layer.findMarkers({ intersectsRowRange: [0, 4, 8] });

// @ts-expect-error unknown filter
layer.findMarkers({ startsInRow: 0 });

// ---------------------------------------------------------------------------
// Marker creation
// ---------------------------------------------------------------------------

layer.markRange([[0, 0], [1, 4]]) satisfies Marker;
layer.markRange([[0, 0], [1, 4]], {
  reversed: true,
  invalidate: "inside",
  exclusive: false,
}) satisfies Marker;
layer.markPosition([0, 0]) satisfies Marker;
layer.markPosition([0, 0], { invalidate: "never", exclusive: true }) satisfies Marker;

// @ts-expect-error 'sometimes' is not an invalidation strategy
layer.markRange([[0, 0], [1, 4]], { invalidate: "sometimes" });

// @ts-expect-error a position marker has no orientation to reverse
layer.markPosition([0, 0], { reversed: true });

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

[
  layer.onDidUpdate(() => {}),
  layer.onDidCreateMarker((marker: Marker) => marker.id satisfies number),
  layer.onDidDestroy(() => {}),
] satisfies Disposable[];
