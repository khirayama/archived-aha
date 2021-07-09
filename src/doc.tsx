import { v4 as uuid } from 'uuid';

type BlockId = string;

type Block = TextBlock;

export class Cursor {
  public doc: Doc;

  constructor(cursor: {
    id?: string;
    blockId?: BlockId | null;
    range?: {
      anchor: number;
      focus: number;
    } | null;
  } = {}) {
    this.id = cursor.id || uuid();
    this.blockId = cursor.blockId || null;
    this.range = cursor.range || null;
  }

  public toJSON() {
    return {
      id: this.id,
      range: this.range,
    }
  }
}

export class Doc {
  public id: string;

  private cursor: Cursor;

  private blocks: Block[];

  constructor(doc: {
    id?: string;
    cursor?: Cursor[];
    blocks?: Block[];
  } = {}) {
    this.id = doc.id || uuid();
    this.cursor = doc.cursor ? new Cursor(doc.cursor) : new Cursor();
    this.cursor.doc = this;
    this.blocks = doc.blocks ? doc.blocks.map(b => new TextBlock(b)) : [];
  }

  public append(block: Block) {
    block.doc = this;
    this.blocks.push(block);
  }

  public toJSON() {
    return {
      id: this.id,
      cursor: this.cursor.toJSON(),
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
    block.doc = this.doc;
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