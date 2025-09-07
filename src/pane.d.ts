import { Disposable, TextEditor, ViewModel, Workspace } from "../index";

/** Anything that can be rendered as a member of a {@link Pane}. */
export type PaneItem = AbstractPaneItem | HTMLElement;

type PaneItemLocation = 'left' | 'right' | 'bottom' | 'center';
type PaneItemSerializer = { deserializer: string } & Record<string, unknown>;
type PaneItemFileFilter = { name: string, extensions: string[] };

/**
 * Properties to apply to the save dialog:
 *
 * * `showHiddenFiles`: Show hidden files in the dialog.
 * * `createDirectory` (macOS): Allow creating new directories from the dialog.
 * * `treatPackageAsDirectory` (macOS): Treat packages, such as `.app` folders,
 *   as directories instead of files.
 * * `showOverwriteConfirmation` (Linux): Ensures the user will be prompted for
 *   confirmation if they choose a file that already exists.
 * * `dontAddToRecent` (Windows): Do not add the item being saved to the
 *   recent documents list.
 */
type PaneItemSaveDialogProperty = |
  'showHiddenFiles' |
  'createDirectory' |
  'treatPackageAsDirectory' |
  'showOverwriteConfirmation' |
  'dontAddToRecent';

/**
 * Options for a save dialog.
 */
type PaneItemSaveDialogOptions = {
  /**
   * The dialog title. Cannot be displayed on some Linux desktop environments.
   */
  title?: string,

  /**
   * Absolute directory path, absolute file path, or file name to use by
   * default.
   */
  defaultPath?: string,

  /**
   * Custom label for the confirmation button of the dialog. When left empty,
   * the default label will be used.
   */
  buttonLabel?: string,

  /**
   * Filters to apply to the save dialog. When present, will show only the
   * specified file extensions.
   */
  filters?: PaneItemFileFilter[],

  /**
   * Message to display above text fields. Only applies on macOS.
   */
  message?: string,

  /**
   * Custom label for the text displayed in front of the filename text field.
   * Only applies on macOS.
   */
  nameFieldLabel?: string,

  /**
   * Whether to show the tags input box. Only applies on macOS. Defaults to
   * `true`.
   */
  showsTagField?: boolean,

  /**
   * Apply properties to the dialog. See {@link PaneItemSaveDialogProperty}.
   */
  properties?: PaneItemSaveDialogProperty[]
};

/**
 * An interface implemented by “view model”–style pane items as opposed to bare
 * DOM nodes.
 *
 * Pane items observe a very loose interface in which nearly all methods are
 * optional, but it is very useful to implement all the methods that are
 * appropriate for your view. Each one grants a certain automatic behavior or
 * privilege.
 */
interface AbstractPaneItem extends ViewModel {
  // Required methods
  /**
   * Return the title of the pane item.
   *
   * Implement this method for your pane item’s title to be reflected in the
   * tab bar, the window title, and other places.
   */
  getTitle(): string;

  /**
   * Return the element that should be used for your pane item’s view.
   *
   * If you elect not to return a bare element to represent your pane item,
   * this method must exist and must return an element.
   */
  getElement(): HTMLElement;

  // Optional methods

  /**
   * Return the URI associated with the item.
   *
   * URIs are useful for pane items to have, and mandatory if a pane item wants
   * to serialize itself so that it can survive an editor relaunch or window
   * reload.
   *
   * Pane items with URIs can be operated on more flexibly with API methods.
   * For instance: {@link Workspace#hide} accepts a pane item, but can also
   * accept a string URI.
   *
   * URIs are not required to be unique. For instance: since a pane item may
   * be copied, two copies of the same pane item will usually have the same
   * URI.
   *
   * If a pane item exists because an opener function acted on a given URI
   * (see {@link Workspace#addOpener}), that pane item should implement this
   * method and return the original URI that was used to open the pane item.
   */
  getURI?(): string;

