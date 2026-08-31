// Type-level tests for `status-bar/index.d.ts`.
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases use `@ts-expect-error`, which fails the build in BOTH
// directions: if the code stops erroring, tsc reports the directive as unused.
//
// Source of truth: `pulsar/packages/status-bar/lib/`, principally `main.js`
// (`provideStatusBar`), `status-bar-view.js`, and `tile.js`.

import type { StatusBar, Tile } from "atom/status-bar";

declare const statusBar: StatusBar;
declare const element: HTMLElement;

// ---------------------------------------------------------------------------
// Adding tiles
//
// A tile's item is anything `atom.views.getView` can resolve: a DOM element,
// or a model with a registered view provider.
// ---------------------------------------------------------------------------

statusBar.addLeftTile({ item: element, priority: 10 }) satisfies Tile;
statusBar.addRightTile({ item: element, priority: 10 }) satisfies Tile;

// A model object with a registered view works just as well as an element.
statusBar.addLeftTile({ item: { element }, priority: 0 }) satisfies Tile;

// `priority` is optional. When it is omitted, the tile is placed just past the
// end of the row it is joining — `addLeftTile` defaults to one more than the
// last left tile's priority, `addRightTile` to one more than the first right
// tile's (`status-bar-view.js:54, 75`).
statusBar.addLeftTile({ item: element }) satisfies Tile;
statusBar.addRightTile({ item: element }) satisfies Tile;

// @ts-expect-error a tile must have an item
statusBar.addLeftTile({ priority: 10 });

// ---------------------------------------------------------------------------
// Reading tiles back
// ---------------------------------------------------------------------------

statusBar.getLeftTiles() satisfies Tile[];
statusBar.getRightTiles() satisfies Tile[];

// ---------------------------------------------------------------------------
// A tile
//
// `destroy` removes the tile from its collection and pulls its view out of the
// DOM; there is no `isDestroyed` counterpart (`tile.js`).
// ---------------------------------------------------------------------------

declare const tile: Tile;

tile.getItem() satisfies object;
tile.getPriority() satisfies number;
tile.destroy();

// ---------------------------------------------------------------------------
// Turning off the built-in git tile
//
// The service hands out the git tile's own `destroy`, bound — it is how a
// package that renders its own VCS indicator suppresses the bundled one
// (`main.js:102`).
// ---------------------------------------------------------------------------

statusBar.disableGitInfoTile();
