import { Disposable } from "../index";

/** Run a node script in a separate process. */
export class Task {
  /** A helper method to easily launch and run a task once. */
  static once(taskPath: string, ...args: any[]): Task;

  /** Creates a task. You should probably use .once */
  constructor(taskPath: string);

  /**
   * Starts the task.
   *
   * Throws an error if this task has already been terminated or if sending a
   * message to the child process fails.
   */
  start(...args: any[]): void;

  /**
   * Sends a message to the task.
   *
   * Throws an error if this task has already been terminated or if sending a
   * message to the child process fails.
   */
  send(message: string | number | boolean | object | null | any[]): void;

  /** Call a function when an event is emitted by the child process. */
  on(eventName: string, callback: (param: any) => void): Disposable;

  /**
   * Forcefully stop the running task.
   * No more events are emitted once this method is called.
   */
  terminate(): void;

  /** Cancel the running task and emit an event if it was canceled. */
  cancel(): boolean;
}
