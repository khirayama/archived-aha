import { Schema } from 'prosemirror-model';

import styles from './prototype.module.scss';

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
      toDOM: (node) => {
        return [
          'div',
          {
            type: 'paragraph',
            indent: node.attrs.indent,
            class: styles[`indent-${node.attrs.indent}`],
          },
          0,
        ];
      },
      parseDOM: [
        {
          tag: 'div',
          attrs: {
            type: 'paragraph',
          },
          getAttrs: (dom) => {
            return {
              indent: Number(dom.getAttribute('indent')),
            };
          },
        },
      ],
    },
    text: {},
  },
});
