import { utils } from './utils';
import { keyCodes } from './keyCodes';

/*
 * keyCode: switch
 */

export function keyboardEventHandler(doc, keyCode: number, meta: boolean, shift: boolean, ctrl: boolean) {
  console.log(keyCode, meta, shift, ctrl);
  const cursor = doc.cursor;
  const isSelected = cursor.anchorId && cursor.focusId && cursor.anchorOffset === null && cursor.focusOffset === null;
  const isFocused = cursor.anchorId === cursor.focusId && cursor.anchorOffset !== null && cursor.focusOffset !== null;
  const isCollapsed = isFocused && cursor.anchorOffset === cursor.focusOffset;
  
  if (!(isFocused || isSelected)) {
    throw new Error(`Current cursor condition is something wrong.
${JSON.stringify(cursor)}`);
  }

  switch (keyCode) {
    case keyCodes.LEFT: {
      const block = doc.find(cursor.focusId);

      if (meta && shift) {
        if (isFocused) {
          if (cursor.focusOffset > cursor.anchorOffset) {
            cursor.anchorOffset = 0;
          } else {
            cursor.focusOffset = 0;
          }
        }
      } else if (shift) {
        if (isFocused) {
          const offset = cursor.focusOffset - 1;
          if (offset >= 0) {
            cursor.focusOffset = offset;
          } else {
            const upperBlock = utils.findUpperBlock(block.id, doc);
            if (upperBlock && upperBlock.hasText()) {
              cursor.anchorOffset = null;
              cursor.focusId = upperBlock.id;
              cursor.focusOffset = null;
            }
          }
        } else if (isSelected) {
          const upperBlock = utils.findUpperBlock(block.id, doc);
          if (upperBlock && upperBlock.hasText()) {
            cursor.anchorOffset = null;
            cursor.focusId = upperBlock.id;
            cursor.focusOffset = null;
          }
        }
      } else {
        if (isCollapsed) {
          const offset = cursor.focusOffset - 1;
          if (offset >= 0) {
            cursor.anchorOffset = offset;
            cursor.focusOffset = offset;
          } else {
            const upperBlock = utils.findUpperBlock(block.id, doc);
            if (upperBlock && upperBlock.hasText()) {
              cursor.anchorId = upperBlock.id;
              cursor.anchorOffset = upperBlock.text.length;
              cursor.focusId = upperBlock.id;
              cursor.focusOffset = upperBlock.text.length;
            }
          }
        } else if (isFocused) {
          const offset = cursor.anchorId === cursor.focusId ? Math.min(cursor.anchorOffset, cursor.focusOffset) : upper.id === cursor.anchorId ? cursor.anchorOffset : cursor.focusOffset;
          cursor.anchorOffset = offset;
          cursor.focusOffset = offset;
        } else if (isSelected) {
          const upperBlock = utils.findUpperBlock(block.id, doc);
          if (upperBlock && upperBlock.hasText()) {
            cursor.anchorId = upperBlock.id;
            cursor.anchorOffset = null;
            cursor.focusId = upperBlock.id;
            cursor.focusOffset = null;
          }
        }
      }
      break;
    }
    case keyCodes.UP: {
      break;
    }
    case keyCodes.RIGHT: {
      const block = doc.find(cursor.focusId);
      if (meta && shift) {
        if (isFocused) {
          if (cursor.focusOffset > cursor.anchorOffset) {
            cursor.focusOffset = block.text.length;
          } else {
            cursor.anchorOffset = block.text.length;
          }
        }
      } else if (shift) {
        if (isFocused) {
          const offset = cursor.focusOffset + 1;
          if (cursor.focusOffset !== null && offset <= block.text.length) {
            cursor.focusOffset = offset;
          } else {
            const downerBlock = utils.findDownerBlock(block.id, doc);
            if (downerBlock && downerBlock.hasText()) {
              cursor.anchorOffset = null;
              cursor.focusId = downerBlock.id;
              cursor.focusOffset = null;
            }
          }
        } else if (isSelected) {
          const downerBlock = utils.findDownerBlock(block.id, doc);
          if (downerBlock && downerBlock.hasText()) {
            cursor.anchorOffset = null;
            cursor.focusId = downerBlock.id;
            cursor.focusOffset = null;
          }
        }
      } else {
        if (isCollapsed) {
          const offset = cursor.focusOffset + 1;
          if (offset <= block.text.length) {
            cursor.anchorOffset = offset;
            cursor.focusOffset = offset;
          } else {
            const downerBlock = utils.findDownerBlock(block.id, doc);
            if (downerBlock && downerBlock.hasText()) {
              cursor.anchorId = downerBlock.id;
              cursor.anchorOffset = 0;
              cursor.focusId = downerBlock.id;
              cursor.focusOffset = 0;
            }
          }
        } else if (isFocused) {
          const offset = cursor.anchorId === cursor.focusId ? Math.max(cursor.anchorOffset, cursor.focusOffset) : downer.id === cursor.anchorId ? cursor.anchorOffset : cursor.focusOffset;
          cursor.anchorOffset = offset;
          cursor.focusOffset = offset;
        } else if (isSelected) {
          const downerBlock = utils.findDownerBlock(block.id, doc);
          if (downerBlock && downerBlock.hasText()) {
            cursor.anchorId = downerBlock.id;
            cursor.anchorOffset = null;
            cursor.focusId = downerBlock.id;
            cursor.focusOffset = null;
          }
        }
      }
      break;
    }
    case keyCodes.DOWN: {
      break;
    }
    default: {
      if (meta /* TODO: Support Mac/Win/Linux */) {
      } else {
        event.preventDefault();
      }
    }
  }
}
