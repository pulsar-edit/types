import type {
  JSX,
  EtchJSXElement,
  EtchExtraProps,
  Props,
  ChildSpec,
  ElementClassConstructor
} from "./element";

// Copied from `etch`; each is a hard-coded and outdated list that omits some
// valid tags and includes some deprecated tags. This is not ideal, but it does
// accurately describe the current `etch` package. If we ever fork `etch`, we
// should fix this and pull directly from an accurate data source describing
// all valid HTML5 tag names; that way we can reuse more of (e.g.)
// `HTMLElementTagNameMap`.
type HtmlTag =
  'a' | 'abbr' | 'address' | 'article' | 'aside' | 'audio' | 'b' | 'bdi' | 'bdo' |
  'blockquote' | 'body' | 'button' | 'canvas' | 'caption' | 'cite' | 'code' |
  'colgroup' | 'datalist' | 'dd' | 'del' | 'details' | 'dfn' | 'dialog' | 'div' | 'dl' |
  'dt' | 'em' | 'fieldset' | 'figcaption' | 'figure' | 'footer' | 'form' | 'h1' | 'h2' |
  'h3' | 'h4' | 'h5' | 'h6' | 'head' | 'header' | 'html' | 'i' | 'iframe' | 'ins' | 'kbd' |
  'label' | 'legend' | 'li' | 'main' | 'map' | 'mark' | 'menu' | 'meter' | 'nav' |
  'noscript' | 'object' | 'ol' | 'optgroup' | 'option' | 'output' | 'p' | 'pre' |
  'progress' | 'q' | 'rp' | 'rt' | 'ruby' | 's' | 'samp' | 'script' | 'section' |
  'select' | 'small' | 'span' | 'strong' | 'style' | 'sub' | 'summary' | 'sup' |
  'table' | 'tbody' | 'td' | 'textarea' | 'tfoot' | 'th' | 'thead' | 'time' | 'title' |
  'tr' | 'u' | 'ul' | 'var' | 'video' | 'area' | 'base' | 'br' | 'col' | 'command' |
  'embed' | 'hr' | 'img' | 'input' | 'keygen' | 'link' | 'meta' | 'param' | 'source' |
  'track' | 'wbr';

type SvgTag = 'circle' | 'clipPath' | 'defs' | 'ellipse' | 'g' | 'image' | 'line' | 'linearGradient' | 'mask' | 'path' | 'pattern' | 'polygon' | 'polyline' | 'radialGradient' | 'rect' | 'stop' | 'svg' | 'text' | 'tspan';

type ElementFor<T extends string> =
  T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] :
  T extends keyof HTMLElementDeprecatedTagNameMap ? HTMLElementDeprecatedTagNameMap[T] :
  HTMLUnknownElement;

type SvgElementFor<T extends string> =
  T extends keyof SVGElementTagNameMap ? SVGElementTagNameMap[T] :
  never;

type Attrs<T extends HtmlTag> =
  Partial<Omit<ElementFor<T>, keyof EtchExtraProps | 'style'>>
  & { style?: Partial<CSSStyleDeclaration> }
  & EtchExtraProps
  & Props;

type SvgAttrs<T extends keyof SVGElementTagNameMap> =
  Partial<Omit<SvgElementFor<T>, keyof EtchExtraProps | 'style'>>
  & { style?: Partial<CSSStyleDeclaration> }
  & EtchExtraProps
  & Props;

interface DomFunction<T extends HtmlTag> {
  (props: Attrs<T>, ...children: ChildSpec[]): EtchJSXElement;
  (...children: ChildSpec[]): EtchJSXElement;
}

interface DomSvgFunction<T extends keyof SVGElementTagNameMap> {
  (props: SvgAttrs<T>, ...children: ChildSpec[]): EtchJSXElement;
  (...children: ChildSpec[]): EtchJSXElement;
}

type DomTagFunctions = {
  [Tag in HtmlTag]: DomFunction<Tag>;
}

type SvgTagFunctions = {
  [Tag in SvgTag]: DomSvgFunction<Tag>;
}

export const dom: {
  // $('some-custom-element', child1, child2)
  (tag: string, ...children: ChildSpec[]): EtchJSXElement;

  // $('some-custom-element', { className: 'foo' })
  (
    tag: string,
    props?: EtchExtraProps & Props,
    ...children: ChildSpec[]
  ): EtchJSXElement;

  // $('div', { className: 'foo' })
  <T extends HtmlTag>(
    tag: T,
    props?: Attrs<T>,
    ...children: ChildSpec[]
  ): EtchJSXElement;

  // $('rect', { className: 'highlight' })
  <T extends keyof SVGElementTagNameMap>(
    tag: T,
    props?: SvgAttrs<T>,
    ...children: ChildSpec[]
  ): EtchJSXElement;

  // $(TextEditor, { … })
  <T extends JSX.ElementClass>(
    tag: ElementClassConstructor<T>,
    props: T["props"],
    ...children: ChildSpec[]
  ): EtchJSXElement;

} & DomTagFunctions & SvgTagFunctions;
