import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { undo, redo, history } from "prosemirror-history"
import { keymap } from "prosemirror-keymap"
import React, { useEffect, useRef } from "react";

/*
 * - [Lightweight React integration example - Show - discuss.ProseMirror](https://discuss.prosemirror.net/t/lightweight-react-integration-example/2680)
 * - [ProseMirror Guide](https://prosemirror.net/docs/guide/)
 * - [ProseMirror Reference manual](https://prosemirror.net/docs/ref/#commands)
 */

function Editor(props) {
  const ref = useRef();
  const view = useRef(null);

  useEffect(() => {
    const state = EditorState.create({
      schema,
      plugins: [
        history(),
        keymap({
          "Mod-z": undo,
          "Mod-y": redo,
        }),
      ]
    });
    const view = new EditorView(ref.current, {
      state,
      dispatchTransaction: (transaction) => {
        console.log("Document size went from", transaction.before.content.size,
                    "to", transaction.doc.content.size)
        let newState = view.state.apply(transaction)
        view.updateState(newState)
      }
    });
    view.current = view;

    return () => view.current.destroy();
  }, []);

  return <><div ref={ref} /><div id="content" /></>;
}

export default function IndexPage() {
  return <div style={{whiteSpace: 'pre'}}><Editor /></div>;
}