  /**
   * Destroy the pane item.
   *
   * If this method exists, it will be called by the workspace when the item is
   * removed from its current pane.
   */
  destroy?(): unknown;

  /**
   * Register a callback to be invoked when your pane item is destroyed.
   *
   * If you implement `destroy`, you should also implement this method.
   *
   * Must return a {@link Disposable}.
   */
  onDidDestroy?(callback): Disposable;

  /**
   * Indicate whether this pane has already been destroyed.
   *
   * If this method returns `true`, this pane item may no longer be added to
   * any {@link Pane}.
   */
  isDestroyed?(): boolean;

  /**
   * Serialize the state of the item.
   *
   * Must return an object that can be passed to {@link JSON.stringify}. The
   * state should include a field called `deserializer` that names a
   * deserializer declared in your `package.json`. This method is invoked on
   * items when serializing the workspace so that they can be restored to the
   * same location after a relaunch or window reload.
   */
  serialize?(): PaneItemSerializer;

  /**
   * Register a callback to be invoked when your pane item’s title changes.
   *
   * If this method exists, the workspace will use it to subscribe to title
   * updates for your pane item. This method must return a {@link Disposable}.
   *
   * If your pane item‘s title won’t change after creation, you do not need to
   * implement this method.
   */
  onDidChangeTitle?(callback: (newTitle: string) => unknown): Disposable;

  /**
   * Return the “long” title of the pane item.
   *
   * If present, this method will be called when it needs a longer version of
   * your pane item’s title — for instance, when setting the window title, or
   * when more than one tab has the same name and disambiguation is needed.
   */
  getLongTitle?(): string;

  /**
   * Return the name of an icon.
   *
   * If this method is defined and returns a string, the item’s tab element
   * will include the specified icon.
   *
   * The icon name should be “bare” and should not begin with `icon-`.
   */
  getIconName?(): string;

  /**
   * Register a callback to be notified when the item’s icon changes.
   *
   * If this method exists, it will be called by the workspace. This method
   * must return a {@link Disposable}.
   *
   * If your pane item’s icon will not change after creation, you do not need
   * to implement this method.
   */
  onDidChangeIcon?(callback: (newIcon: string) => unknown): Disposable;

  /**
   * Tell the workspace where your item should be opened in absence of a user
   * override. Items can appear in the center or in a dock on the left, right,
   * or bottom of the workspace.
   *
   * When this method is not defined, `center` is the default pane item
   * location.
   */
  getDefaultLocation?(): PaneItemLocation;

  /**
   * Tell the workspace where this item can be moved. Must return an array
   * containing one or more {@link PaneItemLocation}s; any valid values omitted
   * from that array will not be allowed to contain this pane item.
   */
  getAllowedLocations?(): PaneItemLocation[];

  /**
   * Tell the workspace whether or not this item may be closed by the user by
   * clicking an `x` on its tab.
   *
   * Use of this feature is discouraged unless there’s a very good reason not
   * to allow users to close your item. Items may be made permanent _only_ when
   * they are contained in docks; pane items in the workspace center may always
   * be removed.
   *
   * Note that it is still currently possible to close dock items via the
   * “Close Pane” option in the context menu and via Pulsar APIs, so you should
   * still be prepared to handle your dock items being destroyed by the user
   * even if you implement this method.
   */
  isPermanentDockItem?(): boolean

  /**
   * Save the item.
   *
   * Implement this method if your pane item should respond to the `core:save`
   * command.
   *
   * This method is invoked only when your pane item implements the
   * {@link getURI} method; otherwise, {@link saveAs} will be called instead.
   *
   * This method is allowed to go asynchronous if needed.
   */
  save?(): void | Promise<void>;

  /**
   * Save the item to the specified path.
   *
   * Implement this method if your pane item should respond to the
   * `core:save-as` command. The path returned by {@link getPath}, if any, will
   * be used as the initial location for the “save as” dialog.
   *
   * This method is allowed to go asynchronous if needed.
   */
  save?(filePath: string): void | Promise<void>;

