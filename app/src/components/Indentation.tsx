import * as React from 'react';

import { BlockComponentProps } from './Block';

import styles from './index.module.scss';

export function IndentationComponent(props: BlockComponentProps) {
  return (
    <div className={styles['indentation']} data-indent={props.block.indent}>
      {props.children}
    </div>
  );
}
