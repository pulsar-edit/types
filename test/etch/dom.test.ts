// Type-level tests for etch's `dom` export: the tag-function form
// (`dom.div(…)`, described by `DomTagFunctions`/`SvgTagFunctions`) and the
// callable form (`dom('div', …)`, `dom('some-custom-element', …)`,
// `dom(Widget, …)`).
//
// These tests assert nothing at runtime; they pass if `tsc` accepts the file.
// Negative cases are written with `@ts-expect-error`, which fails the build in
// BOTH directions: if the code stops erroring, tsc reports the directive itself
// as unused.

import { dom } from "../../etch/dom";
import type { EtchJSXElement } from "../../etch/element";

const child: EtchJSXElement = dom.span("hello");

// ---------------------------------------------------------------------------
// The props overload
//
// `Attrs<T>` must be partial. The whole point of the `Partial<Omit<…>>` shape
// is that a caller supplies a handful of properties, not all ~300 members of
// the underlying DOM interface.
// ---------------------------------------------------------------------------

dom.div({ className: "foo" });
dom.div({});
dom.div({ className: "foo" }, child);

// Tag-specific properties resolve through HTMLElementTagNameMap.
dom.input({ disabled: true });
dom.a({ href: "https://example.com" });
dom.img({ src: "cat.png", alt: "a cat" });

// etch's own props survive the `Omit<…, keyof EtchExtraProps>`: these are
// etch's versions, not the DOM's.
dom.div({ style: { color: "red" } });
dom.div({ dataset: { count: 1, label: "x" } });
dom.div({ on: { click: (e: MouseEvent) => e.preventDefault() } });
dom.div({ innerHTML: "<b>hi</b>" });
dom.div({ key: Symbol("k") });

// A real element must not be required, and must not be silently accepted: the
// props type describes an attribute bag, not an HTMLDivElement.
// @ts-expect-error a live DOM element is not a props object
dom.div(document.createElement("div"));

// @ts-expect-error unknown property
dom.div({ clasName: "typo" });

// @ts-expect-error wrong type for a known property
dom.input({ disabled: "yes" });

// ---------------------------------------------------------------------------
// The children-only overload
//
// Every one of these must resolve to the second overload rather than binding
// its first argument to `props`.
// ---------------------------------------------------------------------------

dom.div();
dom.div("text");
dom.div(42);
dom.div(child);
dom.div(child, child);
dom.div([child, child]);
dom.div(null);
dom.div("mixed", 1, child, null);

// ---------------------------------------------------------------------------
// Tag coverage
//
// The key set must mirror etch's own tag list, which is NOT the same as
// `keyof HTMLElementTagNameMap`.
// ---------------------------------------------------------------------------

// Tags TypeScript has dropped from (or never had in) HTMLElementTagNameMap,
// but that etch still generates. These resolve via the deprecated map or the
// HTMLUnknownElement fallback in `ElementFor`.
dom.command();
dom.keygen();
dom.param();
dom.object({ data: "movie.mp4" });

// Tags that exist in lib.dom but that etch does not generate. Declaring them
// would promise properties that are `undefined` at runtime.
// @ts-expect-error etch does not generate `template`
dom.template();
// @ts-expect-error etch does not generate `slot`
dom.slot();
// @ts-expect-error etch does not generate `picture`
dom.picture();
// @ts-expect-error etch does not generate `data`
dom.data();
// @ts-expect-error etch does not generate `hgroup`
dom.hgroup();
// @ts-expect-error etch does not generate `search`
dom.search();

// ---------------------------------------------------------------------------
// SVG tag functions
// ---------------------------------------------------------------------------

dom.svg(dom.circle(), dom.rect());
dom.rect({ className: "shape" });
dom.circle(child);
dom.text("label");

// The SVG list must mirror etch's array too, not `keyof SVGElementTagNameMap`.
// @ts-expect-error etch does not generate `feBlend`
dom.feBlend();
// @ts-expect-error etch does not generate `foreignObject`
dom.foreignObject();

// SVG presentation attributes (`stroke`, `fill`, `stroke-width`, …) are not
// props. etch assigns props onto the element object, and SVG does not reflect
// presentation attributes as IDL properties — assigning them would create an
// inert expando that renders nothing. Rejecting them is correct; the supported
// route is `style`, since these are CSS properties. If this ever starts
// compiling, that is a regression to investigate, not a fix.
// @ts-expect-error SVG presentation attributes are not settable as props
dom.rect({ stroke: "#f00", fill: "none" });

dom.rect({ style: { stroke: "#f00", fill: "none" } });

// ===========================================================================
// The callable form: dom(tag, props?, ...children)
// ===========================================================================

// ---------------------------------------------------------------------------
// Known tags: props are checked against the element interface
// ---------------------------------------------------------------------------

dom("div", { className: "foo" });
dom("div", { className: "foo" }, child);
dom("input", { disabled: true });
dom("a", { href: "https://example.com" });

// @ts-expect-error unknown property on a known tag
dom("div", { clasName: "typo" });

// @ts-expect-error wrong type for a known property
dom("input", { disabled: "yes" });

// ---------------------------------------------------------------------------
// Known tags: children in the props position
//
// `props?` only lets a caller omit trailing arguments — it does not let them
// skip the slot. Without a children-only overload, each of these binds its
// second argument to `props`.
// ---------------------------------------------------------------------------

dom("div", child);
dom("div", "text");
dom("div", 42);
dom("div", [child, child]);
dom("div", null);
dom("div", child, child);

// ---------------------------------------------------------------------------
// Arbitrary tags
//
// etch accepts any string at runtime, so custom elements must work with props,
// with children, and with both.
// ---------------------------------------------------------------------------

dom("some-custom-element");
dom("some-custom-element", { className: "foo" });
dom("some-custom-element", { className: "foo" }, child);

dom("some-custom-element", child);
dom("some-custom-element", "text");
dom("some-custom-element", 42);
dom("some-custom-element", [child]);
dom("some-custom-element", { text: "hi" });
dom("some-custom-element", "a", 1, child, null);

// A tag held in a variable is still just a string.
const tag: string = "some-custom-element";
dom(tag, { className: "foo" });
dom(tag, child);

// ---------------------------------------------------------------------------
// Component classes
// ---------------------------------------------------------------------------

class Widget {
  props: { label: string };

  constructor(props: { label: string }, _children?: EtchJSXElement[]) {
    this.props = props;
  }

  update(props: { label: string }): Promise<void> {
    this.props = props;
    return Promise.resolve();
  }
}

dom(Widget, { label: "hi" });
dom(Widget, { label: "hi" }, child);

// @ts-expect-error props must match the component's own props type
dom(Widget, { labell: "typo" });

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

dom("div", { className: "foo" }) satisfies EtchJSXElement;
