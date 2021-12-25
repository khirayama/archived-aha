import 'prosemirror-menu/style/menu.css';
import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-example-setup/style/style.css';

import { EditorState, Selection, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema } from 'prosemirror-schema-basic';
import { undo, redo, history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import React, { useEffect, useRef } from 'react';
import {
  inputRules,
  wrappingInputRule,
  textblockTypeInputRule,
  smartQuotes,
  emDash,
  ellipsis,
  undoInputRule,
} from 'prosemirror-inputrules';
import {
  baseKeymap,
  wrapIn,
  setBlockType,
  chainCommands,
  toggleMark,
  exitCode,
  joinUp,
  joinDown,
  lift,
  selectParentNode,
} from 'prosemirror-commands';
import { wrapInList, splitListItem, liftListItem, sinkListItem } from 'prosemirror-schema-list';

import { Schema } from 'prosemirror-model';

import styles from './prototype.module.scss';

/*
 * - [Lightweight React integration example - Show - discuss.ProseMirror](https://discuss.prosemirror.net/t/lightweight-react-integration-example/2680)
 * - [ProseMirror Guide](https://prosemirror.net/docs/guide/)
 * - [ProseMirror Reference manual](https://prosemirror.net/docs/ref/#commands)
 * - [remirror/remirror: ProseMirror toolkit for React 🎉](https://github.com/remirror/remirror)
 * - [vim keymap](https://codemirror.net/3/keymap/vim.js)
 * - [ProseMirror dino example](https://prosemirror.net/examples/dino/)
 * - [prosemirror-cookbook/README.md at master · PierBover/prosemirror-cookbook](https://github.com/PierBover/prosemirror-cookbook/blob/master/README.md)
 * - [How do I Prevent Default Tab Key Behaviour in PM? - discuss.ProseMirror](https://discuss.prosemirror.net/t/how-do-i-prevent-default-tab-key-behaviour-in-pm/3049/2)
 */
/*
 * - Change order with drag and drop
 * - Select mode and insert mode
 * - Indent / Outdent
 * - Popup window
 */

const mySchema = new Schema({
  nodes: {
    doc: {
      content: 'block+',
    },
    paragraph: {
      group: 'block',
      content: 'text*',
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
    },
    indentation: {
      group: 'block',
      // content: 'block+',
      content: 'block',
      parseDOM: [
        {
          tag: 'div',
          attrs: {
            type: 'indentation',
          },
        },
      ],
      toDOM: (node) => {
        return [
          'div',
          {
            type: 'indentation',
            class: styles['indentation'],
          },
          0,
        ];
      },
    },
    text: {},
  },
});

const preventTabKeyPlugin = new Plugin({
  props: {
    handleKeyDown(view, event) {
      if (event.code === 'Tab') {
        event.preventDefault();
      }
    },
  },
});

function Editor(props) {
  const ref = useRef();

  useEffect(() => {
    const state = EditorState.create({
      schema: mySchema,
      plugins: [
        history(),
        preventTabKeyPlugin,
        buildInputRules(mySchema),
        keymap(buildKeymap(mySchema)),
        keymap(baseKeymap),
        keymap({
          'Mod-z': undo,
          'Mod-y': redo,
        }),
      ],
    });

    const view = new EditorView(ref.current, {
      state,
      dispatchTransaction: (transaction) => {
        // console.log(transaction);
        const newState = view.state.apply(transaction);
        view.updateState(newState);
      },
    });
  }, []);

  return (
    <>
      <div ref={ref} />
    </>
  );
}

export default function IndexPage() {
  return (
    <div style={{ whiteSpace: 'pre' }}>
      <Editor />
    </div>
  );
}

/* prosemirror-example-setup keymap */
const mac = typeof navigator != 'undefined' ? /Mac/.test(navigator.platform) : false;

// :: (Schema, ?Object) → Object
// Inspect the given schema looking for marks and nodes from the
// basic schema, and if found, add key bindings related to them.
// This will add:
//
// * **Mod-b** for toggling [strong](#schema-basic.StrongMark)
// * **Mod-i** for toggling [emphasis](#schema-basic.EmMark)
// * **Mod-`** for toggling [code font](#schema-basic.CodeMark)
// * **Ctrl-Shift-0** for making the current textblock a paragraph
// * **Ctrl-Shift-1** to **Ctrl-Shift-Digit6** for making the current
//   textblock a heading of the corresponding level
// * **Ctrl-Shift-Backslash** to make the current textblock a code block
// * **Ctrl-Shift-8** to wrap the selection in an ordered list
// * **Ctrl-Shift-9** to wrap the selection in a bullet list
// * **Ctrl->** to wrap the selection in a block quote
// * **Enter** to split a non-empty textblock in a list item while at
//   the same time splitting the list item
// * **Mod-Enter** to insert a hard break
// * **Mod-_** to insert a horizontal rule
// * **Backspace** to undo an input rule
// * **Alt-ArrowUp** to `joinUp`
// * **Alt-ArrowDown** to `joinDown`
// * **Mod-BracketLeft** to `lift`
// * **Escape** to `selectParentNode`
//
// You can suppress or map these bindings by passing a `mapKeys`
// argument, which maps key names (say `"Mod-B"` to either `false`, to
// remove the binding, or a new key name string.
export function buildKeymap(schema, mapKeys) {
  let keys = {};
  let typ;
  function bind(key, cmd) {
    if (mapKeys) {
      let mapped = mapKeys[key];
      if (mapped === false) return;
      if (mapped) key = mapped;
    }
    keys[key] = cmd;
  }

  bind('Mod-z', undo);
  bind('Shift-Mod-z', redo);
  bind('Backspace', undoInputRule);
  if (!mac) bind('Mod-y', redo);

  bind('Alt-ArrowUp', joinUp);
  bind('Alt-ArrowDown', joinDown);
  bind('Mod-BracketLeft', lift);
  bind('Escape', selectParentNode);

  if ((typ = schema.nodes.indentation)) bind('Tab', wrapIn(typ));
  if ((typ = schema.nodes.indentation)) bind('Shift-Tab', lift);
  if ((typ = schema.nodes.indentation)) bind('Ctrl->', wrapIn(typ));

  if ((typ = schema.marks.strong)) {
    bind('Mod-b', toggleMark(typ));
    bind('Mod-B', toggleMark(typ));
  }
  if ((typ = schema.marks.em)) {
    bind('Mod-i', toggleMark(typ));
    bind('Mod-I', toggleMark(typ));
  }
  if ((typ = schema.marks.code)) bind('Mod-`', toggleMark(typ));

  if ((typ = schema.nodes.bullet_list)) bind('Shift-Ctrl-8', wrapInList(typ));
  if ((typ = schema.nodes.ordered_list)) bind('Shift-Ctrl-9', wrapInList(typ));
  if ((typ = schema.nodes.hard_break)) {
    let br = typ,
      cmd = chainCommands(exitCode, (state, dispatch) => {
        dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
        return true;
      });
    bind('Mod-Enter', cmd);
    bind('Shift-Enter', cmd);
    if (mac) bind('Ctrl-Enter', cmd);
  }
  if ((typ = schema.nodes.list_item)) {
    bind('Enter', splitListItem(typ));
    bind('Mod-[', liftListItem(typ));
    bind('Mod-]', sinkListItem(typ));
  }
  if ((typ = schema.nodes.paragraph)) bind('Shift-Ctrl-0', setBlockType(typ));
  if ((typ = schema.nodes.code_block)) bind('Shift-Ctrl-\\', setBlockType(typ));
  if ((typ = schema.nodes.heading))
    for (let i = 1; i <= 6; i++) bind('Shift-Ctrl-' + i, setBlockType(typ, { level: i }));
  if ((typ = schema.nodes.horizontal_rule)) {
    let hr = typ;
    bind('Mod-_', (state, dispatch) => {
      dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView());
      return true;
    });
  }

  return keys;
}

