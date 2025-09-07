import {
  Disposable,
  Grammar,
  Point,
  PointCompatible,
  Range,
  ScopeDescriptor
} from '../index';

type CommentStrings = {
  commentStartString?: string;
  commentEndString?: string;
  commentDelimiters?: {
    line?: string;
    block?: [string, string]
  };
};

/** The payload passed to the `bufferDidChange` method. */
type BufferDidChangeEvent = {
  oldText: string;
  newText: string;
  oldRange: Range;
  newRange: Range;
};

/**
 * An interface that must be implemented by anything that wants to tell a
 * {@link TextBuffer} how to apply syntax highlighting to a range of the
 * buffer.
 *
 * The methods described are the ones that {@link TextBuffer} requires to be
 * present in order to fulfill the `HighlightIterator` contract.
 */
export interface HighlightIterator {
  /**
   * Starts a `HighlightIterator` job. Accepts a {@link Point} and prepares to
   * begin describing the syntax highlighting context of the buffer starting at
   * that position and ending at the end of `endRow`.
   *
   * Should return an array of scope IDs for scopes that are already open at
   * the given `position`.
   */
  seek(position: PointCompatible, endRow: number): number[];

  /**
   * Advances the iterator to the next {@link Point} at which a scope is opened
   * or closed, if any.
   */
  moveToSuccessor(): boolean;

  /**
   * Returns the current position of the highlight iterator.
   *
   * If there are no further scope boundaries to apply, the iterator may return
   * {@link Point.INFINITY} as a way of telling the buffer that the
   * highlighting task is done.
   */
  getPosition(): Point;

  /**
   * Returns all scope IDs that begin at the iterator's current position.
   */
  getOpenScopeIds(): number[];

  /**
   * Returns all scope IDs that end at the iterator's current position.
   */
  getCloseScopeIds(): number[];
}

// NOTE: This interface contains only the methods that are shared between
// the two kinds of language mode.

/**
 * An adapter that helps a text buffer fulfill grammar-specific editor tasks
 * like syntax highlighting, indentation hinting, and code folding.
 *
 * A language mode helps a {@link TextBuffer} communicate with a
 * {@link Grammar}.
 *
 * There are two different implementations of the `LanguageMode` interface
 * corresponding to the two types of {@link Grammar}: `TextMateLanguageMode`
 * and `WASMTreeSitterLanguageMode`.
 */
export interface LanguageMode {

  /**
   * Called automatically when a buffer is destroyed or when the user changes a
   * buffer's grammar. You probably won't have to call this method yourself.
   */
  destroy(): void;

  /** Returns the {@link Grammar} associated with this language mode. */
  getGrammar(): Grammar;

  /**
   * Returns the root scope name for the {@link Grammar} associated with this
   * language mode.
   */
  getLanguageId(): string;

  // INDENTATION

  /**
   * Given a buffer row and the current configured tab length, returns an
   * indentation "level" for the given row.
   *
   * @returns An indentation level that, when multiplied by `tabLength`, tells
   *   how far the given row should be indented. It may also return `null` if
   *   the buffer is not in a state where a guess can be made (e.g., if no
   *   grammar as been assigned, or if initial parsing is still underway). It
   *   may also return a promise if it cannot give the correct answer
   *   synchronously — in which case it will eventually resolve with a number
   *   or with `undefined` (which means the initial request was made moot
   *   because of subsequent buffer changes).
   */
  suggestedIndentForBufferRow(
    /**
     * The (zero-indexed) buffer row whose indentation level should be checked.
     */
    bufferRow: number,
    /** The current configured tab length in characters. */
    tabLength: number,
    /**
     * An object of options. The specific options will vary according to the
     * language mode.
     */
    options?: object
  ): number | null | Promise<number | undefined>;

  /**
   * Given a buffer row, some text that may appear on the row, and the current
   * configured tab length, returns an ideal indentation "level" for the row.
   * This is used to determine the initial indentation level that should be
   * used when some clipboard text is pasted into the buffer.
   *
   * The return value may just be a "best guess" that is no different from the
   * value that would be returned by {@link suggestedIndentForBufferRow}.
   *
   * @returns An indentation level that, when multiplied by `tabLength`, tells
   *   how far the given row should be indented.
   */
  suggestedIndentForLineAtBufferRow(
    bufferRow: number,
    line: string,
    tabLength: number
  ): number;

  /**
   * Given a buffer row on which the user is currently typing and the current
   * configured tab length, returns an ideal indentation "level" for the row.
   *
   * This method differs from {@link suggestedIndentForBufferRow} in that it is
   * typically called after the user has started to type on a row — whereas
   * `suggestedIndentForBufferRow` is called when a row is empty following a
   * carriage return. We are less aggressive in changing the indentation level
   * of a line once the user has started to type on it, since an incorrect
   * guess will annoy the user more.
   *
   * @returns An indentation level that, when multiplied by `tabLength`, tells
   *   how far the given row should be indented.
   */
  suggestedIndentForEditedBufferRow(
    bufferRow: number,
    tabLength: number
  ): number;

