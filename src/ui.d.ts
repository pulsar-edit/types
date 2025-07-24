import { Grammar } from '../index';

type MarkdownRenderOptions = {
  renderMode?: 'full' | 'fragment',
  html?: boolean,
  sanitize?: boolean,
  sanitizeAllowUnknownProtocols?: boolean,
  sanitizeAllowSelfClose?: boolean,
  breaks?: boolean,
  handleFrontMatter?: boolean,
  useDefaultEmoji?: boolean,
  useGitHubHeadings?: boolean,
  useTaskCheckbox?: boolean,
  taskCheckboxDisabled?: boolean,
  taskCheckboxDivWrap?: boolean,
  transformImageLinks?: boolean,
  transformAtomLinks?: boolean,
  transformNonFqdnLinks?: boolean,
  rootDomain?: string,
  filePath?: string,
  disableMode?: 'none' | 'strict'
}

type ApplySyntaxHighlightingOptions = {
  syntaxScopeNameFunc?: (id: string) => string,
  renderMode?: 'full'| 'fragment',
  grammar?: Grammar
};

type MatcherOptions = {
  numThreads?: number
  algorithm?: 'fuzzaldrin' | 'command-t'
  maxResults?: number
  recordMatchIndexes?: boolean
  maxGap: number
}

type MatchResult = {
  id: number
  value: string
  score: number
  matchIndexes?: number[]
}

class Matcher {
  numCpus: number;
  match(query: string, options: MatcherOptions): MatchResult;
  setCandidates(candidates: string[]): void;
}

export interface UI {
  /**
   * Utility methods for converting Markdown to HTML.
   */
  markdown: {
    /**
     * Render a Markdown document as HTML.
     */
    render(content: string, options?: MarkdownRenderOptions): string;

    /**
     * Apply Pulsar's built-in syntax highlighting system to code blocks within
     * Markdown. Modifies the given `DocumentFragment`.
     */
    applySyntaxHighlighting(
      content: DocumentFragment,
      options?: ApplySyntaxHighlightingOptions
    ): Promise<HTMLElement>;

    /**
     * Convert a string of HTML into a `DocumentFragment`.
     */
    convertToDOM(content: string): DocumentFragment;
  },

  /**
   * The fuzzy-matcher API – just like the one used in `autocomplete-plus`,
   * the command palette, etc.
   *
   * This API filters and scores a list of candidates based on what the user
   * has typed. Scoring is done by the particular algorithm of the configured
   * fuzzy-matching library. Filtering is done by returning a new
   * {@link Matcher} using {@link Matcher#setCandidates}, then calling
   * {@link Matcher#match}.
   *
   * You may also use {@link UI.fuzzyMatcher}’s `match` method to match a
   * single candidate; it uses the same API and options as
   * {@link Matcher#match}.
   */
  fuzzyMatcher: {
    setCandidates(candidates: string[]): Matcher;
    setCandidates(matcher: Matcher, candidates: string[]): Matcher;

    score(candidate: string, query: string, options?: MatcherOptions): number;
    match(candidate: string, query: string, options?: MatcherOptions): MatchResult;
  }
};
