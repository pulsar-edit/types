// Type-level tests for `src/selection.d.ts`.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import type {
  Disposable,
  Point,
  Range,
  Selection,
  SelectionChangedEvent,
  TextEditor,
} from "../../index";

declare const editor: TextEditor;
declare const selection: Selection;
declare const otherSelection: Selection;

// ---------------------------------------------------------------------------
// Obtaining selections
// ---------------------------------------------------------------------------

editor.getLastSelection() satisfies Selection;
editor.getSelections() satisfies Selection[];
editor.getSelectionsOrderedByBufferPosition() satisfies Selection[];

// ---------------------------------------------------------------------------
// Lifecycle
//
// A selection is destroyed by destroying its marker; `isLastSelection` is what
// every `autoscroll` default in this class keys off of.
// ---------------------------------------------------------------------------

selection.destroy();
selection.isLastSelection() satisfies boolean;

// ---------------------------------------------------------------------------
// Event subscription
// ---------------------------------------------------------------------------

selection.onDidChangeRange((event) => {
  event satisfies SelectionChangedEvent;
  event.oldBufferRange satisfies Range;
  event.oldScreenRange satisfies Range;
  event.newBufferRange satisfies Range;
  event.newScreenRange satisfies Range;
  event.selection satisfies Selection;
}) satisfies Disposable;

selection.onDidDestroy(() => {}) satisfies Disposable;

// ---------------------------------------------------------------------------
// Managing the selection range
//
// `setScreenRange` converts its range and then forwards both it and the
// untouched option bag to `setBufferRange`, so the two take the same options.
// ---------------------------------------------------------------------------

selection.getScreenRange() satisfies Range;
selection.getBufferRange() satisfies Range;

selection.setBufferRange([[0, 0], [0, 10]]);
selection.setBufferRange(selection.getScreenRange(), {
  reversed: true,
  preserveFolds: true,
  autoscroll: false,
});

selection.setScreenRange([[0, 0], [0, 10]], {
  reversed: true,
  preserveFolds: true,
  autoscroll: false,
});

// The row range collapses a trailing zero-column end back onto the previous
// row, so both entries are always real rows.
selection.getBufferRowRange() satisfies [number, number];

// ---------------------------------------------------------------------------
// The selection's endpoints
//
// Head and tail come straight off the underlying marker: the head is the
// moving end, the tail the anchored one.
// ---------------------------------------------------------------------------

selection.getHeadBufferPosition() satisfies Point;
selection.getHeadScreenPosition() satisfies Point;
selection.getTailBufferPosition() satisfies Point;
selection.getTailScreenPosition() satisfies Point;

// ---------------------------------------------------------------------------
// Info about the selection
// ---------------------------------------------------------------------------

selection.isEmpty() satisfies boolean;
selection.isReversed() satisfies boolean;
selection.isSingleScreenLine() satisfies boolean;
selection.getText() satisfies string;

// `intersectsBufferRange` bottoms out in `Range#intersectsWith`, which is one
// of the few methods that does not coerce its argument — so a duck-typed
// range is fine but a two-point array is not.
selection.intersectsBufferRange(selection.getBufferRange()) satisfies boolean;
selection.intersectsBufferRange({ start: { row: 0, column: 0 }, end: { row: 1, column: 0 } });

// @ts-expect-error `intersectsBufferRange` does not coerce its argument
selection.intersectsBufferRange([[0, 0], [1, 0]]);

selection.intersectsScreenRow(3) satisfies boolean;
selection.intersectsScreenRowRange(0, 10) satisfies boolean;

// The second argument makes the comparison exclusive — two selections that
// merely abut no longer count as intersecting.
selection.intersectsWith(otherSelection) satisfies boolean;
selection.intersectsWith(otherSelection, true) satisfies boolean;

// ---------------------------------------------------------------------------
// Modifying the selected range
// ---------------------------------------------------------------------------

selection.clear();
selection.clear({ autoscroll: false });

// `selectToScreenPosition` forwards its options to `Cursor#setScreenPosition`
// and, when the selection is word- or line-wise, on to `expandOverWord` /
// `expandOverLine`.
selection.selectToScreenPosition([0, 5]);
selection.selectToScreenPosition([0, 5], { autoscroll: false });
selection.selectToBufferPosition([0, 5]);

