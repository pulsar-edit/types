// Type-level tests for `src/text-editor.d.ts`.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import type {
  BufferScanResult,
  CommentDelimiterSpec,
  ContextualBufferScanResult,
  Cursor,
  Decoration,
  DisplayMarker,
  DisplayMarkerLayer,
  Disposable,
  EditorChangedEvent,
  Grammar,
  Gutter,
  LayerDecoration,
  Range,
  ScopeDescriptor,
  Selection,
  TextBuffer,
  TextEditor,
  TextEditorElement,
} from "../../index";
import { Point } from "../../index";

declare const editor: TextEditor;
declare const marker: DisplayMarker;
declare const markerLayer: DisplayMarkerLayer;
declare const grammar: Grammar;

// ---------------------------------------------------------------------------
// Identity and lifecycle
// ---------------------------------------------------------------------------

editor.id satisfies number;
editor.getElement() satisfies TextEditorElement;
editor.getBuffer() satisfies TextBuffer;
editor.getTitle() satisfies string;
editor.getLongTitle() satisfies string;
editor.isModified() satisfies boolean;
editor.isEmpty() satisfies boolean;
editor.isAlive() satisfies boolean;
editor.isDestroyed() satisfies boolean;
editor.save() satisfies Promise<void>;
editor.saveAs("/tmp/out.txt") satisfies Promise<void>;
editor.destroy();

// An editor need not be backed by a file.
editor.getPath() satisfies string | undefined;

// @ts-expect-error the path may be undefined
editor.getPath() satisfies string;

// @ts-expect-error `id` is readonly
editor.id = 3;

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

[
  editor.onDidChangeTitle((title: string) => title),
  editor.onDidChangePath((path: string) => path),
  editor.onDidChange((events: EditorChangedEvent[]) => events[0].start satisfies Point),
  editor.onDidStopChanging((event) => event.changes),
  editor.onDidChangeCursorPosition((event) => [event.oldBufferPosition, event.newBufferPosition]),
  editor.onDidChangeSelectionRange((event) => event.selection),
  editor.onDidSave((event) => event.path satisfies string),
  editor.onDidDestroy(() => {}),
  editor.observeCursors((cursor: Cursor) => cursor),
  editor.observeSelections((selection: Selection) => selection),
  editor.observeDecorations((decoration: Decoration) => decoration),
  editor.observeGutters((gutter: Gutter) => gutter),
  editor.onDidChangeSoftWrapped((softWrapped: boolean) => softWrapped),
  editor.onDidChangeGrammar((g: Grammar) => g),
  editor.onDidChangeModified((modified: boolean) => modified),
  editor.onDidConflict(() => {}),
  editor.onDidInsertText((event) => event.text satisfies string),
] satisfies Disposable[];

// A will-insert handler can cancel the insertion.
editor.onWillInsertText((event) => {
  event.text satisfies string;
  event.cancel();
});

// ---------------------------------------------------------------------------
// Point- and range-compatible arguments
//
// `PointCompatible` is `{ row, column }` or `[row, column]`; `RangeCompatible`
// additionally accepts any mix of those two in a start/end pair.
// ---------------------------------------------------------------------------

editor.setCursorBufferPosition([3, 12]);
editor.setCursorBufferPosition({ row: 3, column: 12 });
editor.setCursorBufferPosition(new Point(3, 12));
editor.setCursorBufferPosition([3, 12], { autoscroll: false });

editor.setSelectedBufferRange([[0, 0], [2, 8]]);
// The object form of a range takes anything point-compatible at either end.
editor.setSelectedBufferRange({ start: { row: 0, column: 0 }, end: new Point(2, 8) });
editor.setSelectedBufferRange({ start: [0, 0], end: [2, 8] });
editor.setSelectedBufferRange({ start: [0, 0], end: new Point(2, 8) });
editor.setSelectedBufferRange([new Point(0, 0), { row: 2, column: 8 }]);
editor.setSelectedBufferRange([[0, 0], [2, 8]], { reversed: true, preserveFolds: true });
editor.setSelectedBufferRanges([[[0, 0], [0, 4]], [[1, 0], [1, 4]]]);

