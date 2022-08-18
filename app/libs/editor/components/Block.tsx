import * as React from 'react';

import { Schema, Block } from '../schema';
import { EditorState } from '../EditorState';

import styles from './index.module.scss';

export type BlockComponentProps = {
  block: Block;
  state: EditorState;
  schema: Schema;
  onHandlePointerDown: Function;
  onPointerMove: Function;
  onPointerUp: Function;
  onTextKeyDown: Function;
  onTextInput: Function;
  onFocusableKeyDown: Function;
  onFocusableClick: Function;
  onPaste: Function;
  children?: React.ReactElement;
};

export function BlockComponent(props: BlockComponentProps) {
  const block = props.block;
  const schm = props.schema.find(block.type);

  return (
    <div
      className={styles['block']}
      data-blockid={block.id}
      onPaste={(e) => props.onPaste(e, props)}
      onPointerMove={(e) => props.onPointerMove(e, props)}
      onPointerUp={(e) => props.onPointerUp(e, props)}
    >
      {schm.component(props)}
    </div>
  );
}
