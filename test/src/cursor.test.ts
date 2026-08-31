// Type-level tests for `src/cursor.d.ts`.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import type {
  Cursor,
  CursorPositionChangedEvent,
  DisplayMarker,
  Disposable,
  Point,
  Range,
  ScopeDescriptor,
  TextEditor,
} from "../../index";

declare const editor: TextEditor;
declare const cursor: Cursor;
declare const otherCursor: Cursor;

// ---------------------------------------------------------------------------
// Obtaining cursors
// ---------------------------------------------------------------------------

editor.getLastCursor() satisfies Cursor;
editor.getCursors() satisfies Cursor[];

// ---------------------------------------------------------------------------
// Lifecycle and events
// ---------------------------------------------------------------------------

cursor.destroy();

cursor.onDidChangePosition((event) => {
  event satisfies CursorPositionChangedEvent;
  event.oldBufferPosition satisfies Point;
  event.oldScreenPosition satisfies Point;
  event.newBufferPosition satisfies Point;
  event.newScreenPosition satisfies Point;
  event.textChanged satisfies boolean;
  event.cursor satisfies Cursor;
}) satisfies Disposable;

cursor.onDidDestroy(() => {}) satisfies Disposable;

// ---------------------------------------------------------------------------
// Managing cursor position
// ---------------------------------------------------------------------------

cursor.setScreenPosition([0, 5]);
cursor.setScreenPosition([0, 5], { autoscroll: false });
cursor.setBufferPosition([0, 5]);
cursor.setBufferPosition({ row: 0, column: 5 }, { autoscroll: true });

cursor.getScreenPosition() satisfies Point;
cursor.getBufferPosition() satisfies Point;
cursor.getScreenRow() satisfies number;
cursor.getScreenColumn() satisfies number;
cursor.getBufferRow() satisfies number;
cursor.getBufferColumn() satisfies number;
cursor.getCurrentBufferLine() satisfies string;
cursor.isAtBeginningOfLine() satisfies boolean;
cursor.isAtEndOfLine() satisfies boolean;

// ---------------------------------------------------------------------------
// Cursor position details
// ---------------------------------------------------------------------------

cursor.getMarker() satisfies DisplayMarker;
cursor.isSurroundedByWhitespace() satisfies boolean;
cursor.isBetweenWordAndNonWord() satisfies boolean;
cursor.isInsideWord() satisfies boolean;
cursor.isInsideWord({ wordRegex: /[a-z]+/ }) satisfies boolean;
cursor.getIndentLevel() satisfies number;
cursor.getScopeDescriptor() satisfies ScopeDescriptor;
cursor.getSyntaxTreeScopeDescriptor() satisfies ScopeDescriptor;
cursor.hasPrecedingCharactersOnLine() satisfies boolean;
cursor.isLastCursor() satisfies boolean;

// ---------------------------------------------------------------------------
// Moving the cursor
//
// The four directional moves take a count and an option bag; the rest take
// nothing at all.
// ---------------------------------------------------------------------------

cursor.moveUp();
cursor.moveUp(2);
cursor.moveUp(2, { moveToEndOfSelection: true });
cursor.moveDown(2, { moveToEndOfSelection: true });
cursor.moveLeft(2, { moveToEndOfSelection: true });
cursor.moveRight(2, { moveToEndOfSelection: true });

[
  cursor.moveToTop(),
  cursor.moveToBottom(),
  cursor.moveToBeginningOfScreenLine(),
  cursor.moveToBeginningOfLine(),
  cursor.moveToFirstCharacterOfLine(),
  cursor.moveToEndOfScreenLine(),
  cursor.moveToEndOfLine(),
  cursor.moveToBeginningOfWord(),
  cursor.moveToEndOfWord(),
  cursor.moveToBeginningOfNextWord(),
  cursor.moveToPreviousWordBoundary(),
  cursor.moveToNextWordBoundary(),
  cursor.moveToPreviousSubwordBoundary(),
  cursor.moveToNextSubwordBoundary(),
  cursor.skipLeadingWhitespace(),
  cursor.moveToBeginningOfNextParagraph(),
  cursor.moveToBeginningOfPreviousParagraph(),
] satisfies void[];

// ---------------------------------------------------------------------------
// Local positions and ranges
//
// `wordRegex` overrides the word pattern outright. `includeNonWordCharacters`
// only tunes the *default* pattern, so it is accepted exactly by the methods
// that forward their options into `wordRegExp(options)` — and is silently
// inert on the two boundary methods, which call `wordRegExp()` with no
// arguments.
// ---------------------------------------------------------------------------

cursor.getPreviousWordBoundaryBufferPosition() satisfies Point;
cursor.getPreviousWordBoundaryBufferPosition({ wordRegex: /[a-z]+/ }) satisfies Point;
cursor.getNextWordBoundaryBufferPosition({ wordRegex: /[a-z]+/ }) satisfies Point;

// @ts-expect-error the boundary methods build their default regex without options
cursor.getNextWordBoundaryBufferPosition({ includeNonWordCharacters: false });

cursor.getBeginningOfCurrentWordBufferPosition({
  wordRegex: /[a-z]+/,
  includeNonWordCharacters: false,
  allowPrevious: false,
}) satisfies Point;

// `allowNext` is the mirror of `allowPrevious`: when false the scan stays on
// the current line instead of running to the end of the buffer.
cursor.getEndOfCurrentWordBufferPosition({
  wordRegex: /[a-z]+/,
  includeNonWordCharacters: false,
  allowNext: false,
}) satisfies Point;

cursor.getBeginningOfNextWordBufferPosition({ wordRegex: /[a-z]+/ }) satisfies Point;

// `getCurrentWordBufferRange` forwards its whole bag to `wordRegExp(options)`.
cursor.getCurrentWordBufferRange() satisfies Range;
cursor.getCurrentWordBufferRange({
  wordRegex: /[a-z]+/,
  includeNonWordCharacters: false,
}) satisfies Range;

cursor.getCurrentLineBufferRange() satisfies Range;
cursor.getCurrentLineBufferRange({ includeNewline: true }) satisfies Range;
cursor.getCurrentParagraphBufferRange() satisfies Range;
cursor.getCurrentWordPrefix() satisfies string;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

// `clearSelection` forwards to `Selection#clear`, so it takes that bag.
cursor.clearSelection();
cursor.clearSelection({ autoscroll: false });

cursor.wordRegExp() satisfies RegExp;
cursor.wordRegExp({ includeNonWordCharacters: false }) satisfies RegExp;
cursor.subwordRegExp() satisfies RegExp;
cursor.subwordRegExp({ backwards: true }) satisfies RegExp;

cursor.compare(otherCursor) satisfies number;

// @ts-expect-error cursors compare against cursors, not points
cursor.compare(cursor.getBufferPosition());

// ---------------------------------------------------------------------------
// Removed API
//
// `cursor.js` still carries a `Section: Visibility` comment, but the section
// is empty — `setVisible`, `isVisible` and `onDidChangeVisibility` are gone,
// and nothing in Pulsar calls them on a cursor. `clearAutoscroll` is likewise
// absent; only `Selection` has one.
// ---------------------------------------------------------------------------

// @ts-expect-error `Cursor` has no visibility API
cursor.setVisible(true);

// @ts-expect-error `Cursor` has no visibility API
cursor.isVisible();

// @ts-expect-error `Cursor` has no visibility API
cursor.onDidChangeVisibility(() => {});

// @ts-expect-error `clearAutoscroll` exists on `Selection`, not `Cursor`
cursor.clearAutoscroll();
