import classNames from 'classnames';

import styles from './Block.module.scss';

export function Block(props) {
  const block = props.block;
  const cursor = props.cursor;
  const isSelected = (cursor.anchorId === block.id || cursor.focusId === block.id) && (cursor.anchorOffset === null || cursor.focusOffset === null);
  const isFocused = (cursor.anchorId === block.id || cursor.focusId === block.id) && (cursor.anchorOffset !== null || cursor.focusOffset !== null);

  const textArr = Array.from(block.text);
  const p1 = Math.min(cursor.anchorOffset, cursor.focusOffset);
  const p2 = Math.max(cursor.anchorOffset, cursor.focusOffset);
  const t1 = textArr.slice(0, p1);
  const t2 = textArr.slice(p1, p2);
  const t3 = textArr.slice(p2, textArr.length);

  return (
    <>
      <div className={classNames(styles['block'], { [styles['is-selected']]: isSelected })}>
        <div data-id={block.id} className={styles['block-text']}>{block.text}</div>
        {isFocused ? <div className={styles['block-shadow-text']}>
          <span>{t1}</span>
          <span>{t2}</span>
          <span>{t3}</span>
        </div> : null }
      </div>
      <div style={{paddingLeft: '1rem'}}>{block.children.map((b) => <Block key={b.id} block={b} cursor={cursor} />)}</div>
    </>
  );
}
