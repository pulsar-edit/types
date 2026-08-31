// Type-level tests for `autocomplete-plus/index.d.ts`.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.
//
// Source of truth: `pulsar/packages/autocomplete-plus/lib/`, principally
// `provider-manager.js`, `provider-metadata.js`, `autocomplete-manager.js`,
// and `suggestion-list-element.js`.

import type {
  AnySuggestion,
  AutocompleteProvider,
  SnippetSuggestion,
  SuggestionInsertedEvent,
  SuggestionsRequestedEvent,
  Suggestions,
  TextSuggestion,
} from "atom/autocomplete-plus";
import type { Point, ScopeDescriptor, TextEditor } from "atom";

// ---------------------------------------------------------------------------
// The suggestion request
//
// `findSuggestions` builds this object once and hands a copy to every
// applicable provider (`autocomplete-manager.js:255-305`).
// ---------------------------------------------------------------------------

declare const request: SuggestionsRequestedEvent;

request.editor satisfies TextEditor;
request.bufferPosition satisfies Point;
request.scopeDescriptor satisfies ScopeDescriptor;
request.prefix satisfies string;
request.activatedManually satisfies boolean;

// ---------------------------------------------------------------------------
// Suggestions
//
// A suggestion carries either `text` or `snippet`; the two variants share
// everything else.
// ---------------------------------------------------------------------------

({ text: "getFoo" }) satisfies TextSuggestion;
({ snippet: "getFoo(${1:arg})" }) satisfies SnippetSuggestion;

({
  text: "getFoo",
  displayText: "getFoo()",
  replacementPrefix: "getF",
  type: "function",
  leftLabel: "string",
  leftLabelHTML: "<em>string</em>",
  rightLabel: "MyClass",
  rightLabelHTML: "<em>MyClass</em>",
  className: "my-suggestion",
  iconHTML: '<i class="icon-move-right"></i>',
  description: "Returns the foo.",
  descriptionMoreURL: "https://example.com/foo",
  descriptionMarkdown: "Returns the **foo**.",
}) satisfies TextSuggestion;

// @ts-expect-error a suggestion needs either `text` or `snippet`
({ displayText: "getFoo()" }) satisfies AnySuggestion;

[{ text: "a" }, { snippet: "b($1)" }] satisfies Suggestions;

// Setting `iconHTML` to `false` suppresses the icon entirely, rather than
// falling back to the one implied by `type`
// (`suggestion-list-element.js:469-470`).
({ text: "getFoo", iconHTML: false }) satisfies TextSuggestion;

// The subsequence provider reports which characters of the suggestion matched
// the prefix, so the list can bold them
// (`subsequence-provider.js:202`, rendered at
// `suggestion-list-element.js:525-537`).
({ text: "getFoo", characterMatchIndices: [0, 3, 4] }) satisfies TextSuggestion;

// ---------------------------------------------------------------------------
// LSP-style insertion (service API 5.0.0 and up)
//
// A suggestion can take over insertion entirely, either with a single
// `TextEdit` or by writing the same text over several ranges. Either way it
// may also request unrelated edits elsewhere in the buffer — the canonical
// case being an auto-inserted import statement
// (`autocomplete-manager.js`, `replaceTextWithMatch`).
// ---------------------------------------------------------------------------

({
  text: "getFoo",
  textEdit: { newText: "getFoo()", range: [[0, 0], [0, 4]] },
}) satisfies TextSuggestion;

({
  text: "getFoo",
  ranges: [[[0, 0], [0, 4]], [[2, 0], [2, 4]]],
}) satisfies TextSuggestion;

({
  text: "getFoo",
  additionalTextEdits: [{ newText: "import { getFoo } from './foo';\n", range: [[0, 0], [0, 0]] }],
}) satisfies TextSuggestion;

// ---------------------------------------------------------------------------
// Providers
//
// The current service version is 5.1.0, and `consumeProvider` defaults to API
// version 3 (`main.js:81`). Under version 3 and up, `registerProvider` THROWS
// if the provider carries `selector` or `disableForSelector`
// (`provider-manager.js:236-253`) — the modern names are `scopeSelector` and
// `disableForScopeSelector`, and `isValidProvider` accepts either
// (`provider-manager.js:150-158`).
// ---------------------------------------------------------------------------

({
  scopeSelector: ".source.js",
  disableForScopeSelector: ".source.js .comment",
  inclusionPriority: 1,
  excludeLowerPriority: true,
  suggestionPriority: 2,
  filterSuggestions: true,
  getSuggestions(params) {
    params satisfies SuggestionsRequestedEvent;
    return [{ text: "getFoo" }];
  },
}) satisfies AutocompleteProvider;

// A provider may restrict itself to particular editor labels; absent this it
// defaults to `['workspace-center']` (`provider-metadata.js:36-39`).
({
  scopeSelector: ".source.js",
  labels: ["workspace-center", "symbols-view"],
  getSuggestions: () => [],
}) satisfies AutocompleteProvider;

// `getSuggestions` may go async.
({
  scopeSelector: ".source.js",
  getSuggestions: async () => [{ text: "getFoo" }],
}) satisfies AutocompleteProvider;

// The optional lifecycle hooks.
({
  scopeSelector: ".source.js",
  getSuggestions: () => [],
  getSuggestionDetailsOnSelect(suggestion) {
    suggestion satisfies AnySuggestion;
    return null;
  },
  onDidInsertSuggestion(params) {
    params satisfies SuggestionInsertedEvent;
    params.editor satisfies TextEditor;
    params.triggerPosition satisfies Point;
    params.suggestion satisfies AnySuggestion;
  },
  dispose() {},
}) satisfies AutocompleteProvider;

// @ts-expect-error a provider must supply a scope selector
({ getSuggestions: () => [] }) satisfies AutocompleteProvider;

// @ts-expect-error a provider must supply `getSuggestions`
({ scopeSelector: ".source.js" }) satisfies AutocompleteProvider;