// @ts-expect-error a point is a pair, not a triple
editor.setCursorBufferPosition([3, 12, 5]);

// @ts-expect-error a point is not a string
editor.setCursorBufferPosition("3,12");

// @ts-expect-error a range needs both ends
editor.setSelectedBufferRange([0, 0]);

// ---------------------------------------------------------------------------
// Reading and editing text
// ---------------------------------------------------------------------------

editor.getText() satisfies string;
editor.getTextInBufferRange([[0, 0], [1, 0]]) satisfies string;
editor.lineTextForBufferRow(0) satisfies string;
editor.getLineCount() satisfies number;
editor.getScreenLineCount() satisfies number;
editor.getCurrentParagraphBufferRange() satisfies Range;
editor.setText("hello");
editor.setTextInBufferRange([[0, 0], [0, 5]], "goodbye") satisfies Range;

// `insertText` returns `false` when the insertion is refused.
editor.insertText("x") satisfies Range | false;

// @ts-expect-error the insertion may be refused
editor.insertText("x") satisfies Range;

// Edit options combine text-insertion and read-only bypass options.
editor.insertText("x", {
  select: true,
  autoIndent: true,
  autoIndentNewline: false,
  autoDecreaseIndent: false,
  normalizeLineEndings: true,
  undo: "skip",
  bypassReadOnly: true,
});

// @ts-expect-error 'discard' is not an undo mode
editor.insertText("x", { undo: "discard" });

// @ts-expect-error unknown edit option
editor.insertText("x", { selct: true });

editor.setReadOnly(true);
editor.isReadOnly() satisfies boolean;
editor.delete({ bypassReadOnly: true });
editor.backspace();
editor.undo();
editor.redo();
editor.mutateSelectedText((selection: Selection, index: number) => [selection, index]);

// ---------------------------------------------------------------------------
// Transactions and checkpoints
// ---------------------------------------------------------------------------

editor.transact(() => {});
editor.transact(300, () => {});
editor.abortTransaction();
editor.createCheckpoint() satisfies number;
editor.revertToCheckpoint(editor.createCheckpoint()) satisfies boolean;
editor.groupChangesSinceCheckpoint(editor.createCheckpoint()) satisfies boolean;

// @ts-expect-error the grouping interval comes first
editor.transact(() => {}, 300);

// ---------------------------------------------------------------------------
// Coordinate conversion
// ---------------------------------------------------------------------------

editor.screenPositionForBufferPosition([1, 1]) satisfies Point;
editor.bufferPositionForScreenPosition([1, 1], { clipDirection: "closest" }) satisfies Point;
editor.screenRangeForBufferRange([[0, 0], [1, 0]]) satisfies Range;
editor.bufferRangeForScreenRange([[0, 0], [1, 0]]) satisfies Range;
editor.clipBufferPosition([99, 99]) satisfies Point;
editor.clipScreenRange([[0, 0], [99, 99]], { clipDirection: "forward" }) satisfies Range;

// @ts-expect-error 'nearest' is not a clip direction
editor.clipScreenPosition([0, 0], { clipDirection: "nearest" });

// ---------------------------------------------------------------------------
// Markers and decorations
// ---------------------------------------------------------------------------

