// NOTE: Only those classes exported within this file should retain that status
// below.
// https://github.com/pulsar-edit/pulsar/blob/v1.128.0/exports/atom.js

/// <reference types="node" />
/// <reference path="./atom.d.ts" />

import { AtomEnvironment } from "./src/atom-environment";
import { TextEditorElement } from "./src/text-editor-element";

// Imports ======================================================
declare global {
  const atom: AtomEnvironment;

  interface HTMLElementTagNameMap {
    "atom-text-editor": TextEditorElement;
  }
}

export * from "./dependencies/event-kit";
export * from "./dependencies/first-mate";
export * from "./dependencies/pathwatcher";
export * from "./dependencies/text-buffer";
export * from "./src/atom-environment";
export * from "./src/buffered-node-process";
export * from "./src/buffered-process";
export * from "./src/clipboard";
export * from "./src/color";
export * from "./src/command-registry";
export * from "./src/config";
export * from "./src/config-schema";
export * from "./src/context-menu-manager";
export * from "./src/cursor";
export * from "./src/decoration";
export * from "./src/deserializer-manager";
export * from "./src/dock";
export * from "./src/get-window-load-settings";
export * from "./src/git-repository";
export * from "./src/grammar-registry";
export * from "./src/gutter";
export * from "./src/history-manager";
export * from "./src/keymap-extensions";
export * from "./src/layer-decoration";
export * from "./src/menu-manager";
export * from "./src/notification";
export * from "./src/notification-manager";
export * from "./src/other-types";
export * from "./src/package";
export * from "./src/package-manager";
export * from "./src/pane";
export * from "./src/panel";
export * from "./src/path-watcher";
export * from "./src/project";
export * from "./src/scope-descriptor";
export * from "./src/selection";
export * from "./src/style-manager";
export * from "./src/task";
export * from "./src/text-editor";
export * from "./src/text-editor-component";
export * from "./src/text-editor-element";
export * from "./src/text-editor-registry";
export * from "./src/theme-manager";
export * from "./src/tooltip";
export * from "./src/tooltip-manager";
export * from "./src/view-registry";
export * from "./src/ui";
export { WASMTreeSitterGrammar } from './src/wasm-tree-sitter-grammar';
export { WASMTreeSitterLanguageMode } from './src/wasm-tree-sitter-language-mode';
export * from "./src/workspace";
export * from "./src/workspace-center";
