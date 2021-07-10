import { Children } from 'react';
import { BlockId, ItemBlockType, DocumentBlockType, ItemBlock } from './doc';

export const utils = {
  findDownerBlock: (currentBlockId: BlockId, doc: DocumentBlockType): ItemBlockType | null => {
    const currentBlock = doc.find(currentBlockId);
    if (currentBlock.children.length) {
      return currentBlock.children[0];
    } else if (currentBlock.next) {
      return currentBlock.next;
    } else {
      let b = currentBlock;
      while (b.parent !== null && b.parent.isItemBlock() && b.parent.next === null) {
        b = b.parent;
      }
      return b.parent.isItemBlock() ? b.parent.next : null;
    }
  },

  findUpperBlock: (currentBlockId: BlockId, doc: DocumentBlockType): ItemBlockType | null => {
    const currentBlock = doc.find(currentBlockId);
    if (currentBlock.prev && currentBlock.prev.children.length) {
      let children = currentBlock.prev.children;
      while (children[children.length - 1].children.length) {
        children = children[children.length - 1].children;
      }
      return children[children.length - 1];
    } else if (currentBlock.prev) {
      return currentBlock.prev;
    } else if (currentBlock.doc !== currentBlock.parent && currentBlock.parent) {
      return currentBlock.parent;
    }
    return null;
  }
};
