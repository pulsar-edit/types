/**
 * Represents a point in a buffer in zero-indexed row/column coordinates.
 *
 * Also used to express a “delta” between two points; for this reason, both
 * dimensions of a `Point` may be negative.
 */
export class Point {
  // Properties
  /** A zero-indexed number representing the row of the Point. */
  row: number;

  /** A zero-indexed number representing the column of the Point. */
  column: number;

  /** A frozen Point at `(0, 0)`. */
  static readonly ZERO: Readonly<Point>;

  /** A frozen Point at `(Infinity, Infinity)`. */
  static readonly INFINITY: Readonly<Point>;

  // Construction
  /**
  *  Create a Point from an array containing two numbers representing the
  *  row and column.
  */
  static fromObject(object: PointCompatible, copy?: boolean): Point;

  /**
   * Throw a `TypeError` unless the given object has numeric `row` and `column`
   * properties.
   *
   * Narrows its argument to {@link PointLike} on return.
   */
  static assertValid(point: unknown): asserts point is PointLike;

  /** Construct a Point object */
  constructor(row?: number, column?: number);

  /** Returns a new Point with the same row and column. */
  copy(): Point;

  /** Returns a new Point with the row and column negated. */
  negate(): Point;

  // Comparison
  /** Returns the given Point that is earlier in the buffer. */
  static min(point1: PointCompatible, point2: PointCompatible): Point;

  /** Returns the given Point that is later in the buffer. */
  static max(point1: PointCompatible, point2: PointCompatible): Point;

  /** Returns a boolean indicating whether this point is `(0, 0)`. */
  isZero(): boolean;

  /** Returns a boolean indicating whether this point follows `(0, 0)`. */
  isPositive(): boolean;

  /** Returns a boolean indicating whether this point precedes `(0, 0)`. */
  isNegative(): boolean;

  /**
   * Compare another Point to this Point instance.
   *
   * Returns `-1` if this point precedes the argument.
   *
   * Returns `0` if this point is equivalent to the argument.
   *
   * Returns `1` if this point follows the argument.
   */
  compare(other: PointCompatible): number;

  /**
   * Returns a boolean indicating whether this point has the same row and column
   * as the given Point.
   */
  isEqual(other: PointCompatible): boolean;

  /**
   * Returns a Boolean indicating whether this point precedes the given Point.
   */
  isLessThan(other: PointCompatible): boolean;

  /**
   * Returns whether this point precedes or is equal to the given Point.
   */
  isLessThanOrEqual(other: PointCompatible): boolean;

  /** Returns a Boolean indicating whether this point follows the given Point. */
  isGreaterThan(other: PointCompatible): boolean;

  /**
  *  Returns a Boolean indicating whether this point follows or is equal to
  *  the given Point.
  */
  isGreaterThanOrEqual(other: PointCompatible): boolean;

  // Operations
  /** Makes this point immutable and returns itself. */
  freeze(): Readonly<Point>;

  /**
   * Build and return a new point by adding the rows and columns of the given
   * point.
   */
  translate(other: PointCompatible): Point;

  /**
   * Build and return a new Point by traversing the rows and columns specified
   * by the given point.
   */
  traverse(other: PointCompatible): Point;

  /**
   * Build and return a new point representing the distance from the given
   * point to this one — the inverse of {@link traverse}.
   */
  traversalFrom(other: PointCompatible): Point;

  /**
   * Split this point at the given column, returning the portion before the
   * split and the portion after it.
   */
  splitAt(column: number): [Point, Point];

  /** Returns an array of this point's row and column. */
  toArray(): [number, number];

  /** Returns an array of this point's row and column. */
  serialize(): [number, number];

  /** Returns a string representation of the point. */
  toString(): string;
}

/**
 * The interface that should be implemented for all "point-compatible" objects.
 *
 * In general, something that implements `PointLike` can be treated like a
 * {@link Point} without any coercion.
 */
export interface PointLike {
  /** A zero-indexed number representing the row of the Point. */
  row: number;

  /** A zero-indexed number representing the column of the Point. */
  column: number;
}

/**
 * The types usable when constructing a point via the {@link Point.fromObject}
 * method.
 *
 * Any method that coerces or normalizes point syntax can accept any of these
 * forms.
 */
export type PointCompatible = PointLike | [number, number];
