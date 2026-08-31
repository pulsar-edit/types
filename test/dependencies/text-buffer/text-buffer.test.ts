// Type-level tests for `dependencies/text-buffer/src/text-buffer.d.ts`.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import { Point, Range, TextBuffer } from "../../../index";
import type {
  BufferChangedEvent,
  BufferChangingEvent,
  BufferScanResult,
  BufferStoppedChangingEvent,
  ContextualBufferScanResult,
  Disposable,
  FileSavedEvent,
  HandleableErrorEvent,
  LanguageMode,
  Marker,
  MarkerLayer,
  TextBufferFileBackend,
  TextChange,
} from "../../../index";

declare const buffer: TextBuffer;
declare const languageMode: LanguageMode;

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

new TextBuffer("hello") satisfies TextBuffer;
new TextBuffer() satisfies TextBuffer;
new TextBuffer({ text: "hello" }) satisfies TextBuffer;
new TextBuffer({ text: "hello", shouldDestroyOnFileDelete: () => true }) satisfies TextBuffer;

TextBuffer.load("/tmp/a.txt") satisfies Promise<TextBuffer>;
TextBuffer.load("/tmp/a.txt", { encoding: "utf8" }) satisfies Promise<TextBuffer>;
TextBuffer.loadSync("/tmp/a.txt", { shouldDestroyOnFileDelete: () => false }) satisfies TextBuffer;
TextBuffer.deserialize({}) satisfies Promise<TextBuffer>;

// @ts-expect-error a buffer is constructed from text or a params object
new TextBuffer(42);

// The identity properties are readonly.
buffer.id satisfies string;
buffer.refcount satisfies number;
buffer.destroyed satisfies boolean;

// @ts-expect-error `id` is readonly
buffer.id = "nope";

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

[
  buffer.onWillChange((event: BufferChangingEvent) => event.oldRange satisfies Range),
  buffer.onDidChange((event: BufferChangedEvent) => {
    event.oldRange satisfies Range;
    event.newRange satisfies Range;
    event.oldText satisfies string;
    event.newText satisfies string;
    // The aggregate list carries only the two ranges per change.
    event.changes[0].oldRange satisfies Range;
    event.changes[0].newRange satisfies Range;
  }),
  buffer.onDidStopChanging((event: BufferStoppedChangingEvent) => {
    const change: TextChange = event.changes[0];
    change.start satisfies Point;
    change.oldExtent satisfies Point;
    change.newText satisfies string;
  }),
  buffer.onDidChangeText((event: BufferStoppedChangingEvent) => event.changes),
  buffer.onDidConflict(() => {}),
  buffer.onDidChangeModified((modified: boolean) => modified),
  buffer.onDidUpdateMarkers(() => {}),
  buffer.onDidCreateMarker((marker: Marker) => marker),
  buffer.onDidChangePath((path: string) => path),
  buffer.onDidChangeEncoding((encoding: string) => encoding),
  buffer.onDidSave((event: FileSavedEvent) => event.path satisfies string),
  buffer.onDidDelete(() => {}),
  buffer.onWillReload(() => {}),
  buffer.onDidReload(() => {}),
  buffer.onDidDestroy(() => {}),
  buffer.onDidChangeLanguageMode((mode: LanguageMode) => mode),
] satisfies Disposable[];

// A will-save handler may be synchronous or asynchronous.
buffer.onWillSave(() => {});
buffer.onWillSave(async () => {});

// A watch error can be marked handled.
buffer.onWillThrowWatchError((event: HandleableErrorEvent) => {
  event.error satisfies Error;
  event.handle();
});

// @ts-expect-error the will-change event has no new range yet
buffer.onWillChange((event: BufferChangingEvent) => event.newRange);

// ---------------------------------------------------------------------------
// Reading text
//
// The per-row accessors return `undefined` for rows that don't exist.
// ---------------------------------------------------------------------------

