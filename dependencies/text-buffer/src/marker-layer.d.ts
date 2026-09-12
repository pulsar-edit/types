import { Disposable } from "../../../index";
import { Marker, MarkerOptions, PointCompatible, RangeCompatible } from "./text-buffer";

export interface MarkerLayerOptions {
  maintainHistory?: boolean | undefined;
  persistent?: boolean | undefined;
  role?: string | undefined;
}

/** Experimental: A container for a related set of markers. */
export interface MarkerLayer {
  /** The identifier for this MarkerLayer. */
  readonly id: string;

  // Lifecycle
  /** Create a copy of this layer with markers in the same state and locations. */
  copy(): MarkerLayer;

  /** Destroy this layer. */
  destroy(): void;

  /** Remove all markers from this layer. */
  clear(): void;

  /** Determine whether this layer has been destroyed. */
  isDestroyed(): boolean;

  // Querying
  /** Get an existing marker by its id. */
  getMarker(id: number): Marker | undefined;

  /** Get all existing markers on the marker layer. */
  getMarkers(): Marker[];

  /** Get the number of markers in the marker layer. */
  getMarkerCount(): number;

  /** Find markers in the layer conforming to the given parameters. */
  findMarkers(params: FindMarkerOptions): Marker[];

  /** Get the role of the marker layer e.g. "atom.selection". */
  getRole(): string | undefined;

  // Marker Creation
  /** Create a marker with the given range. */
  markRange(
    range: RangeCompatible,
    options?: MarkerOptions,
  ): Marker;

  /** Create a marker at with its head at the given position with no tail. */
  markPosition(
    position: PointCompatible,
    options?: Omit<MarkerOptions, 'reversed'>,
  ): Marker;

  // Event Subscription
  /**
   *  Subscribe to be notified asynchronously whenever markers are created,
   *  updated, or destroyed on this layer.
   */
  onDidUpdate(callback: () => void): Disposable;

  /**
   *  Subscribe to be notified synchronously whenever markers are created on
   *  this layer.
   */
  onDidCreateMarker(callback: (marker: Marker) => void): Disposable;

  /** Subscribe to be notified synchronously when this layer is destroyed. */
  onDidDestroy(callback: () => void): Disposable;
}

export interface CustomMarkerProperties {
  /**
   * Any unrecognized property is interpreted as a custom marker property, and
   * will be added as another match criterion.
   */
  [key: string]: unknown;
}

export interface FindMarkerBaseOptions extends CustomMarkerProperties {
  /** Only include valid markers. */
  valid?: boolean | undefined;

  /** Only include reversed markers. */
  reversed?: boolean | undefined;

  /** Only include tailed markers. */
  tailed?: boolean | undefined;

  /**
   * Only include markers whose `invalidate` setting matches the given value.
   */
  invalidate?: MarkerOptions['invalidate'] | undefined;
}

export interface FindMarkerPositionalOptions {
  /** Only include markers that start at the given Point. */
  startPosition?: PointCompatible | undefined;

  /** Only include markers that end at the given Point. */
  endPosition?: PointCompatible | undefined;

  /** Only include markers that start inside the given Range. */
  startsInRange?: RangeCompatible | undefined;

  /** Only include markers that end inside the given Range. */
  endsInRange?: RangeCompatible | undefined;

  /** Only include markers that contain the given Point, inclusive. */
  containsPosition?: PointCompatible | undefined;

  /**
   * Only include markers that contain the given Point, inclusive.
   *
   * Alias of {@link containsPosition}.
   */
  containsPoint?: PointCompatible | undefined;

  /** Only include markers that contain the given {@link Range}, inclusive. */
  containsRange?: RangeCompatible | undefined;

  /** Only include markers that intersect the given {@link Range}. */
  intersectsRange?: RangeCompatible | undefined;

  /** Only include markers that start at the given row number. */
  startRow?: number | undefined;

  /** Only include markers that end at the given row number. */
  endRow?: number | undefined;

  /** Only include markers that intersect the given row number. */
  intersectsRow?: number | undefined;

  /**
   * Only include markers that intersect the given range of rows (given a
   * two-item tuple describing the starting and ending rows).
   */
  intersectsRowRange?: [number, number] | undefined;

  /**
   * Only include markers that are completely contained by the specified range.
   */
  containedInRange?: RangeCompatible | undefined;

}

export interface FindMarkerOptions extends FindMarkerBaseOptions, FindMarkerPositionalOptions {
}
