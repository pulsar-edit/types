import {
  DecorationLayerOptions,
  DisplayMarker,
  DisplayMarkerLayer,
  Marker,
  TextEditor
} from "../index";

/**
 * Represents a decoration that applies to every marker on a given layer.
 *
 * Created via {@link TextEditor#decorateMarkerLayer}.
 */
export interface LayerDecoration {
  /** Destroys the decoration. */
  destroy(): void;

  /** Determine whether this decoration is destroyed. */
  isDestroyed(): boolean;

  getId(): number;
  getMarkerLayer(): DisplayMarkerLayer;

  /** Get this decoration's properties. */
  getProperties(): DecorationLayerOptions;

  getPropertiesForMarker(marker: DisplayMarker): DecorationLayerOptions | undefined;

  /** Set this decoration's properties. */
  setProperties(newProperties: DecorationLayerOptions): void;

  /**
   * Override the decoration properties for a specific marker.
   *
   * Pass `null` as the second parameter in order to clear any previous
   * override.
   */
  setPropertiesForMarker(
    marker: DisplayMarker | Marker,
    properties: DecorationLayerOptions | null
  ): void;
}
