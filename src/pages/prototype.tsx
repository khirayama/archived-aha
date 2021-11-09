import { EditorState, AllSelection, TextSelection, Selection, NodeSelection, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { undo, redo, history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import React, { useEffect, useRef } from 'react';

import { customKeymap } from './prototype-commands';
import { schema } from './prototype-schema';

import styles from './prototype.module.scss';

/*
 * - Detect keyword
 * - Export as markdown like text file
 *   - Local file sync
 *     - How to solve conflict?
 * - Support copy and paste with indent
 *   - 2 spaces or tab?
 */

const preventTabKeyPlugin = new Plugin({
  props: {
    handleKeyDown(view, event) {
      if (event.code === 'Tab') {
        event.preventDefault();
      }
    },
  },
});

const detectKeyword = new Plugin({
  props: {
    handleKeyDown(view, event) {
      if (event.code === 'Space') {
        const text = event.target.innerText;
        console.log(view);
        let tr = view.tr;
        // view.doc.nodesBetween(view.selection.from, view.selection.to, (node, pos) => {
        //   if (node.type.attrs.indent) {
        //     tr.setNodeMarkup(pos, null, {
        //       indent: Math.min(node.attrs.indent + 1, 8),
        //     });
        //   }
        // });
        view.dispatch(tr);
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
        preventTabKeyPlugin,
        detectKeyword,
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
