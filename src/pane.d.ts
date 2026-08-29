import { Disposable, TextEditor, ViewModel, Workspace } from "../index";

/** Anything that can be rendered as a member of a {@link Pane}. */
export type PaneItem = AbstractPaneItem | HTMLElement;

type PaneItemLocation = 'left' | 'right' | 'bottom' | 'center';
type PaneItemSerializer = { deserializer: string } & Record<string, unknown>;
type PaneItemFileFilter = { name: string, extensions: string[] };

interface PaneContainer {
  getLocation(): PaneItemLocation;
}

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

type PaneSplitParams = {
  items?: PaneItem[] | undefined;
  copyActiveItem?: boolean | undefined
};

/**
 * An interface implemented by “view model”–style pane items as opposed to bare
 * DOM nodes.
 *
 * Pane items observe a very loose interface in which nearly all methods are
 * optional — but it is very useful to implement all the methods that are
 * appropriate for your view. Each one implemented grants a certain automatic
 * behavior or privilege.
 */
export interface AbstractPaneItem extends ViewModel {
  // Required methods

  /**
   * Return the title of the pane item.
   *
   * A title is one of the few items of metadata that a pane item is required
   * to have. Implementing this method allows your pane item’s title to be
   * reflected in the tab bar, the window title, and other places.
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
   * Register a callback to be invoked when your pane item’s title changes.
   *
   * If this method exists, the workspace will use it to subscribe to title
   * updates for your pane item. This method must return a {@link Disposable}.
   *
   * If your pane item‘s title won’t change after creation, you do not need to
   * implement this method. Otherwise, you must implement this method for
   * changes in your title to be reflected in the tab bar and the window title
   * bar.
   */
  onDidChangeTitle?(callback: (newTitle: string) => unknown): Disposable;

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
   * Return the URI associated with this item.
   *
   * @deprecated Prefer {@link getURI}.
   */
  getUri?(): string;

  /**
   * Destroy the pane item.
   *
   * If this method exists, it will be called by the workspace when the item is
   * removed from its current pane.
   */
  destroy?(): unknown;

  /**
   * Register a callback to be invoked when your pane item is destroyed. Must
   * return a {@link Disposable}.
   *
   * If you implement {@link destroy}, you should also implement this method so
   * that anything that cares about your pane item’s life cycle can do its own
   * cleanup when the pane item is destroyed.
   */
  onDidDestroy?(callback: () => unknown): Disposable;

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
   * This method is invoked on items when serializing the workspace so that
   * they can be restored to the same location after a relaunch or window
   * reload.
   *
   * Must return an object that can be passed to {@link JSON.stringify}. The
   * state should include a field called `deserializer` that names a
   * deserializer declared in your `package.json`.
   */
  serialize?(): PaneItemSerializer;

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
   * If this method is defined, returns a string, and points to a valid icon
   * name, then the item’s tab will include the specified icon.
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
   * to implement this method. Otherwise, if you implement {@link getIconName},
   * you should also implement this method so that the new icon will
   * automatically be shown in the tab bar when you change icons.
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
   * Implementing this method and having it return `true` is discouraged unless
   * there’s a very good reason not to allow users to close your pane item.
   * Items may be made permanent _only_ when they are contained in docks; pane
   * items in the workspace center may always be removed.
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
   * This method is allowed to go asynchronous if needed. You should not return
   * from this method unless and until your pane item is “saved,” however you
   * choose to define it.
   */
  save?(): void | Promise<void>;

  /**
   * Save the item to the specified path.
   *
   * Implement this method if your pane item should respond to the
   * `core:save-as` command. The path returned by {@link getPath}, if any, will
   * be used as the initial location for the “save as” dialog.
   *
   * This method is allowed to go asynchronous if needed. You should not return
   * from this method unless and until your pane item is “saved,” however you
   * choose to define it.
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
   * Return whether the item is in a “conflicted” state.
   *
   * If this method is implemented and returns `true`, a user may be prompted
   * for confirmation when they request to save this pane item — since saving
   * may overwrite changes made to the file on disk.
   *
   * The user controls whether they want to see these confirmation dialogs via
   * the `core.promptOnConflict` setting.
   *
   * The exact semantics of “conflicted” vary based on what the pane item is.
   * For an editor, a conflicted state happens when the user makes
   * modifications to a file, does not save them immediately, then has the
   * file’s contents on disk change because of modifications from another
   * program. If the file were not in a modified state, we would automatically
   * update the editor’s contents to match the contents on disk, but we cannot
   * do that without losing the user’s changes.
   *
   * @since 1.132.0
   */
  isInConflict?(): boolean;

