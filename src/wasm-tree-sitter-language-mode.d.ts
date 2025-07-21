import {
  Config,
  Grammar,
  GrammarRegistry,
  PointCompatible,
  Range,
  ScopeDescriptor,
  TextBuffer
} from '../index';
import { CommentDelimiterSpec, WASMTreeSitterGrammar } from './wasm-tree-sitter-grammar';

type TransactionMetadata = {
  /** How many atomic edits were made since the last clean tree. */
  changeCount: number,
  /**
   * A single range that represents the extent of the changes made since the
   * last clean tree.
   */
  range: Range | null,
  /**
   * How many times Pulsar requested auto-indent actions that this language
   * mode couldn't fulfill atomically.
   */
  autoIndentRequests: number
};

type SuggestedIndentForBufferRowOptions = {
  /**
   * Whether to skip emitting the `did-suggest-indent` event. Defaults to
   * `false`.
   */
  skipEvent?: boolean,
  /**
   * Whether to skip blank lines when looking for a comparison row. Defaults to
   * `true`.
   */
  skipBlankLines?: boolean,
  /**
   * Whether to skip the second (dedent) phase of indentation hinting.
   */
  skipDedentCheck?: boolean,
  /**
   * Whether to account for the leading whitespace that already exists on a row
   * when returning an indentation level. Defaults to `false`.
   */
  preserveLeadingWhitespace: boolean,

  /** Undocumented: An internal cache used to reduce work. */
  indentationLevels?: Map<number, number> | null,

  /**
   * Whether to force a re-parse of the tree if we think the tree is dirty.
   * Defaults to `false`.
   */
  forceTreeParse?: boolean
};

export class WASMTreeSitterLanguageMode {
  id: number;
  buffer: TextBuffer;
  grammar: WASMTreeSitterGrammar;
  grammarRegistry: GrammarRegistry;
  config: Config;

  useAsyncParsing: boolean;
  useAsyncIndent: boolean;

  rootScopeDescriptor: ScopeDescriptor;

  /** Destroy this language layer. */
  destroy(): void;

  getGrammar(): Grammar;

  getLanguageId(): string;

  getNonWordCharacters(pos: PointCompatible): string;

  /**
   * Resolves when all pending tree parses are finished — or immediately, if no
   * parsing is currently underway.
   *
   * If a parse is underway, will resolve with metadata about that transaction
   * that might be useful for the caller to know.
   */
  atTransactionEnd(): Promise<TransactionMetadata | void>;

  /**
   * Alias of {@link atTransactionEnd}; implemented for API compatibility with
   * the legacy Tree-sitter language mode.
   */
  parseCompletePromise(): Promise<TransactionMetadata | void>;

  /**
   * Given a language string — a string that describes a language informally —
   * determine the best match among active grammars.
   *
   * Consults grammars' `injectionRegex` properties and returns whichever one
   * produces the longest match against the input.
   */
  grammarForLanguageString(languageString: string): WASMTreeSitterGrammar | null;

  /**
   * Add a listener for when this language mode first finishes parsing the
   * buffer.
   */
  onDidTokenize(callback: () => void): Disposable;

  /**
   * Add a listener for when the syntax highlighting is updated for a given
   * range of the buffer.
   */
  onDidChangeHighlighting(callback: (range: Range) => void): Disposable;

  /**
   * Behaves like {@link scopeDescriptorForPosition}, but returns a list of
   * Tree-sitter node names. Useful for understanding Tree-sitter parsing or
   * for writing syntax highlighting query files.
   */
  syntaxTreeScopeDescriptorForPosition(point: PointCompatible): string[];

  /**
   * Returns the buffer range for the first scope to match the given scope
   * selector, starting with the smallest scope and moving outward.
   */
  bufferRangeForScopeAtPosition(scopeSelector: string, point: PointCompatible): Range | undefined;

  /**
   * Returns the {@link ScopeDescriptor} for a given point in the buffer.
   */
  scopeDescriptorForPosition(point: PointCompatible): ScopeDescriptor;

  // Syntax Tree APIs
  /**
   * Returns the smallest syntax node that contains the entire given range,
   * optionally filtering by a predicate function.
   */
  getSyntaxNodeContainingRange(
    range: Range,
    where?: (node: Node, grammar: WASMTreeSitterGrammar) => boolean
  ): Node | undefined;

  /**
   * Behaves like {@link getSyntaxNodeContainingRange}, but returns an object
   * with `node` and `grammar` properties.
   */
  getSyntaxNodeAndGrammarContainingRange(
    range: Range,
    where?: (node: Node, grammar: WASMTreeSitterGrammar) => boolean
  ): { node: Node, grammar: WASMTreeSitterGrammar } | { node: null, grammar: null };

