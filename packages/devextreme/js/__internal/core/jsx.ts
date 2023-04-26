/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable new-cap */
/* eslint-disable no-new */
import DOMComponent from '@js/core/dom_component';
import $, { dxElementWrapper } from '@js/core/renderer';
import { isFunction } from '@js/core/utils/type';
import Widget from '@js/ui/widget/ui.widget';
// we need to import some types from inferno to use Inferno's IntrisicElements interface
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as inferno from 'inferno/dist/index';

type T = JSX.IntrinsicElements;

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace jquery {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace JSX {
    type IntrinsicElements = T;
    type Element = dxElementWrapper;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type ElementClass = Widget<any>;

    interface ElementChildrenAttribute {
      children;
    }

    interface ElementAttributesProperty {
      props;
    }

    interface IntrinsicClassAttributes<TT> {
      ref: { current?: TT };
    }
  }
}

export function jquery(
  tag: string | (new () => DOMComponent<unknown>) | ((props: unknown) => dxElementWrapper),
  properties: Record<string, unknown>,
  ...children: dxElementWrapper[]
): dxElementWrapper {
  // @ts-expect-error
  if (tag.prototype instanceof DOMComponent || tag.subclassOf?.(DOMComponent)) {
    const $element = $('<div>');
    // @ts-expect-error
    new tag($element, {
      ...properties,
      onInitialized(e): void {
        if (properties?.ref) {
          // @ts-expect-error
          properties.ref.current = e.component;
        }

        // @ts-expect-error
        properties?.onInitialized?.call(this, e);
      },
    });
    return $element;
  }

  if (isFunction(tag)) {
    // @ts-expect-error
    return tag({ ...properties, children });
  }

  const $element = $(`<${tag}>`);
  if (properties) {
    // @ts-expect-error renderer d.ts mistake
    $element.attr(properties);
  }
  if (children) {
    children.forEach((c) => $element.append(c));
  }

  if (properties?.ref) {
    // @ts-expect-error
    properties.ref.current = $element.get(0);
  }

  return $element;
}