buffer.getText() satisfies string;
buffer.getTextInRange([[0, 0], [1, 0]]) satisfies string;
buffer.getLines() satisfies string[];
buffer.getLastLine() satisfies string;
buffer.lineForRow(0) satisfies string | undefined;
buffer.lineEndingForRow(0) satisfies string | undefined;
buffer.lineLengthForRow(0) satisfies number;
buffer.isRowBlank(0) satisfies boolean;
buffer.isEmpty() satisfies boolean;
buffer.hasAstral() satisfies boolean;

// @ts-expect-error the row may not exist
buffer.lineForRow(0) satisfies string;

// The non-blank-row searches return `null` when there is no such row.
buffer.previousNonBlankRow(5) satisfies number | null;
buffer.nextNonBlankRow(5) satisfies number | null;

// A buffer need not be backed by a file.
buffer.getPath() satisfies string | undefined;
buffer.getUri() satisfies string;
buffer.getEncoding() satisfies string;

// ---------------------------------------------------------------------------
// Mutating text — every mutation reports the range it affected
// ---------------------------------------------------------------------------

buffer.setText("hello") satisfies Range;
buffer.setTextInRange([[0, 0], [0, 5]], "goodbye") satisfies Range;
buffer.setTextInRange([[0, 0], [0, 5]], "goodbye", { normalizeLineEndings: false }) satisfies Range;
buffer.insert([0, 0], "x") satisfies Range;
buffer.insert([0, 0], "x", { undo: "skip" }) satisfies Range;
buffer.append("x") satisfies Range;
buffer.delete([[0, 0], [1, 0]]) satisfies Range;
buffer.deleteRow(0) satisfies Range;
buffer.deleteRows(0, 2) satisfies Range;
buffer.setTextViaDiff("hello");
buffer.replace(/needle/g, "pin") satisfies number;

// @ts-expect-error 'discard' is not an undo mode
buffer.insert([0, 0], "x", { undo: "discard" });

// ---------------------------------------------------------------------------
// Markers
// ---------------------------------------------------------------------------

buffer.addMarkerLayer() satisfies MarkerLayer;
buffer.addMarkerLayer({ maintainHistory: true, persistent: true, role: "selections" }) satisfies MarkerLayer;
buffer.getDefaultMarkerLayer() satisfies MarkerLayer;
buffer.getMarkerLayer("1") satisfies MarkerLayer | undefined;
buffer.markRange([[0, 0], [1, 0]]) satisfies Marker;
buffer.markRange([[0, 0], [1, 0]], { reversed: true, invalidate: "inside", exclusive: false }) satisfies Marker;
buffer.markPosition([0, 0], { invalidate: "never" }) satisfies Marker;
buffer.getMarkers() satisfies Marker[];
buffer.getMarkerCount() satisfies number;
buffer.findMarkers({ startPosition: [0, 0], startsInRange: [[0, 0], [1, 0]] }) satisfies Marker[];

// @ts-expect-error 'sometimes' is not an invalidation strategy
buffer.markPosition([0, 0], { invalidate: "sometimes" });

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

buffer.undo() satisfies boolean;
buffer.redo({ selectionsMarkerLayer: undefined }) satisfies boolean;
buffer.abortTransaction();
buffer.clearUndoStack();
buffer.groupLastChanges() satisfies boolean;

// `transact` passes its callback's return value through.
buffer.transact(() => "done") satisfies string;
buffer.transact(300, () => 42) satisfies number;
buffer.transact({ groupingInterval: 300 }, () => 42) satisfies number;

buffer.createCheckpoint() satisfies number;
buffer.revertToCheckpoint(buffer.createCheckpoint()) satisfies boolean;
buffer.groupChangesSinceCheckpoint(buffer.createCheckpoint()) satisfies boolean;

buffer.getChangesSinceCheckpoint(buffer.createCheckpoint()) satisfies Array<{
  start: Point;
  oldExtent: Point;
  newExtent: Point;
  newText: string;
}>;

// @ts-expect-error the grouping interval comes first
buffer.transact(() => {}, 300);

// ---------------------------------------------------------------------------
// Scanning
//
// Four scan families, each with a plain and a contextual overload.
// ---------------------------------------------------------------------------

