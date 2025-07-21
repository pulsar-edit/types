import {
  Disposable,
  GrammarRegistry,
  GrammarToken,
  Range,
  TextBuffer,
  TokenizeLineResult
} from '../index';
import type { Language, Node, Query } from 'web-tree-sitter';

/**
 * An object with properties that describe the comment delimiters of a given
 * language.
 */
export type CommentDelimiterSpec = {
  /**
   * If present, a delimiter to be used for line comments. (If missing, the
   * language does not support line comments.)
   */
  line?: string,
  /**
   * If present, a two-item tuple representing the starting and ending
   * delimiters of block comments. (If missing, the language does not support
   * block comments.)
   */
  block?: [string, string]
}

/** A "standard" type of query used by Pulsar. */
type StandardQueryType =
  | 'highlightsQuery'
  | 'foldsQuery'
  | 'tagsQuery'
  | 'indentsQuery'

/**
 * An arbitrary query name that can be used by a community package.
 */
type CustomQueryType = string;

type DidChangeQueryPayload = {
  filePath: string,
  queryType: StandardQueryType | CustomQueryType
}

type LanguageScopeFunction = (
  grammar: WASMTreeSitterGrammar,
  buffer: TextBuffer,
  range: Range
) => string | null

export type InjectionPoint = {
  /** The name of the syntax node that may embed other languages. */
  type: string,
  /**
   * A function that is called with syntax nodes of the specified type. Can
   * return a string that will be tested against grammars' `injectionRegex`
   * properties in order to match this injection point to a given language.
   *
   * If this callback returns `undefined` or `null`, the injection will fail.
   */
  language(node: Node): string | undefined,
  /**
   * A function that is called with syntax nodes of the specified type. Should
   * return a {@link Node} (or an array of {@link Node}s) to identify the exact
   * range or ranges that should be highlighted.
   *
   * Depending on other settings, the ranges described by the return value may
   * be modified further. When the injected language parses this file, only
   * the content within these buffer ranges will be "visible" to the parser.
   *
   * If this callback returns `undefined` or `null`, the injection will fail.
   */
  content(node: Node): Node | Node[] | undefined,

  /**
   * Whether the children of nodes returned by `content` should be included
   * in the injection range. Defaults to `false`, meaning that for every node
   * returned by the `content` function, the ranges of all that node's children
   * will be "subtracted" from the injection range.
   *
   * When `true`, the full content ranges of all nodes returned from the
   * `content` callback will be part of the injection content range.
   */
  includeChildren?: boolean,

  /**
  * Whether the injection ranges should include any newline characters that
  * may exist in between injection ranges. Defaults to `false`.
  *
  * Grammars like ERB and EJS need this so that they do not interpret two
  * different embedded code sections on different lines as occurring on the
  * same line.
   */
  newlinesBetween?: boolean,

  /**
   * A string or function that returns the desired root scope name to apply to
   * each of the injection's buffer ranges. Defaults to the injected grammar's
   * own root language scope — e.g., `source.js` for the JavaScript grammar.
   *
   * Set to `null` if the language scope should be omitted.
   *
   * If a function, will be called with the {@link WASMTreeSitterGrammar}
   * instance, the {@link TextBuffer}, and the given buffer {@link Range}, and
   * should return either a string or `null`.
   */
  languageScope?: string | null | LanguageScopeFunction,

  /**
   * Whether this injection should prevent shallower layers (including the
   * layer that created this injection) from adding scopes within any of this
   * injection's buffer ranges. Useful for injecting languages into themselves
   * — for instance, injecting Rust into Rust macro definitions. Defaults to
   * `false`.
   */
  coverShallowerScopes?: boolean,

  /**
   * Whether the injection's buffer ranges should include whitespace that
   * occurs between two ranges that are separated only by whitespace. Defaults
   * to `false`. If `true`, such ranges will be consolidated into a single
   * range along with the whitespace that separates them.
   */
  includeAdjacentWhitespace?: boolean
}

type TreeSitterParams = {
  grammar: string
  highlightsQuery?: string
  foldsQuery?: string
  tagsQuery?: string
  indentsQuery?: string
  languageSegment?: string
}

type WASMTreeSitterGrammarParams = {
  name: string;
  scopeName: string;
  contentRegex?: string | string[]
  firstLineRegex?: string | string[]
  treeSitter: TreeSitterParams,
  comments?: {
    start?: string,
    end?: string
  }
}

/**
 *  A grammar responsible for language-specific features like syntax
 *  highlighting, indentation, and code folding. Uses Tree-sitter as its parsing
 *  system.
 */
