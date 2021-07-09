import * as React from 'react';
import {v4 as uuid} from 'uuid';

type BlockId = string;

type Block = TextBlock;

class Doc {
  public id: string;

  private blocks: Block[];

  constructor(doc: {
    id?: string;
    blocks?: Block[];
  } = {}) {
    this.id = doc.id || uuid();
    this.blocks = doc.blocks ? doc.blocks.map(b => new TextBlock(b)) : [];
  }

  public append(block: Block) {
    if (!this.blocks[block.id]) {
      this.blocks.push(block);
    }
  }

  public toJSON() {
    return {
      id: this.id,
      blocks: this.blocks.map((b) => {
        return b.toJSON();
      }),
    };
  }
}

class TextBlock {
  public doc: Doc;

  public id: BlockId;

  public text: string;

  public children: Block[];

  constructor(block: {
    id?: BlockId;
    text: string;
    children?: Block[];
  }) {
    this.id = block.id || uuid();
    this.text = block.text || '';
    this.children = block.children ? block.children.map((b) => new TextBlock(b)) : [];
  }

  public append(block: Block) {
    this.children.push(block);
  }

  public toJSON() {
    return {
      id: this.id,
      text: this.text,
      children: this.children.map((b) => b.toJSON()),
    };
  }
}

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
