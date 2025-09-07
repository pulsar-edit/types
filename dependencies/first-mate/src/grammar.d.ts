import { Disposable } from "../../../index";

/**
 * A class instance that encapsulates knowledge about language-specific tasks
 * like syntax highlighting.
 *
 * A `Grammar` knows how translate raw text in a given language into
 * syntax-highlighted text. The exact implementation details of how this is
 * done may vary.
 *
 * The two currently supported types of grammar in Pulsar are `Grammar`
 * (representing the original type of grammar that uses TextMate-style grammar
 * definitions to parse code) and `WASMTreeSitterGrammar` (a newer style of
 * grammar which uses Tree-sitter to parse code).
 *
 * A grammar has a human-readable name and an internal identifier that doubles
 * as its "root" scope name. (For instance: the `name` of the JavaScript grammar
 * is `"JavaScript"`; its `scopeName` is `"source.js"`.) You may find it useful
 * to use the former (for text shown to the user) or the latter (for keeping
 * track of grammar-specific concerns within your package).
 *
 * This object, `Grammar`, describes the original TextMate-style grammar
 * implementation, but also serves as an abstract interface that is fulfilled
 * by `WASMTreeSitterGrammar`. If you don't know which kind of grammar you are
 * working with, play it safe and use only what's available on {@link Grammar};
 * but if your package is designed to use Tree-sitter features, you may treat
 * a grammar as a `WASMTreeSitterGrammar` once you've done type-narrowing to
 * tell them apart. (A predicate function for telling them apart need only
 * look at `someGrammar.constructor.name`.)
 */
export interface Grammar {
  /** The name of the Grammar. */
  readonly name: string;

  /** Undocumented: scope name of the Grammar. */
  readonly scopeName: string;

  // Event Subscription

  onDidUpdate(callback: () => void): Disposable;

  // Tokenizing

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
  tokenizeLine(line: string, ruleStack: GrammarRule[], firstLine?: false): TokenizeLineResult;
}

export interface GrammarToken {
  value: string;
  scopes: string[];
}

export interface GrammarRule {
  // https://github.com/atom/first-mate/blob/v7.0.7/src/rule.coffee
  // This is private. Don't go down the rabbit hole.
  rule: object;
  scopeName: string;
  contentScopeName: string;
}

/** Result returned by `Grammar.tokenizeLine`. */
export interface TokenizeLineResult {
  /** The string of text that was tokenized. */
  line: string;

  /**
   * An array of integer scope IDs and strings.
   *
   * Positive IDs indicate the beginning of a scope, and negative tags indicate
   * the end.
   *
   * To resolve ids to scope names, call {@link GrammarRegistry#scopeForId}
   * with the absolute value of the id.
   */
  tags: Array<number | string>;

  /**
   * This is a dynamic property. Invoking it will incur additional overhead,
   * but will automatically translate the `tags` into token objects with
   * `value` and `scopes` properties.
   */
  tokens: GrammarToken[];

  /**
   * An array of rules representing the tokenized state at the end of the line.
   * These should be passed back into this method when tokenizing the next line
   * in the file.
   */
  ruleStack: GrammarRule[];
}
