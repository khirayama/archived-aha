import * as React from 'react';
import { v4 as uuid } from 'uuid';

import { PaperComponent } from '../components';
import { Schema, paragraphSchema, listSchema } from '../schema';
import { keepSelectionPosition } from '../utils';

const schema = new Schema([paragraphSchema, listSchema]);

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
        console.log(blockElement);
        const blockId = blockElement.dataset.blockid;
        const block = props.blocks.filter((b) => b.id === blockId)[0];
        props.onClick(event, block);
      }}
    >
      {props.children}
    </button>
  );
}

export default function ProtoPage(props) {
  return (
    <div>
      <CommandButton
        schema={schema}
        blocks={props.blocks}
        onClick={(event, block) => {
          console.log('Do something', block);
        }}
      >
        IIIII
      </CommandButton>
      <PaperComponent schema={schema} blocks={props.blocks} />
    </div>
  );
}
