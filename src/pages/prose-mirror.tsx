import { EditorState, Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";
import React, { useEffect, useRef } from "react";

/*
 * - [Lightweight React integration example - Show - discuss.ProseMirror](https://discuss.prosemirror.net/t/lightweight-react-integration-example/2680)
 */

function Editor(props) {
  const ref = useRef();
  const view = useRef(null);

  useEffect(() => {
    const mySchema = new Schema({
      nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
      marks: schema.spec.marks
    });

    view.current = new EditorView(ref.current, {
      state: EditorState.create({
        doc: DOMParser.fromSchema(mySchema).parse(document.querySelector("#content")),
        plugins: exampleSetup({schema: mySchema})
      })
    })

    return () => view.current.destroy();
  }, []);

  return <><div ref={ref} /><div id="content" /></>;
}

export default function IndexPage() {
  return <div style={{whiteSpace: 'pre'}}><Editor /></div>;
}