  /**
   * Return the local path associated with this item.
   *
   * This is used to set the initial location of the “save as” dialog.
   */
  getPath?(): string;

  /**
   * Return options for a save dialog that is invoked on this pane item.
   *
   * When this method is present, it will be used when a “save” or “save as”
   * dialog is shown. If this method returns an object with a `defaultPath`
   * property, it will be used instead of the return value of {@link getPath}.
   *
   * The full list of options is defined by Electron; consult
   * https://www.electronjs.org/docs/latest/api/dialog#dialogshowsavedialogwindow-options.
   */
  getSaveDialogOptions?(): PaneItemSaveDialogOptions;

  /**
   * Return whether the item is “modified” — i.e., is changed from its
   * representation on disk.
   *
   * If this method is implemented and returns `true`, your pane item’s tab
   * will indicate this modified state the same way it does for a modified
   * buffer.
   */
  isModified?(): boolean

  /**
   * Register a callback to be notified when the item’s “modified” status
   * changes. Must return a {@link Disposable}.
   *
   * If you implement {@link isModified}, you should also implement this
   * method. When this method exists, the workspace will automatically call it
   * so it can subscribe to changes in your item’s “modified” status.
   */
  onDidChangeModified?(callback: (newModified: boolean) => unknown): Disposable

  /**
   * Create a copy of the current pane item.
   *
   * Certain workspace commands will implicitly copy a pane item when creating
   * a new split. If you define this method, your pane items can be copied in
   * the same manner as editor pane items and others.
   */
  copy?(): AbstractPaneItem;

  /**
   * Report the pane’s preferred height.
   *
   * If this item is displayed in the bottom {@link Dock}, the workspace will
   * call this method when the dock changes from hidden to visible. Once the
   * dock has been resized by the user, the height they set will override this
   * value.
   */
  getPreferredHeight?(): number;

  /**
   * Report the pane’s preferred width.
   *
   * If this item is displayed in the left or right {@link Dock}, the workspace
   * will call this method when that dock changes from hidden to visible. Once
   * that dock has been resized by the user, the width they set will override
   * this value.
   */
  getPreferredWidth?(): number;

  /**
   * Register a callback to be notified when this pane item should no longer be
   * considered “pending.” Must return a {@link Disposable}.
   *
   * If the workspace is configured to use pending pane items, it will
   * use this method to find out when the pane item feels it should lose its
   * pending status and be promoted to a “regular” pane item.
   */
  onDidTerminatePendingState?(callback: () => unknown): Disposable;

  /**
   * Return whether Pulsar should prompt the user to save this item when the
   * user closes or reloads the window.
   *
   * The logic for whether to prompt to save this item is unconnected to any
   * other pane item logic. For instance: the workspace will not use the
   * “modified” status of the item to decide whether to prompt, even when
   * {@link isModified} is implemented; but you are, of course, free to reuse
   * `isModified` within your `shouldPromptToSave` implementation if
   * appropriate.
   */
  shouldPromptToSave?(): boolean;


  /**
   * Register a callback to be notified when a {@link TextEditor} embedded
   * within this pane item is created or changed.
   *
   * This method is used by the `find-and-replace` package. Finding text within
   * the active pane item typically only works when that item is a
   * {@link TextEditor}… but if your view embeds its own `TextEditor`,
   * implementing this method allows “Find in Current Buffer” to work correctly
   * even on your custom pane item.
   *
   * Matches will be highlighted and shortcuts like “Find Next” and “Find
   * Previous” will move to the correct positions, even if your editor is
   * read-only.
   *
   * You must also, of course, do the work of invoking these callbacks when you
   * attach or reattatch an editor to your view.
   */
  observeEmbeddedTextEditor?(
    callback: (editor: TextEditor) => unknown
  ): Disposable;
}

