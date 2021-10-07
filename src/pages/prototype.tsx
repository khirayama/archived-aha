import { EditorState, Selection, Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
// import { schema } from "prosemirror-schema-basic";
import { undo, redo, history } from "prosemirror-history"
import { keymap } from "prosemirror-keymap"
import { baseKeymap, selectParentNode } from "prosemirror-commands"
import React, { useEffect, useRef } from "react";
import { dropCursor } from 'prosemirror-dropcursor';

import { Schema } from "prosemirror-model"

const schema = new Schema({
  nodes: {
    doc: {
      content: "block+",
    },
    paragraph: {
      group: "block",
      content: "text*",
      draggable: true,
      toDOM: (node) => {
        return ["div", 0];
      },
    },
    text: {}
  }
});

let preventTabKeyPlugin = new Plugin({
  props: {
    handleKeyDown(view, event) {
      if (event.keyCode === 9 /* TAB */) {
        event.preventDefault();
      }
    }
  }
});

function Editor(props) {
  const ref = useRef();

  useEffect(() => {
    const state = EditorState.create({
      schema,
      plugins: [
        preventTabKeyPlugin,
        history(),
        keymap({
          "Mod-z": undo,
          "Mod-y": redo,
          "Tab": () => {
            console.log('call 1');
          },
          "Escape": selectParentNode,
        }),
      ]
    });

    const view = new EditorView(ref.current, {
      state,
      dispatchTransaction: (transaction) => {
        console.log(transaction);
        const newState = view.state.apply(transaction)
        view.updateState(newState)
      }
    });
  }, []);

  return <><div ref={ref} /></>;
}

export default function IndexPage() {
  return <div style={{whiteSpace: 'pre'}}><Editor /></div>;
}
