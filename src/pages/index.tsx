import * as React from 'react';

import { PaperComponent } from '../components';
import { Schema, paragraphSchema, listSchema } from '../schema';
import { Paper } from '../model';
import { keepSelectionPosition } from '../utils';

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
      onMouseDown={() => {
        keepSelectionPosition();
        const sel = window.getSelection();
        blockElement = sel.anchorNode.parentElement;
        if (blockElement !== document.body && blockElement.dataset) {
          while (!blockElement.dataset.blockid) {
            blockElement = blockElement.parentElement;
          }
        }
      }}
      onClick={(event) => {
        const blockId = blockElement.dataset.blockid;
        const block = props.paper.blocks.filter((b) => b.id === blockId)[0];
        props.onClick(event, block);
      }}
    >
      {props.children}
    </button>
  );
}

const schema = new Schema([paragraphSchema, listSchema]);
const paper = new Paper();

export default function ProtoPage(props) {
  paper.setBlocks(props.blocks);

  return (
    <div>
      <CommandButton
        schema={schema}
        paper={paper}
        onClick={(event, block) => {
          console.log('Do something', block);
        }}
      >
        IIIII
      </CommandButton>
      <PaperComponent schema={schema} paper={paper} />
    </div>
  );
}
