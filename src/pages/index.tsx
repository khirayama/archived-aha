import * as React from 'react';

import { PaperComponent } from '../components';
import { Schema, Block, paragraphSchema, listSchema } from '../schema';
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

class Paper {
  private listeners: Function[] = [];

  private transactions: Function[] = [];

  public blocks: Block[];

  constructor(blocks = []) {
    this.blocks = blocks;
  }

  public onChange(callback: Function) {
    this.listeners.push(callback);
  }

  public offChange(callback: Function) {
    this.listeners = this.listeners.filter((cb) => cb !== callback);
  }

  public tr(tr: Function) {
    this.transactions.push(tr);
  }

  public commit() {
    this.transactions.forEach((tr) => {
      tr(this);
    });
    this.transactions = [];
    this.listeners.forEach((callback) => {
      callback(this);
    });
  }
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
