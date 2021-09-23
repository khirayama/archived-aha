import * as React from 'react';

import { DocumentBlock, TextBlock, Cursor } from '../doc';
import { keyCodes } from '../keyCodes';

function projectSelectionToCursor(selection: Selection, cursor: Cursor): void {
  cursor.anchorId = selection.anchorNode?.parentNode.dataset.id || null;
  cursor.anchorOffset = selection.anchorOffset || 0;
  cursor.focusId = selection.focusNode?.parentNode.dataset.id || null;
  cursor.focusOffset = selection.focusOffset || 0;
  cursor.isCollapsed = selection.isCollapsed;
  doc.dispatch();
}

function onSelectionChange() {
  const selection = document.getSelection();
  if (doc && selection.anchorNode?.parentNode.dataset.id) {
    projectSelectionToCursor(selection, doc.cursor);
  }
}

function Block(props) {
  const block = props.block;
  return (
    <>
      <div data-id={block.id}>{block.text}</div>
      <div style={{paddingLeft: '1rem'}}>{block.children.map((b) => <Block key={b.id} block={b} />)}</div>
    </>
  );
}

function CursorViewer(props) {
  const cursor = props.cursor;
  return (
    <div style={{whiteSpace: 'pre'}}>{`
anchorId    : ${cursor.anchorId}
anchorOffset: ${cursor.anchorOffset}
focusId     : ${cursor.focusId}
focusOffset : ${cursor.focusOffset}
isCollapsed : ${cursor.isCollapsed}`}
    </div>
  );
}

let doc = null;

export default function SamplePage(props) {
  if (doc === null) {
    doc = new DocumentBlock(props.doc);
  }

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
    switch (event.keyCode) {
      case keyCodes.LEFT: {
        break;
      }
      case keyCodes.UP: {
        break;
      }
      case keyCodes.RIGHT: {
        break;
      }
      case keyCodes.DOWN: {
        break;
      }
      default: {
        if (event.metaKey /* TODO: Support Mac/Win/Linux */) {
        } else {
          event.preventDefault();
        }
      }
    }
  };

  return (
    <div>
      <CursorViewer cursor={doc.cursor} />
      <textarea />
      <div
        onKeyDown={onKeyDown}
        onMouseUp={() => document.querySelector('textarea').focus()}
      >
        {docJSON.children.map((block) => {
          return <Block key={block.id} block={block} />;
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
