// Type-level tests for `src/pane.d.ts` — the `Pane` API and the
// `AbstractPaneItem` contract that package authors implement.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import type {
  AbstractPaneItem,
  Disposable,
  Pane,
  PaneItem,
  PaneItemMovedEvent,
  PaneListItemShiftedEvent,
  TextEditor,
} from "../../index";

declare const disposable: Disposable;
declare const editor: TextEditor;

// ---------------------------------------------------------------------------
// AbstractPaneItem: the minimum contract
//
// Only `getTitle` and `getElement` are required. A package author who
// implements nothing else must still satisfy the interface — if this stops
// compiling, some method has lost its `?`.
// ---------------------------------------------------------------------------

const minimalItem: AbstractPaneItem = {
  getTitle: () => "Untitled",
  getElement: () => document.createElement("div"),
};

// @ts-expect-error getElement is required
({ getTitle: () => "Untitled" }) satisfies AbstractPaneItem;

// @ts-expect-error getTitle is required
({ getElement: () => document.createElement("div") }) satisfies AbstractPaneItem;

({
  // @ts-expect-error getTitle must return a string
  getTitle: () => 42,
  getElement: () => document.createElement("div"),
}) satisfies AbstractPaneItem;

// `save()` and `saveAs(filePath)` are distinct members of the contract: a pane
// item that implements `getURI` gets `save()`, and every item gets `saveAs`.
({
  getTitle: () => "x",
  getElement: () => document.createElement("div"),
  getURI: () => "pulsar://x",
  save: () => Promise.resolve(),
  saveAs: (_filePath: string) => Promise.resolve(),
}) satisfies AbstractPaneItem;

// ---------------------------------------------------------------------------
// AbstractPaneItem: a fully-featured item
// ---------------------------------------------------------------------------

class FullItem implements AbstractPaneItem {
  element = document.createElement("div");

  getTitle(): string {
    return "Full Item";
  }

  getLongTitle(): string {
    return "A Fully Featured Item";
  }

  getElement(): HTMLElement {
    return this.element;
  }

  getURI(): string {
    return "pulsar://full-item";
  }

  getPath(): string {
    return "/tmp/full-item";
  }

  getIconName(): string {
    // Bare name — no `icon-` prefix.
    return "gear";
  }

  getDefaultLocation(): "bottom" {
    return "bottom";
  }

  getAllowedLocations(): Array<"bottom" | "left" | "right"> {
    return ["bottom", "left", "right"];
  }

  isPermanentDockItem(): boolean {
    return false;
  }

  getPreferredHeight(): number {
    return 300;
  }

  serialize() {
    return { deserializer: "my-package/FullItem", uri: this.getURI() };
  }

  save(): Promise<void> {
    return Promise.resolve();
  }

  saveAs(_filePath: string): Promise<void> {
    return Promise.resolve();
  }

  getSaveDialogOptions() {
    return {
      title: "Save Full Item",
      defaultPath: this.getPath(),
      filters: [{ name: "Text", extensions: ["txt", "md"] }],
      properties: ["showHiddenFiles" as const, "createDirectory" as const],
    };
  }

  isModified(): boolean {
    return false;
  }

  isDeleted(): boolean {
    return false;
  }

  isInConflict(): boolean {
    return false;
  }

  shouldPromptToSave(): boolean {
    return this.isModified();
  }

  copy(): PaneItem {
    return new FullItem();
  }

  destroy(): void {}

  isDestroyed(): boolean {
    return false;
  }

  onDidChangeTitle(callback: (newTitle: string) => unknown): Disposable {
    callback(this.getTitle());
    return disposable;
  }

  onDidChangeIcon(callback: (newIcon: string) => unknown): Disposable {
    callback(this.getIconName());
    return disposable;
  }

  onDidChangeModified(callback: (newModified: boolean) => unknown): Disposable {
    callback(this.isModified());
    return disposable;
  }

  onDidChangeDeletedStatus(callback: (newDeleted: boolean) => unknown): Disposable {
    callback(this.isDeleted());
    return disposable;
  }

  onDidDelete(callback: () => unknown): Disposable {
    callback();
    return disposable;
  }

  onDidChangeConflictedStatus(callback: (newConflicted: boolean) => unknown): Disposable {
    callback(this.isInConflict());
    return disposable;
  }

  onDidConflict(callback: () => unknown): Disposable {
    callback();
    return disposable;
  }

  onDidDestroy(callback: () => unknown): Disposable {
    callback();
    return disposable;
  }

  onDidTerminatePendingState(callback: () => unknown): Disposable {
    callback();
    return disposable;
  }

  observeEmbeddedTextEditor(callback: (editor: TextEditor) => unknown): Disposable {
    callback(editor);
    return disposable;
  }
}

// ---------------------------------------------------------------------------
// AbstractPaneItem: constrained return values
// ---------------------------------------------------------------------------

({
  getTitle: () => "x",
  getElement: () => document.createElement("div"),
  // @ts-expect-error 'top' is not a pane item location
  getDefaultLocation: () => "top",
}) satisfies AbstractPaneItem;

({
  getTitle: () => "x",
  getElement: () => document.createElement("div"),
  // @ts-expect-error a serializer must name a deserializer
  serialize: () => ({ uri: "pulsar://x" }),
}) satisfies AbstractPaneItem;

