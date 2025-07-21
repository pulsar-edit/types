import {
  DecorationLayerOptions,
  DisplayMarker,
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

  /** Get this decoration's properties. */
  getProperties(): DecorationLayerOptions;

  /** Set this decoration's properties. */
  setProperties(newProperties: DecorationLayerOptions): void;

  /** Override the decoration properties for a specific marker. */
  setPropertiesForMarker(
    marker: DisplayMarker | Marker,
    properties: DecorationLayerOptions
  ): void;
}
