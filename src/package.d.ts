import { Disposable } from "../index";

/**
 * Loads and activates a package's main module and resources such as
 * stylesheets, keymaps, grammar, editor properties, and menus.
 */
export interface Package {
  /** The name of the package. */
  readonly name: string;

  /** The path to the package on disk. */
  readonly path: string;

  // Event Subscription
  /** Invoke the given callback when all packages have been activated. */
  onDidDeactivate(callback: () => void): Disposable;

  // Native Module Compatibility
  /**
   * Returns whether all native modules depended on by this package are
   * correctly compiled against the current version of Pulsar.
   */
  isCompatible(): boolean;

  /**
   * Rebuild native modules in this package's dependencies for the current
   * version of Pulsar.
   */
  rebuild(): Promise<{ code: number; stdout: string; stderr: string }>;

  /** If a previous rebuild failed, get the contents of stderr. */
  getBuildFailureOutput(): string | null;
}