editor.markBufferRange([[0, 0], [1, 0]]) satisfies DisplayMarker;
editor.markBufferRange([[0, 0], [1, 0]], { invalidate: "touch", reversed: true }) satisfies DisplayMarker;
editor.markScreenPosition([0, 0], { invalidate: "never", clipDirection: "backward" }) satisfies DisplayMarker;
editor.addMarkerLayer({ maintainHistory: true, persistent: false }) satisfies DisplayMarkerLayer;
editor.getDefaultMarkerLayer() satisfies DisplayMarkerLayer;
// @ts-expect-error Marker layers IDs get coerced to strings.
editor.getMarkerLayer(1) satisfies DisplayMarkerLayer | undefined;
editor.getMarkerLayer("1") satisfies DisplayMarkerLayer | undefined;
editor.getMarkers() satisfies DisplayMarker[];
editor.getMarkerCount() satisfies number;

// Marker ids, unlike layer ids, are numbers — and the lookup can miss.
editor.getMarker(1) satisfies DisplayMarker | undefined;

// @ts-expect-error the marker may not exist
editor.getMarker(1) satisfies DisplayMarker;

// @ts-expect-error marker ids are numbers
editor.getMarker("1");
editor.findMarkers({ startBufferRow: 0 }) satisfies DisplayMarker[];

// @ts-expect-error 'sometimes' is not an invalidation strategy
editor.markBufferRange([[0, 0], [1, 0]], { invalidate: "sometimes" });

editor.decorateMarker(marker, { type: "highlight", class: "my-highlight" }) satisfies Decoration;
editor.decorateMarker(marker, { type: "gutter", gutterName: "my-gutter" });
editor.decorateMarker(marker, { type: "overlay", item: document.createElement("div") });
editor.decorateMarkerLayer(markerLayer, { type: "line-number", class: "x" }) satisfies LayerDecoration;

// @ts-expect-error 'sparkle' is not a decoration type
editor.decorateMarker(marker, { type: "sparkle" });

// Layer decorations support fewer types than single-marker decorations.
// @ts-expect-error a marker layer cannot be decorated as an overlay
editor.decorateMarkerLayer(markerLayer, { type: "overlay" });

editor.getDecorations({ type: "highlight" }) satisfies Decoration[];
editor.getLineDecorations() satisfies Decoration[];
editor.getOverlayDecorations() satisfies Decoration[];

// ---------------------------------------------------------------------------
// Cursors and selections
// ---------------------------------------------------------------------------

editor.getCursorBufferPosition() satisfies Point;
editor.getCursorBufferPositions() satisfies Point[];
editor.getLastCursor() satisfies Cursor;
editor.getCursors() satisfies Cursor[];
editor.getCursorsOrderedByBufferPosition() satisfies Cursor[];
editor.addCursorAtBufferPosition([1, 0]) satisfies Cursor;
editor.hasMultipleCursors() satisfies boolean;
editor.getWordUnderCursor({ wordRegex: /\w+/, includeNonWordCharacters: false }) satisfies string;

// There may be no cursor at a given screen position.
editor.getCursorAtScreenPosition([0, 0]) satisfies Cursor | undefined;

editor.getSelectedText() satisfies string;
editor.getSelectedBufferRange() satisfies Range;
editor.getSelectedBufferRanges() satisfies Range[];
editor.getLastSelection() satisfies Selection;
editor.getSelections() satisfies Selection[];
editor.addSelectionForBufferRange([[0, 0], [0, 4]]) satisfies Selection;
// `selectionIntersectsBufferRange` takes a duck-typed `RangeLike`, whose ends
// are read rather than coerced — so unlike the `RangeCompatible` parameters
// above, point tuples are not accepted here.
editor.selectionIntersectsBufferRange({
  start: { row: 0, column: 0 },
  end: new Point(1, 0),
}) satisfies boolean;

// @ts-expect-error a RangeLike's ends must be PointLike, not point tuples
editor.selectionIntersectsBufferRange({ start: [0, 0], end: [1, 0] });
editor.selectMarker(marker) satisfies Range | undefined;
editor.moveUp();
editor.moveDown(3);
editor.selectToBufferPosition([2, 0]);

// ---------------------------------------------------------------------------
// Scanning
//
// The contextual result type is only available when context options are given.
// ---------------------------------------------------------------------------

