// Type-level tests for `dependencies/text-buffer/src/marker.d.ts`.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import type {
  Disposable,
  Marker,
  MarkerChangedEvent,
  Point,
  Range,
} from "../../../index";

declare const marker: Marker;
declare const other: Marker;

// ---------------------------------------------------------------------------
// Identity and lifecycle
// ---------------------------------------------------------------------------

marker.id satisfies number;
marker.copy() satisfies Marker;
marker.destroy();
marker.isDestroyed() satisfies boolean;
marker.isValid() satisfies boolean;

// @ts-expect-error `id` is readonly
marker.id = 1;

marker.copy({
  tailed: true,
  reversed: false,
  invalidate: "surround",
  exclusive: true,
  properties: { mine: true },
}) satisfies Marker;

// @ts-expect-error 'sometimes' is not an invalidation strategy
marker.copy({ invalidate: "sometimes" });

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

[
  marker.onDidDestroy(() => {}),
  marker.onDidChange((event: MarkerChangedEvent) => {
    event.oldHeadPosition satisfies Point;
    event.newHeadPosition satisfies Point;
    event.oldTailPosition satisfies Point;
    event.newTailPosition satisfies Point;
    event.wasValid satisfies boolean;
    event.isValid satisfies boolean;
    event.hadTail satisfies boolean;
    event.hasTail satisfies boolean;
    event.textChanged satisfies boolean;
  }),
] satisfies Disposable[];

// A buffer marker reports positions, never screen positions — those live on
// `DisplayMarker`.
// @ts-expect-error a buffer marker change has no screen positions
marker.onDidChange((event: MarkerChangedEvent) => event.newHeadScreenPosition);

// ---------------------------------------------------------------------------
// Details
// ---------------------------------------------------------------------------

marker.getRange() satisfies Range;
marker.getHeadPosition() satisfies Point;
marker.getTailPosition() satisfies Point;
marker.getStartPosition() satisfies Point;
marker.getEndPosition() satisfies Point;
marker.isReversed() satisfies boolean;
marker.hasTail() satisfies boolean;
marker.isExclusive() satisfies boolean;
marker.getInvalidationStrategy() satisfies string;

// ---------------------------------------------------------------------------
// Mutation
//
// Every mutator reports whether it actually changed the marker.
// ---------------------------------------------------------------------------

marker.setRange([[0, 0], [1, 4]]) satisfies boolean;
marker.setRange({ start: [0, 0], end: [1, 4] }, { reversed: true, exclusive: false }) satisfies boolean;
marker.setHeadPosition([1, 0]) satisfies boolean;
marker.setTailPosition({ row: 1, column: 0 }) satisfies boolean;
marker.clearTail() satisfies boolean;
marker.plantTail() satisfies boolean;

// ---------------------------------------------------------------------------
// Custom properties
// ---------------------------------------------------------------------------

marker.setProperties({ mine: true, count: 1 }) satisfies boolean;
marker.getProperties() satisfies Record<string, unknown>;

// Property values come back as `unknown`, so they need narrowing before use.
const value = marker.getProperties().mine;
value satisfies unknown;

// @ts-expect-error an unknown property value is not usable as a boolean
value satisfies boolean;

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

marker.isEqual(other) satisfies boolean;
marker.compare(other) satisfies number;

// @ts-expect-error markers compare against other markers, not ranges
marker.compare([[0, 0], [1, 4]]);
