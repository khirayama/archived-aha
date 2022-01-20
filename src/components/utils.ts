export function afterRendering(callback: Function) {
  window.setTimeout(callback, 0);
}

export function keepSelectionPosition(sel: Selection) {
  if (sel.anchorNode === null) {
    return;
  }

  let blockElement = sel.anchorNode.parentElement;
  while (!blockElement.dataset.blockid) {
    blockElement = blockElement.parentElement;
  }
  const isTextBlock = blockElement.querySelector('[contenteditable]')?.childNodes[0] instanceof Text;
  const anchorOffset = sel.anchorOffset;
  const focusOffset = sel.focusOffset;

  afterRendering(() => {
    const range = document.createRange();
    const el = blockElement.querySelector('[contenteditable]') as HTMLDivElement | HTMLSpanElement;
    if (isTextBlock) {
      if (el.childNodes.length === 0) {
        el.appendChild(document.createTextNode(''));
      }
      const node = el.childNodes[0];
      range.setStart(node, anchorOffset);
      range.setEnd(node, focusOffset);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      /* TODO focusable block might not be able to work */
    }
  });
}
