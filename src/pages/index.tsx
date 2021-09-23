import * as React from 'react';

import { DocumentBlock, TextBlock, Cursor } from '../doc';
import { keyCodes } from '../keyCodes';
import { utils } from '../utils';

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
    const meta = event.metaKey;
    const shift = event.shiftKey;

    switch (event.keyCode) {
      case keyCodes.LEFT: {
        const block = doc.find(doc.cursor.focusId);
        if (meta && shift) {
          doc.cursor.focusOffset = 0;
        } else if (shift) {
          const offset = doc.cursor.focusOffset - 1;
          if (offset >= 0) {
            doc.cursor.focusOffset = offset;
          } else {
            const upperBlock = utils.findUpperBlock(block.id, doc);
            if (upperBlock && upperBlock.hasText()) {
              doc.cursor.focusId = upperBlock.id;
              doc.cursor.focusOffset = upperBlock.text.length;
            }
          }
        } else {
          if (doc.cursor.anchorOffset === doc.cursor.focusOffset) {
            const offset = doc.cursor.focusOffset - 1;
            if (offset >= 0) {
              doc.cursor.anchorOffset = offset;
              doc.cursor.focusOffset = offset;
            } else {
              const upperBlock = utils.findUpperBlock(block.id, doc);
              if (upperBlock && upperBlock.hasText()) {
                doc.cursor.anchorId = upperBlock.id;
                doc.cursor.anchorOffset = upperBlock.text.length;
                doc.cursor.focusId = upperBlock.id;
                doc.cursor.focusOffset = upperBlock.text.length;
              }
            }
          } else {
            const upper = utils.upper(doc.cursor.anchorId, doc.cursor.focusId, doc);
            const offset = doc.cursor.anchorId === doc.cursor.focusId ? Math.min(doc.cursor.anchorOffset, doc.cursor.focusOffset) : upper.id === doc.cursor.anchorId ? doc.cursor.anchorOffset : doc.cursor.focusOffset;
            doc.cursor.anchorId = upper.id;
            doc.cursor.anchorOffset = offset;
            doc.cursor.focusId = upper.id;
            doc.cursor.focusOffset = offset;
          }
        }
        doc.dispatch();
        break;
      }
      case keyCodes.UP: {
        break;
      }
      case keyCodes.RIGHT: {
        const block = doc.find(doc.cursor.focusId);
        if (meta && shift) {
          doc.cursor.focusOffset = block.text.length;
        } else if (shift) {
          const offset = doc.cursor.focusOffset + 1;
          if (offset <= block.text.length) {
            doc.cursor.focusOffset = offset;
          } else {
            const downerBlock = utils.findDownerBlock(block.id, doc);
            if (downerBlock && downerBlock.hasText()) {
              doc.cursor.focusId = downerBlock.id;
              doc.cursor.focusOffset = 0;
            }
          }
        } else {
          if (doc.cursor.anchorOffset === doc.cursor.focusOffset) {
            const offset = doc.cursor.focusOffset + 1;
            if (offset <= block.text.length) {
              doc.cursor.anchorOffset = offset;
              doc.cursor.focusOffset = offset;
            } else {
              const downerBlock = utils.findDownerBlock(block.id, doc);
              if (downerBlock && downerBlock.hasText()) {
                doc.cursor.anchorId = downerBlock.id;
                doc.cursor.anchorOffset = 0;
                doc.cursor.focusId = downerBlock.id;
                doc.cursor.focusOffset = 0;
              }
            }
          } else {
            const downer = utils.downer(doc.cursor.anchorId, doc.cursor.focusId, doc);
            const offset = doc.cursor.anchorId === doc.cursor.focusId ? Math.min(doc.cursor.anchorOffset, doc.cursor.focusOffset) : downer.id === doc.cursor.anchorId ? doc.cursor.anchorOffset : doc.cursor.focusOffset;
            doc.cursor.anchorId = downer.id;
            doc.cursor.anchorOffset = offset;
            doc.cursor.focusId = downer.id;
            doc.cursor.focusOffset = offset;
          }
        }
        doc.dispatch();
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

  const onPointerEnd = () => {
    const selection = document.getSelection();
    if (doc && selection.anchorNode?.parentNode.dataset.id) {
      projectSelectionToCursor(selection, doc.cursor);
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
