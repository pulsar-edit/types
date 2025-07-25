import { ConfigValues, Disposable, ScopeDescriptor } from "../index";

type ConfigSchemaType = 'integer' | 'boolean' | 'array' | 'object' | 'color' | 'string' | 'number'

export type ConfigSchema =
  | ConfigSchemaForInteger
  | ConfigSchemaForNumber
  | ConfigSchemaForBoolean
  | ConfigSchemaForArray
  | ConfigSchemaForString
  | ConfigSchemaForColor
  | ConfigSchemaForObject

type ConfigSchemaBase = {
  title?: string
  description?: string
}

type ConfigSchemaForInteger = ConfigSchemaBase & {
  type: 'integer'
  default?: number
  minimum?: number
  maximum?: number
}

type ConfigSchemaForNumber = ConfigSchemaBase & {
  type: 'number'
  default?: number
  minimum?: number
  maximum?: number
}

type ConfigSchemaForBoolean = ConfigSchemaBase & {
  type: 'boolean'
  default?: boolean
}

type ConfigSchemaForArray<SubType = unknown> = ConfigSchemaBase & {
  type: 'array'
  default?: SubType[]
  items: ConfigSchema
}

type ConfigSchemaForObject = ConfigSchemaBase & {
  type: 'object'
  properties: Record<string, ConfigSchema>
}

/** Used to access all of Atom's configuration details. */
export interface Config {
  // Config Subscription
  /**
   * Add a listener for changes to a given key path.
   *
   * This is different than {@link onDidChange} in that it will immediately
   * call your callback with the current value of the config entry.
   */
  observe<T extends keyof ConfigValues>(keyPath: T, callback: (value: ConfigValues[T]) => void): Disposable;
  /**
   * Add a listener for changes to a given key path.
   *
   * This is different than {@link onDidChange} in that it will immediately
   * call your callback with the current value of the config entry.
   */
  observe<T extends keyof ConfigValues>(
    keyPath: T,
    options: { scope: string[] | ScopeDescriptor },
    callback: (value: ConfigValues[T]) => void,
  ): Disposable;

  /**
   * Add a listener for all configuration key changes.
   */
  // tslint:disable-next-line:no-any
  onDidChange<T = any>(
    callback: (values: { newValue: T; oldValue: T }) => void
  ): Disposable;
  /**
   * Add a listener for changes to a given key path.
   */
  onDidChange<T extends keyof ConfigValues>(
    keyPath: T,
    callback: (values: { newValue: ConfigValues[T]; oldValue?: ConfigValues[T] | undefined }) => void,
  ): Disposable;
  /**
   * Add a listener for changes to a given key path.
   */
  onDidChange<T extends keyof ConfigValues>(
    keyPath: T,
    options: { scope: string[] | ScopeDescriptor },
    callback: (values: { newValue: ConfigValues[T]; oldValue?: ConfigValues[T] | undefined }) => void,
  ): Disposable;

  // Managing Settings
  /** Retrieves the setting for the given key. */
  get<T extends keyof ConfigValues>(
    keyPath: T,
    options?: {
      sources?: string[] | undefined;
      excludeSources?: string[] | undefined;
      scope?: string[] | ScopeDescriptor | undefined;
    },
  ): ConfigValues[T];

  /**
   * Sets the value for a configuration setting.
   *
   * Unless the `source` option is specified, this value is stored in Atom's
   * internal configuration file.
   */
  set<T extends keyof ConfigValues>(
    keyPath: T,
    value: ConfigValues[T],
    options?: { scopeSelector?: string | undefined; source?: string | undefined },
  ): void;

  /** Restore the setting at `keyPath` to its default value. */
  unset(keyPath: string, options?: { scopeSelector?: string | undefined; source?: string | undefined }): void;

  /**
   * Get all of the values for the given key path, along with their associated
   * scope selector.
   */
  getAll<T extends keyof ConfigValues>(
    keyPath: T,
    options?: {
      sources?: string[] | undefined;
      excludeSources?: string[] | undefined;
      scope?: ScopeDescriptor | undefined;
    },
  ): Array<{ scopeDescriptor: ScopeDescriptor; value: ConfigValues[T] }>;

  /**
   * Get an Array of all of the source strings with which settings have been
   * added via {@link set}.
   */
  getSources(): string[];

  /**
   * Retrieve the schema for a specific key path.
   *
   * The schema will tell you what type the keyPath expects, and other metadata
   * about the config option.
   */
  getSchema(keyPath: string): ConfigSchema | null;

  /** Get the string path to the config file being used. */
  getUserConfigPath(): string;

  /**
   * Suppress calls to handler functions registered with {@link onDidChange}
   * and {@link observe} for the duration of `callback`.
   *
   * After `callback` executes, handlers will be called once if the value for
   * their key path has changed.
   */
  transact(callback: () => void): void;
}
