# @pulsar-edit/types

Type definitions for the [Pulsar API](https://docs.pulsar-edit.dev/api/pulsar/latest/).

Migrated from [@types/atom](https://www.npmjs.com/package/@types/atom) and updated to reflect new and changed APIs in Pulsar.

Install these types under `devDependencies` if you’re writing a community package in TypeScript (or even in JavaScript if you want better autocompletion and inline documentation).

## Why isn’t this at `@types/pulsar-edit` or something?

Because Pulsar isn’t delivered as an NPM package. I’m not sure how or why Atom’s API was ever available at `@types/atom`, considering that the NPM package called `atom` has nothing to do with the Atom editor.