  /**
   * A method that will be called every time the buffer changes, even for
   * changes inside of a larger transaction.
   *
   * {@link TextBuffer} calls this method so that the language mode can make
   * internal adjustments every time the contents of the buffer change.
   */
  bufferDidChange(
    /**
     * An object that contains details about the buffer change: the affected
     * {@link Range} in both "old" and "new" coordinate systems, plus the
     * affected text.
     */
    event: BufferDidChangeEvent
  ): void;

  // COMMENTS

  /**
   * Given a {@link Point} (or its equivalent) in the current buffer, returns
   * an object describing the appropriate comment delimiters for that position.
   *
   * This information is derived from the {@link Grammar} and the configuration
   * system. Often, the answer is the same no matter where you are in the
   * buffer, but sometimes it depends on position. (For instance, in an HTML
   * document, `<!--`/`-->` should be used outside of a `script` tag, and `//`
   * should be used inside of a `script` tag.
   *
   * Injections notwithstanding, if your language uses the same comment
   * delimiters regardless of context, you may define comment delimiters in the
   * grammar's definition file. But if comment syntax varies based on context
   * (e.g., JSX blocks inside of a JavaScript file), you must define comment
   * delimiters via the configuration system and specify the scope names within
   * the grammar that signify new contexts. For examples, consult the
   * `settings` directory in the `language-javascript` package.
   */
  commentStringsForPosition(position: PointCompatible): CommentStrings;

  // SYNTAX HIGHLIGHTING

  /**
   * Requests a highlight iterator.
   *
   * {@link TextBuffer} calls this method when it starts a highlighting (or
   * re-highlighting) task.
   */
  buildHighlightIterator(): HighlightIterator;

  /**
   * Translate a scope ID (a number) to the equivalent scope name (a string).
   *
   * For efficiency, scope names within a {@link Grammar} are given unique
   * numeric IDs. This results in more efficient highlighting tasks.
   */
  classNameForScopeId(id: number): string;

  /**
   * Subscribes to future notifications about when ranges of the buffer need to
   * be re-highlighted.
   *
   * A language mode finds out about buffer changes via
   * {@link bufferDidChange}. Once those changes happen, the language mode does
   * whatever is necessary to determine what range of the buffer (if any) needs
   * to be re-highlighted, then notifies the {@link TextBuffer} about it by
   * emitting the event that is subscribed to in `onDidChangeHighlighting`.
   * This is how a language mode triggers a re-highlighting task.
   *
   * The callbacks that want to know about highlighting changes can be invoked
   * at any point, even when the buffer hasn't changed. For instance, if a
   * new grammar is activated or an old one is deactivated, some ranges of the
   * buffer might need to be re-highlighted accordingly.
   */
  onDidChangeHighlighting(callback: (range: Range) => unknown): Disposable;

  // FOLDS

  /**
   * Whether the buffer can be folded at the given (zero-indexed) row number.
   */
  isFoldableAtRow(row: number): boolean;

  /**
   * If the given {@link Point} belongs to a foldable range, returns that
   * {@link Range}; otherwise returns `null`.
   */
  getFoldableRangeContainingPoint(point: Point, tabLength: number): Range | null;

  /**
   * Returns all foldable ranges in a buffer at a certain level of nesting.
   *
   * The "indent level" described in the method name is a misnomer, and recalls
   * the times when folding was simpler and entirely based on how deeply a
   * given range was indented. An `indentLevel` of `0` means "all foldable
   * ranges that are not surrounded by another foldable range"; `1` means "all
   * foldable ranges that are surrounded by exactly one other foldable range";
   * and so on.
   */
  getFoldableRangesAtIndentLevel(indentLevel: number, tabLength: number): Range[];

  /**
   * Returns all foldable ranges in a buffer.
   */
  getFoldableRanges(tabLength: number): Range[];

  // SCOPES

  /**
   * Returns the {@link ScopeDescriptor} at a given position in the buffer.
   *
   * Scope descriptors consist of a list of scope names (strings) in order from
   * broadest to most specific. They are important for looking up context-
   * specific values such as snippets and configuration settings.
   *
   * If you are authoring a language mode, you are encouraged to implement this
   * method by reusing your existing logic for syntax highlighting. This will
   * help guarantee that your scope descriptors are as accurate as they can
   * possibly be.
   */
  scopeDescriptorForPosition(position: PointCompatible): ScopeDescriptor;

  /**
   * Given a scope selector and a {@link Point}, returns the {@link Range} of
   * the buffer surrounding that buffer position that matches the scope
   * selector.
   *
   * If the given position _does not_ match the scope selector, returns `null`.
   */
  bufferRangeForScopeAtPosition(selector: string, position: PointCompatible): Range | null;

  // OTHER

  /**
   * Given a row number, determines whether the row is "commented" or not.
   *
   * This is used during the "Editor: Toggle Line Comments" command. To know
   * whether to flip a line from uncommented to commented, or vice versa,
   * Pulsar must know whether the line is currently considered to be commented
   * or not.
   *
   * If none of the line is significant to code execution, this method should
   * return `true`. If a line has no comment delimiter on it, or  has a
   * delimiter part of the way through the line (meaning the line is only
   * half-commented), this method should return `false`.
   */
  isRowCommented(row: number): boolean;
}
