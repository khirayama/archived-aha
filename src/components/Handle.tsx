import * as React from 'react';

import { BlockComponentProps } from './Block';

import styles from './index.module.scss';

export function HandleComponent(props: BlockComponentProps) {
  return <span className={styles['handle']} onPointerDown={(e) => props.onHandlePointerDown(e, props)} />;
}