/** A container for presenting content in the center of the workspace. */
export interface Pane {
  // Event Subscription
  /** Invoke the given callback when the pane resizes. */
  onDidChangeFlexScale(callback: (flexScale: number) => void): Disposable;

  /** Invoke the given callback with the current and future values of ::getFlexScale. */
  observeFlexScale(callback: (flexScale: number) => void): Disposable;

  /** Invoke the given callback when the pane is activated. */
  onDidActivate(callback: () => void): Disposable;

  /** Invoke the given callback before the pane is destroyed. */
  onWillDestroy(callback: () => void): Disposable;

  /** Invoke the given callback when the pane is destroyed. */
  onDidDestroy(callback: () => void): Disposable;

  /** Invoke the given callback when the value of the ::isActive property changes. */
  onDidChangeActive(callback: (active: boolean) => void): Disposable;

  /**
   *  Invoke the given callback with the current and future values of the ::isActive
   *  property.
   */
  observeActive(callback: (active: boolean) => void): Disposable;

  /** Invoke the given callback when an item is added to the pane. */
  onDidAddItem(callback: (event: PaneListItemShiftedEvent) => void): Disposable;

  /** Invoke the given callback when an item is removed from the pane. */
  onDidRemoveItem(callback: (event: PaneListItemShiftedEvent) => void): Disposable;

  /** Invoke the given callback before an item is removed from the pane. */
  onWillRemoveItem(callback: (event: PaneListItemShiftedEvent) => void): Disposable;

  /** Invoke the given callback when an item is moved within the pane. */
  onDidMoveItem(callback: (event: PaneItemMovedEvent) => void): Disposable;

  /** Invoke the given callback with all current and future items. */
  observeItems(callback: (item: PaneItem) => void): Disposable;

  /** Invoke the given callback when the value of ::getActiveItem changes. */
  onDidChangeActiveItem(callback: (activeItem: PaneItem) => void): Disposable;

  /**
   * Invoke the given callback when {@link activateNextRecentlyUsedItem} has
   * been called, either initiating or continuing a forward MRU traversal of
   * pane items.
   */
  onChooseNextMRUItem(callback: (nextRecentlyUsedItem: PaneItem) => void): Disposable;

  /**
   * Invoke the given callback when {@link activatePreviousRecentlyUsedItem}
   * has been called, either initiating or continuing a reverse MRU traversal
   * of pane items.
   */
  onChooseLastMRUItem(callback: (previousRecentlyUsedItem: PaneItem) => void): Disposable;

  /**
   * Invoke the given callback when ::moveActiveItemToTopOfStack has been called,
   * terminating an MRU traversal of pane items and moving the current active item
   * to the top of the stack. Typically bound to a modifier (e.g. CTRL) key up event.
   */
  onDoneChoosingMRUItem(callback: () => void): Disposable;

  /** Invoke the given callback with the current and future values of ::getActiveItem. */
  observeActiveItem(callback: (activeItem: PaneItem) => void): Disposable;

  /** Invoke the given callback before items are destroyed. */
  onWillDestroyItem(callback: (event: PaneListItemShiftedEvent) => void): Disposable;

  // Items
  /** Get the items in this pane. */
  getItems(): PaneItem[];

  /** Get the active pane item in this pane. */
  getActiveItem(): PaneItem;

  /** Return the item at the given index. */
  itemAtIndex(index: number): PaneItem | undefined;

  /** Makes the next item active. */
  activateNextItem(): void;

  /** Makes the previous item active. */
  activatePreviousItem(): void;

  /** Move the active tab to the right. */
  moveItemRight(): void;

  /** Move the active tab to the left. */
  moveItemLeft(): void;

  /** Get the index of the active item. */
  getActiveItemIndex(): number;

  /** Activate the item at the given index. */
  activateItemAtIndex(index: number): void;

  /** Make the given item active, causing it to be displayed by the pane's view. */
  activateItem(item: PaneItem, options?: { pending: boolean }): void;

