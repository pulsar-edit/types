// Type-level tests for `dependencies/text-buffer/src/display-marker.d.ts`.
//
// A `DisplayMarker` wraps a buffer `Marker` and projects it through a
// `DisplayLayer`, so nearly every operation comes in a buffer-coordinate and a
// screen-coordinate form. Its mutators forward to the underlying buffer marker
// and return that marker's "did anything change?" boolean.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import type {
  DisplayMarker,
  DisplayMarkerChangedEvent,
  Disposable,
  Point,
  Range,
} from "../../../index";

declare const marker: DisplayMarker;
declare const other: DisplayMarker;

// ---------------------------------------------------------------------------
// Identity and lifecycle
//
// A display marker takes its id from the buffer marker it wraps.
// ---------------------------------------------------------------------------

marker.id satisfies number;

// @ts-expect-error `id` is readonly
marker.id = 1;

marker.copy() satisfies DisplayMarker;
marker.copy({ tailed: false, invalidate: "touch" }) satisfies DisplayMarker;
marker.destroy();
marker.isValid() satisfies boolean;
marker.isDestroyed() satisfies boolean;
marker.isReversed() satisfies boolean;
marker.isExclusive() satisfies boolean;
marker.hasTail() satisfies boolean;
marker.getInvalidationStrategy() satisfies string;

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

[
  marker.onDidDestroy(() => {}),
  marker.onDidChange((event: DisplayMarkerChangedEvent) => {
    // Both coordinate spaces are reported.
    event.oldHeadBufferPosition satisfies Point;
    event.newHeadBufferPosition satisfies Point;
    event.oldTailBufferPosition satisfies Point;
    event.newTailBufferPosition satisfies Point;
    event.oldHeadScreenPosition satisfies Point;
    event.newHeadScreenPosition satisfies Point;
    event.oldTailScreenPosition satisfies Point;
    event.newTailScreenPosition satisfies Point;
    event.wasValid satisfies boolean;
    event.hadTail satisfies boolean;
    event.textChanged satisfies boolean;
  }),
] satisfies Disposable[];

// ---------------------------------------------------------------------------
// Ranges in both coordinate spaces
// ---------------------------------------------------------------------------

marker.getBufferRange() satisfies Range;
marker.getScreenRange() satisfies Range;

marker.setBufferRange([[0, 0], [1, 4]]) satisfies boolean;
marker.setBufferRange({ start: [0, 0], end: [1, 4] }, { reversed: true }) satisfies boolean;
marker.setBufferRange([[0, 0], [1, 4]], { reversed: true, exclusive: false }) satisfies boolean;
marker.setScreenRange([[0, 0], [1, 4]]) satisfies boolean;
marker.setScreenRange([[0, 0], [1, 4]], { reversed: false, clipDirection: "closest" }) satisfies boolean;

// ---------------------------------------------------------------------------
// Positions in both coordinate spaces
//
// The screen-side accessors take an optional clip direction; the buffer-side
// ones need no clipping, since every buffer position is representable.
// ---------------------------------------------------------------------------

marker.getStartBufferPosition() satisfies Point;
marker.getEndBufferPosition() satisfies Point;
marker.getHeadBufferPosition() satisfies Point;
marker.getTailBufferPosition() satisfies Point;

marker.getStartScreenPosition() satisfies Point;
marker.getEndScreenPosition({ clipDirection: "backward" }) satisfies Point;
marker.getHeadScreenPosition({ clipDirection: "forward" }) satisfies Point;
marker.getTailScreenPosition({ clipDirection: "closest" }) satisfies Point;

// `clipDirection` is optional wherever it appears, so a partially-filled (or
// empty) options object is accepted at every screen accessor.
marker.getStartScreenPosition({}) satisfies Point;
marker.getEndScreenPosition({}) satisfies Point;
marker.getHeadScreenPosition({}) satisfies Point;
marker.getTailScreenPosition({}) satisfies Point;

marker.setHeadBufferPosition([1, 0]) satisfies boolean;
marker.setTailBufferPosition({ row: 1, column: 0 }) satisfies boolean;
marker.setHeadScreenPosition([1, 0]) satisfies boolean;
marker.setHeadScreenPosition([1, 0], { clipDirection: "closest" }) satisfies boolean;
marker.setHeadScreenPosition([1, 0], {}) satisfies boolean;
marker.setTailScreenPosition([1, 0], {}) satisfies boolean;

// The range setters take the marker options as well; `setScreenRange` adds the
// clip direction its translation step needs.
marker.setScreenRange([[0, 0], [1, 4]], {}) satisfies boolean;
marker.setBufferRange([[0, 0], [1, 4]], {}) satisfies boolean;
marker.setBufferRange([[0, 0], [1, 4]], { exclusive: true }) satisfies boolean;
marker.setScreenRange([[0, 0], [1, 4]], { exclusive: true }) satisfies boolean;
marker.plantTail() satisfies boolean;
marker.clearTail() satisfies boolean;

// @ts-expect-error 'nearest' is not a clip direction
marker.getStartScreenPosition({ clipDirection: "nearest" });

// ---------------------------------------------------------------------------
// Properties and comparison
// ---------------------------------------------------------------------------

marker.setProperties({ mine: true }) satisfies boolean;
marker.getProperties() satisfies object;
marker.matchesProperties({ startBufferPosition: [0, 0] }) satisfies boolean;
marker.isEqual(other) satisfies boolean;
marker.compare(other) satisfies number;

// @ts-expect-error display markers compare against other display markers
marker.compare([[0, 0], [1, 4]]);
