import styles from './index.module.scss';

export function afterRendering(callback: Function) {
  setTimeout(callback, 0);
}

export function findNextBlock(el) {
  const els = [...document.querySelectorAll('.' + styles['text'])];
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

export function findPrevBlock(el) {
  const els = [...document.querySelectorAll('.' + styles['text'])];
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
