// Type-level tests for `dependencies/text-buffer/src/point.d.ts`.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import { Point } from "../../../index";
import type { PointCompatible, PointLike } from "../../../index";

declare const point: Point;

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

new Point() satisfies Point;
new Point(3) satisfies Point;
new Point(3, 12) satisfies Point;

Point.fromObject([3, 12]) satisfies Point;
Point.fromObject({ row: 3, column: 12 }) satisfies Point;
Point.fromObject(point, true) satisfies Point;

point.copy() satisfies Point;
point.negate() satisfies Point;

// @ts-expect-error a row is a number
new Point("3", 12);

// @ts-expect-error a point is a pair, not a triple
Point.fromObject([3, 12, 1]);

// @ts-expect-error a bare number is not point-compatible
Point.fromObject(3);

// ---------------------------------------------------------------------------
// The two point types
//
// `PointLike` is the duck-typed shape; `PointCompatible` adds the tuple
// shorthand that coercing methods accept.
// ---------------------------------------------------------------------------

point satisfies PointLike;
point satisfies PointCompatible;
({ row: 0, column: 0 }) satisfies PointLike;
[0, 0] satisfies PointCompatible;

// @ts-expect-error a tuple is not `PointLike`
([0, 0]) satisfies PointLike;

// @ts-expect-error a point needs both coordinates
({ row: 0 }) satisfies PointLike;

// ---------------------------------------------------------------------------
// Comparison
//
// Every comparison coerces, so all point-compatible forms are accepted.
// ---------------------------------------------------------------------------

Point.min([0, 0], { row: 1, column: 0 }) satisfies Point;
Point.min(point, [1, 0]) satisfies Point;
Point.max([0, 0], point) satisfies Point;

point.isZero() satisfies boolean;
point.isPositive() satisfies boolean;
point.isNegative() satisfies boolean;

point.compare([1, 0]) satisfies number;
point.isEqual({ row: 1, column: 0 }) satisfies boolean;
point.isLessThan(point) satisfies boolean;
point.isLessThanOrEqual([1, 0]) satisfies boolean;
point.isGreaterThan([1, 0]) satisfies boolean;
point.isGreaterThanOrEqual([1, 0]) satisfies boolean;

// @ts-expect-error a string is not point-compatible
point.compare("1,0");

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

point.translate([0, 1]) satisfies Point;
point.traverse({ row: 1, column: 0 }) satisfies Point;
point.traversalFrom([0, 1]) satisfies Point;
point.splitAt(4) satisfies [Point, Point];

// The well-known points are frozen.
Point.ZERO satisfies Readonly<Point>;
Point.INFINITY satisfies Readonly<Point>;

// @ts-expect-error `Point.ZERO` is frozen
Point.ZERO.row = 1;

// @ts-expect-error the well-known points cannot be replaced
Point.ZERO = new Point(0, 0);

// `assertValid` validates untrusted input, so it accepts anything — and
// narrows it to `PointLike` on return.
declare const mystery: unknown;
Point.assertValid(mystery);
mystery satisfies PointLike;
mystery.row satisfies number;
mystery.column satisfies number;

Point.assertValid({ row: 0, column: 0 });
Point.assertValid(point);

// Both serializations are pairs, not open-ended number arrays.
point.toArray() satisfies [number, number];
point.serialize() satisfies [number, number];
point.toString() satisfies string;

// A frozen point is still a Point, but no longer writable.
const frozen = point.freeze();
frozen satisfies Readonly<Point>;
frozen.row satisfies number;

// @ts-expect-error a frozen point cannot be mutated
frozen.row = 1;

// An unfrozen point can be.
point.row = 1;
point.column = 2;
