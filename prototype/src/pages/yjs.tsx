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

export function keepSelectionPosition(sel: Selection) {
  if (sel.anchorNode === null) {
    return;
  }

  let blockElement = sel.anchorNode.parentElement;
  while (!blockElement.dataset.blockid) {
    blockElement = blockElement.parentElement;
  }
  const isTextBlock = blockElement.querySelector('[contenteditable]')?.childNodes[0] instanceof Text;
  const anchorOffset = sel.anchorOffset;
  const focusOffset = sel.focusOffset;

  afterRendering(() => {
    const range = document.createRange();
    const el = blockElement.querySelector('[contenteditable]') as HTMLDivElement | HTMLSpanElement;
    if (isTextBlock) {
      if (el.childNodes.length === 0) {
        el.appendChild(document.createTextNode(''));
      }
      const node = el.childNodes[0];
      range.setStart(node, anchorOffset);
      range.setEnd(node, focusOffset);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
    }
  });
}

export class YjsText extends React.Component {
  private ref: React.RefObject<HTMLParagraphElement>;

  constructor(props) {
    super(props);
    this.ref = React.createRef<HTMLParagraphElement>();
  }

  public shouldComponentUpdate(nextProps) {
    this.manualDiffPatch(nextProps);
    return false;
  }

  private manualDiffPatch(nextProps) {
    const el = this.ref.current;
    if (el.innerText !== nextProps.text) {
      keepSelectionPosition(document.getSelection());
      el.innerText = nextProps.text;
    }
  }

  public render() {
    let pos = 0;
    let diff = '';
    return (
      <p
        ref={this.ref}
        contentEditable
        dangerouslySetInnerHTML={{ __html: this.props.text }}
        onKeyDown={(event) => {
          const sel = document.getSelection();
          pos = sel.anchorOffset;
        }}
        onInput={(event) => {
          diff = event.nativeEvent.data;
        }}
        onKeyUp={(event) => {
          if (!event.nativeEvent.isComposing) {
            this.props.onChange(pos, diff);
          }
          pos = 0;
          diff = '';
        }}
      />
    );
  }
}

export default function YjsPage() {
  const [value, setValue] = useState(tmp.getText('text').toString());

  useEffect(() => {
    tmp.on('update', () => {
      console.log('update', tmp.getText('text').toString());
      setValue(tmp.getText('text').toString());
    });
  }, []);

  let pos = 0;
  let diff = '';
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
      <YjsText
        text={tmp.getText('text').toString()}
        onChange={(pos, diff) => {
          tmp.getText('text').insert(pos, diff);
          setTimeout(() => {
            tmp.getText('text').insert(0, '111');
          }, 5000);
        }}
      />
    </>
  );
}
