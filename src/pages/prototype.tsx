import { EditorState, AllSelection, TextSelection, Selection, NodeSelection, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { undo, redo, history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { canSplit } from 'prosemirror-transform';
import React, { useEffect, useRef } from 'react';

// import { dropCursor } from 'prosemirror-dropcursor';
// import { schema } from "prosemirror-schema-basic";
import { baseKeymap } from 'prosemirror-commands';

import { Schema } from 'prosemirror-model';

import styles from './prototype.module.scss';

/*
 * - [x] Indent / Outdent
 * - [ ] Copy / Past
 *   - https://prosemirror.net/docs/ref/#view.EditorProps.handlePaste
 */

// https://github.com/ProseMirror/prosemirror-commands/blob/98044bfbff967a323d5c03734a8bf3b5863d3352/src/commands.js
const commands = {
  splitBlock: (state, dispatch) => {
    let { $from, $to } = state.selection;

    if (dispatch) {
      let atEnd = $to.parentOffset == $to.parent.content.size;
      let tr = state.tr;
      if (state.selection instanceof TextSelection || state.selection instanceof AllSelection) {
        tr.deleteSelection();
      }
      const node = $from.node();
      let deflt = $from.depth == 0 ? null : defaultBlockAt($from.node(-1).contentMatchAt($from.indexAfter(-1)));
      let types = atEnd && deflt ? [{ type: deflt, attrs: { indent: node.attrs.indent } }] : null;
      let can = canSplit(tr.doc, tr.mapping.map($from.pos), 1, types);
      if (!types && !can && canSplit(tr.doc, tr.mapping.map($from.pos), 1, deflt && [{ type: deflt }])) {
        types = [{ type: deflt, attrs: { indent: node.attrs.indent } }];
        can = true;
      }
      if (can) {
        tr.split(tr.mapping.map($from.pos), 1, types);
        if (!atEnd && !$from.parentOffset && $from.parent.type != deflt) {
          let first = tr.mapping.map($from.before()),
            $first = tr.doc.resolve(first);
          if ($from.node(-1).canReplaceWith($first.index(), $first.index() + 1, deflt))
            tr.setNodeMarkup(tr.mapping.map($from.before()), deflt);
        }
      }
      dispatch(tr.scrollIntoView());
    }
    return true;
  },
  indent: (state, dispatch, view) => {
    let tr = state.tr;
    state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
      if (node.type.attrs.indent) {
        tr.setNodeMarkup(pos, null, {
          indent: Math.min(node.attrs.indent + 1, 8),
        });
      }
    });
    view.dispatch(tr);
  },
  unindent: (state, dispatch, view) => {
    let tr = state.tr;
    state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
      if (node.type.attrs.indent) {
        tr.setNodeMarkup(pos, null, {
          indent: Math.max(node.attrs.indent - 1, 0),
        });
      }
    });
    view.dispatch(tr);
  },
};

const schema = new Schema({
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
      toDOM: (node) => {
        return [
          'div',
          {
            type: 'paragraph',
            indent: node.attrs.indent,
            class: styles[`indent-${node.attrs.indent}`],
          },
          0,
        ];
      },
      parseDOM: [
        {
          tag: 'div',
          attrs: {
            type: 'paragraph',
          },
          getAttrs: (dom) => {
            return {
              indent: dom.indent,
            };
          },
        },
      ],
    },
    text: {},
  },
});

let preventTabKeyPlugin = new Plugin({
  props: {
    handleKeyDown(view, event) {
      if (event.keyCode === 9 /* Tab */) {
        event.preventDefault();
      }
    },
  },
});

baseKeymap['Enter'] = undefined;

function Editor(props) {
  const ref = useRef();

  useEffect(() => {
    const state = EditorState.create({
      schema,
      plugins: [
        preventTabKeyPlugin,
        history(),
        keymap(baseKeymap),
        keymap({
          'Mod-z': undo,
          'Mod-y': redo,
          Tab: commands.indent,
          'Shift-Tab': commands.unindent,
          Enter: commands.splitBlock,
          'Mod-Enter': commands.splitBlock,
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
