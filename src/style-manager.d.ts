import { Disposable } from "../index";

/**
 *  A singleton instance of this class available via atom.styles, which you can
 *  use to globally query and observe the set of active style sheets.
 */
export interface StyleManager {
  // Event Subscription
  /** Invoke callback for all current and future style elements. */
  observeStyleElements(callback: (styleElement: StyleElementObservedEvent) => void): Disposable;

  /** Invoke callback when a style element is added. */
  onDidAddStyleElement(callback: (styleElement: StyleElementObservedEvent) => void): Disposable;

  /** Invoke callback when a style element is removed. */
  onDidRemoveStyleElement(callback: (styleElement: HTMLStyleElement) => void): Disposable;

  /** Invoke callback when an existing style element is updated. */
  onDidUpdateStyleElement(callback: (styleElement: StyleElementObservedEvent) => void): Disposable;

  // Reading Style Elements
  /** Get all loaded style elements. */
  getStyleElements(): HTMLStyleElement[];

  // Paths
  /** Get the path of the user style sheet in ~/.atom. */
  getUserStyleSheetPath(): string;

  /**
   * Add a stylesheet to the workspace.
   *
   * The vast majority of users won't have to do this directly.
   */
  addStyleSheet(
    /** The raw CSS to add. */
    source: string,
    params: {
      /**
       * The path on disk of the original source file from which this CSS was
       * generated. This acts as a unique identifier for the stylesheet; if an
       * existing `style` tag exists with the same `sourcePath`, its contents
       * are replaced instead of a new `style` element being created.
       */
      sourcePath?: string
      context?: string
      /**
       * The sheet's priority. The higher the number, the later the placement
       * in the list of `style` elements.
       */
      priority?: number
      /**
       * Whether to transform deprecated shadow DOM selectors for greater
       * compatibility.
       */
      skipDeprecatedSelectorsTransformation?: boolean
      /**
       * Whether to transform deprecated math usages from Less.js for greater
       * compatibility.
       */
      skipDeprecatedMathUsageTransformation?: boolean
    }
  ): Disposable;
}

export interface StyleElementObservedEvent extends HTMLStyleElement {
  sourcePath: string;
  context: string;
}
