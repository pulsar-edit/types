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

// An arbitrary selector matches no known tag name, so `CommandTarget` falls
// through to its default and the target is only known to be an `EventTarget`.
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
// Union targets
// ---------------------------------------------------------------------------

// A caller that accepts either a selector or an element — a common shape for a
// package's own `registerCommand` helper — can pass the target straight
// through. `add` must not be overloaded on the _type_ of `target`, or nothing
// here resolves: TypeScript matches an argument against each overload whole
// rather than distributing the union across them, so a `string | HTMLElement`
// would satisfy neither a string-shaped nor a node-shaped signature.
declare const unionTarget: string | HTMLElement;
declare const commandName: string;

atom.commands.add(unionTarget, commandName, (event) => {
  event.currentTarget satisfies EventTarget;
}) satisfies Disposable;

atom.commands.add(unionTarget, {
  [commandName]: (event) => event.currentTarget satisfies EventTarget,
}) satisfies CompositeDisposable;

atom.commands.add(unionTarget, {
  [commandName]: { didDispatch: (event) => event.currentTarget satisfies EventTarget },
}) satisfies CompositeDisposable;

// A union of two element types resolves to the union, not to `EventTarget`.
declare const elementUnion: HTMLDivElement | HTMLInputElement;
atom.commands.add(elementUnion, "my-package:run", (event) => {
  event.currentTarget satisfies HTMLDivElement | HTMLInputElement;
});

// Asserted against `HTMLInputElement` rather than `HTMLDivElement`: the latter
// adds only the deprecated `align` to `HTMLElement`, which `HTMLInputElement`
// also has, so a div/input union is structurally assignable to `HTMLDivElement`
// and the negative case would never fail.
atom.commands.add(elementUnion, "my-package:run", (event) => {
  // @ts-expect-error either half of the union may show up
  event.currentTarget satisfies HTMLInputElement;
});

// A bare `string` says nothing about the element, even though some strings
// (`"div"`) would.
declare const selector: string;
atom.commands.add(selector, "my-package:run", (event) => {
  event.currentTarget satisfies EventTarget;
});

atom.commands.add(selector, "my-package:run", (event) => {
  // @ts-expect-error a `string` of unknown content is not a known tag name
  event.currentTarget satisfies HTMLDivElement;
});

// The listener parameter is contravariant, so a listener annotated for a
// specific element is correctly rejected for a target that may not be one.
// The directive sits above the call, not above the argument: an overload
// mismatch is reported at the call head.
// @ts-expect-error the target may be an arbitrary selector
atom.commands.add(
  unionTarget,
  "my-package:run",
  (event: CommandEvent<HTMLInputElement>) => event.currentTarget,
);

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
