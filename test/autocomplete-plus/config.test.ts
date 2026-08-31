// Type-level tests for `autocomplete-plus/config.d.ts`.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.
//
// IMPORTANT: `ConfigValues` must be reached through `"atom"` rather than a
// relative path. The `declare module "atom"` blocks only merge when the
// specifier resolves that way, which is what the `paths` alias in
// `test/tsconfig.json` arranges. Imported relatively, `ConfigValues` stays
// empty and every assertion here degrades silently to `any`.
//
// Note that this file deliberately imports nothing from
// `atom/autocomplete-plus`. autocomplete-plus is a bundled package, so the
// root `index.d.ts` references its `config.d.ts` directly and a consumer gets
// these keys from `"atom"` alone. Community packages' keys stay opt-in behind
// their own entry points; `linter`'s tests import `atom/linter` for that
// reason, and the contrast is the point.
//
// Source of truth: the `configSchema` block in
// `pulsar/packages/autocomplete-plus/package.json`.

import type { ConfigValues, KnownKeys } from "atom";

// ---------------------------------------------------------------------------
// The augmentation actually merged
//
// If the `declare module "atom"` block failed to apply, `KnownKeys` would be
// `never` and every assertion in this file would pass vacuously — so pin one
// key first as a canary.
// ---------------------------------------------------------------------------

"autocomplete-plus.enableAutoActivation" satisfies KnownKeys<ConfigValues>;

// @ts-expect-error a key no package declares is not a known key
"autocomplete-plus.thisKeyDoesNotExist" satisfies KnownKeys<ConfigValues>;

// ---------------------------------------------------------------------------
// Value types
//
// `integer` in the schema is a `number` here; there is no narrower TS type for
// it, and the config system does not enforce integrality on read.
// ---------------------------------------------------------------------------

atom.config.get("autocomplete-plus.enableAutoActivation") satisfies boolean;
atom.config.get("autocomplete-plus.autoActivationDelay") satisfies number;
atom.config.get("autocomplete-plus.maxVisibleSuggestions") satisfies number;
atom.config.get("autocomplete-plus.useCoreMovementCommands") satisfies boolean;
atom.config.get("autocomplete-plus.fileBlacklist") satisfies string[];
atom.config.get("autocomplete-plus.scopeBlacklist") satisfies string[];
atom.config.get("autocomplete-plus.includeCompletionsFromAllBuffers") satisfies boolean;
atom.config.get("autocomplete-plus.strictMatching") satisfies boolean;
atom.config.get("autocomplete-plus.minimumWordLength") satisfies number;
atom.config.get("autocomplete-plus.enableBuiltinProvider") satisfies boolean;
atom.config.get("autocomplete-plus.builtinProviderBlacklist") satisfies string;
atom.config.get("autocomplete-plus.backspaceTriggersAutocomplete") satisfies boolean;
atom.config.get("autocomplete-plus.enableAutoConfirmSingleSuggestion") satisfies boolean;
atom.config.get("autocomplete-plus.suppressActivationForEditorClasses") satisfies string[];
atom.config.get("autocomplete-plus.consumeSuffix") satisfies boolean;
atom.config.get("autocomplete-plus.useLocalityBonus") satisfies boolean;
atom.config.get("autocomplete-plus.enableExtendedUnicodeSupport") satisfies boolean;

// ---------------------------------------------------------------------------
// Enum-valued settings
//
// Asserting in this direction — literal assignable to the declared type —
// catches a union that is missing a member. The reverse (`get(...) satisfies
// <wide union>`) would pass vacuously, since a narrower union is always
// assignable to a wider one.
// ---------------------------------------------------------------------------

"tab" satisfies ConfigValues["autocomplete-plus.confirmCompletion"];
"enter" satisfies ConfigValues["autocomplete-plus.confirmCompletion"];
"tab and enter" satisfies ConfigValues["autocomplete-plus.confirmCompletion"];
"tab always, enter when suggestion explicitly selected" satisfies ConfigValues["autocomplete-plus.confirmCompletion"];

// The schema's enum has a fifth value, which turns off confirmation entirely.
"none" satisfies ConfigValues["autocomplete-plus.confirmCompletion"];

// @ts-expect-error not one of the confirmation keystrokes
"space" satisfies ConfigValues["autocomplete-plus.confirmCompletion"];

"Word" satisfies ConfigValues["autocomplete-plus.suggestionListFollows"];
"Cursor" satisfies ConfigValues["autocomplete-plus.suggestionListFollows"];

// @ts-expect-error the schema capitalises these
"word" satisfies ConfigValues["autocomplete-plus.suggestionListFollows"];

"none" satisfies ConfigValues["autocomplete-plus.similarSuggestionRemoval"];
"textOrSnippet" satisfies ConfigValues["autocomplete-plus.similarSuggestionRemoval"];

// ---------------------------------------------------------------------------
// Settings the package reads but the declarations omit
// ---------------------------------------------------------------------------

// Read in `lib/autocomplete-manager.js:401`.
"autocomplete-plus.firstCharacterMustMatch" satisfies KnownKeys<ConfigValues>;
atom.config.get("autocomplete-plus.firstCharacterMustMatch") satisfies boolean;

// Read in `lib/get-additional-word-characters.js:6`, scope-aware.
"autocomplete-plus.extraWordCharacters" satisfies KnownKeys<ConfigValues>;
atom.config.get("autocomplete-plus.extraWordCharacters") satisfies string;

// Observed in `lib/suggestion-list-element.js:83`.
"autocomplete-plus.moveToCancel" satisfies KnownKeys<ConfigValues>;
atom.config.get("autocomplete-plus.moveToCancel") satisfies boolean;

// ---------------------------------------------------------------------------
// Settings the declarations invent
//
// Neither key appears in the package's `configSchema`, and neither is read
// anywhere in `lib/`. Both were real in older autocomplete-plus releases and
// have since been removed.
// ---------------------------------------------------------------------------

// @ts-expect-error `defaultProvider` is no longer a setting
"autocomplete-plus.defaultProvider" satisfies KnownKeys<ConfigValues>;

// @ts-expect-error `useAlternateScoring` is no longer a setting
"autocomplete-plus.useAlternateScoring" satisfies KnownKeys<ConfigValues>;
