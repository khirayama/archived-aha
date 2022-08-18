import { findCurrentBlockElementFromSelection } from './utils';

import styles from './index.module.scss';

export function CommandButtonComponent(props) {
  return (
    <button
      className={styles['commandbutton']}
      onMouseDown={(event) => {
        /* FYI If we don't call `preventDefault`, blur from text */
        event.preventDefault();
      }}
      onClick={(event) => {
        const sel = window.getSelection();
        const blockElement = findCurrentBlockElementFromSelection(sel);
        if (blockElement) {
          const blockId = blockElement.dataset.blockid;
          const block = props.state.findBlock(blockId);
          props.onClick(event, block);
        }
      }}
    >
      {props.children}
    </button>
  );
}
