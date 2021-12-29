import * as React from 'react';

import { PaperComponent } from '../components';
import { Schema, paragraphSchema, listSchema } from '../schema';
import { Paper } from '../model';
import { keepSelectionPosition } from '../utils';

import styles from './index.module.scss';

export function getServerSideProps() {
  return {
    props: {
      blocks: [schema.createBlock()],
    },
  };
}

export function CommandButton(props) {
  let blockElement = null;

  return (
    <button
      onMouseDown={(event) => {
        event.preventDefault();
        keepSelectionPosition();
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
          const block = props.paper.blocks.filter((b) => b.id === blockId)[0];
          props.onClick(event, block);
        }
      }}
    >
      {props.children}
    </button>
  );
}

function FloatingNav(props: { children: React.Node }) {
  const ref = React.useRef();

  React.useEffect(() => {
    function viewportHandler(event) {
      requestAnimationFrame(() => {
        if (ref.current) {
          const el = ref.current;
          /* TODO Update iOS and iPad condition */
          if (navigator.platform.indexOf('iOS') !== -1 || navigator.platform.indexOf('iPad') !== -1) {
            el.style.bottom = window.innerHeight - window.visualViewport.height + 'px';
          }
        }
      });
    }

    window.visualViewport.addEventListener('scroll', viewportHandler, { passive: true });
    window.visualViewport.addEventListener('resize', viewportHandler, { passive: true });

    return () => {
      window.visualViewport.removeEventListener('scroll', viewportHandler);
      window.visualViewport.removeEventListener('resize', viewportHandler);
    };
  });

  return (
    <div ref={ref} className={styles['floating-nav']}>
      {props.children}
    </div>
  );
}

const schema = new Schema([paragraphSchema, listSchema]);
const paper = new Paper();

export default function ProtoPage(props) {
  paper.setBlocks(props.blocks);

  return (
    <div className={styles['container']}>
      <PaperComponent schema={schema} paper={paper} />
      <FloatingNav>
        <CommandButton
          schema={schema}
          paper={paper}
          onClick={(event, block) => {
            paper
              .tr(() => {
                const newBlocks = paper.blocks.map((b) => {
                  if (b.id === block.id) {
                    b.indent = Math.min(b.indent + 1, 8);
                  }
                  return {
                    ...b,
                  };
                });
                paper.setBlocks(newBlocks);
              })
              .commit();
          }}
        >
          Indent
        </CommandButton>
        <CommandButton
          schema={schema}
          paper={paper}
          onClick={(event, block) => {
            paper
              .tr(() => {
                const newBlocks = paper.blocks.map((b) => {
                  if (b.id === block.id) {
                    b.indent = Math.max(b.indent - 1, 0);
                  }
                  return {
                    ...b,
                  };
                });
                paper.setBlocks(newBlocks);
              })
              .commit();
          }}
        >
          Outdent
        </CommandButton>
      </FloatingNav>
    </div>
  );
}
