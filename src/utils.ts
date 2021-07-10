import { Children } from 'react';
import { BlockId, Block, Doc } from './doc';

export const utils = {
  findDownerBlock: (currentBlockId: BlockId, doc: Doc): Block | null => {
    const currentBlock = doc.find(currentBlockId);
    if (currentBlock.children.length) {
      return currentBlock.children[0];
    } else if (currentBlock.next) {
      return currentBlock.next;
    } else if (currentBlock.doc !== currentBlock.parent && currentBlock.parent && currentBlock.parent.next) {
      return (currentBlock.parent as Block).next;
    }
    return null;
  },
  findUpperBlock: (currentBlockId: BlockId, doc: Doc): Block | null => {
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
