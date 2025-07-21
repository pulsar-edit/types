import { DecorationPropsChangedEvent, DisplayMarker, Disposable } from "../index";

/**
 * Represents a decoration that follows a {@link DisplayMarker}.
 *
 * A decoration is a visual representation of a marker. It allows you to add
 * CSS classes to line numbers in the gutter, lines, and add selection-line
 * regions around marked ranges of text.
 */
export interface Decoration {
  /** The identifier for this Decoration. */
  readonly id: number;

  // Construction and Destruction
  /**
   * Destroy this marker decoration.
   *
   * If you own the associated marker, you can destroy that instead, and this
   * decoration will automatically be destroyed.
   */
  destroy(): void;

  // Event Subscription
  /**
   * Add a listener for when the decoration is updated via
   * {@link setProperties}.
   */
  onDidChangeProperties(callback: (event: DecorationPropsChangedEvent) => void): Disposable;

  /** Add a listener for when this decoration is destroyed. */
  onDidDestroy(callback: () => void): Disposable;

  // Decoration Details
  /** An ID unique across all Decoration objects. */
  getId(): number;

  /** Returns the marker associated with this decoration. */
  getMarker(): DisplayMarker;

  /**
   * Check if this decoration is of the given type.
   *
   * @param type A decoration type, such as `line-number` or `line`. This may
   *   also be an array of decoration types, with isType returning true if
   *   the decoration's type matches any in the array.
   */
  isType(type: string | string[]): boolean;

  // Properties
  /** Returns the Decoration's properties. */
  getProperties(): DecorationOptions;

  /**
   * Update the marker with new properties.
   *
   * Allows you to change the decoration's class.
   */
  setProperties(newProperties: DecorationOptions): void;
}

export interface SharedDecorationOptions {
  /**
   * This CSS class will be applied to the decorated line number, line,
   * highlight, or overlay.
   */
  class?: string | undefined;

  /**
   * An Object containing CSS style properties to apply to the relevant DOM
   * node.
   *
   * Currently this only works with a type of `cursor` or `text`.
   */
  style?: object | undefined;

  /**
   * An `HTMLElement` or a model object with a corresponding view registered.
   *
   * Only applicable to the `gutter`, `overlay`, and `block` types.
   */
  item?: object | undefined;

  /**
   * If `true`, the decoration will only be applied to the head of the
   * DisplayMarker.
   *
   * Only applicable to the `line` and `line-number` types.
   */
  onlyHead?: boolean | undefined;

  /**
   * If `true`, the decoration will only be applied if the associated
   * DisplayMarker is empty.
   *
   * Only applicable to the `gutter`, `line`, and `line-number` types.
   */
  onlyEmpty?: boolean | undefined;

  /**
   * If `true`, the decoration will only be applied if the associated
   * DisplayMarker is non-empty.
   *
   * Only applicable to the `gutter`, `line`, and `line-number` types.
   */
  onlyNonEmpty?: boolean | undefined;

  /**
   * If `false`, the decoration will be applied to the last row of a non-empty
   * range, even if it ends at column 0.
   *
   * Defaults to `true`. Only applicable to the `gutter`, `line`, and
   * `line-number` types.
   */
  omitEmptyLastRow?: boolean | undefined;

  /**
   * Controls where the view is positioned relative to the TextEditorMarker.
   *
   * Values can be 'head' (the default) or 'tail' for overlay decorations, and
   * 'before' (the default) or 'after' for block decorations.
   *
   * Only applicable to the `overlay` and `block` decoration types.
   */
  position?: "head" | "tail" | "before" | "after" | undefined;

  /**
   * Controls where the view is positioned relative to other block decorations
   * at the same screen row.
   *
   * If unspecified, block decorations render oldest to newest. Only applicable
   * to the `block` type.
   */
  order?: number | undefined;

  /**
   * Determines whether the decoration adjusts its horizontal or vertical
   * position to remain fully visible when it would otherwise overflow the
   * editor.
   *
   * Defaults to `true`. Only applicable to the `overlay` type.
   */
  avoidOverflow?: boolean | undefined;
}

export interface DecorationLayerOptions extends SharedDecorationOptions {
  /** One of several supported decoration types. */
  type?: "line" | "line-number" | "text" | "highlight" | "block" | "cursor" | undefined;
}

export interface DecorationOptions extends SharedDecorationOptions {
  /** One of several supported decoration types. */
  type?: "line" | "line-number" | "text" | "highlight" | "overlay" | "gutter" | "block" | "cursor" | undefined;

  /** The name of the gutter we're decorating, if type is "gutter". */
  gutterName?: string | undefined;
}
