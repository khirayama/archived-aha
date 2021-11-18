import 'prosemirror-menu/style/menu.css';
import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-example-setup/style/style.css';

import { EditorState, Selection, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema } from 'prosemirror-schema-basic';
import { undo, redo, history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import React, { useEffect, useRef } from 'react';
import { exampleSetup } from 'prosemirror-example-setup';
import { lift, joinUp, selectParentNode, wrapIn, setBlockType } from 'prosemirror-commands';
console.log(schema);

import { Schema } from 'prosemirror-model';

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

// const schema = new Schema({
//   nodes: {
//     doc: {
//       content: 'block+',
//     },
//     paragraph: {
//       group: 'block',
//       content: 'text*',
//       draggable: true,
//       toDOM: (node) => {
//         return ['div', 0];
//       },
//     },
//     blockgroup: {
//       group: 'block',
//       content: 'block*',
//       draggable: true,
//       toDOM: (node) => {
//         return ['div', 0];
//       },
//     },
//     text: {},
//   },
// });

function Editor(props) {
  const ref = useRef();

  useEffect(() => {
    const state = EditorState.create({
      schema,
      plugins: [
        ...exampleSetup({ schema }),
        keymap({
          'Ctrl-<': lift,
        }),
      ],
      // plugins: [
      //   history(),
      //   keymap({
      //     'Mod-z': undo,
      //     'Mod-y': redo,
      //   }),
      //   keymap(baseKeymap),
      // ],
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
