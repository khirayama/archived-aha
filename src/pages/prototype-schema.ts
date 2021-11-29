import { Schema } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { InputRule, inputRules } from '../libs/prosemirror-inputrules';

import styles from './prototype.module.scss';

console.log(basicSchema);

function createBlockNode(nodeSpec) {
  const attrs = {
    ...(nodeSpec.attrs || {}),
    indent: {
      default: 0,
    },
  };

  const originalGetAttrs = nodeSpec.parseDOM[0].getAttrs || (() => ({}));
  const getAttrs = (dom) => {
    const indent = Number(dom.getAttribute('indent'));
    return {
      ...originalGetAttrs(dom),
      indent,
    };
  };
  nodeSpec.parseDOM[0].getAttrs = getAttrs;

  const originalToDOM = nodeSpec.toDOM;
  const toDOM = (node) => {
    const dom = originalToDOM(node);
    dom[1].indent = node.attrs.indent;
    return dom;
  };
  nodeSpec.toDOM = toDOM;

  return {
    ...nodeSpec,
    group: 'block',
    content: 'text*',
    draggable: true,
    selectable: true,
    attrs,
  };
}

export const schema = new Schema({
  nodes: {
    doc: {
      content: 'block+',
    },
    paragraph: createBlockNode({
      parseDOM: [
        {
          tag: 'div',
          attrs: {
            type: 'paragraph',
          },
        },
      ],
      toDOM: (node) => {
        return [
          'div',
          {
            type: 'paragraph',
            class: styles['paragraph'],
          },
          0,
        ];
      },
    }),
    quote: createBlockNode({
      parseDOM: [
        {
          tag: 'div',
          attrs: {
            type: 'quote',
          },
        },
      ],
      toDOM: (node) => {
        return [
          'div',
          {
            type: 'quote',
            class: styles['quote'],
          },
          0,
        ];
      },
    }),
    text: {
      inline: true,
    },
  },
});

export function buildInputRules() {
  return inputRules({
    rules: [
      new InputRule(/^\s*>\s$/, (state, match, start, end) => {
        const tr = state.tr.delete(start, end);
        const node = state.selection.$from.node();
        tr.setBlockType(start, end, schema.nodes.quote, node.attrs);
        return tr;
      }),
    ],
  });
}
