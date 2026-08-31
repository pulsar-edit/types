// Type-level tests for `src/command-registry.d.ts`.
//
// Imported from `atom` so the `HTMLElementTagNameMap` augmentation in
// `index.d.ts` — which maps `atom-text-editor` to `TextEditorElement` — is in
// play, since that is what gives selector-based listeners their element types.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import type {
  CommandEvent,
  CommandRegistryListener,
  CompositeDisposable,
  Disposable,
  TextEditorElement,
} from "atom";

const element = document.createElement("div");
const input = document.createElement("input");

// ---------------------------------------------------------------------------
// Selector targets: the element type follows from the selector
// ---------------------------------------------------------------------------

atom.commands.add("atom-text-editor", "my-package:run", (event) => {
  event.currentTarget satisfies TextEditorElement;
  event.currentTarget.getModel().getText() satisfies string;
}) satisfies Disposable;

atom.commands.add("div", "my-package:run", (event) => {
  event.currentTarget satisfies HTMLDivElement;
}) satisfies Disposable;

// An arbitrary selector is still a key of the target map, by way of its index
// signature — so the target is only known to be an `EventTarget`.
atom.commands.add(".my-package-panel", "my-package:run", (event) => {
  event.currentTarget satisfies EventTarget;
});

atom.commands.add(".my-package-panel", "my-package:run", (event) => {
  // @ts-expect-error an arbitrary selector says nothing about the element type
  event.currentTarget satisfies HTMLDivElement;
});

atom.commands.add("atom-text-editor", "my-package:run", (event) => {
  // @ts-expect-error a text editor element is not a div
  event.currentTarget satisfies HTMLDivElement;
});

// ---------------------------------------------------------------------------
// Node targets: the element's own type carries through
// ---------------------------------------------------------------------------

atom.commands.add(element, "my-package:run", (event) => {
  event.currentTarget satisfies HTMLDivElement;
}) satisfies Disposable;

atom.commands.add(input, "my-package:run", (event) => {
  event.currentTarget.value satisfies string;
});

// @ts-expect-error a div has no `value`
atom.commands.add(element, "my-package:run", (event) => event.currentTarget.value);

// ---------------------------------------------------------------------------
// The command event
// ---------------------------------------------------------------------------

atom.commands.add("div", "my-package:run", (event: CommandEvent<HTMLDivElement>) => {
  event.currentTarget satisfies HTMLDivElement;
  event.keyBindingAborted satisfies boolean;
  event.propagationStopped satisfies boolean;
  event.abortKeyBinding();
  event.stopPropagation() satisfies CustomEvent;
  event.stopImmediatePropagation() satisfies CustomEvent;

  // Inherited from CustomEvent/Event.
  event.detail satisfies unknown;
  event.type satisfies string;
  event.preventDefault();
});

// A listener may go asynchronous.
atom.commands.add("div", "my-package:run", async () => {
  await Promise.resolve();
});

// ---------------------------------------------------------------------------
// Object-form listeners
// ---------------------------------------------------------------------------

atom.commands.add("atom-text-editor", "my-package:run", {
  didDispatch(event) {
    event.currentTarget satisfies TextEditorElement;
  },
  displayName: "My Package: Run",
  description: "Runs the thing",
  hiddenInCommandPalette: false,
}) satisfies Disposable;

atom.commands.add("div", "my-package:run", {
  async didDispatch() {
    await Promise.resolve();
  },
});

// @ts-expect-error an object listener must implement `didDispatch`
atom.commands.add("div", "my-package:run", { displayName: "My Package: Run" });

// @ts-expect-error unknown listener property
atom.commands.add("div", "my-package:run", {
  didDispatch: () => {},
  hidden: true,
});

// A listener can be built ahead of time and reused.
const listener: CommandRegistryListener<HTMLDivElement> = {
  didDispatch(event) {
    event.currentTarget satisfies HTMLDivElement;
  },
};
atom.commands.add("div", "my-package:run", listener);

// ---------------------------------------------------------------------------
// Registering several commands at once
// ---------------------------------------------------------------------------

atom.commands.add("atom-text-editor", {
  "my-package:run": (event) => event.currentTarget satisfies TextEditorElement,
  "my-package:stop": { didDispatch: () => {}, displayName: "My Package: Stop" },
}) satisfies CompositeDisposable;

atom.commands.add(element, {
  "my-package:run": (event) => event.currentTarget satisfies HTMLDivElement,
}) satisfies CompositeDisposable;

atom.commands.add(".my-package-panel", {
  "my-package:run": (event) => event.currentTarget satisfies EventTarget,
}) satisfies CompositeDisposable;

// ---------------------------------------------------------------------------
// Querying and dispatching
// ---------------------------------------------------------------------------

atom.commands.findCommands({ target: element }) satisfies Array<{
  name: string;
  displayName: string;
  description?: string | undefined;
  tags?: string[] | undefined;
}>;
atom.commands.findCommands({ target: "atom-text-editor" });

// `dispatch` returns `null` when nothing handled the command.
atom.commands.dispatch(element, "my-package:run") satisfies Promise<void> | null;

// @ts-expect-error the dispatch may not have been handled
atom.commands.dispatch(element, "my-package:run") satisfies Promise<void>;

// A command may be dispatched with a `detail` payload, which arrives on the
// event.
atom.commands.dispatch(element, "my-package:run", { reason: "test" });

// The `throwOnInvalidSelector` flag suppresses errors for selectors that are
// not yet valid.
atom.commands.add(".my-package-panel", "my-package:run", () => {}, false);
atom.commands.add(".my-package-panel", { "my-package:run": () => {} }, false);

[
  atom.commands.onWillDispatch((event: CommandEvent) => event.currentTarget satisfies EventTarget),
  atom.commands.onDidDispatch((event: CommandEvent) => event.type satisfies string),
] satisfies Disposable[];