editor.scan(/needle/g, (result: BufferScanResult) => {
  result.matchText satisfies string;
  result.range satisfies Range;
  result.match satisfies RegExpExecArray;
  result.replace("pin");
  result.stop();
});

editor.scan(/needle/g, { leadingContextLineCount: 2, trailingContextLineCount: 2 }, (result: ContextualBufferScanResult) => {
  result.leadingContextLines satisfies string[];
  result.trailingContextLines satisfies string[];
});

editor.scan(/needle/g, (result) => {
  // @ts-expect-error context lines require the contextual scan options
  result.leadingContextLines;
});

editor.scanInBufferRange(/needle/g, [[0, 0], [10, 0]], () => {});
editor.backwardsScanInBufferRange(/needle/g, [[0, 0], [10, 0]], () => {});

// ---------------------------------------------------------------------------
// Tabs, soft wrap, indentation
// ---------------------------------------------------------------------------

editor.getSoftTabs() satisfies boolean;
editor.setSoftTabs(true);
editor.toggleSoftTabs() satisfies boolean;
editor.getTabLength() satisfies number;
editor.getTabText() satisfies string;
editor.isSoftWrapped() satisfies boolean;
editor.setSoftWrapped(true) satisfies boolean;
editor.getSoftWrapColumn() satisfies number;
editor.indentationForBufferRow(0) satisfies number;
editor.setIndentationForBufferRow(0, 2, { preserveLeadingWhitespace: true });
editor.indentSelectedRows({ bypassReadOnly: true });
editor.autoIndentSelectedRows();

// An editor whose contents give no clue returns `undefined`.
editor.usesSoftTabs() satisfies boolean | undefined;

// ---------------------------------------------------------------------------
// Grammars, scopes, and comments
// ---------------------------------------------------------------------------

editor.getGrammar() satisfies Grammar;
editor.setGrammar(grammar);
editor.getRootScopeDescriptor() satisfies ScopeDescriptor;
editor.scopeDescriptorForBufferPosition([0, 0]) satisfies ScopeDescriptor;
editor.syntaxTreeScopeDescriptorForBufferPosition([0, 0]) satisfies ScopeDescriptor;
editor.bufferRangeForScopeAtCursor(".string.quoted") satisfies Range;
editor.isBufferRowCommented(0) satisfies boolean;
editor.tokenForBufferPosition([0, 0]) satisfies { value: string; scopes: string[] };
editor.getNonWordCharacters([0, 0]) satisfies string;
editor.getCommentDelimitersForBufferPosition([0, 0]) satisfies CommentDelimiterSpec;

// Both kinds of delimiter are optional: a language may support only one.
editor.getCommentDelimitersForBufferPosition([0, 0]).line satisfies string | undefined;

// ---------------------------------------------------------------------------
// Folds and gutters
// ---------------------------------------------------------------------------

editor.foldBufferRow(0);
editor.unfoldBufferRow(0);
editor.foldAllAtIndentLevel(2);
editor.isFoldableAtBufferRow(0) satisfies boolean;
editor.isFoldedAtCursorRow() satisfies boolean;
editor.toggleFoldAtBufferRow(0);

editor.addGutter({ name: "my-gutter", priority: 10, visible: false }) satisfies Gutter;
editor.getGutters() satisfies Gutter[];

// The named gutter may not exist.
editor.gutterWithName("my-gutter") satisfies Gutter | null;

// @ts-expect-error a gutter needs a name
editor.addGutter({ priority: 10 });

// ---------------------------------------------------------------------------
// Scrolling and presentation
// ---------------------------------------------------------------------------

editor.scrollToCursorPosition({ center: true });
editor.scrollToBufferPosition([10, 0], { center: false });
editor.getLineHeightInPixels() satisfies number;
editor.setPlaceholderText("Search…");
editor.getPlaceholderText() satisfies string;
