# @pulsar-edit/types

Type definitions for the [Pulsar API](https://docs.pulsar-edit.dev/api/pulsar/latest/).

Also includes some type definitions from notable builtin and community packages:

* `autocomplete-plus`
* `status-bar`
* `tool-bar`
* `linter`
* `atom-i18n`

Migrated from [@types/atom](https://www.npmjs.com/package/@types/atom) and updated to reflect new and changed APIs in Pulsar.

Install these types under `devDependencies` if you’re writing a community package in TypeScript (or even in JavaScript if you want better autocompletion and inline documentation).

## Usage

### Quick (with some sorcery)

Install this package as a `devDependency` and tell it to **pretend** to be `@types/atom`:

```shell
npm install -D @types/atom@github:pulsar-edit/types
```

This will

* install this package at `./node_modules/@types/atom`, thus giving it all of the built-in privileges of `@types/` packages in the TypeScript environment;
* make this package’s declarations ambiently available — for instance, the `atom` global;
* make it so you can import from `atom` — or, for the ancillary types, from `atom/autocomplete-plus`, `atom/linter`, and so on.

### Special cases

#### Transitive dependencies

If you depend on something that’s still trying to import `@types/atom` directly, the packages’ ambient declarations will conflict. (`atom-ide-base` and `atom-jasmine3-test-runner` are notable examples.)

If you’re using `npm`, this can be fixed via [the `overrides` section in `package.json`](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides). You can specify that any references to `@types/atom`, no matter the depth, should be fulfilled by this package instead:

```json
{
  "overrides": {
    "@types/atom": "github:pulsar-edit/types"
  }
}
```

[Yarn](https://yarnpkg.com/) can do a similar thing with its [`resolutions` property](https://yarnpkg.com/configuration/manifest#resolutions). Ultimately, anything that puts this package at `./node_modules/@types/atom` within the project will suffice.

### Less sorcery

If, for whatever reason, you don’t want to do what’s described above, you can achieve a similar effect solely via `tsconfig.json`.

#### Path remapping

```json
{
  "compilerOptions": {
    "paths": {
      "atom": ["./node_modules/@pulsar-edit/types"]
    }
  }
}
```

The [`paths` entry](https://www.typescriptlang.org/tsconfig/#paths) for `atom` tells TypeScript that all references to `atom` in import specifiers can be resolved at the given location on disk.

This is fine because we don’t ever install an `atom` package. During development, references to `atom` will be resolved using these type definitions; at runtime, references to `atom` will be magically resolved by Pulsar.

#### Visibility

One drawback with this approach is that you don’t get _automatic_ “visibility” of this package, meaning its ambient declarations aren’t necessarily present. (Whereas `@types/atom` is automatically visible using TypeScript’s default settings, since it’s a `@types/` package.)

For instance, suppose this is your entire source code:

```ts
function activate() {
  atom.beep();
//^^^^ Cannot find name 'atom'.
}
```

This will fix itself once you import something…

```ts
import { TextEditor } from 'atom';

function activate() {
  atom.beep();
}
```

…or if you toss in a triple-slash directive. (The directive doesn’t follow our remapped path, so you must use the unaliased name of the package.)

```ts
/// <reference types="@pulsar-edit/types" />

function activate() {
  atom.beep();
}
```

You could also fix this via your `tsconfig.json`…

```json
"compilerOptions": {
  "types": ["@pulsar-edit/types"],
  "paths": {
    "atom": ["./node_modules/@pulsar-edit/types"]
  }
}
```

…but, in doing so, you opt out of the automatic visibility of `@types/` packages, thus obligating you to reference them all manually. See the `tsconfig.json` documentation for [`types`](https://www.typescriptlang.org/tsconfig/#types) and [`typeRoots`](https://www.typescriptlang.org/tsconfig/#typeRoots) for more information.


#### Ancillary types

This `tsconfig.json`-only approach doesn’t give you the ancillary types from various packages…

```ts
import type { AnySuggestion } from 'atom/autocomplete-plus';
//            ^^^^^^^^^^^^^ Cannot find name `AnySuggestion`.
```

…but that’s fine. In this example, `atom/autocomplete-plus` isn’t a valid import specifier at runtime, so you’d only ever use that syntax to import types. Hence you can instead just import directly from `@pulsar-edit/types`:

```ts
import type { AnySuggestion } from '@pulsar-edit/types/autocomplete-plus';
```

Still, if you _really_ wanted to make this example available at `atom/autocomplete-plus`, you could add that import specifier to your `tsconfig.json` as well:

```json
{
  "compilerOptions": {
    "paths": {
      "atom": ["./node_modules/@pulsar-edit/types"],
      "atom/autocomplete-plus": [
        "./node_modules/@pulsar-edit/types/autocomplete-plus"
      ]
    }
  }
}
```


## Questions

### Why isn’t this at `@types/pulsar-edit` or something?

Because Pulsar isn’t delivered as an NPM package. I’m not sure how or why Atom’s API was ever available at `@types/atom`, considering that the NPM package called `atom` has nothing to do with the Atom editor.

### Why not just update `@types/atom`?

We might eventually do that, but this is a suitable workaround for now and frees us from having to negotiate the politics of adopting an orphaned `DefinitelyTyped` package.
