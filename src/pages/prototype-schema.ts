import { Schema } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { InputRule, inputRules } from '../libs/prosemirror-inputrules';

import styles from './prototype.module.scss';

console.log(basicSchema);

export const schema = new Schema({
  nodes: {
    doc: {
      content: 'block+',
    },
    paragraph: {
      group: 'block',
      content: 'text*',
      // draggable: true,
      attrs: {
        indent: {
          default: 0,
        },
      },
      parseDOM: [
        {
          tag: 'div',
          attrs: {
            type: 'paragraph',
          },
          getAttrs: (dom) => {
            const indent = Number(dom.getAttribute('indent'));
            return {
              indent,
            };
          },
        },
      ],
      toDOM: (node) => {
        return [
          'div',
          {
            type: 'paragraph',
            indent: node.attrs.indent,
            class: styles['paragraph'],
          },
          0,
        ];
      },
    },
    quote: {
      group: 'block',
      content: 'text*',
      // draggable: true,
      attrs: {
        indent: {
          default: 0,
        },
      },
      parseDOM: [
        {
          tag: 'div',
          attrs: {
            type: 'quote',
          },
          getAttrs: (dom) => {
            const indent = Number(dom.getAttribute('indent'));
            return {
              indent,
            };
          },
        },
      ],
      toDOM: (node) => {
        return [
          'div',
          {
            type: 'quote',
            indent: node.attrs.indent,
            class: styles['quote'],
          },
          0,
        ];
      },
    },
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
