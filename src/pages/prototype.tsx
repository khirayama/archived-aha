import { EditorState, Selection, NodeSelection, Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { undo, redo, history } from "prosemirror-history"
import { keymap } from "prosemirror-keymap"
import React, { useEffect, useRef } from "react";

// import { dropCursor } from 'prosemirror-dropcursor';
// import { schema } from "prosemirror-schema-basic";
// import { baseKeymap } from "prosemirror-commands"

import { Schema } from "prosemirror-model"

const commands = {
  selectBlock: (state, dispatch) => {
    // https://github.com/ProseMirror/prosemirror-commands/blob/master/src/commands.js#L348-L355
    let { $from, to } = state.selection;
    let same = $from.sharedDepth(to);
    if (same == 0) {
      return false;
    }
    const pos = $from.before(same);
    if (dispatch) {
      dispatch(state.tr.setSelection(NodeSelection.create(state.doc, pos)));
    }
    return true;
  },
  indent: (state, dispatch) => {
    console.log('indent');
    let { $cursor } = state.selection;
    console.log(state.selection);
  },
}

const schema = new Schema({
  nodes: {
    doc: {
      content: "block+",
    },
    paragraph: {
      group: "block",
      content: "text*",
      // draggable: true,
      attrs: {
        indent: {
          default: 0,
        },
      },
      toDOM: (node) => {
        return [
          "div",
          {
            class: 'indent-' + node.attrs.indent,
          },
          0,
        ];
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
          "Tab": commands.indent,
          "Escape": commands.selectBlock,
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

  return <div ref={ref} />;
}

export default function IndexPage() {
  return <div><Editor /></div>;
}
