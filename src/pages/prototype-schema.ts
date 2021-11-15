import { Schema } from 'prosemirror-model';

import { orderedList, bulletList, listItem, listGroup, itemContent, add } from './prototype-schema-list';

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
            class: styles[`indent-${node.attrs.indent}`],
          },
          0,
        ];
      },
    },
    ordered_list: add(orderedList, { content: 'list_item+', group: listGroup }),
    bullet_list: add(bulletList, { content: 'list_item+', group: listGroup }),
    list_item: add(listItem, { content: itemContent }),
    text: {
      inline: true,
    },
  },
});
