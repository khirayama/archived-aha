import * as React from 'react';

import { BlockComponentProps } from './Block';
import { IconComponent } from './Icon';

import styles from './index.module.scss';

export function HandleComponent(props: BlockComponentProps) {
  return (
    <span className={styles['handle']} onPointerDown={(e) => props.onHandlePointerDown(e, props)}>
      <IconComponent name="drag_indicator" />
    </span>
  );
}
