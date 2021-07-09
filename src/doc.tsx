import { v4 as uuid } from 'uuid';

type BlockId = string;

type Block = TextBlock;

export class Cursor {
  public doc: Doc;

  public id: string;

  public blockId: BlockId;

  public range: {
    anchor: number;
    focus: number;
  } | null = null;

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
      blockId: this.blockId,
      range: this.range,
    }
  }

  set blockId(blockId: BlockId) {
    console.log('dispatch change');
    this.blockId = blockId;
  }
}

export class Doc {
  public id: string;

  private cursor: Cursor;

  private blocks: Block[];

  constructor(doc: {
    id?: string;
    cursor?: Cursor;
    blocks?: Block[];
  } = {}) {
    this.id = doc.id || uuid();
    this.cursor = doc.cursor ? new Cursor(doc.cursor) : new Cursor();
    this.cursor.doc = this;
    this.blocks = doc.blocks ? doc.blocks.map(b => new TextBlock(b)) : [];
  }

  public append(block: Block) {
    block.doc = this;
    block.parent = this;
    block.prev = this.blocks[this.blocks.length - 1] || null;
    block.next = null;
    this.blocks.push(block);
  }

  public find(id: BlockId): Block {
    function find(blocks: Block[], id: BlockId): Block {
      for (let i = 0; i < blocks.length; i += 1) {
        const block = blocks[i];
        if (block.id === id) {
          return block;
        }
        const b = find(block.children, id);
        if (b) {
          return b;
        }
      }
    }
    return find(this.blocks, id);
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
  public id: BlockId;

  public text: string;

  public children: Block[];

  public doc: Doc | null = null;

  public parent: Doc | Block | null = null;

  public prev: Block | null = null;

  public next: Block | null = null;

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
    block.parent = this;
    block.prev = this.children[this.children.length - 1] || null;
    block.next = null;
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
