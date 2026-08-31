// Type-level tests for `dependencies/first-mate/src/grammar.d.ts`.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.
//
// `Grammar` plays two roles at once: it describes the TextMate grammar
// implementation (second-mate's `Grammar`, in `node_modules/second-mate/lib/
// grammar.js`) *and* it serves as the abstract interface that
// `WASMTreeSitterGrammar` fulfils. The tests below cover both roles.

import type {
  Disposable,
  Grammar,
  GrammarRule,
  GrammarToken,
  TokenizeLineResult,
  WASMTreeSitterGrammar,
} from "../../../index";

declare const grammar: Grammar;
declare const treeSitterGrammar: WASMTreeSitterGrammar;

// ---------------------------------------------------------------------------
// Identity
//
// A grammar's human-readable `name` and its root `scopeName` are both set once
// in the constructor and never reassigned.
// ---------------------------------------------------------------------------

grammar.name satisfies string;
grammar.scopeName satisfies string;

// @ts-expect-error `name` is readonly
grammar.name = "JavaScript";

// @ts-expect-error `scopeName` is readonly
grammar.scopeName = "source.js";

// Both grammar implementations set `fileTypes`, defaulting it to an empty
// array when the grammar file omits it, so it is never absent.
grammar.fileTypes satisfies string[];
treeSitterGrammar.fileTypes satisfies string[];

// ---------------------------------------------------------------------------
// Event subscription
// ---------------------------------------------------------------------------

grammar.onDidUpdate(() => {}) satisfies Disposable;

// The callback is invoked with no arguments.
grammar.onDidUpdate((...args) => args satisfies []);

// ---------------------------------------------------------------------------
// Tokenizing whole strings
//
// `tokenizeLines` splits on newlines and decodes each line's tags into tokens,
// so the result is one token array per line.
// ---------------------------------------------------------------------------

const lines = grammar.tokenizeLines("const x = 1;\nconst y = 2;");

lines satisfies GrammarToken[][];
lines[0][0].value satisfies string;
lines[0][0].scopes satisfies string[];

// @ts-expect-error a token carries its scope names, not scope ids
lines[0][0].scopes satisfies number[];

// ---------------------------------------------------------------------------
// Tokenizing a single line
//
// The first line of a file is tokenized with a null rule stack; every
// subsequent line is handed the stack returned by the previous call.
// ---------------------------------------------------------------------------

const firstLine = grammar.tokenizeLine("const x = 1;", null, true);

firstLine satisfies TokenizeLineResult;
firstLine.line satisfies string;
firstLine.tokens satisfies GrammarToken[];
firstLine.ruleStack satisfies GrammarRule[];

// Tags are integers throughout: a positive tag is the length of a run of
// text, an odd negative tag opens a scope, and an even negative tag closes
// one. (Second-mate's doc comment claims strings can appear too, but nothing
// ever pushes one, and `decodeTokens` would mis-handle it if it did.)
firstLine.tags satisfies number[];

// The rule stack is optional — omitting it is the same as passing `null`.
grammar.tokenizeLine("const x = 1;") satisfies TokenizeLineResult;

// Threading the stack forward is the whole point of the return value.
grammar.tokenizeLine("const y = 2;", firstLine.ruleStack) satisfies TokenizeLineResult;

// @ts-expect-error the rule stack is an array of rules, not a string
grammar.tokenizeLine("const y = 2;", "source.js");

// ---------------------------------------------------------------------------
// Rule stack entries
//
// Each entry pairs the (private) rule object with the scope names that were
// open when it was pushed. Both names are absent whenever the pattern that
// pushed the rule declared no `name`/`contentName` — which is why second-mate
// guards every read of them with a truthiness check.
// ---------------------------------------------------------------------------

const stackEntry = firstLine.ruleStack[0];

stackEntry satisfies GrammarRule;
stackEntry.rule satisfies object;
stackEntry.scopeName satisfies string | undefined;
stackEntry.contentScopeName satisfies string | undefined;

// @ts-expect-error a rule pushed by an unnamed pattern has no scope name
stackEntry.scopeName satisfies string;

// @ts-expect-error the initial rule is created without a content scope name
stackEntry.contentScopeName satisfies string;

// ---------------------------------------------------------------------------
// The Tree-sitter grammar honors the same contract
//
// `WASMTreeSitterGrammar`'s tokenizing methods are backward-compatibility
// shims. A Tree-sitter grammar cannot parse a line of text in isolation — it
// has no equivalent of a rule stack to carry context across lines, and its
// scope IDs live in a different (positive, ascending) space from the ones
// `GrammarRegistry#decodeTokens` knows how to decode. So, as of Pulsar 1.133,
// the shims return a well-formed but empty result rather than a differently-
// shaped one. That is what keeps `extends Grammar` honest: every assertion
// above holds for either kind of grammar.
// ---------------------------------------------------------------------------

treeSitterGrammar.onDidUpdate(() => {}) satisfies Disposable;
treeSitterGrammar.tokenizeLines("const x = 1;\nconst y = 2;") satisfies GrammarToken[][];

const treeSitterLine = treeSitterGrammar.tokenizeLine("const x = 1;");

treeSitterLine satisfies TokenizeLineResult;
treeSitterLine.line satisfies string;
treeSitterLine.tags satisfies number[];
treeSitterLine.tokens satisfies GrammarToken[];
treeSitterLine.ruleStack satisfies GrammarRule[];

// Because the contract is shared, code written against `Grammar` accepts
// either implementation without narrowing.
declare function firstTokenOf(anyGrammar: Grammar, line: string): GrammarToken | undefined;

firstTokenOf(grammar, "const x = 1;");
firstTokenOf(treeSitterGrammar, "const x = 1;");

// ---------------------------------------------------------------------------
// Telling the two grammar kinds apart
//
// `WASMTreeSitterGrammar` declares `type: "modern-tree-sitter"`; the TextMate
// `Grammar` declares no `type` at all. That asymmetry is the supported way to
// narrow a grammar of unknown provenance.
// ---------------------------------------------------------------------------

declare const eitherGrammar: Grammar | WASMTreeSitterGrammar;

if ("type" in eitherGrammar) {
  eitherGrammar satisfies WASMTreeSitterGrammar;
  eitherGrammar.type satisfies "modern-tree-sitter";
  eitherGrammar.getCommentDelimiters();
} else {
  eitherGrammar satisfies Grammar;
  // @ts-expect-error a TextMate grammar has no tree-sitter query API
  eitherGrammar.getQuerySync("highlightsQuery");
}

// @ts-expect-error a TextMate grammar declares no `type` property to read
grammar.type;

// @ts-expect-error narrowing is required — the two are not interchangeable
grammar satisfies WASMTreeSitterGrammar;

// `WASMTreeSitterGrammar extends Grammar`, so a mixed array of grammars is a
// `Grammar[]` without any narrowing at all.
[grammar, treeSitterGrammar] satisfies Grammar[];