  /**
   * Register a callback to be notified when the item’s “conflicted” status
   * changes from `false` to `true`. Must return a {@link Disposable}.
   *
   * If you implement {@link isInConflict}, you should also implement this
   * method. When this method exists, the workspace will use it to subscribe
   * to changes in your item’s “conflicted” status.
   */
  onDidConflict?(callback: () => unknown): Disposable;

  /**
   * Register a callback to be notified when the item’s “conflicted” status
   * switches to `true`. Must return a {@link Disposable}.
   *
   * Unlike {@link onDidDelete}, this callback will fire even when “conflicted”
   * status changes from `true` to `false`.
   *
   * If you implement {@link isInConflict}, you should also implement this
   * method. When this method exists, the workspace will use it to subscribe
   * to changes in your item’s “conflicted” status.
   *
   * @since 1.132.0
   */
  onDidChangeConflictedStatus(callback: (newConflicted: boolean) => unknown): Disposable;

  /**
   * Create a copy of the current pane item.
   *
   * Certain workspace commands will implicitly copy a pane item when creating
   * a new split. If you define this method, your pane items can be copied in
   * the same manner as editor pane items and others.
   */
  copy?(): PaneItem;

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
   * When a “pending” state is present on a pane item, it will be replaced in
   * its container by the very next item to be opened, whether or not that item
   * is itself in a “pending” state. It is meant to make it easier to “glimpse”
   * at files in the project.
   *
   * If your pane item can enter a “pending” state, you should implement this
   * method. If the workspace is configured to use pending pane items, it will
   * use this method to find out when the pane item feels it should lose its
   * pending status and be promoted to a “regular” pane item.
   */
  onDidTerminatePendingState?(callback: () => unknown): Disposable;

  /**
   * Return whether Pulsar should prompt the user to save this item when the
   * user closes or reloads the window.
   *
   * The logic for whether to prompt to save this item is unconnected to any
   * other pane item logic. There is no default `shouldPromptToSave`; it falls
   * on the package author to define for a particular pane item.
   *
   * Often you will want to make it behave identically to {@link isModified} —
   * prompting the user to save only when there are uncommitted changes — but
   * you have the freedom to make this method behave differently if it is
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
   * attach or reattach an editor to your view.
   */
  observeEmbeddedTextEditor?(
    callback: (editor: TextEditor) => unknown
  ): Disposable;
}

/** A container for presenting content in the center of the workspace. */
export interface Pane {

  // Event Subscription
  /**
   * Invoke the given callback when the pane resizes.
   *
   * The callback will be invoked when the pane's `flexScale` property changes.
   * Use {@link getFlexScale} to get the current value.
   *
   * @param callback A function to be called when the pane is resized. Takes
   *   one parameter, `flexScale` — a number representing the pane's
   *   `flex-grow` value (its ability to grow if necessary).
   */
  onDidChangeFlexScale(callback: (flexScale: number) => void): Disposable;

  /**
   * Invoke the given callback with the current and future values of
   * {@link getFlexScale}.
   *
   * Parameters are identical to those of {@link onDidChangeFlexScale}.
   */
  observeFlexScale(callback: (flexScale: number) => void): Disposable;

  /** Invoke the given callback when the pane is activated. */
  onDidActivate(callback: () => void): Disposable;

  /** Invoke the given callback before the pane is destroyed. */
  onWillDestroy(callback: () => void): Disposable;

  /** Invoke the given callback when the pane is destroyed. */
  onDidDestroy(callback: () => void): Disposable;

