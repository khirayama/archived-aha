import { utils } from './utils';
import { keyCodes } from './keyCodes';

export function keyboardEventHandler(doc, keyCode: number, meta: boolean, shift: boolean, ctrl: boolean) {
  console.log(keyCode, meta, shift, ctrl);
  switch (keyCode) {
    case keyCodes.LEFT: {
      const block = doc.find(doc.cursor.focusId);
      if (meta && shift) {
        doc.cursor.focusOffset = 0;
      } else if (shift) {
        const offset = doc.cursor.focusOffset - 1;
        if (offset >= 0) {
          doc.cursor.focusOffset = offset;
        } else {
          const upperBlock = utils.findUpperBlock(block.id, doc);
          if (upperBlock && upperBlock.hasText()) {
            doc.cursor.focusId = upperBlock.id;
            doc.cursor.focusOffset = upperBlock.text.length;
          }
        }
      } else {
        if (doc.cursor.anchorOffset === doc.cursor.focusOffset) {
          const offset = doc.cursor.focusOffset - 1;
          if (offset >= 0) {
            doc.cursor.anchorOffset = offset;
            doc.cursor.focusOffset = offset;
          } else {
            const upperBlock = utils.findUpperBlock(block.id, doc);
            if (upperBlock && upperBlock.hasText()) {
              doc.cursor.anchorId = upperBlock.id;
              doc.cursor.anchorOffset = upperBlock.text.length;
              doc.cursor.focusId = upperBlock.id;
              doc.cursor.focusOffset = upperBlock.text.length;
            }
          }
        } else {
          const upper = utils.upper(doc.cursor.anchorId, doc.cursor.focusId, doc);
          const offset = doc.cursor.anchorId === doc.cursor.focusId ? Math.min(doc.cursor.anchorOffset, doc.cursor.focusOffset) : upper.id === doc.cursor.anchorId ? doc.cursor.anchorOffset : doc.cursor.focusOffset;
          doc.cursor.anchorId = upper.id;
          doc.cursor.anchorOffset = offset;
          doc.cursor.focusId = upper.id;
          doc.cursor.focusOffset = offset;
        }
      }
      doc.dispatch();
      break;
    }
    case keyCodes.UP: {
      break;
    }
    case keyCodes.RIGHT: {
      const block = doc.find(doc.cursor.focusId);
      if (meta && shift) {
        doc.cursor.focusOffset = block.text.length;
      } else if (shift) {
        const offset = doc.cursor.focusOffset + 1;
        if (offset <= block.text.length) {
          doc.cursor.focusOffset = offset;
        } else {
          const downerBlock = utils.findDownerBlock(block.id, doc);
          if (downerBlock && downerBlock.hasText()) {
            doc.cursor.focusId = downerBlock.id;
            doc.cursor.focusOffset = 0;
          }
        }
      } else {
        if (doc.cursor.anchorOffset === doc.cursor.focusOffset) {
          const offset = doc.cursor.focusOffset + 1;
          if (offset <= block.text.length) {
            doc.cursor.anchorOffset = offset;
            doc.cursor.focusOffset = offset;
          } else {
            const downerBlock = utils.findDownerBlock(block.id, doc);
            if (downerBlock && downerBlock.hasText()) {
              doc.cursor.anchorId = downerBlock.id;
              doc.cursor.anchorOffset = 0;
              doc.cursor.focusId = downerBlock.id;
              doc.cursor.focusOffset = 0;
            }
          }
        } else {
          const downer = utils.downer(doc.cursor.anchorId, doc.cursor.focusId, doc);
          const offset = doc.cursor.anchorId === doc.cursor.focusId ? Math.min(doc.cursor.anchorOffset, doc.cursor.focusOffset) : downer.id === doc.cursor.anchorId ? doc.cursor.anchorOffset : doc.cursor.focusOffset;
          doc.cursor.anchorId = downer.id;
          doc.cursor.anchorOffset = offset;
          doc.cursor.focusId = downer.id;
          doc.cursor.focusOffset = offset;
        }
      }
      doc.dispatch();
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
