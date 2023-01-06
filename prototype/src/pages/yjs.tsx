import React, { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';

const doc1 = new Y.Doc();
const doc2 = new Y.Doc();

doc1.on('update', (update) => {
  Y.applyUpdate(doc2, update);
});

doc2.on('update', (update) => {
  Y.applyUpdate(doc1, update);
});

doc1.getArray('myarray').insert(0, ['Hello doc2, you got this?']);
doc2.getArray('myarray').get(0);
// console.log(doc1.toJSON(), doc2.toJSON());

type Page = {
  title: string;
  sections: Section[];
};

type Section = {
  heading: string;
  items: Item[];
};

type Item = {
  text: string;
  indent: number;
};

const page = new Y.Doc();
page.getText('title').insert(0, 'THIS IS TITLE');
const section0 = new Y.Map();
section0.set('heading', new Y.Text('THIS IS HEADING OF SECTION 0'));
page.getArray('sections').insert(0, [section0]);
const items0 = new Y.Array();
const item0 = new Y.Map();
items0.insert(0, [item0]);
section0.set('items', items0);
item0.set('text', new Y.Text('THIS IS TASK'));
const txt = item0.get('text');
txt.insert(7, ' FIRST');
// console.log(page.toJSON());

const tmp = new Y.Doc();
const val = tmp.getText('text').insert(0, 'THIS IS SAMPLE TEXT');
console.log(tmp.getText('text').toString());

type YjsTextareProps = {
  text: Y.Text;
};

export class YjsTextarea extends React.Component<YjsTextareProps> {
  private ref: React.RefObject<HTMLParagraphElement>;

  private sel: {
    prev: {
      anchorOffset: number;
      focusOffset: number;
    } | null;
    current: {
      anchorOffset: number;
      focusOffset: number;
    } | null;
  } = {
    prev: null,
    current: null,
  };

  private text: {
    prev: string | null;
    current: string | null;
  } = {
    prev: null,
    current: null,
  };

  private isComposing: boolean = false;

  constructor(props) {
    super(props);
    this.ref = React.createRef<HTMLParagraphElement>();
  }

  public componentDidMount() {
    this.text.current = this.ref.current.textContent.toString();
    this.sel.current = {
      anchorOffset: document.getSelection().anchorOffset,
      focusOffset: document.getSelection().focusOffset,
    };
    this.forceUpdate(); // debug

    this.props.text.doc.on('update', () => {
      const expect = this.props.text.toString();
      const actual = this.ref.current.textContent.toString();
      console.log('text:', expect);
      console.log('dom :', actual);
      if (expect !== actual) {
        console.warn('Does not match, "' + expect + '" and "' + actual + '"');
      }
    });

    const update = () => {
      if (
        (this.sel.prev.anchorOffset === this.sel.current.anchorOffset &&
          this.sel.prev.focusOffset === this.sel.current.focusOffset) ||
        this.sel.prev === null
      ) {
        return;
      }

      this.text.prev = this.text.current;
      this.text.current = this.ref.current.textContent.toString();
      const prevText = new Text(this.text.prev);
      const currentText = new Text(this.text.current);

      const isPrevCollapsed = this.sel.prev.anchorOffset === this.sel.prev.focusOffset;
      if (isPrevCollapsed) {
        if (prevText.length <= currentText.length) {
          const index = this.sel.prev.anchorOffset;
          const end = this.sel.current.focusOffset;
          let txt = new Text(this.text.current);
          txt.splitText(end);
          txt = txt.splitText(index);
          console.log('insert', index, txt.textContent);
        } else {
          const index = this.sel.prev.anchorOffset;
          const end = this.sel.current.focusOffset;
          const length = index - end;
          console.log('delete', index, length);
        }
      } else {
        // const index = this.sel.prev.anchorOffset;
        // const end = this.sel.current.anchorOffset;
        // const length = index - end;
        // console.log('--- start delete and insert ---');
        // console.log('delete', index, length);
        // let txt = new Text(this.ref.current.textContent);
        // txt.splitText(end);
        // txt = txt.splitText(index);
        // console.log('insert', index, txt.textContent);
        // console.log('--- end delete and insert ---');
      }
    };

    const updateSelection = () => {
      if (this.sel.prev) {
        this.sel.prev.anchorOffset = this.sel.current.anchorOffset;
        this.sel.prev.focusOffset = this.sel.current.focusOffset;
      } else {
        this.sel.prev = {
          anchorOffset: this.sel.current.anchorOffset,
          focusOffset: this.sel.current.focusOffset,
        };
      }
      this.sel.current = {
        anchorOffset: document.getSelection().anchorOffset,
        focusOffset: document.getSelection().focusOffset,
      };
    };

    let isSelectionUpdated = false;
    const observer = new MutationObserver((mutations) => {
      isSelectionUpdated = true;
      if (!this.isComposing) {
        this.ref.current.normalize();
        updateSelection();
        update();
      }
      this.forceUpdate(); // debug
    });
    observer.observe(this.ref.current, {
      characterData: true,
      attributes: true,
      childList: true,
      subtree: true,
    });

    document.addEventListener('selectionchange', () => {
      if (!isSelectionUpdated && !this.isComposing) {
        if (this.ref.current.childNodes?.length > 1) {
          this.ref.current.normalize();
        }
        updateSelection();
      }
      isSelectionUpdated = false;
      this.forceUpdate(); // debug
    });
    this.ref.current.addEventListener('focus', (event) => {
      updateSelection();
    });
    this.ref.current.addEventListener('compositionstart', (event) => {
      if (this.ref.current.childNodes?.length > 1) {
        this.ref.current.normalize();
      }
      updateSelection();
      this.isComposing = true;
    });
    this.ref.current.addEventListener('compositionend', (event) => {
      this.isComposing = false;
      if (this.ref.current.childNodes?.length > 1) {
        this.ref.current.normalize();
      }
      updateSelection();
      update();
    });
  }

  public render() {
    return (
      <>
        <p
          ref={this.ref}
          contentEditable
          dangerouslySetInnerHTML={{ __html: this.props.text }}
          onKeyDown={(event) => {
            const sel = document.getSelection();
            // this.delta.pos = sel.anchorOffset;
          }}
          onInput={(event) => {
            // this.delta.diff = event.nativeEvent.data || '';
          }}
          onKeyUp={(event) => {
            if (!event.nativeEvent.isComposing) {
              // this.props.text.insert(this.delta.pos, this.delta.diff);
            }
            // this.delta.pos = 0;
            // this.delta.diff = '';
          }}
          onCut={(event) => {
            console.log('cut', event);
          }}
          onPaste={(event) => {
            event.preventDefault();

            const text = event.clipboardData.getData('text/plain');
            const sel = window.getSelection();
            sel.deleteFromDocument();
            const txt = new Text(text);
            const range = sel.getRangeAt(0);
            range.insertNode(txt);
            range.setStart(txt, txt.length);
            range.setEnd(txt, txt.length);
          }}
        />
        <div style={{ whiteSpace: 'pre' }}>{JSON.stringify(this.isComposing, null, 2)}</div>
        <div style={{ whiteSpace: 'pre' }}>{JSON.stringify(this.text, null, 2)}</div>
        <div style={{ whiteSpace: 'pre' }}>{JSON.stringify(this.sel, null, 2)}</div>
      </>
    );
  }
}

export default function YjsPage() {
  useEffect(() => {
    tmp.on('update', () => {
      // console.log('update');
    });
  }, []);

  return (
    <>
      <h1>yjs</h1>
      <input
        onKeyDown={(e) => console.log(e.type)}
        onKeyUp={(e) => console.log(e.type)}
        onKeyPress={(e) => console.log(e.type)}
        onInput={(e) => console.log(e.type)}
        onChange={(e) => console.log(e.type)}
      />
      <YjsTextarea text={tmp.getText('text')} />
    </>
  );
}