  /**
   * Behaves like {@link getSyntaxNodeContainingRange}, but returns only the
   * range of the returned node.
   */
  getRangeForSyntaxNodeContainingRange(
    range: Range,
    where?: (node: Node, grammar: WASMTreeSitterGrammar) => boolean
  ): Range | undefined;

  /**
   * Returns the smallest syntax node at the given position, or the smallest
   * node that matches the optional `where` predicate.
   */
  getSyntaxNodeAtPosition(
    position: PointCompatible,
    where?: (node: Node, grammar: WASMTreeSitterGrammar) => boolean
  ): Node | undefined;

  // Folds
  /**
   * Given a point, returns the range of the deepest fold that includes that
   * point, or `null` if there are no such folds.
   */
  getFoldableRangeContainingPoint(point: PointCompatible): Range | null;

  /**
   * Return all foldable ranges in the buffer.
   */
  getFoldableRanges(): Range[];

  /**
   * Given a fold "depth," return all the ranges at that depth.
   *
   * This method is inaccurately named and is based on a legacy assumption that
   * every nesting of folds carries an extra level of indentation.
   *
   * Instead, a level of `0` means "all folds that are not contained by any
   * other" fold, a level of `1` means "all folds that are contained by
   * exactly one other fold," and so on.
   */
  getFoldableRangesAtIndentLevel(desiredLevel: number): Range[];

  /**
   * Tests whether the buffer is foldable at the given row.
   */
  isFoldableAtRow(row: number): boolean;

  /**
   * Gets the foldable range at the given row, or `null` if the buffer is not
   * foldable at that row.
   */
  getFoldRangeForRow(row: number): Range | null;

  // Comments
  /**
   * Retrieves the relevant comment delimiters for the given grammar and buffer
   * position.
   */
  commentStringsForPosition(position: PointCompatible): {
    commentStartString: string,
    commentEndString?: string,
    commentDelimiters: CommentDelimiterSpec
  };

  /** Returns whether the entire given buffer row is commented out. */
  isRowCommented(row: number): boolean;

  // Auto-indent

  /**
   * Get the suggested indentation level for an existing line in the buffer.
   *
   * Returns a number, `null`, or a promise that will resolve with either a
   * number or `undefined`.
   *
   * A returned number (or a promise that resolves to a number) represents a
   * suggested indentation level.
   *
   * A return value of `null` means that the buffer cannot currently be
   * analyzed (for instance, because it's not done with its initial parse).
   *
   * A return value of a promise that resolves to `undefined` means that we
   * had to wait until the end of the transaction (for performance reasons) to
   * make a suggestion, but the buffer changed too much in the interim for our
   * suggestion to be valuable. This signals to Pulsar that the entire range of
   * the transaction should be auto-indented instead.
   */
  suggestedIndentForBufferRow(
    row: number,
    tabLength: number,
    options: SuggestedIndentForBufferRowOptions
  ): number | null | Promise<number | undefined>;

  /**
   * Like {@link suggestedIndentForBufferRow}, but operates on a range of rows
   * at once.
   */
  suggestedIndentForBufferRows(
    startRow: number,
    endRow: number,
    tabLength: number,
    options: SuggestedIndentForBufferRowOptions & {
      /**
       * Whether we're asking to auto-indent text that we just pasted. This
       * triggers a slightly different mode in which only the first line
       * produces a suggestion, and all subsequent lines merely preserve
       * relative indentation levels within the pasted region.
       */
      isPastedText?: boolean
    }
  ): Map<number, number | null>;

  /**
   * Get the suggested indentation level for a line in the buffer on which the
   * user is currently typing.
   *
   * This may return a different result from
   * {@link suggestedIndentForBufferRow} in order to avoid unexpected changes
   * in indentation. It may also return `undefined` if no change should be
   * made.
   */
  suggestedIndentForEditedBufferRow (
    row: number,
    tabLength: number,
    options: SuggestedIndentForBufferRowOptions
  ): number | null | Promise<number | undefined>;

  /**
   * Get the suggested indentation level for a given line of text if it were
   * inserted at the given row in the buffer.
   *
   * This exists for API compatibility, but this is not knowable in Tree-sitter
   * before the content can be parsed; hence it delegates to
   * {@link suggestedIndentForBufferRow}.
   */
  suggestedIndentForLineAtBufferRow(
    row: number,
    lineText: string,
    tabLength: number
  ): number | null | Promise<number | undefined>;
}
