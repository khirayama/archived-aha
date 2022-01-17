import styles from './index.module.scss';

export function CommandButtonComponent(props) {
  let blockElement = null;

  return (
    <button
      className={styles['commandbutton']}
      onMouseDown={(event) => {
        event.preventDefault();
        const sel = window.getSelection();
        if (sel.anchorNode === null) {
          return;
        }
        blockElement = sel.anchorNode.parentElement;
        if (blockElement && blockElement !== document.body && blockElement.dataset) {
          while (!blockElement.dataset.blockid) {
            blockElement = blockElement.parentElement;
          }
        }
      }}
      onClick={(event) => {
        if (blockElement && blockElement !== document.body && blockElement.dataset) {
          const blockId = blockElement.dataset.blockid;
          const block = props.paper.findBlock(blockId);
          props.onClick(event, block);
        }
      }}
    >
      {props.children}
    </button>
  );
}
