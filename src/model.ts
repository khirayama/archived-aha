import { Block } from './schema';

export class Paper {
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
}
