// Type-level tests for `src/layer-decoration.d.ts`.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import type {
  DecorationLayerOptions,
  DisplayMarker,
  DisplayMarkerLayer,
  LayerDecoration,
  Marker,
  TextEditor,
} from "../../index";

declare const editor: TextEditor;
declare const markerLayer: DisplayMarkerLayer;
declare const displayMarker: DisplayMarker;
declare const bufferMarker: Marker;

// ---------------------------------------------------------------------------
// Construction and lifecycle
//
// A layer decoration applies one set of properties to every marker on a layer,
// which is how a package decorates many markers without managing one
// `Decoration` per marker.
// ---------------------------------------------------------------------------

const layerDecoration = editor.decorateMarkerLayer(markerLayer, {
  type: "highlight",
  class: "my-highlight",
});

layerDecoration satisfies LayerDecoration;

layerDecoration.getId() satisfies number;
layerDecoration.getMarkerLayer() satisfies DisplayMarkerLayer;

// `destroy` is idempotent, and destroying the layer destroys the decoration.
layerDecoration.destroy();
layerDecoration.isDestroyed() satisfies boolean;

// ---------------------------------------------------------------------------
// Properties
//
// Unlike `Decoration#setProperties`, this one stores the object as given —
// there is no `normalizeDecorationProperties` pass, so nothing is stamped on.
// ---------------------------------------------------------------------------

const layerProperties = layerDecoration.getProperties();

layerProperties satisfies DecorationLayerOptions;
layerProperties.class satisfies string | undefined;

// @ts-expect-error a layer decoration's properties are stored raw, with no `id` stamped on
layerProperties.id;

layerDecoration.setProperties({ type: "line", class: "my-line" });

// ---------------------------------------------------------------------------
// Per-marker overrides
//
// The override map is keyed by marker, and is looked up by the layer's own
// marker instance — so either flavour of marker is accepted.
// ---------------------------------------------------------------------------

layerDecoration.setPropertiesForMarker(displayMarker, { class: "override" });
layerDecoration.setPropertiesForMarker(bufferMarker, { class: "override" });

// Passing `null` clears a marker's override rather than setting one.
layerDecoration.setPropertiesForMarker(displayMarker, null);

// The lookup returns nothing when the marker has no override — and when no
// override has ever been set, the map itself is never allocated.
layerDecoration.getPropertiesForMarker(displayMarker) satisfies DecorationLayerOptions | undefined;

// @ts-expect-error the override may be absent
layerDecoration.getPropertiesForMarker(displayMarker) satisfies DecorationLayerOptions;
