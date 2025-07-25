export interface DisposableLike {
  dispose(): void;
}

/** A handle to a resource that can be disposed. */
export class Disposable implements DisposableLike {
  /** Ensure that Object correctly implements the Disposable contract. */
  static isDisposable(object: object): boolean;

  /** Construct a Disposable. */
  constructor(disposableAction?: () => void);

  /** A callback which will be called within dispose(). */
  disposalAction?(): void;

  /**
   * Perform the disposal action, indicating that the resource associated with
   * this disposable is no longer needed.
   */
  dispose(): void;
}

/**
 * An object that aggregates multiple {@link Disposable} instances together
 * into a single disposable, so they can all be disposed as a group.
 */
export class CompositeDisposable implements DisposableLike {
  /** Construct an instance, optionally with one or more disposables. */
  constructor(...disposables: DisposableLike[]);

  /**
   * Dispose all disposables added to this composite disposable.
   *
   * If this object has already been disposed, this method has no effect.
   */
  dispose(): void;

  // Managing Disposables

  /**
   * Add disposables to be disposed when the composite is disposed.
   *
   * If this object has already been disposed, this method has no effect.
   */
  add(...disposables: DisposableLike[]): void;

  /** Remove a previously added disposable. */
  remove(disposable: DisposableLike): void;

  /** Alias of {@link remove}. */
  delete(disposable: DisposableLike): void;

  /**
   * Clear all disposables without disposing them.
   *
   * They will not be disposed by the next call to {@link dispose}.
   */
  clear(): void;
}

/**
 *  Utility class to be used when implementing event-based APIs that allows
 *  for handlers registered via {@link on} to be invoked with calls to
 *  {@link emit}.
 */
export class Emitter<
  OptionalEmissions = { [key: string]: any },
  RequiredEmissions = {}
> implements DisposableLike {
  /** Construct an emitter. */
  constructor();

  /** Clear out any existing subscribers. */
  clear(): void;

  /** Unsubscribe all handlers. */
  dispose(): boolean;

  // Event Subscription
  /** Registers a handler to be invoked whenever the given event is emitted. */
  on<T extends keyof OptionalEmissions>(
    eventName: T,
    handler: (value?: OptionalEmissions[T]) => void
  ): Disposable;

  /** Registers a handler to be invoked whenever the given event is emitted. */
  on<T extends keyof RequiredEmissions>(
    eventName: T,
    handler: (value: RequiredEmissions[T]) => void
  ): Disposable;

  /**
   *  Register the given handler function to be invoked the next time an event
   *  with the given name is emitted via ::emit.
   */
  once<T extends keyof OptionalEmissions>(
    eventName: T,
    handler: (value?: OptionalEmissions[T]) => void
  ): Disposable;

  /**
   *  Register the given handler function to be invoked the next time an event
   *  with the given name is emitted via ::emit.
   */
  once<T extends keyof RequiredEmissions>(
    eventName: T,
    handler: (value: RequiredEmissions[T]) => void
  ): Disposable;

  /**
   *  Register the given handler function to be invoked before all other
   *  handlers existing at the time of subscription whenever events by the
   *  given name are emitted via ::emit.
   */
  preempt<T extends keyof OptionalEmissions>(
    eventName: T,
    handler: (value?: OptionalEmissions[T]) => void,
  ): Disposable;

  /**
   *  Register the given handler function to be invoked before all other
   *  handlers existing at the time of subscription whenever events by the
   *  given name are emitted via ::emit.
   */
  preempt<T extends keyof RequiredEmissions>(
    eventName: T,
    handler: (value: RequiredEmissions[T]) => void,
  ): Disposable;

  // Event Emission

  /** Invoke the handlers registered via ::on for the given event name. */
  emit<T extends keyof OptionalEmissions>(
    eventName: T,
    value?: OptionalEmissions[T]
  ): void;

  /** Invoke the handlers registered via ::on for the given event name. */
  emit<T extends keyof RequiredEmissions>(
    eventName: T,
    value: RequiredEmissions[T]
  ): void;
}