/* prosemirror-example-setup inputrules */
// : (NodeType) → InputRule
// Given a indentation node type, returns an input rule that turns `"> "`
// at the start of a textblock into a indentation.
export function indentationRule(nodeType) {
  return wrappingInputRule(/^\s*>\s$/, nodeType);
}

// : (NodeType) → InputRule
// Given a list node type, returns an input rule that turns a number
// followed by a dot at the start of a textblock into an ordered list.
export function orderedListRule(nodeType) {
  return wrappingInputRule(
    /^(\d+)\.\s$/,
    nodeType,
    (match) => ({ order: +match[1] }),
    (match, node) => node.childCount + node.attrs.order == +match[1],
  );
}

// : (NodeType) → InputRule
// Given a list node type, returns an input rule that turns a bullet
// (dash, plush, or asterisk) at the start of a textblock into a
// bullet list.
export function bulletListRule(nodeType) {
  return wrappingInputRule(/^\s*([-+*])\s$/, nodeType);
}

// : (NodeType) → InputRule
// Given a code block node type, returns an input rule that turns a
// textblock starting with three backticks into a code block.
export function codeBlockRule(nodeType) {
  return textblockTypeInputRule(/^```$/, nodeType);
}

// : (NodeType, number) → InputRule
// Given a node type and a maximum level, creates an input rule that
// turns up to that number of `#` characters followed by a space at
// the start of a textblock into a heading whose level corresponds to
// the number of `#` signs.
export function headingRule(nodeType, maxLevel) {
  return textblockTypeInputRule(new RegExp('^(#{1,' + maxLevel + '})\\s$'), nodeType, (match) => ({
    level: match[1].length,
  }));
}

// : (Schema) → Plugin
// A set of input rules for creating the basic block quotes, lists,
// code blocks, and heading.
export function buildInputRules(schema) {
  const rules = smartQuotes.concat(ellipsis, emDash);
  let typ;
  if ((typ = schema.nodes.indentation)) rules.push(indentationRule(typ));
  if ((typ = schema.nodes.ordered_list)) rules.push(orderedListRule(typ));
  if ((typ = schema.nodes.bullet_list)) rules.push(bulletListRule(typ));
  if ((typ = schema.nodes.code_block)) rules.push(codeBlockRule(typ));
  if ((typ = schema.nodes.heading)) rules.push(headingRule(typ, 6));
  return inputRules({ rules });
}
