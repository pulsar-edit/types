#!/usr/bin/env node
//
// Finds type references in this package's declarations that silently resolve
// to a DOM global from `lib.dom.d.ts`.
//
// Why this needs its own script: a `.d.ts` that names `Range`, `Node`, or
// `Notification` without importing it does not fail to compile. TypeScript
// happily binds the identifier to the ambient DOM global, so both `tsc` runs
// stay green while the published types describe something entirely different
// from what the author meant. The type tests only catch it where a test
// happens to touch the offending member.
//
// Two real bugs found this way:
//
//   - `TextEdit.range` in `src/other-types.d.ts` was the DOM `Range` — the one
//     with `cloneContents` and `commonAncestorContainer` — rather than Atom's.
//   - Every method of the Syntax Tree API in
//     `src/wasm-tree-sitter-language-mode.d.ts` took and returned the DOM
//     `Node` instead of `web-tree-sitter`'s.
//
// Most DOM references are unambiguous and uninteresting: nobody writes
// `HTMLElement` or `MouseEvent` by accident, because no other type in reach
// answers to those names. So this only reports a DOM reference when the same
// name is *also* obtainable from somewhere else in the program — either this
// package declares it, or one of the modules it imports exports it. That is
// exactly the condition under which a missing import turns into a wrong type
// rather than a compile error, and it is what both real bugs looked like:
// `Range` is declared by this package, and `Node` is exported by
// `web-tree-sitter`.
//
// Genuinely intentional overlaps go in ALLOWED below. Adding an entry is a
// deliberate act, which is the point — an unlisted hit fails the build.

const path = require("path");
const ts = require("typescript");

// Intentional references to a DOM global whose name is also available from
// elsewhere, keyed by path relative to the package root.
const ALLOWED = {
  // etch builds real DOM trees, and its `Node` is the DOM's.
  "etch/index.d.ts": ["Node"],
  // Command listeners are attached to, and dispatched against, DOM nodes.
  "src/command-registry.d.ts": ["Node"],
  // Context menu items are driven by real DOM events.
  "src/context-menu-manager.d.ts": ["Event"],
  // Keymaps bind against DOM elements.
  "src/keymap-extensions.d.ts": ["Element"],
  // Tooltips are attached to DOM elements.
  "src/tooltip-manager.d.ts": ["Node", "Element"],
  // The `BrowserWindow` shim describes the real `document`.
  "src/other-types.d.ts": ["Document"],
};

const root = path.resolve(__dirname, "..");
const configPath = path.join(root, "tsconfig.json");

const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
if (configFile.error) {
  console.error(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
  process.exit(2);
}

const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();

/** Is this symbol declared by `lib.dom.d.ts`? */
function isDomGlobal(symbol) {
  const declarations = symbol.declarations;
  if (!declarations || declarations.length === 0) return false;
  return declarations.some((declaration) => {
    const fileName = declaration.getSourceFile().fileName;
    return /[\\/]lib\.dom(\.\w+)*\.d\.ts$/.test(fileName);
  });
}

/** The leftmost identifier of a possibly-qualified type name. */
function leftmostIdentifier(entityName) {
  let node = entityName;
  while (ts.isQualifiedName(node)) node = node.left;
  return ts.isIdentifier(node) ? node : null;
}

/** Every `.d.ts` that belongs to this package, as [absolute, relative]. */
function packageFiles() {
  const result = [];
  for (const sourceFile of program.getSourceFiles()) {
    const absolute = sourceFile.fileName;
    if (!absolute.startsWith(root)) continue;
    if (absolute.includes("node_modules")) continue;
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    if (relative.startsWith("test/")) continue;
    result.push([sourceFile, relative]);
  }
  return result;
}

// Names that something other than lib.dom could have supplied: everything this
// package declares, plus everything exported by every module it imports.
function collectAmbiguousNames() {
  const names = new Set();

  for (const [sourceFile] of packageFiles()) {
    // This package's own top-level declarations. In a `.d.ts` these are
    // exported whether or not they carry the `export` keyword.
    for (const statement of sourceFile.statements) {
      if (statement.name && ts.isIdentifier(statement.name)) {
        names.add(statement.name.text);
      }
    }

    // Everything reachable through the module specifiers it mentions.
    const visitImports = (node) => {
      const specifier =
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier;
      if (specifier) {
        const moduleSymbol = checker.getSymbolAtLocation(specifier);
        if (moduleSymbol) {
          for (const exported of checker.getExportsOfModule(moduleSymbol)) {
            names.add(exported.getName());
          }
        }
      }
      ts.forEachChild(node, visitImports);
    };
    ts.forEachChild(sourceFile, visitImports);
  }

  return names;
}

const ambiguous = collectAmbiguousNames();
const findings = [];

for (const [sourceFile, relative] of packageFiles()) {
  const allowed = new Set(ALLOWED[relative] || []);

  const visit = (node) => {
    let name = null;
    if (ts.isTypeReferenceNode(node)) {
      name = leftmostIdentifier(node.typeName);
    } else if (ts.isExpressionWithTypeArguments(node) && ts.isIdentifier(node.expression)) {
      name = node.expression;
    }

    if (name && ambiguous.has(name.text) && !allowed.has(name.text)) {
      const symbol = checker.getSymbolAtLocation(name);
      if (symbol && isDomGlobal(symbol)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(name.getStart(sourceFile));
        findings.push({ file: relative, line: line + 1, name: name.text });
      }
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);
}

if (findings.length === 0) {
  console.log("dom-shadow: no unexpected DOM type references.");
  process.exit(0);
}

console.error(
  `dom-shadow: ${findings.length} type reference(s) resolve to a DOM global.\n` +
    "Import the intended type, or add the name to ALLOWED in scripts/dom-shadow.js\n"
);
for (const { file, line, name } of findings) {
  console.error(`  ${file}:${line}  ${name}`);
}
process.exit(1);
