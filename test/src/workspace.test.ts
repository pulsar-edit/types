// Type-level tests for `src/workspace.d.ts`.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import type {
  CancellablePromise,
  Disposable,
  Dock,
  Pane,
  PaneItem,
  PaneItemObservedEvent,
  PaneItemOpenedEvent,
  Panel,
  ScandalResult,
  TextEditor,
  TextEditorObservedEvent,
  Workspace,
  WorkspaceCenter,
} from "../../index";

declare const workspace: Workspace;
declare const pane: Pane;

// ---------------------------------------------------------------------------
// Event subscriptions
// ---------------------------------------------------------------------------

[
  workspace.observeTextEditors((editor: TextEditor) => editor.getPath()),
  workspace.observePaneItems((item: PaneItem) => item),
  workspace.onDidChangeActivePaneItem((item: PaneItem) => item),
  workspace.onDidStopChangingActivePaneItem((item: PaneItem) => item),
  workspace.observeActivePaneItem((item: PaneItem) => item),
  workspace.onDidAddTextEditor((event: TextEditorObservedEvent) => [
    event.textEditor,
    event.pane,
    event.index,
  ]),
  workspace.onDidOpen((event: PaneItemOpenedEvent) => [event.uri, event.item, event.pane]),
  workspace.onDidAddPane((event) => event.pane),
  workspace.onWillDestroyPane((event) => event.pane),
  workspace.onDidDestroyPane((event) => event.pane),
  workspace.observePanes((p: Pane) => p),
  workspace.onDidChangeActivePane((p: Pane) => p),
  workspace.observeActivePane((p: Pane) => p),
  workspace.onDidAddPaneItem((event: PaneItemObservedEvent) => event.index),
  workspace.onDidDestroyPaneItem((event: PaneItemObservedEvent) => event.item),
] satisfies Disposable[];

// The active editor callback fires with `undefined` when the last editor goes
// away, so the parameter must be optional.
workspace.onDidChangeActiveTextEditor((editor?: TextEditor) => editor?.getPath());
workspace.observeActiveTextEditor((editor?: TextEditor) => editor?.getPath());

// A will-destroy handler may defer destruction by returning a promise.
workspace.onWillDestroyPaneItem(() => {});
workspace.onWillDestroyPaneItem(async () => {});

// @ts-expect-error the pane-added event carries a `pane`, not an `item`
workspace.onDidAddPane((event) => event.item);

// ---------------------------------------------------------------------------
// Opening
// ---------------------------------------------------------------------------

// With no argument, an empty editor.
workspace.open() satisfies Promise<TextEditor>;

// With a URI.
workspace.open("file.txt") satisfies Promise<PaneItem>;
workspace.open("file.txt", {
  initialLine: 3,
  initialColumn: 12,
  pane,
  split: "right",
  activatePane: false,
  activateItem: true,
  pending: true,
  searchAllPanes: true,
  location: "bottom",
}) satisfies Promise<PaneItem>;

// With an item: the item's own type flows through to the promise.
workspace.open({ getTitle: () => "My Item" }) satisfies Promise<{ getTitle: () => string }>;

// @ts-expect-error 'top' is not a split direction
workspace.open("file.txt", { split: "top" });

// @ts-expect-error 'up' is not a pane item location
workspace.open("file.txt", { location: "up" });

// @ts-expect-error an item must at least be a view model
workspace.open({ notATitle: () => "x" });

workspace.hide("file.txt") satisfies boolean;
workspace.toggle("file.txt") satisfies Promise<void>;
workspace.createItemForURI("file.txt") satisfies Promise<PaneItem | TextEditor>;
workspace.reopenItem() satisfies Promise<PaneItem | undefined>;

// ---------------------------------------------------------------------------
// Openers
//
// Per the documentation on `addOpener`, an opener returns "an object that
// inherits from HTMLElement or a model which has an associated view" — i.e. a
// pane item — and returns `undefined` to decline the URI.
// ---------------------------------------------------------------------------

workspace.addOpener((uri: string) =>
  uri.startsWith("quux-preview://")
    ? { getTitle: () => "Preview", getElement: () => document.createElement("div") }
    : undefined
) satisfies Disposable;

workspace.addOpener(() => document.createElement("div"));

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

declare const unknownItem: PaneItem;

if (workspace.isTextEditor(unknownItem)) {
  unknownItem.getText() satisfies string;
}

// ---------------------------------------------------------------------------
// Pane items and panes
// ---------------------------------------------------------------------------

