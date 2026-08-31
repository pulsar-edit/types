// Type-level tests for `src/config.d.ts`.
//
// These import from `atom` rather than by relative path, because that is how
// consumers resolve this package (see the README) and the only way the
// `declare module "atom"` blocks that populate `ConfigValues` merge in.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.

import type {
  ConfigSchema,
  ConfigValues,
  Disposable,
  KnownKeys,
  ScopeDescriptor,
} from "atom";

declare const scope: ScopeDescriptor;

// ---------------------------------------------------------------------------
// Packages extend `ConfigValues` with their own keys
//
// This is the mechanism a package uses to type its own settings. Without the
// augmentation below, `"my-package.enabled"` would be rejected everywhere.
// ---------------------------------------------------------------------------

declare module "atom" {
  interface ConfigValues {
    "my-package.enabled": boolean;
    "my-package.threshold": number;
    "my-package.mode": "fast" | "thorough";
  }
}

// Built-in keys and package keys are both present.
atom.config.get("core.ignoredNames") satisfies string[];
atom.config.get("my-package.enabled") satisfies boolean;

// ---------------------------------------------------------------------------
// `get` — the value type follows from the key
// ---------------------------------------------------------------------------

atom.config.get("editor.fontSize") satisfies number;
atom.config.get("core.followSymlinks") satisfies boolean;
atom.config.get("my-package.mode") satisfies "fast" | "thorough";

atom.config.get("editor.fontSize", { scope }) satisfies number;
atom.config.get("editor.fontSize", { scope: [".source.js"] }) satisfies number;
atom.config.get("editor.fontSize", {
  sources: ["user"],
  excludeSources: ["project"],
}) satisfies number;

// `ConfigValues` ends with an `[key: string]: any` index signature, so keys
// this package hasn't typed — another package's settings, or a typo — are
// accepted and come back as `any`.
atom.config.get("some-other-package.setting") satisfies unknown;
atom.config.get("my-package.enabld") satisfies string;

// @ts-expect-error the value type comes from the key
atom.config.get("my-package.enabled") satisfies string;

// @ts-expect-error `mode` is a closed union
atom.config.get("my-package.mode") satisfies "medium";

// ---------------------------------------------------------------------------
// `KnownKeys` — the declared keys, ignoring the index signature
//
// This is what lets an explicit type argument reach the value overload: a bare
// `string` is not a known key, so it cannot bind the key type parameter.
// ---------------------------------------------------------------------------

"core.ignoredNames" satisfies KnownKeys<ConfigValues>;
"my-package.enabled" satisfies KnownKeys<ConfigValues>;

// @ts-expect-error an arbitrary key path is not a declared key
"some-other-package.setting" satisfies KnownKeys<ConfigValues>;

declare const anyKey: string;

// @ts-expect-error the index signature must not widen the key union to `string`
anyKey satisfies KnownKeys<ConfigValues>;

// ---------------------------------------------------------------------------
// Overriding the inferred type at the call site
//
// For a key this package hasn't typed, the value type can be asserted with an
// explicit type argument instead of settling for `any`.
// ---------------------------------------------------------------------------

atom.config.get<string[]>("some-other-package.paths") satisfies string[];
atom.config.get<string>("some-other-package.name") satisfies string;
atom.config.get<number>("some-other-package.count") satisfies number;

// The override really applies — a plain `string` argument used to be swallowed
// by the key overload and come back as `any`.
// @ts-expect-error the explicit type is `string`, not `number`
atom.config.get<string>("some-other-package.name") satisfies number;

// @ts-expect-error the explicit type is `string[]`
atom.config.get<string[]>("some-other-package.paths") satisfies number;

// An explicit type also overrides a declared key's own type.
atom.config.get<string>("my-package.threshold") satisfies string;

// Without a type argument, an undeclared key is still `any`.
atom.config.get("some-other-package.setting") satisfies number;

// `getAll` behaves the same way.
atom.config.getAll<string[]>("some-other-package.paths") satisfies Array<{
  scopeDescriptor: ScopeDescriptor;
  value: string[];
}>;

// @ts-expect-error the asserted value type is `string[]`
atom.config.getAll<string[]>("some-other-package.paths") satisfies Array<{
  scopeDescriptor: ScopeDescriptor;
  value: number;
}>;

// ---------------------------------------------------------------------------
// `set` — the value must match the key's type
// ---------------------------------------------------------------------------

