import {
  Disposable,
  Grammar as TextMateGrammar,
  GrammarToken,
  TextBuffer
} from "../index";
import {
  InjectionPoint,
  WASMTreeSitterGrammar,
  WASMTreeSitterGrammarParams
} from "./wasm-tree-sitter-grammar";

type GenericGrammar = TextMateGrammar | WASMTreeSitterGrammar

type GrammarType = 'modern-tree-sitter' | 'textmate'

type TextMateGrammarParams = {
  maxTokensPerLine?: number
  maxLineLength?: number
  limitLineLength?: boolean
  name: string
  fileTypes?: string[]
  scopeName: string
  foldingStopMarker?: string

  injections?: unknown[]
  injectionSelector?: string

  patterns?: unknown[]
  repository?: unknown
  firstLineMatch?: string
  contentRegex?: string
}

type GrammarConstructorParams = WASMTreeSitterGrammarParams | TextMateGrammarParams

type CreateGrammarParams = {
  type: 'modern-tree-sitter',
  params: GrammarConstructorParams
} | {
  params: TextMateGrammarParams
}

type LanguageScopeFunction = (
  grammar: WASMTreeSitterGrammar,
  buffer: TextBuffer,
  range: Range
) => string | null


/** Registry containing one or more grammars. */
export interface GrammarRegistry {
  // Event Subscription
  /**
   *  Invoke the given callback when a grammar is added to the registry.
   *  @param callback The callback to be invoked whenever a grammar is added.
   *  @return A Disposable on which `.dispose()` can be called to unsubscribe.
   */
  onDidAddGrammar(callback: (grammar: GenericGrammar) => void): Disposable;

  /**
   *  Invoke the given callback when a grammar is updated due to a grammar it
   *  depends on being added or removed from the registry.
   *  @param callback The callback to be invoked whenever a grammar is updated.
   *  @return A Disposable on which `.dispose()` can be called to unsubscribe.
   */
  onDidUpdateGrammar(callback: (grammar: GenericGrammar) => void): Disposable;

  /**
   *  Invoke the given callback when a grammar is removed from the registry.
   *  @param callback The callback to be invoked whenever a grammar is removed.
   *  @return A Disposable on which `.dispose()` can be called to unsubscribe.
   */
  onDidRemoveGrammar(callback: (grammar: GenericGrammar) => void): Disposable;

  // Managing Grammars
  /**
   *  Get all the grammars in this registry.
   *
   *  @param options When `includeTreeSitterGrammars` is `true`, will return
   *    both `Grammar`s and `WASMTreeSitterGrammar`s. Defaults to `false`.
   *  @return A non-empty array of `Grammar` instances.
   */
  getGrammars(options?: { includeTreeSitterGrammars?: boolean }): GenericGrammar[];

  /**
   *  Get a grammar with the given scope name.
   *
   *  If there is more than one kind of grammar for the given scope name,
   *  will return the grammar that matches the preferred grammar type for the
   *  given language as configured by the user.
   *
   *  @param scopeName A string such as `source.js`.
   *  @return A Grammar or undefined.
   */
  grammarForScopeName(scopeName: string, parserType: GrammarType): GenericGrammar | undefined;

  /**
   *  Add a grammar to this registry.
   *  A 'grammar-added' event is emitted after the grammar is added.
   *  @param grammar The Grammar to add. This should be a value previously returned
   *  from ::readGrammar or ::readGrammarSync.
   *  @return Returns a Disposable on which `.dispose()` can be called to remove
   *  the grammar.
   */
  addGrammar(grammar: GenericGrammar): Disposable;

  /**
   *  Remove the given grammar from this registry.
   *  @param grammar The grammar to remove. This should be a grammar previously
   *  added to the registry from ::addGrammar.
   */
  removeGrammar(grammar: GenericGrammar): void;

