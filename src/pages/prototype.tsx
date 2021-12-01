import { EditorState, AllSelection, TextSelection, Selection, NodeSelection, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { undo, redo, history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import React, { useEffect, useRef } from 'react';

import { customKeymap } from './prototype-commands';
import { schema, buildInputRules } from './prototype-schema';

import styles from './prototype.module.scss';

/*
 * - Detect keyword
 * - Export as markdown like text file
 *   - Local file sync
 *     - How to solve conflict?
 * - Support copy and paste with indent
 *   - 2 spaces or tab?
 */

// [prosemirror-test-custom-nodeview - CodeSandbox](https://codesandbox.io/s/vwcrt?file=/src/index.js)
// [ProseMirror Guide](https://prosemirror.net/docs/guide/)
// How to build custom node view

let myPlugin = new Plugin({
  props: {
    handleKeyDown(view, event) {
      console.log('A key was pressed!');
      return false; // We did not handle this
    },
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
      schema,
      plugins: [
        myPlugin,
        buildInputRules(),
        preventTabKeyPlugin,
        history(),
        keymap(customKeymap),
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

  return <div ref={ref} />;
}

export default function IndexPage() {
  return (
    <div>
      <Editor />
    </div>
  );
}
