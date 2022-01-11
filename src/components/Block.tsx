import * as React from 'react';

import { Schema, Block } from '../schema';
import { Paper } from '../model';

import styles from './index.module.scss';

export type BlockComponentProps = {
  block: Block;
  paper: Paper;
  schema: Schema;
  onHandlePointerDown: Function;
  onPointerMove: Function;
  onPointerUp: Function;
  onTextKeyDown: Function;
  onTextInput: Function;
  onFocusableKeyDown: Function;
  children?: React.ReactElement;
};

export function BlockComponent(props: BlockComponentProps) {
  const block = props.block;
  const schm = props.schema.find(block.type);

  return (
    <div
      className={styles['block']}
      data-blockid={block.id}
      onPointerMove={(e) => props.onPointerMove(e, props)}
      onPointerUp={(e) => props.onPointerUp(e, props)}
    >
      {schm.component(props)}
    </div>
  );
}
