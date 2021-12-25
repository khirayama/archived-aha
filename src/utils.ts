import styles from './pages/index.module.scss';

export function afterRendering(callback: Function) {
  window.setTimeout(callback, 0);
}

export function findNextBlock(el): HTMLElement | null {
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

export function findPrevBlock(el): HTMLElement | null {
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