  /** Add the given item to the pane. */
  addItem(item: PaneItem, options?: { index?: number | undefined; pending?: boolean | undefined }): PaneItem;

  /** Add the given items to the pane. */
  addItems(items: PaneItem[], index?: number): PaneItem[];

  /** Move the given item to the given index. */
  moveItem(item: PaneItem, index: number): void;

  /** Move the given item to the given index on another pane. */
  moveItemToPane(item: PaneItem, pane: Pane, index: number): void;

  /** Destroy the active item and activate the next item. */
  destroyActiveItem(): Promise<boolean>;

  /** Destroy the given item. */
  destroyItem(item: PaneItem, force?: boolean): Promise<boolean>;

  /** Destroy all items. */
  destroyItems(): Promise<boolean[]>;

  /** Destroy all items except for the active item. */
  destroyInactiveItems(): Promise<boolean[]>;

  /** Save the active item. */
  saveActiveItem<T = void>(nextAction?: (error?: Error) => T): Promise<T> | undefined;

  /**
   * Prompt the user for a location and save the active item with the path
   * they select.
   */
  saveActiveItemAs<T = void>(nextAction?: (error?: Error) => T): Promise<T> | undefined;

  /** Save the given item. */
  saveItem<T = void>(item: PaneItem, nextAction?: (error?: Error) => T): Promise<T> | undefined;

  /**
   * Prompt the user for a location and save the active item with the path
   * they select.
   */
  saveItemAs<T = void>(item: PaneItem, nextAction?: (error?: Error) => T): Promise<T> | undefined;

  /** Save all items. */
  saveItems(): void;

  /** Return the first item that matches the given URI or undefined if none exists. */
  itemForURI(uri: string): PaneItem | undefined;

  /** Activate the first item that matches the given URI. */
  activateItemForURI(uri: string): boolean;

  // Lifecycle
  /** Determine whether the pane is active. */
  isActive(): boolean;

  /** Makes this pane the active pane, causing it to gain focus. */
  activate(): void;

  /** Close the pane and destroy all its items. */
  destroy(): void;

  /** Determine whether this pane has been destroyed. */
  isDestroyed(): boolean;

  // Splitting
  /** Creat a new pane to the left of this pane. */
  splitLeft(params?: { items?: PaneItem[] | undefined; copyActiveItem?: boolean | undefined }): Pane;

  /** Creat a new pane to the right of this pane. */
  splitRight(params?: { items?: PaneItem[] | undefined; copyActiveItem?: boolean | undefined }): Pane;

  /** Create a new pane above the receiver. */
  splitUp(params?: { items?: PaneItem[] | undefined; copyActiveItem?: boolean | undefined }): Pane;

  /** Create a new pane below the receiver. */
  splitDown(params?: { items?: PaneItem[] | undefined; copyActiveItem?: boolean | undefined }): Pane;

  // Pending items

  /** Retrieve this pane's pending item, if any. */
  getPendingItem(): PaneItem | null;

  /**
   * Set this pane's pending item.
   *
   * Will replace any other pending item that may be present in this pane.
   */
  setPendingItem(item: PaneItem | null): void;

  /**
   * Clear this pane's pending item, if any.
   *
   * If a pending pane item exists, it will implicitly be closed.
   */
  clearPendingItem(): void;
}

export interface PaneListItemShiftedEvent {
  /** The pane item that was added or removed. */
  item: PaneItem;

  /** A number indicating where the item is located. */
  index: number;
}

export interface PaneItemMovedEvent {
  /** The removed pane item. */
  item: PaneItem;

  /** A number indicating where the item was located. */
  oldIndex: number;

  /** A number indicating where the item is now located. */
  newIndex: number;
}

export interface PaneItemObservedEvent {
  item: PaneItem;
  pane: Pane;
  index: number;
}

export interface PaneItemOpenedEvent extends PaneItemObservedEvent {
  uri: string;
}
