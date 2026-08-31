// Type-level tests for `src/atom-environment.d.ts`.
//
// These exercise the `atom` global itself, which `index.d.ts` declares — so
// they also cover that global declaration reaching consumers.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import type {
  Config,
  Disposable,
  ExceptionThrownEvent,
  PreventableExceptionThrownEvent,
  TimingMarker,
  UI,
  Workspace,
  WindowLoadSettings,
  BrowserWindow,
} from "../../index";

// ---------------------------------------------------------------------------
// The global and its sub-managers
// ---------------------------------------------------------------------------

atom.workspace satisfies Workspace;
atom.config satisfies Config;
atom.ui satisfies UI;

// The managers are readonly.
// @ts-expect-error `workspace` cannot be reassigned
atom.workspace = atom.workspace;

// ---------------------------------------------------------------------------
// Event subscriptions
// ---------------------------------------------------------------------------

[
  atom.onDidBeep(() => {}),
  atom.onWillThrowError((event: PreventableExceptionThrownEvent) => {
    event.originalError satisfies Error;
    event.message satisfies string;
    event.line satisfies number;
    // Only the preventable event can be cancelled.
    event.preventDefault();
  }),
  atom.onDidThrowError((event: ExceptionThrownEvent) => [event.url, event.column]),
  atom.whenShellEnvironmentLoaded(() => {}),
] satisfies Disposable[];

atom.onDidThrowError((event) => {
  // @ts-expect-error the plain thrown-error event is not preventable
  event.preventDefault();
});

// ---------------------------------------------------------------------------
// Atom details
// ---------------------------------------------------------------------------

atom.inDevMode() satisfies boolean;
atom.inSafeMode() satisfies boolean;
atom.inSpecMode() satisfies boolean;
atom.isReleasedVersion() satisfies boolean;
atom.getAppName() satisfies string;
atom.getVersion() satisfies string;
atom.getConfigDirPath() satisfies string;
atom.getWindowLoadTime() satisfies number;
atom.getStartupMarkers() satisfies TimingMarker[];
atom.getLoadSettings() satisfies WindowLoadSettings;

atom.getReleaseChannel() satisfies "dev" | "nightly" | "beta" | "stable";

// @ts-expect-error the release channel is not narrowed to a single value
atom.getReleaseChannel() satisfies "stable";

// ---------------------------------------------------------------------------
// Managing the window
// ---------------------------------------------------------------------------

atom.open();
atom.open({ pathsToOpen: ["/tmp/a.txt"], newWindow: true, devMode: false, safeMode: false });

// Every key is optional: an empty new window is a valid request.
atom.open({ newWindow: true });

// @ts-expect-error unknown option
atom.open({ pathsToOpen: ["/tmp/a.txt"], reuseWindow: true });

atom.getSize() satisfies { width: number; height: number };
atom.setSize(800, 600);
atom.getPosition() satisfies { x: number; y: number };
atom.setPosition(0, 0);
atom.getWindowDimensions() satisfies { x: number; y: number; width: number; height: number };
atom.setWindowDimensions({ width: 1024 });
atom.setWindowDimensions({ x: 0, y: 0, width: 1024, height: 768 }) satisfies Promise<object>;

atom.isMaximized() satisfies boolean;
atom.isFullScreen() satisfies boolean;
atom.setFullScreen(true);
atom.toggleFullScreen();
atom.displayWindow() satisfies Promise<undefined>;

// The folder picker hands back `null` when the user cancels.
atom.pickFolder((paths: string[] | null) => paths?.length);

atom.getCurrentWindow() satisfies BrowserWindow;
atom.openDevTools() satisfies Promise<null>;
atom.toggleDevTools() satisfies Promise<null>;
atom.executeJavaScriptInDevTools("1 + 1");

// ---------------------------------------------------------------------------
// confirm()
//
// Three distinct forms with three distinct return types. See
// `Workspace#confirm` in Pulsar: the sync form returns the chosen button's
// index for array buttons, or the chosen callback's return value for a
// label→callback map; the async form returns nothing.
// ---------------------------------------------------------------------------

// Sync, array buttons: the index of the chosen button.
atom.confirm({ message: "Save?", buttons: ["Yes", "No"] }) satisfies number;
atom.confirm({ message: "Save?", detailedMessage: "Be honest." }) satisfies number;

// Sync, label→callback map: whatever the chosen callback returns, or
// `undefined` when the chosen label has no function.
atom.confirm({ message: "Save?", buttons: { Yes: () => {}, No: () => {} } }) satisfies void | undefined;
atom.confirm({ message: "Save?", buttons: { Yes: () => 1, No: () => 2 } }) satisfies number | undefined;
atom.confirm({ message: "Save?", buttons: { Yes: () => "y" } }) satisfies string | undefined;

// @ts-expect-error the map form returns the callback's value, not an index
atom.confirm({ message: "Save?", buttons: { Yes: () => {} } }) satisfies number;

// Async: the response arrives through the callback.
atom.confirm({ message: "Save?", buttons: ["Yes", "No"] }, (response, checkboxChecked) => {
  response satisfies number;
  checkboxChecked satisfies boolean;
}) satisfies void;

// The async form takes the full Electron option set.
atom.confirm(
  {
    type: "question",
    title: "Unsaved Changes",
    message: "Save before closing?",
    detail: "Your changes will be lost.",
    buttons: ["Save", "Discard", "Cancel"],
    defaultId: 0,
    cancelId: 2,
    checkboxLabel: "Don't ask again",
    checkboxChecked: false,
    noLink: true,
    normalizeAccessKeys: true,
  },
  () => {}
);

// @ts-expect-error 'warn' is not a dialog type
atom.confirm({ type: "warn", message: "Save?" }, () => {});