({
  getTitle: () => "x",
  getElement: () => document.createElement("div"),
  // @ts-expect-error 'openDirectory' is not a save dialog property
  getSaveDialogOptions: () => ({ properties: ["openDirectory"] }),
}) satisfies AbstractPaneItem;

// ---------------------------------------------------------------------------
// PaneItem is a union: a bare element is a valid pane item
// ---------------------------------------------------------------------------

document.createElement("div") satisfies PaneItem;
new FullItem() satisfies PaneItem;

declare const someItem: PaneItem;

// @ts-expect-error a PaneItem is not necessarily a view model
someItem.getTitle();

if (!(someItem instanceof HTMLElement)) {
  someItem.getTitle();
  // Optional members stay optional after narrowing.
  someItem.getURI?.();
}

// ---------------------------------------------------------------------------
// Pane: items
// ---------------------------------------------------------------------------

declare const pane: Pane;
declare const otherPane: Pane;

pane.getItems() satisfies PaneItem[];
pane.addItem(minimalItem);
pane.addItem(minimalItem, { index: 0, pending: true });
pane.addItems([minimalItem, document.createElement("div")], 1);
pane.activateItem(minimalItem);
pane.activateItem(minimalItem, { pending: true });
pane.moveItem(minimalItem, 2);
pane.moveItemToPane(minimalItem, otherPane, 0);
pane.activateItemAtIndex(0);

// Indexed lookups can miss.
pane.itemAtIndex(99) satisfies PaneItem | undefined;
pane.itemForURI("pulsar://full-item") satisfies PaneItem | undefined;

// Pending items are nullable.
pane.getPendingItem() satisfies PaneItem | null;
pane.setPendingItem(null);
pane.clearPendingItem();

// @ts-expect-error a string is not a pane item
pane.addItem("pulsar://full-item");

// ---------------------------------------------------------------------------
// Pane: destroying and saving
// ---------------------------------------------------------------------------

pane.destroyActiveItem() satisfies Promise<boolean>;
pane.destroyItem(minimalItem) satisfies Promise<boolean>;
pane.destroyItem(minimalItem, true) satisfies Promise<boolean>;
pane.destroyItems() satisfies Promise<boolean[]>;
pane.destroyInactiveItems() satisfies Promise<boolean[]>;

// `nextAction`'s return type flows through to the promise.
pane.saveItem(minimalItem, () => "done") satisfies Promise<string | undefined>;
pane.saveItemAs(minimalItem, () => 1) satisfies Promise<number | undefined>;
pane.saveActiveItemAs() satisfies Promise<void | undefined>;
pane.saveActiveItem((error?: Error) => error?.message);
pane.saveItems();

// ---------------------------------------------------------------------------
// Pane: event subscriptions
// ---------------------------------------------------------------------------

[
  pane.onDidChangeFlexScale((flexScale: number) => flexScale),
  pane.observeFlexScale((flexScale: number) => flexScale),
  pane.onDidActivate(() => {}),
  pane.onWillDestroy(() => {}),
  pane.onDidDestroy(() => {}),
  pane.onDidChangeActive((active: boolean) => active),
  pane.observeActive((active: boolean) => active),
  pane.onDidAddItem((event: PaneListItemShiftedEvent) => [event.item, event.index]),
  pane.onDidRemoveItem((event: PaneListItemShiftedEvent) => event.index),
  pane.onWillRemoveItem((event: PaneListItemShiftedEvent) => event.index),
  pane.onDidMoveItem((event: PaneItemMovedEvent) => [event.oldIndex, event.newIndex]),
  pane.observeItems((item: PaneItem) => item),
  pane.onDidChangeActiveItem((item: PaneItem) => item),
  pane.observeActiveItem((item: PaneItem) => item),
  pane.onWillDestroyItem((event: PaneListItemShiftedEvent) => event.item),
  pane.onChooseNextMRUItem((item: PaneItem) => item),
  pane.onChooseLastMRUItem((item: PaneItem) => item),
  pane.onDoneChoosingMRUItem(() => {}),
] satisfies Disposable[];

// @ts-expect-error the moved-item event has no `index`
pane.onDidMoveItem((event: PaneItemMovedEvent) => event.index);

// ---------------------------------------------------------------------------
// Pane: splitting
// ---------------------------------------------------------------------------

pane.splitRight() satisfies Pane;
pane.splitLeft({ copyActiveItem: true }) satisfies Pane;
pane.splitUp({ items: [minimalItem] }) satisfies Pane;
pane.splitDown({ items: [minimalItem], copyActiveItem: false }) satisfies Pane;

// @ts-expect-error unknown split parameter
pane.splitRight({ copyItems: true });

// Sibling lookups can miss; the find-or-create forms cannot.
pane.findLeftmostSibling() satisfies Pane | undefined;
pane.findRightmostSibling() satisfies Pane | undefined;
pane.findTopmostSibling() satisfies Pane | undefined;
pane.findBottommostSibling() satisfies Pane | undefined;
pane.findOrCreateRightmostSibling({}) satisfies Pane;
pane.findOrCreateBottommostSibling({}) satisfies Pane;

// ---------------------------------------------------------------------------
// Pane: lifecycle and misc
// ---------------------------------------------------------------------------

pane.isActive() satisfies boolean;
pane.isDestroyed() satisfies boolean;
pane.getActiveItemIndex() satisfies number;
pane.getContainer().getLocation() satisfies "left" | "right" | "bottom" | "center";
pane.getActiveEditor() satisfies TextEditor | undefined;
pane.activate();
pane.destroy();
