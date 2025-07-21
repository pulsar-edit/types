import { Disposable } from "../index";

/** A notification to the user containing a message and type. */
export class Notification {
  constructor(type: "warning" | "info" | "success", message: string, options?: NotificationOptions);
  constructor(type: "fatal" | "error", message: string, options?: ErrorNotificationOptions);

  // Event Subscription
  /** Invoke the given callback when the notification is dismissed. */
  onDidDismiss(callback: (notification: Notification) => void): Disposable;

  /** Invoke the given callback when the notification is displayed. */
  onDidDisplay(callback: (notification: Notification) => void): Disposable;

  // Methods
  /** Returns the Notification's type. */
  getType(): string;

  /** Returns the Notification's message. */
  getMessage(): string;

  /** Returns the {@link Date} of the Notification's creation. */
  getTimestamp(): Date;

  /** Returns the Notification's detail, if present. */
  getDetail(): string | undefined;

  /**
   * Returns whether this notification is equal to another. Two notifications
   * are considered to be equal if their message, type, and detail are
   * equivalent.
   */
  isEqual(other: Notification): boolean

  /**
   * Dismisses the notification, removing it from the UI. Calling this
   * programmatically will call all callbacks added via onDidDismiss.
   */
  dismiss(): void;

  /** Whether the notification has been dismissed. */
  isDismissed(): boolean;

  /** Whether the notification is able to be dismissed. */
  isDismissable(): boolean;

  /** Whether the notification has been displayed. */
  wasDisplayed(): boolean;

  /**
   * Undocumented: sets whether this notification should be considered
   * displayed.
   */
  setDisplayed(displayed: boolean): void;

  /** Returns the name of the icon used in this notification. */
  getIcon(): string;

  /** Returns the options used when the notification was created. */
  getOptions(): NotificationOptions;
}

export interface NotificationOptions {
  buttons?:
  | Array<{
    className?: string | undefined;
    onDidClick?(event: MouseEvent): void;
    text?: string | undefined;
  }>
  | undefined;
  description?: string | undefined;
  detail?: string | undefined;
  dismissable?: boolean | undefined;
  icon?: string | undefined;
}

export interface ErrorNotificationOptions extends NotificationOptions {
  stack?: string | undefined;
}
