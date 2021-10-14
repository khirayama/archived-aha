import { EditorState, AllSelection, TextSelection, Selection, NodeSelection, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { undo, redo, history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { canSplit } from 'prosemirror-transform';
import React, { useEffect, useRef } from 'react';

// import { dropCursor } from 'prosemirror-dropcursor';
// import { schema } from "prosemirror-schema-basic";
// import { baseKeymap } from "prosemirror-commands"

import { Schema } from 'prosemirror-model';

import styles from './prototype.module.scss';

function defaultBlockAt(match) {
  for (let i = 0; i < match.edgeCount; i++) {
    let { type } = match.edge(i);
    if (type.isTextblock && !type.hasRequiredAttrs()) return type;
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
  newlineInCode: (state, dispatch) => {
    console.log('start: newlineInCode');
    const { $head, $anchor } = state.selection;

    if (!$head.parent.type.spec.code || !$head.sameParent($anchor)) {
      return false;
    }

    if (dispatch) {
      dispatch(state.tr.insertText('\n').scrollIntoView());
    }

    console.log('end: newlineInCode');
    return true;
  },
  createParagraphNear: (state, dispatch) => {
    console.log('start: createparagraphNear');
    const sel = state.selection;
    const { $from, $to } = sel;

    if (sel instanceof AllSelection || $from.parent.inlineContent || $to.parent.inlineContent) {
      return false;
    }

    const type = defaultBlockAt($to.parent.contentMatchAt($to.indexAfter()));

    if (!type || !type.isTextblock) {
      return false;
    }

    if (dispatch) {
      const side = (!$from.parentOffset && $to.index() < $to.parent.childCount ? $from : $to).pos;
      const tr = state.tr.insert(side, type.createAndFill());
      tr.setSelection(TextSelection.create(tr.doc, side + 1));
      dispatch(tr.scrollIntoView());
    }
    console.log('end: createparagraphNear');
    return true;
  },
  liftEmptyBlock: (state, dispatch) => {
    console.log('start: liftEmptyBlock');
    let { $cursor } = state.selection;
    if (!$cursor || $cursor.parent.content.size) return false;
    if ($cursor.depth > 1 && $cursor.after() != $cursor.end(-1)) {
      let before = $cursor.before();
      if (canSplit(state.doc, before)) {
        if (dispatch) dispatch(state.tr.split(before).scrollIntoView());
        return true;
      }
    }
    let range = $cursor.blockRange(),
      target = range && liftTarget(range);
    if (target == null) return false;
    if (dispatch) dispatch(state.tr.lift(range, target).scrollIntoView());
    console.log('end: liftEmptyBlock');
    return true;
  },
  splitBlock: (state, dispatch) => {
    console.log('start: splitBlock');
    let { $from, $to } = state.selection;
    if (state.selection instanceof NodeSelection && state.selection.node.isBlock) {
      if (!$from.parentOffset || !canSplit(state.doc, $from.pos)) return false;
      if (dispatch) dispatch(state.tr.split($from.pos).scrollIntoView());
      return true;
    }

    if (!$from.parent.isBlock) return false;

    if (dispatch) {
      let atEnd = $to.parentOffset == $to.parent.content.size;
      let tr = state.tr;
      if (state.selection instanceof TextSelection || state.selection instanceof AllSelection) tr.deleteSelection();
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
    console.log('end: splitBlock');
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
            class: styles[`indent-${node.attrs.indent}`],
          },
          0,
        ];
      },
    },
    text: {},
  },
});

let preventTabKeyPlugin = new Plugin({
  props: {
    handleKeyDown(view, event) {
      if (event.keyCode === 9 /* TAB */) {
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
        preventTabKeyPlugin,
        history(),
        keymap({
          'Mod-z': undo,
          'Mod-y': redo,
          Tab: commands.indent,
          'Shift-Tab': commands.unindent,
          Escape: commands.selectBlock,
          Enter: commands.chainCommands(
            commands.newlineInCode,
            commands.createParagraphNear,
            commands.liftEmptyBlock,
            commands.splitBlock,
          ),
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
