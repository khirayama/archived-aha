import { Children } from 'react';
import { Cursor, BlockId, ItemBlockType, DocumentBlockType, ItemBlock } from './doc';

export const utils = {
  // For Block
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
    } else if (currentBlock.parent && currentBlock.parent.isItemBlock()) {
      return currentBlock.parent;
    }
    return null;
  },

  upper: (blockId1: BlockId, blockId2: BlockId, doc): ItemBlockType | null => {
    if (blockId1 === blockId2) {
      return doc.find(blockId1);
    }

    let block = utils.findUpperBlock(blockId1, doc);
    while (block) {
      if (block.id === blockId2) {
        return block;
      }
      block = utils.findUpperBlock(block.id, doc);
    }
    return doc.find(blockId1);
  },

  downer: (blockId1: BlockId, blockId2: BlockId, doc): ItemBlockType | null => {
    if (blockId1 === blockId2) {
      return doc.find(blockId1);
    }

    let block = utils.findDownerBlock(blockId1, doc);
    while (block) {
      if (block.id === blockId2) {
        return block;
      }
      block = utils.findDownerBlock(block.id, doc);
    }
    return doc.find(blockId1);
  },

  // For Cursor
  projectSelectionToCursor: (selection: Selection, cursor: Cursor): void => {
    const anchorId = selection.anchorNode?.parentNode.dataset.id || null;
    const focusId = selection.focusNode?.parentNode.dataset.id || null;
    const anchorOffset = anchorId === focusId ? selection.anchorOffset || 0 : null;
    const focusOffset = anchorId === focusId ? selection.focusOffset || 0 : null;

    cursor.anchorId = anchorId;
    cursor.anchorOffset = anchorOffset;
    cursor.focusId = focusId;
    cursor.focusOffset = focusOffset;
  },
};
