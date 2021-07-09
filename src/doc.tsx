import {v4 as uuid} from 'uuid';

type BlockId = string;

type Block = TextBlock;

export class Doc {
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
    block.doc = this;
    this.blocks.push(block);
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

export class TextBlock {
  public doc: Doc = null;

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
