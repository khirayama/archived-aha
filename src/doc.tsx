import { v4 as uuid } from 'uuid';

export type BlockId = string;

export type Block = TextBlock;

export class Cursor {
  public doc: DocumentBlock;

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
}

export class DocumentBlock {
  public id: string;

  private cursor: Cursor;

  private children: Block[] = [];

  constructor(doc: {
    id?: string;
    cursor?: Cursor;
    children?: Block[];
  } = {}) {
    this.id = doc.id || uuid();
    this.cursor = doc.cursor ? new Cursor(doc.cursor) : new Cursor();
    this.cursor.doc = this;
    if (doc.children) {
      for (let i = 0; i < doc.children.length; i += 1) {
        const block = new TextBlock(doc.children[i]);
        this.append(block);
      }
    }
  }

  public append(block: Block) {
    block.doc = this;
    block.parent = this;
    block.prev = this.children[this.children.length - 1] || null;
    if (block.prev) {
      block.prev.next = block;
    }
    block.next = null;
    this.children.push(block);
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
    return find(this.children, id);
  }

  public toJSON() {
    return {
      id: this.id,
      cursor: this.cursor.toJSON(),
      children: this.children.map((b) => {
        return b.toJSON();
      }),
    };
  }
}

export class TextBlock {
  public id: BlockId;

  public text: string;

  public children: Block[] = [];

  public doc: DocumentBlock | null = null;

  public parent: DocumentBlock | Block | null = null;

  public prev: Block | null = null;

  public next: Block | null = null;

  constructor(block: {
    id?: BlockId;
    text: string;
    children?: Block[];
  }) {
    this.id = block.id || uuid();
    this.text = block.text || '';
    if (block.children) {
      for (let i = 0; i < block.children.length; i += 1) {
        const b = new TextBlock(block.children[i]);
        this.append(b);
      }
    }
  }

  public append(block: Block) {
    block.doc = this.doc;
    block.parent = this;
    block.prev = this.children[this.children.length - 1] || null;
    if (block.prev) {
      block.prev.next = block;
    }
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
