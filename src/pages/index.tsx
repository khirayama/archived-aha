import * as React from 'react';

import { Doc, TextBlock } from '../doc';
import { keyCodes } from '../keyCodes';

let doc = null;

function Block({block}) {
  const style = {
    display: 'block',
    verticalAlign: 'top',
    whiteSpace: 'pre',
    background: 'rgba(100, 0, 0, 0.05)',
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
          return <Block key={b.id} block={b} />
        })}
      </span>
      <span>{`  ]
}`}
      </span>
    </span>
  );
}

export default function IndexPage(props) {
  const [value, setValue] = React.useState('');
  const [keyCode, setKeyCode] = React.useState(null);

  const onChange = React.useCallback((event: React.FormEvent<HTMLInputElement>) => {
    const val = event.currentTarget.value;
    setValue(val);
  }, []);
  const onKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    const keyCode = event.keyCode;

    if (keyCode === keyCodes.DOWN) {
      console.log('move cursor.range.id to next block.');
    } else if (keyCode === keyCodes.UP) {
      console.log('move cursor.range.id to prev block.');
    } else if (keyCode === keyCodes.LEFT) {
      console.log('increment cursor.range.focus.');
    }

    setKeyCode(keyCode);
  }, []);

  if (doc === null) {
    doc = new Doc(props.doc);
  }
  const docJSON = doc.toJSON();
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
  range: ${cursor.range === null ? 'null' : (`
    id: "${cursor.range.id}",
    anchor: ${cursor.range.anchor},
    focus: ${cursor.range.focus},
  `)}
}`
        }
      </div>
      <h3>Blocks</h3>
      {docJSON.blocks.map((b) => {
        return <Block key={b.id} block={b} />
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
  tb.append(tb2);
  doc.append(tb);

  return {
    props: {
      doc: doc.toJSON(),
    }
  };
}
