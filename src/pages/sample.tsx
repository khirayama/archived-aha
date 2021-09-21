import * as React from 'react';

import { DocumentBlock, TextBlock } from '../doc';
import { keyCodes } from '../keyCodes';

let doc = null;

export default function SamplePage(props) {
  if (doc === null) {
    doc = new DocumentBlock(props.doc);
  }
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
        if (event.metaKey) {
        } else {
          event.preventDefault();
        }
      }
    }
  };

  const [items, setItems] = React.useState(['aaaaa', 'bbbbb']);

  setTimeout(() => {
    setItems([
      'aaa',
      'bbbbb',
      'ccccc',
    ])
  }, 3000)

  return (
    <div>
      <div
        contentEditable
        onKeyDown={onKeyDown}
      >
        {items.map((item, i) => {
          return <div key={i} style={{ padding: `0 0 0 ${i}rem` }}>{item}</div>
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
