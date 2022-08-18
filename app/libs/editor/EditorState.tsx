import { Block } from './schema';

export class EditorState {
  private listeners: Function[] = [];

  private transactions: Function[] = [];

  public blocks: Block[];

  constructor(blocks = []) {
    this.blocks = blocks;
  }

  public onChange(callback: Function) {
    this.listeners.push(callback);
  }

  public offChange(callback: Function) {
    this.listeners = this.listeners.filter((cb) => cb !== callback);
  }

  public tr(tr: Function) {
    this.transactions.push(tr);
    return this;
  }

  public setBlocks(blocks: Block[]) {
    this.blocks = blocks;
  }

  public commit() {
    this.transactions.forEach((tr) => {
      tr(this);
    });
    this.transactions = [];
    this.listeners.forEach((callback) => {
      callback(this);
    });
  }

  public findBlock(blockId: string): Block | null {
    return this.blocks.filter((b) => b.id === blockId)[0] || null;
  }

  public findGroupedBlocks(blockId: string): Block[] {
    const block = this.findBlock(blockId);
    const blocks = [];
    let isSameBlock = false;
    for (let i = 0; i < this.blocks.length; i += 1) {
      const b = this.blocks[i];
      if (b.id === block.id || (isSameBlock && block.indent < b.indent)) {
        isSameBlock = true;
        blocks.push(b);
      } else {
        isSameBlock = false;
      }
    }
    return blocks;
  }

  public findNextBlock(blockId: string): Block | null {
    for (let i = 0; i < this.blocks.length; i += 1) {
      if (this.blocks[i].id === blockId) {
        return this.blocks[i + 1] || null;
      }
    }
  }

  public findPrevBlock(blockId: string): Block | null {
    for (let i = 0; i < this.blocks.length; i += 1) {
      if (this.blocks[i].id === blockId) {
        return this.blocks[i - 1] || null;
      }
    }
  }
}
