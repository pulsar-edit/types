// Type-level tests for `src/grammar-registry.d.ts`.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import type {
  Disposable,
  Grammar,
  GrammarToken,
  InjectionPoint,
  TextBuffer,
  WASMTreeSitterGrammar,
} from "atom";
import type { Node } from "web-tree-sitter";

declare const buffer: TextBuffer;
declare const textMateGrammar: Grammar;
declare const treeSitterGrammar: WASMTreeSitterGrammar;

// ---------------------------------------------------------------------------
// Grammars come in two flavours, and most of the registry is typed against
// the union of them.
// ---------------------------------------------------------------------------

atom.grammars.getGrammars() satisfies Array<Grammar | WASMTreeSitterGrammar>;
atom.grammars.getGrammars({ includeTreeSitterGrammars: true });
atom.grammars.addGrammar(textMateGrammar) satisfies Disposable;
atom.grammars.addGrammar(treeSitterGrammar) satisfies Disposable;
atom.grammars.removeGrammar(treeSitterGrammar);

// The union is not narrowed for you — a caller must check.
const found = atom.grammars.grammarForScopeName("source.js");
found satisfies Grammar | WASMTreeSitterGrammar | undefined;

// @ts-expect-error the scope name may not be registered
atom.grammars.grammarForScopeName("source.js") satisfies Grammar | WASMTreeSitterGrammar;

// `WASMTreeSitterGrammar` extends `Grammar`, so the union is assignable to
// `Grammar[]`; the distinction only matters when reaching for the
// tree-sitter-specific members.
atom.grammars.getGrammars() satisfies Grammar[];

// Removing by scope name only ever yields a TextMate grammar.
atom.grammars.removeGrammarForScopeName("source.js") satisfies Grammar | undefined;

// @ts-expect-error unknown option
atom.grammars.getGrammars({ includeTextMateGrammars: true });

// ---------------------------------------------------------------------------
// Reading and loading
//
// The synchronous forms return a grammar; the asynchronous ones report through
// a Node-style callback whose grammar argument is optional.
// ---------------------------------------------------------------------------

atom.grammars.readGrammarSync("/tmp/grammar.cson") satisfies Grammar | WASMTreeSitterGrammar;
atom.grammars.loadGrammarSync("/tmp/grammar.cson") satisfies Grammar | WASMTreeSitterGrammar;

atom.grammars.readGrammar("/tmp/grammar.cson", (error, grammar) => {
  error satisfies Error | null;
  grammar satisfies Grammar | WASMTreeSitterGrammar | undefined;
});

atom.grammars.loadGrammar("/tmp/grammar.cson", (error, grammar) => {
  // The grammar is absent when the read failed, so it needs a check.
  if (error === null && grammar !== undefined) {
    grammar.scopeName satisfies string;
  }
});

atom.grammars.loadGrammar("/tmp/grammar.cson", (_error, grammar) => {
  // @ts-expect-error the grammar may be absent
  grammar.scopeName;
});

// ---------------------------------------------------------------------------
// `createGrammar` — a discriminated union on `type`
// ---------------------------------------------------------------------------

// The grammar's own params carry `type` alongside them — the registry passes
// the whole object straight to the grammar constructor.
atom.grammars.createGrammar("/tmp/grammar.cson", {
  type: "modern-tree-sitter",
  name: "JavaScript",
  scopeName: "source.js",
  treeSitter: {
    grammar: "./tree-sitter-javascript.wasm",
    highlightsQuery: "./highlights.scm",
    foldsQuery: "./folds.scm",
    languageSegment: "javascript",
  },
  comments: { start: "// ", end: "" },
}) satisfies Grammar;

// Without a `type`, the params describe a TextMate grammar.
atom.grammars.createGrammar("/tmp/grammar.cson", {
  name: "JavaScript",
  scopeName: "source.js",
  fileTypes: ["js", "mjs"],
  maxTokensPerLine: 100,
  injectionSelector: "source.js",
}) satisfies Grammar;

// @ts-expect-error a tree-sitter grammar needs its wasm grammar path
atom.grammars.createGrammar("/tmp/grammar.cson", {
  type: "modern-tree-sitter",
  name: "JavaScript",
  scopeName: "source.js",
});

atom.grammars.createGrammar("/tmp/grammar.cson", {
  // @ts-expect-error 'legacy-tree-sitter' is not a grammar type
  type: "legacy-tree-sitter",
  name: "JavaScript",
  scopeName: "source.js",
});

// @ts-expect-error a grammar needs a scope name
atom.grammars.createGrammar("/tmp/grammar.cson", { name: "JavaScript" });

// ---------------------------------------------------------------------------
// Language modes
// ---------------------------------------------------------------------------

atom.grammars.maintainLanguageMode(buffer) satisfies Disposable;
atom.grammars.assignLanguageMode(buffer, "source.js") satisfies boolean;
atom.grammars.autoAssignLanguageMode(buffer);
atom.grammars.selectGrammar("/tmp/a.js", "let x = 1;") satisfies Grammar | WASMTreeSitterGrammar;
atom.grammars.getGrammarScore(treeSitterGrammar, "/tmp/a.js", "let x = 1;") satisfies number;

// Tags are integer scope ids and run lengths — never scope names. `decodeTokens`
// resolves the ids itself via `scopeForId`.
atom.grammars.decodeTokens("let x = 1;", [-1, 10, -2]) satisfies GrammarToken[];

// @ts-expect-error a scope name is not a tag
atom.grammars.decodeTokens("let x = 1;", [-1, "source.js", -2]);

// ---------------------------------------------------------------------------
// Injection points
//
// The `language` and `content` callbacks receive tree-sitter nodes, and both
// may decline by returning a nullish value.
// ---------------------------------------------------------------------------

atom.grammars.addInjectionPoint("source.js", {
  type: "template_string",
  language: (node: Node) => (node.text.startsWith("html") ? "html" : undefined),
  content: (node: Node) => node.children.filter((child): child is Node => child !== null),
  includeChildren: true,
  newlinesBetween: false,
  coverShallowerScopes: true,
  includeAdjacentWhitespace: false,
  languageScope: "text.html.basic",
}) satisfies Disposable;

// `languageScope` may be omitted entirely, set to `null`, or computed.
atom.grammars.addInjectionPoint("source.js", {
  type: "call_expression",
  language: () => "javascript",
  content: (node) => node,
  languageScope: null,
});

atom.grammars.addInjectionPoint("source.js", {
  type: "call_expression",
  language: () => "javascript",
  content: (node) => node,
  languageScope: (grammar, buf, range) => {
    grammar satisfies WASMTreeSitterGrammar;
    buf satisfies TextBuffer;
    range.start.row satisfies number;
    return null;
  },
});

// An injection point can be built separately and reused.
const injectionPoint: InjectionPoint = {
  type: "template_string",
  language: () => "html",
  content: (node) => node,
};
atom.grammars.addInjectionPoint("source.js", injectionPoint);

// @ts-expect-error an injection point needs a node type
atom.grammars.addInjectionPoint("source.js", {
  language: () => "html",
  content: (node) => node,
});

atom.grammars.addInjectionPoint("source.js", {
  type: "template_string",
  // @ts-expect-error `language` returns a language name, not a boolean
  language: () => true,
  content: (node) => node,
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

[
  atom.grammars.onDidAddGrammar((grammar) => grammar.scopeName satisfies string),
  atom.grammars.onDidUpdateGrammar((grammar) => grammar.scopeName satisfies string),
  atom.grammars.onDidRemoveGrammar((grammar) => grammar.scopeName satisfies string),
] satisfies Disposable[];
