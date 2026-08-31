// Type-level tests for `dependencies/text-buffer/src/display-marker-layer.d.ts`.
//
// A `DisplayMarkerLayer` wraps a buffer `MarkerLayer` and projects it through a
// `DisplayLayer`, so it can create and find markers in either coordinate space.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import type { DisplayMarker, DisplayMarkerLayer, Disposable } from "../../../index";

declare const layer: DisplayMarkerLayer;

// ---------------------------------------------------------------------------
// Identity and lifecycle
//
// The id is the underlying buffer marker layer's, so it is a string — while
// the markers within it are keyed by number.
// ---------------------------------------------------------------------------

layer.id satisfies string;
layer.destroy() satisfies void;
layer.clear();
layer.isDestroyed() satisfies boolean;

// @ts-expect-error `id` is readonly
layer.id = "1";

// ---------------------------------------------------------------------------
// Querying
// ---------------------------------------------------------------------------

layer.getMarkers() satisfies DisplayMarker[];
layer.getMarkerCount() satisfies number;

// A marker id may not be present in the layer.
layer.getMarker(1) satisfies DisplayMarker | undefined;

// @ts-expect-error the marker may not exist
layer.getMarker(1) satisfies DisplayMarker;

// ---------------------------------------------------------------------------
// Marker creation in both coordinate spaces
//
// Only the screen-space forms take a clip direction.
// ---------------------------------------------------------------------------

layer.markBufferRange([[0, 0], [1, 4]]) satisfies DisplayMarker;
layer.markBufferRange([[0, 0], [1, 4]], {
  reversed: true,
  invalidate: "touch",
  exclusive: false,
}) satisfies DisplayMarker;
layer.markBufferPosition([0, 0]) satisfies DisplayMarker;
layer.markBufferPosition([0, 0], { invalidate: "never", exclusive: true }) satisfies DisplayMarker;

layer.markScreenRange([[0, 0], [1, 4]]) satisfies DisplayMarker;
layer.markScreenRange([[0, 0], [1, 4]], {
  reversed: true,
  invalidate: "inside",
  exclusive: false,
  clipDirection: "closest",
}) satisfies DisplayMarker;
layer.markScreenPosition([0, 0]) satisfies DisplayMarker;
layer.markScreenPosition([0, 0], { clipDirection: "backward" }) satisfies DisplayMarker;

// @ts-expect-error buffer positions need no clipping
layer.markBufferPosition([0, 0], { clipDirection: "closest" });

// @ts-expect-error buffer ranges need no clipping
layer.markBufferRange([[0, 0], [1, 4]], { clipDirection: "closest" });

// @ts-expect-error 'nearest' is not a clip direction
layer.markScreenPosition([0, 0], { clipDirection: "nearest" });

// ---------------------------------------------------------------------------
// Finding markers
//
// The filters come in buffer- and screen-coordinate variants.
// ---------------------------------------------------------------------------

layer.findMarkers({}) satisfies DisplayMarker[];
layer.findMarkers({
  startBufferPosition: [0, 0],
  endBufferPosition: { row: 1, column: 0 },
  startScreenPosition: [0, 0],
  endScreenPosition: [1, 0],
  startsInBufferRange: [[0, 0], [1, 0]],
  endsInBufferRange: [[0, 0], [1, 0]],
  startsInScreenRange: [[0, 0], [1, 0]],
  endsInScreenRange: [[0, 0], [1, 0]],
  startBufferRow: 0,
  endBufferRow: 4,
  startScreenRow: 0,
  endScreenRow: 4,
  intersectsBufferRowRange: [0, 4],
  intersectsScreenRowRange: [0, 4],
  containsBufferRange: [[0, 0], [1, 0]],
  containsBufferPosition: [0, 2],
  containedInBufferRange: [[0, 0], [9, 0]],
  containedInScreenRange: [[0, 0], [9, 0]],
  intersectsBufferRange: [[0, 0], [1, 0]],
  intersectsScreenRange: [[0, 0], [1, 0]],
}) satisfies DisplayMarker[];

// @ts-expect-error the buffer-layer filter names do not apply here
layer.findMarkers({ startPosition: [0, 0] });

// ---------------------------------------------------------------------------
// Events
//
// Markers surfaced by this layer are always display markers.
// ---------------------------------------------------------------------------

[
  layer.onDidUpdate(() => {}),
  layer.onDidCreateMarker((marker: DisplayMarker) => marker.getScreenRange()),
  layer.onDidDestroy(() => {}),
] satisfies Disposable[];
