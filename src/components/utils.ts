export function afterRendering(callback: Function) {
  window.setTimeout(callback, 0);
}

export function keepSelectionPosition() {
  const sel = window.getSelection();

  if (sel.anchorNode === null) {
    return;
  }

  let blockElement = sel.anchorNode.parentElement;
  while (!blockElement.dataset.blockid) {
    blockElement = blockElement.parentElement;
  }
  const anchorOffset = sel.anchorOffset;
  const focusOffset = sel.focusOffset;

  afterRendering(() => {
    const range = document.createRange();
    const el = blockElement.querySelector('[contenteditable]') as HTMLDivElement | HTMLSpanElement;
    if (el.childNodes.length === 0) {
      const textNode = document.createTextNode('');
      el.appendChild(textNode);
    }
    const textNode = el.childNodes[0];
    el.focus();
    range.setStart(textNode, anchorOffset);
    range.setEnd(textNode, focusOffset);
    sel.removeAllRanges();
    sel.addRange(range);
  });
}
