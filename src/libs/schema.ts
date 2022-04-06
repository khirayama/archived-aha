import { Schema } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { InputRule, inputRules } from 'prosemirror-inputrules';

import { view } from '../pages/prosemirror';
import styles from '../pages/prosemirror.module.scss';

// TODO pasteしたときにindentの維持と合算が必要

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
    // draggable: false,
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
          tag: 'p',
        },
      ],
      toDOM: (node) => {
        return [
          'p',
          {
            class: styles['paragraph'],
          },
          [
            'span',
            {
              class: styles['handle'],
              contentEditable: false,
            },
            [
              'span',
              {
                class: 'material-icons',
                'data-key': 'drag_indicator',
              },
            ],
          ],
          [
            'span',
            {
              class: styles['indentation'],
            },
          ],
          [
            'span',
            {
              class: styles['text'],
            },
            0,
          ],
        ];
      },
    }),
    quote: createBlockNode({
      parseDOM: [
        {
          tag: 'blockquote',
        },
      ],
      toDOM: (node) => {
        return [
          'blockquote',
          {
            class: styles['quote'],
          },
          [
            'span',
            {
              class: styles['handle'],
              contentEditable: false,
            },
            [
              'span',
              {
                class: 'material-icons',
                'data-key': 'drag_indicator',
              },
            ],
          ],
          [
            'span',
            {
              class: styles['indentation'],
            },
          ],
          [
            'span',
            {
              class: styles['text'],
            },
            0,
          ],
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