import { CommandEvent, CompositeDisposable, Disposable } from "../index";

export interface CommandRegistryTargetMap extends HTMLElementTagNameMap {
  [key: string]: EventTarget;
}

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
  add<T extends keyof CommandRegistryTargetMap>(
    target: T,
    commandName: string,
    listener: CommandRegistryListener<CommandRegistryTargetMap[T]>,
  ): Disposable;
  /** Register a single command. */
  add<T extends Node>(target: T, commandName: string, listener: CommandRegistryListener<T>): Disposable;
  /** Register a single command. */
  add<T extends string>(target: T, commandName: string, listener: CommandRegistryListener): Disposable;

  /** Register multiple commands. */
  add<T extends keyof CommandRegistryTargetMap>(
    target: T,
    commands: {
      [key: string]: CommandRegistryListener<CommandRegistryTargetMap[T]>;
    }
  ): CompositeDisposable;
  /** Register multiple commands. */
  add<T extends Node>(
    target: T,
    commands: {
      [key: string]: CommandRegistryListener<T>;
    }
  ): CompositeDisposable;
  add<T extends string>(
    target: T,
    commands: {
      [key: string]: CommandRegistryListener;
    }
  ) : CompositeDisposable;

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
   *  Simulate the dispatch of a command on a DOM node.
   *
   * @return Either a promise that resolves after all handlers complete or
   * `null` if no handlers were matched.
   */
  dispatch(target: Node, commandName: string): Promise<void> | null;

  /** Invoke the given callback before dispatching a command event. */
  onWillDispatch(callback: (event: CommandEvent) => void): Disposable;

  /** Invoke the given callback after dispatching a command event. */
  onDidDispatch(callback: (event: CommandEvent) => void): Disposable;
}