export class WASMTreeSitterGrammar {
  /** The name of the grammar. */
  readonly name: string;

  /** Undocumented: Root scope name of the grammar. */
  readonly scopeName: string;

  constructor(
    registry: GrammarRegistry,
    grammarPath: string,
    params: WASMTreeSitterGrammarParams
  );

  // Callbacks
  onDidUpdate(callback: () => void): Disposable;

  /**
   * Calls `callback` when any of this grammar’s queries change.
   *
   * A grammar’s queries typically will not change after initial load. When
   * they do, it may mean:
   *
   * - The user is editing query files in dev mode; Pulsar will automatically
   *   reload queries in dev mode after changes.
   * - A community packge is altering a query file via an API like
   *   {@link setQueryForTest}.
   */
  onDidChangeQuery(callback: (payload: DidChangeQueryPayload) => void): Disposable;
  onDidChangeQueryFile(callback: (payload: DidChangeQueryPayload) => void): Disposable;

  /**
   * Calls `callback` when this grammar first loads its query files.
   */
  onDidLoadQueryFiles(callback: () => void): Disposable;

  /**
   * Undocumented: Adds an injection point by which this language can inject
   * another language during parsing.
   *
   * Do not call this directly; prefer {@link GrammarRegistry#addInjectionPoint}.
   */
  addInjectionPoint(injectionPoint: InjectionPoint): void;

  /**
   * Undocumented: Removes an injection point that was previously added.
   *
   * Do not call this directly; instead, use
   * {@link GrammarRegistry#addInjectionPoint} to add the injection point, then
   * retain the returned {@link Disposable} so you can use it to remove the
   * injection point you added.
   */
  removeInjectionPoint(injectionPoint: InjectionPoint): void;


  /**
   * Retrieve all known comment delimiters for this grammar.
   *
   * Some grammars may have different delimiters for different parts of a file
   * (for example, JSX within JavaScript). In these cases, you might instead
   * want to call {@link TextEditor#getCommentDelimitersForBufferPosition}
   * with a {@link Point} that represents a buffer position.
   */
  getCommentDelimiters(): CommentDelimiterSpec;

  /**
   * Retrieves the Tree-sitter `Language` instance associated with this
   * grammar.
   */
  getLanguage(): Promise<Language>

  /**
   * Synchronously retrieves the Tree-sitter `Language` instance associated
   * with this grammar, or `null` if the `Language` has not yet been loaded.
   */
  getLanguageSync(): Language | null

  getQuery(queryType: StandardQueryType | CustomQueryType): Promise<Query>
  getQuerySync(queryType: StandardQueryType | CustomQueryType): Query

  /**
   * Creates an arbitrary Tree-sitter `Query` instance from this grammar’s
   * `Language`.
   *
   * Package authors and end users can use queries for whatever purpose they
   * like.
   */
  createQuery(queryContents: string): Promise<Query>

  /**
   * Creates an arbitrary Tree-sitter `Query` instance from this grammar’s
   * `Language`.
   *
   * Package authors and end users can use queries for whatever purpose they
   * like.
   *
   * Synchronous; throws an error if the grammar’s `Language` is not yet
   * loaded.
   */
  createQuerySync(queryContents: string): Query

  /**
   * Sets the contents of standard or custom query type.
   *
   * Used by the specs to override a particular query for testing purposes.
   */
  setQueryForTest(queryType: StandardQueryType | CustomQueryType, contents: string): Promise<Query>;


  /**
   * Tokenize all lines in the given text.
   *
   * @param text A string containing one or more lines.
   * @return An array of token arrays for each line tokenized.
   */
  tokenizeLines(text: string): GrammarToken[][];

  /**
   * Tokenizes the line of text.
   *
   * @param line A string of text to tokenize.
   * @param ruleStack An optional array of rules previously returned from this
   *   method. This should be null when tokenizing the first line in the file.
   * @param firstLine A optional boolean denoting whether this is the first
   *   line in the file which defaults to `false`.
   * @return An object representing the result of the tokenize.
   */
  tokenizeLine(line: string, ruleStack?: null, firstLine?: boolean): TokenizeLineResult;

  /**
   * Tokenizes the line of text.
   *
   * @param line A string of text to tokenize.
   * @param ruleStack An optional array of rules previously returned from this
   *   method. This should be null when tokenizing the first line in the file.
   * @param firstLine A optional boolean denoting whether this is the first
   *   line in the file which defaults to `false`.
   * @return An object representing the result of the tokenize.
   */
  tokenizeLine(line: string, ruleStack: any[], firstLine?: false): TokenizeLineResult;
}
