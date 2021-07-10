import * as React from 'react';

import { Doc, TextBlock } from '../doc';
import { keyCodes } from '../keyCodes';
import { utils } from '../utils';

let doc = null;

function Block({block, cursor}) {
  const style = {
    display: 'block',
    verticalAlign: 'top',
    whiteSpace: 'pre',
    background: block.id === cursor.blockId && cursor.range === null ? 'green' : 'rgba(100, 0, 0, 0.05)',
  };

  return (
    <span style={style}>
      <span>
        {`{
  id: "${block.id}",
  text: "${block.text}",
  children: [`}</span>
      <span style={{paddingLeft: '1em', display: 'block'}}>
        {block.children.map((b) => {
          return <Block key={b.id} block={b} cursor={cursor} />
        })}
      </span>
      <span>{`  ]
}`}
      </span>
    </span>
  );
}

export default function IndexPage(props) {
  if (doc === null) {
    doc = new Doc(props.doc);
  }

  const [docJSON, setDocJSON] = React.useState(doc.toJSON());
  const [value, setValue] = React.useState('');
  const [keyCode, setKeyCode] = React.useState(null);

  const onChange = React.useCallback((event: React.FormEvent<HTMLInputElement>) => {
    const val = event.currentTarget.value;
    setValue(val);
  }, []);
  const onKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    const keyCode = event.keyCode;

    if (keyCode === keyCodes.DOWN) {
      if (doc.cursor.blockId === null) {
        const firstId = doc.children[0].id;
        const firstBlock = doc.find(firstId);
        doc.cursor.blockId = firstBlock.id
        if (doc.cursor.range !== null) {
          doc.cursor.range = {
            anchor: firstBlock.text.length,
            focus: firstBlock.text.length,
          };
        }
      } else {
        const downer = utils.findDownerBlock(doc.cursor.blockId, doc);
        if (downer) {
          doc.cursor.blockId = downer.id;
          if (doc.cursor.range !== null) {
            doc.cursor.range = {
              anchor: downer.text.length,
              focus: downer.text.length,
            };
          }
        }
      }
    } else if (keyCode === keyCodes.UP) {
      if (doc.cursor.blockId === null) {
        const lastId = doc.children[doc.children.length - 1].id;
        const lastBlock = doc.find(lastId);
        doc.cursor.blockId = lastBlock.id
        if (doc.cursor.range !== null) {
          doc.cursor.range = {
            anchor: lastBlock.text.length,
            focus: lastBlock.text.length,
          };
        }
      } else {
        const upper = utils.findUpperBlock(doc.cursor.blockId, doc);
        if (upper) {
          doc.cursor.blockId = upper.id;
          if (doc.cursor.range !== null) {
            doc.cursor.range = {
              anchor: upper.text.length,
              focus: upper.text.length,
            };
          }
        }
      }
    } else if (keyCode === keyCodes.LEFT) {
      console.log('increment cursor.range.focus.');
    } else {
      setKeyCode(keyCode);
    }
    setDocJSON(doc.toJSON());
  }, []);

  const cursor = docJSON.cursor;

  return (
    <div>
      <input type="text" value={value} onChange={onChange} onKeyDown={onKeyDown} autoFocus />
      <div>
        <span>keyCode: {keyCode}</span>
      </div>
      <h3>Cursor</h3>
      <div style={{whiteSpace: 'pre'}}>
        {`{
  id: "${cursor.id}",
  blockId: "${cursor.blockId}",
  range: ${cursor.range === null ? 'null' : (`
    anchor: ${cursor.range.anchor},
    focus: ${cursor.range.focus},
  `)}
}`
        }
      </div>
      <h3>Blocks</h3>
      {docJSON.children.map((b) => {
        return <Block key={b.id} block={b} cursor={cursor} />
      })}
    </div>
  );
}

export async function getServerSideProps(context) {
  doc = new Doc();
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

  tb.append(tb2);
  doc.append(tb);
  doc.append(tb3);
  doc.append(tb4);

  return {
    props: {
      doc: doc.toJSON(),
    }
  };
}
