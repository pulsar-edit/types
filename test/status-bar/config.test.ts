// Type-level tests for `status-bar/config.d.ts`.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.
//
// IMPORTANT: `ConfigValues` must be reached through `"atom"` rather than a
// relative path — the `declare module "atom"` blocks only merge when the
// specifier resolves that way, which is what the `paths` alias in
// `test/tsconfig.json` arranges. Imported relatively, `ConfigValues` stays
// empty and every assertion here degrades silently to `any`.
//
// status-bar is a bundled package, so the root `index.d.ts` references its
// `config.d.ts` directly and these keys arrive from `"atom"` alone — this file
// deliberately imports nothing from `atom/status-bar`.
//
// Source of truth: the `configSchema` block in
// `pulsar/packages/status-bar/package.json`.

import type { ConfigValues, KnownKeys } from "atom";

// ---------------------------------------------------------------------------
// The augmentation actually merged
//
// If the `declare module "atom"` block failed to apply, these keys would fall
// through to `ConfigValues`' `[key: string]: any` index signature and every
// value assertion below would pass vacuously — so pin membership first.
// ---------------------------------------------------------------------------

"status-bar.isVisible" satisfies KnownKeys<ConfigValues>;
"status-bar.fullWidth" satisfies KnownKeys<ConfigValues>;
"status-bar.cursorPositionFormat" satisfies KnownKeys<ConfigValues>;
"status-bar.selectionCountFormat" satisfies KnownKeys<ConfigValues>;

// @ts-expect-error a key the package does not declare is not a known key
"status-bar.thisKeyDoesNotExist" satisfies KnownKeys<ConfigValues>;

// ---------------------------------------------------------------------------
// Value types
//
// The schema has exactly these four settings and no enums, so there is no
// union to drift out of sync.
// ---------------------------------------------------------------------------

atom.config.get("status-bar.isVisible") satisfies boolean;
atom.config.get("status-bar.fullWidth") satisfies boolean;

// Format strings, where `%L` is the line number/count and `%C` the column or
// character count — free-form text, not a union.
atom.config.get("status-bar.cursorPositionFormat") satisfies string;
atom.config.get("status-bar.selectionCountFormat") satisfies string;

// @ts-expect-error `isVisible` is a boolean, not a string
atom.config.get("status-bar.isVisible") satisfies string;
