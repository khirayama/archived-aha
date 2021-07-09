import * as React from 'react';

import { Doc, TextBlock } from '../doc';

let doc = null;

export default function IndexPage(props) {
  const [value, setValue] = React.useState('');
  const onChange = React.useCallback((event: React.FormEvent<HTMLInputElement>) => {
    const val = event.currentTarget.value;
    setValue(val);
  });

  if (doc === null) {
    doc = new Doc(props.doc);
  }

  return (
    <div>
      <input type="text" value={value} onChange={onChange} />
      <div style={{whiteSpace: 'pre'}}>{doc === null ? null : JSON.stringify(doc.toJSON(), null, 2)}</div>
    </div>
  );
}

export async function getServerSideProps(context) {
  doc = new Doc();
  const tb = new TextBlock(doc, 'Hello');
  doc.append(tb);

  return {
    props: {
      doc: doc.toJSON(),
    }
  };
}
