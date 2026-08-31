// Type-level tests for `dependencies/text-buffer/src/range.d.ts`.
//
// The distinction under test throughout: `RangeCompatible` is anything that
// can be *coerced* into a Range, while `RangeLike` is a duck-typed range whose
// ends are read directly — so the two accept different arguments, and the
// methods that take each are not interchangeable.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import { Point, Range } from "../../../index";
import type { RangeCompatible, RangeLike } from "../../../index";

declare const range: Range;

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

new Range() satisfies Range;
new Range([0, 0]) satisfies Range;
new Range([0, 0], [1, 4]) satisfies Range;
new Range(new Point(0, 0), { row: 1, column: 4 }) satisfies Range;

range.copy() satisfies Range;
range.negate() satisfies Range;

Range.fromText("hello") satisfies Range;
Range.fromText([1, 0], "hello\nworld") satisfies Range;
Range.fromPointWithDelta([0, 0], 2, 4) satisfies Range;
Range.fromPointWithTraversalExtent([0, 0], [1, 4]) satisfies Range;

// @ts-expect-error the text comes after the starting point
Range.fromText("hello", [1, 0]);

// @ts-expect-error a delta needs both a row and a column
Range.fromPointWithDelta([0, 0], 2);

// The ends of a real Range are always Points, however it was constructed.
range.start satisfies Point;
range.end satisfies Point;

// ---------------------------------------------------------------------------
// `RangeCompatible`: every coercible form
// ---------------------------------------------------------------------------

Range.fromObject([[0, 0], [1, 4]]) satisfies Range;
Range.fromObject([new Point(0, 0), { row: 1, column: 4 }]) satisfies Range;
Range.fromObject({ start: [0, 0], end: [1, 4] }) satisfies Range;
Range.fromObject({ start: { row: 0, column: 0 }, end: new Point(1, 4) }) satisfies Range;
Range.fromObject({ start: [0, 0], end: new Point(1, 4) }) satisfies Range;
Range.fromObject(range, true) satisfies Range;

// A Range and a RangeLike are both range-compatible; the reverse does not hold.
range satisfies RangeCompatible;
range satisfies RangeLike;
({ start: { row: 0, column: 0 }, end: { row: 1, column: 4 } }) satisfies RangeCompatible;
({ start: [0, 0], end: [1, 4] }) satisfies RangeCompatible;

// @ts-expect-error a range needs both ends
Range.fromObject([0, 0]);

// @ts-expect-error a range is not a single point
Range.fromObject({ row: 0, column: 0 });

// ---------------------------------------------------------------------------
// `RangeLike`: the duck-typed shape
//
// `union`, `coversSameRows` and `intersectsWith` read `.start`/`.end` without
// coercing them, so their ends must already be `PointLike`.
// ---------------------------------------------------------------------------

range.union(range) satisfies Range;
range.union({ start: { row: 0, column: 0 }, end: new Point(1, 4) }) satisfies Range;
range.coversSameRows(range) satisfies boolean;
range.intersectsWith(range) satisfies boolean;
range.intersectsWith(range, true) satisfies boolean;

// @ts-expect-error point tuples are not `PointLike`
range.union({ start: [0, 0], end: [1, 4] });

// @ts-expect-error a tuple pair is not a duck-typed range
range.coversSameRows([[0, 0], [1, 4]]);

// @ts-expect-error point tuples are not `PointLike`
range.intersectsWith({ start: [0, 0], end: [1, 4] });

// ---------------------------------------------------------------------------
// Comparison — these coerce, so the loose forms are accepted
// ---------------------------------------------------------------------------

range.compare([[0, 0], [1, 4]]) satisfies number;
range.isEqual({ start: [0, 0], end: [1, 4] }) satisfies boolean;
range.containsRange([[0, 0], [1, 4]]) satisfies boolean;
range.containsRange(range, true) satisfies boolean;
range.containsPoint([0, 2]) satisfies boolean;
range.containsPoint({ row: 0, column: 2 }, true) satisfies boolean;
range.intersectsRow(2) satisfies boolean;
range.intersectsRowRange(0, 4) satisfies boolean;

// ---------------------------------------------------------------------------
// Details and operations
// ---------------------------------------------------------------------------

range.isEmpty() satisfies boolean;
range.isSingleLine() satisfies boolean;
range.getRowCount() satisfies number;
range.getRows() satisfies number[];
range.getExtent() satisfies Point;
range.toDelta() satisfies Point;
range.translate([0, 1]) satisfies Range;
range.translate([0, 1], [0, -1]) satisfies Range;
range.traverse({ row: 1, column: 0 }) satisfies Range;
range.toString() satisfies string;

// A range serializes to a pair of pairs, so both levels destructure.
range.serialize() satisfies [[number, number], [number, number]];
const [[startRow, startColumn], [endRow, endColumn]] = range.serialize();
[startRow, startColumn, endRow, endColumn] satisfies number[];

// A frozen range is still a Range, but no longer writable.
const frozen = range.freeze();
frozen satisfies Readonly<Range>;
frozen.start satisfies Point;

// @ts-expect-error a frozen range cannot be mutated
frozen.start = new Point(0, 0);

// An unfrozen range can be.
range.start = new Point(0, 0);