  /**
   * Invoke the given callback when the value of the {@link isActive} property
   * changes.
   */
  onDidChangeActive(callback: (active: boolean) => void): Disposable;

  /**
   * Invoke the given callback with the current and future values of the
   * {@link isActive} function.
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

  /**
   * Invoke the given callback when the value of {@link getActiveItem} changes.
   */
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
   * Invoke the given callback when {@link moveActiveItemToTopOfStack} has been
   * called, terminating an MRU traversal of pane items and moving the current
   * active item to the top of the stack. Typically bound to a modifier (e.g.,
   * `Ctrl`) keyup event.
   */
  onDoneChoosingMRUItem(callback: () => void): Disposable;

  /**
   * Invoke the given callback with the current and future values of
   * {@link getActiveItem}.
   */
  observeActiveItem(callback: (activeItem: PaneItem) => void): Disposable;

  /** Invoke the given callback before items are destroyed. */
  onWillDestroyItem(callback: (event: PaneListItemShiftedEvent) => void): Disposable;

  /** @private */
  getFlexScale(): number;

  /** @private */
  setFlexScale(flexScale: number): number;

  /**
   * Called by the view layer to indicate that the pane has gained focus.
   * @private
   */
  focus(): void;

  /**
   * Called by the view layer to indicate that the pane has lost focus.
   * @private
   */
  blur(): true;

  /**
   * Return whether the pane is focused.
   * @private
   */
  isFocused(): boolean;

  // Items

  /** Get the items in this pane. */
  getItems(): PaneItem[];

  /** Get the active pane item in this pane. */
  getActiveItem(): PaneItem;

  /**
   * Set the active item in the pane.
   *
   * When the `modifyStack` option is `true`, the new item will also be
   * inserted into the most-recently-used stack.
   *
   * @private
   */
  setActiveItem(activeItem: PaneItem, options?: { modifyStack?: boolean }): PaneItem;

  // Not marked as public, but seems pretty useful.
  /**
   * Return a {@link TextEditor} if the active pane item is a `TextEditor`, or
   * `undefined` otherwise.
   */
  getActiveEditor(): TextEditor | undefined;

  /** Gets the pane's container. */
  getContainer(): PaneContainer;

  /** Sets the pane's container. */
  setContainer(container: PaneContainer): void;

  /** Return the item at the given index. */
  itemAtIndex(index: number): PaneItem | undefined;

  /** Makes the next item in the most-recently-used stack active. */
  activateNextRecentlyUsedItem(): void;

  /** Makes the previous item in the most-recently-used stack active. */
  activatePreviousRecentlyUsedItem(): void;

  /**
   * Moves the active item to the end of the item stack once a modifier key
   * (typically `Ctrl`) is lifted.
   */
  moveActiveItemToTopOfStack(): void;

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

  /**
   * Make the given item active, causing it to be displayed by the pane's view.
   * Will be added to the pane if it is not already present.
   */
  activateItem(
    item: PaneItem,
    options?: {
      /**
       * Whether the item should be added in a pending state if it does not yet
       * exist in the pane. If so, will replace any existing pending item in
       * the pane.
       */
      pending: boolean
    }
  ): void;

  /** Add the given item to the pane. */
  addItem(
    item: PaneItem,
    options?: {
      /** The index at which to add the item. */
      index?: number | undefined;
      /**
       * Whether the item should be added in a pending state. If so, will
       * replace any existing pending item in the pane.
       */
      pending?: boolean | undefined
    }
  ): PaneItem;

  /** Add the given items to the pane, optionally at the given index. */
  addItems(items: PaneItem[], index?: number): PaneItem[];

  // (`removeItem` is definitely internal)

  /**
   * Remove the given item from the most-recently-used item stack.
   * @private
   */
  removeItemFromStack(item: PaneItem): void;

  /** Move the given item to the given index. */
  moveItem(item: PaneItem, index: number): void;

  /**
   * Move the given item to the given index on another pane.
   * @param pane The {@link Pane} to which to move the item.
   * @param index The index at which it should be inserted in the new pane.
   */
  moveItemToPane(item: PaneItem, pane: Pane, index: number): void;

