import styles from './pages/index.module.scss';

export function afterRendering(callback: Function) {
  window.setTimeout(callback, 0);
}

export function keepSelectionPosition() {
  const sel = window.getSelection();

  let blockElement = sel.anchorNode.parentElement;
  while (!blockElement.dataset.blockid) {
    blockElement = blockElement.parentElement;
  }
  const anchorOffset = sel.anchorOffset;
  const focusOffset = sel.focusOffset;

  afterRendering(() => {
    const range = document.createRange();
    const el = blockElement.querySelector('[contenteditable]') as any;
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

export function findNextTextElement(el): HTMLElement | null {
  const els = [...Array.from(document.querySelectorAll('.' + styles['text']))] as HTMLElement[];
  return (
    els
      .map((e, i) => {
        if (el == e) {
          return els[i + 1] || null;
        }
        return null;
      })
      .filter((i) => !!i)[0] || null
  );
}

export function findPrevTextElement(el): HTMLElement | null {
  const els = [...Array.from(document.querySelectorAll('.' + styles['text']))] as HTMLElement[];
  return (
    els
      .map((e, i) => {
        if (el == e) {
          return els[i - 1] || null;
        }
        return null;
      })
      .filter((i) => !!i)[0] || null
  );
}
