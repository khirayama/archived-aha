import { Schema } from 'prosemirror-model';
import { findWrapping } from 'prosemirror-transform';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import {
  InputRule,
  inputRules,
  wrappingInputRule,
  textblockTypeInputRule,
  smartQuotes,
  emDash,
  ellipsis,
} from '../libs/prosemirror-inputrules';
import { wrapIn } from '../libs/prosemirror-commands';

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
            class: [styles['paragraph'], styles[`indent-${node.attrs.indent}`]].join(' '),
          },
          0,
        ];
      },
    },
    blockquote: {
      group: 'block',
      content: 'block+',
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
            type: 'blockquote',
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
            type: 'blockquote',
            indent: node.attrs.indent,
            class: [styles['blockquote'], styles[`indent-${node.attrs.indent}`]].join(' '),
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

function blockQuoteRule(nodeType) {
  console.log('hi, blockQuoteRule', nodeType);
  // return wrappingInputRule(/^\s*>\s$/, nodeType);
  return wrappingInputRule(/>\s$/, nodeType);
}

export function buildInputRules() {
  // let rules = smartQuotes.concat();
  // rules.push(blockQuoteRule(schema.nodes.blockquote));
  // console.log(schema.nodes.blockquote);
  return inputRules({
    rules: [
      // new InputRule(/^\s*>\s$/, (state) => {
      //   console.log('hi');
      //   console.log(state);
      //   wrapIn(schema.nodes.blockquote);
      //   return state.tr;
      // }),
      wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote, () => {
        console.log('match!');
      }),
    ],
  });
}