selection.selectRight();
selection.selectRight(3);
selection.selectLeft(3);
selection.selectUp(2);
selection.selectDown(2);

[
  selection.selectToTop(),
  selection.selectToBottom(),
  selection.selectAll(),
  selection.selectToBeginningOfLine(),
  selection.selectToFirstCharacterOfLine(),
  selection.selectToEndOfLine(),
  selection.selectToEndOfBufferLine(),
  selection.selectToBeginningOfWord(),
  selection.selectToEndOfWord(),
  selection.selectToBeginningOfNextWord(),
  selection.selectToPreviousWordBoundary(),
  selection.selectToNextWordBoundary(),
  selection.selectToPreviousSubwordBoundary(),
  selection.selectToNextSubwordBoundary(),
  selection.selectToBeginningOfNextParagraph(),
  selection.selectToBeginningOfPreviousParagraph(),
] satisfies void[];

// `selectWord` and `selectSubword` hand their options to
// `Cursor#getCurrentWordBufferRange` and then to `setBufferRange`, so the bag
// spans both.
selection.selectWord();
selection.selectWord({ wordRegex: /[a-z]+/, autoscroll: false });
selection.selectSubword();
selection.selectSubword({ autoscroll: false });

selection.expandOverWord();
selection.expandOverWord({ autoscroll: false });
selection.expandOverLine();
selection.expandOverLine({ autoscroll: false });

// The row defaults to the row the selection already sits on.
selection.selectLine();
selection.selectLine(4);
selection.selectLine(4, { autoscroll: false });

// ---------------------------------------------------------------------------
// Modifying the selected text
//
// Every mutating method takes `bypassReadOnly`, which is the only way to edit
// a read-only editor without `ensureWritable` throwing.
// ---------------------------------------------------------------------------

selection.insertText("hello");
selection.insertText("hello", {
  select: true,
  autoIndent: true,
  autoIndentNewline: false,
  autoDecreaseIndent: false,
  preserveTrailingLineIndentation: true,
  normalizeLineEndings: false,
  bypassReadOnly: true,
});

[
  selection.backspace({ bypassReadOnly: true }),
  selection.delete(),
  selection.deleteToPreviousWordBoundary(),
  selection.deleteToNextWordBoundary(),
  selection.deleteToBeginningOfWord(),
  selection.deleteToBeginningOfLine(),
  selection.deleteToEndOfLine(),
  selection.deleteToEndOfWord(),
  selection.deleteToBeginningOfSubword(),
  selection.deleteToEndOfSubword(),
  selection.deleteSelectedText(),
  selection.deleteLine(),
  selection.joinLines(),
  selection.outdentSelectedRows(),
  selection.autoIndentSelectedRows(),
  selection.indentSelectedRows(),
  selection.toggleLineComments(),
] satisfies void[];

selection.fold();

// @ts-expect-error `bypassReadOnly` is the only recognised edit option here
selection.delete({ autoscroll: false });

// ---------------------------------------------------------------------------
// Clipboard
//
// `cutToEndOfLine` and `cutToEndOfBufferLine` take an options bag, but they
// unwrap it and pass `options.bypassReadOnly` to `cut` as a bare boolean —
// so `cut`'s own third parameter is a boolean, not an options bag.
// ---------------------------------------------------------------------------

selection.cutToEndOfLine(true);
selection.cutToEndOfLine(true, { bypassReadOnly: true });
selection.cutToEndOfBufferLine(true, { bypassReadOnly: true });

selection.cut();
selection.cut(true, true);
selection.cut(true, true, true);

// @ts-expect-error `cut`'s third argument is a bare boolean, not an options bag
selection.cut(true, true, { bypassReadOnly: true });

selection.copy();
selection.copy(true, true);

// ---------------------------------------------------------------------------
// Managing multiple selections
// ---------------------------------------------------------------------------

selection.addSelectionBelow();
selection.addSelectionAbove();

// `merge` forwards its options to `setBufferRange`, so it accepts that bag in
// full — `reversed` included.
selection.merge(otherSelection);
selection.merge(otherSelection, { reversed: true, preserveFolds: true, autoscroll: false });

// ---------------------------------------------------------------------------
// Comparing to other selections
// ---------------------------------------------------------------------------

selection.compare(otherSelection) satisfies number;

// @ts-expect-error selections compare against selections, not ranges
selection.compare(selection.getBufferRange());
