import { EditorState, AllSelection, TextSelection, Selection, NodeSelection, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { undo, redo, history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import React, { useEffect, useRef } from 'react';

import { customKeymap } from '../libs/commands';
import { schema, buildInputRules } from '../libs/schema';

import styles from './prosemirror.module.scss';

/* TODO
 * - Add Image node
 * - Add sytle for sorting
 * - Add Link node
 * - Add Todo node
 * - Add Heading node
 * - Add schedule feature
 * - Export as markdown like text file
 */

// [prosemirror-test-custom-nodeview - CodeSandbox](https://codesandbox.io/s/vwcrt?file=/src/index.js)
// [ProseMirror Guide](https://prosemirror.net/docs/guide/)
// How to build custom node view

let myPlugin = new Plugin({
  props: {
    handleDOMEvents: {
      mousedown: function (view, event) {
        let el = event.target;
        while (!el.classList.contains(styles['handle']) && el !== document.body) {
          el = el.parentNode;
        }

        if (el == document.body) {
          return;
        }
        const blockEl = el.parentNode;
        this.sort = {
          start: blockEl,
          end: null,
        };
      },
      mousemove: function (view, event) {
        if (this.sort && this.sort.start) {
          event.preventDefault();
          let blockEl = event.target;
          while (blockEl.getAttribute('indent') === null) {
            blockEl = blockEl.parentNode;
          }
          this.sort.end = blockEl;
        }
      },
      mouseup: function (view, event) {
        if (this.sort && this.sort.start && this.sort.end && this.sort.start !== this.sort.end) {
          const els = document.querySelectorAll('[indent]');
          let direction: 'up' | 'down' = 'down';

          let position = 'afterend';
          for (let i = 0; i < els.length; i += 1) {
            const el = els[i];
            if (el === this.sort.start || el === this.sort.end) {
              direction = this.sort.start === el ? 'down' : 'up';
              break;
            }
          }
          const targets = [];
          for (let i = 0; i < els.length; i += 1) {
            const el = els[i];
            if (el === this.sort.start) {
              const indent = Number(el.getAttribute('indent'));
              targets.push(el);
              for (let j = i + 1; j < els.length; j += 1) {
                const targetIndent = Number(els[j].getAttribute('indent'));
                if (targetIndent > indent) {
                  targets.push(els[j]);
                } else {
                  break;
                }
              }
              break;
            }
          }

          if (direction === 'down') {
            for (let i = targets.length - 1; 0 <= i; i -= 1) {
              const target = targets[i];
              this.sort.end.insertAdjacentElement('afterend', target);
            }
          } else {
            for (let i = 0; i < targets.length; i += 1) {
              const target = targets[i];
              this.sort.end.insertAdjacentElement('beforebegin', target);
            }
          }
        }
        this.sort = {
          start: null,
          end: null,
        };
      },
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

export let view = null;

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

    view = new EditorView(ref.current, {
      state,
      dispatchTransaction: (transaction) => {
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