buffer.scan(/needle/g, (result: BufferScanResult) => {
  result.buffer satisfies TextBuffer;
  result.lineText satisfies string;
  result.matchText satisfies string;
  result.match satisfies RegExpExecArray;
  result.range satisfies Range;
  result.stopped satisfies boolean;
  result.replace("pin");
  result.stop();
});

buffer.backwardsScan(/needle/g, () => {});
buffer.scanInRange(/needle/g, [[0, 0], [9, 0]], () => {});
buffer.backwardsScanInRange(/needle/g, [[0, 0], [9, 0]], () => {});

const context = { leadingContextLineCount: 1, trailingContextLineCount: 1 };
buffer.scan(/needle/g, context, (result: ContextualBufferScanResult) => result.leadingContextLines);
buffer.backwardsScan(/needle/g, context, (result: ContextualBufferScanResult) => result.trailingContextLines);
buffer.scanInRange(/needle/g, [[0, 0], [9, 0]], context, (result: ContextualBufferScanResult) => result.leadingContextLines);
buffer.backwardsScanInRange(/needle/g, [[0, 0], [9, 0]], context, (result: ContextualBufferScanResult) => result.leadingContextLines);

buffer.scan(/needle/g, (result) => {
  // @ts-expect-error context lines require the contextual scan options
  result.leadingContextLines;
});

// ---------------------------------------------------------------------------
// Positions and extents
// ---------------------------------------------------------------------------

buffer.getRange() satisfies Range;
buffer.getLineCount() satisfies number;
buffer.getLastRow() satisfies number;
buffer.getFirstPosition() satisfies Point;
buffer.getEndPosition() satisfies Point;
buffer.getLength() satisfies number;
buffer.getMaxCharacterIndex() satisfies number;
buffer.rangeForRow(0) satisfies Range;
buffer.rangeForRow(0, true) satisfies Range;
buffer.characterIndexForPosition([1, 4]) satisfies number;
buffer.positionForCharacterIndex(20) satisfies Point;
buffer.clipRange([[0, 0], [99, 99]]) satisfies Range;
buffer.clipPosition([99, 99]) satisfies Point;

// ---------------------------------------------------------------------------
// Lifecycle and refcounting
// ---------------------------------------------------------------------------

buffer.save() satisfies Promise<void>;
buffer.saveAs("/tmp/b.txt") satisfies Promise<void>;
buffer.reload() satisfies Promise<void>;
buffer.isModified() satisfies boolean;
buffer.isInConflict() satisfies boolean;
buffer.isAlive() satisfies boolean;
buffer.isDestroyed() satisfies boolean;
buffer.isRetained() satisfies boolean;
buffer.hasMultipleEditors() satisfies boolean;
buffer.destroy();

// `retain` and `release` return the buffer, so they chain.
buffer.retain().release() satisfies TextBuffer;

buffer.getLanguageMode() satisfies LanguageMode;
buffer.setLanguageMode(languageMode);
buffer.getStoppedChangingDelay() satisfies number;

// ---------------------------------------------------------------------------
// File backends
//
// A buffer can be backed by something other than a path — the optional
// watching hooks may be omitted.
// ---------------------------------------------------------------------------

declare const readStream: import("fs").ReadStream;
declare const writeStream: import("fs").WriteStream;

const backend = {
  getPath: () => "/tmp/virtual.txt",
  createReadStream: () => readStream,
  createWriteStream: () => writeStream,
  existsSync: () => true,
} satisfies TextBufferFileBackend;

TextBuffer.load(backend) satisfies Promise<TextBuffer>;
buffer.setFile(backend);

({
  getPath: () => "/tmp/virtual.txt",
  createReadStream: () => readStream,
  existsSync: () => true,
  // @ts-expect-error a backend must be able to write
}) satisfies TextBufferFileBackend;

// `loadSync` takes a path only — there is no synchronous backend form.
// @ts-expect-error
TextBuffer.loadSync(backend);
