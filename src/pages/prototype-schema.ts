import { Schema } from 'prosemirror-model';
import { findWrapping } from 'prosemirror-transform';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import {
  InputRule,
  inputRules,
  // wrappingInputRule,
  textblockTypeInputRule,
  smartQuotes,
  emDash,
  ellipsis,
} from 'prosemirror-inputrules';
import { wrapIn } from 'prosemirror-commands';

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

function wrappingInputRule(regexp, nodeType, getAttrs, joinPredicate) {
  return new InputRule(regexp, (state, match, start, end) => {
    console.log('--- 0 ---');
    let attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
    let tr = state.tr.delete(start, end);
    let $start = tr.doc.resolve(start);
    const range = $start.blockRange();
    console.log('range', range);
    // const wrapping = range && findWrapping(range, nodeType, attrs);
    const wrapping = range;
    console.log('--- 1 ---');
    if (!wrapping) return null;
    // tr.wrap(range, wrapping);
    let before = tr.doc.resolve(start - 1).nodeBefore;
    console.log('--- 2 ---');
    if (
      before &&
      before.type == nodeType &&
      canJoin(tr.doc, start - 1) &&
      (!joinPredicate || joinPredicate(match, before))
    ) {
      console.log('--- 3 ---');
      tr.join(start - 1);
    }
    console.log('--- 4 ---');
    return tr;
  });
}

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
      new InputRule(/^\s*>\s$/, (state) => {
        console.log('hi');
        console.log(state);
        wrapIn(schema.nodes.blockquote);
        return state.tr;
      }),
      // wrappingInputRule(/>\s$/, schema.nodes.blockquote, () => {
      //   console.log('match!');
      // }),
    ],
  });
}
