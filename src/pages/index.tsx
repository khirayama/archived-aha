import * as React from 'react';

import { DocumentBlock, TextBlock, Cursor } from '../doc';
import { utils } from '../utils';
import { keyboardEventHandler } from '../keyboardEventHandler';
import { Block } from '../components/Block';

import styles from './index.module.scss';


let doc = null;

function onSelectionChange() {
  const selection = document.getSelection();
  if (doc && selection.anchorNode?.parentNode.dataset.id) {
    utils.projectSelectionToCursor(selection, doc.cursor);
    doc.dispatch();
  }
}

function CursorViewer(props) {
  const cursor = props.cursor;
  return (
    <div style={{whiteSpace: 'pre'}}>{`
anchorId    : ${cursor.anchorId}
anchorOffset: ${cursor.anchorOffset}
focusId     : ${cursor.focusId}
focusOffset : ${cursor.focusOffset}`}
    </div>
  );
}


export default function SamplePage(props) {
  if (doc === null) {
    doc = new DocumentBlock(props.doc);
  }

  const ref = React.useRef();

  React.useEffect(() => {
    document.addEventListener('selectionchange', onSelectionChange);
    doc.addChangeListener(() => {
      setDocJSON(doc.toJSON());
    });

    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      doc.removeChangeListener();
    };
  });

  const [docJSON, setDocJSON] = React.useState(doc.toJSON());

  const onKeyDown = (event) => {
    keyboardEventHandler(doc, event.keyCode, event.metaKey, event.shiftKey, event.ctrlKey);
    doc.dispatch();
  };

  const onPointerEnd = () => {
    const selection = document.getSelection();
    if (doc && selection.anchorNode?.parentNode.dataset.id) {
      utils.projectSelectionToCursor(selection, doc.cursor);
      doc.dispatch();
    }
    if (ref.current) {
      ref.current.focus();
    }
  }

  return (
    <div>
      <CursorViewer cursor={doc.cursor} />
      <input
        ref={ref}
        onKeyDown={onKeyDown}
      />
      <div
        onMouseUp={onPointerEnd}
        onTouchEnd={onPointerEnd}
      >
        {docJSON.children.map((block) => {
          return <Block key={block.id} block={block} cursor={doc.cursor} />;
        })}
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  doc = new DocumentBlock();
  const tb = new TextBlock({
    text: 'Hello',
  });
  const tb2 = new TextBlock({
    text: 'Hello 2',
  });
  const tb3 = new TextBlock({
    text: 'Hello 3',
  });
  const tb4 = new TextBlock({
    text: 'Hello 4',
  });
  const tb5 = new TextBlock({
    text: 'Hello 5',
  });
  const tb6 = new TextBlock({
    text: 'Hello 6',
  });
  const tb7 = new TextBlock({
    text: 'Hello 7',
  });

  doc.append(tb);
    tb.append(tb2);
      tb2.append(tb3);
      tb2.append(tb4);
  doc.append(tb5);
    tb5.append(tb6);
  doc.append(tb7);

  return {
    props: {
      doc: doc.toJSON(),
    }
  };
}