  /** Destroy the active item and activate the next item. */
  destroyActiveItem(): Promise<boolean>;

  /**
   * Destroy the given item.
   *
   * If the item is active, the next item will be activated. If the item is the
   * last item, the pane will be destroyed if the `core.destroyEmptyPanes`
   * config setting is `true`.
   *
   * This action can be prevented by {@link Workspace#onWillDestroyPaneItem}
   * callbacks, in which case nothing happens.
   *
   * @param item The item to destroy.
   * @param force Whether to force destruction of the item. This will ignore
   *  the item's {@link AbstractPaneItem#isPermanentDockItem} method and will
   *  skip any prompt-to-save behavior. (Callbacks can still prevent the
   *  deletion of the item, however.)
   * @returns Promise that resolves with a boolean indicating whether the item
   *  was destroyed.
   */
  destroyActiveItem(item: PaneItem, force?: boolean): Promise<boolean>;

  /** Destroy all items. */
  destroyItems(): Promise<boolean[]>;

  /** Destroy all items except for the active item. */
  destroyInactiveItems(): Promise<boolean[]>;

  /** Save the active item. */
  saveActiveItem<T = void>(nextAction?: (error?: Error) => T): Promise<T> | undefined;

  /**
   * Prompt the user for a location and save the active item with the path
   * they select.
   *
   * @param nextAction A function that will be called — either with no argument
   *  if the item is successfully saved, or with the error if it fails.
   * @returns A promise that resolves with the return value of `nextAction` (if
   *  it was provided) or `undefined`.
   */
  saveActiveItemAs<T = void>(nextAction?: (error?: Error) => T): Promise<T | undefined>;

  /**
   * Save the given item.
   *
   * @param nextAction A function that will be called — either with no argument
   *  if the item is successfully saved, or with the error if it fails.
   * @returns A promise that resolves with the return value of `nextAction` (if
   *  it was provided) or `undefined`.
   */
  saveItem<T = void>(item: PaneItem, nextAction?: (error?: Error) => T): Promise<T | undefined>;

  /**
   * Prompt the user for a location and save the active item with the path
   * they select.
   *
   * @param nextAction A function that will be called — either with no argument
   *  if the item is successfully saved, or with the error if it fails.
   * @returns A promise that resolves with the return value of `nextAction` (if
   *  it was provided) or `undefined`.
   */
  saveItemAs<T = void>(item: PaneItem, nextAction?: (error?: Error) => T): Promise<T | undefined>;

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
  /** Create a new pane to the left of this pane. */
  splitLeft(params?: PaneSplitParams): Pane;

  /** Create a new pane to the right of this pane. */
  splitRight(params?: PaneSplitParams): Pane;

  /** Create a new pane above the receiver. */
  splitUp(params?: PaneSplitParams): Pane;

  /** Create a new pane below the receiver. */
  splitDown(params?: PaneSplitParams): Pane;

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

  /**
   * If the parent is a horizonal axis, returns its first child if it is a
   * pane; otherwise returns this pane.
   * @private
   */
  findLeftmostSibling(): Pane | undefined;
  /**
   * If the parent is a horizonal axis, returns its last child if it is a
   * pane; otherwise returns this pane.
   * @private
   */
  findRightmostSibling(): Pane | undefined;
  /**
   * If the parent is a vertical axis, returns its first child if it is a
   * pane; otherwise returns this pane.
   * @private
   */
  findTopmostSibling(): Pane | undefined;
  /**
   * If the parent is a vertical axis, returns its last child if it is a
   * pane; otherwise returns this pane.
   * @private
   */
  findBottommostSibling(): Pane | undefined;

  /**
   * If the parent is a horizontal axis, returns its last child if it is a
   * pane; otherwise returns a new pane created by splitting this pane
   * rightward.
   * @private
   */
  findOrCreateRightmostSibling(params: PaneSplitParams): Pane;
  /**
   * If the parent is a vertical axis, returns its last child if it is a
   * pane; otherwise returns a new pane created by splitting this pane
   * rightward.
   * @private
   */
  findOrCreateBottommostSibling(params: PaneSplitParams): Pane;
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
