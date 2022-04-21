import { Schema } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { InputRule, inputRules } from 'prosemirror-inputrules';

import { view } from '../pages/prosemirror';
import styles from '../pages/prosemirror.module.scss';

/* FYI indentContext is context of indentation for specific use cases such as pasting. */
let indentContext: number | null = null;

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
    const state = view.state;
    state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
      if (node.type.attrs.indent && indentContext === null) {
        indentContext = node.attrs.indent;
        /* FYI For keeing indentContext in one event */
        setTimeout(() => (indentContext = null), 0);
      }
    });
    return {
      ...originalGetAttrs(dom),
      indent: Math.min(indent + indentContext, 8),
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
      parseDOM: [{ tag: 'p' }, { tag: 'div' }],
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
    image: createBlockNode({
      parseDOM: [{ tag: 'img' }],
      toDOM: (node) => {
        return [
          'div',
          {
            class: styles['image'],
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
            'img',
            {
              src: 'https://dummyimage.com/16:9x1080/',
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
  marks: {
    link: {
      attrs: {
        href: {},
        title: { default: null },
      },
      inclusive: false,
      parseDOM: [
        {
          tag: 'a[href]',
          getAttrs(dom) {
            return {
              href: dom.getAttribute('href'),
              title: dom.getAttribute('title'),
            };
          },
        },
      ],
      toDOM(node) {
        const { href, title } = node.attrs;
        return [
          'a',
          {
            href,
            title,
            onclick: '((el) => window.open(el.href))(this)',
          },
          0,
        ];
      },
    },
    em: {
      parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
      toDOM() {
        return ['em', 0];
      },
    },
    strong: {
      parseDOM: [
        { tag: 'strong' },
        { tag: 'b', getAttrs: (node) => node.style.fontWeight != 'normal' && null },
        { style: 'font-weight', getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null },
      ],
      toDOM() {
        return ['strong', 0];
      },
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
      new InputRule(/^\s*-\s$/, (state, match, start, end) => {
        const tr = state.tr.delete(start, end);
        const node = state.selection.$from.node();
        tr.setBlockType(start, end, schema.nodes.image, node.attrs);
        return tr;
      }),
    ],
  });
}
