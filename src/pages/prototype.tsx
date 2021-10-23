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

function defaultBlockAt(match) {
  for (let i = 0; i < match.edgeCount; i++) {
    let { type } = match.edge(i);
    if (type.isTextblock && !type.hasRequiredAttrs()) return type;
  }
  return null;
}

function findCutAfter($pos) {
  if (!$pos.parent.type.spec.isolating) {
    for (let i = $pos.depth - 1; i >= 0; i--) {
      let parent = $pos.node(i);
      if ($pos.index(i) + 1 < parent.childCount) return $pos.doc.resolve($pos.after(i + 1));
      if (parent.type.spec.isolating) break;
    }
  }
  return null;
}

// https://github.com/ProseMirror/prosemirror-commands/blob/98044bfbff967a323d5c03734a8bf3b5863d3352/src/commands.js
const commands = {
  chainCommands: (...commands) => {
    return function (state, dispatch, view) {
      for (let i = 0; i < commands.length; i++) if (commands[i](state, dispatch, view)) return true;
      return false;
    };
  },
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
  deleteSelection: (state, dispatch, view) => {
    console.log('deleteSelection: call');
    if (state.selection.empty) {
      console.log(state.selection);
      console.log('deleteSelection: selection empty case');
      return false;
    }
    if (dispatch) {
      console.log('deleteSelection: dispatch case');
      dispatch(state.tr.deleteSelection().scrollIntoView());
    }
    console.log('deleteSelection: return true');
    return true;
  },
  joinForward: (state, dispatch, view) => {
    console.log('joinForward: call');
    let { $cursor } = state.selection;
    if (
      !$cursor ||
      (view ? !view.endOfTextblock('forward', state) : $cursor.parentOffset < $cursor.parent.content.size)
    ) {
      console.log('joinForward: not head case');
      return false;
    }

    let $cut = findCutAfter($cursor);

    if (!$cut) {
      console.log('joinForward: not cut case');
      return false;
    }

    let after = $cut.nodeAfter;
    if (deleteBarrier(state, $cut, dispatch)) {
      console.log('joinForward: not cut case');
      return true;
    }

    if ($cursor.parent.content.size == 0 && (textblockAt(after, 'start') || NodeSelection.isSelectable(after))) {
      if (dispatch) {
        console.log('joinForward: dispatch case');
        let tr = state.tr.deleteRange($cursor.before(), $cursor.after());
        tr.setSelection(
          textblockAt(after, 'start')
            ? Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos)), 1)
            : NodeSelection.create(tr.doc, tr.mapping.map($cut.pos)),
        );
        dispatch(tr.scrollIntoView());
      }

      console.log('joinForward: return true with content zero');
      return true;
    }

    if (after.isAtom && $cut.depth == $cursor.depth - 1) {
      if (dispatch) {
        console.log('joinForward: dispatch case');
        dispatch(state.tr.delete($cut.pos, $cut.pos + after.nodeSize).scrollIntoView());
      }
      console.log('joinForward: return true with atom');
      return true;
    }

    console.log('joinForward: return false');
    return false;
  },
  selectNodeForward: (state, dispatch, view) => {
    console.log('selectNodeForward: call');
    const { $head, empty } = state.selection;
    const $cut = $head;
    if (!empty) {
      console.log('selectNodeForward: not empty case');
      return false;
    }
    if ($head.parent.isTextblock) {
      console.log('selectNodeForward: isTextBlock case');
      if (view ? !view.endOfTextblock('forward', state) : $head.parentOffset < $head.parent.content.size) {
        console.log('selectNodeForward: state case');
        return false;
      }
      $cut = findCutAfter($head);
    }
    let node = $cut && $cut.nodeAfter;
    if (!node || !NodeSelection.isSelectable(node)) {
      console.log('selectNodeForward: false return');
      return false;
    }
    if (dispatch) {
      console.log('selectNodeForward: dispatch');
      dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos)).scrollIntoView());
    }
    console.log('selectNodeForward: true return');
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
          'paragraph',
          {
            class: styles[`indent-${node.attrs.indent}`],
            indent: node.attrs.indent,
          },
          0,
        ];
      },
      parseDOM: [
        {
          tag: 'paragraph',
          getAttrs: (dom) => {
            console.log(dom.getAttribute('indent'));
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

const del = commands.chainCommands(
  commands.deleteSelection,
  // commands.joinForward,
  // commands.selectNodeForward,
);
// console.log(baseKeymap);
// baseKeymap['Delete'] = undefined;
// baseKeymap['Backspace'] = undefined;
baseKeymap['Enter'] = undefined;
baseKeymap['Mod-Enter'] = undefined;

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
          // Escape: commands.selectBlock,
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