  /**
   * Create a grammar of the type indicated by `params.type` — or a
   * TextMate-style `Grammar` by default.
   *
   * @param grammarPath The path to the grammar configuration file.
   * @param params Parameters to pass to the constructor. If `params.type`
   *   is `'modern-tree-sitter'`, will create a `WASMTreeSitterGrammar`;
   *   otherwise will create a `Grammar`.
   */
  createGrammar(grammarPath: string, params: CreateGrammarParams): GenericGrammar;

  /**
   *  Remove the grammar with the given scope name.
   *  @param scopeName A string such as `source.js`.
   *  @return Returns the removed Grammar or undefined.
   */
  removeGrammarForScopeName(scopeName: string): TextMateGrammar | undefined;

  /**
   *  Read a grammar synchronously but don't add it to the registry.
   *
   *  @param grammarPath The absolute file path to a grammar.
   *  @return The newly loaded Grammar.
   */
  readGrammarSync(grammarPath: string): GenericGrammar;

  /**
   * Read a grammar asynchronously but don't add it to the registry.
   *
   * @param grammarPath The absolute file path to the grammar.
   * @param callback The function to be invoked once the Grammar has been
   *   read in.
   */
  readGrammar(grammarPath: string, callback: (error: Error | null, grammar?: GenericGrammar) => void): void;

  /**
   * Read a grammar synchronously and add it to this registry.
   *
   * @param grammarPath The absolute file path to the grammar.
   * @return The newly loaded Grammar.
   */
  loadGrammarSync(grammarPath: string): GenericGrammar;

  /**
   * Read a grammar asynchronously and add it to the registry.
   *
   * @param grammarPath The absolute file path to the grammar.
   * @param callback The function to be invoked once the Grammar has been read
   *   in and added to the registry.
   */
  loadGrammar(grammarPath: string, callback: (error: Error | null, grammar?: GenericGrammar) => void): void;

  /**
   * Convert compact tags representation into convenient, space-inefficient
   * tokens.
   *
   *  @param lineText The text of the tokenized line.
   *  @param tags The tags returned from a call to Grammar::tokenizeLine().
   *  @return An array of Token instances decoded from the given tags.
   */
  decodeTokens(lineText: string, tags: Array<number | string>): GrammarToken[];

  /**
   * Set a TextBuffer's language mode based on its path and content, and
   * continue to update its language mode as grammars are added or updated,
   * or the buffer's file path changes.
   * @param buffer The buffer whose language mode will be maintained.
   * @return A {@link Disposable} that can be used to stop updating the
   *   buffer's language mode.
   */
  maintainLanguageMode(buffer: TextBuffer): Disposable;

  /**
   * Force a {@link TextBuffer} to use a different grammar than the one that
   * would otherwise be selected for it.
   *
   * @param buffer The buffer whose grammar will be set.
   * @param languageId The identifier of the desired language.
   * @return Returns a boolean that indicates whether the language was
   *   successfully found.
   */
  assignLanguageMode(buffer: TextBuffer, languageId: string): boolean;

  /**
   * Remove any language mode override that has been set for the given
   * TextBuffer. This will assign to the buffer the best language mode
   * available.
   */
  autoAssignLanguageMode(buffer: TextBuffer): void;

  /**
   *  Select a grammar for the given file path and file contents.
   *
   *  This picks the best match by checking the file path and contents against
   *  each grammar.
   *
   *  @param filePath A string file path.
   *  @param fileContents A string of text for that file path.
   */
  selectGrammar(filePath: string, fileContents: string): GenericGrammar;

  /**
   *  Returns a number representing how well the grammar matches the
   *  `filePath` and `contents`.
   *  @param grammar The grammar to score.
   *  @param filePath A string file path.
   *  @param contents A string of text for that file path.
   */
  getGrammarScore(grammar: GenericGrammar, filePath: string, contents: string): number;

  /**
   * Specify a type of syntax node that may embed other languages.
   *
   * Returns a {@link Disposable} that, when disposed, will remove the
   * injection point.
   */
  addInjectionPoint(scopeName: string, injectionPoint: InjectionPoint): Disposable;
}