workspace.getPaneItems() satisfies PaneItem[];

// An empty workspace has no active item.
workspace.getActivePaneItem() satisfies PaneItem | undefined;
workspace.getTextEditors() satisfies TextEditor[];
workspace.getActiveTextEditor() satisfies TextEditor | undefined;

workspace.getPanes() satisfies Pane[];
workspace.getActivePane() satisfies Pane;
workspace.activateNextPane() satisfies boolean;
workspace.activatePreviousPane() satisfies boolean;
workspace.paneForURI("file.txt") satisfies Pane | undefined;
workspace.paneForItem(unknownItem) satisfies Pane | undefined;
workspace.isDestroyed() satisfies boolean;

// ---------------------------------------------------------------------------
// Pane containers and locations
// ---------------------------------------------------------------------------

workspace.getActivePaneContainer() satisfies Dock | WorkspaceCenter;
workspace.paneContainerForURI("file.txt") satisfies Dock | WorkspaceCenter | undefined;
workspace.paneContainerForItem(unknownItem) satisfies Dock | WorkspaceCenter | undefined;
workspace.getCenter() satisfies WorkspaceCenter;
workspace.getLeftDock() satisfies Dock;
workspace.getRightDock() satisfies Dock;
workspace.getBottomDock() satisfies Dock;

// The center comes first, then the three docks.
workspace.getPaneContainers() satisfies [WorkspaceCenter, Dock, Dock, Dock];
workspace.getPaneContainers()[0] satisfies WorkspaceCenter;

// @ts-expect-error there are exactly four pane containers
workspace.getPaneContainers()[4];

// ---------------------------------------------------------------------------
// Panels
//
// The panel's item type flows through to `Panel<T>`.
// ---------------------------------------------------------------------------

workspace.addBottomPanel({ item: document.createElement("div") }) satisfies Panel<HTMLDivElement>;
workspace.addLeftPanel({ item: { count: 1 }, visible: false }) satisfies Panel<{ count: number }>;
workspace.addRightPanel({ item: {}, priority: 100 }) satisfies Panel<{}>;
workspace.addTopPanel({ item: {} }) satisfies Panel<{}>;
workspace.addHeaderPanel({ item: {} }) satisfies Panel<{}>;
workspace.addFooterPanel({ item: {} }) satisfies Panel<{}>;

// Only modal panels take `autoFocus`, which accepts anything `focus-trap` can
// resolve to a node.
workspace.addModalPanel({ item: {}, autoFocus: true }) satisfies Panel<{}>;
workspace.addModalPanel({ item: {}, autoFocus: "input.my-field" });
workspace.addModalPanel({ item: {}, autoFocus: () => document.createElement("input") });
workspace.addModalPanel({ item: {}, autoFocus: document.createElement("input") });

// @ts-expect-error `autoFocus` is only supported on modal panels
workspace.addBottomPanel({ item: {}, autoFocus: true });

// @ts-expect-error a panel needs an item
workspace.addBottomPanel({ visible: true });

[
  workspace.getBottomPanels(),
  workspace.getLeftPanels(),
  workspace.getRightPanels(),
  workspace.getTopPanels(),
  workspace.getHeaderPanels(),
  workspace.getFooterPanels(),
  workspace.getModalPanels(),
] satisfies Panel[][];

workspace.panelForItem({ count: 1 }) satisfies Panel<{ count: number }> | null;

// ---------------------------------------------------------------------------
// Searching and replacing
// ---------------------------------------------------------------------------

workspace.scan(/needle/g, (result: ScandalResult) => {
  result.filePath satisfies string;
  result.matches[0].matchText satisfies string;
  result.matches[0].range satisfies [[number, number], [number, number]];
  result.matches[0].leadingContextLines satisfies string[];
}) satisfies CancellablePromise<string | null>;

workspace.scan(
  /needle/g,
  {
    paths: ["src/**/*.js"],
    onPathsSearched: (count: number) => count,
    leadingContextLineCount: 2,
    trailingContextLineCount: 2,
  },
  () => {}
) satisfies CancellablePromise<string | null>;

// A scan can be cancelled — that's the point of the return type.
workspace.scan(/needle/g, () => {}).cancel();

// @ts-expect-error unknown scan option
workspace.scan(/needle/g, { globs: ["src/**"] }, () => {});

workspace.replace(/needle/g, "pin", ["a.txt", "b.txt"], (result) => [
  result.filePath satisfies string | undefined,
  result.replacements satisfies number,
]) satisfies Promise<void>;
