import { CommandEvent, CompositeDisposable, Disposable } from "../index";

/**
 * @deprecated Retained for backward compatibility. The index signature that
 * allowed arbitrary selectors to satisfy `keyof CommandRegistryTargetMap` made
 * overload resolution fail whenever a target's type was a union (like
 * `string | HTMLElement`), because TypeScript matches an argument against each
 * overload as a whole rather than distributing the union across them. Use
 * {@link CommandTarget} instead.
 */
export interface CommandRegistryTargetMap extends HTMLElementTagNameMap {
  [key: string]: EventTarget;
}

/**
 * Resolves a command target to the type of element that its command events
 * will carry as `currentTarget`.
 *
 * A specific node keeps its own type; a string that matches a known tag name
 * maps to that tag's element type; anything else — a compound or otherwise
 * complex selector, a plain `string`, or a union of target types — falls back
 * to `EventTarget`, which is vague but true.
 *
 * Because this is a conditional type rather than a set of overloads, it
 * distributes over unions; a target typed `string | HTMLElement` resolves to
 * `EventTarget` instead of failing to match any signature at all.
 *
 * TODO: We can improve the accuracy of the inference here if we use
 * template-literal types, as long as we're careful not to over-infer on
 * selectors like `atom-text-editor, div` so that we don't make things worse
 * relative to the status quo. (Also requires TS 4.8, but that should be safe
 * to rely on.) That work would happen here, as extra branches, rather than as
 * extra overloads on `add`.
 */
export type CommandTarget<T> = T extends EventTarget ? T
  : T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T]
  : EventTarget;

/**
 * Commands can be bound to specific targets (element nodes that already exist)
 * or to abstract targets (CSS selectors that describe nodes that may exist now
 * or may only exist in the future).
 *
 * If we have a specific node reference, we can be more explicit about the
 * types on the `CommandEvent` that will eventually fire. If we have a string,
 * we only know that the `CommandEvent` will refer to some sort of
 * `EventTarget`, but cannot be more specific than that.
 */
export type CommandRegistryListener<TargetType extends EventTarget = EventTarget> =
  | {
    didDispatch(event: CommandEvent<TargetType>): unknown | Promise<unknown>;
    /**
     * A custom "humanized" command name that will appear in the command
     * palette for this command.
     *
     * The default humanization algorithm for command names is to title-case
     * all words; `foo:do-a-cool-thing` becomes `Foo: Do A Cool Thing`. If that
     * somehow doesn't suffice, you may specify your own humanized name — but
     * you are encouraged to keep it as similar to the base command name as
     * possible so that users may enjoy predictable filtering behavior within
     * the command palette.
     */
    displayName?: string | undefined;
    /**
     * An optional description to show within the command palette for this
     * command.
     *
     * This is rarely used, but is present in case you want to add more context
     * to the user around what this command does. It is only used by the
     * command palette and will display an extra line of text underneath the
     * humanized command name.
     */
    description?: string | undefined;
    /**
     * Whether this command should appear in the command palette. Defaults to
     * `true` if omitted.
     *
     * It is rare that you'd want to hide a certain command from appearing in
     * the command palette, but not unheard of. For instance: a language
     * grammar may add a command that does something simple while the user
     * types (like add padding around the cursor or insert a pair of
     * delimiters) and bind it to a commonly used key. In those cases, it would
     * be fair to hide such a command from the command palette so as not to
     * remove it from the specific context in which it would be invoked.
     */
    hiddenInCommandPalette?: boolean | undefined;
  }
  | ((event: CommandEvent<TargetType>) => unknown | Promise<unknown>);

/**
 * Associates listener functions with commands in a context-sensitive way using
 * CSS selectors.
 */
export interface CommandRegistry {
  /** Register a single command. */
  // When `target` is a string and happens to match a known tag name, we can
  // infer the type of `currentTarget` on the event listener. When it's a more
  // complex selector (or a tag we don't recognize) it falls back to inferring
  // that `currentTarget` is an `EventTarget` (which is true, if vague). See
  // `CommandTarget` for the details.
  //
  // These two signatures are distinguished by their _second_ argument, never
  // by the type of `target`; that's what allows a caller to pass a target
  // whose type is a union.
  add<T extends string | Node>(
    target: T,
    commandName: string,
    listener: CommandRegistryListener<CommandTarget<T>>,
    throwOnInvalidSelector?: boolean
  ): Disposable;

  /** Register multiple commands. */
  add<T extends string | Node>(
    target: T,
    commands: {
      [key: string]: CommandRegistryListener<CommandTarget<T>>;
    },
    throwOnInvalidSelector?: boolean
  ): CompositeDisposable;

  /** Find all registered commands matching a query. */
  findCommands(params: {
    target: string | Node;
  }): Array<{
    name: string;
    displayName: string;
    description?: string | undefined;
    tags?: string[] | undefined;
  }>;

  /**
   * Simulate the dispatch of a command on a DOM node.
   *
   * @return Either a promise that resolves after all handlers complete or
   * `null` if no handlers were matched.
   */
  dispatch(target: Node, commandName: string, detail?: unknown): Promise<void> | null;

  /** Invoke the given callback before dispatching a command event. */
  onWillDispatch(callback: (event: CommandEvent) => void): Disposable;

  /** Invoke the given callback after dispatching a command event. */
  onDidDispatch(callback: (event: CommandEvent) => void): Disposable;
}