atom.config.set("my-package.enabled", true);
atom.config.set("my-package.threshold", 10);
atom.config.set("my-package.mode", "thorough");
atom.config.set("my-package.enabled", false, { scopeSelector: ".source.js", source: "my-package" });

// @ts-expect-error a boolean setting takes a boolean
atom.config.set("my-package.enabled", "yes");

// @ts-expect-error 'medium' is not one of the declared modes
atom.config.set("my-package.mode", "medium");

// An untyped key accepts any value, by way of the same index signature.
atom.config.set("some-other-package.setting", 1);

// `unset` takes any key path, since it can clear keys this package never typed.
atom.config.unset("my-package.enabled");
atom.config.unset("my-package.enabled", { scopeSelector: ".source.js" });

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

[
  atom.config.observe("my-package.threshold", (value: number) => value),
  atom.config.observe("my-package.mode", { scope }, (value: "fast" | "thorough") => value),
  atom.config.observe("editor.fontSize", { scope: [".source.js"] }, (value: number) => value),

  // The keyless form reports every change, so its value type is unconstrained.
  atom.config.onDidChange((values) => [values.newValue, values.oldValue]),
  atom.config.onDidChange<number>((values) => values.newValue satisfies number),

  // The keyed forms narrow to the key's type — and the old value may be absent
  // the first time a setting is written.
  atom.config.onDidChange("my-package.threshold", (values) => {
    values.newValue satisfies number;
    values.oldValue satisfies number | undefined;
  }),
  atom.config.onDidChange("my-package.mode", { scope }, (values) => {
    values.newValue satisfies "fast" | "thorough";
  }),
] satisfies Disposable[];

// @ts-expect-error the observed value has the key's type
atom.config.observe("my-package.enabled", (value: string) => value);

// @ts-expect-error the previous value may be undefined
atom.config.onDidChange("my-package.threshold", (values) => values.oldValue satisfies number);

// ---------------------------------------------------------------------------
// Reading settings in bulk
// ---------------------------------------------------------------------------

atom.config.getAll("my-package.threshold") satisfies Array<{
  scopeDescriptor: ScopeDescriptor;
  value: number;
}>;
atom.config.getAll("my-package.threshold", { scope, sources: ["user"] });
atom.config.getSources() satisfies string[];
atom.config.getUserConfigPath() satisfies string;
atom.config.transact(() => {});

// ---------------------------------------------------------------------------
// Schemas
//
// `getSchema` returns `null` for a key path with no schema, and the schema
// itself is a discriminated union keyed on `type`.
// ---------------------------------------------------------------------------

atom.config.getSchema("my-package.threshold") satisfies ConfigSchema | null;

// @ts-expect-error the key path may have no schema
atom.config.getSchema("my-package.threshold") satisfies ConfigSchema;

const schema = atom.config.getSchema("my-package.threshold");
if (schema !== null && schema.type === "integer") {
  schema.minimum satisfies number | undefined;
  schema.maximum satisfies number | undefined;
  schema.default satisfies number | undefined;

  // @ts-expect-error only object schemas have properties
  schema.properties;
}

// Each schema variant carries the fields appropriate to its type.
({ type: "integer", default: 1, minimum: 0, maximum: 10 }) satisfies ConfigSchema;
({ type: "number", default: 1.5, title: "Ratio" }) satisfies ConfigSchema;
({ type: "boolean", default: true, description: "Whether to do the thing" }) satisfies ConfigSchema;
({ type: "string", default: "x" }) satisfies ConfigSchema;
({ type: "color", default: "#ff0000" }) satisfies ConfigSchema;
({ type: "array", items: { type: "string" } }) satisfies ConfigSchema;
({ type: "object", properties: { nested: { type: "boolean", default: false } } }) satisfies ConfigSchema;

// @ts-expect-error an array schema must say what it holds
({ type: "array", default: [] }) satisfies ConfigSchema;

// @ts-expect-error an object schema must declare its properties
({ type: "object" }) satisfies ConfigSchema;

// @ts-expect-error 'enum' is not a schema type
({ type: "enum", default: "a" }) satisfies ConfigSchema;

// @ts-expect-error a boolean setting's default is a boolean
({ type: "boolean", default: "true" }) satisfies ConfigSchema;

// The exported `ConfigValues` is the same interface the augmentation extends.
declare const threshold: ConfigValues["my-package.threshold"];
threshold satisfies number;
