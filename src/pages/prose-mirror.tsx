import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { undo, redo, history } from "prosemirror-history"
import { keymap } from "prosemirror-keymap"
import { baseKeymap } from "prosemirror-commands"
import React, { useEffect, useRef } from "react";

import { Schema } from "prosemirror-model"

/*
 * - [Lightweight React integration example - Show - discuss.ProseMirror](https://discuss.prosemirror.net/t/lightweight-react-integration-example/2680)
 * - [ProseMirror Guide](https://prosemirror.net/docs/guide/)
 * - [ProseMirror Reference manual](https://prosemirror.net/docs/ref/#commands)
 * - [remirror/remirror: ProseMirror toolkit for React 🎉](https://github.com/remirror/remirror)
 * - [vim keymap](https://codemirror.net/3/keymap/vim.js)
 */

const dinos = [
  "brontosaurus",
  "stegosaurus",
  "triceratops",
  "tyrannosaurus",
  "pterodactyl",
];

const dinoNodeSpec = {
  attrs: {
    type: {
      default: "brontosaurus",
    },
  },
  inline: true,
  group: "inline",
  draggable: true,
  toDOM: node => [
    "img",
    {
      "dino-type": node.attrs.type,
      src: "https://prosemirror.net/img/dino/" + node.attrs.type + ".png",
      title: node.attrs.type,
      class: "dinosaur",
    }
  ],
  parseDOM: [
    {
      tag: "img[dino-type]",
      getAttrs: dom => {
        let type = dom.getAttribute("dino-type")
        return dinos.indexOf(type) > -1 ? {type} : false
      }
    },
  ]
}

const dinoSchema = new Schema({
  nodes: schema.spec.nodes.addBefore("image", "dino", dinoNodeSpec),
  marks: schema.spec.marks
})

let dinoType = dinoSchema.nodes.dino

function insertDino(type) {
  return function(state, dispatch) {
    console.log('Hello');
    console.log(state);

    let { $from } = state.selection;
    let index = $from.index();

    if (!$from.parent.canReplaceWith(index, index, dinoType)) {
      // console.log('Return earler');
      // return false
    }
    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(dinoType.create({type})))
    }
    return true
  }
}

function Editor(props) {
  const ref = useRef();

  useEffect(() => {
    const state = EditorState.create({
      schema,
      plugins: [
        history(),
        keymap({
          "Mod-z": undo,
          "Mod-y": redo,
          "Mod-k": insertDino('stegosaurus'),
        }),
        keymap(baseKeymap),
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
